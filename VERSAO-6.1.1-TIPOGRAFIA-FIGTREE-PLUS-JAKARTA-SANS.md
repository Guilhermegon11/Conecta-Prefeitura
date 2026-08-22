# Prefeitura Conecta 6.1.1 — tipografia Figtree + Plus Jakarta Sans

## O que mudou

- **Figtree 700** passou a identificar títulos, subtítulos, valores em destaque, cabeçalhos de tabela, legendas, botões e demais ações principais.
- **Plus Jakarta Sans 500** passou a compor textos, descrições, campos, listas e conteúdos operacionais.
- As fontes são auto-hospedadas em `public/fonts`, sem chamadas a Google Fonts ou a outro serviço externo durante o uso do sistema.
- O carregamento usa `font-display: swap`, preservando legibilidade enquanto os arquivos locais são lidos.
- A síntese artificial de peso continua desativada, evitando negritos falsos e mantendo a identidade definida.

## Cobertura

A regra é global e alcança a área autenticada, login, acompanhamento de protocolo, avaliação do cidadão, navegação, painéis, cards, tabelas, formulários, modais e telas responsivas.

Elementos com função técnica mantêm suas famílias específicas: protocolos e códigos continuam monoespaçados, e o editor de documentos preserva a fonte serifada de edição.

## Arquivos locais

- `public/fonts/figtree/figtree-latin-700-normal.woff2`
- `public/fonts/plus-jakarta-sans/plus-jakarta-sans-latin-500-normal.woff2`

As licenças SIL Open Font License acompanham cada família em suas respectivas pastas.
