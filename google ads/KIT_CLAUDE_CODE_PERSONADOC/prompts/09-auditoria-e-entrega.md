# PROMPT 09 — Auditoria final, correções e entrega guiada

## C — Contexto
As etapas de PersonaDoc e dashboard foram concluídas. Quero uma validação técnica e funcional, com instruções simples de execução no Windows. Não desejo funcionalidades novas não solicitadas.

## T — Tarefa
1. Revise requisitos dos prompts 01–08 e contraste com capturas em `referencias/`. Gere `AUDITORIA_FINAL.md` com matriz `requisito / evidência / resultado / pendência` e distingua recursos do vídeo de melhorias adicionadas.
2. Execute, quando disponíveis, typecheck, lint, build, testes e navegação automatizada (Playwright ou ferramenta existente). Não afirme testes que não foram executados.
3. Teste 9 abas, conteúdo parcial, chips, campos obrigatórios, progresso, pesquisa de perguntas, ajuda, persistência após F5, backup JSON, resumo, PDF, rotas, importação CSV, filtros, fórmulas/percentuais e exportação do relatório.
4. Inspecione visualmente em desktop (ex.: 1440 px) e mobile (ex.: 390 px) comparando elementos observáveis com os prints. Verifique contraste, foco, responsividade, strings pt-BR e formato monetário.
5. Verifique limites de linhas dos arquivos, exposição de dados sensíveis, dependências vulneráveis, segredos inadvertidos, warnings de hidratação e erros em console. Corrija apenas defeitos diretamente relacionados e reteste.
6. Gere `COMO_USAR_NO_WINDOWS.md` com instruções de instalar dependências, rodar localmente, acessar `/persona` e `/relatorios`, preencher, salvar, importar e exportar arquivos. Explique claramente que o salvamento padrão é local e não sincroniza PCs.
7. Resuma as limitações: reproduz interface observada, não reproduz detalhes não mostrados; não existe integração automática com Google Ads, Supabase ou IA sem etapa específica.

## R — Critérios de aceite
Entregue relatório honesto com PASSOU/FALHOU/NÃO TESTADO por item, comandos usados e instruções de como eu posso reproduzir os testes.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.
