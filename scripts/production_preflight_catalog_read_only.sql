-- =====================================================================
-- FASE 4.1B.4.1 — PRODUCTION CATALOG PREFLIGHT (ESTRITAMENTE READ-ONLY)
-- ARQUIVO: scripts/production_preflight_catalog_read_only.sql
-- 
-- ESTE SCRIPT CONTÉM EXCLUSIVAMENTE CONSULTAS SELECT.
-- ZERO ESCRITAS / ZERO MUTAÇÕES / ZERO DDL / ZERO DML.
-- 
-- PROJETO ALVO ESPERADO: axjqhxpejwkuabeaoyaz (AD Telas - Produção)
-- INSTRUÇÃO: Executar no Supabase SQL Editor em Produção.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VERSÃO DO POSTGRESQL E AUTENTICAÇÃO CANÔNICA
-- ---------------------------------------------------------------------
SELECT 
    version() AS production_postgres_version_actual,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id'
    ) AS auth_users_id_catalog_verified;

-- ---------------------------------------------------------------------
-- 2. AUSÊNCIA COMPLETA DE OBJETOS DA MIGRATION 011 EM PRODUÇÃO
-- ---------------------------------------------------------------------
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'work_order_proposals'
    ) AS proposal_table_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'accepted_proposal_id'
    ) AS accepted_proposal_column_exists,
    (
        SELECT count(*) 
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' 
          AND p.proname IN (
              'reserve_work_order_proposal_atomic',
              'finalize_work_order_proposal_atomic',
              'accept_work_order_proposal_atomic',
              'mark_work_order_proposal_failed_atomic',
              'fn_prevent_proposal_content_mutation',
              'fn_prevent_proposal_delete'
          )
    ) AS migration_011_function_name_count,
    (
        SELECT count(*) 
        FROM pg_trigger tg 
        JOIN pg_class c ON c.oid = tg.tgrelid 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
          AND tg.tgname IN (
              'trg_prevent_proposal_content_mutation',
              'trg_prevent_proposal_delete'
          )
    ) AS migration_011_trigger_count;

-- ---------------------------------------------------------------------
-- 3. AUDITORIA DAS 83 COLUNAS PRÉ-REQUISITO DA MIGRATION 011
-- ---------------------------------------------------------------------
WITH expected_cols AS (
    SELECT * FROM (VALUES
        ('admin_users', 'user_id'),
        ('admin_users', 'is_active'),
        ('work_orders', 'id'),
        ('work_orders', 'numero_os'),
        ('work_orders', 'client_id'),
        ('work_orders', 'address_id'),
        ('work_orders', 'status_os'),
        ('work_orders', 'is_archived'),
        ('work_orders', 'valor_total'),
        ('work_orders', 'valor_desconto'),
        ('work_orders', 'valor_final'),
        ('work_orders', 'updated_at'),
        ('work_orders', 'proposal_issued_at'),
        ('work_orders', 'proposal_valid_until'),
        ('work_order_items', 'id'),
        ('work_order_items', 'work_order_id'),
        ('work_order_items', 'categoria_operacional'),
        ('work_order_items', 'descricao'),
        ('work_order_items', 'quantidade'),
        ('work_order_items', 'preco_unitario'),
        ('work_order_items', 'preco_total'),
        ('work_order_items', 'sort_order'),
        ('work_order_items', 'created_at'),
        ('work_order_measurements', 'id'),
        ('work_order_measurements', 'work_order_item_id'),
        ('work_order_measurements', 'ambiente'),
        ('work_order_measurements', 'tipo_vao'),
        ('work_order_measurements', 'largura_mm'),
        ('work_order_measurements', 'altura_mm'),
        ('work_order_measurements', 'quantidade'),
        ('work_order_measurements', 'cor_estrutura'),
        ('work_order_measurements', 'tipo_material'),
        ('work_order_measurements', 'sort_order'),
        ('work_order_measurements', 'created_at'),
        ('clients', 'id'),
        ('clients', 'tipo_cliente'),
        ('clients', 'nome'),
        ('clients', 'nome_fantasia'),
        ('clients', 'razao_social'),
        ('clients', 'cpf_cnpj'),
        ('clients', 'telefone_principal'),
        ('clients', 'email'),
        ('client_addresses', 'id'),
        ('client_addresses', 'client_id'),
        ('client_addresses', 'rotulo'),
        ('client_addresses', 'tipo_imovel'),
        ('client_addresses', 'cep'),
        ('client_addresses', 'logradouro'),
        ('client_addresses', 'numero'),
        ('client_addresses', 'complemento'),
        ('client_addresses', 'bairro'),
        ('client_addresses', 'cidade'),
        ('client_addresses', 'uf'),
        ('company_profile', 'id'),
        ('company_profile', 'trade_name'),
        ('company_profile', 'legal_name'),
        ('company_profile', 'cnpj'),
        ('company_profile', 'phone_display'),
        ('company_profile', 'whatsapp_number'),
        ('company_profile', 'email_contact'),
        ('company_profile', 'website'),
        ('company_profile', 'cep'),
        ('company_profile', 'street'),
        ('company_profile', 'number'),
        ('company_profile', 'complement'),
        ('company_profile', 'neighborhood'),
        ('company_profile', 'city'),
        ('company_profile', 'state'),
        ('company_profile', 'document_footer_text'),
        ('company_profile', 'logo_source'),
        ('company_profile', 'logo_path'),
        ('company_profile', 'logo_storage_key'),
        ('crm_activity_log', 'client_id'),
        ('crm_activity_log', 'work_order_id'),
        ('crm_activity_log', 'entity_type'),
        ('crm_activity_log', 'entity_id'),
        ('crm_activity_log', 'acao'),
        ('crm_activity_log', 'dados_anteriores'),
        ('crm_activity_log', 'dados_novos'),
        ('crm_activity_log', 'descricao_humana'),
        ('crm_activity_log', 'actor_id'),
        ('crm_activity_log', 'occurred_at')
    ) AS t(tbl, col)
),
matched_cols AS (
    SELECT 
        e.tbl, 
        e.col,
        EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = 'public' 
              AND c.table_name = e.tbl 
              AND c.column_name = e.col
        ) AS is_matched
    FROM expected_cols e
)
SELECT 
    (SELECT count(*) FROM expected_cols) + 1 AS catalog_columns_expected,
    (SELECT count(*) FROM matched_cols WHERE is_matched) + 
    (CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id') THEN 1 ELSE 0 END) AS catalog_columns_matched,
    COALESCE((SELECT string_agg(tbl || '.' || col, ', ') FROM matched_cols WHERE NOT is_matched), 'NONE_0') AS catalog_columns_missing;

-- ---------------------------------------------------------------------
-- 4. CONSTRAINTS CANÔNICAS (UNQ WORK ORDERS + ALLOWLISTS CRM ACTIVITY)
-- ---------------------------------------------------------------------
SELECT 
    c.conname,
    c.conrelid::regclass AS table_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE c.conrelid IN ('public.work_orders'::regclass, 'public.crm_activity_log'::regclass)
  AND c.conname IN ('unq_work_orders_id_client', 'chk_activity_log_entity', 'chk_activity_log_acao')
ORDER BY c.conname;

-- ---------------------------------------------------------------------
-- 5. VALORES DISTINTOS REAIS EM CRM_ACTIVITY_LOG (SERVER-SIDE)
-- ---------------------------------------------------------------------
SELECT 
    (SELECT COALESCE(string_agg(DISTINCT entity_type, ', ' ORDER BY entity_type), 'EMPTY') FROM public.crm_activity_log) AS distinct_entity_types,
    (SELECT COALESCE(string_agg(DISTINCT acao, ', ' ORDER BY acao), 'EMPTY') FROM public.crm_activity_log) AS distinct_actions;

-- ---------------------------------------------------------------------
-- 6. SAÚDE REFERENCIAL E INTEGRIDADE DE DADOS EXISTENTES
-- ---------------------------------------------------------------------
SELECT 
    (SELECT count(*) FROM public.work_orders w WHERE NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = w.client_id)) AS orphan_work_order_client_count,
    (SELECT count(*) FROM public.work_orders w WHERE w.address_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.client_addresses a WHERE a.id = w.address_id AND a.client_id = w.client_id)) AS invalid_work_order_address_relation_count,
    (SELECT count(*) FROM public.work_order_items i WHERE NOT EXISTS (SELECT 1 FROM public.work_orders w WHERE w.id = i.work_order_id)) AS orphan_work_order_item_count,
    (SELECT count(*) FROM public.work_order_measurements m WHERE NOT EXISTS (SELECT 1 FROM public.work_order_items i WHERE i.id = m.work_order_item_id)) AS orphan_measurement_count;

