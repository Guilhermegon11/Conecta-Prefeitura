"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, History, LoaderCircle, MessageSquarePlus, MessageSquareText, Send, ShieldCheck, Sparkles, Target, Trash2, X, Zap } from "lucide-react";
import { persistenceKey, usePersistentState } from "./persistence";
import type { MunicipalAgentAction, MunicipalAgentExecutionResult, MunicipalAgentTurnResult } from "./municipal-agent-types";

type CopilotTicket = { protocol: string; title: string; description: string; department: string; status: string; priority: string; dueDate: string | null; neighborhood?: string };
type CopilotEvent = { title: string; department: string; location: string; startsAt: string; endsAt?: string | null };
type CopilotResult = { answer: string; headline: string; priority: "Baixa" | "Normal" | "Alta" | "Crítica"; recommendedActions: string[]; cautions: string[]; source: string };
type ChatMessage = { id: string; role: "user" | "assistant" | "system"; content: string; createdAt: string; actionSummary?: string; actionStatus?: "pending" | "executed" | "failed" };
type AiConversation = { id: string; title: string; createdAt: string; updatedAt: string; messages: ChatMessage[] };
type Props = {
  activeModule: string;
  department: string;
  user: { id: string; fullName: string; role: string };
  tickets: CopilotTicket[];
  events: CopilotEvent[];
  departments: string[];
  unreadNotifications?: number;
  onExecuteAction: (action: MunicipalAgentAction) => Promise<MunicipalAgentExecutionResult>;
};

const PRESETS = [
  { mode: "prioritize", label: "Priorizar meu dia", icon: Target, prompt: "Analise o contexto desta tela e me diga o que eu deveria priorizar agora." },
  { mode: "risk_scan", label: "Encontrar riscos", icon: AlertTriangle, prompt: "Procure atrasos, riscos, gargalos e itens que precisam de atenção humana no contexto atual." },
  { mode: "action_plan", label: "Criar plano de ação", icon: Zap, prompt: "Transforme o contexto desta tela em um plano de ação objetivo e executável." },
  { mode: "meeting", label: "Preparar reunião", icon: MessageSquareText, prompt: "Prepare uma pauta executiva curta com decisões, pendências e próximos passos a partir deste contexto." },
] as const;

