# Prefeitura Conecta — deploy na Vercel com Supabase

## Publicação

1. Envie este projeto para o repositório Git conectado à Vercel.
2. Na Vercel, mantenha o preset **Next.js**.
3. O `vercel.json` já executa `npm install` e `npm run build:vercel`.
4. Confirme que a integração do Supabase está conectada ao mesmo projeto da Vercel.

## Variáveis esperadas

O backend reconhece automaticamente as variáveis fornecidas pela integração do Supabase:

- `SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (disponível pela integração para futuras operações autenticadas no cliente)

A chave administrativa é usada somente em rotas executadas no servidor. Ela não é enviada para componentes do navegador.

## Persistência

O sistema usa o Supabase como armazenamento central persistente. Na primeira gravação, o backend prepara automaticamente um bucket privado chamado `prefeitura-conecta-data` quando ele ainda não existir.

São persistidos, entre outros dados:

- chamados, usuários, mensagens, grupos, documentos, eventos e notificações;
- Processos Digitais e suas movimentações;
- Gestão Municipal;
- Área do Setor, incluindo registros, prioridades, metas, atividades de campo e encaminhamentos;
- configurações, permissões e preferências;
- protocolos de atendimento;
- formulários, automações e regras operacionais.

Arquivos anexados também são armazenados no bucket privado do Supabase.

## Convites de usuários

A criação de funcionário pode enviar convite real pelo Supabase Auth. O envio depende da configuração de e-mail do projeto Supabase e dos limites do provedor configurado.

## Diagnóstico

Se o topo do sistema exibir **Aguardando conexão**, verifique primeiro se a integração do Supabase está ativa e se as variáveis de ambiente acima existem no deployment da Vercel.

Para validar o build no mesmo padrão usado pela Vercel:

```bash
npm install
npm run build:vercel
```

## Login de teste e verificação em duas etapas por SMS

A versão atual inclui uma tela de login de teste. Por padrão:

- usuário: `admin`
- senha: `admin`

Em produção, defina `TEST_ADMIN_USERNAME`, `TEST_ADMIN_PASSWORD` e principalmente `AUTH_SESSION_SECRET` nas variáveis da Vercel.

O fluxo também está preparado para 2FA real por SMS usando **Twilio Verify**. Quando as quatro variáveis abaixo estão preenchidas, toda autenticação por usuário/senha inicia automaticamente um novo desafio SMS; o sistema só abre após a validação do código recebido:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `TEST_ADMIN_PHONE_E164` (formato E.164, por exemplo `+5538999999999`)

Ao clicar em **Sair**, a sessão é removida. No login seguinte, um novo código SMS é solicitado. Se as variáveis da Twilio não estiverem configuradas, o login de teste funciona sem o segundo fator para permitir validação visual do projeto.

Para uma implantação definitiva com vários servidores e funcionários, o recomendado é substituir o login de teste por usuários reais do Supabase Auth e habilitar MFA por telefone para cada conta, mantendo a mesma lógica de exigir o segundo fator após a senha.

## Inteligência artificial municipal

A Central Integrada possui uma camada de IA para:

- resumir relatos longos;
- classificar categoria e sugerir secretaria;
- sinalizar urgência para revisão humana;
- identificar demandas semelhantes;
- gerar resumo executivo semanal.

Configure no servidor:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (opcional; o projeto possui um valor padrão)

A IA é assistiva. O encaminhamento, a prioridade final e qualquer decisão continuam sob responsabilidade de um servidor autorizado. Nome, telefone e e-mail do cidadão não são necessários para a classificação automática do relato. Se a chave de IA não estiver configurada, o sistema continua funcionando com regras locais de contingência.

## Automação de backup e relatório semanal

O `vercel.json` inclui quatro Cron Jobs:

- backup dos dados críticos diariamente às 05:00 UTC;
- relatório executivo diário às 10:00 UTC;
- relatório executivo semanal às segundas-feiras às 09:00 UTC;
- relatório executivo mensal no primeiro dia do mês às 10:00 UTC.

Defina `CRON_SECRET` na Vercel com um valor longo e aleatório. Sem essa variável, as rotas agendadas recusam execução.

O backup inclui estados persistentes, manifestações do cidadão e metadados de arquivos. O resumo semanal é armazenado em `reports/weekly/` no bucket privado e pode ser carregado na aba **Central Integrada → IA Municipal**.

## Rotas públicas do cidadão

- `/avaliar`: nova manifestação, nota inicial e até 3 anexos (JPG, PNG, WEBP ou PDF, 7 MB por arquivo).
- `/acompanhar`: consulta com protocolo + código de acesso, linha do tempo, resposta oficial e avaliação pós-atendimento/NPS quando concluído.

A tela `/` permanece exclusiva para o acesso administrativo.
