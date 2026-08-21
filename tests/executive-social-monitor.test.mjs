import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shows the Instagram radar only to Prefeito and Vice-prefeito", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /"Monitoramento Instagram": ActivityIcon/);
  assert.match(page, /if \(item === "Central Executiva" \|\| item === "Monitoramento Instagram"\) return executiveAccess/);
  assert.match(page, /activeNav === "Monitoramento Instagram" && executiveAccess && <ExecutiveSocialMonitor/);
  assert.match(page, /activeNav === "Central Executiva" \|\| activeNav === "Monitoramento Instagram"\s*\? executiveAccess \? PUBLIC_READ_PERMISSION : NO_PERMISSION/);
});

test("monitors configured terms without simulated or unauthorized collection", async () => {
  const component = await read("app/executive-social-monitor.tsx");
  assert.match(component, /Prefeitura Várzea da Palma/);
  assert.match(component, /Rodrigo Dalla/);
  assert.match(component, /Jaime DS/);
  assert.match(component, /Sem dados simulados/);
  assert.match(component, /não coleta perfis privados nem usa raspagem não autorizada/);
  assert.match(component, /provedor licenciado de social listening/);
});

test("uses official Instagram sources and rejects non-executive profile ids", async () => {
  const route = await read("app/api/executive-social-monitor/route.ts");
  assert.match(route, /hasValidSession\(request\)/);
  assert.match(route, /new Set\(\["u-prefeito", "u-vice"\]\)/);
  assert.match(route, /status: 403/);
  assert.match(route, /mentioned_media/);
  assert.match(route, /ig_hashtag_search/);
  assert.match(route, /recent_media/);
  assert.match(route, /INSTAGRAM_MONITOR_ACCESS_TOKEN/);
  assert.match(route, /configured: false/);
});

test("adds a responsive, high-contrast executive monitoring layout", async () => {
  const styles = await read("app/globals.css");
  assert.match(styles, /\.executive-social-monitor/);
  assert.match(styles, /\.module-layout-social-monitor > \.module-experience-rail/);
  assert.match(styles, /\.social-monitor-toolbar > nav button\.active[\s\S]*color: #fff/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.social-monitor-kpis/);
});
