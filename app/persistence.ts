"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export type PersistenceStatus = "carregando" | "salvando" | "salvo" | "offline";

export function persistenceKey(...parts: Array<string | number>) {
  return parts.map((part) => String(part).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).filter(Boolean).join(":");
}

export async function loadPersistentValue<T>(key: string): Promise<T | null> {
  const response = await fetch(`/api/persistence?key=${encodeURIComponent(key)}`, { cache: "no-store" });
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? "Falha ao carregar dados.");
  }
  const payload = await response.json() as { found: boolean; value: T | null };
  return payload.found ? payload.value : null;
}

export async function savePersistentValue<T>(key: string, value: T) {
  const response = await fetch("/api/persistence", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, value }) });
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? "Falha ao salvar dados.");
  }
  return response.json() as Promise<{ ok: true; updatedAt?: string }>;
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
    const cachedKey = `prefeitura-cache:${key}`;

    void loadPersistentValue<T>(key).then(async (stored) => {
      if (cancelled) return;
      if (stored !== null) setValue(stored);
      else await savePersistentValue(key, initialValue);
      if (!cancelled) { setStatus("salvo"); setReady(true); }
    }).catch(() => {
      if (cancelled) return;
      try { const cached = localStorage.getItem(cachedKey); if (cached) setValue(JSON.parse(cached) as T); } catch { /* cache local é apenas contingência */ }
      setStatus("offline"); setReady(true);
    });
    return () => { cancelled = true; };
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    const cachedKey = `prefeitura-cache:${key}`;
    try { localStorage.setItem(cachedKey, JSON.stringify(value)); } catch { /* cache de contingência */ }
    setStatus("salvando");
    const timer = window.setTimeout(() => { void savePersistentValue(key, value).then(() => setStatus("salvo")).catch(() => setStatus("offline")); }, 450);
    return () => window.clearTimeout(timer);
  }, [key, ready, value]);

  useEffect(() => {
    if (status !== "offline" || !ready) return;
    const timer = window.setInterval(() => { void savePersistentValue(key, latestValue.current).then(() => setStatus("salvo")).catch(() => undefined); }, 8000);
    return () => window.clearInterval(timer);
  }, [key, ready, status]);

  return [value, setValue, status, ready];
}
