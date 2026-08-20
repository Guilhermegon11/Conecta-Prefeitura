import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (file) => readFile(new URL(`../app/${file}`, import.meta.url), "utf8");

test("restores the previous header and sidebar identity", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /className="brand"/);
  assert.match(source, /Gestão Integrada \+ IA/);
  assert.match(source, /Buscar somente no setor atual\.\.\./);
  assert.match(source, /> IA Conecta</);
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
