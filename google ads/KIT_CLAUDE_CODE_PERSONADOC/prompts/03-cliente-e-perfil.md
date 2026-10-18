# PROMPT 03 — Formulários: Dados do cliente e Perfil da persona

## C — Contexto
O esqueleto visual está pronto. Implemente apenas as **duas primeiras seções**, reproduzindo as perguntas visíveis em `referencias/01-dados-cliente.png` e `referencias/02-perfil-persona.png`. O propósito é montar um modelo genérico que possa ser usado com diversos clientes, e NÃO inventar os dados de um cliente real.

## T — Tarefa
1. Em **Dados do cliente**, implemente campos: nome da empresa/cliente (obrigatório), nome do responsável, segmento/nicho, produto ou serviço principal, ticket médio em reais, localização, descrição resumida, principais concorrentes e diferencial competitivo. Esses campos aparecem nas capturas ou no resumo exibido.
2. Em **Perfil da persona**, implemente: nome fictício, faixa etária, gênero predominante, estado civil, se tem filhos, região geográfica, escolaridade, renda mensal aproximada, ocupação/profissão e classe social. Crie também bloco separado de **estilo de vida e interesses**, cujo título aparece na imagem, com perguntas complementares claramente identificadas como enriquecimento do modelo, não transcrição literal do vídeo.
3. Use inputs, textareas, selects e opções multisseleção onde fizer sentido. Inclua descrição curta/placeholder ilustrativo, sem preencher dados de demonstração por padrão. A escolha `Não sei / Não informado` deve ser permitida quando aplicável; não force suposições sobre demografia.
4. Valide campos obrigatórios e valores monetários de modo legível. Faça alterações refletirem no estado compartilhado de `/persona`. Crie tipos e configurações de campos separados de componentes de apresentação.
5. Utilize componentes acessíveis e com feedback claro. O percentual de progresso deve considerar campos reais e não penalizar campos opcionais como se todos fossem obrigatórios. Documente a fórmula escolhida.

## R — Critérios de aceite
Teste preenchimento, navegação e preservação de dados dentro da sessão; erros não devem eliminar informação digitada. Não implemente outras seções nesta etapa.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.
