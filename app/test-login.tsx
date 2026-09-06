"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, Landmark, LockKeyhole, LogIn, ShieldCheck, Smartphone, UserRound } from "./site-icons";

type LoginResult = { ok?: boolean; error?: string; twoFactorRequired?: boolean; phone?: string; smsConfigured?: boolean };

function LoginShowcase() {
  return <aside className="login-showcase" aria-label="Resumo da plataforma">
    <header><span><Landmark size={20}/></span><div><strong>Prefeitura Conecta</strong><small>Gestão Integrada + IA</small></div></header>
    <div className="login-showcase-copy"><span>Portal administrativo</span><h2>Uma gestão mais clara, de ponta a ponta.</h2><p>Demandas, equipes, processos e indicadores em uma experiência única e organizada.</p></div>
    <div className="login-showcase-stats">
      <article><span><CheckCircle2 size={15}/></span><div><strong>Fluxos</strong><small>Acompanhamento central</small></div></article>
      <article><span><CalendarDays size={15}/></span><div><strong>Agenda</strong><small>Rotinas do município</small></div></article>
      <article><span><BarChart3 size={15}/></span><div><strong>Indicadores</strong><small>Decisões mais rápidas</small></div></article>
    </div>
    <article className="login-showcase-chart">
      <header><span>Visão operacional</span><b><ArrowUpRight size={12}/> dados organizados</b></header>
      <div><i style={{height:"42%"}}/><i style={{height:"66%"}}/><i className="active" style={{height:"88%"}}/><i style={{height:"58%"}}/><i style={{height:"76%"}}/><i style={{height:"52%"}}/></div>
    </article>
    <footer><ShieldCheck size={14}/><span><strong>Acesso protegido</strong><small>Ambiente exclusivo para a gestão municipal</small></span></footer>
  </aside>;
}

export function TestLoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(true);
  useEffect(() => { const refresh=()=>setOnline(navigator.onLine); refresh(); window.addEventListener("online",refresh); window.addEventListener("offline",refresh); return()=>{window.removeEventListener("online",refresh);window.removeEventListener("offline",refresh);}; }, []);

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

  return <main className="login-shell public-ui-v800 public-ui-dashboard">
    <div className="login-frame">
      <LoginShowcase/>
      <section className="login-panel">
      <div className="login-brand"><span><Landmark size={24} /></span><div><strong>Prefeitura Conecta</strong><small>Gestão Integrada</small></div></div>
      <div className="login-copy"><p className="eyebrow">ACESSO ADMINISTRATIVO</p><h1>{step === "credentials" ? "Entrar no sistema" : "Confirmar código SMS"}</h1><p>{step === "credentials" ? "Área restrita para servidores, secretários e Gabinete do Prefeito." : `Enviamos um código de verificação para ${phone}.`}</p></div>
      {!online && <p className="login-error">Sem internet. O primeiro login neste dispositivo exige conexão. Depois de um login válido, o aparelho poderá reabrir o sistema offline por até 24 horas.</p>}
      {step === "credentials" ? <form className="login-form" onSubmit={submitCredentials}>
        <label><span>Usuário</span><div><UserRound size={17} /><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required autoFocus /></div></label>
        <label><span>Senha</span><div><LockKeyhole size={17} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div></label>
        {error && <p className="login-error">{error}</p>}
        <button className="login-submit" disabled={busy || !online}>{busy ? "Entrando..." : <><LogIn size={17} /> Entrar</>}</button>
        <div className="test-access-note"><ShieldCheck size={16} /><span><strong>Acesso de teste</strong><small>Usuário: admin · Senha: admin</small></span></div>
      </form> : <form className="login-form" onSubmit={submitCode}>
        <label><span>Código de verificação</span><div><Smartphone size={17} /><input className="otp-input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="000000" required autoFocus /></div></label>
        {error && <p className="login-error">{error}</p>}
        <button className="login-submit" disabled={busy || !online}>{busy ? "Verificando..." : <><ShieldCheck size={17} /> Confirmar e entrar</>}</button>
        <button className="login-back" type="button" onClick={() => { setStep("credentials"); setCode(""); setError(""); }}>Voltar ao login</button>
      </form>}
      <footer><LockKeyhole size={13} /> Sessão administrativa protegida por cookie HttpOnly.</footer>
      </section>
    </div>
  </main>;
}

export function LoginLoadingScreen() {
  return <main className="login-shell public-ui-v800 public-ui-dashboard"><div className="login-frame login-loading-frame"><LoginShowcase/><section className="login-panel login-loading"><span className="login-loading-icon"><Landmark size={25} /></span><strong>Prefeitura Conecta</strong><p>Preparando seu painel...</p><i className="login-loading-line"/></section></div></main>;
}
