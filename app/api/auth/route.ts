import {cookies} from 'next/headers';
import {authConfigured,configurationMessage,matchesPassword,matchesUsername,createSession,SESSION_COOKIE,SESSION_SECONDS,rateLimitKey} from '@/lib/auth';
import {databaseConfigured,db} from '@/lib/database';
import {json,sameOrigin} from '@/lib/server';
import {testMode} from '@/lib/mode';
import {createHash,randomBytes} from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
// This temporary limit protects only the empty preview, never database access.
const previewAttempts=new Map<string,{start:number;count:number}>();
const previewSalt=randomBytes(24).toString('hex');
function registerPreviewAttempt(req:Request){
 const now=Date.now();for(const [key,value] of previewAttempts)if(value.start<now-15*60*1000)previewAttempts.delete(key);
 const ip=process.env.VERCEL==='1'?(req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown'):'local';
 const key=createHash('sha256').update(previewSalt+ip).digest('hex');
 if(!previewAttempts.has(key)&&previewAttempts.size>=512)return null;
 const attempt=previewAttempts.get(key)||{start:now,count:0};attempt.count++;previewAttempts.set(key,attempt);return attempt.count<=8?key:null;
}
export async function POST(req:Request){
 try{
  if(!sameOrigin(req))return json({error:'Origem não autorizada.'},403);
  if(!authConfigured()||(!databaseConfigured()&&!testMode()))return json({error:configurationMessage()},503);
  if(Number(req.headers.get('content-length')||0)>4096)return json({error:'Solicitação muito grande.'},413);
  const raw=await req.text();if(raw.length>4096)return json({error:'Solicitação muito grande.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Solicitação inválida.'},400);}
  if(!body||typeof body!=='object'||typeof body.username!=='string'||body.username.length>100||typeof body.password!=='string'||body.password.length>1024)return json({error:'Informe o usuário e a senha do painel.'},400);
  if(!databaseConfigured()){
   const previewKey=registerPreviewAttempt(req);
   if(!previewKey){const response=json({error:'Muitas tentativas. Aguarde 15 minutos.'},429);response.headers.set('Retry-After','900');return response;}
   if(!matchesUsername(body.username)||!matchesPassword(body.password))return json({error:'Usuário ou senha incorretos.'},401);
   previewAttempts.delete(previewKey);
   const jar=await cookies();if(jar.get(SESSION_COOKIE))jar.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});
   // No administrator session is issued. The browser may show an empty, read-only preview.
   return json({ok:true,preview:true});
  }
  const now=Date.now(),cutoff=now-15*60*1000,key=await rateLimitKey(req);
  await db().prepare('DELETE FROM auth_attempts WHERE window_start < ?').bind(now-24*60*60*1000).run();
  const attempt=await db().prepare(`INSERT INTO auth_attempts (id,window_start,attempts) VALUES (?,?,1)
    ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,
    window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END
    RETURNING attempts,window_start`).bind(key,now,cutoff,cutoff).first<{attempts:number;window_start:number}>();
  if(!attempt||attempt.attempts>8){const response=json({error:'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.'},429);response.headers.set('Retry-After','900');return response;}
  if(!matchesUsername(body.username)||!matchesPassword(body.password))return json({error:'Usuário ou senha incorretos.'},401);
  await db().prepare('DELETE FROM auth_attempts WHERE id=?').bind(key).run();
  const jar=await cookies();jar.set(SESSION_COOKIE,await createSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:SESSION_SECONDS});
  return json({ok:true});
 }catch{console.error('Falha no acesso administrativo.');return json({error:'Não foi possível acessar o painel. Verifique a conexão com o banco.'},503);}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return json({error:'Origem não autorizada.'},403);const jar=await cookies();jar.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return json({ok:true});}
