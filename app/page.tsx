"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardList,
  Crown,
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
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessagesSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Phone,
  Search,
  Send,
  Sparkles,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UserPlus,
  UsersRound,
  Workflow,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CitizenServiceSection,
  HelpCenterSection,
  IndicatorsSection,
  MunicipalManagementSection,
  ProcessesSection,
  SecuritySection,
} from "./municipal-modules";
import { SectorWorkspaceSection } from "./sector-workspaces";
import { SectorNotesSection } from "./sector-notes";
import { AddressRegistrationField } from "./municipal-location";
import { SettingsSection } from "./settings-section";
import {
  ApprovalCenterPanel,
  DocumentGovernancePanel,
  FormBuilderPanel,
  OperationalCommandCenter,
  SmartNotificationRules,
} from "./enhanced-features";
import { GlobalSearchPanel, playNotificationChime, useNotificationChime } from "./experience-tools";
import {
  createDefaultPermissionSettings,
  FULL_PERMISSION,
  NO_PERMISSION,
  permissionFor,
  type DepartmentPermissionSettings,
  type PermissionModule,
} from "./access-control";
import { PermissionProvider, useCurrentPermission } from "./permission-context";
import { loadCachedPersistentValue, loadPersistentValue, savePersistentValue, usePersistentState } from "./persistence";
import { clearOfflineSession, hasValidOfflineSession, rememberOfflineSession } from "./offline-auth";
import { queueFormRequest } from "./offline-sync";
import { LoginLoadingScreen, TestLoginScreen } from "./test-login";
import { IntegratedManagementSection } from "./integrated-platform";
import { OnboardingTour, QuickActionDock } from "./platform-experience";
import { ContextualAiBar, DashboardAiBrief, MunicipalAiCopilot, openMunicipalAi } from "./municipal-ai-copilot";
import type { MunicipalAgentAction, MunicipalAgentExecutionResult } from "./municipal-agent-types";

type TicketStatus = "Recebido" | "Em análise" | "Aguardando aprovação" | "Em execução" | "Aguardando resposta" | "Concluído" | "Cancelado";
type Priority = "Urgente" | "Alta" | "Média" | "Baixa";
type NavItem = PermissionModule | "Funcionários" | "Configurações";
type ChatTab = "direct" | "group";
type OfficeCategory = "Prefeitura e apoio" | "Secretarias" | "Departamentos" | "Seções e subprefeitura";

type Ticket = { id: string; protocol: string; title: string; description: string; requester: string; department: string; priority: Priority; status: TicketStatus; dueDate: string | null; assigneeId: string | null; assigneeName?: string; assigneeInitials?: string; neighborhood?: string; address?: string; latitude?: number | null; longitude?: number | null; createdAt: string; updatedAt: string };
type AccountStatus = "Ativo" | "Aguardando criação de senha";
type User = { id: string; fullName: string; email: string; department: string; role: string; initials: string; accountStatus?: AccountStatus; invitedAt?: string | null; invitedBy?: string | null };
type Office = { id: string; name: string; head: string; hours: string; phone: string; email: string; address: string; category: OfficeCategory };
type Group = { id: string; name: string; description: string; memberCount: number; createdAt: string; memberUserIds?: string[]; pendingUserIds?: string[] };
type Message = { id: string; conversationType: ChatTab; conversationId: string; senderId: string; senderName: string; senderInitials: string; body: string; attachmentId?: string | null; attachmentName?: string | null; attachmentSize?: number | null; attachmentContentType?: string | null; attachmentUrl?: string | null; ticketId?: string | null; createdAt: string };
type DocumentItem = { id: string; name: string; category: string; ownerId: string; ownerName: string; department: string; ticketId?: string | null; contentType: string; size: number; createdAt: string };
type SectorEvent = { id: string; title: string; description: string; department: string; targetDepartments?: string[]; location: string; startsAt: string; endsAt?: string | null; createdBy: string; creatorName: string; creatorInitials: string; createdAt: string };
type AuditItem = { id: string; action: string; entityType: string; entityId: string; detail: string; department?: string; createdAt: string; actorName: string; actorInitials: string };
type NotificationItem = { id: string; userId: string; type: "group_invite" | "ticket" | "message" | "system"; title: string; body: string; relatedEntityId?: string | null; readAt?: string | null; createdAt: string; actorName?: string; actorInitials?: string };
type GroupInvitation = { groupId: string; userId: string; groupName: string; description: string; invitedByName: string; invitedByInitials: string; memberCount: number; status: "convidado" | "aceito" | "recusado"; createdAt: string };
type GroupMembership = { groupId: string; userId: string; status: "convidado" | "aceito" | "recusado" };

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
  { id: "u-prefeito", fullName: "Rodrigo Aguiar Dalla Bernardina", email: "prefeito@varzeadapalma.mg.gov.br", department: "Gabinete do Prefeito", role: "Prefeito", initials: "RB" },
  { id: "u-vice", fullName: "Jaime de Souza", email: "vice.prefeito@varzeadapalma.mg.gov.br", department: "Gabinete do Prefeito", role: "Vice-prefeito", initials: "JS" },
  { id: "u-ana", fullName: "Artur Paulo Fagundes Rabelo", email: "gabinete@varzeadapalma.mg.gov.br", department: "Secretaria de Governo", role: "Administrador", initials: "AR" },
  { id: "u-rafael", fullName: "Bruno Gonçalves da Fonseca", email: "obras@varzeadapalma.mg.gov.br", department: "Secretaria de Infraestrutura e Transporte", role: "Secretário", initials: "BF" },
  { id: "u-lucas", fullName: "Natália Cristina Pedrosa Cabral", email: "saude@varzeadapalma.mg.gov.br", department: "Secretaria de Saúde", role: "Secretária", initials: "NC" },
  { id: "u-amanda", fullName: "Leila Cibeli Silveira Mendes", email: "semec@varzeadapalma.mg.gov.br", department: "Secretaria de Educação", role: "Secretária", initials: "LM" },
  { id: "u-carla", fullName: "Jaime de Souza", email: "financas@varzeadapalma.mg.gov.br", department: "Secretaria de Administração e Finanças", role: "Secretário", initials: "JS" },
  { id: "u-felipe", fullName: "Lucas Fontinelli de Oliveira da Silva", email: "desenvolvimentoeconomico@varzeadapalma.mg.gov.br", department: "Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente", role: "Secretário", initials: "LS" },
  { id: "u-rosilene", fullName: "Rosilene Soares Souza Carvalho", email: "controladoria@varzeadapalma.mg.gov.br", department: "Controle Interno", role: "Controladora Interna", initials: "RC" },
  { id: "u-wharley", fullName: "Wharley Marques de Lima", email: "ascompalma@gmail.com", department: "Secretaria de Comunicação e Eventos", role: "Secretário", initials: "WL" },
  { id: "u-guilherme", fullName: "Guilherme Oliveira Fonseca", email: "smds@varzeadapalma.mg.gov.br", department: "Secretaria de Desenvolvimento Social", role: "Secretário", initials: "GF" },
  { id: "u-pedro", fullName: "Pedro Umberto Baeta Camargos", email: "cultura@varzeadapalma.mg.gov.br", department: "Secretaria de Cultura e Turismo", role: "Secretário", initials: "PC" },
  { id: "u-alan", fullName: "Alan Kelve", email: "secretariaobras50@gmail.com", department: "Departamento de Execução de Obras", role: "Responsável", initials: "AK" },
  { id: "u-mauricio", fullName: "Maurício Hugel de Azevedo", email: "transportes.vzp@hotmail.com", department: "Departamento de Transportes", role: "Responsável", initials: "MA" },
  { id: "u-junio", fullName: "Júnio Fernandes da Silva", email: "esporte.vzp@gmail.com", department: "Departamento de Esporte e Lazer / Subseção de Esportes", role: "Responsável", initials: "JF" },
  { id: "u-paula", fullName: "Paula Patrício Silva", email: "vigilanciaemsaude@varzeadapalma.mg.gov.br", department: "Departamento de Vigilância Sanitária", role: "Responsável", initials: "PS" },
  { id: "u-anselmo", fullName: "Anselmo Caetano de Paula", email: "semedpedagogicovzp@gmail.com", department: "Seção de Controle e Avaliação", role: "Responsável", initials: "AP" },
  { id: "u-marco", fullName: "Marco Antonio Ramos", email: "marco.ramos@educacao.mg.gov.br", department: "Subseção de Patrimônio Histórico e Cultura", role: "Responsável", initials: "MR" },
  { id: "u-dalila", fullName: "Dalila Correa", email: "sub-prefeituraguaicui@hotmail.com", department: "Subprefeitura da Barra do Guaicuí", role: "Subprefeita", initials: "DC" },
  { id: "u-mariana", fullName: "Mariana Castro", email: "mariana.castro@varzeadapalma.mg.gov.br", department: "Secretaria de Governo", role: "Funcionário · Atendimento", initials: "MC" },
  { id: "u-andre", fullName: "André Lima", email: "andre.lima@varzeadapalma.mg.gov.br", department: "Secretaria de Governo", role: "Funcionário · Operacional", initials: "AL" },
  { id: "u-camila", fullName: "Camila Nunes", email: "camila.nunes@varzeadapalma.mg.gov.br", department: "Secretaria de Infraestrutura e Transporte", role: "Funcionário · Equipe de campo", initials: "CN" },
];

const INITIAL_TICKETS: Ticket[] = [
  { id: "t-190", protocol: "CH-2026-0190", title: "Consolidar prioridades para a reunião do secretariado", description: "Reunir os pontos críticos enviados pelos setores e preparar a pauta executiva.", requester: "Gabinete do Prefeito", department: "Secretaria de Governo", priority: "Alta", status: "Recebido", dueDate: "2026-08-14T16:00:00.000Z", assigneeId: "u-ana", assigneeName: "Artur Paulo Fagundes Rabelo", assigneeInitials: "AR", neighborhood: "Pinlar I", address: "Rua Cláudio Manoel da Costa, 1000", createdAt: "2026-08-13T15:05:00.000Z", updatedAt: "2026-08-13T15:05:00.000Z" },
  { id: "t-189", protocol: "CH-2026-0189", title: "Revisar comunicado sobre serviços municipais", description: "Validar as informações recebidas antes da publicação nos canais oficiais.", requester: "Secretaria de Comunicação e Eventos", department: "Secretaria de Governo", priority: "Média", status: "Em análise", dueDate: "2026-08-14T18:00:00.000Z", assigneeId: "u-mariana", assigneeName: "Mariana Castro", assigneeInitials: "MC", neighborhood: "Pinlar I", address: "Rua Cláudio Manoel da Costa, 1000", createdAt: "2026-08-13T13:20:00.000Z", updatedAt: "2026-08-13T15:12:00.000Z" },
  { id: "t-188", protocol: "CH-2026-0188", title: "Validar cronograma da audiência pública", description: "Conferir responsáveis, local, acessibilidade e etapas de divulgação.", requester: "Assessoria do Gabinete", department: "Secretaria de Governo", priority: "Média", status: "Aguardando aprovação", dueDate: "2026-08-15T17:00:00.000Z", assigneeId: "u-andre", assigneeName: "André Lima", assigneeInitials: "AL", neighborhood: "Pinlar I", address: "Rua Cláudio Manoel da Costa, 1000", createdAt: "2026-08-12T16:00:00.000Z", updatedAt: "2026-08-13T14:48:00.000Z" },
  { id: "t-187", protocol: "CH-2026-0187", title: "Manutenção da iluminação na Praça Central", description: "Substituição de luminárias e revisão do quadro elétrico.", requester: "Ouvidoria Municipal", department: "Secretaria de Infraestrutura e Transporte", priority: "Alta", status: "Em execução", dueDate: "2026-08-13T19:00:00.000Z", assigneeId: "u-rafael", assigneeName: "Bruno Gonçalves da Fonseca", assigneeInitials: "BF", neighborhood: "Centro", address: "Avenida Dr. Mallard", createdAt: "2026-08-13T10:00:00.000Z", updatedAt: "2026-08-13T14:36:00.000Z" },
  { id: "t-186", protocol: "CH-2026-0186", title: "Revisão do calendário de vacinação", description: "Validar datas, locais e comunicação da campanha.", requester: "Gabinete do Prefeito", department: "Secretaria de Saúde", priority: "Média", status: "Aguardando aprovação", dueDate: "2026-08-14T18:00:00.000Z", assigneeId: "u-lucas", assigneeName: "Natália Cristina Pedrosa Cabral", assigneeInitials: "NC", neighborhood: "Planalto", address: "Rua Reinaldo Rodrigues, 305", createdAt: "2026-08-12T13:00:00.000Z", updatedAt: "2026-08-13T14:52:00.000Z" },
  { id: "t-185", protocol: "CH-2026-0185", title: "Atualização do transporte escolar — Zona Norte", description: "Revisar itinerários antes da volta às aulas.", requester: "Secretaria de Educação", department: "Secretaria de Educação", priority: "Alta", status: "Recebido", dueDate: "2026-08-15T18:00:00.000Z", assigneeId: "u-amanda", assigneeName: "Leila Cibeli Silveira Mendes", assigneeInitials: "LM", neighborhood: "Centro", address: "Rua Safira, 1244", createdAt: "2026-08-12T11:00:00.000Z", updatedAt: "2026-08-12T11:00:00.000Z" },
  { id: "t-184", protocol: "CH-2026-0184", title: "Parecer sobre contratação emergencial", description: "Análise administrativa concluída.", requester: "Secretaria de Governo", department: "Secretaria de Administração e Finanças", priority: "Baixa", status: "Concluído", dueDate: "2026-08-12T18:00:00.000Z", assigneeId: "u-carla", assigneeName: "Jaime de Souza", assigneeInitials: "JS", neighborhood: "Pinlar I", address: "Rua Cláudio Manoel da Costa, 1000", createdAt: "2026-08-10T09:00:00.000Z", updatedAt: "2026-08-13T12:00:00.000Z" },
  { id: "t-183", protocol: "CH-2026-0183", title: "Liberação de área para feira de produtores", description: "Avaliação ambiental e autorização de uso.", requester: "Gabinete do Prefeito", department: "Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente", priority: "Média", status: "Em execução", dueDate: "2026-08-16T18:00:00.000Z", assigneeId: "u-felipe", assigneeName: "Lucas Fontinelli de Oliveira da Silva", assigneeInitials: "LS", neighborhood: "Centro", address: "Rua Pedro Rodrigues de Menezes, 1474", createdAt: "2026-08-11T15:00:00.000Z", updatedAt: "2026-08-13T11:00:00.000Z" },
];

const TICKET_LOCATION_DEFAULTS: Record<string,{address:string;neighborhood:string}> = {
  "t-190": { address: "Rua Cláudio Manoel da Costa, 1000", neighborhood: "Pinlar I" },
  "t-189": { address: "Rua Cláudio Manoel da Costa, 1000", neighborhood: "Pinlar I" },
  "t-188": { address: "Rua Cláudio Manoel da Costa, 1000", neighborhood: "Pinlar I" },
  "t-187": { address: "Avenida Dr. Mallard", neighborhood: "Centro" },
  "t-186": { address: "Rua Reinaldo Rodrigues, 305", neighborhood: "Planalto" },
  "t-185": { address: "Rua Safira, 1244", neighborhood: "Centro" },
  "t-184": { address: "Rua Cláudio Manoel da Costa, 1000", neighborhood: "Pinlar I" },
  "t-183": { address: "Rua Pedro Rodrigues de Menezes, 1474", neighborhood: "Centro" },
};

function backfillTicketLocations(tickets: Ticket[]) {
  return tickets.map((ticket) => {
    if (ticket.address?.trim()) return ticket;
    const fallback = TICKET_LOCATION_DEFAULTS[ticket.id];
    return fallback ? { ...ticket, ...fallback } : ticket;
  });
}

const INITIAL_GROUPS: Group[] = [
  { id: "g-volta-aulas", name: "Operação Volta às Aulas 2026", description: "Educação, Mobilidade e Governo", memberCount: 3, createdAt: "2026-08-13T14:00:00.000Z", memberUserIds: ["u-ana", "u-amanda"], pendingUserIds: ["u-rafael"] },
  { id: "g-centro", name: "Revitalização do Centro", description: "Obras e comunicação institucional", memberCount: 3, createdAt: "2026-08-11T10:00:00.000Z", memberUserIds: ["u-ana", "u-rafael", "u-carla"], pendingUserIds: [] },
  { id: "g-saude-digital", name: "Comitê de Saúde Digital", description: "Integração dos atendimentos e sistemas da rede municipal.", memberCount: 1, createdAt: "2026-08-13T14:45:00.000Z", memberUserIds: ["u-lucas"], pendingUserIds: ["u-ana"] },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "n-governo-aprovacao", userId: "u-ana", type: "ticket", title: "Cronograma pronto para aprovação", body: "André Lima concluiu a conferência do chamado CH-2026-0188.", relatedEntityId: "t-188", readAt: null, createdAt: "2026-08-13T14:48:00.000Z", actorName: "André Lima", actorInitials: "AL" },
  { id: "n-convite-saude", userId: "u-ana", type: "group_invite", title: "Novo convite para grupo", body: "Natália Cristina Pedrosa Cabral convidou você para o Comitê de Saúde Digital.", relatedEntityId: "g-saude-digital", readAt: null, createdAt: "2026-08-13T14:45:00.000Z", actorName: "Natália Cristina Pedrosa Cabral", actorInitials: "NC" },
  { id: "n-convite-volta-aulas", userId: "u-rafael", type: "group_invite", title: "Novo convite para grupo", body: "Leila Cibeli Silveira Mendes convidou você para Operação Volta às Aulas 2026.", relatedEntityId: "g-volta-aulas", readAt: null, createdAt: "2026-08-13T14:00:00.000Z", actorName: "Leila Cibeli Silveira Mendes", actorInitials: "LM" },
  { id: "n-aprovacao", userId: "u-ana", type: "ticket", title: "Chamado aguardando aprovação", body: "O chamado CH-2026-0186 está pronto para sua análise.", relatedEntityId: "t-186", readAt: null, createdAt: "2026-08-13T14:52:00.000Z", actorName: "Natália Cristina Pedrosa Cabral", actorInitials: "NC" },
  { id: "n-documento", userId: "u-ana", type: "message", title: "Documento recebido", body: "Bruno Gonçalves da Fonseca enviou o Relatório técnico — Iluminação.pdf.", relatedEntityId: "m-3", readAt: "2026-08-13T14:40:00.000Z", createdAt: "2026-08-13T14:36:00.000Z", actorName: "Bruno Gonçalves da Fonseca", actorInitials: "BF" },
];

const INITIAL_INVITATIONS: GroupInvitation[] = [
  { groupId: "g-saude-digital", userId: "u-ana", groupName: "Comitê de Saúde Digital", description: "Integração dos atendimentos e sistemas da rede municipal.", invitedByName: "Natália Cristina Pedrosa Cabral", invitedByInitials: "NC", memberCount: 1, status: "convidado", createdAt: "2026-08-13T14:45:00.000Z" },
  { groupId: "g-volta-aulas", userId: "u-rafael", groupName: "Operação Volta às Aulas 2026", description: "Educação, Mobilidade e Governo", invitedByName: "Leila Cibeli Silveira Mendes", invitedByInitials: "LM", memberCount: 2, status: "convidado", createdAt: "2026-08-13T14:00:00.000Z" },
];

const INITIAL_MESSAGES: Message[] = [
  { id: "m-gov-1", conversationType: "direct", conversationId: "u-ana::u-mariana", senderId: "u-mariana", senderName: "Mariana Castro", senderInitials: "MC", body: "Revisei o comunicado e sinalizei dois trechos que ainda precisam de confirmação.", ticketId: "t-189", createdAt: "2026-08-13T15:12:00.000Z" },
  { id: "m-gov-2", conversationType: "direct", conversationId: "u-ana::u-andre", senderId: "u-andre", senderName: "André Lima", senderInitials: "AL", body: "O cronograma da audiência está pronto para sua aprovação.", ticketId: "t-188", createdAt: "2026-08-13T14:48:00.000Z" },
  { id: "m-1", conversationType: "direct", conversationId: "u-ana::u-rafael", senderId: "u-rafael", senderName: "Bruno Gonçalves da Fonseca", senderInitials: "BF", body: "Bom dia, Artur. A equipe já iniciou a vistoria na Praça Central.", ticketId: "t-187", createdAt: "2026-08-13T14:20:00.000Z" },
  { id: "m-2", conversationType: "direct", conversationId: "u-ana::u-rafael", senderId: "u-ana", senderName: "Artur Paulo Fagundes Rabelo", senderInitials: "AR", body: "Ótimo. Por favor, envie o relatório técnico assim que estiver pronto.", ticketId: "t-187", createdAt: "2026-08-13T14:24:00.000Z" },
  { id: "m-3", conversationType: "direct", conversationId: "u-ana::u-rafael", senderId: "u-rafael", senderName: "Bruno Gonçalves da Fonseca", senderInitials: "BF", body: "Segue a primeira versão para conferência.", attachmentId: "d-1", attachmentName: "Relatório técnico — Iluminação.pdf", attachmentSize: 2480000, attachmentContentType: "application/pdf", ticketId: "t-187", createdAt: "2026-08-13T14:36:00.000Z" },
  { id: "m-4", conversationType: "group", conversationId: "g-volta-aulas", senderId: "u-amanda", senderName: "Leila Cibeli Silveira Mendes", senderInitials: "LM", body: "Incluí a planilha com os novos itinerários. Precisamos da validação até amanhã.", ticketId: "t-185", createdAt: "2026-08-13T14:10:00.000Z" },
];

