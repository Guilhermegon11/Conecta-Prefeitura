"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BellRing,
  Building2,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Download,
  FileText,
  Files,
  Hash,
  HelpCircle,
  History,
  Inbox,
  Landmark,
  LayoutDashboard,
  List,
  ListTodo,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  MessagesSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Upload,
  UserRound,
  UserPlus,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TicketStatus = "Recebido" | "Em produção" | "Aguardando aprovação" | "Finalizado";
type Priority = "Alta" | "Média" | "Baixa";
type NavItem = "Visão geral" | "Chamados" | "Comunicação" | "Notificações" | "Pendências" | "Documentos" | "Secretarias" | "Auditoria";
type ChatTab = "direct" | "group";
type OfficeCategory = "Prefeitura e apoio" | "Secretarias" | "Departamentos" | "Seções e subprefeitura";

type Ticket = { id: string; protocol: string; title: string; description: string; requester: string; department: string; priority: Priority; status: TicketStatus; dueDate: string | null; assigneeId: string | null; assigneeName?: string; assigneeInitials?: string; createdAt: string; updatedAt: string };
type User = { id: string; fullName: string; email: string; department: string; role: string; initials: string };
type Office = { id: string; name: string; head: string; hours: string; phone: string; email: string; address: string; category: OfficeCategory };
type Group = { id: string; name: string; description: string; memberCount: number; createdAt: string; memberUserIds?: string[]; pendingUserIds?: string[] };
type Message = { id: string; conversationType: ChatTab; conversationId: string; senderId: string; senderName: string; senderInitials: string; body: string; attachmentName?: string | null; ticketId?: string | null; createdAt: string };
type DocumentItem = { id: string; name: string; category: string; ownerId: string; ownerName: string; ticketId?: string | null; contentType: string; size: number; createdAt: string };
type AuditItem = { id: string; action: string; entityType: string; entityId: string; detail: string; createdAt: string; actorName: string; actorInitials: string };
type NotificationItem = { id: string; userId: string; type: "group_invite" | "ticket" | "message" | "system"; title: string; body: string; relatedEntityId?: string | null; readAt?: string | null; createdAt: string; actorName?: string; actorInitials?: string };
type GroupInvitation = { groupId: string; userId: string; groupName: string; description: string; invitedByName: string; invitedByInitials: string; memberCount: number; status: "convidado" | "aceito" | "recusado"; createdAt: string };
type BootstrapPayload = { users?: User[]; tickets?: Ticket[]; groups?: Array<Group & { memberCount: string | number }>; messages?: Message[]; documents?: DocumentItem[]; audit?: AuditItem[]; notifications?: NotificationItem[]; invitations?: Array<GroupInvitation & { memberCount: string | number }> };

const OFFICE_CATEGORIES: OfficeCategory[] = ["Prefeitura e apoio", "Secretarias", "Departamentos", "Seções e subprefeitura"];

const OFFICES: Office[] = [
  { id: "controle-interno", name: "Controle Interno", head: "Rosilene Soares Souza Carvalho", hours: "07:00h às 13:00h", phone: "(38) 3731-2883", email: "controladoria@varzeadapalma.mg.gov.br", address: "Rua Cláudio Manoel da Costa, 1000 — Pinlar I — Várzea da Palma/MG", category: "Prefeitura e apoio" },
  { id: "gabinete-prefeito", name: "Gabinete do Prefeito", head: "Rodrigo Aguiar Dalla Bernardina", hours: "07:00h às 13:00h", phone: "(38) 3731-9205", email: "gabinete@varzeadapalma.mg.gov.br", address: "Rua Cláudio Manoel da Costa, 1000 — Pinlar I — Várzea da Palma/MG", category: "Prefeitura e apoio" },
  { id: "comunicacao-eventos", name: "Secretaria de Comunicação e Eventos", head: "Wharley Marques de Lima", hours: "07:00h às 13:00h", phone: "(38) 3731-9209", email: "ascompalma@gmail.com", address: "Rua Cláudio Manoel da Costa, 1000 — Pinlar I — Várzea da Palma/MG", category: "Prefeitura e apoio" },
  { id: "governo", name: "Secretaria de Governo", head: "Artur Paulo Fagundes Rabelo", hours: "07:00h às 13:00h", phone: "(38) 3731-9205", email: "gabinete@varzeadapalma.mg.gov.br", address: "Rua Cláudio Manoel da Costa, 1000 — Pinlar I — Várzea da Palma/MG", category: "Prefeitura e apoio" },
  { id: "administracao-financas", name: "Secretaria de Administração e Finanças", head: "Jaime de Souza", hours: "07:00h às 13:00h", phone: "(38) 3731-9203", email: "financas@varzeadapalma.mg.gov.br", address: "Rua Cláudio Manoel da Costa, 1000 — Pinlar I — Várzea da Palma/MG", category: "Secretarias" },
  { id: "desenvolvimento-social", name: "Secretaria de Desenvolvimento Social", head: "Guilherme Oliveira Fonseca", hours: "07:00h às 13:00h", phone: "(38) 3731-3517", email: "smds@varzeadapalma.mg.gov.br", address: "Av. Adelino Aguiar, 320 — Pinlar I — Várzea da Palma/MG", category: "Secretarias" },
  { id: "educacao", name: "Secretaria de Educação", head: "Leila Cibeli Silveira Mendes", hours: "07:00h às 13:00h", phone: "(38) 3731-1137", email: "semec@varzeadapalma.mg.gov.br", address: "Rua Safira, 1244 — Centro — Várzea da Palma/MG", category: "Secretarias" },
  { id: "infraestrutura-transporte", name: "Secretaria de Infraestrutura e Transporte", head: "Bruno Gonçalves da Fonseca", hours: "07:00h às 13:00h", phone: "(38) 3731-2255", email: "obras@varzeadapalma.mg.gov.br", address: "Rua Dr. Ensch, 1073 — Centro — Várzea da Palma/MG", category: "Secretarias" },
  { id: "saude", name: "Secretaria de Saúde", head: "Natália Cristina Pedrosa Cabral", hours: "07:00h às 13:00h", phone: "(38) 3731-1138", email: "saude@varzeadapalma.mg.gov.br", address: "Rua Reinaldo Rodrigues, 305 — Planalto — Várzea da Palma/MG", category: "Secretarias" },
  { id: "desenvolvimento-economico", name: "Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente", head: "Lucas Fontinelli de Oliveira da Silva", hours: "07:00h às 13:00h", phone: "(38) 3731-1232", email: "desenvolvimentoeconomico@varzeadapalma.mg.gov.br", address: "Rua Pedro Rodrigues de Menezes, 1474 — Centro — Várzea da Palma/MG", category: "Secretarias" },
  { id: "cultura-turismo", name: "Secretaria de Cultura e Turismo", head: "Pedro Umberto Baeta Camargos", hours: "07:00h às 11:00h e 13:00h às 17:00h", phone: "(38) 3731-3542", email: "cultura@varzeadapalma.mg.gov.br", address: "Estação Ferroviária — Várzea da Palma/MG", category: "Secretarias" },
  { id: "execucao-obras", name: "Departamento de Execução de Obras", head: "Alan Kelve", hours: "07:00h às 17:00h", phone: "(38) 3731-3226", email: "secretariaobras50@gmail.com", address: "Avenida Dr. Mallard, 1531 — Centro — Várzea da Palma/MG", category: "Departamentos" },
  { id: "transportes", name: "Departamento de Transportes", head: "Maurício Hugel de Azevedo", hours: "07:00h às 17:00h", phone: "(38) 3731-2255", email: "transportes.vzp@hotmail.com", address: "Rua Emboabas, 1564 — Centro — Várzea da Palma/MG", category: "Departamentos" },
  { id: "esporte-lazer", name: "Departamento de Esporte e Lazer", head: "Júnio Fernandes da Silva", hours: "07:00h às 13:00h", phone: "(38) 3731-1450", email: "esporte.vzp@gmail.com", address: "Rua Esmeralda, 531 — Planalto — Várzea da Palma/MG", category: "Departamentos" },
  { id: "vigilancia-sanitaria", name: "Departamento de Vigilância Sanitária", head: "Paula Patrício Silva", hours: "07:00h às 14:00h", phone: "(38) 3731-3743", email: "vigilanciaemsaude@varzeadapalma.mg.gov.br", address: "Alameda Acácias, 1300 — Pinlar, próximo ao cemitério velho", category: "Departamentos" },
  { id: "controle-avaliacao", name: "Seção de Controle e Avaliação", head: "Anselmo Caetano de Paula", hours: "07:00h às 17:00h", phone: "(38) 3731-2266", email: "semedpedagogicovzp@gmail.com", address: "Rua Safira, 1244 — Centro — Várzea da Palma/MG", category: "Seções e subprefeitura" },
  { id: "patrimonio-cultura", name: "Subseção de Patrimônio Histórico e Cultura", head: "Marco Antonio Ramos", hours: "07:00h às 13:00h", phone: "(38) 3731-3542", email: "marco.ramos@educacao.mg.gov.br", address: "Setor Cultural — Casa da Cultura e Memorial Iconográfico Dr. Luiz de Paula Ferreira", category: "Seções e subprefeitura" },
  { id: "subsecao-esportes", name: "Subseção de Esportes", head: "Júnio Fernandes da Silva", hours: "07:00h às 13:00h", phone: "(38) 3731-1450", email: "agnaldoresgate@gmail.com", address: "Rua Esmeralda, 531 — Planalto — Várzea da Palma/MG", category: "Seções e subprefeitura" },
  { id: "subprefeitura-guaicui", name: "Subprefeitura da Barra do Guaicuí", head: "Dalila Correa", hours: "07:00h às 11:00h e 13:00h às 17:00h", phone: "(38) 3731-5022", email: "sub-prefeituraguaicui@hotmail.com", address: "Rua S. Pedro, 40 — Guaicuí — Várzea da Palma/MG — CEP 39265-000", category: "Seções e subprefeitura" },
];

