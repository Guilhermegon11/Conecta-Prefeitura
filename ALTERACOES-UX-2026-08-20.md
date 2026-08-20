# Prefeitura Conecta — evolução de UX (20/08/2026)

Esta revisão aplica as melhorias de usabilidade solicitadas sem restringir ou remover o seletor demonstrativo **Visualizar como / Perfis cadastrados**.

## Aplicações realizadas

- Navegação principal reduzida a uma área de acesso rápido por perfil e uma área recolhível **Mais**, mantendo os módulos existentes acessíveis conforme permissões.
- Linguagem simplificada: **Meu trabalho**, **Meu setor**, **Processos**, **Arquivos**, **Agenda**, **Anotações** e **Ajuda**.
- Tela inicial orientada ao dia de trabalho, destacando demandas atrasadas, itens em andamento, avisos e próximo compromisso.
- Guia contextual na tela inicial explicando quando usar **Chamado**, **Tarefa**, **Processo** ou **Anotação**.
- Botão universal **Criar (+)** ampliado para chamado, tarefa, processo, mensagem, arquivo e evento, com explicação do objetivo de cada opção.
- Busca com linguagem universal e atalhos adicionais para processos, comunicação e ajuda.
- Experiência inicial contextual por perfil: executivo, gestor/secretário e funcionário.
- Dashboard inicial adapta a mensagem e prioridade ao tipo de perfil.
- **Modo simplificado** persistente, disponível no cabeçalho e nas preferências, com menos informações secundárias e ações principais mais destacadas.
- Melhorias responsivas para cartões do “Meu dia”, menu de criação e modo simplificado.
- A estrutura de permissões existente foi preservada.
- O seletor **Visualizar como / Perfis cadastrados** foi preservado sem novas restrições.

## Observação de validação

O pacote original não inclui `node_modules`. Foi feita validação estrutural dos arquivos alterados. A tentativa de instalar dependências no ambiente de análise não foi concluída por limitação do ambiente, portanto o build completo deve ser executado no ambiente normal do projeto com `npm ci` e `npm run build:vercel`.
