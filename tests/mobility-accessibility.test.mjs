import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ships an installable PWA manifest and offline shell", async () => {
  const [manifestSource, platform, worker] = await Promise.all([
    read("public/manifest.webmanifest"),
    read("app/platform-experience.tsx"),
    read("public/sw.js"),
  ]);
  const manifest = JSON.parse(manifestSource);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.icons.length, 2);
  assert.match(platform, /export function PwaInstallCard/);
  assert.match(platform, /export function OfflineStatusBar/);
  assert.match(platform, /getOfflinePendingCount/);
  assert.match(worker, /prefeitura-conecta-offline-v48/);
});

test("adds mobile navigation and accessibility controls", async () => {
  const [page, settings, platform, layout, styles] = await Promise.all([
    read("app/page.tsx"),
    read("app/settings-section.tsx"),
    read("app/platform-experience.tsx"),
    read("app/layout.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(platform, /export function MobileBottomNavigation/);
  assert.match(page, /<MobileBottomNavigation active=\{activeNav\}/);
  assert.match(settings, /Alto contraste/);
  assert.match(settings, /Tamanho do texto/);
  assert.match(settings, /Reiniciar apresentação/);
  assert.match(layout, /className="skip-link"/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /\.contrast-enabled/);
  assert.match(styles, /\.mobile-bottom-navigation/);
});

test("recovers drafts, supports undo, and improves field operation", async () => {
  const [page, field] = await Promise.all([
    read("app/page.tsx"),
    read("app/sector-workspaces.tsx"),
  ]);
  assert.match(page, /prefeitura:draft:new-ticket:v1/);
  assert.match(page, /Rascunho recuperado/);
  assert.match(page, /function restoreDeletedEvent/);
  assert.match(page, />Desfazer</);
  assert.match(field, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(field, /capture="environment"/);
  assert.match(field, /Confirmação do responsável/);
});
