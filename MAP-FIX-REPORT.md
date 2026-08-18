# Correção — mapa de chamados

## Problema corrigido
Os marcadores anteriores eram `position:absolute` sobre um `iframe` do Google Maps. Ao mover o mapa, os marcadores permaneciam presos à viewport.

## Implementação atual
- A Área do Setor recebe os chamados reais (`privateTickets`).
- Somente chamados com `address` preenchido entram no mapa.
- O campo Rua / endereço passou a ser obrigatório na criação de novos chamados.
- Com `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, o mapa usa Google Maps JavaScript API + Geocoder e marcadores nativos.
- Sem chave Google, usa Leaflet/OpenStreetMap e geocodificação por endereço como fallback.
- Os marcadores são latitude/longitude reais do resultado de geocodificação e acompanham pan e zoom.
- O antigo OperationalMapPanel genérico foi removido da Área do Setor para evitar pontos que não sejam chamados.

## Validação local
- `app/sector-workspaces.tsx`: transpile TypeScript/TSX sem erros sintáticos.
- `app/page.tsx`: transpile TypeScript/TSX sem erros sintáticos.
- `app/municipal-location.tsx`: transpile TypeScript/TSX sem erros sintáticos.
- Fix anterior da Vercel em `resolveActorId` preservado.
