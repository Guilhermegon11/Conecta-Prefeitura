"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CalendarPlus, Check, ClipboardList, Download, Home, Landmark, Menu, MessageSquare, Plus, RefreshCw, Smartphone, Sparkles, Wifi, WifiOff, Workflow, X } from "lucide-react";
import { flushOfflineQueue, getOfflinePendingCount, subscribeOfflineQueue } from "./offline-sync";
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
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let active = true;
    const update = async () => {
      if (!active) return;
      setOnline(navigator.onLine);
      setPending(await getOfflinePendingCount());
    };
    const sync = () => {
      void update();
      if (navigator.onLine) void runSync();
    };
    const runSync = async () => {
      setSyncing(true);
      try {
        const result = await flushOfflineQueue();
        if (active) setPending(result.remaining);
      } catch { /* a fila permanece visível para nova tentativa */ }
      finally { if (active) setSyncing(false); }
    };
    void update();
    window.addEventListener("online", sync);
    window.addEventListener("offline", update);
    const unsubscribe = subscribeOfflineQueue(() => { void update(); });
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online && pending === 0) return null;
  return <aside className={`offline-global-bar ${online ? "online" : "offline"}`} role="status" aria-live="polite">
    <span className="offline-global-main">{online ? <Wifi size={19} /> : <WifiOff size={19} />}<strong>{online ? "Conexão restaurada" : "Você está sem internet"}</strong><small>{pending ? `${pending} ${pending === 1 ? "alteração aguarda" : "alterações aguardam"} sincronização.` : "Você pode continuar consultando as áreas já carregadas."}</small></span>
    <span className="offline-global-actions">{online && pending > 0 && <button type="button" disabled={syncing} onClick={() => { setSyncing(true); void flushOfflineQueue().then((result) => setPending(result.remaining)).finally(() => setSyncing(false)); }}><RefreshCw size={14} className={syncing ? "spinning" : ""} />{syncing ? "Sincronizando" : "Sincronizar agora"}</button>}</span>
  </aside>;
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
    const initialTimer = window.setTimeout(() => { try { if (!localStorage.getItem("prefeitura-onboarding:v2")) setOpen(true); } catch { /* ignore */ } }, 0);
    const restart = () => { setStep(0); setOpen(true); };
    window.addEventListener("prefeitura:restart-onboarding", restart);
    return () => { window.clearTimeout(initialTimer); window.removeEventListener("prefeitura:restart-onboarding", restart); };
  }, []);
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
