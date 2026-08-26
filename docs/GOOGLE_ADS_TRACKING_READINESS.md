# Relatório de Auditoria de Prontidão do Rastreamento do Google Ads em Produção

**Data:** 25 de Agosto de 2026  
**Fase:** `GOOGLE ADS PRODUCTION TRACKING READINESS AUDIT`  
**Status:** `AUDITORIA CONCLUÍDA — NENHUMA ALTERAÇÃO REALIZADA (READ-ONLY)`

---

## 1. Inventário de Tags e Identificadores Google

| Tipo | Identificador | Onde está Declarado | Função / Destino |
|---|---|---|---|
| **GTM Container** | `GTM-KZTR2DHT` | `app/plugins/gtm.client.js` e `app/app.vue` (noscript) | Gerenciador de tags client-side do Google |
| **GA4 Measurement ID** | `G-S0038L1Q6R` | `app/plugins/gtag.client.js` e `nuxt.config.ts` | Propriedade do Google Analytics 4 |
| **Google Ads ID Atual** | `AW-17981093809` | `app/plugins/gtag.client.js`, `public/politica-de-privacidade.html`, `public/termos-de-uso.html` | Conta de anúncios do Google Ads |
| **Google Ads ID Legado** | `AW-473885322` | *(Removido em fases anteriores de SEO)* | Conta legada anterior |
| **Google Ads Conversion Action** | `AW-17981093809/4GwPCPCPWSjoccELHvhv5C` | `app/composables/useFormSubmit.js` e `app/pages/obrigado.vue` | Ação de conversão de lead/formulário |

---

## 2. Auditoria da Produção Real (`www.adtelasmosquiteiras.com.br`)

- **Carregamento de Scripts em Produção:**
  - `https://www.googletagmanager.com/gtm.js?id=GTM-KZTR2DHT` ➔ Carregado via plugin client.
  - `https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R` ➔ Carregado via plugin client.
  - `window.dataLayer` inicializado com eventos `gtm.js`, `js`, `config G-S0038L1Q6R` e `config AW-17981093809`.
- **PRODUCTION_GTM_IDS:** `GTM-KZTR2DHT`
- **PRODUCTION_GA4_IDS:** `G-S0038L1Q6R`
- **PRODUCTION_GOOGLE_ADS_IDS:** `AW-17981093809`

---

## 3. Diagnóstico Forense de Duplicidades e Riscos de Rastreamento

### 3.1. Risco 1: Implementação Híbrida (GTM + gtag.js manual)
- O código Nuxt injeta e configura diretamente `gtag.js` (`G-S0038L1Q6R` e `AW-17981093809`).
- Simultaneamente, o código injeta o container `GTM-KZTR2DHT`.
- **Risco de Duplicação:** Se dentro da interface do GTM houver uma tag ativa de "Configuração do GA4" ou "Tag do Google" disparando em *All Pages*, as métricas de pageviews e usuários no GA4 serão computadas 2x.

### 3.2. Risco 2: Disparo Duplo na Conversão do Formulário
- No envio do formulário através de `useFormSubmit.js`:
  1. A API `/api/send-lead` responde com sucesso.
  2. O composable executa `reportConversion()`:
     ```javascript
     window.gtag('event', 'conversion', { 'send_to': 'AW-17981093809/4GwPCPCPWSjoccELHvhv5C' })
     window.dataLayer.push({ event: 'form_submission', event_category: 'lead', event_label: 'formulario_contato' })
     ```
  3. O usuário é redirecionado para `/obrigado`.
  4. Na montagem do componente `app/pages/obrigado.vue`, o hook `onMounted()` executa **novamente**:
     ```javascript
     window.gtag('event', 'conversion', { 'send_to': 'AW-17981093809/4GwPCPCPWSjoccELHvhv5C' })
     window.gtag('event', 'generate_lead', { event_category: 'lead', event_label: 'obrigado_page' })
     window.dataLayer.push({ event: 'form_submission', event_category: 'lead', event_label: 'obrigado_page' })
     ```
- **Consequência:** Cada lead enviado gera **2 disparos idênticos** de conversão no Google Ads e 2 eventos `form_submission` no dataLayer.

### 3.3. Risco 3: Falso Positivo em Visita Direta / F5 na Página `/obrigado`
- Se qualquer visitante ou bot acessar `https://www.adtelasmosquiteiras.com.br/obrigado` diretamente, recarregar a página (F5) ou voltar pelo histórico de navegação, a tag de conversão do Google Ads é disparada **sem que nenhum formulário tenha sido enviado**. Não há barreira de estado ou idempotência na rota `/obrigado`.

---

## 4. Auditoria de CTAs de WhatsApp e Telefone

### 4.1. WhatsApp
- **Rastreamento Central:** `SIM` — O plugin `track-clicks.client.ts` intercepta todos os cliques comerciais em links do WhatsApp (`wa.me`, botões flutuantes, cards, hero, header e footer) e registra os eventos com contexto completo no banco Supabase (`/api/track-click`).
- **Conversão Google Ads de WhatsApp:** `NÃO IMPLEMENTADA` — No momento, não há tag do Google Ads vinculada aos cliques de WhatsApp.

### 4.2. Telefone
- **Rastreamento Central:** `SIM` — `track-clicks.client.ts` intercepta cliques em links `tel:`.
- **Conversão Google Ads de Telefone:** `NÃO IMPLEMENTADA`.

---

## 5. Auditoria de Páginas de Destino (Landing Pages para Google Ads)

| URL | Intenção de Busca | Formulário / Upload | WhatsApp | Experiência Mobile | Avaliação para Anúncios |
|---|---|---|---|---|---|
| `/` | Institucional / Misto ("telas e redes sp") | Sim (Hero + Rodapé) | Sim (Flutuante + Header) | Excelente | Boa para termos genéricos e institucionais |
| `/servicos/telas` | Específica ("tela mosquiteira sp") | Sim | Sim | Excelente | Excelente landing page para campanhas de telas |
| `/servicos/telas/janelas` | Foco em janelas | Sim | Sim | Excelente | Máxima relevância (Quality Score 10/10) |
| `/servicos/telas/pet-screen` | Foco em pets / gatos / cães | Sim | Sim | Excelente | Máxima relevância para termos pet |
| `/servicos/redes` | Específica ("rede de proteção sp") | Sim | Sim | Excelente | Excelente landing page para campanhas de redes |
| `/servicos/redes/sacadas-e-varandas` | Sacadas / Varandas | Sim | Sim | Excelente | Máxima relevância para sacadas |
| `/orcamento` | Alta intenção de conversão / Orçamento imediato | Sim (com upload de fotos e vídeos) | Sim | Excelente | Perfeita para anúncios com apelo de "Orçamento Grátis em 24h" |

---

## 6. Inconsistências de Claims Comerciais Encontradas

1. **Prazo de Instalação:**
   - `HeroSection.vue` (badge móvel): exibe **"48h instalação"**.
   - `HeroSection.vue` (desktop), `index.vue`, `orcamento.vue`, `servicos`: exibem **"Instalação em 24h"**.
2. **Garantia:**
   - Consistente em **2 Anos de Garantia** em todas as páginas e FAQs.
3. **Clientes:**
   - Consistente em **+5 Mil Clientes** / **10+ anos de experiência** / **19 cidades atendidas**.
