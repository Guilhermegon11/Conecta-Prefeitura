import {authConfigured,configurationMessage,rateLimitKey} from '@/lib/auth';
import {databaseConfigured,db} from '@/lib/database';
import {testMode} from '@/lib/mode';
import {hash,json,sameOrigin} from '@/lib/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;

/** Issues a single-use invitation. The response is marked as test data by the server. */
export async function POST(req:Request){try{
 if(!sameOrigin(req))return json({error:'Origem não autorizada.'},403);
 if(!testMode())return json({error:'O modo de teste está desativado.'},409);
 if(!databaseConfigured()||!authConfigured())return json({error:configurationMessage()},503);
 if(Number(req.headers.get('content-length')||0)>1024||(await req.text()).length>1024)return json({error:'Solicitação muito grande.'},413);
 const now=Date.now(),cutoff=now-15*60*1000,key=await rateLimitKey(req,'test-session');
 await db().prepare('DELETE FROM auth_attempts WHERE window_start < ?').bind(now-24*60*60*1000).run();
 const attempt=await db().prepare(`INSERT INTO auth_attempts (id,window_start,attempts) VALUES (?,?,1)
  ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,
  window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END
  RETURNING attempts`).bind(key,now,cutoff,cutoff).first<{attempts:number}>();
 if(!attempt||attempt.attempts>60){const response=json({error:'Limite de testes atingido. Aguarde 15 minutos antes de iniciar outro teste.'},429);response.headers.set('Retry-After','900');return response;}
 const token=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().slice(0,8);
 const inserted=await db().prepare('INSERT INTO invitations (hash,created_at,is_test) SELECT ?,?,1 WHERE (SELECT COUNT(*) FROM invitations)<10000').bind(await hash(token),new Date().toISOString()).run();
 if(!inserted.meta.changes)return json({error:'Limite de 10.000 convites atingido. O responsável precisa revisar a coleta.'},409);
 return json({token,mode:'test'});
 }catch{console.error('Falha ao preparar resposta de teste.');return json({error:'Não foi possível iniciar o teste. Verifique a conexão com o banco de dados.'},503);}}
