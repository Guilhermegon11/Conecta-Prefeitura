"use client";

import { useMemo } from "react";
import { persistenceKey, usePersistentState } from "./persistence";
import {
  AlertTriangle, ArrowRight, BellRing, Building2, CalendarClock, Check, CheckCircle2,
  ClipboardCheck, Clock3, FileCheck2, FilePlus2, FileText, Gauge, ListChecks, MapPin,
  Plus, Settings2, ShieldCheck, Smartphone, Sparkles, TimerReset, UserCheck,
  UsersRound, Workflow, X,
} from "./site-icons";

type TicketLike = { id: string; protocol: string; title: string; department: string; status: string; priority: string; dueDate: string | null; assigneeName?: string };
type Navigate = (item: "Chamados" | "Auditoria") => void;

function hoursTo(date: string | null) {
  if (!date) return null;
  return Math.round((new Date(date).getTime() - Date.now()) / 3600000);
}

export function OperationalCommandCenter({ tickets, allTickets, executive, department, userName, onNavigate }: { tickets: TicketLike[]; allTickets: TicketLike[]; executive: boolean; department: string; userName: string; onNavigate: Navigate }) {
  const urgent = tickets.filter((ticket) => ticket.priority === "Urgente" || (hoursTo(ticket.dueDate) ?? 999) <= 24).slice(0, 3);
  const approvals = tickets.filter((ticket) => ticket.status === "Aguardando aprovação");
  const overdue = tickets.filter((ticket) => (hoursTo(ticket.dueDate) ?? 1) < 0 && ticket.status !== "Concluído");
  const executiveStats = useMemo(() => {
    const active = allTickets.filter((t) => t.status !== "Concluído" && t.status !== "Cancelado");
    const late = active.filter((t) => (hoursTo(t.dueDate) ?? 1) < 0);
    const departments = Array.from(new Set(allTickets.map((t) => t.department))).map((name) => ({ name, total: active.filter((t) => t.department === name).length, late: late.filter((t) => t.department === name).length })).sort((a,b) => b.total - a.total).slice(0,5);
    return { active: active.length, late: late.length, within: active.length ? Math.round(((active.length - late.length) / active.length) * 100) : 100, departments };
  }, [allTickets]);
  const onTimeScore = executive ? executiveStats.within : Math.max(0, 100 - overdue.length * 8);

  return <section className="command-center">
    <article className="command-hero panel">
      <div><p className="eyebrow">CENTRAL DE TRABALHO</p><h2>{executive ? `Visão executiva de ${department}` : `Meu dia em ${department}`}</h2><p>{executive ? "Prioridades, riscos e desempenho do setor selecionado, sem mistura com outras unidades." : `${userName.split(" ")[0]}, estas são as ações que merecem atenção agora.`}</p></div>
      <div className="command-score">
        <span><Gauge size={18}/></span><strong>{onTimeScore}%</strong><small>dentro do prazo</small>
        <div className="command-score-progress" role="progressbar" aria-label="Demandas dentro do prazo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={onTimeScore}><i style={{ width: `${onTimeScore}%` }} /></div>
      </div>
    </article>

    {executive && <div className="executive-kpis">
      <article className="info"><span><ClipboardCheck size={18}/></span><div><small>Demandas abertas</small><strong>{executiveStats.active}</strong></div></article>
      <article className="danger"><span><AlertTriangle size={18}/></span><div><small>Em atraso</small><strong>{executiveStats.late}</strong></div></article>
      <article className="success"><span><ShieldCheck size={18}/></span><div><small>Dentro do SLA</small><strong>{executiveStats.within}%</strong></div></article>
      <article className="warning"><span><UserCheck size={18}/></span><div><small>Aguardando decisão</small><strong>{allTickets.filter((t)=>t.status === "Aguardando aprovação").length}</strong></div></article>
    </div>}

    <div className="command-grid">
      <article className="panel attention-panel"><header><div><h3>Precisa da sua atenção</h3><p>Ordenado por prazo e prioridade</p></div><span>{urgent.length + approvals.length}</span></header>
        <div>{[...urgent, ...approvals.filter((a)=>!urgent.some((u)=>u.id===a.id))].slice(0,4).map((ticket) => { const h = hoursTo(ticket.dueDate); return <button key={ticket.id} onClick={() => onNavigate("Chamados")}><i className={(h ?? 99) < 0 ? "critical" : (h ?? 99) <= 24 ? "warning" : "normal"}><Clock3 size={14}/></i><span><strong>{ticket.title}</strong><small>{ticket.protocol} · {ticket.assigneeName ?? "Responsável a definir"}</small></span><em>{h === null ? "Sem SLA" : h < 0 ? `${Math.abs(h)}h atrasado` : `${h}h restantes`}</em><ArrowRight size={14}/></button>})}
          {!urgent.length && !approvals.length && <div className="command-empty"><CheckCircle2 size={24}/><strong>Nenhuma urgência agora</strong><p>As demandas prioritárias aparecerão aqui.</p></div>}
        </div>
      </article>
      {executive ? <article className="panel department-risk"><header><div><h3>Carga do setor selecionado</h3><p>Demandas ativas e atrasos</p></div><Building2 size={18}/></header>{executiveStats.departments.map((item) => <div key={item.name}><span><strong>{item.name}</strong><small>{item.total} em andamento</small></span><b>{item.late ? `${item.late} atrasadas` : "sem atraso"}</b></div>)}</article> : <article className="panel today-agenda"><header><div><h3>Agenda operacional</h3><p>Compromissos e prazos do dia</p></div><CalendarClock size={18}/></header>{[["09:00","Alinhamento da equipe"],["11:30","Vistoria programada"],["14:00","Revisar processo pendente"],["16:00","Fechamento de SLA"]].map(([time,title]) => <div key={time}><strong>{time}</strong><span>{title}</span></div>)}</article>}
    </div>
  </section>;
}

