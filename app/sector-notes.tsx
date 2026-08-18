"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  LockKeyhole,
  MessageSquareText,
  NotebookPen,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import { useCurrentPermission } from "./permission-context";
import { persistenceKey, usePersistentState } from "./persistence";

type FlowPriority = "Urgente" | "Alta" | "Média" | "Baixa";
type FlowView = "fluxos" | "anotacoes";

type FlowNote = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

type FlowRecord = {
  id: string;
  title: string;
  summary: string;
  template: string;
  stage: string;
  priority: FlowPriority;
  owner: string;
  restricted: boolean;
  updatedAt: string;
  notes: FlowNote[];
};

type SectorFlowProfile = {
  tone: string;
  title: string;
  description: string;
  policy: string;
  stages: [string, string, string, string];
  templates: [string, string, string, string];
};

export type SectorFlowTeamMember = {
  id: string;
  name: string;
  role: string;
};

type SectorNotesProps = {
  department: string;
  userName: string;
  team: SectorFlowTeamMember[];
  notify: (message: string) => void;
};

const DEFAULT_PROFILE: SectorFlowProfile = {
  tone: "default",
  title: "Fluxo operacional e memória do setor",
  description: "Organize demandas internas, decisões, providências e anotações em uma linha de trabalho rastreável.",
  policy: "Registros internos ficam disponíveis apenas para os perfis autorizados deste setor.",
  stages: ["Recebido", "Em análise", "Em execução", "Concluído"],
  templates: ["Demanda interna", "Registro de reunião", "Providência", "Acompanhamento"],
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function sectorFlowProfile(department: string): SectorFlowProfile {
  const name = normalize(department);
  if (name.includes("saude") || name.includes("sanitaria")) return {
    tone: "health",
    title: "Linha de cuidado e registros técnicos",
    description: "Acompanhe triagens, regulação, campanhas, retornos e providências das unidades de saúde.",
    policy: "Evite dados clínicos identificáveis. Casos sensíveis devem permanecer como registro restrito.",
    stages: ["Entrada", "Triagem", "Em acompanhamento", "Concluído"],
    templates: ["Regulação ou encaminhamento", "Campanha de saúde", "Ocorrência de unidade", "Retorno assistencial"],
  };
  if (name.includes("educacao") || name.includes("escolar")) return {
    tone: "education",
    title: "Fluxo pedagógico e das unidades escolares",
    description: "Registre demandas de escolas, transporte, alimentação, calendário e acompanhamento pedagógico.",
    policy: "Anotações sobre estudantes devem usar o mínimo de dados pessoais necessário.",
    stages: ["Demanda da unidade", "Análise técnica", "Encaminhado", "Respondido"],
    templates: ["Demanda de escola", "Transporte escolar", "Acompanhamento pedagógico", "Calendário e evento"],
  };
  if (name.includes("infraestrutura") || name.includes("obra") || name.includes("transporte")) return {
    tone: "infrastructure",
    title: "Fluxo de obras, manutenção e campo",
    description: "Conecte ocorrências, planejamento, equipes, vistorias e evidências de execução territorial.",
    policy: "Registre local, equipe e evidência de campo; informações pessoais não devem constar nas fotos.",
    stages: ["Ocorrência", "Planejamento", "Equipe em campo", "Entregue"],
    templates: ["Ordem de serviço", "Vistoria técnica", "Manutenção de via", "Operação de transporte"],
  };
  if (name.includes("social")) return {
    tone: "social",
    title: "Fluxo de acolhimento e proteção social",
    description: "Acompanhe acolhimentos, benefícios, encaminhamentos e retornos da rede socioassistencial.",
    policy: "Registros sociais são restritos por padrão e devem evitar exposição de famílias ou indivíduos.",
    stages: ["Acolhimento", "Análise protegida", "Encaminhamento", "Acompanhamento"],
    templates: ["Acolhimento familiar", "Benefício eventual", "Encaminhamento à rede", "Retorno de acompanhamento"],
  };
  if (name.includes("administracao") || name.includes("financa") || name.includes("patrimonio")) return {
    tone: "administration",
    title: "Fluxo administrativo e financeiro",
    description: "Controle solicitações, conferências, autorizações, execução orçamentária e memória decisória.",
    policy: "Valores e decisões devem indicar a fonte ou o processo relacionado para preservar a rastreabilidade.",
    stages: ["Solicitação", "Conferência", "Autorização", "Executado"],
    templates: ["Solicitação administrativa", "Análise financeira", "Aquisição ou contratação", "Registro patrimonial"],
  };
  if (name.includes("controle") || name.includes("vigilancia")) return {
    tone: "control",
    title: "Fluxo de controle, achados e recomendações",
    description: "Organize verificações, evidências, recomendações e monitoramento das providências adotadas.",
    policy: "Achados preliminares e evidências devem permanecer restritos até a validação responsável.",
    stages: ["Achado", "Análise", "Recomendação", "Monitoramento"],
    templates: ["Ponto de controle", "Verificação documental", "Recomendação", "Plano de providências"],
  };
  if (name.includes("comunicacao") || name.includes("cultura") || name.includes("turismo") || name.includes("esporte")) return {
    tone: "communication",
    title: "Fluxo de pautas, produção e agenda pública",
    description: "Acompanhe pautas, peças, eventos, aprovações e publicações dos canais municipais.",
    policy: "Conteúdos só devem ser marcados como publicados depois da aprovação do responsável.",
    stages: ["Pauta", "Em produção", "Aprovação", "Publicado"],
    templates: ["Pauta institucional", "Peça de comunicação", "Evento municipal", "Agenda cultural ou esportiva"],
  };
  if (name.includes("governo") || name.includes("gabinete") || name.includes("prefeito")) return {
    tone: "government",
    title: "Fluxo executivo e memória de decisões",
    description: "Consolide reuniões, deliberações, compromissos e acompanhamentos intersetoriais do Executivo.",
    policy: "Decisões restritas permanecem disponíveis apenas aos perfis com permissão de alteração.",
    stages: ["Recebido", "Em articulação", "Decisão validada", "Comunicado"],
    templates: ["Deliberação executiva", "Registro de reunião", "Compromisso do gabinete", "Acompanhamento intersetorial"],
  };
  if (name.includes("economico") || name.includes("agricultura") || name.includes("ambiente") || name.includes("subprefeitura")) return {
    tone: "territory",
    title: "Fluxo territorial e desenvolvimento local",
    description: "Registre demandas produtivas, ambientais, rurais e comunitárias com retorno ao território.",
    policy: "Localizações sensíveis e dados de produtores devem ser compartilhados somente quando necessários.",
    stages: ["Demanda", "Vistoria ou análise", "Providência", "Retorno realizado"],
    templates: ["Atendimento ao produtor", "Licenciamento ou vistoria", "Ação territorial", "Retorno à comunidade"],
  };
  return DEFAULT_PROFILE;
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `flow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedRecords(profile: SectorFlowProfile, team: SectorFlowTeamMember[], userName: string): FlowRecord[] {
  const owners = team.length ? team.map((member) => member.name) : [userName, "Equipe responsável"];
  const times = ["2026-08-13T14:40:00.000Z", "2026-08-13T12:20:00.000Z", "2026-08-12T17:10:00.000Z"];
  return [
    {
      id: "flow-seed-1", title: profile.templates[0], summary: `Registro prioritário de ${profile.templates[0].toLocaleLowerCase("pt-BR")} para avaliação da equipe.`,
      template: profile.templates[0], stage: profile.stages[1], priority: "Alta", owner: owners[0], restricted: profile.tone === "social" || profile.tone === "control", updatedAt: times[0],
      notes: [{ id: "note-seed-1", text: "Contexto conferido e próximos responsáveis identificados.", author: owners[0], createdAt: times[0] }],
    },
    {
      id: "flow-seed-2", title: profile.templates[1], summary: "Pontos principais registrados para acompanhamento e retorno no próximo alinhamento.",
      template: profile.templates[1], stage: profile.stages[0], priority: "Média", owner: owners[1] ?? owners[0], restricted: false, updatedAt: times[1],
      notes: [{ id: "note-seed-2", text: "Aguardando complementação das informações da área responsável.", author: userName, createdAt: times[1] }],
    },
    {
      id: "flow-seed-3", title: profile.templates[2], summary: "Providência iniciada, com evidências e retorno final ainda pendentes.",
      template: profile.templates[2], stage: profile.stages[2], priority: "Baixa", owner: owners[2] ?? owners[0], restricted: false, updatedAt: times[2],
      notes: [{ id: "note-seed-3", text: "Execução confirmada pela equipe; falta anexar o registro de conclusão.", author: owners[0], createdAt: times[2] }],
    },
  ];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function priorityClass(priority: FlowPriority) {
  return normalize(priority);
}

export function SectorNotesSection({ department, userName, team, notify }: SectorNotesProps) {
  const access = useCurrentPermission();
  const profile = useMemo(() => sectorFlowProfile(department), [department]);
  const storageKey = useMemo(() => persistenceKey("sector-flow", department, "v2"), [department]);
  const initialRecords = useMemo(() => seedRecords(profile, team, userName), [profile, team, userName]);
  const [records, setRecords, saveStatus] = usePersistentState<FlowRecord[]>(storageKey, initialRecords);
  const [view, setView] = useState<FlowView>("fluxos");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<FlowPriority | "Todas">("Todas");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  const term = normalize(query.trim());
  const visibleRecords = records.filter((record) => {
    const matchesPriority = priority === "Todas" || record.priority === priority;
    const matchesTerm = !term || normalize([record.title, record.summary, record.template, record.owner, ...record.notes.map((note) => note.text)].join(" ")).includes(term);
    return matchesPriority && matchesTerm;
  });
  const annotations = visibleRecords.flatMap((record) => record.notes.map((note) => ({ ...note, record }))).sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const completed = records.filter((record) => record.stage === profile.stages[3]).length;
  const restricted = records.filter((record) => record.restricted).length;

  function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!access.register) return;
    const form = new FormData(event.currentTarget);
    const now = new Date().toISOString();
    const record: FlowRecord = {
      id: makeId(),
      title: String(form.get("title") ?? "").trim(),
      summary: String(form.get("summary") ?? "").trim(),
      template: String(form.get("template") ?? profile.templates[0]),
      stage: String(form.get("stage") ?? profile.stages[0]),
      priority: String(form.get("priority") ?? "Média") as FlowPriority,
      owner: String(form.get("owner") ?? userName),
      restricted: form.get("restricted") === "on",
      updatedAt: now,
      notes: [{ id: makeId(), text: "Registro criado no fluxo do setor.", author: userName, createdAt: now }],
    };
    setRecords((current) => [record, ...current]);
    setCreateOpen(false);
    setSelectedId(record.id);
    notify("Registro criado no fluxo e salvo.");
  }

  function moveRecord(record: FlowRecord) {
    if (!access.edit) return;
    const currentStage = profile.stages.indexOf(record.stage as typeof profile.stages[number]);
    const nextStage = profile.stages[Math.min(currentStage + 1, profile.stages.length - 1)];
    if (nextStage === record.stage) { notify("Este registro já está na etapa final."); return; }
    const now = new Date().toISOString();
    setRecords((current) => current.map((item) => item.id === record.id ? {
      ...item,
      stage: nextStage,
      updatedAt: now,
      notes: [...item.notes, { id: makeId(), text: `Etapa alterada para “${nextStage}”.`, author: userName, createdAt: now }],
    } : item));
    notify(`Registro avançado para “${nextStage}”.`);
  }

  function updateRecord(id: string, changes: Partial<Pick<FlowRecord, "stage" | "priority" | "owner" | "restricted">>) {
    if (!access.edit) return;
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...changes, updatedAt: new Date().toISOString() } : record));
  }

  function addNote() {
    if ((!access.register && !access.edit) || !selected || !newNote.trim()) return;
    const now = new Date().toISOString();
    setRecords((current) => current.map((record) => record.id === selected.id ? {
      ...record,
      updatedAt: now,
      notes: [...record.notes, { id: makeId(), text: newNote.trim(), author: userName, createdAt: now }],
    } : record));
    setNewNote("");
    notify("Anotação adicionada ao histórico do registro.");
  }

  return (
    <section className={`sector-notes-shell tone-${profile.tone}`}>
      <article className="sector-notes-hero">
        <span className="sector-notes-hero-icon"><Workflow size={28} /></span>
        <div><p className="eyebrow">FLUXO CONFIGURADO PARA O SETOR</p><h2>{profile.title}</h2><p>{profile.description}</p></div>
        <dl>
          <div><dt>Em fluxo</dt><dd>{records.length - completed}</dd></div>
          <div><dt>Concluídos</dt><dd>{completed}</dd></div>
          <div><dt>Restritos</dt><dd>{restricted}</dd></div>
        </dl>
      </article>

      <div className="sector-notes-policy"><ShieldCheck size={16} /><span><strong>Escopo: {department}</strong><small>{profile.policy}</small></span>{!access.edit && <i>Alterações conforme permissão</i>}</div>
      <small className={`module-sync-banner ${saveStatus}`}>{saveStatus === "salvando" ? "Salvando alterações…" : saveStatus === "offline" ? "Aguardando conexão" : "Fluxos sincronizados"}</small>

      <article className="panel sector-notes-workbench">
        <header className="sector-notes-toolbar">
          <nav aria-label="Alternar visualização">
            <button type="button" className={view === "fluxos" ? "active" : ""} onClick={() => setView("fluxos")}><Workflow size={15} /> Fluxos</button>
            <button type="button" className={view === "anotacoes" ? "active" : ""} onClick={() => setView("anotacoes")}><NotebookPen size={15} /> Anotações <span>{annotations.length}</span></button>
          </nav>
          <label className="sector-notes-search"><Search size={15} /><input aria-label="Buscar nos fluxos e anotações" placeholder="Buscar registro, responsável ou anotação..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label className="sector-notes-filter"><Filter size={14} /><select aria-label="Filtrar por prioridade" value={priority} onChange={(event) => setPriority(event.target.value as FlowPriority | "Todas")}><option>Todas</option><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
          {access.register && <button type="button" className="button primary" onClick={() => setCreateOpen(true)}><Plus size={15} /> Novo registro</button>}
        </header>

        {view === "fluxos" ? (
          <div className="sector-flow-board">
            {profile.stages.map((stage, stageIndex) => {
              const stageRecords = visibleRecords.filter((record) => record.stage === stage);
              return <section className="sector-flow-column" key={stage}>
                <header><span><i className={`stage-dot stage-${stageIndex}`} />{stage}</span><strong>{stageRecords.length}</strong></header>
                <div>
                  {stageRecords.map((record) => <article className="sector-flow-card" key={record.id}>
                    <button type="button" className="flow-card-open" onClick={() => setSelectedId(record.id)}>
                      <span className="flow-card-meta"><i className={`flow-priority ${priorityClass(record.priority)}`}>{record.priority}</i>{record.restricted && <i className="flow-restricted"><LockKeyhole size={10} /> Restrito</i>}</span>
                      <strong>{record.title}</strong><p>{record.summary}</p>
                      <span className="flow-owner"><UserRound size={13} /> {record.owner}</span>
                      <small><MessageSquareText size={12} /> {record.notes.length} {record.notes.length === 1 ? "anotação" : "anotações"} · {formatDateTime(record.updatedAt)}</small>
                    </button>
                    <footer><button type="button" onClick={() => setSelectedId(record.id)}>Abrir histórico <ChevronRight size={13} /></button>{access.edit && stageIndex < profile.stages.length - 1 && <button type="button" className="flow-advance" onClick={() => moveRecord(record)}>Avançar <ArrowRight size={13} /></button>}</footer>
                  </article>)}
                  {!stageRecords.length && <div className="sector-flow-empty"><FileText size={18} /><span>Nenhum registro nesta etapa</span></div>}
                </div>
              </section>;
            })}
          </div>
        ) : (
          <div className="sector-annotation-list">
            {annotations.map((annotation) => <button type="button" key={annotation.id} onClick={() => setSelectedId(annotation.record.id)}>
              <span className="annotation-avatar">{annotation.author.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
              <span><small>{annotation.record.template} · {annotation.record.stage}</small><strong>{annotation.record.title}</strong><p>{annotation.text}</p><i>{annotation.author} · {formatDateTime(annotation.createdAt)}</i></span>
              <ChevronRight size={15} />
            </button>)}
            {!annotations.length && <div className="sector-notes-empty"><NotebookPen size={28} /><strong>Nenhuma anotação encontrada</strong><p>Ajuste a busca ou registre uma nova atualização.</p></div>}
          </div>
        )}
      </article>

      {createOpen && access.register && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}><section className="modal sector-flow-modal" role="dialog" aria-modal="true" aria-labelledby="sector-flow-create-title"><header><div><p className="eyebrow">{department}</p><h2 id="sector-flow-create-title">Novo registro no fluxo</h2></div><button type="button" onClick={() => setCreateOpen(false)} aria-label="Fechar"><X size={18} /></button></header><form onSubmit={createRecord}>
        <label className="field"><span>Modelo do setor *</span><select name="template" required>{profile.templates.map((template) => <option key={template}>{template}</option>)}</select></label>
        <label className="field"><span>Etapa inicial *</span><select name="stage" required>{profile.stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
        <label className="field full"><span>Título *</span><input name="title" required minLength={3} placeholder="Resuma o assunto do registro" autoFocus /></label>
        <label className="field full"><span>Contexto e providência</span><textarea name="summary" placeholder="Descreva o que ocorreu, a decisão esperada e a próxima ação." /></label>
        <label className="field"><span>Prioridade</span><select name="priority" defaultValue="Média"><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
        <label className="field"><span>Responsável</span><select name="owner" defaultValue={team[0]?.name ?? userName}>{team.length ? team.map((member) => <option key={member.id} value={member.name}>{member.name} · {member.role}</option>) : <option>{userName}</option>}</select></label>
        <label className="flow-restricted-field"><input type="checkbox" name="restricted" /><span><LockKeyhole size={15} /><strong>Registro restrito</strong><small>Destacar como conteúdo sensível para perfis autorizados.</small></span></label>
        <p className="ticket-modal-privacy"><ShieldCheck size={14} /> O registro e suas anotações ficam associados a {department} e são sincronizados no armazenamento central.</p>
        <div className="modal-actions"><button type="button" className="button secondary" onClick={() => setCreateOpen(false)}>Cancelar</button><button className="button primary"><Plus size={15} /> Criar registro</button></div>
      </form></section></div>}

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelectedId(null); setNewNote(""); } }}><section className="modal sector-flow-detail" role="dialog" aria-modal="true" aria-labelledby="sector-flow-detail-title"><header><div><p className="eyebrow">{selected.template} · {department}</p><h2 id="sector-flow-detail-title">{selected.title}</h2></div><button type="button" onClick={() => { setSelectedId(null); setNewNote(""); }} aria-label="Fechar"><X size={18} /></button></header>
        <div className="sector-flow-detail-body">
          <div className="flow-detail-summary"><span className={`flow-priority ${priorityClass(selected.priority)}`}>{selected.priority}</span>{selected.restricted && <span className="flow-restricted"><LockKeyhole size={11} /> Restrito</span>}<p>{selected.summary || "Sem contexto adicional registrado."}</p></div>
          <div className="flow-detail-controls">
            <label><span>Etapa</span><select disabled={!access.edit} value={selected.stage} onChange={(event) => updateRecord(selected.id, { stage: event.target.value })}>{profile.stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
            <label><span>Prioridade</span><select disabled={!access.edit} value={selected.priority} onChange={(event) => updateRecord(selected.id, { priority: event.target.value as FlowPriority })}><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
            <label><span>Responsável</span><select disabled={!access.edit} value={selected.owner} onChange={(event) => updateRecord(selected.id, { owner: event.target.value })}>{Array.from(new Set([selected.owner, userName, ...team.map((member) => member.name)])).map((name) => <option key={name}>{name}</option>)}</select></label>
          </div>
          <article className="flow-history"><header><div><h3>Histórico de anotações</h3><p>Memória cronológica das decisões e providências</p></div><span>{selected.notes.length}</span></header><div>{selected.notes.slice().reverse().map((note) => <div key={note.id}><span className="annotation-avatar">{note.author.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><p><strong>{note.author}</strong><span>{note.text}</span><small><Clock3 size={11} /> {formatDateTime(note.createdAt)}</small></p></div>)}</div></article>
          {(access.register || access.edit) ? <div className="flow-note-compose"><label><span>Nova anotação</span><textarea value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="Registre uma decisão, retorno ou próxima providência..." /></label><button type="button" className="button primary" disabled={!newNote.trim()} onClick={addNote}><NotebookPen size={15} /> Adicionar ao histórico</button></div> : <p className="flow-readonly-note"><AlertTriangle size={14} /> Seu perfil pode consultar este histórico, mas não adicionar ou alterar anotações.</p>}
        </div>
        <footer className="sector-flow-detail-footer"><span><CheckCircle2 size={14} /> Última atualização em {formatDateTime(selected.updatedAt)}</span><button type="button" className="button secondary" onClick={() => { setSelectedId(null); setNewNote(""); }}>Fechar</button></footer>
      </section></div>}
    </section>
  );
}
