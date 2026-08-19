export type MunicipalAiUrgency = "Baixa" | "Normal" | "Alta" | "Crítica";

export type MunicipalAiAnalysis = {
  summary: string;
  category: string;
  suggestedDepartment: string;
  urgency: MunicipalAiUrgency;
  urgencyReason: string;
  tags: string[];
  issueKey: string;
  recommendedAction: string;
  source: "openai" | "regras";
};

const DEPARTMENT_RULES: Array<{ department: string; category: string; words: string[] }> = [
  { department: "Secretaria de Infraestrutura e Transporte", category: "Infraestrutura", words: ["buraco", "asfalto", "pavimenta", "poste", "lâmpada", "lampada", "iluminação", "iluminacao", "rua", "ponte", "drenagem", "alag", "transporte", "ônibus", "onibus", "estrada"] },
  { department: "Secretaria de Saúde", category: "Saúde", words: ["saúde", "saude", "ubs", "posto", "médico", "medico", "remédio", "remedio", "medicamento", "vacina", "consulta", "ambulância", "ambulancia"] },
  { department: "Secretaria de Educação", category: "Educação", words: ["escola", "creche", "aluno", "professor", "matrícula", "matricula", "merenda", "educação", "educacao", "transporte escolar"] },
  { department: "Secretaria de Desenvolvimento Social", category: "Assistência Social", words: ["assistência", "assistencia", "cras", "creas", "benefício", "beneficio", "vulnerável", "vulneravel", "família", "familia"] },
  { department: "Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente", category: "Meio Ambiente", words: ["lixo", "entulho", "coleta", "árvore", "arvore", "meio ambiente", "animal", "descarte", "queimada", "poluição", "poluicao"] },
  { department: "Secretaria de Cultura e Turismo", category: "Cultura e Turismo", words: ["cultura", "turismo", "patrimônio histórico", "patrimonio historico", "evento cultural", "museu"] },
  { department: "Secretaria de Comunicação e Eventos", category: "Comunicação e Eventos", words: ["evento", "divulgação", "divulgacao", "comunicação", "comunicacao", "cerimonial"] },
  { department: "Secretaria de Administração e Finanças", category: "Administração e Finanças", words: ["imposto", "iptu", "taxa", "alvará", "alvara", "pagamento", "licitação", "licitacao", "contrato", "financeiro"] },
];

const CRITICAL_WORDS = ["risco de morte", "desabamento", "fio energizado", "poste energizado", "explosão", "explosao", "incêndio", "incendio", "acidente grave", "sangramento", "sem ambulância", "sem ambulancia"];
const HIGH_WORDS = ["alagamento", "vazamento", "acidente", "falta de medicamento", "sem remédio", "sem remedio", "idoso", "criança", "crianca", "deficiente", "ameaça", "ameaca", "urgente", "perigo"];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function containsTerm(text: string, rawTerm: string) {
  const term = normalize(rawTerm);
  if (!term) return false;
  if (["pavimenta", "alag"].includes(term)) return text.split(" ").some((token) => token.startsWith(term));
  return ` ${text} `.includes(` ${term} `);
}

function compactSummary(subject: string, message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean) return subject.trim().slice(0, 220);
  const first = clean.split(/(?<=[.!?])\s+/)[0] || clean;
  const combined = subject.trim() && !normalize(first).includes(normalize(subject)) ? `${subject.trim()}: ${first}` : first;
  return combined.slice(0, 320);
}

export function hasMunicipalAiConfig() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function heuristicMunicipalAnalysis(subject: string, message: string, neighborhood = ""): MunicipalAiAnalysis {
  const text = normalize(`${subject} ${message} ${neighborhood}`);
  const matched = DEPARTMENT_RULES
    .map((rule) => ({ ...rule, score: rule.words.filter((word) => containsTerm(text, word)).length }))
    .sort((a, b) => b.score - a.score)[0];
  const category = matched?.score ? matched.category : "Atendimento geral";
  const suggestedDepartment = matched?.score ? matched.department : "Gabinete do Prefeito";

  let urgency: MunicipalAiUrgency = "Normal";
  let urgencyReason = "Não foram identificados sinais claros de risco imediato.";
  const critical = CRITICAL_WORDS.find((word) => containsTerm(text, word));
  const high = HIGH_WORDS.find((word) => containsTerm(text, word));
  if (critical) { urgency = "Crítica"; urgencyReason = `Expressão de risco detectada: “${critical}”. Requer triagem humana imediata.`; }
  else if (high) { urgency = "Alta"; urgencyReason = `Possível situação prioritária identificada por “${high}”. Recomenda-se validação rápida.`; }
  else if (/elogio|agrade|paraben/.test(text)) { urgency = "Baixa"; urgencyReason = "O conteúdo aparenta ser elogio ou agradecimento, sem risco operacional."; }

  const candidateTags = [
    ...DEPARTMENT_RULES.flatMap((rule) => rule.words.filter((word) => containsTerm(text, word)).slice(0, 4)),
    neighborhood ? `bairro:${neighborhood}` : "",
    urgency === "Crítica" ? "prioridade-crítica" : urgency === "Alta" ? "prioridade-alta" : "",
  ].filter(Boolean);
  const tags = Array.from(new Set(candidateTags.map((item) => item.toLowerCase()))).slice(0, 8);
  const issueKey = [category, neighborhood || "sem-bairro", tags.find((tag) => !tag.startsWith("bairro:")) || subject].map(normalize).filter(Boolean).join("|").slice(0, 180);
  return {
    summary: compactSummary(subject, message), category, suggestedDepartment, urgency, urgencyReason, tags, issueKey,
    recommendedAction: urgency === "Crítica" ? "Validar imediatamente, acionar o setor responsável e registrar a providência no protocolo." : urgency === "Alta" ? "Priorizar a triagem e encaminhar ao setor sugerido com prazo reduzido." : `Encaminhar para ${suggestedDepartment} e acompanhar dentro do SLA definido.`,
    source: "regras",
  };
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const body = payload as { output_text?: unknown; output?: unknown };
  if (typeof body.output_text === "string") return body.output_text;
  if (!Array.isArray(body.output)) return "";
  const parts: string[] = [];
  for (const item of body.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const entry of content) {
      if (!entry || typeof entry !== "object") continue;
      const text = (entry as { text?: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }
  return parts.join("\n").trim();
}

function parseJsonLoose(text: string): Record<string, unknown> | null {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(clean) as Record<string, unknown>; } catch { /* continue */ }
  const start = clean.indexOf("{"); const end = clean.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>; } catch { return null; }
  }
  return null;
}

