"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  Check,
  ChevronRight,
  Eye,
  FilePlus2,
  KeyRound,
  LockKeyhole,
  PencilLine,
  Play,
  RefreshCcw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCog,
  UsersRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  clonePermissionSettings,
  createDefaultPermissionSettings,
  PERMISSION_MODULES,
  type DepartmentPermissionSettings,
  type PermissionAction,
  type StaffProfileId,
} from "./access-control";

type Employee = { id: string; fullName: string; email: string; initials: string; role: string; accountStatus?: string };
type SettingsTab = "permissions" | "employees" | "experience";

export function SettingsSection({
  department,
  managerName,
  employees,
  settings,
  soundEnabled,
  motionEnabled,
  onSettingsChange,
  onSoundChange,
  onMotionChange,
  onTestSound,
  onResetDemo,
  notify,
}: {
  department: string;
  managerName: string;
  employees: Employee[];
  settings: DepartmentPermissionSettings;
  soundEnabled: boolean;
  motionEnabled: boolean;
  onSettingsChange: (settings: DepartmentPermissionSettings) => void;
  onSoundChange: (enabled: boolean) => void;
  onMotionChange: (enabled: boolean) => void;
  onTestSound: () => void;
  onResetDemo: () => void;
  notify: (message: string) => void;
}) {
  const [tab, setTab] = useState<SettingsTab>("permissions");
  const [selectedProfile, setSelectedProfile] = useState<StaffProfileId>("atendimento");
  const [draft, setDraft] = useState(() => clonePermissionSettings(settings));
  const [dirty, setDirty] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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
          <p className="eyebrow">CONTROLE DO SECRETÁRIO</p>
          <h2>Configurações do setor</h2>
          <p>Defina o que cada perfil pode visualizar, registrar e alterar. As mudanças são aplicadas imediatamente no ambiente de demonstração.</p>
          <small><ShieldCheck size={13} /> {department} · administrado por {managerName}</small>
        </div>
        <div className="settings-hero-status"><span><i /> Configuração protegida</span><small>{settings.updatedAt ? "Alterada nesta demonstração" : "Modelo recomendado ativo"}</small></div>
      </article>

      <nav className="settings-tabs" aria-label="Seções das configurações">
        <button className={tab === "permissions" ? "active" : ""} onClick={() => setTab("permissions")}><KeyRound size={16} /><span>Perfis e permissões</span></button>
        <button className={tab === "employees" ? "active" : ""} onClick={() => setTab("employees")}><UserCog size={16} /><span>Funcionários</span><i>{employees.length}</i></button>
        <button className={tab === "experience" ? "active" : ""} onClick={() => setTab("experience")}><SlidersHorizontal size={16} /><span>Experiência e demonstração</span></button>
      </nav>

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
          <footer><button className="button secondary" onClick={resetProfile}><RefreshCcw size={14} /> Restaurar perfil</button><span>{dirty ? "Existem alterações ainda não salvas" : "Configuração sincronizada nesta demonstração"}</span><button className="button primary" onClick={save} disabled={!dirty}><Save size={14} /> Salvar permissões</button></footer>
        </article>
      </div>}

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

      {tab === "experience" && <div className="settings-experience-grid">
        <article className="panel preference-card">
          <header><span><BellRing size={19} /></span><div><h3>Notificações sonoras</h3><p>Toque discreto ao chegar um novo aviso para o perfil atual.</p></div></header>
          <button className="preference-toggle-row" onClick={() => onSoundChange(!soundEnabled)}><span>{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}<span><strong>{soundEnabled ? "Som ativado" : "Som desativado"}</strong><small>A preferência fica salva neste dispositivo.</small></span></span><i className={soundEnabled ? "toggle active" : "toggle"}><b /></i></button>
          <button className="button secondary" onClick={onTestSound}><Play size={14} /> Testar som</button>
        </article>

        <article className="panel preference-card">
          <header><span><Sparkles size={19} /></span><div><h3>Animações da interface</h3><p>Movimentos sutis em ícones, alertas e mudanças de estado.</p></div></header>
          <button className="preference-toggle-row" onClick={() => onMotionChange(!motionEnabled)}><span><Sparkles size={18} /><span><strong>{motionEnabled ? "Animações ativadas" : "Movimento reduzido"}</strong><small>Acessibilidade respeitada em todo o sistema.</small></span></span><i className={motionEnabled ? "toggle active" : "toggle"}><b /></i></button>
        </article>

        <article className="panel preference-card demo-maintenance-card">
          <header><span><RefreshCcw size={19} /></span><div><h3>Dados da demonstração</h3><p>Restaure preferências, permissões e registros temporários antes de uma nova apresentação.</p></div></header>
          <button className="button secondary danger-outline" onClick={() => setConfirmReset(true)}><RefreshCcw size={14} /> Reiniciar demonstração</button>
        </article>
      </div>}

      {confirmReset && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmReset(false); }}>
        <section className="modal reset-demo-modal" role="dialog" aria-modal="true" aria-labelledby="reset-demo-title">
          <header><div><p className="eyebrow">AMBIENTE DE DEMONSTRAÇÃO</p><h2 id="reset-demo-title">Restaurar o cenário inicial?</h2></div><button onClick={() => setConfirmReset(false)} aria-label="Fechar"><X size={18} /></button></header>
          <div><span><RefreshCcw size={25} /></span><p>Permissões personalizadas, preferências e registros locais serão removidos. Os dados originais do cenário voltarão na próxima atualização da página.</p></div>
          <footer><button className="button secondary" onClick={() => setConfirmReset(false)}>Cancelar</button><button className="button primary" onClick={() => { setConfirmReset(false); onResetDemo(); }}>Restaurar demonstração</button></footer>
        </section>
      </div>}
    </section>
  );
}
