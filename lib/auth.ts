import {createHmac,createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
export const SESSION_COOKIE='minas_admin_session';
export const SESSION_SECONDS=8*60*60;
export function authConfigured(){return (process.env.ADMIN_PASSWORD?.length||0)>=16&&(process.env.SESSION_SECRET?.length||0)>=32;}
function signingKey(){if(!authConfigured())throw new Error('Configure ADMIN_PASSWORD (16+ caracteres) e SESSION_SECRET (32+ caracteres).');return createHmac('sha256',process.env.SESSION_SECRET!).update(process.env.ADMIN_PASSWORD!).digest();}
export function matchesPassword(value:string){if(!authConfigured()||value.length>1024)return false;return timingSafeEqual(createHash('sha256').update(value).digest(),createHash('sha256').update(process.env.ADMIN_PASSWORD!).digest());}
export function createSession(){const payload=Buffer.from(JSON.stringify({v:1,exp:Date.now()+SESSION_SECONDS*1000,nonce:randomBytes(16).toString('hex')})).toString('base64url');return payload+'.'+createHmac('sha256',signingKey()).update(payload).digest('base64url');}
export function validSession(token:string){
 try{if(!authConfigured()||token.length>1024)return false;const parts=token.split('.');if(parts.length!==2)return false;const expected=createHmac('sha256',signingKey()).update(parts[0]).digest(),actual=Buffer.from(parts[1],'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;const payload=JSON.parse(Buffer.from(parts[0],'base64url').toString());return payload.v===1&&Number.isFinite(payload.exp)&&payload.exp>Date.now()&&payload.exp<=Date.now()+SESSION_SECONDS*1000; }catch{return false;}
}
export async function isAdmin(){const jar=await cookies();return validSession(jar.get(SESSION_COOKIE)?.value||'');}
export function rateLimitKey(req:Request){
 const ip=process.env.VERCEL==='1'?(req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown'):'local';
 return createHmac('sha256',signingKey()).update('login:'+ip).digest('hex');
}
