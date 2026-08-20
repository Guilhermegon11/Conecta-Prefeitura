import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("adds a public official-news tab for every selectable profile", async () => {
  const page = await readSource("app/page.tsx");
  assert.match(page, /"Últimas Notícias Prefeitura": Newspaper/);
  assert.match(page, /items: \["Visão geral", "Últimas Notícias Prefeitura"\]/);
  assert.match(page, /item === "Últimas Notícias Prefeitura"\) return true/);
  assert.match(page, /activeNav === "Últimas Notícias Prefeitura" && <PrefeituraNewsSection/);
  assert.match(page, /PUBLIC_READ_PERMISSION = \{ view: true, register: false, edit: false \}/);
});

test("loads official news through the city portal RSS with a verified fallback", async () => {
  const route = await readSource("app/api/prefeitura-news/route.ts");
  assert.match(route, /https:\/\/www\.varzeadapalma\.mg\.gov\.br/);
  assert.match(route, /const RSS_URL = `\$\{OFFICIAL_ORIGIN\}\/portal\/rss`/);
  assert.match(route, /parseOfficialNewsFeed/);
  assert.match(route, /source: "verified-fallback"/);
  assert.match(route, /hostname !== "www\.varzeadapalma\.mg\.gov\.br"/);
  assert.match(route, /hasValidSession\(request\)/);
});

test("offers search, categories, source status, AI analysis and official links", async () => {
  const component = await readSource("app/prefeitura-news.tsx");
  assert.match(component, /Buscar assunto, secretaria ou palavra-chave/);
  assert.match(component, /Filtrar notícias por categoria/);
  assert.match(component, /Analisar com IA/);
  assert.match(component, /Sincronização por RSS/);
  assert.match(component, /target="_blank" rel="noreferrer"/);
  assert.match(component, /dados internos continuam isolados por setor/);
});
