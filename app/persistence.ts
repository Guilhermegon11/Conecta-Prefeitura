"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export type PersistenceStatus = "carregando" | "salvando" | "salvo" | "offline";

const saveChains = new Map<string, Promise<{ ok: true; updatedAt?: string }>>();

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

export function savePersistentValue<T>(key: string, value: T): Promise<{ ok: true; updatedAt?: string }> {
  // Escrita local imediata: evita perder alterações quando a página é atualizada
  // antes da conclusão da gravação remota.
  cachePersistentValue(key, value);

  // Serializa gravações da mesma chave. Isso evita que uma requisição antiga,
  // mais lenta, termine depois de uma nova e sobrescreva o estado mais recente.
  const previous = saveChains.get(key) ?? Promise.resolve({ ok: true as const });
  const next = previous.catch(() => ({ ok: true as const })).then(async () => {
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
    return response.json() as Promise<{ ok: true; updatedAt?: string }>;
  });
  saveChains.set(key, next);
  void next.finally(() => { if (saveChains.get(key) === next) saveChains.delete(key); }).catch(() => undefined);
  return next;
}

export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>, PersistenceStatus, boolean] {
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
        await savePersistentValue(key, cached ?? initialValue);
      }
      if (!cancelled) { setStatus("salvo"); setReady(true); }
    }).catch(() => {
      if (cancelled) return;
      const cached = loadCachedPersistentValue<T>(key);
      if (cached !== null) setValue(cached);
      setStatus("offline"); setReady(true);
    });
    return () => { cancelled = true; };
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    cachePersistentValue(key, value);
    setStatus("salvando");
    // Sem debounce longo: a chamada começa imediatamente e `keepalive` permite
    // que o navegador conclua a requisição mesmo durante uma atualização da página.
    void savePersistentValue(key, value).then(() => setStatus("salvo")).catch(() => setStatus("offline"));
  }, [key, ready, value]);

  useEffect(() => {
    if (status !== "offline" || !ready) return;
    const timer = window.setInterval(() => { void savePersistentValue(key, latestValue.current).then(() => setStatus("salvo")).catch(() => undefined); }, 8000);
    return () => window.clearInterval(timer);
  }, [key, ready, status]);

  return [value, setValue, status, ready];
}
