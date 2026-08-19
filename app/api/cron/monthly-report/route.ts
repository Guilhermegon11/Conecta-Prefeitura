import { generatePeriodicMunicipalReport } from "../../../municipal-periodic-report.server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
function authorized(request: Request) { const secret = process.env.CRON_SECRET; return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`); }
export async function GET(request: Request) { if (!authorized(request)) return Response.json({ error: "Cron não autorizado." }, { status: 401 }); try { return Response.json({ ok: true, ...(await generatePeriodicMunicipalReport("monthly")) }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha no relatório mensal." }, { status: 503 }); } }
