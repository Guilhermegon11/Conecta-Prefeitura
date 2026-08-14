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
import {
  CitizenServiceSection,
  HelpCenterSection,
  IndicatorsSection,
  MunicipalManagementSection,
  ProcessesSection,
  SecuritySection,
} from "./municipal-modules";
import { SectorWorkspaceSection } from "./sector-workspaces";
import { NeighborhoodMapField } from "./municipal-location";

type TicketStatus = "Recebido" | "Em análise" | "Aguardando aprovação" | "Em execução" | "Aguardando resposta" | "Concluído" | "Cancelado";
type Priority = "Urgente" | "Alta" | "Média" | "Baixa";
type NavItem = "Visão geral" | "Área do Setor" | "Chamados" | "Comunicação" | "Atendimento ao Cidadão" | "Processos Digitais" | "Gestão Municipal" | "Indicadores" | "Notificações" | "Pendências" | "Anexos e Arquivos" | "Próximos Eventos" | "Funcionários" | "Secretarias" | "Segurança e LGPD" | "Auditoria" | "Central de Ajuda";
type ChatTab = "direct" | "group";
type OfficeCategory = "Prefeitura e apoio" | "Secretarias" | "Departamentos" | "Seções e subprefeitura";

type Ticket = { id: string; protocol: string; title: string; description: string; requester: string; department: string; priority: Priority; status: TicketStatus; dueDate: string | null; assigneeId: string | null; assigneeName?: string; assigneeInitials?: string; neighborhood?: string; address?: string; createdAt: string; updatedAt: string };
type AccountStatus = "Ativo" | "Aguardando criação de senha";
type User = { id: string; fullName: string; email: string; department: string; role: string; initials: string; accountStatus?: AccountStatus; invitedAt?: string | null; invitedBy?: string | null };
type Office = { id: string; name: string; head: string; hours: string; phone: string; email: string; address: string; category: OfficeCategory };
type Group = { id: string; name: string; description: string; memberCount: number; createdAt: string; memberUserIds?: string[]; pendingUserIds?: string[] };
type Message = { id: string; conversationType: ChatTab; conversationId: string; senderId: string; senderName: string; senderInitials: string; body: string; attachmentId?: string | null; attachmentName?: string | null; attachmentSize?: number | null; attachmentContentType?: string | null; attachmentUrl?: string | null; ticketId?: string | null; createdAt: string };
type DocumentItem = { id: string; name: string; category: string; ownerId: string; ownerName: string; department: string; ticketId?: string | null; contentType: string; size: number; createdAt: string };
type SectorEvent = { id: string; title: string; description: string; department: string; location: string; startsAt: string; endsAt?: string | null; createdBy: string; creatorName: string; creatorInitials: string; createdAt: string };
type AuditItem = { id: string; action: string; entityType: string; entityId: string; detail: string; createdAt: string; actorName: string; actorInitials: string };
type NotificationItem = { id: string; userId: string; type: "group_invite" | "ticket" | "message" | "system"; title: string; body: string; relatedEntityId?: string | null; readAt?: string | null; createdAt: string; actorName?: string; actorInitials?: string };
type GroupInvitation = { groupId: string; userId: string; groupName: string; description: string; invitedByName: string; invitedByInitials: string; memberCount: number; status: "convidado" | "aceito" | "recusado"; createdAt: string };
type GroupMembership = { groupId: string; userId: string; status: "convidado" | "aceito" | "recusado" };
type BootstrapPayload = { users?: User[]; tickets?: Ticket[]; groups?: Array<Group & { memberCount: string | number }>; groupMemberships?: GroupMembership[]; messages?: Message[]; documents?: DocumentItem[]; events?: SectorEvent[]; audit?: AuditItem[]; notifications?: NotificationItem[]; invitations?: Array<GroupInvitation & { memberCount: string | number }> };

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
  { id: "u-ana", fullName: "Artur Paulo Fagundes Rabelo", email: "gabinete@varzeadapalma.mg.gov.br", department: "Secretaria de Governo", role: "Administrador", initials: "AR" },
  { id: "u-rafael", fullName: "Bruno Gonçalves da Fonseca", email: "obras@varzeadapalma.mg.gov.br", department: "Secretaria de Infraestrutura e Transporte", role: "Secretário", initials: "BF" },
  { id: "u-lucas", fullName: "Natália Cristina Pedrosa Cabral", email: "saude@varzeadapalma.mg.gov.br", department: "Secretaria de Saúde", role: "Secretária", initials: "NC" },
  { id: "u-amanda", fullName: "Leila Cibeli Silveira Mendes", email: "semec@varzeadapalma.mg.gov.br", department: "Secretaria de Educação", role: "Secretária", initials: "LM" },
  { id: "u-carla", fullName: "Jaime de Souza", email: "financas@varzeadapalma.mg.gov.br", department: "Secretaria de Administração e Finanças", role: "Secretário", initials: "JS" },
  { id: "u-felipe", fullName: "Lucas Fontinelli de Oliveira da Silva", email: "desenvolvimentoeconomico@varzeadapalma.mg.gov.br", department: "Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente", role: "Secretário", initials: "LS" },
  { id: "u-rosilene", fullName: "Rosilene Soares Souza Carvalho", email: "controladoria@varzeadapalma.mg.gov.br", department: "Controle Interno", role: "Controladora Interna", initials: "RC" },
  { id: "u-rodrigo", fullName: "Rodrigo Aguiar Dalla Bernardina", email: "gabinete@varzeadapalma.mg.gov.br", department: "Gabinete do Prefeito", role: "Chefe de Gabinete", initials: "RB" },
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
];

const INITIAL_TICKETS: Ticket[] = [
  { id: "t-187", protocol: "CH-2026-0187", title: "Manutenção da iluminação na Praça Central", description: "Substituição de luminárias e revisão do quadro elétrico.", requester: "Ouvidoria Municipal", department: "Secretaria de Infraestrutura e Transporte", priority: "Alta", status: "Em execução", dueDate: "2026-08-13T19:00:00.000Z", assigneeId: "u-rafael", assigneeName: "Bruno Gonçalves da Fonseca", assigneeInitials: "BF", createdAt: "2026-08-13T10:00:00.000Z", updatedAt: "2026-08-13T14:36:00.000Z" },
  { id: "t-186", protocol: "CH-2026-0186", title: "Revisão do calendário de vacinação", description: "Validar datas, locais e comunicação da campanha.", requester: "Gabinete do Prefeito", department: "Secretaria de Saúde", priority: "Média", status: "Aguardando aprovação", dueDate: "2026-08-14T18:00:00.000Z", assigneeId: "u-lucas", assigneeName: "Natália Cristina Pedrosa Cabral", assigneeInitials: "NC", createdAt: "2026-08-12T13:00:00.000Z", updatedAt: "2026-08-13T14:52:00.000Z" },
  { id: "t-185", protocol: "CH-2026-0185", title: "Atualização do transporte escolar — Zona Norte", description: "Revisar itinerários antes da volta às aulas.", requester: "Secretaria de Educação", department: "Secretaria de Educação", priority: "Alta", status: "Recebido", dueDate: "2026-08-15T18:00:00.000Z", assigneeId: "u-amanda", assigneeName: "Leila Cibeli Silveira Mendes", assigneeInitials: "LM", createdAt: "2026-08-12T11:00:00.000Z", updatedAt: "2026-08-12T11:00:00.000Z" },
  { id: "t-184", protocol: "CH-2026-0184", title: "Parecer sobre contratação emergencial", description: "Análise administrativa concluída.", requester: "Secretaria de Governo", department: "Secretaria de Administração e Finanças", priority: "Baixa", status: "Concluído", dueDate: "2026-08-12T18:00:00.000Z", assigneeId: "u-carla", assigneeName: "Jaime de Souza", assigneeInitials: "JS", createdAt: "2026-08-10T09:00:00.000Z", updatedAt: "2026-08-13T12:00:00.000Z" },
  { id: "t-183", protocol: "CH-2026-0183", title: "Liberação de área para feira de produtores", description: "Avaliação ambiental e autorização de uso.", requester: "Gabinete do Prefeito", department: "Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente", priority: "Média", status: "Em execução", dueDate: "2026-08-16T18:00:00.000Z", assigneeId: "u-felipe", assigneeName: "Lucas Fontinelli de Oliveira da Silva", assigneeInitials: "LS", createdAt: "2026-08-11T15:00:00.000Z", updatedAt: "2026-08-13T11:00:00.000Z" },
];

