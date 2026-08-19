# Corrigir “armazenamento não configurado” na Vercel

O Prefeitura Conecta usa o Supabase como armazenamento central do sistema. O formulário `/avaliar` só confirma o envio depois que o registro foi realmente gravado.

## Variáveis obrigatórias no projeto da Vercel

Configure, no mínimo:

- `NEXT_PUBLIC_SUPABASE_URL` (ou `SUPABASE_URL`)
- `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`)

Nunca coloque a chave secreta dentro de componentes React, arquivos públicos ou variáveis `NEXT_PUBLIC_*`.

## Onde configurar

1. Abra o projeto na Vercel.
2. Entre em **Settings → Environment Variables**.
3. Cadastre as variáveis acima para Production, Preview e Development conforme sua necessidade.
4. Faça um novo deploy, pois mudanças de variável não alteram deployments antigos.
5. Abra `https://SEU-DOMINIO/avaliar` e envie um teste.
6. Entre no sistema administrativo como Prefeito e acesse **Atendimento ao Cidadão → Direto ao Prefeito**.

Na primeira gravação válida, o backend tenta criar automaticamente o bucket privado `prefeitura-conecta-data` se ele ainda não existir.

## Após configurar o Supabase

Teste também:

1. `/avaliar` — envie uma manifestação e guarde protocolo + código de acesso.
2. `/acompanhar` — consulte o protocolo.
3. No painel do Prefeito, abra **Atendimento ao Cidadão → Direto ao Prefeito** e publique uma resposta.
4. Volte a `/acompanhar`, confira a resposta, conclua o fluxo e registre a avaliação pós-atendimento.
5. Em **Central Integrada → Saúde do sistema**, confirme Supabase, IA, PWA e automações.

A IA é opcional e usa `GROQ_API_KEY`. Os backups/relatórios agendados usam `CRON_SECRET`.
