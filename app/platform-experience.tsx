"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check, ClipboardList, Landmark, Plus, Sparkles, Workflow, X } from "lucide-react";
import { flushOfflineQueue, subscribeOfflineQueue } from "./offline-sync";
import { flushPendingOfflineLogout } from "./offline-auth";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker.register("/sw.js").then(() => {
        // Aquece as rotas públicas e os assets enquanto há internet.
        void fetch("/avaliar", { cache: "reload" }).catch(() => undefined);
        void fetch("/acompanhar", { cache: "reload" }).catch(() => undefined);
      }).catch(() => undefined);
    };
    const sync = () => { void flushPendingOfflineLogout().finally(() => flushOfflineQueue()).catch(() => undefined); };
    window.addEventListener("online", sync);
    if (document.readyState === "complete") register(); else window.addEventListener("load", register, { once: true });
    if (navigator.onLine) sync();
    return () => { window.removeEventListener("load", register); window.removeEventListener("online", sync); };
  }, []);
  return null;
}

export function OfflineStatusBar() {
  useEffect(() => {
    const sync = () => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        void flushOfflineQueue().catch(() => undefined);
      }
    };
    sync();
    window.addEventListener("online", sync);
    const unsubscribe = subscribeOfflineQueue(sync);
    return () => {
      unsubscribe();
      window.removeEventListener("online", sync);
    };
  }, []);

  return null;
}

export function OnboardingTour({ userName, role, department, onNavigate }: { userName: string; role: string; department: string; onNavigate: (nav: string) => void }) {
  const [open, setOpen] = useState(false); const [step, setStep] = useState(0);
  useEffect(() => { try { if (!localStorage.getItem("prefeitura-onboarding:v2")) setOpen(true); } catch { /* ignore */ } }, []);
  if (!open) return null;
  const steps = [
    { title: `Bem-vindo, ${userName.split(" ")[0]}`, text: `Seu acesso está identificado como ${role} em ${department}. O menu respeita as permissões do seu perfil.`, action: "Visão geral" },
    { title: "Central Integrada", text: "Tarefas, solicitações internas, projetos, metas, mapa, IA e saúde do sistema ficam reunidos em uma visão operacional.", action: "Central Integrada" },
    { title: "Trabalho rastreável", text: "Use chamados, processos, tarefas e anotações em vez de perder decisões em mensagens externas. Prazos e movimentações permanecem registrados.", action: "Chamados" },
    { title: "Pronto para operar", text: "A Central de Ajuda mantém tutoriais e as Configurações controlam permissões, privacidade e preferências.", action: "Central de Ajuda" },
  ];
  const current=steps[step];
  function finish(){try{localStorage.setItem("prefeitura-onboarding:v2","done")}catch{} setOpen(false);}
  return <div className="onboarding-backdrop"><section className="onboarding-card"><button className="onboarding-close" onClick={finish} aria-label="Fechar"><X size={17}/></button><span className="onboarding-icon">{step===0?<Landmark size={24}/>:step===1?<Workflow size={24}/>:step===2?<ClipboardList size={24}/>:<Check size={24}/>}</span><small>PASSO {step+1} DE {steps.length}</small><h2>{current.title}</h2><p>{current.text}</p><div className="onboarding-progress">{steps.map((_,index)=><i key={index} className={index<=step?"active":""}/>)}</div><footer><button className="button secondary" onClick={()=>{onNavigate(current.action); if(step===steps.length-1)finish();}}>Abrir área</button><button className="button primary" onClick={()=>step===steps.length-1?finish():setStep(step+1)}>{step===steps.length-1?"Concluir":"Próximo"}</button></footer></section></div>;
}

export function QuickActionDock({ onNavigate, onNewTicket, onNewEvent }: { onNavigate: (nav: string) => void; onNewTicket: () => void; onNewEvent: () => void }) {
  const [open,setOpen]=useState(false);
  function openAi(){window.dispatchEvent(new CustomEvent("prefeitura:open-ai",{detail:{prompt:"Analise o contexto atual e me ajude a decidir o próximo passo."}}));setOpen(false)}
  return <div className={`quick-action-dock ${open?"open":""}`}><div className="quick-action-menu"><button onClick={()=>{onNewTicket();setOpen(false)}}><ClipboardList size={15}/><span>Novo chamado</span></button><button onClick={()=>{onNewEvent();setOpen(false)}}><CalendarPlus size={15}/><span>Novo evento</span></button><button onClick={()=>{onNavigate("Central Integrada");setOpen(false)}}><Workflow size={15}/><span>Nova tarefa</span></button><button className="quick-action-ai" onClick={openAi}><Sparkles size={15}/><span>Perguntar à IA</span></button></div><button className="quick-action-trigger" aria-label="Ações rápidas" onClick={()=>setOpen(!open)}><Plus size={22}/></button></div>;
}
