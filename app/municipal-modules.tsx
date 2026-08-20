"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility,
  Archive,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Bus,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileBadge,
  FileCheck2,
  FileClock,
  FileSignature,
  FileText,
  Gauge,
  HardHat,
  HelpCircle,
  Landmark,
  ListChecks,
  LockKeyhole,
  MessageSquareText,
  MapPin,
  MoreHorizontal,
  Plus,
  Pencil,
  Copy,
  Download,
  Save,
  QrCode,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserRound,
  Warehouse,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AddressRegistrationField } from "./municipal-location";
import { useCurrentPermission } from "./permission-context";
import { FieldOperationsPanel } from "./enhanced-features";
import { persistenceKey, usePersistentState } from "./persistence";

type Notify = (message: string) => void;
type CitizenTab = "Protocolos" | "Ouvidoria e e-SIC" | "Carta de serviços" | "Direto ao Prefeito" | "Satisfação";
type ProcessTab = "Processos" | "Despachos e pareceres" | "Documentos e versões" | "Assinaturas";
type ManagementTab = "Frota" | "Patrimônio" | "Almoxarifado" | "Contratos" | "Obras e campo";

type CitizenProtocol = {
  id: string;
  protocol: string;
  subject: string;
  requester: string;
  channel: string;
  kind: string;
  status: string;
  department: string;
  due: string;
  confidential?: boolean;
  neighborhood?: string;
  address?: string;
};

type ServiceItem = {
  title: string;
  department: string;
  deadline: string;
  documents: string;
  channel: string;
};

type PublicCitizenFeedback = {
  id: string;
  protocol: string;
  kind: "Reclamação" | "Elogio" | "Sugestão";
  rating: number;
  subject: string;
  message: string;
  name: string;
  contact: string;
  neighborhood: string;
  anonymous: boolean;
  destination: "Gabinete do Prefeito";
  status: "Novo" | "Em análise" | "Encaminhado" | "Respondido" | "Concluído";
  mayorNote: string;
  citizenResponse?: string;
  forwardedDepartment?: string;
  ai?: { summary: string; category: string; suggestedDepartment: string; urgency: "Baixa" | "Normal" | "Alta" | "Crítica"; urgencyReason: string; tags: string[]; issueKey: string; recommendedAction: string; source: "groq" | "regras" };
  similarProtocols?: string[];
  similarCount?: number;
  attachments?: Array<{ id: string; name: string; contentType: string; size: number; createdAt: string }>;
  resolutionRating?: number | null;
  resolutionNps?: number | null;
  resolutionComment?: string;
  resolutionEvaluatedAt?: string | null;
  history?: Array<{ at: string; action: string; detail: string }>;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
};


type ProcessMovement = {
  id: string;
  action: string;
  fromDepartment: string;
  toDepartment: string;
  actor: string;
  note: string;
  createdAt: string;
};

type ProcessDocument = {
  id: string;
  name: string;
  version: number;
  author: string;
  createdAt: string;
  status: string;
  size?: number;
  attachmentId?: string;
};

type ProcessDispatch = {
  id: string;
  kind: string;
  content: string;
  author: string;
  status: "Rascunho" | "Finalizado";
  createdAt: string;
};

type ProcessSignature = {
  id: string;
  documentName: string;
  signer: string;
  status: "Pendente" | "Assinado";
  code: string;
  createdAt: string;
};

type ProcessItem = {
  id: string;
  protocol: string;
  subject: string;
  interested: string;
  owner: string;
  status: string;
  access: string;
  updated: string;
  originDepartment: string;
  currentDepartment: string;
  priority: "Baixa" | "Normal" | "Alta" | "Urgente";
  dueDate: string;
  processType: string;
  description: string;
  workflowName: string;
  workflowSteps: string[];
  currentStep: number;
  movements: ProcessMovement[];
  documents: ProcessDocument[];
  dispatches: ProcessDispatch[];
  signatures: ProcessSignature[];
};

type ProcessUser = { id: string; fullName: string; department: string; role: string };

type ManagementItem = {
  id: string;
  code: string;
  title: string;
  detail: string;
  owner: string;
  status: string;
  metric: string;
  due: string;
};

const SERVICES: ServiceItem[] = [
  { title: "Manutenção de iluminação pública", department: "Infraestrutura e Transporte", deadline: "Até 7 dias úteis", documents: "Endereço e foto do local", channel: "Digital e presencial" },
  { title: "Solicitação de transporte para tratamento", department: "Saúde", deadline: "Até 3 dias úteis", documents: "Documento pessoal e encaminhamento", channel: "Digital e unidade de saúde" },
  { title: "Matrícula e transferência escolar", department: "Educação", deadline: "Até 5 dias úteis", documents: "Certidão, comprovante e histórico", channel: "Escola ou protocolo digital" },
  { title: "Alvará para evento temporário", department: "Administração e Finanças", deadline: "Até 15 dias úteis", documents: "Requerimento, croqui e documentos", channel: "Protocolo digital" },
];

function normalizeDepartmentName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const DEPARTMENT_ALIASES: Record<string, string[]> = {
  "secretaria de administracao e financas": ["administracao e financas", "secretaria de administracao e financas"],
  "secretaria municipal de desenvolvimento economico agricultura e meio ambiente": ["meio ambiente", "desenvolvimento economico", "agricultura e meio ambiente", "secretaria municipal de desenvolvimento economico agricultura e meio ambiente"],
  "secretaria de infraestrutura e transporte": ["infraestrutura e transporte", "secretaria de infraestrutura e transporte"],
  "secretaria de saude": ["saude", "secretaria de saude"],
  "secretaria de educacao": ["educacao", "secretaria de educacao"],
  "secretaria de desenvolvimento social": ["desenvolvimento social", "secretaria de desenvolvimento social"],
  "secretaria de comunicacao e eventos": ["comunicacao e eventos", "secretaria de comunicacao e eventos"],
  "secretaria de cultura e turismo": ["cultura e turismo", "secretaria de cultura e turismo"],
  "secretaria de governo": ["governo", "secretaria de governo"],
  "controle interno": ["controle interno"],
  "gabinete do prefeito": ["gabinete do prefeito", "gabinete"],
};

function protocolBelongsToDepartment(protocolDepartment: string, activeDepartment: string) {
  const active = normalizeDepartmentName(activeDepartment);
  const protocol = normalizeDepartmentName(protocolDepartment);
  if (active === protocol) return true;
  const aliases = DEPARTMENT_ALIASES[active] ?? [active];
  return aliases.includes(protocol);
}

function serviceBelongsToDepartment(serviceDepartment: string, activeDepartment: string) {
  return protocolBelongsToDepartment(serviceDepartment, activeDepartment);
}

const INITIAL_PROTOCOLS: CitizenProtocol[] = [
  { id: "pc-1", protocol: "PROT-2026-00481", subject: "Lâmpada apagada na Rua das Palmeiras", requester: "Mariana A. Silva", channel: "Portal do cidadão", kind: "Solicitação", status: "Em atendimento", department: "Secretaria de Infraestrutura e Transporte", due: "18 ago. 2026" },
  { id: "pc-2", protocol: "OUV-2026-00139", subject: "Sugestão de ampliação da coleta seletiva", requester: "Carlos Henrique", channel: "Ouvidoria", kind: "Sugestão", status: "Em análise", department: "Meio Ambiente", due: "24 ago. 2026" },
  { id: "pc-3", protocol: "ESIC-2026-00052", subject: "Relação de contratos vigentes em 2026", requester: "Fernanda Moreira", channel: "e-SIC", kind: "Acesso à informação", status: "Aguardando resposta", department: "Administração e Finanças", due: "02 set. 2026" },
  { id: "pc-4", protocol: "DEN-2026-00021", subject: "Relato sigiloso sobre descarte irregular", requester: "Identidade protegida", channel: "Ouvidoria", kind: "Denúncia", status: "Triagem sigilosa", department: "Controle Interno", due: "20 ago. 2026", confidential: true },
];

const PROCESS_WORKFLOWS: Record<string,string[]> = {
  "Fluxo administrativo": ["Autuação", "Triagem", "Análise do setor", "Despacho", "Validação", "Concluído"],
  "Contratação pública": ["Autuação", "Termo de referência", "Pesquisa de preços", "Análise jurídica", "Empenho", "Assinatura", "Concluído"],
  "Convênio e parceria": ["Autuação", "Análise técnica", "Documentação", "Parecer jurídico", "Assinatura", "Publicação", "Concluído"],
  "Apuração interna": ["Autuação", "Instrução", "Manifestação", "Análise", "Decisão", "Concluído"],
};

const INITIAL_PROCESSES: ProcessItem[] = [
  {
    id: "pr-1", protocol: "PA-2026-00128", subject: "Contratação emergencial de manutenção elétrica", interested: "Secretaria de Governo", owner: "Jaime de Souza", status: "Parecer jurídico", access: "Interno", updated: "Hoje, 11:42",
    originDepartment: "Secretaria de Governo", currentDepartment: "Secretaria de Administração e Finanças", priority: "Urgente", dueDate: "2026-08-20", processType: "Contratação", description: "Contratação emergencial para manutenção elétrica de prédios e equipamentos municipais.", workflowName: "Contratação pública", workflowSteps: PROCESS_WORKFLOWS["Contratação pública"], currentStep: 3,
    movements: [
      { id: "mov-1", action: "Encaminhado para parecer jurídico", fromDepartment: "Secretaria de Administração e Finanças", toDepartment: "Jurídico", actor: "Jaime de Souza", note: "Analisar minuta e requisitos legais.", createdAt: "Hoje, 11:42" },
      { id: "mov-2", action: "Documentos complementares juntados", fromDepartment: "Secretaria de Governo", toDepartment: "Secretaria de Administração e Finanças", actor: "Mariana Castro", note: "Pesquisa de preços e justificativa anexadas.", createdAt: "Hoje, 09:18" },
      { id: "mov-3", action: "Processo autuado", fromDepartment: "Secretaria de Governo", toDepartment: "Secretaria de Governo", actor: "Ana Paula", note: "Abertura do processo administrativo.", createdAt: "11 ago., 14:05" },
    ],
    documents: [
      { id: "doc-p1-1", name: "Termo de referência.pdf", version: 3, author: "Jaime de Souza", createdAt: "Hoje, 10:21", status: "Vigente" },
      { id: "doc-p1-2", name: "Pesquisa de preços.xlsx", version: 2, author: "Mariana Castro", createdAt: "12 ago., 16:08", status: "Vigente" },
    ],
    dispatches: [{ id: "des-p1-1", kind: "Despacho de encaminhamento", content: "Encaminhe-se o presente processo ao setor jurídico para análise e manifestação.", author: "Jaime de Souza", status: "Finalizado", createdAt: "Hoje, 11:42" }],
    signatures: [{ id: "sig-p1-1", documentName: "Termo de referência.pdf", signer: "Jaime de Souza", status: "Assinado", code: "8AF3-26B1-9C04", createdAt: "Hoje, 10:30" }],
  },
  {
    id: "pr-2", protocol: "PA-2026-00119", subject: "Termo de cooperação para feira do produtor", interested: "Associação dos Produtores", owner: "Lucas Fontinelli", status: "Aguardando assinatura", access: "Público", updated: "Hoje, 09:18",
    originDepartment: "Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente", currentDepartment: "Gabinete do Prefeito", priority: "Alta", dueDate: "2026-08-25", processType: "Convênio", description: "Formalização de cooperação para realização e apoio institucional à feira municipal do produtor.", workflowName: "Convênio e parceria", workflowSteps: PROCESS_WORKFLOWS["Convênio e parceria"], currentStep: 4,
    movements: [{ id: "mov-p2-1", action: "Enviado para assinatura", fromDepartment: "Jurídico", toDepartment: "Gabinete do Prefeito", actor: "Lucas Fontinelli", note: "Minuta validada juridicamente.", createdAt: "Hoje, 09:18" }],
    documents: [{ id: "doc-p2-1", name: "Termo de cooperação.pdf", version: 2, author: "Lucas Fontinelli", createdAt: "Hoje, 08:54", status: "Vigente" }],
    dispatches: [], signatures: [{ id: "sig-p2-1", documentName: "Termo de cooperação.pdf", signer: "Prefeito Municipal", status: "Pendente", code: "72BC-181A-9920", createdAt: "Hoje, 09:18" }],
  },
  {
    id: "pr-3", protocol: "PA-2026-00098", subject: "Aquisição de kits escolares", interested: "Secretaria de Educação", owner: "Leila Cibeli", status: "Análise financeira", access: "Interno", updated: "12 ago., 16:25",
    originDepartment: "Secretaria de Educação", currentDepartment: "Secretaria de Administração e Finanças", priority: "Alta", dueDate: "2026-08-28", processType: "Contratação", description: "Aquisição de kits escolares para distribuição na rede municipal de ensino.", workflowName: "Contratação pública", workflowSteps: PROCESS_WORKFLOWS["Contratação pública"], currentStep: 2,
    movements: [{ id: "mov-p3-1", action: "Encaminhado para análise financeira", fromDepartment: "Secretaria de Educação", toDepartment: "Secretaria de Administração e Finanças", actor: "Leila Cibeli", note: "Verificar disponibilidade orçamentária.", createdAt: "12 ago., 16:25" }],
    documents: [{ id: "doc-p3-1", name: "Relação de kits.xlsx", version: 1, author: "Leila Cibeli", createdAt: "12 ago., 15:50", status: "Vigente" }],
    dispatches: [], signatures: [],
  },
  {
    id: "pr-4", protocol: "PA-2026-00074", subject: "Renovação do convênio de atendimento regional", interested: "Secretaria de Saúde", owner: "Natália Pedrosa", status: "Concluído", access: "Público", updated: "10 ago., 14:10",
    originDepartment: "Secretaria de Saúde", currentDepartment: "Secretaria de Saúde", priority: "Normal", dueDate: "2026-08-10", processType: "Convênio", description: "Renovação do convênio de atendimento hospitalar regional.", workflowName: "Convênio e parceria", workflowSteps: PROCESS_WORKFLOWS["Convênio e parceria"], currentStep: 6,
    movements: [{ id: "mov-p4-1", action: "Processo concluído", fromDepartment: "Gabinete do Prefeito", toDepartment: "Secretaria de Saúde", actor: "Natália Pedrosa", note: "Convênio assinado e publicado.", createdAt: "10 ago., 14:10" }],
    documents: [{ id: "doc-p4-1", name: "Convênio assinado.pdf", version: 1, author: "Natália Pedrosa", createdAt: "10 ago., 13:55", status: "Vigente" }],
    dispatches: [{ id: "des-p4-1", kind: "Decisão administrativa", content: "Aprovo a renovação do convênio nos termos constantes dos autos.", author: "Gabinete do Prefeito", status: "Finalizado", createdAt: "10 ago., 13:40" }],
    signatures: [{ id: "sig-p4-1", documentName: "Convênio assinado.pdf", signer: "Prefeito Municipal", status: "Assinado", code: "C91D-20A8-4F71", createdAt: "10 ago., 13:50" }],
  },
];

