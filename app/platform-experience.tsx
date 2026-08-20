"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CalendarPlus, Check, ClipboardList, Download, FileText, Files, Home, Landmark, Menu, MessageSquare, Plus, Smartphone, Sparkles, Workflow, X } from "lucide-react";
import { flushOfflineQueue } from "./offline-sync";
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

export function PwaInstallCard() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const initialTimer = window.setTimeout(() => setInstalled(standalone), 0);
    const capture = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPromptEvent); };
    const complete = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    return () => { window.clearTimeout(initialTimer); window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", complete); };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
  }

  return <article className="panel preference-card pwa-install-card">
    <header><span><Smartphone size={19} /></span><div><h3>Aplicativo no celular</h3><p>Instale o Prefeitura Conecta para abrir em tela cheia e acessar rotas carregadas mesmo sem internet.</p></div></header>
    <div className="pwa-install-state">{installed ? <Check size={17} /> : <Download size={17} />}<span><strong>{installed ? "Aplicativo instalado" : promptEvent ? "Pronto para instalar" : "Instalação disponível pelo navegador"}</strong><small>{installed ? "O sistema já funciona como aplicativo neste dispositivo." : "No iPhone, use Compartilhar › Adicionar à Tela de Início."}</small></span></div>
    {!installed && <button type="button" className="button secondary" disabled={!promptEvent} onClick={() => void install()}><Download size={14} />{promptEvent ? "Instalar aplicativo" : "Use o menu do navegador"}</button>}
  </article>;
}

export function OnboardingTour({ userName, role, department, onNavigate }: { userName: string; role: string; department: string; onNavigate: (nav: string) => void }) {
  const [open, setOpen] = useState(false); const [step, setStep] = useState(0);
  useEffect(() => {
    const initialTimer = window.setTimeout(() => { try { if (!localStorage.getItem("prefeitura-onboarding:v3")) setOpen(true); } catch { /* ignore */ } }, 0);
    const restart = () => { setStep(0); setOpen(true); };
    window.addEventListener("prefeitura:restart-onboarding", restart);
    return () => { window.clearTimeout(initialTimer); window.removeEventListener("prefeitura:restart-onboarding", restart); };
  }, []);
  if (!open) return null;

  const normalizedRole = role.toLocaleLowerCase("pt-BR");
  const isExecutive = normalizedRole.includes("prefeito") || normalizedRole.includes("vice");
  const isManager = normalizedRole.includes("secret") || normalizedRole.includes("admin") || normalizedRole.includes("gestor");
  const steps = isExecutive ? [
    { title: `Bem-vindo, ${userName.split(" ")[0]}`, text: "A tela inicial mostra o que exige atenção primeiro. Use o painel executivo para comparar setores e localizar riscos.", action: "Visão geral" },
    { title: "Pendências gerais", text: "Acompanhe prioridades, chamados e situações críticas de toda a Prefeitura sem precisar abrir cada setor manualmente.", action: "Central Executiva" },
    { title: "Meu trabalho", text: "Tarefas e rotinas operacionais ficam reunidas aqui. O botão + cria ações novas a partir de qualquer tela.", action: "Central Integrada" },
    { title: "Busca e ajuda", text: "Use a busca no topo para localizar chamados, pessoas, documentos, eventos e unidades. Em dúvida, abra Ajuda.", action: "Central de Ajuda" },
  ] : isManager ? [
    { title: `Bem-vindo, ${userName.split(" ")[0]}`, text: `Você está em ${department}. A tela inicial destaca prioridades da equipe e ações que precisam de decisão.`, action: "Visão geral" },
    { title: "Meu trabalho", text: "Centralize tarefas e solicitações da equipe. Chamados ficam para pedidos e demandas; processos ficam para procedimentos formais.", action: "Central Integrada" },
    { title: "Meu setor", text: "Aqui ficam formulários, equipe, indicadores e rotinas específicas da sua secretaria.", action: "Área do Setor" },
    { title: "Ações rápidas", text: "Sempre que quiser criar algo, use o botão +. Para aprender uma função, abra Ajuda a qualquer momento.", action: "Central de Ajuda" },
  ] : [
    { title: `Bem-vindo, ${userName.split(" ")[0]}`, text: `Seu acesso é de ${role} em ${department}. A tela inicial mostra primeiro o que você precisa resolver.`, action: "Visão geral" },
    { title: "Meu trabalho", text: "Use esta área para tarefas internas. Para pedidos entre setores, use Chamados; para procedimento oficial, use Processos.", action: "Central Integrada" },
    { title: "Comunicação e agenda", text: "Conversas ficam em Comunicação e compromissos em Agenda. Assim você não precisa memorizar onde cada informação está.", action: "Comunicação" },
    { title: "Precisa criar algo?", text: "Use o botão + em qualquer tela. Se tiver dúvida, a área Ajuda explica cada caminho com linguagem simples.", action: "Central de Ajuda" },
  ];
  const current=steps[step];
  function finish(){try{localStorage.setItem("prefeitura-onboarding:v3","done")}catch{} setOpen(false);}
  return <div className="onboarding-backdrop"><section className="onboarding-card"><button className="onboarding-close" onClick={finish} aria-label="Fechar"><X size={17}/></button><span className="onboarding-icon">{step===0?<Landmark size={24}/>:step===1?<Workflow size={24}/>:step===2?<ClipboardList size={24}/>:<Check size={24}/>}</span><small>PASSO {step+1} DE {steps.length}</small><h2>{current.title}</h2><p>{current.text}</p><div className="onboarding-progress">{steps.map((_,index)=><i key={index} className={index<=step?"active":""}/>)}</div><footer><button className="button secondary" onClick={()=>{onNavigate(current.action); if(step===steps.length-1)finish();}}>Abrir área</button><button className="button primary" onClick={()=>step===steps.length-1?finish():setStep(step+1)}>{step===steps.length-1?"Concluir":"Próximo"}</button></footer></section></div>;
}

