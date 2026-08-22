# Prefeitura Conecta 7.0.0 — redesign completo de UI/UX

## Direção visual

A versão 7.0.0 reformula o sistema inteiro a partir da referência visual fornecida, traduzindo sua organização, leveza e densidade informacional para uma plataforma de gestão pública. O resultado não reproduz um painel comercial: a estrutura foi reinterpretada para rotinas municipais, perfis de acesso, demandas, agenda, indicadores, atendimento ao cidadão e frota.

Principais elementos do novo sistema visual:

- fundo geral cinza-claro e aplicação central branca com cantos amplos;
- menu lateral claro, navegação compacta e estado ativo verde-lima;
- verde institucional `#176057` como cor principal;
- verde-lima `#B9DF63` para seleção, progresso e destaques positivos;
- âmbar para atenção, prazos e riscos;
- cartões brancos com bordas sutis e sombras leves;
- cantos entre 9 e 20 px conforme a hierarquia da superfície;
- Figtree 700 em títulos, números e ações importantes;
- Plus Jakarta Sans 500 em textos, campos e conteúdos operacionais.

## Painel principal

O painel inicial ganhou uma composição semelhante à experiência de referência, adaptada ao município:

- banner institucional com saudação por perfil e resumo do dia;
- métricas de andamento, conclusão e atenção;
- atalho direto para a central de trabalho;
- faixa contínua de quatro prioridades;
- gráfico semanal de demandas;
- agenda operacional;
- tabela de demandas recentes;
- medidor semicircular de execução;
- calendário mensal e demandas prioritárias.

O conteúdo do banner muda para Prefeito/Vice-prefeito, gestor de setor e funcionário, mantendo o foco adequado para cada responsabilidade.

## Aplicação em todo o sistema

O novo padrão foi estendido para:

- cabeçalho, busca global, conta e navegação;
- páginas de módulo e trilhas de contexto;
- tabelas, filtros, abas, paginação e seleção em lote;
- cards de gestão, processos, documentos, servidores, eventos e notícias;
- Central Integrada, Central Executiva, indicadores e configurações;
- notificações e assistente de IA;
- Frota e Quilometragem;
- modais, mensagens, alertas, estados vazios e ações flutuantes;
- login administrativo;
- canal de avaliação do cidadão;
- acompanhamento público de protocolo.

## Responsividade e acessibilidade

O layout possui comportamentos próprios para quatro faixas:

- desktop amplo com menu completo e trilho lateral;
- desktop compacto com menu recolhido;
- tablet com painéis reorganizados em duas ou três colunas;
- celular com navegação lateral deslizante, cards empilhados e tabelas adaptadas.

Foram mantidos foco visível, modo de alto contraste, escala de texto, redução de movimento, rótulos acessíveis e estados que não dependem apenas de cor.

## Compatibilidade funcional

O redesign não altera regras de negócio. Permanecem intactos:

- perfis e permissões;
- consulta executiva somente leitura;
- isolamento de dados por setor;
- persistência e sincronização;
- APIs existentes;
- API REST de frota, validações de hodômetro e auditoria;
- rotas públicas `/avaliar` e `/acompanhar`.
