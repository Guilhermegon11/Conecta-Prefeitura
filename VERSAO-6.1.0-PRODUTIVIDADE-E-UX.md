# Prefeitura Conecta 6.1.0

## Objetivo

Evoluir a experiência de uso diário sem alterar o isolamento por setor, as permissões existentes ou o modo executivo de consulta. A versão prioriza clareza, produtividade, acessibilidade e confiança institucional.

## Painéis por perfil

- Prefeito e Vice-prefeito: visão municipal consolidada, demandas críticas, setores com risco, decisões pendentes e índice de conclusão.
- Secretários, administradores e responsáveis: prazos, volume ativo, decisões e desempenho da equipe.
- Funcionários: chamados sob sua responsabilidade, avisos, agenda e ações diretas.
- O primeiro nível do painel permanece limitado a quatro indicadores principais; informações secundárias aparecem em “Ver detalhes”.

## Navegação e contexto

- Breadcrumbs em todos os módulos internos.
- Até seis módulos favoritos, persistidos nas preferências do usuário.
- Histórico das cinco páginas acessadas mais recentemente.
- Identificação permanente do setor atual e do modo de consulta executiva.
- Rodapé institucional com versão, setor, suporte, privacidade e LGPD.

## Chamados

- Quadro e tabela com preferência persistente.
- Busca por protocolo, assunto, bairro, solicitante, setor e responsável.
- Filtros de prioridade e status.
- Visualizações salvas: Todos, Urgentes, Atrasados, Minha equipe e Sem responsável.
- Cabeçalho fixo, seleção de colunas, paginação lembrada e ações em lote.
- Tabela convertida em cartões no celular.
- Legenda de status com ícone, nome, cor e explicação.

## Formulários

- Criação de chamado em três etapas: Identificação, Encaminhamento e Revisão.
- Rascunho automático e recuperação do preenchimento.
- Validação contextual junto ao campo.
- Confirmação antes de sair com alterações.
- Rodapé de ações fixo e retorno para editar cada etapa.
- Estados de falha e nova tentativa preservando o conteúdo.

## Notificações

- Categorias: Todas, Urgentes, Pendentes, Informativas, Menções, Processos e Lembrar depois.
- Ação “Lembrar depois” sem remover a notificação.
- Opção para silenciar itens informativos de baixa prioridade.
- Contadores por categoria e estados vazios orientativos.

## Indicadores

- Comparação com o período anterior nos quatro KPIs principais.
- Metas explícitas, barras de progresso e tendência.
- Tooltips com valor, meta e comparação.
- Paleta contida, valores legíveis e alertas reservados a riscos reais.

## Estados e acessibilidade

- Skeletons de carregamento para preferências, chamados e notificações.
- Continuidade offline com gravação em fila.
- Estados vazios com ação de recuperação.
- Erro de gravação, sucesso via aviso do sistema e desfazer para exclusões recuperáveis.
- Navegação por teclado, foco visível, rótulos e atributos ARIA.
- Respeito à preferência de movimento reduzido.

## Identidade institucional

O arquivo `public/brasao-varzea-da-palma-oficial.png` foi obtido da imagem de rodapé publicada no portal oficial da Prefeitura Municipal de Várzea da Palma em 22 de agosto de 2026:

`https://www.varzeadapalma.mg.gov.br/img/logo_rodape.png`

A interface mantém como cor principal o verde institucional `#176057`, evitando verde-limão, excesso de gradientes, sombras fortes e animações decorativas.

## Compatibilidade

- Mantidas as regras de permissão por módulo.
- Mantido o isolamento de informações entre setores.
- Mantidas as áreas exclusivas do Prefeito e Vice-prefeito.
- Mantido o acesso executivo em modo somente consulta quando aplicável.
- Mantidos os fluxos existentes de persistência, modo offline, IA e auditoria.
