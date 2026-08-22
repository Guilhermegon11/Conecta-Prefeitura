import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "prefeitura_test_session";
export const PENDING_2FA_COOKIE = "prefeitura_2fa_pending";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const PENDING_2FA_TTL_SECONDS = 10 * 60;

type SessionPayload = { user: string; exp: number };

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || "prefeitura-conecta-test-secret-change-in-production";
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", sessionSecret()).update(encodedPayload).digest("base64url");
}

export function createSessionToken(user = "admin") {
  const payload: SessionPayload = { user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = sign(encodedPayload);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(decode(encodedPayload)) as SessionPayload;
    if (!payload.user || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(request: Request) {
  const raw = request.headers.get("cookie") || "";
  return Object.fromEntries(raw.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return [part, ""];
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function sessionForRequest(request: Request) {
  if (process.env.TEST_AUTH_ENABLED === "false") {
    return { user: "development", exp: Number.MAX_SAFE_INTEGER } satisfies SessionPayload;
  }
  return verifySessionToken(parseCookies(request)[SESSION_COOKIE]);
}

export function hasValidSession(request: Request) {
  return Boolean(sessionForRequest(request));
}

export function hasPendingTwoFactor(request: Request) {
  return parseCookies(request)[PENDING_2FA_COOKIE] === "1";
}

export function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function pendingTwoFactorCookie() {
  return `${PENDING_2FA_COOKIE}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${PENDING_2FA_TTL_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearPendingTwoFactorCookie() {
  return `${PENDING_2FA_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function testCredentials() {
  return {
    username: process.env.TEST_ADMIN_USERNAME || "admin",
    password: process.env.TEST_ADMIN_PASSWORD || "admin",
  };
}

export function twilioVerifyConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const phone = process.env.TEST_ADMIN_PHONE_E164;
  const authUsername = apiKey || accountSid;
  const authPassword = apiSecret || authToken;
  return authUsername && authPassword && serviceSid && phone ? { authUsername, authPassword, serviceSid, phone } : null;
}

function twilioHeaders(username: string, password: string) {
  return {
    authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    "content-type": "application/x-www-form-urlencoded",
  };
}

export async function sendSmsVerification() {
  const config = twilioVerifyConfig();
  if (!config) return { configured: false as const };
  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(config.serviceSid)}/Verifications`, {
    method: "POST",
    headers: twilioHeaders(config.authUsername, config.authPassword),
    body: new URLSearchParams({ To: config.phone, Channel: "sms" }).toString(),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Não foi possível enviar o código SMS. ${detail}`.trim());
  }
  return { configured: true as const, phone: config.phone };
}

export async function checkSmsVerification(code: string) {
  const config = twilioVerifyConfig();
  if (!config) return false;
  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(config.serviceSid)}/VerificationCheck`, {
    method: "POST",
    headers: twilioHeaders(config.authUsername, config.authPassword),
    body: new URLSearchParams({ To: config.phone, Code: code }).toString(),
    cache: "no-store",
  });
  if (!response.ok) return false;
  const payload = await response.json().catch(() => null) as { status?: string } | null;
  return payload?.status === "approved";
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "telefone cadastrado";
  return `+${digits.slice(0, 2)} ••••• ••${digits.slice(-2)}`;
}
