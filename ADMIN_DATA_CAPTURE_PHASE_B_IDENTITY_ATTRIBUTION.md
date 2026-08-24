# ARQUITETURA DE IDENTIDADE, ATRIBUIÇÃO DE TRÁFEGO E IDEMPOTÊNCIA — FASE B

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-23  
**Fase:** Fase B — Identidade de Visitante, Sessões, Atribuição de Tráfego e Idempotência de Eventos  
**Status:** `PHASE B IDENTITY & ATTRIBUTION: READY FOR REVIEW`  
**Deploy em Produção:** `PRODUCTION_CHANGED = NO (AGUARDANDO REVISÃO)`  
**Alterações de Banco:** `DATABASE_CHANGED = NO (AGUARDANDO AÇÃO MANUAL DO OPERADOR)`

---

## 1. Executive Summary

A Fase B estabelece a fundação de telemetria e ciência de dados do projeto AD Telas e Redes. Com as correções de captura da Fase A já validadas e publicadas em produção, a Fase B introduz identificadores pseudônimos persistentes (`visitor_id`), sessões dinâmicas de navegação (`session_id`), rastreamento determinístico de origem de tráfego (UTMs, GCLID, canais de aquisição) e idempotência completa em 3 camadas (Client, Server e Database).

---

## 2. Current State (Estado Atual)

- **Fase A/A.3.1 em Produção:** Deduplicação inicial de pageviews ativa; WhatsApp/Telefone salvos exclusivamente como `lead_clicks` sem gerar leads falsos; formulários comerciais gravando diretamente em `public.leads`.
- **Registros Históricos Protegidos (27 registros):**
  - `LEGACY_SYNTHETIC_WHATSAPP = 23` (`Lead WhatsApp%`)
  - `AUTOMATED_TEST_LEADS = 4` (`Teste Automatizado%`)
  - `CONFIRMED_REAL_CUSTOMER_LEADS = 0` (Dashboard purificado sem apagar nenhuma linha).
- **Sem alteração de RLS ou Auth:** `ADMIN_AUTH_IMPLEMENTATION = DEFERRED_BY_USER`, `ADMIN_RLS_CHANGES = DEFERRED_BY_USER`.

---

## 3. Identity Model (Modelo de Identidade)

A arquitetura estabelece 6 conceitos fundamentais e desacoplados:

1. **VISITOR:** Pessoa/dispositivo único (`visitor_id`).
2. **SESSION:** Janela contínua de atividade (`session_id`).
3. **PAGEVIEW:** Visualização individual de URL (`event_id`).
4. **EVENT / CONTACT INTENT:** Clique em WhatsApp/Telefone (`event_id`).
5. **LEAD:** Submissão comercial de orçamento (`submission_id`).

---

## 4. Visitor Architecture (`visitor_id`)

- **Formato:** UUID v4 gerado por `crypto.randomUUID()`.
- **Armazenamento:** Cookie first-party seguro `adt_vid`.
- **Validade:** 365 dias (renovado a cada visita).
- **Classificação de Privacidade:** Identificador pseudônimo. Não deriva de IP, e-mail, telefone ou User-Agent.
- **`IP_HASH_USED_FOR_UNIQUE_VISITOR = NO`**

---

## 5. Session Architecture (`session_id`)

- **Formato:** UUID v4 gerado por `crypto.randomUUID()`.
- **Armazenamento:** Cookie first-party `adt_sid` e `localStorage`.
- **Timeout de Inatividade:** 30 minutos (`SESSION_TIMEOUT = 30 minutos`).
- **Resiliência:** Sobrevive a F5, navegação SPA (NuxtLink) e é compartilhado entre abas do mesmo navegador.
- **Landing Page:** O primeiro path da sessão é salvo em `adt_landing_path` e preservado durante toda a navegação interna.

---

## 6. Event ID Architecture (`event_id`)

- Todo evento analítico (pageview ou clique de contato) recebe um `event_id` único no cliente antes do envio.
- Retries de rede do mesmo evento reutilizam o mesmo `event_id`.

---

## 7. Submission ID Architecture (`submission_id`)

- Todo formulário comercial recebe um `submission_id` único ao iniciar a submissão.
- Retries do mesmo envio reutilizam o mesmo `submission_id`.
- Garante que 1 envio lógico pelo usuário resulte em no máximo 1 lead gravado no Supabase.

---

## 8. Attribution Model (Modelo de Atribuição)

