"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, CircleAlert, ExternalLink, Newspaper, RefreshCw, Rss, Search, ShieldCheck, Sparkles } from "./site-icons";
import { openMunicipalAi } from "./municipal-ai-copilot";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  url: string;
};

type NewsPayload = {
  ok: boolean;
  source: "rss" | "verified-fallback";
  cached: boolean;
  fetchedAt: string;
  officialPortalUrl: string;
  officialNewsUrl: string;
  items: NewsItem[];
};

const OFFICIAL_NEWS_URL = "https://www.varzeadapalma.mg.gov.br/portal/noticias/";

function formatNewsDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(value));
  } catch {
    return "Data não informada";
  }
}

function formatRefreshTime(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value));
  } catch {
    return "agora";
  }
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function PrefeituraNewsSection() {
  const [payload, setPayload] = useState<NewsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");

  const loadNews = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/prefeitura-news${manual ? `?refresh=${Date.now()}` : ""}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as NewsPayload | { error?: string } | null;
      if (!response.ok || !result || !("items" in result)) throw new Error(result && "error" in result ? result.error : "Não foi possível carregar as notícias.");
      setPayload(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as notícias.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadNews(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNews]);

  const categories = useMemo(() => ["Todas", ...Array.from(new Set((payload?.items ?? []).map((item) => item.category))).sort((a, b) => a.localeCompare(b, "pt-BR"))], [payload]);
  const filteredItems = useMemo(() => {
    const term = normalize(query.trim());
    return (payload?.items ?? []).filter((item) => {
      const inCategory = category === "Todas" || item.category === category;
      const searchable = normalize(`${item.title} ${item.summary} ${item.category}`);
      return inCategory && (!term || searchable.includes(term));
    });
  }, [category, payload, query]);
  const featured = filteredItems[0];
  const remaining = filteredItems.slice(1);

  function analyzeWithAi() {
    const headlines = filteredItems.slice(0, 8).map((item) => `- ${item.category}: ${item.title}`).join("\n");
    openMunicipalAi(`Analise estas notícias oficiais recentes da Prefeitura de Várzea da Palma.\n\n${headlines}\n\nOrganize a resposta com emojis e uma linha em branco entre cada tópico. Mostre: 1) resumo executivo; 2) impactos para a gestão municipal; 3) setores que devem acompanhar; 4) possíveis ações internas. Não invente fatos além das manchetes e deixe claro o que precisa de leitura da matéria completa.`);
  }

  return <section className="prefeitura-news" aria-label="Últimas Notícias da Prefeitura">
    <div className="news-source-hero">
      <span className="news-source-icon"><Rss size={23}/></span>
      <div>
        <p className="eyebrow">FONTE PÚBLICA OFICIAL</p>
        <h2>Informação municipal em um só lugar</h2>
        <p>Publicações do portal da Prefeitura de Várzea da Palma, organizadas para consulta rápida sem sair do ambiente de trabalho.</p>
        <div className="news-source-badges">
          <span><ShieldCheck size={14}/> Conteúdo oficial</span>
          <span><RefreshCw size={14}/> {payload?.source === "rss" ? "Sincronização por RSS" : "Lista verificada de contingência"}</span>
          <span><Newspaper size={14}/> {payload?.items.length ?? 0} publicações carregadas</span>
        </div>
      </div>
      <div className="news-hero-actions">
        <button type="button" className="button secondary" onClick={() => void loadNews(true)} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? "spinning" : ""}/> {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
        <a className="button primary" href={payload?.officialNewsUrl ?? OFFICIAL_NEWS_URL} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Abrir portal oficial</a>
      </div>
    </div>

    <div className="news-toolbar panel">
      <label className="news-search"><Search size={17}/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar assunto, secretaria ou palavra-chave..."/></label>
      <button type="button" className="news-ai-button" onClick={analyzeWithAi} disabled={!filteredItems.length}><Sparkles size={16}/> Analisar com IA</button>
      <span className="news-refresh-label">{payload ? `Atualizado às ${formatRefreshTime(payload.fetchedAt)}` : "Consultando fonte oficial"}</span>
    </div>

    {!!categories.length && <div className="news-category-row" aria-label="Filtrar notícias por categoria">
      {categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
    </div>}

    {loading && <div className="news-loading-grid" aria-live="polite">
      {[0, 1, 2, 3].map((item) => <span key={item} className="news-skeleton"/>) }
    </div>}

    {!loading && error && !payload && <div className="news-error panel" role="alert">
      <CircleAlert size={24}/><div><strong>Não foi possível atualizar agora</strong><p>{error} Você ainda pode consultar diretamente o portal oficial.</p></div>
      <a className="button secondary" href={OFFICIAL_NEWS_URL} target="_blank" rel="noreferrer">Abrir notícias <ExternalLink size={14}/></a>
    </div>}

    {!loading && !error && featured && <>
      <article className="news-featured panel">
        <div className="news-featured-marker"><Newspaper size={28}/><small>DESTAQUE</small></div>
        <div className="news-featured-copy">
          <div className="news-card-meta"><span>{featured.category}</span><time dateTime={featured.publishedAt}><CalendarDays size={13}/>{formatNewsDate(featured.publishedAt)}</time></div>
          <h2>{featured.title}</h2>
          <p>{featured.summary}</p>
          <a href={featured.url} target="_blank" rel="noreferrer">Ler matéria no portal oficial <ExternalLink size={14}/></a>
        </div>
      </article>

      {!!remaining.length && <div className="news-grid">
        {remaining.map((item) => <article className="news-card panel" key={item.id}>
          <div className="news-card-top"><span className="news-category-mark">{item.category.slice(0, 1).toLocaleUpperCase("pt-BR")}</span><span>{item.category}</span></div>
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <footer>
            <time dateTime={item.publishedAt}><CalendarDays size={13}/>{formatNewsDate(item.publishedAt)}</time>
            <a href={item.url} target="_blank" rel="noreferrer" aria-label={`Ler ${item.title} no portal oficial`}><span>Ler notícia</span><ChevronRight size={15}/></a>
          </footer>
        </article>)}
      </div>}
    </>}

    {!loading && !error && !featured && <div className="news-empty panel"><Search size={24}/><strong>Nenhuma notícia encontrada</strong><p>Tente retirar algum filtro ou buscar outra palavra.</p><button type="button" className="button secondary" onClick={() => { setQuery(""); setCategory("Todas"); }}>Limpar filtros</button></div>}

    {payload && <footer className="news-official-note">
      <ShieldCheck size={16}/><p><strong>Sobre esta área:</strong> as notícias são públicas e iguais para todos os perfis. Chamados, contratos, processos, mensagens e demais dados internos continuam isolados por setor. O texto integral e eventuais correções permanecem sob responsabilidade do portal oficial.</p>
    </footer>}
  </section>;
}
