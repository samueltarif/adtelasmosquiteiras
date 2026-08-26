# Relatório de Correção do Rastreamento do Google Ads Antes do Lançamento da Campanha

**Data:** 25 de Agosto de 2026  
**Fase:** `GOOGLE ADS TRACKING CORRECTION — BEFORE CAMPAIGN LAUNCH`  
**Status:** `CONCLUÍDO E VALIDADO (LOCALMENTE & TESTES ISOLADOS)`

---

## 1. Problema Identificado na Auditoria Prévia

1. **Disparo Duplo da Conversão de Formulário:**
   - A conversão `AW-17981093809/4GwPCPCPWSjoccELHvhv5C` era acionada no retorno do backend em `useFormSubmit.js` e, em seguida, disparada **novamente** no `onMounted` da página `app/pages/obrigado.vue`.
2. **Falsos Positivos em `/obrigado`:**
   - Qualquer visita direta a `/obrigado`, atualização de página (F5) ou retorno via histórico do navegador executava `gtag('event', 'conversion')` e `generate_lead` sem envio de lead.
3. **Ausência de Idempotência:**
   - Múltiplos cliques no botão de envio ou retentativas geravam eventos repetidos no Google Ads e no `dataLayer`.

---

## 2. Correções Implementadas

### 2.1. Single Source of Truth (`useFormSubmit.js`)
- O disparo da conversão Google Ads foi centralizado **estritamente após a confirmação de sucesso** da API `/api/send-lead`.
- Se a requisição falhar (erro 400, 500, timeout ou validação client-side), nenhuma conversão é reportada.

### 2.2. Purificação da Página de Agradecimento (`app/pages/obrigado.vue`)
- Removido 100% dos scripts de conversão e hooks `onMounted` de `app/pages/obrigado.vue`.
- A página agora é puramente UI de confirmação visual.
- Acessos diretos, F5 ou navegação pelo histórico geram **0 conversões**.

### 2.3. Idempotência Estrita por `submission_id` via `sessionStorage`
- Mecanismo client-side utilizando a chave `google_ads_form_conversion:<submission_id>`.
- **Zero PII:** A `sessionStorage` armazena exclusivamente o identificador técnico aleatório (UUID) e um timestamp numérico. Nenhum dado pessoal (nome, email, telefone, mensagem) é gravado.
- Retries do mesmo lead que retornem `idempotent: true` não geram conversões duplicadas.
- Novos formulários geram um novo UUID e disparam a conversão normalmente.

### 2.4. Evento Canônico no `dataLayer`
- Substituídos múltiplos eventos sobrepostos (`form_submission` + `generate_lead` + `conversion`) pelo evento canônico:
  ```json
  {
    "event": "lead_form_success",
    "submission_id": "uuid-da-submissao"
  }
  ```

---

## 3. Estado Atual dos CTAs de WhatsApp e Telefone

- **WhatsApp:**
  - Rastreamento analítico interno: **100% ATIVO** via `track-clicks.client.ts` ➔ `/api/track-click`.
  - Conversão Google Ads: **NÃO IMPLEMENTADA** (Aguardando criação da respectiva Ação de Conversão no Google Ads na próxima fase).
  - Status: `WHATSAPP_READY_FOR_GOOGLE_ADS_CONVERSION = YES`.
- **Telefone:**
  - Rastreamento analítico interno: **100% ATIVO** via `track-clicks.client.ts` ➔ `/api/track-click`.
  - Conversão Google Ads: **NÃO IMPLEMENTADA**.
  - Status: `PHONE_READY_FOR_GOOGLE_ADS_CONVERSION = YES`.

---

## 4. Inconsistência de Claim Comercial

- `HeroSection.vue` (badge móvel): `"48h instalação"`.
- Demais páginas e títulos: `"Instalação em 24h"`.
- Status: `HUMAN_BUSINESS_DECISION_REQUIRED = YES` (Pausado para alinhamento com o operador do negócio).

---

## 5. Matriz de Testes Automatizados

| Suíte de Teste | Comando | Resultados | Status |
|---|---|---|---|
| **Google Ads Tracking & Idempotência** | `node test-google-ads-tracking.mjs` | 7 grupos / 28 asserções | ✅ **PASS** |
| **Lightbox, Touch & Zoom** | `node test-media-lightbox.mjs` | 11 grupos / 30 asserções | ✅ **PASS** |
| **Responsividade Mobile** | `node test-mobile-responsiveness.mjs` | 10 viewports / 28 asserções | ✅ **PASS** |
| **Lead Flow, R2 Storage & Gmail** | `node test-lead-email.mjs` | 137 testes unitários/integração | ✅ **PASS** |
| **Painel Admin & Analytics V2** | `node test-admin-v2.mjs` | 26 testes analíticos | ✅ **PASS** |
| **Compilação Nuxt 4 (Produção)** | `npx nuxi build` | Build concluído em `.output/` | ✅ **PASS** |