export function WorkflowAutomationHub({ notify }: { notify: (message: string) => void }) {
  const [workflowState, setWorkflowState, workflowSaveStatus] = usePersistentState("workflow-automation:global:v1", { active: "Solicitação de compra", enabled: [] as string[] });
  const active = workflowState.active;
  const templates = [
    { name: "Solicitação de compra", steps: ["Solicitação", "Secretário", "Cotação", "Financeiro", "Compra", "Recebimento"] },
    { name: "Manutenção de iluminação", steps: ["Registro", "Triagem", "Equipe de campo", "Vistoria", "Execução", "Validação"] },
    { name: "Ofício recebido", steps: ["Protocolo", "Gabinete", "Secretaria", "Resposta", "Assinatura", "Envio"] },
  ];
  const current = templates.find((t)=>t.name===active)!;
  return <article className="panel workflow-hub"><header><div><p className="eyebrow">AUTOMAÇÃO ENTRE MÓDULOS</p><h2>Modelos de fluxo</h2><p>Padronize tramitações, aprovações, prazos e notificações sem criar uma tela nova para cada rotina.</p></div><button className="button secondary" onClick={() => notify("Novo modelo de fluxo preparado para configuração.")}><Plus size={14}/> Novo modelo</button></header>
    <div className="workflow-template-picker">{templates.map((template)=><button key={template.name} className={active===template.name?"active":""} onClick={()=>setWorkflowState((state)=>({...state,active:template.name}))}><Workflow size={15}/>{template.name}</button>)}</div>
    <div className="workflow-route">{current.steps.map((step,index)=><div key={step}><span>{index+1}</span><strong>{step}</strong>{index<current.steps.length-1 && <ArrowRight size={15}/>}</div>)}</div>
    <footer><span><Sparkles size={14}/> Ao avançar uma etapa, responsáveis e prazos podem ser atualizados automaticamente. <small className={`sync-inline ${workflowSaveStatus}`}>{workflowSaveStatus === "offline" ? "Aguardando conexão" : "Configuração sincronizada"}</small></span><button onClick={()=>{setWorkflowState((state)=>({...state,enabled:Array.from(new Set([...state.enabled,current.name]))}));notify(`Fluxo “${current.name}” ativado e salvo.`)}}>{workflowState.enabled.includes(current.name)?"Automação ativa":"Ativar automação"}</button></footer>
  </article>;
}

