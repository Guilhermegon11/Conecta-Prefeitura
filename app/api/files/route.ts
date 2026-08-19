import { hasValidSession } from "../../auth-session";
import { downloadJsonObject, downloadPrivateObject, uploadJsonObject, uploadPrivateObject } from "../../supabase-admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredFileMetadata = { id:string; name:string; storagePath:string; contentType:string; size:number; ownerId:string; ownerName:string; department:string; category:string; ticketId:string|null; conversationType:string|null; conversationId:string|null; recipientId:string|null; createdAt:string };
const metadataPath=(id:string)=>`file-meta/${id}.json`;
const safeFilename=(name:string)=>name.replace(/[^a-zA-Z0-9._-]/g,"-").replace(/-+/g,"-")||"arquivo";

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({error:"Sessão expirada."},{status:401});
  try {
    const id=new URL(request.url).searchParams.get("id")?.trim();
    if(!id) return Response.json({error:"Documento obrigatório"},{status:400});
    const metadata=await downloadJsonObject<StoredFileMetadata>(metadataPath(id));
    if(!metadata) return Response.json({error:"Documento não encontrado"},{status:404});
    const object=await downloadPrivateObject(metadata.storagePath);
    if(object.status===404) return Response.json({error:"Arquivo não encontrado"},{status:404});
    if(!object.ok) throw new Error(await object.text());
    const fallbackName=metadata.name.replace(/[^\x20-\x7E]/g,"_").replace(/["\\]/g,"_");
    return new Response(object.body,{headers:{"content-type":metadata.contentType||object.headers.get("content-type")||"application/octet-stream","content-disposition":`attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(metadata.name)}`,"cache-control":"private, no-store"}});
  } catch(error){return Response.json({error:error instanceof Error?error.message:"Falha ao baixar arquivo"},{status:500});}
}

export async function POST(request: Request) {
  if (!hasValidSession(request)) return Response.json({error:"Sessão expirada."},{status:401});
  try {
    const form=await request.formData(); const file=form.get("file");
    if(!(file instanceof File)) return Response.json({error:"Arquivo obrigatório"},{status:400});
    if(file.size>MAX_FILE_SIZE) return Response.json({error:"O arquivo deve ter no máximo 10 MB"},{status:413});
    const ownerId=String(form.get("userId")??"").trim(); const ownerName=String(form.get("ownerName")??"Usuário municipal").trim()||"Usuário municipal"; const department=String(form.get("department")??"").trim();
    if(!ownerId||!department) return Response.json({error:"Usuário e setor são obrigatórios para o arquivo."},{status:400});
    const conversationType=String(form.get("conversationType")??"").trim(); const conversationId=String(form.get("conversationId")??"").trim(); const recipientId=String(form.get("recipientId")??"").trim(); const isChatUpload=Boolean(conversationType&&conversationId);
    if(isChatUpload&&!["direct","group"].includes(conversationType)) return Response.json({error:"Tipo de conversa inválido"},{status:400});
    const requestedId=String(form.get("clientId")??"").trim(); const requestedMessageId=String(form.get("clientMessageId")??"").trim(); const safeClientId=/^[a-zA-Z0-9_-]{6,120}$/.test(requestedId)?requestedId:""; const safeMessageId=/^[a-zA-Z0-9_-]{6,120}$/.test(requestedMessageId)?requestedMessageId:"";
    const id=safeClientId||crypto.randomUUID(); const messageId=isChatUpload?(safeMessageId||crypto.randomUUID()):null; const now=new Date().toISOString(); const contentType=file.type||"application/octet-stream"; const storagePath=`uploads/${id}/${safeFilename(file.name)}`; const ticketId=form.get("ticketId")?String(form.get("ticketId")):null; const category=String(form.get("category")??"Documento");
    await uploadPrivateObject(storagePath,file,contentType,false);
    await uploadJsonObject(metadataPath(id),{id,name:file.name,storagePath,contentType,size:file.size,ownerId,ownerName,department,category,ticketId,conversationType:isChatUpload?conversationType:null,conversationId:isChatUpload?conversationId:null,recipientId:recipientId||null,createdAt:now} satisfies StoredFileMetadata);
    return Response.json({id,name:file.name,size:file.size,contentType,department,createdAt:now,message:messageId?{id:messageId,conversationType,conversationId,senderId:ownerId,senderName:ownerName,senderInitials:ownerName.split(/\s+/).slice(0,2).map(part=>part[0]??"").join("").toUpperCase(),body:String(form.get("messageBody")??"").trim(),attachmentId:id,attachmentName:file.name,attachmentSize:file.size,attachmentContentType:contentType,ticketId,createdAt:now}:null},{status:201});
  } catch(error){return Response.json({error:error instanceof Error?error.message:"Falha ao enviar arquivo"},{status:500});}
}
