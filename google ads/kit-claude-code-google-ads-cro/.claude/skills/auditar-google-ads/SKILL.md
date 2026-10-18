---
name: auditar-google-ads
description: Auditar conta Google Ads em modo somente leitura, identificar desperdício, falhas de tracking e oportunidades de melhoria por dados reais.
argument-hint: "[cliente] [período]"
---

# Auditoria Google Ads — READ-ONLY

## Preparação
- Validar IDs da conta, moeda, fuso, intervalo de datas, ações de conversão e completude dos relatórios.
- Se não houver API, usar exportações CSV da interface; nunca afirmar leitura em tempo real.
- Preferir comparar períodos equivalentes; observar defasagem de conversões, sazonalidade e mudança de orçamento.

## Inspecionar
1. **Mensuração:** quais metas primárias? São leads válidos ou cliques? Dupla contagem? Qualidade dos leads e vendas reconhecidas no CRM?
2. **Pesquisa:** termos de pesquisa, gasto irrelevante, conflitos com negativas, tipos de correspondência e alcance indevido.
3. **Estrutura:** sobreposição de grupos, campanhas fragmentadas, anúncios desconectados da landing, assets ausentes.
4. **Configurações:** localização, presença/interesse, horários, redes, orçamento, estratégias de lance e alterações recentes.
5. **Experiência:** mobile, formulário, erros de submit, velocidade, mensagem, CTA e tempo comercial até contato.
6. **Financeiro:** gasto, CPL, CPQL, CAC, vendas pagas e margem (apenas quando houver dados concretos).
7. **Confiabilidade:** campanhas com pouca amostra devem receber status `dados insuficientes`.

## Entrega
Relatório com: `achado | prova/contagem/fonte | impacto potencial | confiança | prioridade | alteração sugerida | risco | aprovação necessária`. Separar `ações recomendadas` de `ações realizadas` (normalmente nenhuma). Propor quick wins não destrutivos.
