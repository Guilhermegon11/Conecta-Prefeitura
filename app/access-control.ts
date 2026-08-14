export type PermissionModule =
  | "Visão geral"
  | "Área do Setor"
  | "Chamados"
  | "Comunicação"
  | "Atendimento ao Cidadão"
  | "Processos Digitais"
  | "Gestão Municipal"
  | "Indicadores"
  | "Notificações"
  | "Pendências"
  | "Anexos e Arquivos"
  | "Próximos Eventos"
  | "Secretarias"
  | "Segurança e LGPD"
  | "Auditoria"
  | "Central de Ajuda";

export type PermissionAction = "view" | "register" | "edit";
export type ModulePermission = Record<PermissionAction, boolean>;
export type StaffProfileId = "atendimento" | "operacional" | "campo" | "consulta";

export type StaffProfile = {
  id: StaffProfileId;
  name: string;
  description: string;
  permissions: Record<PermissionModule, ModulePermission>;
};

export type DepartmentPermissionSettings = {
  profiles: Record<StaffProfileId, StaffProfile>;
  assignments: Record<string, StaffProfileId>;
  updatedAt: string | null;
};

export const PERMISSION_MODULES: Array<{ module: PermissionModule; group: string; description: string }> = [
  { module: "Visão geral", group: "Início", description: "Resumo e prioridades do setor" },
  { module: "Área do Setor", group: "Início", description: "Formulários, mapa, equipes e metas" },
  { module: "Chamados", group: "Atendimento", description: "Demandas internas e execução" },
  { module: "Comunicação", group: "Atendimento", description: "Conversas, grupos e anexos" },
  { module: "Atendimento ao Cidadão", group: "Atendimento", description: "Protocolos, Ouvidoria e e-SIC" },
  { module: "Processos Digitais", group: "Operações", description: "Processos, despachos e documentos" },
  { module: "Gestão Municipal", group: "Operações", description: "Frota, patrimônio, estoque, contratos e obras" },
  { module: "Indicadores", group: "Gestão", description: "Painéis, metas e relatórios" },
  { module: "Notificações", group: "Pessoal", description: "Avisos destinados ao funcionário" },
  { module: "Pendências", group: "Pessoal", description: "Aprovações e ações necessárias" },
  { module: "Anexos e Arquivos", group: "Documentos", description: "Biblioteca compartilhada do setor" },
  { module: "Próximos Eventos", group: "Documentos", description: "Agenda e compromissos setoriais" },
  { module: "Secretarias", group: "Institucional", description: "Diretório de unidades e responsáveis" },
  { module: "Segurança e LGPD", group: "Governança", description: "Políticas, proteção e incidentes" },
  { module: "Auditoria", group: "Governança", description: "Histórico das atividades do setor" },
  { module: "Central de Ajuda", group: "Suporte", description: "Tutoriais e orientações da plataforma" },
];

const ALL_MODULES = PERMISSION_MODULES.map((item) => item.module);

function blankPermission(): Record<PermissionModule, ModulePermission> {
  return Object.fromEntries(ALL_MODULES.map((module) => [module, { view: false, register: false, edit: false }])) as Record<PermissionModule, ModulePermission>;
}

function profile(
  id: StaffProfileId,
  name: string,
  description: string,
  view: PermissionModule[],
  register: PermissionModule[],
  edit: PermissionModule[],
): StaffProfile {
  const permissions = blankPermission();
  view.forEach((module) => { permissions[module].view = true; });
  register.forEach((module) => { permissions[module].view = true; permissions[module].register = true; });
  edit.forEach((module) => { permissions[module].view = true; permissions[module].edit = true; });
  return { id, name, description, permissions };
}

const COMMON: PermissionModule[] = [
  "Visão geral", "Área do Setor", "Chamados", "Comunicação", "Notificações", "Pendências",
  "Anexos e Arquivos", "Próximos Eventos", "Secretarias", "Central de Ajuda",
];

export function createDefaultPermissionSettings(): DepartmentPermissionSettings {
  return {
    profiles: {
      atendimento: profile(
        "atendimento",
        "Atendimento",
        "Recebe solicitações, conversa com os setores e acompanha protocolos.",
        [...COMMON, "Atendimento ao Cidadão"],
        ["Chamados", "Comunicação", "Atendimento ao Cidadão", "Anexos e Arquivos", "Próximos Eventos"],
        ["Chamados", "Atendimento ao Cidadão", "Anexos e Arquivos"],
      ),
      operacional: profile(
        "operacional",
        "Operacional",
        "Executa demandas, processos e registros da operação municipal.",
        [...COMMON, "Atendimento ao Cidadão", "Processos Digitais", "Gestão Municipal", "Indicadores"],
        ["Área do Setor", "Chamados", "Comunicação", "Processos Digitais", "Gestão Municipal", "Anexos e Arquivos", "Próximos Eventos"],
        ["Área do Setor", "Chamados", "Processos Digitais", "Gestão Municipal", "Anexos e Arquivos"],
      ),
      campo: profile(
        "campo",
        "Equipe de campo",
        "Registra vistorias, localização, evidências e execução externa.",
        COMMON,
        ["Área do Setor", "Chamados", "Comunicação", "Anexos e Arquivos"],
        ["Área do Setor", "Chamados"],
      ),
      consulta: profile(
        "consulta",
        "Somente consulta",
        "Acompanha informações autorizadas sem criar ou alterar registros.",
        ["Visão geral", "Área do Setor", "Chamados", "Indicadores", "Notificações", "Anexos e Arquivos", "Secretarias", "Central de Ajuda"],
        [],
        [],
      ),
    },
    assignments: {},
    updatedAt: null,
  };
}

export const FULL_PERMISSION: ModulePermission = { view: true, register: true, edit: true };
export const NO_PERMISSION: ModulePermission = { view: false, register: false, edit: false };

export function permissionFor(
  module: PermissionModule,
  isManager: boolean,
  userId: string,
  settings?: DepartmentPermissionSettings,
): ModulePermission {
  if (isManager) return FULL_PERMISSION;
  const resolved = settings ?? createDefaultPermissionSettings();
  const profileId = resolved.assignments[userId] ?? "atendimento";
  return resolved.profiles[profileId]?.permissions[module] ?? NO_PERMISSION;
}

export function clonePermissionSettings(settings: DepartmentPermissionSettings): DepartmentPermissionSettings {
  return JSON.parse(JSON.stringify(settings)) as DepartmentPermissionSettings;
}
