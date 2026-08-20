import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (file) => readFile(new URL(`../app/${file}`, import.meta.url), "utf8");

test("starts the demonstration with the Prefeito profile", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /useState\("u-prefeito"\)/);
  assert.match(source, /useState\("Gabinete do Prefeito"\)/);
});

test("allows every demonstration profile while keeping sector navigation executive-only", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /role === "prefeito" \|\| role === "vice-prefeito"/);
  assert.match(source, /availableDepartments = executiveAccess \? allDepartments : \[activeDepartment\]/);
  assert.match(source, /activeDepartment = executiveAccess \? viewedDepartment : currentUser\.department/);
  assert.match(source, /activeUsers\.map\(\(user\) => <option/);
  assert.doesNotMatch(source, /<option[^>]+disabled>/);
  assert.doesNotMatch(source, /troca de perfil foi bloqueada/);
});

test("restores the complete historical user registry", async () => {
  const source = await readSource("page.tsx");
  assert.match(source, /setUsers\(restoreRegisteredUsers\(stored\.users\)\)/);
  assert.match(source, /setUsers\(restoreRegisteredUsers\(cached\.users\)\)/);
  assert.match(source, /const restoredDefaults = USERS\.map/);
  assert.match(source, /return \[\.\.\.restoredDefaults, \.\.\.sanitized\.filter/);
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
