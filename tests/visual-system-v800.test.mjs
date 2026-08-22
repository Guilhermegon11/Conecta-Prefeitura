import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ships the 8.0 structural redesign across the authenticated system", async () => {
  const [page, styles, pkg] = await Promise.all([
    read("app/page.tsx"),
    read("app/globals.css"),
    read("package.json"),
  ]);

  assert.match(pkg, /"version": "8\.0\.0"/);
  assert.match(page, /const PRODUCT_VERSION = "8\.0\.0"/);
  assert.match(page, /municipal-ui-v800/);
  assert.match(page, /className="topbar-context-v8"/);
  assert.match(page, /module-page-header-v3 module-page-header-v8/);
  assert.match(page, /module-layout-v3 module-layout-v8/);
  assert.match(page, /module-experience-rail module-command-strip-v8/);
  assert.match(page, /<ModuleExperienceRail[\s\S]*?<div className="module-main-v3">/);
  assert.match(styles, /Prefeitura Conecta 8\.0 — redesign estrutural completo e Poppins universal/);
  assert.match(styles, /\.app-shell\.municipal-ui-v800 \{[\s\S]*?grid-template-columns:252px minmax\(0,1fr\)/);
  assert.match(styles, /\.municipal-ui-v800 \.sidebar \{[\s\S]*?var\(--pc8-sidebar\)/);
  assert.match(styles, /\.municipal-ui-v800 \.module-command-strip-v8 \{[\s\S]*?grid-template-columns/);
});

test("redesigns operational modules instead of limiting changes to the home page", async () => {
  const styles = await read("app/globals.css");

  assert.match(styles, /Chamados, kanban e tabelas operacionais/);
  assert.match(styles, /Comunicação interna/);
  assert.match(styles, /Central integrada, processos e área do setor/);
  assert.match(styles, /Gestão municipal, frota, indicadores e segurança/);
  assert.match(styles, /Notificações, documentos, agenda, pessoas e auditoria/);
  assert.match(styles, /Configurações, ajuda, notícias e superfícies executivas/);
  assert.match(styles, /\.municipal-ui-v800 \.fleet-mileage-shell/);
  assert.match(styles, /\.municipal-ui-v800 \.process-navigation-v3/);
  assert.match(styles, /\.municipal-ui-v800 \.chat-shell/);
  assert.match(styles, /\.municipal-ui-v800 \.settings-shell/);
  assert.match(styles, /\.municipal-ui-v800 \.advanced-ticket-table/);
});

test("extends Poppins and the new visual language to public journeys", async () => {
  const [login, evaluation, tracking, styles] = await Promise.all([
    read("app/test-login.tsx"),
    read("app/avaliar/page.tsx"),
    read("app/acompanhar/page.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(login, /login-shell public-ui-v800/);
  assert.match(evaluation, /evaluation-shell public-ui-v800/);
  assert.match(tracking, /tracking-shell public-ui-v800/);
  assert.match(styles, /\.public-ui-v800\.login-shell/);
  assert.match(styles, /\.public-ui-v800\.evaluation-shell/);
  assert.match(styles, /\.public-ui-v800\.tracking-shell/);
  assert.match(styles, /@media \(max-width:820px\)[\s\S]*?public-ui-v800/);
});

test("keeps the 8.0 palette institutional and removes lime from the active layer", async () => {
  const styles = await read("app/globals.css");
  const v8 = styles.slice(styles.indexOf("Prefeitura Conecta 8.0"));

  assert.match(v8, /--pc8-primary:#176057/);
  assert.match(v8, /--pc8-sidebar:#123a34/);
  assert.doesNotMatch(v8, /#b9df63|#c8eb78|#dfff8f/i);
  assert.match(v8, /@media \(max-width:680px\)/);
  assert.match(v8, /@media \(prefers-reduced-motion:reduce\)/);
});
