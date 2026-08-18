# Auditoria de interações — Prefeitura Conecta

Data da revisão: 18/08/2026

## Objetivo
Eliminar controles visualmente clicáveis que não produziam resposta e tornar as funções demonstrativas perceptíveis ao usuário.

## Resultado estrutural
- 226 elementos `<button>` auditados nos componentes TSX.
- 0 botões fora de formulário sem `onClick`/ação explícita.
- 10 botões são submits implícitos dentro de formulários funcionais.
- 13 formulários auditados.
- 0 formulários sem `onSubmit` ou `action`.
- Validação sintática TypeScript/TSX: 0 erros de sintaxe e 0 identificadores locais não resolvidos na checagem sem dependências externas.

## Interações corrigidas/expandidas
- Menu de opções do perfil abre painel visível.
- Exportação de contatos gera CSV.
- Exportação de relatório gera CSV.
- Exportação do histórico de auditoria gera CSV.
- Opções em chamados abrem detalhes.
- Chamados alternam entre quadro Kanban e lista.
- “Adicionar etapa” no checklist cria nova etapa.
- Chamados relacionados no chat abrem a ficha do chamado.
- “Vincular chamado” no chat abre seletor e vincula o chamado à próxima mensagem ou documento.
- Ferramentas de formatação e modelos em Processos Digitais respondem ao clique.
- Ações demonstrativas que antes exibiam apenas texto curto agora podem abrir um modal funcional de contexto.
- Registro de bairro e rua/endereço permanece disponível nos chamados.

## Preservado
- Fonte Geist Sans.
- Melhorias da Área do Setor e registro estruturado de endereços.
- Correção de deploy da Vercel em `resolveActorId`.

## Build local
O `npm ci` completo não pôde ser concluído neste ambiente por indisponibilidade de dependência no cache/rede. O `package-lock.json` foi preservado para instalação limpa na Vercel.
