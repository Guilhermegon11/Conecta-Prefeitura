import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (file) => readFile(new URL(`../app/${file}`, import.meta.url), "utf8");

test("restricts cross-sector navigation to Prefeito and Vice-prefeito", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /role === "prefeito" \|\| role === "vice-prefeito"/);
  assert.match(source, /availableDepartments = executiveAccess \? allDepartments : \[activeDepartment\]/);
  assert.match(source, /!executiveAccess && !sameDepartment\(nextUser\.department, currentUser\.department\)/);
});

test("passes only sector-scoped collections to global views", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /tickets=\{privateTickets\} users=\{scopedActiveUsers\}/);
  assert.match(source, /offices=\{scopedOffices\} events=\{currentEvents\}/);
  assert.match(source, /allTickets=\{privateTickets\}/);
  assert.match(source, /documents=\{privateDocuments\}/);
});

test("keeps operational modules and AI history inside the selected sector", async () => {
  const [integrated, modules, copilot] = await Promise.all([
    readSource("integrated-platform.tsx"),
    readSource("municipal-modules.tsx"),
    readSource("municipal-ai-copilot.tsx"),
  ]);
  assert.match(integrated, /tasks\.filter\(\(task\)=>normalize\(task\.department\)===normalize\(department\)\)/);
  assert.match(integrated, /places\.filter\(\(place\)=>Boolean\(place\.department\) && normalize\(place\.department\)===normalize\(department\)\)/);
  assert.match(modules, /processes\.filter\(\(item\) => item\.currentDepartment === department\)/);
  assert.match(modules, /managementItemBelongsToDepartment\(item, department\)/);
  assert.match(copilot, /persistenceKey\("municipal-ai-chat-history", user\.id, department, "v2"\)/);
});
