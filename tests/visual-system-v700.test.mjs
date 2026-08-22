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

  assert.match(pkg, /"version": "7\.0\.0"/);
  assert.match(page, /const PRODUCT_VERSION = "7\.0\.0"/);
  assert.match(page, /municipal-ui-v700/);
  assert.match(page, /className="municipal-overview-hero"/);
  assert.match(page, /O município em um só panorama/);
  assert.match(page, /className="panel reference-performance-card"/);
  assert.match(page, /className="gauge-value"/);
  assert.match(styles, /--pc7-forest: #176057/);
  assert.match(styles, /--pc7-lime: #b9df63/);
  assert.match(styles, /\.municipal-ui-v700 \.sidebar \{[\s\S]*?background: #fff/);
  assert.match(styles, /\.municipal-ui-v700 \.organized-nav-item\.active[\s\S]*?var\(--pc7-lime-soft\)/);
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
