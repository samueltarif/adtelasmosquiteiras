-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE VIA MCP)
-- ======================================================================
-- Projeto: AD Telas e Redes — adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/003_phase_b_identity_attribution_idempotency.sql
-- Finalidade: Estruturar tabelas para Identidade (Visitor ID, Session ID), Atribuição (UTMs, GCLID, Channel) e Idempotência (event_id, submission_id).
-- Pré-requisitos: Executar no SQL Editor do projeto Supabase correto.
-- Riscos: Baixo (criação de colunas nullable com suporte a registros históricos).
-- Status: NÃO EXECUTADO (Aguardando instrução manual do operador).
-- ======================================================================

-- ======================================================================
-- 1. PRE-CHECK (VERIFICAÇÃO DE SEGURANÇA LEITURA)
-- ======================================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('page_views', 'lead_clicks', 'leads')
ORDER BY table_name, column_name;


-- ======================================================================
-- 2. MIGRATION (ADICIONAR COLUNAS E CONSTRAINTS DE IDEMPOTÊNCIA)
-- ======================================================================

-- A. Tabela 'page_views' (Visualizações de Páginas)
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS event_id VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS landing_path TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS gclid VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS gbraid VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS wbraid VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS fbclid VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS msclkid VARCHAR(100);
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'direct';
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS bot_name VARCHAR(100);

-- Constraint de Idempotência em page_views
CREATE UNIQUE INDEX IF NOT EXISTS unq_page_views_event_id ON public.page_views(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);


-- B. Tabela 'lead_clicks' (Cliques em WhatsApp / Telefone / CTAs)
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS event_id VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS cta_location VARCHAR(100) DEFAULT 'other';
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS landing_path TEXT;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS device_type VARCHAR(20) DEFAULT 'unknown';
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS gclid VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'direct';

-- Constraint de Idempotência em lead_clicks
CREATE UNIQUE INDEX IF NOT EXISTS unq_lead_clicks_event_id ON public.lead_clicks(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_clicks_visitor_id ON public.lead_clicks(visitor_id);
CREATE INDEX IF NOT EXISTS idx_lead_clicks_session_id ON public.lead_clicks(session_id);


-- C. Tabela 'leads' (Formulários Comerciais Enviados)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS submission_id VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS landing_path TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS conversion_path TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'direct';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_channel VARCHAR(50) DEFAULT 'direct';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gclid VARCHAR(100);

-- Constraint de Idempotência em leads (Impede 2ª inserção da mesma submissão lógica)
CREATE UNIQUE INDEX IF NOT EXISTS unq_leads_submission_id ON public.leads(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_visitor_id ON public.leads(visitor_id);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON public.leads(session_id);


-- ======================================================================
-- 3. POST-CHECK (VERIFICAÇÃO PÓS-MIGRATION)
-- ======================================================================
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('page_views', 'lead_clicks', 'leads')
  AND column_name IN ('event_id', 'submission_id', 'visitor_id', 'session_id', 'channel', 'landing_path', 'gclid')
ORDER BY table_name, column_name;


-- ======================================================================
-- 4. ROLLBACK (EM CASO DE NECESSIDADE DE REVERSÃO)
-- ======================================================================
/*
DROP INDEX IF EXISTS public.unq_page_views_event_id;
DROP INDEX IF EXISTS public.idx_page_views_visitor_id;
DROP INDEX IF EXISTS public.idx_page_views_session_id;

DROP INDEX IF EXISTS public.unq_lead_clicks_event_id;
DROP INDEX IF EXISTS public.idx_lead_clicks_visitor_id;
DROP INDEX IF EXISTS public.idx_lead_clicks_session_id;

DROP INDEX IF EXISTS public.unq_leads_submission_id;
DROP INDEX IF EXISTS public.idx_leads_visitor_id;
DROP INDEX IF EXISTS public.idx_leads_session_id;

ALTER TABLE public.page_views DROP COLUMN IF EXISTS event_id, DROP COLUMN IF EXISTS landing_path, DROP COLUMN IF EXISTS channel, DROP COLUMN IF EXISTS is_bot, DROP COLUMN IF EXISTS bot_name, DROP COLUMN IF EXISTS gclid;
ALTER TABLE public.lead_clicks DROP COLUMN IF EXISTS event_id, DROP COLUMN IF EXISTS cta_location, DROP COLUMN IF EXISTS landing_path, DROP COLUMN IF EXISTS channel, DROP COLUMN IF EXISTS is_bot, DROP COLUMN IF EXISTS gclid;
ALTER TABLE public.leads DROP COLUMN IF EXISTS submission_id, DROP COLUMN IF EXISTS landing_path, DROP COLUMN IF EXISTS conversion_path, DROP COLUMN IF EXISTS channel, DROP COLUMN IF EXISTS first_touch_channel, DROP COLUMN IF EXISTS gclid;
*/
