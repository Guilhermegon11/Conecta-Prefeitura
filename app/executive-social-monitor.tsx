"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Hash,
  LoaderCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "./site-icons";
import { usePersistentState } from "./persistence";

type MonitorTone = "positivo" | "neutro" | "negativo";
type MonitorSource = "mention" | "comment" | "hashtag";

type MonitorItem = {
  id: string;
  source: MonitorSource;
  sourceLabel: string;
  author: string;
  text: string;
  permalink: string;
  timestamp: string;
  matchedKeywords: string[];
  tone: MonitorTone;
  needsAttention: boolean;
  engagement: number;
};

type MonitorPayload = {
  ok: boolean;
  configured: boolean;
  updatedAt: string;
  message?: string;
  keywords: string[];
  hashtags: string[];
  items: MonitorItem[];
  summary: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    needsAttention: number;
    engagement: number;
  };
  sources: Array<{ id: string; label: string; status: "connected" | "pending" | "error"; detail: string }>;
};

const DEFAULT_KEYWORDS = [
  "Prefeitura Várzea da Palma",
  "Prefeitura de Várzea da Palma",
  "Rodrigo Dalla",
  "Rodrigo Aguiar Dalla Bernardina",
  "Jaime DS",
  "Jaime de Souza",
];

const EMPTY_PAYLOAD: MonitorPayload = {
  ok: true,
  configured: false,
  updatedAt: "",
  keywords: DEFAULT_KEYWORDS,
  hashtags: [],
  items: [],
  summary: { total: 0, positive: 0, neutral: 0, negative: 0, needsAttention: 0, engagement: 0 },
  sources: [],
};

function formatMonitorDate(value: string) {
  if (!value) return "Ainda não atualizado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function toneLabel(tone: MonitorTone) {
  if (tone === "positivo") return "Positivo";
  if (tone === "negativo") return "Atenção";
  return "Neutro";
}

function sourceIcon(source: MonitorSource) {
  if (source === "hashtag") return Hash;
  if (source === "comment") return MessageSquare;
  return BellRing;
}

