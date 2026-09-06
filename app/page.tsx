"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BellRing,
  BriefcaseBusiness,
  Bus,
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
  FileSearch,
  Files,
  Gauge,
  Hash,
  HelpCircle,
  History,
  Inbox,
  Landmark,
  Layers3,
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
  Newspaper,
  Paperclip,
  PanelsTopLeft,
  Pencil,
  Plus,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
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
} from "./site-icons";
import type { LucideIcon } from "./site-icons";
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
import { MobileBottomNavigation, OnboardingTour, QuickActionDock } from "./platform-experience";
import { ContextualAiBar, DashboardAiBrief, MunicipalAiCopilot } from "./municipal-ai-copilot";
import { PrefeituraNewsSection } from "./prefeitura-news";
import { ExecutiveCommandCenter } from "./executive-command-center";
import { ExecutiveSocialMonitor } from "./executive-social-monitor";
import { FleetMileageSection } from "./fleet-mileage";
import type { MunicipalAgentAction, MunicipalAgentExecutionResult } from "./municipal-agent-types";

type TicketStatus = "Recebido" | "Em análise" | "Aguardando aprovação" | "Em execução" | "Aguardando resposta" | "Concluído" | "Cancelado";
type Priority = "Urgente" | "Alta" | "Média" | "Baixa";
type NavItem = PermissionModule | "Central Executiva" | "Monitoramento Instagram" | "Funcionários" | "Configurações" | "Últimas Notícias Prefeitura";
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
  { id: "t-190", protocol: "CH-2026-0190", title: "Consolidar prioridades de Várzea da Palma", description: "Reunir pontos críticos da sede e da Barra do Guaicuí para preparar a reunião do secretariado municipal.", requester: "Gabinete do Prefeito", department: "Secretaria de Governo", priority: "Alta", status: "Recebido", dueDate: "2026-08-14T16:00:00.000Z", assigneeId: "u-ana", assigneeName: "Artur Paulo Fagundes Rabelo", assigneeInitials: "AR", neighborhood: "Pinlar I", address: "Rua Cláudio Manoel da Costa, 1000 — Várzea da Palma/MG", createdAt: "2026-08-13T15:05:00.000Z", updatedAt: "2026-08-13T15:05:00.000Z" },
  { id: "t-189", protocol: "CH-2026-0189", title: "Revisar comunicado de serviços de Várzea da Palma", description: "Validar horários, endereços e contatos municipais antes da publicação nos canais oficiais.", requester: "Secretaria de Comunicação e Eventos", department: "Secretaria de Governo", priority: "Média", status: "Em análise", dueDate: "2026-08-14T18:00:00.000Z", assigneeId: "u-mariana", assigneeName: "Mariana Castro", assigneeInitials: "MC", neighborhood: "Pinlar I", address: "Rua Cláudio Manoel da Costa, 1000 — Várzea da Palma/MG", createdAt: "2026-08-13T13:20:00.000Z", updatedAt: "2026-08-13T15:12:00.000Z" },
  { id: "t-188", protocol: "CH-2026-0188", title: "Validar audiência pública no Paço Municipal", description: "Conferir responsáveis, acessibilidade, pauta e divulgação do encontro no Pinlar I.", requester: "Assessoria do Gabinete", department: "Secretaria de Governo", priority: "Média", status: "Aguardando aprovação", dueDate: "2026-08-15T17:00:00.000Z", assigneeId: "u-andre", assigneeName: "André Lima", assigneeInitials: "AL", neighborhood: "Pinlar I", address: "Rua Cláudio Manoel da Costa, 1000 — Várzea da Palma/MG", createdAt: "2026-08-12T16:00:00.000Z", updatedAt: "2026-08-13T14:48:00.000Z" },
  { id: "t-187", protocol: "CH-2026-0187", title: "Iluminação no entorno da Estação Ferroviária", description: "Substituir luminárias e revisar o quadro elétrico no equipamento cultural do Centro.", requester: "Ouvidoria Municipal", department: "Secretaria de Infraestrutura e Transporte", priority: "Alta", status: "Em execução", dueDate: "2026-08-13T19:00:00.000Z", assigneeId: "u-rafael", assigneeName: "Bruno Gonçalves da Fonseca", assigneeInitials: "BF", neighborhood: "Centro", address: "Estação Ferroviária — Centro — Várzea da Palma/MG", createdAt: "2026-08-13T10:00:00.000Z", updatedAt: "2026-08-13T14:36:00.000Z" },
  { id: "t-186", protocol: "CH-2026-0186", title: "Calendário de vacinação na sede e em Guaicuí", description: "Validar datas, pontos de atendimento e comunicação da campanha em Várzea da Palma e Barra do Guaicuí.", requester: "Gabinete do Prefeito", department: "Secretaria de Saúde", priority: "Média", status: "Aguardando aprovação", dueDate: "2026-08-14T18:00:00.000Z", assigneeId: "u-lucas", assigneeName: "Natália Cristina Pedrosa Cabral", assigneeInitials: "NC", neighborhood: "Planalto", address: "Rua Reinaldo Rodrigues, 305 — Várzea da Palma/MG", createdAt: "2026-08-12T13:00:00.000Z", updatedAt: "2026-08-13T14:52:00.000Z" },
  { id: "t-185", protocol: "CH-2026-0185", title: "Transporte escolar — Barra do Guaicuí", description: "Revisar itinerários do distrito antes da volta às aulas da rede municipal.", requester: "Secretaria de Educação", department: "Secretaria de Educação", priority: "Alta", status: "Recebido", dueDate: "2026-08-15T18:00:00.000Z", assigneeId: "u-amanda", assigneeName: "Leila Cibeli Silveira Mendes", assigneeInitials: "LM", neighborhood: "Barra do Guaicuí", address: "Rua S. Pedro, 40 — Guaicuí — Várzea da Palma/MG", createdAt: "2026-08-12T11:00:00.000Z", updatedAt: "2026-08-12T11:00:00.000Z" },
  { id: "t-184", protocol: "CH-2026-0184", title: "Parecer sobre contratação emergencial", description: "Análise administrativa concluída.", requester: "Secretaria de Governo", department: "Secretaria de Administração e Finanças", priority: "Baixa", status: "Concluído", dueDate: "2026-08-12T18:00:00.000Z", assigneeId: "u-carla", assigneeName: "Jaime de Souza", assigneeInitials: "JS", neighborhood: "Pinlar I", address: "Rua Cláudio Manoel da Costa, 1000", createdAt: "2026-08-10T09:00:00.000Z", updatedAt: "2026-08-13T12:00:00.000Z" },
  { id: "t-183", protocol: "CH-2026-0183", title: "Feira da agricultura familiar de Várzea da Palma", description: "Avaliar a estrutura e a autorização de uso para produtores da sede e da Barra do Guaicuí.", requester: "Gabinete do Prefeito", department: "Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente", priority: "Média", status: "Em execução", dueDate: "2026-08-16T18:00:00.000Z", assigneeId: "u-felipe", assigneeName: "Lucas Fontinelli de Oliveira da Silva", assigneeInitials: "LS", neighborhood: "Centro", address: "Rua Pedro Rodrigues de Menezes, 1474 — Várzea da Palma/MG", createdAt: "2026-08-11T15:00:00.000Z", updatedAt: "2026-08-13T11:00:00.000Z" },
];

