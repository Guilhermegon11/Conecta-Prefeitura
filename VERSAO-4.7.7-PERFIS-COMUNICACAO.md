# Prefeitura Conecta v4.7.7

Esta versão corrige a troca de perfis e a Comunicação sem remover o isolamento entre setores.

## Comunicação corrigida

- A tela não tenta mais abrir uma pessoa fixa de outra secretaria.
- Cada setor possui um canal interno próprio com membros do mesmo setor.
- Setores com apenas um perfil abrem diretamente o canal interno, evitando uma tela vazia.
- Perfis com colegas no mesmo setor continuam com conversas diretas disponíveis.
- Cadastros históricos carregados da persistência são incluídos novamente no canal correto.
- Grupos antigos entre setores ficam preservados na base, mas não aparecem dentro de uma visão setorial restrita.

## Troca de perfil segura

- O Prefeito continua sendo o perfil inicial.
- Todos os perfis ativos permanecem selecionáveis.
- Ao trocar perfil ou setor, seleções internas e janelas do setor anterior são reiniciadas.
- Chamados, contratos, processos, documentos, eventos, usuários, busca e comunicação continuam filtrados pelo setor atual.
- Somente Prefeito e Vice-prefeito mantêm o seletor executivo de setores.
