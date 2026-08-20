# Prefeitura Conecta 4.7 — IA presente

Esta versão reorganiza a experiência para que a inteligência artificial deixe de ser um recurso escondido e passe a atuar como uma camada transversal da plataforma.

## Principais mudanças

1. **Central de comando na página inicial**
   - mostra volume aberto, prioridades e itens vencidos;
   - aceita perguntas em linguagem natural;
   - oferece atalhos para briefing, priorização, riscos e reunião.

2. **IA contextual em todos os módulos**
   - apresenta uma leitura rápida da tela atual;
   - sugere próxima ação;
   - abre o copiloto com contexto de módulo e secretaria.

3. **Copiloto mais presente**
   - acesso no topo da aplicação;
   - ação rápida dedicada;
   - botão flutuante com linguagem mais clara e orientada a tarefas.

4. **Mapa com leitura territorial assistida**
   - destaca automaticamente a região com maior concentração de demandas;
   - encaminha a análise detalhada ao copiloto.

5. **Assistente do cidadão**
   - interpreta o relato antes do preenchimento;
   - sugere reclamação, elogio ou sugestão;
   - identifica assunto, bairro e secretaria provável;
   - aplica a sugestão ao formulário com um clique.

6. **Evolução de design**
   - linguagem visual própria para IA, com violeta, turquesa e azul institucional;
   - melhor hierarquia entre contexto, recomendação e ação;
   - adaptação responsiva das novas áreas para celular.

## Escopo da demonstração

A implementação foi concentrada em experiência, clareza e presença da IA. Revisões adicionais de segurança e endurecimento de produção ficaram fora do escopo desta demonstração, conforme solicitado.

## Execução

```bash
npm install
npm run dev
```

Para validar a versão:

```bash
npm run lint
npm run build
```
