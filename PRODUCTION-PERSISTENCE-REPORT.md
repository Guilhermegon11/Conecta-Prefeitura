# Relatório — persistência central e Área do Setor

## Alterações realizadas

- Removidas referências de interface a modo de demonstração/protótipo.
- Criada camada de persistência central via Supabase.
- Criadas rotas server-side para ler e gravar estado persistente.
- Arquivos e documentos passam a usar Supabase Storage privado.
- Convites de funcionários passam pela API de convite do Supabase Auth.
- Dados globais do aplicativo passam a ser carregados e salvos remotamente.
- Configurações e preferências passam a ser persistidas.
- Processos Digitais, Gestão Municipal, Atendimento ao Cidadão, fluxos, metas, aprovações e ferramentas operacionais passam a persistir alterações.
- Área do Setor reformulada como central operacional por secretaria.

## Área do Setor

A nova área suporta:

- fila de trabalho ordenada por prazo;
- registro novo;
- edição e exclusão;
- prioridade;
- responsável;
- prazo;
- categoria;
- situação;
- ficha detalhada;
- atividades de campo;
- metas editáveis;
- encaminhamentos com acompanhamento de status;
- permissões de consulta/registro/edição;
- indicador de sincronização.

## Validações locais

- 28 arquivos TypeScript/TSX: validação sintática concluída sem erros.
- Checagem semântica local direcionada (`tsc` com stubs das dependências externas): concluída sem erros.
- Busca por referências removidas de demonstração/protótipo na aplicação: nenhuma referência de interface encontrada.
- `localStorage`: permanece apenas como cache de contingência dentro de `app/persistence.ts`.

## Limitação do ambiente de validação

O `next build` completo não pôde ser executado neste ambiente porque a instalação local das dependências não disponibilizou o binário `next`. O deployment da Vercel deve executar `npm install` antes de `npm run build:vercel`, conforme `vercel.json`.
