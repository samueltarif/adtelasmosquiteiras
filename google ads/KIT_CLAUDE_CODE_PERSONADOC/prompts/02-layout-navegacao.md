# PROMPT 02 — Implementar base e layout do PersonaDoc

## C — Contexto
A etapa 01 foi aprovada. O objetivo agora é reproduzir a identidade visual e a navegação do PersonaDoc demonstrado na aula, de forma responsiva e acessível, usando `referencias/01-dados-cliente.png` a `referencias/09-resumo-final.png`. Não trabalhe no dashboard ainda.

## T — Tarefa
1. Caso ainda não esteja instalado, crie/configure o Nuxt 4, TypeScript, Tailwind 4 e shadcn-vue no diretório aprovado, preservando os materiais em `referencias/` e `prompts/`.
2. Construa a página `/persona` com estilo próximo das capturas: fundo quase preto, superfícies cinza-escuro, bordas discretas, texto branco/cinza e destaques amarelo/dourado. Use tokens reutilizáveis de cores. Cabeçalho com nome **PERSONADOC**, `Buscar perguntas`, `Ajuda` e `Exportar PDF`. Barra lateral à esquerda com indicador de progresso e nove itens: Dados do cliente, Perfil da persona, Dores & desejos, Comportamento digital, Jornada de compra, Comunicação & tom, Google Ads Search, Site & landing page, Resumo final.
3. Cada clique no menu deve alterar o conteúdo da área principal sem recarregar o navegador. Monte cabeçalhos e cartões de seção semelhantes aos screenshots; nesta etapa, exiba placeholders honestos nas áreas ainda não implementadas. A seção ativa recebe realce dourado.
4. Adapte para smartphone (sidebar em menu/drawer), tablet e desktop; mantenha foco de teclado, contraste e rótulos.
5. Defina contratos/interfaces de componentes e um objeto de estado tipado inicial. Deixe busca, ajuda, exportação e barra de progresso visualmente presentes, mas sinalizados como `Em implementação` em vez de fingir que funcionam.

## R — Critérios de aceite
- `npm run dev` abre a experiência local.
- Os nove itens funcionam e o layout é visualmente coerente com os screenshots.
- Nenhuma informação se perde ao alternar entre seções na mesma sessão.
- O código está modular e sem páginas gigantes.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.
