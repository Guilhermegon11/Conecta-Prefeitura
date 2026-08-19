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
- IA: `OPENAI_API_KEY`; `OPENAI_MODEL` é opcional.
- Cron: `CRON_SECRET`.
- Segurança: `AUTH_SESSION_SECRET` e, se usado, credenciais Twilio Verify.