const TICKET_LOCATION_DEFAULTS: Record<string,{address:string;neighborhood:string}> = {
  "t-190": { address: "Rua Cláudio Manoel da Costa, 1000", neighborhood: "Pinlar I" },
  "t-189": { address: "Rua Cláudio Manoel da Costa, 1000", neighborhood: "Pinlar I" },
  "t-188": { address: "Rua Cláudio Manoel da Costa, 1000", neighborhood: "Pinlar I" },
  "t-187": { address: "Estação Ferroviária — Centro — Várzea da Palma/MG", neighborhood: "Centro" },
  "t-186": { address: "Rua Reinaldo Rodrigues, 305", neighborhood: "Planalto" },
  "t-185": { address: "Rua S. Pedro, 40 — Guaicuí — Várzea da Palma/MG", neighborhood: "Barra do Guaicuí" },
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

function sectorChannelId(department: string) {
  return `g-setor-${normalizeText(department).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function buildSectorChannelGroups(items: User[]) {
  const activeUsers = items.filter((user) => (user.accountStatus ?? "Ativo") === "Ativo");
  const departments = Array.from(new Set(activeUsers.map((user) => user.department)));
  return departments.map((department) => {
    const memberUserIds = activeUsers.filter((user) => sameDepartment(user.department, department)).map((user) => user.id);
    return {
      id: sectorChannelId(department),
      name: `Equipe · ${department}`,
      description: `Canal interno exclusivo de ${department}.`,
      memberCount: memberUserIds.length,
      createdAt: "2026-08-13T09:00:00.000Z",
      memberUserIds,
      pendingUserIds: [],
    } satisfies Group;
  });
}

function buildSectorWelcomeMessages(items: User[]) {
  return buildSectorChannelGroups(items).flatMap((group, index) => {
    const members = items.filter((user) => group.memberUserIds?.includes(user.id));
    const sender = members[0];
    if (!sender) return [];
    const welcome: Message = {
      id: `m-${group.id}-boas-vindas`,
      conversationType: "group",
      conversationId: group.id,
      senderId: sender.id,
      senderName: sender.fullName,
      senderInitials: sender.initials,
      body: `Canal interno de ${sender.department}. Use este espaço para alinhar demandas, documentos e chamados somente com a equipe do setor.`,
      createdAt: `2026-08-13T09:${String(index % 50).padStart(2, "0")}:00.000Z`,
    };
    const recipient = members[1];
    if (!recipient) return [welcome];
    const directWelcome: Message = {
      id: `m-${group.id}-direta`,
      conversationType: "direct",
      conversationId: directConversationId(sender.id, recipient.id),
      senderId: sender.id,
      senderName: sender.fullName,
      senderInitials: sender.initials,
      body: `A comunicação direta da equipe de ${sender.department} está disponível e permanece restrita ao setor.`,
      createdAt: `2026-08-13T10:${String(index % 50).padStart(2, "0")}:00.000Z`,
    };
    return [welcome, directWelcome];
  });
}

function restoreSectorGroups(items: Group[], users: User[]) {
  const channels = buildSectorChannelGroups(users);
  const channelIds = new Set(channels.map((group) => group.id));
  return [...channels, ...items.filter((group) => !channelIds.has(group.id) && !group.id.startsWith("g-setor-"))];
}

function restoreSectorMessages(items: Message[], users: User[]) {
  const welcomeMessages = buildSectorWelcomeMessages(users);
  const welcomeIds = new Set(welcomeMessages.map((message) => message.id));
  return [...welcomeMessages, ...items.filter((message) => !welcomeIds.has(message.id))];
}

const INITIAL_GROUPS: Group[] = [
  { id: "g-volta-aulas", name: "Volta às Aulas — Várzea da Palma 2026", description: "Educação e transporte escolar da sede e da Barra do Guaicuí", memberCount: 3, createdAt: "2026-08-13T14:00:00.000Z", memberUserIds: ["u-ana", "u-amanda"], pendingUserIds: ["u-rafael"] },
  { id: "g-centro", name: "Entorno da Estação Ferroviária", description: "Obras, cultura e comunicação institucional de Várzea da Palma", memberCount: 3, createdAt: "2026-08-11T10:00:00.000Z", memberUserIds: ["u-ana", "u-rafael", "u-carla"], pendingUserIds: [] },
  { id: "g-saude-digital", name: "Saúde Digital — Várzea da Palma", description: "Integração dos atendimentos e sistemas da rede municipal.", memberCount: 1, createdAt: "2026-08-13T14:45:00.000Z", memberUserIds: ["u-lucas"], pendingUserIds: ["u-ana"] },
  ...buildSectorChannelGroups(USERS),
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "n-governo-aprovacao", userId: "u-ana", type: "ticket", title: "Cronograma pronto para aprovação", body: "André Lima concluiu a conferência do chamado CH-2026-0188.", relatedEntityId: "t-188", readAt: null, createdAt: "2026-08-13T14:48:00.000Z", actorName: "André Lima", actorInitials: "AL" },
  { id: "n-convite-saude", userId: "u-ana", type: "group_invite", title: "Novo convite para grupo", body: "Natália Cristina Pedrosa Cabral convidou você para Saúde Digital — Várzea da Palma.", relatedEntityId: "g-saude-digital", readAt: null, createdAt: "2026-08-13T14:45:00.000Z", actorName: "Natália Cristina Pedrosa Cabral", actorInitials: "NC" },
  { id: "n-convite-volta-aulas", userId: "u-rafael", type: "group_invite", title: "Novo convite para grupo", body: "Leila Cibeli Silveira Mendes convidou você para Volta às Aulas — Várzea da Palma 2026.", relatedEntityId: "g-volta-aulas", readAt: null, createdAt: "2026-08-13T14:00:00.000Z", actorName: "Leila Cibeli Silveira Mendes", actorInitials: "LM" },
  { id: "n-aprovacao", userId: "u-ana", type: "ticket", title: "Chamado aguardando aprovação", body: "O chamado CH-2026-0186 está pronto para sua análise.", relatedEntityId: "t-186", readAt: null, createdAt: "2026-08-13T14:52:00.000Z", actorName: "Natália Cristina Pedrosa Cabral", actorInitials: "NC" },
  { id: "n-documento", userId: "u-ana", type: "message", title: "Documento recebido", body: "Bruno Gonçalves da Fonseca enviou o Relatório técnico — Iluminação.pdf.", relatedEntityId: "m-3", readAt: "2026-08-13T14:40:00.000Z", createdAt: "2026-08-13T14:36:00.000Z", actorName: "Bruno Gonçalves da Fonseca", actorInitials: "BF" },
];

const INITIAL_INVITATIONS: GroupInvitation[] = [
  { groupId: "g-saude-digital", userId: "u-ana", groupName: "Saúde Digital — Várzea da Palma", description: "Integração dos atendimentos e sistemas da rede municipal.", invitedByName: "Natália Cristina Pedrosa Cabral", invitedByInitials: "NC", memberCount: 1, status: "convidado", createdAt: "2026-08-13T14:45:00.000Z" },
  { groupId: "g-volta-aulas", userId: "u-rafael", groupName: "Volta às Aulas — Várzea da Palma 2026", description: "Educação e transporte escolar da sede e da Barra do Guaicuí", invitedByName: "Leila Cibeli Silveira Mendes", invitedByInitials: "LM", memberCount: 2, status: "convidado", createdAt: "2026-08-13T14:00:00.000Z" },
];

const INITIAL_MESSAGES: Message[] = [
  { id: "m-gov-1", conversationType: "direct", conversationId: "u-ana::u-mariana", senderId: "u-mariana", senderName: "Mariana Castro", senderInitials: "MC", body: "Revisei o comunicado e sinalizei dois trechos que ainda precisam de confirmação.", ticketId: "t-189", createdAt: "2026-08-13T15:12:00.000Z" },
  { id: "m-gov-2", conversationType: "direct", conversationId: "u-ana::u-andre", senderId: "u-andre", senderName: "André Lima", senderInitials: "AL", body: "O cronograma da audiência está pronto para sua aprovação.", ticketId: "t-188", createdAt: "2026-08-13T14:48:00.000Z" },
  { id: "m-1", conversationType: "direct", conversationId: "u-ana::u-rafael", senderId: "u-rafael", senderName: "Bruno Gonçalves da Fonseca", senderInitials: "BF", body: "Bom dia, Artur. A equipe já iniciou a vistoria no entorno da Estação Ferroviária.", ticketId: "t-187", createdAt: "2026-08-13T14:20:00.000Z" },
  { id: "m-2", conversationType: "direct", conversationId: "u-ana::u-rafael", senderId: "u-ana", senderName: "Artur Paulo Fagundes Rabelo", senderInitials: "AR", body: "Ótimo. Por favor, envie o relatório técnico assim que estiver pronto.", ticketId: "t-187", createdAt: "2026-08-13T14:24:00.000Z" },
  { id: "m-3", conversationType: "direct", conversationId: "u-ana::u-rafael", senderId: "u-rafael", senderName: "Bruno Gonçalves da Fonseca", senderInitials: "BF", body: "Segue a primeira versão para conferência.", attachmentId: "d-1", attachmentName: "Relatório técnico — Iluminação.pdf", attachmentSize: 2480000, attachmentContentType: "application/pdf", ticketId: "t-187", createdAt: "2026-08-13T14:36:00.000Z" },
  { id: "m-4", conversationType: "group", conversationId: "g-volta-aulas", senderId: "u-amanda", senderName: "Leila Cibeli Silveira Mendes", senderInitials: "LM", body: "Incluí a planilha com os novos itinerários. Precisamos da validação até amanhã.", ticketId: "t-185", createdAt: "2026-08-13T14:10:00.000Z" },
  ...buildSectorWelcomeMessages(USERS),
];

const INITIAL_DOCS: DocumentItem[] = [
  { id: "d-1", name: "Relatório técnico — Iluminação.pdf", category: "Relatório técnico", ownerId: "u-rafael", ownerName: "Bruno Gonçalves da Fonseca", department: "Secretaria de Infraestrutura e Transporte", ticketId: "t-187", contentType: "application/pdf", size: 2480000, createdAt: "2026-08-13T14:36:00.000Z" },
  { id: "d-2", name: "Itinerários escolares — Barra do Guaicuí.xlsx", category: "Planilha", ownerId: "u-amanda", ownerName: "Leila Cibeli Silveira Mendes", department: "Secretaria de Educação", ticketId: "t-185", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 840000, createdAt: "2026-08-13T14:10:00.000Z" },
  { id: "d-3", name: "Planejamento semanal do gabinete.pdf", category: "Planejamento", ownerId: "u-ana", ownerName: "Artur Paulo Fagundes Rabelo", department: "Secretaria de Governo", contentType: "application/pdf", size: 620000, createdAt: "2026-08-13T12:00:00.000Z" },
];

const INITIAL_EVENTS: SectorEvent[] = [
  { id: "e-governo-1", title: "Reunião de prioridades de Várzea da Palma", description: "Revisão das prioridades e dos chamados da sede e da Barra do Guaicuí.", department: "Secretaria de Governo", targetDepartments: ["Secretaria de Governo", "Gabinete do Prefeito"], location: "Paço Municipal — Rua Cláudio Manoel da Costa, 1000 — Pinlar I", startsAt: "2026-08-14T12:30:00.000Z", endsAt: "2026-08-14T13:30:00.000Z", createdBy: "u-ana", creatorName: "Artur Paulo Fagundes Rabelo", creatorInitials: "AR", createdAt: "2026-08-13T12:00:00.000Z" },
  { id: "e-governo-2", title: "Despacho com chefias municipais", description: "Consolidação das demandas de Várzea da Palma para a próxima semana.", department: "Secretaria de Governo", targetDepartments: ["Secretaria de Governo", "Secretaria de Administração e Finanças", "Secretaria de Infraestrutura e Transporte", "Secretaria de Saúde", "Secretaria de Educação"], location: "Paço Municipal — Pinlar I — Várzea da Palma/MG", startsAt: "2026-08-17T13:00:00.000Z", endsAt: "2026-08-17T14:30:00.000Z", createdBy: "u-ana", creatorName: "Artur Paulo Fagundes Rabelo", creatorInitials: "AR", createdAt: "2026-08-13T12:30:00.000Z" },
  { id: "e-saude-1", title: "Vacinação na sede e na Barra do Guaicuí", description: "Validação final do calendário e dos pontos de atendimento municipais.", department: "Secretaria de Saúde", targetDepartments: ["Secretaria de Saúde", "Secretaria de Comunicação e Eventos"], location: "Secretaria Municipal de Saúde — Rua Reinaldo Rodrigues, 305 — Planalto", startsAt: "2026-08-15T12:00:00.000Z", endsAt: null, createdBy: "u-lucas", creatorName: "Natália Cristina Pedrosa Cabral", creatorInitials: "NC", createdAt: "2026-08-13T13:00:00.000Z" },
];

const INITIAL_AUDIT: AuditItem[] = [
  { id: "a-gov-1", action: "status_atualizado", entityType: "chamado", entityId: "t-188", detail: "Cronograma da audiência movido para Aguardando aprovação", createdAt: "2026-08-13T14:48:00.000Z", actorName: "André Lima", actorInitials: "AL" },
  { id: "a-gov-2", action: "chamado_criado", entityType: "chamado", entityId: "t-190", detail: "Prioridades de Várzea da Palma registradas para a reunião do secretariado", createdAt: "2026-08-13T15:05:00.000Z", actorName: "Artur Paulo Fagundes Rabelo", actorInitials: "AR" },
  { id: "a-1", action: "status_atualizado", entityType: "chamado", entityId: "t-186", detail: "Calendário de vacinação movido para Aguardando aprovação", createdAt: "2026-08-13T14:52:00.000Z", actorName: "Natália Cristina Pedrosa Cabral", actorInitials: "NC" },
  { id: "a-2", action: "documento_enviado", entityType: "mensagem", entityId: "m-3", detail: "Relatório técnico — Iluminação.pdf enviado no chat", createdAt: "2026-08-13T14:36:00.000Z", actorName: "Bruno Gonçalves da Fonseca", actorInitials: "BF" },
  { id: "a-3", action: "grupo_criado", entityType: "grupo", entityId: "g-volta-aulas", detail: "Grupo Volta às Aulas — Várzea da Palma 2026 criado", createdAt: "2026-08-13T14:00:00.000Z", actorName: "Leila Cibeli Silveira Mendes", actorInitials: "LM" },
  { id: "a-4", action: "chamado_finalizado", entityType: "chamado", entityId: "t-184", detail: "Parecer sobre contratação emergencial finalizado", createdAt: "2026-08-13T12:00:00.000Z", actorName: "Jaime de Souza", actorInitials: "JS" },
];

const navIcons: Record<NavItem, LucideIcon> = {
  "Visão geral": LayoutDashboard,
  "Central Executiva": Crown,
  "Monitoramento Instagram": ActivityIcon,
  "Área do Setor": BriefcaseBusiness,
  "Fluxos e Anotações": Workflow,
  Chamados: ClipboardList,
  Comunicação: MessagesSquare,
  "Atendimento ao Cidadão": HelpCircle,
  "Central Integrada": Layers3,
  "Processos Digitais": FileText,
  "Gestão Municipal": Landmark,
  "Frota e Quilometragem": Bus,
  Indicadores: BarChart3,
  Notificações: BellRing,
  Pendências: ListTodo,
  "Anexos e Arquivos": Files,
  "Próximos Eventos": CalendarDays,
  Funcionários: UsersRound,
  Secretarias: Building2,
  "Segurança e LGPD": ShieldCheck,
  Auditoria: FileSearch,
  "Central de Ajuda": HelpCircle,
  Configurações: Settings,
  "Últimas Notícias Prefeitura": Newspaper,
};
const statusMeta: Record<TicketStatus, { color: string; short: string; icon: LucideIcon; description: string }> = {
  Recebido: { color: "blue", short: "Recebido", icon: Inbox, description: "Registro recebido e aguardando triagem." },
  "Em análise": { color: "slate", short: "Em análise", icon: Search, description: "Equipe conferindo dados e encaminhamento." },
  "Aguardando aprovação": { color: "violet", short: "Em aprovação", icon: Clock3, description: "Decisão do responsável ainda necessária." },
  "Em execução": { color: "amber", short: "Em execução", icon: LoaderCircle, description: "Providências em andamento pela equipe." },
  "Aguardando resposta": { color: "orange", short: "Aguardando resposta", icon: MessagesSquare, description: "Retorno externo ou do solicitante pendente." },
  Concluído: { color: "green", short: "Concluído", icon: CheckCircle2, description: "Entrega registrada e atendimento finalizado." },
  Cancelado: { color: "red", short: "Cancelado", icon: XCircle, description: "Fluxo encerrado sem execução." },
};
const statuses = Object.keys(statusMeta) as TicketStatus[];
const APP_STATE_KEY = "app:global:v1";
const PERMISSION_SETTINGS_KEY = "settings:permissions:v1";
const EXPERIENCE_SETTINGS_KEY = "settings:experience:v1";
const EXECUTIVE_COMMUNICATION_KEY = "settings:executive-communication:v1";
const PUBLIC_READ_PERMISSION = { view: true, register: false, edit: false } as const;
const PRODUCT_VERSION = "8.0.0";

const breadcrumbParentByNav: Partial<Record<NavItem, NavItem>> = {
  "Central Executiva": "Visão geral",
  "Monitoramento Instagram": "Central Executiva",
  "Últimas Notícias Prefeitura": "Visão geral",
  "Área do Setor": "Visão geral",
  "Fluxos e Anotações": "Área do Setor",
  Chamados: "Área do Setor",
  Comunicação: "Área do Setor",
  "Atendimento ao Cidadão": "Gestão Municipal",
  "Central Integrada": "Área do Setor",
  "Processos Digitais": "Gestão Municipal",
  "Gestão Municipal": "Visão geral",
  "Frota e Quilometragem": "Gestão Municipal",
  Indicadores: "Visão geral",
  Notificações: "Visão geral",
  Pendências: "Visão geral",
  "Anexos e Arquivos": "Área do Setor",
  "Próximos Eventos": "Área do Setor",
  Funcionários: "Área do Setor",
  Secretarias: "Gestão Municipal",
  "Segurança e LGPD": "Configurações",
  Auditoria: "Segurança e LGPD",
  "Central de Ajuda": "Visão geral",
  Configurações: "Visão geral",
};

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavItem>("Visão geral");
  const [authState, setAuthState] = useState<"checking" | "login" | "authenticated">("checking");
  const [clockNow, setClockNow] = useState(() => new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNavGroup, setExpandedNavGroup] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("u-prefeito");
  const [viewedDepartment, setViewedDepartment] = useState("Gabinete do Prefeito");
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
  const [contrastEnabled, setContrastEnabled] = useState(false);
  const [textScale, setTextScale] = useState<"normal" | "large" | "larger">("normal");
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [favoriteModules, setFavoriteModules] = useState<NavItem[]>(["Chamados", "Próximos Eventos"]);
  const [recentModules, setRecentModules] = useState<NavItem[]>([]);
  const [executiveCommunicationAccess, setExecutiveCommunicationAccess] = useState(false);
  const [recentlyDeletedEvent, setRecentlyDeletedEvent] = useState<SectorEvent | null>(null);
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
  const municipalOpenTickets = ticketData.filter((ticket) => ticket.status !== "Concluído" && ticket.status !== "Cancelado");
  const municipalOverdueTickets = municipalOpenTickets.filter((ticket) => ticket.dueDate && new Date(ticket.dueDate).getTime() < clockNow.getTime());
  const executiveMunicipalSummary = {
    total: ticketData.length,
    open: municipalOpenTickets.length,
    overdue: municipalOverdueTickets.length,
    riskSectors: new Set(municipalOverdueTickets.map((ticket) => ticket.department)).size,
    awaitingDecision: municipalOpenTickets.filter((ticket) => ticket.status === "Aguardando aprovação" || ticket.status === "Aguardando resposta").length,
    completionRate: ticketData.length ? Math.round(ticketData.filter((ticket) => ticket.status === "Concluído").length / ticketData.length * 100) : 100,
  };
  const privateTicketIds = new Set(privateTickets.map((ticket) => ticket.id));
  const privateDocuments = documents.filter((document) => sameDepartment(document.department, activeDepartment));
  const privateDocumentIds = new Set(privateDocuments.map((document) => document.id));
  const currentEvents = events
    .filter((event) => (event.targetDepartments?.length ? event.targetDepartments : [event.department]).some((department) => sameDepartment(department, activeDepartment)))
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());
  const currentEventIds = new Set(currentEvents.map((event) => event.id));
  const ownCommunicationMessages = messages.filter((message) => messageVisibleToUser(message, currentUserId, groups) && messageAllowedInCommunication(message, activeDepartment, users, groups));
  const viewingOtherDepartment = executiveAccess && !sameDepartment(activeDepartment, currentUser.department);
  const executiveReadOnlyScope = executiveAccess && (activeNav === "Central Executiva" || activeNav === "Monitoramento Instagram" || viewingOtherDepartment);
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
  const canManageEmployees = isSectorManager(currentUser) && !viewingOtherDepartment;
  const sectorUsers = users.filter((user) => sameDepartment(user.department, activeDepartment));
  const scopedActiveUsers = activeUsers.filter((user) => sameDepartment(user.department, activeDepartment));
  const communicationDirectoryUsers = activeUsers.filter((user) => sameDepartment(user.department, activeDepartment) || (isSectorManager(currentUser) && isSectorManager(user)));
  const scopedOffices = OFFICES.filter((office) => sameDepartment(office.name, activeDepartment));
  const availableDepartments = executiveAccess && !viewingOtherDepartment ? allDepartments : [activeDepartment];
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
  const currentPermission = activeNav === "Central Executiva" || activeNav === "Monitoramento Instagram"
    ? executiveAccess ? PUBLIC_READ_PERMISSION : NO_PERMISSION
    : activeNav === "Últimas Notícias Prefeitura"
    ? PUBLIC_READ_PERMISSION
    : viewingOtherDepartment
    ? PUBLIC_READ_PERMISSION
    : activeNav === "Funcionários" || activeNav === "Configurações"
    ? canManageEmployees ? FULL_PERMISSION : NO_PERMISSION
    : permissionFor(activeNav, canManageEmployees, currentUser.id, departmentPermissionSettings);
  const ticketPermission = viewingOtherDepartment ? PUBLIC_READ_PERMISSION : permissionFor("Chamados", canManageEmployees, currentUser.id, departmentPermissionSettings);
  const eventPermission = viewingOtherDepartment ? PUBLIC_READ_PERMISSION : permissionFor("Próximos Eventos", canManageEmployees, currentUser.id, departmentPermissionSettings);
  const communicationPermission = viewingOtherDepartment ? PUBLIC_READ_PERMISSION : permissionFor("Comunicação", canManageEmployees, currentUser.id, departmentPermissionSettings);

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
    if (!recentlyDeletedEvent) return;
    const timer = window.setTimeout(() => setRecentlyDeletedEvent(null), 10000);
    return () => window.clearTimeout(timer);
  }, [recentlyDeletedEvent]);

  useEffect(() => {
    if (authState !== "authenticated") return;
    let cancelled = false;
    setPersistenceStatus("carregando");
    void Promise.all([
      loadPersistentValue<{ soundEnabled?: boolean; motionEnabled?: boolean; contrastEnabled?: boolean; textScale?: "normal" | "large" | "larger"; simplifiedMode?: boolean; sidebarCompact?: boolean; favoriteModules?: NavItem[]; recentModules?: NavItem[] }>(EXPERIENCE_SETTINGS_KEY),
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
      if (typeof experience?.contrastEnabled === "boolean") setContrastEnabled(experience.contrastEnabled);
      if (experience?.textScale === "normal" || experience?.textScale === "large" || experience?.textScale === "larger") setTextScale(experience.textScale);
      if (typeof experience?.simplifiedMode === "boolean") setSimplifiedMode(experience.simplifiedMode);
      if (typeof experience?.sidebarCompact === "boolean") setSidebarCompact(experience.sidebarCompact);
      if (Array.isArray(experience?.favoriteModules)) setFavoriteModules(experience.favoriteModules.filter((item) => Object.hasOwn(navIcons, item)));
      if (Array.isArray(experience?.recentModules)) setRecentModules(experience.recentModules.filter((item) => Object.hasOwn(navIcons, item)));
      setExecutiveCommunicationAccess(executiveCommunication?.enabled === true);
      if (savedPermissions) setPermissionConfigs(savedPermissions);
      if (stored) {
        const restoredUsers = Array.isArray(stored.users) ? restoreRegisteredUsers(stored.users) : users;
        if (Array.isArray(stored.ticketData)) setTicketData(backfillTicketLocations(stored.ticketData));
        if (Array.isArray(stored.users)) setUsers(restoredUsers);
        setGroups(restoreSectorGroups(Array.isArray(stored.groups) ? stored.groups : INITIAL_GROUPS, restoredUsers));
        setMessages(restoreSectorMessages(Array.isArray(stored.messages) ? stored.messages : INITIAL_MESSAGES, restoredUsers));
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
      const cachedExperience = loadCachedPersistentValue<{ soundEnabled?: boolean; motionEnabled?: boolean; contrastEnabled?: boolean; textScale?: "normal" | "large" | "larger"; simplifiedMode?: boolean; sidebarCompact?: boolean; favoriteModules?: NavItem[]; recentModules?: NavItem[] }>(EXPERIENCE_SETTINGS_KEY);
      const cachedExecutive = loadCachedPersistentValue<{ enabled?: boolean }>(EXECUTIVE_COMMUNICATION_KEY);
      const cachedPermissions = loadCachedPersistentValue<Record<string, DepartmentPermissionSettings>>(PERMISSION_SETTINGS_KEY);
      const cached = loadCachedPersistentValue<{
        ticketData?: Ticket[]; users?: User[]; groups?: Group[]; messages?: Message[]; documents?: DocumentItem[];
        events?: SectorEvent[]; audit?: AuditItem[]; notifications?: NotificationItem[]; invitations?: GroupInvitation[];
      }>(APP_STATE_KEY);
      if (typeof cachedExperience?.soundEnabled === "boolean") setSoundEnabled(cachedExperience.soundEnabled);
      if (typeof cachedExperience?.motionEnabled === "boolean") setMotionEnabled(cachedExperience.motionEnabled);
      if (typeof cachedExperience?.contrastEnabled === "boolean") setContrastEnabled(cachedExperience.contrastEnabled);
      if (cachedExperience?.textScale === "normal" || cachedExperience?.textScale === "large" || cachedExperience?.textScale === "larger") setTextScale(cachedExperience.textScale);
      if (typeof cachedExperience?.simplifiedMode === "boolean") setSimplifiedMode(cachedExperience.simplifiedMode);
      if (typeof cachedExperience?.sidebarCompact === "boolean") setSidebarCompact(cachedExperience.sidebarCompact);
      if (Array.isArray(cachedExperience?.favoriteModules)) setFavoriteModules(cachedExperience.favoriteModules.filter((item) => Object.hasOwn(navIcons, item)));
      if (Array.isArray(cachedExperience?.recentModules)) setRecentModules(cachedExperience.recentModules.filter((item) => Object.hasOwn(navIcons, item)));
      if (cachedExecutive) setExecutiveCommunicationAccess(cachedExecutive.enabled === true);
      if (cachedPermissions) setPermissionConfigs(cachedPermissions);
      if (cached) {
        const restoredUsers = Array.isArray(cached.users) ? restoreRegisteredUsers(cached.users) : users;
        if (Array.isArray(cached.ticketData)) setTicketData(backfillTicketLocations(cached.ticketData));
        if (Array.isArray(cached.users)) setUsers(restoredUsers);
        setGroups(restoreSectorGroups(Array.isArray(cached.groups) ? cached.groups : INITIAL_GROUPS, restoredUsers));
        setMessages(restoreSectorMessages(Array.isArray(cached.messages) ? cached.messages : INITIAL_MESSAGES, restoredUsers));
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
      void savePersistentValue(EXPERIENCE_SETTINGS_KEY, { soundEnabled, motionEnabled, contrastEnabled, textScale, simplifiedMode, sidebarCompact, favoriteModules, recentModules }).then((result) => setPersistenceStatus(result.queued ? "offline" : "salvo")).catch(() => setPersistenceStatus("offline"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [appReady, authState, contrastEnabled, favoriteModules, motionEnabled, recentModules, sidebarCompact, soundEnabled, textScale, simplifiedMode]);

  useEffect(() => {
    if (authState !== "authenticated" || !appReady) return;
    setRecentModules((current) => {
      const next = [activeNav, ...current.filter((item) => item !== activeNav)].slice(0, 5);
      return next.length === current.length && next.every((item, index) => item === current[index]) ? current : next;
    });
  }, [activeNav, appReady, authState]);

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

  function resetScopedUi() {
    setTicketModal(false);
    setGroupModal(false);
    setEventModal(null);
    setEventToDelete(null);
    setEmployeeModal(false);
    setInteractionModal(null);
    setSearch("");
    setSearchOpen(false);
  }

  function switchUser(userId: string) {
    const nextUser = users.find((user) => user.id === userId);
    if (!nextUser) return;
    resetScopedUi();
    setCurrentUserId(userId);
    setViewedDepartment(nextUser.department);
  }

  function switchDepartment(department: string) {
    resetScopedUi();
    setViewedDepartment(department);
  }

  function openExecutiveDepartment(department: string, target: "Chamados" | "Central Integrada") {
    if (!executiveAccess) { notify("A Central Executiva é exclusiva do Prefeito e do Vice-Prefeito."); return; }
    resetScopedUi();
    setViewedDepartment(department);
    setActiveNav(target);
  }

  async function logout() {
    if (!navigator.onLine) { clearOfflineSession(true); window.location.reload(); return; }
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { clearOfflineSession(false); window.location.reload(); }
  }

  async function createTicket(form: FormData) {
    if (executiveReadOnlyScope || !ticketPermission.register) { notify("O modo executivo permite apenas consultar dados consolidados ou de outros setores."); return null; }
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
    if (executiveReadOnlyScope) return { ok:false, message:"O modo de consulta executiva não permite que Prefeito ou Vice-Prefeito alterem dados consolidados ou de outros setores." };
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
    setRecentlyDeletedEvent(item);
    addAudit("evento_excluido", "evento", item.id, `${item.title} removido da agenda`);
    addEventNotifications(item, "cancelado");
    setEventToDelete(null);
    notify("Evento excluído. Você pode desfazer por 10 segundos.");
  }

  function restoreDeletedEvent() {
    if (!recentlyDeletedEvent) return;
    const restored = recentlyDeletedEvent;
    setEvents((current) => current.some((item) => item.id === restored.id) ? current : [...current, restored]);
    addAudit("evento_restaurado", "evento", restored.id, `${restored.title} restaurado após exclusão`);
    setRecentlyDeletedEvent(null);
    notify("Evento restaurado nas agendas autorizadas.");
  }

  function recipientIds(conversationType: ChatTab, conversationId: string, recipientId?: string) {
    if (conversationType === "direct") return recipientId && recipientId !== currentUserId && communicationDirectoryUsers.some((user) => user.id === recipientId) ? [recipientId] : [];
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
    if (!messageAllowedInCommunication(message, activeDepartment, users, groups)) { notify("A mensagem direta só pode ser enviada a colegas do setor ou entre secretários. Os grupos continuam restritos ao setor."); return; }
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
    if (!messageAllowedInCommunication(message, activeDepartment, users, groups)) { URL.revokeObjectURL(localUrl); notify("O documento não pode ser enviado: mensagens diretas são liberadas entre secretários, mas grupos permanecem restritos ao setor."); return false; }
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
  const ActiveModuleIcon = moduleIconForNav(activeNav);

  const canViewMenuItem = (item: NavItem) => {
    if (item === "Central Executiva" || item === "Monitoramento Instagram") return executiveAccess;
    if (item === "Últimas Notícias Prefeitura") return true;
    if (item === "Funcionários" || item === "Configurações") return canManageEmployees;
    if (viewingOtherDepartment) return true;
    return permissionFor(item, canManageEmployees, currentUser.id, departmentPermissionSettings).view;
  };
  const normalizedRole = normalizeText(currentUser.role);
  const managerProfile = executiveAccess || canManageEmployees || normalizedRole.includes("gestor") || normalizedRole.includes("secret");
  const primaryNavItems: NavItem[] = executiveAccess
    ? ["Visão geral", "Central Executiva", "Monitoramento Instagram", "Área do Setor", "Central Integrada", "Comunicação", "Processos Digitais", "Próximos Eventos"]
    : managerProfile
      ? ["Visão geral", "Área do Setor", "Frota e Quilometragem", "Central Integrada", "Chamados", "Comunicação", "Processos Digitais", "Próximos Eventos"]
      : ["Visão geral", "Área do Setor", "Central Integrada", "Chamados", "Comunicação", "Próximos Eventos", "Anexos e Arquivos"];
  const allSecondaryItems: NavItem[] = [
    "Visão geral", "Central Executiva", "Monitoramento Instagram", "Últimas Notícias Prefeitura", "Chamados", "Atendimento ao Cidadão",
    "Pendências", "Central Integrada", "Próximos Eventos", "Comunicação", "Fluxos e Anotações",
    "Área do Setor", "Processos Digitais", "Gestão Municipal", "Frota e Quilometragem", "Indicadores", "Anexos e Arquivos",
    "Funcionários", "Secretarias", "Notificações", "Segurança e LGPD", "Auditoria", "Central de Ajuda", "Configurações",
  ];
  const cleanNavSections: Array<{ label: string; items: NavItem[]; compact?: boolean }> = [
    { label: "Principal", items: primaryNavItems },
    { label: "Mais", items: allSecondaryItems.filter((item) => !primaryNavItems.includes(item)), compact: true },
  ];
  const cleanNavLabel: Partial<Record<NavItem, string>> = {
    "Visão geral": "Início",
    "Central Executiva": "Pendências gerais",
    "Monitoramento Instagram": "Radar do Instagram",
    "Área do Setor": "Meu Setor",
    "Fluxos e Anotações": "Anotações",
    "Atendimento ao Cidadão": "Atendimento ao cidadão",
    "Próximos Eventos": "Agenda",
    "Central Integrada": "Meu trabalho",
    "Processos Digitais": "Processos",
    "Gestão Municipal": "Gestão municipal",
    "Frota e Quilometragem": "Diário da frota",
    "Anexos e Arquivos": "Arquivos",
    "Segurança e LGPD": "Segurança e LGPD",
    "Central de Ajuda": "Ajuda",
    "Últimas Notícias Prefeitura": "Últimas notícias",
  };
  const visibleFavoriteModules = favoriteModules.filter((item) => item !== "Visão geral" && canViewMenuItem(item)).slice(0, 4);
  const visibleRecentModules = recentModules.filter((item) => item !== activeNav && item !== "Visão geral" && canViewMenuItem(item)).slice(0, 3);
  const breadcrumbParent = breadcrumbParentByNav[activeNav];
  const activeIsFavorite = favoriteModules.includes(activeNav);

  function toggleFavorite(item: NavItem) {
    if (item === "Visão geral") return;
    setFavoriteModules((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [item, ...current].slice(0, 6));
    notify(activeIsFavorite ? "Módulo removido dos favoritos." : "Módulo adicionado aos favoritos.");
  }

  return (
    <div className={`app-shell reference-ui-2026 municipal-ui-v6 municipal-ui-v61 municipal-ui-v611 municipal-ui-v620 municipal-ui-v700 municipal-ui-v701 municipal-ui-v800 municipal-ui-kleon ${motionEnabled ? "motion-enabled" : "motion-reduced"} ${contrastEnabled ? "contrast-enabled" : ""} ${simplifiedMode ? "simplified-mode" : ""} ${sidebarCompact ? "sidebar-compact" : ""} text-scale-${textScale}`}>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand" title="Identidade institucional de Várzea da Palma">
          <div className="brand-mark municipal-crest-slot official-municipal-brand" data-crest-slot="brasao-oficial"><img src="/brasao-varzea-da-palma-oficial.png" alt="Brasão oficial da Prefeitura Municipal de Várzea da Palma" /></div>
          <div><strong>Prefeitura Conecta</strong><small>Gestão municipal</small></div>
        </div>
        <nav className="main-nav clean-main-nav organized-main-nav" aria-label="Navegação principal">
          <span className="nav-label">NAVEGAÇÃO</span>
          {cleanNavSections.map((section) => {
            const visibleItems = section.items.filter(canViewMenuItem);
            if (!visibleItems.length) return null;
            const expanded = !section.compact || expandedNavGroup === section.label || visibleItems.includes(activeNav);
            return (
              <div className={`clean-nav-section ${section.compact ? "secondary-nav-section" : ""}`} key={section.label}>
                {section.compact ? <button type="button" className="clean-nav-section-toggle" aria-label="Mais módulos" title="Mais módulos" aria-expanded={expanded} onClick={() => setExpandedNavGroup(expandedNavGroup === section.label ? null : section.label)}><span>••• Mais</span><ChevronRight className={expanded ? "expanded" : ""} size={15}/></button> : <span className="clean-nav-section-label">Principais</span>}
                {expanded && <div className="clean-nav-section-items">
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
                        aria-current={activeNav === item ? "page" : undefined}
                        title={cleanNavLabel[item] ?? item}
                        onClick={() => { setActiveNav(item); setSidebarOpen(false); }}
                      >
                        <ItemIcon size={17} strokeWidth={2} />
                        <span>{cleanNavLabel[item] ?? item}</span>
                        {badge > 0 && <span className={`nav-badge ${item === "Pendências" || item === "Chamados" || item === "Central Executiva" ? "pending-badge" : ""}`}>{badge}</span>}
                      </button>
                    );
                  })}
                </div>}
              </div>
            );
          })}
        </nav>
        {(visibleFavoriteModules.length > 0 || visibleRecentModules.length > 0) && <section className="sidebar-quick-access" aria-label="Favoritos e páginas recentes">
          {visibleFavoriteModules.length > 0 && <div><span><Star size={12}/> FAVORITOS</span>{visibleFavoriteModules.map((item) => { const Icon = moduleIconForNav(item); return <button type="button" key={item} title={getHeading(item).title} onClick={() => { setActiveNav(item); setSidebarOpen(false); }}><Icon size={14}/><span>{cleanNavLabel[item] ?? item}</span></button>; })}</div>}
          {visibleRecentModules.length > 0 && <div><span><History size={12}/> RECENTES</span>{visibleRecentModules.map((item) => <button type="button" key={item} title={getHeading(item).title} onClick={() => { setActiveNav(item); setSidebarOpen(false); }}><span>{cleanNavLabel[item] ?? item}</span><ChevronRight size={12}/></button>)}</div>}
        </section>}
        <button type="button" className="sidebar-reference-card" onClick={() => { setActiveNav("Central de Ajuda"); setSidebarOpen(false); }}>
          <span><ArrowUpRight size={16}/></span>
          <div><strong>Central de ajuda</strong><small>Guias rápidos para usar a plataforma</small></div>
          <ChevronRight size={15}/>
        </button>
        <div className={`sidebar-profile ${executiveAccess ? "sidebar-profile-executive" : ""}`}>
          <div className="profile-avatar-wrap"><div className="avatar avatar-large">{currentUser.initials}</div>{executiveAccess&&<span className="executive-avatar-badge"><Crown size={10}/></span>}</div>
          <div className="profile-copy"><strong>{currentUser.fullName}</strong><span>{executiveAccess ? `${currentUser.role} · acesso executivo` : currentUser.department}</span></div>
          <button className="icon-button" aria-label="Opções do perfil" onClick={() => setInteractionModal({ title: "Opções do perfil", message: `${currentUser.fullName} · ${currentUser.role} · ${currentUser.department}. Use o seletor “Visualizar como” para alternar perfis ou abra Configurações para revisar permissões e preferências.` })}><MoreHorizontal size={18} /></button>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}

      <main id="main-content" className="main-area" tabIndex={-1}>
        <header className={`topbar ${executiveAccess ? "executive-topbar" : ""}`}>
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <button className="desktop-sidebar-toggle" type="button" aria-pressed={sidebarCompact} aria-label={sidebarCompact ? "Expandir menu lateral" : "Recolher menu lateral"} title={sidebarCompact ? "Expandir menu lateral" : "Recolher menu lateral"} onClick={() => setSidebarCompact((current) => !current)}><PanelsTopLeft size={18}/></button>
          <div className="topbar-context-v8"><small>ÁREA ATUAL</small><strong>{heading.title}</strong></div>
          <div className="global-search-wrap">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input type="search" aria-label="Buscar no sistema" placeholder="Buscar no sistema..." value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} />
              <kbd>⌘ K</kbd>
            </label>
            {searchOpen && search.trim() && <GlobalSearchPanel query={search} tickets={privateTickets} users={scopedActiveUsers} documents={privateDocuments} events={currentEvents} offices={scopedOffices} onOpen={(nav) => setActiveNav(nav as NavItem)} onClose={() => setSearchOpen(false)} />}
          </div>
          {executiveAccess && activeNav !== "Central Executiva" && activeNav !== "Monitoramento Instagram" && <label className="executive-sector-switch"><span className="executive-switch-icon"><Crown size={17} /></span><span><small>PAINEL SETORIAL</small><select aria-label="Selecionar setor para a visão executiva" value={activeDepartment} onChange={(event) => switchDepartment(event.target.value)}>{allDepartments.map((department) => <option key={department}>{department}</option>)}</select></span></label>}
          <div className="top-actions">
            <span className={`persistence-status ${persistenceStatus}`} title="Persistência central do sistema"><i />{persistenceStatus === "carregando" ? "Conectando" : persistenceStatus === "salvando" ? "Salvando" : persistenceStatus === "offline" ? "Aguardando conexão" : "Salvo"}</span>
            <button className={`simple-mode-toggle ${simplifiedMode ? "active" : ""}`} type="button" aria-pressed={simplifiedMode} title={simplifiedMode ? "Voltar para interface completa" : "Ativar modo simplificado"} onClick={() => setSimplifiedMode((current) => !current)}><LayoutDashboard size={15}/><span>{simplifiedMode ? "Modo simples" : "Simplificar"}</span></button>
            <button className="icon-button notification-button" aria-label={`Notificações${unreadCount + (mayorAccess ? citizenFeedbackUnread : 0) ? `: ${unreadCount + (mayorAccess ? citizenFeedbackUnread : 0)} novas` : ""}`} onClick={() => setActiveNav(mayorAccess && citizenFeedbackUnread > 0 ? "Atendimento ao Cidadão" : "Notificações")}><Bell size={18} />{unreadCount + (mayorAccess ? citizenFeedbackUnread : 0) > 0 && <span />}</button>
            <button className="icon-button logout-button" aria-label="Sair do sistema" title="Sair" onClick={() => void logout()}><LogOut size={18} /></button>
            <label className="account-switch"><div className="avatar">{currentUser.initials}</div><span><small>{executiveAccess ? "VISUALIZAR COMO" : "PERFIS CADASTRADOS"}</small><select aria-label="Visualizar como usuário" value={currentUserId} onChange={(event) => switchUser(event.target.value)}>{activeUsers.map((user) => <option key={user.id} value={user.id}>{user.fullName} — {user.department}</option>)}</select></span></label>
          </div>
        </header>

        <div className="demo-banner municipal-demo-context" role="note"><span className="demo-banner-mark"><MapPin size={14}/></span><span><strong>Ambiente demonstrativo municipal</strong><small>Cenários, locais e serviços de Várzea da Palma–MG</small></span></div>
        {persistenceStatus === "carregando" && <div className="interface-state-banner loading" role="status" aria-live="polite"><LoaderCircle className="spin" size={15}/><span><strong>Preparando seu ambiente</strong><small>Carregando preferências, filtros e dados do setor.</small></span><i/><i/><i/></div>}
        {persistenceStatus === "offline" && <div className="interface-state-banner offline" role="status"><ShieldCheck size={16}/><span><strong>Modo de continuidade ativo</strong><small>Você pode continuar trabalhando. As alterações ficarão protegidas para sincronizar quando a conexão retornar.</small></span></div>}

        <PermissionProvider key={`${currentUser.id}-${activeDepartment}`} permission={currentPermission}>
        <div className={`content-wrap ${activeNav === "Comunicação" ? "chat-content" : ""} ${currentPermission.register ? "can-register" : "read-only-register"} ${currentPermission.edit ? "can-edit" : "read-only-edit"}`}>
          {activeNav !== "Visão geral" && <nav className="module-breadcrumbs" aria-label="Caminho da página">
            <button type="button" onClick={() => setActiveNav("Visão geral")}><Landmark size={13}/> Início</button>
            {breadcrumbParent && breadcrumbParent !== "Visão geral" && <><ChevronRight size={12}/><button type="button" onClick={() => setActiveNav(breadcrumbParent)}>{getHeading(breadcrumbParent).title}</button></>}
            <ChevronRight size={12}/><span aria-current="page">{heading.title}</span>
          </nav>}
          <section className={activeNav === "Visão geral" ? "page-heading" : "module-page-header-v3 module-page-header-v8"} data-module={activeNav}>
            {activeNav !== "Visão geral" && <span className="module-page-header-icon"><ActiveModuleIcon size={20}/></span>}
            <div className="module-page-header-copy"><p className="eyebrow">{activeNav === "Visão geral" ? `${formatHeadingDate(clockNow)} · ${formatHeadingClock(clockNow)}` : heading.eyebrow}</p><h1>{headingTitle}</h1><p>{heading.subtitle}</p></div>
            {activeNav !== "Visão geral" && <div className="module-page-header-context"><small>AMBIENTE ATUAL</small><strong>{activeNav === "Monitoramento Instagram" ? "Gabinete Executivo" : activeDepartment}</strong><span><i/> {activeNav === "Monitoramento Instagram" ? "Acesso restrito" : viewingOtherDepartment ? "Consulta executiva" : "Operação do setor"}</span></div>}
            <div className="heading-actions">
              {activeNav !== "Visão geral" && <button type="button" className={`module-favorite-toggle ${activeIsFavorite ? "active" : ""}`} aria-pressed={activeIsFavorite} title={activeIsFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={() => toggleFavorite(activeNav)}><Star size={16}/><span>{activeIsFavorite ? "Favorito" : "Favoritar"}</span></button>}
              {activeNav === "Comunicação" ? (
                currentPermission.register && <button className="button secondary" onClick={() => setGroupModal(true)}><Plus size={15} /> Novo grupo</button>
              ) : activeNav === "Anexos e Arquivos" ? (
                currentPermission.register && <button type="button" className="button secondary" onClick={() => fileInput.current?.click()}><Upload size={15} /> Anexar arquivo</button>
              ) : activeNav === "Próximos Eventos" ? (
                currentPermission.register && <button type="button" className="button secondary" onClick={() => setEventModal("new")}><CalendarPlus size={15} /> Novo evento</button>
              ) : activeNav === "Funcionários" ? (
                <button type="button" className="button secondary" onClick={() => setEmployeeModal(true)}><UserPlus size={15} /> Convidar funcionário</button>
              ) : activeNav === "Notificações" ? (
                currentPermission.edit && <button className="button secondary" onClick={markAllNotifications}><CheckCheck size={15} /> Marcar todas como lidas</button>
              ) : activeNav === "Pendências" ? (
                <button className="button secondary" onClick={() => setActiveNav("Chamados")}><ClipboardList size={15} /> Ver chamados</button>
              ) : activeNav === "Indicadores" || activeNav === "Auditoria" || activeNav === "Gestão Municipal" || activeNav === "Frota e Quilometragem" || activeNav === "Processos Digitais" ? (
                <button className="button secondary" onClick={exportCurrentReport}><Download size={15} /> Exportar relatório</button>
              ) : (
                null
              )}
              {ticketPermission.register && (activeNav === "Visão geral" || activeNav === "Chamados") && <button type="button" className="button primary" onClick={() => setTicketModal(true)} aria-haspopup="dialog"><Plus size={16} /> Novo chamado</button>}
            </div>
          </section>

          {viewingOtherDepartment && activeNav !== "Central Executiva" && activeNav !== "Monitoramento Instagram" && <div className="executive-sector-readonly" role="status"><ShieldCheck size={19}/><span><strong>Modo de consulta executiva · {activeDepartment}</strong><small>Prefeito e Vice-Prefeito podem visualizar e abrir as informações deste setor, mas não podem criar, editar, mover, comentar, excluir ou executar ações por IA.</small></span></div>}

          {activeNav === "Visão geral" && <Dashboard tickets={filteredTickets} allTickets={privateTickets} municipalSummary={executiveMunicipalSummary} audit={privateAudit} executive={executiveAccess} department={activeDepartment} userId={currentUser.id} userName={currentUser.fullName} userRole={currentUser.role} events={currentEvents} unreadCount={unreadCount} now={clockNow} onNavigate={setActiveNav} />}
          {activeNav !== "Visão geral" && <div className={`module-layout-v3 module-layout-v8 ${activeNav === "Comunicação" ? "module-layout-chat" : ""} ${activeNav === "Monitoramento Instagram" ? "module-layout-social-monitor" : ""}`} data-active-module={activeNav}>
            <ModuleExperienceRail activeNav={activeNav} department={activeDepartment} tickets={filteredTickets} documents={privateDocuments} events={currentEvents} unreadCount={unreadCount} pendingCount={currentInvitations.length + pendingTickets.length} onNavigate={setActiveNav}/>
            <div className="module-main-v3">
          {!executiveReadOnlyScope && activeNav !== "Central Executiva" && <ContextualAiBar activeModule={activeNav} department={activeDepartment} tickets={privateTickets} events={currentEvents} />}
          {activeNav === "Central Executiva" && executiveAccess && <ExecutiveCommandCenter tickets={ticketData} departments={allDepartments} currentUser={{ fullName: currentUser.fullName, role: currentUser.role }} onOpenDepartment={openExecutiveDepartment} notify={notify} />}
          {activeNav === "Monitoramento Instagram" && executiveAccess && <ExecutiveSocialMonitor profileId={currentUser.id} profileName={currentUser.fullName} />}
          {activeNav === "Últimas Notícias Prefeitura" && <PrefeituraNewsSection />}
          {activeNav === "Área do Setor" && <><SectorWorkspaceSection key={activeDepartment} department={activeDepartment} userName={currentUser.fullName} userRole={currentUser.role} departments={availableDepartments} notify={notify} />{!viewingOtherDepartment&&<FormBuilderPanel department={activeDepartment} notify={notify} />}</>}
          {activeNav === "Fluxos e Anotações" && <SectorNotesSection key={activeDepartment} department={activeDepartment} userName={currentUser.fullName} team={sectorUsers.map((user) => ({ id: user.id, name: user.fullName, role: user.role }))} notify={notify} />}
          {activeNav === "Chamados" && <TicketsSection tickets={filteredTickets} department={activeDepartment} departments={availableDepartments} userId={currentUser.id} now={clockNow} onStatus={updateStatus} onNew={() => setTicketModal(true)} />}
          {activeNav === "Comunicação" && (communicationLocked
            ? <CommunicationPrivacyGate department={activeDepartment} isMayor={mayorAccess} onOpenSettings={() => setActiveNav("Configurações")} />
            : executiveCommunicationMonitor
              ? <ExecutiveCommunicationViewer department={activeDepartment} users={scopedActiveUsers} groups={accessibleGroups} messages={communicationMessages} />
              : <CommunicationSection key={`${currentUser.id}-${activeDepartment}`} currentUser={currentUser} users={communicationDirectoryUsers} groups={accessibleGroups} messages={communicationMessages} tickets={privateTickets} onSend={sendMessage} onSendAttachment={sendChatAttachment} onNewGroup={() => setGroupModal(true)} onTicketStatus={updateStatus} />)}
          {activeNav === "Atendimento ao Cidadão" && <CitizenServiceSection department={activeDepartment} notify={notify} isMayor={executiveAccess} departments={availableDepartments} />}
          {activeNav === "Central Integrada" && <IntegratedManagementSection key={activeDepartment} initialTab="Tarefas" department={activeDepartment} currentUser={{ id: currentUser.id, fullName: currentUser.fullName, department: currentUser.department, role: currentUser.role, initials: currentUser.initials }} tickets={privateTickets} users={scopedActiveUsers.map((user) => ({ id: user.id, fullName: user.fullName, department: user.department, role: user.role, initials: user.initials }))} offices={scopedOffices} events={currentEvents} departments={availableDepartments} notify={notify} readOnly={viewingOtherDepartment} />}
          {activeNav === "Processos Digitais" && <ProcessesSection key={`${activeDepartment}-${currentUser.id}`} department={activeDepartment} currentUser={{ id: currentUser.id, fullName: currentUser.fullName, department: currentUser.department, role: currentUser.role }} users={scopedActiveUsers.map((user) => ({ id: user.id, fullName: user.fullName, department: user.department, role: user.role }))} departments={availableDepartments} notify={notify} />}
          {activeNav === "Gestão Municipal" && <MunicipalManagementSection department={activeDepartment} notify={notify} />}
          {activeNav === "Frota e Quilometragem" && <FleetMileageSection key={`${activeDepartment}-${currentUser.id}`} department={activeDepartment} currentUser={{ id: currentUser.id, fullName: currentUser.fullName, department: currentUser.department, role: currentUser.role }} notify={notify} readOnly={viewingOtherDepartment} />}
          {activeNav === "Indicadores" && <IndicatorsSection department={activeDepartment} notify={notify} />}
          {activeNav === "Notificações" && <><NotificationsSection notifications={currentNotifications} userId={currentUser.id} onRead={markNotification} onOpenPending={() => setActiveNav("Pendências")} />{!viewingOtherDepartment&&<SmartNotificationRules department={activeDepartment} notify={notify} />}</>}
          {activeNav === "Pendências" && <><PendingSection invitations={currentInvitations} tickets={pendingTickets} onRespond={respondInvitation} onOpenTickets={() => setActiveNav("Chamados")} />{!viewingOtherDepartment&&<ApprovalCenterPanel department={activeDepartment} notify={notify} />}</>}
          {activeNav === "Anexos e Arquivos" && <><DocumentsSection documents={privateDocuments} department={activeDepartment} currentUserId={currentUser.id} onUpload={() => fileInput.current?.click()} /><DocumentGovernancePanel department={activeDepartment} notify={notify} /></>}
          {activeNav === "Próximos Eventos" && <EventsSection events={currentEvents} department={activeDepartment} onNew={() => setEventModal("new")} onEdit={setEventModal} onDelete={setEventToDelete} />}
          {activeNav === "Funcionários" && canManageEmployees && <EmployeesSection users={sectorUsers} department={activeDepartment} onInvite={() => setEmployeeModal(true)} onResend={resendEmployeeInvite} />}
          {activeNav === "Segurança e LGPD" && <SecuritySection department={activeDepartment} notify={notify} />}
          {activeNav === "Auditoria" && <AuditSection audit={privateAudit} department={activeDepartment} notify={notify} />}
          {activeNav === "Central de Ajuda" && <HelpCenterSection notify={notify} />}
          {activeNav === "Configurações" && canManageEmployees && <SettingsSection key={activeDepartment} department={activeDepartment} managerName={currentUser.fullName} employees={sectorEmployees} settings={departmentPermissionSettings} soundEnabled={soundEnabled} motionEnabled={motionEnabled} contrastEnabled={contrastEnabled} textScale={textScale} simplifiedMode={simplifiedMode} isMayor={executiveAccess} crossSectorCommunicationEnabled={executiveCommunicationAccess} secretariatsContent={<TeamSection offices={scopedOffices} />} onExportContacts={exportContacts} onSettingsChange={updatePermissionSettings} onSoundChange={setSoundEnabled} onMotionChange={setMotionEnabled} onContrastChange={setContrastEnabled} onTextScaleChange={setTextScale} onSimplifiedModeChange={setSimplifiedMode} onCrossSectorCommunicationChange={(enabled) => { setExecutiveCommunicationAccess(enabled); notify(enabled ? "Acesso executivo à comunicação de outros setores habilitado." : "Comunicações de outros setores voltaram ao modo privado."); }} onTestSound={() => { playNotificationChime(); notify("Som de notificação reproduzido."); }} notify={notify} />}
            </div>
          </div>}
          <footer className="municipal-product-footer">
            <div><span className="municipal-footer-crest"><img src="/brasao-varzea-da-palma-oficial.png" alt="" /></span><span><strong>Prefeitura Municipal de Várzea da Palma</strong><small>Prefeitura Conecta v{PRODUCT_VERSION} · Setor atual: {activeDepartment}</small></span></div>
            <nav aria-label="Suporte, privacidade e proteção de dados"><button type="button" onClick={() => setActiveNav("Central de Ajuda")}>Suporte</button><button type="button" onClick={() => setActiveNav("Segurança e LGPD")}>Privacidade</button><button type="button" onClick={() => setActiveNav("Segurança e LGPD")}>LGPD</button></nav>
          </footer>
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
      {!executiveReadOnlyScope && <MunicipalAiCopilot activeModule={activeNav} department={activeDepartment} user={{ id: currentUser.id, fullName: currentUser.fullName, role: currentUser.role }} tickets={privateTickets} events={currentEvents} departments={availableDepartments} unreadNotifications={unreadCount + (mayorAccess ? citizenFeedbackUnread : 0)} onExecuteAction={executeMunicipalAgentAction} />}
      <OnboardingTour userName={currentUser.fullName} role={currentUser.role} department={activeDepartment} onNavigate={(nav) => setActiveNav(nav as NavItem)} />
      {!executiveReadOnlyScope && <QuickActionDock onNavigate={(nav) => setActiveNav(nav as NavItem)} onNewTicket={() => { setTicketModal(true); setActiveNav("Chamados"); }} onNewEvent={() => { setEventModal("new"); setActiveNav("Próximos Eventos"); }} onUpload={() => { setActiveNav("Anexos e Arquivos"); window.setTimeout(() => fileInput.current?.click(), 0); }} />}
      <MobileBottomNavigation active={activeNav} onNavigate={(nav) => { setActiveNav(nav as NavItem); setSidebarOpen(false); }} onMenu={() => setSidebarOpen(true)} />
      {recentlyDeletedEvent && <div className="undo-toast" role="status"><span><strong>Evento excluído</strong><small>{recentlyDeletedEvent.title}</small></span><button type="button" onClick={restoreDeletedEvent}>Desfazer</button></div>}
      {toast && <div className="toast" role="status"><span><Check size={14} strokeWidth={2.5} /></span>{toast}</div>}
    </div>
  );
}

function getHeading(active: NavItem) {
  const headings: Record<NavItem, { eyebrow: string; title: string; subtitle: string }> = {
    "Visão geral": { eyebrow: "", title: "Bom dia.", subtitle: "Acompanhe as demandas e mantenha as secretarias alinhadas." },
    "Central Executiva": { eyebrow: "PREFEITO E VICE-PREFEITO", title: "Central Executiva", subtitle: "Acompanhe pendências, chamados, prioridades e riscos de todos os setores da Prefeitura." },
    "Monitoramento Instagram": { eyebrow: "PREFEITO E VICE-PREFEITO", title: "Monitoramento do Instagram", subtitle: "Acompanhe menções, comentários, hashtags e sinais de atenção relacionados à imagem pública municipal." },
    "Últimas Notícias Prefeitura": { eyebrow: "PORTAL OFICIAL DE VÁRZEA DA PALMA", title: "Últimas Notícias Prefeitura", subtitle: "Acompanhe as publicações mais recentes da Prefeitura, filtre por assunto e abra a matéria completa na fonte oficial." },
    "Área do Setor": { eyebrow: "AMBIENTE ESPECIALIZADO", title: "Meu setor", subtitle: "Formulários, endereços, indicadores, equipes e fluxos adaptados às responsabilidades da unidade selecionada." },
    "Fluxos e Anotações": { eyebrow: "MEMÓRIA OPERACIONAL", title: "Anotações", subtitle: "Organize decisões, providências e registros internos em etapas próprias para cada setor." },
    Chamados: { eyebrow: "GESTÃO DE DEMANDAS", title: "Chamados", subtitle: "Organize cada solicitação do recebimento à entrega final." },
    Comunicação: { eyebrow: "CENTRAL DE COMUNICAÇÃO", title: "Conversas", subtitle: "Mensagens diretas e grupos por convite entre as secretarias." },
    "Atendimento ao Cidadão": { eyebrow: "PROTOCOLO, OUVIDORIA E SERVIÇOS", title: "Atendimento ao Cidadão", subtitle: "Registre, encaminhe e acompanhe solicitações, manifestações e pedidos de informação." },
    "Central Integrada": { eyebrow: "CENTRAL OPERACIONAL", title: "Central Integrada", subtitle: "Tarefas, projetos, metas, mapa, organograma, inteligência artificial e saúde do sistema em um só lugar." },
    "Processos Digitais": { eyebrow: "ADMINISTRAÇÃO SEM PAPEL", title: "Processos Digitais", subtitle: "Organize processos, despachos, documentos, versões e assinaturas em um fluxo rastreável." },
    "Gestão Municipal": { eyebrow: "RECURSOS E OPERAÇÕES", title: "Gestão Municipal", subtitle: "Acompanhe frota, patrimônio, materiais, contratos, convênios, obras e serviços de campo." },
    "Frota e Quilometragem": { eyebrow: "CONTROLE OPERACIONAL", title: "Frota e Quilometragem", subtitle: "Registre o hodômetro no início e no final de cada jornada, com cálculo automático e histórico auditável." },
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

function moduleIconForNav(active: NavItem): LucideIcon {
  const icons: Partial<Record<NavItem, LucideIcon>> = {
    "Central Executiva": Crown,
    "Monitoramento Instagram": ActivityIcon,
    "Últimas Notícias Prefeitura": Newspaper,
    "Área do Setor": Building2,
    "Fluxos e Anotações": Pencil,
    Chamados: ClipboardList,
    Comunicação: MessagesSquare,
    "Atendimento ao Cidadão": Inbox,
    "Central Integrada": LayoutDashboard,
    "Processos Digitais": FileText,
    "Gestão Municipal": Landmark,
    "Frota e Quilometragem": Bus,
    Indicadores: LayoutDashboard,
    Notificações: BellRing,
    Pendências: Clock3,
    "Anexos e Arquivos": Files,
    "Próximos Eventos": CalendarDays,
    Funcionários: UsersRound,
    Secretarias: Building2,
    "Segurança e LGPD": ShieldCheck,
    Auditoria: History,
    "Central de Ajuda": HelpCircle,
    Configurações: Settings,
  };
  return icons[active] ?? LayoutDashboard;
}

function ModuleExperienceRail({ activeNav, department, tickets, documents, events, unreadCount, pendingCount, onNavigate }: {
  activeNav: NavItem;
  department: string;
  tickets: Ticket[];
  documents: DocumentItem[];
  events: SectorEvent[];
  unreadCount: number;
  pendingCount: number;
  onNavigate: (item: NavItem) => void;
}) {
  const openTickets = tickets.filter((ticket) => !["Concluído", "Cancelado"].includes(ticket.status));
  const nextEvent = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const quickLinks: NavItem[] = activeNav === "Próximos Eventos"
    ? ["Central Integrada", "Comunicação", "Anexos e Arquivos"]
    : activeNav === "Processos Digitais"
      ? ["Anexos e Arquivos", "Pendências", "Auditoria"]
      : activeNav === "Comunicação"
        ? ["Chamados", "Notificações", "Anexos e Arquivos"]
        : activeNav === "Monitoramento Instagram"
          ? ["Central Executiva", "Últimas Notícias Prefeitura", "Comunicação"]
        : activeNav === "Central Executiva"
          ? ["Indicadores", "Central Integrada", "Próximos Eventos"]
          : ["Chamados", "Central Integrada", "Próximos Eventos"];
  const moduleTitle = getHeading(activeNav).title;
  const RailIcon = moduleIconForNav(activeNav);

  return <aside className="module-experience-rail module-command-strip-v8" aria-label={`Resumo de ${moduleTitle}`}>
    <article className="module-rail-identity">
      <header><span><RailIcon size={16}/></span><small>VISÃO DO MÓDULO</small></header>
      <h2>{moduleTitle}</h2>
      <p>{department}</p>
      <div><span><strong>{openTickets.length}</strong><small>demandas ativas</small></span><span><strong>{pendingCount}</strong><small>ações pendentes</small></span></div>
    </article>

    <article className="panel module-rail-today">
      <header><div><span>Hoje</span><h3>Resumo operacional</h3></div><Clock3 size={15}/></header>
      <button type="button" onClick={() => onNavigate("Chamados")}><span className="peach"><ClipboardList size={14}/></span><div><strong>{openTickets.length} chamados ativos</strong><small>{openTickets[0]?.title ?? "Nenhuma demanda em aberto"}</small></div><ChevronRight size={13}/></button>
      <button type="button" onClick={() => onNavigate("Próximos Eventos")}><span className="lime"><CalendarDays size={14}/></span><div><strong>{nextEvent ? formatDate(nextEvent.startsAt) : "Agenda disponível"}</strong><small>{nextEvent?.title ?? "Nenhum compromisso próximo"}</small></div><ChevronRight size={13}/></button>
      <button type="button" onClick={() => onNavigate("Anexos e Arquivos")}><span className="blue"><Files size={14}/></span><div><strong>{documents.length} arquivos</strong><small>Biblioteca do setor</small></div><ChevronRight size={13}/></button>
    </article>

    <article className="panel module-rail-shortcuts">
      <header><div><span>Navegação</span><h3>Acessos relacionados</h3></div><ArrowUpRight size={14}/></header>
      <div>{quickLinks.map((item) => { const Icon = moduleIconForNav(item); return <button type="button" key={item} onClick={() => onNavigate(item)}><span><Icon size={14}/></span><strong>{getHeading(item).title}</strong><ChevronRight size={13}/></button>; })}</div>
      {unreadCount > 0 && <button type="button" className="module-rail-alert" onClick={() => onNavigate("Notificações")}><BellRing size={14}/><span><strong>{unreadCount} novos avisos</strong><small>Abrir central de notificações</small></span></button>}
    </article>
  </aside>;
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

const DASHBOARD_WEEKDAYS = ["Seg.", "Ter.", "Qua.", "Qui.", "Sex", "Sab.", "Dom."] as const;

function startOfDashboardWeek(value: Date) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function dashboardWeekdayIndex(value: Date) {
  return (value.getDay() + 6) % 7;
}

function dashboardCalendarKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function Dashboard({ tickets, allTickets, municipalSummary, audit, executive, department, userId, userRole, events, unreadCount, now, onNavigate }: { tickets: Ticket[]; allTickets: Ticket[]; municipalSummary: { total: number; open: number; overdue: number; riskSectors: number; awaitingDecision: number; completionRate: number }; audit: AuditItem[]; executive: boolean; department: string; userId: string; userName: string; userRole: string; events: SectorEvent[]; unreadCount: number; now: Date; onNavigate: (item: NavItem) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedChartDay, setSelectedChartDay] = useState<number | null>(null);
  const [calendarCursor, setCalendarCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const normalizedRole = normalizeText(userRole);
  const dashboardProfile: "executive" | "manager" | "staff" = executive ? "executive" : normalizedRole.includes("secret") || normalizedRole.includes("gestor") || normalizedRole.includes("administrador") || normalizedRole.includes("responsavel") || normalizedRole.includes("controlador") || normalizedRole.includes("subprefeit") ? "manager" : "staff";
  const ownTickets = tickets.filter((ticket) => ticket.assigneeId === userId || (!ticket.assigneeId && sameDepartment(ticket.department, department)));
  const focusTickets = dashboardProfile === "executive" ? allTickets : dashboardProfile === "staff" ? ownTickets : tickets;
  const stats = statuses.map((status, index) => ({
    label: statusMeta[status].short,
    value: String(focusTickets.filter((ticket) => ticket.status === status).length).padStart(2, "0"),
    change: ["Novos registros", "Triagem inicial", "Decisão pendente", "Serviço em andamento", "Retorno externo", "Entregas confirmadas", "Encerrados sem execução"][index],
    status,
  }));
  const openTickets = focusTickets.filter((ticket) => ticket.status !== "Concluído" && ticket.status !== "Cancelado");
  const overdueTickets = openTickets.filter((ticket) => ticket.dueDate && new Date(ticket.dueDate).getTime() < now.getTime());
  const nextEvent = events.filter((event) => new Date(event.startsAt).getTime() >= now.getTime()).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  const roleLabel = dashboardProfile === "executive" ? "Visão executiva municipal" : dashboardProfile === "manager" ? "Gestão da equipe" : "Meu trabalho";
  const completedTickets = focusTickets.filter((ticket) => ticket.status === "Concluído").length;
  const completionRate = focusTickets.length ? Math.round((completedTickets / focusTickets.length) * 100) : 0;
  const onTimeRate = openTickets.length ? Math.round(((openTickets.length - overdueTickets.length) / openTickets.length) * 100) : 100;
  const awaitingDecision = openTickets.filter((ticket) => ticket.status === "Aguardando aprovação" || ticket.status === "Aguardando resposta").length;
  const unassignedTickets = openTickets.filter((ticket) => !ticket.assigneeId).length;
  const dashboardCopy = dashboardProfile === "executive"
    ? { title: "Decisões e riscos do município", first: "Demandas críticas", second: "Setores com risco", third: "Decisões pendentes", fourth: "Conclusão municipal" }
    : dashboardProfile === "manager"
      ? { title: "Prioridades da equipe", first: "Demandas atrasadas", second: "Equipe em andamento", third: "Decisões pendentes", fourth: "Dentro do prazo" }
      : { title: "Minhas prioridades", first: "Meus atrasos", second: "Meu trabalho ativo", third: "Novos avisos", fourth: "Próximo compromisso" };
  const currentWeekStart = startOfDashboardWeek(now);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
  const currentWeekHasTickets = focusTickets.some((ticket) => {
    const createdAt = new Date(ticket.createdAt).getTime();
    return createdAt >= currentWeekStart.getTime() && createdAt < currentWeekEnd.getTime();
  });
  const latestTicketTimestamp = focusTickets.reduce((latest, ticket) => {
    const createdAt = new Date(ticket.createdAt).getTime();
    return Number.isFinite(createdAt) ? Math.max(latest, createdAt) : latest;
  }, 0);
  const chartAnchor = currentWeekHasTickets || !latestTicketTimestamp ? now : new Date(latestTicketTimestamp);
  const chartWeekStart = startOfDashboardWeek(chartAnchor);
  const chartWeekEnd = new Date(chartWeekStart);
  chartWeekEnd.setDate(chartWeekEnd.getDate() + 6);
  const chartItems = DASHBOARD_WEEKDAYS.map((label, index) => {
    const dayStart = new Date(chartWeekStart);
    dayStart.setDate(dayStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayTickets = focusTickets.filter((ticket) => {
      const createdAt = new Date(ticket.createdAt).getTime();
      return createdAt >= dayStart.getTime() && createdAt < dayEnd.getTime();
    });
    const completed = dayTickets.filter((ticket) => ticket.status === "Concluído").length;
    const canceled = dayTickets.filter((ticket) => ticket.status === "Cancelado").length;
    return { label, value: dayTickets.length, active: dayTickets.length - completed - canceled, completed, canceled, date: dayStart };
  });
  const chartMax = Math.max(1, ...chartItems.map((item) => item.value));
  const previousWeekStart = new Date(chartWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekTotal = focusTickets.filter((ticket) => {
    const createdAt = new Date(ticket.createdAt).getTime();
    return createdAt >= previousWeekStart.getTime() && createdAt < chartWeekStart.getTime();
  }).length;
  const currentWeekTotal = chartItems.reduce((sum, item) => sum + item.value, 0);
  const weeklyDelta = previousWeekTotal ? Math.round(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100) : 0;
  const lastDayWithDemand = chartItems.reduce((lastIndex, item, index) => item.value > 0 ? index : lastIndex, 0);
  const chartShowsCurrentWeek = chartWeekStart.getTime() === currentWeekStart.getTime();
  const activeChartDay = selectedChartDay ?? (chartShowsCurrentWeek ? dashboardWeekdayIndex(now) : lastDayWithDemand);
  const activeChartItem = chartItems[activeChartDay];
  const chartRangeLabel = `${chartWeekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} a ${chartWeekEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
  const calendarMonthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
  const calendarDaysInMonth = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 0).getDate();
  const calendarLeadingDays = calendarMonthStart.getDay();
  const calendarDays = Array.from({ length: calendarDaysInMonth }, (_, index) => index + 1);
  const calendarMonthLabel = calendarCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const todayCalendarKey = dashboardCalendarKey(now);
  const calendarEventKeys = new Set(events.map((event) => dashboardCalendarKey(new Date(event.startsAt))));
  const schedule = events.filter((event) => new Date(event.endsAt ?? event.startsAt).getTime() >= now.getTime()).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).slice(0, 4);

  return (
    <>
      <div className="kleon-workspace-line"><span><Landmark size={16}/>{roleLabel}<i/> {dashboardProfile === "executive" ? "Várzea da Palma" : department}</span><button type="button" onClick={() => onNavigate(dashboardProfile === "executive" ? "Central Executiva" : "Central Integrada")}>Central de trabalho <ArrowUpRight size={15}/></button></div>
          <section className="reference-priorities" aria-label="Prioridades do dia">
            <header className="reference-section-heading"><div><span>{roleLabel}</span><h2>{dashboardCopy.title}</h2></div><button type="button" onClick={() => onNavigate(dashboardProfile === "executive" ? "Central Executiva" : "Central Integrada")}>Ver tudo <ArrowRight size={13}/></button></header>
            <div className="reference-kpi-grid">
              <button type="button" className={(dashboardProfile === "executive" ? municipalSummary.overdue : overdueTickets.length) ? "urgent" : ""} onClick={() => onNavigate(dashboardProfile === "executive" ? "Central Executiva" : "Chamados")} title="Demandas abertas com prazo vencido"><span className="peach"><AlertTriangle size={16}/></span><div><strong>{dashboardProfile === "executive" ? municipalSummary.overdue : overdueTickets.length}</strong><small>{dashboardCopy.first}</small><em>{(dashboardProfile === "executive" ? municipalSummary.overdue : overdueTickets.length) ? "Exigem atenção" : "Nenhum atraso"}</em></div></button>
              <button type="button" onClick={() => onNavigate(dashboardProfile === "executive" ? "Central Executiva" : "Central Integrada")} title={dashboardProfile === "executive" ? "Setores que possuem ao menos uma demanda vencida" : "Demandas abertas sob responsabilidade do perfil"}><span className="teal"><ListTodo size={16}/></span><div><strong>{dashboardProfile === "executive" ? municipalSummary.riskSectors : openTickets.length}</strong><small>{dashboardCopy.second}</small><em>{dashboardProfile === "executive" ? "Visão intersetorial" : "Trabalho ativo"}</em></div></button>
              <button type="button" onClick={() => onNavigate(dashboardProfile === "staff" ? "Notificações" : "Pendências")} title={dashboardProfile === "staff" ? "Notificações ainda não lidas" : "Itens aguardando aprovação ou resposta"}><span className="blue">{dashboardProfile === "staff" ? <BellRing size={16}/> : <Clock3 size={16}/>}</span><div><strong>{dashboardProfile === "staff" ? unreadCount : dashboardProfile === "executive" ? municipalSummary.awaitingDecision : awaitingDecision}</strong><small>{dashboardCopy.third}</small><em>{dashboardProfile === "staff" ? "Atualizações recentes" : "Aguardam decisão"}</em></div></button>
              <button type="button" onClick={() => onNavigate(dashboardProfile === "staff" ? "Próximos Eventos" : "Indicadores")} title={dashboardProfile === "staff" ? "Próximo evento da agenda" : "Percentual calculado sobre os registros do período"}><span className="sand">{dashboardProfile === "staff" ? <CalendarDays size={16}/> : <Gauge size={16}/>}</span><div><strong>{dashboardProfile === "staff" ? (nextEvent ? formatDate(nextEvent.startsAt) : "—") : `${dashboardProfile === "executive" ? municipalSummary.completionRate : onTimeRate}%`}</strong><small>{dashboardCopy.fourth}</small><em>{dashboardProfile === "staff" ? (nextEvent?.title ?? "Agenda livre") : "Meta: 85%"}</em></div></button>
            </div>
          </section>
      <section className="reference-dashboard" aria-label="Painel principal">
        <div className="reference-dashboard-main">


          {showDetails && <section className="panel municipal-health-strip" aria-label="Saúde operacional do setor">
            <header><span><Gauge size={19}/></span><div><small>SAÚDE OPERACIONAL</small><strong>Ritmo do setor</strong></div></header>
            <button type="button" onClick={() => onNavigate("Indicadores")}><span><small>Conclusão</small><strong>{completionRate}%</strong></span><i className="municipal-health-progress" role="progressbar" aria-label="Índice de conclusão" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionRate}><b style={{ width: `${completionRate}%` }}/></i></button>
            <button type="button" onClick={() => onNavigate("Indicadores")}><span><small>Dentro do prazo</small><strong>{onTimeRate}%</strong></span><i className="municipal-health-progress" role="progressbar" aria-label="Demandas dentro do prazo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={onTimeRate}><b style={{ width: `${onTimeRate}%` }}/></i></button>
            <button type="button" className={awaitingDecision ? "attention" : ""} onClick={() => onNavigate("Pendências")}><span><small>Aguardam decisão</small><strong>{awaitingDecision}</strong></span><em>{awaitingDecision ? "Revisar fila" : "Tudo em dia"}</em></button>
            <button type="button" className={unassignedTickets ? "attention" : ""} onClick={() => onNavigate("Chamados")}><span><small>Sem responsável</small><strong>{unassignedTickets}</strong></span><em>{unassignedTickets ? "Distribuir" : "Fila distribuída"}</em></button>
          </section>}

          <div className="reference-middle-grid kleon-chart-layout">
            <article className="panel reference-activity-card">
              <header><div><span>Desempenho</span><h3>Fluxo de demandas</h3><small>{chartRangeLabel}</small></div><button type="button" aria-expanded={showDetails} title={`Ver detalhes · ${chartRangeLabel}`} onClick={() => setShowDetails((current) => !current)}>{showDetails ? "Ocultar detalhes" : "Ver detalhes"} <ChevronRight size={13}/></button></header>
              <div className="reference-chart-summary"><div><strong>{currentWeekTotal}</strong><small>chamados na semana</small></div><span className={weeklyDelta < 0 ? "negative" : ""} title={`Semana anterior: ${previousWeekTotal} demandas`}><ArrowUpRight size={14}/> {previousWeekTotal ? `${weeklyDelta >= 0 ? "+" : ""}${weeklyDelta}% vs. semana anterior` : "Sem base na semana anterior"}</span><em aria-live="polite">{activeChartItem.value} {activeChartItem.value === 1 ? "demanda" : "demandas"} · {activeChartItem.label}</em></div>
              <div className="kleon-chart-legend"><span><i className="active"/>Em andamento</span><span><i className="completed"/>Concluídas</span><span><i className="canceled"/>Canceladas</span><small>Status atual por dia de abertura</small></div>
              <div className="reference-bar-chart kleon-demand-chart" aria-label={`Demandas criadas por dia da semana · ${chartRangeLabel}`}>
                {chartItems.map((item, index) => <button type="button" className={index === activeChartDay ? "active" : ""} aria-pressed={index === activeChartDay} aria-label={`${item.label}, ${item.date.toLocaleDateString("pt-BR")}: ${item.value} demandas; ${item.active} em andamento, ${item.completed} concluídas e ${item.canceled} canceladas`} title={`${item.value} demandas em ${item.label}`} key={item.label} onClick={() => setSelectedChartDay(index)}><span className="kleon-bar-group"><b>{item.value}</b><i className="series-active" style={{ height: `${(item.active / chartMax) * 100}%` }}/><i className="series-completed" style={{ height: `${(item.completed / chartMax) * 100}%` }}/><i className="series-canceled" style={{ height: `${(item.canceled / chartMax) * 100}%` }}/></span><small>{item.label}</small></button>)}
              </div>
              {!currentWeekTotal && <p className="kleon-chart-empty">Nenhum chamado registrado nesta semana.</p>}
            </article>


          </div>

          <article className="panel reference-ticket-panel">
            <div className="panel-heading"><div><h2>Demandas recentes</h2><p>Solicitações que podem exigir acompanhamento</p></div><button className="text-button" onClick={() => onNavigate("Chamados")}>Ver todas <ArrowRight size={14}/></button></div>
            <TicketTable tickets={focusTickets.slice(0, 5)} onOpen={() => onNavigate("Chamados")} />
          </article>
        </div>

        <aside className="reference-dashboard-rail">
            <article className="panel reference-schedule-card">
              <header><div><span>Próximos compromissos</span><h3>Agenda operacional</h3></div><button type="button" onClick={() => onNavigate("Próximos Eventos")}><ArrowRight size={14}/></button></header>
              <div className="reference-schedule-list">
                {schedule.map((event, index) => <button type="button" key={event.id} onClick={() => onNavigate("Próximos Eventos")}><span className={["peach","blue","lime","sand"][index % 4]}><CalendarDays size={14}/></span><div><strong>{event.title}</strong><small>{formatDate(event.startsAt)}</small></div><ChevronRight size={13}/></button>)}
                {!schedule.length && <div className="kleon-agenda-empty"><CalendarDays size={24}/><strong>Agenda livre</strong><p>Nenhum compromisso futuro.</p></div>}
              </div>
            </article>
          <article className="panel reference-performance-card kleon-performance-card">
            <header><div><span>Desempenho geral</span><h3>{executive ? "Execução municipal" : "Execução do setor"}</h3></div><button type="button" aria-label="Abrir indicadores" onClick={() => onNavigate(executive ? "Central Executiva" : "Indicadores")}><MoreHorizontal size={16}/></button></header>
            <div className="reference-performance-gauge" role="img" aria-label={focusTickets.length ? `${dashboardProfile === "executive" ? municipalSummary.completionRate : completionRate}% de conclusão` : "Sem chamados para calcular a conclusão"}>
              <svg viewBox="0 0 140 82" aria-hidden="true"><path className="gauge-track" pathLength="100" d="M14 70 A56 56 0 0 1 126 70"/><path className="gauge-value" pathLength="100" d="M14 70 A56 56 0 0 1 126 70" style={{ strokeDasharray: `${focusTickets.length ? dashboardProfile === "executive" ? municipalSummary.completionRate : completionRate : 0} 100` }}/></svg>
              <span><small>CONCLUSÃO</small><strong>{focusTickets.length ? `${dashboardProfile === "executive" ? municipalSummary.completionRate : completionRate}%` : "—"}</strong></span>
            </div>
            <div className="reference-performance-legend">
              <span><i className="done"/><small>Concluídas</small><strong>{completedTickets}</strong></span>
              <span><i className="active"/><small>Em andamento</small><strong>{openTickets.length}</strong></span>
              <span><i className="attention"/><small>Em atenção</small><strong>{dashboardProfile === "executive" ? municipalSummary.overdue : overdueTickets.length}</strong></span>
            </div>
            <button className="reference-performance-action" type="button" onClick={() => onNavigate(executive ? "Central Executiva" : "Indicadores")}>Ver detalhes <ArrowUpRight size={13}/></button>
          </article>

          <article className="panel reference-calendar-card">
            <header><button type="button" aria-label="Mês anterior" onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronRight size={13}/></button><strong>{calendarMonthLabel}</strong><button type="button" aria-label="Próximo mês" onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={13}/></button></header>
            <div className="reference-calendar-week"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
            <div className="reference-calendar-days">{Array.from({ length: calendarLeadingDays }, (_, index) => <span key={`empty-${index}`}/>) }{calendarDays.map((day) => {
              const date = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), day);
              const dateKey = dashboardCalendarKey(date);
              const isToday = dateKey === todayCalendarKey;
              const hasEvent = calendarEventKeys.has(dateKey);
              return <button type="button" className={`${isToday ? "active" : ""} ${hasEvent ? "has-event" : ""}`.trim()} aria-label={`${date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}${hasEvent ? ", com evento agendado" : ""}`} key={dateKey} onClick={() => onNavigate("Próximos Eventos")}>{day}</button>;
            })}</div>
          </article>

          <article className="panel reference-assignments-card">
            <header><div><span>Acompanhamento</span><h3>Demandas prioritárias</h3></div><button type="button" onClick={() => onNavigate("Chamados")}><Plus size={14}/></button></header>
            <div>{openTickets.slice(0, 3).map((ticket, index) => <button type="button" key={ticket.id} onClick={() => onNavigate("Chamados")}><span className={["peach","lime","blue"][index % 3]}><ClipboardList size={14}/></span><div><strong>{ticket.title}</strong><small>{ticket.protocol}</small></div><em>{ticket.status}</em></button>)}</div>
          </article>
        </aside>
      </section>

      <div className="reference-dashboard-ai">
        <DashboardAiBrief department={dashboardProfile === "executive" ? "Município" : department} tickets={focusTickets}/>
      </div>

      <div className="reference-dashboard-footer">
        <div className="task-choice-guide"><strong>Criar registro:</strong><button type="button" onClick={() => onNavigate("Chamados")}><ClipboardList size={14}/><span><b>Chamado</b><small>pedido a outro setor</small></span></button><button type="button" onClick={() => onNavigate("Central Integrada")}><ListTodo size={14}/><span><b>Tarefa</b><small>trabalho interno</small></span></button><button type="button" onClick={() => onNavigate("Processos Digitais")}><FileText size={14}/><span><b>Processo</b><small>procedimento formal</small></span></button><button type="button" onClick={() => onNavigate("Fluxos e Anotações")}><Pencil size={14}/><span><b>Anotação</b><small>registro rápido</small></span></button></div>
        <button className="dashboard-details-toggle" type="button" onClick={() => setShowDetails((current) => !current)}><span><LayoutDashboard size={17}/><span><strong>{showDetails ? "Ocultar detalhes" : "Ver indicadores detalhados"}</strong><small>Análise completa por status</small></span></span><ChevronRight className={showDetails ? "expanded" : ""} size={17}/></button>
      </div>
      {department === "Secretaria de Comunicação e Eventos" && <CommunicationEditorialCalendar onNavigate={onNavigate}/>} 

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