const MANAGEMENT_DATA: Record<ManagementTab, ManagementItem[]> = {
  Frota: [
    { id: "f-1", code: "PVE-2041", title: "Fiat Strada — Obras", detail: "45.820 km · Licenciamento 2026 regular", owner: "Carlos Almeida", status: "Disponível", metric: "Próxima revisão em 2.180 km", due: "30 set. 2026" },
    { id: "f-2", code: "QXR-8A17", title: "Micro-ônibus — Saúde", detail: "82.460 km · Rota de tratamento regional", owner: "Marcos Vinícius", status: "Em rota", metric: "Consumo médio 7,8 km/l", due: "Revisão 21 ago." },
    { id: "f-3", code: "RTA-3C92", title: "Caminhão compactador", detail: "5.284 horas · Seguro válido", owner: "Equipe de Limpeza", status: "Manutenção", metric: "Ordem OS-2026-187", due: "Previsão 16 ago." },
  ],
  Patrimônio: [
    { id: "p-1", code: "PAT-018723", title: "Notebook Dell Latitude 5440", detail: "Gabinete · Sala 03 · Estado: bom", owner: "Artur Fagundes", status: "Em uso", metric: "Inventariado em jul. 2026", due: "Garantia até 2028" },
    { id: "p-2", code: "PAT-015804", title: "Projetor Epson PowerLite", detail: "Auditório municipal · Estado: regular", owner: "Comunicação e Eventos", status: "Em uso", metric: "Manutenção preventiva pendente", due: "23 ago. 2026" },
    { id: "p-3", code: "PAT-009421", title: "Arquivo de aço com 4 gavetas", detail: "Administração · Arquivo central", owner: "Seção de Patrimônio", status: "Transferência", metric: "Destino: Almoxarifado", due: "15 ago. 2026" },
  ],
  Almoxarifado: [
    { id: "a-1", code: "MAT-00031", title: "Papel A4 — caixa com 10 resmas", detail: "Saldo atual: 18 caixas · Mínimo: 20", owner: "Almoxarifado Central", status: "Estoque baixo", metric: "Consumo mensal: 32 caixas", due: "Reposição solicitada" },
    { id: "a-2", code: "MAT-00148", title: "Toner HP 58A", detail: "Saldo atual: 12 unidades · Mínimo: 8", owner: "Tecnologia da Informação", status: "Regular", metric: "Última saída: 12 ago.", due: "Sem pendência" },
    { id: "a-3", code: "MAT-00302", title: "Luvas nitrílicas — caixa", detail: "Saldo atual: 45 caixas · Lote 26L08", owner: "Vigilância Sanitária", status: "Regular", metric: "Validade: jan. 2028", due: "Inventário 30 ago." },
  ],
  Contratos: [
    { id: "c-1", code: "CT-2026-041", title: "Manutenção da iluminação pública", detail: "Luz & Cidade Serviços Ltda. · Fiscal: Bruno Fonseca", owner: "Infraestrutura e Transporte", status: "Vigente", metric: "R$ 384.000,00 · 62% executado", due: "Vence 30 nov. 2026" },
    { id: "c-2", code: "CT-2025-117", title: "Licenciamento de sistemas administrativos", detail: "Sistemas Públicos Brasil · Fiscal: Jaime de Souza", owner: "Administração e Finanças", status: "Renovação", metric: "R$ 148.500,00 anuais", due: "Vence 18 set. 2026" },
    { id: "c-3", code: "CV-2026-009", title: "Convênio de atendimento hospitalar", detail: "Consórcio Intermunicipal de Saúde", owner: "Secretaria de Saúde", status: "Vigente", metric: "3ª prestação de contas em análise", due: "Parcela em 25 ago." },
  ],
  "Obras e campo": [
    { id: "o-1", code: "OB-2026-014", title: "Revitalização da Praça Central", detail: "Praça Central · Coordenadas registradas · 48 fotos", owner: "Alan Kelve", status: "Em execução", metric: "68% concluído · R$ 492 mil", due: "Previsão 30 set." },
    { id: "o-2", code: "OS-2026-392", title: "Recuperação de drenagem pluvial", detail: "Bairro Planalto · Equipe de 6 servidores", owner: "Departamento de Obras", status: "Vistoria", metric: "Laudo fotográfico anexado", due: "Início 19 ago." },
    { id: "o-3", code: "OB-2026-007", title: "Reforma da UBS Norte", detail: "Av. Adelino Aguiar · Medição nº 04", owner: "Fiscalização de Obras", status: "Medição", metric: "42% concluído · Sem atraso", due: "Previsão 15 dez." },
  ],
};

const MANAGEMENT_SECTOR_BY_ID: Record<string, string> = {
  "f-1": "Secretaria de Infraestrutura e Transporte",
  "f-2": "Secretaria de Saúde",
  "f-3": "Departamento de Execução de Obras",
  "p-1": "Secretaria de Governo",
  "p-2": "Secretaria de Comunicação e Eventos",
  "p-3": "Secretaria de Administração e Finanças",
  "a-1": "Secretaria de Administração e Finanças",
  "a-2": "Secretaria de Administração e Finanças",
  "a-3": "Departamento de Vigilância Sanitária",
  "c-1": "Secretaria de Infraestrutura e Transporte",
  "c-2": "Secretaria de Administração e Finanças",
  "c-3": "Secretaria de Saúde",
  "o-1": "Secretaria de Infraestrutura e Transporte",
  "o-2": "Departamento de Execução de Obras",
  "o-3": "Secretaria de Saúde",
};

function managementItemBelongsToDepartment(item: ManagementItem, department: string) {
  const seededDepartment = MANAGEMENT_SECTOR_BY_ID[item.id];
  return !seededDepartment || normalizeDepartmentName(seededDepartment) === normalizeDepartmentName(department);
}

const TAB_ICON: Record<ManagementTab, LucideIcon> = {
  Frota: Bus,
  Patrimônio: Archive,
  Almoxarifado: Warehouse,
  Contratos: BriefcaseBusiness,
  "Obras e campo": HardHat,
};

