-- =====================================================================
-- FASE 4.1B.5 — POST-MIGRATION VERIFICATION (ESTRITAMENTE READ-ONLY)
-- ARQUIVO: scripts/production_post_migration_verification_read_only.sql
-- 
-- ESTE SCRIPT CONTÉM EXCLUSIVAMENTE CONSULTAS SELECT.
-- EXECUTE NO SUPABASE SQL EDITOR APÓS A EXECUÇÃO DA MIGRATION 011.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VERIFICAÇÃO DE TABELAS E COLUNAS CRIADAS PELA MIGRATION 011
-- ---------------------------------------------------------------------
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'work_order_proposals'
    ) AS work_order_proposals_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'accepted_proposal_id'
    ) AS accepted_proposal_id_exists,
    EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_work_orders_accepted_proposal' 
          AND conrelid = 'public.work_orders'::regclass
    ) AS accepted_proposal_fk_exists;

-- ---------------------------------------------------------------------
-- 2. VERIFICAÇÃO DOS 3 ÍNDICES PARCIAIS DE UNICIDADE
-- ---------------------------------------------------------------------
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'work_order_proposals'
  AND indexname IN ('unq_proposals_one_issued', 'unq_proposals_one_accepted', 'unq_proposals_one_reserved')
ORDER BY indexname;

-- ---------------------------------------------------------------------
-- 3. VERIFICAÇÃO DE RLS E TRIGGERS DE SEGURANÇA
-- ---------------------------------------------------------------------
SELECT 
    (
        SELECT rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'work_order_proposals'
    ) AS proposal_rls_enabled,
    (
        SELECT count(*) 
        FROM pg_trigger tg 
        JOIN pg_class c ON c.oid = tg.tgrelid 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
          AND c.relname = 'work_order_proposals'
          AND tg.tgname IN ('trg_prevent_proposal_content_mutation', 'trg_prevent_proposal_delete')
    ) AS proposal_trigger_count;

-- ---------------------------------------------------------------------
-- 4. VERIFICAÇÃO DAS 4 RPCs ATÔMICAS DA MIGRATION 011
-- ---------------------------------------------------------------------
SELECT 
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace 
WHERE n.nspname = 'public' 
  AND p.proname IN (
      'reserve_work_order_proposal_atomic',
      'finalize_work_order_proposal_atomic',
      'accept_work_order_proposal_atomic',
      'mark_work_order_proposal_failed_atomic'
  )
ORDER BY p.proname;

-- ---------------------------------------------------------------------
-- 5. VERIFICAÇÃO DAS CONSTRAINTS DE CRM_ACTIVITY_LOG (NOVOS EVENTOS)
-- ---------------------------------------------------------------------
SELECT 
    conname, 
    pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint 
WHERE conrelid = 'public.crm_activity_log'::regclass 
  AND conname IN ('chk_activity_log_entity', 'chk_activity_log_acao')
ORDER BY conname;

-- ---------------------------------------------------------------------
-- 6. ZERO CRIAÇÃO AUTOMÁTICA DE DADOS (CONTAGEM DE PROPOSTAS)
-- ---------------------------------------------------------------------
SELECT 
    count(*) AS work_order_proposals_row_count
FROM public.work_order_proposals;

-- ---------------------------------------------------------------------
-- 7. PRESERVAÇÃO INTEGRAL DAS WORK ORDERS E STATUS EXISTENTES
-- ---------------------------------------------------------------------
SELECT 
    status_os, 
    count(*) AS count_os
FROM public.work_orders 
GROUP BY status_os 
ORDER BY status_os;

-- ---------------------------------------------------------------------
-- 8. RESULTADO CONSOLIDADO EM FORMATO JSON
-- ---------------------------------------------------------------------
SELECT json_build_object(
    'work_order_proposals_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_order_proposals'),
    'accepted_proposal_id_exists', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'accepted_proposal_id'),
    'accepted_proposal_fk_exists', EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_work_orders_accepted_proposal' AND conrelid = 'public.work_orders'::regclass),
    'partial_unique_indexes_count', (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'work_order_proposals' AND indexname IN ('unq_proposals_one_issued', 'unq_proposals_one_accepted', 'unq_proposals_one_reserved')),
    'proposal_rls_enabled', (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_order_proposals'),
    'proposal_trigger_count', (SELECT count(*) FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'work_order_proposals' AND tg.tgname IN ('trg_prevent_proposal_content_mutation', 'trg_prevent_proposal_delete')),
    'proposal_rpc_count', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname IN ('reserve_work_order_proposal_atomic', 'finalize_work_order_proposal_atomic', 'accept_work_order_proposal_atomic', 'mark_work_order_proposal_failed_atomic')),
    'chk_entity_has_proposal', (SELECT pg_get_constraintdef(oid) LIKE '%proposal%' FROM pg_constraint WHERE conname = 'chk_activity_log_entity' AND conrelid = 'public.crm_activity_log'::regclass),
    'chk_acao_has_proposal_events', (SELECT pg_get_constraintdef(oid) LIKE '%proposal_issued%' AND pg_get_constraintdef(oid) LIKE '%proposal_accepted%' AND pg_get_constraintdef(oid) LIKE '%proposal_superseded%' FROM pg_constraint WHERE conname = 'chk_activity_log_acao' AND conrelid = 'public.crm_activity_log'::regclass),
    'proposals_row_count', (SELECT count(*) FROM public.work_order_proposals),
    'existing_work_order_count', (SELECT count(*) FROM public.work_orders)
) AS post_migration_verification_result;
