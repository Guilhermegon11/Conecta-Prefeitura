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
  assert.match(source, /className="process-summary-strip panel"/);
  assert.match(source, /className="process-filter-menu"/);
  assert.match(source, /className="process-detail-grid process-detail-grid-simple"/);
  assert.match(source, /className="process-more-actions"/);
  assert.match(source, /className="process-history-simple"/);
});

test("keeps Meu Setor among the main entries for every profile", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /"Central Executiva", "Área do Setor", "Central Integrada"/);
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

test("keeps Gunterz with the original interface type scale", async () => {
  const [layout, styles] = await Promise.all([
    readSource("layout.tsx"),
    readSource("globals.css"),
  ]);
  assert.match(styles, /font-family: "Gunterz"/);
  assert.match(styles, /--font-interface: "Gunterz"/);
  assert.match(styles, /tamanhos originais e movimento funcional/);
  assert.doesNotMatch(styles, /\.my-day-heading h2 \{ font-size: 1\.45rem/);
  assert.doesNotMatch(styles, /\.content-wrap \.integrated-shell \{ font-size: 15px/);
  assert.doesNotMatch(styles, /\.exec-sector-card header h3 \{ font-size: 15px/);
  assert.doesNotMatch(layout, /next\/font\/google/);
});
