# PROMPT 07 — Aplicar o template para um nicho (PARTE CONCEITUAL DO VÍDEO)

## C — Contexto
O professor diz que, depois de criar o modelo PersonaDoc, podemos pesquisar um segmento (ele exemplifica higienização de sofás) e produzir uma persona desse segmento. Isso foi sugerido na fala, não demonstrado como botão com IA já integrado ao HTML. Não invente uma automação paga. Agora quero transformar o template vazio em um briefing útil para UM cliente real.

## T — Tarefa
1. **Pergunte primeiro** qual empresa/segmento, produto/serviço, cidade/região e fontes de informação eu tenho. Faça perguntas simples; aceite respostas parciais. Não presuma o nicho sem que eu confirme.
2. Leia o esquema de dados do PersonaDoc no projeto. Pesquise apenas se houver acesso a fontes públicas ou MCP `fetch`; se não houver, diga claramente e use somente minhas informações.
3. Gere duas saídas: um documento `pesquisa-persona-[slug].md` com (a) informações confirmadas pelo cliente, (b) fatos externos com URL e data, (c) hipóteses ainda não validadas; e um `persona-[slug].json` compatível com a importação criada na etapa 06.
4. Proponha termos para Google Ads, dores, objeções, tom e argumentos para landing page como **hipóteses**; não declare volumes de pesquisa, CPC, ROAS, renda média, idade do público ou taxa de conversão sem evidência verificável.
5. Não preencha dados pessoais reais de clientes finais sem necessidade, não invente concorrentes, depoimentos, certificações, garantias ou avaliações. Se o nicho for regulado (saúde, direito etc.), sinalize necessidade de revisar as regras aplicáveis antes de produzir anúncios.
6. Não integre IA dentro do app nesta etapa. Isso seria evolução opcional, com backend, privacidade, custos e credenciais próprios.

## R — Critérios de aceite
Mostre o que veio de dados conhecidos, pesquisas e suposições. Produza JSON válido que o aplicativo importa corretamente; peça minha validação da persona antes de tratá-la como definitiva.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.
