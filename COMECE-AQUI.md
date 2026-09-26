# Minas Opina — coloque no ar e teste o painel

O pacote contém formulário, candidatos, fotos, fonte Poppins, painel administrativo, banco, exportação Excel e simulação de votos. Você controla as contas do GitHub, da Vercel e do Turso.

**Acesso de teste:** endereço do site + `/painel`, usuário **admin**, senha **1234**. No modo de teste, você já pode entrar para conhecer o painel sem banco conectado. Para salvar e consultar respostas, gerar convites e exportar planilhas, conecte o banco conforme os passos abaixo. Não basta abrir os arquivos do ZIP no computador.

## Já publicou uma versão anterior?

Substitua os arquivos antigos no seu repositório pelos arquivos extraídos deste ZIP. Preserve o banco atual e as variáveis do Turso. Faça Commit e Push pelo GitHub Desktop.

Na Vercel, em **Settings → Environment Variables**, configure `TEST_MODE=true`, `ADMIN_USERNAME=admin` e `ADMIN_PASSWORD=1234`. Uma senha já cadastrada continua valendo até você substituí-la. Se já existe uma `SESSION_SECRET`, pode mantê-la. Faça **Redeploy** após alterar variáveis.

A atualização acrescenta os campos necessários ao banco automaticamente e preserva as respostas anteriores. Registros antigos ficam na base real; novos testes ficam separados. Depois, siga a seção **Teste o painel e salve respostas** abaixo.

## 1. Extraia o ZIP e envie ao GitHub

Descompacte `minas-opina-vercel.zip`. A pasta extraída deve conter `package.json`, `app`, `public`, `data` e este guia. O GitHub precisa receber os **arquivos extraídos**, e não apenas o ZIP. O `package.json` deve ficar na raiz do repositório.

