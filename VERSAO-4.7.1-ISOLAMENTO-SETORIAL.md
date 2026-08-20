# Prefeitura Conecta v4.7.1 — Isolamento setorial

Esta revisão garante que a interface carregue e exiba somente os registros do setor selecionado. A troca de setor fica disponível exclusivamente para os perfis **Prefeito** e **Vice-prefeito**.

## Escopo aplicado

- Chamados, indicadores, auditoria, pendências e busca.
- Usuários, diretório, arquivos, eventos e comunicações.
- Tarefas, projetos, metas, mapa, locais públicos e relatórios da IA.
- Processos digitais, gestão municipal, área do setor e históricos do copiloto.
- Seletores e ações de criação limitados aos setores autorizados para o perfil.

## Comportamento por perfil

- Perfis comuns: setor fixo ao setor do usuário e nenhuma listagem de outro setor.
- Prefeito e Vice-prefeito: podem selecionar qualquer setor, mas cada tela permanece filtrada somente pelo setor selecionado.
- Comunicação executiva: exige habilitação explícita e mostra apenas conversas totalmente confinadas ao setor selecionado.

## Validação

O projeto inclui testes de regressão para os limites de perfil, coleções filtradas, módulos operacionais e histórico setorial da IA.
