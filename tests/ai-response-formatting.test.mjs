import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (file) => readFile(new URL(`../app/${file}`, import.meta.url), "utf8");

test("renders assistant replies as structured rich text", async () => {
  const [copilot, richText] = await Promise.all([
    readSource("municipal-ai-copilot.tsx"),
    readSource("ai-rich-text.tsx"),
  ]);
  assert.match(copilot, /message\.role === "assistant" \? <AiRichText content=\{message\.content\}/);
  assert.match(richText, /function parseAiText/);
  assert.match(richText, /type: "heading"/);
  assert.match(richText, /type: "list"/);
  assert.match(richText, /type: "table"/);
  assert.match(richText, /className="municipal-ai-table-cards"/);
});

test("turns narrow Markdown tables into readable action cards", async () => {
  const source = await readSource("ai-rich-text.tsx");
  assert.match(source, /function AiTableCards/);
  assert.match(source, /fieldEmoji/);
  assert.match(source, /"🎯"/);
  assert.match(source, /"✅"/);
  assert.match(source, /"👤"/);
  assert.match(source, /"⏱️"/);
});

test("asks the AI for spaced responses with moderate emojis and no Markdown tables", async () => {
  const source = await readSource("municipal-ai.server.ts");
  assert.match(source, /uma linha em branco entre títulos, parágrafos e tópicos/);
  assert.match(source, /Use emojis de forma moderada e pertinente/);
  assert.match(source, /Não use tabelas Markdown neste chat/);
  assert.match(source, /Olá, \$\{firstName\}! 👋\\n\\n\$\{clean\}/);
});
