import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (file) => readFile(new URL(`../app/${file}`, import.meta.url), "utf8");

test("keeps the established header and sidebar identity", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /className="brand"/);
  assert.match(source, /Gestão Integrada \+ IA/);
  assert.match(source, /Buscar chamados, pessoas, processos, arquivos, eventos\.\.\./);
  assert.doesNotMatch(source, /className="top-ai-button"/);
  assert.match(source, /"VISUALIZAR COMO" : "PERFIS CADASTRADOS"/);
  assert.doesNotMatch(source, /className="topbar-brand"/);
  assert.doesNotMatch(source, /NÚCLEO MUNICIPAL|Perguntar à IA|PERFIL ATIVO/);
});

test("keeps Secretarias inside Configurações instead of the main navigation", async () => {
  const [page, settings] = await Promise.all([
    readSource("page.tsx"),
    readSource("settings-section.tsx"),
  ]);
  assert.doesNotMatch(page, /items: \[[^\]]*"Secretarias"[^\]]*\]/);
  assert.doesNotMatch(page, /activeNav === "Secretarias" && <TeamSection/);
  assert.match(page, /secretariatsContent=\{<TeamSection offices=\{scopedOffices\} \/>\}/);
  assert.match(settings, /tab === "secretariats"/);
  assert.match(settings, />Secretarias</);
});

test("presents a reduced process workspace without removing advanced actions", async () => {
  const source = await readSource("municipal-modules.tsx");
  assert.match(source, /className="process-navigation-v3 panel"/);
  assert.match(source, /className="process-filter-menu"/);
  assert.match(source, /className="process-detail-grid process-detail-grid-simple"/);
  assert.match(source, /className="process-stepper-v3"/);
  assert.match(source, /className="process-context-v3"/);
  assert.match(source, /className="process-more-actions"/);
  assert.match(source, /className="process-history-simple"/);
});

test("keeps Meu Setor among the main entries for every profile", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /"Central Executiva", "Monitoramento Instagram", "Área do Setor", "Central Integrada"/);
  assert.match(source, /"Visão geral", "Área do Setor", "Central Integrada", "Chamados"/);
  assert.match(source, /"Área do Setor": "Meu Setor"/);
  assert.match(source, />Principais</);
  assert.match(source, /aria-current=\{activeNav === item \? "page" : undefined\}/);
});