-- ---------------------------------------------------------------------
-- 7. DISTRIBUIÇÃO REAL DE STATUS_OS EM WORK_ORDERS
-- ---------------------------------------------------------------------
SELECT status_os, count(*) AS count_os
FROM public.work_orders 
GROUP BY status_os 
ORDER BY status_os;

-- ---------------------------------------------------------------------
-- 8. SINGLETON DE COMPANY_PROFILE
-- ---------------------------------------------------------------------
SELECT 
    (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile') AS company_profile_col_count,
    (SELECT count(*) FROM public.company_profile WHERE id = 1) AS company_profile_singleton_count;

-- ---------------------------------------------------------------------
-- 9. HISTÓRICO DE MIGRAÇÕES DO SUPABASE (SE HOUVER)
-- ---------------------------------------------------------------------
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
    ) AS schema_migrations_table_exists;

-- ---------------------------------------------------------------------
-- 10. RESULTADO CONSOLIDADO COMPLETO (FORMATO JSON PARA AUDITORIA)
-- ---------------------------------------------------------------------
SELECT json_build_object(
    'postgres_version', version(),
    'auth_users_id_verified', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id'),
    'proposal_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_order_proposals'),
    'accepted_proposal_col_exists', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'accepted_proposal_id'),
    'migration_011_rpcs_count', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname IN ('reserve_work_order_proposal_atomic', 'finalize_work_order_proposal_atomic', 'accept_work_order_proposal_atomic', 'mark_work_order_proposal_failed_atomic')),
    'unq_work_orders_id_client_exists', EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_work_orders_id_client' AND conrelid = 'public.work_orders'::regclass),
    'chk_entity_def', (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'chk_activity_log_entity' AND conrelid = 'public.crm_activity_log'::regclass),
    'chk_acao_def', (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'chk_activity_log_acao' AND conrelid = 'public.crm_activity_log'::regclass),
    'orphan_wo_clients', (SELECT count(*) FROM public.work_orders w WHERE NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = w.client_id)),
    'invalid_wo_addresses', (SELECT count(*) FROM public.work_orders w WHERE w.address_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.client_addresses a WHERE a.id = w.address_id AND a.client_id = w.client_id)),
    'orphan_wo_items', (SELECT count(*) FROM public.work_order_items i WHERE NOT EXISTS (SELECT 1 FROM public.work_orders w WHERE w.id = i.work_order_id)),
    'orphan_measurements', (SELECT count(*) FROM public.work_order_measurements m WHERE NOT EXISTS (SELECT 1 FROM public.work_order_items i WHERE i.id = m.work_order_item_id)),
    'company_profile_singleton_count', (SELECT count(*) FROM public.company_profile WHERE id = 1)
) AS consolidated_preflight_catalog_audit;
