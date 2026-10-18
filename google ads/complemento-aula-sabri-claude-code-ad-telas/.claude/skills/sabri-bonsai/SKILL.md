---
name: sabri-bonsai
description: "Audita termos de pesquisa e sugere negativas/oportunidades com risco identificado, sem aplicar nada."
---

# sabri-bonsai

**Modo obrigatório:** somente leitura de dados externos. Esta Skill NÃO dá permissão para editar campanhas, cobrar mídia, publicar landing ou modificar configurações. A regra `CLAUDE.md` existente continua valendo.

1. Leia seção D do arquivo principal e confira CSV de termos de pesquisa e definição de conversão.
2. Diferencie busca irrelevante, busca de intenção comercial, termos ambíguos e amostra insuficiente.
3. Para negativas candidatas: termo exato, gasto, cliques, conversões, intenção inferida, sugestão de tipo negativa, risco de bloquear demanda e justificativa.
4. Nunca negativar automaticamente `preço`, `orçamento`, cidades confirmadas nem aplicar listas universais genéricas.
5. Para inclusão de keyword: explicar intenção, redundância/concorrência com outras keywords e fonte; não cumprir cota de cinco/dia.
6. Classificar ALTA/MÉDIA/BAIXA confiança; preparar lote de propostas para aprovação específica sem ações remotas.

## Saída
Inclua dados/fonte/período, fatos x inferências, tabela de ações, riscos, confiança, tarefas humanas e estado real de execução.
