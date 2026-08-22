# Prefeitura Conecta

Sistema interno de gestão municipal em Next.js, React e TypeScript, com persistência central no Supabase quando publicado na Vercel.

## Módulos principais

- Visão Geral e Meu Dia
- Central Executiva do Prefeito e Vice-Prefeito
- Radar do Instagram com acesso restrito ao Prefeito e Vice-prefeito
- Chamados
- Comunicação interna e grupos
- Processos Digitais
- Gestão Municipal
- Frota e Quilometragem
- Área do Setor
- Atendimento ao Cidadão
- Anexos e arquivos
- Próximos eventos
- Indicadores
- Segurança e permissões
- Histórico de atividades
- Central de ajuda
- Configurações
- Últimas Notícias Prefeitura

## Versão 7.0.0 — novo sistema visual municipal

Toda a experiência foi redesenhada com base na referência fornecida: moldura branca flutuante, fundo neutro, menu lateral claro, item ativo em verde-lima, cartões compactos, bordas sutis e uma leitura visual mais direta. A identidade foi adaptada ao contexto público municipal — sem copiar o conteúdo comercial da referência — e utiliza o verde institucional `#176057`, apoio em `#B9DF63` e detalhes âmbar para estados de atenção.

O painel inicial agora inclui uma abertura institucional personalizada por perfil, indicadores operacionais em faixa contínua, gráfico de demandas, agenda, tabela recente e medidor semicircular de execução. O mesmo vocabulário visual foi aplicado aos módulos, tabelas, formulários, estados vazios, modais, notificações, copiloto de IA, login e páginas do cidadão.

A interface continua utilizando **Figtree 700** em títulos e destaques e **Plus Jakarta Sans 500** nos demais conteúdos. Foram preservados todos os fluxos existentes, permissões, isolamento entre setores, recursos de acessibilidade e a API REST de frota e quilometragem. Há adaptações específicas para desktop compacto, tablet e celular.

## Versão 6.2.0 — frota e quilometragem diária

O novo módulo **Frota e Quilometragem** permite ao funcionário registrar o hodômetro no início da jornada e concluir o mesmo registro ao devolver o veículo. A distância percorrida é calculada automaticamente, jornadas duplicadas são bloqueadas e um veículo não pode iniciar outro dia enquanto houver uma saída pendente.

A implementação inclui API REST autenticada, cadastro e ativação de veículos, isolamento por setor, validação de sequência do hodômetro, histórico filtrável, exportação CSV, modo de consulta executiva e trilha de auditoria. Os dados estruturados da frota usam o banco D1 já vinculado ao projeto; a migração `0007_blue_guardian.sql` acompanha o pacote.

Endpoints principais:

- `GET/POST/PATCH /api/fleet/vehicles`
- `GET/POST/PATCH /api/fleet/mileage`

## Versão 6.1.1 — tipografia institucional

A interface passa a usar **Figtree 700** em títulos, destaques, números principais, cabeçalhos e ações, enquanto **Plus Jakarta Sans 500** assume os textos de leitura, descrições, formulários e conteúdos operacionais. As duas famílias são servidas localmente pelo próprio sistema, mantendo a identidade visual estável mesmo em redes municipais restritas ou instáveis.

A hierarquia foi aplicada globalmente, incluindo painel, módulos, login, acompanhamento público, avaliação do cidadão, tabelas e modais. Os estilos monoespaçados de protocolos/códigos e a fonte serifada do editor de documentos foram preservados por terem função específica.

## Versão 6.1 — produtividade e experiência por perfil

A versão 6.1 personaliza a visão inicial para Prefeito/Vice-prefeito, responsáveis de setor e funcionários. O painel executivo destaca riscos, decisões e setores críticos; gestores acompanham prazos e produtividade da equipe; servidores recebem uma visão direta do próprio trabalho, avisos e agenda.

Também foram adicionados breadcrumbs, módulos favoritos, páginas recentes, filtros persistentes, visualizações salvas, tabela com cabeçalho fixo e escolha de colunas, seleção em lote, cartões responsivos no celular, formulário de chamado em três etapas com rascunho automático e validação contextual, central de notificações por prioridade, metas comparativas e um sistema de status baseado em ícone, texto, cor e explicação. O acabamento institucional utiliza a marca publicada no portal oficial do município.

## Versão 6.0 — experiência municipal avançada

A interface foi consolidada em um sistema visual institucional baseado no verde `#176057`, com melhor contraste, superfícies mais claras, navegação hierárquica, estados interativos consistentes e maior legibilidade em desktop, tablet e celular.

Entre as melhorias de produtividade estão o menu lateral recolhível com preferência persistente, a faixa de saúde operacional no painel, indicadores de conclusão e cumprimento de prazo, identificação de demandas sem responsável e calendários mensais navegáveis com sinalização de compromissos reais. As permissões, o isolamento entre setores e o modo de consulta executiva permanecem preservados.

