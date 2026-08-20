# Prefeitura Conecta

Sistema interno de gestão municipal em Next.js, React e TypeScript, com persistência central no Supabase quando publicado na Vercel.

## Módulos principais

- Visão Geral e Meu Dia
- Chamados
- Comunicação interna e grupos
- Processos Digitais
- Gestão Municipal
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

## Persistência central

As alterações são salvas no Supabase por rotas server-side. O navegador mantém apenas um cache de contingência para reduzir perda de preenchimento quando houver falha temporária de conexão; o armazenamento remoto é a fonte principal quando disponível.

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

A experiência móvel ganhou manifesto PWA instalável, navegação inferior, estado offline e fila de sincronização visíveis, recuperação automática do rascunho de chamado, exclusão de evento com opção de desfazer e formulário de campo preparado para GPS, câmera e confirmação do responsável.

Em **Configurações › Preferências**, o usuário pode ativar alto contraste, aumentar o tamanho do texto, reduzir animações, reiniciar a apresentação guiada e instalar o aplicativo. A versão também inclui atalho de teclado para o conteúdo principal e foco visível.

Esta entrega não altera a lógica da Inteligência Artificial, nem aplica mudanças na área de Segurança e LGPD. Veja `VERSAO-4.8.0-MOBILIDADE-ACESSIBILIDADE.md`.
