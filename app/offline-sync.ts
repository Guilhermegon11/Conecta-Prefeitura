"use client";

const DB_NAME = "prefeitura-conecta-offline";
const DB_VERSION = 1;
const QUEUE_STORE = "queue";
const RECEIPT_STORE = "receipts";
const TRACKING_STORE = "tracking";
const QUEUE_EVENT = "prefeitura:offline-queue-changed";
const SYNC_EVENT = "prefeitura:offline-sync-finished";

export type OfflineQueueKind = "persistence" | "json" | "form-data" | "citizen-feedback";
export type OfflineQueueItem = {
  id: string;
  kind: OfflineQueueKind;
  url: string;
  method: string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  label: string;
  headers?: Record<string, string>;
  body?: unknown;
  persistenceKey?: string;
  attachments?: Array<{ name: string; type: string; blob: Blob }>;
  formEntries?: Array<{ key: string; value: string | Blob; filename?: string; type?: string }>;
  lastError?: string;
};

export type OfflineCitizenReceipt = {
  localId: string;
  localProtocol: string;
  status: "pending" | "synced" | "failed";
  createdAt: string;
  syncedAt?: string;
  protocol?: string;
  accessCode?: string;
  subject?: string;
  lastError?: string;
};

type TrackingCache = { id: string; protocol: string; accessCode: string; value: unknown; cachedAt: string };

