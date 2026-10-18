---
name: configurar-mensuracao
description: Auditar e preparar rastreamento GTM/GA4/Google Ads, atribuição de leads e integração CRM, evitando duplicações e dados pessoais indevidos.
argument-hint: "[rota do formulário ou funil]"
---

# Plano e implementação segura de mensuração

1. Detectar GTM, GA4, Google Ads, PostHog e CRM atuais, propriedade/contêiner e eventos existentes. Não reinstalar por padrão.
2. Mapear eventos: `view_landing`, `form_start` (opcional), `generate_lead` **após sucesso real**, `lead_qualificado` e `venda_confirmada` conforme CRM.
3. Confirmar qual ação é conversão primária para Smart Bidding, quais são secundárias e onde ocorre a deduplicação.
4. Preparar persistência segura de parâmetros UTM, GCLID/GBRAID/WBRAID, campanha, rota, consentimento e timestamps; não aceitar conteúdo arbitrário sem validação.
5. Implementar evento somente após confirmação do servidor; armazenar ID da transação para deduplicação; tratar reenvio e refresh de `/obrigado`.
6. Integrar dados reais de vendas com CRM, preservando identidade do cliente e isolamento entre contas. Para envio de conversões offline/enhanced, verificar API e política atuais; não enviar sem autorização.
7. Exigir revisão humana de privacidade, finalidade, consentimento, conteúdo do banner/CMP, retenção e base legal antes de ativar remarketing ou gravação de sessões.
8. Plano de QA: teste com consentimento aceito/recusado, envio válido/inválido, duplicação, perda de conexão, rastreamento manual e confirmação em relatórios após latência adequada.

## Entrega
Mapa `evento → gatilho → destino → conversão primária? → dados enviados → evidência de teste → risco`, com lista de IDs/acessos faltantes sem pedir senhas no chat.
