import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ships the advanced municipal design system and collapsible navigation", async () => {
  const [page, styles] = await Promise.all([
    read("app/page.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(page, /app-shell reference-ui-2026 municipal-ui-v6/);
  assert.match(page, /const \[sidebarCompact, setSidebarCompact\] = useState\(false\)/);
  assert.match(page, /aria-label=\{sidebarCompact \? "Expandir menu lateral" : "Recolher menu lateral"\}/);
  assert.match(page, /sidebarCompact\?: boolean/);
  assert.match(styles, /Prefeitura Conecta v6\.0 — experiência municipal avançada/);
  assert.match(styles, /--pc-primary: #176057/);
  assert.match(styles, /\.app-shell\.municipal-ui-v6\.sidebar-compact[^{]*\{[^}]*grid-template-columns: 84px minmax\(0, 1fr\)/);
  assert.match(styles, /\.municipal-ui-v6 \.topbar \{[^}]*position: sticky/);
});

test("adds accessible operational health and functional monthly calendars", async () => {
  const [page, styles] = await Promise.all([
    read("app/page.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(page, /className="panel municipal-health-strip"/);
  assert.match(page, /role="progressbar" aria-label="Índice de conclusão"/);
  assert.match(page, /role="progressbar" aria-label="Demandas dentro do prazo"/);
  assert.match(page, /function dashboardCalendarKey/);
  assert.match(page, /setCalendarCursor\(\(current\) => new Date\(current\.getFullYear\(\), current\.getMonth\(\) - 1, 1\)\)/);
  assert.match(page, /com evento agendado/);
  assert.match(page, /com compromisso/);
  assert.doesNotMatch(page, /<strong>Agosto, 2026<\/strong>/);
  assert.doesNotMatch(page, /<h2>Agosto de 2026<\/h2>/);
  assert.match(styles, /\.municipal-health-strip \{/);
  assert.match(styles, /button\.has-event::after/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.municipal-health-strip[^{]*\{[^}]*grid-template-columns: 1fr/);
});
