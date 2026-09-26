import {db,databaseConfigured} from './database';
import {defaults,type SurveySettings} from './survey';
export {db} from './database';
export {isAdmin as admin} from './auth';
export async function settings():Promise<SurveySettings>{
 if(!databaseConfigured())return {...defaults};
 const row=await db().prepare('SELECT data FROM settings WHERE id=1').first<{data:string}>();
 return {...defaults,...(row?JSON.parse(row.data):{}),consentVersion:defaults.consentVersion};
}
export async function hash(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function sameOrigin(req:Request){
 const origin=req.headers.get('origin');if(!origin)return false;
 try{const supplied=new URL(origin),internal=new URL(req.url);
  // Next may normalize the internal URL to localhost. Host retains the requested domain.
  const host=(req.headers.get('host')||internal.host).toLowerCase();
  const protocol=process.env.VERCEL==='1'?'https:':internal.protocol;
  return supplied.origin===origin&&supplied.host.toLowerCase()===host&&supplied.protocol===protocol;
 }catch{return false;}
}
