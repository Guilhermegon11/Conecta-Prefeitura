"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { flushOfflineQueue, queuePersistentWrite } from "./offline-sync";
import { useCurrentPermission } from "./permission-context";

export type PersistenceStatus = "carregando" | "salvando" | "salvo" | "offline";
type PersistentStateOptions = { readOnly?: boolean };

const saveChains = new Map<string, Promise<{ ok: true; updatedAt?: string; queued?: boolean }>>();

export function persistenceKey(...parts: Array<string | number>) {
  return parts.map((part) => String(part).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).filter(Boolean).join(":");
}

function cacheKey(key: string) { return `prefeitura-cache:${key}`; }

export function loadCachedPersistentValue<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(cacheKey(key));
    return cached ? JSON.parse(cached) as T : null;
  } catch {
    return null;
  }
}

export function cachePersistentValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(cacheKey(key), JSON.stringify(value)); } catch { /* cache local é contingência */ }
}

export async function loadPersistentValue<T>(key: string): Promise<T | null> {
  const response = await fetch(`/api/persistence?key=${encodeURIComponent(key)}`, { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? "Falha ao carregar dados.");
  }
  const payload = await response.json() as { found: boolean; value: T | null };
  if (payload.found) cachePersistentValue(key, payload.value);
  return payload.found ? payload.value : null;
}

export function savePersistentValue<T>(key: string, value: T): Promise<{ ok: true; updatedAt?: string; queued?: boolean }> {
  // Escrita local imediata: o usuário continua trabalhando mesmo sem internet.
  cachePersistentValue(key, value);

  const previous = saveChains.get(key) ?? Promise.resolve({ ok: true as const });
  const next = previous.catch(() => ({ ok: true as const })).then(async () => {
    // Se o navegador já sabe que está offline, evita esperar timeout de rede.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queuePersistentWrite(key, value);
      return { ok: true as const, queued: true };
    }
    try {
      const response = await fetch("/api/persistence", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value }),
        credentials: "same-origin",
        keepalive: true,
        cache: "no-store",
      });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorBody?.error ?? "Falha ao salvar dados.");
      }
      // Um PUT bem-sucedido é uma boa oportunidade para escoar alterações antigas.
      void flushOfflineQueue().catch(() => undefined);
      return await response.json() as { ok: true; updatedAt?: string };
    } catch (error) {
      await queuePersistentWrite(key, value);
      // A gravação está preservada no dispositivo; sinalizamos queued sem perder o estado.
      return { ok: true as const, queued: true };
    }
  });
  saveChains.set(key, next);
  void next.finally(() => { if (saveChains.get(key) === next) saveChains.delete(key); }).catch(() => undefined);
  return next;
}

export function usePersistentState<T>(key: string, initialValue: T, options: PersistentStateOptions = {}): [T, Dispatch<SetStateAction<T>>, PersistenceStatus, boolean] {
  const permission = useCurrentPermission();
  const readOnly = Boolean(options.readOnly) || (!permission.register && !permission.edit);
  const [value, setValue] = useState<T>(initialValue);
  const [status, setStatus] = useState<PersistenceStatus>("carregando");
  const [ready, setReady] = useState(false);
  const skipNextSave = useRef(true);
  const latestValue = useRef(value);
  latestValue.current = value;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setStatus("carregando");
    skipNextSave.current = true;
    latestValue.current = initialValue;
    setValue(initialValue);

    void loadPersistentValue<T>(key).then(async (stored) => {
      if (cancelled) return;
      if (stored !== null) setValue(stored);
      else {
        const cached = loadCachedPersistentValue<T>(key);
        if (cached !== null) setValue(cached);
        if (!readOnly) await savePersistentValue(key, cached ?? initialValue);
      }
      if (!cancelled) { setStatus("salvo"); setReady(true); }
    }).catch(() => {
      if (cancelled) return;
      const cached = loadCachedPersistentValue<T>(key);
      if (cached !== null) setValue(cached);
      setStatus("offline"); setReady(true);
    });
    return () => { cancelled = true; };
  }, [key, readOnly]);

  useEffect(() => {
    if (!ready || readOnly) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    cachePersistentValue(key, value);
    setStatus("salvando");
    // Sem debounce longo: a chamada começa imediatamente e `keepalive` permite
    // que o navegador conclua a requisição mesmo durante uma atualização da página.
    void savePersistentValue(key, value).then((result) => setStatus(result.queued ? "offline" : "salvo")).catch(() => setStatus("offline"));
  }, [key, readOnly, ready, value]);

  useEffect(() => {
    if (status !== "offline" || !ready || readOnly) return;
    const timer = window.setInterval(() => { void savePersistentValue(key, latestValue.current).then((result) => setStatus(result.queued ? "offline" : "salvo")).catch(() => undefined); }, 8000);
    return () => window.clearInterval(timer);
  }, [key, readOnly, ready, status]);

  return [value, setValue, status, ready];
}
