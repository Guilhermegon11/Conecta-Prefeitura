"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, HeartHandshake, Landmark, MessageSquareText, Send, ShieldCheck, Star } from "lucide-react";

type FeedbackKind = "Reclamação" | "Elogio" | "Sugestão";
type FeedbackResponse = { ok?: boolean; protocol?: string; accessCode?: string; error?: string; code?: string };

function publicErrorMessage(payload: FeedbackResponse | null, responseStatus: number) {
  if (payload?.code === "STORAGE_NOT_CONFIGURED") {
    return "O canal de avaliação está temporariamente indisponível. A Prefeitura ainda precisa concluir a configuração do armazenamento seguro deste serviço.";
  }
  if (responseStatus === 429) return payload?.error || "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  return payload?.error || "Não foi possível registrar sua manifestação agora. Tente novamente em alguns instantes.";
}

export default function AvaliarPage() {
  const [kind, setKind] = useState<FeedbackKind>("Reclamação");
  const [rating, setRating] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploadWarning, setUploadWarning] = useState("");
  const [protocol, setProtocol] = useState("");
  const [accessCode, setAccessCode] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) { setError("Selecione uma avaliação de 1 a 5 estrelas."); return; }
    setBusy(true); setError(""); setUploadWarning("");
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
      if (!response.ok || !payload?.ok || !payload.protocol) throw new Error(publicErrorMessage(payload, response.status));
      setProtocol(payload.protocol);
      setAccessCode(payload.accessCode ?? "");
      const attachments = form.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0).slice(0, 3);
      if (attachments.length && payload.accessCode) {
        let failed = 0;
        for (const file of attachments) {
          const attachmentForm = new FormData();
          attachmentForm.set("protocol", payload.protocol);
          attachmentForm.set("accessCode", payload.accessCode);
          attachmentForm.set("file", file);
          const uploadResponse = await fetch("/api/citizen-feedback-attachment", { method: "POST", body: attachmentForm });
          if (!uploadResponse.ok) failed += 1;
        }
        if (failed) setUploadWarning(`${failed} anexo(s) não puderam ser enviado(s). A manifestação foi registrada normalmente.`);
      }
      formElement.reset();
      setRating(0); setAnonymous(false); setKind("Reclamação");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível registrar sua manifestação.");
    } finally { setBusy(false); }
  }

  return <main className="evaluation-shell">
    <header className="evaluation-topbar">
      <div className="evaluation-brand"><span><Landmark size={21} /></span><div><strong>Prefeitura Conecta</strong><small>Canal do Cidadão</small></div></div>
      <div className="evaluation-top-actions"><Link href="/acompanhar" className="evaluation-track-link">Acompanhar protocolo</Link><Link href="/" className="evaluation-admin-link">Acesso administrativo</Link></div>
    </header>

    <section className="evaluation-hero">
      <div className="evaluation-copy">
        <p className="eyebrow">SUA OPINIÃO CHEGA AO GABINETE</p>
        <h1>Como está sendo sua experiência com a Prefeitura?</h1>
        <p>Faça uma avaliação e registre uma reclamação, elogio ou sugestão. O envio recebe um protocolo e entra diretamente no fluxo de atendimento do Gabinete do Prefeito.</p>
        <div className="evaluation-trust"><ShieldCheck size={18} /><span>Canal seguro • protocolo automático • acompanhamento interno</span></div>
      </div>

      <section className="citizen-front-panel evaluation-form-card" aria-labelledby="citizen-front-title">
        <div className="citizen-front-heading">
          <span><HeartHandshake size={23} /></span>
          <div><p className="eyebrow">AVALIAÇÃO E MANIFESTAÇÃO</p><h2 id="citizen-front-title">Fale direto com o Prefeito</h2><p>Escolha o tipo, dê sua nota e conte o que deseja registrar.</p></div>
        </div>

        {protocol ? <div className="citizen-success">
          <span><CheckCircle2 size={28} /></span><div><strong>Manifestação enviada com sucesso</strong><p>Guarde estes dados para acompanhar o atendimento:</p><div className="citizen-success-credentials"><div><small>Protocolo</small><code>{protocol}</code></div>{accessCode && <div><small>Código de acesso</small><code>{accessCode}</code></div>}</div><small>O registro foi encaminhado ao Gabinete do Prefeito.</small>{uploadWarning && <p className="evaluation-warning">{uploadWarning}</p>}<Link href="/acompanhar" className="citizen-track-cta">Acompanhar manifestação</Link></div>
          <button type="button" onClick={() => { setProtocol(""); setAccessCode(""); }}>Enviar outra manifestação</button>
        </div> : <form className="citizen-public-form" onSubmit={submit}>
          <div className="citizen-kind-grid" role="group" aria-label="Tipo da manifestação">
            {(["Reclamação", "Elogio", "Sugestão"] as FeedbackKind[]).map((item) => <button type="button" key={item} className={kind === item ? "active" : ""} onClick={() => setKind(item)}><MessageSquareText size={15} />{item}</button>)}
          </div>
          <fieldset className="citizen-rating"><legend>Como você avalia a Prefeitura hoje? *</legend><div>{[1,2,3,4,5].map((value) => <button type="button" key={value} className={rating >= value ? "active" : ""} aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`} onClick={() => { setRating(value); setError(""); }}><Star size={24} fill={rating >= value ? "currentColor" : "none"} /></button>)}</div><small>{rating ? `${rating}/5 selecionado` : "Selecione de 1 a 5 estrelas"}</small></fieldset>
          <div className="citizen-public-grid">
            <label className="full"><span>Assunto *</span><input name="subject" maxLength={140} required placeholder="Ex.: coleta de lixo no meu bairro" /></label>
            <label className="full"><span>Conte o que aconteceu ou deixe sua sugestão *</span><textarea name="message" minLength={10} maxLength={4000} required placeholder="Descreva de forma clara para que o Gabinete possa entender e encaminhar corretamente." /></label>
            <label><span>Seu nome</span><input name="name" maxLength={120} disabled={anonymous} placeholder={anonymous ? "Envio anônimo" : "Nome completo"} /></label>
            <label><span>Contato para retorno</span><input name="contact" maxLength={180} disabled={anonymous} placeholder="Telefone ou e-mail (opcional)" /></label>
            <label className="full"><span>Bairro</span><input name="neighborhood" maxLength={100} placeholder="Opcional" /></label>
            <label className="full citizen-attachment-field"><span>Fotos ou documento (opcional)</span><input type="file" name="attachments" multiple accept="image/jpeg,image/png,image/webp,application/pdf" /><small>Até 3 arquivos JPG, PNG, WEBP ou PDF, com no máximo 7 MB cada.</small></label>
            <label className="citizen-check full"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /><span>Quero enviar de forma anônima</span></label>
            <label className="citizen-check full"><input type="checkbox" name="consent" required /><span>Concordo com o tratamento dos dados informados exclusivamente para registro, triagem e resposta desta manifestação.</span></label>
            <label className="citizen-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          {rating === 0 && <p className="citizen-form-hint">A avaliação por estrelas é obrigatória para concluir o envio.</p>}
          {error && <p className="evaluation-error" role="alert">{error}</p>}
          {uploadWarning && <p className="evaluation-warning" role="status">{uploadWarning}</p>}
          <button className="citizen-send" disabled={busy || rating === 0}>{busy ? "Enviando..." : <><Send size={17} /> Enviar avaliação</>}</button>
          <p className="citizen-privacy"><ShieldCheck size={13} /> Dados pessoais não são exibidos publicamente.</p>
        </form>}
      </section>
    </section>
  </main>;
}
