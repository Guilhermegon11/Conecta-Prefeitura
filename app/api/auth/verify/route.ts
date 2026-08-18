import { checkSmsVerification, clearPendingTwoFactorCookie, createSessionToken, hasPendingTwoFactor, sessionCookie } from "../../../auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!hasPendingTwoFactor(request)) return Response.json({ error: "A verificação expirou. Faça o login novamente." }, { status: 401 });
    const body = await request.json() as { code?: unknown };
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    if (code.length < 4 || code.length > 10) return Response.json({ error: "Informe o código recebido por SMS." }, { status: 400 });
    const approved = await checkSmsVerification(code);
    if (!approved) return Response.json({ error: "Código inválido ou expirado." }, { status: 401 });
    const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    headers.append("set-cookie", sessionCookie(createSessionToken("admin")));
    headers.append("set-cookie", clearPendingTwoFactorCookie());
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao validar o código." }, { status: 500 });
  }
}
