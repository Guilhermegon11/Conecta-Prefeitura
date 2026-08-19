# Prefeitura Conecta v4.2 CLEAN

## Objetivo

Reduzir a sobrecarga visual sem remover funcionalidades. A versão 4.2 adota divulgação progressiva: o usuário vê primeiro o que precisa usar e abre módulos avançados somente quando necessário.

## Navegação principal

A barra lateral passou a mostrar seis áreas principais:

1. **Início** — resumo do dia.
2. **Demandas** — chamados, atendimento ao cidadão e pendências.
3. **Tarefas** — fluxo operacional com SLA e Kanban.
4. **Agenda** — eventos, reuniões e compromissos.
5. **Gestão** — setor, fluxos, comunicação, processos, gestão municipal, indicadores, arquivos, funcionários e secretarias.
6. **Configurações** — notificações, segurança/LGPD, auditoria, ajuda e configurações administrativas.

Os módulos existentes continuam disponíveis; apenas deixaram de ocupar o primeiro nível da navegação.

## Página inicial mais limpa

- Mantida a visão executiva/operacional essencial.
- Removida a exposição inicial dos sete cards de status.
- Lista inicial limitada às seis demandas mais recentes.
- Indicadores e atividade detalhada ficam recolhidos em **Ver mais indicadores**.
- Informações avançadas continuam acessíveis sem poluir a primeira tela.

## Central Integrada

A navegação interna foi simplificada para:

- Central
- Tarefas
- Projetos
- Mais

Em **Mais** ficam mapa e locais, organograma, IA Municipal e saúde do sistema.

Ao entrar por **Tarefas** no menu principal, a Central Integrada abre diretamente no Kanban de tarefas.

## Tipografia

Foi criada uma nova régua de legibilidade para aumentar textos que estavam pequenos demais, especialmente:

- menu e submenus;
- textos auxiliares;
- cards e indicadores;
- tabelas;
- status e badges;
- formulários, inputs e selects;
- Kanban;
- comunicação;
- Central Integrada;
- login;
- `/avaliar`;
- `/acompanhar`;
- onboarding e ações rápidas.

Textos que estavam na faixa de 8–11 px passaram, em geral, para aproximadamente 12–14 px conforme a hierarquia visual.

## Compatibilidade

Nenhum módulo funcional foi removido. A alteração é de arquitetura de informação, navegação, densidade visual e tipografia.

## Validação local disponível

- 44 arquivos TypeScript/TSX passaram por validação de sintaxe/transpilação com TypeScript.
- O `npm ci --offline` não pôde ser concluído porque o cache do ambiente não contém `zod-validation-error@4.0.2`; portanto o `next build` completo deve ser executado no deploy/ambiente com acesso ao registro npm.
