"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Crown,
  Download,
  Filter,
  Gauge,
  ListTodo,
  Search,
  ShieldCheck,
  Target,
} from "./site-icons";
import {
  INITIAL_GOALS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  type Goal,
  type IntegratedTask,
  type Project,
} from "./integrated-platform";
import { loadCachedPersistentValue, loadPersistentValue } from "./persistence";

export type ExecutiveTicketStatus =
  | "Recebido"
  | "Em análise"
  | "Aguardando aprovação"
  | "Em execução"
  | "Aguardando resposta"
  | "Concluído"
  | "Cancelado";

export type ExecutiveTicket = {
  id: string;
  protocol: string;
  title: string;
  description: string;
  department: string;
  priority: string;
  status: ExecutiveTicketStatus;
  dueDate: string | null;
  assigneeName?: string;
  requester: string;
};

type ExecutiveItem = {
  id: string;
  code: string;
  kind: "Chamado" | "Tarefa";
  title: string;
  description: string;
  department: string;
  priority: string;
  status: string;
  dueAt: string | null;
  owner: string;
};

type PeriodFilter = "Todos" | "Atenção" | "Hoje" | "7 dias";
type SourceFilter = "Todos" | "Chamados" | "Tarefas";

const DAY_MS = 86_400_000;
const TIME_ZONE = "America/Sao_Paulo";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function dueTimestamp(value: string | null) {
  if (!value) return null;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59-03:00` : value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function dueDateKey(value: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateKey(date) : "";
}

function isClosedStatus(status: string) {
  const value = normalize(status);
  return value === "concluido" || value === "cancelado";
}

function isAwaiting(status: string) {
  return normalize(status).includes("aguardando");
}

function priorityLevel(priority: string) {
  const value = normalize(priority);
  if (value === "urgente") return 4;
  if (value === "alta") return 3;
  if (value === "media" || value === "normal") return 2;
  return 1;
}

function priorityClass(priority: string) {
  const value = normalize(priority);
  return value === "media" ? "media" : value;
}

function isUnassigned(item: ExecutiveItem) {
  const owner = normalize(item.owner);
  return !owner || owner.includes("a definir") || owner.includes("nao atribuido");
}

function isOverdue(item: ExecutiveItem, now: Date) {
  const due = dueTimestamp(item.dueAt);
  return due !== null && due < now.getTime();
}

function isDueToday(item: ExecutiveItem, now: Date) {
  return dueDateKey(item.dueAt) === dateKey(now);
}

function isDueWithin(item: ExecutiveItem, now: Date, days: number) {
  const due = dueTimestamp(item.dueAt);
  if (due === null) return false;
  const todayStart = new Date(`${dateKey(now)}T00:00:00-03:00`).getTime();
  return due >= todayStart && due <= todayStart + days * DAY_MS;
}

function itemRisk(item: ExecutiveItem, now: Date) {
  return (isOverdue(item, now) ? 70 : 0)
    + (isDueToday(item, now) ? 25 : 0)
    + priorityLevel(item.priority) * 10
    + (isAwaiting(item.status) ? 12 : 0)
    + (isUnassigned(item) ? 8 : 0);
}

function dueLabel(item: ExecutiveItem, now: Date) {
  const timestamp = dueTimestamp(item.dueAt);
  if (timestamp === null) return "Sem prazo definido";
  if (isOverdue(item, now)) {
    const days = Math.max(1, Math.ceil((now.getTime() - timestamp) / DAY_MS));
    return `Vencido há ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (isDueToday(item, now)) return "Prazo hoje";
  const date = new Date(timestamp);
  return `Prazo ${new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, day: "2-digit", month: "short" }).format(date)}`;
}

function goalNeedsAttention(goal: Goal) {
  return goal.unit === "horas" ? goal.current > goal.target : goal.current < goal.target;
}

function projectNeedsAttention(project: Project, now: Date) {
  if (project.status === "Em risco") return true;
  const due = dueTimestamp(project.dueDate);
  return project.status !== "Concluído" && due !== null && due - now.getTime() <= 30 * DAY_MS && project.progress < 70;
}

