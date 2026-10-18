# PROMPT 10 (OPCIONAL) — Transformar em ferramenta multi-clientes com Supabase

## C — Contexto
O aplicativo local já foi entregue, testado e aprovado. Esta NÃO é uma funcionalidade do vídeo. Agora quero avaliar uma evolução comercial para guardar vários clientes e abrir os dados em computadores diferentes, sem perder as fichas.

## T — Tarefa
1. Faça antes um plano arquitetural de evolução de `localStorage` para Supabase, com projetos/clientes, autenticação, autorização, perfil de gestor, exportação e backups. Não implemente ainda até minha aprovação.
2. Consulte a documentação via Context7 e, **se disponível/conectado**, use Supabase MCP para inspecionar o projeto autorizado sem tocar em produção antes de aprovação explícita. Defina esquema simples e RLS obrigatória por usuário/organização; inclua ownership nas personas e relatórios.
3. Projete importação assistida dos dados locais para a conta, tratando conflitos e preservando backups. Nada de guardar chaves service_role no frontend.
4. Apresente trade-offs de custo, privacidade, sincronização, hospedagem, multiusuário e recuperação.
5. Só depois de eu aprovar o plano, implemente por pequenas entregas com migrações revisadas e testes de isolamento entre dois usuários.

## R — Critérios de aceite
Não crie banco/tabelas/políticas nem publique sem meu OK explícito. Esta melhoria não pode ser confundida com o procedimento mostrado no vídeo.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.
