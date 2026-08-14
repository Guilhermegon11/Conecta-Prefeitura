"use client";

import { FormEvent, useMemo, useState } from "react";
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
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  Warehouse,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NeighborhoodMapField } from "./municipal-location";
import { useCurrentPermission } from "./permission-context";

type Notify = (message: string) => void;
type CitizenTab = "Protocolos" | "Ouvidoria e e-SIC" | "Carta de serviços" | "Satisfação";
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

type ProcessItem = {
  id: string;
  protocol: string;
  subject: string;
  interested: string;
  owner: string;
  status: string;
  access: string;
  updated: string;
};

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

const INITIAL_PROTOCOLS: CitizenProtocol[] = [
  { id: "pc-1", protocol: "PROT-2026-00481", subject: "Lâmpada apagada na Rua das Palmeiras", requester: "Mariana A. Silva", channel: "Portal do cidadão", kind: "Solicitação", status: "Em atendimento", department: "Secretaria de Infraestrutura e Transporte", due: "18 ago. 2026" },
  { id: "pc-2", protocol: "OUV-2026-00139", subject: "Sugestão de ampliação da coleta seletiva", requester: "Carlos Henrique", channel: "Ouvidoria", kind: "Sugestão", status: "Em análise", department: "Meio Ambiente", due: "24 ago. 2026" },
  { id: "pc-3", protocol: "ESIC-2026-00052", subject: "Relação de contratos vigentes em 2026", requester: "Fernanda Moreira", channel: "e-SIC", kind: "Acesso à informação", status: "Aguardando resposta", department: "Administração e Finanças", due: "02 set. 2026" },
  { id: "pc-4", protocol: "DEN-2026-00021", subject: "Relato sigiloso sobre descarte irregular", requester: "Identidade protegida", channel: "Ouvidoria", kind: "Denúncia", status: "Triagem sigilosa", department: "Controle Interno", due: "20 ago. 2026", confidential: true },
];

