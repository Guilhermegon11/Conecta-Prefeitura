import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ships Poppins locally as the single interface family", async () => {
  const [regular, medium, semibold, bold, license] = await Promise.all([
    readFile(new URL("../public/fonts/poppins/poppins-latin-400-normal.woff2", import.meta.url)),
    readFile(new URL("../public/fonts/poppins/poppins-latin-500-normal.woff2", import.meta.url)),
    readFile(new URL("../public/fonts/poppins/poppins-latin-600-normal.woff2", import.meta.url)),
    readFile(new URL("../public/fonts/poppins/poppins-latin-700-normal.woff2", import.meta.url)),
    read("public/fonts/poppins/LICENSE.txt"),
  ]);

  for (const font of [regular, medium, semibold, bold]) assert.ok(font.byteLength > 7_000);
  assert.match(license, /SIL OPEN FONT LICENSE/i);
});

test("applies Poppins throughout the 8.0 interface", async () => {
  const [styles, page, pkg] = await Promise.all([
    read("app/globals.css"),
    read("app/page.tsx"),
    read("package.json"),
  ]);

  assert.match(styles, /font-family: "Poppins";[\s\S]*?font-weight: 700;/);
  assert.match(styles, /--font-display: "Poppins", sans-serif;/);
  assert.match(styles, /--font-interface: "Poppins", sans-serif;/);
  assert.match(styles, /\.municipal-ui-v800,[\s\S]*?\.public-ui-v800 \*[\s\S]*?font-family:"Poppins",sans-serif !important/);
  assert.match(styles, /body \{[^}]*font-family: var\(--font-interface\)[^}]*font-weight: 500/);
  assert.doesNotMatch(styles, /font-family: "Figtree"|font-family: "Plus Jakarta Sans"|font-family: "Geist"/);
  assert.doesNotMatch(styles, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(page, /const PRODUCT_VERSION = "8\.0\.0"/);
  assert.match(pkg, /"version": "8\.0\.0"/);
});
