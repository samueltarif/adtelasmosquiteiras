-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE VIA MCP)
-- ======================================================================
-- Projeto: AD Telas e Redes — adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/004_cta_service_tracking.sql
-- Finalidade: Adicionar suporte a service_key e service_name na tabela public.lead_clicks para atribuição detalhada de cliques por serviço.
-- Pré-requisitos: Executar no SQL Editor do projeto Supabase correto.
-- Riscos: Baixo (criação de colunas nullable sem defaults forçados para preservar integridade histórica).
-- Status: FINAL_REVIEW_NOT_EXECUTED (Aguardando instrução manual do operador).
-- ======================================================================

-- ======================================================================
-- 1. PRE-CHECK (VERIFICAÇÃO DE SEGURANÇA E ESTRUTURA ATUAL DE LEAD_CLICKS)
-- ======================================================================
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lead_clicks'
ORDER BY ordinal_position;

SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'lead_clicks';

SELECT COUNT(*) AS total_lead_clicks_before FROM public.lead_clicks;


-- ======================================================================
-- 2. MIGRATION TRANSACTIONAL (BEGIN ... COMMIT)
-- ======================================================================
BEGIN;

-- Adicionar colunas de taxonomia de serviço em 'lead_clicks'
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS service_key VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS service_name TEXT;

-- Índice para consultas de rankings e relatórios por serviço
CREATE INDEX IF NOT EXISTS idx_lead_clicks_service_key ON public.lead_clicks(service_key);

COMMIT;


-- ======================================================================
-- 3. POST-CHECK (VERIFICAÇÃO DE INTEGRIDADE PÓS-MIGRATION)
-- ======================================================================
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lead_clicks'
  AND column_name IN ('service_key', 'service_name', 'cta_location', 'visitor_id', 'session_id');

SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname = 'idx_lead_clicks_service_key';

SELECT COUNT(*) AS total_lead_clicks_after FROM public.lead_clicks;


-- ======================================================================
-- 4. ROLLBACK SIMÉTRICO COMPLETO (EXECUTAR APENAS EM CASO DE EMERGÊNCIA)
-- ======================================================================
/*
BEGIN;

DROP INDEX IF EXISTS public.idx_lead_clicks_service_key;

ALTER TABLE public.lead_clicks 
  DROP COLUMN IF EXISTS service_key,
  DROP COLUMN IF EXISTS service_name;

COMMIT;
*/
