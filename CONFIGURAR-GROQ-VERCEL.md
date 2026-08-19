# Configurar a Groq na Vercel

A integração de IA do Prefeitura Conecta roda exclusivamente no servidor. A chave nunca deve ser colocada em `NEXT_PUBLIC_*`, componentes React ou arquivos enviados ao navegador.

## Variáveis de ambiente

No projeto da Vercel, abra **Settings → Environment Variables** e crie:

- `GROQ_API_KEY` = sua chave privada da Groq
- `GROQ_MODEL` = `openai/gpt-oss-20b`
- `GROQ_REPORT_MODEL` = `openai/gpt-oss-120b`

Aplique as variáveis em **Production**, **Preview** e **Development** conforme sua necessidade e faça um novo deploy.

## Segurança

Como uma chave foi compartilhada durante o desenvolvimento, gere uma nova chave no console da Groq antes de colocar o sistema em produção. Não faça commit de `.env.local` e não coloque a chave diretamente no código.

## Onde a IA é usada

- Triagem automática de reclamações, elogios e sugestões.
- Classificação de secretaria, categoria, urgência, sentimento, SLA, tags e checklist.
- Detecção de demandas semelhantes (combinada com regras locais do sistema).
- Copiloto Municipal global em todas as telas administrativas.
- Priorização do dia e varredura de riscos.
- Planos de ação e pautas de reunião.
- Briefing inteligente no dashboard.
- Preenchimento assistido de novos chamados.
- Resumo e checklist dentro de chamados.
- Minutas de atualização/resposta.
- Assistência na comunicação interna.
- Relatórios executivos automáticos diário/semanal/mensal.
- Área IA Municipal para análises avulsas.

Todas as ações críticas continuam sujeitas à validação humana.
