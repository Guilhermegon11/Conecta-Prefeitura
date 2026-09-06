# Dashboard e rotinas — setembro de 2026

## Aparência

O verde original #176057 foi mantido. Finstack orientou os cartões com cabeçalho, valores destacados e rodapé discreto; Quantix e MaterialMe orientaram a organização e a densidade. O dashboard mantém os dados e objetivos municipais. Os ícones continuam na família Lucide.

Foram ajustados gaps, largura mínima dos painéis, títulos com quebra normal, rolagem contida para tabelas e formulários que se reorganizam conforme a largura. A agenda vem antes de execução e calendário, tanto na ordem do documento quanto visualmente.

## Onde encontrar as funcionalidades

| Melhoria | Uso |
|---|---|
| Histórico do atendimento | Abra um chamado. Mensagens, notas internas, alterações de status e checklist são gravados com autor e horário. Não há mais conversas demonstrativas fixas no detalhe. |
| Criação direta | O menu Criar abre os formulários existentes de tarefa e processo, no setor ativo. |
| Busca e links | Resultados de chamados, tarefas, processos, documentos e eventos abrem o registro. A ação Copiar link preserva tipo, ID e setor; a abertura confere o acesso atual. |
| Meu dia | Meu trabalho → Meu dia reúne tarefas, chamados atribuídos ou sem responsável, revisões de processos, aprovações, complementos solicitados e próximos eventos. |
| Filtros personalizados | Em Chamados, Salvar visualização guarda filtros e colunas. Pode ser pessoal ou compartilhada com o setor. |
| Recebimento de encaminhamentos | O detalhe do chamado envia o pedido. Meu trabalho → Meu dia → Recebimentos permite aceitar com responsável e prazo ou solicitar complemento. O setor de origem acompanha o comprovante sem receber notas internas do destino. |
| Catálogo configurável | Meu dia → Configurações → Serviços e aprovações. A gestão cadastra serviços internos, campos, documentos exigidos, prazo e disponibilidade. Os pedidos são feitos na aba Serviços. |
| Aprovações configuráveis | Cada serviço pode ter até dez etapas, responsáveis, documentos necessários e condições por campo. A aba Aprovações mostra andamento, pareceres e solicitações de complemento. A configuração é copiada para o pedido; edições futuras não mudam casos em andamento. |
| Substituições temporárias | Meu dia → Configurações → Substituições. Define titular, substituto, período e atribuições de aprovação de solicitações ou reservas. A validade é conferida a cada ação. |
| Reservas | Cadastre salas, veículos ou equipamentos em Configurações → Recursos. A aba Reservas consulta períodos, recebe pedidos e permite decisão do responsável. Reservas pendentes bloqueiam o intervalo; sobreposições são rejeitadas. |
| Calendário de expediente | Configurações → Calendário define dias da semana, horários e feriados usados nos prazos dos serviços do catálogo. Chamados têm pausa justificada e retomada com compensação do tempo pausado. Outros formulários mantêm seus prazos explícitos existentes. |
| Registros relacionados | Detalhes de chamados, tarefas, processos, documentos, eventos e solicitações permitem vincular registros existentes do setor sem copiar seu conteúdo. |

O catálogo novo trata **serviços internos**. Os formulários públicos e serviços anteriores do atendimento ao cidadão permanecem disponíveis nos módulos existentes. As etapas de aprovação novas são as do catálogo; a tramitação documental anterior de Processos Digitais continua no próprio módulo.

## Configuração e persistência

Use as mesmas variáveis Supabase já previstas no projeto: SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY). Não há nova migração SQL. O bucket privado prefeitura-conecta-data guarda as novas rotinas em operations/revisions.

Os dados iniciais dos perfis devem concluir a sincronização antes de usar as novas ações. Sem armazenamento central disponível, as rotinas exibem indisponibilidade e não confirmam uma gravação. As novas configurações começam vazias; a gestão deve cadastrar serviços e recursos do próprio município.

O módulo Central Integrada controla o acesso às rotinas. Para que um servidor abra solicitações, configure a permissão de cadastro desse módulo. Responsáveis explicitamente designados podem decidir as respectivas aprovações se tiverem acesso ao módulo. A substituição mantém as permissões próprias do substituto e não concede um perfil administrativo inteiro.

A autenticação existente é a sessão administrativa do sistema enviado. Nessa sessão, a seleção de perfil continua disponível. A API das novas rotinas resolve o perfil a partir dos dados gravados e registra tanto a sessão administrativa quanto o perfil usado. Isso não transforma a aplicação em um sistema de autenticação individual de servidores. Sessões individuais futuras não podem escolher outro perfil nem usar a gravação genérica do ambiente administrativo.

As gravações das rotinas usam revisões imutáveis e consecutivas. Duas alterações concorrentes tentam criar o mesmo próximo arquivo; apenas uma vence, e a outra revalida as regras sobre a revisão vencedora. A garantia de criação concorrente sem substituição vem do [comportamento documentado de upload do Supabase](https://supabase.com/docs/guides/storage/uploads/standard-uploads). Não remover, sobrescrever ou renumerar esses arquivos manualmente. O backup crítico inclui uma cópia do estado operacional atual.

O histórico é cumulativo. O servidor limita cada revisão a 13 MB e informa a necessidade de manutenção caso esse limite seja atingido. Essa estrutura evita uma migração do armazenamento do projeto e deve ser acompanhada conforme o volume real de uso.

## Verificação desta entrega

- Compilação do aplicativo e verificação TypeScript aprovadas.
- 85 testes aprovados, incluindo 20 testes novos de domínio, concorrência e renderização.
- Testes das regras de escopo, histórico, recebimento, calendário, filtros, etapas, evidências, delegações e vínculos.
- Teste de duas reservas simultâneas no adaptador real, com armazenamento isolado, e recuperação de resposta de upload perdida.
- Renderização dos componentes reais de todas as abas das novas rotinas e do detalhe de chamado.
- A tentativa de abrir a prévia no navegador foi bloqueada pela política do ambiente. Portanto, a inspeção visual final em desktop, celular e zoom de 200% não foi concluída nesta atualização. Não se deve interpretar as regras responsivas e os testes de renderização como uma garantia de ausência de problemas visuais em todos os dispositivos.

O pacote contém o código atualizado. Nenhuma publicação ou alteração no ambiente de produção foi realizada. Arquivos temporários de teste e credenciais de teste não fazem parte da entrega.
