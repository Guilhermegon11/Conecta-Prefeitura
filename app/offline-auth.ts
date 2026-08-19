"use client";

const KEY = "prefeitura-offline-session:v1";
const LOGOUT_KEY = "prefeitura-offline-logout:v1";
const TTL_MS = 24 * 60 * 60 * 1000;

type OfflineSession = { authenticated: true; issuedAt: number; expiresAt: number };

export function rememberOfflineSession() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify({ authenticated: true, issuedAt: Date.now(), expiresAt: Date.now() + TTL_MS } satisfies OfflineSession)); localStorage.removeItem(LOGOUT_KEY); } catch { /* ignore */ }
}

export function hasValidOfflineSession() {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(LOGOUT_KEY) === "1") return false;
    const raw = localStorage.getItem(KEY); if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<OfflineSession>;
    if (parsed.authenticated !== true || typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) { localStorage.removeItem(KEY); return false; }
    return true;
  } catch { return false; }
}

export function clearOfflineSession(markServerLogoutPending = false) {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); if (markServerLogoutPending) localStorage.setItem(LOGOUT_KEY, "1"); else localStorage.removeItem(LOGOUT_KEY); } catch { /* ignore */ }
}

export async function flushPendingOfflineLogout() {
  if (typeof window === "undefined" || !navigator.onLine) return;
  try {
    if (localStorage.getItem(LOGOUT_KEY) !== "1") return;
    const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    if (response.ok) localStorage.removeItem(LOGOUT_KEY);
  } catch { /* tenta novamente no próximo online */ }
}