async function callMunicipalAi(instruction: string, input: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: instruction }] },
        { role: "user", content: [{ type: "input_text", text: input }] },
      ],
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`AI_PROVIDER_${response.status}`);
  return extractResponseText(await response.json());
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 10) : [];
}

export async function analyzeMunicipalDemand(subject: string, message: string, neighborhood = ""): Promise<MunicipalAiAnalysis> {
  const fallback = heuristicMunicipalAnalysis(subject, message, neighborhood);
  if (!hasMunicipalAiConfig()) return fallback;
  try {
    const text = await callMunicipalAi(
      "Você é um classificador operacional de uma prefeitura brasileira. Não tome decisões legais ou médicas. Faça triagem administrativa e devolva SOMENTE JSON válido com: summary, category, suggestedDepartment, urgency (Baixa|Normal|Alta|Crítica), urgencyReason, tags (array), issueKey e recommendedAction. Em situações de risco, apenas sinalize prioridade para revisão humana. Use os nomes de secretarias fornecidos quando possível.",
      `Assunto: ${subject}\nBairro: ${neighborhood || "não informado"}\nRelato: ${message}\n\nSecretarias válidas: ${DEPARTMENT_RULES.map((item) => item.department).join("; ")}; Gabinete do Prefeito.`,
    );
    const parsed = text ? parseJsonLoose(text) : null;
    if (!parsed) return fallback;
    const urgency = ["Baixa", "Normal", "Alta", "Crítica"].includes(String(parsed.urgency)) ? String(parsed.urgency) as MunicipalAiUrgency : fallback.urgency;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 600) : fallback.summary,
      category: typeof parsed.category === "string" ? parsed.category.slice(0, 120) : fallback.category,
      suggestedDepartment: typeof parsed.suggestedDepartment === "string" ? parsed.suggestedDepartment.slice(0, 180) : fallback.suggestedDepartment,
      urgency,
      urgencyReason: typeof parsed.urgencyReason === "string" ? parsed.urgencyReason.slice(0, 500) : fallback.urgencyReason,
      tags: asStringArray(parsed.tags).length ? asStringArray(parsed.tags) : fallback.tags,
      issueKey: typeof parsed.issueKey === "string" ? normalize(parsed.issueKey).slice(0, 180) : fallback.issueKey,
      recommendedAction: typeof parsed.recommendedAction === "string" ? parsed.recommendedAction.slice(0, 650) : fallback.recommendedAction,
      source: "openai",
    };
  } catch {
    return fallback;
  }
}

export async function summarizeMunicipalText(text: string) {
  const trimmed = text.trim().slice(0, 12000);
  if (!trimmed) return { text: "", source: "regras" as const };
  if (!hasMunicipalAiConfig()) return { text: compactSummary("", trimmed), source: "regras" as const };
  try {
    const result = await callMunicipalAi("Resuma o texto administrativo em português do Brasil em até 5 bullets objetivos, sem inventar fatos, destacando providências, responsáveis, prazo e risco quando existirem.", trimmed);
    return { text: result?.slice(0, 3500) || compactSummary("", trimmed), source: result ? "openai" as const : "regras" as const };
  } catch { return { text: compactSummary("", trimmed), source: "regras" as const }; }
}

export async function generateMunicipalWeeklyReport(input: unknown) {
  const serialized = JSON.stringify(input).slice(0, 24000);
  const fallback = "Resumo gerencial gerado em modo de contingência. Revise os indicadores de demandas abertas, atrasadas, concluídas e prioridades críticas exibidos no painel antes da reunião de gestão.";
  if (!hasMunicipalAiConfig()) return { text: fallback, source: "regras" as const };
  try {
    const result = await callMunicipalAi("Você é um analista de gestão municipal. Gere um resumo executivo semanal em português do Brasil, conciso e acionável. Estruture em: Visão geral; O que melhorou; Pontos de atenção; Secretarias/áreas que exigem acompanhamento; Próximas ações. Não invente números ausentes e não faça inferências pessoais sobre cidadãos.", serialized);
    return { text: result?.slice(0, 6000) || fallback, source: result ? "openai" as const : "regras" as const };
  } catch { return { text: fallback, source: "regras" as const }; }
}