export function QuickActionDock({ onNavigate, onNewTicket, onNewEvent, onUpload }: { onNavigate: (nav: string) => void; onNewTicket: () => void; onNewEvent: () => void; onUpload: () => void }) {
  const [open,setOpen]=useState(false);
  function go(nav:string){onNavigate(nav);setOpen(false)}
  return <div className={`quick-action-dock ${open?"open":""}`}>
    <div id="quick-action-menu" className="quick-action-menu universal-create-menu" aria-hidden={!open}>
      <div className="quick-action-heading"><strong>O que deseja fazer?</strong><small>Escolha a ação pelo objetivo</small></div>
      <button type="button" onClick={()=>{onNewTicket();setOpen(false)}}><ClipboardList size={15}/><span><strong>Abrir chamado</strong><small>Solicitar algo a outro setor</small></span></button>
      <button type="button" onClick={()=>go("Central Integrada")}><Workflow size={15}/><span><strong>Criar tarefa</strong><small>Registrar trabalho interno</small></span></button>
      <button type="button" onClick={()=>go("Processos Digitais")}><FileText size={15}/><span><strong>Novo processo</strong><small>Procedimento formal e documental</small></span></button>
      <button type="button" onClick={()=>go("Comunicação")}><MessageSquare size={15}/><span><strong>Enviar mensagem</strong><small>Conversar com pessoas e grupos</small></span></button>
      <button type="button" onClick={()=>{onUpload();setOpen(false)}}><Files size={15}/><span><strong>Adicionar arquivo</strong><small>Guardar documento no setor</small></span></button>
      <button type="button" onClick={()=>{onNewEvent();setOpen(false)}}><CalendarPlus size={15}/><span><strong>Novo evento</strong><small>Adicionar compromisso à agenda</small></span></button>
    </div>
    <button type="button" className="quick-action-trigger" aria-label={open?"Fechar menu Criar":"Abrir menu Criar"} aria-expanded={open} aria-controls="quick-action-menu" onClick={()=>setOpen(!open)}><Plus size={22}/><span className="quick-action-trigger-label">Criar</span></button>
  </div>;
}

export function MobileBottomNavigation({ active, onNavigate, onMenu }: { active: string; onNavigate: (nav: string) => void; onMenu: () => void }) {
  const items = [
    { label: "Início", nav: "Visão geral", icon: Home },
    { label: "Chamados", nav: "Chamados", icon: ClipboardList },
    { label: "Conversas", nav: "Comunicação", icon: MessageSquare },
    { label: "Agenda", nav: "Próximos Eventos", icon: CalendarDays },
  ];
  return <nav className="mobile-bottom-navigation" aria-label="Navegação rápida no celular">
    {items.map(({ label, nav, icon: Icon }) => <button type="button" key={nav} className={active === nav ? "active" : ""} aria-current={active === nav ? "page" : undefined} onClick={() => onNavigate(nav)}><Icon size={19} /><span>{label}</span></button>)}
    <button type="button" onClick={onMenu}><Menu size={19} /><span>Menu</span></button>
  </nav>;
}
