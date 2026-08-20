import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readPage = () => readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("makes managers from every secretariat available in direct messages", async () => {
  const source = await readPage();
  assert.match(source, /const communicationDirectoryUsers = activeUsers\.filter/);
  assert.match(source, /isSectorManager\(currentUser\) && isSectorManager\(user\)/);
  assert.match(source, /<CommunicationSection[^>]+users=\{communicationDirectoryUsers\}/);
  assert.match(source, /conversationType === "direct"[^\n]+communicationDirectoryUsers\.some/);
  assert.match(source, /className="intersectoral-contact"/);
});

test("allows cross-sector direct messages only between managers", async () => {
  const source = await readPage();
  assert.match(source, /function messageAllowedInCommunication/);
  assert.match(source, /const managersOnly = participants\.every\(isSectorManager\)/);
  assert.match(source, /return sameSector \|\| managersOnly/);
  assert.match(source, /messageVisibleToUser\(message, currentUserId, groups\) && messageAllowedInCommunication/);
});

test("keeps groups and operational records restricted to the selected sector", async () => {
  const source = await readPage();
  assert.match(source, /message\.conversationType === "group"\) return messageConfinedToDepartment/);
  assert.match(source, /<GroupModal[^>]+users=\{scopedActiveUsers\}/);
  assert.match(source, /const privateTickets = ticketData\.filter\(\(ticket\) => sameDepartment\(ticket\.department, activeDepartment\)\)/);
  assert.match(source, /const privateDocuments = documents\.filter\(\(document\) => sameDepartment\(document\.department, activeDepartment\)\)/);
});
