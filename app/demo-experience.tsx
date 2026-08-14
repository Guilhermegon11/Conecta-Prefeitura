"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  HelpCircle,
  Landmark,
  MapPin,
  Play,
  RefreshCcw,
  Search,
  Settings2,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

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
    // Alguns navegadores bloqueiam áudio antes da primeira interação do usuário.
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

export function DemoBanner({ onStart, onReset }: { onStart: () => void; onReset: () => void }) {
  return <div className="demo-banner" role="status">
    <span className="demo-banner-mark"><Sparkles size={15} /></span>
    <span><strong>Ambiente de demonstração</strong><small>Dados fictícios preparados para apresentação e testes.</small></span>
    <div><button onClick={onReset} title="Restaurar cenário"><RefreshCcw size={14} /><span>Reiniciar</span></button><button className="demo-start" onClick={onStart}><Play size={14} /><span>Apresentação guiada</span></button></div>
  </div>;
}

const TOUR_STEPS = [
  { nav: "Visão geral", icon: Landmark, eyebrow: "VISÃO EXECUTIVA", title: "Comece pelo panorama da gestão", body: "Apresente volumes, prazos e atividades recentes. Os cartões e alertas levam diretamente aos registros que exigem decisão." },
  { nav: "Atendimento ao Cidadão", icon: UserRound, eyebrow: "JORNADA DO CIDADÃO", title: "Registre e acompanhe solicitações", body: "Mostre protocolos, Ouvidoria, e-SIC, Carta de Serviços e satisfação em uma única jornada rastreável." },
  { nav: "Chamados", icon: ClipboardList, eyebrow: "EXECUÇÃO ENTRE SETORES", title: "Transforme a solicitação em trabalho", body: "Demonstre prioridade, responsável, SLA, checklist, encaminhamento e conclusão pelo quadro operacional." },
  { nav: "Área do Setor", icon: MapPin, eyebrow: "OPERAÇÃO ESPECIALIZADA", title: "Cada setor recebe ferramentas próprias", body: "Formulários, mapa, equipes de campo, metas e indicadores mudam conforme a unidade municipal selecionada." },
  { nav: "Configurações", icon: Settings2, eyebrow: "CONTROLE DO SECRETÁRIO", title: "Permissões simples e transparentes", body: "O secretário define o que funcionários podem visualizar, registrar ou alterar e testa o resultado pela troca de perfil." },
  { nav: "Central de Ajuda", icon: HelpCircle, eyebrow: "ADOÇÃO DA PLATAFORMA", title: "Tutoriais dentro do próprio sistema", body: "Finalize mostrando os guias passo a passo, com progresso e orientações para cada fluxo da plataforma." },
] as const;

export function GuidedDemo({ step, onStep, onNavigate, onClose }: { step: number; onStep: (step: number) => void; onNavigate: (nav: string) => void; onClose: () => void }) {
  const item = TOUR_STEPS[step];
  const Icon = item.icon;
  function move(next: number) { onStep(next); onNavigate(TOUR_STEPS[next].nav); }
  return <div className="guided-demo-backdrop" role="presentation">
    <section className="guided-demo" role="dialog" aria-modal="true" aria-labelledby="guided-demo-title">
      <header><span><Sparkles size={16} /> APRESENTAÇÃO GUIADA</span><button onClick={onClose} aria-label="Fechar apresentação"><X size={18} /></button></header>
      <div className="tour-progress" aria-label={`Etapa ${step + 1} de ${TOUR_STEPS.length}`}>{TOUR_STEPS.map((tourStep, index) => <button key={tourStep.nav} className={index <= step ? "active" : ""} onClick={() => move(index)} aria-label={`Ir para etapa ${index + 1}`}><i /></button>)}</div>
      <div className="guided-demo-content"><span className="guided-demo-icon"><Icon size={28} /></span><p className="eyebrow">{item.eyebrow}</p><h2 id="guided-demo-title">{item.title}</h2><p>{item.body}</p><small><Check size={13} /> A tela correspondente já foi aberta ao fundo.</small></div>
      <footer><button className="button secondary" disabled={step === 0} onClick={() => move(step - 1)}>Anterior</button><span>{step + 1} de {TOUR_STEPS.length}</span>{step < TOUR_STEPS.length - 1 ? <button className="button primary" onClick={() => move(step + 1)}>Próxima etapa <ArrowRight size={14} /></button> : <button className="button primary" onClick={onClose}>Concluir apresentação <Check size={14} /></button>}</footer>
    </section>
  </div>;
}

