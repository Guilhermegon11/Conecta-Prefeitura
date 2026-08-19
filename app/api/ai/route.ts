import { hasValidSession } from "../../auth-session";
import { analyzeMunicipalDemand, generateMunicipalWeeklyReport, hasMunicipalAiConfig, summarizeMunicipalText } from "../../municipal-ai.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max = 12000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export async function POST(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const operation = clean(body.operation, 40);
    if (operation === "analyze") {
      const subject = clean(body.subject, 300); const message = clean(body.message, 12000); const neighborhood = clean(body.neighborhood, 140);
      if (!subject && !message) return Response.json({ error: "Informe um relato para análise." }, { status: 400 });
      return Response.json({ ok: true, configured: hasMunicipalAiConfig(), analysis: await analyzeMunicipalDemand(subject, message, neighborhood) });
    }
    if (operation === "summarize") {
      const text = clean(body.text, 12000);
      if (!text) return Response.json({ error: "Informe o texto para resumir." }, { status: 400 });
      const result = await summarizeMunicipalText(text);
      return Response.json({ ok: true, configured: hasMunicipalAiConfig(), ...result });
    }
    if (operation === "weekly_report") {
      const data = body.data ?? {};
      const result = await generateMunicipalWeeklyReport(data);
      return Response.json({ ok: true, configured: hasMunicipalAiConfig(), ...result });
    }
    return Response.json({ error: "Operação de IA inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao executar a análise inteligente." }, { status: 500 });
  }
}
