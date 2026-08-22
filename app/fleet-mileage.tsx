"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  Clock3,
  Download,
  Gauge,
  History,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  UserRound,
} from "./site-icons";
import { useCurrentPermission } from "./permission-context";
import { formatKm, type FleetMileageRecord, type FleetVehicle } from "./fleet-mileage-domain";

type Notify = (message: string) => void;
type FleetUser = { id: string; fullName: string; department: string; role: string };

type FleetApiError = { error?: string };
type MileagePayload = { records?: FleetMileageRecord[] } & FleetApiError;
type VehiclePayload = { vehicles?: FleetVehicle[] } & FleetApiError;

function municipalToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function displayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day));
}

function displayTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

async function readApi<T extends FleetApiError>(response: Response) {
  const payload = await response.json().catch(() => ({})) as T;
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload;
}

export function FleetMileageSection({ department, currentUser, notify, readOnly = false }: {
  department: string;
  currentUser: FleetUser;
  notify: Notify;
  readOnly?: boolean;
}) {
  const access = useCurrentPermission();
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [records, setRecords] = useState<FleetMileageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [vehiclePanel, setVehiclePanel] = useState(false);
  const [startVehicleId, setStartVehicleId] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const today = municipalToday();
  const canRegister = access.register && !readOnly;
  const canManage = access.edit && !readOnly;

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ department, includeInactive: "true" });
      const [vehicleResponse, mileageResponse] = await Promise.all([
        fetch(`/api/fleet/vehicles?${query.toString()}`, { cache: "no-store" }),
        fetch(`/api/fleet/mileage?${new URLSearchParams({ department, limit: "200" }).toString()}`, { cache: "no-store" }),
      ]);
      const [vehiclePayload, mileagePayload] = await Promise.all([
        readApi<VehiclePayload>(vehicleResponse),
        readApi<MileagePayload>(mileageResponse),
      ]);
      setVehicles(vehiclePayload.vehicles ?? []);
      setRecords(mileagePayload.records ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o diário da frota.");
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const openRecords = useMemo(() => records.filter((record) => record.status === "open"), [records]);
  const openVehicleIds = useMemo(() => new Set(openRecords.map((record) => record.vehicleId)), [openRecords]);
  const availableVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.active && !openVehicleIds.has(vehicle.id)), [vehicles, openVehicleIds]);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === startVehicleId);
  const visibleRecords = useMemo(() => records.filter((record) => {
    return (!dateFilter || record.workDate === dateFilter) && (statusFilter === "all" || record.status === statusFilter);
  }), [dateFilter, records, statusFilter]);
  const todayRecords = records.filter((record) => record.workDate === today);
  const completedToday = todayRecords.filter((record) => record.status === "closed").length;
  const totalDistance = records.reduce((total, record) => total + (record.distanceKm ?? 0), 0);

  async function registerStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRegister) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("start");
    try {
      const response = await fetch("/api/fleet/mileage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vehicleId: String(form.get("vehicleId") || ""),
          workDate: String(form.get("workDate") || today),
          startKm: String(form.get("startKm") || ""),
          startNotes: String(form.get("startNotes") || ""),
          department,
          responsibleId: currentUser.id,
          responsibleName: currentUser.fullName,
        }),
      });
      await readApi<FleetApiError>(response);
      formElement.reset();
      setStartVehicleId("");
      notify("Quilometragem inicial registrada. A jornada está aberta.");
      await loadData(true);
    } catch (submitError) {
      notify(submitError instanceof Error ? submitError.message : "Não foi possível iniciar a jornada.");
    } finally {
      setBusy("");
    }
  }

  async function registerEnd(event: FormEvent<HTMLFormElement>, record: FleetMileageRecord) {
    event.preventDefault();
    if (!canRegister) return;
    const form = new FormData(event.currentTarget);
    setBusy(record.id);
    try {
      const response = await fetch("/api/fleet/mileage", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          endKm: String(form.get("endKm") || ""),
          endNotes: String(form.get("endNotes") || ""),
          closedByName: currentUser.fullName,
        }),
      });
      const payload = await readApi<{ record?: FleetMileageRecord } & FleetApiError>(response);
      notify(`Jornada encerrada${payload.record?.distanceKm != null ? ` com ${formatKm(payload.record.distanceKm)} km percorridos` : ""}.`);
      await loadData(true);
    } catch (submitError) {
      notify(submitError instanceof Error ? submitError.message : "Não foi possível encerrar a jornada.");
    } finally {
      setBusy("");
    }
  }

  async function createVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("vehicle");
    try {
      const response = await fetch("/api/fleet/vehicles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plate: String(form.get("plate") || ""),
          name: String(form.get("name") || ""),
          brandModel: String(form.get("brandModel") || ""),
          currentOdometer: String(form.get("currentOdometer") || "0"),
          department,
        }),
      });
      await readApi<FleetApiError>(response);
      formElement.reset();
      notify("Veículo cadastrado e disponível para o diário de quilometragem.");
      await loadData(true);
    } catch (submitError) {
      notify(submitError instanceof Error ? submitError.message : "Não foi possível cadastrar o veículo.");
    } finally {
      setBusy("");
    }
  }

  async function toggleVehicle(vehicle: FleetVehicle) {
    if (!canManage) return;
    setBusy(vehicle.id);
    try {
      const response = await fetch("/api/fleet/vehicles", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: vehicle.id, department, active: !vehicle.active }),
      });
      await readApi<FleetApiError>(response);
      notify(vehicle.active ? "Veículo inativado." : "Veículo reativado.");
      await loadData(true);
    } catch (submitError) {
      notify(submitError instanceof Error ? submitError.message : "Não foi possível atualizar o veículo.");
    } finally {
      setBusy("");
    }
  }

  function exportCsv() {
    const escape = (value: string | number | null) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Data", "Placa/Prefixo", "Veículo", "Responsável", "KM inicial", "KM final", "Percorrido", "Situação", "Início", "Fim", "Observações"],
      ...visibleRecords.map((record) => [record.workDate, record.vehiclePlate, record.vehicleName, record.responsibleName, record.startKm, record.endKm, record.distanceKm, record.status === "open" ? "Aberta" : "Concluída", record.startAt, record.endAt, [record.startNotes, record.endNotes].filter(Boolean).join(" | ")]),
    ];
    const blob = new Blob([`\ufeff${rows.map((row) => row.map(escape).join(";")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `quilometragem-${department.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("Relatório de quilometragem exportado em CSV.");
  }

  return <section className="fleet-mileage-shell">
    <article className="fleet-hero">
      <div className="fleet-hero-icon"><Bus size={27} /></div>
      <div>
        <p className="eyebrow">DIÁRIO OPERACIONAL DA FROTA</p>
        <h2>Início e encerramento da jornada</h2>
        <p>Registre o hodômetro ao retirar e ao devolver cada veículo. O sistema calcula a distância e preserva o histórico de responsabilidade.</p>
      </div>
      <div className="fleet-hero-actions">
        <button type="button" className="button secondary" onClick={() => void loadData()} disabled={loading}><RefreshCw size={14} /> Atualizar</button>
        {canManage && <button type="button" className="button primary" onClick={() => setVehiclePanel((current) => !current)}><Plus size={14} /> Cadastrar veículo</button>}
      </div>
    </article>

    {error && <div className="fleet-error" role="alert"><AlertTriangle size={18} /><span><strong>Não foi possível abrir a frota</strong><small>{error}</small></span><button type="button" onClick={() => void loadData()}>Tentar novamente</button></div>}

    <div className="fleet-summary-grid" aria-label="Resumo da frota">
      <article className="panel"><span><Bus size={18} /></span><div><small>VEÍCULOS ATIVOS</small><strong>{loading ? "—" : vehicles.filter((vehicle) => vehicle.active).length}</strong><p>Disponíveis neste setor</p></div></article>
      <article className="panel warning"><span><Clock3 size={18} /></span><div><small>JORNADAS ABERTAS</small><strong>{loading ? "—" : openRecords.length}</strong><p>Aguardando quilometragem final</p></div></article>
      <article className="panel success"><span><CheckCircle2 size={18} /></span><div><small>CONCLUÍDAS HOJE</small><strong>{loading ? "—" : completedToday}</strong><p>{todayRecords.length} registros no dia</p></div></article>
      <article className="panel info"><span><Gauge size={18} /></span><div><small>DISTÂNCIA REGISTRADA</small><strong>{loading ? "—" : `${formatKm(totalDistance)} km`}</strong><p>No histórico carregado</p></div></article>
    </div>

    {vehiclePanel && canManage && <article className="panel fleet-vehicle-panel">
      <header><div><p className="eyebrow">CADASTRO DA FROTA</p><h3>Novo veículo</h3><p>Use a placa oficial ou um prefixo patrimonial para máquinas e equipamentos.</p></div><Settings2 size={19} /></header>
      <form onSubmit={createVehicle}>
        <label><span>Placa ou prefixo *</span><input name="plate" required maxLength={16} placeholder="Ex.: ABC1D23" autoCapitalize="characters" /></label>
        <label><span>Identificação *</span><input name="name" required maxLength={140} placeholder="Ex.: Van escolar 01" /></label>
        <label><span>Marca e modelo</span><input name="brandModel" maxLength={140} placeholder="Ex.: Renault Master" /></label>
        <label><span>Hodômetro atual *</span><div className="fleet-km-input"><input name="currentOdometer" type="number" min="0" max="9999999.9" step="0.1" required placeholder="0,0" /><b>km</b></div></label>
        <button className="button primary" disabled={busy === "vehicle"}><Save size={14} /> {busy === "vehicle" ? "Salvando…" : "Salvar veículo"}</button>
      </form>
      {vehicles.length > 0 && <div className="fleet-vehicle-list">{vehicles.map((vehicle) => <div key={vehicle.id}><span className={vehicle.active ? "active" : "inactive"}><i />{vehicle.active ? "Ativo" : "Inativo"}</span><div><strong>{vehicle.plate} · {vehicle.name}</strong><small>{vehicle.brandModel || "Modelo não informado"} · Hodômetro {formatKm(vehicle.currentOdometer)} km</small></div><button type="button" onClick={() => void toggleVehicle(vehicle)} disabled={busy === vehicle.id}>{vehicle.active ? "Inativar" : "Reativar"}</button></div>)}</div>}
    </article>}

    {loading ? <div className="fleet-loading" role="status"><span /><span /><span /><p>Carregando diário da frota…</p></div> : <>
      <div className="fleet-workflow-grid">
        <article className="panel fleet-start-card">
          <header><span>1</span><div><p className="eyebrow">INÍCIO DO DIA</p><h3>Registrar saída</h3><p>Informe o hodômetro antes de utilizar o veículo.</p></div></header>
          {!vehicles.length ? <div className="fleet-empty"><Bus size={25} /><strong>Nenhum veículo cadastrado</strong><p>O responsável pela frota deve cadastrar o primeiro veículo antes de iniciar uma jornada.</p>{canManage && <button className="button primary" type="button" onClick={() => setVehiclePanel(true)}><Plus size={14} /> Cadastrar veículo</button>}</div> : !canRegister ? <div className="fleet-readonly"><AlertTriangle size={18} /><span><strong>Modo de consulta</strong><small>Seu perfil pode acompanhar os registros, mas não iniciar ou encerrar jornadas.</small></span></div> : <form onSubmit={registerStart} className="fleet-operation-form">
            <label><span>Veículo *</span><select name="vehicleId" required value={startVehicleId} onChange={(event) => setStartVehicleId(event.target.value)}><option value="">Selecione a placa e o veículo</option>{availableVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.name}</option>)}</select>{!availableVehicles.length && <small>Todos os veículos ativos já possuem jornada aberta.</small>}</label>
            <div className="fleet-form-row"><label><span>Data de trabalho *</span><input name="workDate" type="date" required defaultValue={today} /></label><label><span>Quilometragem inicial *</span><div className="fleet-km-input"><input name="startKm" type="number" min={selectedVehicle?.currentOdometer ?? 0} max="9999999.9" step="0.1" required placeholder={selectedVehicle ? formatKm(selectedVehicle.currentOdometer) : "0,0"} /><b>km</b></div>{selectedVehicle && <small>Hodômetro atual: {formatKm(selectedVehicle.currentOdometer)} km</small>}</label></div>
            <label><span>Observação de saída</span><textarea name="startNotes" maxLength={600} placeholder="Destino, finalidade, condição do veículo ou outra informação relevante." /></label>
            <div className="fleet-responsible"><UserRound size={16} /><span><small>RESPONSÁVEL IDENTIFICADO</small><strong>{currentUser.fullName}</strong></span></div>
            <button className="button primary" disabled={busy === "start" || !availableVehicles.length}><Clock3 size={15} /> {busy === "start" ? "Registrando…" : "Registrar início da jornada"}</button>
          </form>}
        </article>

        <article className="panel fleet-close-card">
          <header><span>2</span><div><p className="eyebrow">FINAL DO DIA</p><h3>Encerrar jornada</h3><p>Confira o hodômetro na devolução do veículo.</p></div><b>{openRecords.length}</b></header>
          {!openRecords.length ? <div className="fleet-empty success"><CheckCircle2 size={26} /><strong>Nenhuma jornada pendente</strong><p>Quando uma saída for registrada, ela aparecerá aqui para o lançamento final.</p></div> : <div className="fleet-open-list">{openRecords.map((record) => <form key={record.id} onSubmit={(event) => registerEnd(event, record)}>
            <header><div><strong>{record.vehiclePlate} · {record.vehicleName}</strong><small>{displayDate(record.workDate)} · início às {displayTime(record.startAt)}</small></div><span>Jornada aberta</span></header>
            <div className="fleet-open-metrics"><span><small>KM INICIAL</small><strong>{formatKm(record.startKm)} km</strong></span><span><small>RESPONSÁVEL</small><strong>{record.responsibleName}</strong></span></div>
            {record.startNotes && <p className="fleet-start-note">“{record.startNotes}”</p>}
            {canRegister ? <><label><span>Quilometragem final *</span><div className="fleet-km-input"><input name="endKm" type="number" min={record.startKm} max="9999999.9" step="0.1" required placeholder={formatKm(record.startKm)} /><b>km</b></div></label><label><span>Observação de devolução</span><textarea name="endNotes" maxLength={600} placeholder="Ocorrências, abastecimento, avarias ou manutenção necessária." /></label><button className="button primary" disabled={busy === record.id}><CheckCircle2 size={15} /> {busy === record.id ? "Encerrando…" : "Registrar final e encerrar"}</button></> : <div className="fleet-readonly compact"><AlertTriangle size={15} /><span><small>Aguardando um funcionário autorizado encerrar esta jornada.</small></span></div>}
          </form>)}</div>}
        </article>
      </div>

      <article className="panel fleet-history-panel">
        <header><div><span><History size={19} /></span><div><p className="eyebrow">RASTREABILIDADE</p><h3>Histórico de quilometragem</h3><p>Registros concluídos ficam bloqueados para proteger a auditoria.</p></div></div><button className="button secondary" type="button" onClick={exportCsv} disabled={!visibleRecords.length}><Download size={14} /> Exportar CSV</button></header>
        <div className="fleet-history-filters"><label><span>Data</span><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label><label><span>Situação</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Todas</option><option value="open">Abertas</option><option value="closed">Concluídas</option></select></label>{(dateFilter || statusFilter !== "all") && <button type="button" onClick={() => { setDateFilter(""); setStatusFilter("all"); }}>Limpar filtros</button>}</div>
        {!visibleRecords.length ? <div className="fleet-empty"><History size={25} /><strong>Nenhum registro encontrado</strong><p>Os lançamentos de início e fim aparecerão neste histórico.</p></div> : <div className="fleet-table-wrap"><table><thead><tr><th>Data</th><th>Veículo</th><th>Responsável</th><th>Início</th><th>Final</th><th>Percorrido</th><th>Situação</th></tr></thead><tbody>{visibleRecords.map((record) => <tr key={record.id}><td data-label="Data"><strong>{displayDate(record.workDate)}</strong><small>{displayTime(record.startAt)}{record.endAt ? `–${displayTime(record.endAt)}` : ""}</small></td><td data-label="Veículo"><strong>{record.vehiclePlate}</strong><small>{record.vehicleName}</small></td><td data-label="Responsável">{record.responsibleName}</td><td data-label="KM inicial">{formatKm(record.startKm)} km</td><td data-label="KM final">{record.endKm == null ? "—" : `${formatKm(record.endKm)} km`}</td><td data-label="Percorrido"><strong>{record.distanceKm == null ? "—" : `${formatKm(record.distanceKm)} km`}</strong></td><td data-label="Situação"><span className={`fleet-status ${record.status}`}>{record.status === "open" ? "Aberta" : "Concluída"}</span></td></tr>)}</tbody></table></div>}
      </article>
    </>}
  </section>;
}