## Persistência central

As alterações são salvas no Supabase por rotas server-side. O navegador mantém apenas um cache de contingência para reduzir perda de preenchimento quando houver falha temporária de conexão; o armazenamento remoto é a fonte principal quando disponível.

Os registros relacionais do módulo de frota são mantidos no D1, com índices por setor, veículo, data e situação. Essa separação evita colisões entre jornadas simultâneas e preserva uma auditoria própria das operações de transporte.

O backend cria/usa um bucket privado `prefeitura-conecta-data` para estado persistente e anexos. As credenciais administrativas permanecem no servidor.

## Área do Setor

A Área do Setor foi estruturada para uso operacional frequente. Cada secretaria possui uma central própria com:

- fila de trabalho;
- criação e edição de registros;
- exclusão controlada;
- responsável, prioridade, prazo, categoria e situação;
- ações rápidas e formulários específicos do setor;
- atividades externas/equipes de campo;
- metas com atualização de progresso;
- encaminhamentos entre setores com prazo e status;
- ficha detalhada do registro;
- indicador de sincronização com o armazenamento central.

Os dados são separados por setor na persistência para evitar que uma alteração de uma secretaria sobrescreva a área operacional de outra.

## Processos Digitais

O módulo permite autuar, editar, atribuir responsável, definir prioridade e prazo, movimentar entre setores, registrar despachos, juntar documentos e versões, solicitar/registrar assinaturas, concluir/reabrir e consultar a linha do tempo.

## Comunicação

A comunicação interna usa layout de mensageria, com conversas e grupos. Para o Prefeito, a visualização da comunicação de outros setores permanece privada por padrão e pode ser habilitada explicitamente nas Configurações.

A Secretaria de Comunicação e Eventos também possui calendário editorial com datas comemorativas e planejamento de pautas.

## Supabase + Vercel

O projeto reconhece:

