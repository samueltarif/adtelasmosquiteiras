-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE VIA MCP)
-- ======================================================================
-- Projeto: AD Telas e Redes — adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/003_phase_b_identity_attribution_idempotency.sql
-- Finalidade: Estruturar tabelas para Identidade (Visitor ID, Session ID), Atribuição (UTMs, GCLID, Channel) e Idempotência (event_id, submission_id).
-- Pré-requisitos: Executar no SQL Editor do projeto Supabase correto.
-- Riscos: Baixo (criação de colunas TEXT nullable sem defaults forçados para preservar integridade histórica).
-- Status: FINAL_REVIEW_NOT_EXECUTED (Aguardando instrução manual do operador).
-- Baseline Confirmado: 28 registros em public.leads (23 sintéticos legados + 4 testes automatizados + 1 teste manual).
-- ======================================================================

-- ======================================================================
-- 1. PRE-CHECK (VERIFICAÇÃO DE SEGURANÇA E CONTAGEM LEITURA)
-- ======================================================================
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('page_views', 'lead_clicks', 'leads')
ORDER BY table_name, ordinal_position;

SELECT 
  (SELECT COUNT(*) FROM public.page_views) AS total_page_views,
  (SELECT COUNT(*) FROM public.lead_clicks) AS total_lead_clicks,
  (SELECT COUNT(*) FROM public.leads) AS total_leads; -- Esperado: 28


-- ======================================================================
-- 2. MIGRATION TRANSACTIONAL (BEGIN ... COMMIT)
-- ======================================================================
BEGIN;

-- A. Tabela 'page_views' (Visualizações de Páginas)
-- Nota: session_id (varchar) e referrer (text) já existem no schema real.
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS event_id VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS landing_path TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS gclid TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS gbraid TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS wbraid TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS fbclid TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS msclkid TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS is_bot BOOLEAN;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS bot_name VARCHAR(100);

-- ÍNDICES EM 'page_views' (Criados após a adição comprovada das colunas)
CREATE UNIQUE INDEX IF NOT EXISTS unq_page_views_event_id ON public.page_views(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);


-- B. Tabela 'lead_clicks' (Cliques em WhatsApp / Telefone / CTAs)
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS event_id VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS landing_path TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS cta_location VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS gclid TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS gbraid TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS wbraid TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS fbclid TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS msclkid TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS is_bot BOOLEAN;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS bot_name VARCHAR(100);