type TicketSavedView = "Todos" | "Urgentes" | "Atrasados" | "Minha equipe" | "Sem responsável";
type TicketColumn = "protocol" | "department" | "status" | "due" | "assignee";
type TicketWorkspacePreference = { viewMode: "board" | "table"; savedView: TicketSavedView; query: string; priority: "Todas" | Priority; status: "Todos" | TicketStatus; page: number; columns: TicketColumn[] };

function TicketsSection({ tickets, department, departments, userId, now, onStatus, onNew }: { tickets: Ticket[]; department: string; departments: string[]; userId: string; now: Date; onStatus: (id: string, status: TicketStatus) => void; onNew: () => void }) {
  const access = useCurrentPermission();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<TicketStatus>("Em execução");
  const defaultPreferences: TicketWorkspacePreference = { viewMode: "board", savedView: "Todos", query: "", priority: "Todas", status: "Todos", page: 1, columns: ["protocol", "department", "status", "due", "assignee"] };
  const [preferences, setPreferences, preferencesReady] = useLocalPreference<TicketWorkspacePreference>(`prefeitura:workspace:tickets:${normalizeText(userId)}:${normalizeText(department)}`, defaultPreferences);
  const nowTimestamp = now.getTime();
  const normalizedQuery = normalizeText(preferences.query);
  const filteredTickets = tickets.filter((ticket) => {
    const matchesQuery = !normalizedQuery || normalizeText([ticket.protocol, ticket.title, ticket.description, ticket.requester, ticket.department, ticket.assigneeName ?? "", ticket.neighborhood ?? ""].join(" ")).includes(normalizedQuery);
    const matchesPriority = preferences.priority === "Todas" || ticket.priority === preferences.priority;
    const matchesStatus = preferences.status === "Todos" || ticket.status === preferences.status;
    const isOpen = ticket.status !== "Concluído" && ticket.status !== "Cancelado";
    const matchesSavedView = preferences.savedView === "Todos"
      || (preferences.savedView === "Urgentes" && ticket.priority === "Urgente")
      || (preferences.savedView === "Atrasados" && isOpen && Boolean(ticket.dueDate) && new Date(ticket.dueDate as string).getTime() < nowTimestamp)
      || (preferences.savedView === "Minha equipe" && Boolean(ticket.assigneeId))
      || (preferences.savedView === "Sem responsável" && !ticket.assigneeId);
    return matchesQuery && matchesPriority && matchesStatus && matchesSavedView;
  });
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const activePage = Math.min(preferences.page, pageCount);
  const pageTickets = filteredTickets.slice((activePage - 1) * pageSize, activePage * pageSize);
  const savedViews: TicketSavedView[] = ["Todos", "Urgentes", "Atrasados", "Minha equipe", "Sem responsável"];
  const columnLabels: Record<TicketColumn, string> = { protocol: "Chamado", department: "Setor", status: "Status", due: "Prazo", assignee: "Responsável" };
  const updatePreferences = (patch: Partial<TicketWorkspacePreference>) => setPreferences((current) => ({ ...current, ...patch }));
  const toggleColumn = (column: TicketColumn) => setPreferences((current) => ({ ...current, columns: current.columns.includes(column) ? current.columns.filter((item) => item !== column) : [...current.columns, column] }));
  const toggleSelection = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  function applyBulkStatus() {
    selectedIds.forEach((id) => onStatus(id, bulkStatus));
    setSelectedIds([]);
  }

  if (!preferencesReady) return <section className="ticket-workspace-skeleton" role="status" aria-label="Carregando filtros dos chamados"><span/><span/><span/><div><i/><i/><i/><i/></div></section>;

  return (
    <section className="board-wrap ticket-workspace-v61">
      <div className="access-note ticket-privacy-note"><span><ShieldCheck size={20} /></span><div><strong>Fluxo setorial com responsabilidade definida</strong><p>Você está vendo somente as demandas de {department}. Filtros, página e modo de visualização são lembrados quando você retorna.</p></div></div>
      <div className="ticket-workspace-toolbar">
        <label className="ticket-workspace-search"><Search size={16}/><input type="search" aria-label="Buscar nos chamados" placeholder="Buscar protocolo, assunto, bairro ou responsável" value={preferences.query} onChange={(event) => updatePreferences({ query: event.target.value, page: 1 })}/></label>
        <label><span>Prioridade</span><select value={preferences.priority} onChange={(event) => updatePreferences({ priority: event.target.value as TicketWorkspacePreference["priority"], page: 1 })}><option>Todas</option><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
        <label><span>Status</span><select value={preferences.status} onChange={(event) => updatePreferences({ status: event.target.value as TicketWorkspacePreference["status"], page: 1 })}><option>Todos</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <div className="ticket-view-switch" role="group" aria-label="Modo de visualização"><button type="button" className={preferences.viewMode === "board" ? "active" : ""} aria-pressed={preferences.viewMode === "board"} onClick={() => updatePreferences({ viewMode: "board" })}><LayoutDashboard size={15}/> Quadro</button><button type="button" className={preferences.viewMode === "table" ? "active" : ""} aria-pressed={preferences.viewMode === "table"} onClick={() => updatePreferences({ viewMode: "table" })}><List size={15}/> Tabela</button></div>
        {preferences.viewMode === "table" && <details className="ticket-column-picker"><summary><Settings size={15}/> Colunas</summary><div>{(Object.keys(columnLabels) as TicketColumn[]).map((column) => <label key={column}><input type="checkbox" checked={preferences.columns.includes(column)} onChange={() => toggleColumn(column)}/><span>{columnLabels[column]}</span></label>)}</div></details>}
        {access.register && <button className="button primary" onClick={onNew}><Plus size={16} /> Criar chamado</button>}
      </div>

      <div className="ticket-saved-views" aria-label="Visualizações salvas">{savedViews.map((view) => <button type="button" key={view} className={preferences.savedView === view ? "active" : ""} aria-pressed={preferences.savedView === view} onClick={() => updatePreferences({ savedView: view, page: 1 })}>{view}<strong>{view === "Todos" ? tickets.length : view === "Urgentes" ? tickets.filter((ticket) => ticket.priority === "Urgente").length : view === "Atrasados" ? tickets.filter((ticket) => !["Concluído", "Cancelado"].includes(ticket.status) && Boolean(ticket.dueDate) && new Date(ticket.dueDate as string).getTime() < nowTimestamp).length : view === "Minha equipe" ? tickets.filter((ticket) => ticket.assigneeId).length : tickets.filter((ticket) => !ticket.assigneeId).length}</strong></button>)}</div>

      {selectedIds.length > 0 && access.edit && <div className="ticket-bulk-bar" role="status"><span><CheckCheck size={16}/><strong>{selectedIds.length} selecionados</strong></span><label>Alterar status<select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as TicketStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><button type="button" onClick={applyBulkStatus}>Aplicar</button><button type="button" onClick={() => setSelectedIds([])}>Limpar seleção</button></div>}

      {preferences.viewMode === "table" ? <div className="panel advanced-ticket-table-wrap"><table className="advanced-ticket-table"><thead><tr>{access.edit && <th className="select-column"><input type="checkbox" aria-label="Selecionar chamados da página" checked={pageTickets.length > 0 && pageTickets.every((ticket) => selectedIds.includes(ticket.id))} onChange={(event) => setSelectedIds((current) => event.target.checked ? Array.from(new Set([...current, ...pageTickets.map((ticket) => ticket.id)])) : current.filter((id) => !pageTickets.some((ticket) => ticket.id === id)))}/></th>}{preferences.columns.includes("protocol") && <th>Chamado</th>}{preferences.columns.includes("department") && <th>Setor</th>}{preferences.columns.includes("status") && <th>Status</th>}{preferences.columns.includes("due") && <th>Prazo</th>}{preferences.columns.includes("assignee") && <th>Responsável</th>}<th aria-label="Abrir"/></tr></thead><tbody>{pageTickets.map((ticket) => <tr key={ticket.id}>{access.edit && <td className="select-column" data-label="Selecionar"><input type="checkbox" aria-label={`Selecionar ${ticket.protocol}`} checked={selectedIds.includes(ticket.id)} onChange={() => toggleSelection(ticket.id)}/></td>}{preferences.columns.includes("protocol") && <td data-label="Chamado"><button className="ticket-table-title" onClick={() => setSelectedTicket(ticket)}><span className={`priority-dot ${ticket.priority.toLowerCase().replace("é", "e")}`}/><span><strong>{ticket.title}</strong><small>{ticket.protocol} · {ticket.requester}</small></span></button></td>}{preferences.columns.includes("department") && <td data-label="Setor">{ticket.department}</td>}{preferences.columns.includes("status") && <td data-label="Status"><StatusPill status={ticket.status}/></td>}{preferences.columns.includes("due") && <td data-label="Prazo"><span className={formatDue(ticket.dueDate).startsWith("Hoje") ? "due urgent" : "due"}><Clock3 size={12}/>{formatDue(ticket.dueDate)}</span></td>}{preferences.columns.includes("assignee") && <td data-label="Responsável"><span className="assignee-cell"><i className="mini-avatar">{ticket.assigneeInitials ?? "--"}</i>{ticket.assigneeName ?? "A definir"}</span></td>}<td data-label="Abrir"><button className="table-menu" aria-label={`Abrir ${ticket.protocol}`} onClick={() => setSelectedTicket(ticket)}><ChevronRight size={16}/></button></td></tr>)}</tbody></table>{!filteredTickets.length && <div className="module-empty ticket-filter-empty"><Search size={27}/><strong>Nenhum chamado nesta visualização</strong><p>Revise os filtros ou volte à visão completa.</p><button type="button" onClick={() => setPreferences(defaultPreferences)}>Limpar filtros</button></div>}<footer className="ticket-pagination"><span>Mostrando {filteredTickets.length ? (activePage - 1) * pageSize + 1 : 0}–{Math.min(activePage * pageSize, filteredTickets.length)} de {filteredTickets.length}</span><div><button type="button" disabled={activePage === 1} onClick={() => updatePreferences({ page: activePage - 1 })} aria-label="Página anterior"><ChevronRight size={14}/></button><strong>Página {activePage} de {pageCount}</strong><button type="button" disabled={activePage === pageCount} onClick={() => updatePreferences({ page: activePage + 1 })} aria-label="Próxima página"><ChevronRight size={14}/></button></div></footer></div> : <div className="kanban-board">
        {statuses.map((status) => {
          const StatusIcon = statusMeta[status].icon;
          const columnTickets = filteredTickets.filter((ticket) => ticket.status === status);
          return <section className={`kanban-column ${statusMeta[status].color}`} key={status}><header title={statusMeta[status].description}><span><StatusIcon size={14}/>{statusMeta[status].short}</span><strong>{columnTickets.length}</strong></header><div className="kanban-cards">{columnTickets.map((ticket) => <article className="kanban-card" key={ticket.id}><div className="card-meta"><span className={`priority-label ${ticket.priority.toLowerCase().replace("é", "e")}`}>{ticket.priority}</span><button aria-label={`Opções de ${ticket.protocol}`} onClick={() => setSelectedTicket(ticket)}><MoreHorizontal size={17}/></button></div><h3>{ticket.title}</h3><p>{ticket.description}</p><small>{ticket.protocol} · {ticket.requester}{ticket.neighborhood ? ` · ${ticket.neighborhood}` : ""}</small><div className="ticket-template-line"><span>{ticket.priority === "Urgente" ? "Atendimento imediato" : "Prazo setorial"}</span><span>{ticket.assigneeName ? "Responsável definido" : "Aguardando atribuição"}</span></div><div className="kanban-footer"><span className="mini-avatar">{ticket.assigneeInitials ?? "--"}</span><span className={formatDue(ticket.dueDate).startsWith("Hoje") ? "due urgent" : "due"}><Clock3 size={12}/>{formatDue(ticket.dueDate)}</span></div>{access.edit ? <label className="move-label">Mover para<select aria-label={`Mover ${ticket.protocol}`} value={ticket.status} onChange={(event) => onStatus(ticket.id, event.target.value as TicketStatus)}>{statuses.map((option) => <option key={option}>{option}</option>)}</select></label> : <span className="read-only-chip"><ShieldCheck size={11}/> Somente consulta</span>}<button className="ticket-detail-button" onClick={() => setSelectedTicket(ticket)}>Abrir detalhes e checklist <ArrowRight size={12}/></button></article>)}{columnTickets.length === 0 && <div className="column-empty">Nenhum chamado nesta etapa</div>}</div></section>;
        })}
      </div>}
      <div className="status-legend-v61" aria-label="Legenda de status">{statuses.map((status) => { const Icon = statusMeta[status].icon; return <span key={status} title={statusMeta[status].description}><Icon size={12}/><strong>{statusMeta[status].short}</strong><small>{statusMeta[status].description}</small></span>; })}</div>
      {selectedTicket && <TicketDetailModal ticket={selectedTicket} departments={departments} onClose={() => setSelectedTicket(null)} onStatus={(status) => { onStatus(selectedTicket.id, status); setSelectedTicket((current) => current ? { ...current, status } : current); }}/>} 
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
  const directUsers = users.filter((user) => user.id !== currentUser.id);
  const [tab, setTab] = useState<ChatTab>(() => directUsers.length ? "direct" : groups.length ? "group" : "direct");
  const [conversationSearch, setConversationSearch] = useState("");
  const [selected, setSelected] = useState(() => directUsers[0]?.id ?? groups[0]?.id ?? "");
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
  const selectionIsValid = tab === "direct" ? directUsers.some((user) => user.id === selected) : groups.some((group) => group.id === selected);
  const effectiveSelected = selectionIsValid ? selected : tab === "direct" ? directUsers[0]?.id ?? "" : groups[0]?.id ?? "";
  const conversationThreadId = tab === "direct" && effectiveSelected ? directConversationId(currentUser.id, effectiveSelected) : effectiveSelected;
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
            const intersectoral = !sameDepartment(user.department, currentUser.department);
            return <button key={user.id} className={effectiveSelected === user.id ? "conversation active" : "conversation"} onClick={() => selectConversation(user.id)}>
              <span className="avatar conversation-avatar">{user.initials}<b /></span><span><strong>{user.fullName}</strong><small>{last?.body || last?.attachmentName || user.department}</small>{intersectoral && <em className="intersectoral-contact">{user.role} · {user.department}</em>}</span><span className="conversation-side"><time>{last ? formatTime(last.createdAt) : ""}</time>{index < 2 && <i>{index + 1}</i>}</span>
            </button>;
          }) : filteredGroups.map((group) => {
            const last = lastConversationMessage("group", group.id);
            return <button key={group.id} className={effectiveSelected === group.id ? "conversation active" : "conversation"} onClick={() => selectConversation(group.id)}>
              <span className="group-avatar"><Hash size={16} /></span><span><strong>{group.name}</strong><small>{last?.body || last?.attachmentName || `${group.memberCount} participantes`}</small></span><span className="conversation-side"><time>{last ? formatTime(last.createdAt) : ""}</time></span>
            </button>;
          })}
          {tab === "direct" && !filteredDirectUsers.length && <div className="chat-panel-empty"><UserRound size={24} /><strong>Nenhum contato encontrado</strong><p>Busque pelo nome do secretário ou pela secretaria.</p></div>}
          {tab === "group" && !filteredGroups.length && <div className="chat-panel-empty"><UsersRound size={24} /><strong>Nenhum grupo disponível</strong><p>Os canais internos válidos do setor aparecerão aqui.</p></div>}
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

