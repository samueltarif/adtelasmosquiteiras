# Relatórios, colunas e contas — manual de leitura para o Claude

## CSV 1: keywords (palavras cadastradas)
Grão: palavra-chave por grupo de anúncios/período. Campos desejados: campaign_id/nome, ad_group_id/nome, criterion_id (se disponível), palavra-chave, match type, status, clicks, impressions, cost, conversions, conv. value, cost/conv., Search IS (se disponível), status de qualidade. **Não somar as mesmas métricas em duas granularidades.**

## CSV 2: termos de pesquisa (o que usuário digitou)
Grão: termo de pesquisa/período/campanha/grupo, quando disponível. Campos: search_term, campaign, ad_group, impressions, clicks, cost, conversions e ação aplicada. Pode haver termos omitidos por privacidade: não equiparar soma de linhas com custo total da conta. Nunca supor que uma busca ativada por palavra em correspondência exata seja idêntica à palavra cadastrada.

## CSV 3: campanhas/grupos/anúncios
Usar para baseline e tendência, com mesmo período, moeda, timezone, estratégia de lances, network e status. Evitar comparar campanhas de Display/PMAX com Busca sem segmentação.

## CSV 4: métricas competitivas
Verificar tipo: `IS de Pesquisa`, `IS perdido por orçamento`, `IS perdido por classificação`, `IS da parte superior` e `IS da primeira posição` são distintos. Não chamar 85% de IS de “85% em primeiro lugar”. Algumas colunas não estão disponíveis em todos os relatórios.

## CSV 5: vendas do CRM (opcional, preferencialmente agregado/anonimizado)
Período, campanha/utm, lead válido, proposta, venda, valor recebido, margem (quando possível). Se ligação de origem de lead à venda não for confiável, declarar `ATRIBUIÇÃO INCOMPLETA`. Não subir CSV de clientes/PII à plataforma sem finalidade e base legal.

## Fórmulas, sempre com denominador válido
- CTR % = cliques / impressões × 100.
- CPC = gasto / cliques.
- CPL válido = gasto / leads válidos.
- Custo por venda (CAC de mídia) = gasto de mídia atribuível / clientes pagos atribuíveis.
- ROAS = receita atribuída a anúncios / gasto de anúncios. **Não calcular usando valor presumido de formulário**.
- Margem de contribuição simplificada = receita - materiais - instalação - outros custos variáveis (se registrados).
- Receita por lead = receita atribuída a leads / leads válidos, se vínculo confiável.
- Máximo CPL economicamente admissível = CAC máximo aprovado × taxa lead→venda real (premissas verificadas).
- Concentração = resultado do top N% das keywords / resultado de TODAS keywords consideradas. Declarar N, critério, população e resultados quando N pequeno ou medidas de valor faltantes.

## Exemplo didático (números INVENTADOS, não são dados AD Telas)
Gasto R$ 200, 50 cliques e 5 leads válidos => CPC R$ 4 e CPL R$ 40. Se houve 1 cliente fechado atribuível, CAC de mídia R$ 200. Sem registro de valor pago e margem, não sabemos se a campanha foi lucrativa.

## Padrão de confiança
- ALTA: fonte rastreável, data, conversão correta, volume suficiente e vendas vinculadas.
- MÉDIA: base relevante, mas faltam vendas/atribuição ou há limitações importantes.
- BAIXA: termos ocultos, valores ausentes, 0–poucos eventos, mudanças recentes ou hipótese sem observação suficiente.

## Menus sugeridos Google Ads
- Campanhas > Insights e relatórios > Termos de pesquisa; ou opção homônima em Palavras-chave.
- Campanhas > Palavras-chave > Palavras-chave de pesquisa.
- Campanhas > Campanhas / Grupos de anúncios / Anúncios.
- Colunas > Modificar colunas > Métricas competitivas para IS e perdas quando disponíveis.

Os menus podem mudar. Claude deve guiar pelo print da interface real em vez de inventar botões.