-- ÍNDICES EM 'lead_clicks' (Criados após a adição comprovada das colunas)
CREATE UNIQUE INDEX IF NOT EXISTS unq_lead_clicks_event_id ON public.lead_clicks(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_clicks_visitor_id ON public.lead_clicks(visitor_id);
CREATE INDEX IF NOT EXISTS idx_lead_clicks_session_id ON public.lead_clicks(session_id);


-- C. Tabela 'leads' (Formulários Comerciais Enviados)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS submission_id VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS landing_path TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS conversion_path TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS session_channel TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gclid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gbraid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS wbraid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fbclid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS msclkid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Atribuição First Touch Completa em 'leads'
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_channel TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_landing_path TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_referrer TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_utm_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_utm_medium TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_utm_campaign TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_utm_content TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_utm_term TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_gclid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_gbraid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_wbraid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_fbclid TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_msclkid TEXT;

-- ÍNDICES EM 'leads' (Criados após a adição comprovada das colunas)
CREATE UNIQUE INDEX IF NOT EXISTS unq_leads_submission_id ON public.leads(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_visitor_id ON public.leads(visitor_id);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON public.leads(session_id);

COMMIT;


-- ======================================================================
-- 3. POST-CHECK COMPLETO (VERIFICAÇÃO DE INTEGRIDADE E CONTAGEM DE LEADS)
-- ======================================================================
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('page_views', 'lead_clicks', 'leads')
  AND column_name IN ('event_id', 'submission_id', 'visitor_id', 'session_id', 'session_channel', 'first_touch_channel', 'landing_path', 'gclid')
ORDER BY table_name, column_name;

SELECT 
  indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'unq_page_views_event_id', 'idx_page_views_visitor_id', 'idx_page_views_session_id',
    'unq_lead_clicks_event_id', 'idx_lead_clicks_visitor_id', 'idx_lead_clicks_session_id',
    'unq_leads_submission_id', 'idx_leads_visitor_id', 'idx_leads_session_id'
  );

-- Garantia de Preservação dos 28 registros históricos de leads
SELECT COUNT(*) AS final_leads_count FROM public.leads; -- Resultado Esperado: 28


-- ======================================================================
-- 4. ROLLBACK SIMÉTRICO COMPLETO (REMOVER APENAS O QUE FOI ADICIONADO)
-- ======================================================================
/*
BEGIN;

-- Dropar os ÍNDICES Criados na Migration 003
DROP INDEX IF EXISTS public.unq_page_views_event_id;
DROP INDEX IF EXISTS public.idx_page_views_visitor_id;
DROP INDEX IF EXISTS public.idx_page_views_session_id;

DROP INDEX IF EXISTS public.unq_lead_clicks_event_id;
DROP INDEX IF EXISTS public.idx_lead_clicks_visitor_id;
DROP INDEX IF EXISTS public.idx_lead_clicks_session_id;

DROP INDEX IF EXISTS public.unq_leads_submission_id;
DROP INDEX IF EXISTS public.idx_leads_visitor_id;
DROP INDEX IF EXISTS public.idx_leads_session_id;

-- Dropar as COLUNAS Adicionadas na Migration 003 (Não remove page_views.session_id nem page_views.referrer)
ALTER TABLE public.page_views 
  DROP COLUMN IF EXISTS event_id,
  DROP COLUMN IF EXISTS visitor_id,
  DROP COLUMN IF EXISTS landing_path,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS gclid,
  DROP COLUMN IF EXISTS gbraid,
  DROP COLUMN IF EXISTS wbraid,
  DROP COLUMN IF EXISTS fbclid,
  DROP COLUMN IF EXISTS msclkid,
  DROP COLUMN IF EXISTS channel,
  DROP COLUMN IF EXISTS device_type,
  DROP COLUMN IF EXISTS is_bot,
  DROP COLUMN IF EXISTS bot_name;

ALTER TABLE public.lead_clicks 
  DROP COLUMN IF EXISTS event_id,
  DROP COLUMN IF EXISTS visitor_id,
  DROP COLUMN IF EXISTS session_id,
  DROP COLUMN IF EXISTS landing_path,
  DROP COLUMN IF EXISTS cta_location,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS gclid,
  DROP COLUMN IF EXISTS gbraid,
  DROP COLUMN IF EXISTS wbraid,
  DROP COLUMN IF EXISTS fbclid,
  DROP COLUMN IF EXISTS msclkid,
  DROP COLUMN IF EXISTS referrer,
  DROP COLUMN IF EXISTS channel,
  DROP COLUMN IF EXISTS device_type,
  DROP COLUMN IF EXISTS is_bot,
  DROP COLUMN IF EXISTS bot_name;

ALTER TABLE public.leads 
  DROP COLUMN IF EXISTS submission_id,
  DROP COLUMN IF EXISTS visitor_id,
  DROP COLUMN IF EXISTS session_id,
  DROP COLUMN IF EXISTS landing_path,
  DROP COLUMN IF EXISTS conversion_path,
  DROP COLUMN IF EXISTS session_channel,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS gclid,
  DROP COLUMN IF EXISTS gbraid,
  DROP COLUMN IF EXISTS wbraid,
  DROP COLUMN IF EXISTS fbclid,
  DROP COLUMN IF EXISTS msclkid,
  DROP COLUMN IF EXISTS referrer,
  DROP COLUMN IF EXISTS first_touch_channel,
  DROP COLUMN IF EXISTS first_touch_landing_path,
  DROP COLUMN IF EXISTS first_touch_referrer,
  DROP COLUMN IF EXISTS first_touch_utm_source,
  DROP COLUMN IF EXISTS first_touch_utm_medium,
  DROP COLUMN IF EXISTS first_touch_utm_campaign,
  DROP COLUMN IF EXISTS first_touch_utm_content,
  DROP COLUMN IF EXISTS first_touch_utm_term,
  DROP COLUMN IF EXISTS first_touch_gclid,
  DROP COLUMN IF EXISTS first_touch_gbraid,
  DROP COLUMN IF EXISTS first_touch_wbraid,
  DROP COLUMN IF EXISTS first_touch_fbclid,
  DROP COLUMN IF EXISTS first_touch_msclkid;

COMMIT;
*/
