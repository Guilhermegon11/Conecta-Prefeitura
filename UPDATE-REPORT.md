# Prefeitura Conecta — atualização de Gestão Municipal e Comunicação

## Correção de deploy
- Corrigido o erro de TypeScript em `app/page.tsx`: o componente `LockKeyhole` agora está importado de `lucide-react`.

## Gestão Municipal
- Edição de registros existentes.
- Criação e duplicação de registros.
- Atualização rápida de situação pela ficha detalhada.
- Filtros funcionais de situação e busca.
- Indicadores-resumo por módulo.
- Ficha detalhada com indicador, prazo, responsável e movimentações.
- Exportação CSV real.
- Persistência local das alterações no cenário demonstrativo.

## Secretaria de Comunicação e Eventos
- Calendário editorial exibido na Visão Geral quando este setor está selecionado.
- Próximas datas comemorativas com sugestão de pauta.
- Filtros de pautas planejadas e a planejar.
- Ação para incluir/remover uma pauta do planejamento.
- Atalhos para agenda municipal e Comunicação.

## Privacidade da Comunicação
- Mantida a regra anterior: comunicação de outros setores privada por padrão.
- O Prefeito precisa habilitar explicitamente a visualização intersetorial nas Configurações.

## Validação realizada
- `page.tsx`: 0 erros de sintaxe TypeScript/TSX.
- `municipal-modules.tsx`: 0 erros de sintaxe TypeScript/TSX.
- `settings-section.tsx`: 0 erros de sintaxe TypeScript/TSX.
- Verificação estática confirmou a importação de `LockKeyhole` e os novos componentes.

O ambiente local não concluiu a reinstalação completa das dependências, portanto o `next build` integral não foi executado aqui. O erro de deploy informado pelo usuário foi corrigido diretamente no ponto indicado pelo type-check da Vercel.