function makeId(prefix: string) { return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`; }
function compactTicket(ticket: CopilotTicket) { return { protocol: ticket.protocol, title: ticket.title, description: ticket.description.slice(0, 650), department: ticket.department, status: ticket.status, priority: ticket.priority, dueDate: ticket.dueDate, neighborhood: ticket.neighborhood || "" }; }
function formatChatTime(value: string) { try { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value)); } catch { return ""; } }
function newConversation(): AiConversation { const now = new Date().toISOString(); return { id: makeId("ai-chat"), title: "Nova conversa", createdAt: now, updatedAt: now, messages: [] }; }

export function MunicipalAiCopilot({ activeModule, department, user, tickets, events, departments, unreadNotifications = 0, onExecuteAction }: Props) {
  const historyKey = persistenceKey("municipal-ai-chat-history", user.id, "v1");
  const [conversations, setConversations, historyStatus, historyReady] = usePersistentState<AiConversation[]>(historyKey, []);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [open, setOpen] = useState(false), [showHistory, setShowHistory] = useState(false), [prompt, setPrompt] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [configured, setConfigured] = useState<boolean | null>(null);
  const [pendingAction, setPendingAction] = useState<MunicipalAgentAction | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!historyReady || activeConversationId) return;
    if (conversations[0]) setActiveConversationId(conversations[0].id);
  }, [activeConversationId, conversations, historyReady]);
  useEffect(() => { if (open) window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30); }, [conversations, open, busy]);

  const activeConversation = conversations.find((item) => item.id === activeConversationId) ?? null;
  const context = useMemo(() => ({
    now: new Date().toISOString(), currentScreen: activeModule, viewedDepartment: department,
    currentUser: { role: user.role, department },
    summary: { visibleTickets: tickets.length, urgentTickets: tickets.filter((item) => ["Urgente", "Crítica"].includes(item.priority) && !["Concluído", "Cancelado"].includes(item.status)).length, openTickets: tickets.filter((item) => !["Concluído", "Cancelado"].includes(item.status)).length, unreadNotifications, upcomingEvents: events.filter((event) => new Date(event.startsAt).getTime() >= Date.now()).slice(0, 10) },
    visibleTickets: tickets.slice(0, 30).map(compactTicket), upcomingEvents: events.slice(0, 20),
    navigationOptions: ["Início", "Demandas", "Tarefas", "Agenda", "Gestão", "Configurações", "Chamados", "Atendimento ao Cidadão", "Central Integrada", "Próximos Eventos"],
  }), [activeModule, department, events, tickets, unreadNotifications, user.role]);

  function updateConversation(conversationId: string, updater: (conversation: AiConversation) => AiConversation) {
    setConversations((current) => current.map((conversation) => conversation.id === conversationId ? updater(conversation) : conversation));
  }
  function ensureConversation(firstMessage?: string) {
    if (activeConversation) return activeConversation;
    const created = newConversation();
    if (firstMessage) created.title = firstMessage.trim().slice(0, 48) || "Nova conversa";
    setConversations((current) => [created, ...current]); setActiveConversationId(created.id); return created;
  }
  function appendMessage(conversationId: string, message: ChatMessage) {
    updateConversation(conversationId, (conversation) => ({ ...conversation, title: conversation.messages.length === 0 && message.role === "user" ? message.content.slice(0, 48) : conversation.title, updatedAt: message.createdAt, messages: [...conversation.messages, message].slice(-120) }));
  }
  async function executePreparedAction(conversationId: string, action: MunicipalAgentAction) {
    setBusy(true); setError(""); setPendingAction(null);
    try {
      const execution = await onExecuteAction(action);
      appendMessage(conversationId, { id: makeId("ai-msg"), role: "system", content: execution.message, createdAt: new Date().toISOString(), actionSummary: action.summary, actionStatus: execution.ok ? "executed" : "failed" });
    } catch (err) {
      appendMessage(conversationId, { id: makeId("ai-msg"), role: "system", content: err instanceof Error ? err.message : "Não foi possível executar a ação no sistema.", createdAt: new Date().toISOString(), actionSummary: action.summary, actionStatus: "failed" });
    } finally { setBusy(false); }
  }
  async function ask(rawPrompt: string) {
    const question = rawPrompt.trim(); if (!question || busy || !historyReady) return;
    const conversation = ensureConversation(question); const now = new Date().toISOString();
    const userMessage: ChatMessage = { id: makeId("ai-msg"), role: "user", content: question, createdAt: now };
    const previousMessages = conversation.messages;
    appendMessage(conversation.id, userMessage); setBusy(true); setError(""); setPrompt(""); setPendingAction(null);
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "agent_turn", messages: [...previousMessages, userMessage].map((item) => ({ role: item.role === "user" ? "user" : "assistant", content: item.role === "system" ? `RESULTADO DO SISTEMA: ${item.content}` : item.content })), context, departments }) });
      const payload = await response.json() as { configured?: boolean; result?: MunicipalAgentTurnResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "Não foi possível consultar o Agente Municipal.");
      setConfigured(Boolean(payload.configured)); const result = payload.result;
      appendMessage(conversation.id, { id: makeId("ai-msg"), role: "assistant", content: result.reply, createdAt: new Date().toISOString(), actionSummary: result.actionSummary || undefined, actionStatus: result.readyToExecute && result.requiresConfirmation ? "pending" : undefined });
      if (result.readyToExecute && result.actionType !== "none") {
        const action: MunicipalAgentAction = { type: result.actionType, payload: result.payload, summary: result.actionSummary || result.reply.slice(0, 220) };
        if (result.requiresConfirmation) setPendingAction(action); else await executePreparedAction(conversation.id, action);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Falha ao consultar a IA."); } finally { setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void ask(prompt); }
  function startNewConversation() { const created = newConversation(); setConversations((current) => [created, ...current].slice(0, 40)); setActiveConversationId(created.id); setShowHistory(false); setPendingAction(null); setError(""); }
  function removeConversation(id: string) { setConversations((current) => current.filter((item) => item.id !== id)); if (activeConversationId === id) setActiveConversationId(""); }

  const messages = activeConversation?.messages ?? [];
  return <>
    <button className="municipal-ai-fab" type="button" onClick={() => setOpen(true)} aria-label="Abrir Agente Municipal com IA"><span><Sparkles size={17}/></span><strong>IA</strong><small>Agente</small></button>
    {open && <div className="municipal-ai-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><aside className="municipal-ai-panel municipal-ai-agent-panel" role="dialog" aria-modal="true" aria-labelledby="municipal-ai-title">
      <header><div className="municipal-ai-brand"><span><Bot size={21}/></span><div><small>GROQ · AGENTE MUNICIPAL</small><h2 id="municipal-ai-title">Assistente que executa</h2></div></div><div className="municipal-ai-header-actions"><button type="button" title="Histórico" aria-label="Abrir histórico" onClick={() => setShowHistory((value) => !value)}><History size={18}/></button><button type="button" title="Nova conversa" aria-label="Nova conversa" onClick={startNewConversation}><MessageSquarePlus size={18}/></button><button type="button" aria-label="Fechar Agente" onClick={() => setOpen(false)}><X size={19}/></button></div></header>
      {showHistory && <section className="municipal-ai-history"><div><strong>Histórico de conversas</strong><small>{historyStatus === "salvando" ? "Salvando…" : historyStatus === "offline" ? "Histórico local — sincronizará depois" : "Sincronizado"}</small></div>{conversations.length ? conversations.slice(0,30).map((conversation)=><button type="button" className={conversation.id===activeConversationId?"active":""} key={conversation.id} onClick={()=>{setActiveConversationId(conversation.id);setShowHistory(false);setPendingAction(null);}}><span><strong>{conversation.title || "Conversa"}</strong><small>{formatChatTime(conversation.updatedAt)}</small></span><i role="button" tabIndex={0} aria-label="Excluir conversa" onClick={(event)=>{event.stopPropagation();removeConversation(conversation.id);}} onKeyDown={(event)=>{if(event.key==="Enter"){event.stopPropagation();removeConversation(conversation.id);}}}><Trash2 size={13}/></i></button>):<p>Nenhuma conversa salva ainda.</p>}</section>}
      <div className="municipal-ai-context"><span><Sparkles size={14}/></span><div><strong>{activeModule}</strong><small>{department} · a IA pode operar os recursos permitidos</small></div></div>
      {!messages.length && <section className="municipal-ai-presets" aria-label="Ações rápidas de inteligência artificial">{PRESETS.map(({ mode, label, icon: Icon, prompt: presetPrompt }) => <button type="button" key={mode} disabled={busy} onClick={() => void ask(presetPrompt)}><Icon size={15}/><span>{label}</span><ChevronRight size={13}/></button>)}</section>}
      <section className="municipal-ai-chat" aria-live="polite">
        {!historyReady && <div className="municipal-ai-loading"><LoaderCircle className="spin" size={22}/><strong>Carregando seu histórico...</strong><p>As conversas são separadas por usuário e sincronizadas com a persistência do sistema.</p></div>}
        {historyReady && !messages.length && !busy && <div className="municipal-ai-empty"><Bot size={30}/><strong>Peça e a IA executa</strong><p>Ex.: “Abra um chamado para uma visita familiar no bairro Caiçara 1”. Se faltar algo, eu pergunto antes de registrar.</p></div>}
        {messages.map((message)=><article key={message.id} className={`municipal-ai-bubble ${message.role} ${message.actionStatus || ""}`}><div><strong>{message.role === "user" ? user.fullName : message.role === "assistant" ? "Agente Municipal" : message.actionStatus === "executed" ? "Ação concluída" : "Sistema"}</strong><small>{formatChatTime(message.createdAt)}</small></div><p>{message.content}</p>{message.actionSummary && <span className="municipal-ai-action-summary"><CheckCircle2 size={13}/>{message.actionSummary}</span>}</article>)}
        {busy && <div className="municipal-ai-loading compact"><LoaderCircle className="spin" size={20}/><strong>{pendingAction ? "Executando no sistema..." : "Analisando e preparando a ação..."}</strong></div>}
        {error && <div className="municipal-ai-error"><AlertTriangle size={20}/><div><strong>Não foi possível concluir</strong><p>{error}</p></div></div>}
        {pendingAction && activeConversation && !busy && <div className="municipal-ai-confirm"><ShieldCheck size={17}/><div><strong>Confirmar alteração</strong><p>{pendingAction.summary}</p><span><button type="button" className="button secondary" onClick={()=>{setPendingAction(null);appendMessage(activeConversation.id,{id:makeId("ai-msg"),role:"system",content:"Ação cancelada pelo usuário.",createdAt:new Date().toISOString(),actionSummary:pendingAction.summary,actionStatus:"failed"});}}>Cancelar</button><button type="button" className="button primary" onClick={()=>void executePreparedAction(activeConversation.id,pendingAction)}>Confirmar e executar</button></span></div></div>}
        <div ref={endRef}/>
      </section>
      <form className="municipal-ai-composer" onSubmit={submit}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Peça uma ação ou faça uma pergunta…" aria-label="Mensagem para o Agente Municipal" onKeyDown={(event)=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();if(prompt.trim()&&!busy)void ask(prompt);}}}/><button type="submit" disabled={busy || !historyReady || !prompt.trim()} aria-label="Enviar mensagem para a IA">{busy ? <LoaderCircle className="spin" size={17}/> : <Send size={17}/>}</button></form>
      <footer><ShieldCheck size={13}/><span>{configured === false ? "Configure GROQ_API_KEY na Vercel para ativar as ações inteligentes." : "Ações respeitam permissões e ficam registradas no histórico do sistema."}</span></footer>
    </aside></div>}
  </>;
}

export function DashboardAiBrief({ department, tickets }: { department: string; tickets: CopilotTicket[] }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [result, setResult] = useState<CopilotResult | null>(null);
  async function generate() { setOpen(true); if (result || busy) return; setBusy(true); try { const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "copilot", mode: "prioritize", prompt: "Gere um briefing executivo muito curto: o que merece atenção agora, qual o maior risco e quais são as três próximas ações.", context: { department, tickets: tickets.slice(0, 20).map(compactTicket) } }) }); const payload = await response.json() as { result?: CopilotResult }; if (response.ok && payload.result) setResult(payload.result); } finally { setBusy(false); } }
  return <article className={`dashboard-ai-brief ${open ? "open" : ""}`}><button type="button" onClick={() => open ? setOpen(false) : void generate()}><span><Sparkles size={16}/></span><div><strong>Resumo inteligente</strong><small>Groq analisa o cenário quando você pedir</small></div><ChevronRight size={15}/></button>{open && <div className="dashboard-ai-brief-body">{busy ? <p><LoaderCircle className="spin" size={15}/> Preparando briefing...</p> : result ? <><strong>{result.headline}</strong><p>{result.answer}</p>{result.recommendedActions.slice(0,3).map((item, index)=><span key={`${item}-${index}`}><CheckCircle2 size={12}/>{item}</span>)}</> : <p>Não foi possível gerar o briefing agora.</p>}</div>}</article>;
}
