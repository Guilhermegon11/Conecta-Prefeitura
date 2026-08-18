"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, BellRing, Building2, CalendarClock, Check, CheckCircle2,
  ClipboardCheck, Clock3, FileCheck2, FilePlus2, FileText, Gauge, ListChecks, MapPin,
  Plus, Settings2, ShieldCheck, Smartphone, Sparkles, TimerReset, UserCheck,
  UsersRound, Workflow, X,
} from "lucide-react";

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

  return <section className="command-center">
    <article className="command-hero panel">
      <div><p className="eyebrow">CENTRAL DE TRABALHO</p><h2>{executive ? "Visão executiva do município" : `Meu dia em ${department}`}</h2><p>{executive ? "Prioridades, riscos e desempenho consolidados para decisão rápida." : `${userName.split(" ")[0]}, estas são as ações que merecem atenção agora.`}</p></div>
      <div className="command-score"><span><Gauge size={18}/></span><strong>{executive ? `${executiveStats.within}%` : `${Math.max(0, 100 - overdue.length * 8)}%`}</strong><small>dentro do prazo</small></div>
    </article>

    {executive && <div className="executive-kpis">
      <article><span><ClipboardCheck size={18}/></span><div><small>Demandas abertas</small><strong>{executiveStats.active}</strong></div></article>
      <article><span><AlertTriangle size={18}/></span><div><small>Em atraso</small><strong>{executiveStats.late}</strong></div></article>
      <article><span><ShieldCheck size={18}/></span><div><small>Dentro do SLA</small><strong>{executiveStats.within}%</strong></div></article>
      <article><span><UserCheck size={18}/></span><div><small>Aguardando decisão</small><strong>{allTickets.filter((t)=>t.status === "Aguardando aprovação").length}</strong></div></article>
    </div>}

    <div className="command-grid">
      <article className="panel attention-panel"><header><div><h3>Precisa da sua atenção</h3><p>Ordenado por prazo e prioridade</p></div><span>{urgent.length + approvals.length}</span></header>
        <div>{[...urgent, ...approvals.filter((a)=>!urgent.some((u)=>u.id===a.id))].slice(0,4).map((ticket) => { const h = hoursTo(ticket.dueDate); return <button key={ticket.id} onClick={() => onNavigate("Chamados")}><i className={(h ?? 99) < 0 ? "critical" : (h ?? 99) <= 24 ? "warning" : "normal"}><Clock3 size={14}/></i><span><strong>{ticket.title}</strong><small>{ticket.protocol} · {ticket.assigneeName ?? "Responsável a definir"}</small></span><em>{h === null ? "Sem SLA" : h < 0 ? `${Math.abs(h)}h atrasado` : `${h}h restantes`}</em><ArrowRight size={14}/></button>})}
          {!urgent.length && !approvals.length && <div className="command-empty"><CheckCircle2 size={24}/><strong>Nenhuma urgência agora</strong><p>As demandas prioritárias aparecerão aqui.</p></div>}
        </div>
      </article>
      {executive ? <article className="panel department-risk"><header><div><h3>Secretarias com maior carga</h3><p>Demandas ativas e atrasos</p></div><Building2 size={18}/></header>{executiveStats.departments.map((item) => <div key={item.name}><span><strong>{item.name}</strong><small>{item.total} em andamento</small></span><b>{item.late ? `${item.late} atrasadas` : "sem atraso"}</b></div>)}</article> : <article className="panel today-agenda"><header><div><h3>Agenda operacional</h3><p>Compromissos e prazos do dia</p></div><CalendarClock size={18}/></header>{[["09:00","Alinhamento da equipe"],["11:30","Vistoria programada"],["14:00","Revisar processo pendente"],["16:00","Fechamento de SLA"]].map(([time,title]) => <div key={time}><strong>{time}</strong><span>{title}</span></div>)}</article>}
    </div>
  </section>;
}