type NotificationCategory = "Todas" | "Urgentes" | "Pendentes" | "Informativas" | "Menções" | "Processos" | "Lembrar depois";

function NotificationsSection({ notifications, userId, onRead, onOpenPending }: { notifications: NotificationItem[]; userId: string; onRead: (id: string) => void; onOpenPending: () => void }) {
  const [preferences, setPreferences, preferencesReady] = useLocalPreference<{ category: NotificationCategory; laterIds: string[]; mutedInformational: boolean }>(`prefeitura:notifications:${userId}:v2`, { category: "Todas", laterIds: [], mutedInformational: false });
  const iconByType: Record<NotificationItem["type"], LucideIcon> = { group_invite: UserPlus, ticket: ClipboardList, message: MessagesSquare, system: BellRing };
  const categoryOf = (item: NotificationItem): Exclude<NotificationCategory, "Todas" | "Lembrar depois"> => {
    const content = normalizeText(`${item.title} ${item.body}`);
    if (item.type === "ticket" && (content.includes("aprov") || content.includes("urgente") || content.includes("prazo"))) return "Urgentes";
    if (item.type === "group_invite" || item.type === "ticket") return "Pendentes";
    if (item.type === "message") return "Menções";
    if (content.includes("processo") || content.includes("protocolo")) return "Processos";
    return "Informativas";
  };
  const categories: NotificationCategory[] = ["Todas", "Urgentes", "Pendentes", "Informativas", "Menções", "Processos", "Lembrar depois"];
  const categoryCount = (category: NotificationCategory) => category === "Todas" ? notifications.filter((item) => !preferences.laterIds.includes(item.id)).length : category === "Lembrar depois" ? notifications.filter((item) => preferences.laterIds.includes(item.id)).length : notifications.filter((item) => categoryOf(item) === category && !preferences.laterIds.includes(item.id)).length;
  const sorted = [...notifications]
    .filter((item) => preferences.category === "Lembrar depois" ? preferences.laterIds.includes(item.id) : !preferences.laterIds.includes(item.id))
    .filter((item) => preferences.category === "Todas" || preferences.category === "Lembrar depois" || categoryOf(item) === preferences.category)
    .filter((item) => !preferences.mutedInformational || categoryOf(item) !== "Informativas")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const toggleLater = (id: string) => setPreferences((current) => ({ ...current, laterIds: current.laterIds.includes(id) ? current.laterIds.filter((item) => item !== id) : [...current.laterIds, id] }));

  if (!preferencesReady) return <div className="notification-skeleton" role="status" aria-label="Organizando notificações"><span/><span/><span/></div>;

  return (
    <section className="notification-layout notification-center-v61">
      <article className="panel notification-panel">
        <header className="section-title"><div><h2>Central de notificações</h2><p>{notifications.filter((item) => !item.readAt).length} {notifications.filter((item) => !item.readAt).length === 1 ? "aviso não lido" : "avisos não lidos"}</p></div><button type="button" className={preferences.mutedInformational ? "notification-mute active" : "notification-mute"} aria-pressed={preferences.mutedInformational} onClick={() => setPreferences((current) => ({ ...current, mutedInformational: !current.mutedInformational }))}><Bell size={15}/>{preferences.mutedInformational ? "Informativos silenciados" : "Silenciar baixa prioridade"}</button></header>
        <nav className="notification-category-tabs" aria-label="Categorias das notificações">{categories.map((category) => <button type="button" key={category} className={preferences.category === category ? "active" : ""} aria-pressed={preferences.category === category} onClick={() => setPreferences((current) => ({ ...current, category }))}><span>{category}</span><strong>{categoryCount(category)}</strong></button>)}</nav>
        <div className="notification-list">
          {sorted.map((item) => {
            const NoticeIcon = iconByType[item.type];
            const category = categoryOf(item);
            const savedForLater = preferences.laterIds.includes(item.id);
            return <article className={`notification-row ${item.readAt ? "read" : "unread"} category-${normalizeText(category)}`} key={item.id}><span className={`notification-type ${item.type}`}><NoticeIcon size={18}/></span><div className="notification-copy"><div><strong>{item.title}</strong>{!item.readAt && <i>NOVA</i>}<em>{category}</em></div><p>{item.body}</p><small>{item.actorName ? `${item.actorName} · ` : ""}{formatRelative(item.createdAt)}</small></div><div className="notification-actions">{item.type === "group_invite" && <button className="button primary" onClick={() => { onRead(item.id); onOpenPending(); }}><UserPlus size={14}/> Ver convite</button>}<button className="button secondary" onClick={() => toggleLater(item.id)}><Clock3 size={14}/>{savedForLater ? "Voltar à caixa" : "Lembrar depois"}</button>{!item.readAt && <button className="button secondary" onClick={() => onRead(item.id)}><Check size={14}/> Marcar como lida</button>}</div></article>;
          })}
          {!sorted.length && <div className="module-empty"><BellRing size={28}/><strong>Nenhum aviso nesta categoria</strong><p>Altere a categoria ou revise os itens marcados para depois.</p><button type="button" onClick={() => setPreferences((current) => ({ ...current, category: "Todas", mutedInformational: false }))}>Ver todas as notificações</button></div>}
        </div>
      </article>
      <aside className="panel notification-guide"><span><ShieldCheck size={21}/></span><h2>Organização segura</h2><p>Os avisos continuam vinculados ao usuário e ao setor autorizado.</p><ul><li>Urgentes e pendentes no topo</li><li>Menções e processos separados</li><li>Lembretes preservados para depois</li></ul><small>{preferences.mutedInformational ? "Avisos informativos estão silenciados neste dispositivo." : "Todos os níveis de prioridade estão visíveis."}</small></aside>
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
  const orderedEvents = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const anchor = orderedEvents.find((event) => new Date(event.startsAt).getTime() >= Date.now()) ?? orderedEvents[0];
    const initialDate = anchor ? new Date(anchor.startsAt) : new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const today = new Date();
  const calendarDaysInMonth = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 0).getDate();
  const calendarLeadingDays = (new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1).getDay() + 6) % 7;
  const calendarDays = Array.from({ length: calendarDaysInMonth }, (_, index) => index + 1);
  const calendarMonthLabel = calendarCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const eventDateKeys = new Set(orderedEvents.map((event) => dashboardCalendarKey(new Date(event.startsAt))));
  const displayedMonthEvent = orderedEvents.find((event) => {
    const date = new Date(event.startsAt);
    return date.getFullYear() === calendarCursor.getFullYear() && date.getMonth() === calendarCursor.getMonth();
  });
  return (
    <section className="events-layout events-layout-v3">
      <article className="panel events-command-v3">
        <div><span className="events-command-icon"><CalendarDays size={19}/></span><div><p className="eyebrow">AGENDA COMPARTILHADA</p><h2>{calendarMonthLabel}</h2><p>Compromissos, reuniões e prazos de {department} organizados em uma única linha de trabalho.</p></div></div>
        <div className="events-command-stats"><span><strong>{events.length}</strong><small>eventos</small></span><span><strong>{events.filter((event) => Boolean(event.location)).length}</strong><small>com local</small></span>{access.register && <button type="button" className="button primary" onClick={onNew}><CalendarPlus size={14}/> Novo evento</button>}</div>
      </article>

      <div className="events-workspace-v3">
        <aside className="panel events-calendar-v3">
          <header><div><span>Calendário</span><h3>{calendarMonthLabel}</h3></div><nav aria-label="Navegar entre meses"><button type="button" className="previous" aria-label="Mês anterior" onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronRight size={14}/></button><button type="button" aria-label="Próximo mês" onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={14}/></button></nav></header>
          <div className="events-calendar-week"><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span>D</span></div>
          <div className="events-calendar-days">{Array.from({ length: calendarLeadingDays }, (_, index) => <span key={`empty-${index}`}/>)}{calendarDays.map((day) => {
            const date = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), day);
            const dateKey = dashboardCalendarKey(date);
            const isToday = dateKey === dashboardCalendarKey(today);
            const hasEvent = eventDateKeys.has(dateKey);
            return <button type="button" className={`${isToday ? "active" : ""} ${hasEvent ? "has-event" : ""}`.trim()} aria-label={`${date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}${hasEvent ? ", com compromisso" : ""}`} key={dateKey}>{day}</button>;
          })}</div>
          <div className="events-calendar-legend"><span><i/> Dia atual</span><span><i/> Com compromisso</span></div>
          <div className="events-calendar-summary"><span><CalendarDays size={15}/></span><div><strong>{displayedMonthEvent?.title ?? "Agenda livre neste mês"}</strong><small>{displayedMonthEvent ? formatEventRange(displayedMonthEvent.startsAt, displayedMonthEvent.endsAt) : "Nenhum compromisso programado"}</small></div></div>
        </aside>

        <div className="events-feed-v3">
          <header className="events-feed-heading"><div><p className="eyebrow">PRÓXIMOS COMPROMISSOS</p><h2>Linha do tempo da agenda</h2></div><span>{events.length} {events.length === 1 ? "registro" : "registros"}</span></header>
      {events.length ? <div className="events-grid">{orderedEvents.map((event, index) => {
        const calendar = eventDateParts(event.startsAt);
        const canManageEvent = access.edit && sameDepartment(event.department, department);
        return <article className={`panel event-card ${index === 0 ? "featured" : ""}`} key={event.id}>
          <div className="event-date"><small>{calendar.month}</small><strong>{calendar.day}</strong><span>{calendar.weekday}</span></div>
          <div className="event-copy"><div className="event-card-top"><div className="event-meta"><span><Clock3 size={13} /> {formatEventRange(event.startsAt, event.endsAt)}</span>{event.location && <span><MapPin size={13} /> {event.location}</span>}</div>{canManageEvent && <div className="event-card-actions"><button type="button" onClick={() => onEdit(event)} aria-label={`Editar ${event.title}`}><Pencil size={13} /></button><button type="button" className="danger" onClick={() => onDelete(event)} aria-label={`Excluir ${event.title}`}><Trash2 size={13} /></button></div>}</div><h2>{event.title}</h2><p>{event.description || "Sem observações adicionais."}</p><div className="event-sector-tags" aria-label={`Visível em ${department}`}><span><Building2 size={11} /> {department}</span><span><ShieldCheck size={11}/> Agenda do setor</span></div><footer><span className="mini-avatar">{event.creatorInitials}</span><span>Criado por <strong>{event.creatorName}</strong></span><button type="button" onClick={() => canManageEvent ? onEdit(event) : undefined}>Ver detalhes <ChevronRight size={12}/></button></footer></div>
        </article>;
      })}</div> : <div className="panel module-empty events-empty"><CalendarDays size={34} /><strong>Nenhum evento agendado</strong><p>{access.register ? "Cadastre reuniões, prazos e compromissos importantes para o seu setor." : "Os próximos compromissos autorizados aparecerão aqui."}</p>{access.register && <button type="button" className="button primary" onClick={onNew}><CalendarPlus size={15} /> Criar primeiro evento</button>}</div>}
        </div>
      </div>
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
  type TicketDraft = { department: string; neighborhood: string; address: string; title: string; description: string; priority: Priority; dueDate: string };
  const draftKey = "prefeitura:draft:new-ticket:v1";
  const [step, setStep] = useState<1 | 2 | 3>(1); const [department, setDepartment] = useState(departments[0] ?? ""); const [neighborhood, setNeighborhood] = useState(""); const [address, setAddress] = useState(""); const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [priority, setPriority] = useState<Priority>("Média"); const [dueDate, setDueDate] = useState(""); const [draftRecovered, setDraftRecovered] = useState(false); const [draftSaveState, setDraftSaveState] = useState<"saved" | "saving">("saved"); const [errors, setErrors] = useState<{ title?: string; department?: string; dueDate?: string }>({}); const [submitError, setSubmitError] = useState(""); const [aiBusy, setAiBusy] = useState(false); const [aiHint, setAiHint] = useState("");
  const skipNextDraftSave = useRef(false);
  const draftLoaded = useRef(false);
  const eligibleUsers = users.filter((user) => sameDepartment(user.department, department));
  const hasUnsavedChanges = Boolean(title.trim() || description.trim() || neighborhood.trim() || address.trim() || dueDate || priority !== "Média" || !sameDepartment(department, departments[0] ?? ""));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(draftKey);
        const saved = raw ? JSON.parse(raw) as TicketDraft : null;
        if (saved) {
          const restoredDepartment = departments.find((item) => sameDepartment(item, saved.department));
          setDepartment(restoredDepartment ?? departments[0] ?? ""); setNeighborhood(saved.neighborhood ?? ""); setAddress(saved.address ?? ""); setTitle(saved.title ?? ""); setDescription(saved.description ?? ""); setPriority(saved.priority ?? "Média"); setDueDate(saved.dueDate ?? ""); setDraftRecovered(true);
        }
      } catch { /* rascunho inválido ou indisponível */ }
      draftLoaded.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [departments]);
  useEffect(() => {
    if (!draftLoaded.current) return;
    if (skipNextDraftSave.current) { skipNextDraftSave.current = false; return; }
    const draft: TicketDraft = { department, neighborhood, address, title, description, priority, dueDate };
    setDraftSaveState("saving");
    const timer = window.setTimeout(() => { try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* armazenamento indisponível */ } setDraftSaveState("saved"); }, 250);
    return () => window.clearTimeout(timer);
  }, [address, department, description, dueDate, neighborhood, priority, title]);
  function validate(targetStep: 1 | 2 | 3) {
    const nextErrors: typeof errors = {};
    if ((targetStep === 1 || targetStep === 3) && title.trim().length < 4) nextErrors.title = "Informe um título objetivo com pelo menos 4 caracteres.";
    if ((targetStep === 2 || targetStep === 3) && !department.trim()) nextErrors.department = "Selecione o setor responsável.";
    if ((targetStep === 2 || targetStep === 3) && dueDate && Number.isNaN(new Date(`${dueDate}T12:00:00`).getTime())) nextErrors.dueDate = "Informe uma data válida.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitError("");
    if (step < 3) { if (validate(step)) setStep((step + 1) as 2 | 3); return; }
    if (!validate(3)) { setStep(title.trim().length < 4 ? 1 : 2); return; }
    const result = await onCreate(new FormData(event.currentTarget));
    if (result === null) { setSubmitError("Não foi possível salvar o chamado. Revise sua permissão e tente novamente."); return; }
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    setDraftRecovered(false);
  }
  function requestClose() { if (!hasUnsavedChanges || window.confirm("Sair sem concluir? O rascunho ficará salvo automaticamente para você continuar depois.")) onClose(); }
  function discardDraft() { skipNextDraftSave.current = true; setTitle(""); setDescription(""); setNeighborhood(""); setAddress(""); setPriority("Média"); setDueDate(""); setDepartment(departments[0] ?? ""); setDraftRecovered(false); setErrors({}); setStep(1); try { localStorage.removeItem(draftKey); } catch { /* ignore */ } }
  async function assistWithAi() { if (!title.trim() && !description.trim()) { setAiHint("Escreva ao menos um título ou uma descrição para a IA analisar."); return; } setAiBusy(true); setAiHint(""); try { const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "ticket_assist", title, description, neighborhood, departments }) }); const payload = await response.json() as { result?: { title:string; description:string; department:string; priority:Priority; dueDays:number; slaHours:number; tags:string[]; checklist:string[]; source:string }; error?:string }; if (!response.ok || !payload.result) throw new Error(payload.error || "Não foi possível preparar o chamado com IA."); const result = payload.result; setTitle(result.title || title); setDescription(result.description || description); if (departments.some((item) => sameDepartment(item, result.department))) setDepartment(departments.find((item) => sameDepartment(item, result.department)) ?? department); setPriority(result.priority || priority); const target = new Date(); target.setDate(target.getDate()+Math.max(0,result.dueDays||0)); setDueDate(target.toISOString().slice(0,10)); setAiHint(`IA sugeriu setor, prioridade e prazo · SLA recomendado: ${result.slaHours}h${result.tags.length ? ` · ${result.tags.slice(0,3).join(", ")}` : ""}. Revise antes de criar.`); } catch(error) { setAiHint(error instanceof Error ? error.message : "Falha ao consultar a IA."); } finally { setAiBusy(false); } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}><section className="modal ticket-create-modal ticket-step-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title"><header><div><p className="eyebrow">NOVO REGISTRO · ETAPA {step} DE 3</p><h2 id="ticket-modal-title">Criar chamado</h2><small className={`draft-save-state ${draftSaveState}`}><RefreshCw className={draftSaveState === "saving" ? "spin" : ""} size={12}/>{draftSaveState === "saving" ? "Salvando rascunho…" : "Rascunho salvo automaticamente"}</small></div><button type="button" onClick={requestClose} aria-label="Fechar"><X size={18}/></button></header><form onSubmit={submit} noValidate>
    <ol className="ticket-form-progress" aria-label="Progresso do formulário"><li className={step >= 1 ? "active" : ""}><span>{step > 1 ? <Check size={12}/> : "1"}</span><strong>Identificação</strong></li><li className={step >= 2 ? "active" : ""}><span>{step > 2 ? <Check size={12}/> : "2"}</span><strong>Encaminhamento</strong></li><li className={step >= 3 ? "active" : ""}><span>3</span><strong>Revisão</strong></li></ol>
    {draftRecovered && <div className="draft-recovery-note full" role="status"><RefreshCw size={15}/><span><strong>Rascunho recuperado</strong><small>O preenchimento anterior foi restaurado automaticamente.</small></span><button type="button" onClick={discardDraft}>Descartar</button></div>}
    <section className="ticket-form-step" hidden={step !== 1} aria-labelledby="ticket-step-one"><div className="ticket-step-heading"><span><FileText size={17}/></span><div><h3 id="ticket-step-one">Identifique a solicitação</h3><p>Descreva o pedido em linguagem direta para facilitar a triagem.</p></div></div><label className="field full"><span>Modelo da solicitação</span><select name="template" defaultValue="Solicitação geral"><option>Solicitação geral</option><option>Manutenção de veículo</option><option>Solicitação de material</option><option>Reparo em iluminação</option><option>Suporte de informática</option><option>Produção de arte e comunicação</option><option>Agendamento de espaço</option><option>Solicitação de transporte</option><option>Compra ou contratação</option><option>Vistoria técnica</option></select><small className="field-hint">O modelo define checklist, documentos obrigatórios e prazo padrão.</small></label><label className={`field full ${errors.title ? "field-error" : ""}`}><span>Título do chamado *</span><input name="title" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "ticket-title-error" : undefined} placeholder="Ex.: Reparo da iluminação da avenida" autoFocus value={title} onChange={(event)=>{setTitle(event.target.value);setErrors((current)=>({...current,title:undefined}));}}/>{errors.title ? <small id="ticket-title-error" className="inline-error"><AlertTriangle size={12}/>{errors.title}</small> : <small className="field-hint">Use serviço + local + situação.</small>}</label><label className="field full"><span>Descrição</span><textarea name="description" placeholder="Inclua contexto, entregáveis, local e observações..." value={description} onChange={(event)=>setDescription(event.target.value)}/><small className="field-hint">Evite dados pessoais que não sejam necessários ao atendimento.</small></label><div className="ticket-ai-assist full"><button type="button" disabled={aiBusy || (!title.trim() && !description.trim())} onClick={()=>void assistWithAi()}><Sparkles size={15}/>{aiBusy ? "Analisando com Groq..." : "IA: classificar e preencher"}</button>{aiHint && <small>{aiHint}</small>}</div></section>
    <section className="ticket-form-step" hidden={step !== 2} aria-labelledby="ticket-step-two"><div className="ticket-step-heading"><span><Workflow size={17}/></span><div><h3 id="ticket-step-two">Defina o encaminhamento</h3><p>Informe local, setor, responsabilidade, prioridade e prazo.</p></div></div><AddressRegistrationField neighborhood={neighborhood} address={address} onNeighborhoodChange={setNeighborhood} onAddressChange={setAddress}/><label className={`field ${errors.department ? "field-error" : ""}`}><span>Setor responsável *</span><select name="department" aria-invalid={Boolean(errors.department)} value={department} onChange={(event)=>{setDepartment(event.target.value);setErrors((current)=>({...current,department:undefined}));}}>{departments.map((item)=><option key={item}>{item}</option>)}</select>{errors.department && <small className="inline-error"><AlertTriangle size={12}/>{errors.department}</small>}</label><label className="field"><span>Responsável principal</span><select name="assigneeId" defaultValue="" disabled={!department}><option value="">{department ? "A definir" : "Selecione primeiro o setor"}</option>{eligibleUsers.map((user)=><option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label><label className="field"><span>Prioridade</span><select name="priority" value={priority} onChange={(event)=>setPriority(event.target.value as Priority)}><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label><label className={`field ${errors.dueDate ? "field-error" : ""}`}><span>Prazo ou SLA</span><input type="date" name="dueDate" aria-invalid={Boolean(errors.dueDate)} value={dueDate} onChange={(event)=>{setDueDate(event.target.value);setErrors((current)=>({...current,dueDate:undefined}));}}/>{errors.dueDate && <small className="inline-error"><AlertTriangle size={12}/>{errors.dueDate}</small>}</label><label className="field full"><span>Colaboradores e pessoas que acompanham</span><select name="followers" defaultValue=""><option value="">Definir depois da criação</option>{eligibleUsers.map((user)=><option key={user.id} value={user.id}>{user.fullName} · {user.role}</option>)}</select></label></section>
    <section className="ticket-form-step ticket-review-step" hidden={step !== 3} aria-labelledby="ticket-step-three"><div className="ticket-step-heading"><span><CheckCircle2 size={17}/></span><div><h3 id="ticket-step-three">Revise antes de registrar</h3><p>Confirme os dados essenciais. O histórico começa após o registro.</p></div></div><div className="ticket-review-grid"><article><small>Solicitação</small><strong>{title || "Título não informado"}</strong><p>{description || "Sem descrição complementar."}</p><button type="button" onClick={()=>setStep(1)}>Editar identificação</button></article><article><small>Encaminhamento</small><strong>{department || "Setor não informado"}</strong><p>{priority} · {dueDate ? new Date(`${dueDate}T12:00:00`).toLocaleDateString("pt-BR") : "Sem prazo definido"}</p><button type="button" onClick={()=>setStep(2)}>Editar encaminhamento</button></article><article><small>Local</small><strong>{neighborhood || "Bairro não informado"}</strong><p>{address || "Endereço não informado."}</p></article></div></section>
    <p className="ticket-modal-privacy"><ShieldCheck size={14}/> O chamado ficará visível ao setor responsável. A IA apenas sugere classificação, prioridade e prazo; o servidor confirma antes do registro.</p>
    {submitError && <p className="ticket-submit-error" role="alert"><AlertTriangle size={14}/>{submitError}<button type="button" onClick={()=>setSubmitError("")}>Tentar novamente</button></p>}
    <div className="modal-actions ticket-sticky-actions"><button type="button" className="button secondary" onClick={requestClose}>Cancelar</button><span className="modal-action-spacer"/>{step > 1 && <button type="button" className="button secondary" onClick={()=>setStep((step - 1) as 1 | 2)}>Voltar</button>}<button type="submit" className="button primary">{step < 3 ? <>Continuar <ArrowRight size={15}/></> : <><Plus size={15}/> Criar e registrar</>}</button></div>
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
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal group-modal" role="dialog" aria-modal="true" aria-labelledby="group-modal-title"><header><div><p className="eyebrow">COMUNICAÇÃO DO SETOR</p><h2 id="group-modal-title">Criar grupo por convite</h2></div><button onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><form action={submit}><label className="field full"><span>Nome do grupo *</span><input name="name" required placeholder="Ex.: Planejamento semanal" autoFocus /></label><label className="field full"><span>Objetivo</span><textarea name="description" placeholder="Qual é o objetivo desta conversa?" /></label><fieldset className="member-picker"><legend>Quem você deseja adicionar?</legend><div className="member-tools"><label><Search size={15} /><input aria-label="Buscar pessoa para o grupo" placeholder="Buscar por nome no setor..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" onClick={toggleAll}>{selected.length === candidates.length ? "Limpar seleção" : "Selecionar todos"}</button></div><div className="member-results">{filtered.map((user) => <label className={selected.includes(user.id) ? "selected" : ""} key={user.id}><input type="checkbox" checked={selected.includes(user.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))} /><span className="mini-avatar">{user.initials}</span><span><strong>{user.fullName}</strong><small>{user.department} · {user.role}</small></span><i>{selected.includes(user.id) ? <Check size={12} /> : <Plus size={12} />}</i></label>)}</div><p className="member-count"><UsersRound size={14} /><strong>{selected.length}</strong> {selected.length === 1 ? "pessoa selecionada" : "pessoas selecionadas"}</p></fieldset><p className="invite-note"><BellRing size={14} /> Cada participante receberá uma notificação e uma pendência no próprio acesso. O grupo só ficará disponível depois que o convite for aceito.</p><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" disabled={!selected.length}><UserPlus size={15} /> Criar e enviar {selected.length || ""} {selected.length === 1 ? "convite" : "convites"}</button></div></form></section></div>;
}

function useLocalPreference<T>(key: string, initialValue: T): [T, (value: T | ((current: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);
  const skipSave = useRef(true);
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      skipSave.current = true;
      try {
        const stored = localStorage.getItem(key);
        setValue(stored ? JSON.parse(stored) as T : initialValueRef.current);
      } catch {
        setValue(initialValueRef.current);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) { skipSave.current = false; return; }
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* preferências continuam válidas durante a sessão */ }
  }, [key, ready, value]);

  return [value, setValue, ready];
}

