import {cookies} from 'next/headers';
import {authConfigured,matchesPassword,createSession,SESSION_COOKIE,SESSION_SECONDS,rateLimitKey} from '@/lib/auth';
import {databaseConfigured,db} from '@/lib/database';
import {json,sameOrigin} from '@/lib/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 try{
  if(!sameOrigin(req))return json({error:'Origem não autorizada.'},403);
  if(!authConfigured()||!databaseConfigured())return json({error:'Configure o banco de dados, ADMIN_PASSWORD e SESSION_SECRET nas variáveis da Vercel. Depois faça um novo deploy.'},503);
  if(Number(req.headers.get('content-length')||0)>4096)return json({error:'Solicitação muito grande.'},413);
  const raw=await req.text();if(raw.length>4096)return json({error:'Solicitação muito grande.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Solicitação inválida.'},400);}
  if(!body||typeof body!=='object'||typeof body.password!=='string'||body.password.length>1024)return json({error:'Informe a senha do painel.'},400);
  const now=Date.now(),cutoff=now-15*60*1000,key=rateLimitKey(req);
  await db().prepare('DELETE FROM auth_attempts WHERE window_start < ?').bind(now-24*60*60*1000).run();
  const attempt=await db().prepare(`INSERT INTO auth_attempts (id,window_start,attempts) VALUES (?,?,1)
    ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,
    window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END
    RETURNING attempts,window_start`).bind(key,now,cutoff,cutoff).first<{attempts:number;window_start:number}>();
  if(!attempt||attempt.attempts>8){const response=json({error:'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.'},429);response.headers.set('Retry-After','900');return response;}
  if(!matchesPassword(body.password))return json({error:'Senha incorreta.'},401);
  await db().prepare('DELETE FROM auth_attempts WHERE id=?').bind(key).run();
  const jar=await cookies();jar.set(SESSION_COOKIE,createSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:SESSION_SECONDS});
  return json({ok:true});
 }catch(error){console.error('Falha no acesso administrativo:',error instanceof Error?error.message:'erro');return json({error:'Não foi possível acessar o painel. Verifique a conexão com o banco.'},503);}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return json({error:'Origem não autorizada.'},403);const jar=await cookies();jar.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return json({ok:true});}
