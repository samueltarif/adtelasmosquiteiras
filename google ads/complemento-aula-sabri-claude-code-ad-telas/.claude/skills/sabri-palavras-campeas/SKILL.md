---
name: sabri-palavras-campeas
description: "Identifica as palavras-chave de maior impacto comercial usando dados da conta, sem aplicar mudanças."
---

# sabri-palavras-campeas

**Modo obrigatório:** somente leitura de dados externos. Esta Skill NÃO dá permissão para editar campanhas, cobrar mídia, publicar landing ou modificar configurações. A regra `CLAUDE.md` existente continua valendo.

1. Leia `INSTRUCOES-PARA-CLAUDE-CODE-AULA-SABRI.md`, seções A e B, e `docs/EXPORTACAO-E-METRICAS.md`.
2. Solicite relatório de PALAVRAS-CHAVE e, quando houver, TERMOS DE PESQUISA e resultados de vendas. Sempre confirmar conta, período, definição de conversão e fuso.
3. Calcule ranking por leads válidos, vendas, margem ou conversões provisórias; mostre gasto, cliques, CPA/CPL, receita e amostra.
4. Calcule concentração top 20% e top 4% sem assumir que será 80%/64%; explique o recorte e o número de keywords.
5. Etiquete `CAMPEÃ CONFIRMADA`, `PROMISSORA`, `INCERTA`, `DESPERDÍCIO POSSÍVEL`, `DADOS INSUFICIENTES`. Não tratar termos de pesquisa como palavras cadastradas.
6. Proponha ações em tabela com evidência, prioridade, risco e necessidade de aprovação. **Somente leitura**; zero alterações remotas.

## Saída
Inclua dados/fonte/período, fatos x inferências, tabela de ações, riscos, confiança, tarefas humanas e estado real de execução.
