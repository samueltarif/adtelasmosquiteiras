# ARQUITETURA DE IDENTIDADE, ATRIBUIÇÃO DE TRÁFEGO E IDEMPOTÊNCIA — FASE B & FASE B.1

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-23  
**Fase:** Fase B.1 — Reconciliação do Schema Real e Correção da Migration 003  
**Status:** `PHASE B.1 SCHEMA RECONCILIATION: READY FOR REVIEW`  
**Deploy em Produção:** `PRODUCTION_CHANGED = NO (NÃO DEPLOYADO)`  
**Alterações de Banco:** `DATABASE_CHANGED = NO (AGUARDANDO AÇÃO MANUAL)`

---

## 1. Executive Summary & Reconciliação do Schema Real

Na Fase B.1, o schema REAL das tabelas do Supabase foi confirmado manualmente pelo operador através da consulta à `information_schema.columns`. O script de migração [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql) foi totalmente corrigido para adicionar previamente todas as colunas necessárias antes da criação dos índices únicos de idempotência, e todos os valores padrão (`DEFAULT`) que forçavam suposições semânticas em registros históricos foram removidos.

---

## 2. Schema Real Confirmado no Supabase

### A. Tabela `public.lead_clicks` (7 colunas originais existentes):
- `id` (`uuid`), `created_at` (`timestamptz`), `tipo` (`varchar`), `origem` (`varchar`), `url_origem` (`text`), `user_agent` (`text`), `ip_hash` (`varchar`).

### B. Tabela `public.leads` (13 colunas originais existentes):
- `id` (`uuid`), `created_at` (`timestamptz`), `nome` (`varchar`), `cidade` (`varchar`), `bairro` (`varchar`), `servico` (`varchar`), `telefone` (`varchar`), `email` (`varchar`), `mensagem` (`text`), `origem` (`varchar`), `status` (`varchar`), `valor_orcamento` (`numeric`), `observacoes` (`text`).

### C. Tabela `public.page_views` (7 colunas originais existentes):
- `id` (`uuid`), `created_at` (`timestamptz`), `path` (`varchar`), `referrer` (`text`), `user_agent` (`text`), `ip_hash` (`varchar`), **`session_id` (`varchar`)**.
- *Nota Crítica:* A coluna `session_id` já existia previamente no schema de `page_views`.

---

## 3. Correções Aplicadas no Script SQL `003`

1. **Ordenação de Execução DDL:** Todas as colunas são criadas via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` **antes** da execução de `CREATE INDEX`.
2. **Remoção de Defaults Semânticos:** Removidos `DEFAULT 'direct'`, `DEFAULT false`, `DEFAULT 'unknown'`, `DEFAULT 'other'`. Colunas analíticas novas são `NULLABLE` sem default, preservando registros históricos com o valor `NULL` (Significando *Não Rastreado Historicamente*).
3. **Compatibilidade dos Identificadores:** `visitor_id`, `session_id`, `event_id`, `submission_id` utilizam o tipo `VARCHAR(100)`.
4. **Idempotência por Unique Partial Indexes:** Índices `UNIQUE PARTIAL` (`WHERE event_id IS NOT NULL` e `WHERE submission_id IS NOT NULL`) ignoram linhas históricas `NULL`.
5. **Rollback Simétrico Completo:** O bloco de rollback remove exclusivamente as colunas e índices adicionados pela migração `003`, preservando colunas históricas como `page_views.session_id` e `page_views.referrer`.

---

## 4. Lista Exata das Colunas a Serem Adicionadas por Tabela

### `public.page_views`:
`event_id`, `visitor_id`, `landing_path`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `channel`, `device_type`, `is_bot`, `bot_name`.

### `public.lead_clicks`:
`event_id`, `visitor_id`, `session_id`, `landing_path`, `cta_location`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `referrer`, `channel`, `device_type`, `is_bot`, `bot_name`.

### `public.leads`:
`submission_id`, `visitor_id`, `session_id`, `landing_path`, `conversion_path`, `first_touch_channel`, `session_channel`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `referrer`.

---

## 5. Lista Exata dos Índices a Serem Criados

1. `unq_page_views_event_id` (UNIQUE PARTIAL em `page_views(event_id) WHERE event_id IS NOT NULL`)
2. `idx_page_views_visitor_id` (Índice em `page_views(visitor_id)`)
3. `idx_page_views_session_id` (Índice em `page_views(session_id)`)
4. `unq_lead_clicks_event_id` (UNIQUE PARTIAL em `lead_clicks(event_id) WHERE event_id IS NOT NULL`)
5. `idx_lead_clicks_visitor_id` (Índice em `lead_clicks(visitor_id)`)
6. `idx_lead_clicks_session_id` (Índice em `lead_clicks(session_id)`)
7. `unq_leads_submission_id` (UNIQUE PARTIAL em `leads(submission_id) WHERE submission_id IS NOT NULL`)
8. `idx_leads_visitor_id` (Índice em `leads(visitor_id)`)
9. `idx_leads_session_id` (Índice em `leads(session_id)`)

---

## 6. Declaração de Ação Manual do Operador

**`MANUAL_SUPABASE_ACTION_REQUIRED = YES`**  
- **Script a ser executado:** [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql)  
- **Status Atual:** **NÃO EXECUTADO VIA MCP (`SUPABASE_MCP_WRITES = 0`)**. O operador humano deverá copiar e colar este script no SQL Editor do Supabase oficial quando aprovar o deploy da Fase B.1.

---

## 7. Resultados do Pre-Deploy Gate & Testes

- **`npx nuxi build`:** **Exit Code 0 (PASS)**
- **Matriz de Testes da Fase B.1 (`test-phase-a.mjs`):** **7/7 PASSED (100%)**
- **Suíte de Integridade SEO (`seo-validate-03c.mjs`):** **248/248 PASSED (100%)**
- **Redirects SEO:** `46/46 PASS`

---

📄 **Script SQL Corrigido de Migração:** [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql)  
📄 **Relatório de Deploy da Fase A.4:** [`docs/ADMIN_DATA_CAPTURE_PHASE_A4_PRODUCTION_DEPLOY.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_A4_PRODUCTION_DEPLOY.md)