const INITIAL_DOCS: DocumentItem[] = [
  { id: "d-1", name: "Relatório técnico — Iluminação.pdf", category: "Relatório técnico", ownerId: "u-rafael", ownerName: "Bruno Gonçalves da Fonseca", department: "Secretaria de Infraestrutura e Transporte", ticketId: "t-187", contentType: "application/pdf", size: 2480000, createdAt: "2026-08-13T14:36:00.000Z" },
  { id: "d-2", name: "Itinerários escolares — Zona Norte.xlsx", category: "Planilha", ownerId: "u-amanda", ownerName: "Leila Cibeli Silveira Mendes", department: "Secretaria de Educação", ticketId: "t-185", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 840000, createdAt: "2026-08-13T14:10:00.000Z" },
  { id: "d-3", name: "Planejamento semanal do gabinete.pdf", category: "Planejamento", ownerId: "u-ana", ownerName: "Artur Paulo Fagundes Rabelo", department: "Secretaria de Governo", contentType: "application/pdf", size: 620000, createdAt: "2026-08-13T12:00:00.000Z" },
];

const INITIAL_EVENTS: SectorEvent[] = [
  { id: "e-governo-1", title: "Reunião de alinhamento do gabinete", description: "Revisão das prioridades e dos chamados em andamento.", department: "Secretaria de Governo", targetDepartments: ["Secretaria de Governo", "Gabinete do Prefeito"], location: "Sala de reuniões do gabinete", startsAt: "2026-08-14T12:30:00.000Z", endsAt: "2026-08-14T13:30:00.000Z", createdBy: "u-ana", creatorName: "Artur Paulo Fagundes Rabelo", creatorInitials: "AR", createdAt: "2026-08-13T12:00:00.000Z" },
  { id: "e-governo-2", title: "Despacho com chefias de setor", description: "Consolidação das demandas para a próxima semana.", department: "Secretaria de Governo", targetDepartments: ["Secretaria de Governo", "Secretaria de Administração e Finanças", "Secretaria de Infraestrutura e Transporte", "Secretaria de Saúde", "Secretaria de Educação"], location: "Auditório municipal", startsAt: "2026-08-17T13:00:00.000Z", endsAt: "2026-08-17T14:30:00.000Z", createdBy: "u-ana", creatorName: "Artur Paulo Fagundes Rabelo", creatorInitials: "AR", createdAt: "2026-08-13T12:30:00.000Z" },
  { id: "e-saude-1", title: "Revisão da campanha de vacinação", description: "Validação final do calendário e dos pontos de atendimento.", department: "Secretaria de Saúde", targetDepartments: ["Secretaria de Saúde", "Secretaria de Comunicação e Eventos"], location: "Sala técnica da Saúde", startsAt: "2026-08-15T12:00:00.000Z", endsAt: null, createdBy: "u-lucas", creatorName: "Natália Cristina Pedrosa Cabral", creatorInitials: "NC", createdAt: "2026-08-13T13:00:00.000Z" },
];

const INITIAL_AUDIT: AuditItem[] = [
  { id: "a-gov-1", action: "status_atualizado", entityType: "chamado", entityId: "t-188", detail: "Cronograma da audiência movido para Aguardando aprovação", createdAt: "2026-08-13T14:48:00.000Z", actorName: "André Lima", actorInitials: "AL" },
  { id: "a-gov-2", action: "chamado_criado", entityType: "chamado", entityId: "t-190", detail: "Prioridades da reunião do secretariado registradas", createdAt: "2026-08-13T15:05:00.000Z", actorName: "Artur Paulo Fagundes Rabelo", actorInitials: "AR" },
  { id: "a-1", action: "status_atualizado", entityType: "chamado", entityId: "t-186", detail: "Calendário de vacinação movido para Aguardando aprovação", createdAt: "2026-08-13T14:52:00.000Z", actorName: "Natália Cristina Pedrosa Cabral", actorInitials: "NC" },
  { id: "a-2", action: "documento_enviado", entityType: "mensagem", entityId: "m-3", detail: "Relatório técnico — Iluminação.pdf enviado no chat", createdAt: "2026-08-13T14:36:00.000Z", actorName: "Bruno Gonçalves da Fonseca", actorInitials: "BF" },
  { id: "a-3", action: "grupo_criado", entityType: "grupo", entityId: "g-volta-aulas", detail: "Grupo Operação Volta às Aulas 2026 criado", createdAt: "2026-08-13T14:00:00.000Z", actorName: "Leila Cibeli Silveira Mendes", actorInitials: "LM" },
  { id: "a-4", action: "chamado_finalizado", entityType: "chamado", entityId: "t-184", detail: "Parecer sobre contratação emergencial finalizado", createdAt: "2026-08-13T12:00:00.000Z", actorName: "Jaime de Souza", actorInitials: "JS" },
];