const USERS: User[] = [
  { id: "u-ana", fullName: "Ana Martins", email: "ana.martins@prefeitura.gov.br", department: "Secretaria de Governo", role: "Administrador", initials: "AM" },
  { id: "u-rafael", fullName: "Rafael Costa", email: "rafael.costa@prefeitura.gov.br", department: "Infraestrutura", role: "Secretário", initials: "RC" },
  { id: "u-lucas", fullName: "Lucas Mendes", email: "lucas.mendes@prefeitura.gov.br", department: "Saúde", role: "Secretário", initials: "LM" },
  { id: "u-amanda", fullName: "Amanda Silva", email: "amanda.silva@prefeitura.gov.br", department: "Educação", role: "Secretária", initials: "AS" },
  { id: "u-carla", fullName: "Carla Prado", email: "carla.prado@prefeitura.gov.br", department: "Procuradoria", role: "Secretária", initials: "CP" },
  { id: "u-felipe", fullName: "Felipe Barros", email: "felipe.barros@prefeitura.gov.br", department: "Meio Ambiente", role: "Secretário", initials: "FB" },
];

const INITIAL_TICKETS: Ticket[] = [
  { id: "t-187", protocol: "CH-2026-0187", title: "Manutenção da iluminação na Praça Central", description: "Substituição de luminárias e revisão do quadro elétrico.", requester: "Ouvidoria Municipal", department: "Infraestrutura", priority: "Alta", status: "Em produção", dueDate: "2026-08-13T19:00:00.000Z", assigneeId: "u-rafael", assigneeName: "Rafael Costa", assigneeInitials: "RC", createdAt: "2026-08-13T10:00:00.000Z", updatedAt: "2026-08-13T14:36:00.000Z" },
  { id: "t-186", protocol: "CH-2026-0186", title: "Revisão do calendário de vacinação", description: "Validar datas, locais e comunicação da campanha.", requester: "Gabinete do Prefeito", department: "Saúde", priority: "Média", status: "Aguardando aprovação", dueDate: "2026-08-14T18:00:00.000Z", assigneeId: "u-lucas", assigneeName: "Lucas Mendes", assigneeInitials: "LM", createdAt: "2026-08-12T13:00:00.000Z", updatedAt: "2026-08-13T14:52:00.000Z" },
  { id: "t-185", protocol: "CH-2026-0185", title: "Atualização do transporte escolar — Zona Norte", description: "Revisar itinerários antes da volta às aulas.", requester: "Secretaria de Educação", department: "Mobilidade", priority: "Alta", status: "Recebido", dueDate: "2026-08-15T18:00:00.000Z", assigneeId: "u-amanda", assigneeName: "Amanda Silva", assigneeInitials: "AS", createdAt: "2026-08-12T11:00:00.000Z", updatedAt: "2026-08-12T11:00:00.000Z" },
  { id: "t-184", protocol: "CH-2026-0184", title: "Parecer sobre contratação emergencial", description: "Análise jurídica concluída.", requester: "Secretaria de Administração", department: "Procuradoria", priority: "Baixa", status: "Finalizado", dueDate: "2026-08-12T18:00:00.000Z", assigneeId: "u-carla", assigneeName: "Carla Prado", assigneeInitials: "CP", createdAt: "2026-08-10T09:00:00.000Z", updatedAt: "2026-08-13T12:00:00.000Z" },
  { id: "t-183", protocol: "CH-2026-0183", title: "Liberação de área para feira de produtores", description: "Avaliação ambiental e autorização de uso.", requester: "Desenvolvimento Econômico", department: "Meio Ambiente", priority: "Média", status: "Em produção", dueDate: "2026-08-16T18:00:00.000Z", assigneeId: "u-felipe", assigneeName: "Felipe Barros", assigneeInitials: "FB", createdAt: "2026-08-11T15:00:00.000Z", updatedAt: "2026-08-13T11:00:00.000Z" },
];

const INITIAL_GROUPS: Group[] = [
  { id: "g-volta-aulas", name: "Operação Volta às Aulas 2026", description: "Educação, Mobilidade e Governo", memberCount: 3, createdAt: "2026-08-13T14:00:00.000Z", memberUserIds: ["u-ana", "u-amanda"], pendingUserIds: ["u-rafael"] },
  { id: "g-centro", name: "Revitalização do Centro", description: "Obras e comunicação institucional", memberCount: 3, createdAt: "2026-08-11T10:00:00.000Z", memberUserIds: ["u-ana", "u-rafael", "u-carla"], pendingUserIds: [] },
  { id: "g-saude-digital", name: "Comitê de Saúde Digital", description: "Integração dos atendimentos e sistemas da rede municipal.", memberCount: 1, createdAt: "2026-08-13T14:45:00.000Z", memberUserIds: ["u-lucas"], pendingUserIds: ["u-ana"] },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "n-convite-saude", userId: "u-ana", type: "group_invite", title: "Novo convite para grupo", body: "Lucas Mendes convidou você para o Comitê de Saúde Digital.", relatedEntityId: "g-saude-digital", readAt: null, createdAt: "2026-08-13T14:45:00.000Z", actorName: "Lucas Mendes", actorInitials: "LM" },
  { id: "n-convite-volta-aulas", userId: "u-rafael", type: "group_invite", title: "Novo convite para grupo", body: "Amanda Silva convidou você para Operação Volta às Aulas 2026.", relatedEntityId: "g-volta-aulas", readAt: null, createdAt: "2026-08-13T14:00:00.000Z", actorName: "Amanda Silva", actorInitials: "AS" },
  { id: "n-aprovacao", userId: "u-ana", type: "ticket", title: "Chamado aguardando aprovação", body: "O chamado CH-2026-0186 está pronto para sua análise.", relatedEntityId: "t-186", readAt: null, createdAt: "2026-08-13T14:52:00.000Z", actorName: "Lucas Mendes", actorInitials: "LM" },
  { id: "n-documento", userId: "u-ana", type: "message", title: "Documento recebido", body: "Rafael Costa enviou o Relatório técnico — Iluminação.pdf.", relatedEntityId: "m-3", readAt: "2026-08-13T14:40:00.000Z", createdAt: "2026-08-13T14:36:00.000Z", actorName: "Rafael Costa", actorInitials: "RC" },
];

const INITIAL_INVITATIONS: GroupInvitation[] = [
  { groupId: "g-saude-digital", userId: "u-ana", groupName: "Comitê de Saúde Digital", description: "Integração dos atendimentos e sistemas da rede municipal.", invitedByName: "Lucas Mendes", invitedByInitials: "LM", memberCount: 1, status: "convidado", createdAt: "2026-08-13T14:45:00.000Z" },
  { groupId: "g-volta-aulas", userId: "u-rafael", groupName: "Operação Volta às Aulas 2026", description: "Educação, Mobilidade e Governo", invitedByName: "Amanda Silva", invitedByInitials: "AS", memberCount: 2, status: "convidado", createdAt: "2026-08-13T14:00:00.000Z" },
];

