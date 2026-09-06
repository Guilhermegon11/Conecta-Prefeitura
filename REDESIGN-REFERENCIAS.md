# Prefeitura Conecta — redesign pelas referências de dashboard

Atualização visual aplicada sobre o projeto v8.0.0 enviado, usando as 12 referências Kleon.

## Alterações

- Menu lateral branco, item selecionado lavanda/roxo, ícones com contraste e atalho de ajuda ciano.
- Cabeçalho com busca arredondada e tipografia Poppins hospedada no próprio projeto.
- Indicadores em quatro cartões independentes; gráfico principal e demandas recentes na área central; calendário, desempenho e agenda na coluna auxiliar.
- Gráfico semanal com três séries: em andamento, concluídas e canceladas, agrupadas pelo dia de abertura e status atual. Alturas proporcionais, zero sem barra artificial, período sempre visível e ausência de base anterior identificada.
- Agenda mostra compromissos futuros reais do sistema e mensagem de agenda livre quando vazia.
- Cores, superfícies, campos, tabelas, botões e estados compartilhados aplicados aos módulos existentes, login e portais públicos.
- Ajustes para celular, menu recolhido, contraste, ampliação de texto e redução de movimento.

## Arquivos de implementação

O tema está em `app/dashboard-theme.css`, importado após `app/globals.css` por `app/layout.tsx`. As cores principais ficam nos tokens `--kleon-*`. O CSS anterior permanece para conservar a estrutura e os comportamentos de todos os módulos. A composição da tela inicial está em `app/page.tsx`.

Foram atualizadas três expectativas dos testes antigos de layout, correspondentes ao texto da busca, à composição do painel e à substituição do banner decorativo.

APIs, autenticação, controle de acesso, dados, migrações, dependências e configurações de hospedagem foram preservados. Não houve publicação em servidor.

## Verificação

- Verificação de tipos TypeScript: aprovada.
- Compilação de produção Vinext: aprovada, incluindo validação do Worker.
- Suíte existente: 65 testes aprovados.
- Sem teste visual/interativo em navegador nesta entrega.

## Utilização

Extraia o ZIP e utilize esta pasta como a nova versão do código do sistema. A estrutura, o arquivo de dependências e os comandos originais foram mantidos. Siga a configuração de implantação já utilizada pelo projeto; as instruções anteriores de Vercel/Supabase e Sites continuam incluídas.

O ZIP contém o código-fonte completo e os recursos originais, sem dependências instaladas nem arquivos temporários de compilação. A atualização visual não exige migração de banco.
