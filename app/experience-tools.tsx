"use client";

import type { DirectoryRecord, RecordRef } from "./operations-model";
import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, Building2, CalendarDays, ClipboardList, FileText, Search, UserRound, X } from "./site-icons";

export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.72);
    gain.connect(context.destination);
    [659.25, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.13);
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.13);
      oscillator.stop(context.currentTime + 0.42 + index * 0.13);
    });
    window.setTimeout(() => { void context.close(); }, 900);
  } catch {
    // O navegador pode bloquear áudio antes da primeira interação do usuário.
  }
}

export function useNotificationChime(unreadCount: number, enabled: boolean) {
  const previous = useRef(unreadCount);
  const ready = useRef(false);
  useEffect(() => {
    const arm = () => { ready.current = true; };
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => { window.removeEventListener("pointerdown", arm); window.removeEventListener("keydown", arm); };
  }, []);
  useEffect(() => {
    if (enabled && ready.current && unreadCount > previous.current) playNotificationChime();
    previous.current = unreadCount;
  }, [enabled, unreadCount]);
}

type SearchResult = { id: string; type: string; title: string; detail: string; nav: string; icon: typeof Search; record?: RecordRef };

export function GlobalSearchPanel({
  query,
  tickets,
  users,
  documents,
  events,
  offices,
  records = [],
  onOpen,
  onClose,
}: {
  query: string;
  tickets: Array<{ id: string; protocol: string; title: string; requester: string; department: string }>;
  users: Array<{ id: string; fullName: string; department: string; role: string }>;
  documents: Array<{ id: string; name: string; category: string; ownerName: string }>;
  events: Array<{ id: string; title: string; location: string; department: string }>;
  offices: Array<{ id: string; name: string; head: string; address: string }>;
  records?: DirectoryRecord[];
  onOpen: (nav: string, record?: RecordRef) => void;
  onClose: () => void;
}) {
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return [];
    const includes = (...values: string[]) => values.join(" ").toLocaleLowerCase("pt-BR").includes(term);
    const all: SearchResult[] = [
      ...records.filter(item => includes(item.title, item.id)).map(item => ({ id: item.id, type: item.kind === "task" ? "Tarefa" : "Processo", title: item.title, detail: item.department, nav: item.kind === "task" ? "Central Integrada" : "Processos Digitais", icon: FileText, record: { kind: item.kind, id: item.id } })),
      ...tickets.filter((item) => includes(item.protocol, item.title, item.requester, item.department)).map((item) => ({ id: item.id, record: { kind: "ticket" as const, id: item.id }, type: "Chamado", title: item.title, detail: `${item.protocol} · ${item.department}`, nav: "Chamados", icon: ClipboardList })),
      ...users.filter((item) => includes(item.fullName, item.department, item.role)).map((item) => ({ id: item.id, type: "Pessoa", title: item.fullName, detail: `${item.department} · ${item.role}`, nav: "Secretarias", icon: UserRound })),
      ...documents.filter((item) => includes(item.name, item.category, item.ownerName)).map((item) => ({ id: item.id, record: { kind: "document" as const, id: item.id }, type: "Documento", title: item.name, detail: `${item.category} · ${item.ownerName}`, nav: "Anexos e Arquivos", icon: FileText })),
      ...events.filter((item) => includes(item.title, item.location, item.department)).map((item) => ({ id: item.id, record: { kind: "event" as const, id: item.id }, type: "Evento", title: item.title, detail: `${item.location || "Local a definir"} · ${item.department}`, nav: "Próximos Eventos", icon: CalendarDays })),
      ...offices.filter((item) => includes(item.name, item.head, item.address)).map((item) => ({ id: item.id, type: "Unidade", title: item.name, detail: `${item.head} · ${item.address}`, nav: "Secretarias", icon: Building2 })),
      ...[
        { id: "central-tarefas", type: "Módulo", title: "Tarefas e solicitações internas", detail: "Kanban, SLA, responsáveis e escalonamento", nav: "Central Integrada", icon: ClipboardList },
        { id: "central-projetos", type: "Módulo", title: "Projetos e metas", detail: "Progresso, etapas e metas da gestão", nav: "Central Integrada", icon: Building2 },
        { id: "central-mapa", type: "Módulo", title: "Mapa da cidade e locais públicos", detail: "Ocorrências por bairro e histórico dos equipamentos", nav: "Central Integrada", icon: Building2 },
        { id: "central-ia", type: "Módulo", title: "IA Municipal", detail: "Resumo, classificação, urgência e relatório semanal", nav: "Central Integrada", icon: Search },
        { id: "processos", type: "Módulo", title: "Processos e procedimentos oficiais", detail: "Protocolos, documentos e tramitações formais", nav: "Processos Digitais", icon: FileText },
        { id: "comunicacao", type: "Módulo", title: "Conversas e grupos", detail: "Mensagens internas e comunicação da equipe", nav: "Comunicação", icon: UserRound },
        { id: "ajuda", type: "Módulo", title: "Ajuda e orientações", detail: "Descubra onde registrar cada tipo de atividade", nav: "Central de Ajuda", icon: Search },
      ].filter((item) => includes(item.title, item.detail)),
    ];
    return all.slice(0, 12);
  }, [documents, events, offices, query, tickets, users, records]);

  return <div className="global-search-panel" role="dialog" aria-label="Resultados da busca">
    <header><span><Search size={15} /><strong>Busca rápida</strong></span><button onClick={onClose} aria-label="Fechar resultados"><X size={16} /></button></header>
    <div>{results.map((result) => { const Icon = result.icon; return <button key={`${result.type}-${result.id}`} onClick={() => { onOpen(result.nav, result.record); onClose(); }}><span><Icon size={17} /></span><span><i>{result.type}</i><strong>{result.title}</strong><small>{result.detail}</small></span><ArrowRight size={14} /></button>; })}
      {!results.length && <div className="global-search-empty"><Search size={24} /><strong>Nenhum resultado encontrado</strong><p>Busque por protocolo, pessoa, documento, evento, setor ou endereço.</p></div>}
    </div>
    <footer><span><kbd>Esc</kbd> fechar</span><span>{results.length} {results.length === 1 ? "resultado" : "resultados"}</span></footer>
  </div>;
}
