# Prefeitura Conecta — publicação na Vercel

## Como publicar

1. Descompacte o arquivo do projeto.
2. Envie a pasta para um repositório Git ou use `vercel deploy` dentro dela.
3. Na Vercel, escolha o preset **Next.js**.
4. O arquivo `vercel.json` já seleciona o comando de compilação correto.

## Modo de demonstração

A interface, os chamados, os chats, a criação de grupos, os convites, as notificações e as pendências funcionam de forma demonstrativa mesmo quando os serviços de dados não estão configurados.

Para uma operação municipal em produção na Vercel, conecte um banco compatível com a plataforma e um serviço de armazenamento de arquivos.

## Registro de endereços

A interface cartográfica foi removida. Os chamados continuam exigindo e persistindo **Bairro** e **Rua / endereço**. Esses dados aparecem na ficha do chamado e permanecem disponíveis para triagem, encaminhamento e atendimento em campo.

## Privacidade da Comunicação

A Comunicação é **privada por padrão**. O Prefeito pode habilitar explicitamente, em **Configurações > Privacidade executiva**, uma visualização de consulta das conversas associadas a outros setores.

Quando o acesso intersetorial está desativado, o conteúdo das conversas de outros setores não é carregado na interface. Quando habilitado pelo Prefeito, a visão é identificada como **acesso executivo** e funciona em modo somente consulta.
