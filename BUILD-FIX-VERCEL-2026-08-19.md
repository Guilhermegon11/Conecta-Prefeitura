# Correção de build Vercel — 19/08/2026

Corrigido o erro de TypeScript no componente `app/integrated-platform.tsx` causado pelo retorno de `Response.json()` ser tratado como `unknown` no Next.js 16 / TypeScript estrito.

## Ajuste

A atualização manual de Saúde do Sistema agora valida `response.ok`, converte explicitamente o JSON para `HealthPayload` e só então chama `setHealth`.

Erro anterior:

`Argument of type 'Dispatch<SetStateAction<HealthPayload | null>>' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.`

A correção mantém a mesma API e não exige alteração de banco ou variáveis de ambiente.
