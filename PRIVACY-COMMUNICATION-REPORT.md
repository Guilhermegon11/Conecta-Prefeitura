# Revisão — endereço e comunicação privada

Data: 18/08/2026

## Alterações
- A interface de mapa e toda a geocodificação foram removidas da experiência do usuário.
- Chamados mantêm cadastro obrigatório de bairro e rua/endereço.
- O endereço aparece na ficha detalhada do chamado.
- A área Comunicação foi redesenhada com lista de conversas, prévias, horários, bolhas de mensagens, anexos e compositor de mensagem.
- Conversas diretas são filtradas pelos participantes; grupos são filtrados pelos membros.
- Prefeito: acesso à Comunicação de outros setores fica **Privado** por padrão.
- O Prefeito pode habilitar a opção em Configurações > Privacidade executiva.
- Quando habilitado, a visão de outro setor é identificada como acesso executivo e funciona em modo somente consulta.
- Vice-Prefeito não recebe o controle para habilitar essa visualização.

## Validação
- Arquivos TS/TSX principais foram validados por transpile sintático sem erros.
- O build completo do Next.js não foi concluído neste ambiente porque a instalação local de dependências está incompleta; a Vercel deve executar uma instalação limpa pelo package-lock.json.