const navIcons: Record<NavItem, LucideIcon> = {
  "Visão geral": LayoutDashboard,
  "Área do Setor": Building2,
  "Fluxos e Anotações": Workflow,
  Chamados: ClipboardList,
  Comunicação: MessagesSquare,
  "Atendimento ao Cidadão": Landmark,
  "Central Integrada": LayoutDashboard,
  "Processos Digitais": FileText,
  "Gestão Municipal": Building2,
  Indicadores: LayoutDashboard,
  Notificações: BellRing,
  Pendências: ListTodo,
  "Anexos e Arquivos": Files,
  "Próximos Eventos": CalendarDays,
  Funcionários: UsersRound,
  Secretarias: Building2,
  "Segurança e LGPD": ShieldCheck,
  Auditoria: History,
  "Central de Ajuda": HelpCircle,
  Configurações: Settings,
};
const statusMeta: Record<TicketStatus, { color: string; short: string; icon: LucideIcon }> = {
  Recebido: { color: "blue", short: "Recebidos", icon: Inbox },
  "Em análise": { color: "slate", short: "Em análise", icon: Search },
  "Aguardando aprovação": { color: "violet", short: "Em aprovação", icon: Clock3 },
  "Em execução": { color: "amber", short: "Em execução", icon: LoaderCircle },
  "Aguardando resposta": { color: "orange", short: "Aguardando resposta", icon: MessagesSquare },
  Concluído: { color: "green", short: "Concluídos", icon: CheckCircle2 },
  Cancelado: { color: "red", short: "Cancelados", icon: XCircle },
};
const statuses = Object.keys(statusMeta) as TicketStatus[];
const APP_STATE_KEY = "app:global:v1";
const PERMISSION_SETTINGS_KEY = "settings:permissions:v1";
const EXPERIENCE_SETTINGS_KEY = "settings:experience:v1";
const EXECUTIVE_COMMUNICATION_KEY = "settings:executive-communication:v1";

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavItem>("Visão geral");
  const [authState, setAuthState] = useState<"checking" | "login" | "authenticated">("checking");
  const [clockNow, setClockNow] = useState(() => new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNavGroup, setExpandedNavGroup] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("u-ana");
  const [viewedDepartment, setViewedDepartment] = useState("Secretaria de Governo");
  const [search, setSearch] = useState("");
  const [ticketData, setTicketData] = useState(INITIAL_TICKETS);
  const [users, setUsers] = useState(USERS);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [documents, setDocuments] = useState(INITIAL_DOCS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [invitations, setInvitations] = useState(INITIAL_INVITATIONS);
  const [ticketModal, setTicketModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [eventModal, setEventModal] = useState<SectorEvent | "new" | null>(null);
  const [eventToDelete, setEventToDelete] = useState<SectorEvent | null>(null);
  const [employeeModal, setEmployeeModal] = useState(false);
  const [toast, setToast] = useState("");
  const [interactionModal, setInteractionModal] = useState<{ title: string; message: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [executiveCommunicationAccess, setExecutiveCommunicationAccess] = useState(false);
  const [citizenFeedbackUnread, setCitizenFeedbackUnread] = useState(0);
  const [permissionConfigs, setPermissionConfigs] = useState<Record<string, DepartmentPermissionSettings>>({});
  const [appReady, setAppReady] = useState(false);
  const [persistenceStatus, setPersistenceStatus] = useState<"carregando" | "salvando" | "salvo" | "offline">("carregando");
  const fileInput = useRef<HTMLInputElement>(null);

  const currentUser = users.find((user) => user.id === currentUserId) ?? USERS[0];
  const executiveAccess = isExecutiveAccess(currentUser);
  const mayorAccess = isMayor(currentUser);
  const allDepartments = useMemo(() => Array.from(new Set([
    ...OFFICES.map((office) => office.name),
    ...users.map((user) => user.department),
    ...events.flatMap((event) => event.targetDepartments ?? [event.department]),
  ])).sort((first, second) => first.localeCompare(second, "pt-BR")), [events, users]);
  const activeDepartment = executiveAccess ? viewedDepartment : currentUser.department;
  const privateTickets = ticketData.filter((ticket) => sameDepartment(ticket.department, activeDepartment));
  const privateTicketIds = new Set(privateTickets.map((ticket) => ticket.id));
  const privateDocuments = documents.filter((document) => sameDepartment(document.department, activeDepartment));
  const privateDocumentIds = new Set(privateDocuments.map((document) => document.id));
  const currentEvents = events
    .filter((event) => (event.targetDepartments?.length ? event.targetDepartments : [event.department]).some((department) => sameDepartment(department, activeDepartment)))
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());
  const currentEventIds = new Set(currentEvents.map((event) => event.id));
  const ownCommunicationMessages = messages.filter((message) => messageVisibleToUser(message, currentUserId, groups) && messageConfinedToDepartment(message, activeDepartment, users, groups));
  const viewingOtherDepartment = executiveAccess && !sameDepartment(activeDepartment, currentUser.department);
  const executiveCommunicationMonitor = executiveAccess && executiveCommunicationAccess && viewingOtherDepartment;
  const communicationLocked = viewingOtherDepartment && !executiveCommunicationMonitor;
  const communicationMessages = executiveCommunicationMonitor
    ? messages.filter((message) => messageConfinedToDepartment(message, activeDepartment, users, groups))
    : ownCommunicationMessages;
  const privateMessageIds = new Set(communicationMessages.map((message) => message.id));
  const privateAudit = audit.filter((item) => {
    if (item.entityType === "chamado") return privateTicketIds.has(item.entityId);
    if (item.entityType === "mensagem") return privateMessageIds.has(item.entityId);
    if (item.entityType === "documento") return privateDocumentIds.has(item.entityId);
    if (item.entityType === "evento") return currentEventIds.has(item.entityId) || Boolean(item.department && sameDepartment(item.department, activeDepartment));
    return false;
  });
  const scopedGroupIds = new Set(groups.filter((group) => groupConfinedToDepartment(group, activeDepartment, users)).map((group) => group.id));
  const currentNotifications = notifications.filter((item) => {
    if (item.userId !== currentUserId) return false;
    if (item.type === "ticket" && item.relatedEntityId) return privateTicketIds.has(item.relatedEntityId);
    if (item.type === "message" && item.relatedEntityId) return privateMessageIds.has(item.relatedEntityId);
    if (item.type === "group_invite" && item.relatedEntityId) return scopedGroupIds.has(item.relatedEntityId);
    if (item.type === "system" && item.relatedEntityId && events.some((event) => event.id === item.relatedEntityId)) return currentEventIds.has(item.relatedEntityId);
    return true;
  });
  const currentInvitations = invitations.filter((item) => item.userId === currentUserId && item.status === "convidado" && scopedGroupIds.has(item.groupId));
  const pendingTickets = privateTickets.filter((ticket) => ticket.status === "Aguardando aprovação");
  const unreadCount = currentNotifications.filter((item) => !item.readAt).length;
  const messageBadgeCount = communicationLocked ? 0 : communicationMessages.filter((message) => message.senderId !== currentUserId).length;
  const pendingCount = currentInvitations.length + pendingTickets.length;
  const accessibleGroups = groups.filter((group) => groupConfinedToDepartment(group, activeDepartment, users) && (executiveCommunicationMonitor || !group.memberUserIds || group.memberUserIds.includes(currentUserId)));
  const activeUsers = users.filter((user) => (user.accountStatus ?? "Ativo") === "Ativo");
  const canManageEmployees = isSectorManager(currentUser);
  const sectorUsers = users.filter((user) => sameDepartment(user.department, activeDepartment));
  const scopedActiveUsers = activeUsers.filter((user) => sameDepartment(user.department, activeDepartment));
  const switchableUsers = executiveAccess ? activeUsers : scopedActiveUsers;
  const scopedOffices = OFFICES.filter((office) => sameDepartment(office.name, activeDepartment));
  const availableDepartments = executiveAccess ? allDepartments : [activeDepartment];
  const sectorEmployees = sectorUsers.filter((user) => !isSectorManager(user));
  const departmentPermissionSettings = (() => {
    const configured = permissionConfigs[activeDepartment];
    if (configured) return configured;
    const defaults = createDefaultPermissionSettings();
    sectorEmployees.forEach((employee) => {
      const role = normalizeText(employee.role);
      defaults.assignments[employee.id] = role.includes("campo") ? "campo" : role.includes("operacional") ? "operacional" : role.includes("consulta") ? "consulta" : "atendimento";
    });
    return defaults;
  })();
  const currentPermission = activeNav === "Funcionários" || activeNav === "Configurações"
    ? canManageEmployees ? FULL_PERMISSION : NO_PERMISSION
    : permissionFor(activeNav, canManageEmployees, currentUser.id, departmentPermissionSettings);
  const ticketPermission = permissionFor("Chamados", canManageEmployees, currentUser.id, departmentPermissionSettings);
  const eventPermission = permissionFor("Próximos Eventos", canManageEmployees, currentUser.id, departmentPermissionSettings);
  const communicationPermission = permissionFor("Comunicação", canManageEmployees, currentUser.id, departmentPermissionSettings);

  useNotificationChime(unreadCount + (mayorAccess ? citizenFeedbackUnread : 0), soundEnabled);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json().catch(() => null) as { authenticated?: boolean } | null;
      if (cancelled) return;
      if (payload?.authenticated) { rememberOfflineSession(); setAuthState("authenticated"); }
      else { clearOfflineSession(false); setAuthState("login"); }
    }).catch(() => {
      if (cancelled) return;
      // Sem internet: somente um dispositivo autenticado anteriormente pode reabrir o sistema.
      setAuthState(hasValidOfflineSession() ? "authenticated" : "login");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authState !== "authenticated") return;
    let cancelled = false;
    setPersistenceStatus("carregando");
    void Promise.all([
      loadPersistentValue<{ soundEnabled?: boolean; motionEnabled?: boolean }>(EXPERIENCE_SETTINGS_KEY),
      loadPersistentValue<{ enabled?: boolean }>(EXECUTIVE_COMMUNICATION_KEY),
      loadPersistentValue<Record<string, DepartmentPermissionSettings>>(PERMISSION_SETTINGS_KEY),
      loadPersistentValue<{
        ticketData?: Ticket[]; users?: User[]; groups?: Group[]; messages?: Message[]; documents?: DocumentItem[];
        events?: SectorEvent[]; audit?: AuditItem[]; notifications?: NotificationItem[]; invitations?: GroupInvitation[];
      }>(APP_STATE_KEY),
    ]).then(([experience, executiveCommunication, savedPermissions, stored]) => {
      if (cancelled) return;
      if (typeof experience?.soundEnabled === "boolean") setSoundEnabled(experience.soundEnabled);
      if (typeof experience?.motionEnabled === "boolean") setMotionEnabled(experience.motionEnabled);
      setExecutiveCommunicationAccess(executiveCommunication?.enabled === true);
      if (savedPermissions) setPermissionConfigs(savedPermissions);
      if (stored) {
        if (Array.isArray(stored.ticketData)) setTicketData(backfillTicketLocations(stored.ticketData));
        if (Array.isArray(stored.users)) setUsers(backfillExecutiveUsers(stored.users));
        if (Array.isArray(stored.groups)) setGroups(stored.groups);
        if (Array.isArray(stored.messages)) setMessages(stored.messages);
        if (Array.isArray(stored.documents)) setDocuments(stored.documents);
        if (Array.isArray(stored.events)) setEvents(stored.events);
        if (Array.isArray(stored.audit)) setAudit(stored.audit);
        if (Array.isArray(stored.notifications)) setNotifications(stored.notifications);
        if (Array.isArray(stored.invitations)) setInvitations(stored.invitations);
      }
      setPersistenceStatus("salvo");
      setAppReady(true);
    }).catch(() => {
      if (cancelled) return;
      const cachedExperience = loadCachedPersistentValue<{ soundEnabled?: boolean; motionEnabled?: boolean }>(EXPERIENCE_SETTINGS_KEY);
      const cachedExecutive = loadCachedPersistentValue<{ enabled?: boolean }>(EXECUTIVE_COMMUNICATION_KEY);
      const cachedPermissions = loadCachedPersistentValue<Record<string, DepartmentPermissionSettings>>(PERMISSION_SETTINGS_KEY);
      const cached = loadCachedPersistentValue<{
        ticketData?: Ticket[]; users?: User[]; groups?: Group[]; messages?: Message[]; documents?: DocumentItem[];
        events?: SectorEvent[]; audit?: AuditItem[]; notifications?: NotificationItem[]; invitations?: GroupInvitation[];
      }>(APP_STATE_KEY);
      if (typeof cachedExperience?.soundEnabled === "boolean") setSoundEnabled(cachedExperience.soundEnabled);
      if (typeof cachedExperience?.motionEnabled === "boolean") setMotionEnabled(cachedExperience.motionEnabled);
      if (cachedExecutive) setExecutiveCommunicationAccess(cachedExecutive.enabled === true);
      if (cachedPermissions) setPermissionConfigs(cachedPermissions);
      if (cached) {
        if (Array.isArray(cached.ticketData)) setTicketData(backfillTicketLocations(cached.ticketData));
        if (Array.isArray(cached.users)) setUsers(backfillExecutiveUsers(cached.users));
        if (Array.isArray(cached.groups)) setGroups(cached.groups);
        if (Array.isArray(cached.messages)) setMessages(cached.messages);
        if (Array.isArray(cached.documents)) setDocuments(cached.documents);
        if (Array.isArray(cached.events)) setEvents(cached.events);
        if (Array.isArray(cached.audit)) setAudit(cached.audit);
        if (Array.isArray(cached.notifications)) setNotifications(cached.notifications);
        if (Array.isArray(cached.invitations)) setInvitations(cached.invitations);
      }
      setPersistenceStatus("offline");
      setAppReady(true);
    });
    return () => { cancelled = true; };
  }, [authState]);

  useEffect(() => {
    if (authState !== "authenticated" || !appReady) return;
    const timer = window.setTimeout(() => {
      setPersistenceStatus("salvando");
      void savePersistentValue(EXPERIENCE_SETTINGS_KEY, { soundEnabled, motionEnabled }).then((result) => setPersistenceStatus(result.queued ? "offline" : "salvo")).catch(() => setPersistenceStatus("offline"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [appReady, authState, motionEnabled, soundEnabled]);

  useEffect(() => {
    if (authState !== "authenticated" || !appReady) return;
    const timer = window.setTimeout(() => { void savePersistentValue(EXECUTIVE_COMMUNICATION_KEY, { enabled: executiveCommunicationAccess }).then((result) => { if (result.queued) setPersistenceStatus("offline"); }).catch(() => setPersistenceStatus("offline")); }, 350);
    return () => window.clearTimeout(timer);
  }, [appReady, authState, executiveCommunicationAccess]);

  useEffect(() => {
    if (authState !== "authenticated" || !appReady) return;
    const timer = window.setTimeout(() => { void savePersistentValue(PERMISSION_SETTINGS_KEY, permissionConfigs).then((result) => { if (result.queued) setPersistenceStatus("offline"); }).catch(() => setPersistenceStatus("offline")); }, 450);
    return () => window.clearTimeout(timer);
  }, [appReady, authState, permissionConfigs]);

  useEffect(() => {
    if (authState !== "authenticated" || !appReady) return;
    setPersistenceStatus("salvando");
    void savePersistentValue(APP_STATE_KEY, { ticketData, users, groups, messages, documents, events, audit, notifications, invitations })
      .then((result) => setPersistenceStatus(result.queued ? "offline" : "salvo"))
      .catch(() => setPersistenceStatus("offline"));
  }, [audit, appReady, authState, documents, events, groups, invitations, messages, notifications, ticketData, users]);

  useEffect(() => {
    if (authState !== "authenticated" || !mayorAccess) { setCitizenFeedbackUnread(0); return; }
    let cancelled = false;
    async function refreshCitizenFeedbackCount() {
      try {
        const response = await fetch("/api/citizen-feedback", { cache: "no-store" });
        const payload = await response.json().catch(() => null) as { unread?: number } | null;
        if (!cancelled && response.ok) setCitizenFeedbackUnread(Number(payload?.unread ?? 0));
      } catch { /* mantém o último contador conhecido */ }
    }
    void refreshCitizenFeedbackCount();
    const timer = window.setInterval(() => { void refreshCitizenFeedbackCount(); }, 20000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [authState, mayorAccess, currentUserId]);

  useEffect(() => {
    if (currentPermission.view) return;
    const timer = window.setTimeout(() => setActiveNav("Visão geral"), 0);
    return () => window.clearTimeout(timer);
  }, [currentPermission.view, currentUserId]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const filteredTickets = (() => {
    const term = search.trim().toLowerCase();
    if (!term) return privateTickets;
    return privateTickets.filter((ticket) => [ticket.protocol, ticket.title, ticket.requester, ticket.department].join(" ").toLowerCase().includes(term));
  })();

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
    const opensSomething = /(abert|exibid|consult|orienta|revis|históric|ficha|inventário|temporalidade|formulário|relatório|preparad|detalh|visualiza|painel|módulo)/i.test(message);
    const isCompletion = /(salv|registrad|criad|conclu|enviad|atualizad|movido|reproduzid|excluíd|respondid|aceit|recusad)/i.test(message);
    if (opensSomething && !isCompletion) {
      const rawTitle = message.split(/[.:]/)[0]?.trim() || "Recurso do sistema";
      setInteractionModal({ title: rawTitle.length > 54 ? "Recurso do sistema" : rawTitle, message });
    }
  }

  function exportCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportContacts() {
    exportCsv("contatos-do-setor.csv", [["Setor", "Responsável", "Telefone", "E-mail", "Endereço"], ...scopedOffices.map((office) => [office.name, office.head, office.phone, office.email, office.address])]);
    notify("Contatos do setor exportados em CSV.");
  }

  function exportCurrentReport() {
    exportCsv(`relatorio-${activeNav.toLowerCase().replace(/\s+/g, "-")}.csv`, [["Protocolo", "Assunto", "Secretaria", "Prioridade", "Status", "Prazo"], ...privateTickets.map((ticket) => [ticket.protocol, ticket.title, ticket.department, ticket.priority, ticket.status, ticket.dueDate])]);
    notify(`Relatório de ${activeNav.toLowerCase()} exportado em CSV.`);
  }

  function updatePermissionSettings(settings: DepartmentPermissionSettings) {
    setPermissionConfigs((current) => ({ ...current, [activeDepartment]: settings }));
  }

  function switchUser(userId: string) {
    const nextUser = users.find((user) => user.id === userId);
    if (!nextUser || (!executiveAccess && !sameDepartment(nextUser.department, currentUser.department))) {
      notify("A troca de perfil foi bloqueada: somente Prefeito e Vice-prefeito podem acessar outro setor.");
      return;
    }
    setCurrentUserId(userId);
    setViewedDepartment(nextUser.department);
  }

  async function logout() {
    if (!navigator.onLine) { clearOfflineSession(true); window.location.reload(); return; }
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { clearOfflineSession(false); window.location.reload(); }
  }

  async function createTicket(form: FormData) {
    const now = new Date().toISOString();
    const assigneeId = String(form.get("assigneeId") || "") || null;
    const requestedDepartment = String(form.get("department") || "");
    const targetDepartment = availableDepartments.find((department) => sameDepartment(department, requestedDepartment)) ?? activeDepartment;
    const assignee = scopedActiveUsers.find((user) => user.id === assigneeId && sameDepartment(user.department, targetDepartment));
    const temporary: Ticket = {
      id: makeId(), protocol: `CH-2026-${String(ticketData.length + 188).padStart(4, "0")}`,
      title: String(form.get("title")), description: String(form.get("description")), requester: activeDepartment,
      department: targetDepartment, priority: String(form.get("priority")) as Priority, status: "Recebido",
      dueDate: String(form.get("dueDate")) || null, assigneeId: assignee?.id ?? null, assigneeName: assignee?.fullName, assigneeInitials: assignee?.initials, neighborhood: String(form.get("neighborhood") || ""), address: String(form.get("address") || ""), latitude: Number.isFinite(Number(form.get("latitude"))) && String(form.get("latitude")||"").trim() ? Number(form.get("latitude")) : null, longitude: Number.isFinite(Number(form.get("longitude"))) && String(form.get("longitude")||"").trim() ? Number(form.get("longitude")) : null, createdAt: now, updatedAt: now,
    };
    const belongsToCurrentDepartment = sameDepartment(temporary.department, activeDepartment);
    setTicketData((current) => [temporary, ...current]);
    addAudit("chamado_criado", "chamado", temporary.id, `${temporary.protocol} criado: ${temporary.title}${temporary.neighborhood ? ` · ${temporary.neighborhood}` : ""}`);
    setTicketModal(false);
    setActiveNav("Chamados");
    notify(belongsToCurrentDepartment ? "Chamado criado e visível somente para o seu setor." : `Chamado encaminhado de forma privada para ${temporary.department}.`);
    return temporary;
  }

  async function executeMunicipalAgentAction(action: MunicipalAgentAction): Promise<MunicipalAgentExecutionResult> {
    const payload = action.payload;
    const validDepartment = (name: string) => availableDepartments.find((item) => sameDepartment(item, name)) || "";
    if (action.type === "navigate") {
      const navMap: Record<string, NavItem> = { "Início": "Visão geral", "Demandas": "Chamados", "Tarefas": "Central Integrada", "Agenda": "Próximos Eventos", "Gestão": "Central Integrada", "Configurações": "Configurações", "Chamados": "Chamados", "Atendimento ao Cidadão": "Atendimento ao Cidadão", "Central Integrada": "Central Integrada", "Próximos Eventos": "Próximos Eventos" };
      const target = navMap[payload.navTarget] || navMap[payload.title]; if (!target) return { ok:false, message:"Não encontrei essa área na navegação disponível." }; setActiveNav(target); return { ok:true, message:`Abri a área “${payload.navTarget || payload.title}”.` };
    }
    if (action.type === "create_ticket") {
      if (!ticketPermission.register) return { ok:false, message:"Seu perfil não possui permissão para criar chamados." };
      const targetDepartment = validDepartment(payload.department) || activeDepartment;
      const form = new FormData(); form.set("title", payload.title || "Solicitação registrada pela IA"); form.set("description", payload.description || action.summary); form.set("department", targetDepartment); form.set("priority", ["Urgente","Alta","Média","Baixa"].includes(payload.priority) ? payload.priority : "Média"); form.set("dueDate", payload.dueDate ? payload.dueDate.slice(0,10) : ""); form.set("neighborhood", payload.neighborhood); form.set("address", payload.address); if (payload.assignee) { const assignee = users.find((item)=>item.fullName.toLowerCase()===payload.assignee.toLowerCase() && sameDepartment(item.department,targetDepartment)); if (assignee) form.set("assigneeId", assignee.id); }
      const created = await createTicket(form); if (!created) return { ok:false, message:"Não foi possível registrar o chamado." }; return { ok:true, message:`Chamado ${created.protocol} criado com sucesso e encaminhado para ${created.department}.`, entityId:created.id, protocol:created.protocol };
    }
    if (action.type === "send_internal_message") {
      if (!payload.assignee.trim() || !payload.description.trim()) return { ok:false, message:"A IA ainda precisa do destinatário e do texto da mensagem antes de enviar." };
      if (!communicationPermission.register) return { ok:false, message:"Seu perfil não possui permissão para enviar mensagens internas." };
      const normalizedRecipient = normalizeText(payload.assignee); const matches = scopedActiveUsers.filter((item)=>item.id!==currentUser.id && (normalizeText(item.fullName)===normalizedRecipient || normalizeText(item.fullName).includes(normalizedRecipient) || normalizedRecipient.includes(normalizeText(item.fullName))));
      if (matches.length !== 1) return { ok:false, message: matches.length ? `Encontrei mais de um servidor compatível com “${payload.assignee}”. Informe o nome completo no chat da IA.` : `Não encontrei o destinatário “${payload.assignee}” entre os usuários ativos.` };
      const recipient=matches[0]; const now=new Date().toISOString(); const message:Message={id:makeId(),conversationType:"direct",conversationId:directConversationId(currentUser.id,recipient.id),senderId:currentUser.id,senderName:currentUser.fullName,senderInitials:currentUser.initials,body:payload.description,ticketId:payload.ticketProtocol ? privateTickets.find((item)=>item.protocol.toLowerCase()===payload.ticketProtocol.toLowerCase())?.id ?? null : null,createdAt:now}; sendMessage(message,recipient.id); return {ok:true,message:`Mensagem enviada para ${recipient.fullName} (${recipient.department}).`,entityId:message.id};
    }
    if (action.type === "update_ticket_status") {
      const ticket = privateTickets.find((item)=>item.protocol.toLowerCase()===payload.ticketProtocol.toLowerCase()); if (!ticket) return { ok:false, message:`Não encontrei o chamado ${payload.ticketProtocol} no setor atual.` }; const validStatus = statuses.find((status)=>status.toLowerCase()===payload.status.toLowerCase()); if (!validStatus) return { ok:false, message:"O novo status informado não é válido." }; if (!ticketPermission.edit || !sameDepartment(ticket.department, activeDepartment)) return { ok:false, message:"Seu perfil não possui autorização para alterar esse chamado no setor visualizado." }; updateStatus(ticket.id, validStatus); return { ok:true, message:`Chamado ${ticket.protocol} atualizado para “${validStatus}”.`, entityId:ticket.id, protocol:ticket.protocol };
    }
    if (action.type === "create_event") {
      if (!payload.title.trim() || !payload.startsAt.trim()) return { ok:false, message:"A IA ainda precisa do título e da data/hora de início para publicar o evento." };
      if (!eventPermission.register) return { ok:false, message:"Seu perfil não possui permissão para criar eventos." }; const targets=(payload.targetDepartments.length?payload.targetDepartments:[payload.department||activeDepartment]).map(validDepartment).filter(Boolean); if(!targets.length)return{ok:false,message:"Não foi possível identificar o setor que deve receber o evento."};
      const form=new FormData(); form.set("title",payload.title);form.set("description",payload.description);form.set("location",payload.location);form.set("startsAt",payload.startsAt);form.set("endsAt",payload.endsAt);targets.forEach((target)=>form.append("targetDepartments",target)); const created=await saveEvent(form); return created?{ok:true,message:`Evento “${created.title}” publicado para ${targets.length} ${targets.length===1?"setor":"setores"}.`,entityId:created.id}:{ok:false,message:"Não foi possível publicar o evento."};
    }
    const persistentConfig = action.type === "create_task" ? { key:"integrated:tasks:v2", prefix:"task" } : action.type === "create_project" ? { key:"integrated:projects:v2", prefix:"project" } : action.type === "create_goal" ? { key:"integrated:goals:v2", prefix:"goal" } : action.type === "create_place" ? { key:"integrated:places:v2", prefix:"place" } : null;
    if (persistentConfig) {
      const current = await loadPersistentValue<Array<Record<string, unknown>>>(persistentConfig.key).catch(()=>loadCachedPersistentValue<Array<Record<string, unknown>>>(persistentConfig.key) || []) || []; const now=new Date().toISOString(); const entityId=`${persistentConfig.prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`; let next:Record<string,unknown>;
      if(action.type==="create_task"){if(!payload.title.trim()||!payload.description.trim())return{ok:false,message:"A IA ainda precisa do título e da descrição da tarefa."};const dueAt=payload.dueAt?new Date(payload.dueAt).toISOString():new Date(Date.now()+(payload.slaHours||48)*3600000).toISOString();next={id:entityId,title:payload.title,description:payload.description,kind:["Tarefa","Solicitação interna","Vistoria"].includes(payload.kind)?payload.kind:"Tarefa",requesterDepartment:activeDepartment,department:validDepartment(payload.department)||activeDepartment,assignee:payload.assignee||"Responsável a definir",priority:["Baixa","Normal","Alta","Urgente"].includes(payload.priority)?payload.priority:"Normal",status:"A fazer",dueAt,slaHours:payload.slaHours||48,createdAt:now,updatedAt:now,tags:payload.tags,comments:[],history:[{at:now,action:`Criada pelo Agente Municipal a pedido de ${currentUser.fullName}`} ]};}
      else if(action.type==="create_project"){if(!payload.title.trim()||!payload.dueDate.trim())return{ok:false,message:"A IA ainda precisa do nome e do prazo do projeto."};next={id:entityId,title:payload.title,department:validDepartment(payload.department)||activeDepartment,owner:payload.owner||currentUser.fullName,status:"Planejamento",progress:0,dueDate:payload.dueDate.slice(0,10),stages:[{name:"Planejamento",done:false},{name:"Execução",done:false},{name:"Validação",done:false},{name:"Entrega",done:false}]};}
      else if(action.type==="create_goal"){if(!payload.title.trim()||!payload.dueDate.trim()||payload.target<=0)return{ok:false,message:"A IA ainda precisa do nome, meta numérica e prazo."};next={id:entityId,title:payload.title,department:validDepartment(payload.department)||activeDepartment,current:Math.max(0,payload.current||0),target:Math.max(0.01,payload.target||1),unit:payload.unit||"%",dueDate:payload.dueDate.slice(0,10)};}
      else {if(!payload.title.trim()||!payload.neighborhood.trim()||!payload.address.trim())return{ok:false,message:"A IA ainda precisa do nome, bairro e endereço do local público."};next={id:entityId,name:payload.title,type:payload.placeType||"Outro",department:activeDepartment,neighborhood:payload.neighborhood,address:payload.address,status:"Operacional",lastMaintenance:now.slice(0,10),history:[`${new Date().toLocaleDateString("pt-BR")} — local cadastrado pelo Agente Municipal por ${currentUser.fullName}`]};}
      await savePersistentValue(persistentConfig.key,[next,...current]); window.dispatchEvent(new CustomEvent("municipal-agent-data-changed",{detail:{key:persistentConfig.key}})); addAudit(`ia_${action.type}`,action.type,entityId,action.summary); if(action.type==="create_task")setActiveNav("Central Integrada"); return {ok:true,message:action.type==="create_task"?`Tarefa “${payload.title}” criada e encaminhada para ${String(next.department)}.`:action.type==="create_project"?`Projeto “${payload.title}” criado com sucesso.`:action.type==="create_goal"?`Meta “${payload.title}” cadastrada com sucesso.`:`Local público “${payload.title}” cadastrado com sucesso.`,entityId};
    }
    return { ok:false, message:"Essa ação ainda não possui executor automático no sistema." };
  }

  function updateStatus(id: string, status: TicketStatus) {
    const ticket = ticketData.find((item) => item.id === id);
    if (!ticketPermission.edit || !ticket || !sameDepartment(ticket.department, activeDepartment)) { notify("Seu perfil não possui autorização para alterar este chamado."); return; }
    setTicketData((current) => current.map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
    addAudit("status_atualizado", "chamado", id, `${ticket?.protocol ?? "Chamado"} movido para ${status}`);
    notify(`Chamado movido para “${status}”.`);
  }

  function addAudit(action: string, entityType: string, entityId: string, detail: string) {
    setAudit((current) => [{ id: makeId(), action, entityType, entityId, detail, department: activeDepartment, createdAt: new Date().toISOString(), actorName: currentUser.fullName, actorInitials: currentUser.initials }, ...current]);
  }

  async function uploadFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { notify("O arquivo deve ter no máximo 10 MB."); return; }
    const item: DocumentItem = { id: makeId(), name: file.name, category: "Arquivo do setor", ownerId: currentUser.id, ownerName: currentUser.fullName, department: activeDepartment, contentType: file.type || "application/octet-stream", size: file.size, createdAt: new Date().toISOString() };
    setDocuments((current) => [item, ...current]);
    addAudit("documento_enviado", "documento", item.id, `${file.name} compartilhado com ${activeDepartment}`);
    notify("Arquivo compartilhado com todos do seu setor.");
    const form = new FormData(); form.append("file", file); form.append("clientId", item.id); form.append("category", "Arquivo do setor"); form.append("userId", currentUser.id); form.append("ownerName", currentUser.fullName); form.append("department", activeDepartment);
    try {
      if (!navigator.onLine) { await queueFormRequest("/api/files", "POST", form, `Arquivo ${file.name}`); notify("Sem internet: arquivo guardado neste dispositivo e colocado na fila de sincronização."); return; }
      const response = await fetch("/api/files", { method: "POST", body: form });
      const payload = await response.json().catch(() => null) as { id?: string; error?: string } | null;
      if (!response.ok || !payload?.id) throw new Error(payload?.error || "Não foi possível enviar o arquivo.");
      setDocuments((current) => current.map((doc) => doc.id === item.id ? { ...doc, id: payload.id! } : doc));
      notify("Arquivo salvo no Supabase e compartilhado com o setor.");
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) { await queueFormRequest("/api/files", "POST", form, `Arquivo ${file.name}`); notify("A conexão caiu: o arquivo foi preservado e será enviado automaticamente depois."); return; }
      setDocuments((current) => current.filter((doc) => doc.id !== item.id));
      notify(error instanceof Error ? error.message : "Não foi possível salvar o arquivo.");
    }
  }

  function addEventNotifications(item: SectorEvent, action: "publicado" | "atualizado" | "cancelado") {
    const targets = item.targetDepartments?.length ? item.targetDepartments : [item.department];
    const recipients = users.filter((user) => user.id !== currentUser.id && targets.some((department) => sameDepartment(department, user.department)));
    if (!recipients.length) return;
    const now = new Date().toISOString();
    setNotifications((current) => [
      ...recipients.map((user): NotificationItem => ({
        id: makeId(), userId: user.id, type: "system", title: action === "cancelado" ? "Evento cancelado" : action === "atualizado" ? "Evento atualizado" : "Novo evento na agenda",
        body: action === "cancelado" ? `O evento “${item.title}” foi removido da agenda.` : `“${item.title}” foi ${action} para ${targets.length === 1 ? "o seu setor" : `${targets.length} setores`}.`,
        relatedEntityId: item.id, readAt: null, createdAt: now, actorName: currentUser.fullName, actorInitials: currentUser.initials,
      })),
      ...current,
    ]);
  }

  async function saveEvent(form: FormData, existing?: SectorEvent) {
    const requiredPermission = existing ? eventPermission.edit : eventPermission.register;
    if (!requiredPermission) { notify("Seu perfil não possui autorização para realizar esta ação na agenda."); return; }
    const startsAt = localDateTimeToIso(String(form.get("startsAt") ?? ""));
    const rawEndsAt = String(form.get("endsAt") ?? "");
    const endsAt = rawEndsAt ? localDateTimeToIso(rawEndsAt) : null;
    if (endsAt && new Date(endsAt) < new Date(startsAt)) { notify("O término do evento não pode ser anterior ao início."); return; }
    const requestedTargets = Array.from(new Set(form.getAll("targetDepartments").map(String).filter(Boolean)));
    const targetDepartments = availableDepartments.filter((department) => requestedTargets.some((target) => sameDepartment(target, department)));
    if (!targetDepartments.length) { notify("Selecione pelo menos um setor para publicar o evento."); return; }
    if (existing) {
      if (!sameDepartment(existing.department, activeDepartment)) { notify("Somente o setor que criou o evento pode alterá-lo."); return; }
      const updated: SectorEvent = {
        ...existing,
        title: String(form.get("title") ?? "").trim(), description: String(form.get("description") ?? "").trim(),
        targetDepartments, location: String(form.get("location") ?? "").trim(), startsAt, endsAt,
      };
      setEvents((current) => current.map((item) => item.id === existing.id ? updated : item));
      addAudit("evento_atualizado", "evento", existing.id, `${updated.title} atualizado para ${targetDepartments.length} ${targetDepartments.length === 1 ? "setor" : "setores"}`);
      addEventNotifications(updated, "atualizado");
      setEventModal(null);
      notify("Evento atualizado e agenda dos setores sincronizada.");
      return updated;
    }
    const temporary: SectorEvent = {
      id: makeId(), title: String(form.get("title") ?? "").trim(), description: String(form.get("description") ?? "").trim(),
      department: activeDepartment, targetDepartments, location: String(form.get("location") ?? "").trim(), startsAt, endsAt,
      createdBy: currentUser.id, creatorName: currentUser.fullName, creatorInitials: currentUser.initials, createdAt: new Date().toISOString(),
    };
    setEvents((current) => [...current, temporary]);
    addAudit("evento_criado", "evento", temporary.id, `${temporary.title} publicado para ${targetDepartments.length} ${targetDepartments.length === 1 ? "setor" : "setores"}`);
    addEventNotifications(temporary, "publicado");
    setEventModal(null);
    setActiveNav("Próximos Eventos");
    notify(`Evento publicado para ${targetDepartments.length} ${targetDepartments.length === 1 ? "setor" : "setores"}.`);
    return temporary;
  }

  function deleteEvent(item: SectorEvent) {
    if (!eventPermission.edit || !currentEventIds.has(item.id) || !sameDepartment(item.department, activeDepartment)) { notify("Somente o setor que criou o evento pode excluí-lo."); return; }
    setEvents((current) => current.filter((event) => event.id !== item.id));
    addAudit("evento_excluido", "evento", item.id, `${item.title} removido da agenda`);
    addEventNotifications(item, "cancelado");
    setEventToDelete(null);
    notify("Evento excluído das agendas autorizadas.");
  }

  function recipientIds(conversationType: ChatTab, conversationId: string, recipientId?: string) {
    if (conversationType === "direct") return recipientId && recipientId !== currentUserId && scopedActiveUsers.some((user) => user.id === recipientId) ? [recipientId] : [];
    return (groups.find((group) => group.id === conversationId)?.memberUserIds ?? []).filter((id) => id !== currentUserId && scopedActiveUsers.some((user) => user.id === id));
  }

  function addMessageNotifications(message: Message, recipientId?: string) {
    const recipients = recipientIds(message.conversationType, message.conversationId, recipientId);
    if (!recipients.length) return;
    const body = message.attachmentName
      ? `${currentUser.fullName} enviou o documento ${message.attachmentName}.`
      : `${currentUser.fullName} enviou uma nova mensagem.`;
    setNotifications((current) => [
      ...recipients.map((userId): NotificationItem => ({ id: makeId(), userId, type: "message", title: message.attachmentName ? "Novo documento na conversa" : "Nova mensagem", body, relatedEntityId: message.id, readAt: null, createdAt: message.createdAt, actorName: currentUser.fullName, actorInitials: currentUser.initials })),
      ...current,
    ]);
  }

  function sendMessage(message: Message, recipientId?: string) {
    if (!messageConfinedToDepartment(message, activeDepartment, users, groups)) { notify("A mensagem foi bloqueada porque o destinatário não pertence ao setor visualizado."); return; }
    setMessages((current) => [...current, message]);
    addMessageNotifications(message, recipientId);
    addAudit("mensagem_enviada", "mensagem", message.id, `Mensagem enviada por ${currentUser.fullName}`);
  }

  async function sendChatAttachment(file: File, context: { conversationType: ChatTab; conversationId: string; recipientId?: string; body: string; ticketId?: string | null }) {
    if (file.size > 10 * 1024 * 1024) { notify("O documento deve ter no máximo 10 MB."); return false; }
    const now = new Date().toISOString();
    const tempDocumentId = makeId();
    const tempMessageId = makeId();
    const localUrl = URL.createObjectURL(file);
    const documentItem: DocumentItem = { id: tempDocumentId, name: file.name, category: "Documento do chat", ownerId: currentUser.id, ownerName: currentUser.fullName, department: activeDepartment, contentType: file.type || "application/octet-stream", size: file.size, createdAt: now };
    const message: Message = { id: tempMessageId, conversationType: context.conversationType, conversationId: context.conversationId, senderId: currentUser.id, senderName: currentUser.fullName, senderInitials: currentUser.initials, body: context.body.trim(), attachmentId: tempDocumentId, attachmentName: file.name, attachmentSize: file.size, attachmentContentType: file.type || "application/octet-stream", attachmentUrl: localUrl, ticketId: context.ticketId ?? null, createdAt: now };
    setDocuments((current) => [documentItem, ...current]);
    setMessages((current) => [...current, message]);
    addMessageNotifications(message, context.recipientId);
    addAudit("documento_enviado", "mensagem", tempMessageId, `${file.name} enviado no chat`);
    notify("Documento enviado na conversa e registrado.");

    const form = new FormData();
    form.append("file", file);
    form.append("clientId", tempDocumentId);
    form.append("clientMessageId", tempMessageId);
    form.append("category", "Documento do chat");
    form.append("userId", currentUser.id);
    form.append("ownerName", currentUser.fullName);
    form.append("department", activeDepartment);
    form.append("conversationType", context.conversationType);
    form.append("conversationId", context.conversationId);
    if (context.recipientId) form.append("recipientId", context.recipientId);
    if (context.ticketId) form.append("ticketId", context.ticketId);
    if (context.body.trim()) form.append("messageBody", context.body.trim());

    try {
      if (!navigator.onLine) { await queueFormRequest("/api/files", "POST", form, `Documento do chat ${file.name}`); notify("Sem internet: documento e mensagem ficaram na fila de sincronização."); return true; }
      const response = await fetch("/api/files", { method: "POST", body: form });
      if (!response.ok) throw new Error("Falha no envio");
      const saved = await response.json() as { id: string; message?: { id: string; createdAt: string } };
      setDocuments((current) => current.map((doc) => doc.id === tempDocumentId ? { ...doc, id: saved.id } : doc));
      setMessages((current) => current.map((item) => item.id === tempMessageId ? { ...item, id: saved.message?.id ?? item.id, attachmentId: saved.id, attachmentUrl: null, createdAt: saved.message?.createdAt ?? item.createdAt } : item));
      URL.revokeObjectURL(localUrl);
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) { await queueFormRequest("/api/files", "POST", form, `Documento do chat ${file.name}`); notify("A conexão caiu: documento e mensagem foram preservados para sincronização."); return true; }
      setDocuments((current) => current.filter((doc) => doc.id !== tempDocumentId));
      setMessages((current) => current.filter((item) => item.id !== tempMessageId));
      URL.revokeObjectURL(localUrl);
      notify(error instanceof Error ? error.message : "Não foi possível salvar o documento da conversa.");
      return false;
    }
    return true;
  }

  function markNotification(id: string) {
    const now = new Date().toISOString();
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, readAt: now } : item));
  }

  function markAllNotifications() {
    const unread = currentNotifications.filter((item) => !item.readAt);
    if (!unread.length) { notify("Não há novas notificações."); return; }
    const now = new Date().toISOString();
    setNotifications((current) => current.map((item) => item.userId === currentUserId ? { ...item, readAt: item.readAt ?? now } : item));
    notify("Todas as notificações foram marcadas como lidas.");
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
  }

  function createGroup(group: Group, memberIds: string[]) {
    const scopedMemberIds = memberIds.filter((userId) => scopedActiveUsers.some((user) => user.id === userId));
    const createdGroup = { ...group, memberUserIds: [currentUserId], pendingUserIds: scopedMemberIds };
    const newInvitations = scopedMemberIds.map((userId): GroupInvitation => ({ groupId: group.id, userId, groupName: group.name, description: group.description, invitedByName: currentUser.fullName, invitedByInitials: currentUser.initials, memberCount: 1, status: "convidado", createdAt: group.createdAt }));
    const newNotifications = scopedMemberIds.map((userId): NotificationItem => ({ id: makeId(), userId, type: "group_invite", title: "Novo convite para grupo", body: `${currentUser.fullName} convidou você para ${group.name}.`, relatedEntityId: group.id, readAt: null, createdAt: group.createdAt, actorName: currentUser.fullName, actorInitials: currentUser.initials }));
    setGroups((current) => [createdGroup, ...current]);
    setInvitations((current) => [...newInvitations, ...current]);
    setNotifications((current) => [...newNotifications, ...current]);
    addAudit("grupo_criado", "grupo", group.id, `Grupo ${group.name} criado com ${scopedMemberIds.length} convites enviados`);
    setGroupModal(false);
    setActiveNav("Comunicação");
    notify(`${scopedMemberIds.length} ${scopedMemberIds.length === 1 ? "convite enviado" : "convites enviados"} para integrantes do setor.`);
  }

  async function inviteEmployee(form: FormData) {
    if (!canManageEmployees) { notify("Somente o responsável pelo setor pode convidar funcionários."); return; }
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    if (!fullName || !email) { notify("Informe nome e e-mail do funcionário."); return; }
    try {
      const response = await fetch("/api/auth/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName, email, department: activeDepartment, role: "Funcionário", redirectTo: window.location.origin }) });
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string; user?: { id?: string } } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Não foi possível enviar o convite.");
      const id = typeof payload.user?.id === "string" ? payload.user.id : makeId();
      const invited: User = { id, fullName, email, department: activeDepartment, role: "Funcionário", initials: makeInitials(fullName), accountStatus: "Aguardando criação de senha", invitedAt: new Date().toISOString(), invitedBy: currentUser.id };
      setUsers((current) => current.some((user) => user.email.toLowerCase() === email) ? current.map((user) => user.email.toLowerCase() === email ? invited : user) : [...current, invited]);
      addAudit("funcionario_convidado", "funcionario", id, `Convite enviado para ${fullName} (${email})`);
      setEmployeeModal(false); setActiveNav("Funcionários"); notify(`Convite enviado para ${email}.`);
    } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível enviar o convite."); }
  }

  async function resendEmployeeInvite(user: User) {
    try {
      const response = await fetch("/api/auth/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: user.fullName, email: user.email, department: user.department, role: user.role, redirectTo: window.location.origin }) });
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Não foi possível reenviar o convite.");
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, invitedAt: new Date().toISOString(), accountStatus: "Aguardando criação de senha" } : item));
      addAudit("convite_reenviado", "funcionario", user.id, `Convite reenviado para ${user.fullName} (${user.email})`); notify(`Convite reenviado para ${user.email}.`);
    } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível reenviar o convite."); }
  }

  if (authState === "checking") return <LoginLoadingScreen />;
  if (authState === "login") return <TestLoginScreen onAuthenticated={() => { rememberOfflineSession(); setAppReady(false); setAuthState("authenticated"); }} />;

  const heading = getHeading(activeNav);
  const headingTitle = activeNav === "Visão geral" ? `${greetingFor(clockNow)}, ${currentUser.fullName.split(" ")[0]}.` : activeNav === "Área do Setor" ? activeDepartment : heading.title;

  const canViewMenuItem = (item: NavItem) => {
    if (item === "Funcionários" || item === "Configurações") return canManageEmployees;
    return permissionFor(item, canManageEmployees, currentUser.id, departmentPermissionSettings).view;
  };
  const cleanNavSections: Array<{ label: string; items: NavItem[] }> = [
    { label: "Geral", items: ["Visão geral"] },
    { label: "Demandas e atendimento", items: ["Chamados", "Atendimento ao Cidadão", "Pendências"] },
    { label: "Rotina operacional", items: ["Central Integrada", "Próximos Eventos", "Comunicação", "Fluxos e Anotações"] },
    { label: "Gestão administrativa", items: ["Área do Setor", "Processos Digitais", "Gestão Municipal", "Indicadores", "Anexos e Arquivos", "Funcionários"] },
    { label: "Sistema e suporte", items: ["Notificações", "Segurança e LGPD", "Auditoria", "Central de Ajuda", "Configurações"] },
  ];
  const cleanNavLabel: Partial<Record<NavItem, string>> = {
    "Visão geral": "Início",
    "Área do Setor": "Meu setor",
    "Fluxos e Anotações": "Fluxos e anotações",
    "Atendimento ao Cidadão": "Atendimento ao cidadão",
    "Próximos Eventos": "Agenda",
    "Central Integrada": "Tarefas e central integrada",
    "Processos Digitais": "Processos",
    "Gestão Municipal": "Gestão municipal",
    "Anexos e Arquivos": "Arquivos",
    "Segurança e LGPD": "Segurança e LGPD",
    "Central de Ajuda": "Ajuda",
  };

  return (
    <div className={`app-shell ${motionEnabled ? "motion-enabled" : "motion-reduced"}`}>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><Landmark size={21} strokeWidth={2.2} /></div>
          <div><strong>Prefeitura Conecta</strong><small>Gestão Integrada + IA</small></div>
        </div>
        <nav className="main-nav clean-main-nav organized-main-nav" aria-label="Navegação principal">
          <span className="nav-label">NAVEGAÇÃO</span>
          {cleanNavSections.map((section) => {
            const visibleItems = section.items.filter(canViewMenuItem);
            if (!visibleItems.length) return null;
            return (
              <div className="clean-nav-section" key={section.label}>
                <span className="clean-nav-section-label">{section.label}</span>
                <div className="clean-nav-section-items">
                  {visibleItems.map((item) => {
                    const ItemIcon = navIcons[item];
                    const badge = item === "Chamados"
                      ? pendingCount
                      : item === "Atendimento ao Cidadão" && mayorAccess
                        ? citizenFeedbackUnread
                        : item === "Notificações"
                          ? unreadCount
                          : item === "Comunicação"
                            ? messageBadgeCount
                            : item === "Configurações"
                              ? unreadCount
                              : 0;
                    return (
                      <button
                        type="button"
                        key={item}
                        className={activeNav === item ? "clean-nav-child organized-nav-item active" : "clean-nav-child organized-nav-item"}
                        onClick={() => { setActiveNav(item); setSidebarOpen(false); }}
                      >
                        <ItemIcon size={17} strokeWidth={2} />
                        <span>{cleanNavLabel[item] ?? item}</span>
                        {badge > 0 && <span className={`nav-badge ${item === "Pendências" || item === "Chamados" ? "pending-badge" : ""}`}>{badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className={`sidebar-profile ${executiveAccess ? "sidebar-profile-executive" : ""}`}>
          <div className="profile-avatar-wrap"><div className="avatar avatar-large">{currentUser.initials}</div>{executiveAccess&&<span className="executive-avatar-badge"><Crown size={10}/></span>}</div>
          <div className="profile-copy"><strong>{currentUser.fullName}</strong><span>{executiveAccess ? `${currentUser.role} · acesso executivo` : currentUser.department}</span></div>
          <button className="icon-button" aria-label="Opções do perfil" onClick={() => setInteractionModal({ title: "Opções do perfil", message: `${currentUser.fullName} · ${currentUser.role} · ${currentUser.department}. Use o seletor “Visualizar como” para alternar perfis ou abra Configurações para revisar permissões e preferências.` })}><MoreHorizontal size={18} /></button>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}

      <main className="main-area">
        <header className={`topbar ${executiveAccess ? "executive-topbar" : ""}`}>
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="global-search-wrap">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input type="search" placeholder="Buscar somente no setor atual..." value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} />
              <kbd>⌘ K</kbd>
            </label>
            {searchOpen && search.trim() && <GlobalSearchPanel query={search} tickets={privateTickets} users={scopedActiveUsers} documents={privateDocuments} events={currentEvents} offices={scopedOffices} onOpen={(nav) => setActiveNav(nav as NavItem)} onClose={() => setSearchOpen(false)} />}
          </div>
          {executiveAccess && <label className="executive-sector-switch"><span className="executive-switch-icon"><Crown size={17} /></span><span><small>PAINEL SETORIAL</small><select aria-label="Selecionar setor para a visão executiva" value={activeDepartment} onChange={(event) => setViewedDepartment(event.target.value)}>{allDepartments.map((department) => <option key={department}>{department}</option>)}</select></span></label>}
          <div className="top-actions">
            <span className={`persistence-status ${persistenceStatus}`} title="Persistência central do sistema"><i />{persistenceStatus === "carregando" ? "Conectando" : persistenceStatus === "salvando" ? "Salvando" : persistenceStatus === "offline" ? "Aguardando conexão" : "Salvo"}</span>
            <button className="top-ai-button" type="button" onClick={() => openMunicipalAi()}><Sparkles size={15}/> IA Conecta</button>
            <button className="icon-button notification-button" aria-label={`Notificações${unreadCount + (mayorAccess ? citizenFeedbackUnread : 0) ? `: ${unreadCount + (mayorAccess ? citizenFeedbackUnread : 0)} novas` : ""}`} onClick={() => setActiveNav(mayorAccess && citizenFeedbackUnread > 0 ? "Atendimento ao Cidadão" : "Notificações")}><Bell size={18} />{unreadCount + (mayorAccess ? citizenFeedbackUnread : 0) > 0 && <span />}</button>
            <button className="icon-button logout-button" aria-label="Sair do sistema" title="Sair" onClick={() => void logout()}><LogOut size={18} /></button>
            <label className="account-switch"><div className="avatar">{currentUser.initials}</div><span><small>{executiveAccess ? "VISUALIZAR COMO" : "PERFIL DO SETOR"}</small><select aria-label="Visualizar como usuário" value={currentUserId} onChange={(event) => switchUser(event.target.value)}>{switchableUsers.map((user) => <option key={user.id} value={user.id}>{user.fullName} — {user.department}</option>)}</select></span></label>
          </div>
        </header>

        <PermissionProvider permission={currentPermission}>
        <div className={`content-wrap ${activeNav === "Comunicação" ? "chat-content" : ""} ${currentPermission.register ? "can-register" : "read-only-register"} ${currentPermission.edit ? "can-edit" : "read-only-edit"}`}>
          <section className="page-heading">
            <div><p className="eyebrow">{activeNav === "Visão geral" ? `${formatHeadingDate(clockNow)} · ${formatHeadingClock(clockNow)}` : heading.eyebrow}</p><h1>{headingTitle}</h1><p>{heading.subtitle}</p></div>
            <div className="heading-actions">
              {activeNav === "Comunicação" ? (
                currentPermission.register && <button className="button secondary" onClick={() => setGroupModal(true)}><Plus size={15} /> Novo grupo</button>
              ) : activeNav === "Anexos e Arquivos" ? (
                currentPermission.register && <button type="button" className="button secondary" onClick={() => fileInput.current?.click()}><Upload size={15} /> Anexar arquivo</button>
              ) : activeNav === "Próximos Eventos" ? (
                currentPermission.register && <button type="button" className="button secondary" onClick={() => setEventModal("new")}><CalendarPlus size={15} /> Novo evento</button>
              ) : activeNav === "Funcionários" ? (
                <button type="button" className="button secondary" onClick={() => setEmployeeModal(true)}><UserPlus size={15} /> Convidar funcionário</button>
              ) : activeNav === "Notificações" ? (
                <button className="button secondary" onClick={markAllNotifications}><CheckCheck size={15} /> Marcar todas como lidas</button>
              ) : activeNav === "Pendências" ? (
                <button className="button secondary" onClick={() => setActiveNav("Chamados")}><ClipboardList size={15} /> Ver chamados</button>
              ) : activeNav === "Indicadores" || activeNav === "Auditoria" || activeNav === "Gestão Municipal" || activeNav === "Processos Digitais" ? (
                <button className="button secondary" onClick={exportCurrentReport}><Download size={15} /> Exportar relatório</button>
              ) : (
                null
              )}
              {ticketPermission.register && (activeNav === "Visão geral" || activeNav === "Chamados") && <button type="button" className="button primary" onClick={() => setTicketModal(true)} aria-haspopup="dialog"><Plus size={16} /> Novo chamado</button>}
            </div>
          </section>

          {/* v4.2 CLEAN: contexto executivo e permissões continuam disponíveis no topo/configurações, sem banners repetitivos em todas as telas. */}

          {activeNav !== "Visão geral" && <ContextualAiBar activeModule={activeNav} department={activeDepartment} tickets={privateTickets} events={currentEvents} />}

          {activeNav === "Visão geral" && <Dashboard tickets={filteredTickets} allTickets={privateTickets} audit={privateAudit} executive={executiveAccess} department={activeDepartment} userName={currentUser.fullName} onNavigate={setActiveNav} />}
          {activeNav === "Área do Setor" && <><SectorWorkspaceSection key={activeDepartment} department={activeDepartment} userName={currentUser.fullName} userRole={currentUser.role} departments={availableDepartments} notify={notify} /><FormBuilderPanel department={activeDepartment} notify={notify} /></>}
          {activeNav === "Fluxos e Anotações" && <SectorNotesSection key={activeDepartment} department={activeDepartment} userName={currentUser.fullName} team={sectorUsers.map((user) => ({ id: user.id, name: user.fullName, role: user.role }))} notify={notify} />}
          {activeNav === "Chamados" && <TicketsSection tickets={filteredTickets} department={activeDepartment} departments={availableDepartments} onStatus={updateStatus} onNew={() => setTicketModal(true)} />}
          {activeNav === "Comunicação" && (communicationLocked
            ? <CommunicationPrivacyGate department={activeDepartment} isMayor={mayorAccess} onOpenSettings={() => setActiveNav("Configurações")} />
            : executiveCommunicationMonitor
              ? <ExecutiveCommunicationViewer department={activeDepartment} users={scopedActiveUsers} groups={accessibleGroups} messages={communicationMessages} />
              : <CommunicationSection currentUser={currentUser} users={scopedActiveUsers} groups={accessibleGroups} messages={communicationMessages} tickets={privateTickets} onSend={sendMessage} onSendAttachment={sendChatAttachment} onNewGroup={() => setGroupModal(true)} onTicketStatus={updateStatus} />)}
          {activeNav === "Atendimento ao Cidadão" && <CitizenServiceSection department={activeDepartment} notify={notify} isMayor={executiveAccess} departments={availableDepartments} />}
          {activeNav === "Central Integrada" && <IntegratedManagementSection key={activeDepartment} initialTab="Tarefas" department={activeDepartment} currentUser={{ id: currentUser.id, fullName: currentUser.fullName, department: currentUser.department, role: currentUser.role, initials: currentUser.initials }} tickets={privateTickets} users={scopedActiveUsers.map((user) => ({ id: user.id, fullName: user.fullName, department: user.department, role: user.role, initials: user.initials }))} offices={scopedOffices} events={currentEvents} departments={availableDepartments} notify={notify} />}
          {activeNav === "Processos Digitais" && <ProcessesSection key={`${activeDepartment}-${currentUser.id}`} department={activeDepartment} currentUser={{ id: currentUser.id, fullName: currentUser.fullName, department: currentUser.department, role: currentUser.role }} users={scopedActiveUsers.map((user) => ({ id: user.id, fullName: user.fullName, department: user.department, role: user.role }))} departments={availableDepartments} notify={notify} />}
          {activeNav === "Gestão Municipal" && <MunicipalManagementSection department={activeDepartment} notify={notify} />}
          {activeNav === "Indicadores" && <IndicatorsSection department={activeDepartment} notify={notify} />}
          {activeNav === "Notificações" && <><NotificationsSection notifications={currentNotifications} onRead={markNotification} onOpenPending={() => setActiveNav("Pendências")} /><SmartNotificationRules department={activeDepartment} notify={notify} /></>}
          {activeNav === "Pendências" && <><PendingSection invitations={currentInvitations} tickets={pendingTickets} onRespond={respondInvitation} onOpenTickets={() => setActiveNav("Chamados")} /><ApprovalCenterPanel department={activeDepartment} notify={notify} /></>}
          {activeNav === "Anexos e Arquivos" && <><DocumentsSection documents={privateDocuments} department={activeDepartment} currentUserId={currentUser.id} onUpload={() => fileInput.current?.click()} /><DocumentGovernancePanel department={activeDepartment} notify={notify} /></>}
          {activeNav === "Próximos Eventos" && <EventsSection events={currentEvents} department={activeDepartment} onNew={() => setEventModal("new")} onEdit={setEventModal} onDelete={setEventToDelete} />}
          {activeNav === "Funcionários" && canManageEmployees && <EmployeesSection users={sectorUsers} department={activeDepartment} onInvite={() => setEmployeeModal(true)} onResend={resendEmployeeInvite} />}
          {activeNav === "Segurança e LGPD" && <SecuritySection department={activeDepartment} notify={notify} />}
          {activeNav === "Auditoria" && <AuditSection audit={privateAudit} department={activeDepartment} notify={notify} />}
          {activeNav === "Central de Ajuda" && <HelpCenterSection notify={notify} />}
          {activeNav === "Configurações" && canManageEmployees && <SettingsSection key={activeDepartment} department={activeDepartment} managerName={currentUser.fullName} employees={sectorEmployees} settings={departmentPermissionSettings} soundEnabled={soundEnabled} motionEnabled={motionEnabled} isMayor={executiveAccess} crossSectorCommunicationEnabled={executiveCommunicationAccess} secretariatsContent={<TeamSection offices={scopedOffices} />} onExportContacts={exportContacts} onSettingsChange={updatePermissionSettings} onSoundChange={setSoundEnabled} onMotionChange={setMotionEnabled} onCrossSectorCommunicationChange={(enabled) => { setExecutiveCommunicationAccess(enabled); notify(enabled ? "Acesso executivo à comunicação de outros setores habilitado." : "Comunicações de outros setores voltaram ao modo privado."); }} onTestSound={() => { playNotificationChime(); notify("Som de notificação reproduzido."); }} notify={notify} />}
        </div>
        </PermissionProvider>
      </main>

      <input ref={fileInput} className="hidden-input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); event.target.value = ""; }} />
      {ticketModal && <TicketModal users={scopedActiveUsers} departments={availableDepartments} onClose={() => setTicketModal(false)} onCreate={createTicket} />}
      {groupModal && <GroupModal currentUserId={currentUserId} users={scopedActiveUsers} onClose={() => setGroupModal(false)} onCreate={createGroup} />}
      {eventModal && <EventModal department={activeDepartment} departments={availableDepartments} event={eventModal === "new" ? undefined : eventModal} onClose={() => setEventModal(null)} onSave={(form) => saveEvent(form, eventModal === "new" ? undefined : eventModal)} />}
      {eventToDelete && <EventDeleteModal event={eventToDelete} onClose={() => setEventToDelete(null)} onConfirm={() => deleteEvent(eventToDelete)} />}
      {employeeModal && canManageEmployees && <EmployeeInviteModal department={activeDepartment} onClose={() => setEmployeeModal(false)} onInvite={inviteEmployee} />}
      {interactionModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInteractionModal(null); }}><section className="modal interaction-action-modal" role="dialog" aria-modal="true" aria-labelledby="interaction-action-title"><header><div><p className="eyebrow">FUNÇÃO DO SISTEMA</p><h2 id="interaction-action-title">{interactionModal.title}</h2></div><button type="button" aria-label="Fechar" onClick={() => setInteractionModal(null)}><X size={18} /></button></header><div className="interaction-action-body"><span className="interaction-action-icon"><ArrowUpRight size={22} /></span><div><strong>Recurso aberto</strong><p>{interactionModal.message}</p><small>Use esta janela para revisar a função e seguir para as orientações do módulo.</small></div></div><footer><button className="button secondary" onClick={() => setInteractionModal(null)}>Fechar</button><button className="button primary" onClick={() => { setInteractionModal(null); setActiveNav("Central de Ajuda"); }}>Ver orientações</button></footer></section></div>}
      <MunicipalAiCopilot activeModule={activeNav} department={activeDepartment} user={{ id: currentUser.id, fullName: currentUser.fullName, role: currentUser.role }} tickets={privateTickets} events={currentEvents} departments={availableDepartments} unreadNotifications={unreadCount + (mayorAccess ? citizenFeedbackUnread : 0)} onExecuteAction={executeMunicipalAgentAction} />
      <OnboardingTour userName={currentUser.fullName} role={currentUser.role} department={activeDepartment} onNavigate={(nav) => setActiveNav(nav as NavItem)} />
      <QuickActionDock onNavigate={(nav) => setActiveNav(nav as NavItem)} onNewTicket={() => { setTicketModal(true); setActiveNav("Chamados"); }} onNewEvent={() => { setEventModal("new"); setActiveNav("Próximos Eventos"); }} />
      {toast && <div className="toast" role="status"><span><Check size={14} strokeWidth={2.5} /></span>{toast}</div>}
    </div>
  );
}

function getHeading(active: NavItem) {
  const headings: Record<NavItem, { eyebrow: string; title: string; subtitle: string }> = {
    "Visão geral": { eyebrow: "", title: "Bom dia.", subtitle: "Acompanhe as demandas e mantenha as secretarias alinhadas." },
    "Área do Setor": { eyebrow: "AMBIENTE ESPECIALIZADO", title: "Área do Setor", subtitle: "Formulários, endereços, indicadores, equipes e fluxos adaptados às responsabilidades da unidade selecionada." },
    "Fluxos e Anotações": { eyebrow: "MEMÓRIA OPERACIONAL", title: "Fluxos e Anotações", subtitle: "Organize decisões, providências e registros internos em etapas próprias para cada setor." },
    Chamados: { eyebrow: "GESTÃO DE DEMANDAS", title: "Chamados", subtitle: "Organize cada solicitação do recebimento à entrega final." },
    Comunicação: { eyebrow: "CENTRAL DE COMUNICAÇÃO", title: "Conversas", subtitle: "Mensagens diretas e grupos por convite entre as secretarias." },
    "Atendimento ao Cidadão": { eyebrow: "PROTOCOLO, OUVIDORIA E SERVIÇOS", title: "Atendimento ao Cidadão", subtitle: "Registre, encaminhe e acompanhe solicitações, manifestações e pedidos de informação." },
    "Central Integrada": { eyebrow: "CENTRAL OPERACIONAL", title: "Central Integrada", subtitle: "Tarefas, projetos, metas, mapa, organograma, inteligência artificial e saúde do sistema em um só lugar." },
    "Processos Digitais": { eyebrow: "ADMINISTRAÇÃO SEM PAPEL", title: "Processos Digitais", subtitle: "Organize processos, despachos, documentos, versões e assinaturas em um fluxo rastreável." },
    "Gestão Municipal": { eyebrow: "RECURSOS E OPERAÇÕES", title: "Gestão Municipal", subtitle: "Acompanhe frota, patrimônio, materiais, contratos, convênios, obras e serviços de campo." },
    Indicadores: { eyebrow: "INTELIGÊNCIA DE GESTÃO", title: "Indicadores e Relatórios", subtitle: "Analise prazos, produtividade, satisfação e riscos com visão restrita ao seu setor." },
    Notificações: { eyebrow: "CENTRAL DE AVISOS", title: "Notificações", subtitle: "Acompanhe convites, mensagens e atualizações importantes do sistema." },
    Pendências: { eyebrow: "AÇÕES NECESSÁRIAS", title: "Pendências", subtitle: "Resolva convites de grupos e chamados que aguardam sua análise." },
    "Anexos e Arquivos": { eyebrow: "ARQUIVOS COMPARTILHADOS", title: "Anexos e Arquivos", subtitle: "Compartilhe documentos com segurança entre todos os integrantes do seu setor." },
    "Próximos Eventos": { eyebrow: "AGENDA DO SETOR", title: "Próximos Eventos", subtitle: "Acompanhe reuniões, prazos e compromissos destinados ao seu setor." },
    Funcionários: { eyebrow: "ACESSOS DO SETOR", title: "Funcionários", subtitle: "Cadastre nome e e-mail, envie convites e acompanhe a criação de acesso dos funcionários." },
    Secretarias: { eyebrow: "DIRETÓRIO MUNICIPAL", title: "Secretarias e unidades", subtitle: "Responsáveis, telefones, e-mails, horários e endereços oficiais." },
    "Segurança e LGPD": { eyebrow: "GOVERNANÇA DIGITAL", title: "Segurança e LGPD", subtitle: "Gerencie permissões, dados pessoais, retenção, auditoria e resposta a incidentes." },
    Auditoria: { eyebrow: "RASTREABILIDADE DO SETOR", title: "Histórico de atividades", subtitle: "Registro cronológico de chamados, mensagens, anexos e eventos relevantes do seu setor." },
    "Central de Ajuda": { eyebrow: "CONHECIMENTO E SUPORTE", title: "Central de Ajuda", subtitle: "Consulte guias, procedimentos e orientações sobre os módulos da plataforma." },
    Configurações: { eyebrow: "CONTROLE DO SECRETÁRIO", title: "Configurações", subtitle: "Defina permissões dos funcionários e ajuste a experiência da operação." },
  };
  return headings[active];
}

const COMMUNICATION_EDITORIAL_DATES = [
  { date: "2026-08-19", day: "19", month: "AGO", title: "Dia Mundial da Fotografia", suggestion: "Valorizar registros da cidade, equipes e bastidores dos serviços municipais." },
  { date: "2026-08-22", day: "22", month: "AGO", title: "Dia do Folclore", suggestion: "Conteúdo sobre tradições, memória local, cultura popular e patrimônio imaterial." },
  { date: "2026-08-25", day: "25", month: "AGO", title: "Dia do Soldado", suggestion: "Mensagem institucional e reconhecimento, quando pertinente à agenda municipal." },
  { date: "2026-08-27", day: "27", month: "AGO", title: "Dia do Psicólogo", suggestion: "Pauta de valorização profissional e orientação sobre serviços públicos relacionados." },
  { date: "2026-08-29", day: "29", month: "AGO", title: "Dia Nacional de Combate ao Fumo", suggestion: "Conteúdo educativo em parceria com a Secretaria de Saúde." },
  { date: "2026-08-31", day: "31", month: "AGO", title: "Dia do Nutricionista", suggestion: "Reconhecimento aos profissionais e ações de alimentação e saúde do município." },
  { date: "2026-09-05", day: "05", month: "SET", title: "Dia da Amazônia", suggestion: "Pauta ambiental educativa e ações locais de preservação e sustentabilidade." },
  { date: "2026-09-07", day: "07", month: "SET", title: "Independência do Brasil", suggestion: "Programação cívica, serviços, alterações de funcionamento e cobertura institucional." },
  { date: "2026-09-21", day: "21", month: "SET", title: "Dia da Árvore", suggestion: "Ações ambientais, arborização urbana e educação ambiental." },
  { date: "2026-09-25", day: "25", month: "SET", title: "Dia Nacional do Trânsito", suggestion: "Orientações de segurança, mobilidade e ações educativas no município." },
];

function CommunicationEditorialCalendar({ onNavigate }: { onNavigate: (item: NavItem) => void }) {
  const [planned, setPlanned, calendarSaveStatus] = usePersistentState<string[]>("communication:editorial-calendar:v1", ["2026-08-22", "2026-09-07"]);
  const [filter, setFilter] = useState<"Todos" | "Planejados" | "A planejar">("Todos");
  const visible = COMMUNICATION_EDITORIAL_DATES.filter((item) => filter === "Todos" || (filter === "Planejados" ? planned.includes(item.date) : !planned.includes(item.date)));

  function togglePlan(date: string) {
    setPlanned((current) => current.includes(date) ? current.filter((item) => item !== date) : [...current, date]);
  }

  return <section className="panel editorial-calendar-panel">
    <header>
      <div><p className="eyebrow">CALENDÁRIO EDITORIAL</p><h2>Próximas oportunidades de postagem</h2><p>Datas comemorativas e pautas institucionais para antecipar produção, aprovação e publicação.</p></div>
      <div className="editorial-calendar-actions"><button className="button secondary" onClick={() => onNavigate("Próximos Eventos")}><CalendarDays size={14} /> Ver agenda municipal</button><button className="button primary" onClick={() => onNavigate("Comunicação")}><MessagesSquare size={14} /> Abrir Comunicação</button></div>
    </header>
    <small className={`sync-inline ${calendarSaveStatus}`}>{calendarSaveStatus === "salvando" ? "Salvando planejamento…" : calendarSaveStatus === "offline" ? "Aguardando conexão" : "Planejamento sincronizado"}</small>
    <div className="editorial-calendar-toolbar"><div><strong>{planned.length}</strong><span>pautas planejadas</span></div><div><strong>{COMMUNICATION_EDITORIAL_DATES.length - planned.length}</strong><span>a planejar</span></div><nav aria-label="Filtrar calendário editorial">{(["Todos","Planejados","A planejar"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</nav></div>
    <div className="editorial-calendar-grid">{visible.map((item) => {
      const isPlanned = planned.includes(item.date);
      return <article key={item.date} className={isPlanned ? "planned" : ""}>
        <div className="editorial-date"><strong>{item.day}</strong><span>{item.month}</span></div>
        <div className="editorial-content"><span className={isPlanned ? "editorial-status planned" : "editorial-status suggestion"}>{isPlanned ? "Planejado" : "Sugestão de pauta"}</span><h3>{item.title}</h3><p>{item.suggestion}</p><button onClick={() => togglePlan(item.date)}>{isPlanned ? <><Check size={13} /> Remover do planejamento</> : <><CalendarPlus size={13} /> Planejar postagem</>}</button></div>
      </article>;
    })}</div>
  </section>;
}

function Dashboard({ tickets, allTickets, audit, executive, department, userName, onNavigate }: { tickets: Ticket[]; allTickets: Ticket[]; audit: AuditItem[]; executive: boolean; department: string; userName: string; onNavigate: (item: NavItem) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const stats = statuses.map((status, index) => ({
    label: statusMeta[status].short,
    value: String(tickets.filter((ticket) => ticket.status === status).length).padStart(2, "0"),
    change: ["Novos registros", "Triagem inicial", "Decisão pendente", "Serviço em andamento", "Retorno externo", "Entregas confirmadas", "Encerrados sem execução"][index],
    status,
  }));
  const dueSoon = tickets.filter((ticket) => ticket.status !== "Concluído" && ticket.status !== "Cancelado" && ticket.dueDate).slice(0, 2).length;

  return (
    <>
      <OperationalCommandCenter tickets={tickets} allTickets={allTickets} executive={executive} department={department} userName={userName} onNavigate={onNavigate} />
      <DashboardAiBrief department={department} tickets={tickets} />
      {department === "Secretaria de Comunicação e Eventos" && <CommunicationEditorialCalendar onNavigate={onNavigate} />}

      <section className="dashboard-grid clean-dashboard-grid">
        <article className="panel tickets-panel">
          <div className="panel-heading">
            <div><h2>Demandas recentes</h2><p>O que entrou por último e pode exigir acompanhamento</p></div>
            <button className="text-button" onClick={() => onNavigate("Chamados")}>Ver demandas <ArrowRight size={14} /></button>
          </div>
          <TicketTable tickets={tickets.slice(0, 6)} onOpen={() => onNavigate("Chamados")} />
        </article>
        <aside className="side-stack clean-side-stack">
          <article className="panel deadline-panel">
            <div className="deadline-icon"><AlertTriangle size={16} /></div>
            <div><strong>{dueSoon || 2} demandas pedem atenção</strong><p>Veja somente o que está próximo do prazo ou precisa de decisão.</p></div>
            <button onClick={() => onNavigate("Chamados")}>Revisar agora <ArrowRight size={12} /></button>
          </article>
          <button className="dashboard-details-toggle" type="button" onClick={() => setShowDetails((current) => !current)}>
            <span><LayoutDashboard size={17} /><span><strong>{showDetails ? "Ocultar detalhes" : "Ver mais indicadores"}</strong><small>Abra apenas quando precisar aprofundar</small></span></span>
            <ChevronRight className={showDetails ? "expanded" : ""} size={17} />
          </button>
        </aside>
      </section>

      {showDetails && <section className="dashboard-progressive-details" aria-label="Detalhes operacionais">
        <section className="stats-grid" aria-label="Resumo detalhado dos chamados">
          {stats.map((stat) => {
            const StatIcon = statusMeta[stat.status].icon;
            return (
              <article className={`stat-card ${statusMeta[stat.status].color}`} key={stat.label}>
                <div className="stat-icon"><StatIcon size={20} strokeWidth={2.2} /></div>
                <div className="stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.change}</small></div>
              </article>
            );
          })}
        </section>
        <article className="panel activity-panel compact-activity-panel">
          <div className="panel-heading compact">
            <div><h2>Atividade recente</h2><p>Histórico detalhado, disponível sob demanda</p></div>
            <button className="text-button" onClick={() => onNavigate("Auditoria")}>Abrir auditoria <ArrowRight size={14} /></button>
          </div>
          <div className="activity-list">
            {audit.slice(0, 4).map((item, index) => <Activity key={item.id} avatar={item.actorInitials} color={["green", "blue", "violet", "amber"][index % 4]} title={item.actorName} detail={item.detail} time={formatRelative(item.createdAt)} />)}
            {!audit.length && <div className="activity-empty"><History size={22} /><strong>Sem atividade recente</strong><p>As próximas ações relevantes aparecerão aqui.</p></div>}
          </div>
        </article>
      </section>}
    </>
  );
}

function TicketTable({ tickets, onOpen }: { tickets: Ticket[]; onOpen: () => void }) {
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
            <td><button className="table-menu" aria-label={`Opções de ${ticket.protocol}`} onClick={onOpen}><MoreHorizontal size={17} /></button></td>
          </tr>
        ))}</tbody>
      </table>
      {tickets.length === 0 && <div className="empty-state">Nenhum chamado encontrado para esta busca.</div>}
    </div>
  );
}

function TicketsSection({ tickets, department, departments, onStatus, onNew }: { tickets: Ticket[]; department: string; departments: string[]; onStatus: (id: string, status: TicketStatus) => void; onNew: () => void }) {
  const access = useCurrentPermission();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  return (
    <section className="board-wrap">
      <div className="access-note ticket-privacy-note"><span><ShieldCheck size={20} /></span><div><strong>Fluxo setorial com responsabilidade definida</strong><p>Você está vendo somente as demandas de {department}. Prazos, aprovações, encaminhamentos, responsáveis e anotações internas permanecem registrados no chamado.</p></div></div>
      <div className="ticket-capability-bar" aria-label="Recursos dos chamados"><span><Clock3 size={15} /><strong>SLA e alertas</strong><small>Prazos calculados</small></span><span><UsersRound size={15} /><strong>Equipe responsável</strong><small>Titular e colaboradores</small></span><span><CheckCircle2 size={15} /><strong>Aprovações</strong><small>Decisão registrada</small></span><span><ArrowRight size={15} /><strong>Encaminhamento</strong><small>Origem preservada</small></span></div>
      <div className="board-toolbar">
        <div className="filter-chip active">Todos <strong>{tickets.length}</strong></div>
        <div className="filter-chip">Alta prioridade <strong>{tickets.filter((t) => t.priority === "Alta").length}</strong></div>
        <div className="board-spacer" />
        <button className="button secondary" onClick={() => setViewMode((current) => current === "board" ? "list" : "board")}><List size={15} /> {viewMode === "board" ? "Lista" : "Quadro"}</button>
        {access.register && <button className="button primary" onClick={onNew}><Plus size={16} /> Criar chamado</button>}
      </div>
      {viewMode === "list" ? <div className="panel ticket-list-mode">{tickets.map((ticket) => <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}><span className={`priority-dot ${ticket.priority.toLowerCase().replace("é", "e")}`} /><span><strong>{ticket.title}</strong><small>{ticket.protocol} · {ticket.department}</small></span><StatusPill status={ticket.status} /><span className="due"><Clock3 size={12} /> {formatDue(ticket.dueDate)}</span><ChevronRight size={14} /></button>)}{!tickets.length && <div className="empty-state">Nenhum chamado encontrado.</div>}</div> : <div className="kanban-board">
        {statuses.map((status) => {
          const StatusIcon = statusMeta[status].icon;
          const columnTickets = tickets.filter((ticket) => ticket.status === status);
          return (
            <section className={`kanban-column ${statusMeta[status].color}`} key={status}>
              <header><span><StatusIcon size={14} />{statusMeta[status].short}</span><strong>{columnTickets.length}</strong></header>
              <div className="kanban-cards">
                {columnTickets.map((ticket) => (
                  <article className="kanban-card" key={ticket.id}>
                    <div className="card-meta"><span className={`priority-label ${ticket.priority.toLowerCase().replace("é", "e")}`}>{ticket.priority}</span><button aria-label={`Opções de ${ticket.protocol}`} onClick={() => setSelectedTicket(ticket)}><MoreHorizontal size={17} /></button></div>
                    <h3>{ticket.title}</h3><p>{ticket.description}</p><small>{ticket.protocol} · {ticket.requester}{ticket.neighborhood ? ` · ${ticket.neighborhood}` : ""}</small>
                    <div className="ticket-template-line"><span>{ticket.priority === "Urgente" ? "Atendimento imediato" : "Prazo setorial"}</span><span>{ticket.assigneeName ? "Responsável definido" : "Aguardando atribuição"}</span></div>
                    <div className="kanban-footer"><span className="mini-avatar">{ticket.assigneeInitials ?? "--"}</span><span className={formatDue(ticket.dueDate).startsWith("Hoje") ? "due urgent" : "due"}><Clock3 size={12} /> {formatDue(ticket.dueDate)}</span></div>
                    {access.edit ? <label className="move-label">Mover para<select aria-label={`Mover ${ticket.protocol}`} value={ticket.status} onChange={(event) => onStatus(ticket.id, event.target.value as TicketStatus)}>{statuses.map((option) => <option key={option}>{option}</option>)}</select></label> : <span className="read-only-chip"><ShieldCheck size={11} /> Somente consulta</span>}
                    <button className="ticket-detail-button" onClick={() => setSelectedTicket(ticket)}>Abrir detalhes e checklist <ArrowRight size={12} /></button>
                  </article>
                ))}
                {columnTickets.length === 0 && <div className="column-empty">Nenhum chamado nesta etapa</div>}
              </div>
            </section>
          );
        })}
      </div>}
      {selectedTicket && <TicketDetailModal ticket={selectedTicket} departments={departments} onClose={() => setSelectedTicket(null)} onStatus={(status) => { onStatus(selectedTicket.id, status); setSelectedTicket((current) => current ? { ...current, status } : current); }} />}
    </section>
  );
}

function CommunicationPrivacyGate({ department, isMayor, onOpenSettings }: { department: string; isMayor: boolean; onOpenSettings: () => void }) {
  return <section className="communication-privacy-gate panel">
    <span className="communication-privacy-icon"><LockKeyhole size={28} /></span>
    <p className="eyebrow">COMUNICAÇÃO PRIVADA</p>
    <h2>As conversas de {department} estão protegidas</h2>
    <p>A comunicação entre servidores e grupos do setor não é aberta automaticamente na visão executiva. O padrão do sistema é privado.</p>
    <div className="communication-privacy-rules"><span><ShieldCheck size={15} /> Conteúdo de outros setores não carregado</span><span><UsersRound size={15} /> Grupos continuam restritos aos participantes</span><span><LockKeyhole size={15} /> Acesso executivo exige ativação explícita</span></div>
    {isMayor ? <button className="button primary" onClick={onOpenSettings}><Settings size={15} /> Configurar acesso executivo</button> : <small>Somente o Prefeito pode alterar esta configuração.</small>}
  </section>;
}

function ExecutiveCommunicationViewer({ department, users, groups, messages }: { department: string; users: User[]; groups: Group[]; messages: Message[] }) {
  const threads = useMemo(() => {
    const grouped = new Map<string, Message[]>();
    messages.forEach((message) => grouped.set(message.conversationId, [...(grouped.get(message.conversationId) ?? []), message]));
    return Array.from(grouped.entries()).map(([id, threadMessages]) => {
      const sorted = [...threadMessages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const first = sorted[0];
      if (first?.conversationType === "group") {
        const group = groups.find((item) => item.id === id);
        return { id, type: "group" as const, title: group?.name ?? "Grupo setorial", subtitle: group?.description ?? `${sorted.length} mensagens`, messages: sorted };
      }
      const participants = directParticipants(id).map((userId) => users.find((user) => user.id === userId)).filter((user): user is User => Boolean(user));
      return { id, type: "direct" as const, title: participants.map((user) => user.fullName).join(" ↔ ") || "Conversa direta", subtitle: participants.map((user) => user.department).filter((value, index, list) => list.indexOf(value) === index).join(" · "), messages: sorted };
    }).sort((a, b) => (b.messages[b.messages.length - 1]?.createdAt ?? "").localeCompare(a.messages[a.messages.length - 1]?.createdAt ?? ""));
  }, [groups, messages, users]);
  const [selectedId, setSelectedId] = useState(() => threads[0]?.id ?? "");
  const selectedThread = threads.find((thread) => thread.id === selectedId) ?? threads[0];

  useEffect(() => {
    if (!threads.length) { setSelectedId(""); return; }
    if (!threads.some((thread) => thread.id === selectedId)) setSelectedId(threads[0].id);
  }, [selectedId, threads]);

  return <section className="chat-shell panel executive-chat-viewer">
    <aside className="conversation-list">
      <div className="executive-chat-label"><Crown size={15} /><span><strong>Acesso executivo</strong><small>{department}</small></span></div>
      <div className="conversation-items executive-thread-list">{threads.map((thread) => {
        const last = thread.messages[thread.messages.length - 1];
        return <button key={thread.id} className={selectedThread?.id === thread.id ? "conversation active" : "conversation"} onClick={() => setSelectedId(thread.id)}>
          <span className={thread.type === "group" ? "group-avatar" : "avatar"}>{thread.type === "group" ? <Hash size={16} /> : <MessagesSquare size={15} />}</span>
          <span><strong>{thread.title}</strong><small>{last?.body || last?.attachmentName || thread.subtitle}</small></span><time>{last ? formatTime(last.createdAt) : ""}</time>
        </button>;
      })}{!threads.length && <div className="chat-panel-empty"><LockKeyhole size={24} /><strong>Sem conversas disponíveis</strong><p>Não há mensagens associadas ao setor nesta operação.</p></div>}</div>
    </aside>
    <div className="chat-main executive-readonly-chat">
      <header className="chat-header"><div className="group-avatar"><ShieldCheck size={16} /></div><div><strong>{selectedThread?.title ?? "Comunicação do setor"}</strong><span>{selectedThread?.subtitle ?? department}</span></div><span className="chat-mode-badge executive"><Crown size={12} /> Somente consulta</span></header>
      <div className="executive-access-notice"><ShieldCheck size={14} /><span><strong>Visualização executiva autorizada</strong><small>Este modo existe porque o Prefeito habilitou o acesso intersetorial nas Configurações.</small></span></div>
      <div className="message-stream message-stream-v2">
        <div className="date-divider"><span>Mensagens registradas</span></div>
        {selectedThread?.messages.map((message) => <div key={message.id} className="message executive-message"><span className="activity-avatar blue">{message.senderInitials}</span><div className="message-bubble"><div className="message-meta"><strong>{message.senderName}</strong><time>{formatTime(message.createdAt)}</time></div>{message.body && <p>{message.body}</p>}{message.attachmentName && <div className="file-attachment"><span>{fileBadge(message.attachmentName)}</span><div><strong>{message.attachmentName}</strong><small>Documento anexado</small></div></div>}</div></div>)}
      </div>
      <div className="read-only-composer"><LockKeyhole size={16} /><span><strong>Modo executivo de consulta</strong><small>O conteúdo pode ser visualizado, mas mensagens não podem ser enviadas por esta tela.</small></span></div>
    </div>
  </section>;
}

function CommunicationSection({ currentUser, users, groups, messages, tickets, onSend, onSendAttachment, onNewGroup, onTicketStatus }: { currentUser: User; users: User[]; groups: Group[]; messages: Message[]; tickets: Ticket[]; onSend: (message: Message, recipientId?: string) => void; onSendAttachment: (file: File, context: { conversationType: ChatTab; conversationId: string; recipientId?: string; body: string; ticketId?: string | null }) => Promise<boolean>; onNewGroup: () => void; onTicketStatus: (id: string, status: TicketStatus) => void }) {
  const access = useCurrentPermission();
  const [tab, setTab] = useState<ChatTab>("direct");
  const [conversationSearch, setConversationSearch] = useState("");
  const [selected, setSelected] = useState("u-rafael");
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aiComposeBusy, setAiComposeBusy] = useState(false);
  const [detailPanel, setDetailPanel] = useState<"attachments" | "participants" | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [ticketPickerOpen, setTicketPickerOpen] = useState(false);
  const [linkedTicket, setLinkedTicket] = useState<Ticket | null>(null);
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const chatFileInput = useRef<HTMLInputElement>(null);
  const directUsers = users.filter((user) => user.id !== currentUser.id);
  const selectionIsValid = tab === "direct" ? directUsers.some((user) => user.id === selected) : groups.some((group) => group.id === selected);
  const effectiveSelected = selectionIsValid ? selected : tab === "direct" ? directUsers[0]?.id ?? "" : groups[0]?.id ?? "";
  const conversationThreadId = tab === "direct" ? directConversationId(currentUser.id, effectiveSelected) : effectiveSelected;
  const selectedUser = users.find((user) => user.id === effectiveSelected);
  const selectedGroup = groups.find((group) => group.id === effectiveSelected);
  const visibleMessages = messages.filter((message) => message.conversationType === tab && message.conversationId === conversationThreadId);
  const conversationAttachments = visibleMessages.filter((message) => message.attachmentName);
  const acceptedParticipants = tab === "direct"
    ? [currentUser, selectedUser].filter((user): user is User => Boolean(user))
    : users.filter((user) => selectedGroup?.memberUserIds?.includes(user.id));
  const invitedParticipants = tab === "group"
    ? users.filter((user) => selectedGroup?.pendingUserIds?.includes(user.id))
    : [];
  const normalizedConversationSearch = normalizeText(conversationSearch);
  const filteredDirectUsers = directUsers.filter((user) => !normalizedConversationSearch || normalizeText(`${user.fullName} ${user.department}`).includes(normalizedConversationSearch));
  const filteredGroups = groups.filter((group) => !normalizedConversationSearch || normalizeText(`${group.name} ${group.description}`).includes(normalizedConversationSearch));
  function lastConversationMessage(type: ChatTab, id: string) {
    const threadId = type === "direct" ? directConversationId(currentUser.id, id) : id;
    return [...messages].filter((message) => message.conversationType === type && message.conversationId === threadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  function selectConversation(id: string) { setSelected(id); setPendingTicketId(null); setDetailPanel(null); setMoreOpen(false); }
  function changeTab(next: ChatTab) { setTab(next); setSelected(next === "direct" ? directUsers[0]?.id ?? "" : groups[0]?.id ?? ""); setPendingFile(null); setPendingTicketId(null); setDetailPanel(null); setMoreOpen(false); }
  function togglePanel(panel: "attachments" | "participants") { setDetailPanel((current) => current === panel ? null : panel); setMoreOpen(false); }
  async function assistMessage() {
    if (aiComposeBusy) return;
    setAiComposeBusy(true);
    try {
      const seed = draft.trim() || "Prepare uma resposta breve, cordial e objetiva para dar continuidade a esta conversa administrativa.";
      const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "draft", kind: "improve_message", text: seed, context: { recipient: tab === "direct" ? selectedUser?.department : selectedGroup?.name, recentMessages: visibleMessages.slice(-8).map((message) => ({ sender: message.senderName, body: message.body.slice(0,600), createdAt: message.createdAt })), linkedTicket: pendingTicketId ? tickets.find((ticket) => ticket.id === pendingTicketId) : null } }) });
      const payload = await response.json() as { text?: string; error?: string };
      if (!response.ok || !payload.text) throw new Error(payload.error || "A IA não conseguiu preparar a mensagem.");
      setDraft(payload.text);
    } catch { /* preserva o rascunho */ }
    finally { setAiComposeBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if ((!body && !pendingFile && !pendingTicketId) || !conversationThreadId || isUploading) return;
    const recipientId = tab === "direct" ? effectiveSelected : undefined;
    if (pendingFile) {
      setIsUploading(true);
      try {
        const sent = await onSendAttachment(pendingFile, { conversationType: tab, conversationId: conversationThreadId, recipientId, body, ticketId: pendingTicketId });
        if (sent) { setPendingFile(null); setPendingTicketId(null); setDraft(""); }
      } finally { setIsUploading(false); }
      return;
    }
    onSend({ id: makeId(), conversationType: tab, conversationId: conversationThreadId, senderId: currentUser.id, senderName: currentUser.fullName, senderInitials: currentUser.initials, body, ticketId: pendingTicketId, createdAt: new Date().toISOString() }, recipientId);
    setDraft("");
    setPendingTicketId(null);
  }

  return (
    <section className="chat-shell panel">
      <aside className="conversation-list">
        <div className="chat-tabs">
          <button className={tab === "direct" ? "active" : ""} onClick={() => changeTab("direct")}>Diretas</button>
          <button className={tab === "group" ? "active" : ""} onClick={() => changeTab("group")}>Grupos <span>{groups.length}</span></button>
        </div>
        <label className="conversation-search"><Search size={15} /><input placeholder="Buscar conversa..." value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} /></label>
        {tab === "group" && access.register && <button className="new-group-row" onClick={onNewGroup}><Plus size={14} /> Criar grupo por convite</button>}
        <div className="conversation-items">
          {tab === "direct" ? filteredDirectUsers.map((user, index) => {
            const last = lastConversationMessage("direct", user.id);
            return <button key={user.id} className={effectiveSelected === user.id ? "conversation active" : "conversation"} onClick={() => selectConversation(user.id)}>
              <span className="avatar conversation-avatar">{user.initials}<b /></span><span><strong>{user.fullName}</strong><small>{last?.body || last?.attachmentName || user.department}</small></span><span className="conversation-side"><time>{last ? formatTime(last.createdAt) : ""}</time>{index < 2 && <i>{index + 1}</i>}</span>
            </button>;
          }) : filteredGroups.map((group) => {
            const last = lastConversationMessage("group", group.id);
            return <button key={group.id} className={effectiveSelected === group.id ? "conversation active" : "conversation"} onClick={() => selectConversation(group.id)}>
              <span className="group-avatar"><Hash size={16} /></span><span><strong>{group.name}</strong><small>{last?.body || last?.attachmentName || `${group.memberCount} participantes`}</small></span><span className="conversation-side"><time>{last ? formatTime(last.createdAt) : ""}</time></span>
            </button>;
          })}
        </div>
      </aside>
      <div className="chat-main">
        <header className="chat-header">
          <div className={tab === "group" ? "group-avatar" : "avatar"}>{tab === "group" ? <Hash size={16} /> : selectedUser?.initials}</div>
          <div><strong>{tab === "group" ? selectedGroup?.name : selectedUser?.fullName}</strong><span>{tab === "group" ? `${selectedGroup?.memberCount ?? 0} participantes` : selectedUser?.department}</span></div>
          <span className="chat-mode-badge"><LockKeyhole size={12} /> Privado</span>
          <div className="chat-header-actions">
            <button className={detailPanel === "attachments" ? "active" : ""} title="Anexos da conversa" aria-label="Ver anexos da conversa" aria-pressed={detailPanel === "attachments"} onClick={() => togglePanel("attachments")}><ClipboardList size={16} /></button>
            <button className={detailPanel === "participants" ? "active" : ""} title="Participantes" aria-label="Ver participantes da conversa" aria-pressed={detailPanel === "participants"} onClick={() => togglePanel("participants")}><UsersRound size={16} /></button>
            <div className="chat-more-wrap">
              <button className={moreOpen ? "active" : ""} title="Mais opções" aria-label="Mais opções da conversa" aria-expanded={moreOpen} onClick={() => setMoreOpen((current) => !current)}><MoreHorizontal size={17} /></button>
              {moreOpen && <div className="chat-more-menu"><button onClick={() => togglePanel("participants")}><UsersRound size={15} /> Ver participantes</button><button onClick={() => togglePanel("attachments")}><Files size={15} /> Ver anexos</button></div>}
            </div>
          </div>
        </header>
        {tab === "group" && <div className="invite-banner"><span><Mail size={15} /></span><div><strong>Grupo com entrada por convite</strong><p>Somente participantes convidados podem visualizar e enviar mensagens.</p></div>{access.register && <button onClick={onNewGroup}>Gerenciar convites</button>}</div>}
        {detailPanel && <aside className="chat-detail-panel" aria-label={detailPanel === "participants" ? "Participantes da conversa" : "Anexos da conversa"}>
          <header><div><span>{detailPanel === "participants" ? <UsersRound size={18} /> : <Files size={18} />}</span><div><strong>{detailPanel === "participants" ? "Participantes" : "Anexos da conversa"}</strong><small>{detailPanel === "participants" ? `${acceptedParticipants.length} ${acceptedParticipants.length === 1 ? "participante" : "participantes"}` : `${conversationAttachments.length} ${conversationAttachments.length === 1 ? "arquivo" : "arquivos"}`}</small></div></div><button aria-label="Fechar painel" onClick={() => setDetailPanel(null)}><X size={17} /></button></header>
          {detailPanel === "participants" ? <div className="chat-detail-list">
            {acceptedParticipants.map((user) => <article className="chat-participant" key={user.id}><span className="avatar">{user.initials}</span><div><strong>{user.fullName}</strong><small>{user.department}</small></div><i>Participante</i></article>)}
            {invitedParticipants.map((user) => <article className="chat-participant pending" key={user.id}><span className="avatar">{user.initials}</span><div><strong>{user.fullName}</strong><small>{user.department}</small></div><i>Convite pendente</i></article>)}
          </div> : <div className="chat-detail-list">
            {conversationAttachments.map((message) => {
              const href = message.attachmentUrl ?? `/api/files?id=${encodeURIComponent(message.attachmentId ?? "")}&userId=${encodeURIComponent(currentUser.id)}`;
              return <a className="chat-panel-file" href={href} download={message.attachmentName ?? undefined} key={message.id}><span>{fileBadge(message.attachmentName ?? "documento")}</span><div><strong>{message.attachmentName}</strong><small>{message.senderName} · {message.attachmentSize ? formatSize(message.attachmentSize) : "Arquivo"} · {formatDate(message.createdAt)}</small></div><Download size={15} /></a>;
            })}
            {!conversationAttachments.length && <div className="chat-panel-empty"><Paperclip size={24} /><strong>Nenhum anexo enviado</strong><p>Os documentos desta conversa aparecerão aqui.</p></div>}
          </div>}
        </aside>}
        <div className="message-stream message-stream-v2">
          <div className="date-divider"><span>Hoje</span></div>
          {visibleMessages.length === 0 && <div className="empty-chat"><span><MessagesSquare size={25} /></span><strong>Comece esta conversa</strong><p>Mensagens, chamados e documentos ficarão registrados aqui.</p></div>}
          {visibleMessages.map((message) => (
            <div key={message.id} className={message.senderId === currentUser.id ? "message own" : "message"}>
              <span className="activity-avatar blue">{message.senderInitials}</span>
              <div className="message-bubble">
                <div className="message-meta"><strong>{message.senderName}</strong><time>{formatTime(message.createdAt)}</time></div>{message.body && <p>{message.body}</p>}
                {message.ticketId && <button className="ticket-attachment" onClick={() => setLinkedTicket(tickets.find((ticket) => ticket.id === message.ticketId) ?? null)}><ClipboardList size={12} /> {tickets.find((ticket) => ticket.id === message.ticketId)?.protocol ?? "Chamado relacionado"}</button>}
                {message.attachmentName && (message.attachmentUrl || message.attachmentId ? <a className="file-attachment" href={message.attachmentUrl ?? `/api/files?id=${encodeURIComponent(message.attachmentId ?? "")}&userId=${encodeURIComponent(currentUser.id)}`} download={message.attachmentName}><span>{fileBadge(message.attachmentName)}</span><div><strong>{message.attachmentName}</strong><small>{message.attachmentSize ? `${formatSize(message.attachmentSize)} · ` : ""}Documento anexado</small></div><i><Download size={14} /></i></a> : <div className="file-attachment"><span>{fileBadge(message.attachmentName)}</span><div><strong>{message.attachmentName}</strong><small>Documento registrado</small></div><i><FileText size={14} /></i></div>)}
              </div>
            </div>
          ))}
        </div>
        {access.register ? <form className="message-composer" onSubmit={submit}>
          {pendingFile && <div className="pending-attachment"><span><FileText size={16} /></span><div><strong>{pendingFile.name}</strong><small>{formatSize(pendingFile.size)} · pronto para enviar nesta conversa</small></div><button type="button" aria-label="Remover anexo" onClick={() => setPendingFile(null)}><X size={15} /></button></div>}
          {pendingTicketId && (() => { const linked=tickets.find((ticket)=>ticket.id===pendingTicketId); return linked ? <div className="pending-attachment pending-ticket"><span><ClipboardList size={16} /></span><div><strong>{linked.protocol}</strong><small>{linked.title} · será vinculado à mensagem</small></div><button type="button" aria-label="Remover chamado vinculado" onClick={() => setPendingTicketId(null)}><X size={15} /></button></div> : null; })()}
          <div className="compose-actions"><button type="button" onClick={() => chatFileInput.current?.click()} title="Anexar documento"><Paperclip size={16} /></button><button type="button" title="Vincular chamado" onClick={() => setTicketPickerOpen(true)}><ClipboardList size={16} /></button><button type="button" className="ai-compose-button" title={draft.trim() ? "Melhorar mensagem com IA" : "Sugerir resposta com IA"} disabled={aiComposeBusy} onClick={() => void assistMessage()}>{aiComposeBusy ? <LoaderCircle className="spin" size={16}/> : <Sparkles size={16}/>}</button></div>
          <textarea aria-label="Mensagem" placeholder={pendingFile ? "Adicione uma mensagem ao documento (opcional)..." : "Escreva uma mensagem..."} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <button className="send-button" aria-label={isUploading ? "Enviando documento" : "Enviar mensagem"} disabled={isUploading || (!draft.trim() && !pendingFile && !pendingTicketId)}>{isUploading ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}</button>
          <input ref={chatFileInput} className="hidden-input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPendingFile(file); event.target.value = ""; }} />
        </form> : <div className="read-only-composer"><ShieldCheck size={16} /><span><strong>Conversa em modo de consulta</strong><small>O secretário não autorizou o envio de mensagens para este perfil.</small></span></div>}
        {ticketPickerOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTicketPickerOpen(false); }}><section className="modal ticket-picker-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-picker-title"><header><div><p className="eyebrow">VINCULAR CHAMADO</p><h2 id="ticket-picker-title">Escolha um chamado</h2></div><button onClick={() => setTicketPickerOpen(false)} aria-label="Fechar"><X size={18} /></button></header><div className="ticket-picker-list">{tickets.map((ticket) => <button key={ticket.id} onClick={() => { setPendingTicketId(ticket.id); setTicketPickerOpen(false); }}><ClipboardList size={15} /><span><strong>{ticket.protocol}</strong><small>{ticket.title}</small></span><StatusPill status={ticket.status} /><ChevronRight size={13} /></button>)}{!tickets.length && <div className="empty-state">Não há chamados disponíveis neste setor.</div>}</div></section></div>}
        {linkedTicket && <TicketDetailModal ticket={linkedTicket} onClose={() => setLinkedTicket(null)} onStatus={(status) => { onTicketStatus(linkedTicket.id, status); setLinkedTicket((current) => current ? { ...current, status } : current); }} />}
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
  const access = useCurrentPermission();
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
              {access.edit && <div className="invitation-actions"><button className="button primary" onClick={() => onRespond(invitation, "aceito")}><Check size={15} /> Aceitar convite</button><button className="button secondary danger" onClick={() => onRespond(invitation, "recusado")}><XCircle size={15} /> Recusar</button></div>}
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

function DocumentsSection({ documents, department, currentUserId, onUpload }: { documents: DocumentItem[]; department: string; currentUserId: string; onUpload: () => void }) {
  const access = useCurrentPermission();
  const [query, setQuery] = useState("");
  const visibleDocuments = documents.filter((document) => [document.name, document.ownerName, document.category].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="sector-files-layout">
      <div className="access-note files-access-note"><span><ShieldCheck size={20} /></span><div><strong>Biblioteca exclusiva do setor</strong><p>Os arquivos desta área podem ser acessados por todos os integrantes de {department}.</p></div><strong className="directory-total">{documents.length} {documents.length === 1 ? "arquivo" : "arquivos"}</strong></div>
      <article className="panel documents-panel">
        <div className="module-toolbar">
          <label className="module-search"><Search size={15} /><input aria-label="Buscar arquivo" placeholder="Buscar por nome, categoria ou responsável..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {access.register && <button type="button" className="button primary" onClick={onUpload}><Upload size={15} /> Anexar arquivo</button>}
        </div>
        <div className="document-table">
          <div className="document-row document-head"><span>Arquivo</span><span>Compartilhado por</span><span>Setor</span><span>Enviado em</span><span /></div>
          {visibleDocuments.map((doc) => <div className="document-row" key={doc.id}><div className="document-name"><span className="file-type"><FileText size={17} /></span><div><strong>{doc.name}</strong><small>{doc.category} · {formatSize(doc.size)}</small></div></div><span>{doc.ownerName}</span><span className="doc-department">{doc.department}</span><span>{formatDate(doc.createdAt)}</span><a className="table-menu" href={`/api/files?id=${encodeURIComponent(doc.id)}&userId=${encodeURIComponent(currentUserId)}`} aria-label={`Baixar ${doc.name}`} title="Baixar arquivo"><Download size={16} /></a></div>)}
          {!visibleDocuments.length && <div className="module-empty"><Files size={30} /><strong>Nenhum arquivo encontrado</strong><p>{access.register ? "Anexe o primeiro documento do setor ou ajuste a busca." : "Ajuste a busca ou solicite acesso de registro ao secretário."}</p>{access.register && <button type="button" className="button primary" onClick={onUpload}><Upload size={15} /> Anexar arquivo</button>}</div>}
        </div>
      </article>
    </section>
  );
}

function EventsSection({ events, department, onNew, onEdit, onDelete }: { events: SectorEvent[]; department: string; onNew: () => void; onEdit: (event: SectorEvent) => void; onDelete: (event: SectorEvent) => void }) {
  const access = useCurrentPermission();
  return (
    <section className="events-layout">
      <div className="access-note events-access-note"><span><CalendarDays size={20} /></span><div><strong>Agenda de {department}</strong><p>Exibe apenas eventos destinados a este setor. Edição e exclusão respeitam as permissões definidas pelo responsável.</p></div><strong className="directory-total">{events.length} {events.length === 1 ? "evento" : "eventos"}</strong></div>
      {events.length ? <div className="events-grid">{events.map((event) => {
        const calendar = eventDateParts(event.startsAt);
        const canManageEvent = access.edit && sameDepartment(event.department, department);
        return <article className="panel event-card" key={event.id}>
          <div className="event-date"><small>{calendar.month}</small><strong>{calendar.day}</strong><span>{calendar.weekday}</span></div>
          <div className="event-copy"><div className="event-card-top"><div className="event-meta"><span><Clock3 size={13} /> {formatEventRange(event.startsAt, event.endsAt)}</span>{event.location && <span><MapPin size={13} /> {event.location}</span>}</div>{canManageEvent && <div className="event-card-actions"><button type="button" onClick={() => onEdit(event)} aria-label={`Editar ${event.title}`}><Pencil size={13} /> Editar</button><button type="button" className="danger" onClick={() => onDelete(event)} aria-label={`Excluir ${event.title}`}><Trash2 size={13} /> Excluir</button></div>}</div><h2>{event.title}</h2><p>{event.description || "Sem observações adicionais."}</p><div className="event-sector-tags" aria-label={`Visível em ${department}`}><span><Building2 size={11} /> {department}</span></div><footer><span className="mini-avatar">{event.creatorInitials}</span><span>Criado por <strong>{event.creatorName}</strong></span><i>Agenda do setor</i></footer></div>
        </article>;
      })}</div> : <div className="panel module-empty events-empty"><CalendarDays size={34} /><strong>Nenhum evento agendado</strong><p>{access.register ? "Cadastre reuniões, prazos e compromissos importantes para o seu setor." : "Os próximos compromissos autorizados aparecerão aqui."}</p>{access.register && <button type="button" className="button primary" onClick={onNew}><CalendarPlus size={15} /> Criar primeiro evento</button>}</div>}
    </section>
  );
}

function EmployeesSection({ users, department, onInvite, onResend }: { users: User[]; department: string; onInvite: () => void; onResend: (user: User) => void }) {
  const [query, setQuery] = useState("");
  const visible = users.filter((user) => [user.fullName, user.email, user.role].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const pending = users.filter((user) => (user.accountStatus ?? "Ativo") !== "Ativo").length;
  return (
    <section className="employees-layout">
      <div className="access-note employee-access-note"><span><ShieldCheck size={20} /></span><div><strong>Gestão de acessos de {department}</strong><p>Somente o responsável do setor visualiza esta área e pode cadastrar funcionários.</p></div><strong className="directory-total">{users.length} {users.length === 1 ? "pessoa" : "pessoas"}</strong></div>
      <div className="employee-prototype-note"><Mail size={18} /><div><strong>Convites por e-mail</strong><p>Os convites são enviados pelo Supabase Auth. O funcionário recebe um link por e-mail para concluir a criação do acesso.</p></div></div>
      <section className="employee-summary" aria-label="Resumo de acessos">
        <article className="panel"><span className="employee-summary-icon active"><CheckCircle2 size={19} /></span><div><small>ACESSOS ATIVOS</small><strong>{String(users.length - pending).padStart(2, "0")}</strong></div></article>
        <article className="panel"><span className="employee-summary-icon pending"><Clock3 size={19} /></span><div><small>AGUARDANDO SENHA</small><strong>{String(pending).padStart(2, "0")}</strong></div></article>
      </section>
      <article className="panel employees-panel">
        <div className="module-toolbar employee-toolbar"><label className="module-search"><Search size={15} /><input aria-label="Buscar funcionário" placeholder="Buscar por nome, e-mail ou função..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" className="button primary" onClick={onInvite}><UserPlus size={15} /> Convidar funcionário</button></div>
        <div className="employee-table">
          <div className="employee-row employee-head"><span>Funcionário</span><span>Função</span><span>Status do acesso</span><span>Convite</span><span /></div>
          {visible.map((user) => {
            const status = user.accountStatus ?? "Ativo";
            const isPending = status !== "Ativo";
            return <div className="employee-row" key={user.id}><div className="employee-person"><span className="avatar">{user.initials}</span><div><strong>{user.fullName}</strong><small>{user.email}</small></div></div><span>{user.role}</span><span><i className={`account-status ${isPending ? "pending" : "active"}`}>{isPending ? <Clock3 size={12} /> : <CheckCircle2 size={12} />}{status}</i></span><span>{isPending && user.invitedAt ? formatDate(user.invitedAt) : "—"}</span><span>{isPending ? <button type="button" className="resend-invite" onClick={() => onResend(user)}><Mail size={13} /> Reenviar convite</button> : <span className="active-account-label">Acesso liberado</span>}</span></div>;
          })}
          {!visible.length && <div className="module-empty"><UsersRound size={30} /><strong>Nenhum funcionário encontrado</strong><p>Ajuste a busca ou cadastre uma nova pessoa para este setor.</p><button type="button" className="button primary" onClick={onInvite}><UserPlus size={15} /> Convidar funcionário</button></div>}
        </div>
      </article>
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

function AuditSection({ audit, department, notify }: { audit: AuditItem[]; department: string; notify: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas as atividades");
  const visibleAudit = audit.filter((item) => {
    const itemCategory = auditCategory(item);
    const matchesCategory = category === "Todas as atividades" || itemCategory === category;
    const term = query.trim().toLowerCase();
    return matchesCategory && (!term || [item.actorName, item.detail, itemCategory].join(" ").toLowerCase().includes(term));
  });
  return (
    <section className="audit-layout">
      <aside className="panel audit-summary"><span className="audit-shield"><ShieldCheck size={22} /></span><h2>Registro do setor</h2><p>Somente chamados, mensagens, anexos, arquivos e eventos relacionados a {department} aparecem neste histórico.</p><dl><div><dt>Atividades relevantes</dt><dd>{audit.length}</dd></div><div><dt>Escopo</dt><dd>Setorial</dd></div></dl></aside>
      <article className="panel audit-panel">
        <div className="module-toolbar"><label className="module-search"><Search size={15} /><input aria-label="Buscar no histórico do setor" placeholder="Buscar atividade, pessoa ou arquivo..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filtrar atividade" value={category} onChange={(event) => setCategory(event.target.value)}><option>Todas as atividades</option><option>Chamados</option><option>Mensagens e anexos</option><option>Arquivos do setor</option><option>Eventos</option></select><button className="button secondary" onClick={() => { const csv = [["Data","Usuário","Categoria","Ação","Detalhe"], ...visibleAudit.map((item) => [item.createdAt,item.actorName,auditCategory(item),auditActionLabel(item),item.detail])].map((row) => row.map((value) => `"${String(value).replace(/"/g,'""')}"`).join(";")).join("\n"); const blob = new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download="historico-atividades.csv"; link.click(); URL.revokeObjectURL(url); notify("Log de auditoria exportado em CSV."); }}><Download size={15} /> Exportar log</button></div>
        <div className="audit-list">{visibleAudit.map((item, index) => { const itemCategory = auditCategory(item); return <div className="audit-row" key={item.id}><span className={`activity-avatar ${["green", "blue", "violet", "amber"][index % 4]}`}>{item.actorInitials}</span><div><strong>{item.actorName}</strong><p>{item.detail}</p><small>{itemCategory} · {formatDateTime(item.createdAt)}</small></div><span className="audit-action">{auditActionLabel(item)}</span></div>; })}{!visibleAudit.length && <div className="audit-empty"><History size={30} /><strong>Nenhuma atividade relevante encontrada</strong><p>{query || category !== "Todas as atividades" ? "Ajuste a busca ou o filtro selecionado." : `Ainda não há registros operacionais para ${department}.`}</p></div>}</div>
      </article>
    </section>
  );
}

function TicketDetailModal({ ticket, departments = [], onClose, onStatus }: { ticket: Ticket; departments?: string[]; onClose: () => void; onStatus: (status: TicketStatus) => void }) {
  const access = useCurrentPermission();
  const [tab, setTab] = useState<"mensagens" | "interno">("mensagens");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [forwardDepartment, setForwardDepartment] = useState("");
  const [checklist, setChecklist] = useState([
    { id: "receive", label: "Conferir dados e documentos obrigatórios", done: true },
    { id: "inspect", label: "Realizar análise ou vistoria técnica", done: ticket.status !== "Recebido" && ticket.status !== "Em análise" },
    { id: "approve", label: "Submeter ao responsável pela aprovação", done: ticket.status === "Concluído" },
    { id: "proof", label: "Anexar comprovante, parecer ou fotografia final", done: ticket.status === "Concluído" },
  ]);
  const [aiDetailBusy, setAiDetailBusy] = useState<"summary" | "checklist" | "reply" | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  async function aiTicketTool(kind: "summary" | "checklist" | "reply") {
    if (aiDetailBusy) return; setAiDetailBusy(kind);
    try {
      if (kind === "summary") {
        const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "summarize", text: `${ticket.title}\n${ticket.description}\nStatus: ${ticket.status}\nPrioridade: ${ticket.priority}\nSetor: ${ticket.department}` }) });
        const payload = await response.json() as { text?: string }; if (response.ok && payload.text) setAiSummary(payload.text);
      } else {
        const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "draft", kind: kind === "checklist" ? "checklist" : "citizen_response", text: `${ticket.title}\n${ticket.description}`, context: { protocol: ticket.protocol, department: ticket.department, status: ticket.status, priority: ticket.priority, dueDate: ticket.dueDate } }) });
        const payload = await response.json() as { text?: string };
        if (response.ok && payload.text) { if (kind === "reply") { setTab("mensagens"); setNote(payload.text); } else { const lines = payload.text.split(/\n+/).map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, "").trim()).filter(Boolean).slice(0,10); if (lines.length) setChecklist(lines.map((label,index)=>({ id:`ai-${index}-${Date.now()}`, label, done:false }))); } }
      }
    } finally { setAiDetailBusy(null); }
  }
  const forwardDepartments = departments.filter((department) => !sameDepartment(department, ticket.department));
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal ticket-detail-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title"><header><div><p className="eyebrow">{ticket.protocol} · {ticket.requester}</p><h2 id="ticket-detail-title">{ticket.title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><div className="ticket-detail-body"><div className="ticket-detail-meta"><StatusPill status={ticket.status} /><span className={`priority-label ${ticket.priority.toLowerCase().replace("é", "e")}`}>{ticket.priority}</span><span><Clock3 size={13} /> SLA: {formatDue(ticket.dueDate)}</span>{!access.edit && <span className="read-only-chip"><ShieldCheck size={11} /> Somente consulta</span>}</div><p className="ticket-detail-description">{ticket.description}</p><div className="ticket-ai-toolbar"><button type="button" disabled={Boolean(aiDetailBusy)} onClick={() => void aiTicketTool("summary")}><Sparkles size={13}/>{aiDetailBusy === "summary" ? "Resumindo..." : "Resumir"}</button><button type="button" disabled={Boolean(aiDetailBusy) || !access.edit} onClick={() => void aiTicketTool("checklist")}><Sparkles size={13}/>{aiDetailBusy === "checklist" ? "Criando..." : "Gerar checklist"}</button><button type="button" disabled={Boolean(aiDetailBusy) || !access.edit} onClick={() => void aiTicketTool("reply")}><Sparkles size={13}/>{aiDetailBusy === "reply" ? "Redigindo..." : "Sugerir atualização"}</button></div>{aiSummary && <div className="ticket-ai-summary"><strong><Sparkles size={13}/> Resumo da IA</strong><p>{aiSummary}</p></div>}<div className="ticket-address-card"><span><MapPin size={16} /></span><div><small>Endereço registrado</small><strong>{ticket.address || "Endereço não informado"}</strong><p>{ticket.neighborhood ? `${ticket.neighborhood} · Várzea da Palma/MG` : "Bairro não informado"}</p></div></div><div className="ticket-sla-meter"><strong>SLA operacional</strong><span><i style={{ width: `${ticket.status === "Concluído" ? 100 : ticket.priority === "Urgente" ? 82 : ticket.priority === "Alta" ? 66 : 48}%` }} /></span><em>{formatDue(ticket.dueDate)}</em></div><article className="ticket-timeline"><h3>Linha do tempo do chamado</h3><ol><li><time>08:42</time><i /><span><strong>Chamado registrado</strong>Solicitação recebida e protocolo gerado.</span></li><li><time>09:03</time><i /><span><strong>Triagem concluída</strong>Demanda encaminhada para {ticket.department}.</span></li><li><time>09:18</time><i /><span><strong>Responsável definido</strong>{ticket.assigneeName ?? "Equipe do setor"} assumiu o atendimento.</span></li><li><time>11:07</time><i /><span><strong>Execução atualizada</strong>Status atual: {ticket.status}.</span></li></ol></article><div className="ticket-ownership"><div><small>Responsável principal</small><strong><span className="mini-avatar">{ticket.assigneeInitials ?? "--"}</span>{ticket.assigneeName ?? "A definir"}</strong></div><div><small>Equipe do setor</small><strong><UsersRound size={14} /> Acesso restrito à unidade</strong></div><div><small>Aprovador</small><strong><ShieldCheck size={14} /> Responsável pelo setor</strong></div></div><div className="ticket-detail-grid"><article className="ticket-checklist"><header><div><h3>Checklist de execução</h3><p>{checklist.filter((item) => item.done).length} de {checklist.length} etapas concluídas</p></div><span>{Math.round(checklist.filter((item) => item.done).length / checklist.length * 100)}%</span></header>{checklist.map((item) => <label key={item.id} className={item.done ? "done" : ""}><input type="checkbox" checked={item.done} disabled={!access.edit} onChange={() => setChecklist((current) => current.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} /><span>{item.label}</span></label>)}{access.edit && <button onClick={() => { setChecklist((current) => [...current, { id: `custom-${current.length + 1}`, label: `Nova etapa ${current.length + 1}`, done: false }]); setFeedback("Nova etapa adicionada ao checklist."); }}><Plus size={13} /> Adicionar etapa</button>}</article>{forwardDepartments.length > 0 && <article className="ticket-movement"><h3>Encaminhar para outro setor</h3><p>O setor de origem e todo o histórico serão preservados.</p><select aria-label="Setor de destino" disabled={!access.edit} value={forwardDepartment} onChange={(event) => setForwardDepartment(event.target.value)}><option value="">Selecione o setor de destino</option>{forwardDepartments.map((department) => <option key={department}>{department}</option>)}</select><textarea aria-label="Motivo do encaminhamento" disabled={!access.edit} placeholder={access.edit ? "Justificativa do encaminhamento..." : "Alteração bloqueada pelo perfil"} />{access.edit && <button className="button secondary" disabled={!forwardDepartment} onClick={() => { setFeedback(`Encaminhamento preparado para ${forwardDepartment}.`); setForwardDepartment(""); }}>Registrar encaminhamento</button>}{feedback && <small className="ticket-inline-feedback"><Check size={11} /> {feedback}</small>}</article>}</div><article className="ticket-conversation"><div className="ticket-conversation-tabs"><button className={tab === "mensagens" ? "active" : ""} onClick={() => setTab("mensagens")}>Mensagens do chamado</button><button className={tab === "interno" ? "active" : ""} onClick={() => setTab("interno")}><LockKeyholeIcon /> Anotações internas</button></div><div className="ticket-note-feed">{tab === "mensagens" ? <><p><strong>Solicitante</strong><span>A solicitação foi registrada com endereço e fotografias do local.</span><small>13 ago., 08:42</small></p><p><strong>{ticket.assigneeName ?? "Equipe responsável"}</strong><span>A análise inicial foi realizada e o atendimento segue o prazo indicado.</span><small>13 ago., 11:18</small></p></> : <><p className="internal-note"><strong>Nota restrita ao setor</strong><span>Verificar disponibilidade da equipe antes de confirmar a data ao solicitante.</span><small>Somente integrantes autorizados podem visualizar</small></p></>} </div>{access.edit && <div className="ticket-note-compose"><input aria-label={tab === "interno" ? "Adicionar anotação interna" : "Escrever mensagem do chamado"} value={note} onChange={(event) => setNote(event.target.value)} placeholder={tab === "interno" ? "Adicionar anotação interna..." : "Escrever atualização para os participantes..."} /><button disabled={!note.trim()} onClick={() => { setFeedback(tab === "interno" ? "Anotação interna registrada." : "Mensagem registrada no chamado."); setNote(""); }}><Send size={14} /></button></div>}</article><footer className="ticket-detail-footer">{access.edit && <label>Etapa atual<select value={ticket.status} onChange={(event) => onStatus(event.target.value as TicketStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>}<button className="button secondary" onClick={onClose}>Fechar</button>{access.edit && <button className="button primary" onClick={() => { onStatus("Concluído"); setFeedback("Chamado concluído e pesquisa de satisfação liberada."); }}><CheckCircle2 size={15} /> Concluir atendimento</button>}</footer></div></section></div>;
}