function canUseIndexedDb() { return typeof window !== "undefined" && "indexedDB" in window; }
function nowIso() { return new Date().toISOString(); }
function randomId(prefix: string) { return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`; }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) { reject(new Error("IndexedDB indisponível.")); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(RECEIPT_STORE)) db.createObjectStore(RECEIPT_STORE, { keyPath: "localId" });
      if (!db.objectStoreNames.contains(TRACKING_STORE)) db.createObjectStore(TRACKING_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha ao abrir armazenamento offline."));
  });
}

async function withStore<T>(storeName: string, mode: IDBTransactionMode, task: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = task(tx.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha no armazenamento offline."));
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error("Falha no armazenamento offline.")); };
  });
}

async function putQueue(item: OfflineQueueItem) {
  await withStore(QUEUE_STORE, "readwrite", (store) => store.put(item));
  dispatchQueueChanged();
  void requestBackgroundSync();
}
async function deleteQueue(id: string) {
  await withStore(QUEUE_STORE, "readwrite", (store) => store.delete(id));
  dispatchQueueChanged();
}
async function allQueue() {
  return await withStore<OfflineQueueItem[]>(QUEUE_STORE, "readonly", (store) => store.getAll());
}
async function putReceipt(receipt: OfflineCitizenReceipt) {
  await withStore(RECEIPT_STORE, "readwrite", (store) => store.put(receipt));
  dispatchQueueChanged();
}


async function requestBackgroundSync() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const syncManager = (registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync;
    if (syncManager) await syncManager.register("prefeitura-offline-sync");
  } catch { /* Background Sync não existe em todos os navegadores. */ }
}

function dispatchQueueChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
}

export async function getOfflinePendingCount() {
  if (!canUseIndexedDb()) return 0;
  try { return (await allQueue()).length; } catch { return 0; }
}

export async function queuePersistentWrite(key: string, value: unknown) {
  const stamp = nowIso();
  await putQueue({ id: `persistence:${key}`, kind: "persistence", url: "/api/persistence", method: "PUT", createdAt: stamp, updatedAt: stamp, attempts: 0, label: `Salvar ${key}`, persistenceKey: key, headers: { "content-type": "application/json" }, body: { key, value } });
}

export async function queueJsonRequest(url: string, method: string, body: unknown, label = "Operação pendente") {
  const stamp = nowIso();
  const id = randomId("json");
  await putQueue({ id, kind: "json", url, method, createdAt: stamp, updatedAt: stamp, attempts: 0, label, headers: { "content-type": "application/json" }, body });
  return id;
}


export async function queueFormRequest(url: string, method: string, form: FormData, label = "Arquivo pendente") {
  const stamp = nowIso(); const id = randomId("form");
  const formEntries: OfflineQueueItem["formEntries"] = [];
  for (const [key, value] of form.entries()) {
    if (value instanceof File) formEntries.push({ key, value: value.slice(0, value.size, value.type || "application/octet-stream"), filename: value.name, type: value.type || "application/octet-stream" });
    else formEntries.push({ key, value: String(value) });
  }
  await putQueue({ id, kind: "form-data", url, method, createdAt: stamp, updatedAt: stamp, attempts: 0, label, formEntries });
  return id;
}

export async function queueCitizenFeedback(payload: Record<string, unknown>, files: File[]) {
  const stamp = nowIso();
  const localId = randomId("citizen");
  const suffix = localId.split("-").pop()?.slice(0, 6).toUpperCase() || String(Date.now()).slice(-6);
  const localProtocol = `OFF-${stamp.slice(0, 10).replaceAll("-", "")}-${suffix}`;
  const attachments = files.slice(0, 3).map((file) => ({ name: file.name, type: file.type || "application/octet-stream", blob: file.slice(0, file.size, file.type || "application/octet-stream") }));
  await putQueue({ id: localId, kind: "citizen-feedback", url: "/api/citizen-feedback", method: "POST", createdAt: stamp, updatedAt: stamp, attempts: 0, label: `Manifestação ${localProtocol}`, headers: { "content-type": "application/json" }, body: payload, attachments });
  await putReceipt({ localId, localProtocol, status: "pending", createdAt: stamp, subject: typeof payload.subject === "string" ? payload.subject : "" });
  return { localId, localProtocol };
}

export async function listOfflineCitizenReceipts(): Promise<OfflineCitizenReceipt[]> {
  if (!canUseIndexedDb()) return [];
  try {
    const items = await withStore<OfflineCitizenReceipt[]>(RECEIPT_STORE, "readonly", (store) => store.getAll());
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch { return []; }
}

export async function resolveOfflineCitizenProtocol(localProtocol: string) {
  const receipts = await listOfflineCitizenReceipts();
  return receipts.find((item) => item.localProtocol.toUpperCase() === localProtocol.trim().toUpperCase()) ?? null;
}

export async function cacheCitizenTracking(protocol: string, accessCode: string, value: unknown) {
  if (!canUseIndexedDb()) return;
  const id = `${protocol.trim().toUpperCase()}|${accessCode.trim()}`;
  await withStore(TRACKING_STORE, "readwrite", (store) => store.put({ id, protocol: protocol.trim().toUpperCase(), accessCode: accessCode.trim(), value, cachedAt: nowIso() } satisfies TrackingCache));
}

export async function loadCachedCitizenTracking(protocol: string, accessCode: string) {
  if (!canUseIndexedDb()) return null;
  try {
    const id = `${protocol.trim().toUpperCase()}|${accessCode.trim()}`;
    const result = await withStore<TrackingCache | undefined>(TRACKING_STORE, "readonly", (store) => store.get(id));
    return result?.value ?? null;
  } catch { return null; }
}

async function performQueueItem(item: OfflineQueueItem) {
  if (item.kind === "form-data") {
    const form = new FormData();
    for (const entry of item.formEntries ?? []) {
      if (typeof entry.value === "string") form.append(entry.key, entry.value);
      else form.append(entry.key, new File([entry.value], entry.filename || "arquivo", { type: entry.type || entry.value.type || "application/octet-stream" }));
    }
    const response = await fetch(item.url, { method: item.method, body: form, credentials: "same-origin", cache: "no-store" });
    if (!response.ok) { const payload = await response.json().catch(() => null) as { error?: string } | null; throw new Error(payload?.error || `Falha HTTP ${response.status}`); }
    return;
  }
  if (item.kind === "citizen-feedback") {
    const response = await fetch(item.url, { method: "POST", headers: item.headers, body: JSON.stringify(item.body ?? {}), credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => null) as { ok?: boolean; protocol?: string; accessCode?: string; error?: string } | null;
    if (!response.ok || !payload?.ok || !payload.protocol) throw new Error(payload?.error || `Falha HTTP ${response.status}`);
    let attachmentFailures = 0;
    if (payload.accessCode && item.attachments?.length) {
      for (const attachment of item.attachments) {
        try {
          const form = new FormData();
          form.set("protocol", payload.protocol); form.set("accessCode", payload.accessCode);
          form.set("file", new File([attachment.blob], attachment.name, { type: attachment.type }));
          const upload = await fetch("/api/citizen-feedback-attachment", { method: "POST", body: form, cache: "no-store" });
          if (!upload.ok) attachmentFailures += 1;
        } catch { attachmentFailures += 1; }
      }
    }
    const receipts = await listOfflineCitizenReceipts();
    const current = receipts.find((receipt) => receipt.localId === item.id);
    await putReceipt({ localId: item.id, localProtocol: current?.localProtocol || item.label.replace("Manifestação ", ""), status: "synced", createdAt: current?.createdAt || item.createdAt, syncedAt: nowIso(), protocol: payload.protocol, accessCode: payload.accessCode || "", subject: current?.subject, lastError: attachmentFailures ? `${attachmentFailures} anexo(s) não sincronizado(s).` : undefined });
    return;
  }
  const response = await fetch(item.url, { method: item.method, headers: item.headers, body: item.body === undefined ? undefined : JSON.stringify(item.body), credentials: "same-origin", cache: "no-store", keepalive: item.kind === "persistence" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `Falha HTTP ${response.status}`);
  }
}

let flushing: Promise<{ synced: number; remaining: number }> | null = null;
export function flushOfflineQueue() {
  if (flushing) return flushing;
  flushing = (async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return { synced: 0, remaining: await getOfflinePendingCount() };
    let synced = 0;
    const items = (await allQueue()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const item of items) {
      try {
        await performQueueItem(item);
        await deleteQueue(item.id); synced += 1;
      } catch (error) {
        const next = { ...item, attempts: item.attempts + 1, updatedAt: nowIso(), lastError: error instanceof Error ? error.message.slice(0, 500) : "Falha de sincronização" };
        await putQueue(next);
        if (typeof navigator !== "undefined" && !navigator.onLine) break;
        if (/Sessão expirada|401/i.test(next.lastError || "")) break;
      }
    }
    const remaining = await getOfflinePendingCount();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { synced, remaining } }));
    return { synced, remaining };
  })().finally(() => { flushing = null; });
  return flushing;
}

export function subscribeOfflineQueue(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(QUEUE_EVENT, listener);
  window.addEventListener(SYNC_EVENT, listener);
  return () => { window.removeEventListener(QUEUE_EVENT, listener); window.removeEventListener(SYNC_EVENT, listener); };
}

export const offlineSyncEvents = { queueChanged: QUEUE_EVENT, syncFinished: SYNC_EVENT } as const;