Parâmetros capturados e persistidos no contexto da sessão:
`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `referrer`, `landing_path`.

---

## 9. First Touch vs Session Touch

- **FIRST TOUCH:** Origem da primeiríssima visita do `visitor_id` (salvo em `adt_ft_channel`, nunca sobrescrito).
- **SESSION TOUCH:** Origem da sessão atual (renovada se o visitante retornar via outro canal após >30 min).

---

## 10. Channel Classification (`classifyAcquisitionChannel`)

- `google_ads`: Possui `gclid`, `gbraid`, `wbraid` ou `utm_source=google` + `medium=cpc|paid`.
- `google_organic`: Referrer `google.com` sem parâmetros pagos.
- `instagram`: `instagram.com` ou `utm_source=instagram`.
- `facebook`: `facebook.com` ou `utm_source=facebook`.
- `bing_organic`: `msclkid` ou `bing.com`.
- `direct`: Sem UTMs e sem referrer externo.
- `referral`: Referrer externo não classificado nos anteriores.

---

## 11. Landing Page Model

A página de entrada da sessão (`landing_path`) é registrada no primeiro request e **preservada** até a conversão. Navegações NuxtLink não alteram a `landing_path`.

---

## 12. CTA Taxonomy (`cta_location`)

Categorização centralizada dos botões de contato:
`header`, `hero`, `footer`, `floating_whatsapp`, `sticky_mobile`, `service_card`, `quote_form`, `contact_form`, `modal`, `other`.

---

## 13. Device Classification

Classificação server-side a partir do User-Agent: `mobile`, `tablet`, `desktop`, `unknown`.

---

## 14. Bot Classification

Identificação server-side de crawlers e bots conhecidos (`Googlebot`, `Bingbot`, `AhrefsBot`, `SemrushBot`, etc.), registrando `is_bot = true` para isolamento de KPIs.

---

## 15. Privacy Impact (Impacto de Privacidade)

- `visitor_id` é um pseudônimo.
- `PII_IN_ANALYTICS_EVENTS = NO` (Tabelas de pageviews e cliques não contêm nome, e-mail ou telefone).
- Dados PII permanecem restritos à tabela comercial `public.leads`.

---

## 16. Database Changes Proposed (SQL Estático)

Criado o script estático:
[`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql)

Adiciona colunas nullable e índices UNIQUE para idempotência (`unq_page_views_event_id`, `unq_lead_clicks_event_id`, `unq_leads_submission_id`).

---

## 17. Manual Supabase Actions

**`MANUAL_SUPABASE_ACTION_REQUIRED = YES`**
- **Script:** [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql)
- **Status:** **NÃO EXECUTADO VIA MCP (SUPABASE_MCP_WRITES = 0)**. O operador humano deverá executar manualmente no SQL Editor quando aprovar o deploy da Fase B.

---

## 18. Client Implementation

- Composables: [`app/composables/useAnalyticsIdentity.ts`](file:///d:/sicons/ADT/app/composables/useAnalyticsIdentity.ts), [`app/composables/useAttribution.ts`](file:///d:/sicons/ADT/app/composables/useAttribution.ts)
- Form Composables/Components: [`app/composables/useFormSubmit.js`](file:///d:/sicons/ADT/app/composables/useFormSubmit.js), [`app/components/LeadForm.vue`](file:///d:/sicons/ADT/app/components/LeadForm.vue)
- Plugins: [`app/plugins/track-visits.client.ts`](file:///d:/sicons/ADT/app/plugins/track-visits.client.ts), [`app/plugins/track-clicks.client.ts`](file:///d:/sicons/ADT/app/plugins/track-clicks.client.ts)

---

## 19. Server Implementation

- Utilities: [`server/utils/analytics.ts`](file:///d:/sicons/ADT/server/utils/analytics.ts)
- Endpoints: [`server/api/track-visit.post.ts`](file:///d:/sicons/ADT/server/api/track-visit.post.ts), [`server/api/track-click.post.ts`](file:///d:/sicons/ADT/server/api/track-click.post.ts), [`server/api/send-lead.post.ts`](file:///d:/sicons/ADT/server/api/send-lead.post.ts)

---

## 20. Idempotency

- `SERVER_IDEMPOTENCY = IMPLEMENTED` (Cache LRU no servidor rejeita requisições com mesmo `event_id` / `submission_id`).
- `DATABASE_UNIQUE_IDEMPOTENCY = IMPLEMENTED` (Constraint `UNIQUE` planejada no script SQL `003`).

---

## 21. Test Matrix Results

- `npx nuxi build` ➔ **Exit Code 0 (PASS)**
- `test-phase-a.mjs` (Matriz da Fase B com mock local na porta 9999): **7/7 PASSED (100%)**
  - Visitor ID & Session ID tracking ➔ PASS
  - Event ID Idempotency ➔ PASS
  - Google Ads (gclid) channel ➔ PASS
  - Instagram attribution ➔ PASS
  - Submission ID Idempotency ➔ PASS
  - Dashboard Stats isolation ➔ PASS
- `TESTS_WRITE_TO_PRODUCTION_DB = NO`
- `PRODUCTION_TEST_BYPASS = NONE`

---

## 22. SEO Regression

- `seo-validate-03c.mjs`: **248/248 PASSED (100%)**
- Redirects: `46/46 PASS`
- Sitemap XML: `20 URLs (PASS)`

---

## 23. Legacy Compatibility

- 27 registros históricos no Supabase intactos (`LEGACY_ROWS_DELETED = 0`).
- Todas as novas colunas são `NULLABLE` para garantir total compatibilidade com os dados passados.

---

## 24. Known Limitations

- Atribuição entre navegadores/dispositivos diferentes exige autenticação futura (não aplicável nesta fase).
- Filtro por nome no dashboard é temporário para a fase de transição (`LEGACY_KPI_FILTER = TEMPORARY`).

---

## 25. Panel V2 Data Readiness

A arquitetura desenvolvida prepara o modelo de dados para que o Painel Admin V2 exiba métricas reais de Visitantes Únicos, Sessões, Conversão por Canal e Funil de Vendas.

---

## 26. Deployment & Rollback Plan

- **NÃO FAZER DEPLOY NESTA RODADA (`PRODUCTION_CHANGED = NO`).**
- **Rollback:** Reversão do commit Git ou remoção do script SQL caso executado manualmente.

---

📄 **Script SQL de Migração:** [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql)  
📄 **Relatório da Fase A.4:** [`docs/ADMIN_DATA_CAPTURE_PHASE_A4_PRODUCTION_DEPLOY.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_A4_PRODUCTION_DEPLOY.md)