function sourceLabel(item: ExecutiveItem) {
  return item.kind === "Chamado" ? item.code : "Tarefa integrada";
}

function uniqueDepartments(values: string[]) {
  const result = new Map<string, string>();
  values.filter(Boolean).forEach((value) => {
    const key = normalize(value);
    if (!result.has(key)) result.set(key, value);
  });
  return [...result.values()].sort((first, second) => first.localeCompare(second, "pt-BR"));
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function ExecutiveCommandCenter({
  tickets,
  departments,
  currentUser,
  onOpenDepartment,
  notify,
}: {
  tickets: ExecutiveTicket[];
  departments: string[];
  currentUser: { fullName: string; role: string };
  onOpenDepartment: (department: string, target: "Chamados" | "Central Integrada") => void;
  notify: (message: string) => void;
}) {
  const [tasks, setTasks] = useState<IntegratedTask[]>(INITIAL_TASKS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [dataStatus, setDataStatus] = useState<"carregando" | "sincronizado" | "offline">("carregando");
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("Todos os setores");
  const [priorityFilter, setPriorityFilter] = useState("Todas as prioridades");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("Todos");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("Todos");
  const [showEmptyDepartments, setShowEmptyDepartments] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function readOnlyLoad<T>(key: string, fallback: T) {
      try {
        const stored = await loadPersistentValue<T>(key);
        return { value: stored ?? loadCachedPersistentValue<T>(key) ?? fallback, offline: false };
      } catch {
        return { value: loadCachedPersistentValue<T>(key) ?? fallback, offline: true };
      }
    }
    void Promise.all([
      readOnlyLoad<IntegratedTask[]>("integrated:tasks:v2", INITIAL_TASKS),
      readOnlyLoad<Project[]>("integrated:projects:v2", INITIAL_PROJECTS),
      readOnlyLoad<Goal[]>("integrated:goals:v2", INITIAL_GOALS),
    ]).then(([taskResult, projectResult, goalResult]) => {
      if (cancelled) return;
      setTasks(taskResult.value);
      setProjects(projectResult.value);
      setGoals(goalResult.value);
      setDataStatus(taskResult.offline || projectResult.offline || goalResult.offline ? "offline" : "sincronizado");
    });
    return () => { cancelled = true; };
  }, []);

  const allItems = useMemo<ExecutiveItem[]>(() => [
    ...tickets.filter((ticket) => !isClosedStatus(ticket.status)).map((ticket) => ({
      id: ticket.id,
      code: ticket.protocol,
      kind: "Chamado" as const,
      title: ticket.title,
      description: ticket.description,
      department: ticket.department,
      priority: ticket.priority,
      status: ticket.status,
      dueAt: ticket.dueDate,
      owner: ticket.assigneeName ?? "Responsável a definir",
    })),
    ...tasks.filter((task) => !isClosedStatus(task.status)).map((task) => ({
      id: task.id,
      code: task.id,
      kind: "Tarefa" as const,
      title: task.title,
      description: task.description,
      department: task.department,
      priority: task.priority,
      status: task.status,
      dueAt: task.dueAt,
      owner: task.assignee,
    })),
  ], [tasks, tickets]);

  const departmentNames = useMemo(() => uniqueDepartments([
    ...departments,
    ...tickets.map((item) => item.department),
    ...tasks.map((item) => item.department),
    ...projects.map((item) => item.department),
    ...goals.map((item) => item.department),
  ]), [departments, goals, projects, tasks, tickets]);

  const filteredItems = useMemo(() => {
    const term = normalize(query);
    return allItems
      .filter((item) => departmentFilter === "Todos os setores" || normalize(item.department) === normalize(departmentFilter))
      .filter((item) => priorityFilter === "Todas as prioridades" || normalize(item.priority) === normalize(priorityFilter))
      .filter((item) => sourceFilter === "Todos" || (sourceFilter === "Chamados" ? item.kind === "Chamado" : item.kind === "Tarefa"))
      .filter((item) => {
        if (periodFilter === "Todos") return true;
        if (periodFilter === "Hoje") return isDueToday(item, now);
        if (periodFilter === "7 dias") return isDueWithin(item, now, 7);
        return isOverdue(item, now) || priorityLevel(item.priority) >= 3 || isAwaiting(item.status);
      })
      .filter((item) => !term || normalize([item.code, item.title, item.description, item.department, item.owner, item.status].join(" ")).includes(term))
      .sort((first, second) => itemRisk(second, now) - itemRisk(first, now));
  }, [allItems, departmentFilter, now, periodFilter, priorityFilter, query, sourceFilter]);

  const overdueItems = allItems.filter((item) => isOverdue(item, now));
  const urgentItems = allItems.filter((item) => normalize(item.priority) === "urgente");
  const approvalItems = allItems.filter((item) => isAwaiting(item.status));
  const unassignedItems = allItems.filter(isUnassigned);
  const goalsInAttention = goals.filter(goalNeedsAttention);
  const projectsInAttention = projects.filter((project) => projectNeedsAttention(project, now));
  const dailyItems = allItems
    .filter((item) => isOverdue(item, now) || isDueToday(item, now))
    .sort((first, second) => itemRisk(second, now) - itemRisk(first, now))
    .slice(0, 6);
  const weeklyItems = allItems
    .filter((item) => !isOverdue(item, now) && !isDueToday(item, now) && isDueWithin(item, now, 7))
    .sort((first, second) => itemRisk(second, now) - itemRisk(first, now))
    .slice(0, 6);

  const sectorCards = departmentNames.map((department) => {
    const openItems = allItems.filter((item) => normalize(item.department) === normalize(department));
    const visibleItems = filteredItems.filter((item) => normalize(item.department) === normalize(department));
    const departmentTickets = tickets.filter((item) => normalize(item.department) === normalize(department));
    const departmentTasks = tasks.filter((item) => normalize(item.department) === normalize(department));
    const totalRecords = departmentTickets.length + departmentTasks.length;
    const completedRecords = departmentTickets.filter((item) => isClosedStatus(item.status)).length + departmentTasks.filter((item) => isClosedStatus(item.status)).length;
    const completion = totalRecords ? Math.round((completedRecords / totalRecords) * 100) : 100;
    const attentionGoals = goalsInAttention.filter((item) => normalize(item.department) === normalize(department)).length;
    const attentionProjects = projectsInAttention.filter((item) => normalize(item.department) === normalize(department)).length;
    return {
      department,
      openItems,
      visibleItems,
      ticketCount: openItems.filter((item) => item.kind === "Chamado").length,
      taskCount: openItems.filter((item) => item.kind === "Tarefa").length,
      criticalCount: openItems.filter((item) => isOverdue(item, now) || priorityLevel(item.priority) >= 3).length,
      approvalCount: openItems.filter((item) => isAwaiting(item.status)).length,
      completion,
      attentionGoals,
      attentionProjects,
    };
  }).filter((card) => {
    if (departmentFilter !== "Todos os setores" && normalize(card.department) !== normalize(departmentFilter)) return false;
    if (!showEmptyDepartments && card.openItems.length === 0 && card.attentionGoals === 0 && card.attentionProjects === 0) return false;
    const hasActiveFilters = Boolean(query.trim()) || priorityFilter !== "Todas as prioridades" || sourceFilter !== "Todos" || periodFilter !== "Todos";
    return !hasActiveFilters || card.visibleItems.length > 0;
  }).sort((first, second) => {
    if (second.criticalCount !== first.criticalCount) return second.criticalCount - first.criticalCount;
    if (second.openItems.length !== first.openItems.length) return second.openItems.length - first.openItems.length;
    return (second.attentionGoals + second.attentionProjects) - (first.attentionGoals + first.attentionProjects);
  });

  const activeSectorCount = departmentNames.filter((department) =>
    allItems.some((item) => normalize(item.department) === normalize(department))
    || goalsInAttention.some((item) => normalize(item.department) === normalize(department))
    || projectsInAttention.some((item) => normalize(item.department) === normalize(department)),
  ).length;
  const topSector = sectorCards[0];
  const syncState = dataStatus === "offline"
    ? "Consulta com dados locais"
    : dataStatus === "carregando"
      ? "Atualizando dados"
      : "Dados sincronizados";

  function exportExecutiveSummary() {
    const header = ["Tipo", "Identificação", "Assunto", "Setor", "Prioridade", "Situação", "Responsável", "Prazo"];
    const rows = filteredItems.map((item) => [item.kind, sourceLabel(item), item.title, item.department, item.priority, item.status, item.owner, item.dueAt ?? ""]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map((value) => escapeCsv(value)).join(";")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `resumo-executivo-${dateKey(now)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Resumo executivo exportado em CSV.");
  }

  function openItem(item: ExecutiveItem) {
    onOpenDepartment(item.department, item.kind === "Chamado" ? "Chamados" : "Central Integrada");
  }

  return <section className="exec-central" aria-label="Central Executiva de pendências municipais">
    <article className="exec-central-hero">
      <div className="exec-central-hero-icon"><Crown size={25} /></div>
      <div className="exec-central-hero-copy">
        <p className="eyebrow">GABINETE EXECUTIVO · VISÃO MUNICIPAL</p>
        <h2>Todas as pendências, em um só lugar</h2>
        <p>Chamados, tarefas, aprovações, prazos e riscos de todos os setores, organizados para decisão do Prefeito e do Vice-Prefeito.</p>
        <div><span><ShieldCheck size={13} /> {currentUser.role} · modo somente consulta</span><span><Clock3 size={13} /> {syncState}</span></div>
      </div>
      <div className="exec-central-hero-actions">
        <button type="button" className="button secondary" onClick={exportExecutiveSummary}><Download size={15} /> Exportar resumo</button>
      </div>
    </article>

    <div className="exec-command-layout-v3">
      <div className="exec-command-main-v3">
        <div className="exec-central-priority-grid">
          <PriorityPanel
            icon={<AlertTriangle size={18} />}
            eyebrow="PRIORIDADES DO DIA"
            title="O que precisa de atenção agora"
            description="Inclui itens vencidos e com prazo hoje."
            items={dailyItems}
            now={now}
            empty="Nenhuma pendência vencida ou com prazo para hoje."
            onOpen={openItem}
          />
          <PriorityPanel
            icon={<CalendarDays size={18} />}
            eyebrow="PRIORIDADES DA SEMANA"
            title="Próximos sete dias"
            description="Prazos futuros que precisam entrar na agenda."
            items={weeklyItems}
            now={now}
            empty="Nenhuma entrega com prazo nos próximos sete dias."
            onOpen={openItem}
          />
        </div>

        <article className="panel exec-central-brief">
          <span><Gauge size={20} /></span>
          <div><small>LEITURA EXECUTIVA</small><strong>{topSector ? `${topSector.department} concentra a maior atenção no recorte atual` : "Nenhum setor possui pendências neste recorte"}</strong><p>{topSector ? `${topSector.openItems.length} item(ns) aberto(s), ${topSector.criticalCount} crítico(s), ${topSector.approvalCount} aguardando decisão e ${topSector.attentionGoals + topSector.attentionProjects} alerta(s) estratégico(s).` : "Altere os filtros ou exiba os setores sem pendências para consultar toda a estrutura municipal."}</p></div>
          {topSector && <button type="button" onClick={() => onOpenDepartment(topSector.department, topSector.ticketCount ? "Chamados" : "Central Integrada")}>Abrir setor <ChevronRight size={14} /></button>}
        </article>
      </div>

      <aside className="exec-central-metrics" aria-label="Resumo de pendências">
        <header><span>Visão executiva</span><h3>Resumo municipal</h3></header>
        <article><span className="blue"><ListTodo size={19} /></span><div><small>Pendências abertas</small><strong>{allItems.length}</strong><p>em {activeSectorCount} {activeSectorCount === 1 ? "setor" : "setores"}</p></div></article>
        <article><span className="red"><AlertTriangle size={19} /></span><div><small>Vencidas</small><strong>{overdueItems.length}</strong><p>exigem reprogramação</p></div></article>
        <article><span className="amber"><Gauge size={19} /></span><div><small>Urgentes</small><strong>{urgentItems.length}</strong><p>prioridade máxima</p></div></article>
        <article><span className="violet"><Clock3 size={19} /></span><div><small>Aguardando decisão</small><strong>{approvalItems.length}</strong><p>aprovações e retornos</p></div></article>
        <article><span className="green"><Target size={19} /></span><div><small>Metas em atenção</small><strong>{goalsInAttention.length}</strong><p>{projectsInAttention.length} projeto(s) em risco</p></div></article>
        <article><span className="slate"><Building2 size={19} /></span><div><small>Sem responsável</small><strong>{unassignedItems.length}</strong><p>aguardam atribuição</p></div></article>
      </aside>
    </div>

    <section className="exec-central-sector-section">
      <header className="exec-central-section-heading">
        <div><p className="eyebrow">VISÃO POR SETOR</p><h2>Pendências separadas por cards</h2><p>Compare volume, criticidade, aprovações, metas e andamento das entregas.</p></div>
        <button type="button" className={showEmptyDepartments ? "active" : ""} onClick={() => setShowEmptyDepartments((current) => !current)}><CheckCircle2 size={14} /> {showEmptyDepartments ? "Ocultar setores sem pendências" : "Mostrar todos os setores"}</button>
      </header>

      <div className="exec-central-filters panel" aria-label="Filtros da Central Executiva">
        <label className="exec-central-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar chamado, tarefa, responsável ou setor..." /></label>
        <label><span>Setor</span><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option>Todos os setores</option>{departmentNames.map((department) => <option key={department}>{department}</option>)}</select></label>
        <label><span>Origem</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}><option>Todos</option><option>Chamados</option><option>Tarefas</option></select></label>
        <label><span>Prioridade</span><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>Todas as prioridades</option><option>Urgente</option><option>Alta</option><option>Média</option><option>Normal</option><option>Baixa</option></select></label>
        <label><span>Prazo</span><select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value as PeriodFilter)}><option>Todos</option><option>Atenção</option><option>Hoje</option><option>7 dias</option></select></label>
        <span className="exec-central-filter-count"><Filter size={13} /> {filteredItems.length} {filteredItems.length === 1 ? "resultado" : "resultados"}</span>
      </div>

      <div className="exec-central-sector-grid">
        {sectorCards.map((card) => <article className={`exec-sector-card ${card.criticalCount ? "has-risk" : ""}`} key={card.department}>
          <header><span className="exec-sector-icon"><Building2 size={17} /></span><div><h3>{card.department}</h3><p>{card.openItems.length ? `${card.openItems.length} pendência(s) em acompanhamento` : card.attentionGoals + card.attentionProjects > 0 ? "Metas ou projetos exigem atenção" : "Sem pendências registradas"}</p></div>{card.criticalCount > 0 && <b>{card.criticalCount} crítica(s)</b>}</header>
          <div className="exec-sector-numbers"><span><strong>{card.ticketCount}</strong><small>Chamados</small></span><span><strong>{card.taskCount}</strong><small>Tarefas</small></span><span><strong>{card.approvalCount}</strong><small>Decisões</small></span></div>
          <div className="exec-sector-progress"><div><span>Conclusão geral</span><strong>{card.completion}%</strong></div><i><b style={{ width: `${card.completion}%` }} /></i></div>
          {(card.attentionGoals > 0 || card.attentionProjects > 0) && <div className="exec-sector-alerts">{card.attentionGoals > 0 && <span><Target size={12} /> {card.attentionGoals} meta(s) abaixo</span>}{card.attentionProjects > 0 && <span><AlertTriangle size={12} /> {card.attentionProjects} projeto(s) em risco</span>}</div>}
          <div className="exec-sector-items">{card.visibleItems.slice(0, 3).map((item) => <button type="button" key={`${item.kind}-${item.id}`} onClick={() => openItem(item)}><span className={priorityClass(item.priority)}>{item.kind === "Chamado" ? <ClipboardList size={13} /> : <ListTodo size={13} />}</span><span><strong>{item.title}</strong><small>{sourceLabel(item)} · {dueLabel(item, now)}</small></span><ChevronRight size={13} /></button>)}{!card.visibleItems.length && <div className="exec-sector-empty"><CheckCircle2 size={17} /><span>{card.attentionGoals + card.attentionProjects > 0 ? "Confira os alertas estratégicos" : "Nenhum item neste filtro"}</span></div>}</div>
          <footer><span>{card.attentionGoals || card.attentionProjects ? "Requer acompanhamento executivo" : card.openItems.length ? "Fluxo setorial em andamento" : "Setor regular"}</span><button type="button" onClick={() => onOpenDepartment(card.department, card.ticketCount ? "Chamados" : "Central Integrada")}>Abrir setor <ArrowRight size={13} /></button></footer>
        </article>)}
      </div>
      {!sectorCards.length && <div className="panel exec-central-empty"><Search size={25} /><strong>Nenhum setor encontrado</strong><p>Revise os filtros ou habilite a exibição dos setores sem pendências.</p></div>}
    </section>

    <section className="panel exec-central-queue">
      <header><div><p className="eyebrow">FILA CONSOLIDADA · SOMENTE CONSULTA</p><h2>Chamados e tarefas que exigem acompanhamento</h2><p>Consulte a situação ou abra o ambiente responsável para visualizar todos os detalhes, sem alterar dados do setor.</p></div><span>{filteredItems.length} em exibição</span></header>
      <div className="exec-central-queue-list">{filteredItems.slice(0, 14).map((item) => <article key={`${item.kind}-${item.id}`} className={isOverdue(item, now) ? "overdue" : ""}>
        <span className={`exec-queue-source ${item.kind === "Chamado" ? "ticket" : "task"}`}>{item.kind === "Chamado" ? <ClipboardList size={15} /> : <ListTodo size={15} />}</span>
        <div className="exec-queue-copy"><div><b className={`exec-priority ${priorityClass(item.priority)}`}>{item.priority}</b><small>{sourceLabel(item)}</small></div><strong>{item.title}</strong><p>{item.department} · {item.owner}</p></div>
        <span className={`exec-queue-due ${isOverdue(item, now) ? "overdue" : isDueToday(item, now) ? "today" : ""}`}><Clock3 size={13} /> {dueLabel(item, now)}</span>
        <span className="exec-queue-status"><ShieldCheck size={12} /> {item.status}</span>
        <button type="button" aria-label={`Abrir ${item.title} no setor responsável`} onClick={() => openItem(item)}><ChevronRight size={16} /></button>
      </article>)}</div>
      {!filteredItems.length && <div className="exec-central-empty inline"><CheckCircle2 size={24} /><strong>Nenhuma pendência neste recorte</strong><p>Os filtros atuais não retornaram chamados ou tarefas abertas.</p></div>}
      {filteredItems.length > 14 && <footer>Exibindo os 14 itens de maior risco. Use os filtros para refinar os {filteredItems.length} resultados.</footer>}
    </section>
  </section>;
}

function PriorityPanel({ icon, eyebrow, title, description, items, now, empty, onOpen }: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  items: ExecutiveItem[];
  now: Date;
  empty: string;
  onOpen: (item: ExecutiveItem) => void;
}) {
  return <article className="panel exec-priority-panel">
    <header><span>{icon}</span><div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3><p>{description}</p></div><b>{items.length}</b></header>
    <div>{items.map((item) => <button type="button" key={`${item.kind}-${item.id}`} onClick={() => onOpen(item)}><span className={`exec-priority-rank ${priorityClass(item.priority)}`}><i /></span><span><strong>{item.title}</strong><small>{item.department} · {sourceLabel(item)}</small></span><em className={isOverdue(item, now) ? "overdue" : ""}>{dueLabel(item, now)}</em><ChevronRight size={13} /></button>)}{!items.length && <div className="exec-priority-empty"><CheckCircle2 size={19} /><p>{empty}</p></div>}</div>
  </article>;
}
