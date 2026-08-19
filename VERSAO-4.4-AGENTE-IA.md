# Prefeitura Conecta v4.4 — Agente Municipal com execução e histórico

## O que mudou

O Copiloto Municipal passou a funcionar também como agente operacional. Além de analisar e responder, a IA pode preparar e executar ações permitidas no sistema quando o pedido do usuário for explícito.

### Ações automatizadas

- Criar chamado e gerar protocolo.
- Criar tarefa/solicitação interna/vistoria.
- Criar evento multissetorial.
- Enviar mensagem interna direta para servidor cadastrado.
- Criar projeto municipal.
- Criar meta de gestão.
- Cadastrar local público.
- Abrir/navegar para módulos do sistema.
- Alterar status de chamado existente com confirmação humana.

Ações destrutivas, financeiras, alteração de permissões, criação de usuário e exclusões não são executadas livremente pelo agente.

## Coleta de informações

Quando faltam dados operacionais, a Groq mantém o contexto da conversa e pergunta somente o necessário. Exemplo: uma visita familiar exige informações suficientes de localização e do objetivo da visita antes da criação do chamado.

Depois que os campos necessários forem reunidos, ações de criação explicitamente solicitadas podem ser executadas automaticamente. Alterações de registros existentes recebem confirmação antes da execução.

## Histórico das conversas

O chat agora mantém múltiplas conversas por usuário. O histórico é salvo usando a persistência central do Prefeitura Conecta e mantém cache local de contingência quando o armazenamento remoto estiver temporariamente indisponível.

Cada conversa registra:
- mensagens do usuário;
- respostas da IA;
- perguntas complementares;
- resumo da ação preparada;
- resultado real da execução;
- protocolo gerado quando aplicável;
- data/hora das mensagens.

## Segurança

- `GROQ_API_KEY` continua exclusivamente no backend.
- O agente respeita as permissões do usuário antes de executar ações.
- Criações e alterações relevantes entram na auditoria já existente.
- A IA não executa exclusões, pagamentos, transferências ou mudanças de permissão pelo chat.
- Dados pessoais desnecessários não devem ser solicitados pela IA.

## Variáveis de ambiente

Não há novas variáveis obrigatórias nesta versão. Continuam sendo utilizadas:

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_REPORT_MODEL`
- variáveis já existentes do Supabase e autenticação.
