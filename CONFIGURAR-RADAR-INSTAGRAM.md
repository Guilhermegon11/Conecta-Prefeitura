# Configuração do Radar do Instagram

O módulo **Radar do Instagram** fica visível somente para os perfis `u-prefeito` e `u-vice`. A rota de dados também exige uma sessão válida e rejeita qualquer outro identificador de perfil.

## O que a integração oficial permite

- Marcações feitas ao perfil profissional conectado da Prefeitura.
- Comentários publicados nas postagens do perfil oficial.
- Publicações públicas encontradas por hashtags autorizadas pela Meta.
- Classificação local dos conteúdos recebidos pelos termos monitorados, como “Prefeitura Várzea da Palma”, “Rodrigo Dalla” e “Jaime DS”.

A API oficial do Instagram não disponibiliza busca irrestrita por qualquer frase escrita em toda a rede. Para descobrir frases soltas fora das fontes acima, contrate um provedor licenciado de social listening e faça a integração no servidor. Não use raspagem de perfis ou páginas.

## Pré-requisitos na Meta

1. Usar uma conta Instagram profissional, do tipo Business ou Creator, vinculada à Página do Facebook da Prefeitura.
2. Criar um aplicativo no Meta for Developers e adicionar a API do Instagram com Facebook Login.
3. Solicitar a revisão e o acesso às permissões necessárias para leitura de mídia, comentários, menções e conteúdo público por hashtag.
4. Obter um token de longa duração e o identificador da conta profissional do Instagram.
5. Manter o aplicativo e a política de privacidade em conformidade com os termos da Meta e com a LGPD.

## Variáveis do servidor

Configure no ambiente de produção:

```env
INSTAGRAM_MONITOR_ACCESS_TOKEN=token_de_longa_duracao
INSTAGRAM_MONITOR_USER_ID=id_da_conta_profissional
META_GRAPH_VERSION=v26.0
```

Variáveis opcionais:

```env
INSTAGRAM_MONITOR_KEYWORDS=Prefeitura Várzea da Palma;Prefeitura de Várzea da Palma;Rodrigo Dalla;Rodrigo Aguiar Dalla Bernardina;Jaime DS;Jaime de Souza
INSTAGRAM_MONITOR_HASHTAGS=prefeituravarzeadapalma;varzeadapalma;rodrigodalla;jaimeds
```

As hashtags devem ser informadas sem `#`, separadas por ponto e vírgula, vírgula ou quebra de linha. Se a lista não for definida, o servidor gera hashtags equivalentes a partir das palavras cadastradas na tela.

## Comportamento sem credenciais

Sem `INSTAGRAM_MONITOR_ACCESS_TOKEN` e `INSTAGRAM_MONITOR_USER_ID`, a página continua disponível aos dois perfis executivos, mostra que a integração aguarda configuração e não inventa dados de demonstração.

## Segurança operacional

- Nunca exponha o token no navegador, em arquivos públicos ou no repositório.
- Renove e revogue tokens conforme a política interna.
- Restrinja no provedor de hospedagem quem pode visualizar ou alterar variáveis de ambiente.
- Faça a validação de cargo no sistema de identidade real ao trocar o login demonstrativo por autenticação nominal.
- Defina uma política de retenção para textos, autores, links e métricas coletadas.

## Validação após configurar

1. Entre no sistema como Prefeito ou Vice-prefeito.
2. Abra **Radar do Instagram** no menu principal.
3. Clique em **Atualizar**.
4. Confira o estado das três fontes: marcações, comentários e hashtags.
5. Entre com um perfil não executivo e confirme que o item não aparece no menu e que a rota retorna acesso negado.
