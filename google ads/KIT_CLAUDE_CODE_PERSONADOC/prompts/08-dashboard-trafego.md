# PROMPT 08 — Dashboard de tráfego pago baseado nas duas capturas

## C — Contexto
O vídeo ABRE mostrando um painel sofisticado de tráfego, mas não fornece prompt integral, código nem origem dos dados. As referências `referencias/10-dashboard-metricas.png` e `referencias/11-dashboard-funil.png` exibem um layout preto/amarelo com KPIs, comparativo de períodos, gráfico de rosca de investimento e seção de funil. Reconstrua o que está visível e complemente apenas o necessário ao funcionamento, sem declarar que partes invisíveis são idênticas ao original.

## T — Tarefa
1. Crie `/relatorios` como módulo SEPARADO do PersonaDoc, com cabeçalho de período, filtros e área de resumo. Visual dark premium, ênfase amarelo-ouro, cards discretos, números de destaque, badges de variação positiva/negativa e ajuda por indicador.
2. Métricas principais: investimento, impressões, cliques, CTR, CPC médio, conversões, taxa de conversão, custo por conversão, valor de conversão e ROAS. Mostrar período atual vs. anterior somente se os dois conjuntos de dados existirem. Fórmulas: CTR=cliques/impressões×100; CPC=investimento/cliques; taxa conv.=conversões/cliques×100 (esclarecer que depende da definição de conversão); custo/conv.=investimento/conversões; ROAS=valor de conversões/investimento. Se denominador zero, mostrar `—`. Variação % = (atual−anterior)/|anterior|×100 apenas quando comparável.
3. Implemente gráfico de barras para períodos, rosca para investimento vs. orçamento restante **somente se houver orçamento conhecido** e funil de aquisição com métricas coerentes. Não invente orçamento de 25 dias ou etapas de venda que não existam na fonte.
4. Fonte de dados fase 1: **importação de CSV** e formulário manual, com documentação do formato aceito e pré-visualização; use os dados de exemplo apenas como DEMONSTRAÇÃO visual, com tarja `Dados fictícios`, nunca como relatório real. Importar Google Ads via API NÃO faz parte desta etapa nem está demonstrado no vídeo.
5. Permitir trocar períodos, redefinir filtros, exibir explicações de KPIs e gerar PDF do relatório com o período e a fonte dos dados. Os cálculos devem usar funções puras e testes unitários.
6. Separe componentes de UI, funções de métricas, modelos de dados, importação e exportação. Não quebre `/persona`.

## R — Critérios de aceite
Compare visualmente com as capturas; teste ao menos dois cenários de dados, denominadores zero, período anterior ausente e filtros. Exponha fonte/importação e carimbo de data no relatório. Nunca alegue conexão ativa a Google Ads sem autenticação e API efetivamente integradas.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.
