# Processos Digitais — atualização funcional

## Implementado
- Fila de processos com pesquisa, status, prioridade e atalhos Minha fila / Atrasados / Assinatura.
- Indicadores calculados a partir dos registros atuais.
- Autuação de processo com tipo, prioridade, prazo, setor, responsável, acesso e fluxo.
- Edição e duplicação de processos.
- Fluxos guiados configurados por tipo de processo, com progresso visual e mudança de etapa.
- Tramitação entre setores com novo responsável, ação, despacho e registro na linha do tempo.
- Conclusão e reabertura de processo.
- Despachos e pareceres com modelos, edição, rascunho e finalização nos autos.
- Documentos com upload, versão, substituição, download e registro de movimentação.
- Solicitação de assinatura, assinatura simulada e validação por código.
- Persistência local da demonstração em localStorage.
- Permissões de registrar/editar respeitadas nas ações sensíveis.
- Layout responsivo e simplificado para secretários e servidores.

## Validação
- Type-check direcionado de page.tsx e componentes relacionados: aprovado.
- 26 arquivos TS/TSX verificados por transpileModule: 0 erros de sintaxe.
- Auditoria do bloco Processos Digitais: 40 botões; os 3 sem onClick explícito são submit dos 3 formulários do módulo.

## Observação
A persistência funcional desta versão segue o modo demonstrativo do projeto (localStorage). A infraestrutura D1 existente no projeto já possui tabelas de processos e movimentações, podendo ser conectada posteriormente para persistência multiusuário em produção.