export function WorkflowAutomationHub({ notify }: { notify: (message: string) => void }) {
  const [active, setActive] = useState("Solicitação de compra");
  const templates = [
    { name: "Solicitação de compra", steps: ["Solicitação", "Secretário", "Cotação", "Financeiro", "Compra", "Recebimento"] },
    { name: "Manutenção de iluminação", steps: ["Registro", "Triagem", "Equipe de campo", "Vistoria", "Execução", "Validação"] },
    { name: "Ofício recebido", steps: ["Protocolo", "Gabinete", "Secretaria", "Resposta", "Assinatura", "Envio"] },
  ];
  const current = templates.find((t)=>t.name===active)!;
  return <article className="panel workflow-hub"><header><div><p className="eyebrow">AUTOMAÇÃO ENTRE MÓDULOS</p><h2>Modelos de fluxo</h2><p>Padronize tramitações, aprovações, prazos e notificações sem criar uma tela nova para cada rotina.</p></div><button className="button secondary" onClick={() => notify("Novo modelo de fluxo preparado para configuração.")}><Plus size={14}/> Novo modelo</button></header>
    <div className="workflow-template-picker">{templates.map((template)=><button key={template.name} className={active===template.name?"active":""} onClick={()=>setActive(template.name)}><Workflow size={15}/>{template.name}</button>)}</div>
    <div className="workflow-route">{current.steps.map((step,index)=><div key={step}><span>{index+1}</span><strong>{step}</strong>{index<current.steps.length-1 && <ArrowRight size={15}/>}</div>)}</div>
    <footer><span><Sparkles size={14}/> Ao avançar uma etapa, responsáveis e prazos podem ser atualizados automaticamente.</span><button onClick={()=>notify(`Fluxo “${current.name}” ativado no modo demonstração.`)}>Ativar automação</button></footer>
  </article>;
}

export function FormBuilderPanel({ notify }: { notify: (message: string) => void }) {
  const [fields, setFields] = useState(["Endereço", "Bairro", "Foto obrigatória", "Localização GPS", "Situação", "Observação"]);
  const [name, setName] = useState("Vistoria de iluminação");
  return <article className="panel form-builder"><header><div><p className="eyebrow">FORMULÁRIOS PERSONALIZADOS</p><h2>Construtor de fichas do setor</h2><p>Monte formulários operacionais e defina a ação executada após o envio.</p></div><FilePlus2 size={20}/></header>
    <label><span>Nome da ficha</span><input value={name} onChange={(e)=>setName(e.target.value)}/></label>
    <div className="builder-fields">{fields.map((field,index)=><div key={`${field}-${index}`}><ListChecks size={15}/><span>{field}</span><button aria-label={`Remover ${field}`} onClick={()=>setFields((current)=>current.filter((_,i)=>i!==index))}><X size={13}/></button></div>)}<button onClick={()=>setFields((current)=>[...current,`Novo campo ${current.length+1}`])}><Plus size={14}/> Adicionar campo</button></div>
    <div className="builder-action"><span><Settings2 size={16}/><span><strong>Ao enviar</strong><small>Criar chamado automaticamente para a secretaria responsável</small></span></span><button className="button primary" onClick={()=>notify(`Formulário “${name}” salvo no modo demonstração.`)}>Salvar formulário</button></div>
  </article>;
}

