export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
import {json,settings,db,hash,admin,sameOrigin} from '@/lib/server';
import {authConfigured,configurationMessage} from '@/lib/auth';
import {databaseConfigured} from '@/lib/database';
import {defaults} from '@/lib/survey';
import {testMode} from '@/lib/mode';
export async function GET(){try{
 const testing=testMode();
 if(!authConfigured()||!databaseConfigured())return json({error:configurationMessage(),needsConfiguration:true,testMode:testing},503);
 if(!await admin())return json({error:'Entre no painel com seu usuário e sua senha.',needsLogin:true,testMode:testing},401);
 const [s,responses,invitations]=await Promise.all([
  settings(),
  db().prepare('SELECT id,municipality,votes_in_varzea_da_palma,choices,created_at,is_test FROM responses ORDER BY created_at DESC').all(),
  db().prepare('SELECT COUNT(*) AS total, COALESCE(SUM(is_test),0) AS test FROM invitations').first<{total:number;test:number}>()
 ]);
 return json({settings:s,testMode:testing,responses:responses.results.map((r:any)=>({...r,isTest:r.is_test===1,votesInVarzeaDaPalma:r.votes_in_varzea_da_palma==null?null:r.votes_in_varzea_da_palma===1,choices:JSON.parse(r.choices)})),invitations:invitations?.total||0,invitationCounts:{test:invitations?.test||0,real:(invitations?.total||0)-(invitations?.test||0)}});
 }catch{console.error('Falha ao carregar o painel.');return json({error:'O painel está temporariamente indisponível.'},503);}}
export async function POST(req:Request){try{
 if(!sameOrigin(req))return json({error:'Origem não autorizada.'},403);
 if(!await admin())return json({error:'Entre no painel com seu usuário e sua senha.'},401);
 if(Number(req.headers.get('content-length')||0)>16000)return json({error:'Solicitação muito grande.'},413);
 const raw=await req.text();if(raw.length>16000)return json({error:'Solicitação muito grande.'},413);
 let b:any;try{b=JSON.parse(raw);}catch{return json({error:'Solicitação inválida.'},400);}
 if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Solicitação inválida.'},400);
 if(b.action==='settings'){
  const prev=await settings();const v=b.settings||{}; const s={...defaults,...prev};
  for(const k of ['title','controller','contact','registration','methodology','fieldStart','fieldEnd','publishAfter'] as const)s[k]=String(v[k]??s[k]).trim().slice(0,k==='methodology'?5000:250);
  s.retentionDays=Math.min(365,Math.max(1,Number(v.retentionDays)||90));s.status=['draft','open','closed'].includes(v.status)?v.status:prev.status;s.published=Boolean(v.published);
  if(prev.status!=='draft'&&s.status==='draft')return json({error:'Uma coleta iniciada não pode voltar à preparação.'},400);
  for(const key of ['fieldStart','fieldEnd','publishAfter'] as const){if(s[key]&&(!/^\d{4}-\d{2}-\d{2}$/.test(s[key])||!Number.isFinite(Date.parse(s[key]+'T00:00:00-03:00'))))return json({error:'Informe datas válidas.'},400);}
  if(s.status==='open'&&(!s.controller||!s.contact||!s.registration||s.methodology.length<30||!s.fieldStart||!s.fieldEnd||s.fieldEnd<s.fieldStart||!s.publishAfter))return json({error:'Preencha responsável, contato, registro, metodologia, período de coleta e data de divulgação antes de abrir a pesquisa.'},400);
  if(prev.status!=='draft'&&['controller','contact','methodology','registration'].some(k=>s[k as keyof typeof s]!==prev[k as keyof typeof prev]))return json({error:'Os dados da pesquisa ficam preservados após abrir a coleta. Alterações metodológicas precisam de uma nova rodada.'},400);
  if(s.published&&(s.status!=='closed'||!s.publishAfter||Date.parse(s.publishAfter+'T00:00:00-03:00')>Date.now()||!s.registration||!s.methodology))return json({error:'Encerre a coleta e aguarde a data de divulgação cadastrada para publicar os resultados.'},400);
  await db().prepare('INSERT INTO settings (id,data) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(JSON.stringify(s)).run();return json({ok:true,settings:s});
 }
 if(b.action==='invitations'){
  const count=Number(b.count);if(!Number.isInteger(count)||count<1||count>1500)return json({error:'Gere entre 1 e 1.500 convites por vez.'},400);
  if(b.isTest!==undefined&&typeof b.isTest!=='boolean')return json({error:'Informe um modo de convite válido.'},400);
  const isTest=b.isTest??testMode();
  if(isTest&&!testMode())return json({error:'Ative o modo de teste para criar convites de teste.'},409);
  const tokens=Array.from({length:count},()=>crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().slice(0,8));
  const hashes=await Promise.all(tokens.map(hash));
  // One atomic statement keeps the invitation cap valid under concurrent requests.
  const result=await db().prepare('INSERT INTO invitations (hash,created_at,is_test) SELECT value, ?, ? FROM json_each(?) WHERE (SELECT COUNT(*) FROM invitations)<=?').bind(new Date().toISOString(),isTest?1:0,JSON.stringify(hashes),10000-count).run();
  if(result.meta.changes!==count)return json({error:'Limite de 10.000 convites atingido.'},409);
  return json({tokens,isTest});
 }
 return json({error:'Ação desconhecida.'},400);
 }catch{console.error('Falha ao atualizar o painel.');return json({error:'Não foi possível concluir. Tente novamente.'},503);}}