export function FormBuilderPanel({ department, notify }: { department: string; notify: (message: string) => void }) {
  const [builder, setBuilder, saveStatus] = usePersistentState(persistenceKey("form-builder", department, "v2"), { name: "Ficha operacional do setor", fields: ["Identificação", "Local ou referência", "Evidência", "Situação", "Observação"] });
  return <article className="panel form-builder"><header><div><p className="eyebrow">FORMULÁRIOS PERSONALIZADOS</p><h2>Construtor de fichas do setor</h2><p>Monte formulários operacionais e mantenha a configuração sincronizada para toda a equipe.</p></div><FilePlus2 size={20}/></header>
    <label><span>Nome da ficha</span><input value={builder.name} onChange={(e)=>setBuilder((current)=>({...current,name:e.target.value}))}/></label>
    <div className="builder-fields">{builder.fields.map((field,index)=><div key={`${field}-${index}`}><ListChecks size={15}/><input aria-label={`Campo ${index+1}`} value={field} onChange={(event)=>setBuilder((current)=>({...current,fields:current.fields.map((item,i)=>i===index?event.target.value:item)}))}/><button aria-label={`Remover ${field}`} onClick={()=>setBuilder((current)=>({...current,fields:current.fields.filter((_,i)=>i!==index)}))}><X size={13}/></button></div>)}<button onClick={()=>setBuilder((current)=>({...current,fields:[...current.fields,`Novo campo ${current.fields.length+1}`]}))}><Plus size={14}/> Adicionar campo</button></div>
    <div className="builder-action"><span><Settings2 size={16}/><span><strong>Ao enviar</strong><small>O registro fica disponível na central operacional do setor</small></span></span><span className={`sync-inline ${saveStatus}`}>{saveStatus === "salvando" ? "Salvando…" : saveStatus === "offline" ? "Aguardando conexão" : "Sincronizado"}</span><button className="button primary" onClick={()=>notify(`Formulário “${builder.name}” está salvo e disponível para o setor.`)}>Confirmar formulário</button></div>
  </article>;
}

export function FieldOperationsPanel({ department, notify }: { department: string; notify: (message: string) => void }) {
  const [fieldState, setFieldState, saveStatus] = usePersistentState(persistenceKey("field-operations", department, "v1"), { status: "Em vistoria", completedAt: "" });
  return <article className="panel field-ops"><header><div><p className="eyebrow">OPERAÇÃO EM CAMPO</p><h2>Equipe de campo</h2><p>Interface simplificada para vistoria, evidências e conclusão em celular.</p></div><Smartphone size={22}/></header>
    <div className="field-phone"><div className="field-phone-top"><span><MapPin size={15}/> Local do setor</span><strong>ATIVIDADE SETORIAL</strong></div><h3>Atividade externa do setor</h3><p>{department} · equipe responsável</p><div className="field-actions"><button onClick={()=>notify("Abra Anexos e Arquivos para registrar uma evidência fotográfica vinculada à atividade.")}>📷 Anexar foto</button><button onClick={()=>notify("Use o campo de observações do registro para documentar a ocorrência.")}>📝 Registrar observação</button></div><label><span>Status</span><select value={fieldState.status} onChange={(e)=>setFieldState((current)=>({...current,status:e.target.value,completedAt:""}))}><option>Em vistoria</option><option>Serviço executado</option><option>Não encontrado</option><option>Necessita nova equipe</option><option>Material insuficiente</option></select></label><small className={`sync-inline ${saveStatus}`}>{saveStatus === "salvando" ? "Salvando…" : saveStatus === "offline" ? "Aguardando conexão" : "Status sincronizado"}</small><button className="field-complete" onClick={()=>{setFieldState((current)=>({...current,completedAt:new Date().toISOString()}));notify(`Vistoria finalizada como “${fieldState.status}”.`)}}><Check size={15}/> Finalizar vistoria</button></div>
  </article>;
}

export function DocumentGovernancePanel({ department, notify }: { department: string; notify: (message: string) => void }) {
  return <article className="panel document-governance"><header><div><p className="eyebrow">GESTÃO DOCUMENTAL</p><h2>Versionamento e classificação</h2><p>Controle versões, vínculo com processos/chamados e nível de confidencialidade.</p></div><FileCheck2 size={20}/></header><div className="version-file"><span><FileText size={19}/></span><div><strong>Documento operacional do setor.pdf</strong><small>Documento interno · {department}</small></div><b>v3 atual</b></div><div className="version-history"><span><i>v3</i><strong>Revisão consolidada pelo setor</strong><small>Hoje, 10:42</small></span><span><i>v2</i><strong>Ajustes internos registrados</strong><small>14 ago.</small></span><span><i>v1</i><strong>Versão inicial</strong><small>09 ago.</small></span></div><button onClick={()=>notify("Histórico do documento setorial aberto.")}>Ver histórico e vínculos <ArrowRight size={13}/></button></article>;
}