const INITIAL_MESSAGES: Message[] = [
  { id: "m-1", conversationType: "direct", conversationId: "u-rafael", senderId: "u-rafael", senderName: "Rafael Costa", senderInitials: "RC", body: "Bom dia, Ana. A equipe já iniciou a vistoria na Praça Central.", ticketId: "t-187", createdAt: "2026-08-13T14:20:00.000Z" },
  { id: "m-2", conversationType: "direct", conversationId: "u-rafael", senderId: "u-ana", senderName: "Ana Martins", senderInitials: "AM", body: "Ótimo. Por favor, envie o relatório técnico assim que estiver pronto.", ticketId: "t-187", createdAt: "2026-08-13T14:24:00.000Z" },
  { id: "m-3", conversationType: "direct", conversationId: "u-rafael", senderId: "u-rafael", senderName: "Rafael Costa", senderInitials: "RC", body: "Segue a primeira versão para conferência.", attachmentName: "Relatório técnico — Iluminação.pdf", ticketId: "t-187", createdAt: "2026-08-13T14:36:00.000Z" },
  { id: "m-4", conversationType: "group", conversationId: "g-volta-aulas", senderId: "u-amanda", senderName: "Amanda Silva", senderInitials: "AS", body: "Incluí a planilha com os novos itinerários. Precisamos da validação até amanhã.", ticketId: "t-185", createdAt: "2026-08-13T14:10:00.000Z" },
];

const INITIAL_DOCS: DocumentItem[] = [
  { id: "d-1", name: "Relatório técnico — Iluminação.pdf", category: "Relatório técnico", ownerId: "u-rafael", ownerName: "Rafael Costa", ticketId: "t-187", contentType: "application/pdf", size: 2480000, createdAt: "2026-08-13T14:36:00.000Z" },
  { id: "d-2", name: "Itinerários escolares — Zona Norte.xlsx", category: "Planilha", ownerId: "u-amanda", ownerName: "Amanda Silva", ticketId: "t-185", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 840000, createdAt: "2026-08-13T14:10:00.000Z" },
  { id: "d-3", name: "Parecer jurídico 042-2026.pdf", category: "Parecer", ownerId: "u-carla", ownerName: "Carla Prado", ticketId: "t-184", contentType: "application/pdf", size: 1320000, createdAt: "2026-08-13T12:00:00.000Z" },
];

const INITIAL_AUDIT: AuditItem[] = [
  { id: "a-1", action: "status_atualizado", entityType: "chamado", entityId: "t-186", detail: "Calendário de vacinação movido para Aguardando aprovação", createdAt: "2026-08-13T14:52:00.000Z", actorName: "Lucas Mendes", actorInitials: "LM" },
  { id: "a-2", action: "documento_enviado", entityType: "mensagem", entityId: "m-3", detail: "Relatório técnico — Iluminação.pdf enviado no chat", createdAt: "2026-08-13T14:36:00.000Z", actorName: "Rafael Costa", actorInitials: "RC" },
  { id: "a-3", action: "grupo_criado", entityType: "grupo", entityId: "g-volta-aulas", detail: "Grupo Operação Volta às Aulas 2026 criado", createdAt: "2026-08-13T14:00:00.000Z", actorName: "Amanda Silva", actorInitials: "AS" },
  { id: "a-4", action: "chamado_finalizado", entityType: "chamado", entityId: "t-184", detail: "Parecer sobre contratação emergencial finalizado", createdAt: "2026-08-13T12:00:00.000Z", actorName: "Carla Prado", actorInitials: "CP" },
];

