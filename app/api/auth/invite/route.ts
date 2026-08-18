import { supabaseAdminConfig, supabaseAdminHeaders } from "../../../supabase-admin";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  const body=await request.json() as {email?:unknown;fullName?:unknown;department?:unknown;role?:unknown;redirectTo?:unknown};
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():""; const fullName=typeof body.fullName==="string"?body.fullName.trim():""; const department=typeof body.department==="string"?body.department.trim():""; const role=typeof body.role==="string"?body.role.trim():"Funcionário";
  if(!email||!fullName||!department) return Response.json({error:"Nome, e-mail e setor são obrigatórios."},{status:400});
  const {url}=supabaseAdminConfig(); const redirectTo=typeof body.redirectTo==="string"&&body.redirectTo.startsWith("http")?body.redirectTo:""; const endpoint=`${url}/auth/v1/invite${redirectTo?`?redirect_to=${encodeURIComponent(redirectTo)}`:""}`;
  const response=await fetch(endpoint,{method:"POST",headers:supabaseAdminHeaders("application/json"),body:JSON.stringify({email,data:{full_name:fullName,department,role}})});
  const raw=await response.text(); let parsed:Record<string,unknown>={}; try{parsed=raw?JSON.parse(raw) as Record<string,unknown>:{};}catch{parsed={};}
  if(!response.ok) return Response.json({error:String(parsed.msg??parsed.message??parsed.error_description??parsed.error??"Não foi possível enviar o convite.")},{status:response.status});
  return Response.json({ok:true,user:parsed});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Falha ao enviar convite."},{status:500});}
}
