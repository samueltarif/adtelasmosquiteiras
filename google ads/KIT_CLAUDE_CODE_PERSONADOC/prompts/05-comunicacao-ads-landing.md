# PROMPT 05 — Comunicação, Google Ads e site/landing page

## C — Contexto
As seções 1 a 5 já funcionam. Construa as seções 6, 7 e 8 a partir de `referencias/06-comunicacao-tom.png`, `referencias/07-google-ads.png` e `referencias/08-site-landing.png`. O resultado continua sendo um BRIEFING, não uma campanha criada nem um site publicado.

## T — Tarefa
1. **Comunicação & tom de voz**: chips de tom (amigável, profissional, urgente, inspiracional, direto ao ponto, empático, descontraído, técnico/especialista), formalidade (informal, semiformal, formal — seleção única), palavras-chave que ressoam, termos a evitar e mensagem principal/Big Idea.
2. **Google Ads — Rede de Pesquisa**: termos que clientes usariam no Google (ajuda sugerindo pelo menos 10 hipóteses, sem validá-las como volume real), palavras-chave negativas, intenção de busca (informacional, navegacional, comercial, transacional), área geográfica, proposta de valor, possíveis chamadas e mensagens coerentes com a persona. Separe campos visíveis na captura de enriquecimentos de briefing. Não invente CPC, orçamento, volume, concorrência ou dados de Keyword Planner.
3. **Site & landing page**: cores da marca, estilo visual (moderno/clean, luxo/premium, vibrante/colorido, sério/corporativo, acolhedor/humano), seções desejadas (hero, sobre, serviços, depoimentos, FAQ, contato/CTA, blog, cases, preços), referências de concorrentes, CTA principal, provas sociais disponíveis e recursos reais que o cliente pode fornecer. Não crie depoimentos falsos.
4. Utilize mesmos padrões de componentes, validação e estado global já existentes; continue modular.
5. Exiba mensagens explicativas curtas deixando claro que sugestões de SEO/Ads precisam de validação e que o formulário não se conecta sozinho ao Google Ads.

## R — Critérios de aceite
Os dados devem seguir para o resumo final sem que uma seção substitua o conteúdo de outra. Não inicie serviços externos, campanhas ou publicações.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.
