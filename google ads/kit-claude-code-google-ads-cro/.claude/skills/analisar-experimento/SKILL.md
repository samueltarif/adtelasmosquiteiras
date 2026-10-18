---
name: analisar-experimento
description: Avaliar teste A/B de landing pages ou criativos com métricas reais, confiança e decisão prudente sobre vencedor.
argument-hint: "[experimento] [datas]"
---

# Avaliar experimento A/B

## Verificação
- Definir hipótese prévia, métrica primária, datas, população, fontes e mudanças paralelas.
- Verificar distribuição das variantes, alocação persistente, implementação do evento, possíveis visitantes duplicados e atrasos de dados.
- Confirmar se conversão é lead gerado, lead qualificado ou venda; não misturar etapas.

## Cálculos
- Por variante: visitantes elegíveis, conversões, taxa, intervalo de confiança adequado, lift absoluto/relativo e gasto/CPA se atribuído.
- Explicar se amostra e duração permitem conclusão; caso contrário, dizer **inconclusivo**. Não escolher vencedor pelo maior percentual isolado.
- Considerar efeito de segmento e heterogeneidade sem caçar resultado positivo em múltiplas comparações não planejadas.

## Decisão
- Recomendar `continuar`, `encerrar sem vencedor`, `propor vencedora` ou `corrigir instrumentação`; a implantação da vencedora é mudança de produção e requer aprovação.
- Documentar aprendizados e hipótese seguinte, sem prometer conversão de 20%.
