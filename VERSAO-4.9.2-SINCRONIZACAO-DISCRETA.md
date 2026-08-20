# Prefeitura Conecta v4.9.2 — Sincronização discreta

## Alteração solicitada

Foi removida da interface a faixa flutuante que mostrava **Conexão restaurada**, a quantidade de alterações aguardando sincronização e o botão **Sincronizar agora**.

## Comportamento preservado

- O aplicativo continua registrando o service worker normalmente.
- A fila offline continua sendo sincronizada automaticamente quando a internet retorna.
- A autenticação offline pendente também continua sendo processada em segundo plano.
- Nenhum chamado, tarefa ou outro dado já existente foi removido.

Assim, a sincronização permanece funcional sem exibir o aviso sobre o conteúdo do sistema.
