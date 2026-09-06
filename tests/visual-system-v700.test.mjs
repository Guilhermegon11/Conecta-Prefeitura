import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ships the 7.0 municipal visual shell and role-aware overview", async () => {
  const [page, styles, pkg] = await Promise.all([
    read("app/page.tsx"),
    read("app/globals.css"),
    read("package.json"),
  ]);

  assert.match(pkg, /"version": "8\.0\.0"/);
  assert.match(page, /const PRODUCT_VERSION = "8\.0\.0"/);
  assert.match(page, /municipal-ui-v700/);
  assert.match(page, /className="kleon-workspace-line"/);
  assert.match(page, /Visão executiva municipal/);
  assert.match(page, /className="panel reference-performance-card kleon-performance-card"/);
  assert.match(page, /className="gauge-value"/);
  assert.match(styles, /--pc7-forest: #176057/);
  assert.match(styles, /--pc7-lime: #b9df63/);
  assert.match(styles, /\.municipal-ui-v700 \.sidebar \{[\s\S]*?background: #fff/);
  assert.match(styles, /\.municipal-ui-v700 \.organized-nav-item\.active[\s\S]*?var\(--pc7-lime-soft\)/);
});

test("improves sidebar depth and icon contrast in 7.0.1", async () => {
  const [page, styles] = await Promise.all([read("app/page.tsx"), read("app/globals.css")]);

  assert.match(page, /municipal-ui-v701/);
  assert.match(styles, /Prefeitura Conecta 7\.0\.1 — contraste e profundidade no menu lateral/);
  assert.match(styles, /--pc701-sidebar: #e5eee9/);
  assert.match(styles, /--pc701-sidebar-icon: #3d6b60/);
  assert.match(styles, /\.municipal-ui-v701 \.sidebar \{[\s\S]*?linear-gradient/);
  assert.match(styles, /\.municipal-ui-v701\.reference-ui-2026 \.organized-nav-item>svg\[data-business-icon\]:first-child[\s\S]*?opacity:1 !important/);
  assert.match(styles, /\.municipal-ui-v701\.reference-ui-2026 \.organized-nav-item\.active>svg\[data-business-icon\]:first-child[\s\S]*?color:#c8eb78 !important/);
});

test("extends the redesign to operational and public surfaces", async () => {
  const styles = await read("app/globals.css");

  assert.match(styles, /Centros integrados, configurações, comunicação e IA/);
  assert.match(styles, /Portal público, acesso e acompanhamento/);
  assert.match(styles, /\.municipal-ui-v700 \.fleet-mileage-shell/);
  assert.match(styles, /\.municipal-ui-v700 \.municipal-ai-panel/);
  assert.match(styles, /\.login-frame \{[\s\S]*?border-radius:23px/);
  assert.match(styles, /\.evaluation-hero \{[\s\S]*?border-radius:20px/);
  assert.match(styles, /\.tracking-hero \{[\s\S]*?border-radius:20px/);
});

test("provides desktop compact, tablet, mobile and reduced-motion states", async () => {
  const styles = await read("app/globals.css");

  assert.match(styles, /@media \(min-width:821px\) \{[\s\S]*?municipal-ui-v700\.sidebar-compact/);
  assert.match(styles, /@media \(max-width:1080px\) \{[\s\S]*?reference-dashboard-rail/);
  assert.match(styles, /@media \(max-width:820px\) \{[\s\S]*?sidebar\.sidebar-open/);
  assert.match(styles, /@media \(max-width:680px\) \{[\s\S]*?municipal-overview-hero/);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)/);
});
