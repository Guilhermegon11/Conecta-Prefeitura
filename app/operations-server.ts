import { sessionForRequest, testCredentials } from './auth-session';
import { createDefaultPermissionSettings, type DepartmentPermissionSettings } from './access-control';
import { DATA_BUCKET, downloadJsonObject, ensureDataBucket, supabaseAdminConfig, supabaseAdminHeaders, uploadPrivateObject } from './supabase-admin';
import { applyOperation, emptyOperations, normalizeOperation, OperationError, sameSector, scopedOperations, visibleRecords, type DirectoryRecord, type OperationCommand, type OperationContext, type OperationsState, type OperationUser } from './operations-model';

const folder='operations/revisions';
const revisionPath=(n:number)=>`${folder}/${String(n).padStart(12,'0')}.json`;
export const legacyStatePath=(key:string)=>`state/${Buffer.from(key,'utf8').toString('base64url')}.json`;
type Snapshot={revision:number;parentRevision:number;operationId:string;state:OperationsState};
async function readSnapshot(revision:number) { const value=await downloadJsonObject<Snapshot>(revisionPath(revision));if(value&&(value.revision!==revision||value.parentRevision!==revision-1||value.state?.revision!==revision))throw new OperationError('A revisão armazenada está inconsistente. Nenhuma alteração foi feita.',503);return value; }
export async function readOperations() {
  await ensureDataBucket();const {url}=supabaseAdminConfig();
  const response=await fetch(`${url}/storage/v1/object/list/${DATA_BUCKET}`,{method:'POST',headers:supabaseAdminHeaders('application/json'),body:JSON.stringify({prefix:folder,limit:1,offset:0,sortBy:{column:'name',order:'desc'}}),cache:'no-store'});
  if(!response.ok)throw new OperationError('Não foi possível carregar as rotinas.',503);
  const rows=await response.json() as {name:string}[];
  if(rows[0]&&!/^\d{12}\.json$/.test(rows[0].name))throw new OperationError('Índice de revisões inválido.',503);
  let current=rows[0]?await readSnapshot(Number(rows[0].name.slice(0,12))):null;
  if(rows[0]&&!current)throw new OperationError('Revisão indisponível. Tente novamente.',503);
  for(let n=0;n<20;n++){const next=await readSnapshot((current?.revision??0)+1);if(!next)return current?.state??emptyOperations();current=next;}
  throw new OperationError('Há atualizações em andamento. Atualize a tela e tente novamente.',409);
}
export async function operationContext(request:Request,profileId:string,department:string):Promise<OperationContext> {
  const session=sessionForRequest(request);if(!session)throw new OperationError('Sessão expirada.',401);
  const app=await downloadJsonObject<{users?:OperationUser[];ticketData?:Array<Record<string,unknown>>;documents?:Array<Record<string,unknown>>;events?:Array<Record<string,unknown>>}>(legacyStatePath('app:global:v1'));
  if(!app?.users?.length)throw new OperationError('Aguarde a sincronização inicial dos perfis para usar estas rotinas.',503);
  const users=app.users, admin=session.user===testCredentials().username||session.user==='development'&&process.env.TEST_AUTH_ENABLED==='false';
  const own=users.find(u=>u.id===session.user||u.email?.toLowerCase()===session.user.toLowerCase());
  const actor=admin?users.find(u=>u.id===profileId):own;
  if(!actor||!admin&&profileId!==actor.id||['inativo','inactive','disabled'].includes(normalizeOperation(actor.status||'')))throw new OperationError('Perfil não autorizado para esta sessão.',403);
  const role=normalizeOperation(actor.role),executive=role==='prefeito'||role==='vice-prefeito';
  const manager=executive||/^(secretari[oa]|subsecretari[oa]|gestor|gestora|administrador|administradora|controlador|controladora|procurador|procuradora|chefe|diretor|diretora|subprefeito|subprefeita|responsavel)(\b|\s)/.test(role);
  if(!sameSector(department,actor.department)&&!executive)throw new OperationError('Setor não autorizado.',403);
  const permissionConfigs=await downloadJsonObject<Record<string,DepartmentPermissionSettings>>(legacyStatePath('settings:permissions:v1'));
  const settings=permissionConfigs?.[actor.department]??createDefaultPermissionSettings();
  if(!permissionConfigs?.[actor.department])settings.assignments[actor.id]=role.includes('campo')?'campo':role.includes('operacional')?'operacional':role.includes('consulta')?'consulta':'atendimento';
  const [tasks,processes]=await Promise.all([downloadJsonObject<Array<Record<string,unknown>>>(legacyStatePath('integrated:tasks:v2')),downloadJsonObject<Array<Record<string,unknown>>>(legacyStatePath('processes:global:v1'))]);
  const str=(v:unknown)=>typeof v==='string'?v:'';
  const records:DirectoryRecord[]=[
    ...(app.ticketData??[]).map(r=>({kind:'ticket' as const,id:str(r.id),title:str(r.title),department:str(r.department),ownerId:str(r.assigneeId),status:str(r.status),dueAt:str(r.dueDate)})),
    ...(tasks??[]).map(r=>({kind:'task' as const,id:str(r.id),title:str(r.title),department:str(r.department),ownerId:str(r.assigneeId)||users.find(u=>sameSector(u.department,str(r.department))&&normalizeOperation(u.fullName)===normalizeOperation(str(r.assignee)))?.id,status:str(r.status),dueAt:str(r.dueAt)})),
    ...(processes??[]).map(r=>({kind:'process' as const,id:str(r.id),title:str(r.subject),department:str(r.currentDepartment),ownerId:users.find(u=>sameSector(u.department,str(r.currentDepartment))&&normalizeOperation(u.fullName)===normalizeOperation(str(r.owner)))?.id,status:str(r.status),dueAt:str(r.dueDate)?`${str(r.dueDate).slice(0,10)}T17:00:00-03:00`:undefined,reviewIds:((r.signatures??[]) as {signer:string;status:string}[]).filter(x=>x.status==='Pendente').flatMap(x=>users.filter(u=>sameSector(u.department,str(r.currentDepartment))&&normalizeOperation(u.fullName)===normalizeOperation(x.signer)).map(u=>u.id))})),
    ...(app.documents??[]).map(r=>({kind:'document' as const,id:str(r.id),title:str(r.name),department:str(r.department),ownerId:str(r.ownerId)})),
    ...(app.events??[]).filter(r=>str(r.department)===department||(Array.isArray(r.targetDepartments)&&r.targetDepartments.some(x=>sameSector(str(x),department)))).map(r=>({kind:'event' as const,id:str(r.id),title:str(r.title),department,ownerId:str(r.createdBy),dueAt:str(r.startsAt)})),
  ];
  return {actor:{...actor,principal:session.user,manager,executive,settings},users,department,departments:[...new Set(users.map(u=>u.department))],records,now:new Date().toISOString()};
}
export function operationResponse(state:OperationsState,context:OperationContext) {
  const tickets=context.records.filter(r=>r.kind==='ticket').map(r=>({...r,department:state.tickets[r.id]?.department??r.department,status:state.tickets[r.id]?.status??r.status,dueAt:state.tickets[r.id]?.dueDate??r.dueAt,paused:Boolean(state.tickets[r.id]?.pause)}));
  const open=tickets.filter(r=>!['Concluído','Cancelado'].includes(r.status||''));const overdue=open.filter(r=>!r.paused&&r.dueAt&&Date.parse(r.dueAt)<Date.parse(context.now));
  return {state:scopedOperations(state,context),records:visibleRecords(state,context),users:context.users.filter(u=>sameSector(u.department,context.department)).map(u=>({id:u.id,fullName:u.fullName,department:u.department,role:u.role})),departments:context.departments,manager:context.actor.manager,readOnly:!sameSector(context.actor.department,context.department),actorId:context.actor.id,scopeDepartment:context.department,
    ...(context.actor.executive?{municipalSummary:{total:tickets.length,open:open.length,overdue:overdue.length,riskSectors:new Set(overdue.map(t=>t.department)).size,awaitingDecision:open.filter(t=>['Aguardando aprovação','Aguardando resposta'].includes(t.status||'')).length,completionRate:tickets.length?Math.round(tickets.filter(t=>t.status==='Concluído').length/tickets.length*100):0}}:{})};
}

export async function commitOperation(command:OperationCommand,context:OperationContext) {
  let state=await readOperations();
  for(let attempt=0;attempt<6;attempt++) {
    const next=applyOperation(state,command,context);if(next===state)return state;
    const snapshot:Snapshot={revision:next.revision,parentRevision:state.revision,operationId:command.id,state:next};
    const serialized=JSON.stringify(snapshot);if(new TextEncoder().encode(serialized).length>13*1024*1024)throw new OperationError('O histórico atingiu o limite de armazenamento. Solicite a manutenção dos dados.',507);
    try {await uploadPrivateObject(revisionPath(next.revision),serialized,'application/json',false);return next;}
    catch(error){
      // Resolve both competing writes and an upload whose response was lost. Never overwrite a revision.
      const winner=await readSnapshot(next.revision).catch(()=>null);
      if(winner){if(winner.state.commands.includes(command.id))return winner.state;state=winner.state;continue;}
      throw new OperationError('A gravação não foi confirmada. Atualize antes de tentar novamente.',503);
    }
  }
  throw new OperationError('Outra pessoa atualizou estes dados. Atualize a tela e repita a ação.',409);
}