export function SmartNotificationRules({ department, notify }: { department: string; notify: (message: string) => void }) {
  const [rules, setRules, saveStatus] = usePersistentState<boolean[]>(persistenceKey("notification-rules", department, "v1"), [true,true,true,false]);
  const items = [["SLA próximo do vencimento","Avisar responsável 2h antes"],["Registro sem movimentação","Escalonar após 48h"],["Aprovação pendente","Lembrar diariamente"],["Indicador crítico do setor","Avisar o responsável automaticamente"]];
  return <article className="panel smart-rules"><header><div><p className="eyebrow">NOTIFICAÇÕES INTELIGENTES</p><h2>Regras e escalonamento</h2><small className={`sync-inline ${saveStatus}`}>{saveStatus === "salvando" ? "Salvando…" : saveStatus === "offline" ? "Aguardando conexão" : "Regras sincronizadas"}</small></div><BellRing size={19}/></header>{items.map(([title,detail],index)=><button key={title} onClick={()=>{setRules((current)=>current.map((v,i)=>i===index?!v:v)); notify("Regra de notificação atualizada e salva.")}}><span><strong>{title}</strong><small>{detail}</small></span><i className={rules[index]?"toggle active":"toggle"}><b/></i></button>)}</article>;
}

export function PermissionScopePanel({ department, executive = false, notify }: { department: string; executive?: boolean; notify: (message: string) => void }) {
  const [state, setState, saveStatus] = usePersistentState(persistenceKey("permission-scope", department, "v1"), { scope: "Toda a secretaria", temporary: false, temporaryUntil: "2026-08-25" });
  const allowedScope = executive ? state.scope : state.scope === "Somente registros próprios" ? state.scope : "Toda a secretaria";
  return <article className="panel permission-scope"><header><div><p className="eyebrow">ESCOPO DE DADOS</p><h3>Permissão contextual e temporária</h3><p>Além de poder ver/registrar/alterar, limite quais registros cada perfil pode acessar.</p></div><ShieldCheck size={19}/></header><label><span>Escopo padrão</span><select value={allowedScope} onChange={(e)=>setState((current)=>({...current,scope:e.target.value}))}><option>Somente registros próprios</option><option>Toda a secretaria</option>{executive&&<><option>Secretarias selecionadas</option><option>Prefeitura inteira</option></>}</select></label><button className="temporary-access" onClick={()=>setState((current)=>({...current,temporary:!current.temporary}))}><span><TimerReset size={16}/><span><strong>Acesso temporário</strong><small>{state.temporary ? `Ativo até ${new Date(`${state.temporaryUntil}T12:00:00`).toLocaleDateString("pt-BR")}` : "Conceda substituição por período definido"}</small></span></span><i className={state.temporary?"toggle active":"toggle"}><b/></i></button>{state.temporary&&<label><span>Válido até</span><input type="date" value={state.temporaryUntil} onChange={(e)=>setState((current)=>({...current,temporaryUntil:e.target.value}))}/></label>}<footer><span><UsersRound size={14}/> Escopo atual: <strong>{allowedScope}</strong> · <small>{saveStatus === "offline" ? "aguardando conexão" : "sincronizado"}</small></span><button onClick={()=>notify("Escopo de acesso salvo.")}>Confirmar escopo</button></footer></article>;
}

export function ApprovalCenterPanel({ department, notify }: { department: string; notify: (message: string) => void }) {
  const [decisions, setDecisions, saveStatus] = usePersistentState<Record<string,string>>(persistenceKey("approval-decisions", department, "v1"), {});
  const items = [
    { id: "ap-1", title: "Solicitação interna aguardando decisão", origin: department, value: "Análise setorial", deadline: "Hoje, 16:00" },
    { id: "ap-2", title: "Revisão de prazo e responsável", origin: department, value: "Acompanhamento", deadline: "Amanhã" },
  ];
  function decide(id:string, decision:string) { setDecisions((current)=>({...current,[id]:decision})); notify(`Decisão “${decision}” registrada e salva.`); }
  return <article className="panel approval-center"><header><div><p className="eyebrow">CENTRAL DE DECISÕES</p><h2>Aprovações</h2><p>Solicitações que exigem manifestação formal do perfil atual.</p><small className={`sync-inline ${saveStatus}`}>{saveStatus === "salvando" ? "Salvando…" : saveStatus === "offline" ? "Aguardando conexão" : "Decisões sincronizadas"}</small></div><UserCheck size={20}/></header>{items.map((item)=><div className="approval-row" key={item.id}><span className="approval-icon"><FileCheck2 size={17}/></span><span><strong>{item.title}</strong><small>{item.origin} · {item.value} · prazo {item.deadline}</small></span>{decisions[item.id]?<b className="decision-done"><CheckCircle2 size={13}/>{decisions[item.id]}</b>:<div><button onClick={()=>decide(item.id,"Aprovado")}>Aprovar</button><button onClick={()=>decide(item.id,"Ajuste solicitado")}>Solicitar ajuste</button><button className="reject" onClick={()=>decide(item.id,"Rejeitado")}>Rejeitar</button></div>}</div>)}</article>;
}