export function FieldOperationsPanel({ notify }: { notify: (message: string) => void }) {
  const [status, setStatus] = useState("Em vistoria");
  return <article className="panel field-ops"><header><div><p className="eyebrow">OPERAÇÃO MOBILE / PWA</p><h2>Equipe de campo</h2><p>Interface simplificada para vistoria, evidências, GPS e conclusão em celular.</p></div><Smartphone size={22}/></header>
    <div className="field-phone"><div className="field-phone-top"><span><MapPin size={15}/> Localização registrada</span><strong>OS-2026-392</strong></div><h3>Recuperação de drenagem pluvial</h3><p>Bairro Planalto · Equipe de 6 servidores</p><div className="field-actions"><button onClick={()=>notify("Câmera preparada para anexar evidência no protótipo.")}>📷 Tirar foto</button><button onClick={()=>notify("Gravação de observação preparada no protótipo.")}>🎙️ Gravar observação</button></div><label><span>Status</span><select value={status} onChange={(e)=>setStatus(e.target.value)}><option>Em vistoria</option><option>Serviço executado</option><option>Não encontrado</option><option>Necessita nova equipe</option><option>Material insuficiente</option></select></label><button className="field-complete" onClick={()=>notify(`Vistoria finalizada como “${status}”.`)}><Check size={15}/> Finalizar vistoria</button></div>
  </article>;
}

export function DocumentGovernancePanel({ notify }: { notify: (message: string) => void }) {
  return <article className="panel document-governance"><header><div><p className="eyebrow">GESTÃO DOCUMENTAL</p><h2>Versionamento e classificação</h2><p>Controle versões, vínculo com processos/chamados e nível de confidencialidade.</p></div><FileCheck2 size={20}/></header><div className="version-file"><span><FileText size={19}/></span><div><strong>Contrato de manutenção.pdf</strong><small>Contrato · Infraestrutura · Interno</small></div><b>v3 atual</b></div><div className="version-history"><span><i>v3</i><strong>Revisão jurídica consolidada</strong><small>Hoje, 10:42</small></span><span><i>v2</i><strong>Ajuste de quantitativos</strong><small>14 ago.</small></span><span><i>v1</i><strong>Versão inicial</strong><small>09 ago.</small></span></div><button onClick={()=>notify("Histórico completo do documento aberto no modo demonstração.")}>Ver histórico e vínculos <ArrowRight size={13}/></button></article>;
}

export function SmartNotificationRules({ notify }: { notify: (message: string) => void }) {
  const [rules, setRules] = useState([true,true,true,false]);
  const items = [["SLA próximo do vencimento","Avisar responsável 2h antes"],["Registro sem movimentação","Escalonar após 48h"],["Aprovação pendente","Lembrar diariamente"],["Estoque abaixo do mínimo","Avisar compras automaticamente"]];
  return <article className="panel smart-rules"><header><div><p className="eyebrow">NOTIFICAÇÕES INTELIGENTES</p><h2>Regras e escalonamento</h2></div><BellRing size={19}/></header>{items.map(([title,detail],index)=><button key={title} onClick={()=>{setRules((current)=>current.map((v,i)=>i===index?!v:v)); notify("Regra de notificação atualizada.")}}><span><strong>{title}</strong><small>{detail}</small></span><i className={rules[index]?"toggle active":"toggle"}><b/></i></button>)}</article>;
}

export function PermissionScopePanel({ notify }: { notify: (message: string) => void }) {
  const [scope, setScope] = useState("Toda a secretaria");
  const [temporary, setTemporary] = useState(false);
  return <article className="panel permission-scope"><header><div><p className="eyebrow">ESCOPO DE DADOS</p><h3>Permissão contextual e temporária</h3><p>Além de poder ver/registrar/alterar, limite quais registros cada perfil pode acessar.</p></div><ShieldCheck size={19}/></header><label><span>Escopo padrão</span><select value={scope} onChange={(e)=>setScope(e.target.value)}><option>Somente registros próprios</option><option>Toda a secretaria</option><option>Secretarias selecionadas</option><option>Prefeitura inteira</option></select></label><button className="temporary-access" onClick={()=>setTemporary(!temporary)}><span><TimerReset size={16}/><span><strong>Acesso temporário</strong><small>{temporary ? "Ativo até 25/08/2026" : "Conceda substituição por período definido"}</small></span></span><i className={temporary?"toggle active":"toggle"}><b/></i></button><footer><span><UsersRound size={14}/> Escopo atual: <strong>{scope}</strong></span><button onClick={()=>notify("Escopo de acesso salvo no modo demonstração.")}>Salvar escopo</button></footer></article>;
}

