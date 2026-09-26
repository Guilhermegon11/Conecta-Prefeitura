# Minas Opina — pacote para Vercel

**Comece por [COMECE-AQUI.md](./COMECE-AQUI.md).** Ele explica como enviar o projeto ao GitHub, conectar o banco e publicar na Vercel.

## Incluído

- Interface em português, fonte Poppins local e design responsivo em azul, verde e amarelo.
- Candidaturas de Minas Gerais para deputado federal, deputado estadual, Senado e governo; candidaturas nacionais para Presidência.
- Seis escolhas, com dois senadores diferentes, alternativas de branco/nulo/indecisão e revisão antes do envio.
- Painel protegido por senha e sessão de oito horas; limitação de tentativas de login.
- Convites individuais, respostas persistidas em banco e restrição única por convite.
- Resultados agregados com publicação controlada e exportação CSV.
- Banco novo na conta do proprietário. O pacote não inclui dados de participantes nem credenciais.

## Tecnologia

Next.js 16.3.6, React, TypeScript e Tailwind. APIs Node.js compatíveis com Vercel. Persistência remota libSQL/Turso pelo cliente HTTP `@libsql/client/web`; nenhuma gravação de dados de participantes no disco efêmero da Vercel. O importador de dados oficiais é Python e usa somente a biblioteca padrão.

O código desta versão é independente da hospedagem anterior. Não depende de Cloudflare D1 nem de autenticação do ChatGPT.

## Desenvolvimento

Use Node.js 24 e pnpm 11.25.0. Na pasta do projeto:

```sh
corepack enable
pnpm install --frozen-lockfile
```

Copie `.env.example` para `.env.local` e preencha os quatro valores. Use um banco de desenvolvimento separado. Depois:

```sh
pnpm dev
```

O comando informa o endereço local. Sem configuração de banco, o formulário funciona em demonstração, sem salvar votos, e o painel informa a configuração pendente.

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

As tabelas de `db/schema.ts` são criadas de forma idempotente na primeira conexão. O token precisa permitir leitura, escrita e criação de tabelas no banco do projeto. Esta versão também acrescenta automaticamente a coluna da pergunta sobre Várzea da Palma nas instalações anteriores. Respostas antigas são preservadas e identificadas como pergunta não respondida, sem inferir Sim/Não a partir do município antigo. Ao alterar o esquema no futuro, prepare uma migração compatível; o inicializador não apaga nem recria tabelas existentes.

## Verificação desta entrega

- Build de produção Next.js concluído, incluindo análise TypeScript.
- Teste HTTP da versão de produção: páginas, fontes locais, base de candidatos, coleta fechada e painel aguardando configuração.
- 48 verificações automatizadas das rotas reais com SQLite em memória e transporte libSQL simulado: sessão assinada, expiração/alteração de credencial, login limitado, origem da requisição, migração do banco, respostas Sim/Não, ordem dos destaques, convite único, escolhas e publicação.
- A conexão com um banco Turso real e a publicação na conta Vercel do proprietário dependem das credenciais que serão configuradas por ele. Não foram realizadas nesta entrega.

## Ajustes do questionário nesta versão

A entrada apresenta **“Você vota em Várzea da Palma?”**, com opções **Sim** e **Não**, sem campo para selecionar município e sem a antiga confirmação de voto em Minas Gerais. Ambas as opções permitem prosseguir e são gravadas separadamente. O painel oferece filtros e contagem por essa resposta; a exportação indica o filtro aplicado. Consentimento versão 1.1.

Os nomes indicados pelo proprietário aparecem no início das listas, na ordem solicitada:

- Federal: Vinicius Diniz, Pedro Braga, Pinheirinho e Nely Aquino.
- Estadual: João do Social, Arlen Santiago e Oscar Teixeira.
- Presidência: Lula, Flávio Bolsonaro, Renan Santos, Escritor Augusto Cury e Ronaldo Caiado.

Os demais nomes permanecem disponíveis na lista e na busca. Os destaques são uma escolha de apresentação do questionário, não uma classificação de popularidade. A configuração está em `data/featured-candidates.json`; os números e partidos continuam vindo da base importada. Governador e Senado mantêm sua apresentação anterior.

## Dados de candidaturas

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

O importador grava arquivos de revisão em `work/tse`; não sobrescreve a lista publicada. Após revisão metodológica, prepare a lista de exibição em `data/candidates.json`, atualize `data/source.json`, municípios e fotos em `public/candidates`, e publique nova versão. O importador preserva todos os registros; não copie cegamente sua lista sem aplicar a política de exibição. Não altere candidaturas no meio de uma rodada de coleta.

## Administração dos dados

A chave do convite é armazenada como SHA-256. Telefones e nomes dos participantes não são solicitados. O organizador pode relacionar cada link à pessoa para quem o enviou; isso não é anonimato absoluto. Os dados públicos são agregados. Backups, solicitações de direitos e eliminação após o prazo de retenção são responsabilidade do organizador; a exclusão automática por prazo não foi implementada.

Mantenha repositório privado, credenciais apenas nas variáveis de ambiente e bancos distintos para produção e testes. Alterar `ADMIN_PASSWORD` ou `SESSION_SECRET` e republicar invalida as sessões existentes. O limite de login usa um identificador derivado do IP, sem guardar o IP em texto; registros antigos são removidos durante novos acessos.

As fontes, dependências e ativos de terceiros permanecem sujeitos às respectivas licenças. A marca Minas Opina identifica uma pesquisa independente, sem vínculo com o TSE.
