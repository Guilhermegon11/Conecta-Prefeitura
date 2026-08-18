# Prefeitura Conecta — publicação na Vercel

## Como publicar

1. Descompacte o arquivo do projeto.
2. Envie a pasta para um repositório Git ou use `vercel deploy` dentro dela.
3. Na Vercel, escolha o preset **Next.js**.
4. O arquivo `vercel.json` já seleciona o comando de compilação correto.

## Modo de demonstração

A interface, os chamados, os chats, a criação de grupos, os convites, as notificações e as pendências funcionam de forma demonstrativa mesmo quando os serviços de dados não estão configurados.

Para uma operação municipal em produção na Vercel, conecte um banco compatível com a plataforma e um serviço de armazenamento de arquivos. A versão publicada pelo ChatGPT Sites já utiliza armazenamento persistente próprio.

## Mapa de chamados por rua

A aba **Área do Setor > Mapa** agora recebe os chamados reais do setor e exibe somente os chamados que possuem `address` preenchido.

- Se a variável `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` estiver configurada na Vercel, o sistema usa Google Maps JavaScript API e geocodifica a rua do chamado, criando marcadores nativos do mapa.
- Sem essa variável, o sistema usa OpenStreetMap/Leaflet como fallback e geocodifica a rua para latitude/longitude. Os marcadores continuam geográficos e acompanham pan e zoom.
- Chamados sem rua/endereço não são inventados nem posicionados aproximadamente; eles ficam fora do mapa até receberem um endereço.

Para novos chamados, o campo **Rua / endereço** é obrigatório.
