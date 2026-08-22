import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ships role-aware dashboards and contextual navigation", async () => {
  const [page, styles, pkg] = await Promise.all([
    read("app/page.tsx"),
    read("app/globals.css"),
    read("package.json"),
  ]);

  assert.match(pkg, /"version": "8\.0\.0"/);
  assert.match(page, /municipal-ui-v6 municipal-ui-v61 municipal-ui-v611/);
  assert.match(page, /dashboardProfile: "executive" \| "manager" \| "staff"/);
  assert.match(page, /Decisões e riscos do município/);
  assert.match(page, /Prioridades da equipe/);
  assert.match(page, /Minhas prioridades/);
  assert.match(page, /className="module-breadcrumbs"/);
  assert.match(page, /const \[favoriteModules, setFavoriteModules\]/);
  assert.match(page, /const \[recentModules, setRecentModules\]/);
  assert.match(page, /className="sidebar-quick-access"/);
  assert.match(styles, /Prefeitura Conecta v6\.1 — produtividade, contexto e confiança/);
});

test("adds an advanced persistent ticket workspace", async () => {
  const [page, styles] = await Promise.all([read("app/page.tsx"), read("app/globals.css")]);

  assert.match(page, /type TicketSavedView = "Todos" \| "Urgentes" \| "Atrasados" \| "Minha equipe" \| "Sem responsável"/);
  assert.match(page, /prefeitura:workspace:tickets:/);
  assert.match(page, /className="panel advanced-ticket-table-wrap"/);
  assert.match(page, /Selecionar chamados da página/);
  assert.match(page, /className="ticket-column-picker"/);
  assert.match(page, /className="ticket-bulk-bar"/);
  assert.match(page, /className="status-legend-v61"/);
  assert.match(styles, /\.municipal-ui-v61 \.advanced-ticket-table th \{[\s\S]*?position: sticky/);
  assert.match(styles, /@media \(max-width: 680px\)[\s\S]*?\.advanced-ticket-table td::before/);
});

test("guides long forms and protects draft work", async () => {
  const [page, styles] = await Promise.all([read("app/page.tsx"), read("app/globals.css")]);

  assert.match(page, /Identificação<\/strong>/);
  assert.match(page, /Encaminhamento<\/strong>/);
  assert.match(page, /Revisão<\/strong>/);
  assert.match(page, /Rascunho salvo automaticamente/);
  assert.match(page, /window\.confirm\("Sair sem concluir\?/);
  assert.match(page, /className="modal-actions ticket-sticky-actions"/);
  assert.match(page, /className="inline-error"/);
  assert.match(styles, /\.municipal-ui-v61 \.ticket-sticky-actions \{[\s\S]*?position: sticky/);
});

test("organizes notifications and comparative indicators", async () => {
  const [page, modules] = await Promise.all([read("app/page.tsx"), read("app/municipal-modules.tsx")]);

  assert.match(page, /type NotificationCategory = "Todas" \| "Urgentes" \| "Pendentes" \| "Informativas" \| "Menções" \| "Processos" \| "Lembrar depois"/);
  assert.match(page, /Silenciar baixa prioridade/);
  assert.match(page, /Lembrar depois/);
  assert.match(page, /description: "Registro recebido e aguardando triagem\."/);
  assert.match(modules, /Metas e tendência/);
  assert.match(modules, /vs\. período anterior/);
  assert.match(modules, /role="progressbar" aria-label=\{`Progresso da meta/);
});

test("uses the official municipal identity asset and institutional footer", async () => {
  const [page, image] = await Promise.all([
    read("app/page.tsx"),
    readFile(new URL("../public/brasao-varzea-da-palma-oficial.png", import.meta.url)),
  ]);

  assert.ok(image.byteLength > 10_000);
  assert.match(page, /brasao-varzea-da-palma-oficial\.png/);
  assert.match(page, /Prefeitura Conecta v\{PRODUCT_VERSION\}/);
  assert.match(page, />Suporte<\/button>/);
  assert.match(page, />Privacidade<\/button>/);
  assert.match(page, />LGPD<\/button>/);
});
