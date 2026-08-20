# Prefeitura Conecta v4.9.0 — Central Executiva

Data: 20/08/2026

## Objetivo

Dar ao Prefeito e ao Vice-prefeito uma visão municipal consolidada das pendências de todos os setores, preservando a navegação e o isolamento usados pelos demais perfis.

## Nova aba exclusiva

- grupo de menu `Prefeito e Vice`;
- item `Pendências gerais`;
- acesso permitido somente quando o cargo do usuário é `Prefeito` ou `Vice-prefeito`;
- remoção automática da tela ao trocar para um perfil sem acesso executivo.

## Informações consolidadas

- chamados abertos de todos os setores;
- tarefas da Central Integrada;
- pendências vencidas e urgentes;
- itens aguardando aprovação, decisão ou retorno;
- itens sem responsável definido;
- metas abaixo do valor esperado;
- projetos com risco declarado ou prazo próximo e avanço insuficiente.

## Organização da tela

1. resumo executivo com indicadores gerais;
2. prioridades do dia, incluindo atrasos e prazos de hoje;
3. prioridades dos próximos sete dias;
4. leitura rápida do setor que concentra mais atenção;
5. cards individuais por setor, com chamados, tarefas, decisões e taxa de conclusão;
6. fila consolidada com atualização de situação;
7. busca e filtros por setor, origem, prioridade e prazo;
8. opção para mostrar também setores sem pendências;
9. exportação do recorte atual em CSV.

## Integração e persistência

Os chamados continuam no estado global já utilizado pelo sistema. As tarefas, projetos e metas reutilizam as mesmas chaves persistentes da Central Integrada, evitando cadastros duplicados. Uma alteração feita na Central Executiva aparece no módulo operacional correspondente.

Atualizações executivas de chamados recebem registro no histórico com setor, usuário, data e nova situação. Alterações de tarefas também entram na linha do tempo da própria tarefa.

## Responsividade e acessibilidade

- cards adaptáveis para desktop, tablet e celular;
- controles com rótulos acessíveis;
- estados críticos apresentados por texto e ícone, não somente por cor;
- foco por teclado preservado;
- compatibilidade com alto contraste e ampliação de texto já existentes.
