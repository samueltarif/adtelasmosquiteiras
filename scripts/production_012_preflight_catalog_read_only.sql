-- =====================================================================
-- FASE 5.0B.3 — PRODUCTION PREFLIGHT CATALOG READ-ONLY (MIGRATION 012)
-- ARQUIVO: scripts/production_012_preflight_catalog_read_only.sql
-- 
-- ESTE SCRIPT CONTÉM EXCLUSIVAMENTE CONSULTAS SELECT.
-- ZERO ESCRITAS / ZERO MUTAÇÕES / ZERO DDL / ZERO DML / ZERO GRANTS.
-- 
-- PROJETO ALVO: axjqhxpejwkuabeaoyaz (AD Telas e Redes - Produção)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VERSÃO DO POSTGRESQL E EXTENSÕES
-- ---------------------------------------------------------------------
SELECT 
    version() AS production_postgres_version_actual,
    current_setting('server_version_num')::int AS server_version_num,
    EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'btree_gist'
    ) AS btree_gist_already_installed;

-- ---------------------------------------------------------------------
-- 2. BASELINE MIGRATION 010 E 011
-- ---------------------------------------------------------------------
SELECT 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_order_proposals') AS proposal_table_exists,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'accepted_proposal_id') AS accepted_proposal_col_exists,
    (
        SELECT count(*) 
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' 
          AND p.proname IN (
              'reserve_work_order_proposal_atomic',
              'finalize_work_order_proposal_atomic',
              'accept_work_order_proposal_atomic',
              'mark_work_order_proposal_failed_atomic'
          )
    ) AS migration_011_rpcs_count,
    (
        SELECT pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conname = 'chk_activity_log_entity' AND conrelid = 'public.crm_activity_log'::regclass
    ) AS chk_activity_log_entity_def,
    (
        SELECT pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conname = 'chk_activity_log_acao' AND conrelid = 'public.crm_activity_log'::regclass
    ) AS chk_activity_log_acao_def;

-- ---------------------------------------------------------------------
-- 3. AUSÊNCIA COMPLETA DE OBJETOS DA MIGRATION 012 EM PRODUÇÃO
-- ---------------------------------------------------------------------
SELECT 
    EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unq_appointments_staff_active_period'
    ) AS unq_staff_active_period_exists,
    EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname = 'unq_active_installation_per_wo'
    ) AS unq_active_installation_per_wo_exists,
    (
        SELECT count(*) 
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' 
          AND p.proname IN (
              'create_appointment_atomic',
              'update_appointment_atomic',
              'reschedule_appointment_atomic',
              'cancel_appointment_atomic',
              'update_appointment_status_atomic',
              'fn_prevent_appointment_hard_delete',
              'fn_prevent_crm_staff_hard_delete',
              'fn_check_crm_staff_deactivation'
          )
    ) AS migration_012_functions_count,
    (
        SELECT count(*) 
        FROM pg_trigger tg 
        JOIN pg_class c ON c.oid = tg.tgrelid 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
          AND tg.tgname IN (
              'trg_prevent_hard_delete_appointments',
              'trg_prevent_hard_delete_crm_staff',
              'trg_check_crm_staff_deactivation'
          )
    ) AS migration_012_triggers_count;

-- ---------------------------------------------------------------------
-- 4. CONSTRAINTS SEMÂNTICAS DE APPOINTMENTS (PG17 CATALOG)
-- ---------------------------------------------------------------------
SELECT 
    c.conname,
    c.contype,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE c.conrelid = 'public.appointments'::regclass
ORDER BY c.conname;

-- ---------------------------------------------------------------------
-- 5. VALIDAÇÃO DE RLS EM TABELAS CORE
-- ---------------------------------------------------------------------
SELECT 
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN ('appointments', 'crm_staff', 'work_orders', 'warranties', 'crm_activity_log')
ORDER BY c.relname;

-- ---------------------------------------------------------------------
-- 6. MATRIZ DE PRIVILÉGIOS ATUAL (BEFORE 012)
-- ---------------------------------------------------------------------
SELECT 
    table_name,
    role_name,
    privilege_type,
    has_table_privilege(role_name, 'public.' || table_name, privilege_type) AS is_granted
FROM (
    VALUES ('appointments'), ('crm_staff')
) AS t(table_name)
CROSS JOIN (
    VALUES ('anon'), ('authenticated'), ('service_role')
) AS r(role_name)
CROSS JOIN (
    VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
) AS p(privilege_type)
ORDER BY table_name, role_name, privilege_type;

-- ---------------------------------------------------------------------
-- 7. AUDITORIA DE DADOS E INTEGRIDADE (READ-ONLY)
-- ---------------------------------------------------------------------
SELECT 
    (SELECT count(*) FROM public.appointments WHERE data_hora_inicio >= data_hora_fim) AS invalid_appointment_interval_count,
    (SELECT count(*) FROM public.appointments a WHERE NOT EXISTS (SELECT 1 FROM public.work_orders w WHERE w.id = a.work_order_id)) AS orphan_work_order_count,
    (SELECT count(*) FROM public.appointments a WHERE a.staff_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.crm_staff s WHERE s.id = a.staff_id)) AS orphan_staff_count,
    (SELECT count(*) FROM public.appointments a JOIN public.work_orders w ON w.id = a.work_order_id WHERE a.client_id IS DISTINCT FROM w.client_id) AS appointment_client_mismatch_count,
    (SELECT count(*) FROM public.appointments a WHERE a.address_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.client_addresses addr WHERE addr.id = a.address_id AND addr.client_id = a.client_id)) AS appointment_address_client_mismatch_count,
    (
        SELECT count(*) 
        FROM public.appointments a1
        JOIN public.appointments a2 ON a1.staff_id = a2.staff_id AND a1.id < a2.id
        WHERE a1.staff_id IS NOT NULL
          AND a1.status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
          AND a2.status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
          AND tstzrange(a1.data_hora_inicio, a1.data_hora_fim, '[)') && tstzrange(a2.data_hora_inicio, a2.data_hora_fim, '[)')
    ) AS existing_active_staff_overlap_count,
    (
        SELECT count(*) 
        FROM (
            SELECT work_order_id, count(*) AS active_inst_count
            FROM public.appointments 
            WHERE tipo_agendamento = 'instalacao' 
              AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
            GROUP BY work_order_id
            HAVING count(*) > 1
        ) active_inst_groups
    ) AS work_orders_with_multiple_active_installations,
    (
        SELECT count(*) 
        FROM public.appointments 
        WHERE tipo_agendamento NOT IN ('visita_tecnica', 'medicao', 'instalacao', 'manutencao', 'garantia')
    ) AS invalid_appointment_type_count,
    (
        SELECT count(*) 
        FROM public.appointments 
        WHERE status_agendamento NOT IN ('agendado', 'confirmado', 'em_deslocamento', 'realizado', 'reagendado', 'cancelado')
    ) AS invalid_appointment_status_count,
    (SELECT count(*) FROM public.admin_users WHERE is_active = true) AS active_admin_count;
