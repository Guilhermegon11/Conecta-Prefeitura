export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
import {json,settings,db,hash,sameOrigin} from '@/lib/server';
import {steps,specialOptions,type Candidate} from '@/lib/survey';
import candidateData from '@/data/candidates.json';
import {varzeaDaPalmaId} from '@/lib/locality';
import {databaseConfigured} from '@/lib/database';
import {testMode} from '@/lib/mode';
export async function POST(req:Request){try{
 if(!sameOrigin(req))return json({error:'Origem não autorizada.'},403);
 if(Number(req.headers.get('content-length')||0)>12000)return json({error:'Solicitação muito grande.'},413);
 const raw=await req.text();if(raw.length>12000)return json({error:'Solicitação muito grande.'},413);
 let body:any;try{body=JSON.parse(raw);}catch{return json({error:'Solicitação inválida.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'Solicitação inválida.'},400);
 if(!databaseConfigured())return json({error:'O banco de dados ainda não está conectado. Peça ao responsável para configurar o armazenamento antes de enviar.'},503);
 if(typeof body.token!=='string'||body.token.length<30||body.token.length>100)return json({error:'Utilize o link individual do seu convite.'},400);
 const h=await hash(body.token);
 const invite=await db().prepare('SELECT hash,is_test FROM invitations WHERE hash=?').bind(h).first<{hash:string;is_test:number}>();
 if(!invite)return json({error:'Convite não encontrado. Confira o link recebido.'},403);
 const isTest=invite.is_test===1;
 if(isTest&&!testMode())return json({error:'Este convite é de teste e o modo de teste está desativado.'},409);
 if(!isTest&&testMode())return json({error:'Este convite é para a coleta real. Ela fica pausada enquanto o modo de teste está ativo.'},409);
 const s=await settings();
 if(!isTest){
  if(s.status!=='open')return json({error:'A coleta de respostas não está aberta.'},409);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(today<s.fieldStart||today>s.fieldEnd)return json({error:'Estamos fora do período de coleta.'},409);
 }
 if(body.consent!==true||body.consentVersion!==s.consentVersion)return json({error:'Leia e aceite o consentimento atualizado.'},400);
 if(typeof body.votesInVarzeaDaPalma!=='boolean')return json({error:'Responda se você vota em Várzea da Palma.'},400);
 const candidates=candidateData as Candidate[];const choices:Record<string,string>={};
 for(const step of steps){const v=body.choices?.[step.key];if(typeof v!=='string')return json({error:'Responda todos os cargos, ou selecione uma opção alternativa.'},400);
 const candidate=v.startsWith('candidate:')?candidates.find(c=>c.id===v.slice(10)&&c.office===step.office):null;
 const party=v.startsWith('party:')&&['federal','estadual'].includes(step.office)&&candidates.some(c=>c.office===step.office&&c.party===v.slice(6));
 if(!candidate&&!party&&!specialOptions.some(x=>x.value===v))return json({error:'Uma das escolhas não é válida para este cargo.'},400);choices[step.key]=v;
 }
 if(choices.senador1.startsWith('candidate:')&&choices.senador1===choices.senador2)return json({error:'Escolha dois candidatos diferentes para o Senado.'},400);
 const id=crypto.randomUUID();
 const r=await db().prepare('INSERT INTO responses (id,invite_hash,municipality,votes_in_varzea_da_palma,choices,created_at,consent_version,is_test) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(invite_hash) DO NOTHING').bind(id,h,body.votesInVarzeaDaPalma?varzeaDaPalmaId:'',body.votesInVarzeaDaPalma?1:0,JSON.stringify(choices),new Date().toISOString(),s.consentVersion,isTest?1:0).run();
 if(!r.meta.changes)return json({error:'Este convite já recebeu uma resposta.'},409);
 return json({ok:true,mode:isTest?'test':'real'});
 }catch{console.error('Falha ao salvar resposta.');return json({error:'Não foi possível salvar. Suas escolhas continuam na tela; tente novamente.'},503);}}