export function ExecutiveSocialMonitor({ profileId, profileName }: { profileId: string; profileName: string }) {
  const [keywords, setKeywords, keywordsSaveStatus] = usePersistentState<string[]>("executive:social-monitor:keywords:v1", DEFAULT_KEYWORDS);
  const [payload, setPayload] = useState<MonitorPayload>(EMPTY_PAYLOAD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | MonitorTone | "atencao">("todos");
  const [newKeyword, setNewKeyword] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ profile: profileId });
      keywords.slice(0, 20).forEach((keyword) => params.append("keyword", keyword));
      const response = await fetch(`/api/executive-social-monitor?${params.toString()}`, { cache: "no-store" });
      const data = await response.json().catch(() => null) as MonitorPayload | { error?: string } | null;
      if (!response.ok || !data || !("items" in data)) throw new Error(data && "error" in data ? data.error : "Não foi possível atualizar o monitoramento.");
      setPayload(data);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Falha ao consultar o monitoramento.");
    } finally {
      setLoading(false);
    }
  }, [keywords, profileId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return payload.items.filter((item) => {
      const matchesFilter = filter === "todos" || (filter === "atencao" ? item.needsAttention : item.tone === filter);
      const matchesQuery = !normalizedQuery || `${item.author} ${item.text} ${item.matchedKeywords.join(" ")}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, payload.items, query]);

  function addKeyword(event: FormEvent) {
    event.preventDefault();
    const value = newKeyword.trim().replace(/\s+/g, " ").slice(0, 70);
    if (!value || keywords.some((keyword) => keyword.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR"))) return;
    setKeywords((current) => [...current, value].slice(0, 20));
    setNewKeyword("");
  }

  return <section className="executive-social-monitor">
    <article className="social-monitor-hero">
      <span className="social-monitor-hero-icon"><Activity size={27} /></span>
      <div><p className="eyebrow">INTELIGÊNCIA DE IMAGEM PÚBLICA · ACESSO RESTRITO</p><h2>Radar do Instagram</h2><p>Acompanhe menções, comentários e hashtags relacionados à Prefeitura, ao Prefeito e ao Vice-Prefeito em uma única visão executiva.</p></div>
      <div className="social-monitor-security"><ShieldCheck size={16}/><span><strong>Somente Prefeito e Vice</strong><small>{profileName} · consulta executiva</small></span></div>
    </article>

    <div className="social-monitor-kpis">
      <article className="panel"><span><BarChart3 size={20}/></span><div><small>OCORRÊNCIAS</small><strong>{payload.summary.total}</strong><p>Itens coletados nas fontes permitidas</p></div></article>
      <article className="panel attention"><span><AlertTriangle size={20}/></span><div><small>EXIGEM ATENÇÃO</small><strong>{payload.summary.needsAttention}</strong><p>Críticas ou termos de urgência</p></div></article>
      <article className="panel positive"><span><CheckCircle2 size={20}/></span><div><small>POSITIVAS</small><strong>{payload.summary.positive}</strong><p>Reconhecimentos e avaliações favoráveis</p></div></article>
      <article className="panel"><span><MessageSquare size={20}/></span><div><small>INTERAÇÕES</small><strong>{payload.summary.engagement}</strong><p>Curtidas e comentários disponíveis</p></div></article>
    </div>

    {!payload.configured && <article className="social-monitor-setup panel">
      <span><BellRing size={23}/></span><div><p className="eyebrow">INTEGRAÇÃO AGUARDANDO CONFIGURAÇÃO</p><h3>Conecte a conta profissional da Prefeitura</h3><p>A tela está pronta. Para receber dados reais, configure a conta Business/Creator, o aplicativo da Meta, o identificador da conta e o token de acesso no servidor.</p></div><i>Sem dados simulados</i>
    </article>}

    <div className="social-monitor-layout">
      <div className="social-monitor-main">
        <article className="panel social-monitor-toolbar">
          <label><Search size={16}/><input aria-label="Buscar no monitoramento" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pessoa, frase ou assunto..."/></label>
          <nav aria-label="Filtrar sentimento">{([['todos','Todos'],['atencao','Atenção'],['positivo','Positivos'],['neutro','Neutros'],['negativo','Críticas']] as const).map(([value,label]) => <button type="button" className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{label}</button>)}</nav>
          <button type="button" className="social-monitor-refresh" onClick={() => void refresh()} disabled={loading}>{loading ? <LoaderCircle className="spin" size={15}/> : <RefreshCw size={15}/>} Atualizar</button>
        </article>

        {error && <div className="social-monitor-error" role="alert"><AlertTriangle size={16}/>{error}</div>}

        <div className="social-monitor-feed" aria-live="polite">
          {visibleItems.map((item) => { const SourceIcon = sourceIcon(item.source); return <article className={`panel social-monitor-item tone-${item.tone}`} key={item.id}>
            <header><span className="social-monitor-source-icon"><SourceIcon size={17}/></span><div><strong>{item.author}</strong><small>{item.sourceLabel} · {formatMonitorDate(item.timestamp)}</small></div><i className={`social-monitor-tone ${item.tone}`}>{toneLabel(item.tone)}</i></header>
            <p>{item.text || "Publicação sem legenda disponível pela API."}</p>
            <footer><div>{item.matchedKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>{item.permalink && <a href={item.permalink} target="_blank" rel="noreferrer">Abrir no Instagram <ExternalLink size={13}/></a>}</footer>
          </article>; })}
          {!loading && payload.configured && !visibleItems.length && <div className="panel social-monitor-empty"><Search size={24}/><strong>Nenhuma ocorrência encontrada</strong><p>Não há itens que correspondam aos filtros e às palavras monitoradas neste momento.</p></div>}
          {loading && <div className="panel social-monitor-empty"><LoaderCircle className="spin" size={24}/><strong>Atualizando o radar</strong><p>Consultando as fontes oficiais configuradas.</p></div>}
        </div>
      </div>

      <aside className="social-monitor-side">
        <article className="panel social-monitor-keywords">
          <header><div><p className="eyebrow">PALAVRAS MONITORADAS</p><h3>Termos de interesse</h3></div><small className={keywordsSaveStatus}>{keywordsSaveStatus === "salvando" ? "Salvando…" : "Salvo"}</small></header>
          <div>{keywords.map((keyword) => <span key={keyword}>{keyword}<button type="button" aria-label={`Remover ${keyword}`} onClick={() => setKeywords((current) => current.filter((item) => item !== keyword))}><X size={12}/></button></span>)}</div>
          <form onSubmit={addKeyword}><input value={newKeyword} onChange={(event) => setNewKeyword(event.target.value)} placeholder="Adicionar palavra ou nome" maxLength={70}/><button aria-label="Adicionar palavra-chave"><Plus size={15}/></button></form>
          <p>Os termos classificam o conteúdo recebido. Hashtags equivalentes são consultadas quando permitido pela Meta.</p>
        </article>

        <article className="panel social-monitor-sources">
          <header><p className="eyebrow">FONTES DO RADAR</p><h3>O que pode ser coletado</h3></header>
          {(payload.sources.length ? payload.sources : [
            { id:"mentions", label:"Marcações ao perfil", status:"pending" as const, detail:"Requer conta profissional conectada" },
            { id:"comments", label:"Comentários nos posts oficiais", status:"pending" as const, detail:"Requer permissão de comentários" },
            { id:"hashtags", label:"Hashtags públicas", status:"pending" as const, detail:"Requer Public Content Access" },
          ]).map((source) => <div key={source.id}><i className={source.status}/><span><strong>{source.label}</strong><small>{source.detail}</small></span></div>)}
          <div className="limited"><i/><span><strong>Frases soltas em toda a rede</strong><small>Exigem um provedor licenciado de social listening</small></span></div>
        </article>

        <article className="social-monitor-note"><ShieldCheck size={16}/><p>O sistema não coleta perfis privados nem usa raspagem não autorizada. Apenas dados disponibilizados pelas integrações oficiais ou por provedor licenciado.</p></article>
      </aside>
    </div>
  </section>;
}
