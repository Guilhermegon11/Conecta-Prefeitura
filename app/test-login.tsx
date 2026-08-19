"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, HeartHandshake, Landmark, LockKeyhole, LogIn, MessageSquareText, Send, ShieldCheck, Smartphone, Star, UserRound } from "lucide-react";

type LoginResult = { ok?: boolean; error?: string; twoFactorRequired?: boolean; phone?: string; smsConfigured?: boolean };
type FeedbackKind = "Reclamação" | "Elogio" | "Sugestão";

type FeedbackResponse = { ok?: boolean; protocol?: string; error?: string };

function PublicCitizenPortal() {
  const [kind, setKind] = useState<FeedbackKind>("Reclamação");
  const [rating, setRating] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [protocol, setProtocol] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/citizen-feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          rating,
          subject: String(form.get("subject") ?? ""),
          message: String(form.get("message") ?? ""),
          name: String(form.get("name") ?? ""),
          contact: String(form.get("contact") ?? ""),
          neighborhood: String(form.get("neighborhood") ?? ""),
          website: String(form.get("website") ?? ""),
          anonymous,
          consent: form.get("consent") === "on",
        }),
      });
      const payload = await response.json().catch(() => null) as FeedbackResponse | null;
      if (!response.ok || !payload?.ok || !payload.protocol) throw new Error(payload?.error || "Não foi possível registrar sua manifestação.");
      setProtocol(payload.protocol);
      formElement.reset();
      setRating(0); setAnonymous(false); setKind("Reclamação");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível registrar sua manifestação.");
    } finally { setBusy(false); }
  }

  return <section className="citizen-front-panel" aria-labelledby="citizen-front-title">
    <div className="citizen-front-heading">
      <span><HeartHandshake size={23} /></span>
      <div><p className="eyebrow">CANAL DIRETO COM A PREFEITURA</p><h1 id="citizen-front-title">Fale direto com o Prefeito</h1><p>Registre uma reclamação, elogio ou sugestão. Sua manifestação recebe protocolo e entra automaticamente na caixa do Gabinete do Prefeito.</p></div>
    </div>

    {protocol ? <div className="citizen-success">
      <span><CheckCircle2 size={28} /></span><div><strong>Manifestação enviada com sucesso</strong><p>Guarde seu protocolo para referência:</p><code>{protocol}</code><small>O registro já foi encaminhado ao Gabinete do Prefeito.</small></div>
      <button type="button" onClick={() => setProtocol("")}>Enviar outra manifestação</button>
    </div> : <form className="citizen-public-form" onSubmit={submit}>
      <div className="citizen-kind-grid" role="group" aria-label="Tipo da manifestação">
        {(["Reclamação", "Elogio", "Sugestão"] as FeedbackKind[]).map((item) => <button type="button" key={item} className={kind === item ? "active" : ""} onClick={() => setKind(item)}><MessageSquareText size={15} />{item}</button>)}
      </div>
      <fieldset className="citizen-rating"><legend>Como você avalia a Prefeitura hoje? *</legend><div>{[1,2,3,4,5].map((value) => <button type="button" key={value} className={rating >= value ? "active" : ""} aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`} onClick={() => setRating(value)}><Star size={22} fill={rating >= value ? "currentColor" : "none"} /></button>)}</div><small>{rating ? `${rating}/5 selecionado` : "Selecione de 1 a 5 estrelas"}</small></fieldset>
      <div className="citizen-public-grid">
        <label className="full"><span>Assunto *</span><input name="subject" maxLength={140} required placeholder="Ex.: coleta de lixo no meu bairro" /></label>
        <label className="full"><span>Conte o que aconteceu ou deixe sua sugestão *</span><textarea name="message" minLength={10} maxLength={4000} required placeholder="Descreva de forma clara para que o Gabinete possa entender e encaminhar corretamente." /></label>
        <label><span>Seu nome</span><input name="name" maxLength={120} disabled={anonymous} placeholder={anonymous ? "Envio anônimo" : "Nome completo"} /></label>
        <label><span>Contato para retorno</span><input name="contact" maxLength={180} disabled={anonymous} placeholder="Telefone ou e-mail (opcional)" /></label>
        <label className="full"><span>Bairro</span><input name="neighborhood" maxLength={100} placeholder="Opcional" /></label>
        <label className="citizen-check full"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /><span>Quero enviar de forma anônima</span></label>
        <label className="citizen-check full"><input type="checkbox" name="consent" required /><span>Concordo com o tratamento dos dados informados exclusivamente para registro, triagem e resposta desta manifestação.</span></label>
        <label className="citizen-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {rating === 0 && <p className="citizen-form-hint">A avaliação por estrelas é obrigatória para concluir o envio.</p>}
      {error && <p className="login-error">{error}</p>}
      <button className="citizen-send" disabled={busy || rating === 0}>{busy ? "Enviando..." : <><Send size={17} /> Enviar direto ao Prefeito</>}</button>
      <p className="citizen-privacy"><ShieldCheck size={13} /> Canal protegido. Dados pessoais não são exibidos publicamente.</p>
    </form>}
  </section>;
}

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

  return <main className="login-shell public-front-shell">
    <div className="public-front-layout">
      <PublicCitizenPortal />
      <section className="login-panel">
        <div className="login-brand"><span><Landmark size={24} /></span><div><strong>Prefeitura Conecta</strong><small>Gestão Integrada</small></div></div>
        <div className="login-copy"><p className="eyebrow">ACESSO ADMINISTRATIVO</p><h1>{step === "credentials" ? "Entrar no sistema" : "Confirmar código SMS"}</h1><p>{step === "credentials" ? "Área restrita para servidores, secretários e Gabinete do Prefeito." : `Enviamos um código de verificação para ${phone}.`}</p></div>
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
        <footer><LockKeyhole size={13} /> Sessão administrativa protegida por cookie HttpOnly.</footer>
      </section>
    </div>
  </main>;
}

export function LoginLoadingScreen() {
  return <main className="login-shell"><section className="login-panel login-loading"><span className="login-loading-icon"><Landmark size={25} /></span><strong>Prefeitura Conecta</strong><p>Verificando sessão...</p></section></main>;
}