function LockKeyholeIcon() { return <ShieldCheck size={13} />; }

function TicketModal({ users, departments, onClose, onCreate }: { users: User[]; departments: string[]; onClose: () => void; onCreate: (data: FormData) => unknown | Promise<unknown> }) {
  const [department, setDepartment] = useState(departments[0] ?? ""); const [neighborhood, setNeighborhood] = useState(""); const [address, setAddress] = useState(""); const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [priority, setPriority] = useState<Priority>("Média"); const [dueDate, setDueDate] = useState(""); const [aiBusy, setAiBusy] = useState(false); const [aiHint, setAiHint] = useState("");
  const eligibleUsers = users.filter((user) => sameDepartment(user.department, department));
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void onCreate(new FormData(event.currentTarget)); }
  async function assistWithAi() { if (!title.trim() && !description.trim()) { setAiHint("Escreva ao menos um título ou uma descrição para a IA analisar."); return; } setAiBusy(true); setAiHint(""); try { const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "ticket_assist", title, description, neighborhood, departments }) }); const payload = await response.json() as { result?: { title:string; description:string; department:string; priority:Priority; dueDays:number; slaHours:number; tags:string[]; checklist:string[]; source:string }; error?:string }; if (!response.ok || !payload.result) throw new Error(payload.error || "Não foi possível preparar o chamado com IA."); const result = payload.result; setTitle(result.title || title); setDescription(result.description || description); if (departments.some((item) => sameDepartment(item, result.department))) setDepartment(departments.find((item) => sameDepartment(item, result.department)) ?? department); setPriority(result.priority || priority); const target = new Date(); target.setDate(target.getDate()+Math.max(0,result.dueDays||0)); setDueDate(target.toISOString().slice(0,10)); setAiHint(`IA sugeriu setor, prioridade e prazo · SLA recomendado: ${result.slaHours}h${result.tags.length ? ` · ${result.tags.slice(0,3).join(", ")}` : ""}. Revise antes de criar.`); } catch(error) { setAiHint(error instanceof Error ? error.message : "Falha ao consultar a IA."); } finally { setAiBusy(false); } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal ticket-create-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title"><header><div><p className="eyebrow">NOVO REGISTRO</p><h2 id="ticket-modal-title">Criar chamado</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={18}/></button></header><form onSubmit={submit}>
    <label className="field full"><span>Modelo da solicitação</span><select name="template" defaultValue="Solicitação geral"><option>Solicitação geral</option><option>Manutenção de veículo</option><option>Solicitação de material</option><option>Reparo em iluminação</option><option>Suporte de informática</option><option>Produção de arte e comunicação</option><option>Agendamento de espaço</option><option>Solicitação de transporte</option><option>Compra ou contratação</option><option>Vistoria técnica</option></select><small className="field-hint">O modelo define checklist, documentos obrigatórios e prazo padrão.</small></label>
    <label className="field full"><span>Título do chamado *</span><input name="title" required placeholder="Ex.: Reparo da iluminação da avenida" autoFocus value={title} onChange={(event)=>setTitle(event.target.value)}/></label>
    <label className="field full"><span>Descrição</span><textarea name="description" placeholder="Inclua contexto, entregáveis, local e observações..." value={description} onChange={(event)=>setDescription(event.target.value)}/></label>
    <div className="ticket-ai-assist full"><button type="button" disabled={aiBusy || (!title.trim() && !description.trim())} onClick={()=>void assistWithAi()}><Sparkles size={15}/>{aiBusy ? "Analisando com Groq..." : "IA: classificar e preencher"}</button>{aiHint && <small>{aiHint}</small>}</div>
    <AddressRegistrationField neighborhood={neighborhood} address={address} onNeighborhoodChange={setNeighborhood} onAddressChange={setAddress}/>
    <label className="field"><span>Setor responsável *</span><select name="department" required value={department} onChange={(event)=>setDepartment(event.target.value)}>{departments.map((item)=><option key={item}>{item}</option>)}</select></label>
    <label className="field"><span>Responsável principal</span><select name="assigneeId" defaultValue="" disabled={!department}><option value="">{department ? "A definir" : "Selecione primeiro o setor"}</option>{eligibleUsers.map((user)=><option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>
    <label className="field"><span>Prioridade</span><select name="priority" value={priority} onChange={(event)=>setPriority(event.target.value as Priority)}><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
    <label className="field"><span>Prazo ou SLA</span><input type="date" name="dueDate" value={dueDate} onChange={(event)=>setDueDate(event.target.value)}/></label>
    <label className="field full"><span>Colaboradores e pessoas que acompanham</span><select name="followers" defaultValue=""><option value="">Definir depois da criação</option>{eligibleUsers.map((user)=><option key={user.id} value={user.id}>{user.fullName} · {user.role}</option>)}</select></label>
    <p className="ticket-modal-privacy"><ShieldCheck size={14}/> O chamado ficará visível ao setor responsável. A IA apenas sugere classificação, prioridade e prazo; o servidor confirma antes do registro.</p>
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary"><Plus size={15}/> Criar e registrar</button></div>
  </form></section></div>;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function EventModal({ department, departments, event, onClose, onSave }: { department: string; departments: string[]; event?: SectorEvent; onClose: () => void; onSave: (data: FormData) => unknown | Promise<unknown> }) {
  const [startsAt, setStartsAt] = useState(() => toDateTimeLocal(event?.startsAt));
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(() => {
    const requested = event?.targetDepartments?.length ? event.targetDepartments : [department];
    const allowed = departments.filter((allowedDepartment) => requested.some((target) => sameDepartment(target, allowedDepartment)));
    return allowed.length ? allowed : [department];
  });
  const [selectionError, setSelectionError] = useState("");
  const editing = Boolean(event);

  function toggleDepartment(target: string, checked: boolean) {
    setSelectionError("");
    setSelectedDepartments((current) => checked ? Array.from(new Set([...current, target])) : current.filter((item) => item !== target));
  }

  function submit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!selectedDepartments.length) { setSelectionError("Selecione ao menos um setor para continuar."); return; }
    void onSave(new FormData(submitEvent.currentTarget));
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(backdropEvent) => { if (backdropEvent.target === backdropEvent.currentTarget) onClose(); }}><section className="modal event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title"><header><div><p className="eyebrow">AGENDA MULTISSETORIAL</p><h2 id="event-modal-title">{editing ? "Editar evento" : "Cadastrar próximo evento"}</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><form onSubmit={submit}>
    <label className="field full"><span>Título do evento *</span><input name="title" required defaultValue={event?.title} placeholder="Ex.: Reunião de planejamento" autoFocus /></label>
    <label className="field full"><span>Descrição</span><textarea name="description" defaultValue={event?.description} placeholder="Inclua pauta, orientações ou informações relevantes..." /></label>
    <label className="field"><span>Início *</span><input type="datetime-local" name="startsAt" required value={startsAt} onChange={(changeEvent) => setStartsAt(changeEvent.target.value)} /></label>
    <label className="field"><span>Término</span><input type="datetime-local" name="endsAt" min={startsAt} defaultValue={toDateTimeLocal(event?.endsAt)} /></label>
    <label className="field full"><span>Local</span><input name="location" defaultValue={event?.location} placeholder="Ex.: Sala de reuniões, Auditório municipal ou online" /></label>
    <fieldset className="event-sector-selector"><legend>Setores que visualizarão o evento *</legend><header><span><Building2 size={15} /> {selectedDepartments.length} {selectedDepartments.length === 1 ? "setor selecionado" : "setores selecionados"}</span><div><button type="button" onClick={() => setSelectedDepartments([department])}>Somente o atual</button><button type="button" onClick={() => setSelectedDepartments(departments)}>Selecionar todos</button></div></header><div>{departments.map((target) => <label key={target} className={selectedDepartments.includes(target) ? "selected" : ""}><input type="checkbox" name="targetDepartments" value={target} checked={selectedDepartments.includes(target)} onChange={(changeEvent) => toggleDepartment(target, changeEvent.target.checked)} /><span><i>{selectedDepartments.includes(target) ? <Check size={12} /> : <Plus size={12} />}</i><strong>{target}</strong>{sameDepartment(target, department) && <small>Setor visualizado agora</small>}</span></label>)}</div>{selectionError && <p><AlertTriangle size={13} /> {selectionError}</p>}</fieldset>
    <p className="ticket-modal-privacy"><ShieldCheck size={14} /> O evento aparecerá somente nas agendas dos setores selecionados. Apenas perfis com permissão de alteração poderão editar ou excluir.</p>
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary">{editing ? <Pencil size={15} /> : <CalendarPlus size={15} />}{editing ? "Salvar alterações" : "Publicar evento"}</button></div>
  </form></section></div>;
}