- `SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (disponível pela integração para futuras operações autenticadas no cliente)

Essas variáveis devem estar disponíveis no ambiente da Vercel por meio da integração do Supabase. Nunca exponha a chave administrativa em código client-side.

## Desenvolvimento

Requisitos principais:

- Node.js >= 22.13.0
- npm

Instalação e build para Vercel:

```bash
npm install
npm run build:vercel
```

## Observação de arquitetura

A persistência desta versão é centralizada no Supabase Storage por chave de domínio. Isso elimina a dependência do `localStorage` como fonte de verdade e mantém os dados entre navegadores/deploys. Para cenários de alta concorrência com muitas gravações simultâneas no mesmo domínio, a evolução recomendada é migrar os agregados de estado para tabelas relacionais do Postgres/Supabase com controle de concorrência e políticas RLS por usuário/setor.

## Gestão Integrada + IA — versão 19/08/2026

A versão atual amplia o Prefeitura Conecta com a **Central Integrada**, reunindo tarefas e solicitações internas, Kanban, SLA e escalonamento, projetos, metas cadastráveis, gestão territorial, locais públicos, organograma/diretório, saúde do sistema, backup e relatórios executivos automáticos.

O canal do cidadão permanece separado do login:

- `/avaliar` — reclamação, elogio ou sugestão, com protocolo, anexos e triagem inteligente;
- `/acompanhar` — acompanhamento por protocolo + código de acesso, resposta oficial e avaliação pós-atendimento/NPS.

A camada de IA faz resumo, classificação de categoria e secretaria, indicação de urgência, tags, ação sugerida, identificação de demandas semelhantes e relatórios executivos. Ela é **assistiva** e não substitui a validação do servidor público. Sem `GROQ_API_KEY`, o sistema usa regras locais de contingência.

Veja `IMPLEMENTACAO-45-RECOMENDACOES.md` para o mapa completo das frentes implementadas e `README-VERCEL.md` para variáveis e deploy.

## Versão 4.7 — IA presente na experiência

Esta demonstração deixa a IA visível e acionável nos principais momentos da jornada:

- central de comando com briefing, riscos, prioridades e consulta em linguagem natural na página inicial;
- barra contextual de IA em todos os módulos, adaptada à tela e à secretaria selecionada;
- copiloto municipal disponível no cabeçalho, no menu de ações rápidas e no botão flutuante;
- leitura territorial assistida no mapa, destacando bairros e demandas que merecem atenção;
- assistente do cidadão em `/avaliar`, capaz de interpretar um relato e preencher tipo, assunto e bairro;
- identidade visual mais clara para recursos inteligentes, mantendo a linguagem institucional do produto.

As respostas da demonstração usam os recursos de IA já existentes no projeto e mantêm contingência local quando o serviço externo não estiver configurado.

## Versão 4.7.9 — Notícias oficiais integradas

A área **Últimas Notícias Prefeitura** consulta o RSS do portal oficial de Várzea da Palma por uma rota server-side, organiza publicações por categoria e oferece busca, atualização manual, acesso à matéria original e análise assistiva por IA. Uma lista oficial previamente verificada mantém a área utilizável quando a fonte externa estiver temporariamente indisponível.

As notícias são públicas e aparecem para todos os perfis. Essa exceção não altera o isolamento setorial dos dados internos. Veja `VERSAO-4.7.9-NOTICIAS-PREFEITURA.md` e `SUGESTOES-COMPLETAS-PREFEITURA-CONECTA.md`.

## Versão 4.8.0 — Mobilidade, acessibilidade e contatos entre secretários

As mensagens diretas agora exibem os gestores cadastrados de todas as secretarias, permitindo contato intersetorial entre Prefeito, Vice-prefeito, secretários e responsáveis. Grupos, chamados, contratos, documentos, processos e demais dados operacionais continuam isolados pelo setor visualizado.

A experiência móvel ganhou manifesto PWA instalável, navegação inferior, funcionamento offline e fila de sincronização automática em segundo plano, recuperação automática do rascunho de chamado, exclusão de evento com opção de desfazer e formulário de campo preparado para GPS, câmera e confirmação do responsável.

Em **Configurações › Preferências**, o usuário pode ativar alto contraste, aumentar o tamanho do texto, reduzir animações, reiniciar a apresentação guiada e instalar o aplicativo. A versão também inclui atalho de teclado para o conteúdo principal e foco visível.

Esta entrega não altera a lógica da Inteligência Artificial, nem aplica mudanças na área de Segurança e LGPD. Veja `VERSAO-4.8.0-MOBILIDADE-ACESSIBILIDADE.md`.

## Versão 4.9.0 — Central Executiva de pendências

Os perfis **Prefeito** e **Vice-prefeito** agora possuem uma aba exclusiva chamada **Pendências gerais**, dentro do grupo **Prefeito e Vice**. A Central Executiva consolida chamados e tarefas de todos os setores, sem depender do setor selecionado no painel comum.

O novo painel inclui prioridades do dia e dos próximos sete dias, itens vencidos, urgentes, aguardando decisão e sem responsável, metas abaixo do esperado, projetos em risco, filtros combináveis, exportação CSV e cards separados por setor. Também permite abrir diretamente o ambiente responsável para consultar os detalhes.

Usuários que não sejam Prefeito ou Vice-prefeito não visualizam a aba e são redirecionados para a página inicial caso tentem manter esse módulo aberto após uma troca de perfil. Veja `VERSAO-4.9.0-CENTRAL-EXECUTIVA.md`.

## Versão 4.9.1 — Consulta executiva e demonstração municipal

A Central Executiva e toda navegação do Prefeito/Vice em setores diferentes do Gabinete funcionam agora em **modo estritamente somente leitura**. Foram removidos seletores de status, criação de chamados, movimentação de tarefas, atualização de projetos e metas, comentários, atalhos de ação e execuções da IA nesse escopo. A camada de persistência também deixa de inicializar ou gravar dados quando a permissão atual é apenas de consulta.

Os cenários demonstrativos foram localizados em **Várzea da Palma–MG**, com referências ao Paço Municipal no Pinlar, Estação Ferroviária, Planalto, Avenida Dr. Mallard, rede municipal e Barra do Guaicuí. Um aviso permanente identifica o ambiente demonstrativo. Veja `VERSAO-4.9.1-LEITURA-EXECUTIVA-VARZEA-DA-PALMA.md`.

## Versão 4.9.2 — Sincronização discreta

O aviso flutuante de conexão, a contagem de alterações pendentes e o botão **Sincronizar agora** foram removidos da interface. A fila offline continua sendo enviada automaticamente em segundo plano quando a conexão é restabelecida, sem ocupar espaço sobre as telas do sistema. Veja `VERSAO-4.9.2-SINCRONIZACAO-DISCRETA.md`.

## Versão 4.9.3 — IA dentro das ações rápidas

O botão flutuante independente **IA Conecta** foi removido para não cobrir campos e botões, especialmente o envio de mensagens em **Comunicação**. O acesso à IA permanece disponível dentro do menu aberto pelo botão flutuante **+**, além dos atalhos contextuais já existentes no sistema. Veja `VERSAO-4.9.3-IA-NO-MENU-MAIS.md`.

## Versão 4.9.4 — GPS convertido em endereço

O botão **Usar GPS** das atividades de campo passa a consultar o endereço correspondente à localização do dispositivo e preencher automaticamente o campo de rua/endereço. Latitude e longitude deixam de ser exibidas ao usuário; as coordenadas permanecem apenas como metadado técnico para posicionamento. O mesmo comportamento foi aplicado ao cadastro de endereço dos chamados. Veja `VERSAO-4.9.4-GPS-PARA-ENDERECO.md`.