const INITIAL_GROUPS: Group[] = [
  { id: "g-volta-aulas", name: "Operação Volta às Aulas 2026", description: "Educação, Mobilidade e Governo", memberCount: 3, createdAt: "2026-08-13T14:00:00.000Z", memberUserIds: ["u-ana", "u-amanda"], pendingUserIds: ["u-rafael"] },
  { id: "g-centro", name: "Revitalização do Centro", description: "Obras e comunicação institucional", memberCount: 3, createdAt: "2026-08-11T10:00:00.000Z", memberUserIds: ["u-ana", "u-rafael", "u-carla"], pendingUserIds: [] },
  { id: "g-saude-digital", name: "Comitê de Saúde Digital", description: "Integração dos atendimentos e sistemas da rede municipal.", memberCount: 1, createdAt: "2026-08-13T14:45:00.000Z", memberUserIds: ["u-lucas"], pendingUserIds: ["u-ana"] },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
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
  { id: "e-governo-1", title: "Reunião de alinhamento do gabinete", description: "Revisão das prioridades e dos chamados em andamento.", department: "Secretaria de Governo", location: "Sala de reuniões do gabinete", startsAt: "2026-08-14T12:30:00.000Z", endsAt: "2026-08-14T13:30:00.000Z", createdBy: "u-ana", creatorName: "Artur Paulo Fagundes Rabelo", creatorInitials: "AR", createdAt: "2026-08-13T12:00:00.000Z" },
  { id: "e-governo-2", title: "Despacho com chefias de setor", description: "Consolidação das demandas para a próxima semana.", department: "Secretaria de Governo", location: "Auditório municipal", startsAt: "2026-08-17T13:00:00.000Z", endsAt: "2026-08-17T14:30:00.000Z", createdBy: "u-ana", creatorName: "Artur Paulo Fagundes Rabelo", creatorInitials: "AR", createdAt: "2026-08-13T12:30:00.000Z" },
  { id: "e-saude-1", title: "Revisão da campanha de vacinação", description: "Validação final do calendário e dos pontos de atendimento.", department: "Secretaria de Saúde", location: "Sala técnica da Saúde", startsAt: "2026-08-15T12:00:00.000Z", endsAt: null, createdBy: "u-lucas", creatorName: "Natália Cristina Pedrosa Cabral", creatorInitials: "NC", createdAt: "2026-08-13T13:00:00.000Z" },
];

const INITIAL_AUDIT: AuditItem[] = [
  { id: "a-1", action: "status_atualizado", entityType: "chamado", entityId: "t-186", detail: "Calendário de vacinação movido para Aguardando aprovação", createdAt: "2026-08-13T14:52:00.000Z", actorName: "Natália Cristina Pedrosa Cabral", actorInitials: "NC" },
  { id: "a-2", action: "documento_enviado", entityType: "mensagem", entityId: "m-3", detail: "Relatório técnico — Iluminação.pdf enviado no chat", createdAt: "2026-08-13T14:36:00.000Z", actorName: "Bruno Gonçalves da Fonseca", actorInitials: "BF" },
  { id: "a-3", action: "grupo_criado", entityType: "grupo", entityId: "g-volta-aulas", detail: "Grupo Operação Volta às Aulas 2026 criado", createdAt: "2026-08-13T14:00:00.000Z", actorName: "Leila Cibeli Silveira Mendes", actorInitials: "LM" },
  { id: "a-4", action: "chamado_finalizado", entityType: "chamado", entityId: "t-184", detail: "Parecer sobre contratação emergencial finalizado", createdAt: "2026-08-13T12:00:00.000Z", actorName: "Jaime de Souza", actorInitials: "JS" },
];

