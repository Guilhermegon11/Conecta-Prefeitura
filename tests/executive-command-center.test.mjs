import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shows the Central Executiva only to Prefeito and Vice-prefeito", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /type NavItem = PermissionModule \| "Central Executiva"/);
  assert.match(page, /if \(item === "Central Executiva"\) return executiveAccess/);
  assert.match(page, /activeNav === "Central Executiva"\s*\? executiveAccess \? FULL_PERMISSION : NO_PERMISSION/);
  assert.match(page, /role === "prefeito" \|\| role === "vice-prefeito"/);
  assert.match(page, /label: "Prefeito e Vice", items: \["Central Executiva"\]/);
});

test("consolidates real tickets and integrated tasks from every department", async () => {
  const [page, center, integrated] = await Promise.all([
    read("app/page.tsx"),
    read("app/executive-command-center.tsx"),
    read("app/integrated-platform.tsx"),
  ]);
  assert.match(page, /<ExecutiveCommandCenter tickets=\{ticketData\} departments=\{allDepartments\}/);
  assert.match(center, /usePersistentState<IntegratedTask\[]>\("integrated:tasks:v2", INITIAL_TASKS\)/);
  assert.match(center, /Pendências separadas por cards/);
  assert.match(center, /PRIORIDADES DO DIA/);
  assert.match(center, /PRIORIDADES DA SEMANA/);
  assert.match(center, /FILA CONSOLIDADA/);
  assert.match(center, /Todas as prioridades/);
  assert.match(integrated, /export const INITIAL_TASKS/);
});

test("keeps executive updates traceable and supports responsive access", async () => {
  const [page, center, styles] = await Promise.all([
    read("app/page.tsx"),
    read("app/executive-command-center.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(page, /status_executivo_atualizado/);
  assert.match(page, /department: ticket\.department/);
  assert.match(center, /Situação alterada para \$\{status\} pela Central Executiva/);
  assert.match(center, /aria-label="Central Executiva de pendências municipais"/);
  assert.match(center, /Exportar resumo/);
  assert.match(styles, /\.exec-central-sector-grid/);
  assert.match(styles, /@media \(max-width:780px\)[\s\S]*\.exec-central-sector-grid \{ grid-template-columns:1fr; \}/);
});
