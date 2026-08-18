import { hasValidSession } from "../../../auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json({ authenticated: hasValidSession(request) }, { headers: { "cache-control": "no-store" } });
}
