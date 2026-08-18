import { clearPendingTwoFactorCookie, clearSessionCookie } from "../../../auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  headers.append("set-cookie", clearSessionCookie());
  headers.append("set-cookie", clearPendingTwoFactorCookie());
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
