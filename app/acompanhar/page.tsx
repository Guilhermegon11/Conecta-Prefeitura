"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { cacheCitizenTracking, loadCachedCitizenTracking, queueJsonRequest, resolveOfflineCitizenProtocol } from "../offline-sync";
import { ArrowRight, CheckCircle2, Clock3, FileSearch, Landmark, MessageSquareText, Send, ShieldCheck, Star } from "lucide-react";

type Tracking = {
  protocol: string; kind: string; subject: string; neighborhood: string; status: string; forwardedDepartment: string; citizenResponse: string;
  createdAt: string; updatedAt: string; history: Array<{ at: string; action: string; detail: string }>;
  canEvaluateResolution: boolean; resolutionRating: number | null; resolutionNps: number | null; resolutionEvaluatedAt: string | null;
};

function dateTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }

export default function AcompanharPage() {
  const [protocol, setProtocol] = useState(""); const [accessCode, setAccessCode] = useState(""); const [item, setItem] = useState<Tracking | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [rating, setRating] = useState(0); const [nps, setNps] = useState<number | null>(null); const [evaluated, setEvaluated] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setItem(null); setEvaluated(false);
    try {
      let requestedProtocol = protocol.trim().toUpperCase(); let requestedAccessCode = accessCode.trim();
      if (requestedProtocol.startsWith("OFF-")) {
        const receipt = await resolveOfflineCitizenProtocol(requestedProtocol);
        if (!receipt) throw new Error("Não encontrei essa referência offline neste dispositivo.");
        if (receipt.status !== "synced" || !receipt.protocol || !receipt.accessCode) throw new Error("Esta manifestação ainda está aguardando conexão para receber o protocolo oficial.");
        requestedProtocol = receipt.protocol; requestedAccessCode = receipt.accessCode; setProtocol(receipt.protocol); setAccessCode(receipt.accessCode);
      }
      if (!navigator.onLine) {
        const cached = await loadCachedCitizenTracking(requestedProtocol, requestedAccessCode) as Tracking | null;
        if (!cached) throw new Error("Sem internet. Este protocolo ainda não possui uma consulta salva neste dispositivo.");
        setItem(cached); return;
      }
      try {
        const response = await fetch("/api/citizen-tracking", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ protocol: requestedProtocol, accessCode: requestedAccessCode }) });
        const payload = await response.json().catch(() => null) as { feedback?: Tracking; error?: string } | null;
        if (!response.ok || !payload?.feedback) throw new Error(payload?.error || "Não foi possível localizar o protocolo.");
        setItem(payload.feedback); await cacheCitizenTracking(requestedProtocol, requestedAccessCode, payload.feedback);
      } catch (networkError) {
        if (!navigator.onLine || networkError instanceof TypeError) {
          const cached = await loadCachedCitizenTracking(requestedProtocol, requestedAccessCode) as Tracking | null;
          if (!cached) throw new Error("A conexão caiu e não há uma cópia anterior deste protocolo no aparelho.");
          setItem(cached);
        } else throw networkError;
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível consultar o protocolo."); }
    finally { setBusy(false); }
  }


  async function evaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!rating || nps === null) { setError("Selecione a nota da solução e uma nota de 0 a 10."); return; }
    const form = new FormData(event.currentTarget); setBusy(true); setError("");
    const body = { protocol, accessCode, rating, nps, comment: String(form.get("comment") ?? "") };
    try {
      if (!navigator.onLine) {
        await queueJsonRequest("/api/citizen-tracking", "PATCH", body, `Avaliação do protocolo ${protocol}`); setEvaluated(true); setError("Avaliação guardada no aparelho. Ela será enviada automaticamente quando a conexão voltar."); return;
      }
      try {
        const response = await fetch("/api/citizen-tracking", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        const payload = await response.json().catch(() => null) as { feedback?: Tracking; error?: string } | null;
        if (!response.ok || !payload?.feedback) throw new Error(payload?.error || "Não foi possível registrar sua avaliação.");
        setItem(payload.feedback); setEvaluated(true); await cacheCitizenTracking(protocol, accessCode, payload.feedback);
      } catch (networkError) {
        if (!navigator.onLine || networkError instanceof TypeError) { await queueJsonRequest("/api/citizen-tracking", "PATCH", body, `Avaliação do protocolo ${protocol}`); setEvaluated(true); setError("A conexão caiu. A avaliação foi guardada e será sincronizada depois."); }
        else throw networkError;
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível registrar a avaliação."); }
    finally { setBusy(false); }
  }


  return <main className="tracking-shell">
    <header className="evaluation-topbar"><div className="evaluation-brand"><span><Landmark size={21}/></span><div><strong>Prefeitura Conecta</strong><small>Acompanhamento do Cidadão</small></div></div><div className="public-nav-links"><Link href="/avaliar">Nova manifestação</Link><Link href="/">Acesso administrativo</Link></div></header>
    <section className="tracking-hero">
      <div className="tracking-copy"><p className="eyebrow">TRANSPARÊNCIA DO ATENDIMENTO</p><h1>Acompanhe seu protocolo</h1><p>Use o protocolo e o código de acesso recebidos no envio para conferir andamento, encaminhamentos e a resposta oficial da Prefeitura.</p><div><ShieldCheck size={17}/><span>O código de acesso evita que terceiros consultem seu atendimento.</span></div></div>
      <form className="panel tracking-search-card" onSubmit={search}><span className="tracking-card-icon"><FileSearch size={23}/></span><h2>Consultar atendimento</h2><label><span>Protocolo</span><input value={protocol} onChange={(e)=>setProtocol(e.target.value.toUpperCase())} required placeholder="PREF-20260819-ABC123" /></label><label><span>Código de acesso</span><input inputMode="numeric" maxLength={6} value={accessCode} onChange={(e)=>setAccessCode(e.target.value.replace(/\D/g,""))} required placeholder="6 dígitos" /></label>{error&&!item&&<p className="evaluation-error" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy?"Consultando...":<><FileSearch size={15}/> Consultar protocolo</>}</button></form>
    </section>

    {item && <section className="tracking-result">
      <article className="panel tracking-summary"><header><div><p className="eyebrow">{item.kind}</p><h2>{item.subject}</h2><p>{item.protocol}{item.neighborhood?` · ${item.neighborhood}`:""}</p></div><span className={`tracking-status status-${item.status.toLowerCase().replaceAll(" ","-").replace("í","i")}`}>{item.status}</span></header><div className="tracking-facts"><span><Clock3 size={15}/><span><small>Atualizado em</small><strong>{dateTime(item.updatedAt)}</strong></span></span><span><ArrowRight size={15}/><span><small>Setor atual</small><strong>{item.forwardedDepartment||"Gabinete do Prefeito"}</strong></span></span></div>{item.citizenResponse?<div className="citizen-official-response"><MessageSquareText size={18}/><div><strong>Resposta oficial</strong><p>{item.citizenResponse}</p></div></div>:<div className="tracking-waiting"><Clock3 size={17}/><span><strong>Resposta em elaboração</strong><p>Quando houver resposta oficial, ela será exibida aqui.</p></span></div>}</article>
      <article className="panel tracking-timeline"><header><div><p className="eyebrow">LINHA DO TEMPO</p><h2>Histórico do protocolo</h2></div><Clock3 size={18}/></header><ol>{item.history.map((entry,index)=><li key={`${entry.at}-${index}`}><span>{index+1}</span><div><strong>{entry.action}</strong><p>{entry.detail}</p><small>{dateTime(entry.at)}</small></div></li>)}</ol></article>
      {item.canEvaluateResolution && <form className="panel resolution-evaluation" onSubmit={evaluate}><header><div><p className="eyebrow">AVALIAÇÃO PÓS-ATENDIMENTO</p><h2>Como você avalia a solução?</h2><p>Esta nota mede a qualidade da solução, separadamente da avaliação feita no momento do envio.</p></div><Star size={20}/></header><fieldset><legend>Nota da solução *</legend><div className="citizen-rating compact">{[1,2,3,4,5].map(value=><button type="button" key={value} className={rating>=value?"active":""} onClick={()=>setRating(value)} aria-label={`${value} estrelas`}><Star size={23} fill={rating>=value?"currentColor":"none"}/></button>)}</div></fieldset><fieldset><legend>De 0 a 10, quanto você recomendaria o atendimento da Prefeitura? *</legend><div className="nps-scale">{Array.from({length:11},(_,value)=><button type="button" key={value} className={nps===value?"active":""} onClick={()=>setNps(value)}>{value}</button>)}</div></fieldset><label><span>Comentário opcional</span><textarea name="comment" maxLength={1200} placeholder="O que funcionou bem ou poderia melhorar?" /></label>{error&&<p className="evaluation-error" role="alert">{error}</p>}<button className="button primary" disabled={busy||!rating||nps===null}><Send size={15}/> Enviar avaliação da solução</button></form>}
      {(evaluated||item.resolutionEvaluatedAt) && <article className="panel resolution-thanks"><CheckCircle2 size={27}/><div><strong>Obrigado pela avaliação</strong><p>Sua nota pós-atendimento foi registrada e passa a compor os indicadores de qualidade da Prefeitura.</p></div></article>}
    </section>}
  </main>;
}
