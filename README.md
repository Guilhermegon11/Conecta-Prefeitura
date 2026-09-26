# Minas Opina — pacote para Vercel

**Comece por [COMECE-AQUI.md](./COMECE-AQUI.md).** O guia explica como enviar o projeto ao GitHub, conectar o banco e publicar na Vercel.

## O que esta versão inclui

- Interface em português, fonte Poppins local e design responsivo em azul, verde e amarelo.
- Candidaturas de Minas Gerais para deputado federal, deputado estadual, Senado e governo; candidaturas nacionais para Presidência.
- Seis escolhas, com dois senadores diferentes, alternativas de branco/nulo/indecisão e revisão antes do envio.
- Painel em `/painel`, com usuário, senha, sessão de oito horas e limitação de tentativas de login.
- Modo de teste com acesso padrão **admin / 1234** e respostas de teste salvas no banco.
- Abas de resultados, respostas salvas, simulação, convites e configuração; filtros de modo e localidade.
- Exportação de arquivo **Excel `.xlsx`**, com abas Respostas, Resumo, Projeção e Sobre.
- Percentuais por opção e simulação para um total hipotético de eleitores informado no painel.
- Convites individuais, persistência remota e restrição única por convite.
- Separação entre respostas de teste e reais. **Respostas de teste nunca entram nos resultados públicos.**

O pacote não inclui respostas de participantes nem credenciais do banco. As contas e a configuração na Vercel e no Turso pertencem ao proprietário.

## Comece em modo de teste

O modo de teste vem habilitado por padrão. Para salvar respostas e entrar no painel, configure `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`. O banco precisa ser compatível com libSQL, com permissão de leitura, escrita e criação de tabelas.

Com o banco conectado, abra `/painel` e entre com usuário `admin` e senha `1234`. Na página inicial, envie uma resposta de teste; ela ficará disponível no painel. O teste não exige preencher os dados da coleta real nem gerar um convite externo antes de responder. Os convites criados enquanto o modo de teste estiver ativo também serão de teste.

Sem banco configurado, a demonstração do formulário continua disponível, mas **não salva respostas**. O painel informa a configuração pendente. O projeto não usa o armazenamento local do navegador nem o disco efêmero da Vercel como banco de participantes.

Se você já configurou `ADMIN_USERNAME` ou `ADMIN_PASSWORD`, esses valores prevalecem sobre os padrões. Para usar exatamente `admin / 1234` em uma instalação existente de teste, ajuste as variáveis na Vercel e faça Redeploy.

## Variáveis de ambiente

| Variável | Modo de teste | Coleta real |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Obrigatória para login e persistência. | Obrigatória. |
| `TURSO_AUTH_TOKEN` | Obrigatória para login e persistência. | Obrigatória. |
| `TEST_MODE` | `true`; também é o padrão quando omitida. | Defina explicitamente `false`. |
| `ADMIN_USERNAME` | Padrão `admin`; pode ser alterado. | Padrão `admin`; pode ser alterado. |
| `ADMIN_PASSWORD` | Padrão `1234`; pode ser alterada. | Obrigatória, com pelo menos 16 caracteres. |
| `SESSION_SECRET` | Opcional: quando omitida, o servidor cria uma chave aleatória e a persiste no Turso. | Obrigatória, aleatória, com pelo menos 32 caracteres. |

Não use prefixo `NEXT_PUBLIC_` nesses nomes. Nunca envie `.env.local`, tokens do Turso ou credenciais reais ao GitHub. O acesso padrão é destinado ao teste solicitado, não à coleta real.

## Resultados, média e projeção

A aba de respostas mostra os registros efetivamente salvos. Os filtros separam teste/coleta real e a resposta a **“Você vota em Várzea da Palma?”**. Registros antigos sem essa pergunta são identificados separadamente, sem inferir uma resposta.

A “média de votos” é apresentada como a **proporção das escolhas recebidas**: quantidade para uma opção dividida pelo total de escolhas da base selecionada. Branco, nulo, indecisão, abstenção de resposta e voto em legenda, quando disponíveis, integram essa base. Não se calcula uma média dos números dos candidatos.

Na simulação, informe um total hipotético de eleitores. O valor inicial de 1.500 é apenas um exemplo inspirado na quantidade de contatos mencionada; não representa o eleitorado de Várzea da Palma ou de Minas Gerais.

- Para os cargos com uma escolha: percentual = votos da opção ÷ respostas; projeção = percentual × total hipotético de eleitores.
- Para Senado: as duas escolhas são reunidas. Percentual = escolhas da opção ÷ (2 × respostas); projeção = percentual × (2 × total hipotético de eleitores).

As quantidades projetadas são aproximadas e podem sofrer diferenças de arredondamento. Essa conta aplica as proporções da base selecionada a outro total: **não é uma previsão eleitoral nem uma estimativa representativa da população**. O sistema não apresenta margem de erro ou nível de confiança para esta amostra de participantes convidados.

A exportação Excel respeita os filtros aplicados e inclui os registros, o resumo, a simulação e notas sobre a base usada. As respostas de teste permanecem identificadas. O CSV de convites continua sendo uma exportação separada.

## Coleta real e divulgação