type SearchResult = { id: string; type: string; title: string; detail: string; nav: string; icon: typeof Search };

export function GlobalSearchPanel({
  query,
  tickets,
  users,
  documents,
  events,
  offices,
  onOpen,
  onClose,
}: {
  query: string;
  tickets: Array<{ id: string; protocol: string; title: string; requester: string; department: string }>;
  users: Array<{ id: string; fullName: string; department: string; role: string }>;
  documents: Array<{ id: string; name: string; category: string; ownerName: string }>;
  events: Array<{ id: string; title: string; location: string; department: string }>;
  offices: Array<{ id: string; name: string; head: string; address: string }>;
  onOpen: (nav: string) => void;
  onClose: () => void;
}) {
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return [];
    const includes = (...values: string[]) => values.join(" ").toLocaleLowerCase("pt-BR").includes(term);
    const all: SearchResult[] = [
      ...tickets.filter((item) => includes(item.protocol, item.title, item.requester, item.department)).map((item) => ({ id: item.id, type: "Chamado", title: item.title, detail: `${item.protocol} · ${item.department}`, nav: "Chamados", icon: ClipboardList })),
      ...users.filter((item) => includes(item.fullName, item.department, item.role)).map((item) => ({ id: item.id, type: "Pessoa", title: item.fullName, detail: `${item.department} · ${item.role}`, nav: "Secretarias", icon: UserRound })),
      ...documents.filter((item) => includes(item.name, item.category, item.ownerName)).map((item) => ({ id: item.id, type: "Documento", title: item.name, detail: `${item.category} · ${item.ownerName}`, nav: "Anexos e Arquivos", icon: FileText })),
      ...events.filter((item) => includes(item.title, item.location, item.department)).map((item) => ({ id: item.id, type: "Evento", title: item.title, detail: `${item.location || "Local a definir"} · ${item.department}`, nav: "Próximos Eventos", icon: CalendarDays })),
      ...offices.filter((item) => includes(item.name, item.head, item.address)).map((item) => ({ id: item.id, type: "Unidade", title: item.name, detail: `${item.head} · ${item.address}`, nav: "Secretarias", icon: Building2 })),
    ];
    return all.slice(0, 12);
  }, [documents, events, offices, query, tickets, users]);

  return <div className="global-search-panel" role="dialog" aria-label="Resultados da busca global">
    <header><span><Search size={15} /><strong>Busca em toda a plataforma</strong></span><button onClick={onClose} aria-label="Fechar resultados"><X size={16} /></button></header>
    <div>{results.map((result) => { const Icon = result.icon; return <button key={`${result.type}-${result.id}`} onClick={() => { onOpen(result.nav); onClose(); }}><span><Icon size={17} /></span><span><i>{result.type}</i><strong>{result.title}</strong><small>{result.detail}</small></span><ArrowRight size={14} /></button>; })}
      {!results.length && <div className="global-search-empty"><Search size={24} /><strong>Nenhum resultado encontrado</strong><p>Busque por protocolo, pessoa, documento, evento, setor ou endereço.</p></div>}
    </div>
    <footer><span><kbd>Esc</kbd> fechar</span><span>{results.length} {results.length === 1 ? "resultado" : "resultados"}</span></footer>
  </div>;
}
