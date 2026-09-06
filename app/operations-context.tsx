"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { emptyOperations, type DirectoryRecord, type OperationsState, type OperationUser, type RecordRef, type OperationCommand } from './operations-model';
export type OperationsPayload={state:OperationsState;records:DirectoryRecord[];users:OperationUser[];departments:string[];manager:boolean;readOnly:boolean;actorId:string;scopeDepartment:string;municipalSummary?:{total:number;open:number;overdue:number;riskSectors:number;awaitingDecision:number;completionRate:number}};
export type OperationsClient=OperationsPayload & {department:string;busy:boolean;ready:boolean;error:string;refresh:()=>Promise<void>;act:(type:string,data:Record<string,unknown>)=>Promise<boolean>;openRecord:(record:RecordRef)=>void};
export const OperationsContext=createContext<OperationsClient|null>(null);
export const useOperations=()=>useContext(OperationsContext)!;
export function useOperationsClient(profileId:string,department:string,enabled:boolean,notify:(message:string)=>void,openRecord:(record:RecordRef)=>void):OperationsClient {
  const [payload,setPayload]=useState<OperationsPayload>({state:emptyOperations(),records:[],users:[],departments:[],manager:false,readOnly:true,actorId:profileId,scopeDepartment:department});
  const [busy,setBusy]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState('');
  const unresolved=useRef(new Map<string,OperationCommand>());
  const generation=useRef(0),pending=useRef(false),notice=useRef(notify);notice.current=notify;
  const refresh=useCallback(async()=>{if(!enabled)return;const current=generation.current;try{const r=await fetch(`/api/operations?profileId=${encodeURIComponent(profileId)}&department=${encodeURIComponent(department)}`,{cache:'no-store',credentials:'same-origin'});const p=await r.json() as OperationsPayload & {error?:string};if(!r.ok)throw new Error(p.error||'Não foi possível carregar as rotinas.');if(generation.current===current){setPayload(previous=>p.state.revision>=previous.state.revision?p:previous);setReady(true);setError('');}}catch(e){if(generation.current===current){setReady(false);setError(e instanceof Error?e.message:'Conexão indisponível.');}}},[profileId,department,enabled]);
  useEffect(()=>{generation.current++;setReady(false);setError('');setPayload({state:emptyOperations(),records:[],users:[],departments:[],manager:false,readOnly:true,actorId:profileId,scopeDepartment:department});void refresh();const tick=window.setInterval(()=>void refresh(),30000);const reload=()=>void refresh();window.addEventListener('focus',reload);window.addEventListener('prefeitura:records-saved',reload);window.addEventListener('municipal-agent-data-changed',reload);return()=>{generation.current++;clearInterval(tick);window.removeEventListener('focus',reload);window.removeEventListener('prefeitura:records-saved',reload);window.removeEventListener('municipal-agent-data-changed',reload);};},[refresh,profileId]);
  async function act(type:string,data:Record<string,unknown>) {
    if(pending.current||!ready||payload.readOnly||payload.actorId!==profileId||payload.scopeDepartment!==department)return false;
    pending.current=true;setBusy(true);const current=generation.current;
    const fingerprint=JSON.stringify([profileId,department,type,data]);
    const pendingKey=`prefeitura:pending-operation:${profileId}:${department}`;
    let previous=unresolved.current.get(fingerprint);
    try { const stored=JSON.parse(sessionStorage.getItem(pendingKey)||'null') as {fingerprint:string;command:OperationCommand}|null;if(stored?.fingerprint===fingerprint)previous=stored.command; } catch { /* Optional retry continuity. */ }
    const command:OperationCommand=previous??{id:crypto.randomUUID(),type,data:{...data,
      ...(type==='ticket.checklist'?{expectedHistoryLength:payload.state.tickets[String(data.ticketId)]?.history.length??0}:{}),
      ...(type==='request.decide'?{expectedStageId:payload.state.requests.find(r=>r.id===data.id)?.stages[payload.state.requests.find(r=>r.id===data.id)?.stage??0]?.id}:{})}};
    unresolved.current.set(fingerprint,command);
    try {sessionStorage.setItem(pendingKey,JSON.stringify({fingerprint,command}));}catch { /* In-memory retry remains available. */ }
    const clear=()=>{unresolved.current.delete(fingerprint);try{sessionStorage.removeItem(pendingKey);}catch{}};
    try {
      const r=await fetch('/api/operations',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({profileId,department,command})});
      const p=await r.json() as OperationsPayload & {error?:string};
      if(!r.ok){if(r.status<500)clear();throw new Error(p.error||'A ação não foi confirmada.');}
      clear();if(current===generation.current){setPayload(previous=>p.state.revision>=previous.state.revision?p:previous);setError('');notice.current('Alteração registrada.');}return true;
    }catch(e){if(current===generation.current){const message=e instanceof Error?e.message:'Não foi possível confirmar a gravação.';setError(message);notice.current(message);}return false;}
    finally{pending.current=false;setBusy(false);}
  }
  const scoped = payload.actorId===profileId && payload.scopeDepartment===department;

  return {...(scoped?payload:{state:emptyOperations(),records:[],users:[],departments:[],manager:false,readOnly:true,actorId:profileId,scopeDepartment:department}),department,busy,ready:ready&&scoped,error,refresh,act,openRecord};
}
export function recordHref(record:RecordRef,department?:string){const url=new URL(window.location.href);url.search='';url.searchParams.set('record',record.kind);url.searchParams.set('id',record.id);if(department)url.searchParams.set('sector',department);url.hash='';return url.toString();}
