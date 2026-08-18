# Prefeitura Conecta — deploy na Vercel com Supabase

## Publicação

1. Envie este projeto para o repositório Git conectado à Vercel.
2. Na Vercel, mantenha o preset **Next.js**.
3. O `vercel.json` já executa `npm install` e `npm run build:vercel`.
4. Confirme que a integração do Supabase está conectada ao mesmo projeto da Vercel.

## Variáveis esperadas

O backend reconhece automaticamente as variáveis fornecidas pela integração do Supabase:

- `SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (disponível pela integração para futuras operações autenticadas no cliente)

A chave administrativa é usada somente em rotas executadas no servidor. Ela não é enviada para componentes do navegador.

## Persistência

O sistema usa o Supabase como armazenamento central persistente. Na primeira gravação, o backend prepara automaticamente um bucket privado chamado `prefeitura-conecta-data` quando ele ainda não existir.

São persistidos, entre outros dados:

- chamados, usuários, mensagens, grupos, documentos, eventos e notificações;
- Processos Digitais e suas movimentações;
- Gestão Municipal;
- Área do Setor, incluindo registros, prioridades, metas, atividades de campo e encaminhamentos;
- configurações, permissões e preferências;
- protocolos de atendimento;
- formulários, automações e regras operacionais.

Arquivos anexados também são armazenados no bucket privado do Supabase.

## Convites de usuários

A criação de funcionário pode enviar convite real pelo Supabase Auth. O envio depende da configuração de e-mail do projeto Supabase e dos limites do provedor configurado.

## Diagnóstico

Se o topo do sistema exibir **Aguardando conexão**, verifique primeiro se a integração do Supabase está ativa e se as variáveis de ambiente acima existem no deployment da Vercel.

Para validar o build no mesmo padrão usado pela Vercel:

```bash
npm install
npm run build:vercel
```
