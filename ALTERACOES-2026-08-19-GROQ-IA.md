# v4.3 — Groq + IA transversal

- Provedor generativo migrado de OpenAI para Groq usando endpoint compatível com OpenAI (`/openai/v1/chat/completions`).
- Modelos padrão: `openai/gpt-oss-20b`; relatórios executivos: `openai/gpt-oss-120b`.
- Structured Outputs em modo estrito para triagem, Copiloto e preenchimento inteligente de chamados.
- Copiloto Municipal global e contextual em todas as telas administrativas.
- Briefing executivo com IA no dashboard.
- IA no formulário de chamado: título, descrição, setor, prioridade, SLA/prazo, tags e checklist.
- IA dentro do chamado: resumo, checklist e minuta de atualização.
- IA dentro da comunicação: melhorar rascunho ou sugerir resposta com contexto recente.
- Atendimento ao cidadão continua com triagem automática e regras locais de contingência.
- Sistema de relatórios periódicos passa a usar Groq.
- Saúde do sistema identifica Groq/modelo configurado.
- Chave não é incluída no repositório nem no ZIP; configuração via `GROQ_API_KEY` na Vercel.

## v4.4.1 — Correção do agente operacional
- Corrigido fallback genérico em pedidos explícitos de automação.
- Adicionado `reasoning_format: hidden` para saídas JSON com GPT-OSS/Groq.
- Agente passa a tentar JSON Object Mode e Structured Outputs em redundância.
- Adicionado parser operacional local para chamados, visitas familiares, reuniões e tarefas.
- Continuidade de dados entre mensagens do mesmo pedido.
