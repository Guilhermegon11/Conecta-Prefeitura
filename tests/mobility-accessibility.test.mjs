import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ships an installable PWA with silent background synchronization", async () => {
  const [manifestSource, platform, layout, styles, worker] = await Promise.all([
    read("public/manifest.webmanifest"),
    read("app/platform-experience.tsx"),
    read("app/layout.tsx"),
    read("app/globals.css"),
    read("public/sw.js"),
  ]);
  const manifest = JSON.parse(manifestSource);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.icons.length, 2);
  assert.match(platform, /export function PwaInstallCard/);
  assert.match(platform, /window\.addEventListener\("online", sync\)/);
  assert.doesNotMatch(platform, /OfflineStatusBar|Conexão restaurada|Sincronizar agora/);
  assert.doesNotMatch(layout, /OfflineStatusBar/);
  assert.doesNotMatch(styles, /offline-global-bar/);
  assert.match(worker, /prefeitura-conecta-offline-v493/);
});

test("keeps IA Conecta only inside the floating plus menu", async () => {
  const [platform, copilot, styles] = await Promise.all([
    read("app/platform-experience.tsx"),
    read("app/municipal-ai-copilot.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(platform, /className="quick-action-ai"/);
  assert.match(platform, /<span>IA Conecta<\/span>/);
  assert.match(platform, /aria-expanded=\{open\}/);
  assert.doesNotMatch(copilot, /municipal-ai-fab/);
  assert.doesNotMatch(styles, /\.municipal-ai-fab/);
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
