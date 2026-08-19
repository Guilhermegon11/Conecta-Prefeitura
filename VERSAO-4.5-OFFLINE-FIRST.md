# Prefeitura Conecta v4.5 — Offline First

Esta versão adiciona continuidade operacional sem internet para dispositivos que já tenham preparado/carregado o sistema anteriormente.

## O que funciona offline

- Abertura da aplicação instalada como PWA após um login online válido recente.
- Leitura dos dados administrativos que já foram sincronizados neste dispositivo.
- Criação e edição de chamados, tarefas, agenda, mensagens, projetos, metas e demais estados persistidos pelo sistema.
- Histórico do Agente Municipal.
- Comandos operacionais essenciais do Agente Municipal por regras locais: criar chamado, tarefa, reunião/evento e abrir áreas do sistema.
- Arquivos e documentos enviados durante a queda ficam armazenados no IndexedDB e entram na fila de sincronização.
- `/avaliar`: o cidadão pode preencher e enviar uma manifestação offline; recebe uma referência `OFF-...` temporária. Fotos/PDFs também ficam na fila.
- `/acompanhar`: consultas já realizadas podem ser reabertas offline a partir do cache do aparelho.
- Avaliação pós-atendimento pode ser colocada na fila offline.

## Sincronização

As alterações são gravadas primeiro no dispositivo e depois enviadas automaticamente quando a conexão retorna. A sincronização acontece:

1. no evento `online` do navegador;
2. ao reabrir o sistema com internet;
3. manualmente pelo botão `Sincronizar agora`;
4. em navegadores compatíveis, pelo Background Sync do Service Worker.

A barra global informa `Modo offline ativo` ou quantas alterações aguardam sincronização.

## PWA

O Service Worker pré-aquece `/`, `/avaliar`, `/acompanhar` e os principais assets do Next.js. Foram adicionados ícones 192x192 e 512x512 para instalação.

## Segurança do acesso offline

- O primeiro login de um dispositivo continua exigindo internet.
- Após autenticação online válida, o aparelho recebe uma autorização local de contingência de até 24 horas.
- Credenciais e chaves de API não são gravadas no cache offline.
- Logout feito offline bloqueia o acesso local imediatamente e agenda o encerramento da sessão do servidor assim que a internet voltar.

## IA durante a falta de internet

Groq é um serviço remoto e não pode executar modelos generativos sem internet. Nesta versão, o Agente Municipal muda automaticamente para um interpretador local de comandos essenciais. A ação é executada no estado local e entra na fila de sincronização.

Quando a conexão volta, a Groq reassume respostas generativas, classificação e análises complexas.

## Limitações inevitáveis

Um dispositivo que nunca abriu/preparou o sistema não consegue baixar a aplicação pela primeira vez sem nenhuma conexão. Também exigem conexão: primeiro login, consultas públicas nunca vistas antes, geração de IA pela Groq e downloads que ainda não estejam no aparelho.

Para uma Prefeitura que deseje continuar atendendo até mesmo computadores novos durante uma queda total do link de internet, a evolução recomendada é acrescentar um servidor local/intranet municipal com replicação para a nuvem. A v4.5 resolve o cenário de operação offline dos dispositivos previamente preparados sem exigir esse servidor adicional.
