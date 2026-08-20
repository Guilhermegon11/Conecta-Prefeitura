# Prefeitura Conecta 4.8.0

## Escopo aplicado

Esta versão implementa a frente de **Mobilidade, acessibilidade e experiência**, além da exceção solicitada para mensagens diretas entre gestores. A Inteligência Artificial e a área de Segurança, Acesso e LGPD não tiveram sua lógica alterada nesta entrega.

## Mensagens diretas entre secretários

- O diretório de conversas diretas reúne todos os perfis de gestão ativos, mesmo quando pertencem a secretarias diferentes.
- Prefeito, Vice-prefeito, secretários, controladoria, subprefeitura e responsáveis cadastrados podem iniciar conversas diretas entre si.
- Funcionários normais continuam vendo somente colegas do próprio setor.
- Grupos continuam estritamente vinculados ao setor e são criados somente com integrantes daquele setor.
- Chamados, documentos, processos, contratos, indicadores e outros registros operacionais não usam o diretório ampliado e permanecem filtrados pelo setor.
- Anexos de uma conversa direta obedecem à mesma regra da mensagem antes de serem gravados.

## Mobilidade e funcionamento offline

- Manifesto PWA completo, ícones e atalhos para painel, avaliação e acompanhamento.
- Instalação orientada em **Configurações › Preferências**.
- Barra global informa perda de conexão, quantidade de alterações pendentes e permite tentar a sincronização novamente.
- Navegação inferior para celular com acesso rápido a Início, Chamados, Conversas, Agenda e Menu.
- Formulário de atividade de campo com botões maiores, captura de GPS, abertura da câmera, referência da evidência e confirmação nominal do responsável.
- O Service Worker passou a usar uma nova versão de cache para entregar os arquivos atualizados.

## Acessibilidade e experiência

- Link “Pular para o conteúdo principal” para teclado e leitores de tela.
- Foco visível reforçado em botões, links e campos.
- Preferências persistentes de alto contraste, texto grande ou muito grande e redução de movimento.
- Apresentação guiada pode ser reiniciada pelo usuário.
- Rascunho do formulário de novo chamado é salvo automaticamente e recuperado ao reabrir a tela.
- Exclusão de evento exige confirmação e oferece **Desfazer** por dez segundos.
- Estados offline, sincronizando, vazio, erro e sucesso permanecem apresentados em linguagem objetiva.

## Validação

- Build de produção e verificação TypeScript.
- Testes automáticos para diretório intersetorial, isolamento de grupos e dados, PWA, acessibilidade, navegação móvel, rascunhos, desfazer, GPS e câmera.
