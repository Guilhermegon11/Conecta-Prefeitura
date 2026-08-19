# Prefeitura Conecta v4.6.5 — Chatbot geral + Agente Municipal

## Mudança principal
O chat integrado deixou de ser limitado ao contexto municipal.

### Modo Chatbot geral
Quando a mensagem não é um pedido explícito de execução no sistema, a Groq responde como assistente de propósito geral. Pode ajudar com conhecimento geral, estudos, matemática, programação, tecnologia, escrita, revisão, tradução, criatividade, planejamento, produtividade, negócios e dúvidas do cotidiano.

Perguntas gerais não enviam o contexto interno da Prefeitura para a Groq quando ele não é necessário.

### Modo Agente operacional
Pedidos explícitos como "abra um chamado", "crie uma tarefa", "marque uma reunião" ou "envie uma mensagem" continuam passando pela camada operacional, que coleta os dados faltantes e executa a ação conforme as permissões existentes.

### Continuação de ações
Se o agente perguntar um dado faltante (endereço, motivo, horário etc.), a resposta seguinte continua a ação pendente. Se o usuário trocar de assunto e fizer uma pergunta comum, o chat volta ao modo geral.

### Limitação offline
O chatbot geral depende da Groq e, portanto, de internet. Sem internet permanecem disponíveis o histórico local, respostas básicas sobre o sistema e os comandos operacionais offline já implementados.