function EventDeleteModal({ event, onClose, onConfirm }: { event: SectorEvent; onClose: () => void; onConfirm: () => void }) {
  const targets = event.targetDepartments?.length ? event.targetDepartments : [event.department];
  return <div className="modal-backdrop" role="presentation" onMouseDown={(backdropEvent) => { if (backdropEvent.target === backdropEvent.currentTarget) onClose(); }}><section className="modal event-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="event-delete-title"><header><div><p className="eyebrow">CONFIRMAR EXCLUSÃO</p><h2 id="event-delete-title">Excluir evento?</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><div className="event-delete-body"><span><Trash2 size={22} /></span><div><strong>{event.title}</strong><p>O evento será removido de {targets.length} {targets.length === 1 ? "setor" : "setores"} e essa ação ficará registrada na auditoria da operação.</p></div></div><footer className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="button" className="button event-delete-confirm" onClick={onConfirm}><Trash2 size={15} /> Excluir evento</button></footer></section></div>;
}

function EmployeeInviteModal({ department, onClose, onInvite }: { department: string; onClose: () => void; onInvite: (data: FormData) => void | Promise<void> }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void onInvite(new FormData(event.currentTarget)); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal employee-modal" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title"><header><div><p className="eyebrow">ACESSO DE FUNCIONÁRIO</p><h2 id="employee-modal-title">Convidar para o setor</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><form onSubmit={submit}><label className="field full"><span>Nome completo *</span><input name="fullName" required minLength={3} placeholder="Ex.: Maria da Silva" autoFocus /></label><label className="field full"><span>E-mail *</span><input type="email" name="email" required placeholder="nome@varzeadapalma.mg.gov.br" /></label><div className="invite-sector"><Building2 size={16} /><div><small>SETOR DO NOVO ACESSO</small><strong>{department}</strong></div></div><p className="prototype-invite-disclaimer"><AlertTriangle size={15} /><span><strong>Simulação de convite</strong> O funcionário ficará com status “Aguardando criação de senha”, mas nenhum e-mail será realmente enviado nesta versão.</span></p><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary"><Mail size={15} /> Simular envio do convite</button></div></form></section></div>;
}