Como há muitas fotos de candidatos, use o [GitHub Desktop](https://desktop.github.com/download/) para enviar a pasta inteira:

1. Instale o GitHub Desktop e entre na sua conta.
2. Use **File → New repository** para criar um repositório chamado `minas-opina` em uma pasta nova.
3. Abra essa pasta e copie para dentro dela todo o conteúdo extraído do ZIP, incluindo `.gitignore` e `.env.example`.
4. No GitHub Desktop, escreva `Versão inicial do Minas Opina` no resumo e clique em **Commit to main**.
5. Clique em **Publish repository**, mantenha **Keep this code private** marcado e confirme.

Não coloque tokens reais, credenciais de produção, lista de contatos ou respostas dos participantes no GitHub.

## 2. Crie o banco

1. Entre no [Turso](https://turso.tech/) com sua conta.
2. Crie um banco chamado `minas-opina`, compatível com **libSQL**. Se houver uma escolha de engine, use libSQL.
3. Copie a URL do banco, normalmente começando com `libsql://`.
4. Gere um token de leitura e escrita para esse banco e copie-o.

Guarde os dois valores. As tabelas são criadas automaticamente na primeira conexão; o token precisa permitir sua criação. Não é necessário executar SQL manualmente.

Os registros ficam no Turso e continuam disponíveis após atualizações na Vercel. Um banco novo começa vazio; o pacote não importa respostas de outro site.

## 3. Importe o projeto na Vercel

1. Entre em [vercel.com](https://vercel.com/).
2. Abra **Add New → Project**, conecte o GitHub e escolha `minas-opina`.
3. Confira **Framework Preset: Next.js** e **Root Directory: `./`**, correspondente à pasta do `package.json`.
4. Use **Node.js 24.x**. Os comandos de instalação e build já estão definidos no projeto.
5. Em **Environment Variables**, cadastre:

| Nome exato | Valor para este teste |
| --- | --- |
| `TURSO_DATABASE_URL` | URL do seu banco. |
| `TURSO_AUTH_TOKEN` | Token do seu banco. |
| `TEST_MODE` | `true` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `1234` |

Cadastre as variáveis para **Production**, que é o ambiente usado pelo endereço principal da Vercel, mesmo enquanto o aplicativo está em teste. Não use prefixo `NEXT_PUBLIC_`. Se habilitar Preview, prefira outro banco para esse ambiente.

Em modo de teste, `SESSION_SECRET` é opcional: o servidor gera uma chave aleatória e a salva no Turso quando ela não é fornecida. Não é necessário inventar uma chave para começar o teste.

Clique em **Deploy**. Ao terminar, a Vercel fornecerá o endereço do site. Alterações posteriores nas variáveis exigem **Redeploy**. Os serviços podem ter limites e cobranças conforme o plano da sua conta.

## 4. Teste o painel e salve respostas

1. Abra o endereço fornecido pela Vercel e acrescente `/painel`.
2. Entre com usuário **admin** e senha **1234**.
3. Abra a página inicial do site, responda **“Você vota em Várzea da Palma?”** com Sim ou Não e complete as escolhas.
4. Revise e envie a resposta de teste. Nesse modo, não é necessário gerar um convite externo antes de responder.
5. Volte ao painel e atualize os dados. Confira o registro na aba **Respostas** e os totais em **Resultados**.
6. Feche e reabra o painel para conferir que a resposta permanece salva no banco.

O modo de teste aparece identificado. As respostas salvas nele são separadas das reais e **não são publicadas na página de resultados públicos**. Os convites da base de testes aceitam uma resposta por link. Enquanto TEST_MODE=true, o envio por convites reais fica pausado; eles voltam a funcionar quando você ativa o modo real.

Sem as duas variáveis do Turso, o formulário oferece uma demonstração sem gravação. O login admin / 1234 abre uma prévia do painel, com telas vazias e instruções para conectar o banco. Essa prévia não grava dados, não gera convites, não exporta respostas e não cria uma sessão administrativa de acesso ao banco. Ao atualizar a página, entre novamente. Depois de conectar o Turso e fazer Redeploy, entre para usar o painel completo.

### Excel e simulação

Use os filtros do painel para escolher a base de teste ou real e a resposta sobre Várzea da Palma. Os registros antigos sem essa pergunta aparecem identificados separadamente.

O botão de exportação gera um arquivo **`.xlsx`** que abre no Excel. Ele contém quatro abas:

| Aba | Conteúdo |
| --- | --- |
| Respostas | Registros salvos na base selecionada e suas escolhas. |
| Resumo | Contagens e percentuais das opções. |
| Projeção | Simulação para o total hipotético informado no painel. |
| Sobre | Filtros, base usada e explicação dos cálculos. |

Em **Simulação**, informe para quantos eleitores hipotéticos deseja aplicar as proporções recebidas. O valor inicial de 1.500 é um exemplo baseado na quantidade de contatos mencionada; não é o eleitorado oficial.

Exemplo: 20 escolhas em 100 respostas equivalem a 20%; aplicando essa proporção a 1.500 eleitores hipotéticos, a simulação mostra aproximadamente 300 votos. Branco, nulo, indecisão e demais alternativas também participam do total usado no cálculo.

No Senado são duas escolhas por pessoa. A base percentual é `2 × número de respostas`, e a simulação distribui `2 × número de eleitores hipotéticos` escolhas. As quantidades são arredondadas.

Essa “média” é uma proporção da base recebida. A simulação **não é uma previsão eleitoral**, não prova representatividade e não calcula margem de erro. As escolhas dos contatos convidados podem diferir das escolhas do conjunto de eleitores.

## 5. Quando decidir iniciar a coleta real

Mantenha `admin / 1234` somente durante o teste. Para ativar o modo real:

1. Gere uma senha exclusiva com pelo menos 16 caracteres e uma chave aleatória, diferente da senha, com pelo menos 32 caracteres. Com Node.js instalado, execute `node scripts/generate-secrets.mjs` na pasta do projeto para gerar os valores.
2. Na Vercel, altere `TEST_MODE` para `false`, substitua `ADMIN_PASSWORD` pela senha forte e cadastre a chave em `SESSION_SECRET`. `ADMIN_USERNAME` pode continuar `admin` ou ser alterado.
3. Mantenha as variáveis do Turso e faça Redeploy.
4. Entre no painel com as novas credenciais. Em **Configuração**, preencha responsável, contato, registro, metodologia, período de coleta e data de divulgação.
5. Confira os dados, a lista de candidaturas e as condições de realização e divulgação antes de abrir a coleta.
6. Altere a situação para **Aberta para convidados** e salve.
7. Em **Convites**, gere até 1.500 links reais e baixe o CSV. Guarde o arquivo: os links completos aparecem apenas nessa geração.
8. Envie um link diferente para cada contato autorizado. Cada convite aceita uma resposta.

O envio pelo WhatsApp é feito por você. Preencher um número de registro no painel não efetua nem valida um registro no TSE. O site apresenta pesquisa independente, sem vínculo com o TSE.

Os testes anteriores permanecem salvos e separados. Eles não passam a ser respostas reais ao desligar o modo de teste. Esta versão usa uma pesquisa real por banco; para uma nova rodada independente, utilize outro banco.

Antes de distribuir os links, abra um deles em uma janela anônima. Se a Vercel pedir login ao participante, confira **Settings → Deployment Protection** para permitir acesso público à implantação de produção quando estiver pronto. O login do painel continua sendo separado.

Para divulgar resultados, encerre a coleta e ative **Publicar resultados agregados**, respeitando a data cadastrada. A página pública fica em `/resultados` e usa somente respostas reais.

## 6. Atualizações e domínio

Faça alterações nos arquivos e use o GitHub Desktop para **Commit** e **Push**. Com a integração ativa, a Vercel publica uma nova versão; manter o mesmo banco preserva as respostas.

Você pode começar pelo endereço `.vercel.app`. Para um domínio próprio, adicione-o em **Settings → Domains** e siga o DNS indicado pela Vercel. Este pacote não registra domínio nem altera a identificação exigida pelos provedores.

## Se encontrar um problema

| Situação | O que conferir |
| --- | --- |
| “No Next.js version detected” | O `package.json` precisa estar na raiz escolhida em Root Directory. |
| Painel mostra “Prévia · banco ainda não conectado” | Siga “Conecte o banco uma vez” dentro do próprio painel, cadastre URL e token na Vercel e faça Redeploy. |
| Banco configurado não conecta | Confira URL, token, banco libSQL e permissões. Um erro de conexão não é substituído por dados fictícios. |
| `admin / 1234` não funciona | Confira se `TEST_MODE=true` e se as variáveis de usuário/senha possuem outros valores. |
| Login real não funciona | Com `TEST_MODE=false`, use senha de 16+ caracteres e `SESSION_SECRET` de 32+ caracteres. |
| “Muitas tentativas” | Aguarde 15 minutos e tente novamente. |
| Demonstração não salva | A demonstração não grava; conecte o banco e use o modo de teste para persistir respostas. |
| Respostas somem ao trocar o filtro | Confira teste/real e a resposta sobre Várzea da Palma; os filtros selecionam bases distintas. |
| Participante vê um login da Vercel | Confira Deployment Protection da implantação de produção. |
| Testes não aparecem em `/resultados` | Esse é o comportamento esperado: testes ficam no painel. |
| Resultados reais não aparecem | Encerre a coleta, aguarde a data e ative a publicação no painel. |

Referências oficiais usadas na preparação do pacote:

- [Vercel com GitHub](https://vercel.com/docs/git/vercel-for-github)
- [Variáveis na Vercel](https://vercel.com/docs/environment-variables)
- [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Turso com Next.js](https://docs.turso.tech/sdk/ts/guides/nextjs)

A configuração de contas, a conexão com seu Turso e a publicação na sua Vercel ainda precisam ser feitas por você. O ZIP contém o projeto e as instruções; não possui acesso às suas contas.

## Lista única de candidatos

Os candidatos aparecem juntos, sem títulos de “principais” ou “demais”. Os nomes que você solicitou continuam primeiro, na mesma ordem; os outros seguem na lista e permanecem disponíveis na busca.