Para sair do teste, configure `TEST_MODE=false`, uma senha com pelo menos 16 caracteres e `SESSION_SECRET` com pelo menos 32 caracteres; depois faça Redeploy. O comando `pnpm setup:keys` gera credenciais aleatórias no seu computador.

Antes de abrir a coleta real, revise a lista de candidaturas e preencha no painel responsável, contato, registro, metodologia, período de coleta e data de divulgação. O preenchimento do painel não efetua nem valida registro no TSE. A abertura depende dos campos exigidos pelo aplicativo.

Gere convites reais somente após desativar o modo de teste. Cada convite aceita uma resposta. O envio pelo WhatsApp é feito pelo organizador; este projeto não dispara mensagens.

Os resultados públicos dependem do encerramento da coleta, da data cadastrada e da opção de publicação no painel. Registros de teste são excluídos desse cálculo mesmo quando continuam salvos no mesmo banco. Para rodadas independentes, use bancos separados; esta versão não oferece gestão de várias pesquisas reais no mesmo banco.

## Tecnologia e desenvolvimento

Next.js 16.3.6, React, TypeScript e Tailwind. APIs Node.js compatíveis com Vercel. Persistência libSQL/Turso pelo cliente HTTP `@libsql/client/web`. O importador de dados oficiais é Python e usa somente a biblioteca padrão. O projeto independe da hospedagem anterior, de Cloudflare D1 e da autenticação do ChatGPT.

Use Node.js 24 e pnpm 11.25.0. Na pasta do projeto:

```sh
corepack enable
pnpm install --frozen-lockfile
```

Copie `.env.example` para `.env.local` e preencha as duas variáveis do Turso. Use um banco de desenvolvimento separado. Depois:

```sh
pnpm dev
```

Para verificar e executar uma build de produção:

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

As tabelas de `db/schema.ts` são criadas de forma idempotente na primeira conexão. As migrações preservam as respostas anteriores e acrescentam os campos necessários ao modo de teste e à pergunta sobre Várzea da Palma. Respostas anteriores à separação de modos são tratadas como registros reais. O inicializador não apaga nem recria tabelas existentes.

Os testes automatizados exercitam as rotas com SQLite em memória e transporte libSQL simulado. A conexão com Turso real e a publicação na conta Vercel do proprietário dependem das credenciais configuradas por ele; não são realizadas pela extração deste pacote.

## Questionário e candidaturas

A entrada apresenta **“Você vota em Várzea da Palma?”**, com **Sim** e **Não**, sem campo para selecionar município e sem a antiga confirmação de voto em Minas Gerais. Ambas as opções permitem prosseguir. Consentimento versão 1.1.

Os nomes indicados pelo proprietário aparecem no início das listas, na ordem solicitada:

- Federal: Vinicius Diniz, Pedro Braga, Pinheirinho e Nely Aquino.
- Estadual: João do Social, Arlen Santiago e Oscar Teixeira.
- Presidência: Lula, Flávio Bolsonaro, Renan Santos, Escritor Augusto Cury e Ronaldo Caiado.

Os demais nomes permanecem disponíveis na lista e na busca. Os destaques são uma escolha de apresentação do questionário, não uma classificação de popularidade. A configuração está em `data/featured-candidates.json`; os números e partidos vêm da base importada.

A base entregue é uma fotografia dos dados oficiais consultados em 26/09/2026. Não há sincronização automática em segundo plano. A lista exibida exclui renúncias e registros substituídos; demais situações foram preservadas para revisão dos responsáveis.

- `data/candidates.json`: lista exibida.
- `data/candidates-all.json`: registros completos selecionados para os cargos, sem dados pessoais desnecessários.
- `data/candidates.status-review.json`: situações para revisão.
- `data/source.json`: procedência e datas.
- `data/municipalities.json`: municípios de MG.
- `public/candidates`: fotografias públicas de candidatos.

Para baixar uma nova base, antes de abrir a coleta:

```sh
python scripts/import_tse.py --output work/tse --refresh
```

O importador grava arquivos de revisão em `work/tse`; não sobrescreve a lista publicada. Após revisão metodológica, prepare a lista de exibição em `data/candidates.json`, atualize `data/source.json`, municípios e fotos em `public/candidates`, e publique nova versão. O importador preserva todos os registros; revise a política de exibição antes de substituir a lista. Não altere candidaturas no meio de uma rodada de coleta.

## Administração dos dados

A chave do convite é armazenada como SHA-256. Telefones e nomes dos participantes não são solicitados. O organizador pode relacionar cada link à pessoa para quem o enviou; isso não é anonimato absoluto. Os dados públicos são agregados. Backups, solicitações de direitos e eliminação após o prazo de retenção são responsabilidade do organizador; a exclusão automática por prazo não foi implementada.

Mantenha o repositório privado e as credenciais nas variáveis de ambiente. Alterações nas credenciais de acesso e na chave de sessão invalidam sessões existentes após a nova configuração ser aplicada. O limite de login usa um identificador derivado do IP, sem guardar o IP em texto; registros antigos são removidos durante novos acessos.

As fontes, dependências e ativos de terceiros permanecem sujeitos às respectivas licenças. A marca Minas Opina identifica uma pesquisa independente, sem vínculo com o TSE.
