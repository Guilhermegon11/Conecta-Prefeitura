import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shows the Central Executiva only to Prefeito and Vice-prefeito", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /type NavItem = PermissionModule \| "Central Executiva"/);
  assert.match(page, /if \(item === "Central Executiva" \|\| item === "Monitoramento Instagram"\) return executiveAccess/);
  assert.match(page, /activeNav === "Central Executiva" \|\| activeNav === "Monitoramento Instagram"\s*\? executiveAccess \? PUBLIC_READ_PERMISSION : NO_PERMISSION/);
  assert.match(page, /role === "prefeito" \|\| role === "vice-prefeito"/);
  assert.match(page, /\? \["Visão geral", "Central Executiva", "Monitoramento Instagram", "Área do Setor", "Central Integrada"/);
});

test("consolidates real tickets and integrated tasks from every department", async () => {
  const [page, center, integrated] = await Promise.all([
    read("app/page.tsx"),
    read("app/executive-command-center.tsx"),
    read("app/integrated-platform.tsx"),
  ]);
  assert.match(page, /<ExecutiveCommandCenter tickets=\{ticketData\} departments=\{allDepartments\}/);
  assert.match(center, /readOnlyLoad<IntegratedTask\[]>\("integrated:tasks:v2", INITIAL_TASKS\)/);
  assert.match(center, /loadPersistentValue<T>\(key\)/);
  assert.match(center, /Pendências separadas por cards/);
  assert.match(center, /PRIORIDADES DO DIA/);
  assert.match(center, /PRIORIDADES DA SEMANA/);
  assert.match(center, /FILA CONSOLIDADA/);
  assert.match(center, /Todas as prioridades/);
  assert.match(integrated, /export const INITIAL_TASKS/);
});

test("keeps executive access strictly read-only and supports responsive access", async () => {
  const [page, center, integrated, persistence, styles] = await Promise.all([
    read("app/page.tsx"),
    read("app/executive-command-center.tsx"),
    read("app/integrated-platform.tsx"),
    read("app/persistence.ts"),
    read("app/globals.css"),
  ]);
  assert.match(page, /viewingOtherDepartment\s*\? PUBLIC_READ_PERMISSION/);
  assert.match(page, /readOnly=\{viewingOtherDepartment\}/);
  assert.match(page, /Modo de consulta executiva/);
  assert.match(page, /executiveReadOnlyScope/);
  assert.doesNotMatch(page, /status_executivo_atualizado/);
  assert.doesNotMatch(center, /onTicketStatus/);
  assert.doesNotMatch(center, /onNewTicket/);
  assert.doesNotMatch(center, /aria-label=\{`Alterar situação/);
  assert.match(center, /exec-queue-status/);
  assert.match(integrated, /readOnly\?: boolean/);
  assert.match(integrated, /draggable=\{!readOnly\}/);
  assert.match(persistence, /!permission\.register && !permission\.edit/);
  assert.match(center, /aria-label="Central Executiva de pendências municipais"/);
  assert.match(center, /Exportar resumo/);
  assert.match(styles, /\.exec-central-sector-grid/);
  assert.match(styles, /\.executive-sector-readonly/);
  assert.match(styles, /@media \(max-width:780px\)[\s\S]*\.exec-central-sector-grid \{ grid-template-columns:1fr; \}/);
});

test("localizes demonstration scenarios in Várzea da Palma and Barra do Guaicuí", async () => {
  const [page, center, integrated, workspaces] = await Promise.all([
    read("app/page.tsx"),
    read("app/executive-command-center.tsx"),
    read("app/integrated-platform.tsx"),
    read("app/sector-workspaces.tsx"),
  ]);
  assert.match(page, /Ambiente demonstrativo municipal/);
  assert.match(page, /Estação Ferroviária/);
  assert.match(page, /Barra do Guaicuí/);
  assert.match(integrated, /Subprefeitura da Barra do Guaicuí/);
  assert.match(integrated, /Rua S\. Pedro, 40/);
  assert.match(workspaces, /Quadra de Esportes da Barra do Guaicuí/);
  assert.doesNotMatch(`${page}\n${center}\n${integrated}\n${workspaces}`, /Praça Central|Zona Norte|UBS Norte|Rua São José/);
});
