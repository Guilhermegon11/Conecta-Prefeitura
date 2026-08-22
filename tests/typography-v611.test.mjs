import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ships the requested typography as local assets", async () => {
  const [figtree, jakarta, figtreeLicense, jakartaLicense] = await Promise.all([
    readFile(new URL("../public/fonts/figtree/figtree-latin-700-normal.woff2", import.meta.url)),
    readFile(new URL("../public/fonts/plus-jakarta-sans/plus-jakarta-sans-latin-500-normal.woff2", import.meta.url)),
    read("public/fonts/figtree/LICENSE.txt"),
    read("public/fonts/plus-jakarta-sans/LICENSE.txt"),
  ]);

  assert.ok(figtree.byteLength > 10_000);
  assert.ok(jakarta.byteLength > 10_000);
  assert.match(figtreeLicense, /SIL OPEN FONT LICENSE/i);
  assert.match(jakartaLicense, /SIL OPEN FONT LICENSE/i);
});

test("applies Figtree 700 to emphasis and Plus Jakarta Sans 500 to reading", async () => {
  const [styles, page, pkg] = await Promise.all([
    read("app/globals.css"),
    read("app/page.tsx"),
    read("package.json"),
  ]);

  assert.match(styles, /font-family: "Figtree";[\s\S]*?font-weight: 700;/);
  assert.match(styles, /font-family: "Plus Jakarta Sans";[\s\S]*?font-weight: 500;/);
  assert.match(styles, /h1,[\s\S]*?\.nav-label \{[\s\S]*?font-family: var\(--font-display\);[\s\S]*?font-weight: 700;/);
  assert.match(styles, /body \{[^}]*font-family: var\(--font-interface\)[^}]*font-weight: 500/);
  assert.doesNotMatch(styles, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(page, /const PRODUCT_VERSION = "7\.0\.0"/);
  assert.match(pkg, /"version": "7\.0\.0"/);
});
