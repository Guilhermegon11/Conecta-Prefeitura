# Prefeitura Conecta v4.3 — Groq + IA transversal

Esta versão mantém a interface CLEAN da v4.2 e troca a camada de IA generativa para a Groq, com integração transversal no sistema administrativo.

## Onde a IA atua

- Copiloto Municipal flutuante disponível em todas as telas autenticadas, usando contexto resumido do módulo atual.
- Briefing executivo sob demanda no Início.
- Triagem automática das manifestações do cidadão: resumo, categoria, secretaria sugerida, urgência, justificativa, tags, SLA e checklist.
- Detecção/agrupamento de demandas semelhantes combinando classificação inteligente e similaridade local.
- Criação de chamados assistida: título, descrição, setor, prioridade, prazo/SLA, tags e checklist sugeridos.
- Ferramentas dentro do chamado: resumir, gerar checklist e redigir atualização ao cidadão.
- Comunicação interna assistida: sugerir ou melhorar mensagens sem enviar automaticamente.
- Bancada IA Municipal para análise manual de relatos e identificação de padrões.
- Relatórios executivos inteligentes, incluindo resumo semanal e rotinas periódicas já existentes.
- Saúde do sistema informa se Groq e o modelo estão configurados.
- Modo de contingência por regras locais quando a API não estiver configurada ou estiver indisponível.

## Governança e segurança

- A chave não é salva no código nem no ZIP.
- Apenas rotas server-side leem `GROQ_API_KEY`.
- O navegador chama `/api/ai`; ele nunca recebe a chave da Groq.
- O Copiloto envia contexto operacional reduzido e evita dados pessoais desnecessários.
- A IA não executa ações administrativas automaticamente: ela sugere, e o servidor responsável valida.
- Respostas do provedor são tratadas no backend para não expor detalhes sensíveis ao usuário final.

## Variáveis de ambiente

- `GROQ_API_KEY`
- `GROQ_MODEL=openai/gpt-oss-20b`
- `GROQ_REPORT_MODEL=openai/gpt-oss-120b`

Consulte `CONFIGURAR-GROQ-VERCEL.md` antes do deploy.
