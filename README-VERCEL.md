# Prefeitura Conecta — publicação na Vercel

## Como publicar

1. Descompacte o arquivo do projeto.
2. Envie a pasta para um repositório Git ou use `vercel deploy` dentro dela.
3. Na Vercel, escolha o preset **Next.js**.
4. O arquivo `vercel.json` já seleciona o comando de compilação correto.

## Modo de demonstração

A interface, os chamados, os chats, a criação de grupos, os convites, as notificações e as pendências funcionam de forma demonstrativa mesmo quando os serviços de dados não estão configurados.

Para uma operação municipal em produção na Vercel, conecte um banco compatível com a plataforma e um serviço de armazenamento de arquivos. A versão publicada pelo ChatGPT Sites já utiliza armazenamento persistente próprio.