function StatusPill({ status }: { status: TicketStatus }) { const StatusIcon = statusMeta[status].icon; return <span className={`status-pill ${statusMeta[status].color}`} title={statusMeta[status].description}><StatusIcon size={12}/>{statusMeta[status].short}</span>; }
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

function restoreRegisteredUsers(items: User[]) {
  const sanitized = backfillExecutiveUsers(items);
  const defaultIds = new Set(USERS.map((user) => user.id));
  const restoredDefaults = USERS.map((defaultUser) => {
    const savedUser = sanitized.find((user) => user.id === defaultUser.id);
    return savedUser ? { ...defaultUser, ...savedUser } : defaultUser;
  });
  return [...restoredDefaults, ...sanitized.filter((user) => !defaultIds.has(user.id))];
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

function messageAllowedInCommunication(message: Message, department: string, users: User[], groups: Group[]) {
  if (message.conversationType === "group") return messageConfinedToDepartment(message, department, users, groups);
  const participantIds = Array.from(new Set(directParticipants(message.conversationId)));
  const participants = participantIds.map((userId) => users.find((user) => user.id === userId)).filter((user): user is User => Boolean(user));
  if (participants.length !== participantIds.length || participants.length < 2) return false;
  const sameSector = participants.every((user) => sameDepartment(user.department, participants[0].department));
  const managersOnly = participants.every(isSectorManager);
  return sameSector || managersOnly;
}

function directConversationId(firstUserId: string, secondUserId: string) { return [firstUserId, secondUserId].sort().join("::"); }
function fileBadge(name: string) { const extension = name.split(".").pop()?.toUpperCase() ?? "DOC"; return extension.slice(0, 4); }
function makeId() { return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