function makeLocalId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}`;
}

function StatusTag({ children }: { children: string }) {
  const normalized = children.toLowerCase();
  const tone = normalized.includes("conclu") || normalized.includes("regular") || normalized.includes("vigente") || normalized.includes("disponível") ? "success"
    : normalized.includes("aguard") || normalized.includes("baixo") || normalized.includes("renova") || normalized.includes("vistoria") ? "warning"
      : normalized.includes("sigil") || normalized.includes("manutenção") ? "danger" : "info";
  return <span className={`municipal-status ${tone}`}>{children}</span>;
}

function ModalShell({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="modal municipal-modal" role="dialog" aria-modal="true" aria-labelledby="municipal-modal-title">
        <header><div><p className="eyebrow">{eyebrow}</p><h2 id="municipal-modal-title">{title}</h2></div><button type="button" aria-label="Fechar" onClick={onClose}><X size={18} /></button></header>
        {children}
      </section>
    </div>
  );
}

function MayorCitizenInbox({ notify, departments }: { notify: Notify; departments: string[] }) {
  const [items, setItems] = useState<PublicCitizenFeedback[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [note, setNote] = useState("");
  const [citizenResponse, setCitizenResponse] = useState("");
  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/citizen-feedback", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as { feedback?: PublicCitizenFeedback[]; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Não foi possível carregar as manifestações.");
      setItems(payload?.feedback ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as manifestações.");
    } finally { if (!silent) setLoading(false); }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void load(true); }, 20000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { setNote(selected?.mayorNote ?? ""); setCitizenResponse(selected?.citizenResponse ?? ""); }, [selectedId, selected?.mayorNote, selected?.citizenResponse]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesQuery = !query.trim() || [item.protocol, item.subject, item.message, item.name, item.neighborhood, item.kind].join(" ").toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = status === "Todos" || item.status === status;
    return matchesQuery && matchesStatus;
  }), [items, query, status]);

  async function updateItem(item: PublicCitizenFeedback, changes: { status?: PublicCitizenFeedback["status"]; mayorNote?: string; citizenResponse?: string; forwardedDepartment?: string; markRead?: boolean }, message?: string) {
    try {
      const response = await fetch("/api/citizen-feedback", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, ...changes }) });
      const payload = await response.json().catch(() => null) as { feedback?: PublicCitizenFeedback; error?: string } | null;
      if (!response.ok || !payload?.feedback) throw new Error(payload?.error || "Não foi possível atualizar a manifestação.");
      setItems((current) => current.map((entry) => entry.id === item.id ? payload.feedback! : entry));
      if (message) notify(message);
    } catch (updateError) { notify(updateError instanceof Error ? updateError.message : "Não foi possível atualizar a manifestação."); }
  }

  function openItem(item: PublicCitizenFeedback) {
    setSelectedId(item.id);
    if (!item.readAt) void updateItem(item, { markRead: true });
  }

  const unread = items.filter((item) => !item.readAt).length;
  const complaints = items.filter((item) => item.kind === "Reclamação").length;
  const average = items.length ? (items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(1) : "—";

  return <div className="mayor-feedback-shell">
    <div className="municipal-kpis">
      <MetricCard icon={MessageSquareText} label="Direto ao Prefeito" value={String(items.length)} detail="Manifestações recebidas pelo portal público" tone="teal" />
      <MetricCard icon={Clock3} label="Não lidas" value={String(unread)} detail="Aguardando abertura pelo Gabinete" tone="amber" />
      <MetricCard icon={Star} label="Satisfação média" value={average} detail="Nota de 1 a 5 no canal público" tone="blue" />
      <MetricCard icon={Landmark} label="Reclamações" value={String(complaints)} detail="Itens que podem exigir encaminhamento" tone="violet" />
    </div>
    <div className="mayor-feedback-layout">
      <article className="panel mayor-feedback-list">
        <header><div><p className="eyebrow">CAIXA DO GABINETE</p><h2>Manifestações do cidadão</h2><p>Atualização automática a cada 20 segundos.</p></div><button className="button secondary" onClick={() => void load()}><Search size={14} /> Atualizar</button></header>
        <div className="module-toolbar"><label className="module-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar protocolo, assunto ou cidadão..." /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option>Novo</option><option>Em análise</option><option>Encaminhado</option><option>Respondido</option><option>Concluído</option></select></div>
        {loading ? <div className="citizen-sector-empty"><Clock3 size={22} /><strong>Carregando manifestações...</strong></div> : error ? <div className="citizen-sector-empty"><MessageSquareText size={22} /><strong>Não foi possível conectar ao canal público</strong><p>{error}</p></div> : <div className="mayor-feedback-items">{filtered.map((item) => <button key={item.id} className={`${selectedId === item.id ? "active" : ""} ${!item.readAt ? "unread" : ""}`} onClick={() => openItem(item)}><span className="mayor-feedback-kind">{item.kind}</span><span><strong>{item.subject}</strong><small>{item.protocol} · {new Date(item.createdAt).toLocaleString("pt-BR")} · {item.rating}/5 ★</small></span><StatusTag>{item.status}</StatusTag></button>)}{!filtered.length && <div className="citizen-sector-empty compact"><MessageSquareText size={20} /><strong>Nenhuma manifestação encontrada</strong><p>Os registros enviados pela página pública aparecerão aqui automaticamente.</p></div>}</div>}
      </article>
      <article className="panel mayor-feedback-detail">
        {selected ? <><header><div><p className="eyebrow">{selected.protocol}</p><h2>{selected.subject}</h2><p>{selected.kind} · avaliação {selected.rating}/5</p></div><StatusTag>{selected.status}</StatusTag></header>
          <div className="mayor-feedback-citizen"><span><UserRound size={17} /></span><div><strong>{selected.name}</strong><small>{selected.anonymous ? "Manifestação anônima" : selected.contact || "Sem contato informado"}{selected.neighborhood ? ` · ${selected.neighborhood}` : ""}</small></div></div>
          <div className="mayor-feedback-message"><p>{selected.message}</p><small>Recebido em {new Date(selected.createdAt).toLocaleString("pt-BR")} · destino automático: {selected.destination}</small></div>
          {!!selected.attachments?.length && <section className="mayor-feedback-attachments"><strong>Anexos do cidadão</strong><div>{selected.attachments.map((attachment) => <a key={attachment.id} href={`/api/citizen-feedback-attachment?feedbackId=${encodeURIComponent(selected.id)}&attachmentId=${encodeURIComponent(attachment.id)}`} target="_blank" rel="noreferrer"><FileText size={14} /><span>{attachment.name}<small>{Math.max(1, Math.round(attachment.size / 1024))} KB</small></span><Download size={13} /></a>)}</div></section>}
          {selected.ai && <section className={`mayor-ai-triage ${selected.ai.urgency.toLowerCase().replace("í", "i")}`}><div className="mayor-ai-heading"><span>IA</span><div><strong>Triagem inteligente</strong><small>{selected.ai.source === "groq" ? "Análise pela Groq · requer validação humana" : "Contingência por regras · requer validação humana"}</small></div><b>{selected.ai.urgency}</b></div><p>{selected.ai.summary}</p><dl><div><dt>Categoria</dt><dd>{selected.ai.category}</dd></div><div><dt>Setor sugerido</dt><dd>{selected.ai.suggestedDepartment}</dd></div><div><dt>Motivo da prioridade</dt><dd>{selected.ai.urgencyReason}</dd></div><div><dt>Ação sugerida</dt><dd>{selected.ai.recommendedAction}</dd></div></dl>{!!selected.ai.tags?.length && <div className="mayor-ai-tags">{selected.ai.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}{Boolean(selected.similarCount) && <div className="mayor-ai-similar"><strong>{selected.similarCount} demanda(s) semelhante(s) identificada(s)</strong><small>{selected.similarProtocols?.join(" · ")}</small></div>}</section>}
          {selected.resolutionEvaluatedAt && <section className="mayor-resolution-rating"><strong>Avaliação após a solução</strong><div><span>{selected.resolutionRating ?? "—"}/5 ★</span><span>NPS {selected.resolutionNps ?? "—"}/10</span></div>{selected.resolutionComment && <p>{selected.resolutionComment}</p>}</section>}
          {!!selected.history?.length && <div className="mayor-feedback-history"><strong>Histórico do protocolo</strong>{[...selected.history].reverse().slice(0,8).map((entry, index) => <div key={`${entry.at}-${index}`}><span /><p><b>{entry.action}</b><small>{entry.detail} · {new Date(entry.at).toLocaleString("pt-BR")}</small></p></div>)}</div>}
          <label className="field"><span>Status do atendimento</span><select value={selected.status} onChange={(event) => void updateItem(selected, { status: event.target.value as PublicCitizenFeedback["status"] }, "Status da manifestação atualizado.")}><option>Novo</option><option>Em análise</option><option>Encaminhado</option><option>Respondido</option><option>Concluído</option></select></label>
          <label className="field"><span>Encaminhar para setor</span><select value={selected.forwardedDepartment ?? ""} onChange={(event) => { const target = event.target.value; void updateItem(selected, { forwardedDepartment: target, status: target ? "Encaminhado" : selected.status }, target ? `Manifestação encaminhada para ${target}.` : "Encaminhamento removido."); }}><option value="">Manter somente no Gabinete</option>{departments.filter((item) => item !== "Gabinete do Prefeito").map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Anotação interna do Gabinete</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Visível apenas internamente. Registre providências, contatos e decisões." /></label>
          <label className="field public-response-field"><span>Resposta oficial ao cidadão</span><textarea value={citizenResponse} onChange={(event) => setCitizenResponse(event.target.value)} placeholder="Esta resposta ficará disponível para o cidadão em /acompanhar." /></label>
          <div className="mayor-feedback-actions"><button className="button secondary" onClick={() => void updateItem(selected, { mayorNote: note }, "Anotação interna salva.")}><Save size={14} /> Salvar anotação</button><button className="button secondary" onClick={() => void updateItem(selected, { citizenResponse, status: citizenResponse.trim() ? "Respondido" : selected.status }, "Resposta oficial salva para acompanhamento do cidadão.")}><MessageSquareText size={14} /> Publicar resposta</button><button className="button primary" onClick={() => void updateItem(selected, { status: "Concluído", mayorNote: note, citizenResponse, markRead: true }, "Manifestação concluída. O cidadão já pode avaliar a solução.")}><CheckCircle2 size={14} /> Concluir</button></div>
        </> : <div className="citizen-sector-empty"><Landmark size={26} /><strong>Selecione uma manifestação</strong><p>Abra um item da caixa do Gabinete para ler o relato, registrar providências e atualizar o status.</p></div>}
      </article>
    </div>
  </div>;
}

export function CitizenServiceSection({ department, notify, isMayor = false, departments = [] }: { department: string; notify: Notify; isMayor?: boolean; departments?: string[] }) {
  const access = useCurrentPermission();
  const [tab, setTab] = useState<CitizenTab>(isMayor ? "Direto ao Prefeito" : "Protocolos");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const initialProtocolsForDepartment = useMemo(() => INITIAL_PROTOCOLS.filter((item) => protocolBelongsToDepartment(item.department, department)), [department]);
  const [protocols, setProtocols, protocolSaveStatus] = usePersistentState<CitizenProtocol[]>(persistenceKey("citizen-protocols", department, "v1"), initialProtocolsForDepartment);
  const [modal, setModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [serviceNeighborhood, setServiceNeighborhood] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");

  useEffect(() => { setTab(isMayor ? "Direto ao Prefeito" : "Protocolos"); }, [isMayor]);

  const sectorProtocols = useMemo(() => protocols.filter((item) => protocolBelongsToDepartment(item.department, department)), [protocols, department]);
  const visible = useMemo(() => sectorProtocols.filter((item) => {
    const matchesQuery = [item.protocol, item.subject, item.requester, item.kind, item.department].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "Todos os status" || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [sectorProtocols, query, statusFilter]);
  const ombudsmanItems = useMemo(() => sectorProtocols.filter((item) => item.channel === "Ouvidoria" || ["Reclamação", "Sugestão", "Elogio", "Denúncia"].includes(item.kind)), [sectorProtocols]);
  const esicItems = useMemo(() => sectorProtocols.filter((item) => item.kind === "Acesso à informação" || item.channel === "e-SIC"), [sectorProtocols]);
  const sectorServices = useMemo(() => SERVICES.filter((service) => serviceBelongsToDepartment(service.department, department)), [department]);


  function createProtocol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kind = String(form.get("kind"));
    const prefix = kind === "Acesso à informação" ? "ESIC" : kind === "Denúncia" ? "DEN" : kind === "Reclamação" ? "OUV" : "PROT";
    const item: CitizenProtocol = {
      id: makeLocalId(), protocol: `${prefix}-2026-${String(protocols.length + 482).padStart(5, "0")}`,
      subject: String(form.get("subject")), requester: String(form.get("requester")) || "Cidadão não identificado",
      channel: "Atendimento interno", kind, status: kind === "Denúncia" ? "Triagem sigilosa" : "Recebido",
      department, due: "Prazo calculado após triagem", confidential: Boolean(form.get("confidential")),
    };
    setProtocols((current) => [item, ...current]);
    setModal(false);
    notify(`Protocolo ${item.protocol} registrado e encaminhado para triagem.`);
  }

  function createServiceRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService) return;
    const form = new FormData(event.currentTarget);
    const item: CitizenProtocol = {
      id: makeLocalId(), protocol: `SERV-2026-${String(protocols.length + 482).padStart(5, "0")}`,
      subject: selectedService.title, requester: String(form.get("requester")) || "Solicitante não identificado",
      channel: "Carta de serviços digital", kind: "Serviço", status: "Recebido", department,
      due: selectedService.deadline, neighborhood: serviceNeighborhood, address: serviceAddress,
    };
    setProtocols((current) => [item, ...current]);
    setSelectedService(null);
    setServiceNeighborhood("");
    setServiceAddress("");
    setTab("Protocolos");
    notify(`${item.protocol} registrado para ${serviceNeighborhood}. O endereço foi registrado no protocolo.`);
  }

  return (
    <section className="municipal-module-shell">
      <small className={`module-sync-banner ${protocolSaveStatus}`}>{protocolSaveStatus === "salvando" ? "Salvando alterações…" : protocolSaveStatus === "offline" ? "Aguardando conexão com o servidor" : "Dados sincronizados"}</small>
      <div className="module-tabs wide-tabs" role="tablist" aria-label="Módulos de atendimento ao cidadão">
        {(["Protocolos", "Ouvidoria e e-SIC", "Carta de serviços", ...(isMayor ? ["Direto ao Prefeito" as CitizenTab] : []), "Satisfação"] as CitizenTab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      {tab === "Protocolos" && <>
        <div className="municipal-kpis">
          <MetricCard icon={FileBadge} label="Protocolos do setor" value={String(sectorProtocols.length)} detail={`Somente ${department}`} tone="teal" />
          <MetricCard icon={Clock3} label="Em atendimento" value={String(sectorProtocols.filter((item) => ["Recebido", "Em atendimento", "Em análise", "Aguardando resposta", "Triagem sigilosa"].includes(item.status)).length)} detail="Registros ainda em andamento" tone="blue" />
          <MetricCard icon={MessageSquareText} label="Ouvidorias" value={String(ombudsmanItems.length)} detail="Manifestações vinculadas ao setor" tone="amber" />
          <MetricCard icon={CheckCircle2} label="Concluídos" value={String(sectorProtocols.filter((item) => item.status === "Concluído").length)} detail="Registros finalizados deste setor" tone="green" />
        </div>
        <article className="panel municipal-table-panel">
          <div className="module-toolbar"><label className="module-search"><Search size={15} /><input aria-label="Buscar protocolo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar protocolo, cidadão ou assunto..." /></label><select aria-label="Filtrar protocolos" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos os status</option><option>Recebido</option><option>Em atendimento</option><option>Em análise</option><option>Aguardando resposta</option><option>Triagem sigilosa</option><option>Concluído</option></select><span className="citizen-sector-scope"><ShieldCheck size={13} />{department}</span>{access.register && <button className="button primary" onClick={() => setModal(true)}><Plus size={15} /> Novo protocolo</button>}</div>
          <div className="municipal-data-table citizen-table"><div className="municipal-table-row municipal-table-head"><span>Protocolo e assunto</span><span>Solicitante</span><span>Tipo</span><span>Setor responsável</span><span>Prazo</span><span>Status</span></div>{visible.map((item) => <button className="municipal-table-row" key={item.id} onClick={() => notify(`Ficha ${item.protocol} aberta: acompanhamento restrito ao setor ${department}.`)}><span><strong>{item.subject}</strong><small>{item.protocol} · {item.channel}</small></span><span>{item.requester}</span><span>{item.confidential && <LockKeyhole size={12} />} {item.kind}</span><span>{item.department}</span><span>{item.due}</span><StatusTag>{item.status}</StatusTag></button>)}{visible.length === 0 && <div className="citizen-sector-empty"><MessageSquareText size={22} /><strong>Nenhum protocolo deste setor</strong><p>Não há registros de Atendimento ao Cidadão vinculados a {department} com os filtros atuais.</p></div>}</div>
        </article>
      </>}

      {tab === "Ouvidoria e e-SIC" && <>
        <div className="citizen-sector-heading"><div><p className="eyebrow">RECORTE SETORIAL</p><h2>Ouvidoria de {department}</h2><p>Esta tela exibe exclusivamente manifestações e pedidos de informação vinculados ao setor ativo.</p></div><span><ShieldCheck size={14} />Visibilidade restrita ao setor</span></div>
        <div className="citizen-feature-grid">
          <FeaturePanel icon={MessageSquareText} title="Ouvidoria municipal" description="Receba solicitações, reclamações, sugestões, elogios e denúncias, com classificação e encaminhamento controlados." items={["Identificação sigilosa ou manifestação anônima", "Prazos e resposta conclusiva", "Encaminhamento entre unidades", "Relatórios por assunto e canal"]} action={access.register ? "Registrar manifestação" : "Consultar orientações"} onAction={() => access.register ? setModal(true) : notify("Seu perfil possui acesso de consulta à Ouvidoria deste setor.")} />
          <FeaturePanel icon={FileClock} title="Acesso à informação — e-SIC" description="Organize pedidos de informação, prorrogações, recursos e respostas fornecidas ao cidadão." items={["Contagem automática do prazo", "Registro de prorrogação e justificativa", "Recursos em primeira e segunda instância", "Versão pública dos documentos entregues"]} action={access.register ? "Novo pedido e-SIC" : "Consultar orientações"} onAction={() => access.register ? setModal(true) : notify("Seu perfil possui acesso de consulta ao e-SIC deste setor.")} />
          <FeaturePanel icon={LockKeyhole} title="Proteção da identidade" description="Dados pessoais e denúncias ficam restritos aos perfis autorizados, com registro de cada acesso." items={["Classificação de sigilo", "Mascaramento de dados", "Trilha de auditoria", "Termo de responsabilidade"]} action="Ver regras de acesso" onAction={() => notify("Regras de sigilo exibidas conforme o perfil atual.")} />
        </div>
        <div className="citizen-sector-lists">
          <article className="panel citizen-sector-list"><header><div><p className="eyebrow">MANIFESTAÇÕES</p><h3>Ouvidorias do setor</h3></div><strong>{ombudsmanItems.length}</strong></header>{ombudsmanItems.length ? ombudsmanItems.map((item) => <button key={item.id} onClick={() => notify(`Ouvidoria ${item.protocol} aberta no setor ${department}.`)}><span><strong>{item.subject}</strong><small>{item.protocol} · {item.requester}</small></span><StatusTag>{item.status}</StatusTag></button>) : <div className="citizen-sector-empty compact"><MessageSquareText size={20} /><strong>Nenhuma manifestação</strong><p>Este setor ainda não possui registros de Ouvidoria.</p></div>}</article>
          <article className="panel citizen-sector-list"><header><div><p className="eyebrow">ACESSO À INFORMAÇÃO</p><h3>Pedidos e-SIC do setor</h3></div><strong>{esicItems.length}</strong></header>{esicItems.length ? esicItems.map((item) => <button key={item.id} onClick={() => notify(`Pedido ${item.protocol} aberto no setor ${department}.`)}><span><strong>{item.subject}</strong><small>{item.protocol} · {item.requester}</small></span><StatusTag>{item.status}</StatusTag></button>) : <div className="citizen-sector-empty compact"><FileClock size={20} /><strong>Nenhum pedido e-SIC</strong><p>Este setor ainda não possui pedidos de acesso à informação.</p></div>}</article>
        </div>
      </>}

      {tab === "Carta de serviços" && <article className="panel service-catalog-panel"><div className="catalog-heading"><div><p className="eyebrow">SERVIÇOS AO CIDADÃO</p><h2>Carta de serviços municipal</h2><p>Informações claras sobre requisitos, canais e prazo esperado para cada atendimento.</p></div><label className="module-search"><Search size={15} /><input aria-label="Buscar serviço" placeholder="Buscar serviço..." /></label></div><div className="service-grid">{sectorServices.map((service) => <article key={service.title}><span><Landmark size={18} /></span><h3>{service.title}</h3><p>{department}</p><dl><div><dt>Prazo</dt><dd>{service.deadline}</dd></div><div><dt>Documentos</dt><dd>{service.documents}</dd></div><div><dt>Atendimento</dt><dd>{service.channel}</dd></div></dl><button onClick={() => access.register ? (setSelectedService(service), setServiceNeighborhood(""), setServiceAddress("")) : notify("Seu perfil pode consultar a Carta de Serviços, mas não registrar solicitações.")}>{access.register ? "Solicitar serviço" : "Ver orientações"} <ChevronRight size={13} /></button></article>)}{sectorServices.length === 0 && <div className="citizen-sector-empty service-empty"><Landmark size={22} /><strong>Nenhum serviço cadastrado para este setor</strong><p>A Carta de Serviços está filtrada pelo setor ativo: {department}.</p></div>}</div></article>}

      {tab === "Direto ao Prefeito" && isMayor && <MayorCitizenInbox notify={notify} departments={departments} />}

      {tab === "Satisfação" && <div className="satisfaction-layout"><article className="panel satisfaction-score"><span><Star size={24} /></span><strong>4,7</strong><p>média das avaliações de {department} em agosto</p><div>{[1,2,3,4,5].map((star) => <Star key={star} size={16} fill="currentColor" />)}</div></article><article className="panel satisfaction-breakdown"><h2>Qualidade percebida no setor</h2>{[["Resultado do atendimento",92],["Clareza das informações",89],["Tempo de resposta",84],["Cordialidade",96]].map(([label,value]) => <div className="rating-row" key={String(label)}><span>{label}</span><div><i style={{width:`${value}%`}} /></div><strong>{value}%</strong></div>)}</article><article className="panel satisfaction-comments"><h2>Comentários recentes do setor</h2><blockquote>“Recebi o número do protocolo e consegui acompanhar cada atualização.”<cite>Atendimento do setor · 12 ago.</cite></blockquote><blockquote>“As orientações evitaram uma segunda ida à unidade.”<cite>Atendimento do setor · 11 ago.</cite></blockquote></article></div>}

      {modal && <ModalShell eyebrow="ATENDIMENTO AO CIDADÃO" title="Registrar novo protocolo" onClose={() => setModal(false)}><form onSubmit={createProtocol}><label className="field"><span>Tipo de manifestação *</span><select name="kind" required defaultValue="Solicitação"><option>Solicitação</option><option>Reclamação</option><option>Sugestão</option><option>Elogio</option><option>Denúncia</option><option>Acesso à informação</option></select></label><label className="field"><span>Setor responsável</span><input name="department" value={department} readOnly /></label><label className="field full"><span>Assunto *</span><input name="subject" required placeholder="Descreva o assunto principal" /></label><label className="field full"><span>Nome do solicitante</span><input name="requester" placeholder="Deixe em branco se não houver identificação" /></label><label className="field full"><span>Descrição detalhada *</span><textarea name="description" required placeholder="Registre a manifestação e as informações necessárias para a triagem" /></label><label className="municipal-check full"><input type="checkbox" name="confidential" /> <span>Restringir dados pessoais e identidade aos responsáveis autorizados</span></label><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(false)}>Cancelar</button><button className="button primary"><FileBadge size={15} /> Gerar protocolo</button></div></form></ModalShell>}
      {selectedService && <ModalShell eyebrow="CARTA DE SERVIÇOS" title={selectedService.title} onClose={() => setSelectedService(null)}><form onSubmit={createServiceRequest}><div className="service-request-summary full"><Landmark size={18} /><div><strong>{selectedService.department}</strong><span>{selectedService.deadline} · {selectedService.documents}</span></div></div><label className="field full"><span>Nome do solicitante</span><input name="requester" placeholder="Nome da pessoa, empresa ou entidade" /></label><AddressRegistrationField neighborhood={serviceNeighborhood} address={serviceAddress} onNeighborhoodChange={setServiceNeighborhood} onAddressChange={setServiceAddress} /><label className="field full"><span>Descrição do serviço</span><textarea name="description" placeholder="Descreva a necessidade e acrescente referências para a equipe responsável." /></label><p className="ticket-modal-privacy"><ShieldCheck size={14} /> O bairro e o endereço serão vinculados ao protocolo para orientar a triagem e o atendimento em campo.</p><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setSelectedService(null)}>Cancelar</button><button className="button primary"><MapPin size={15} /> Registrar solicitação</button></div></form></ModalShell>}
    </section>
  );
}

export function ProcessesSection({ department, currentUser, users, departments, notify }: { department: string; currentUser: ProcessUser; users: ProcessUser[]; departments: string[]; notify: Notify }) {
  const access = useCurrentPermission();
  const documentInput = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ProcessTab>("Processos");
  const [processes, setProcesses, processSaveStatus, processesReady] = usePersistentState<ProcessItem[]>("processes:global:v1", INITIAL_PROCESSES);
  const [selectedId, setSelectedId] = useState(INITIAL_PROCESSES[0].id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [queueFilter, setQueueFilter] = useState<"Todos" | "Minha fila" | "Atrasados" | "Assinatura">("Todos");
  const [processModal, setProcessModal] = useState<{ mode: "create" | "edit"; item?: ProcessItem } | null>(null);
  const [moveModal, setMoveModal] = useState(false);
  const [signatureModal, setSignatureModal] = useState(false);
  const [versioningDocumentId, setVersioningDocumentId] = useState<string | null>(null);
  const [dispatchKind, setDispatchKind] = useState("Despacho de encaminhamento");
  const [dispatchText, setDispatchText] = useState("");
  const [validationCode, setValidationCode] = useState("");

  useEffect(() => {
    if (!processesReady || !processes.length) return;
    const current = processes.find((item) => item.id === selectedId && item.currentDepartment === department);
    if (current) return;
    const firstRelated = processes.find((item) => item.currentDepartment === department);
    if (firstRelated) setSelectedId(firstRelated.id);
  }, [department, processes, processesReady, selectedId]);

  const scopedProcesses = useMemo(() => processes.filter((item) => item.currentDepartment === department), [processes, department]);
  const selected = scopedProcesses.find((item) => item.id === selectedId) ?? scopedProcesses[0];
  const today = new Date().toISOString().slice(0, 10);
  const visibleProcesses = useMemo(() => scopedProcesses.filter((item) => {
    const haystack = [item.protocol, item.subject, item.interested, item.owner, item.status, item.currentDepartment, item.processType].join(" ").toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "Todas" || item.priority === priorityFilter;
    const matchesQueue = queueFilter === "Todos"
      || (queueFilter === "Minha fila" && item.owner === currentUser.fullName)
      || (queueFilter === "Atrasados" && item.status !== "Concluído" && Boolean(item.dueDate) && item.dueDate < today)
      || (queueFilter === "Assinatura" && (item.status.toLowerCase().includes("assinatura") || item.signatures.some((signature) => signature.status === "Pendente")));
    return matchesQuery && matchesStatus && matchesPriority && matchesQueue;
  }), [scopedProcesses, query, statusFilter, priorityFilter, queueFilter, currentUser.fullName]);

  const activeCount = scopedProcesses.filter((item) => item.status !== "Concluído").length;
  const signatureCount = scopedProcesses.reduce((sum, item) => sum + item.signatures.filter((signature) => signature.status === "Pendente").length, 0);
  const overdueCount = scopedProcesses.filter((item) => item.status !== "Concluído" && item.dueDate && item.dueDate < today).length;
  const statusOptions = Array.from(new Set(scopedProcesses.map((item) => item.status)));

  useEffect(() => {
    if (!selected) return;
    const lastDraft = selected.dispatches.find((dispatch) => dispatch.status === "Rascunho");
    setDispatchKind(lastDraft?.kind ?? "Despacho de encaminhamento");
    setDispatchText(lastDraft?.content ?? `Processo: ${selected.protocol}\nInteressado: ${selected.interested}\n\nEncaminhe-se o presente processo ao setor competente para análise e manifestação, observando-se os documentos e prazos registrados nos autos.`);
  }, [selectedId]);

  function updateSelected(updater: (item: ProcessItem) => ProcessItem) {
    setProcesses((current) => current.map((item) => item.id === selectedId ? updater(item) : item));
  }

  function saveProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const base = processModal?.item;
    const workflowName = String(form.get("workflowName") || "Fluxo administrativo");
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const item: ProcessItem = {
      id: base?.id ?? makeLocalId(),
      protocol: base?.protocol ?? `PA-2026-${String(processes.length + 129).padStart(5,"0")}`,
      subject: String(form.get("subject") ?? "").trim(),
      interested: String(form.get("interested") ?? "").trim(),
      owner: String(form.get("owner") ?? "A definir") || "A definir",
      status: String(form.get("status") ?? base?.status ?? "Autuação"),
      access: String(form.get("access") ?? "Interno"),
      updated: `Hoje, ${now}`,
      originDepartment: base?.originDepartment ?? department,
      currentDepartment: String(form.get("currentDepartment") ?? department),
      priority: String(form.get("priority") ?? "Normal") as ProcessItem["priority"],
      dueDate: String(form.get("dueDate") ?? ""),
      processType: String(form.get("processType") ?? "Administrativo"),
      description: String(form.get("description") ?? "").trim(),
      workflowName,
      workflowSteps: PROCESS_WORKFLOWS[workflowName] ?? PROCESS_WORKFLOWS["Fluxo administrativo"],
      currentStep: base?.currentStep ?? 0,
      movements: base?.movements ?? [{ id: makeLocalId(), action: "Processo autuado", fromDepartment: department, toDepartment: department, actor: currentUser.fullName, note: "Abertura do processo administrativo digital.", createdAt: `Hoje, ${now}` }],
      documents: base?.documents ?? [],
      dispatches: base?.dispatches ?? [],
      signatures: base?.signatures ?? [],
    };
    if (!item.subject || !item.interested) return;
    setProcesses((current) => base ? current.map((process) => process.id === base.id ? item : process) : [item, ...current]);
    setSelectedId(item.id);
    setProcessModal(null);
    notify(base ? `${item.protocol} atualizado.` : `${item.protocol} autuado e incluído na fila do setor.`);
  }

  function duplicateProcess() {
    if (!selected || !access.register) return;
    const duplicate: ProcessItem = {
      ...selected,
      id: makeLocalId(),
      protocol: `PA-2026-${String(processes.length + 129).padStart(5,"0")}`,
      subject: `${selected.subject} — cópia`,
      status: "Autuação",
      currentStep: 0,
      updated: "Agora",
      movements: [{ id: makeLocalId(), action: "Processo duplicado", fromDepartment: department, toDepartment: department, actor: currentUser.fullName, note: `Criado a partir de ${selected.protocol}.`, createdAt: "Agora" }],
      dispatches: [], signatures: [],
    };
    setProcesses((current) => [duplicate, ...current]);
    setSelectedId(duplicate.id);
    notify(`Cópia criada como ${duplicate.protocol}.`);
  }

  function moveProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const targetDepartment = String(form.get("targetDepartment") ?? "");
    const owner = String(form.get("owner") ?? selected.owner);
    const action = String(form.get("action") ?? "Encaminhamento");
    const note = String(form.get("note") ?? "").trim();
    if (!targetDepartment) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    updateSelected((item) => ({
      ...item,
      currentDepartment: targetDepartment,
      owner: owner || item.owner,
      status: action === "Diligência" ? "Aguardando diligência" : "Em tramitação",
      currentStep: Math.min(item.currentStep + 1, item.workflowSteps.length - 1),
      updated: `Hoje, ${now}`,
      movements: [{ id: makeLocalId(), action, fromDepartment: item.currentDepartment, toDepartment: targetDepartment, actor: currentUser.fullName, note, createdAt: `Hoje, ${now}` }, ...item.movements],
    }));
    setMoveModal(false);
    notify(`${selected.protocol} encaminhado para ${targetDepartment}.`);
  }

  function toggleConclusion() {
    if (!selected || !access.edit) return;
    const concluding = selected.status !== "Concluído";
    updateSelected((item) => ({
      ...item,
      status: concluding ? "Concluído" : "Em tramitação",
      currentStep: concluding ? item.workflowSteps.length - 1 : Math.max(0, item.workflowSteps.length - 2),
      updated: "Agora",
      movements: [{ id: makeLocalId(), action: concluding ? "Processo concluído" : "Processo reaberto", fromDepartment: item.currentDepartment, toDepartment: item.currentDepartment, actor: currentUser.fullName, note: concluding ? "Encerramento administrativo registrado." : "Processo reaberto para nova providência.", createdAt: "Agora" }, ...item.movements],
    }));
    notify(concluding ? "Processo concluído." : "Processo reaberto.");
  }

  function selectDispatchTemplate(kind: string) {
    if (!selected) return;
    setDispatchKind(kind);
    const templates: Record<string,string> = {
      "Despacho de encaminhamento": `Processo: ${selected.protocol}\nInteressado: ${selected.interested}\n\nEncaminhe-se o presente processo ao setor competente para análise e manifestação, observando-se os documentos e prazos registrados nos autos.`,
      "Parecer técnico": `PARECER TÉCNICO\nProcesso: ${selected.protocol}\n\nApós análise dos elementos constantes dos autos, registra-se a manifestação técnica a seguir:\n\n`,
      "Solicitação de diligência": `Processo: ${selected.protocol}\n\nSolicita-se diligência para complementação das informações e documentos necessários à continuidade da análise.`,
      "Termo de juntada": `TERMO DE JUNTADA\n\nNesta data, procedo à juntada de documento ao processo ${selected.protocol}, para que passe a integrar os autos digitais.`,
      "Decisão administrativa": `DECISÃO ADMINISTRATIVA\nProcesso: ${selected.protocol}\n\nConsiderando os elementos dos autos, DECIDO:\n\n`,
    };
    setDispatchText(templates[kind] ?? templates["Despacho de encaminhamento"]);
  }

  function saveDispatch(status: "Rascunho" | "Finalizado") {
    if (!selected || !dispatchText.trim()) return;
    const dispatch: ProcessDispatch = { id: makeLocalId(), kind: dispatchKind, content: dispatchText.trim(), author: currentUser.fullName, status, createdAt: "Agora" };
    updateSelected((item) => ({
      ...item,
      status: status === "Finalizado" ? "Despacho registrado" : item.status,
      updated: "Agora",
      dispatches: status === "Rascunho"
        ? [dispatch, ...item.dispatches.filter((entry) => entry.status !== "Rascunho")]
        : [dispatch, ...item.dispatches.filter((entry) => entry.status !== "Rascunho")],
      movements: status === "Finalizado" ? [{ id: makeLocalId(), action: dispatchKind, fromDepartment: item.currentDepartment, toDepartment: item.currentDepartment, actor: currentUser.fullName, note: "Documento finalizado e juntado aos autos.", createdAt: "Agora" }, ...item.movements] : item.movements,
    }));
    notify(status === "Rascunho" ? "Minuta salva." : "Despacho finalizado e registrado na linha do tempo.");
  }

  function openDocumentUpload(documentId?: string) {
    setVersioningDocumentId(documentId ?? null);
    documentInput.current?.click();
  }

  async function uploadDocument(file: File) {
    if (!selected) return;
    if (file.size > 10 * 1024 * 1024) { notify("O documento deve ter no máximo 10 MB."); return; }
    const previous = versioningDocumentId ? selected.documents.find((doc) => doc.id === versioningDocumentId) : undefined;
    const form = new FormData();
    form.append("file", file);
    form.append("category", `Processo ${selected.protocol}`);
    form.append("userId", currentUser.id);
    form.append("ownerName", currentUser.fullName);
    form.append("department", selected.currentDepartment || department);
    try {
      const response = await fetch("/api/files", { method: "POST", body: form });
      const payload = await response.json().catch(() => null) as { id?: string; error?: string } | null;
      if (!response.ok || !payload?.id) throw new Error(payload?.error || "Não foi possível salvar o documento.");
      const id = makeLocalId();
      const document: ProcessDocument = {
        id,
        attachmentId: payload.id,
        name: file.name || previous?.name || "Documento",
        version: previous ? previous.version + 1 : 1,
        author: currentUser.fullName,
        createdAt: new Date().toLocaleString("pt-BR"),
        status: "Vigente",
        size: file.size,
      };
      updateSelected((item) => ({
        ...item,
        updated: "Agora",
        documents: [document, ...item.documents.map((doc) => previous && doc.id === previous.id ? { ...doc, status: "Substituído" } : doc)],
        movements: [{ id: makeLocalId(), action: previous ? "Nova versão de documento" : "Documento juntado", fromDepartment: item.currentDepartment, toDepartment: item.currentDepartment, actor: currentUser.fullName, note: `${document.name} · versão ${document.version}.`, createdAt: "Agora" }, ...item.movements],
      }));
      setVersioningDocumentId(null);
      notify(`${document.name} salvo e adicionado ao processo.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível salvar o documento.");
    }
  }

  function downloadDocument(document: ProcessDocument) {
    if (document.attachmentId) {
      const anchor = window.document.createElement("a");
      anchor.href = `/api/files?id=${encodeURIComponent(document.attachmentId)}`;
      anchor.download = document.name;
      anchor.click();
      return;
    }
    const url = URL.createObjectURL(new Blob([`Registro do documento\nProcesso: ${selected?.protocol ?? ""}\nDocumento: ${document.name}\nVersão: ${document.version}\nAutor: ${document.author}\nData: ${document.createdAt}`], { type: "text/plain;charset=utf-8" }));
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${document.name}.registro.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function requestSignature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const documentName = String(form.get("documentName") ?? "");
    const signer = String(form.get("signer") ?? "");
    if (!documentName || !signer) return;
    const signature: ProcessSignature = { id: makeLocalId(), documentName, signer, status: "Pendente", code: crypto.randomUUID().slice(0, 12).toUpperCase(), createdAt: "Agora" };
    updateSelected((item) => ({ ...item, status: "Aguardando assinatura", updated: "Agora", signatures: [signature, ...item.signatures] }));
    setSignatureModal(false);
    notify(`Assinatura solicitada a ${signer}.`);
  }

  function signNow(signatureId: string) {
    updateSelected((item) => ({
      ...item,
      updated: "Agora",
      signatures: item.signatures.map((signature) => signature.id === signatureId ? { ...signature, status: "Assinado", createdAt: "Agora" } : signature),
      movements: [{ id: makeLocalId(), action: "Documento assinado", fromDepartment: item.currentDepartment, toDepartment: item.currentDepartment, actor: currentUser.fullName, note: "Assinatura eletrônica registrada no processo.", createdAt: "Agora" }, ...item.movements],
    }));
    notify("Assinatura registrada.");
  }

  function validateSignature() {
    const match = processes.flatMap((process) => process.signatures.map((signature) => ({ process, signature }))).find(({ signature }) => signature.code.toLowerCase() === validationCode.trim().toLowerCase());
    notify(match ? `Código válido: ${match.process.protocol} · ${match.signature.documentName} · ${match.signature.status}.` : "Código de validação não encontrado.");
  }

  const progress = selected ? Math.round(((selected.currentStep + 1) / Math.max(1, selected.workflowSteps.length)) * 100) : 0;
  const selectedOverdue = Boolean(selected?.dueDate && selected.status !== "Concluído" && selected.dueDate < today);

  return <section className="municipal-module-shell process-digital-v2">
    <small className={`module-sync-banner ${processSaveStatus}`}>{processSaveStatus === "carregando" ? "Carregando processos…" : processSaveStatus === "salvando" ? "Salvando alterações…" : processSaveStatus === "offline" ? "Aguardando conexão com o servidor" : "Processos sincronizados"}</small>
    <div className="process-command-center panel process-command-simple">
      <div><p className="eyebrow">PROCESSOS DO SETOR</p><h2>Processos digitais</h2><p>Localize um processo e execute a próxima ação com menos etapas.</p></div>
      <div className="process-command-actions">{access.register && <button className="button primary" onClick={() => setProcessModal({ mode: "create" })}><Plus size={15} /> Novo processo</button>}<button className="button secondary" onClick={() => setQueueFilter("Minha fila")}><UserRound size={15} /> Minha fila</button></div>
    </div>

    <div className="process-summary-strip panel" aria-label="Resumo dos processos">
      <button className={queueFilter === "Todos" ? "active" : ""} onClick={() => { setQueueFilter("Todos"); setTab("Processos"); }}><FileText size={16} /><strong>{activeCount}</strong><span>em tramitação</span></button>
      <button className={queueFilter === "Atrasados" ? "active danger" : ""} onClick={() => { setQueueFilter("Atrasados"); setTab("Processos"); }}><Clock3 size={16} /><strong>{overdueCount}</strong><span>com prazo vencido</span></button>
      <button className={queueFilter === "Assinatura" ? "active" : ""} onClick={() => { setQueueFilter("Assinatura"); setTab("Assinaturas"); }}><FileSignature size={16} /><strong>{signatureCount}</strong><span>aguardando assinatura</span></button>
      <nav className="process-view-switch" aria-label="Áreas do processo">
        <button className={tab === "Processos" ? "active" : ""} onClick={() => setTab("Processos")}>Processos</button>
        <button className={tab === "Documentos e versões" ? "active" : ""} onClick={() => setTab("Documentos e versões")}>Documentos</button>
        <button className={tab === "Assinaturas" ? "active" : ""} onClick={() => setTab("Assinaturas")}>Assinaturas</button>
        {tab === "Despachos e pareceres" && <button className="active" onClick={() => setTab("Despachos e pareceres")}>Despacho</button>}
      </nav>
    </div>

    {tab === "Processos" && <div className="process-layout process-layout-v2">
      <article className="panel process-list process-list-v2">
        <div className="process-list-heading"><div><strong>Fila de processos</strong><small>{visibleProcesses.length} exibidos de {scopedProcesses.length}</small></div>{access.register && <button onClick={() => setProcessModal({ mode: "create" })}><Plus size={14} /> Novo</button>}</div>
        <div className="process-filter-stack process-filter-simple">
          <label className="module-search"><Search size={15} /><input aria-label="Buscar processo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Protocolo, assunto ou interessado..." /></label>
          <details className="process-filter-menu"><summary><SlidersHorizontal size={15} /> Filtros</summary><div><label>Status<select aria-label="Filtrar status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label>Prioridade<select aria-label="Filtrar prioridade" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>Todas</option><option>Urgente</option><option>Alta</option><option>Normal</option><option>Baixa</option></select></label><span>Fila</span><div className="process-queue-chips">{(["Todos", "Minha fila", "Atrasados", "Assinatura"] as const).map((item) => <button key={item} className={queueFilter === item ? "active" : ""} onClick={() => setQueueFilter(item)}>{item}</button>)}</div></div></details>
        </div>
        <div className="process-scroll-list">{visibleProcesses.map((item) => {
          const itemOverdue = item.status !== "Concluído" && Boolean(item.dueDate) && item.dueDate < today;
          return <button key={item.id} className={selected?.id === item.id ? "process-row active" : "process-row"} onClick={() => setSelectedId(item.id)}><span className={`process-priority-dot ${item.priority.toLowerCase()}`} /><span className="process-row-copy"><strong>{item.subject}</strong><small>{item.protocol} · {item.currentDepartment}</small><em>{item.owner} · {itemOverdue ? "Prazo vencido" : item.dueDate ? `Prazo ${new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}` : "Sem prazo"}</em></span><StatusTag>{item.status}</StatusTag><ChevronRight size={15} /></button>;
        })}{visibleProcesses.length === 0 && <div className="process-empty"><Search size={22} /><strong>Nenhum processo encontrado</strong><p>Limpe os filtros ou busque por outro termo.</p><button onClick={() => { setQuery(""); setStatusFilter("Todos"); setPriorityFilter("Todas"); setQueueFilter("Todos"); }}>Limpar filtros</button></div>}</div>
      </article>

      {selected && <aside className="panel process-detail process-detail-v2">
        <header className="process-detail-header"><div><div className="process-protocol-line"><span>{selected.protocol}</span><i className={`priority-${selected.priority.toLowerCase()}`}>{selected.priority}</i>{selectedOverdue && <i className="process-overdue">Prazo vencido</i>}</div><h2>{selected.subject}</h2><p>{selected.description || "Sem descrição complementar."}</p></div><StatusTag>{selected.status}</StatusTag></header>
        <div className="process-progress-block process-progress-simple"><div><span>Etapa atual: <strong>{selected.workflowSteps[selected.currentStep] ?? selected.status}</strong></span><b>{progress}%</b></div><i><span style={{ width: `${progress}%` }} /></i><small>{selected.workflowName}</small></div>
        <div className="process-detail-grid process-detail-grid-simple"><div><span>Setor atual</span><strong>{selected.currentDepartment}</strong></div><div><span>Responsável</span><strong>{selected.owner}</strong></div><div><span>Prazo</span><strong>{selected.dueDate ? new Date(`${selected.dueDate}T12:00:00`).toLocaleDateString("pt-BR") : "Sem prazo"}</strong></div><div><span>Acesso</span><strong><ShieldCheck size={12} /> {selected.access}</strong></div></div>
        <div className="process-primary-actions">{access.edit && <button className="button secondary" onClick={() => setProcessModal({ mode: "edit", item: selected })}><Pencil size={14} /> Editar</button>}<button className="button secondary" onClick={() => setTab("Documentos e versões")}><FileText size={14} /> Documentos</button>{access.edit && <button className="button primary" onClick={() => setMoveModal(true)}>Movimentar <ChevronRight size={14} /></button>}<details className="process-more-actions"><summary aria-label="Mais ações"><MoreHorizontal size={18} /> Mais</summary><div><button onClick={() => access.register ? setTab("Despachos e pareceres") : notify("Seu perfil pode consultar despachos, mas não registrar novos documentos.")}><FileCheck2 size={15} /> Novo despacho</button><button onClick={() => access.register ? openDocumentUpload() : notify("Seu perfil não possui permissão para juntar documentos.")}><Plus size={15} /> Juntar documento</button><button onClick={() => access.register ? setSignatureModal(true) : notify("Seu perfil não possui permissão para solicitar assinatura.")}><FileSignature size={15} /> Solicitar assinatura</button><button onClick={() => access.register ? duplicateProcess() : notify("Seu perfil não possui permissão para duplicar processos.")}><Copy size={15} /> Duplicar</button>{access.edit && <button onClick={toggleConclusion}>{selected.status === "Concluído" ? "Reabrir processo" : "Concluir processo"}</button>}</div></details></div>
        <details className="process-history-simple"><summary>Linha do tempo <span>{selected.movements.length} movimentações</span></summary><div className="process-timeline">{selected.movements.slice(0,3).map((movement, index) => <div className={index === 0 ? "current" : ""} key={movement.id}><i /><span><strong>{movement.action}</strong><small>{movement.createdAt} · {movement.actor}</small><em>{movement.fromDepartment !== movement.toDepartment ? `${movement.fromDepartment} → ${movement.toDepartment}` : movement.toDepartment}{movement.note ? ` · ${movement.note}` : ""}</em></span></div>)}</div></details>
      </aside>}
    </div>}

    {tab === "Despachos e pareceres" && selected && <div className="document-workspace process-document-workspace-v2">
      <article className="panel document-editor"><header><div><p className="eyebrow">{selected.protocol}</p><h2>{dispatchKind}</h2><p>{selected.subject}</p></div><span>{selected.dispatches[0]?.status === "Rascunho" ? "Rascunho salvo" : "Editor pronto"}</span></header><div className="editor-toolbar"><button type="button" title="Negrito" onClick={() => setDispatchText((value) => `${value}\n**texto em destaque**`)}><strong>B</strong></button><button type="button" title="Itálico" onClick={() => setDispatchText((value) => `${value}\n_texto em itálico_`)}><em>I</em></button><button type="button" title="Lista" onClick={() => setDispatchText((value) => `${value}\n\n1. Item\n2. Item`)}><ListChecks size={14} /></button><select aria-label="Modelo de documento" value={dispatchKind} onChange={(event) => selectDispatchTemplate(event.target.value)}>{["Despacho de encaminhamento","Parecer técnico","Solicitação de diligência","Termo de juntada","Decisão administrativa"].map((item) => <option key={item}>{item}</option>)}</select></div><textarea aria-label="Conteúdo do despacho" value={dispatchText} onChange={(event) => setDispatchText(event.target.value)} /><footer><button className="button secondary" onClick={() => access.register ? saveDispatch("Rascunho") : notify("Seu perfil possui acesso apenas de consulta.")}><Save size={14} /> Salvar minuta</button><button className="button primary" onClick={() => access.register ? saveDispatch("Finalizado") : notify("Seu perfil possui acesso apenas de consulta.")}><FileCheck2 size={15} /> Finalizar e juntar aos autos</button></footer></article>
      <aside className="panel template-list process-dispatch-history"><h2>Despachos do processo</h2><p>Selecione um registro para reutilizar o conteúdo.</p>{selected.dispatches.length ? selected.dispatches.map((dispatch) => <button key={dispatch.id} onClick={() => { setDispatchKind(dispatch.kind); setDispatchText(dispatch.content); }}><FileText size={15} /><span><strong>{dispatch.kind}</strong><small>{dispatch.createdAt} · {dispatch.author}</small></span><StatusTag>{dispatch.status}</StatusTag></button>) : <div className="process-side-empty"><FileText size={20} /><span><strong>Nenhum despacho</strong><small>Use o editor para criar a primeira manifestação.</small></span></div>}</aside>
    </div>}

    {tab === "Documentos e versões" && selected && <article className="panel version-panel process-version-panel-v2"><div className="module-toolbar"><div><strong>Documentos de {selected.protocol}</strong><small>{selected.documents.length} registros · versões anteriores permanecem identificadas.</small></div>{access.register && <button className="button primary" onClick={() => openDocumentUpload()}><Plus size={15} /> Juntar documento</button>}</div><div className="version-list">{selected.documents.map((document) => <div key={document.id}><span className="version-icon"><FileText size={17} /></span><span><strong>{document.name}</strong><small>Versão {document.version} · {document.author} · {document.createdAt}{document.size ? ` · ${Math.max(1, Math.round(document.size / 1024))} KB` : ""}</small></span><StatusTag>{document.status}</StatusTag><button onClick={() => downloadDocument(document)}><Download size={12} /> Baixar</button>{access.register && <button onClick={() => openDocumentUpload(document.id)}>Nova versão</button>}</div>)}{selected.documents.length === 0 && <div className="process-empty process-empty-docs"><FileText size={24} /><strong>Nenhum documento juntado</strong><p>Adicione o primeiro arquivo para iniciar os autos digitais.</p><button onClick={() => openDocumentUpload()}>Juntar documento</button></div>}</div></article>}

    {tab === "Assinaturas" && selected && <div className="signature-layout process-signature-layout-v2"><article className="panel signature-card"><span className="signature-icon"><FileSignature size={26} /></span><div className="signature-card-heading"><div><p className="eyebrow">{selected.protocol}</p><h2>Assinaturas do processo</h2></div>{access.register && <button className="button primary" onClick={() => setSignatureModal(true)}><Plus size={14} /> Solicitar assinatura</button>}</div><p>Acompanhe quem precisa assinar e o código de validação de cada documento.</p><div className="process-signature-list">{selected.signatures.map((signature) => <article key={signature.id}><span className={signature.status === "Assinado" ? "done" : "pending"}>{signature.status === "Assinado" ? <Check size={14} /> : <Clock3 size={14} />}</span><span><strong>{signature.documentName}</strong><small>{signature.signer} · {signature.createdAt}</small><em>Código: {signature.code}</em></span><StatusTag>{signature.status}</StatusTag>{signature.status === "Pendente" && access.edit && <button onClick={() => signNow(signature.id)}>Assinar agora</button>}</article>)}{selected.signatures.length === 0 && <div className="process-side-empty"><FileSignature size={22} /><span><strong>Nenhuma assinatura solicitada</strong><small>Escolha um documento e defina o signatário.</small></span></div>}</div></article><article className="panel validation-card process-validation-card-v2"><QrCode size={74} /><div><p className="eyebrow">VALIDAÇÃO</p><h2>Conferir assinatura</h2><p>Digite o código de validação emitido pelo sistema.</p><label><input value={validationCode} onChange={(event) => setValidationCode(event.target.value)} placeholder="Ex.: 8AF3-26B1-9C04" /><button className="button secondary" onClick={validateSignature}>Validar</button></label></div></article></div>}

    <input ref={documentInput} className="hidden-input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadDocument(file); event.target.value = ""; }} />

    {processModal && <ModalShell eyebrow="PROCESSO ADMINISTRATIVO DIGITAL" title={processModal.mode === "create" ? "Autuar novo processo" : `Editar ${processModal.item?.protocol}`} onClose={() => setProcessModal(null)}><form onSubmit={saveProcess}><label className="field full"><span>Assunto *</span><input name="subject" required defaultValue={processModal.item?.subject} placeholder="Informe o objeto do processo" /></label><label className="field"><span>Interessado *</span><input name="interested" required defaultValue={processModal.item?.interested ?? department} /></label><label className="field"><span>Tipo de processo</span><select name="processType" defaultValue={processModal.item?.processType ?? "Administrativo"}><option>Administrativo</option><option>Contratação</option><option>Convênio</option><option>Apuração</option><option>Licenciamento</option></select></label><label className="field"><span>Prioridade</span><select name="priority" defaultValue={processModal.item?.priority ?? "Normal"}><option>Urgente</option><option>Alta</option><option>Normal</option><option>Baixa</option></select></label><label className="field"><span>Prazo</span><input name="dueDate" type="date" defaultValue={processModal.item?.dueDate} /></label><label className="field"><span>Setor atual</span><select name="currentDepartment" defaultValue={processModal.item?.currentDepartment ?? department}>{Array.from(new Set([department, ...departments])).map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Responsável</span><select name="owner" defaultValue={processModal.item?.owner ?? currentUser.fullName}><option value="A definir">A definir</option>{users.map((user) => <option key={user.id} value={user.fullName}>{user.fullName} · {user.department}</option>)}</select></label><label className="field"><span>Nível de acesso</span><select name="access" defaultValue={processModal.item?.access ?? "Interno"}><option>Público</option><option>Interno</option><option>Restrito — dados pessoais</option><option>Sigiloso</option></select></label><label className="field"><span>Fluxo de tramitação</span><select name="workflowName" defaultValue={processModal.item?.workflowName ?? "Fluxo administrativo"}>{Object.keys(PROCESS_WORKFLOWS).map((workflow) => <option key={workflow}>{workflow}</option>)}</select></label><label className="field"><span>Status</span><input name="status" defaultValue={processModal.item?.status ?? "Autuação"} /></label><label className="field full"><span>Descrição inicial</span><textarea name="description" defaultValue={processModal.item?.description} placeholder="Contextualize a abertura do processo" /></label><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setProcessModal(null)}>Cancelar</button><button className="button primary"><Save size={14} /> {processModal.mode === "create" ? "Autuar processo" : "Salvar alterações"}</button></div></form></ModalShell>}

    {moveModal && selected && <ModalShell eyebrow={selected.protocol} title="Movimentar processo" onClose={() => setMoveModal(false)}><form onSubmit={moveProcess}><div className="process-move-summary full"><span><strong>Origem atual</strong><small>{selected.currentDepartment}</small></span><ChevronRight size={18} /><span><strong>Próximo destino</strong><small>Selecione abaixo</small></span></div><label className="field"><span>Setor de destino *</span><select name="targetDepartment" required defaultValue=""><option value="" disabled>Selecione o setor</option>{Array.from(new Set([department, ...departments])).filter((item) => item !== selected.currentDepartment).map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Novo responsável</span><select name="owner" defaultValue={selected.owner}><option>A definir</option>{users.map((user) => <option key={user.id} value={user.fullName}>{user.fullName} · {user.department}</option>)}</select></label><label className="field full"><span>Ação</span><select name="action" defaultValue="Encaminhamento"><option>Encaminhamento</option><option>Diligência</option><option>Retorno para ajustes</option><option>Análise técnica</option><option>Análise jurídica</option><option>Validação</option></select></label><label className="field full"><span>Despacho / providência *</span><textarea name="note" required placeholder="Explique o motivo da movimentação e o que o próximo setor deve fazer." /></label><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setMoveModal(false)}>Cancelar</button><button className="button primary">Registrar tramitação <ChevronRight size={14} /></button></div></form></ModalShell>}

    {signatureModal && selected && <ModalShell eyebrow={selected.protocol} title="Solicitar assinatura" onClose={() => setSignatureModal(false)}><form onSubmit={requestSignature}><label className="field full"><span>Documento *</span><select name="documentName" required defaultValue=""><option value="" disabled>Selecione um documento</option>{selected.documents.filter((document) => document.status === "Vigente").map((document) => <option key={document.id}>{document.name}</option>)}</select></label><label className="field full"><span>Signatário *</span><select name="signer" required defaultValue=""><option value="" disabled>Selecione o responsável</option>{users.map((user) => <option key={user.id} value={user.fullName}>{user.fullName} · {user.role}</option>)}</select></label><p className="ticket-modal-privacy"><ShieldCheck size={14} /> A solicitação ficará registrada no processo e poderá ser validada por código.</p><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setSignatureModal(false)}>Cancelar</button><button className="button primary"><FileSignature size={14} /> Solicitar assinatura</button></div></form></ModalShell>}
  </section>;
}

