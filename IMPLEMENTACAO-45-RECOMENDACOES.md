# Mapa das 45 recomendações aplicadas

A evolução foi feita integrando recursos novos aos módulos já existentes, sem duplicar funcionalidades equivalentes.

1. Home por perfil — dashboards executivo/setorial + Central Integrada filtrada pelo perfil.
2. Central de Gestão do Prefeito — command center na Central Integrada.
3. Tarefas — módulo persistente com responsável, prioridade, SLA e histórico.
4. Kanban — A fazer / Em andamento / Aguardando / Concluído com drag-and-drop.
5. Solicitações internas — tipo de trabalho próprio entre secretarias.
6. Encaminhamento — chamados, processos e manifestações preservam origem/destino/histórico.
7. SLA — prazo e risco por tarefa/chamado.
8. Escalonamento — atraso, 48h sem movimento e urgência aparecem como risco/escalado.
9. Gestão por secretaria — Área do Setor + Central filtrada + Gestão Municipal.
10. Organograma — nova aba Organograma.
11. Diretório interno — busca por servidor/cargo/setor.
12. Busca global — módulos integrados adicionados ao catálogo global.
13. Notificações — central já existente preservada e ligada aos fluxos.
14. @menções — comentários de tarefas identificam menções.
15. Chat por contexto — chat/chamados existentes preservados.
16. Linha do tempo — tarefas, processos, chamados e manifestação pública mantêm histórico.
17. Calendário municipal — Eventos existente preservado.
18. Agenda executiva — widget da Central Integrada.
19. Central de decisões — aprovações/decisões existentes preservadas.
20. Projetos — nova gestão persistente de projetos e etapas.
21. Metas — nova gestão persistente e widget executivo.
22. Indicadores — módulo Indicadores + KPIs da Central Integrada.
23. Relatórios executivos — relatório IA sob demanda + relatórios diário, semanal e mensal automáticos.
24. Mapa — nova gestão territorial.
25. Locais públicos — cadastro persistente de equipamentos municipais.
26. Histórico dos locais — manutenção/histórico por local.
27. Patrimônio — módulo Gestão Municipal já existente e persistente.
28. Frota — módulo Gestão Municipal já existente e persistente.
29. Documentos — processos digitais com arquivos privados e versões.
30. Aprovação de documentos — assinaturas/despachos/decisões preservados.
31. Central de ajuda — tutoriais reais existentes preservados.
32. Onboarding — tour inicial por perfil.
33. Permissões granulares — matriz existente expandida para Central Integrada.
34. Perfis customizados — perfil `personalizado` incluído na configuração.
35. Auditoria — trilha de auditoria existente preservada; novas operações mantêm históricos próprios.
36. Segurança — sessão, 2FA, LGPD e permissões preservados.
37. Backup — manual + cron diário privado.
38. Saúde do sistema — nova aba com verificações operacionais.
39. UX mobile — layouts responsivos adicionados aos novos módulos.
40. PWA — manifest + service worker.
41. Conexão ruim — cache/persistência de contingência e ressincronização.
42. Ações rápidas — dock flutuante global.
43. Favoritos — atalhos persistentes por usuário.
44. Personalização do painel — widgets ativáveis/desativáveis por usuário.
45. Inteligência artificial — resumo, classificação, urgência, similaridade e relatório semanal, sempre com revisão humana.

## Extensões adicionais no canal do cidadão
- `/avaliar` separado do login.
- `/acompanhar` com código de acesso.
- resposta oficial pública e nota pós-atendimento/NPS.
- anexos privados.
- triagem inteligente automática ao receber a manifestação.

## Dependências externas para operação real
Alguns recursos são código pronto, mas dependem de credenciais/serviços externos para operar em produção: Supabase (persistência e arquivos), provedor de IA, Twilio (2FA por SMS, se desejado) e Vercel Cron com `CRON_SECRET`.