export function OperationalMapPanel({ department, notify }: { department: string; notify: (message: string) => void }) {
  const layers = ["Chamados", "Obras", "Iluminação", "Vistorias", "Escolas", "UBS", "Eventos"];
  const [active, setActive] = useState(["Chamados", "Obras", "Vistorias"]);
  const neighborhoods = [
    { name: "Planalto", calls: 32, alert: "Iluminação +18%", tone: "high" },
    { name: "Pinlar I", calls: 21, alert: "6 vistorias", tone: "medium" },
    { name: "Centro", calls: 18, alert: "4 obras", tone: "normal" },
    { name: "Nova Esperança", calls: 11, alert: "estável", tone: "normal" },
  ];
  return <article className="panel operational-map"><header><div><p className="eyebrow">LEITURA TERRITORIAL</p><h2>Mapa operacional</h2><p>Camadas de ocorrências e serviços para {department}.</p></div><MapPin size={21}/></header><div className="map-layer-row">{layers.map((layer)=><button key={layer} className={active.includes(layer)?"active":""} onClick={()=>setActive((current)=>current.includes(layer)?current.filter((item)=>item!==layer):[...current,layer])}><span>{active.includes(layer)?<Check size={11}/>:<Plus size={11}/>}</span>{layer}</button>)}</div><div className="map-simulation"><div className="map-grid-lines"/><span className="map-pin p1">32</span><span className="map-pin p2">21</span><span className="map-pin p3">18</span><span className="map-pin p4">11</span><div className="map-legend"><strong>Camadas ativas</strong><small>{active.join(" · ") || "Nenhuma camada"}</small></div></div><div className="territory-list">{neighborhoods.map((item)=><button key={item.name} onClick={()=>notify(`Painel territorial de ${item.name} aberto: ${item.calls} registros relacionados às camadas selecionadas.`)}><i className={item.tone}/><span><strong>{item.name}</strong><small>{item.calls} registros</small></span><b>{item.alert}</b><ArrowRight size={13}/></button>)}</div></article>;
}

export function ApprovalCenterPanel({ notify }: { notify: (message: string) => void }) {
  const [decisions, setDecisions] = useState<Record<string,string>>({});
  const items = [
    { id: "ap-1", title: "Aquisição de 20 cadeiras escolares", origin: "Educação", value: "R$ 8.700", deadline: "Hoje, 16:00" },
    { id: "ap-2", title: "Prorrogação de contrato de manutenção", origin: "Infraestrutura", value: "R$ 32.400", deadline: "Amanhã" },
  ];
  function decide(id:string, decision:string) { setDecisions((current)=>({...current,[id]:decision})); notify(`Decisão “${decision}” registrada com data, responsável e trilha de auditoria.`); }
  return <article className="panel approval-center"><header><div><p className="eyebrow">CENTRAL DE DECISÕES</p><h2>Aprovações</h2><p>Solicitações que exigem manifestação formal do perfil atual.</p></div><UserCheck size={20}/></header>{items.map((item)=><div className="approval-row" key={item.id}><span className="approval-icon"><FileCheck2 size={17}/></span><span><strong>{item.title}</strong><small>{item.origin} · {item.value} · prazo {item.deadline}</small></span>{decisions[item.id]?<b className="decision-done"><CheckCircle2 size={13}/>{decisions[item.id]}</b>:<div><button onClick={()=>decide(item.id,"Aprovado")}>Aprovar</button><button onClick={()=>decide(item.id,"Ajuste solicitado")}>Solicitar ajuste</button><button className="reject" onClick={()=>decide(item.id,"Rejeitado")}>Rejeitar</button></div>}</div>)}</article>;
}