const INITIAL_PROCESSES: ProcessItem[] = [
  { id: "pr-1", protocol: "PA-2026-00128", subject: "Contratação emergencial de manutenção elétrica", interested: "Secretaria de Governo", owner: "Jaime de Souza", status: "Parecer jurídico", access: "Interno", updated: "Hoje, 11:42" },
  { id: "pr-2", protocol: "PA-2026-00119", subject: "Termo de cooperação para feira do produtor", interested: "Associação dos Produtores", owner: "Lucas Fontinelli", status: "Aguardando assinatura", access: "Público", updated: "Hoje, 09:18" },
  { id: "pr-3", protocol: "PA-2026-00098", subject: "Aquisição de kits escolares", interested: "Secretaria de Educação", owner: "Leila Cibeli", status: "Análise financeira", access: "Interno", updated: "12 ago., 16:25" },
  { id: "pr-4", protocol: "PA-2026-00074", subject: "Renovação do convênio de atendimento regional", interested: "Secretaria de Saúde", owner: "Natália Pedrosa", status: "Concluído", access: "Público", updated: "10 ago., 14:10" },
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

const TAB_ICON: Record<ManagementTab, LucideIcon> = {
  Frota: Bus,
  Patrimônio: Archive,
  Almoxarifado: Warehouse,
  Contratos: BriefcaseBusiness,
  "Obras e campo": HardHat,
};

function makeDemoId() {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}`;
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

export function CitizenServiceSection({ department, notify }: { department: string; notify: Notify }) {
  const access = useCurrentPermission();
  const [tab, setTab] = useState<CitizenTab>("Protocolos");
  const [query, setQuery] = useState("");
  const [protocols, setProtocols] = useState(INITIAL_PROTOCOLS);
  const [modal, setModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [serviceNeighborhood, setServiceNeighborhood] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const visible = protocols.filter((item) => [item.protocol, item.subject, item.requester, item.kind, item.department].join(" ").toLowerCase().includes(query.toLowerCase()));

  function createProtocol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kind = String(form.get("kind"));
    const prefix = kind === "Acesso à informação" ? "ESIC" : kind === "Denúncia" ? "DEN" : kind === "Reclamação" ? "OUV" : "PROT";
    const item: CitizenProtocol = {
      id: makeDemoId(), protocol: `${prefix}-2026-${String(protocols.length + 482).padStart(5, "0")}`,
      subject: String(form.get("subject")), requester: String(form.get("requester")) || "Cidadão não identificado",
      channel: "Atendimento interno", kind, status: kind === "Denúncia" ? "Triagem sigilosa" : "Recebido",
      department: String(form.get("department")) || department, due: "Prazo calculado após triagem", confidential: Boolean(form.get("confidential")),
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
      id: makeDemoId(), protocol: `SERV-2026-${String(protocols.length + 482).padStart(5, "0")}`,
      subject: selectedService.title, requester: String(form.get("requester")) || "Solicitante não identificado",
      channel: "Carta de serviços digital", kind: "Serviço", status: "Recebido", department: selectedService.department,
      due: selectedService.deadline, neighborhood: serviceNeighborhood, address: serviceAddress,
    };
    setProtocols((current) => [item, ...current]);
    setSelectedService(null);
    setServiceNeighborhood("");
    setServiceAddress("");
    setTab("Protocolos");
    notify(`${item.protocol} registrado para ${serviceNeighborhood}. A área foi vinculada ao mapa municipal.`);
  }

  return (
    <section className="municipal-module-shell">
      <div className="module-tabs wide-tabs" role="tablist" aria-label="Módulos de atendimento ao cidadão">
        {(["Protocolos", "Ouvidoria e e-SIC", "Carta de serviços", "Satisfação"] as CitizenTab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      {tab === "Protocolos" && <>
        <div className="municipal-kpis">
          <MetricCard icon={FileBadge} label="Protocolos ativos" value="38" detail="12 recebidos nesta semana" tone="teal" />
          <MetricCard icon={Clock3} label="Dentro do prazo" value="92%" detail="3 protocolos exigem atenção" tone="blue" />
          <MetricCard icon={MessageSquareText} label="Tempo médio" value="2,8 dias" detail="-14% em relação a julho" tone="amber" />
          <MetricCard icon={CheckCircle2} label="Concluídos no mês" value="126" detail="Avaliação média 4,7/5" tone="green" />
        </div>
        <article className="panel municipal-table-panel">
          <div className="module-toolbar"><label className="module-search"><Search size={15} /><input aria-label="Buscar protocolo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar protocolo, cidadão ou assunto..." /></label><select aria-label="Filtrar protocolos"><option>Todos os status</option><option>Recebidos</option><option>Em atendimento</option><option>Aguardando resposta</option><option>Concluídos</option></select>{access.register && <button className="button primary" onClick={() => setModal(true)}><Plus size={15} /> Novo protocolo</button>}</div>
          <div className="municipal-data-table citizen-table"><div className="municipal-table-row municipal-table-head"><span>Protocolo e assunto</span><span>Solicitante</span><span>Tipo</span><span>Setor responsável</span><span>Prazo</span><span>Status</span></div>{visible.map((item) => <button className="municipal-table-row" key={item.id} onClick={() => notify(`${item.protocol}: acompanhamento público disponível com dados internos protegidos.`)}><span><strong>{item.subject}</strong><small>{item.protocol} · {item.channel}</small></span><span>{item.requester}</span><span>{item.confidential && <LockKeyhole size={12} />} {item.kind}</span><span>{item.department}</span><span>{item.due}</span><StatusTag>{item.status}</StatusTag></button>)}</div>
        </article>
      </>}

      {tab === "Ouvidoria e e-SIC" && <div className="citizen-feature-grid">
        <FeaturePanel icon={MessageSquareText} title="Ouvidoria municipal" description="Receba solicitações, reclamações, sugestões, elogios e denúncias, com classificação e encaminhamento controlados." items={["Identificação sigilosa ou manifestação anônima", "Prazos e resposta conclusiva", "Encaminhamento entre unidades", "Relatórios por assunto e canal"]} action={access.register ? "Registrar manifestação" : "Consultar orientações"} onAction={() => access.register ? setModal(true) : notify("Seu perfil possui acesso de consulta à Ouvidoria.")} />
        <FeaturePanel icon={FileClock} title="Acesso à informação — e-SIC" description="Organize pedidos de informação, prorrogações, recursos e respostas fornecidas ao cidadão." items={["Contagem automática do prazo", "Registro de prorrogação e justificativa", "Recursos em primeira e segunda instância", "Versão pública dos documentos entregues"]} action={access.register ? "Novo pedido e-SIC" : "Consultar orientações"} onAction={() => access.register ? setModal(true) : notify("Seu perfil possui acesso de consulta ao e-SIC.")} />
        <FeaturePanel icon={LockKeyhole} title="Proteção da identidade" description="Dados pessoais e denúncias ficam restritos aos perfis autorizados, com registro de cada acesso." items={["Classificação de sigilo", "Mascaramento de dados", "Trilha de auditoria", "Termo de responsabilidade"]} action="Ver regras de acesso" onAction={() => notify("Regras de sigilo exibidas conforme o perfil atual.")} />
      </div>}

      {tab === "Carta de serviços" && <article className="panel service-catalog-panel"><div className="catalog-heading"><div><p className="eyebrow">SERVIÇOS AO CIDADÃO</p><h2>Carta de serviços municipal</h2><p>Informações claras sobre requisitos, canais e prazo esperado para cada atendimento.</p></div><label className="module-search"><Search size={15} /><input aria-label="Buscar serviço" placeholder="Buscar serviço..." /></label></div><div className="service-grid">{SERVICES.map((service) => <article key={service.title}><span><Landmark size={18} /></span><h3>{service.title}</h3><p>{service.department}</p><dl><div><dt>Prazo</dt><dd>{service.deadline}</dd></div><div><dt>Documentos</dt><dd>{service.documents}</dd></div><div><dt>Atendimento</dt><dd>{service.channel}</dd></div></dl><button onClick={() => access.register ? (setSelectedService(service), setServiceNeighborhood(""), setServiceAddress("")) : notify("Seu perfil pode consultar a Carta de Serviços, mas não registrar solicitações.")}>{access.register ? "Solicitar serviço" : "Ver orientações"} <ChevronRight size={13} /></button></article>)}</div></article>}

      {tab === "Satisfação" && <div className="satisfaction-layout"><article className="panel satisfaction-score"><span><Star size={24} /></span><strong>4,7</strong><p>média de 184 avaliações em agosto</p><div>{[1,2,3,4,5].map((star) => <Star key={star} size={16} fill="currentColor" />)}</div></article><article className="panel satisfaction-breakdown"><h2>Qualidade percebida</h2>{[["Resultado do atendimento",92],["Clareza das informações",89],["Tempo de resposta",84],["Cordialidade",96]].map(([label,value]) => <div className="rating-row" key={String(label)}><span>{label}</span><div><i style={{width:`${value}%`}} /></div><strong>{value}%</strong></div>)}</article><article className="panel satisfaction-comments"><h2>Comentários recentes</h2><blockquote>“Recebi o número do protocolo e consegui acompanhar cada atualização.”<cite>Atendimento de iluminação · 12 ago.</cite></blockquote><blockquote>“A lista de documentos evitou uma segunda ida ao setor.”<cite>Matrícula escolar · 11 ago.</cite></blockquote></article></div>}

      {modal && <ModalShell eyebrow="ATENDIMENTO AO CIDADÃO" title="Registrar novo protocolo" onClose={() => setModal(false)}><form onSubmit={createProtocol}><label className="field"><span>Tipo de manifestação *</span><select name="kind" required defaultValue="Solicitação"><option>Solicitação</option><option>Reclamação</option><option>Sugestão</option><option>Elogio</option><option>Denúncia</option><option>Acesso à informação</option></select></label><label className="field"><span>Setor responsável</span><input name="department" defaultValue={department} /></label><label className="field full"><span>Assunto *</span><input name="subject" required placeholder="Descreva o assunto principal" /></label><label className="field full"><span>Nome do solicitante</span><input name="requester" placeholder="Deixe em branco se não houver identificação" /></label><label className="field full"><span>Descrição detalhada *</span><textarea name="description" required placeholder="Registre a manifestação e as informações necessárias para a triagem" /></label><label className="municipal-check full"><input type="checkbox" name="confidential" /> <span>Restringir dados pessoais e identidade aos responsáveis autorizados</span></label><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(false)}>Cancelar</button><button className="button primary"><FileBadge size={15} /> Gerar protocolo</button></div></form></ModalShell>}
      {selectedService && <ModalShell eyebrow="CARTA DE SERVIÇOS" title={selectedService.title} onClose={() => setSelectedService(null)}><form onSubmit={createServiceRequest}><div className="service-request-summary full"><Landmark size={18} /><div><strong>{selectedService.department}</strong><span>{selectedService.deadline} · {selectedService.documents}</span></div></div><label className="field full"><span>Nome do solicitante</span><input name="requester" placeholder="Nome da pessoa, empresa ou entidade" /></label><NeighborhoodMapField neighborhood={serviceNeighborhood} address={serviceAddress} onNeighborhoodChange={setServiceNeighborhood} onAddressChange={setServiceAddress} /><label className="field full"><span>Descrição do serviço</span><textarea name="description" placeholder="Descreva a necessidade e acrescente referências para a equipe responsável." /></label><p className="ticket-modal-privacy"><ShieldCheck size={14} /> O bairro e o endereço serão vinculados ao protocolo para orientar a triagem e o atendimento em campo.</p><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setSelectedService(null)}>Cancelar</button><button className="button primary"><MapPin size={15} /> Solicitar e localizar</button></div></form></ModalShell>}
    </section>
  );
}

export function ProcessesSection({ department, notify }: { department: string; notify: Notify }) {
  const access = useCurrentPermission();
  const [tab, setTab] = useState<ProcessTab>("Processos");
  const [processes, setProcesses] = useState(INITIAL_PROCESSES);
  const [selected, setSelected] = useState(INITIAL_PROCESSES[0]);
  const [modal, setModal] = useState(false);

  function createProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item: ProcessItem = { id: makeDemoId(), protocol: `PA-2026-${String(processes.length + 129).padStart(5,"0")}`, subject: String(form.get("subject")), interested: String(form.get("interested")), owner: String(form.get("owner")) || "A definir", status: "Autuação", access: String(form.get("access")), updated: "Agora" };
    setProcesses((current) => [item, ...current]); setSelected(item); setModal(false); notify(`${item.protocol} autuado com registro cronológico e controle de acesso.`);
  }

  return <section className="municipal-module-shell">
    <div className="module-tabs wide-tabs" role="tablist" aria-label="Módulos de processos digitais">{(["Processos", "Despachos e pareceres", "Documentos e versões", "Assinaturas"] as ProcessTab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Processos" && <><div className="process-overview"><article className="panel process-stat"><FileText size={20} /><span><strong>64</strong><small>processos em tramitação</small></span></article><article className="panel process-stat"><Clock3 size={20} /><span><strong>8</strong><small>aguardando despacho</small></span></article><article className="panel process-stat"><FileSignature size={20} /><span><strong>5</strong><small>aguardando assinatura</small></span></article><article className="panel process-stat"><CheckCircle2 size={20} /><span><strong>31</strong><small>concluídos no mês</small></span></article></div><div className="process-layout"><article className="panel process-list"><div className="module-toolbar"><label className="module-search"><Search size={15} /><input aria-label="Buscar processo" placeholder="Buscar processo ou interessado..." /></label>{access.register && <button className="button primary" onClick={() => setModal(true)}><Plus size={15} /> Novo processo</button>}</div>{processes.map((item) => <button key={item.id} className={selected.id === item.id ? "process-row active" : "process-row"} onClick={() => setSelected(item)}><span><strong>{item.subject}</strong><small>{item.protocol} · {item.interested}</small></span><StatusTag>{item.status}</StatusTag><ChevronRight size={15} /></button>)}</article><ProcessDetail item={selected} notify={notify} /></div></>}
    {tab === "Despachos e pareceres" && <div className="document-workspace"><article className="panel document-editor"><header><div><p className="eyebrow">MINUTA ADMINISTRATIVA</p><h2>Despacho de encaminhamento</h2></div><span>Salvo às 15:42</span></header><div className="editor-toolbar"><button><strong>B</strong></button><button><em>I</em></button><button><ListChecks size={14} /></button><select aria-label="Modelo de documento"><option>Despacho</option><option>Parecer técnico</option><option>Memorando</option><option>Decisão administrativa</option></select></div><textarea aria-label="Conteúdo do despacho" defaultValue={`Processo: ${selected.protocol}\nInteressado: ${selected.interested}\n\nEncaminhe-se o presente processo ao setor competente para análise e manifestação, observando-se os documentos e prazos registrados nos autos.`} /><footer><button className="button secondary" onClick={() => notify("Minuta salva no processo.")}>Salvar minuta</button><button className="button primary" onClick={() => notify("Despacho registrado na linha do tempo do processo.")}><FileCheck2 size={15} /> Finalizar despacho</button></footer></article><aside className="panel template-list"><h2>Modelos disponíveis</h2>{["Despacho de encaminhamento","Parecer técnico","Solicitação de diligência","Termo de juntada","Decisão administrativa"].map((item,index) => <button key={item}><FileText size={15} /><span><strong>{item}</strong><small>{index + 2} campos automáticos</small></span><ChevronRight size={13} /></button>)}</aside></div>}
    {tab === "Documentos e versões" && <article className="panel municipal-table-panel"><div className="module-toolbar"><div><strong>Documentos de {selected.protocol}</strong><small>Versões anteriores permanecem disponíveis para auditoria e restauração.</small></div>{access.register && <button className="button primary" onClick={() => notify("Seletor de arquivo aberto para adicionar uma nova versão.")}><Plus size={15} /> Adicionar documento</button>}</div><div className="version-list">{[["Termo de referência.pdf","Versão 3","Jaime de Souza","Hoje, 10:21","Vigente"],["Pesquisa de preços.xlsx","Versão 2","Mariana Castro","12 ago., 16:08","Vigente"],["Parecer técnico.docx","Versão 1","Bruno Fonseca","11 ago., 09:44","Substituído"],["Minuta do contrato.pdf","Versão 4","Assessoria Jurídica","Hoje, 11:42","Em revisão"]].map((item) => <div key={item[0]}><span className="version-icon"><FileText size={17} /></span><span><strong>{item[0]}</strong><small>{item[1]} · {item[2]} · {item[3]}</small></span><StatusTag>{item[4]}</StatusTag><button onClick={() => notify(`${item[0]} preparado para download.`)}>Baixar</button><button onClick={() => notify(`Histórico de versões de ${item[0]} exibido.`)}>Versões</button></div>)}</div></article>}
    {tab === "Assinaturas" && <div className="signature-layout"><article className="panel signature-card"><span className="signature-icon"><FileSignature size={26} /></span><h2>Assinatura eletrônica</h2><p>Documentos podem receber assinatura simulada, código de validação e registro do signatário. A integração com um provedor oficial será necessária para validade jurídica externa.</p><div className="signature-steps"><span className="done"><Check size={13} /> Documento conferido</span><span className="done"><Check size={13} /> Signatários definidos</span><span><Clock3 size={13} /> Aguardando assinatura</span></div><button className="button primary" onClick={() => notify("Solicitação de assinatura simulada enviada aos signatários.")}><FileSignature size={15} /> Solicitar assinatura</button></article><article className="panel validation-card"><QrCode size={86} /><div><p className="eyebrow">VALIDAÇÃO PÚBLICA</p><h2>8AF3-26B1-9C04</h2><p>O código permite conferir a versão, a integridade e os signatários registrados no sistema.</p><button className="button secondary" onClick={() => notify("Código validado: documento íntegro e versão vigente.")}>Validar documento</button></div></article></div>}
    {modal && <ModalShell eyebrow="PROCESSO ADMINISTRATIVO DIGITAL" title="Autuar novo processo" onClose={() => setModal(false)}><form onSubmit={createProcess}><label className="field full"><span>Assunto *</span><input name="subject" required placeholder="Informe o objeto do processo" /></label><label className="field"><span>Interessado *</span><input name="interested" required defaultValue={department} /></label><label className="field"><span>Responsável</span><input name="owner" placeholder="Nome do servidor responsável" /></label><label className="field"><span>Nível de acesso</span><select name="access" defaultValue="Interno"><option>Público</option><option>Interno</option><option>Restrito — dados pessoais</option><option>Sigiloso</option></select></label><label className="field"><span>Tipo de processo</span><select><option>Administrativo</option><option>Contratação</option><option>Convênio</option><option>Apuração</option><option>Licenciamento</option></select></label><label className="field full"><span>Descrição inicial</span><textarea placeholder="Contextualize a abertura do processo" /></label><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(false)}>Cancelar</button><button className="button primary"><FileText size={15} /> Autuar processo</button></div></form></ModalShell>}
  </section>;
}

function ProcessDetail({ item, notify }: { item: ProcessItem; notify: Notify }) {
  const access = useCurrentPermission();
  return <aside className="panel process-detail"><header><div><p className="eyebrow">{item.protocol}</p><h2>{item.subject}</h2></div><StatusTag>{item.status}</StatusTag></header><dl><div><dt>Interessado</dt><dd>{item.interested}</dd></div><div><dt>Responsável atual</dt><dd>{item.owner}</dd></div><div><dt>Nível de acesso</dt><dd><ShieldCheck size={13} /> {item.access}</dd></div><div><dt>Última movimentação</dt><dd>{item.updated}</dd></div></dl><h3>Linha do tempo</h3><div className="process-timeline"><div className="current"><i /><span><strong>Encaminhado para parecer</strong><small>Hoje, 11:42 · Administração e Finanças</small></span></div><div><i /><span><strong>Documentos complementares juntados</strong><small>Hoje, 09:18 · 2 novos arquivos</small></span></div><div><i /><span><strong>Processo autuado</strong><small>11 ago., 14:05 · Secretaria de Governo</small></span></div></div><footer><button className="button secondary" onClick={() => notify("Histórico completo do processo exibido.")}>Ver autos</button>{access.edit && <button className="button primary" onClick={() => notify("Processo preparado para encaminhamento ao próximo setor.")}>Movimentar <ChevronRight size={14} /></button>}</footer></aside>;
}

export function MunicipalManagementSection({ department, notify }: { department: string; notify: Notify }) {
  const access = useCurrentPermission();
  const [tab, setTab] = useState<ManagementTab>("Frota");
  const [query, setQuery] = useState("");
  const [data, setData] = useState(MANAGEMENT_DATA);
  const [modal, setModal] = useState(false);
  const items = data[tab].filter((item) => [item.code, item.title, item.detail, item.owner, item.status].join(" ").toLowerCase().includes(query.toLowerCase()));
  const ActiveIcon = TAB_ICON[tab];

  function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const item: ManagementItem = { id: makeDemoId(), code: String(form.get("code")) || `${tab.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`, title: String(form.get("title")), detail: String(form.get("detail")), owner: String(form.get("owner")) || department, status: "Cadastrado", metric: String(form.get("metric")) || "Aguardando primeira atualização", due: String(form.get("due")) || "Sem prazo definido" };
    setData((current) => ({...current,[tab]:[item,...current[tab]]})); setModal(false); notify(`${item.code} incluído no módulo de ${tab.toLowerCase()}.`);
  }

  return <section className="municipal-module-shell"><div className="management-tabs" role="tablist" aria-label="Áreas da gestão municipal">{(Object.keys(MANAGEMENT_DATA) as ManagementTab[]).map((item) => { const Icon = TAB_ICON[item]; return <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}><span><Icon size={19} /></span><strong>{item}</strong><small>{MANAGEMENT_DATA[item].length} registros</small></button>; })}</div><article className="panel management-panel"><header><div><span className="management-title-icon"><ActiveIcon size={21} /></span><div><p className="eyebrow">CONTROLE MUNICIPAL</p><h2>{tab}</h2><p>{managementDescription(tab)}</p></div></div>{access.register && <button className="button primary" onClick={() => setModal(true)}><Plus size={15} /> Novo registro</button>}</header><div className="module-toolbar"><label className="module-search"><Search size={15} /><input aria-label={`Buscar em ${tab}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar em ${tab.toLowerCase()}...`} /></label><select aria-label="Filtrar situação"><option>Todas as situações</option><option>Regular</option><option>Requer atenção</option><option>Vencimento próximo</option></select><button className="button secondary" onClick={() => notify(`Relatório de ${tab.toLowerCase()} preparado para exportação.`)}>Exportar relatório</button></div><div className="management-grid">{items.map((item) => <article key={item.id}><header><span>{item.code}</span><StatusTag>{item.status}</StatusTag></header><h3>{item.title}</h3><p>{item.detail}</p><dl><div><dt>Responsável</dt><dd><UserRound size={13} /> {item.owner}</dd></div><div><dt>Indicador</dt><dd><Gauge size={13} /> {item.metric}</dd></div><div><dt>Prazo ou validade</dt><dd><Clock3 size={13} /> {item.due}</dd></div></dl><button onClick={() => notify(`Ficha completa de ${item.code} aberta com histórico e anexos.`)}>Abrir ficha completa <ChevronRight size={13} /></button></article>)}</div></article>{modal && access.register && <ModalShell eyebrow={`MÓDULO DE ${tab.toUpperCase()}`} title={`Novo registro de ${tab.toLowerCase()}`} onClose={() => setModal(false)}><form onSubmit={createRecord}><label className="field"><span>Código ou identificação</span><input name="code" placeholder="Gerado automaticamente se vazio" /></label><label className="field"><span>Responsável</span><input name="owner" defaultValue={department} /></label><label className="field full"><span>Título *</span><input name="title" required placeholder="Identifique o bem, contrato, veículo ou atividade" /></label><label className="field full"><span>Detalhes *</span><textarea name="detail" required placeholder="Localização, fornecedor, características ou observações" /></label><label className="field"><span>Indicador inicial</span><input name="metric" placeholder="Valor, quilometragem, saldo ou progresso" /></label><label className="field"><span>Prazo ou validade</span><input name="due" placeholder="Ex.: 30 set. 2026" /></label><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(false)}>Cancelar</button><button className="button primary"><Check size={15} /> Cadastrar</button></div></form></ModalShell>}</section>;
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
  return <section className="municipal-module-shell"><article className="panel indicator-toolbar"><div><p className="eyebrow">PAINEL GERENCIAL</p><h2>{department}</h2><p>Indicadores operacionais consolidados conforme o setor e o perfil de acesso.</p></div><div><select aria-label="Período do painel" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Agosto de 2026</option><option>Julho de 2026</option><option>2º trimestre de 2026</option><option>1º semestre de 2026</option></select><button className="button secondary" onClick={() => notify(`Relatório de ${period.toLowerCase()} preparado em PDF e planilha.`)}>Exportar PDF/Excel</button></div></article><div className="municipal-kpis indicator-kpis"><MetricCard icon={ClipboardCheck} label="Demandas concluídas" value="87%" detail="Meta mensal: 85%" tone="green" /><MetricCard icon={Clock3} label="Tempo médio" value="2,4 dias" detail="0,6 dia abaixo de julho" tone="blue" /><MetricCard icon={Gauge} label="Dentro do prazo" value="92%" detail="8 demandas com risco" tone="teal" /><MetricCard icon={Star} label="Satisfação" value="4,7/5" detail="184 avaliações" tone="amber" /></div><div className="analytics-grid"><article className="panel analytics-card"><header><div><h2>Demandas recebidas e concluídas</h2><p>Últimos seis meses</p></div><BarChart3 size={18} /></header><div className="bar-chart">{[["Mar",76,68],["Abr",84,75],["Mai",90,81],["Jun",82,79],["Jul",98,88],["Ago",104,92]].map(([month,received,done]) => <div key={String(month)}><div><i style={{height:`${Number(received)}%`}} /><i style={{height:`${Number(done)}%`}} /></div><span>{month}</span></div>)}</div><footer><span><i className="received" /> Recebidas</span><span><i className="done" /> Concluídas</span></footer></article><article className="panel analytics-card"><header><div><h2>Distribuição por categoria</h2><p>Chamados do setor</p></div><CircleDollarSign size={18} /></header><div className="category-bars">{[["Manutenção",38],["Atendimento",26],["Administrativo",19],["Eventos",10],["Outros",7]].map(([label,value]) => <div key={String(label)}><span>{label}</span><div><i style={{width:`${value}%`}} /></div><strong>{value}%</strong></div>)}</div></article><article className="panel analytics-card risk-card"><header><div><h2>Riscos e alertas</h2><p>Itens que requerem decisão</p></div><Clock3 size={18} /></header>{[["3 contratos vencem em até 45 dias","Revisar responsáveis"],["8 chamados próximos do prazo","Priorizar atendimento"],["2 itens abaixo do estoque mínimo","Gerar requisição"]].map((item,index) => <button key={item[0]} onClick={() => notify(item[1])}><span className={index === 0 ? "risk-high" : "risk-medium"}>{index + 1}</span><span><strong>{item[0]}</strong><small>{item[1]}</small></span><ChevronRight size={14} /></button>)}</article></div></section>;
}

export function SecuritySection({ department, notify }: { department: string; notify: Notify }) {
  const [settings, setSettings] = useState({ session:true,sensitive:true,exportLog:true,retention:false,notifications:true });
  const toggle = (key: keyof typeof settings) => { setSettings((current) => ({...current,[key]:!current[key]})); notify("Política atualizada para este protótipo."); };
  const roles = [
    ["Administrador geral","Total","Total","Total","Total","Total"],
    ["Responsável pelo setor","Setor","Criar e editar","Aprovar","Setor","Setor"],
    ["Funcionário","Setor","Criar e editar","Não","Setor","Não"],
    ["Fiscal ou auditor","Autorizado","Somente leitura","Não","Autorizado","Sim"],
    ["Visualizador","Setor","Somente leitura","Não","Não","Não"],
  ];
  return <section className="municipal-module-shell"><div className="security-hero"><span><ShieldCheck size={26} /></span><div><p className="eyebrow">GOVERNANÇA E PROTEÇÃO DE DADOS</p><h2>Segurança, LGPD e permissões</h2><p>Controles aplicados a {department}, com acesso mínimo necessário e rastreabilidade das operações.</p></div><div><strong>Proteção ativa</strong><small>Última revisão: 13 ago. 2026</small></div></div><div className="security-grid"><article className="panel permission-panel"><header><div><h2>Matriz de permissões</h2><p>Quem pode visualizar, editar, aprovar, exportar e administrar registros.</p></div><LockKeyhole size={18} /></header><div className="permission-table"><div><span>Perfil</span><span>Visualizar</span><span>Editar</span><span>Aprovar</span><span>Exportar</span><span>Administrar</span></div>{roles.map((row) => <div key={row[0]}>{row.map((value,index) => <span key={index} className={value === "Não" ? "denied" : index > 0 ? "allowed" : ""}>{index > 0 && value !== "Não" && <Check size={11} />}{value}</span>)}</div>)}</div></article><aside className="panel lgpd-panel"><header><div><h2>Políticas e preferências</h2><p>Configurações do ambiente e dos alertas</p></div><ShieldCheck size={18} /></header>{[["session","Encerrar sessões inativas","Após 30 minutos sem atividade"],["sensitive","Mascarar dados pessoais","CPF, telefone e endereço"],["exportLog","Registrar exportações","Usuário, data, filtro e finalidade"],["retention","Descarte automático","Aplicar tabela de temporalidade"],["notifications","Alertas operacionais","Prazos, aprovações, mensagens e documentos"]].map(([key,title,detail]) => <button key={key} onClick={() => toggle(key as keyof typeof settings)}><span><strong>{title}</strong><small>{detail}</small></span><i className={settings[key as keyof typeof settings] ? "toggle active" : "toggle"}><b /></i></button>)}</aside></div><div className="compliance-grid"><FeaturePanel icon={LockKeyhole} title="Dados pessoais" description="Classifique registros comuns, sensíveis, restritos ou sigilosos e aplique acesso compatível." items={["Finalidade e base de tratamento","Responsável pelo dado","Prazo de retenção","Registro de compartilhamento"]} action="Revisar cadastros" onAction={() => notify("Inventário de dados pessoais aberto para revisão.")} /><FeaturePanel icon={FileClock} title="Retenção e descarte" description="Defina prazos de guarda e acompanhe documentos que exigem eliminação ou recolhimento permanente." items={["Tabela de temporalidade","Bloqueio por litígio","Termo de eliminação","Preservação permanente"]} action="Abrir temporalidade" onAction={() => notify("Tabela de temporalidade aberta.")} /><FeaturePanel icon={ShieldCheck} title="Incidentes de segurança" description="Registre perda, exposição ou acesso indevido e acompanhe as providências adotadas." items={["Classificação do impacto","Dados e titulares afetados","Plano de resposta","Comunicações e evidências"]} action="Registrar incidente" onAction={() => notify("Formulário de incidente aberto com acesso restrito.")} /></div><article className="panel accessibility-panel"><span><Accessibility size={22} /></span><div><h2>Acessibilidade e inclusão digital</h2><p>Navegação por teclado, rótulos acessíveis, contraste adequado, foco visível e conteúdo compatível com leitores de tela.</p></div><StatusTag>Conformidade monitorada</StatusTag></article></section>;
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
      { title: "Proteja os dados", text: "Registre apenas os dados necessários. Em denúncias ou situações sensíveis, ative a restrição de identidade antes de salvar.", tip: "No ambiente de demonstração, use sempre nomes e documentos fictícios." },
      { title: "Faça a triagem", text: "Confirme o assunto, o setor responsável e o prazo. O protocolo gerado deve ser entregue ao cidadão para acompanhamento." },
      { title: "Responda e finalize", text: "Registre cada providência, prepare uma resposta clara e encerre somente quando houver retorno conclusivo ou justificativa formal." },
    ],
  },
  {
    id: "processos", category: "Processos", title: "Autuar e movimentar um processo digital", duration: "9 min",
    summary: "Autuação, documentos, despachos, níveis de acesso e assinatura simulada.",
    steps: [
      { title: "Autue o processo", text: "Abra Processos digitais, clique em Novo processo e informe assunto, interessado, responsável e nível de acesso." },
      { title: "Junte documentos", text: "Na aba Documentos e versões, adicione os arquivos relacionados. Novas versões preservam o histórico anterior para auditoria." },
      { title: "Produza o despacho", text: "Use Despachos e pareceres, escolha um modelo, revise os campos automáticos e finalize o documento." },
      { title: "Movimente ou assine", text: "Encaminhe ao próximo setor com uma providência clara. A assinatura do protótipo é demonstrativa e não substitui um provedor oficial." },
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
    summary: "Prioridades, formulários específicos, mapa, campo, metas e encaminhamentos.",
    steps: [
      { title: "Leia a central do dia", text: "Na Área do Setor, consulte indicadores, itens prioritários e o fluxo de trabalho antes de iniciar novos registros." },
      { title: "Use o formulário específico", text: "Em Cadastros, escolha o modelo adequado ao serviço. Os campos mudam de acordo com a secretaria ou departamento." },
      { title: "Registre o trabalho de campo", text: "Na aba Campo, selecione equipe, atividade, local, checklist e situação. O protótipo simula retenção temporária durante uma queda de conexão." },
      { title: "Encaminhe o mínimo necessário", text: "Em Encaminhamentos, selecione o setor de destino, a providência e o escopo dos dados compartilhados." },
    ],
  },
  {
    id: "permissoes", category: "Configurações", title: "Definir permissões dos funcionários", duration: "7 min",
    summary: "Perfis por função e direitos para visualizar, registrar ou alterar cada módulo.",
    steps: [
      { title: "Acesse como secretário", text: "Abra Configurações. A área aparece apenas para o responsável/secretário do setor no ambiente demonstrativo." },
      { title: "Selecione o perfil", text: "Escolha Atendimento, Operacional, Equipe de campo ou Consulta. Cada perfil pode reunir vários funcionários." },
      { title: "Marque as ações", text: "Para cada módulo, habilite Visualizar, Registrar e Alterar. Registrar ou Alterar exige que Visualizar também esteja ativo.", tip: "Comece com o menor acesso necessário e amplie somente quando houver justificativa." },
      { title: "Atribua os funcionários", text: "Na aba Funcionários e perfis, associe cada servidor ao perfil apropriado. Troque de usuário no topo para testar o resultado." },
    ],
  },
  {
    id: "relatorios", category: "Relatórios", title: "Filtrar e apresentar indicadores", duration: "5 min",
    summary: "Como preparar uma visão gerencial coerente para a demonstração.",
    steps: [
      { title: "Defina a pergunta", text: "Antes de filtrar, determine o que será demonstrado: volume, prazo, distribuição por setor ou conclusão." },
      { title: "Aplique período e setor", text: "Use filtros compatíveis entre si e confira se os indicadores representam o mesmo intervalo." },
      { title: "Explique os dados fictícios", text: "Informe que os números pertencem ao cenário de demonstração e servem para validar fluxos e telas." },
      { title: "Exporte somente o necessário", text: "Gere a visão adequada ao público e evite incluir colunas ou dados individuais que não ajudam na decisão." },
    ],
  },
];

export function HelpCenterSection({ notify }: { notify: Notify }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(HELP_TUTORIALS[0].id);
  const [completed, setCompleted] = useState<Record<string, number[]>>({});
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
    notify(`Tutorial “${selected.title}” concluído no modo demonstração.`);
  }

  return (
    <section className="municipal-module-shell help-center">
      <div className="help-hero">
        <span><HelpCircle size={30} /></span><p className="eyebrow">CENTRAL DE CONHECIMENTO</p><h2>Aprenda fazendo</h2>
        <p>Tutoriais completos para apresentar e testar os principais fluxos do Prefeitura Conecta.</p>
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
        <article className="panel quick-help"><h2>Respostas rápidas</h2>{["O botão sumiu? Verifique a permissão do perfil.", "Notificação sem som? Ative em Configurações.", "Dados do protótipo ficam salvos neste navegador."].map((item) => <button key={item} onClick={() => notify(item)}><CheckCircle2 size={14} /><span>{item}</span><ChevronRight size={13} /></button>)}</article>
        <article className="panel support-contact"><span><MessageSquareText size={20} /></span><div><h2>Encontrou uma dificuldade?</h2><p>Registre o módulo, o perfil usado e o que esperava acontecer durante o teste.</p></div><button className="button primary" onClick={() => notify("Chamado de suporte de demonstração preparado para preenchimento.")}>Abrir suporte</button></article>
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
