"use client";

import { FormEvent, useState } from "react";
import { Landmark, LockKeyhole, LogIn, ShieldCheck, Smartphone, UserRound } from "lucide-react";

type LoginResult = { ok?: boolean; error?: string; twoFactorRequired?: boolean; phone?: string; smsConfigured?: boolean };

export function TestLoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
      const payload = await response.json().catch(() => null) as LoginResult | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Não foi possível entrar.");
      if (payload.twoFactorRequired) { setPhone(payload.phone || "telefone cadastrado"); setStep("code"); return; }
      onAuthenticated();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Falha no login."); }
    finally { setBusy(false); }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      const payload = await response.json().catch(() => null) as LoginResult | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Código inválido.");
      onAuthenticated();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Falha na verificação."); }
    finally { setBusy(false); }
  }

  return <main className="login-shell">
    <section className="login-panel">
      <div className="login-brand"><span><Landmark size={24} /></span><div><strong>Prefeitura Conecta</strong><small>Gestão Integrada</small></div></div>
      <div className="login-copy"><p className="eyebrow">ACESSO ADMINISTRATIVO</p><h1>{step === "credentials" ? "Entrar no sistema" : "Confirmar código SMS"}</h1><p>{step === "credentials" ? "Use o acesso de teste para validar a tela de autenticação." : `Enviamos um código de verificação para ${phone}.`}</p></div>
      {step === "credentials" ? <form className="login-form" onSubmit={submitCredentials}>
        <label><span>Usuário</span><div><UserRound size={17} /><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required autoFocus /></div></label>
        <label><span>Senha</span><div><LockKeyhole size={17} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div></label>
        {error && <p className="login-error">{error}</p>}
        <button className="login-submit" disabled={busy}>{busy ? "Entrando..." : <><LogIn size={17} /> Entrar</>}</button>
        <div className="test-access-note"><ShieldCheck size={16} /><span><strong>Acesso de teste</strong><small>Usuário: admin · Senha: admin</small></span></div>
      </form> : <form className="login-form" onSubmit={submitCode}>
        <label><span>Código de verificação</span><div><Smartphone size={17} /><input className="otp-input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="000000" required autoFocus /></div></label>
        {error && <p className="login-error">{error}</p>}
        <button className="login-submit" disabled={busy}>{busy ? "Verificando..." : <><ShieldCheck size={17} /> Confirmar e entrar</>}</button>
        <button className="login-back" type="button" onClick={() => { setStep("credentials"); setCode(""); setError(""); }}>Voltar ao login</button>
      </form>}
      <footer><LockKeyhole size={13} /> Sessão protegida por cookie HttpOnly. Em produção, altere as credenciais de teste.</footer>
    </section>
  </main>;
}

export function LoginLoadingScreen() {
  return <main className="login-shell"><section className="login-panel login-loading"><span className="login-loading-icon"><Landmark size={25} /></span><strong>Prefeitura Conecta</strong><p>Verificando sessão...</p></section></main>;
}
