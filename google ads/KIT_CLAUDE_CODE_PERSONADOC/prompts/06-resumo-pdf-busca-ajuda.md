# PROMPT 06 — Resumo, progresso, salvamento, busca, ajuda e PDF

## C — Contexto
As oito seções de perguntas estão prontas. O vídeo mostra uma nona seção `Resumo final`, o percentual preenchido, `Buscar perguntas`, `Ajuda` e `Exportar PDF`. Agora essas funções precisam operar de verdade. Compare especialmente `referencias/09-resumo-final.png` com as outras capturas.

## T — Tarefa
1. **Resumo final**: gerar instantaneamente uma visão organizada de todas as seções em cartões, com rótulos e valores legíveis. Campos vazios podem aparecer como `—`; listas devem ser legíveis e preservar acentos. Refletir edições em tempo real.
2. **Progresso**: indicador reativo, baseado em critério de preenchimento explicado e documentado. Nunca mostre `100%` só porque o usuário visitou as abas.
3. **Persistência**: salvar automaticamente no `localStorage`, com controle de versão do esquema e recuperação após F5/reabrir o navegador. Exibir status `Salvo localmente`. Incluir ação de limpar com confirmação. Ofereça exportar/importar JSON como backup opcional útil para transporte entre computadores; valide esquema e nunca substitua dados sem confirmação. Informe que localStorage fica apenas neste navegador/dispositivo.
4. **Buscar perguntas**: caixa/modal que pesquisa títulos, perguntas e descrições; clicar em um resultado navega à seção e posiciona o campo correto.
5. **Ajuda**: janela com objetivo de cada seção, diferença entre público-alvo e persona, definição de termos básicos e instruções para preencher, salvar e exportar.
6. **Exportar PDF**: botão deve gerar um PDF A4 legível do briefing (todas as seções) a partir dos dados reais preenchidos, com cabeçalhos, paginação correta, quebras adequadas, sem cortar linhas/chips e sem exportar a navegação. Prefira biblioteca apropriada e atual documentada; se usar imprimir/salvar em PDF em vez de download direto, o rótulo e a orientação precisam corresponder ao funcionamento real. Nome do arquivo a partir do cliente, sanitizado. Evite dependências pagas.
7. Verifique perfis mobile, teclado, campos extensos, formulário parcialmente vazio e múltiplas páginas do PDF.

## R — Critérios de aceite
Demonstre: preencher dois campos → atualizar resumo/progresso → recarregar página → manter conteúdo → localizar pergunta → abrir ajuda → gerar PDF com os dois campos. Anote quaisquer testes não executados.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.
