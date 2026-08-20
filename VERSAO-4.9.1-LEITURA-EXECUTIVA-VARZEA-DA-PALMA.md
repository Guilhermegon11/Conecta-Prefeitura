# Prefeitura Conecta v4.9.1 — Leitura Executiva e Várzea da Palma

Data: 20/08/2026

## Objetivo

Garantir que Prefeito e Vice-Prefeito acompanhem todas as pendências municipais sem alterar registros pertencentes a outros setores, além de contextualizar a demonstração para Várzea da Palma–MG.

## Modo executivo somente leitura

- a Central Executiva continua exclusiva do Prefeito e do Vice-Prefeito;
- chamados e tarefas exibem a situação como informação, sem seletor editável;
- o botão de novo chamado foi removido da Central Executiva;
- ao abrir outro setor, o perfil executivo recebe permissão de visualização, sem cadastro ou edição;
- tarefas não podem ser arrastadas, movidas ou comentadas;
- projetos, etapas, progresso e metas não podem ser atualizados;
- formulários, aprovações, regras, atividades de campo e atalhos de criação são ocultados;
- ações rápidas e IA de execução ficam indisponíveis no escopo de consulta;
- Funcionários e Configurações de outro setor não aparecem para o perfil executivo;
- o carregamento em modo consulta usa `GET` e cache de contingência, sem criar valores ausentes nem enviar gravações.

Exportação CSV, busca, filtros, abertura de cards, detalhes, históricos e navegação permanecem disponíveis porque não alteram os dados operacionais.

## Demonstração de Várzea da Palma–MG

Os dados iniciais agora usam cenários reconhecíveis do município, incluindo:

- Paço Municipal, Rua Cláudio Manoel da Costa, Pinlar;
- Estação Ferroviária e seu entorno;
- Secretaria Municipal de Saúde no Planalto;
- Secretaria Municipal de Educação na Rua Safira;
- Departamento de Obras na Avenida Dr. Mallard;
- Departamento de Transportes na Rua Emboabas;
- Subprefeitura e serviços da Barra do Guaicuí;
- transporte escolar, vacinação, agricultura familiar, obras, iluminação e atendimento territorial vinculados à sede e ao distrito.

O cabeçalho exibe um aviso de ambiente demonstrativo para diferenciar os cenários de registros operacionais reais.

## Proteções técnicas

1. A permissão da Central Executiva é `view: true`, `register: false`, `edit: false`.
2. A consulta a outro setor força a mesma permissão em todos os módulos.
3. O executor de ações da IA rejeita mutações no escopo executivo de consulta.
4. A persistência detecta permissões sem cadastro/edição e desativa inicialização e salvamento.
5. A Central Integrada recebe a propriedade `readOnly` e também protege seus manipuladores de escrita.

## Validação

- verificação de tipos TypeScript;
- build de produção;
- testes automatizados de acesso executivo, isolamento setorial, localização dos dados, PWA, notícias, mobilidade e acessibilidade;
- lint direcionado da Central Executiva.
