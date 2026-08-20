"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  BellRing,
  Building2,
  Check,
  ChevronRight,
  Contrast,
  Download,
  Eye,
  FilePlus2,
  KeyRound,
  LockKeyhole,
  PencilLine,
  Play,
  PanelsTopLeft,
  RefreshCcw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Type,
  UserCog,
  UsersRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PwaInstallCard } from "./platform-experience";
import {
  clonePermissionSettings,
  createDefaultPermissionSettings,
  PERMISSION_MODULES,
  type DepartmentPermissionSettings,
  type PermissionAction,
  type StaffProfileId,
} from "./access-control";
import { PermissionScopePanel } from "./enhanced-features";

type Employee = { id: string; fullName: string; email: string; initials: string; role: string; accountStatus?: string };
type SettingsTab = "permissions" | "employees" | "secretariats" | "privacy" | "experience";

export function SettingsSection({
  department,
  managerName,
  employees,
  settings,
  soundEnabled,
  motionEnabled,
  contrastEnabled,
  textScale,
  simplifiedMode,
  isMayor,
  crossSectorCommunicationEnabled,
  secretariatsContent,
  onExportContacts,
  onSettingsChange,
  onSoundChange,
  onMotionChange,
  onContrastChange,
  onTextScaleChange,
  onSimplifiedModeChange,
  onCrossSectorCommunicationChange,
  onTestSound,
  notify,
}: {
  department: string;
  managerName: string;
  employees: Employee[];
  settings: DepartmentPermissionSettings;
  soundEnabled: boolean;
  motionEnabled: boolean;
  contrastEnabled: boolean;
  textScale: "normal" | "large" | "larger";
  simplifiedMode: boolean;
  isMayor: boolean;
  crossSectorCommunicationEnabled: boolean;
  secretariatsContent: ReactNode;
  onExportContacts: () => void;
  onSettingsChange: (settings: DepartmentPermissionSettings) => void;
  onSoundChange: (enabled: boolean) => void;
  onMotionChange: (enabled: boolean) => void;
  onContrastChange: (enabled: boolean) => void;
  onTextScaleChange: (scale: "normal" | "large" | "larger") => void;
  onSimplifiedModeChange: (enabled: boolean) => void;
  onCrossSectorCommunicationChange: (enabled: boolean) => void;
  onTestSound: () => void;
  notify: (message: string) => void;
}) {
  const [tab, setTab] = useState<SettingsTab>("permissions");
  const [selectedProfile, setSelectedProfile] = useState<StaffProfileId>("atendimento");
  const [draft, setDraft] = useState(() => clonePermissionSettings(settings));
  const [dirty, setDirty] = useState(false);

  const activeProfile = draft.profiles[selectedProfile];
  const profileStats = useMemo(() => {
    const values = Object.values(activeProfile.permissions);
    return {
      view: values.filter((item) => item.view).length,
      register: values.filter((item) => item.register).length,
      edit: values.filter((item) => item.edit).length,
    };
  }, [activeProfile]);

  function togglePermission(module: keyof typeof activeProfile.permissions, action: PermissionAction) {
    setDraft((current) => {
      const next = clonePermissionSettings(current);
      const permission = next.profiles[selectedProfile].permissions[module];
      const enabled = !permission[action];
      permission[action] = enabled;
      if ((action === "register" || action === "edit") && enabled) permission.view = true;
      if (action === "view" && !enabled) { permission.register = false; permission.edit = false; }
      return next;
    });
    setDirty(true);
  }

  function assignProfile(userId: string, profileId: StaffProfileId) {
    setDraft((current) => ({ ...current, assignments: { ...current.assignments, [userId]: profileId } }));
    setDirty(true);
  }

  function save() {
    const next = { ...draft, updatedAt: new Date().toISOString() };
    setDraft(next);
    onSettingsChange(next);
    setDirty(false);
    notify("Permissões salvas e aplicadas aos perfis do setor.");
  }

  function resetProfile() {
    const defaults = createDefaultPermissionSettings();
    setDraft((current) => ({
      ...current,
      profiles: { ...current.profiles, [selectedProfile]: defaults.profiles[selectedProfile] },
    }));
    setDirty(true);
    notify(`Perfil “${activeProfile.name}” restaurado para o modelo recomendado.`);
  }

  return (
    <section className="settings-shell">
      <article className="settings-hero">
        <span className="settings-hero-icon"><Settings2 size={25} /></span>
        <div>
          <p className="eyebrow">{isMayor ? "CONTROLE EXECUTIVO" : "CONTROLE DO SECRETÁRIO"}</p>
          <h2>{isMayor ? "Configurações executivas" : "Configurações do setor"}</h2>
          <p>{isMayor ? "Gerencie permissões do setor e as regras de privacidade da visão executiva." : "Defina o que cada perfil pode visualizar, registrar e alterar. As mudanças são aplicadas imediatamente e sincronizadas na plataforma."}</p>
          <small><ShieldCheck size={13} /> {department} · administrado por {managerName}</small>
        </div>
        <div className="settings-hero-status"><span><i /> Configuração protegida</span><small>{settings.updatedAt ? "Alterada e salva" : "Modelo recomendado ativo"}</small></div>
      </article>

      <nav className="settings-tabs" aria-label="Seções das configurações">
        <button className={tab === "permissions" ? "active" : ""} onClick={() => setTab("permissions")}><KeyRound size={16} /><span>Perfis e permissões</span></button>
        <button className={tab === "employees" ? "active" : ""} onClick={() => setTab("employees")}><UserCog size={16} /><span>Funcionários</span><i>{employees.length}</i></button>
        <button className={tab === "secretariats" ? "active" : ""} onClick={() => setTab("secretariats")}><Building2 size={16} /><span>Secretarias</span></button>
        {isMayor && <button className={tab === "privacy" ? "active" : ""} onClick={() => setTab("privacy")}><LockKeyhole size={16} /><span>Privacidade executiva</span></button>}
        <button className={tab === "experience" ? "active" : ""} onClick={() => setTab("experience")}><SlidersHorizontal size={16} /><span>Preferências</span></button>
      </nav>

      {tab === "secretariats" && <div className="settings-secretariats">
        <header className="settings-section-toolbar">
          <div><p className="eyebrow">ESTRUTURA MUNICIPAL</p><h3>Secretarias e contatos</h3><p>Consulte a estrutura cadastrada e os responsáveis disponíveis para o seu perfil.</p></div>
          <button className="button secondary" onClick={onExportContacts}><Download size={15} /> Exportar contatos</button>
        </header>
        {secretariatsContent}
      </div>}

      {tab === "permissions" && <div className="permission-layout">
        <aside className="panel profile-picker">
          <header><div><p className="eyebrow">PERFIS NORMAIS</p><h3>Escolha o perfil</h3></div><UsersRound size={18} /></header>
          <div>{(Object.keys(draft.profiles) as StaffProfileId[]).map((profileId) => {
            const item = draft.profiles[profileId];
            const assigned = employees.filter((employee) => (draft.assignments[employee.id] ?? "atendimento") === profileId).length;
            return <button key={profileId} className={selectedProfile === profileId ? "active" : ""} onClick={() => setSelectedProfile(profileId)}>
              <span>{item.name.slice(0, 2).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.description}</small><em>{assigned} {assigned === 1 ? "funcionário" : "funcionários"}</em></span><ChevronRight size={14} />
            </button>;
          })}</div>
          <footer><LockKeyhole size={14} /><p>Secretários e administradores mantêm acesso integral. Esta matriz controla somente os perfis de funcionários.</p></footer>
        </aside>

        <article className="panel permission-editor">
          <header>
            <div><p className="eyebrow">PERFIL SELECIONADO</p><h3>{activeProfile.name}</h3><p>{activeProfile.description}</p></div>
            <div className="permission-summary"><span><Eye size={13} /><strong>{profileStats.view}</strong><small>visíveis</small></span><span><FilePlus2 size={13} /><strong>{profileStats.register}</strong><small>registrar</small></span><span><PencilLine size={13} /><strong>{profileStats.edit}</strong><small>alterar</small></span></div>
          </header>
          <div className="permission-table-wrap">
            <div className="permission-matrix permission-matrix-head"><span>Módulo</span><span><Eye size={13} /> Ver</span><span><FilePlus2 size={13} /> Registrar</span><span><PencilLine size={13} /> Alterar</span></div>
            {PERMISSION_MODULES.map(({ module, group, description }) => {
              const permission = activeProfile.permissions[module];
              return <div className="permission-matrix" key={module}>
                <span><i>{group}</i><strong>{module}</strong><small>{description}</small></span>
                {(["view", "register", "edit"] as PermissionAction[]).map((action) => <button
                  type="button"
                  key={action}
                  className={permission[action] ? "permission-toggle active" : "permission-toggle"}
                  aria-label={`${permission[action] ? "Retirar" : "Permitir"} ${action} em ${module}`}
                  aria-pressed={permission[action]}
                  onClick={() => togglePermission(module, action)}
                ><span><Check size={12} /></span></button>)}
              </div>;
            })}
          </div>
          <footer><button className="button secondary" onClick={resetProfile}><RefreshCcw size={14} /> Restaurar perfil</button><span>{dirty ? "Existem alterações ainda não salvas" : "Configuração sincronizada"}</span><button className="button primary" onClick={save} disabled={!dirty}><Save size={14} /> Salvar permissões</button></footer>
        </article>
      </div>}

      {tab === "permissions" && <PermissionScopePanel department={department} executive={isMayor} notify={notify} />}

      {tab === "employees" && <div className="employee-permission-layout">
        <article className="panel employee-assignment-panel">
          <header><div><p className="eyebrow">ACESSO INDIVIDUAL</p><h3>Perfil de cada funcionário</h3><p>Atribua um dos perfis configurados. O funcionário verá apenas os módulos autorizados.</p></div><UserCog size={21} /></header>
          <div className="employee-assignment-head"><span>Funcionário</span><span>Perfil aplicado</span><span>Resumo do acesso</span></div>
          {employees.map((employee) => {
            const profileId = draft.assignments[employee.id] ?? "atendimento";
            const assignedProfile = draft.profiles[profileId];
            const count = Object.values(assignedProfile.permissions).filter((item) => item.view).length;
            return <div className="employee-assignment-row" key={employee.id}>
              <span className="employee-setting-person"><i>{employee.initials}</i><span><strong>{employee.fullName}</strong><small>{employee.email}</small></span></span>
              <label><span className="mobile-field-label">Perfil aplicado</span><select value={profileId} onChange={(event) => assignProfile(employee.id, event.target.value as StaffProfileId)}>{(Object.keys(draft.profiles) as StaffProfileId[]).map((id) => <option key={id} value={id}>{draft.profiles[id].name}</option>)}</select></label>
              <span className="access-summary"><strong>{count} módulos</strong><small>{assignedProfile.permissions["Chamados"].edit ? "Pode atualizar chamados" : "Sem alteração de chamados"}</small></span>
            </div>;
          })}
          {!employees.length && <div className="settings-empty"><UsersRound size={30} /><strong>Nenhum funcionário normal neste setor</strong><p>Convide um funcionário na área de acessos para atribuir um perfil.</p></div>}
          <footer><span>{dirty ? "Revise e salve as novas atribuições." : "Todas as atribuições estão salvas."}</span><button className="button primary" onClick={save} disabled={!dirty}><Save size={14} /> Salvar atribuições</button></footer>
        </article>
        <aside className="panel access-preview-card"><span><Eye size={22} /></span><p className="eyebrow">PRÉVIA DE ACESSO</p><h3>Teste pela troca de perfil</h3><p>Depois de salvar, selecione o funcionário em “Visualizar como”. O menu e as ações serão adaptados às permissões definidas.</p><div><Check size={13} /> Menus sem acesso ficam ocultos</div><div><Check size={13} /> Ações de registro e alteração são bloqueadas</div><div><Check size={13} /> O secretário mantém controle integral</div></aside>
      </div>}

      {tab === "privacy" && isMayor && <div className="executive-privacy-layout">
        <article className="panel executive-privacy-card">
          <header><span><LockKeyhole size={21} /></span><div><p className="eyebrow">COMUNICAÇÃO INTERSETORIAL</p><h3>Privacidade da comunicação dos setores</h3><p>Defina se Prefeito e Vice-prefeito podem abrir a área de Comunicação enquanto visualizam outro setor.</p></div><i className={crossSectorCommunicationEnabled ? "privacy-state open" : "privacy-state private"}>{crossSectorCommunicationEnabled ? "Acesso autorizado" : "Privado"}</i></header>
          <div className="executive-privacy-default"><ShieldCheck size={17} /><span><strong>Padrão recomendado: Privado</strong><small>Mensagens e grupos de outros setores ficam ocultos até que um perfil executivo habilite este acesso de forma explícita.</small></span></div>
          <button type="button" className="preference-toggle-row executive-privacy-toggle" onClick={() => onCrossSectorCommunicationChange(!crossSectorCommunicationEnabled)}>
            <span>{crossSectorCommunicationEnabled ? <Eye size={18} /> : <LockKeyhole size={18} />}<span><strong>{crossSectorCommunicationEnabled ? "Visualização intersetorial habilitada" : "Comunicações de outros setores privadas"}</strong><small>{crossSectorCommunicationEnabled ? "Prefeito e Vice-prefeito poderão consultar a Comunicação do setor selecionado em modo executivo." : "Os perfis executivos verão apenas a comunicação do próprio Gabinete e as conversas das quais participam."}</small></span></span>
            <i className={crossSectorCommunicationEnabled ? "toggle active" : "toggle"}><b /></i>
          </button>
          <div className="executive-privacy-rules"><div><Check size={13} /><span>O acesso não é ativado automaticamente ao trocar de setor.</span></div><div><Check size={13} /><span>A visualização intersetorial é identificada como acesso executivo.</span></div><div><Check size={13} /><span>Com o modo privado ativo, o conteúdo de outros setores não é carregado na interface.</span></div></div>
        </article>
      </div>}

      {tab === "experience" && <div className="settings-experience-grid">
        <article className="panel preference-card">
          <header><span><BellRing size={19} /></span><div><h3>Notificações sonoras</h3><p>Toque discreto ao chegar um novo aviso para o perfil atual.</p></div></header>
          <button className="preference-toggle-row" onClick={() => onSoundChange(!soundEnabled)}><span>{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}<span><strong>{soundEnabled ? "Som ativado" : "Som desativado"}</strong><small>A preferência fica sincronizada na plataforma.</small></span></span><i className={soundEnabled ? "toggle active" : "toggle"}><b /></i></button>
          <button className="button secondary" onClick={onTestSound}><Play size={14} /> Testar som</button>
        </article>

        <article className="panel preference-card">
          <header><span><Sparkles size={19} /></span><div><h3>Animações da interface</h3><p>Movimentos sutis em ícones, alertas e mudanças de estado.</p></div></header>
          <button className="preference-toggle-row" onClick={() => onMotionChange(!motionEnabled)}><span><Sparkles size={18} /><span><strong>{motionEnabled ? "Animações ativadas" : "Movimento reduzido"}</strong><small>Acessibilidade respeitada em todo o sistema.</small></span></span><i className={motionEnabled ? "toggle active" : "toggle"}><b /></i></button>
        </article>

        <article className="panel preference-card">
          <header><span><Contrast size={19} /></span><div><h3>Alto contraste</h3><p>Reforça bordas, textos e estados para facilitar a leitura.</p></div></header>
          <button type="button" className="preference-toggle-row" aria-pressed={contrastEnabled} onClick={() => onContrastChange(!contrastEnabled)}><span><Contrast size={18} /><span><strong>{contrastEnabled ? "Contraste reforçado" : "Contraste padrão"}</strong><small>A alteração é aplicada imediatamente.</small></span></span><i className={contrastEnabled ? "toggle active" : "toggle"}><b /></i></button>
        </article>

        <article className="panel preference-card">
          <header><span><Type size={19} /></span><div><h3>Tamanho do texto</h3><p>Aumente a leitura sem precisar usar o zoom do navegador.</p></div></header>
          <label className="preference-select"><span>Tamanho na plataforma</span><select value={textScale} onChange={(event) => onTextScaleChange(event.target.value as "normal" | "large" | "larger")}><option value="normal">Padrão</option><option value="large">Grande</option><option value="larger">Muito grande</option></select></label>
        </article>



        <article className="panel preference-card simplified-mode-card">
          <header><span><PanelsTopLeft size={19} /></span><div><h3>Modo simplificado</h3><p>Reduz informações secundárias, amplia ações principais e deixa a navegação mais direta.</p></div></header>
          <button type="button" className="preference-toggle-row" aria-pressed={simplifiedMode} onClick={() => onSimplifiedModeChange(!simplifiedMode)}><span><PanelsTopLeft size={18} /><span><strong>{simplifiedMode ? "Modo simplificado ativado" : "Interface completa"}</strong><small>{simplifiedMode ? "Prioridades, botões e textos essenciais recebem mais destaque." : "Todos os detalhes e painéis permanecem visíveis."}</small></span></span><i className={simplifiedMode ? "toggle active" : "toggle"}><b /></i></button>
        </article>

        <article className="panel preference-card">
          <header><span><Play size={19} /></span><div><h3>Apresentação guiada</h3><p>Reveja o passo a passo contextual do perfil atual quando precisar.</p></div></header>
          <button type="button" className="button secondary" onClick={() => window.dispatchEvent(new CustomEvent("prefeitura:restart-onboarding"))}><Play size={14} /> Reiniciar apresentação</button>
        </article>

        <PwaInstallCard />

      </div>}

    </section>
  );
}
