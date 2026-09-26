import {createHmac,createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
import {db,databaseConfigured} from './database';
import {testMode} from './mode';
export const SESSION_COOKIE='minas_admin_session';
export const SESSION_SECONDS=8*60*60;
function adminPassword(){return process.env.ADMIN_PASSWORD||(testMode()?'1234':'');}
function adminUsername(){return process.env.ADMIN_USERNAME||'admin';}
function safeEqual(value:string,expected:string){return timingSafeEqual(createHash('sha256').update(value).digest(),createHash('sha256').update(expected).digest());}
export function authConfigured(){const secret=process.env.SESSION_SECRET||'';return adminPassword().length>=(testMode()?1:16)&&adminUsername().length<=100&&(testMode()?(!secret||secret.length>=32):secret.length>=32);}
export function configurationMessage(){
 if(!databaseConfigured())return 'Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN na Vercel e faça um novo deploy para salvar as respostas e acessar o painel.';
 return testMode()?'Se você definiu SESSION_SECRET, use pelo menos 32 caracteres. O modo de teste pode gerar esse segredo automaticamente.':'Configure ADMIN_PASSWORD com pelo menos 16 caracteres e SESSION_SECRET com pelo menos 32 caracteres na Vercel e faça um novo deploy.';
}
let storedSecret:Promise<string>|undefined;
async function sessionSecret(){
 if(process.env.SESSION_SECRET)return process.env.SESSION_SECRET;
 if(!testMode())throw new Error('Segredo de sessão não configurado.');
 storedSecret??=(async()=>{
  await db().prepare('INSERT INTO app_secrets (name,value) VALUES (?,?) ON CONFLICT(name) DO NOTHING').bind('test_session_secret',randomBytes(48).toString('base64url')).run();
  const row=await db().prepare('SELECT value FROM app_secrets WHERE name=?').bind('test_session_secret').first<{value:string}>();
  if(!row||row.value.length<32)throw new Error('Não foi possível preparar a sessão de teste.');
  return row.value;
 })().catch(error=>{storedSecret=undefined;throw error;});
 return storedSecret;
}
async function signingKey(){if(!authConfigured())throw new Error('Acesso administrativo não configurado.');return createHmac('sha256',await sessionSecret()).update(JSON.stringify([adminUsername(),adminPassword(),testMode()])).digest();}
export function matchesPassword(value:string){return authConfigured()&&value.length<=1024&&safeEqual(value,adminPassword());}
export function matchesUsername(value:string){return value.length<=100&&safeEqual(value,adminUsername());}
export async function createSession(){const payload=Buffer.from(JSON.stringify({v:1,exp:Date.now()+SESSION_SECONDS*1000,nonce:randomBytes(16).toString('hex')})).toString('base64url');return payload+'.'+createHmac('sha256',await signingKey()).update(payload).digest('base64url');}
export async function validSession(token:string){
 try{if(!authConfigured()||token.length>1024)return false;const parts=token.split('.');if(parts.length!==2)return false;const expected=createHmac('sha256',await signingKey()).update(parts[0]).digest(),actual=Buffer.from(parts[1],'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;const payload=JSON.parse(Buffer.from(parts[0],'base64url').toString());return payload.v===1&&Number.isFinite(payload.exp)&&payload.exp>Date.now()&&payload.exp<=Date.now()+SESSION_SECONDS*1000; }catch{return false;}
}
export async function isAdmin(){const jar=await cookies();return validSession(jar.get(SESSION_COOKIE)?.value||'');}
export async function rateLimitKey(req:Request,scope='login'){
 const ip=process.env.VERCEL==='1'?(req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown'):'local';
 return createHmac('sha256',await signingKey()).update(scope+':'+ip).digest('hex');
}
