# Alterações — 18/08/2026

## Interface
- Hora atual exibida ao lado do dia e da data, usando o fuso `America/Sao_Paulo`.
- Saudação dinâmica:
  - 05:00–11:59: `Bom dia`
  - 12:00–17:59: `Boa tarde`
  - 18:00–04:59: `Boa noite`
- Botão de saída adicionado ao topo.

## Persistência
- Gravação do estado principal iniciada imediatamente, sem o atraso de 650 ms.
- `fetch` de persistência usa `keepalive`, reduzindo perda de dados durante atualização da página.
- Cache local de contingência passou a ser atualizado em toda gravação.
- Chamados, mensagens e demais estados principais podem ser restaurados do cache local quando o Supabase estiver temporariamente indisponível.
- Gravações da mesma chave são serializadas para impedir que uma requisição antiga sobrescreva um estado mais novo.

## Login de teste
- Tela de login adicionada.
- Credenciais padrão: `admin` / `admin`.
- Sessão armazenada em cookie `HttpOnly`, com validade padrão de 8 horas.
- Botão `Sair` invalida a sessão.

## 2FA por SMS
O projeto está preparado para usar Twilio Verify. Configure na Vercel:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `TEST_ADMIN_PHONE_E164`

Também configure:
- `AUTH_SESSION_SECRET`
- `TEST_ADMIN_USERNAME`
- `TEST_ADMIN_PASSWORD`

Quando a Twilio estiver configurada, cada novo login após a senha dispara um novo código SMS e o painel só é liberado depois da validação.

## Observação de produção
`admin/admin` existe apenas para teste. Antes de uso real, altere as credenciais e o segredo de sessão. Para múltiplos funcionários, a etapa seguinte recomendada é migrar a autenticação principal para contas individuais do Supabase Auth.