export function MunicipalManagementSection({ department, notify }: { department: string; notify: Notify }) {
  const access = useCurrentPermission();
  const [tab, setTab] = useState<ManagementTab>("Frota");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas as situações");
  const [data, setData, managementSaveStatus] = usePersistentState<Record<ManagementTab, ManagementItem[]>>(persistenceKey("management", department, "v1"), MANAGEMENT_DATA);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: ManagementItem } | null>(null);
  const [detailItem, setDetailItem] = useState<ManagementItem | null>(null);

  const tabItems = data[tab].filter((item) => managementItemBelongsToDepartment(item, department));
  const items = tabItems.filter((item) => {
    const matchesQuery = [item.code, item.title, item.detail, item.owner, item.status, item.metric, item.due].join(" ").toLowerCase().includes(query.toLowerCase());
    const normalized = item.status.toLowerCase();
    const matchesStatus = statusFilter === "Todas as situações"
      || (statusFilter === "Regular" && (normalized.includes("regular") || normalized.includes("vigente") || normalized.includes("disponível") || normalized.includes("em uso")))
      || (statusFilter === "Requer atenção" && (normalized.includes("manutenção") || normalized.includes("baixo") || normalized.includes("vistoria") || normalized.includes("renovação") || normalized.includes("transferência")))
      || (statusFilter === "Vencimento próximo" && (item.due.toLowerCase().includes("ago") || item.due.toLowerCase().includes("set") || normalized.includes("renovação")));
    return matchesQuery && matchesStatus;
  });
  const ActiveIcon = TAB_ICON[tab];
  const attentionCount = tabItems.filter((item) => {
    const value = item.status.toLowerCase();
    return value.includes("manutenção") || value.includes("baixo") || value.includes("renovação") || value.includes("vistoria") || value.includes("transferência");
  }).length;
  const regularCount = tabItems.length - attentionCount;

  function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const base = modal?.item;
    const item: ManagementItem = {
      id: base?.id ?? makeLocalId(),
      code: String(form.get("code")) || base?.code || `${tab.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      title: String(form.get("title")),
      detail: String(form.get("detail")),
      owner: String(form.get("owner")) || department,
      status: String(form.get("status")) || base?.status || "Cadastrado",
      metric: String(form.get("metric")) || "Aguardando primeira atualização",
      due: String(form.get("due")) || "Sem prazo definido",
    };
    setData((current) => ({
      ...current,
      [tab]: base ? current[tab].map((record) => record.id === base.id ? item : record) : [item, ...current[tab]],
    }));
    setDetailItem((current) => current?.id === item.id ? item : current);
    setModal(null);
    notify(base ? `${item.code} atualizado com sucesso.` : `${item.code} incluído no módulo de ${tab.toLowerCase()}.`);
  }

  function duplicateRecord(item: ManagementItem) {
    if (!access.register) { notify("Seu perfil não possui permissão para duplicar registros."); return; }
    const copy: ManagementItem = { ...item, id: makeLocalId(), code: `${item.code}-COPIA`, status: "Cadastrado" };
    setData((current) => ({ ...current, [tab]: [copy, ...current[tab]] }));
    notify(`Cópia de ${item.code} criada para edição.`);
  }

  function quickStatus(item: ManagementItem, status: string) {
    if (!access.edit) { notify("Seu perfil está em modo de consulta."); return; }
    const updated = { ...item, status };
    setData((current) => ({ ...current, [tab]: current[tab].map((record) => record.id === item.id ? updated : record) }));
    setDetailItem((current) => current?.id === item.id ? updated : current);
    notify(`${item.code}: situação atualizada para ${status}.`);
  }

  function exportManagement() {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [["Código","Título","Detalhes","Responsável","Situação","Indicador","Prazo"], ...items.map((item) => [item.code,item.title,item.detail,item.owner,item.status,item.metric,item.due])];
    const csv = rows.map((row) => row.map(escape).join(";")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `gestao-${tab.toLowerCase().replace(/\s+/g,"-")}.csv`; anchor.click();
    URL.revokeObjectURL(url);
    notify(`Relatório de ${tab.toLowerCase()} exportado em CSV.`);
  }

  return <section className="municipal-module-shell">
    <small className={`module-sync-banner ${managementSaveStatus}`}>{managementSaveStatus === "salvando" ? "Salvando alterações…" : managementSaveStatus === "offline" ? "Aguardando conexão com o servidor" : "Gestão sincronizada"}</small>
    <div className="management-tabs" role="tablist" aria-label="Áreas da gestão municipal">{(Object.keys(MANAGEMENT_DATA) as ManagementTab[]).map((item) => { const Icon = TAB_ICON[item]; const scopedCount = data[item].filter((record) => managementItemBelongsToDepartment(record, department)).length; return <button key={item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); setStatusFilter("Todas as situações"); setQuery(""); }}><span><Icon size={19} /></span><strong>{item}</strong><small>{scopedCount} registros</small></button>; })}</div>

    <div className="management-summary-grid">
      <article className="panel"><span className="management-summary-icon"><ActiveIcon size={18} /></span><div><small>REGISTROS EM {tab.toUpperCase()}</small><strong>{tabItems.length}</strong><p>Base operacional do módulo</p></div></article>
      <article className="panel"><span className="management-summary-icon warning"><Clock3 size={18} /></span><div><small>REQUEREM ACOMPANHAMENTO</small><strong>{attentionCount}</strong><p>Revisão, manutenção ou vencimento</p></div></article>
      <article className="panel"><span className="management-summary-icon success"><CheckCircle2 size={18} /></span><div><small>SITUAÇÃO REGULAR</small><strong>{regularCount}</strong><p>Sem alerta operacional imediato</p></div></article>
      <article className="panel"><span className="management-summary-icon info"><Gauge size={18} /></span><div><small>VISÃO DO SETOR</small><strong>{department === "Gabinete do Prefeito" ? "Executiva" : "Setorial"}</strong><p>{department}</p></div></article>
    </div>

    <article className="panel management-panel management-panel-v2">
      <header><div><span className="management-title-icon"><ActiveIcon size={21} /></span><div><p className="eyebrow">CONTROLE MUNICIPAL</p><h2>{tab}</h2><p>{managementDescription(tab)}</p></div></div>{access.register && <button className="button primary" onClick={() => setModal({ mode: "create" })}><Plus size={15} /> Novo registro</button>}</header>
      <div className="module-toolbar"><label className="module-search"><Search size={15} /><input aria-label={`Buscar em ${tab}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar em ${tab.toLowerCase()}...`} /></label><select aria-label="Filtrar situação" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todas as situações</option><option>Regular</option><option>Requer atenção</option><option>Vencimento próximo</option></select><button className="button secondary" onClick={exportManagement}><Download size={14} /> Exportar CSV</button></div>
      <div className="management-grid management-grid-v2">{items.map((item) => <article key={item.id}><header><span>{item.code}</span><StatusTag>{item.status}</StatusTag></header><h3>{item.title}</h3><p>{item.detail}</p><dl><div><dt>Responsável</dt><dd><UserRound size={13} /> {item.owner}</dd></div><div><dt>Indicador</dt><dd><Gauge size={13} /> {item.metric}</dd></div><div><dt>Prazo ou validade</dt><dd><Clock3 size={13} /> {item.due}</dd></div></dl><div className="management-card-actions"><button onClick={() => setDetailItem(item)}>Abrir ficha <ChevronRight size={13} /></button>{access.edit && <button onClick={() => setModal({ mode: "edit", item })}><Pencil size={13} /> Editar</button>}{access.register && <button title="Duplicar registro" aria-label={`Duplicar ${item.code}`} onClick={() => duplicateRecord(item)}><Copy size={13} /></button>}</div></article>)}</div>
      {!items.length && <div className="module-empty"><Search size={28} /><strong>Nenhum registro encontrado</strong><p>Ajuste a busca ou os filtros desta área da Gestão Municipal.</p></div>}
    </article>

    {modal && (modal.mode === "create" ? access.register : access.edit) && <ModalShell eyebrow={`MÓDULO DE ${tab.toUpperCase()}`} title={modal.mode === "edit" ? `Editar ${modal.item?.code}` : `Novo registro de ${tab.toLowerCase()}`} onClose={() => setModal(null)}><form onSubmit={saveRecord}><label className="field"><span>Código ou identificação</span><input name="code" defaultValue={modal.item?.code ?? ""} placeholder="Gerado automaticamente se vazio" /></label><label className="field"><span>Responsável</span><input name="owner" defaultValue={modal.item?.owner ?? department} /></label><label className="field full"><span>Título *</span><input name="title" required defaultValue={modal.item?.title ?? ""} placeholder="Identifique o bem, contrato, veículo ou atividade" /></label><label className="field full"><span>Detalhes *</span><textarea name="detail" required defaultValue={modal.item?.detail ?? ""} placeholder="Localização, fornecedor, características ou observações" /></label><label className="field"><span>Situação</span><input name="status" defaultValue={modal.item?.status ?? "Cadastrado"} placeholder="Ex.: Regular, Vigente, Em manutenção" /></label><label className="field"><span>Indicador</span><input name="metric" defaultValue={modal.item?.metric ?? ""} placeholder="Valor, quilometragem, saldo ou progresso" /></label><label className="field full"><span>Prazo ou validade</span><input name="due" defaultValue={modal.item?.due ?? ""} placeholder="Ex.: 30 set. 2026" /></label><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(null)}>Cancelar</button><button className="button primary">{modal.mode === "edit" ? <><Save size={15} /> Salvar alterações</> : <><Check size={15} /> Cadastrar</>}</button></div></form></ModalShell>}

    {detailItem && <ModalShell eyebrow={`${tab.toUpperCase()} · ${detailItem.code}`} title={detailItem.title} onClose={() => setDetailItem(null)}><div className="management-detail-modal"><div className="management-detail-status"><StatusTag>{detailItem.status}</StatusTag><span>{detailItem.owner}</span></div><p>{detailItem.detail}</p><dl><div><dt>Indicador atual</dt><dd>{detailItem.metric}</dd></div><div><dt>Prazo / validade</dt><dd>{detailItem.due}</dd></div><div><dt>Setor visualizado</dt><dd>{department}</dd></div></dl><div className="management-timeline"><strong>Movimentações do registro</strong><span><i /><div><b>Registro disponível para acompanhamento</b><small>Histórico preservado nesta ficha.</small></div></span><span><i /><div><b>Situação atual: {detailItem.status}</b><small>Atualize o status conforme a execução do trabalho.</small></div></span></div>{access.edit && <div className="management-quick-actions"><button className="button secondary" onClick={() => quickStatus(detailItem, "Requer atenção")}>Marcar atenção</button><button className="button secondary" onClick={() => quickStatus(detailItem, "Em andamento")}>Em andamento</button><button className="button secondary" onClick={() => quickStatus(detailItem, "Regular")}>Marcar regular</button><button className="button primary" onClick={() => { setModal({ mode: "edit", item: detailItem }); setDetailItem(null); }}><Pencil size={14} /> Editar registro</button></div>}</div></ModalShell>}

    <div className="management-upgrades"><FieldOperationsPanel department={department} notify={notify} /></div>
  </section>;
}

function managementDescription(tab: ManagementTab) {
  const descriptions: Record<ManagementTab,string> = {
    Frota: "Veículos, motoristas, abastecimentos, documentos, rotas e manutenção preventiva.",
    Patrimônio: "Bens, localização, responsável, conservação, inventário e transferências.",
    Almoxarifado: "Entradas, saídas, estoque mínimo, solicitações e validade dos materiais.",
    Contratos: "Fornecedores, fiscais, valores, vigência, parcelas, documentos e alertas.",
    "Obras e campo": "Obras, vistorias, equipes, localização, fotos, medições, custo e progresso.",
  }; return descriptions[tab];
}

export function IndicatorsSection({ department, notify }: { department: string; notify: Notify }) {
  const [period, setPeriod] = useState("Agosto de 2026");
  return <section className="municipal-module-shell"><article className="panel indicator-toolbar"><div><p className="eyebrow">PAINEL GERENCIAL</p><h2>{department}</h2><p>Indicadores operacionais consolidados exclusivamente para o setor e o perfil de acesso.</p></div><div><select aria-label="Período do painel" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Agosto de 2026</option><option>Julho de 2026</option><option>2º trimestre de 2026</option><option>1º semestre de 2026</option></select><button className="button secondary" onClick={() => notify(`Relatório de ${period.toLowerCase()} preparado em PDF e planilha.`)}>Exportar PDF/Excel</button></div></article><div className="municipal-kpis indicator-kpis"><MetricCard icon={ClipboardCheck} label="Demandas concluídas" value="87%" detail="Meta mensal: 85%" tone="green" /><MetricCard icon={Clock3} label="Tempo médio" value="2,4 dias" detail="0,6 dia abaixo de julho" tone="blue" /><MetricCard icon={Gauge} label="Dentro do prazo" value="92%" detail="8 demandas com risco" tone="teal" /><MetricCard icon={Star} label="Satisfação" value="4,7/5" detail="Avaliações deste setor" tone="amber" /></div><div className="analytics-grid"><article className="panel analytics-card"><header><div><h2>Demandas recebidas e concluídas</h2><p>Últimos seis meses</p></div><BarChart3 size={18} /></header><div className="bar-chart">{[["Mar",76,68],["Abr",84,75],["Mai",90,81],["Jun",82,79],["Jul",98,88],["Ago",104,92]].map(([month,received,done]) => <div key={String(month)}><div><i style={{height:`${Number(received)}%`}} /><i style={{height:`${Number(done)}%`}} /></div><span>{month}</span></div>)}</div><footer><span><i className="received" /> Recebidas</span><span><i className="done" /> Concluídas</span></footer></article><article className="panel analytics-card"><header><div><h2>Distribuição por categoria</h2><p>Chamados do setor</p></div><CircleDollarSign size={18} /></header><div className="category-bars">{[["Operacional",38],["Atendimento",26],["Administrativo",19],["Planejamento",10],["Outros",7]].map(([label,value]) => <div key={String(label)}><span>{label}</span><div><i style={{width:`${value}%`}} /></div><strong>{value}%</strong></div>)}</div></article><article className="panel analytics-card risk-card"><header><div><h2>Riscos e alertas</h2><p>Itens do setor que requerem decisão</p></div><Clock3 size={18} /></header>{[["3 registros vencem em até 45 dias","Revisar responsáveis"],["8 chamados próximos do prazo","Priorizar atendimento"],["2 recursos abaixo do nível previsto","Revisar necessidade"]].map((item,index) => <button key={item[0]} onClick={() => notify(item[1])}><span className={index === 0 ? "risk-high" : "risk-medium"}>{index + 1}</span><span><strong>{item[0]}</strong><small>{item[1]}</small></span><ChevronRight size={14} /></button>)}</article></div></section>;
}

export function SecuritySection({ department, notify }: { department: string; notify: Notify }) {
  const [settings, setSettings, securitySaveStatus] = usePersistentState(persistenceKey("security-settings", department, "v1"), { session:true,sensitive:true,exportLog:true,retention:false,notifications:true });
  const toggle = (key: keyof typeof settings) => { setSettings((current) => ({...current,[key]:!current[key]})); notify("Política atualizada e salva."); };
  const roles = [
    ["Prefeito / Vice-prefeito","Executivo","Total","Total","Total","Total"],
    ["Administrador do setor","Setor","Criar e editar","Aprovar","Setor","Setor"],
    ["Responsável pelo setor","Setor","Criar e editar","Aprovar","Setor","Setor"],
    ["Funcionário","Setor","Criar e editar","Não","Setor","Não"],
    ["Fiscal ou auditor","Setor","Somente leitura","Não","Setor","Não"],
    ["Visualizador","Setor","Somente leitura","Não","Não","Não"],
  ];
  return <section className="municipal-module-shell"><small className={`module-sync-banner ${securitySaveStatus}`}>{securitySaveStatus === "salvando" ? "Salvando políticas…" : securitySaveStatus === "offline" ? "Aguardando conexão" : "Políticas sincronizadas"}</small><div className="security-hero"><span><ShieldCheck size={26} /></span><div><p className="eyebrow">GOVERNANÇA E PROTEÇÃO DE DADOS</p><h2>Segurança, LGPD e permissões</h2><p>Controles aplicados a {department}, com acesso mínimo necessário e rastreabilidade das operações.</p></div><div><strong>Proteção ativa</strong><small>Última revisão: 13 ago. 2026</small></div></div><div className="security-grid"><article className="panel permission-panel"><header><div><h2>Matriz de permissões</h2><p>Quem pode visualizar, editar, aprovar, exportar e administrar registros.</p></div><LockKeyhole size={18} /></header><div className="permission-table"><div><span>Perfil</span><span>Visualizar</span><span>Editar</span><span>Aprovar</span><span>Exportar</span><span>Administrar</span></div>{roles.map((row) => <div key={row[0]}>{row.map((value,index) => <span key={index} className={value === "Não" ? "denied" : index > 0 ? "allowed" : ""}>{index > 0 && value !== "Não" && <Check size={11} />}{value}</span>)}</div>)}</div></article><aside className="panel lgpd-panel"><header><div><h2>Políticas e preferências</h2><p>Configurações do ambiente e dos alertas</p></div><ShieldCheck size={18} /></header>{[["session","Encerrar sessões inativas","Após 30 minutos sem atividade"],["sensitive","Mascarar dados pessoais","CPF, telefone e endereço"],["exportLog","Registrar exportações","Usuário, data, filtro e finalidade"],["retention","Descarte automático","Aplicar tabela de temporalidade"],["notifications","Alertas operacionais","Prazos, aprovações, mensagens e documentos"]].map(([key,title,detail]) => <button key={key} onClick={() => toggle(key as keyof typeof settings)}><span><strong>{title}</strong><small>{detail}</small></span><i className={settings[key as keyof typeof settings] ? "toggle active" : "toggle"}><b /></i></button>)}</aside></div><div className="compliance-grid"><FeaturePanel icon={LockKeyhole} title="Dados pessoais" description="Classifique registros comuns, sensíveis, restritos ou sigilosos e aplique acesso compatível." items={["Finalidade e base de tratamento","Responsável pelo dado","Prazo de retenção","Registro de compartilhamento"]} action="Revisar cadastros" onAction={() => notify("Inventário de dados pessoais aberto para revisão.")} /><FeaturePanel icon={FileClock} title="Retenção e descarte" description="Defina prazos de guarda e acompanhe documentos que exigem eliminação ou recolhimento permanente." items={["Tabela de temporalidade","Bloqueio por litígio","Termo de eliminação","Preservação permanente"]} action="Abrir temporalidade" onAction={() => notify("Tabela de temporalidade aberta.")} /><FeaturePanel icon={ShieldCheck} title="Incidentes de segurança" description="Registre perda, exposição ou acesso indevido e acompanhe as providências adotadas." items={["Classificação do impacto","Dados e titulares afetados","Plano de resposta","Comunicações e evidências"]} action="Registrar incidente" onAction={() => notify("Formulário de incidente aberto com acesso restrito.")} /></div><article className="panel accessibility-panel"><span><Accessibility size={22} /></span><div><h2>Acessibilidade e inclusão digital</h2><p>Navegação por teclado, rótulos acessíveis, contraste adequado, foco visível e conteúdo compatível com leitores de tela.</p></div><StatusTag>Conformidade monitorada</StatusTag></article></section>;
}

type HelpTutorial = {
  id: string;
  category: string;
  title: string;
  summary: string;
  duration: string;
  steps: Array<{ title: string; text: string; tip?: string }>;
};

const HELP_TUTORIALS: HelpTutorial[] = [
  {
    id: "chamados", category: "Chamados", title: "Criar, encaminhar e concluir um chamado", duration: "6 min",
    summary: "Do registro inicial ao encerramento, com responsável, prioridade e histórico.",
    steps: [
      { title: "Abra Chamados", text: "No menu lateral, selecione Chamados. Use os filtros para verificar se já existe uma solicitação semelhante antes de criar outra." },
      { title: "Registre as informações essenciais", text: "Clique em Novo chamado, informe título, descrição, prioridade, solicitante e setor responsável. Evite incluir dados pessoais sem necessidade.", tip: "Um título objetivo facilita a busca: serviço + local + situação." },
      { title: "Atribua e acompanhe", text: "Defina o responsável e altere o status conforme o trabalho avançar. Cada movimentação fica registrada na linha do tempo." },
      { title: "Conclua com evidência", text: "Descreva a solução, anexe a evidência necessária e marque como Concluído. O solicitante passa a visualizar o resultado no acompanhamento." },
    ],
  },
  {
    id: "comunicacao", category: "Comunicação", title: "Usar canais internos sem perder o contexto", duration: "5 min",
    summary: "Mensagens por setor, grupos de trabalho e avisos ligados às atividades.",
    steps: [
      { title: "Escolha o canal correto", text: "Acesse Comunicação e abra o canal do setor, um grupo de projeto ou uma conversa direta. Prefira o canal setorial para temas que precisam ficar disponíveis à equipe." },
      { title: "Escreva uma mensagem acionável", text: "Informe o contexto, a providência esperada e o prazo. Use menções somente para as pessoas que realmente precisam agir." },
      { title: "Vincule o trabalho", text: "Quando a conversa tratar de um chamado, processo ou documento, cite o protocolo para manter a rastreabilidade." },
      { title: "Acompanhe as notificações", text: "Mensagens novas geram indicador visual e, se habilitado em Configurações, um aviso sonoro discreto." },
    ],
  },
  {
    id: "atendimento", category: "Atendimento", title: "Registrar protocolo, Ouvidoria e e-SIC", duration: "8 min",
    summary: "Triagem, prazo, sigilo e acompanhamento de solicitações do cidadão.",
    steps: [
      { title: "Identifique o tipo", text: "Em Atendimento ao Cidadão, escolha solicitação, reclamação, sugestão, elogio, denúncia ou pedido de acesso à informação." },
      { title: "Proteja os dados", text: "Registre apenas os dados necessários. Em denúncias ou situações sensíveis, ative a restrição de identidade antes de salvar.", tip: "Registre somente os dados necessários e respeite o nível de acesso definido para o atendimento." },
      { title: "Faça a triagem", text: "Confirme o assunto, o setor responsável e o prazo. O protocolo gerado deve ser entregue ao cidadão para acompanhamento." },
      { title: "Responda e finalize", text: "Registre cada providência, prepare uma resposta clara e encerre somente quando houver retorno conclusivo ou justificativa formal." },
    ],
  },
  {
    id: "processos", category: "Processos", title: "Autuar e movimentar um processo digital", duration: "9 min",
    summary: "Autuação, documentos, despachos, níveis de acesso e assinaturas.",
    steps: [
      { title: "Autue o processo", text: "Abra Processos digitais, clique em Novo processo e informe assunto, interessado, responsável e nível de acesso." },
      { title: "Junte documentos", text: "Na aba Documentos e versões, adicione os arquivos relacionados. Novas versões preservam o histórico anterior para auditoria." },
      { title: "Produza o despacho", text: "Use Despachos e pareceres, escolha um modelo, revise os campos automáticos e finalize o documento." },
      { title: "Movimente ou assine", text: "Encaminhe ao próximo setor com uma providência clara. Registre a assinatura e valide o código associado ao documento antes de concluir a movimentação." },
    ],
  },
  {
    id: "arquivos", category: "Documentos", title: "Organizar arquivos, versões e compartilhamentos", duration: "6 min",
    summary: "Pastas, validade, acesso controlado e recuperação de versões anteriores.",
    steps: [
      { title: "Escolha a pasta", text: "Abra Arquivos e navegue até a pasta do setor ou do processo. Não duplique documentos que já possuem uma versão vigente." },
      { title: "Classifique o arquivo", text: "Informe nome, categoria, validade e nível de acesso. Use nomes que indiquem o conteúdo e a competência, sem dados excessivos." },
      { title: "Atualize por versão", text: "Ao corrigir um arquivo, envie uma nova versão. O sistema mantém autoria, data e versão anterior para consulta." },
      { title: "Compartilhe com finalidade", text: "Selecione destinatários e prazo de acesso. Compartilhe somente o mínimo necessário para a atividade." },
    ],
  },
  {
    id: "setor", category: "Área do Setor", title: "Operar o painel e as equipes do setor", duration: "8 min",
    summary: "Prioridades, formulários específicos, endereços, campo, metas e encaminhamentos.",
    steps: [
      { title: "Leia a central do dia", text: "Na Área do Setor, consulte indicadores, itens prioritários e o fluxo de trabalho antes de iniciar novos registros." },
      { title: "Use o formulário específico", text: "Em Cadastros, escolha o modelo adequado ao serviço. Os campos mudam de acordo com a secretaria ou departamento." },
      { title: "Registre o trabalho de campo", text: "Na aba Campo, selecione equipe, atividade, local, checklist e situação. As alterações são sincronizadas com a plataforma; se houver indisponibilidade, aguarde a retomada da conexão antes de encerrar a atividade." },
      { title: "Encaminhe o mínimo necessário", text: "Em Encaminhamentos, selecione o setor de destino, a providência e o escopo dos dados compartilhados." },
    ],
  },
  {
    id: "permissoes", category: "Configurações", title: "Definir permissões dos funcionários", duration: "7 min",
    summary: "Perfis por função e direitos para visualizar, registrar ou alterar cada módulo.",
    steps: [
      { title: "Acesse como secretário", text: "Abra Configurações. A área aparece apenas para o responsável/secretário autorizado do setor." },
      { title: "Selecione o perfil", text: "Escolha Atendimento, Operacional, Equipe de campo ou Consulta. Cada perfil pode reunir vários funcionários." },
      { title: "Marque as ações", text: "Para cada módulo, habilite Visualizar, Registrar e Alterar. Registrar ou Alterar exige que Visualizar também esteja ativo.", tip: "Comece com o menor acesso necessário e amplie somente quando houver justificativa." },
      { title: "Atribua os funcionários", text: "Na aba Funcionários e perfis, associe cada servidor ao perfil apropriado. Troque de usuário no topo para testar o resultado." },
    ],
  },
  {
    id: "eventos-multissetoriais", category: "Próximos Eventos", title: "Publicar e manter eventos multissetoriais", duration: "5 min",
    summary: "Escolha quais setores recebem o compromisso e controle quem pode editar ou excluir.",
    steps: [
      { title: "Abra a agenda do setor", text: "Acesse Próximos Eventos. A lista mostra apenas compromissos publicados para o setor que está sendo visualizado." },
      { title: "Escolha os setores destinatários", text: "Clique em Novo evento, informe data, local e pauta e marque todos os setores que devem receber o compromisso.", tip: "Use Selecionar todos apenas para agendas realmente institucionais." },
      { title: "Edite quando houver autorização", text: "Perfis com a ação Alterar habilitada visualizam os botões Editar e Excluir. As mudanças são refletidas nas agendas selecionadas." },
      { title: "Comunique alterações", text: "Ao publicar, alterar ou excluir, os integrantes dos setores destinatários recebem um aviso no sistema." },
    ],
  },
  {
    id: "fluxos-anotacoes", category: "Fluxos e Anotações", title: "Acompanhar decisões e providências do setor", duration: "7 min",
    summary: "Quadro por etapas, modelos específicos e histórico de anotações internas.",
    steps: [
      { title: "Confira o fluxo especializado", text: "Abra Fluxos e Anotações. As etapas, modelos e orientações mudam conforme Saúde, Educação, Obras, Governo e as demais áreas." },
      { title: "Crie um registro", text: "Selecione o modelo, descreva o contexto, defina prioridade, responsável e, se necessário, marque o conteúdo como restrito." },
      { title: "Avance pelas etapas", text: "Use Avançar no cartão ou abra o histórico para alterar etapa, prioridade e responsável. Somente perfis com permissão de alteração podem movimentar o fluxo." },
      { title: "Preserve a memória", text: "Adicione decisões, retornos e próximas providências como anotações cronológicas. O conteúdo permanece associado ao setor selecionado." },
    ],
  },
  {
    id: "visao-executiva", category: "Prefeito e vice", title: "Alternar entre todos os painéis setoriais", duration: "4 min",
    summary: "Visão executiva por setor, respeitando permissões específicas e a privacidade da Comunicação.",
    steps: [
      { title: "Entre no perfil executivo", text: "Em Visualizar como, selecione Prefeito Municipal ou Vice-prefeito. O sistema identifica a visão executiva automaticamente, mantendo a Comunicação intersetorial privada até autorização explícita do Prefeito." },
      { title: "Escolha o painel setorial", text: "Use o seletor Painel setorial no topo para alternar entre secretarias, departamentos, seções e subprefeitura." },
      { title: "Navegue mantendo o setor", text: "Chamados, indicadores, arquivos, agenda, fluxos, funcionários e configurações passam a usar o setor escolhido sem trocar de conta." },
      { title: "Valide a visão atual", text: "A faixa Visão executiva mostra qual setor está sendo visualizado. Antes de registrar ou alterar algo, confirme esse nome." },
    ],
  },
  {
    id: "relatorios", category: "Relatórios", title: "Filtrar e apresentar indicadores", duration: "5 min",
    summary: "Como preparar uma visão gerencial coerente para acompanhamento.",
    steps: [
      { title: "Defina a pergunta", text: "Antes de filtrar, determine o que será analisado: volume, prazo, distribuição por setor ou conclusão." },
      { title: "Aplique período e setor", text: "Use filtros compatíveis entre si e confira se os indicadores representam o mesmo intervalo." },
      { title: "Confirme a origem dos dados", text: "Confirme o período, o setor e a origem dos indicadores antes de apresentar os resultados." },
      { title: "Exporte somente o necessário", text: "Gere a visão adequada ao público e evite incluir colunas ou dados individuais que não ajudam na decisão." },
    ],
  },
];

export function HelpCenterSection({ notify }: { notify: Notify }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(HELP_TUTORIALS[0].id);
  const [completed, setCompleted, tutorialSaveStatus] = usePersistentState<Record<string, number[]>>("help:tutorial-progress:v1", {});
  const tutorials = useMemo(() => HELP_TUTORIALS.filter((tutorial) => [tutorial.title, tutorial.summary, tutorial.category, ...tutorial.steps.flatMap((step) => [step.title, step.text])].join(" ").toLowerCase().includes(query.toLowerCase())), [query]);
  const selected = HELP_TUTORIALS.find((tutorial) => tutorial.id === selectedId) ?? HELP_TUTORIALS[0];
  const completedSteps = completed[selected.id] ?? [];
  const progress = Math.round((completedSteps.length / selected.steps.length) * 100);

  function openTutorial(id: string) {
    setSelectedId(id);
    notify(`Tutorial aberto. O progresso pode ser marcado passo a passo.`);
  }

  function toggleStep(index: number) {
    setCompleted((current) => {
      const steps = current[selected.id] ?? [];
      return { ...current, [selected.id]: steps.includes(index) ? steps.filter((item) => item !== index) : [...steps, index] };
    });
  }

  function completeTutorial() {
    setCompleted((current) => ({ ...current, [selected.id]: selected.steps.map((_, index) => index) }));
    notify(`Tutorial “${selected.title}” concluído.`);
  }

  return (
    <section className="municipal-module-shell help-center">
      <small className={`module-sync-banner ${tutorialSaveStatus}`}>{tutorialSaveStatus === "salvando" ? "Salvando progresso…" : tutorialSaveStatus === "offline" ? "Aguardando conexão" : "Progresso sincronizado"}</small>
      <div className="help-hero">
        <span><HelpCircle size={30} /></span><p className="eyebrow">CENTRAL DE CONHECIMENTO</p><h2>Aprenda fazendo</h2>
        <p>Tutoriais completos para operar os principais fluxos do Prefeitura Conecta.</p>
        <label><Search size={17} /><input aria-label="Buscar na central de ajuda" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por chamado, permissão, protocolo..." /></label>
      </div>
      <div className="tutorial-layout">
        <aside className="panel tutorial-library">
          <header><div><h2>Tutoriais</h2><p>{tutorials.length} de {HELP_TUTORIALS.length} encontrados</p></div><BookOpen size={18} /></header>
          <div>
            {tutorials.map((tutorial, index) => {
              const done = (completed[tutorial.id]?.length ?? 0) === tutorial.steps.length;
              return <button key={tutorial.id} className={selected.id === tutorial.id ? "active" : ""} onClick={() => openTutorial(tutorial.id)}><span className={`tutorial-number tone-${index % 4}`}>{done ? <Check size={14} /> : index + 1}</span><span><small>{tutorial.category} · {tutorial.duration}</small><strong>{tutorial.title}</strong></span><ChevronRight size={15} /></button>;
            })}
            {tutorials.length === 0 && <div className="tutorial-empty"><Search size={22} /><strong>Nenhum tutorial encontrado</strong><p>Tente buscar por um módulo ou procedimento.</p></div>}
          </div>
        </aside>
        <article className="panel tutorial-reader">
          <header>
            <div><p className="eyebrow">{selected.category}</p><h2>{selected.title}</h2><p>{selected.summary}</p></div>
            <span className="tutorial-duration"><Clock3 size={14} /> {selected.duration}</span>
          </header>
          <div className="tutorial-progress"><span><i style={{ width: `${progress}%` }} /></span><strong>{progress}% concluído</strong></div>
          <ol className="tutorial-steps">
            {selected.steps.map((step, index) => {
              const done = completedSteps.includes(index);
              return <li key={step.title} className={done ? "done" : ""}><button type="button" aria-label={`${done ? "Desmarcar" : "Marcar"} passo ${index + 1}`} aria-pressed={done} onClick={() => toggleStep(index)}>{done ? <Check size={15} /> : index + 1}</button><div><h3>{step.title}</h3><p>{step.text}</p>{step.tip && <aside><ShieldCheck size={14} /><span><strong>Boa prática</strong>{step.tip}</span></aside>}</div></li>;
            })}
          </ol>
          <footer><p><CheckCircle2 size={15} /> Marque os passos enquanto apresenta o fluxo.</p><button className="button primary" onClick={completeTutorial}><Check size={14} /> Marcar como concluído</button></footer>
        </article>
      </div>
      <div className="help-footer-grid">
        <article className="panel quick-help"><h2>Respostas rápidas</h2>{["O botão sumiu? Verifique a permissão do perfil.", "Notificação sem som? Ative em Configurações.", "Alterações são sincronizadas no armazenamento central do sistema."].map((item) => <button key={item} onClick={() => notify(item)}><CheckCircle2 size={14} /><span>{item}</span><ChevronRight size={13} /></button>)}</article>
        <article className="panel support-contact"><span><MessageSquareText size={20} /></span><div><h2>Encontrou uma dificuldade?</h2><p>Registre o módulo, o perfil usado e o que esperava acontecer durante o uso.</p></div><button className="button primary" onClick={() => notify("Chamado de suporte preparado para preenchimento.")}>Abrir suporte</button></article>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string; detail: string; tone: string }) {
  return <article className={`panel municipal-metric ${tone}`}><span><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

function FeaturePanel({ icon: Icon, title, description, items, action, onAction }: { icon: LucideIcon; title: string; description: string; items: string[]; action: string; onAction: () => void }) {
  return <article className="panel feature-panel"><span className="feature-icon"><Icon size={21} /></span><h2>{title}</h2><p>{description}</p><ul>{items.map((item) => <li key={item}><Check size={12} /> {item}</li>)}</ul><button onClick={onAction}>{action} <ChevronRight size={13} /></button></article>;
}
