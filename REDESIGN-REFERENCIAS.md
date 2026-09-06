# Prefeitura Conecta — dashboard verde

Atualização sobre o projeto v8.0.0 enviado. A identidade verde original foi mantida, com o estilo do dashboard revisto a partir das imagens e dos arquivos Finstack, Quantix e MaterialMe/Craftwork fornecidos.

## O que mudou

- Verde principal `#176057`, menu lateral verde escuro, superfícies claras, bordas discretas e tipografia Poppins local.
- Ícones vetoriais Lucide com traço consistente, usando a dependência que já existia no projeto. A API dos componentes de ícones foi preservada.
- Cabeçalho compacto, indicadores alinhados, gráfico central, demandas recentes e coluna de calendário, desempenho e agenda.
- Nomes completos de usuários e secretarias nos seletores, com quebra de linha e controles nativos acessíveis por teclado.
- Resumo e atalhos dos módulos em seção expansível, deixando o conteúdo operacional mais próximo do início da página.
- Correções de espaçamento na tabela de demandas, navegação móvel, filtros de chamados, contatos e módulo de processos. Tabelas largas e etapas de processos podem ser percorridas horizontalmente dentro de seu próprio painel.
- Ajustes para menu recolhido, celular, tablet, texto ampliado, contraste e redução de movimento.

O gráfico usa os registros do sistema, com barras proporcionais, zero sem barra artificial, período visível e indicação quando não existe base anterior para comparação. As séries representam o status atual agrupado pelo dia de abertura. A agenda usa compromissos futuros ou ainda em andamento. Os indicadores executivos mantêm os totais municipais já existentes; gráfico, execução, listagem de demandas e demais detalhes respeitam o recorte do setor selecionado e do perfil.

## Implementação

O tema está em `app/dashboard-theme.css`, importado após `app/globals.css` por `app/layout.tsx`. Os tokens de cor usam o prefixo `--dashboard-`. A composição principal está em `app/page.tsx`, e os ícones em `app/site-icons.tsx`.

A estrutura anterior dos módulos, APIs, autenticação, permissões, dependências, migrações e configuração de hospedagem foi preservada. A revisão não exige migração de banco e não publica o sistema em servidor.

## Verificação

- TypeScript (`tsc --noEmit`): aprovado.
- Compilação de produção e validação do Worker: aprovadas.
- Suíte existente: 65 testes aprovados, incluindo isolamento por setor.

A revisão visual foi realizada em navegador com dados demonstrativos, nas larguras de 360, 390, 768, 1024 e aproximadamente 1366 pixels. Foram conferidos painel principal, nomes extensos, menu aberto e recolhido, chamados, processos, conversas e abertura do formulário de chamado. O painel também foi conferido com fonte raiz ampliada para 200%.

A infraestrutura de produção não estava conectada nessa revisão; a conferência de interface usou o modo local de demonstração já existente no projeto. Os arquivos temporários de revisão e a configuração local de teste foram removidos do pacote.

## Uso

Extraia o ZIP e utilize a pasta como a versão atualizada do código. Os comandos originais e as instruções de configuração continuam incluídos. O pacote contém o código-fonte completo e os recursos do projeto, sem dependências instaladas nem arquivos temporários de compilação.
