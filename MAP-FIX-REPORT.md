# Correção do mapa de chamados — v3

## Problema identificado
A versão anterior só plotava chamados que já possuíam `address`. Os chamados demonstrativos e registros persistidos pelo backend antigo não armazenavam esse campo, portanto o mapa podia receber zero registros georreferenciáveis. Além disso, a geocodificação alternativa era feita diretamente no navegador.

## Correções aplicadas
- `address` e `neighborhood` passam a existir no schema persistente de chamados.
- Foram adicionados campos opcionais `latitude` e `longitude` para evolução futura.
- Nova migração `0006_ticket_geolocation.sql`.
- `create_ticket` grava bairro e endereço.
- `/api/bootstrap` devolve bairro/endereço/coordenadas.
- Chamados demonstrativos receberam endereço de referência por rua.
- Estado local antigo é migrado para incluir os endereços dos chamados demonstrativos conhecidos.
- Nova rota `/api/geocode` executa a geocodificação no servidor.
- A consulta de localização usa somente a rua + bairro + Várzea da Palma/MG, sem depender do número do imóvel.
- Leaflet passa a ser instalado como dependência do projeto, em vez de carregado por CDN.
- O mapa continua exibindo somente chamados do setor com rua cadastrada.
- Marcadores são geográficos e acompanham pan/zoom do mapa.

## Validações
- Sintaxe TypeScript/TSX validada nos arquivos alterados com `typescript.transpileModule`: sem erros.
- Migrações 0000 a 0006 aplicadas em SQLite temporário via Python: sucesso.
- `package.json`, `package-lock.json`, journal e snapshot JSON: válidos.

## Build
O build completo não foi executado neste ambiente porque a nova dependência `leaflet` precisa ser instalada pelo `npm install`. A Vercel já usa `npm install` conforme `vercel.json`, portanto deverá resolver `leaflet` e `@types/leaflet` antes de `next build`.
