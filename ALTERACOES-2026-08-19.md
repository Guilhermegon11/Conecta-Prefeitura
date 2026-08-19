# Prefeitura Conecta — Gestão Integrada + IA — 19/08/2026

Esta versão consolida o sistema como uma plataforma integrada de gestão municipal, aproveitando os módulos já existentes e adicionando uma camada operacional comum.

## Central Integrada
- Command center municipal com saúde operacional, tarefas abertas, atrasos/escalonamentos, projetos, metas e agenda.
- Visão executiva para Prefeito/Vice e visão filtrada por setor para demais perfis.
- Widgets configuráveis e atalhos favoritos por usuário.
- Ações rápidas globais para chamado, evento, tarefa e IA.

## Tarefas, solicitações internas e SLA
- Tarefas, solicitações internas e vistorias com setor solicitante e responsável.
- Kanban com arrastar e soltar entre A fazer, Em andamento, Aguardando e Concluído.
- Prioridade, responsável, SLA em horas, prazo, tags e histórico.
- Escalonamento visual por vencimento, inatividade de 48h e criticidade.
- Comentários internos com identificação de @menções.

## Projetos e metas
- Cadastro de projetos municipais, responsáveis, prazo, etapas e progresso.
- Metas mensuráveis por secretaria com acompanhamento executivo.
- Integração dos indicadores ao command center.

## Gestão territorial
- Mapa operacional de chamados com localização/bairro já registrados.
- Identificação de concentração de ocorrências por bairro.
- Cadastro de escolas, UBSs, praças e outros locais públicos com manutenção e histórico.

## Pessoas e estrutura
- Organograma do Gabinete/secretarias.
- Diretório interno de servidores, cargos e setores.
- Busca global ganhou atalhos para tarefas, projetos, mapa e IA.

## Atendimento ao cidadão
- `/avaliar` permanece independente do login.
- Protocolo + código de acesso de 6 dígitos.
- Até 3 anexos por manifestação (imagem ou PDF, 7 MB cada).
- `/acompanhar` mostra andamento, setor, linha do tempo e resposta oficial.
- Avaliação pós-atendimento de 1–5 e NPS 0–10 após conclusão.
- No Gabinete, resposta pública e anotação interna ficam separadas.

## Inteligência artificial municipal
- Resumo automático do relato.
- Classificação de categoria e sugestão de secretaria.
- Sinalização de urgência com justificativa.
- Tags e ação administrativa sugerida.
- Detecção de protocolos semelhantes durante a entrada pública.
- Workbench de IA para relatos/chamados internos.
- Geração de resumo executivo semanal.
- Modo de contingência por regras quando a API de IA não estiver configurada.
- Governança: IA não conclui protocolo, não toma decisão legal/médica e exige validação humana.

## Automação e resiliência
- PWA com service worker e cache das páginas essenciais.
- Persistência local de contingência e tentativa de sincronização após reconexão.
- Tela de Saúde do sistema para sessão, Supabase, IA, PWA e automações.
- Backup manual pela Central Integrada.
- Cron diário de backup via Vercel.
- Cron diário, semanal e mensal para relatórios executivos de atendimento, tarefas, projetos, metas e IA.
- Relatório semanal automático fica armazenado no bucket privado e pode ser carregado no painel.

## Segurança e governança
- Mantida matriz granular de permissões.
- Novo módulo `Central Integrada` incluído no controle de acesso.
- Perfil personalizável incluído na matriz de perfis.
- Mantidos auditoria, LGPD, mascaramento, histórico, 2FA e políticas de segurança já existentes.
- Anexos do cidadão são privados e só podem ser baixados em sessão administrativa válida.

## Módulos existentes preservados e conectados
- Chamados e encaminhamentos.
- Chat e notificações.
- Eventos e agenda.
- Processos digitais, despachos, documentos, versões e assinaturas.
- Frota, patrimônio, almoxarifado, contratos, obras e campo.
- Indicadores, aprovações/decisões, formulários e automações.
- Área do Setor, anotações setoriais e Central de Ajuda.

## Variáveis novas/essenciais
- Supabase: `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`.
- IA: `GROQ_API_KEY`; `GROQ_MODEL` é opcional.
- Cron: `CRON_SECRET`.
- Segurança: `AUTH_SESSION_SECRET` e, se usado, credenciais Twilio Verify.

## v4.2 CLEAN — redução de complexidade visual

- Navegação lateral reorganizada em seis áreas principais com submenus progressivos.
- Removido o bloco de suporte redundante da sidebar; Ajuda permanece em Configurações.
- Dashboard inicial simplificado e indicadores detalhados recolhidos por padrão.
- Central Integrada abre em Tarefas pelo menu principal e esconde ferramentas avançadas em “Mais”.
- Régua tipográfica ampliada em toda a área administrativa, login e páginas públicas.
- Funcionalidades anteriores preservadas.
- Ações do cabeçalho reduzidas por contexto: “Novo chamado” somente em Início/Demandas e exportação somente em módulos de gestão/relatório.
- Banners globais repetitivos de visão executiva/permissão removidos da área de conteúdo; controles e regras continuam ativos no topo/configurações.
- 589 declarações explícitas de fonte abaixo de 12 px foram elevadas; não restam tamanhos CSS explícitos inferiores a 12 px.

## v4.5 — Offline First
- PWA reforçada com pré-cache das rotas principais e assets do Next.js.
- IndexedDB para fila offline persistente.
- Sincronização automática, manual e Background Sync quando suportado.
- Persistência administrativa guarda alterações localmente durante indisponibilidade do Supabase/Vercel.
- Acesso administrativo offline em dispositivo previamente autenticado por até 24h.
- Logout offline bloqueia acesso local e agenda logout remoto.
- Agente Municipal com interpretador operacional local quando a Groq fica inacessível.
- `/avaliar` aceita manifestações e anexos offline, com referência temporária OFF-... e protocolo oficial após sincronização.
- `/acompanhar` usa cache local para protocolos já consultados e aceita avaliação offline em fila.
- Upload de documentos e anexos do chat entra em fila quando a conexão cai.
- Barra global de conectividade, fila pendente, botão de sincronização e instalação PWA.
- Ícones PWA 192x192 e 512x512 adicionados.
