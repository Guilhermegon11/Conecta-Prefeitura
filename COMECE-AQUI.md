# Publique o Minas Opina no seu GitHub e na Vercel

Este pacote contém o site completo adaptado para Vercel: formulário, candidatos, fotos, fonte Poppins, painel com senha, convites individuais e resultados. Você controla as contas do GitHub, da Vercel e do banco de dados.

O site abre em demonstração. A coleta real começa quando você configura o banco, entra no painel e preenche os dados da pesquisa.

## 1. Extraia o ZIP

Descompacte `minas-opina-vercel.zip`. Abra a pasta extraída: ela deve conter `package.json`, `app`, `public`, `data` e este guia.

O GitHub precisa receber os **arquivos extraídos**. Não envie somente o ZIP. O arquivo `package.json` deve ficar na raiz do repositório.

## 2. Coloque o projeto no seu GitHub

Como o projeto inclui muitas fotos de candidatos, use o [GitHub Desktop](https://desktop.github.com/download/) para enviar a pasta inteira.

1. Instale o GitHub Desktop e entre na sua conta.
2. Use **File → New repository** para criar um repositório chamado `minas-opina` em uma pasta nova.
3. Abra essa pasta no seu computador. Copie para dentro dela todo o conteúdo extraído do ZIP, incluindo `.gitignore` e `.env.example`.
4. Volte ao GitHub Desktop. Escreva `Versão inicial do Minas Opina` no resumo e clique em **Commit to main**.
5. Clique em **Publish repository**. Mantenha **Keep this code private** marcado e confirme a publicação.

Não coloque senhas, tokens reais, lista de contatos ou respostas dos participantes no GitHub. O pacote não contém essas informações.

## 3. Crie o banco de dados

1. Entre no [Turso](https://turso.tech/) com sua conta.
2. Crie um banco chamado `minas-opina`, compatível com **libSQL**. Se o painel apresentar escolha de engine, use libSQL para este projeto.
3. Copie a URL do banco, normalmente começando com `libsql://`.
4. Gere um token de acesso com leitura e escrita para esse banco e copie-o.

Guarde esses dois valores. As tabelas são criadas automaticamente no primeiro acesso válido ao banco. Não é necessário executar SQL manualmente.

Os registros ficam no Turso e permanecem disponíveis quando você atualiza o site na Vercel. Esta instalação começa com um banco novo; ela não importa respostas de outro site.

## 4. Importe o GitHub na Vercel

1. Entre em [vercel.com](https://vercel.com/) usando sua conta.
2. Abra **Add New → Project**.
3. Conecte o GitHub e escolha o repositório `minas-opina`.
4. Confira **Framework Preset: Next.js** e **Root Directory: `./`**, correspondente à pasta que contém `package.json`.
5. Use **Node.js 24.x**. Os comandos de instalação e publicação já estão definidos no projeto.
6. Em **Environment Variables**, cadastre os quatro valores abaixo antes de clicar em **Deploy**.

| Nome exato | O que colocar |
| --- | --- |
| `TURSO_DATABASE_URL` | A URL do banco que você criou. |
| `TURSO_AUTH_TOKEN` | O token de leitura e escrita desse banco. |
| `ADMIN_PASSWORD` | Uma senha exclusiva do painel, com pelo menos 16 caracteres. |
| `SESSION_SECRET` | Uma chave aleatória diferente da senha, com pelo menos 32 caracteres. |

Use um gerenciador de senhas para gerar valores aleatórios longos. Não use os nomes dos campos como valores. Não coloque prefixo `NEXT_PUBLIC_` nesses nomes. Cadastre-os para **Production**; se criar ambientes de teste, use outro banco para esses ambientes.

Opcionalmente, com Node.js instalado, abra um terminal na pasta do projeto e rode `node scripts/generate-secrets.mjs`. O comando gera uma senha e uma chave novas no seu computador. Copie cada valor para o campo correspondente na Vercel e guarde-os.

Clique em **Deploy**. Ao terminar, a Vercel fornecerá o endereço do seu site.

Se você alterar qualquer variável depois, faça **Redeploy** para aplicar o novo valor. A Vercel e o Turso podem ter limites e cobranças conforme o plano escolhido; confira-os nas suas contas.

## 5. Entre no painel

Abra o endereço fornecido pela Vercel e acrescente `/painel`.

Exemplo de formato: `https://SEU-PROJETO.vercel.app/painel`.

Entre usando a senha que você definiu em `ADMIN_PASSWORD`. Esta versão usa senha própria; o link de ativação da versão hospedada anteriormente não é utilizado aqui.

Se aparecer “Configure as quatro variáveis”, revise o passo 4 e faça um novo deploy. Para trocar a senha, altere `ADMIN_PASSWORD` na Vercel e faça Redeploy; as sessões anteriores deixam de funcionar.

## 6. Prepare a pesquisa e os convites

1. No painel, abra **Configuração**.
2. Preencha responsável, contato, registro, metodologia, período de coleta e data de divulgação.
3. Confira os dados e a lista de candidaturas antes de abrir a coleta.
4. Quando a pesquisa estiver regularizada, altere a situação para **Aberta para convidados** e salve.
5. Em **Convites**, gere até 1.500 links e baixe o CSV.
6. Distribua um link diferente para cada contato autorizado. Guarde o CSV: os links completos só aparecem nessa geração.
7. Acompanhe as respostas no painel. Cada convite aceita uma única resposta.

A geração de links não faz o envio pelo WhatsApp. O site apresenta pesquisa independente e não utiliza a marca oficial do TSE. Preencher um número de registro no painel não efetua nem valida o registro no TSE.

Para divulgar resultados, encerre a coleta e ative **Publicar resultados agregados**, respeitando a data cadastrada. Os participantes acessam a página `/resultados`; o painel continua protegido por senha.

Antes de distribuir links, abra um deles em uma janela anônima. Caso a proteção de acesso da Vercel peça login aos participantes, ajuste **Settings → Deployment Protection** para permitir acesso público à implantação de produção quando estiver pronto para iniciar. A senha do painel permanece independente dessa configuração.

## 7. Atualizações e domínio

Faça alterações nos arquivos e use o GitHub Desktop para **Commit** e **Push**. Com a integração ativa, a Vercel publica uma nova versão do mesmo repositório.

Você pode começar pelo endereço `.vercel.app` fornecido pela Vercel. Para usar um domínio próprio, adicione-o em **Settings → Domains** e siga a configuração de DNS indicada pela plataforma. Este pacote não registra domínio nem altera a identificação exigida pelos provedores.

## Se encontrar um problema

| Situação | O que conferir |
| --- | --- |
| “No Next.js version detected” | O `package.json` precisa estar na raiz escolhida em Root Directory. |
| Falha ao conectar o banco | Confira URL, token, banco libSQL e se o token continua válido. |
| Painel não aceita a senha | Confira `ADMIN_PASSWORD`, sem espaços extras, e faça Redeploy após alterações. |
| “Muitas tentativas” | Aguarde 15 minutos e tente novamente. |
| O site está em demonstração | Abra a coleta no painel depois de preencher e conferir os dados da pesquisa. |
| Participante vê um login da Vercel | Confira Deployment Protection da implantação de produção. |
| Os resultados não aparecem | Encerre a coleta, aguarde a data e ative a publicação no painel. |

Documentação oficial consultada em 26/09/2026:

- [Vercel com GitHub](https://vercel.com/docs/git/vercel-for-github)
- [Variáveis na Vercel](https://vercel.com/docs/environment-variables)
- [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Turso com Next.js](https://docs.turso.tech/sdk/ts/guides/nextjs)


## Atualização: Várzea da Palma e destaques

Substitua os arquivos da versão anterior pelos arquivos deste ZIP no seu repositório e faça Commit e Push. Mantenha as quatro variáveis já cadastradas na Vercel. Não crie outro banco para aplicar esta atualização.

A pergunta inicial agora é “Você vota em Várzea da Palma?”, com Sim e Não. As duas respostas permitem continuar. O painel passa a filtrar e contar os participantes por essa informação. A atualização do banco é automática e preserva respostas antigas.

Os deputados e presidenciáveis solicitados aparecem primeiro. “João Social” é apresentado como “João do Social” e “Bolsonaro” como “Flávio Bolsonaro”, conforme os nomes da base. Os demais candidatos continuam acessíveis.
