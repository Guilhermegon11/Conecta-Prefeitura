import { hasValidSession } from "../../auth-session";
import { hasMunicipalAiConfig } from "../../municipal-ai.server";
import { hasSupabaseAdminConfig } from "../../supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  return Response.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    services: {
      session: { ok: true, label: "Sessão administrativa" },
      storage: { ok: hasSupabaseAdminConfig(), label: "Supabase / armazenamento central" },
      ai: { ok: hasMunicipalAiConfig(), label: "Inteligência artificial", model: process.env.OPENAI_MODEL || "gpt-5.6-luna" },
      pwa: { ok: true, label: "PWA e operação resiliente" },
      automations: { ok: Boolean(process.env.CRON_SECRET), label: "Backups e relatório semanal agendados" },
    },
  }, { headers: { "cache-control": "no-store" } });
}