const navIcons: Record<NavItem, LucideIcon> = {
  "Visão geral": LayoutDashboard,
  Chamados: ClipboardList,
  Comunicação: MessagesSquare,
  Notificações: BellRing,
  Pendências: ListTodo,
  Documentos: Files,
  Secretarias: Building2,
  Auditoria: History,
};
const statusMeta: Record<TicketStatus, { color: string; short: string; icon: LucideIcon }> = {
  Recebido: { color: "blue", short: "Recebidos", icon: Inbox },
  "Em produção": { color: "amber", short: "Em produção", icon: LoaderCircle },
  "Aguardando aprovação": { color: "violet", short: "Em aprovação", icon: Clock3 },
  Finalizado: { color: "green", short: "Finalizados", icon: CheckCircle2 },
};
const statuses = Object.keys(statusMeta) as TicketStatus[];

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavItem>("Visão geral");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("u-ana");
  const [search, setSearch] = useState("");
  const [ticketData, setTicketData] = useState(INITIAL_TICKETS);
  const [users, setUsers] = useState(USERS);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [documents, setDocuments] = useState(INITIAL_DOCS);
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [invitations, setInvitations] = useState(INITIAL_INVITATIONS);
  const [ticketModal, setTicketModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const currentUser = users.find((user) => user.id === currentUserId) ?? USERS[0];
  const currentNotifications = notifications.filter((item) => item.userId === currentUserId);
  const currentInvitations = invitations.filter((item) => item.userId === currentUserId && item.status === "convidado");
  const pendingTickets = ticketData.filter((ticket) => ticket.status === "Aguardando aprovação");
  const unreadCount = currentNotifications.filter((item) => !item.readAt).length;
  const pendingCount = currentInvitations.length + pendingTickets.length;
  const accessibleGroups = groups.filter((group) => !group.memberUserIds || group.memberUserIds.includes(currentUserId));

  useEffect(() => {
    fetch(`/api/bootstrap?userId=${encodeURIComponent(currentUserId)}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      const payload = data as BootstrapPayload;
      if (payload.users?.length) setUsers(payload.users);
      if (payload.tickets?.length) setTicketData(payload.tickets);
      if (Array.isArray(payload.groups)) setGroups(payload.groups.map((group) => ({ ...group, memberCount: Number(group.memberCount) })));
      if (payload.messages?.length) setMessages(payload.messages);
      if (payload.documents?.length) setDocuments(payload.documents);
      if (payload.audit?.length) setAudit(payload.audit);
      if (Array.isArray(payload.notifications)) setNotifications((current) => [...current.filter((item) => item.userId !== currentUserId), ...payload.notifications!]);
      if (Array.isArray(payload.invitations)) setInvitations((current) => [...current.filter((item) => item.userId !== currentUserId), ...payload.invitations!.map((item) => ({ ...item, memberCount: Number(item.memberCount) }))]);
    }).catch(() => undefined);
  }, [currentUserId]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ticketData;
    return ticketData.filter((ticket) => [ticket.protocol, ticket.title, ticket.requester, ticket.department].join(" ").toLowerCase().includes(term));
  }, [search, ticketData]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  async function createTicket(form: FormData) {
    const now = new Date().toISOString();
    const assigneeId = String(form.get("assigneeId") || "") || null;
    const assignee = users.find((user) => user.id === assigneeId);
    const temporary: Ticket = {
      id: `temp-${Date.now()}`, protocol: `CH-2026-${String(ticketData.length + 188).padStart(4, "0")}`,
      title: String(form.get("title")), description: String(form.get("description")), requester: currentUser.department,
      department: String(form.get("department")), priority: String(form.get("priority")) as Priority, status: "Recebido",
      dueDate: String(form.get("dueDate")) || null, assigneeId, assigneeName: assignee?.fullName, assigneeInitials: assignee?.initials, createdAt: now, updatedAt: now,
    };
    setTicketData((current) => [temporary, ...current]);
    addAudit("chamado_criado", "chamado", temporary.id, `${temporary.protocol} criado: ${temporary.title}`);
    setTicketModal(false);
    setActiveNav("Chamados");
    notify("Chamado criado e registrado no histórico.");
    try {
      const response = await fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create_ticket", userId: currentUserId, requester: currentUser.department, ...Object.fromEntries(form.entries()) }) });
      if (response.ok) {
        const saved = await response.json() as { id: string; protocol: string };
        setTicketData((current) => current.map((item) => item.id === temporary.id ? { ...item, id: saved.id, protocol: saved.protocol } : item));
      }
    } catch { /* O protótipo continua funcional durante a prévia local. */ }
  }

  function updateStatus(id: string, status: TicketStatus) {
    setTicketData((current) => current.map((ticket) => ticket.id === id ? { ...ticket, status, updatedAt: new Date().toISOString() } : ticket));
    const ticket = ticketData.find((item) => item.id === id);
    addAudit("status_atualizado", "chamado", id, `${ticket?.protocol ?? "Chamado"} movido para ${status}`);
    notify(`Chamado movido para “${status}”.`);
    void fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "update_ticket", id, status, userId: currentUserId }) }).catch(() => undefined);
  }

  function addAudit(action: string, entityType: string, entityId: string, detail: string) {
    setAudit((current) => [{ id: makeId(), action, entityType, entityId, detail, createdAt: new Date().toISOString(), actorName: currentUser.fullName, actorInitials: currentUser.initials }, ...current]);
  }

  async function uploadFile(file: File) {
    const item: DocumentItem = { id: `temp-${Date.now()}`, name: file.name, category: "Documento", ownerId: currentUser.id, ownerName: currentUser.fullName, contentType: file.type || "application/octet-stream", size: file.size, createdAt: new Date().toISOString() };
    setDocuments((current) => [item, ...current]);
    addAudit("documento_enviado", "documento", item.id, `${file.name} enviado para a plataforma`);
    notify("Arquivo anexado e registrado.");
    const form = new FormData(); form.append("file", file); form.append("category", "Documento");
    try {
      const response = await fetch("/api/files", { method: "POST", body: form });
      if (response.ok) { const saved = await response.json() as { id: string }; setDocuments((current) => current.map((doc) => doc.id === item.id ? { ...doc, id: saved.id } : doc)); }
    } catch { /* Mantém a demonstração disponível. */ }
  }

  function markNotification(id: string) {
    const now = new Date().toISOString();
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, readAt: now } : item));
    void fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "mark_notification", id, userId: currentUserId }) }).catch(() => undefined);
  }

  function markAllNotifications() {
    const unread = currentNotifications.filter((item) => !item.readAt);
    if (!unread.length) { notify("Não há novas notificações."); return; }
    const now = new Date().toISOString();
    setNotifications((current) => current.map((item) => item.userId === currentUserId ? { ...item, readAt: item.readAt ?? now } : item));
    notify("Todas as notificações foram marcadas como lidas.");
    void fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "mark_all_notifications", userId: currentUserId }) }).catch(() => undefined);
  }

  async function respondInvitation(invitation: GroupInvitation, response: "aceito" | "recusado") {
    const now = new Date().toISOString();
    setInvitations((current) => current.map((item) => item.groupId === invitation.groupId && item.userId === currentUserId ? { ...item, status: response } : item));
    setNotifications((current) => current.map((item) => item.userId === currentUserId && item.relatedEntityId === invitation.groupId ? { ...item, readAt: now } : item));
    if (response === "aceito") {
      setGroups((current) => {
        const existing = current.find((group) => group.id === invitation.groupId);
        if (existing) return current.map((group) => group.id === invitation.groupId ? { ...group, memberCount: Math.max(group.memberCount, invitation.memberCount + 1), memberUserIds: Array.from(new Set([...(group.memberUserIds ?? []), currentUserId])), pendingUserIds: (group.pendingUserIds ?? []).filter((id) => id !== currentUserId) } : group);
        return [{ id: invitation.groupId, name: invitation.groupName, description: invitation.description, memberCount: invitation.memberCount + 1, createdAt: invitation.createdAt, memberUserIds: [currentUserId], pendingUserIds: [] }, ...current];
      });
      addAudit("convite_aceito", "grupo", invitation.groupId, `${currentUser.fullName} aceitou o convite para ${invitation.groupName}`);
      notify(`Você entrou no grupo “${invitation.groupName}”.`);
    } else {
      setGroups((current) => current.map((group) => group.id === invitation.groupId ? { ...group, pendingUserIds: (group.pendingUserIds ?? []).filter((id) => id !== currentUserId) } : group));
      addAudit("convite_recusado", "grupo", invitation.groupId, `${currentUser.fullName} recusou o convite para ${invitation.groupName}`);
      notify("Convite recusado.");
    }
    try {
      const request = await fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "respond_invitation", groupId: invitation.groupId, response, userId: currentUserId }) });
      if (request.ok && response === "aceito") {
        const saved = await request.json() as { group?: Group };
        const savedGroup = saved.group;
        if (savedGroup) setGroups((current) => [savedGroup, ...current.filter((group) => group.id !== savedGroup.id)]);
      }
    } catch { /* A experiência local continua funcional para demonstração. */ }
  }

  function createGroup(group: Group, memberIds: string[]) {
    const createdGroup = { ...group, memberUserIds: [currentUserId], pendingUserIds: memberIds };
    const newInvitations = memberIds.map((userId): GroupInvitation => ({ groupId: group.id, userId, groupName: group.name, description: group.description, invitedByName: currentUser.fullName, invitedByInitials: currentUser.initials, memberCount: 1, status: "convidado", createdAt: group.createdAt }));
    const newNotifications = memberIds.map((userId): NotificationItem => ({ id: makeId(), userId, type: "group_invite", title: "Novo convite para grupo", body: `${currentUser.fullName} convidou você para ${group.name}.`, relatedEntityId: group.id, readAt: null, createdAt: group.createdAt, actorName: currentUser.fullName, actorInitials: currentUser.initials }));
    setGroups((current) => [createdGroup, ...current]);
    setInvitations((current) => [...newInvitations, ...current]);
    setNotifications((current) => [...newNotifications, ...current]);
    addAudit("grupo_criado", "grupo", group.id, `Grupo ${group.name} criado com ${memberIds.length} convites enviados`);
    setGroupModal(false);
    setActiveNav("Comunicação");
    notify(`${memberIds.length} ${memberIds.length === 1 ? "convite enviado" : "convites enviados"} pelo sistema.`);
    void fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create_group", id: group.id, name: group.name, description: group.description, memberIds, userId: currentUserId }) }).catch(() => undefined);
  }

  const heading = getHeading(activeNav);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><Landmark size={21} strokeWidth={2.2} /></div>
          <div><strong>Prefeitura Conecta</strong><small>Gestão Integrada</small></div>
        </div>
        <nav className="main-nav" aria-label="Navegação principal">
          <span className="nav-label">MENU PRINCIPAL</span>
          {(Object.keys(navIcons) as NavItem[]).map((item) => {
            const NavIcon = navIcons[item];
            return (
              <button key={item} className={activeNav === item ? "nav-item active" : "nav-item"} onClick={() => { setActiveNav(item); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true"><NavIcon size={18} strokeWidth={2} /></span>
                <span>{item}</span>
                {item === "Comunicação" && <span className="nav-badge">5</span>}
                {item === "Notificações" && unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                {item === "Pendências" && pendingCount > 0 && <span className="nav-badge pending-badge">{pendingCount}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-support">
          <div className="support-icon"><HelpCircle size={17} /></div>
          <div><strong>Precisa de ajuda?</strong><p>Acesse o guia da plataforma ou fale com o suporte.</p><button>Central de ajuda <ArrowRight size={12} /></button></div>
        </div>
        <div className="sidebar-profile">
          <div className="avatar avatar-large">{currentUser.initials}</div>
          <div className="profile-copy"><strong>{currentUser.fullName}</strong><span>{currentUser.department}</span></div>
          <button className="icon-button" aria-label="Opções do perfil"><MoreHorizontal size={18} /></button>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Buscar chamados, pessoas ou documentos..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-actions">
            <button className="icon-button notification-button" aria-label={`Notificações${unreadCount ? `: ${unreadCount} novas` : ""}`} onClick={() => setActiveNav("Notificações")}><Bell size={18} />{unreadCount > 0 && <span />}</button>
            <label className="account-switch"><div className="avatar">{currentUser.initials}</div><span><small>VISUALIZAR COMO</small><select aria-label="Visualizar como usuário" value={currentUserId} onChange={(event) => setCurrentUserId(event.target.value)}>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName} — {user.department}</option>)}</select></span></label>
          </div>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div><p className="eyebrow">{activeNav === "Visão geral" ? "QUINTA-FEIRA, 13 DE AGOSTO" : heading.eyebrow}</p><h1>{heading.title}</h1><p>{heading.subtitle}</p></div>
            <div className="heading-actions">
              {activeNav === "Comunicação" ? (
                <button className="button secondary" onClick={() => setGroupModal(true)}><Plus size={15} /> Novo grupo</button>
              ) : activeNav === "Documentos" ? (
                <button className="button secondary" onClick={() => fileInput.current?.click()}><Upload size={15} /> Enviar arquivo</button>
              ) : activeNav === "Secretarias" ? (
                <button className="button secondary"><Download size={15} /> Exportar contatos</button>
              ) : activeNav === "Notificações" ? (
                <button className="button secondary" onClick={markAllNotifications}><CheckCheck size={15} /> Marcar todas como lidas</button>
              ) : activeNav === "Pendências" ? (
                <button className="button secondary" onClick={() => setActiveNav("Chamados")}><ClipboardList size={15} /> Ver chamados</button>
              ) : (
                <button className="button secondary"><Download size={15} /> Exportar relatório</button>
              )}
              <button className="button primary" onClick={() => setTicketModal(true)}><Plus size={16} /> Novo chamado</button>
            </div>
          </section>

          {activeNav === "Visão geral" && <Dashboard tickets={filteredTickets} audit={audit} onNavigate={setActiveNav} />}
          {activeNav === "Chamados" && <TicketsSection tickets={filteredTickets} onStatus={updateStatus} onNew={() => setTicketModal(true)} />}
          {activeNav === "Comunicação" && <CommunicationSection currentUser={currentUser} users={users} groups={accessibleGroups} messages={messages} tickets={ticketData} onSend={(message) => { setMessages((current) => [...current, message]); addAudit("mensagem_enviada", "mensagem", message.id, `Mensagem enviada por ${currentUser.fullName}`); void fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "send_message", userId: currentUserId, ...message }) }).catch(() => undefined); }} onNewGroup={() => setGroupModal(true)} onAttach={() => fileInput.current?.click()} />}
          {activeNav === "Notificações" && <NotificationsSection notifications={currentNotifications} onRead={markNotification} onOpenPending={() => setActiveNav("Pendências")} />}
          {activeNav === "Pendências" && <PendingSection invitations={currentInvitations} tickets={pendingTickets} onRespond={respondInvitation} onOpenTickets={() => setActiveNav("Chamados")} />}
          {activeNav === "Documentos" && <DocumentsSection documents={documents} tickets={ticketData} onUpload={() => fileInput.current?.click()} />}
          {activeNav === "Secretarias" && <TeamSection offices={OFFICES} />}
          {activeNav === "Auditoria" && <AuditSection audit={audit} />}
        </div>
      </main>

      <input ref={fileInput} className="hidden-input" type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); event.target.value = ""; }} />
      {ticketModal && <TicketModal users={users} onClose={() => setTicketModal(false)} onCreate={createTicket} />}
      {groupModal && <GroupModal currentUserId={currentUserId} users={users} onClose={() => setGroupModal(false)} onCreate={createGroup} />}
      {toast && <div className="toast" role="status"><span><Check size={14} strokeWidth={2.5} /></span>{toast}</div>}
    </div>
  );
}

function getHeading(active: NavItem) {
  const headings: Record<NavItem, { eyebrow: string; title: string; subtitle: string }> = {
    "Visão geral": { eyebrow: "", title: "Bom dia, Ana.", subtitle: "Acompanhe as demandas e mantenha as secretarias alinhadas." },
    Chamados: { eyebrow: "GESTÃO DE DEMANDAS", title: "Chamados", subtitle: "Organize cada solicitação do recebimento à entrega final." },
    Comunicação: { eyebrow: "CENTRAL DE COMUNICAÇÃO", title: "Conversas", subtitle: "Mensagens diretas e grupos por convite entre as secretarias." },
    Notificações: { eyebrow: "CENTRAL DE AVISOS", title: "Notificações", subtitle: "Acompanhe convites, mensagens e atualizações importantes do sistema." },
    Pendências: { eyebrow: "AÇÕES NECESSÁRIAS", title: "Pendências", subtitle: "Resolva convites de grupos e chamados que aguardam sua análise." },
    Documentos: { eyebrow: "ARQUIVOS MUNICIPAIS", title: "Documentos", subtitle: "Consulte arquivos, responsáveis e chamados relacionados." },
    Secretarias: { eyebrow: "DIRETÓRIO MUNICIPAL", title: "Secretarias e unidades", subtitle: "Responsáveis, telefones, e-mails, horários e endereços oficiais." },
    Auditoria: { eyebrow: "RASTREABILIDADE", title: "Histórico de atividades", subtitle: "Registro cronológico das ações realizadas na plataforma." },
  };
  return headings[active];
}

function Dashboard({ tickets, audit, onNavigate }: { tickets: Ticket[]; audit: AuditItem[]; onNavigate: (item: NavItem) => void }) {
  const stats = statuses.map((status, index) => ({
    label: statusMeta[status].short,
    value: String(tickets.filter((ticket) => ticket.status === status).length).padStart(2, "0"),
    change: ["+3 hoje", "2 próximos do prazo", "Aguardando resposta", "+12% neste mês"][index],
    status,
  }));

  return (
    <>
      <section className="stats-grid" aria-label="Resumo dos chamados">
        {stats.map((stat) => {
          const StatIcon = statusMeta[stat.status].icon;
          return (
            <article className={`stat-card ${statusMeta[stat.status].color}`} key={stat.label}>
              <div className="stat-icon"><StatIcon size={20} strokeWidth={2.2} /></div>
              <div className="stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.change}</small></div>
              <span className="stat-arrow"><ArrowUpRight size={15} /></span>
            </article>
          );
        })}
      </section>
      <section className="dashboard-grid">
        <article className="panel tickets-panel">
          <div className="panel-heading">
            <div><h2>Chamados recentes</h2><p>Últimas solicitações registradas na plataforma</p></div>
            <button className="text-button" onClick={() => onNavigate("Chamados")}>Ver todos <ArrowRight size={14} /></button>
          </div>
          <TicketTable tickets={tickets} />
        </article>
        <aside className="side-stack">
          <article className="panel activity-panel">
            <div className="panel-heading compact">
              <div><h2>Atividade recente</h2><p>Atualizações das secretarias</p></div>
              <button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={18} /></button>
            </div>
            <div className="activity-list">
              {audit.slice(0, 4).map((item, index) => <Activity key={item.id} avatar={item.actorInitials} color={["green", "blue", "violet", "amber"][index % 4]} title={item.actorName} detail={item.detail} time={formatRelative(item.createdAt)} />)}
            </div>
            <button className="full-link" onClick={() => onNavigate("Auditoria")}>Ver histórico completo <ArrowRight size={14} /></button>
          </article>
          <article className="panel deadline-panel">
            <div className="deadline-icon"><AlertTriangle size={16} /></div>
            <div><strong>2 chamados próximos do prazo</strong><p>Revise as demandas prioritárias para evitar atrasos.</p></div>
            <button onClick={() => onNavigate("Chamados")}>Revisar agora <ArrowRight size={12} /></button>
          </article>
        </aside>
      </section>
    </>
  );
}

function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="ticket-table-wrap">
      <table className="ticket-table">
        <thead><tr><th>Chamado</th><th>Secretaria responsável</th><th>Status</th><th>Prazo</th><th aria-label="Opções" /></tr></thead>
        <tbody>{tickets.map((ticket) => (
          <tr key={ticket.id}>
            <td><div className="ticket-title"><span className={`priority-dot ${ticket.priority.toLowerCase().replace("é", "e")}`} /><div><strong>{ticket.title}</strong><small>{ticket.protocol} · {ticket.requester}</small></div></div></td>
            <td><div className="department-cell"><span className="mini-avatar">{ticket.assigneeInitials ?? "--"}</span>{ticket.department}</div></td>
            <td><StatusPill status={ticket.status} /></td>
            <td><span className={formatDue(ticket.dueDate).startsWith("Hoje") ? "due urgent" : "due"}>{formatDue(ticket.dueDate)}</span></td>
            <td><button className="table-menu" aria-label={`Opções de ${ticket.protocol}`}><MoreHorizontal size={17} /></button></td>
          </tr>
        ))}</tbody>
      </table>
      {tickets.length === 0 && <div className="empty-state">Nenhum chamado encontrado para esta busca.</div>}
    </div>
  );
}

function TicketsSection({ tickets, onStatus, onNew }: { tickets: Ticket[]; onStatus: (id: string, status: TicketStatus) => void; onNew: () => void }) {
  return (
    <section className="board-wrap">
      <div className="board-toolbar">
        <div className="filter-chip active">Todos <strong>{tickets.length}</strong></div>
        <div className="filter-chip">Alta prioridade <strong>{tickets.filter((t) => t.priority === "Alta").length}</strong></div>
        <div className="board-spacer" />
        <button className="button secondary"><List size={15} /> Lista</button>
        <button className="button primary" onClick={onNew}><Plus size={16} /> Criar chamado</button>
      </div>
      <div className="kanban-board">
        {statuses.map((status) => {
          const StatusIcon = statusMeta[status].icon;
          const columnTickets = tickets.filter((ticket) => ticket.status === status);
          return (
            <section className={`kanban-column ${statusMeta[status].color}`} key={status}>
              <header><span><StatusIcon size={14} />{statusMeta[status].short}</span><strong>{columnTickets.length}</strong></header>
              <div className="kanban-cards">
                {columnTickets.map((ticket) => (
                  <article className="kanban-card" key={ticket.id}>
                    <div className="card-meta"><span className={`priority-label ${ticket.priority.toLowerCase().replace("é", "e")}`}>{ticket.priority}</span><button aria-label={`Opções de ${ticket.protocol}`}><MoreHorizontal size={17} /></button></div>
                    <h3>{ticket.title}</h3><p>{ticket.description}</p><small>{ticket.protocol} · {ticket.requester}</small>
                    <div className="kanban-footer"><span className="mini-avatar">{ticket.assigneeInitials ?? "--"}</span><span className={formatDue(ticket.dueDate).startsWith("Hoje") ? "due urgent" : "due"}><Clock3 size={12} /> {formatDue(ticket.dueDate)}</span></div>
                    <label className="move-label">Mover para<select aria-label={`Mover ${ticket.protocol}`} value={ticket.status} onChange={(event) => onStatus(ticket.id, event.target.value as TicketStatus)}>{statuses.map((option) => <option key={option}>{option}</option>)}</select></label>
                  </article>
                ))}
                {columnTickets.length === 0 && <div className="column-empty">Nenhum chamado nesta etapa</div>}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function CommunicationSection({ currentUser, users, groups, messages, tickets, onSend, onNewGroup, onAttach }: { currentUser: User; users: User[]; groups: Group[]; messages: Message[]; tickets: Ticket[]; onSend: (message: Message) => void; onNewGroup: () => void; onAttach: () => void }) {
  const [tab, setTab] = useState<ChatTab>("direct");
  const [selected, setSelected] = useState("u-rafael");
  const [draft, setDraft] = useState("");
  const directUsers = users.filter((user) => user.id !== currentUser.id);
  const selectionIsValid = tab === "direct" ? directUsers.some((user) => user.id === selected) : groups.some((group) => group.id === selected);
  const effectiveSelected = selectionIsValid ? selected : tab === "direct" ? directUsers[0]?.id ?? "" : groups[0]?.id ?? "";
  const selectedUser = users.find((user) => user.id === effectiveSelected);
  const selectedGroup = groups.find((group) => group.id === effectiveSelected);
  const visibleMessages = messages.filter((message) => message.conversationType === tab && message.conversationId === effectiveSelected);

  function changeTab(next: ChatTab) { setTab(next); setSelected(next === "direct" ? directUsers[0]?.id ?? "" : groups[0]?.id ?? ""); }
  function submit(event: FormEvent) { event.preventDefault(); if (!draft.trim() || !effectiveSelected) return; onSend({ id: makeId(), conversationType: tab, conversationId: effectiveSelected, senderId: currentUser.id, senderName: currentUser.fullName, senderInitials: currentUser.initials, body: draft.trim(), createdAt: new Date().toISOString() }); setDraft(""); }

  return (
    <section className="chat-shell panel">
      <aside className="conversation-list">
        <div className="chat-tabs">
          <button className={tab === "direct" ? "active" : ""} onClick={() => changeTab("direct")}>Diretas</button>
          <button className={tab === "group" ? "active" : ""} onClick={() => changeTab("group")}>Grupos <span>{groups.length}</span></button>
        </div>
        <label className="conversation-search"><Search size={15} /><input placeholder="Buscar conversa..." /></label>
        {tab === "group" && <button className="new-group-row" onClick={onNewGroup}><Plus size={14} /> Criar grupo por convite</button>}
        <div className="conversation-items">
          {tab === "direct" ? directUsers.map((user, index) => (
            <button key={user.id} className={effectiveSelected === user.id ? "conversation active" : "conversation"} onClick={() => setSelected(user.id)}>
              <span className="avatar">{user.initials}</span><span><strong>{user.fullName}</strong><small>{user.department}</small></span>{index < 2 && <i>{index + 1}</i>}
            </button>
          )) : groups.map((group) => (
            <button key={group.id} className={effectiveSelected === group.id ? "conversation active" : "conversation"} onClick={() => setSelected(group.id)}>
              <span className="group-avatar"><Hash size={16} /></span><span><strong>{group.name}</strong><small>{group.memberCount} participantes · por convite</small></span>
            </button>
          ))}
        </div>
      </aside>
      <div className="chat-main">
        <header className="chat-header">
          <div className={tab === "group" ? "group-avatar" : "avatar"}>{tab === "group" ? <Hash size={16} /> : selectedUser?.initials}</div>
          <div><strong>{tab === "group" ? selectedGroup?.name : selectedUser?.fullName}</strong><span>{tab === "group" ? `${selectedGroup?.memberCount ?? 0} participantes` : selectedUser?.department}</span></div>
          <div className="chat-header-actions">
            <button title="Compartilhar chamado"><ClipboardList size={15} /></button>
            <button title="Participantes"><UsersRound size={15} /></button>
            <button title="Mais opções"><MoreHorizontal size={16} /></button>
          </div>
        </header>
        {tab === "group" && <div className="invite-banner"><span><Mail size={15} /></span><div><strong>Grupo com entrada por convite</strong><p>Somente participantes convidados podem visualizar e enviar mensagens.</p></div><button onClick={onNewGroup}>Gerenciar convites</button></div>}
        <div className="message-stream">
          <div className="date-divider"><span>Hoje</span></div>
          {visibleMessages.length === 0 && <div className="empty-chat"><span><MessagesSquare size={25} /></span><strong>Comece esta conversa</strong><p>Mensagens, chamados e documentos ficarão registrados aqui.</p></div>}
          {visibleMessages.map((message) => (
            <div key={message.id} className={message.senderId === currentUser.id ? "message own" : "message"}>
              <span className="activity-avatar blue">{message.senderInitials}</span>
              <div>
                <div className="message-meta"><strong>{message.senderName}</strong><time>{formatTime(message.createdAt)}</time></div><p>{message.body}</p>
                {message.ticketId && <button className="ticket-attachment"><ClipboardList size={12} /> {tickets.find((ticket) => ticket.id === message.ticketId)?.protocol ?? "Chamado relacionado"}</button>}
                {message.attachmentName && <button className="file-attachment"><span>PDF</span><div><strong>{message.attachmentName}</strong><small>Documento anexado</small></div><i><Download size={14} /></i></button>}
              </div>
            </div>
          ))}
        </div>
        <form className="message-composer" onSubmit={submit}>
          <div className="compose-actions"><button type="button" onClick={onAttach} title="Anexar arquivo"><Paperclip size={16} /></button><button type="button" title="Vincular chamado"><ClipboardList size={16} /></button></div>
          <textarea aria-label="Mensagem" placeholder="Escreva uma mensagem..." value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <button className="send-button" aria-label="Enviar mensagem"><Send size={16} /></button>
        </form>
      </div>
    </section>
  );
}

function NotificationsSection({ notifications, onRead, onOpenPending }: { notifications: NotificationItem[]; onRead: (id: string) => void; onOpenPending: () => void }) {
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const iconByType: Record<NotificationItem["type"], LucideIcon> = { group_invite: UserPlus, ticket: ClipboardList, message: MessagesSquare, system: BellRing };
  return (
    <section className="notification-layout">
      <article className="panel notification-panel">
        <header className="section-title"><div><h2>Caixa de entrada</h2><p>{notifications.filter((item) => !item.readAt).length} {notifications.filter((item) => !item.readAt).length === 1 ? "aviso não lido" : "avisos não lidos"}</p></div><span><BellRing size={18} /></span></header>
        <div className="notification-list">
          {sorted.map((item) => {
            const NoticeIcon = iconByType[item.type];
            return (
              <article className={`notification-row ${item.readAt ? "read" : "unread"}`} key={item.id}>
                <span className={`notification-type ${item.type}`}><NoticeIcon size={18} /></span>
                <div className="notification-copy"><div><strong>{item.title}</strong>{!item.readAt && <i>NOVA</i>}</div><p>{item.body}</p><small>{item.actorName ? `${item.actorName} · ` : ""}{formatRelative(item.createdAt)}</small></div>
                <div className="notification-actions">
                  {item.type === "group_invite" && <button className="button primary" onClick={() => { onRead(item.id); onOpenPending(); }}><UserPlus size={14} /> Ver convite</button>}
                  {!item.readAt && <button className="button secondary" onClick={() => onRead(item.id)}><Check size={14} /> Marcar como lida</button>}
                </div>
              </article>
            );
          })}
          {!sorted.length && <div className="module-empty"><BellRing size={28} /><strong>Tudo em dia</strong><p>As novas mensagens, convites e atualizações aparecerão aqui.</p></div>}
        </div>
      </article>
      <aside className="panel notification-guide"><span><ShieldCheck size={21} /></span><h2>Avisos vinculados ao usuário</h2><p>Cada secretário visualiza somente as notificações destinadas ao seu próprio acesso.</p><ul><li>Convites para grupos</li><li>Chamados para aprovação</li><li>Mensagens e documentos</li></ul></aside>
    </section>
  );
}

function PendingSection({ invitations, tickets, onRespond, onOpenTickets }: { invitations: GroupInvitation[]; tickets: Ticket[]; onRespond: (invitation: GroupInvitation, response: "aceito" | "recusado") => void; onOpenTickets: () => void }) {
  return (
    <section className="pending-shell">
      <div className="pending-summary">
        <article className="panel"><span className="summary-icon invite"><UserPlus size={20} /></span><div><small>CONVITES DE GRUPOS</small><strong>{String(invitations.length).padStart(2, "0")}</strong><p>Aguardando sua resposta</p></div></article>
        <article className="panel"><span className="summary-icon approval"><Clock3 size={20} /></span><div><small>EM APROVAÇÃO</small><strong>{String(tickets.length).padStart(2, "0")}</strong><p>Chamados para revisar</p></div></article>
      </div>

      <section className="panel pending-panel">
        <header className="section-title"><div><h2>Convites recebidos</h2><p>Entre no grupo somente depois de revisar o convite.</p></div><span><UsersRound size={18} /></span></header>
        <div className="invitation-list">
          {invitations.map((invitation) => (
            <article className="invitation-card" key={`${invitation.groupId}-${invitation.userId}`}>
              <span className="invitation-avatar">{invitation.invitedByInitials}</span>
              <div className="invitation-copy"><small>CONVITE DE {invitation.invitedByName.toUpperCase()}</small><h3>{invitation.groupName}</h3><p>{invitation.description}</p><div><span><UsersRound size={13} /> {invitation.memberCount} {invitation.memberCount === 1 ? "participante" : "participantes"}</span><span><Clock3 size={13} /> {formatRelative(invitation.createdAt)}</span></div></div>
              <div className="invitation-actions"><button className="button primary" onClick={() => onRespond(invitation, "aceito")}><Check size={15} /> Aceitar convite</button><button className="button secondary danger" onClick={() => onRespond(invitation, "recusado")}><XCircle size={15} /> Recusar</button></div>
            </article>
          ))}
          {!invitations.length && <div className="module-empty compact"><CheckCheck size={28} /><strong>Nenhum convite pendente</strong><p>Quando alguém convidar você para um grupo, a solicitação aparecerá aqui.</p></div>}
        </div>
      </section>

      <section className="panel pending-panel">
        <header className="section-title"><div><h2>Chamados aguardando aprovação</h2><p>Demandas que precisam de conferência antes da finalização.</p></div><button className="text-button" onClick={onOpenTickets}>Abrir quadro <ArrowRight size={14} /></button></header>
        <div className="pending-ticket-list">
          {tickets.map((ticket) => <article key={ticket.id}><span className={`priority-dot ${ticket.priority.toLowerCase().replace("é", "e")}`} /><div><strong>{ticket.title}</strong><p>{ticket.protocol} · {ticket.department}</p></div><StatusPill status={ticket.status} /><button className="button secondary" onClick={onOpenTickets}>Revisar</button></article>)}
          {!tickets.length && <div className="module-empty compact"><CheckCheck size={28} /><strong>Nenhuma aprovação pendente</strong><p>Os chamados enviados para aprovação aparecerão nesta lista.</p></div>}
        </div>
      </section>
    </section>
  );
}

function DocumentsSection({ documents, tickets, onUpload }: { documents: DocumentItem[]; tickets: Ticket[]; onUpload: () => void }) {
  return (
    <section className="panel documents-panel">
      <div className="module-toolbar">
        <div className="module-search"><Search size={15} /><input placeholder="Buscar por nome ou responsável..." /></div>
        <select aria-label="Filtrar categoria"><option>Todas as categorias</option><option>Relatórios</option><option>Pareceres</option><option>Planilhas</option></select>
        <button className="button primary" onClick={onUpload}><Upload size={15} /> Enviar documento</button>
      </div>
      <div className="document-table">
        <div className="document-row document-head"><span>Arquivo</span><span>Responsável</span><span>Chamado relacionado</span><span>Enviado em</span><span /></div>
        {documents.map((doc) => <div className="document-row" key={doc.id}><div className="document-name"><span className="file-type"><FileText size={17} /></span><div><strong>{doc.name}</strong><small>{doc.category} · {formatSize(doc.size)}</small></div></div><span>{doc.ownerName}</span><span className="doc-ticket">{tickets.find((ticket) => ticket.id === doc.ticketId)?.protocol ?? "—"}</span><span>{formatDate(doc.createdAt)}</span><button className="table-menu" aria-label={`Opções de ${doc.name}`}><MoreHorizontal size={17} /></button></div>)}
      </div>
    </section>
  );
}

function TeamSection({ offices }: { offices: Office[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<OfficeCategory | "Todas">("Todas");
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return offices.filter((office) => {
      const matchesCategory = category === "Todas" || office.category === category;
      const searchable = [office.name, office.head, office.phone, office.email, office.address].join(" ").toLowerCase();
      return matchesCategory && (!term || searchable.includes(term));
    });
  }, [category, offices, query]);

  return (
    <section className="directory-shell">
      <div className="access-note directory-note"><span><Building2 size={20} /></span><div><strong>Diretório institucional completo</strong><p>Contatos cadastrados a partir da relação oficial da Prefeitura Municipal de Várzea da Palma.</p></div><strong className="directory-total">{offices.length} unidades</strong></div>

      <article className="panel municipal-overview">
        <div className="municipal-title"><span><Landmark size={21} /></span><div><small>PREFEITURA MUNICIPAL</small><h2>Várzea da Palma — MG</h2></div></div>
        <div className="municipal-contact"><Clock3 size={16} /><span><small>Atendimento geral</small><strong>2ª a 6ª, das 07:00h às 13:00h</strong></span></div>
        <a className="municipal-contact" href="tel:+553837319200"><Phone size={16} /><span><small>Telefone geral</small><strong>(38) 3731-9200</strong></span></a>
        <a className="municipal-contact" href="mailto:comunicacao@varzeadapalma.mg.gov.br"><Mail size={16} /><span><small>E-mail institucional</small><strong>comunicacao@varzeadapalma.mg.gov.br</strong></span></a>
        <div className="municipal-contact municipal-address"><MapPin size={16} /><span><small>Endereço</small><strong>Rua Cláudio Manoel da Costa, 1000 — Pinlar — CEP 39260-000</strong></span></div>
        <div className="municipal-id"><small>CNPJ</small><strong>18.279.059/0001-26</strong></div>
      </article>

      <div className="panel directory-controls">
        <label className="module-search directory-search"><Search size={16} /><input aria-label="Buscar secretaria ou contato" placeholder="Buscar secretaria, responsável, telefone ou e-mail..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="directory-filters" aria-label="Filtrar por categoria">
          {(["Todas", ...OFFICE_CATEGORIES] as const).map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}<span>{item === "Todas" ? offices.length : offices.filter((office) => office.category === item).length}</span></button>)}
        </div>
      </div>

      {visible.length ? OFFICE_CATEGORIES.map((group) => {
        const groupOffices = visible.filter((office) => office.category === group);
        if (!groupOffices.length) return null;
        return (
          <section className="directory-group" key={group}>
            <header><div><p className="eyebrow">REDE MUNICIPAL</p><h2>{group}</h2></div><span>{groupOffices.length} {groupOffices.length === 1 ? "unidade" : "unidades"}</span></header>
            <div className="office-grid">
              {groupOffices.map((office) => (
                <article className="panel office-card" key={office.id}>
                  <div className="office-card-head"><span><Building2 size={19} /></span><small>{office.category}</small></div>
                  <h3>{office.name}</h3>
                  <div className="office-lead"><span><UserRound size={16} /></span><div><small>Responsável</small><strong>{office.head}</strong></div></div>
                  <dl className="office-details">
                    <div><dt><Phone size={14} /> Telefone</dt><dd><a href={`tel:${office.phone.replace(/\D/g, "")}`}>{office.phone}</a></dd></div>
                    <div><dt><Clock3 size={14} /> Atendimento</dt><dd>{office.hours}</dd></div>
                    <div className="office-email"><dt><Mail size={14} /> E-mail</dt><dd><a href={`mailto:${office.email}`}>{office.email}</a></dd></div>
                    <div className="office-address"><dt><MapPin size={14} /> Endereço</dt><dd>{office.address}</dd></div>
                  </dl>
                  <div className="office-actions"><a href={`mailto:${office.email}`}><Mail size={14} /> Enviar e-mail</a><a href={`tel:${office.phone.replace(/\D/g, "")}`}><Phone size={14} /> Ligar</a></div>
                </article>
              ))}
            </div>
          </section>
        );
      }) : <div className="panel directory-empty"><Search size={24} /><strong>Nenhuma unidade encontrada</strong><p>Tente buscar por outro nome, telefone, e-mail ou endereço.</p></div>}

      <p className="directory-source"><ShieldCheck size={14} /> Dados conferidos no portal oficial do município em 13/08/2026, às 12:33.</p>
    </section>
  );
}

function AuditSection({ audit }: { audit: AuditItem[] }) {
  return (
    <section className="audit-layout">
      <aside className="panel audit-summary"><span className="audit-shield"><ShieldCheck size={22} /></span><h2>Registro íntegro</h2><p>Criações, alterações de status, mensagens, convites e documentos ficam associados a um responsável.</p><dl><div><dt>Eventos hoje</dt><dd>{audit.length}</dd></div><div><dt>Última atualização</dt><dd>Agora</dd></div></dl></aside>
      <article className="panel audit-panel">
        <div className="module-toolbar"><div className="module-search"><Search size={15} /><input placeholder="Buscar no histórico..." /></div><select aria-label="Filtrar atividade"><option>Todas as atividades</option><option>Chamados</option><option>Mensagens</option><option>Documentos</option><option>Grupos</option></select><button className="button secondary"><Download size={15} /> Exportar log</button></div>
        <div className="audit-list">{audit.map((item, index) => <div className="audit-row" key={item.id}><span className={`activity-avatar ${["green", "blue", "violet", "amber"][index % 4]}`}>{item.actorInitials}</span><div><strong>{item.actorName}</strong><p>{item.detail}</p><small>{item.entityType} · {formatDateTime(item.createdAt)}</small></div><span className="audit-action">{item.action.replaceAll("_", " ")}</span></div>)}</div>
      </article>
    </section>
  );
}

function TicketModal({ users, onClose, onCreate }: { users: User[]; onClose: () => void; onCreate: (data: FormData) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title"><header><div><p className="eyebrow">NOVO REGISTRO</p><h2 id="ticket-modal-title">Criar chamado</h2></div><button onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><form action={onCreate}><label className="field full"><span>Título do chamado *</span><input name="title" required placeholder="Ex.: Reparo da iluminação da avenida" autoFocus /></label><label className="field full"><span>Descrição</span><textarea name="description" placeholder="Inclua contexto, entregáveis e observações..." /></label><label className="field"><span>Secretaria responsável *</span><select name="department" required defaultValue=""><option value="" disabled>Selecione</option>{OFFICE_CATEGORIES.map((group) => <optgroup label={group} key={group}>{OFFICES.filter((office) => office.category === group).map((office) => <option key={office.id}>{office.name}</option>)}</optgroup>)}</select></label><label className="field"><span>Responsável</span><select name="assigneeId" defaultValue=""><option value="">A definir</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label><label className="field"><span>Prioridade</span><select name="priority" defaultValue="Média"><option>Alta</option><option>Média</option><option>Baixa</option></select></label><label className="field"><span>Prazo</span><input type="date" name="dueDate" /></label><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary"><Plus size={15} /> Criar e registrar</button></div></form></section></div>;
}

function GroupModal({ currentUserId, users, onClose, onCreate }: { currentUserId: string; users: User[]; onClose: () => void; onCreate: (group: Group, memberIds: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const candidates = users.filter((user) => user.id !== currentUserId);
  const filtered = candidates.filter((user) => [user.fullName, user.department, user.email].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  function submit(form: FormData) { if (!selected.length) return; const name = String(form.get("name")); onCreate({ id: makeId(), name, description: String(form.get("description")), memberCount: 1, createdAt: new Date().toISOString() }, selected); }
  function toggleAll() { setSelected(selected.length === candidates.length ? [] : candidates.map((user) => user.id)); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal group-modal" role="dialog" aria-modal="true" aria-labelledby="group-modal-title"><header><div><p className="eyebrow">COMUNICAÇÃO ENTRE SECRETARIAS</p><h2 id="group-modal-title">Criar grupo por convite</h2></div><button onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><form action={submit}><label className="field full"><span>Nome do grupo *</span><input name="name" required placeholder="Ex.: Operação Volta às Aulas" autoFocus /></label><label className="field full"><span>Objetivo</span><textarea name="description" placeholder="Qual é o objetivo desta conversa?" /></label><fieldset className="member-picker"><legend>Quem você deseja adicionar?</legend><div className="member-tools"><label><Search size={15} /><input aria-label="Buscar pessoa para o grupo" placeholder="Buscar por nome ou secretaria..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" onClick={toggleAll}>{selected.length === candidates.length ? "Limpar seleção" : "Selecionar todos"}</button></div><div className="member-results">{filtered.map((user) => <label className={selected.includes(user.id) ? "selected" : ""} key={user.id}><input type="checkbox" checked={selected.includes(user.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))} /><span className="mini-avatar">{user.initials}</span><span><strong>{user.fullName}</strong><small>{user.department} · {user.email}</small></span><i>{selected.includes(user.id) ? <Check size={12} /> : <Plus size={12} />}</i></label>)}</div><p className="member-count"><UsersRound size={14} /><strong>{selected.length}</strong> {selected.length === 1 ? "pessoa selecionada" : "pessoas selecionadas"}</p></fieldset><p className="invite-note"><BellRing size={14} /> Cada participante receberá uma notificação e uma pendência no próprio acesso. O grupo só ficará disponível depois que o convite for aceito.</p><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" disabled={!selected.length}><UserPlus size={15} /> Criar e enviar {selected.length || ""} {selected.length === 1 ? "convite" : "convites"}</button></div></form></section></div>;
}

function StatusPill({ status }: { status: TicketStatus }) { return <span className={`status-pill ${statusMeta[status].color}`}><i />{statusMeta[status].short}</span>; }
function Activity({ avatar, color, title, detail, time }: { avatar: string; color: string; title: string; detail: string; time: string }) { return <div className="activity-item"><span className={`activity-avatar ${color}`}>{avatar}</span><div><strong>{title}</strong><p>{detail}</p><small>{time}</small></div></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(value)).replace(" de ", " "); }
function formatTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
function formatDateTime(value: string) { return `${formatDate(value)}, ${formatTime(value)}`; }
function formatRelative(value: string) { const minutes = Math.max(1, Math.round((new Date("2026-08-13T15:00:00.000Z").getTime() - new Date(value).getTime()) / 60000)); return minutes < 60 ? `Há ${minutes} min` : `Há ${Math.round(minutes / 60)} h`; }
function formatDue(value: string | null) { if (!value) return "Sem prazo"; const date = new Date(value); const day = date.getUTCDate(); if (day === 13) return `Hoje, ${formatTime(value)}`; if (day === 14) return "Amanhã"; return `${String(day).padStart(2, "0")} ago`; }
function formatSize(size: number) { return size >= 1_000_000 ? `${(size / 1_000_000).toFixed(1)} MB` : `${Math.round(size / 1000)} KB`; }
function makeId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