test("adds accessible dashboard progress and motion-aware visual feedback", async () => {
  const [features, styles] = await Promise.all([
    readSource("enhanced-features.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(features, /className="command-score-progress" role="progressbar"/);
  assert.match(features, /aria-valuenow=\{onTimeScore\}/);
  assert.match(styles, /@keyframes dashboardProgressReveal/);
  assert.match(styles, /\.motion-enabled \.bar-chart i/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("uses self-hosted Poppins across the interface", async () => {
  const [layout, styles] = await Promise.all([
    readSource("layout.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(styles, /\/fonts\/poppins\/poppins-latin-100-normal\.woff2/);
  assert.match(styles, /\/fonts\/poppins\/poppins-latin-400-normal\.woff2/);
  assert.match(styles, /\/fonts\/poppins\/poppins-latin-500-normal\.woff2/);
  assert.match(styles, /\/fonts\/poppins\/poppins-latin-600-normal\.woff2/);
  assert.match(styles, /\/fonts\/poppins\/poppins-latin-700-normal\.woff2/);
  assert.match(styles, /\/fonts\/poppins\/poppins-latin-900-normal\.woff2/);
  assert.match(styles, /\/fonts\/poppins\/poppins-latin-400-italic\.woff2/);
  assert.match(styles, /\/fonts\/poppins\/poppins-latin-900-italic\.woff2/);
  assert.doesNotMatch(styles, /@fontsource\/poppins/);
  assert.match(styles, /--font-interface: "Poppins", "Geist"/);
  assert.match(styles, /font-synthesis: none/);
  assert.match(styles, /font-feature-settings: "rlig" 1, "calt" 1/);
  assert.doesNotMatch(styles, /font-family: "R-Flex"/);
  assert.doesNotMatch(styles, /font-family: "Polly Rounded"/);
  assert.doesNotMatch(styles, /font-family: "Lextrall"/);
  assert.doesNotMatch(styles, /font-family: "Cal Sans"/);
  assert.doesNotMatch(styles, /font-family: "Inter Variable"/);
  assert.doesNotMatch(styles, /font-family: "Gunterz"/);
  assert.match(styles, /tamanhos originais e movimento funcional/);
  assert.doesNotMatch(styles, /\.my-day-heading h2 \{ font-size: 1\.45rem/);
  assert.doesNotMatch(styles, /\.content-wrap \.integrated-shell \{ font-size: 15px/);
  assert.doesNotMatch(styles, /\.exec-sector-card header h3 \{ font-size: 15px/);
  assert.doesNotMatch(layout, /next\/font\/google/);
});

test("gives Poppins comfortable tracking across the interface", async () => {
  const styles = await readSource("globals.css");
  assert.match(styles, /--letter-spacing-interface: \.012em/);
  assert.match(styles, /body \{[^}]*letter-spacing: var\(--letter-spacing-interface\)[^}]*font-kerning: normal/);
  assert.match(styles, /\.organized-nav-item \{[^}]*letter-spacing: \.018em/);
});

test("uses the supplied digital-business icon system throughout the app", async () => {
  const [page, icons, styles] = await Promise.all([
    readSource("page.tsx"),
    readSource("site-icons.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(page, /from "\.\/site-icons"/);
  assert.doesNotMatch(page, /from "lucide-react"/);
  assert.match(icons, /data-business-icon=\{asset\}/);
  assert.match(icons, /\/icons\/business\/\$\{asset\}\.svg/);
  assert.match(icons, /createBusinessIcon\("analytics-board", "LayoutDashboard"\)/);
  assert.match(icons, /createBusinessIcon\("task-management", "ListTodo"\)/);
  assert.match(icons, /createBusinessIcon\("ai-assistant", "Bot"\)/);
  assert.match(styles, /svg\[data-business-icon\]/);
});

test("applies the neutral dashboard design system from the reference", async () => {
  const styles = await readSource("globals.css");
  assert.match(styles, /Prefeitura Conecta v5\.0 — UI inspirada no painel de referência/);
  assert.match(styles, /body:has\(\.app-shell\)[^{]*\{[^}]*padding: 16px[^}]*#eef0f3/);
  assert.match(styles, /grid-template-columns: 250px minmax\(0, 1fr\)/);
  assert.match(styles, /border-radius: 22px/);
  assert.match(styles, /--ui-navy: #202130/);
  assert.match(styles, /--ui-lime: #176057/);
  assert.match(styles, /--ai-violet: #176057/);
  assert.doesNotMatch(styles, /#b296ee|#c3a8f2|--ui-lilac-soft/);
  assert.match(styles, /\.app-shell \.organized-nav-item\.active[^{]*\{[^}]*background: var\(--ui-lime\)/);
  assert.match(styles, /\.app-shell \.municipal-ai-command-center \{ background: radial-gradient\([^}]*#202130/);
  assert.match(styles, /@media \(max-width: 820px\)[\s\S]*body:has\(\.app-shell\) \{ padding: 0/);
});

test("recreates the reference dashboard composition across the whole home view", async () => {
  const [page, styles] = await Promise.all([
    readSource("page.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(page, /app-shell reference-ui-2026/);
  assert.match(page, /className="reference-dashboard"/);
  assert.match(page, /className="reference-kpi-grid"/);
  assert.match(page, /className="reference-middle-grid"/);
  assert.match(page, /className="panel reference-calendar-card"/);
  assert.match(page, /className="reference-municipal-card"/);
  assert.match(page, /className="sidebar-reference-card"/);
  assert.match(styles, /Prefeitura Conecta v5\.1 — dashboard editorial, compacto e sem roxo/);
  assert.match(styles, /\.reference-dashboard \{ display: grid; grid-template-columns: minmax\(0, 1fr\) 310px/);
  assert.match(styles, /\.reference-municipal-card \{[^}]*background: #20212f/);
  assert.match(styles, /\.reference-calendar-days > button\.active \{[^}]*background: #c9f25b/);
});

test("shows a functional seven-day demand flow and centers communication actions", async () => {
  const [page, styles] = await Promise.all([
    readSource("page.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(page, /const DASHBOARD_WEEKDAYS = \["Seg\.", "Ter\.", "Qua\.", "Qui\.", "Sex", "Sab\.", "Dom\."\]/);
  assert.match(page, /new Date\(ticket\.createdAt\)\.getTime\(\)/);
  assert.match(page, /setSelectedChartDay\(index\)/);
  assert.match(page, /aria-pressed=\{index === activeChartDay\}/);
  assert.match(styles, /\.reference-bar-chart \{[^}]*grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.reference-ui-2026 \.message-composer \.compose-actions \{[^}]*justify-content: center/);
  assert.doesNotMatch(styles, /#5dafa4/i);
});

test("keeps titles and supporting text readable on the dark green active states", async () => {
  const styles = await readSource("globals.css");
  assert.match(styles, /button\.active :where\(strong,b,svg\) \{[^}]*color: #fff !important/);
  assert.match(styles, /button\.active :where\(small,em\) \{[^}]*rgba\(255,255,255,\.76\) !important/);
  assert.match(styles, /\.management-tabs button\.active > span,[\s\S]*?background: rgba\(255,255,255,\.16\) !important/);
  assert.match(styles, /\.reference-ui-2026 \.event-date span \{[^}]*rgba\(255,255,255,\.78\) !important/);
});

test("keeps the universal create action perfectly circular", async () => {
  const [experience, styles] = await Promise.all([
    readSource("platform-experience.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(experience, /className="quick-action-trigger"/);
  assert.match(experience, /title=\{open\?"Fechar menu Criar":"Criar"\}/);
  assert.doesNotMatch(experience, /quick-action-trigger-label/);
  assert.match(styles, /\.quick-action-trigger\{display:flex;width:56px!important;height:56px;min-width:56px;aspect-ratio:1/);
  assert.match(styles, /align-items:center;justify-content:center/);
  assert.match(styles, /\.quick-action-dock\.open \.quick-action-trigger svg\{transform:rotate\(45deg\)\}/);
  assert.doesNotMatch(styles, /\.quick-action-trigger\{width:auto!important;min-width:54px/);
});

test("extends the reference UI to every workspace, public flow, and login", async () => {
  const [login, styles] = await Promise.all([
    readSource("test-login.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(login, /function LoginShowcase\(\)/);
  assert.match(login, /className="login-frame"/);
  assert.match(login, /className="login-showcase"/);
  assert.match(login, /Uma gestão mais clara, de ponta a ponta\./);
  assert.match(styles, /Prefeitura Conecta v5\.2 — sistema visual aplicado à plataforma inteira/);
  assert.match(styles, /\.reference-ui-2026 :where\([\s\S]*?\.sector-hero/);
  assert.match(styles, /\.reference-ui-2026 :where\(\.sector-tabs,[^}]*\) button\.active \{[^}]*background: #c9f25b/);
  assert.match(styles, /\.modal,\.integrated-modal,\.onboarding-card/);
  assert.match(styles, /\.login-frame \{[^}]*grid-template-columns: minmax\(360px,\.92fr\) minmax\(420px,1\.08fr\)/);
  assert.match(styles, /\.login-showcase \{[^}]*background:/);
  assert.match(styles, /\.evaluation-shell,\.tracking-shell/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*\.login-frame \{ display: block/);
});

test("rebuilds every internal module with the dashboard composition instead of a color-only skin", async () => {
  const [page, events, integrated, executive, leadership, styles] = await Promise.all([
    readSource("page.tsx"),
    readSource("page.tsx"),
    readSource("integrated-platform.tsx"),
    readSource("executive-command-center.tsx"),
    readSource("executive-leadership.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(page, /module-page-header-v3/);
  assert.match(page, /module-layout-v3/);
  assert.match(page, /function ModuleExperienceRail/);
  assert.match(events, /events-workspace-v3/);
  assert.match(events, /events-calendar-v3/);
  assert.match(integrated, /integrated-task-layout-v3/);
  assert.match(integrated, /integrated-task-command-v3/);
  assert.match(executive, /exec-command-layout-v3/);
  assert.match(leadership, /executive-leadership-body-v3/);
  assert.match(styles, /Prefeitura Conecta v5\.3 — reformulação estrutural de todos os módulos/);
  assert.match(styles, /\.module-layout-v3 \{[^}]*grid-template-columns: minmax\(0,1fr\) 246px/);
});