const navIcons: Record<NavItem, LucideIcon> = {
  "Visão geral": LayoutDashboard,
  "Área do Setor": Building2,
  Chamados: ClipboardList,
  Comunicação: MessagesSquare,
  "Atendimento ao Cidadão": Landmark,
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
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [invitations, setInvitations] = useState(INITIAL_INVITATIONS);
  const [ticketModal, setTicketModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(false);
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const currentUser = users.find((user) => user.id === currentUserId) ?? USERS[0];
  const privateTickets = useMemo(() => ticketData.filter((ticket) => sameDepartment(ticket.department, currentUser.department)), [currentUser.department, ticketData]);
  const privateTicketIds = useMemo(() => new Set(privateTickets.map((ticket) => ticket.id)), [privateTickets]);
  const privateDocuments = useMemo(() => documents.filter((document) => sameDepartment(document.department, currentUser.department)), [currentUser.department, documents]);
  const privateDocumentIds = useMemo(() => new Set(privateDocuments.map((document) => document.id)), [privateDocuments]);
  const currentEvents = useMemo(() => events
    .filter((event) => sameDepartment(event.department, currentUser.department))
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()), [currentUser.department, events]);
  const currentEventIds = useMemo(() => new Set(currentEvents.map((event) => event.id)), [currentEvents]);
  const privateMessages = useMemo(() => messages.filter((message) => !message.ticketId || privateTicketIds.has(message.ticketId)), [messages, privateTicketIds]);
  const privateMessageIds = useMemo(() => new Set(privateMessages.map((message) => message.id)), [privateMessages]);
  const privateAudit = useMemo(() => audit.filter((item) => {
    if (item.entityType === "chamado") return privateTicketIds.has(item.entityId);
    if (item.entityType === "mensagem") return privateMessageIds.has(item.entityId);
    if (item.entityType === "documento") return privateDocumentIds.has(item.entityId);
    if (item.entityType === "evento") return currentEventIds.has(item.entityId);
    return false;
  }), [audit, currentEventIds, privateDocumentIds, privateMessageIds, privateTicketIds]);
  const currentNotifications = notifications.filter((item) => item.userId === currentUserId && (item.type !== "ticket" || !item.relatedEntityId || privateTicketIds.has(item.relatedEntityId)) && (item.type !== "message" || !item.relatedEntityId || privateMessageIds.has(item.relatedEntityId)));
  const currentInvitations = invitations.filter((item) => item.userId === currentUserId && item.status === "convidado");
  const pendingTickets = privateTickets.filter((ticket) => ticket.status === "Aguardando aprovação");
  const unreadCount = currentNotifications.filter((item) => !item.readAt).length;
  const pendingCount = currentInvitations.length + pendingTickets.length;
  const accessibleGroups = groups.filter((group) => !group.memberUserIds || group.memberUserIds.includes(currentUserId));
  const activeUsers = users.filter((user) => (user.accountStatus ?? "Ativo") === "Ativo");
  const canManageEmployees = isSectorManager(currentUser);
  const sectorUsers = users.filter((user) => sameDepartment(user.department, currentUser.department));

  useEffect(() => {
    fetch(`/api/bootstrap?userId=${encodeURIComponent(currentUserId)}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      const payload = data as BootstrapPayload;
      if (payload.users?.length) setUsers(payload.users);
      if (Array.isArray(payload.tickets)) setTicketData(payload.tickets.map((ticket) => ({ ...ticket, status: normalizeTicketStatus(ticket.status) })));
      if (Array.isArray(payload.groups)) setGroups(payload.groups.map((group) => {
        const memberships = (payload.groupMemberships ?? []).filter((membership) => membership.groupId === group.id);
        return { ...group, memberCount: Number(group.memberCount), memberUserIds: memberships.filter((membership) => membership.status === "aceito").map((membership) => membership.userId), pendingUserIds: memberships.filter((membership) => membership.status === "convidado").map((membership) => membership.userId) };
      }));
      if (Array.isArray(payload.messages)) setMessages(payload.messages);
      if (Array.isArray(payload.documents)) setDocuments(payload.documents);
      if (Array.isArray(payload.events)) setEvents(payload.events);
      if (Array.isArray(payload.audit)) setAudit(payload.audit);
      if (Array.isArray(payload.notifications)) setNotifications((current) => [...current.filter((item) => item.userId !== currentUserId), ...payload.notifications!]);
      if (Array.isArray(payload.invitations)) setInvitations((current) => [...current.filter((item) => item.userId !== currentUserId), ...payload.invitations!.map((item) => ({ ...item, memberCount: Number(item.memberCount) }))]);
    }).catch(() => undefined);
  }, [currentUserId]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return privateTickets;
    return privateTickets.filter((ticket) => [ticket.protocol, ticket.title, ticket.requester, ticket.department].join(" ").toLowerCase().includes(term));
  }, [search, privateTickets]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  async function createTicket(form: FormData) {
    const now = new Date().toISOString();
    const assigneeId = String(form.get("assigneeId") || "") || null;
    const assignee = users.find((user) => user.id === assigneeId);
    const temporary: Ticket = {
      id: makeId(), protocol: `CH-2026-${String(ticketData.length + 188).padStart(4, "0")}`,
      title: String(form.get("title")), description: String(form.get("description")), requester: currentUser.department,
      department: String(form.get("department")), priority: String(form.get("priority")) as Priority, status: "Recebido",
      dueDate: String(form.get("dueDate")) || null, assigneeId, assigneeName: assignee?.fullName, assigneeInitials: assignee?.initials, neighborhood: String(form.get("neighborhood") || ""), address: String(form.get("address") || ""), createdAt: now, updatedAt: now,
    };
    const belongsToCurrentDepartment = sameDepartment(temporary.department, currentUser.department);
    if (belongsToCurrentDepartment) setTicketData((current) => [temporary, ...current]);
    addAudit("chamado_criado", "chamado", temporary.id, `${temporary.protocol} criado: ${temporary.title}${temporary.neighborhood ? ` · ${temporary.neighborhood}` : ""}`);
    setTicketModal(false);
    setActiveNav("Chamados");
    notify(belongsToCurrentDepartment ? "Chamado criado e visível somente para o seu setor." : `Chamado encaminhado de forma privada para ${temporary.department}.`);
    try {
      const response = await fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create_ticket", userId: currentUserId, requester: currentUser.department, ...Object.fromEntries(form.entries()) }) });
      if (response.ok) {
        const saved = await response.json() as { id: string; protocol: string };
        if (belongsToCurrentDepartment) setTicketData((current) => current.map((item) => item.id === temporary.id ? { ...item, id: saved.id, protocol: saved.protocol } : item));
      }
    } catch { /* O protótipo continua funcional durante a prévia local. */ }
  }

  function updateStatus(id: string, status: TicketStatus) {
    const ticket = ticketData.find((item) => item.id === id);
    if (!ticket || !sameDepartment(ticket.department, currentUser.department)) { notify("Apenas membros do setor responsável podem alterar este chamado."); return; }
    setTicketData((current) => current.map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
    addAudit("status_atualizado", "chamado", id, `${ticket?.protocol ?? "Chamado"} movido para ${status}`);
    notify(`Chamado movido para “${status}”.`);
    void fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "update_ticket", id, status, userId: currentUserId }) }).catch(() => undefined);
  }

  function addAudit(action: string, entityType: string, entityId: string, detail: string) {
    setAudit((current) => [{ id: makeId(), action, entityType, entityId, detail, createdAt: new Date().toISOString(), actorName: currentUser.fullName, actorInitials: currentUser.initials }, ...current]);
  }

  async function uploadFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { notify("O arquivo deve ter no máximo 10 MB."); return; }
    const item: DocumentItem = { id: makeId(), name: file.name, category: "Arquivo do setor", ownerId: currentUser.id, ownerName: currentUser.fullName, department: currentUser.department, contentType: file.type || "application/octet-stream", size: file.size, createdAt: new Date().toISOString() };
    setDocuments((current) => [item, ...current]);
    addAudit("documento_enviado", "documento", item.id, `${file.name} compartilhado com ${currentUser.department}`);
    notify("Arquivo compartilhado com todos do seu setor.");
    const form = new FormData(); form.append("file", file); form.append("category", "Arquivo do setor"); form.append("userId", currentUser.id);
    try {
      const response = await fetch("/api/files", { method: "POST", body: form });
      if (response.ok) { const saved = await response.json() as { id: string }; setDocuments((current) => current.map((doc) => doc.id === item.id ? { ...doc, id: saved.id } : doc)); }
    } catch { /* Mantém a demonstração disponível. */ }
  }

  async function createEvent(form: FormData) {
    const startsAt = localDateTimeToIso(String(form.get("startsAt") ?? ""));
    const rawEndsAt = String(form.get("endsAt") ?? "");
    const endsAt = rawEndsAt ? localDateTimeToIso(rawEndsAt) : null;
    const temporary: SectorEvent = {
      id: makeId(), title: String(form.get("title") ?? "").trim(), description: String(form.get("description") ?? "").trim(),
      department: currentUser.department, location: String(form.get("location") ?? "").trim(), startsAt, endsAt,
      createdBy: currentUser.id, creatorName: currentUser.fullName, creatorInitials: currentUser.initials, createdAt: new Date().toISOString(),
    };
    setEvents((current) => [...current, temporary]);
    addAudit("evento_criado", "evento", temporary.id, `${temporary.title} agendado para ${currentUser.department}`);
    setEventModal(false);
    setActiveNav("Próximos Eventos");
    notify("Evento publicado para todos do seu setor.");
    try {
      const response = await fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create_event", userId: currentUser.id, title: temporary.title, description: temporary.description, location: temporary.location, startsAt, endsAt }) });
      if (!response.ok) throw new Error("Falha ao salvar evento");
      const saved = await response.json() as { id: string; createdAt: string };
      setEvents((current) => current.map((item) => item.id === temporary.id ? { ...item, id: saved.id, createdAt: saved.createdAt } : item));
    } catch { notify("O evento ficou visível nesta sessão, mas não foi possível salvá-lo no servidor."); }
  }

  function recipientIds(conversationType: ChatTab, conversationId: string, recipientId?: string) {
    if (conversationType === "direct") return recipientId && recipientId !== currentUserId ? [recipientId] : [];
    return (groups.find((group) => group.id === conversationId)?.memberUserIds ?? []).filter((id) => id !== currentUserId);
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
    setMessages((current) => [...current, message]);
    addMessageNotifications(message, recipientId);
    addAudit("mensagem_enviada", "mensagem", message.id, `Mensagem enviada por ${currentUser.fullName}`);
    void fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "send_message", userId: currentUserId, recipientId, ...message }) }).catch(() => undefined);
  }

  async function sendChatAttachment(file: File, context: { conversationType: ChatTab; conversationId: string; recipientId?: string; body: string }) {
    if (file.size > 10 * 1024 * 1024) { notify("O documento deve ter no máximo 10 MB."); return false; }
    const now = new Date().toISOString();
    const tempDocumentId = makeId();
    const tempMessageId = makeId();
    const localUrl = URL.createObjectURL(file);
    const documentItem: DocumentItem = { id: tempDocumentId, name: file.name, category: "Documento do chat", ownerId: currentUser.id, ownerName: currentUser.fullName, department: currentUser.department, contentType: file.type || "application/octet-stream", size: file.size, createdAt: now };
    const message: Message = { id: tempMessageId, conversationType: context.conversationType, conversationId: context.conversationId, senderId: currentUser.id, senderName: currentUser.fullName, senderInitials: currentUser.initials, body: context.body.trim(), attachmentId: tempDocumentId, attachmentName: file.name, attachmentSize: file.size, attachmentContentType: file.type || "application/octet-stream", attachmentUrl: localUrl, createdAt: now };
    setDocuments((current) => [documentItem, ...current]);
    setMessages((current) => [...current, message]);
    addMessageNotifications(message, context.recipientId);
    addAudit("documento_enviado", "mensagem", tempMessageId, `${file.name} enviado no chat`);
    notify("Documento enviado na conversa e registrado.");

    const form = new FormData();
    form.append("file", file);
    form.append("category", "Documento do chat");
    form.append("userId", currentUser.id);
    form.append("conversationType", context.conversationType);
    form.append("conversationId", context.conversationId);
    if (context.recipientId) form.append("recipientId", context.recipientId);
    if (context.body.trim()) form.append("messageBody", context.body.trim());

    try {
      const response = await fetch("/api/files", { method: "POST", body: form });
      if (!response.ok) throw new Error("Falha no envio");
      const saved = await response.json() as { id: string; message?: { id: string; createdAt: string } };
      setDocuments((current) => current.map((doc) => doc.id === tempDocumentId ? { ...doc, id: saved.id } : doc));
      setMessages((current) => current.map((item) => item.id === tempMessageId ? { ...item, id: saved.message?.id ?? item.id, attachmentId: saved.id, attachmentUrl: null, createdAt: saved.message?.createdAt ?? item.createdAt } : item));
      URL.revokeObjectURL(localUrl);
    } catch { notify("O documento ficou visível nesta sessão, mas não foi possível salvá-lo no servidor."); }
    return true;
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

  async function inviteEmployee(form: FormData) {
    if (!canManageEmployees) { notify("Somente o responsável pelo setor pode convidar funcionários."); return; }
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const temporaryId = makeId();
    const temporary: User = {
      id: temporaryId,
      fullName,
      email,
      department: currentUser.department,
      role: "Funcionário",
      initials: makeInitials(fullName),
      accountStatus: "Aguardando criação de senha",
      invitedAt: new Date().toISOString(),
      invitedBy: currentUser.id,
    };
    setUsers((current) => [...current, temporary]);
    addAudit("funcionario_convidado", "funcionario", temporaryId, `Convite simulado para ${fullName} (${email})`);
    setEmployeeModal(false);
    setActiveNav("Funcionários");
    notify("Convite simulado. Nenhum e-mail real foi enviado.");
    try {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "invite_employee", userId: currentUser.id, fullName, email }),
      });
      const rawResponse = await response.text();
      const saved = rawResponse ? JSON.parse(rawResponse) as { user?: User; error?: string } : null;
      if (!response.ok || !saved?.user) throw new Error(saved?.error || "Não foi possível registrar o convite");
      setUsers((current) => current.map((user) => user.id === temporaryId ? saved.user! : user));
    } catch (error) {
      setUsers((current) => current.filter((user) => user.id !== temporaryId));
      notify(error instanceof Error ? error.message : "Não foi possível registrar o convite simulado.");
    }
  }

  async function resendEmployeeInvite(user: User) {
    notify(`Convite simulado novamente para ${user.email}. Nenhum e-mail real foi enviado.`);
    void fetch("/api/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "resend_employee_invite", userId: currentUser.id, employeeId: user.id }),
    }).catch(() => undefined);
  }

  const heading = getHeading(activeNav);
  const headingTitle = activeNav === "Visão geral" ? `Bom dia, ${currentUser.fullName.split(" ")[0]}.` : activeNav === "Área do Setor" ? currentUser.department : heading.title;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><Landmark size={21} strokeWidth={2.2} /></div>
          <div><strong>Prefeitura Conecta</strong><small>Gestão Integrada</small></div>
        </div>
        <nav className="main-nav" aria-label="Navegação principal">
          <span className="nav-label">MENU PRINCIPAL</span>
          {(Object.keys(navIcons) as NavItem[]).filter((item) => item !== "Funcionários" || canManageEmployees).map((item) => {
            const NavIcon = navIcons[item];
            return (
              <button type="button" key={item} className={activeNav === item ? "nav-item active" : "nav-item"} onClick={() => { setActiveNav(item); setSidebarOpen(false); }}>
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
          <div><strong>Precisa de ajuda?</strong><p>Acesse o guia da plataforma ou fale com o suporte.</p><button onClick={() => setActiveNav("Central de Ajuda")}>Central de ajuda <ArrowRight size={12} /></button></div>
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
            <label className="account-switch"><div className="avatar">{currentUser.initials}</div><span><small>VISUALIZAR COMO</small><select aria-label="Visualizar como usuário" value={currentUserId} onChange={(event) => setCurrentUserId(event.target.value)}>{activeUsers.map((user) => <option key={user.id} value={user.id}>{user.fullName} — {user.department}</option>)}</select></span></label>
          </div>
        </header>

        <div className={`content-wrap ${activeNav === "Comunicação" ? "chat-content" : ""}`}>
          <section className="page-heading">
            <div><p className="eyebrow">{activeNav === "Visão geral" ? "QUINTA-FEIRA, 13 DE AGOSTO" : heading.eyebrow}</p><h1>{headingTitle}</h1><p>{heading.subtitle}</p></div>
            <div className="heading-actions">
              {activeNav === "Comunicação" ? (
                <button className="button secondary" onClick={() => setGroupModal(true)}><Plus size={15} /> Novo grupo</button>
              ) : activeNav === "Anexos e Arquivos" ? (
                <button type="button" className="button secondary" onClick={() => fileInput.current?.click()}><Upload size={15} /> Anexar arquivo</button>
              ) : activeNav === "Próximos Eventos" ? (
                <button type="button" className="button secondary" onClick={() => setEventModal(true)}><CalendarPlus size={15} /> Novo evento</button>
              ) : activeNav === "Funcionários" ? (
                <button type="button" className="button secondary" onClick={() => setEmployeeModal(true)}><UserPlus size={15} /> Convidar funcionário</button>
              ) : activeNav === "Secretarias" ? (
                <button className="button secondary"><Download size={15} /> Exportar contatos</button>
              ) : activeNav === "Notificações" ? (
                <button className="button secondary" onClick={markAllNotifications}><CheckCheck size={15} /> Marcar todas como lidas</button>
              ) : activeNav === "Pendências" ? (
                <button className="button secondary" onClick={() => setActiveNav("Chamados")}><ClipboardList size={15} /> Ver chamados</button>
              ) : (
                <button className="button secondary"><Download size={15} /> Exportar relatório</button>
              )}
              <button type="button" className="button primary" onClick={() => setTicketModal(true)} aria-haspopup="dialog"><Plus size={16} /> Novo chamado</button>
            </div>
          </section>

          {activeNav === "Visão geral" && <Dashboard tickets={filteredTickets} audit={privateAudit} onNavigate={setActiveNav} />}
          {activeNav === "Área do Setor" && <SectorWorkspaceSection key={currentUser.department} department={currentUser.department} userName={currentUser.fullName} userRole={currentUser.role} departments={Array.from(new Set(users.map((user) => user.department)))} notify={notify} />}
          {activeNav === "Chamados" && <TicketsSection tickets={filteredTickets} department={currentUser.department} onStatus={updateStatus} onNew={() => setTicketModal(true)} />}
          {activeNav === "Comunicação" && <CommunicationSection currentUser={currentUser} users={activeUsers} groups={accessibleGroups} messages={privateMessages} tickets={privateTickets} onSend={sendMessage} onSendAttachment={sendChatAttachment} onNewGroup={() => setGroupModal(true)} />}
          {activeNav === "Atendimento ao Cidadão" && <CitizenServiceSection department={currentUser.department} notify={notify} />}
          {activeNav === "Processos Digitais" && <ProcessesSection department={currentUser.department} notify={notify} />}
          {activeNav === "Gestão Municipal" && <MunicipalManagementSection department={currentUser.department} notify={notify} />}
          {activeNav === "Indicadores" && <IndicatorsSection department={currentUser.department} notify={notify} />}
          {activeNav === "Notificações" && <NotificationsSection notifications={currentNotifications} onRead={markNotification} onOpenPending={() => setActiveNav("Pendências")} />}
          {activeNav === "Pendências" && <PendingSection invitations={currentInvitations} tickets={pendingTickets} onRespond={respondInvitation} onOpenTickets={() => setActiveNav("Chamados")} />}
          {activeNav === "Anexos e Arquivos" && <DocumentsSection documents={privateDocuments} department={currentUser.department} currentUserId={currentUser.id} onUpload={() => fileInput.current?.click()} />}
          {activeNav === "Próximos Eventos" && <EventsSection events={currentEvents} department={currentUser.department} onNew={() => setEventModal(true)} />}
          {activeNav === "Funcionários" && canManageEmployees && <EmployeesSection users={sectorUsers} department={currentUser.department} onInvite={() => setEmployeeModal(true)} onResend={resendEmployeeInvite} />}
          {activeNav === "Secretarias" && <TeamSection offices={OFFICES} />}
          {activeNav === "Segurança e LGPD" && <SecuritySection department={currentUser.department} notify={notify} />}
          {activeNav === "Auditoria" && <AuditSection audit={privateAudit} department={currentUser.department} />}
          {activeNav === "Central de Ajuda" && <HelpCenterSection notify={notify} />}
        </div>
      </main>

      <input ref={fileInput} className="hidden-input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); event.target.value = ""; }} />
      {ticketModal && <TicketModal users={activeUsers} onClose={() => setTicketModal(false)} onCreate={createTicket} />}
      {groupModal && <GroupModal currentUserId={currentUserId} users={activeUsers} onClose={() => setGroupModal(false)} onCreate={createGroup} />}
      {eventModal && <EventModal department={currentUser.department} onClose={() => setEventModal(false)} onCreate={createEvent} />}
      {employeeModal && canManageEmployees && <EmployeeInviteModal department={currentUser.department} onClose={() => setEmployeeModal(false)} onInvite={inviteEmployee} />}
      {toast && <div className="toast" role="status"><span><Check size={14} strokeWidth={2.5} /></span>{toast}</div>}
    </div>
  );
}

function getHeading(active: NavItem) {
  const headings: Record<NavItem, { eyebrow: string; title: string; subtitle: string }> = {
    "Visão geral": { eyebrow: "", title: "Bom dia.", subtitle: "Acompanhe as demandas e mantenha as secretarias alinhadas." },
    "Área do Setor": { eyebrow: "AMBIENTE ESPECIALIZADO", title: "Área do Setor", subtitle: "Formulários, indicadores, equipes e fluxos adaptados às responsabilidades da unidade selecionada." },
    Chamados: { eyebrow: "GESTÃO DE DEMANDAS", title: "Chamados", subtitle: "Organize cada solicitação do recebimento à entrega final." },
    Comunicação: { eyebrow: "CENTRAL DE COMUNICAÇÃO", title: "Conversas", subtitle: "Mensagens diretas e grupos por convite entre as secretarias." },
    "Atendimento ao Cidadão": { eyebrow: "PROTOCOLO, OUVIDORIA E SERVIÇOS", title: "Atendimento ao Cidadão", subtitle: "Registre, encaminhe e acompanhe solicitações, manifestações e pedidos de informação." },
    "Processos Digitais": { eyebrow: "ADMINISTRAÇÃO SEM PAPEL", title: "Processos Digitais", subtitle: "Organize processos, despachos, documentos, versões e assinaturas em um fluxo rastreável." },
    "Gestão Municipal": { eyebrow: "RECURSOS E OPERAÇÕES", title: "Gestão Municipal", subtitle: "Acompanhe frota, patrimônio, materiais, contratos, convênios, obras e serviços de campo." },
    Indicadores: { eyebrow: "INTELIGÊNCIA DE GESTÃO", title: "Indicadores e Relatórios", subtitle: "Analise prazos, produtividade, satisfação e riscos com visão restrita ao seu setor." },
    Notificações: { eyebrow: "CENTRAL DE AVISOS", title: "Notificações", subtitle: "Acompanhe convites, mensagens e atualizações importantes do sistema." },
    Pendências: { eyebrow: "AÇÕES NECESSÁRIAS", title: "Pendências", subtitle: "Resolva convites de grupos e chamados que aguardam sua análise." },
    "Anexos e Arquivos": { eyebrow: "ARQUIVOS COMPARTILHADOS", title: "Anexos e Arquivos", subtitle: "Compartilhe documentos com segurança entre todos os integrantes do seu setor." },
    "Próximos Eventos": { eyebrow: "AGENDA DO SETOR", title: "Próximos Eventos", subtitle: "Acompanhe reuniões, prazos e compromissos destinados ao seu setor." },
    Funcionários: { eyebrow: "ACESSOS DO SETOR", title: "Funcionários", subtitle: "Cadastre nome e e-mail e acompanhe os convites simulados para criação de senha." },
    Secretarias: { eyebrow: "DIRETÓRIO MUNICIPAL", title: "Secretarias e unidades", subtitle: "Responsáveis, telefones, e-mails, horários e endereços oficiais." },
    "Segurança e LGPD": { eyebrow: "GOVERNANÇA DIGITAL", title: "Segurança e LGPD", subtitle: "Gerencie permissões, dados pessoais, retenção, auditoria e resposta a incidentes." },
    Auditoria: { eyebrow: "RASTREABILIDADE DO SETOR", title: "Histórico de atividades", subtitle: "Registro cronológico de chamados, mensagens, anexos e eventos relevantes do seu setor." },
    "Central de Ajuda": { eyebrow: "CONHECIMENTO E SUPORTE", title: "Central de Ajuda", subtitle: "Consulte guias, procedimentos e orientações sobre os módulos da plataforma." },
  };
  return headings[active];
}

function Dashboard({ tickets, audit, onNavigate }: { tickets: Ticket[]; audit: AuditItem[]; onNavigate: (item: NavItem) => void }) {
  const stats = statuses.map((status, index) => ({
    label: statusMeta[status].short,
    value: String(tickets.filter((ticket) => ticket.status === status).length).padStart(2, "0"),
    change: ["Novos registros", "Triagem inicial", "Decisão pendente", "Serviço em andamento", "Retorno externo", "Entregas confirmadas", "Encerrados sem execução"][index],
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
              <div><h2>Atividade recente</h2><p>Atualizações relevantes do seu setor</p></div>
              <button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={18} /></button>
            </div>
            <div className="activity-list">
              {audit.slice(0, 4).map((item, index) => <Activity key={item.id} avatar={item.actorInitials} color={["green", "blue", "violet", "amber"][index % 4]} title={item.actorName} detail={item.detail} time={formatRelative(item.createdAt)} />)}
              {!audit.length && <div className="activity-empty"><History size={22} /><strong>Sem atividade recente</strong><p>As próximas ações relevantes do setor aparecerão aqui.</p></div>}
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

function TicketsSection({ tickets, department, onStatus, onNew }: { tickets: Ticket[]; department: string; onStatus: (id: string, status: TicketStatus) => void; onNew: () => void }) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  return (
    <section className="board-wrap">
      <div className="access-note ticket-privacy-note"><span><ShieldCheck size={20} /></span><div><strong>Fluxo setorial com responsabilidade definida</strong><p>Você está vendo somente as demandas de {department}. Prazos, aprovações, encaminhamentos, responsáveis e anotações internas permanecem registrados no chamado.</p></div></div>
      <div className="ticket-capability-bar" aria-label="Recursos dos chamados"><span><Clock3 size={15} /><strong>SLA e alertas</strong><small>Prazos calculados</small></span><span><UsersRound size={15} /><strong>Equipe responsável</strong><small>Titular e colaboradores</small></span><span><CheckCircle2 size={15} /><strong>Aprovações</strong><small>Decisão registrada</small></span><span><ArrowRight size={15} /><strong>Encaminhamento</strong><small>Origem preservada</small></span></div>
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
                    <h3>{ticket.title}</h3><p>{ticket.description}</p><small>{ticket.protocol} · {ticket.requester}{ticket.neighborhood ? ` · ${ticket.neighborhood}` : ""}</small>
                    <div className="ticket-template-line"><span>{ticket.priority === "Urgente" ? "Atendimento imediato" : "Prazo setorial"}</span><span>{ticket.assigneeName ? "Responsável definido" : "Aguardando atribuição"}</span></div>
                    <div className="kanban-footer"><span className="mini-avatar">{ticket.assigneeInitials ?? "--"}</span><span className={formatDue(ticket.dueDate).startsWith("Hoje") ? "due urgent" : "due"}><Clock3 size={12} /> {formatDue(ticket.dueDate)}</span></div>
                    <label className="move-label">Mover para<select aria-label={`Mover ${ticket.protocol}`} value={ticket.status} onChange={(event) => onStatus(ticket.id, event.target.value as TicketStatus)}>{statuses.map((option) => <option key={option}>{option}</option>)}</select></label>
                    <button className="ticket-detail-button" onClick={() => setSelectedTicket(ticket)}>Abrir detalhes e checklist <ArrowRight size={12} /></button>
                  </article>
                ))}
                {columnTickets.length === 0 && <div className="column-empty">Nenhum chamado nesta etapa</div>}
              </div>
            </section>
          );
        })}
      </div>
      {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onStatus={(status) => { onStatus(selectedTicket.id, status); setSelectedTicket((current) => current ? { ...current, status } : current); }} />}
    </section>
  );
}

function CommunicationSection({ currentUser, users, groups, messages, tickets, onSend, onSendAttachment, onNewGroup }: { currentUser: User; users: User[]; groups: Group[]; messages: Message[]; tickets: Ticket[]; onSend: (message: Message, recipientId?: string) => void; onSendAttachment: (file: File, context: { conversationType: ChatTab; conversationId: string; recipientId?: string; body: string }) => Promise<boolean>; onNewGroup: () => void }) {
  const [tab, setTab] = useState<ChatTab>("direct");
  const [selected, setSelected] = useState("u-rafael");
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [detailPanel, setDetailPanel] = useState<"attachments" | "participants" | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
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

  function selectConversation(id: string) { setSelected(id); setDetailPanel(null); setMoreOpen(false); }
  function changeTab(next: ChatTab) { setTab(next); setSelected(next === "direct" ? directUsers[0]?.id ?? "" : groups[0]?.id ?? ""); setPendingFile(null); setDetailPanel(null); setMoreOpen(false); }
  function togglePanel(panel: "attachments" | "participants") { setDetailPanel((current) => current === panel ? null : panel); setMoreOpen(false); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if ((!body && !pendingFile) || !conversationThreadId || isUploading) return;
    const recipientId = tab === "direct" ? effectiveSelected : undefined;
    if (pendingFile) {
      setIsUploading(true);
      try {
        const sent = await onSendAttachment(pendingFile, { conversationType: tab, conversationId: conversationThreadId, recipientId, body });
        if (sent) { setPendingFile(null); setDraft(""); }
      } finally { setIsUploading(false); }
      return;
    }
    onSend({ id: makeId(), conversationType: tab, conversationId: conversationThreadId, senderId: currentUser.id, senderName: currentUser.fullName, senderInitials: currentUser.initials, body, createdAt: new Date().toISOString() }, recipientId);
    setDraft("");
  }

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
            <button key={user.id} className={effectiveSelected === user.id ? "conversation active" : "conversation"} onClick={() => selectConversation(user.id)}>
              <span className="avatar">{user.initials}</span><span><strong>{user.fullName}</strong><small>{user.department}</small></span>{index < 2 && <i>{index + 1}</i>}
            </button>
          )) : groups.map((group) => (
            <button key={group.id} className={effectiveSelected === group.id ? "conversation active" : "conversation"} onClick={() => selectConversation(group.id)}>
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
            <button className={detailPanel === "attachments" ? "active" : ""} title="Anexos da conversa" aria-label="Ver anexos da conversa" aria-pressed={detailPanel === "attachments"} onClick={() => togglePanel("attachments")}><ClipboardList size={16} /></button>
            <button className={detailPanel === "participants" ? "active" : ""} title="Participantes" aria-label="Ver participantes da conversa" aria-pressed={detailPanel === "participants"} onClick={() => togglePanel("participants")}><UsersRound size={16} /></button>
            <div className="chat-more-wrap">
              <button className={moreOpen ? "active" : ""} title="Mais opções" aria-label="Mais opções da conversa" aria-expanded={moreOpen} onClick={() => setMoreOpen((current) => !current)}><MoreHorizontal size={17} /></button>
              {moreOpen && <div className="chat-more-menu"><button onClick={() => togglePanel("participants")}><UsersRound size={15} /> Ver participantes</button><button onClick={() => togglePanel("attachments")}><Files size={15} /> Ver anexos</button></div>}
            </div>
          </div>
        </header>
        {tab === "group" && <div className="invite-banner"><span><Mail size={15} /></span><div><strong>Grupo com entrada por convite</strong><p>Somente participantes convidados podem visualizar e enviar mensagens.</p></div><button onClick={onNewGroup}>Gerenciar convites</button></div>}
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
        <div className="message-stream">
          <div className="date-divider"><span>Hoje</span></div>
          {visibleMessages.length === 0 && <div className="empty-chat"><span><MessagesSquare size={25} /></span><strong>Comece esta conversa</strong><p>Mensagens, chamados e documentos ficarão registrados aqui.</p></div>}
          {visibleMessages.map((message) => (
            <div key={message.id} className={message.senderId === currentUser.id ? "message own" : "message"}>
              <span className="activity-avatar blue">{message.senderInitials}</span>
              <div>
                <div className="message-meta"><strong>{message.senderName}</strong><time>{formatTime(message.createdAt)}</time></div>{message.body && <p>{message.body}</p>}
                {message.ticketId && <button className="ticket-attachment"><ClipboardList size={12} /> {tickets.find((ticket) => ticket.id === message.ticketId)?.protocol ?? "Chamado relacionado"}</button>}
                {message.attachmentName && (message.attachmentUrl || message.attachmentId ? <a className="file-attachment" href={message.attachmentUrl ?? `/api/files?id=${encodeURIComponent(message.attachmentId ?? "")}&userId=${encodeURIComponent(currentUser.id)}`} download={message.attachmentName}><span>{fileBadge(message.attachmentName)}</span><div><strong>{message.attachmentName}</strong><small>{message.attachmentSize ? `${formatSize(message.attachmentSize)} · ` : ""}Documento anexado</small></div><i><Download size={14} /></i></a> : <div className="file-attachment"><span>{fileBadge(message.attachmentName)}</span><div><strong>{message.attachmentName}</strong><small>Documento registrado</small></div><i><FileText size={14} /></i></div>)}
              </div>
            </div>
          ))}
        </div>
        <form className="message-composer" onSubmit={submit}>
          {pendingFile && <div className="pending-attachment"><span><FileText size={16} /></span><div><strong>{pendingFile.name}</strong><small>{formatSize(pendingFile.size)} · pronto para enviar nesta conversa</small></div><button type="button" aria-label="Remover anexo" onClick={() => setPendingFile(null)}><X size={15} /></button></div>}
          <div className="compose-actions"><button type="button" onClick={() => chatFileInput.current?.click()} title="Anexar documento"><Paperclip size={16} /></button><button type="button" title="Vincular chamado"><ClipboardList size={16} /></button></div>
          <textarea aria-label="Mensagem" placeholder={pendingFile ? "Adicione uma mensagem ao documento (opcional)..." : "Escreva uma mensagem..."} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <button className="send-button" aria-label={isUploading ? "Enviando documento" : "Enviar mensagem"} disabled={isUploading || (!draft.trim() && !pendingFile)}>{isUploading ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}</button>
          <input ref={chatFileInput} className="hidden-input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPendingFile(file); event.target.value = ""; }} />
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

function DocumentsSection({ documents, department, currentUserId, onUpload }: { documents: DocumentItem[]; department: string; currentUserId: string; onUpload: () => void }) {
  const [query, setQuery] = useState("");
  const visibleDocuments = documents.filter((document) => [document.name, document.ownerName, document.category].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="sector-files-layout">
      <div className="access-note files-access-note"><span><ShieldCheck size={20} /></span><div><strong>Biblioteca exclusiva do setor</strong><p>Os arquivos desta área podem ser acessados por todos os integrantes de {department}.</p></div><strong className="directory-total">{documents.length} {documents.length === 1 ? "arquivo" : "arquivos"}</strong></div>
      <article className="panel documents-panel">
        <div className="module-toolbar">
          <label className="module-search"><Search size={15} /><input aria-label="Buscar arquivo" placeholder="Buscar por nome, categoria ou responsável..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <button type="button" className="button primary" onClick={onUpload}><Upload size={15} /> Anexar arquivo</button>
        </div>
        <div className="document-table">
          <div className="document-row document-head"><span>Arquivo</span><span>Compartilhado por</span><span>Setor</span><span>Enviado em</span><span /></div>
          {visibleDocuments.map((doc) => <div className="document-row" key={doc.id}><div className="document-name"><span className="file-type"><FileText size={17} /></span><div><strong>{doc.name}</strong><small>{doc.category} · {formatSize(doc.size)}</small></div></div><span>{doc.ownerName}</span><span className="doc-department">{doc.department}</span><span>{formatDate(doc.createdAt)}</span><a className="table-menu" href={`/api/files?id=${encodeURIComponent(doc.id)}&userId=${encodeURIComponent(currentUserId)}`} aria-label={`Baixar ${doc.name}`} title="Baixar arquivo"><Download size={16} /></a></div>)}
          {!visibleDocuments.length && <div className="module-empty"><Files size={30} /><strong>Nenhum arquivo encontrado</strong><p>Anexe o primeiro documento do setor ou ajuste a busca.</p><button type="button" className="button primary" onClick={onUpload}><Upload size={15} /> Anexar arquivo</button></div>}
        </div>
      </article>
    </section>
  );
}

function EventsSection({ events, department, onNew }: { events: SectorEvent[]; department: string; onNew: () => void }) {
  return (
    <section className="events-layout">
      <div className="access-note events-access-note"><span><CalendarDays size={20} /></span><div><strong>Agenda de {department}</strong><p>Somente os integrantes deste setor visualizam e cadastram os compromissos abaixo.</p></div><strong className="directory-total">{events.length} {events.length === 1 ? "evento" : "eventos"}</strong></div>
      {events.length ? <div className="events-grid">{events.map((event) => {
        const calendar = eventDateParts(event.startsAt);
        return <article className="panel event-card" key={event.id}>
          <div className="event-date"><small>{calendar.month}</small><strong>{calendar.day}</strong><span>{calendar.weekday}</span></div>
          <div className="event-copy"><div className="event-meta"><span><Clock3 size={13} /> {formatEventRange(event.startsAt, event.endsAt)}</span>{event.location && <span><MapPin size={13} /> {event.location}</span>}</div><h2>{event.title}</h2><p>{event.description || "Sem observações adicionais."}</p><footer><span className="mini-avatar">{event.creatorInitials}</span><span>Criado por <strong>{event.creatorName}</strong></span></footer></div>
        </article>;
      })}</div> : <div className="panel module-empty events-empty"><CalendarDays size={34} /><strong>Nenhum evento agendado</strong><p>Cadastre reuniões, prazos e compromissos importantes para o seu setor.</p><button type="button" className="button primary" onClick={onNew}><CalendarPlus size={15} /> Criar primeiro evento</button></div>}
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
      <div className="employee-prototype-note"><Mail size={18} /><div><strong>Fluxo demonstrativo</strong><p>Nesta versão, o convite e a criação de senha são apenas simulados. Nenhum e-mail real é enviado e nenhuma senha é armazenada.</p></div></div>
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
            return <div className="employee-row" key={user.id}><div className="employee-person"><span className="avatar">{user.initials}</span><div><strong>{user.fullName}</strong><small>{user.email}</small></div></div><span>{user.role}</span><span><i className={`account-status ${isPending ? "pending" : "active"}`}>{isPending ? <Clock3 size={12} /> : <CheckCircle2 size={12} />}{status}</i></span><span>{isPending && user.invitedAt ? formatDate(user.invitedAt) : "—"}</span><span>{isPending ? <button type="button" className="resend-invite" onClick={() => onResend(user)}><Mail size={13} /> Reenviar simulação</button> : <span className="active-account-label">Acesso liberado</span>}</span></div>;
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

function AuditSection({ audit, department }: { audit: AuditItem[]; department: string }) {
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
        <div className="module-toolbar"><label className="module-search"><Search size={15} /><input aria-label="Buscar no histórico do setor" placeholder="Buscar atividade, pessoa ou arquivo..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filtrar atividade" value={category} onChange={(event) => setCategory(event.target.value)}><option>Todas as atividades</option><option>Chamados</option><option>Mensagens e anexos</option><option>Arquivos do setor</option><option>Eventos</option></select><button className="button secondary"><Download size={15} /> Exportar log</button></div>
        <div className="audit-list">{visibleAudit.map((item, index) => { const itemCategory = auditCategory(item); return <div className="audit-row" key={item.id}><span className={`activity-avatar ${["green", "blue", "violet", "amber"][index % 4]}`}>{item.actorInitials}</span><div><strong>{item.actorName}</strong><p>{item.detail}</p><small>{itemCategory} · {formatDateTime(item.createdAt)}</small></div><span className="audit-action">{auditActionLabel(item)}</span></div>; })}{!visibleAudit.length && <div className="audit-empty"><History size={30} /><strong>Nenhuma atividade relevante encontrada</strong><p>{query || category !== "Todas as atividades" ? "Ajuste a busca ou o filtro selecionado." : `Ainda não há registros operacionais para ${department}.`}</p></div>}</div>
      </article>
    </section>
  );
}

function TicketDetailModal({ ticket, onClose, onStatus }: { ticket: Ticket; onClose: () => void; onStatus: (status: TicketStatus) => void }) {
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
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal ticket-detail-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title"><header><div><p className="eyebrow">{ticket.protocol} · {ticket.requester}</p><h2 id="ticket-detail-title">{ticket.title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><div className="ticket-detail-body"><div className="ticket-detail-meta"><StatusPill status={ticket.status} /><span className={`priority-label ${ticket.priority.toLowerCase().replace("é", "e")}`}>{ticket.priority}</span><span><Clock3 size={13} /> SLA: {formatDue(ticket.dueDate)}</span></div><p className="ticket-detail-description">{ticket.description}</p><div className="ticket-ownership"><div><small>Responsável principal</small><strong><span className="mini-avatar">{ticket.assigneeInitials ?? "--"}</span>{ticket.assigneeName ?? "A definir"}</strong></div><div><small>Colaboradores</small><strong><span className="avatar-stack"><i>AK</i><i>MC</i><i>+2</i></span>4 participantes</strong></div><div><small>Aprovador</small><strong><ShieldCheck size={14} /> Responsável pelo setor</strong></div></div><div className="ticket-detail-grid"><article className="ticket-checklist"><header><div><h3>Checklist de execução</h3><p>{checklist.filter((item) => item.done).length} de {checklist.length} etapas concluídas</p></div><span>{Math.round(checklist.filter((item) => item.done).length / checklist.length * 100)}%</span></header>{checklist.map((item) => <label key={item.id} className={item.done ? "done" : ""}><input type="checkbox" checked={item.done} onChange={() => setChecklist((current) => current.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} /><span>{item.label}</span></label>)}<button><Plus size={13} /> Adicionar etapa</button></article><article className="ticket-movement"><h3>Encaminhar para outro setor</h3><p>O setor de origem e todo o histórico serão preservados.</p><select aria-label="Setor de destino" value={forwardDepartment} onChange={(event) => setForwardDepartment(event.target.value)}><option value="">Selecione o setor de destino</option>{OFFICES.filter((office) => office.name !== ticket.department).map((office) => <option key={office.id}>{office.name}</option>)}</select><textarea aria-label="Motivo do encaminhamento" placeholder="Justificativa do encaminhamento..." /><button className="button secondary" disabled={!forwardDepartment} onClick={() => { setFeedback(`Encaminhamento preparado para ${forwardDepartment}.`); setForwardDepartment(""); }}>Registrar encaminhamento</button>{feedback && <small className="ticket-inline-feedback"><Check size={11} /> {feedback}</small>}</article></div><article className="ticket-conversation"><div className="ticket-conversation-tabs"><button className={tab === "mensagens" ? "active" : ""} onClick={() => setTab("mensagens")}>Mensagens do chamado</button><button className={tab === "interno" ? "active" : ""} onClick={() => setTab("interno")}><LockKeyholeIcon /> Anotações internas</button></div><div className="ticket-note-feed">{tab === "mensagens" ? <><p><strong>Solicitante</strong><span>A solicitação foi registrada com endereço e fotografias do local.</span><small>13 ago., 08:42</small></p><p><strong>{ticket.assigneeName ?? "Equipe responsável"}</strong><span>A análise inicial foi realizada e o atendimento segue o prazo indicado.</span><small>13 ago., 11:18</small></p></> : <><p className="internal-note"><strong>Nota restrita ao setor</strong><span>Verificar disponibilidade da equipe antes de confirmar a data ao solicitante.</span><small>Somente integrantes autorizados podem visualizar</small></p></>} </div><div className="ticket-note-compose"><input aria-label={tab === "interno" ? "Adicionar anotação interna" : "Escrever mensagem do chamado"} value={note} onChange={(event) => setNote(event.target.value)} placeholder={tab === "interno" ? "Adicionar anotação interna..." : "Escrever atualização para os participantes..."} /><button disabled={!note.trim()} onClick={() => { setFeedback(tab === "interno" ? "Anotação interna registrada." : "Mensagem registrada no chamado."); setNote(""); }}><Send size={14} /></button></div></article><footer className="ticket-detail-footer"><label>Etapa atual<select value={ticket.status} onChange={(event) => onStatus(event.target.value as TicketStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><button className="button secondary" onClick={onClose}>Fechar</button><button className="button primary" onClick={() => { onStatus("Concluído"); setFeedback("Chamado concluído e pesquisa de satisfação liberada."); }}><CheckCircle2 size={15} /> Concluir atendimento</button></footer></div></section></div>;
}

function LockKeyholeIcon() { return <ShieldCheck size={13} />; }

function TicketModal({ users, onClose, onCreate }: { users: User[]; onClose: () => void; onCreate: (data: FormData) => void | Promise<void> }) {
  const [department, setDepartment] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const eligibleUsers = users.filter((user) => sameDepartment(user.department, department));
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void onCreate(new FormData(event.currentTarget)); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal ticket-create-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title">
      <header><div><p className="eyebrow">NOVO REGISTRO</p><h2 id="ticket-modal-title">Criar chamado</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header>
      <form onSubmit={submit}>
        <label className="field full"><span>Modelo da solicitação</span><select name="template" defaultValue="Solicitação geral"><option>Solicitação geral</option><option>Manutenção de veículo</option><option>Solicitação de material</option><option>Reparo em iluminação</option><option>Suporte de informática</option><option>Produção de arte e comunicação</option><option>Agendamento de espaço</option><option>Solicitação de transporte</option><option>Compra ou contratação</option><option>Vistoria técnica</option></select><small className="field-hint">O modelo define checklist, documentos obrigatórios e prazo padrão.</small></label>
        <label className="field full"><span>Título do chamado *</span><input name="title" required placeholder="Ex.: Reparo da iluminação da avenida" autoFocus /></label>
        <label className="field full"><span>Descrição</span><textarea name="description" placeholder="Inclua contexto, entregáveis, local e observações..." /></label>
        <NeighborhoodMapField neighborhood={neighborhood} address={address} onNeighborhoodChange={setNeighborhood} onAddressChange={setAddress} />
        <label className="field"><span>Secretaria responsável *</span><select name="department" required value={department} onChange={(event) => setDepartment(event.target.value)}><option value="" disabled>Selecione</option>{OFFICE_CATEGORIES.map((group) => <optgroup label={group} key={group}>{OFFICES.filter((office) => office.category === group).map((office) => <option key={office.id}>{office.name}</option>)}</optgroup>)}</select></label>
        <label className="field"><span>Responsável principal</span><select name="assigneeId" defaultValue="" disabled={!department}><option value="">{department ? "A definir" : "Selecione primeiro o setor"}</option>{eligibleUsers.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>
        <label className="field"><span>Prioridade</span><select name="priority" defaultValue="Média"><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
        <label className="field"><span>Prazo ou SLA</span><input type="date" name="dueDate" /></label>
        <label className="field full"><span>Colaboradores e pessoas que acompanham</span><select name="followers" defaultValue=""><option value="">Definir depois da criação</option>{eligibleUsers.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.role}</option>)}</select></label>
        <p className="ticket-modal-privacy"><ShieldCheck size={14} /> O chamado ficará visível ao setor responsável. Encaminhamentos, aprovações, mensagens, anotações internas e anexos serão registrados no histórico.</p>
        <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary"><Plus size={15} /> Criar e registrar</button></div>
      </form>
    </section>
  </div>;
}

function EventModal({ department, onClose, onCreate }: { department: string; onClose: () => void; onCreate: (data: FormData) => void | Promise<void> }) {
  const [startsAt, setStartsAt] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void onCreate(new FormData(event.currentTarget)); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title"><header><div><p className="eyebrow">AGENDA DO SETOR</p><h2 id="event-modal-title">Cadastrar próximo evento</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header><form onSubmit={submit}><label className="field full"><span>Título do evento *</span><input name="title" required placeholder="Ex.: Reunião de planejamento" autoFocus /></label><label className="field full"><span>Descrição</span><textarea name="description" placeholder="Inclua pauta, orientações ou informações relevantes..." /></label><label className="field"><span>Início *</span><input type="datetime-local" name="startsAt" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label className="field"><span>Término</span><input type="datetime-local" name="endsAt" min={startsAt} /></label><label className="field full"><span>Local</span><input name="location" placeholder="Ex.: Sala de reuniões, Auditório municipal ou online" /></label><p className="ticket-modal-privacy"><ShieldCheck size={14} /> Este evento será publicado somente na agenda de {department}.</p><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary"><CalendarPlus size={15} /> Publicar evento</button></div></form></section></div>;
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
  const labels: Record<string, string> = { chamado_criado: "Chamado criado", status_atualizado: "Status atualizado", chamado_finalizado: "Chamado finalizado", mensagem_enviada: "Mensagem enviada", evento_criado: "Evento criado" };
  return labels[item.action] ?? item.action.replaceAll("_", " ");
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
function formatRelative(value: string) { const minutes = Math.max(1, Math.round((new Date("2026-08-13T15:00:00.000Z").getTime() - new Date(value).getTime()) / 60000)); return minutes < 60 ? `Há ${minutes} min` : `Há ${Math.round(minutes / 60)} h`; }
function formatDue(value: string | null) { if (!value) return "Sem prazo"; const date = new Date(value); const day = date.getUTCDate(); if (day === 13) return `Hoje, ${formatTime(value)}`; if (day === 14) return "Amanhã"; return `${String(day).padStart(2, "0")} ago`; }
function formatSize(size: number) { return size >= 1_000_000 ? `${(size / 1_000_000).toFixed(1)} MB` : `${Math.round(size / 1000)} KB`; }
function sameDepartment(first: string, second: string) { return first.trim().toLocaleLowerCase("pt-BR") === second.trim().toLocaleLowerCase("pt-BR"); }
function normalizeTicketStatus(status: string): TicketStatus {
  if (status === "Em produção") return "Em execução";
  if (status === "Finalizado") return "Concluído";
  return statuses.includes(status as TicketStatus) ? status as TicketStatus : "Recebido";
}
function normalizeText(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function isSectorManager(user: User) { return !normalizeText(user.role).includes("funcionario"); }
function makeInitials(fullName: string) { const names = fullName.trim().split(/\s+/).filter(Boolean); return `${names[0]?.[0] ?? ""}${names.length > 1 ? names[names.length - 1]?.[0] ?? "" : names[0]?.[1] ?? ""}`.toUpperCase(); }
function directConversationId(firstUserId: string, secondUserId: string) { return [firstUserId, secondUserId].sort().join("::"); }
function fileBadge(name: string) { const extension = name.split(".").pop()?.toUpperCase() ?? "DOC"; return extension.slice(0, 4); }
function makeId() { return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
