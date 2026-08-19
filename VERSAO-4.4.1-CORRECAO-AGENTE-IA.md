# Prefeitura Conecta v4.4.1 — Correção do Agente Municipal

## Problema corrigido

Na v4.4 o Copiloto podia responder “Não consegui interpretar a ação com segurança” mesmo para comandos explícitos como criar chamado ou reunião. A configuração da Groq estava correta, mas a camada do agente dependia de uma única interpretação estruturada e descartava o erro real ao cair no fallback genérico.

## Correções

- JSON Object Mode como primeira estratégia para ações operacionais polimórficas.
- `reasoning_format: hidden` nas saídas JSON dos modelos GPT-OSS da Groq.
- Segunda tentativa automática com Structured Outputs estrito.
- Logs server-side do erro da Groq sem expor a API key ao navegador.
- Fallback operacional local para intenções comuns, em vez de mensagem genérica.
- Continuidade de contexto: respostas posteriores completam dados do pedido original.
- Detecção de novo pedido dentro da mesma conversa para não ficar preso a uma intenção anterior.
- Parser local para data/hora DD/MM, `09h00`, `09:00`, hoje e amanhã.
- Inferência de setor para assistência social, Saúde, Educação, Infraestrutura e outros casos comuns.

## Exemplos validados no fallback

### Visita familiar
Pedido:
`Abra um chamado para uma visita familiar no bairro Caiçara 1`

O agente pergunta apenas:
1. endereço ou referência;
2. motivo/objetivo da visita.

Após a resposta, prepara o chamado para Secretaria de Desenvolvimento Social e o executor registra o protocolo.

### Reunião
Pedido:
`Abra uma reunião em minha agenda às 09h00 da manhã no dia 25/08`

O agente preserva data e horário e pergunta somente o título/assunto da reunião quando esse dado não foi informado.

## Variáveis

Não exige novas variáveis. Continua usando:
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_REPORT_MODEL`
