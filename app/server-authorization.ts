import { getRuntimeBindings } from "../db/runtime";

type PayloadLike = { userId?: unknown };

const DEMO_USER_ID = "u-ana";

function productionAuthEnabled() {
  return process.env.PREFEITURA_PRODUCTION_AUTH === "true";
}

export async function resolveActorId(request: Request, payload?: PayloadLike) {
  if (!productionAuthEnabled()) return String(payload?.userId ?? DEMO_USER_ID);

  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (!email) throw new AuthorizationError("Sessão autenticada obrigatória", 401);

  const user = await getRuntimeBindings().DB.prepare(
    "SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND account_status = 'Ativo'",
  ).bind(email).first<{ id: string }>();
  if (!user) throw new AuthorizationError("Usuário autenticado sem acesso ao sistema", 403);
  return user.id;
}

export async function resolveViewerId(request: Request) {
  if (!productionAuthEnabled()) return new URL(request.url).searchParams.get("userId") || DEMO_USER_ID;
  return resolveActorId(request);
}

export class AuthorizationError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
