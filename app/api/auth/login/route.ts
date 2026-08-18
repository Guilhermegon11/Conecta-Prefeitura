import { createSessionToken, maskPhone, pendingTwoFactorCookie, sendSmsVerification, sessionCookie, testCredentials } from "../../../auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (process.env.TEST_AUTH_ENABLED === "false") {
      return Response.json({ ok: true, twoFactorRequired: false, authDisabled: true });
    }
    const body = await request.json() as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const expected = testCredentials();
    if (username !== expected.username || password !== expected.password) {
      return Response.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
    }

    const sms = await sendSmsVerification();
    if (sms.configured) {
      return new Response(JSON.stringify({ ok: true, twoFactorRequired: true, phone: maskPhone(sms.phone) }), {
        status: 200,
        headers: { "content-type": "application/json", "set-cookie": pendingTwoFactorCookie(), "cache-control": "no-store" },
      });
    }

    return new Response(JSON.stringify({ ok: true, twoFactorRequired: false, smsConfigured: false }), {
      status: 200,
      headers: { "content-type": "application/json", "set-cookie": sessionCookie(createSessionToken(username)), "cache-control": "no-store" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao autenticar." }, { status: 500 });
  }
}
