# Prefeitura Conecta v4.6.4 — Copiloto Conversacional + Operacional

## Objetivo
Ampliar o Agente Municipal para funcionar como um copiloto completo dentro do sistema, e não apenas como executor de chamados, tarefas e eventos.

## Novo comportamento
O chat distingue automaticamente dois modos:

### Modo Assistente
Usado para perguntas, explicações, ajuda, resumos, comparações, análises, redação e orientação.
Exemplos:
- Como funciona o SLA?
- Qual secretaria cuida de iluminação pública?
- Resuma as demandas desta tela.
- O que merece atenção hoje?
- Me explique como usar o Kanban.
- Me ajude a escrever uma resposta para o cidadão.
- Compare estas demandas e diga qual priorizar.

Nesse modo, actionType=none e nenhuma alteração no sistema é executada.

### Modo Agente
Usado quando existe intenção explícita de criar, alterar, enviar, agendar, encaminhar ou navegar.
Exemplos:
- Abra um chamado para visita familiar.
- Crie uma tarefa para Obras.
- Marque uma reunião amanhã às 9h.
- Envie uma mensagem para João.

O agente coleta dados faltantes e executa conforme as permissões já existentes.

## Contexto ampliado
O Copiloto recebe, conforme permitido:
- tela atual;
- setor visualizado;
- perfil do usuário;
- chamados visíveis;
- prioridades e status;
- agenda próxima;
- contadores operacionais;
- mapa de capacidades do sistema;
- guia resumido dos principais módulos.

## Interface
Novos atalhos no chat:
- Resumir esta tela
- Como posso usar isto?
- Priorizar meu dia
- Encontrar riscos
- Criar plano de ação
- Preparar reunião

O título do painel agora comunica o comportamento completo: “Pergunta, orienta e executa”.

## Offline
Sem internet, o assistente local consegue:
- explicar funções básicas de Chamados, Tarefas e Agenda;
- resumir o contexto já carregado;
- sugerir setor provável;
- continuar executando comandos operacionais essenciais.

Perguntas generativas mais abertas são retomadas pela Groq quando a conexão voltar.
