# ARQUITETURA DE IDENTIDADE, ATRIBUIÇÃO DE TRÁFEGO E IDEMPOTÊNCIA — FASE B, B.1 & B.2

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** Fase B.2 — Final Database Migration Hardening  
**Status:** `PHASE B.2 FINAL MIGRATION HARDENING: READY FOR REVIEW`  
**Deploy em Produção:** `PRODUCTION_CHANGED = NO (NÃO DEPLOYADO)`  
**Alterações de Banco:** `DATABASE_CHANGED = NO (AGUARDANDO AÇÃO MANUAL)`

---

## 1. Executive Summary & Baseline Real de 28 Registros

Na Fase B.2, realizou-se o endurecimento final do script de migração [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql). O baseline real do banco de dados em `public.leads` foi atualizado para **28 registros** (devido a 1 teste de validação manual do formulário real em produção).

### Detalhamento do Baseline Real (`TOTAL_LEADS_ROWS = 28`):
- `LEGACY_SYNTHETIC_WHATSAPP`: 23 registros legados
- `AUTOMATED_TEST_LEADS`: 4 registros de testes automatizados
- `MANUAL_VALIDATION_TEST_LEADS`: 1 registro de validação manual de produção
- `CONFIRMED_REAL_CUSTOMER_LEADS`: 0 registros comerciais de clientes reais
- `LEGACY_ROWS_DELETED`: 0 (Todos os 28 registros permanecem 100% intactos).

---

## 2. Endurecimento dos Tipos de Dados (`TEXT` vs `VARCHAR`)

- **Identificadores Internos String:** `event_id`, `visitor_id`, `session_id`, `submission_id` utilizam `VARCHAR(100)`.
- **Parâmetros de Atribuição Externa (Derivados de Query String / Referrer):** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `referrer`, `landing_path`, `conversion_path`, e todos os campos `first_touch_*` utilizam o tipo **`TEXT`**.
- *Motivo:* URLs externas, UTMs ou IDs de clique longos jamais correm o risco de causar estouro de limite (`string truncation error`) ou impedir a criação de um lead comercial.

---

## 3. Taxonomia de Canais & Prioridade de Anúncios (`microsoft_ads`)

- **Nova Regra de Canais:**
  - `msclkid` presente ➔ `microsoft_ads` (Identificador pago de anúncio vence referrer orgânico do Bing).
  - Referrer `bing.com` sem `msclkid` ➔ `bing_organic`.
  - Identificadores pagos de anúncios (`gclid`, `gbraid`, `wbraid`, `msclkid`, `fbclid`) possuem prioridade sobre referrers orgânicos.

---

## 4. Persistência do Contexto Completo de First Touch em `public.leads`

Para garantir que a campanha de primeira aquisição de um visitante nunca seja perdida quando ele retornar ao site semanas depois via acesso direto ou outro canal, a tabela `public.leads` foi expandida com o contexto `first_touch_*` completo:
- `first_touch_channel`, `first_touch_landing_path`, `first_touch_referrer`, `first_touch_utm_source`, `first_touch_utm_medium`, `first_touch_utm_campaign`, `first_touch_utm_content`, `first_touch_utm_term`, `first_touch_gclid`, `first_touch_gbraid`, `first_touch_wbraid`, `first_touch_fbclid`, `first_touch_msclkid`.
- Gravado no cookie `adt_ft_context` (365 dias) na primeira visita do usuário e enviado para o banco de dados durante a submissão de formulários comerciais.

---

## 5. Estrutura Transacional do Script SQL `003` (`BEGIN; ... COMMIT;`)

As instruções DDL de alteração de schema foram empacotadas dentro de um bloco transacional atômico:
```sql
BEGIN;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS ...;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS ...;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ...;
-- Criar os 9 índices únicos e secundários
COMMIT;
```
O bloco de rollback é simétrico e remove exclusivamente as colunas e índices criados, sem tocar nas 28 linhas históricas de `leads` nem em `page_views.session_id` ou `page_views.referrer`.

---

## 6. Resultados da Matriz de Testes Expandida & SEO

- **`npx nuxi build`:** **Exit Code 0 (PASS)**
- **Matriz de Testes Expandida da Fase B.2 (`test-phase-a.mjs` com mock local na porta 9999):** **20/20 PASSED (100%)**
- **Suíte de Integridade SEO (`seo-validate-03c.mjs`):** **248/248 PASSED (100%)**
- **Redirects SEO:** `46/46 PASS`

---

📄 **Script SQL Corrigido de Migração:** [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql)  
📄 **Relatório de Deploy da Fase A.4:** [`docs/ADMIN_DATA_CAPTURE_PHASE_A4_PRODUCTION_DEPLOY.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_A4_PRODUCTION_DEPLOY.md)