function GroupModal({ currentUserId, users, onClose, onCreate }: { currentUserId: string; users: User[]; onClose: () => void; onCreate: (group: Group, memberIds: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const candidates = users.filter((user) => user.id !== currentUserId);
  const filtered = candidates.filter((user) => [user.fullName, user.department, user.email].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  function submit(form: FormData) { if (!selected.length) return; const name = String(form.get("name")); onCreate({ id: makeId(), name, description: String(form.get("description")), memberCount: 1, createdAt: new Date().toISOString() }, selected); }
  function toggleAll() { setSelected(selected.length === candidates.length ? [] : candidates.map((user) => user.id)); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal group-modal" role="dialog" aria-modal="true" aria-labelledby="group-modal-title"><header><div><p className="eyebrow">COMUNICAÇÃO ENTRE SECRETARIAS</p><h2 id="group-modal-title">Criar grupo por convite</h2></div><button onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><form action={submit}><label className="field full"><span>Nome do grupo *</span><input name="name" required placeholder="Ex.: Operação Volta às Aulas" autoFocus /></label><label className="field full"><span>Objetivo</span><textarea name="description" placeholder="Qual é o objetivo desta conversa?" /></label><fieldset className="member-picker"><legend>Quem você deseja adicionar?</legend><div className="member-tools"><label><Search size={15} /><input aria-label="Buscar pessoa para o grupo" placeholder="Buscar por nome ou secretaria..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" onClick={toggleAll}>{selected.length === candidates.length ? "Limpar seleção" : "Selecionar todos"}</button></div><div className="member-results">{filtered.map((user) => <label className={selected.includes(user.id) ? "selected" : ""} key={user.id}><input type="checkbox" checked={selected.includes(user.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))} /><span className="mini-avatar">{user.initials}</span><span><strong>{user.fullName}</strong><small>{user.department} · {user.role}</small></span><i>{selected.includes(user.id) ? <Check size={12} /> : <Plus size={12} />}</i></label>)}</div><p className="member-count"><UsersRound size={14} /><strong>{selected.length}</strong> {selected.length === 1 ? "pessoa selecionada" : "pessoas selecionadas"}</p></fieldset><p className="invite-note"><BellRing size={14} /> Cada participante receberá uma notificação e uma pendência no próprio acesso. O grupo só ficará disponível depois que o convite for aceito.</p><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" disabled={!selected.length}><UserPlus size={15} /> Criar e enviar {selected.length || ""} {selected.length === 1 ? "convite" : "convites"}</button></div></form></section></div>;
}

function StatusPill({ status }: { status: TicketStatus }) { return <span className={`status-pill ${statusMeta[status].color}`}><i />{statusMeta[status].short}</span>; }
function Activity({ avatar, color, title, detail, time }: { avatar: string; color: string; title: string; detail: string; time: string }) { return <div className="activity-item"><span className={`activity-avatar ${color}`}>{avatar}</span><div><strong>{title}</strong><p>{detail}</p><small>{time}</small></div></div>; }
function auditCategory(item: AuditItem) {
  if (item.entityType === "chamado") return "Chamados";
  if (item.entityType === "mensagem") return "Mensagens e anexos";
  if (item.entityType === "documento") return "Arquivos do setor";
  if (item.entityType === "evento") return "Eventos";
  return "Outras atividades";
}
function auditActionLabel(item: AuditItem) {
  if (item.action === "documento_enviado") return item.entityType === "mensagem" ? "Anexo enviado" : "Arquivo enviado";
  const labels: Record<string, string> = { chamado_criado: "Chamado criado", status_atualizado: "Status atualizado", chamado_finalizado: "Chamado finalizado", mensagem_enviada: "Mensagem enviada", evento_criado: "Evento criado", evento_atualizado: "Evento atualizado", evento_excluido: "Evento excluído" };
  return labels[item.action] ?? item.action.replaceAll("_", " ");
}
function formatHeadingDate(value: Date) { return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" }).format(value).toLocaleUpperCase("pt-BR"); }
function formatHeadingClock(value: Date) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(value); }
function greetingFor(value: Date) {
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(value));
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(value)).replace(" de ", " "); }
function formatTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
function formatDateTime(value: string) { return `${formatDate(value)}, ${formatTime(value)}`; }
function eventDateParts(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" }).format(date),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).format(date).replace(".", "").toUpperCase(),
    weekday: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" }).format(date).replace(".", ""),
  };
}
function formatEventRange(startsAt: string, endsAt?: string | null) {
  const start = formatTime(startsAt);
  if (!endsAt) return `${formatDate(startsAt)} · ${start}`;
  const sameDay = new Date(startsAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) === new Date(endsAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return sameDay ? `${formatDate(startsAt)} · ${start}–${formatTime(endsAt)}` : `${formatDateTime(startsAt)} até ${formatDateTime(endsAt)}`;
}
function localDateTimeToIso(value: string) { return new Date(value).toISOString(); }
function formatRelative(value: string) { return formatDateTime(value); }
function saoPauloDay(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Sao_Paulo" }).formatToParts(value);
  const number = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(number("year"), number("month") - 1, number("day"));
}
function formatDue(value: string | null) { if (!value) return "Sem prazo"; const days = Math.round((saoPauloDay(new Date(value)) - saoPauloDay(new Date())) / 86400000); if (days === 0) return `Hoje, ${formatTime(value)}`; if (days === 1) return "Amanhã"; if (days === -1) return "Ontem"; return formatDate(value); }
function formatSize(size: number) { return size >= 1_000_000 ? `${(size / 1_000_000).toFixed(1)} MB` : `${Math.round(size / 1000)} KB`; }
function sameDepartment(first: string, second: string) { return first.trim().toLocaleLowerCase("pt-BR") === second.trim().toLocaleLowerCase("pt-BR"); }
function normalizeTicketStatus(status: string): TicketStatus {
  if (status === "Em produção") return "Em execução";
  if (status === "Finalizado") return "Concluído";
  return statuses.includes(status as TicketStatus) ? status as TicketStatus : "Recebido";
}
function normalizeText(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function backfillExecutiveUsers(items: User[]) {
  return items
    .filter((user) => user.id !== "u-rodrigo")
    .map((user) => user.id === "u-prefeito"
      ? { ...user, fullName: "Rodrigo Aguiar Dalla Bernardina", department: "Gabinete do Prefeito", role: "Prefeito", initials: "RB" }
      : user.id === "u-vice"
        ? { ...user, fullName: "Jaime de Souza", department: "Gabinete do Prefeito", role: "Vice-prefeito", initials: "JS" }
        : user);
}

function isExecutiveAccess(user: User) { const role = normalizeText(user.role).replaceAll(" ", "-"); return role === "prefeito" || role === "vice-prefeito"; }
function isSectorManager(user: User) { return !normalizeText(user.role).includes("funcionario"); }
function makeInitials(fullName: string) { const names = fullName.trim().split(/\s+/).filter(Boolean); return `${names[0]?.[0] ?? ""}${names.length > 1 ? names[names.length - 1]?.[0] ?? "" : names[0]?.[1] ?? ""}`.toUpperCase(); }
function isMayor(user: User) { return normalizeText(user.role).trim() === "prefeito"; }
function directParticipants(conversationId: string) { return conversationId.split("::").filter(Boolean); }
function messageVisibleToUser(message: Message, userId: string, groups: Group[]) {
  if (message.conversationType === "direct") return directParticipants(message.conversationId).includes(userId);
  return Boolean(groups.find((group) => group.id === message.conversationId)?.memberUserIds?.includes(userId));
}
function groupConfinedToDepartment(group: Group, department: string, users: User[]) {
  const participantIds = Array.from(new Set([...(group.memberUserIds ?? []), ...(group.pendingUserIds ?? [])]));
  return participantIds.length > 0 && participantIds.every((userId) => users.some((user) => user.id === userId && sameDepartment(user.department, department)));
}
function messageConfinedToDepartment(message: Message, department: string, users: User[], groups: Group[]) {
  if (message.conversationType === "direct") {
    const participantIds = directParticipants(message.conversationId);
    return participantIds.length > 0 && participantIds.every((userId) => users.some((user) => user.id === userId && sameDepartment(user.department, department)));
  }
  const group = groups.find((item) => item.id === message.conversationId);
  return Boolean(group && groupConfinedToDepartment(group, department, users));
}

function directConversationId(firstUserId: string, secondUserId: string) { return [firstUserId, secondUserId].sort().join("::"); }
function fileBadge(name: string) { const extension = name.split(".").pop()?.toUpperCase() ?? "DOC"; return extension.slice(0, 4); }
function makeId() { return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
