-- ==============================================================================
-- MIGRATION 011: ORÇAMENTOS COMERCIAIS VERSIONADOS, SNAPSHOTS IMUTÁVEIS E AUDITORIA
-- Arquivo: supabase/manual/011_crm_work_order_proposals.sql
-- ==============================================================================
--
-- OBJETIVO:
--   Implementar a infraestrutura transacional de Orçamentos Comerciais (Proposals)
--   com suporte a versionamento sequencial imutável (Rev. 1, Rev. 2, ...), snapshots
--   canônicos congelados na reserva PostgreSQL, auditoria em crm_activity_log,
--   hardening de RLS / privilégios do menor privilégio e 4 RPCs atômicas com locks
--   determinísticos (WORK_ORDER -> PROPOSAL).
--
-- PRINCÍPIOS ARQUITETURAIS RIGOROSOS (Fase 4.1B.2):
--   1. Transação Global Única (BEGIN ... COMMIT) com Preflight Fail-Fast 100% referenciado.
--   2. Emissão em Duas Fases: Reserva DB -> Geração PDF -> Upload R2 -> Finalização DB.
--   3. Validação estrutural canônica e exata da allowlist antiga de crm_activity_log antes do DROP.
--   4. Idempotência precede completamente os gates de estado da OS (is_archived, status_os, expected_updated_at).
--   5. Snapshots canônicos capturados em instrução MVCC única sob lock de OS (Fail-Closed).
--   6. RLS ativa com Zero Acesso do Browser (anon/authenticated revogados).
--   7. Service_role com Menor Privilégio: apenas SELECT direto; mutações exclusivamente por RPCs.
--   8. Imutabilidade permanente do conteúdo da proposta após finalizada ('ready').
--   9. Bloqueio total de DELETE físico (append-only histórico).
--  10. Lease de Reserva Técnica derivado do relógio de parede no momento da reserva (clock_timestamp()).
--  11. Expiração de lease requer reconciliação explícita (sem auto-fail no banco de dados).
--  12. Transição de metadados de aceite restrita estritamente a issued -> accepted.
--  13. issued_by atribuído exclusivamente na finalização oficial (Finalize RPC).
--
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- BLOCO 01: PREFLIGHT FAIL-FAST E DETECÇÃO GLOBAL DE DRIFT
-- ------------------------------------------------------------------------------

DO $$
DECLARE
    v_missing_dep TEXT := '';
    v_entity_def TEXT;
    v_acao_def TEXT;
    v_extracted_entities TEXT[];
    v_sorted_entities TEXT[];
    v_expected_entities TEXT[] := ARRAY['address', 'appointment', 'client', 'media', 'note', 'payment', 'warranty', 'work_order', 'work_order_item']::TEXT[];
    v_extracted_actions TEXT[];
    v_sorted_actions TEXT[];
    v_expected_actions TEXT[] := ARRAY[
        'address_created', 'address_deleted', 'address_updated', 
        'appointment_cancelled', 'appointment_created', 'appointment_rescheduled', 
        'client_archived', 'client_created', 'client_updated', 'converted_from_lead', 
        'media_removed', 'media_uploaded', 'note_added', 
        'payment_cancelled', 'payment_received', 
        'warranty_issued', 'warranty_resolved', 'warranty_triggered', 
        'work_order_cancelled', 'work_order_completed', 'work_order_created', 'work_order_status_changed'
    ]::TEXT[];
BEGIN
    -- 1.1. Verificação de Tabelas de Dependência Pré-requisito
    IF to_regclass('public.work_orders') IS NULL THEN v_missing_dep := v_missing_dep || ' public.work_orders;'; END IF;
    IF to_regclass('public.work_order_items') IS NULL THEN v_missing_dep := v_missing_dep || ' public.work_order_items;'; END IF;
    IF to_regclass('public.work_order_measurements') IS NULL THEN v_missing_dep := v_missing_dep || ' public.work_order_measurements;'; END IF;
    IF to_regclass('public.clients') IS NULL THEN v_missing_dep := v_missing_dep || ' public.clients;'; END IF;
    IF to_regclass('public.client_addresses') IS NULL THEN v_missing_dep := v_missing_dep || ' public.client_addresses;'; END IF;
    IF to_regclass('public.company_profile') IS NULL THEN v_missing_dep := v_missing_dep || ' public.company_profile;'; END IF;
    IF to_regclass('public.admin_users') IS NULL THEN v_missing_dep := v_missing_dep || ' public.admin_users;'; END IF;
    IF to_regclass('public.crm_activity_log') IS NULL THEN v_missing_dep := v_missing_dep || ' public.crm_activity_log;'; END IF;
    IF to_regclass('auth.users') IS NULL THEN v_missing_dep := v_missing_dep || ' auth.users;'; END IF;

    IF v_missing_dep <> '' THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Tabelas de dependência ausentes:%', v_missing_dep;
    END IF;

    -- 1.2. Verificação de 100% das Colunas Referenciadas nas Dependências
    -- public.admin_users (user_id, is_active)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'user_id') THEN
        v_missing_dep := v_missing_dep || ' public.admin_users.user_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active') THEN
        v_missing_dep := v_missing_dep || ' public.admin_users.is_active;';
    END IF;

    -- public.work_orders (id, numero_os, client_id, address_id, status_os, is_archived, valor_total, valor_desconto, valor_final, updated_at, proposal_issued_at, proposal_valid_until)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'numero_os') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.numero_os;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'client_id') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.client_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'address_id') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.address_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'status_os') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.status_os;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'is_archived') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.is_archived;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'valor_total') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.valor_total;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'valor_desconto') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.valor_desconto;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'valor_final') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.valor_final;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'updated_at') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.updated_at;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'proposal_issued_at') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.proposal_issued_at;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'proposal_valid_until') THEN
        v_missing_dep := v_missing_dep || ' public.work_orders.proposal_valid_until;';
    END IF;

    -- public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, preco_total, sort_order, created_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'work_order_id') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.work_order_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'categoria_operacional') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.categoria_operacional;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'descricao') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.descricao;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'quantidade') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.quantidade;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'preco_unitario') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.preco_unitario;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'preco_total') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.preco_total;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'sort_order') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.sort_order;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_items' AND column_name = 'created_at') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_items.created_at;';
    END IF;

    -- public.work_order_measurements (id, work_order_item_id, ambiente, tipo_vao, largura_mm, altura_mm, quantidade, cor_estrutura, tipo_material, sort_order, created_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'work_order_item_id') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.work_order_item_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'ambiente') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.ambiente;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'tipo_vao') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.tipo_vao;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'largura_mm') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.largura_mm;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'altura_mm') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.altura_mm;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'quantidade') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.quantidade;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'cor_estrutura') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.cor_estrutura;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'tipo_material') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.tipo_material;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'sort_order') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.sort_order;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_order_measurements' AND column_name = 'created_at') THEN
        v_missing_dep := v_missing_dep || ' public.work_order_measurements.created_at;';
    END IF;

    -- public.clients (id, tipo_cliente, nome, nome_fantasia, razao_social, cpf_cnpj, telefone_principal, email)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' public.clients.id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'tipo_cliente') THEN
        v_missing_dep := v_missing_dep || ' public.clients.tipo_cliente;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'nome') THEN
        v_missing_dep := v_missing_dep || ' public.clients.nome;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'nome_fantasia') THEN
        v_missing_dep := v_missing_dep || ' public.clients.nome_fantasia;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'razao_social') THEN
        v_missing_dep := v_missing_dep || ' public.clients.razao_social;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'cpf_cnpj') THEN
        v_missing_dep := v_missing_dep || ' public.clients.cpf_cnpj;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'telefone_principal') THEN
        v_missing_dep := v_missing_dep || ' public.clients.telefone_principal;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'email') THEN
        v_missing_dep := v_missing_dep || ' public.clients.email;';
    END IF;

    -- public.client_addresses (id, client_id, rotulo, tipo_imovel, cep, logradouro, numero, complemento, bairro, cidade, uf)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'client_id') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.client_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'rotulo') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.rotulo;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'tipo_imovel') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.tipo_imovel;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'cep') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.cep;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'logradouro') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.logradouro;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'numero') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.numero;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'complemento') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.complemento;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'bairro') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.bairro;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'cidade') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.cidade;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'uf') THEN
        v_missing_dep := v_missing_dep || ' public.client_addresses.uf;';
    END IF;

    -- public.company_profile (id, trade_name, legal_name, cnpj, phone_display, whatsapp_number, email_contact, website, cep, street, number, complement, neighborhood, city, state, document_footer_text, logo_source, logo_path, logo_storage_key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'trade_name') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.trade_name;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'legal_name') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.legal_name;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'cnpj') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.cnpj;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'phone_display') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.phone_display;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'whatsapp_number') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.whatsapp_number;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'email_contact') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.email_contact;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'website') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.website;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'cep') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.cep;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'street') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.street;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'number') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.number;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'complement') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.complement;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'neighborhood') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.neighborhood;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'city') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.city;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'state') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.state;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'document_footer_text') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.document_footer_text;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'logo_source') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.logo_source;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'logo_path') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.logo_path;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profile' AND column_name = 'logo_storage_key') THEN
        v_missing_dep := v_missing_dep || ' public.company_profile.logo_storage_key;';
    END IF;

    -- public.crm_activity_log (client_id, work_order_id, entity_type, entity_id, acao, dados_anteriores, dados_novos, descricao_humana, actor_id, occurred_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'client_id') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.client_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'work_order_id') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.work_order_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'entity_type') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.entity_type;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'entity_id') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.entity_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'acao') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.acao;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'dados_anteriores') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.dados_anteriores;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'dados_novos') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.dados_novos;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'descricao_humana') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.descricao_humana;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'actor_id') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.actor_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_activity_log' AND column_name = 'occurred_at') THEN
        v_missing_dep := v_missing_dep || ' public.crm_activity_log.occurred_at;';
    END IF;

    -- auth.users (id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' auth.users.id;';
    END IF;

    IF v_missing_dep <> '' THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Colunas de dependência ausentes:%', v_missing_dep;
    END IF;

    -- 1.3. Verificação de Constraint Composta de Integridade em work_orders
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unq_work_orders_id_client' AND conrelid = 'public.work_orders'::regclass
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Constraint unq_work_orders_id_client ausente em public.work_orders.';
    END IF;

    -- 1.4. Validação Estrutural e Canônica Exata das Definições Existentes de Constraints em crm_activity_log
    SELECT pg_get_constraintdef(oid) INTO v_entity_def
    FROM pg_constraint
    WHERE conrelid = 'public.crm_activity_log'::regclass AND conname = 'chk_activity_log_entity';

    IF v_entity_def IS NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Constraint chk_activity_log_entity ausente em public.crm_activity_log.';
    END IF;

    SELECT ARRAY(
        SELECT m[1] FROM pg_catalog.regexp_matches(v_entity_def, '''([^'']+)''', 'g') AS m
    ) INTO v_extracted_entities;

    SELECT ARRAY(
        SELECT unnest(v_extracted_entities) ORDER BY 1
    ) INTO v_sorted_entities;

    IF v_sorted_entities IS DISTINCT FROM v_expected_entities THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: CRM_ACTIVITY_CONSTRAINT_DRIFT: Allowlist de chk_activity_log_entity diverge da Migration 010. Extraído: %, Esperado: %', v_sorted_entities, v_expected_entities;
    END IF;

    SELECT pg_get_constraintdef(oid) INTO v_acao_def
    FROM pg_constraint
    WHERE conrelid = 'public.crm_activity_log'::regclass AND conname = 'chk_activity_log_acao';

    IF v_acao_def IS NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Constraint chk_activity_log_acao ausente em public.crm_activity_log.';
    END IF;

    SELECT ARRAY(
        SELECT m[1] FROM pg_catalog.regexp_matches(v_acao_def, '''([^'']+)''', 'g') AS m
    ) INTO v_extracted_actions;

    SELECT ARRAY(
        SELECT unnest(v_extracted_actions) ORDER BY 1
    ) INTO v_sorted_actions;

    IF v_sorted_actions IS DISTINCT FROM v_expected_actions THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: CRM_ACTIVITY_CONSTRAINT_DRIFT: Allowlist de chk_activity_log_acao diverge da Migration 010. Extraído: %, Esperado: %', v_sorted_actions, v_expected_actions;
    END IF;

    -- 1.5. Detecção Estrita de Drift Global de Objetos da Migration 011
    IF to_regclass('public.work_order_proposals') IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Tabela public.work_order_proposals já existe (drift detectado).';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'accepted_proposal_id'
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Coluna public.work_orders.accepted_proposal_id já existe (drift detectado).';
    END IF;

    -- Verificação de funções por nome (independentemente de assinatura/overloads)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'fn_prevent_proposal_content_mutation') THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Função public.fn_prevent_proposal_content_mutation já existe (drift detectado).';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'fn_prevent_proposal_delete') THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Função public.fn_prevent_proposal_delete já existe (drift detectado).';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'reserve_work_order_proposal_atomic') THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: RPC public.reserve_work_order_proposal_atomic já existe (drift detectado).';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'finalize_work_order_proposal_atomic') THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: RPC public.finalize_work_order_proposal_atomic já existe (drift detectado).';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'accept_work_order_proposal_atomic') THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: RPC public.accept_work_order_proposal_atomic já existe (drift detectado).';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'mark_work_order_proposal_failed_atomic') THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: RPC public.mark_work_order_proposal_failed_atomic já existe (drift detectado).';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- BLOCO 02: EXPANSÃO DE CONSTRAINTS EM public.crm_activity_log
-- ------------------------------------------------------------------------------

-- Expande entity_type para suportar 'proposal' preservando integralmente os 9 tipos existentes
ALTER TABLE public.crm_activity_log
    DROP CONSTRAINT chk_activity_log_entity;

ALTER TABLE public.crm_activity_log
    ADD CONSTRAINT chk_activity_log_entity CHECK (
        entity_type IN (
            'client', 'address', 'work_order', 'work_order_item', 
            'appointment', 'payment', 'warranty', 'media', 'note', 
            'proposal'
        )
    );

-- Expande acao para suportar ações de proposta preservando integralmente as 22 ações existentes
ALTER TABLE public.crm_activity_log
    DROP CONSTRAINT chk_activity_log_acao;

ALTER TABLE public.crm_activity_log
    ADD CONSTRAINT chk_activity_log_acao CHECK (
        acao IN (
            'client_created', 'converted_from_lead', 'client_updated', 'client_archived',
            'address_created', 'address_updated', 'address_deleted',
            'work_order_created', 'work_order_status_changed', 'work_order_completed', 'work_order_cancelled',
            'payment_received', 'payment_cancelled',
            'appointment_created', 'appointment_rescheduled', 'appointment_cancelled',
            'warranty_issued', 'warranty_triggered', 'warranty_resolved',
            'media_uploaded', 'media_removed',
            'note_added',
            'proposal_issued', 'proposal_accepted', 'proposal_superseded'
        )
    );

-- ------------------------------------------------------------------------------
-- BLOCO 03: CRIAÇÃO DA TABELA public.work_order_proposals
-- ------------------------------------------------------------------------------

CREATE TABLE public.work_order_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    client_id UUID NOT NULL,
    version_number INT NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    idempotency_request_sha256 VARCHAR(64) NOT NULL,
    
    -- Estados: Técnico (generation_status) e Comercial (status)
    -- Durante reserva/falha, status comercial é estritamente NULL
    generation_status VARCHAR(20) NOT NULL DEFAULT 'reserved', -- 'reserved', 'ready', 'failed'
    status VARCHAR(20) NULL,                                   -- NULL (em reserva/falha) ou 'issued', 'superseded', 'accepted'
    
    -- Snapshots Canônicos Imutáveis Capturados na Reserva PostgreSQL
    company_snapshot JSONB NOT NULL,
    client_snapshot JSONB NOT NULL,
    address_snapshot JSONB NULL,
    items_snapshot JSONB NOT NULL,
    totals_snapshot JSONB NOT NULL,
    commercial_terms JSONB NOT NULL,
    
    -- Metadados de Storage R2 Privado e Integridade (Preenchidos na Finalização)
    pdf_storage_key VARCHAR(255) NULL,
    pdf_sha256 VARCHAR(64) NULL,
    pdf_size_bytes BIGINT NULL,
    
    -- Lease de Reserva Técnica para Tratamento de Falhas/Processos Mortos (Exclusivo de 'reserved')
    reservation_expires_at TIMESTAMPTZ NULL,
    
    -- Datas e Auditoria
    issued_at TIMESTAMPTZ NULL,
    valid_until DATE NOT NULL,
    issued_by UUID NULL,
    accepted_at TIMESTAMPTZ NULL,
    accepted_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints de Domínio e Validação de Formato
    CONSTRAINT chk_proposals_version CHECK (version_number >= 1),
    CONSTRAINT chk_proposals_gen_status CHECK (generation_status IN ('reserved', 'ready', 'failed')),
    CONSTRAINT chk_proposals_status CHECK (status IS NULL OR status IN ('issued', 'superseded', 'accepted')),
    CONSTRAINT chk_proposals_pdf_size CHECK (pdf_size_bytes IS NULL OR pdf_size_bytes > 0),
    CONSTRAINT chk_proposals_pdf_sha CHECK (pdf_sha256 IS NULL OR pdf_sha256 ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_proposals_idempotency_sha CHECK (idempotency_request_sha256 ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_proposals_company_snapshot CHECK (jsonb_typeof(company_snapshot) = 'object'),
    CONSTRAINT chk_proposals_client_snapshot CHECK (jsonb_typeof(client_snapshot) = 'object'),
    CONSTRAINT chk_proposals_address_snapshot CHECK (address_snapshot IS NULL OR jsonb_typeof(address_snapshot) = 'object'),
    CONSTRAINT chk_proposals_items_snapshot CHECK (jsonb_typeof(items_snapshot) = 'array' AND jsonb_array_length(items_snapshot) >= 1),
    CONSTRAINT chk_proposals_totals_snapshot CHECK (jsonb_typeof(totals_snapshot) = 'object'),
    CONSTRAINT chk_proposals_commercial_terms CHECK (jsonb_typeof(commercial_terms) = 'object'),
    
    -- Cross-Field Constraints Estritas entre Estado Técnico, Comercial, Storage e Lease
    CONSTRAINT chk_proposals_generation_cross_field CHECK (
        (generation_status = 'reserved' AND status IS NULL AND pdf_storage_key IS NULL AND pdf_sha256 IS NULL AND pdf_size_bytes IS NULL AND issued_at IS NULL AND issued_by IS NULL AND reservation_expires_at IS NOT NULL) OR
        (generation_status = 'failed' AND status IS NULL AND pdf_storage_key IS NULL AND pdf_sha256 IS NULL AND pdf_size_bytes IS NULL AND issued_at IS NULL AND issued_by IS NULL AND reservation_expires_at IS NULL) OR
        (generation_status = 'ready' AND status IN ('issued', 'superseded', 'accepted') AND pdf_storage_key IS NOT NULL AND pdf_sha256 IS NOT NULL AND pdf_size_bytes IS NOT NULL AND issued_at IS NOT NULL AND issued_by IS NOT NULL AND reservation_expires_at IS NULL)
    ),
    
    -- Consistência Estrita de Aceitação (NULL-Safe Check)
    CONSTRAINT chk_proposals_acceptance_consistency CHECK (
        (status IS NULL AND accepted_at IS NULL AND accepted_by IS NULL) OR
        (status = 'issued' AND accepted_at IS NULL AND accepted_by IS NULL) OR
        (status = 'accepted' AND accepted_at IS NOT NULL AND accepted_by IS NOT NULL) OR
        (status = 'superseded' AND ((accepted_at IS NULL AND accepted_by IS NULL) OR (accepted_at IS NOT NULL AND accepted_by IS NOT NULL)))
    ),
    
    -- Integridade Referencial Composta (client_id pertence exatamente à work_order_id)
    CONSTRAINT fk_proposals_wo_client FOREIGN KEY (work_order_id, client_id) 
        REFERENCES public.work_orders(id, client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_proposals_issued_by FOREIGN KEY (issued_by) 
        REFERENCES auth.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_proposals_accepted_by FOREIGN KEY (accepted_by) 
        REFERENCES auth.users(id) ON DELETE RESTRICT,
        
    -- Unicidade de Versão, Idempotência e Composição
    CONSTRAINT unq_work_order_proposals_version UNIQUE (work_order_id, version_number),
    CONSTRAINT unq_work_order_proposals_idempotency UNIQUE (work_order_id, idempotency_key),
    CONSTRAINT unq_work_order_proposals_id_wo UNIQUE (id, work_order_id)
);

-- Índices de Performance e Regras de Negócio
CREATE INDEX idx_proposals_wo_version ON public.work_order_proposals(work_order_id, version_number DESC);
CREATE INDEX idx_proposals_client_id ON public.work_order_proposals(client_id);
CREATE INDEX idx_proposals_status ON public.work_order_proposals(status);
CREATE INDEX idx_proposals_gen_status ON public.work_order_proposals(generation_status);
CREATE INDEX idx_proposals_reservation_expires ON public.work_order_proposals(reservation_expires_at) WHERE generation_status = 'reserved';

-- Garantia de no MÁXIMO UMA proposta 'accepted' por OS
CREATE UNIQUE INDEX unq_proposals_one_accepted ON public.work_order_proposals(work_order_id) 
    WHERE status = 'accepted' AND generation_status = 'ready';

-- Garantia de no MÁXIMO UMA proposta ativa 'issued' por OS
CREATE UNIQUE INDEX unq_proposals_one_issued ON public.work_order_proposals(work_order_id) 
    WHERE status = 'issued' AND generation_status = 'ready';

-- Garantia de ONE_IN_FLIGHT: no máximo UMA reserva 'reserved' por OS
CREATE UNIQUE INDEX unq_proposals_one_reserved ON public.work_order_proposals(work_order_id) 
    WHERE generation_status = 'reserved';

COMMENT ON TABLE public.work_order_proposals IS 'Orçamentos comerciais versionados com snapshots canônicos congelados e R2 metadata.';

-- ------------------------------------------------------------------------------
-- BLOCO 04: ALTERAÇÃO EM public.work_orders (VÍNCULO COM PROPOSTA ACEITA)
-- ------------------------------------------------------------------------------

-- Adiciona accepted_proposal_id sem IF NOT EXISTS (fail-fast)
ALTER TABLE public.work_orders
    ADD COLUMN accepted_proposal_id UUID NULL;

ALTER TABLE public.work_orders
    ADD CONSTRAINT fk_work_orders_accepted_proposal 
    FOREIGN KEY (accepted_proposal_id, id) 
    REFERENCES public.work_order_proposals(id, work_order_id) 
    ON DELETE RESTRICT;

CREATE INDEX idx_work_orders_accepted_proposal ON public.work_orders(accepted_proposal_id) WHERE accepted_proposal_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- BLOCO 05: TRIGGERS DE IMUTABILIDADE E BLOQUEIO DE DELETE FÍSICO
-- ------------------------------------------------------------------------------

-- 05.1. Trigger de Imutabilidade Estrita de Conteúdo e Metadados
CREATE FUNCTION public.fn_prevent_proposal_content_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    -- Se a proposta já estava finalizada ('ready'), bloqueia qualquer alteração em snapshots, metadados, PDF, lease ou generation_status
    IF OLD.generation_status = 'ready' THEN
        IF NEW.generation_status <> 'ready' THEN
            RAISE EXCEPTION 'MUTATION_BLOCKED: A ready proposal cannot transition back to reserved or failed.';
        END IF;

        IF OLD.id <> NEW.id OR
           OLD.work_order_id <> NEW.work_order_id OR
           OLD.client_id <> NEW.client_id OR
           OLD.version_number <> NEW.version_number OR
           OLD.idempotency_key <> NEW.idempotency_key OR
           OLD.idempotency_request_sha256 <> NEW.idempotency_request_sha256 OR
           OLD.company_snapshot <> NEW.company_snapshot OR
           OLD.client_snapshot <> NEW.client_snapshot OR
           OLD.address_snapshot IS DISTINCT FROM NEW.address_snapshot OR
           OLD.items_snapshot <> NEW.items_snapshot OR
           OLD.totals_snapshot <> NEW.totals_snapshot OR
           OLD.commercial_terms <> NEW.commercial_terms OR
           OLD.pdf_storage_key <> NEW.pdf_storage_key OR
           OLD.pdf_sha256 <> NEW.pdf_sha256 OR
           OLD.pdf_size_bytes <> NEW.pdf_size_bytes OR
           OLD.reservation_expires_at IS DISTINCT FROM NEW.reservation_expires_at OR
           OLD.issued_at <> NEW.issued_at OR
           OLD.valid_until <> NEW.valid_until OR
           OLD.issued_by IS DISTINCT FROM NEW.issued_by OR
           OLD.created_at <> NEW.created_at THEN
            RAISE EXCEPTION 'MUTATION_BLOCKED: Proposal content, snapshots, lease and PDF metadata are permanently immutable once issued.';
        END IF;
        
        -- Validação Estrita de Transições Comerciais e Origem Canônica de Accepted Metadata
        -- Caso A: Proposta estava 'superseded' (estado terminal definitivo)
        IF OLD.status = 'superseded' THEN
            IF NEW.status <> 'superseded' THEN
                RAISE EXCEPTION 'MUTATION_BLOCKED: A superseded proposal cannot change status.';
            END IF;
            IF NEW.accepted_at IS DISTINCT FROM OLD.accepted_at OR NEW.accepted_by IS DISTINCT FROM OLD.accepted_by THEN
                RAISE EXCEPTION 'MUTATION_BLOCKED: Acceptance metadata of a superseded proposal cannot be modified.';
            END IF;
        END IF;

        -- Caso B: Proposta estava 'accepted'
        IF OLD.status = 'accepted' THEN
            IF NEW.status NOT IN ('accepted', 'superseded') THEN
                RAISE EXCEPTION 'MUTATION_BLOCKED: An accepted proposal can only transition to superseded upon work order reopening and new revision.';
            END IF;
            -- Metadados de aceite pré-existentes devem ser estritamente preservados
            IF NEW.accepted_at IS DISTINCT FROM OLD.accepted_at OR NEW.accepted_by IS DISTINCT FROM OLD.accepted_by THEN
                RAISE EXCEPTION 'MUTATION_BLOCKED: Accepted metadata is permanent and must be preserved when transitioning to superseded.';
            END IF;
        END IF;

        -- Caso C: Proposta estava 'issued'
        IF OLD.status = 'issued' THEN
            IF NEW.status = 'accepted' THEN
                -- ÚNICA transição autorizada para criação de acceptance metadata
                IF NEW.accepted_at IS NULL OR NEW.accepted_by IS NULL THEN
                    RAISE EXCEPTION 'MUTATION_BLOCKED: Acceptance transition requires non-null accepted_at and accepted_by.';
                END IF;
            ELSIF NEW.status = 'superseded' THEN
                -- Transição para superseded sem aceite: metadados de aceite DEVEM permanecer NULL
                IF NEW.accepted_at IS NOT NULL OR NEW.accepted_by IS NOT NULL THEN
                    RAISE EXCEPTION 'MUTATION_BLOCKED: An issued proposal transitioning to superseded cannot have acceptance metadata.';
                END IF;
            ELSIF NEW.status = 'issued' THEN
                -- Permanência em issued: metadados de aceite DEVEM permanecer NULL
                IF NEW.accepted_at IS NOT NULL OR NEW.accepted_by IS NOT NULL THEN
                    RAISE EXCEPTION 'MUTATION_BLOCKED: An issued proposal cannot have acceptance metadata.';
                END IF;
            ELSE
                RAISE EXCEPTION 'MUTATION_BLOCKED: Invalid status transition from issued to %.', NEW.status;
            END IF;
        END IF;
    END IF;
    
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_proposal_content_mutation
BEFORE UPDATE ON public.work_order_proposals
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_proposal_content_mutation();

-- 05.2. Trigger de Bloqueio de DELETE Físico
CREATE FUNCTION public.fn_prevent_proposal_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'DELETE_FORBIDDEN: Proposals cannot be deleted from the database.';
END;
$$;

CREATE TRIGGER trg_prevent_proposal_delete
BEFORE DELETE ON public.work_order_proposals
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_proposal_delete();

-- ------------------------------------------------------------------------------
-- BLOCO 06: HARDENING DE SEGURANÇA (RLS E PRINCÍPIO DO MENOR PRIVILÉGIO)
-- ------------------------------------------------------------------------------

ALTER TABLE public.work_order_proposals ENABLE ROW LEVEL SECURITY;

-- Revoga todo e qualquer acesso direto de papéis não autorizados
REVOKE ALL ON public.work_order_proposals FROM PUBLIC, anon, authenticated, service_role;

-- Concede estritamente apenas SELECT direto ao service_role
-- INSERT, UPDATE, DELETE e TRUNCATE diretos permanecem permanentemente negados
GRANT SELECT ON public.work_order_proposals TO service_role;

-- ------------------------------------------------------------------------------
-- BLOCO 07: RPC ATÔMICAS SECURITY DEFINER
-- ------------------------------------------------------------------------------

-- 07.1. RPC: public.reserve_work_order_proposal_atomic
CREATE FUNCTION public.reserve_work_order_proposal_atomic(
    p_work_order_id UUID,
    p_expected_wo_updated_at TIMESTAMPTZ,
    p_idempotency_key VARCHAR(128),
    p_idempotency_request_sha256 VARCHAR(64),
    p_commercial_terms JSONB,
    p_valid_until DATE,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor_active BOOLEAN;
    v_wo RECORD;
    v_existing_proposal RECORD;
    v_active_reserved RECORD;
    v_next_version INT;
    v_proposal_id UUID;
    v_max_version INT;
    v_lease_duration INTERVAL := INTERVAL '15 minutes';
    v_lease_expires_at TIMESTAMPTZ;
    v_sp_today DATE := (pg_catalog.now() AT TIME ZONE 'America/Sao_Paulo')::date;
    v_incluir_medicoes BOOLEAN := false;
    v_unknown_keys_count INT;
    v_prazo_raw TEXT;
    v_prazo_num NUMERIC;
    v_snapshot_record RECORD;
BEGIN
    -- 1. Validação de Ator Admin Ativo (public.admin_users.user_id)
    IF p_actor_id IS NULL THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor ID is required.';
    END IF;

    SELECT is_active INTO v_actor_active 
    FROM public.admin_users 
    WHERE user_id = p_actor_id;

    IF v_actor_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor is not an active administrator.';
    END IF;

    -- 2. Validação Rigorosa de Inputs
    IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
        RAISE EXCEPTION 'ERR_INVALID_IDEMPOTENCY_KEY: Idempotency key is required.';
    END IF;

    IF p_idempotency_request_sha256 !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'ERR_INVALID_IDEMPOTENCY_SHA: Idempotency request hash must be exactly 64 lowercase hexadecimal characters.';
    END IF;

    IF p_valid_until IS NULL THEN
        RAISE EXCEPTION 'ERR_VALID_UNTIL_REQUIRED: Proposal valid_until date is required.';
    END IF;

    IF p_valid_until < v_sp_today THEN
        RAISE EXCEPTION 'ERR_VALID_UNTIL_IN_PAST: Proposal valid_until date (%) cannot be in the past (today in SP: %).', p_valid_until, v_sp_today;
    END IF;

    IF p_commercial_terms IS NULL OR jsonb_typeof(p_commercial_terms) <> 'object' THEN
        RAISE EXCEPTION 'ERR_INVALID_COMMERCIAL_TERMS: Commercial terms must be a valid JSON object.';
    END IF;

    -- Validação de allowlist explícita de chaves em commercial_terms (V1: 4 chaves permitidas)
    SELECT count(*) INTO v_unknown_keys_count
    FROM jsonb_object_keys(p_commercial_terms) AS k
    WHERE k NOT IN (
        'condicoes_pagamento', 'prazo_instalacao_dias', 
        'incluir_medicoes', 'observacoes_proposta'
    );

    IF v_unknown_keys_count > 0 THEN
        RAISE EXCEPTION 'ERR_UNKNOWN_COMMERCIAL_KEYS: Commercial terms contains unauthorized keys.';
    END IF;

    -- Validações estritas de tipo e limites em commercial_terms
    IF p_commercial_terms ? 'condicoes_pagamento' THEN
        IF jsonb_typeof(p_commercial_terms->'condicoes_pagamento') <> 'string' THEN
            RAISE EXCEPTION 'ERR_INVALID_COMMERCIAL_TERMS_TYPE: condicoes_pagamento must be a string.';
        END IF;
        IF length(trim(p_commercial_terms->>'condicoes_pagamento')) > 500 THEN
            RAISE EXCEPTION 'ERR_COMMERCIAL_TEXT_TOO_LONG: Payment terms exceed 500 characters limit.';
        END IF;
    END IF;

    IF p_commercial_terms ? 'observacoes_proposta' THEN
        IF jsonb_typeof(p_commercial_terms->'observacoes_proposta') <> 'string' THEN
            RAISE EXCEPTION 'ERR_INVALID_COMMERCIAL_TERMS_TYPE: observacoes_proposta must be a string.';
        END IF;
        IF length(trim(p_commercial_terms->>'observacoes_proposta')) > 2000 THEN
            RAISE EXCEPTION 'ERR_COMMERCIAL_TEXT_TOO_LONG: Proposal notes exceed 2000 characters limit.';
        END IF;
    END IF;

    IF p_commercial_terms ? 'prazo_instalacao_dias' THEN
        IF jsonb_typeof(p_commercial_terms->'prazo_instalacao_dias') <> 'number' THEN
            RAISE EXCEPTION 'ERR_INVALID_COMMERCIAL_TERMS_TYPE: prazo_instalacao_dias must be an integer number.';
        END IF;
        v_prazo_raw := p_commercial_terms->>'prazo_instalacao_dias';
        v_prazo_num := v_prazo_raw::numeric;
        IF v_prazo_num <> trunc(v_prazo_num) OR v_prazo_num < 1 OR v_prazo_num > 365 THEN
            RAISE EXCEPTION 'ERR_INVALID_PRAZO_RANGE: prazo_instalacao_dias must be an integer between 1 and 365.';
        END IF;
    END IF;

    IF p_commercial_terms ? 'incluir_medicoes' THEN
        IF jsonb_typeof(p_commercial_terms->'incluir_medicoes') <> 'boolean' THEN
            RAISE EXCEPTION 'ERR_INVALID_COMMERCIAL_TERMS_TYPE: incluir_medicoes must be a boolean.';
        END IF;
        v_incluir_medicoes := (p_commercial_terms->>'incluir_medicoes')::boolean;
    END IF;

    -- 3. Lock Transacional da Work Order (Linha)
    SELECT id, numero_os, client_id, address_id, status_os, is_archived, valor_total, valor_desconto, valor_final, updated_at 
    INTO v_wo
    FROM public.work_orders
    WHERE id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Work order % not found.', p_work_order_id;
    END IF;

    -- 4. Idempotency Check Seguro sob Lock (PRECEDE TOTALMENTE OS GATES DE ESTADO DA OS)
    SELECT * INTO v_existing_proposal 
    FROM public.work_order_proposals 
    WHERE work_order_id = p_work_order_id AND idempotency_key = p_idempotency_key
    FOR UPDATE;
    
    IF FOUND THEN
        IF v_existing_proposal.idempotency_request_sha256 <> p_idempotency_request_sha256 THEN
            RAISE EXCEPTION 'ERR_IDEMPOTENCY_MISMATCH: Idempotency key reused with different commercial payload.';
        END IF;

        -- Caso 4.1: Proposta existente está em 'reserved'
        IF v_existing_proposal.generation_status = 'reserved' THEN
            IF v_existing_proposal.reservation_expires_at > pg_catalog.clock_timestamp() THEN
                -- Replay de reserva ativa válida
                RETURN pg_catalog.jsonb_build_object(
                    'success', true,
                    'is_idempotent_replay', true,
                    'reconciliation_required', false,
                    'proposal_id', v_existing_proposal.id,
                    'version_number', v_existing_proposal.version_number,
                    'numero_os', v_wo.numero_os,
                    'generation_status', 'reserved',
                    'status', NULL,
                    'company_snapshot', v_existing_proposal.company_snapshot,
                    'client_snapshot', v_existing_proposal.client_snapshot,
                    'address_snapshot', v_existing_proposal.address_snapshot,
                    'items_snapshot', v_existing_proposal.items_snapshot,
                    'totals_snapshot', v_existing_proposal.totals_snapshot,
                    'commercial_terms', v_existing_proposal.commercial_terms,
                    'valid_until', v_existing_proposal.valid_until,
                    'reservation_expires_at', v_existing_proposal.reservation_expires_at
                );
            ELSE
                -- Replay com lease expirado: NÃO renova cegamente e NÃO auto-falha no DB (Reconciliação mandatória)
                RETURN pg_catalog.jsonb_build_object(
                    'success', true,
                    'is_idempotent_replay', true,
                    'reconciliation_required', true,
                    'proposal_id', v_existing_proposal.id,
                    'version_number', v_existing_proposal.version_number,
                    'numero_os', v_wo.numero_os,
                    'generation_status', 'reserved',
                    'status', NULL,
                    'company_snapshot', v_existing_proposal.company_snapshot,
                    'client_snapshot', v_existing_proposal.client_snapshot,
                    'address_snapshot', v_existing_proposal.address_snapshot,
                    'items_snapshot', v_existing_proposal.items_snapshot,
                    'totals_snapshot', v_existing_proposal.totals_snapshot,
                    'commercial_terms', v_existing_proposal.commercial_terms,
                    'valid_until', v_existing_proposal.valid_until,
                    'reservation_expires_at', v_existing_proposal.reservation_expires_at
                );
            END IF;
        END IF;

        -- Caso 4.2: Proposta existente está em 'failed' (Confirmado por recovery) -> Reativação com novo lease do relógio de parede
        IF v_existing_proposal.generation_status = 'failed' THEN
            SELECT COALESCE(MAX(version_number), 0) INTO v_max_version
            FROM public.work_order_proposals
            WHERE work_order_id = p_work_order_id;

            IF v_existing_proposal.version_number = v_max_version THEN
                v_lease_expires_at := pg_catalog.clock_timestamp() + v_lease_duration;

                UPDATE public.work_order_proposals
                SET generation_status = 'reserved',
                    reservation_expires_at = v_lease_expires_at,
                    updated_at = pg_catalog.now()
                WHERE id = v_existing_proposal.id;
                
                RETURN pg_catalog.jsonb_build_object(
                    'success', true,
                    'is_idempotent_replay', true,
                    'reconciliation_required', false,
                    'proposal_id', v_existing_proposal.id,
                    'version_number', v_existing_proposal.version_number,
                    'numero_os', v_wo.numero_os,
                    'generation_status', 'reserved',
                    'status', NULL,
                    'company_snapshot', v_existing_proposal.company_snapshot,
                    'client_snapshot', v_existing_proposal.client_snapshot,
                    'address_snapshot', v_existing_proposal.address_snapshot,
                    'items_snapshot', v_existing_proposal.items_snapshot,
                    'totals_snapshot', v_existing_proposal.totals_snapshot,
                    'commercial_terms', v_existing_proposal.commercial_terms,
                    'valid_until', v_existing_proposal.valid_until,
                    'reservation_expires_at', v_lease_expires_at
                );
            ELSE
                RAISE EXCEPTION 'ERR_CANNOT_RETRY_FAILED_OLD_VERSION: A newer revision already exists.';
            END IF;
        END IF;

        -- Caso 4.3: Proposta existente já está 'ready' (emitida, aceita ou superseded)
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'is_idempotent_replay', true,
            'reconciliation_required', false,
            'proposal_id', v_existing_proposal.id,
            'version_number', v_existing_proposal.version_number,
            'numero_os', v_wo.numero_os,
            'generation_status', v_existing_proposal.generation_status,
            'status', v_existing_proposal.status,
            'company_snapshot', v_existing_proposal.company_snapshot,
            'client_snapshot', v_existing_proposal.client_snapshot,
            'address_snapshot', v_existing_proposal.address_snapshot,
            'items_snapshot', v_existing_proposal.items_snapshot,
            'totals_snapshot', v_existing_proposal.totals_snapshot,
            'commercial_terms', v_existing_proposal.commercial_terms,
            'valid_until', v_existing_proposal.valid_until,
            'reservation_expires_at', v_existing_proposal.reservation_expires_at
        );
    END IF;

    -- 5. Validação de Gates de Estado da OS e Concorrência Otimista (SOMENTE PARA NOVAS RESERVAS)
    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Cannot issue proposals for an archived work order.';
    END IF;

    IF v_wo.status_os <> 'orcamento' THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS: Proposals can only be issued when work order is in status orcamento (current: %).', v_wo.status_os;
    END IF;

    IF p_expected_wo_updated_at IS NULL THEN
        RAISE EXCEPTION 'ERR_EXPECTED_UPDATED_AT_REQUIRED: Expected updated_at timestamp is required.';
    END IF;

    IF v_wo.updated_at <> p_expected_wo_updated_at THEN
        RAISE EXCEPTION 'ERR_CONCURRENCY_CONFLICT: Work order was modified by another user. Please refresh and try again.';
    END IF;

    -- 6. Verificação de Reserva Ativa / Expirada Concorrente (ONE_IN_FLIGHT)
    SELECT * INTO v_active_reserved
    FROM public.work_order_proposals 
    WHERE work_order_id = p_work_order_id AND generation_status = 'reserved'
    FOR UPDATE;

    IF FOUND THEN
        IF v_active_reserved.reservation_expires_at > pg_catalog.clock_timestamp() THEN
            RAISE EXCEPTION 'ERR_PROPOSAL_ISSUE_IN_PROGRESS: Another proposal issuance is currently in progress for this work order (lease active until %).', v_active_reserved.reservation_expires_at;
        ELSE
            -- Lease expirado: requer reconciliação explícita antes de criar nova versão (NÃO auto-falha no DB)
            RAISE EXCEPTION 'ERR_PROPOSAL_RESERVATION_RECONCILIATION_REQUIRED: An expired reservation (Rev. %, id %) exists and must be reconciled before creating a new revision.', v_active_reserved.version_number, v_active_reserved.id;
        END IF;
    END IF;

    -- 7. Captura Canônica de Snapshots em Instrução Única MVCC (Fail-Closed)
    -- Estratégia: WORK_ORDER_ROW_LOCK_PLUS_SINGLE_STATEMENT_MVCC_SNAPSHOT
    WITH company_data AS (
        SELECT pg_catalog.jsonb_build_object(
            'trade_name', cp.trade_name,
            'legal_name', cp.legal_name,
            'cnpj', cp.cnpj,
            'phone_display', cp.phone_display,
            'whatsapp_number', cp.whatsapp_number,
            'email_contact', cp.email_contact,
            'website', cp.website,
            'cep', cp.cep,
            'street', cp.street,
            'number', cp.number,
            'complement', cp.complement,
            'neighborhood', cp.neighborhood,
            'city', cp.city,
            'state', cp.state,
            'document_footer_text', cp.document_footer_text,
            'logo_source', cp.logo_source,
            'logo_path', cp.logo_path,
            'logo_storage_key', cp.logo_storage_key
        ) AS company_snapshot
        FROM public.company_profile cp
        WHERE cp.id = 1
    ),
    client_data AS (
        SELECT pg_catalog.jsonb_build_object(
            'nome', c.nome,
            'nome_fantasia', c.nome_fantasia,
            'razao_social', c.razao_social,
            'cpf_cnpj', c.cpf_cnpj,
            'telefone_principal', c.telefone_principal,
            'email', c.email,
            'tipo_cliente', c.tipo_cliente
        ) AS client_snapshot
        FROM public.clients c
        WHERE c.id = v_wo.client_id
    ),
    address_data AS (
        SELECT CASE 
            WHEN v_wo.address_id IS NULL THEN NULL
            ELSE (
                SELECT pg_catalog.jsonb_build_object(
                    'rotulo', ca.rotulo,
                    'tipo_imovel', ca.tipo_imovel,
                    'cep', ca.cep,
                    'logradouro', ca.logradouro,
                    'numero', ca.numero,
                    'complemento', ca.complemento,
                    'bairro', ca.bairro,
                    'cidade', ca.cidade,
                    'uf', ca.uf
                )
                FROM public.client_addresses ca
                WHERE ca.id = v_wo.address_id AND ca.client_id = v_wo.client_id
            )
        END AS address_snapshot,
        CASE
            WHEN v_wo.address_id IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM public.client_addresses ca WHERE ca.id = v_wo.address_id AND ca.client_id = v_wo.client_id
            ) THEN false
            ELSE true
        END AS address_valid
    ),
    items_data AS (
        SELECT pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
                'id', i.id,
                'categoria_operacional', i.categoria_operacional,
                'descricao', i.descricao,
                'quantidade', i.quantidade,
                'preco_unitario', i.preco_unitario,
                'preco_total', i.preco_total,
                'measurements', CASE 
                    WHEN v_incluir_medicoes THEN (
                        SELECT COALESCE(pg_catalog.jsonb_agg(
                            pg_catalog.jsonb_build_object(
                                'id', m.id,
                                'ambiente', m.ambiente,
                                'tipo_vao', m.tipo_vao,
                                'largura_mm', m.largura_mm,
                                'altura_mm', m.altura_mm,
                                'quantidade', m.quantidade,
                                'cor_estrutura', m.cor_estrutura,
                                'tipo_material', m.tipo_material
                            ) ORDER BY m.sort_order ASC, m.created_at ASC
                        ), '[]'::jsonb)
                        FROM public.work_order_measurements m
                        WHERE m.work_order_item_id = i.id
                    )
                    ELSE '[]'::jsonb
                END
            ) ORDER BY i.sort_order ASC, i.created_at ASC
        ) AS items_snapshot
        FROM public.work_order_items i
        WHERE i.work_order_id = p_work_order_id
    )
    SELECT 
        cd.company_snapshot,
        cld.client_snapshot,
        ad.address_snapshot,
        ad.address_valid,
        itd.items_snapshot
    INTO v_snapshot_record
    FROM (SELECT 1) dummy
    LEFT JOIN company_data cd ON true
    LEFT JOIN client_data cld ON true
    LEFT JOIN address_data ad ON true
    LEFT JOIN items_data itd ON true;

    -- Validação Fail-Closed dos Snapshots Capturados
    IF v_snapshot_record.company_snapshot IS NULL THEN
        RAISE EXCEPTION 'ERR_COMPANY_PROFILE_MISSING: Company profile record (id=1) is missing in database.';
    END IF;

    IF v_snapshot_record.client_snapshot IS NULL THEN
        RAISE EXCEPTION 'ERR_CLIENT_NOT_FOUND: Client % not found.', v_wo.client_id;
    END IF;

    IF v_snapshot_record.address_valid IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_ADDRESS_RELATION_INCONSISTENT: Address % does not exist or does not belong to client %.', v_wo.address_id, v_wo.client_id;
    END IF;

    IF v_snapshot_record.items_snapshot IS NULL OR jsonb_array_length(v_snapshot_record.items_snapshot) = 0 THEN
        RAISE EXCEPTION 'ERR_NO_ITEMS: Cannot issue a proposal for a work order with no items.';
    END IF;

    -- 8. Cálculo Atômico da Próxima Versão
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM public.work_order_proposals
    WHERE work_order_id = p_work_order_id;

    -- 9. Cálculo do Lease a partir do relógio de parede no momento exato da reserva
    v_lease_expires_at := pg_catalog.clock_timestamp() + v_lease_duration;

    -- 10. Inserção da Reserva Técnica (status comercial é NULL, issued_by é NULL na reserva)
    INSERT INTO public.work_order_proposals (
        work_order_id, client_id, version_number, idempotency_key, idempotency_request_sha256,
        generation_status, status,
        company_snapshot, client_snapshot, address_snapshot, items_snapshot, totals_snapshot, commercial_terms,
        pdf_storage_key, pdf_sha256, pdf_size_bytes, reservation_expires_at,
        issued_at, valid_until, issued_by
    ) VALUES (
        p_work_order_id, v_wo.client_id, v_next_version, p_idempotency_key, p_idempotency_request_sha256,
        'reserved', NULL,
        v_snapshot_record.company_snapshot, 
        v_snapshot_record.client_snapshot, 
        v_snapshot_record.address_snapshot, 
        v_snapshot_record.items_snapshot, 
        pg_catalog.jsonb_build_object(
            'valor_total', v_wo.valor_total,
            'valor_desconto', v_wo.valor_desconto,
            'valor_final', v_wo.valor_final,
            'moeda', 'BRL'
        ), 
        p_commercial_terms,
        NULL, NULL, NULL, v_lease_expires_at,
        NULL, p_valid_until, NULL
    ) RETURNING id INTO v_proposal_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'is_idempotent_replay', false,
        'reconciliation_required', false,
        'proposal_id', v_proposal_id,
        'version_number', v_next_version,
        'numero_os', v_wo.numero_os,
        'generation_status', 'reserved',
        'status', NULL,
        'company_snapshot', v_snapshot_record.company_snapshot,
        'client_snapshot', v_snapshot_record.client_snapshot,
        'address_snapshot', v_snapshot_record.address_snapshot,
        'items_snapshot', v_snapshot_record.items_snapshot,
        'totals_snapshot', pg_catalog.jsonb_build_object(
            'valor_total', v_wo.valor_total,
            'valor_desconto', v_wo.valor_desconto,
            'valor_final', v_wo.valor_final,
            'moeda', 'BRL'
        ),
        'commercial_terms', p_commercial_terms,
        'valid_until', p_valid_until,
        'reservation_expires_at', v_lease_expires_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_work_order_proposal_atomic(UUID,TIMESTAMPTZ,VARCHAR,VARCHAR,JSONB,DATE,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_work_order_proposal_atomic(UUID,TIMESTAMPTZ,VARCHAR,VARCHAR,JSONB,DATE,UUID) TO service_role;

-- 07.2. RPC: public.finalize_work_order_proposal_atomic
CREATE FUNCTION public.finalize_work_order_proposal_atomic(
    p_proposal_id UUID,
    p_work_order_id UUID,
    p_pdf_storage_key VARCHAR(255),
    p_pdf_sha256 VARCHAR(64),
    p_pdf_size_bytes BIGINT,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor_active BOOLEAN;
    v_prop RECORD;
    v_wo RECORD;
    v_previous_active RECORD;
    v_max_version INT;
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_expected_storage_key VARCHAR(255) := 'proposals/' || p_work_order_id || '/' || p_proposal_id || '.pdf';
BEGIN
    -- 1. Validação de Ator Admin Ativo
    IF p_actor_id IS NULL THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor ID is required.';
    END IF;

    SELECT is_active INTO v_actor_active 
    FROM public.admin_users 
    WHERE user_id = p_actor_id;

    IF v_actor_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor is not an active administrator.';
    END IF;

    -- 2. Validação de Formato e Prefixo Canônico do Storage Key e Integridade do PDF
    IF p_pdf_storage_key <> v_expected_storage_key THEN
        RAISE EXCEPTION 'ERR_INVALID_STORAGE_KEY: Storage key % does not match expected canonical path %.', p_pdf_storage_key, v_expected_storage_key;
    END IF;

    IF p_pdf_sha256 !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'ERR_INVALID_SHA256: SHA-256 hash must be exactly 64 lowercase hexadecimal characters.';
    END IF;

    IF p_pdf_size_bytes IS NULL OR p_pdf_size_bytes <= 0 THEN
        RAISE EXCEPTION 'ERR_INVALID_FILE_SIZE: PDF file size must be greater than zero.';
    END IF;

    -- 3. Lock Transacional Determinístico: WORK_ORDER -> PROPOSAL
    SELECT id, client_id, status_os, is_archived, accepted_proposal_id, updated_at 
    INTO v_wo
    FROM public.work_orders
    WHERE id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Work order % not found.', p_work_order_id;
    END IF;

    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Cannot finalize proposals for an archived work order.';
    END IF;

    IF v_wo.status_os <> 'orcamento' THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS: Proposals can only be finalized when work order is in status orcamento (current: %).', v_wo.status_os;
    END IF;

    SELECT * INTO v_prop
    FROM public.work_order_proposals
    WHERE id = p_proposal_id AND work_order_id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PROPOSAL_NOT_FOUND: Reserved proposal % not found for work order %.', p_proposal_id, p_work_order_id;
    END IF;

    -- 4. Replay Idempotente com Verificação Estrita de Metadados
    IF v_prop.generation_status = 'ready' THEN
        IF v_prop.pdf_storage_key <> p_pdf_storage_key OR 
           v_prop.pdf_sha256 <> p_pdf_sha256 OR 
           v_prop.pdf_size_bytes <> p_pdf_size_bytes THEN
            RAISE EXCEPTION 'ERR_FINALIZE_REPLAY_METADATA_MISMATCH: Finalize called with divergent PDF metadata.';
        END IF;

        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'is_idempotent_replay', true,
            'proposal_id', v_prop.id,
            'version_number', v_prop.version_number,
            'status', v_prop.status,
            'issued_at', v_prop.issued_at,
            'issued_by', v_prop.issued_by
        );
    END IF;

    IF v_prop.generation_status <> 'reserved' THEN
        RAISE EXCEPTION 'ERR_INVALID_GENERATION_STATUS: Proposal cannot be finalized in generation status %.', v_prop.generation_status;
    END IF;

    -- 5. Validação de Ordem Sequencial da Revisão
    SELECT COALESCE(MAX(version_number), 0) INTO v_max_version
    FROM public.work_order_proposals
    WHERE work_order_id = p_work_order_id;

    IF v_prop.version_number <> v_max_version THEN
        RAISE EXCEPTION 'ERR_OUT_OF_ORDER_FINALIZATION: Revision % is not the latest reserved revision (latest: %).', v_prop.version_number, v_max_version;
    END IF;

    -- 6. Transição da Proposta Ativa Anterior para 'superseded'
    FOR v_previous_active IN (
        SELECT id, version_number, status 
        FROM public.work_order_proposals 
        WHERE work_order_id = p_work_order_id 
          AND id <> p_proposal_id 
          AND generation_status = 'ready' 
          AND status IN ('issued', 'accepted')
        FOR UPDATE
    ) LOOP
        -- Se for superseder proposta anteriormente 'accepted', exige que a OS já tenha sido formalmente reaberta (accepted_proposal_id IS NULL)
        IF v_previous_active.status = 'accepted' AND v_wo.accepted_proposal_id IS NOT NULL THEN
            RAISE EXCEPTION 'ERR_ACCEPTED_SUPERSEDE_REQUIRES_REOPENED_WO: Cannot supersede accepted proposal while it is still linked as the active accepted proposal of the work order.';
        END IF;

        UPDATE public.work_order_proposals
        SET status = 'superseded', 
            updated_at = v_now
        WHERE id = v_previous_active.id;

        -- Registra auditoria de superseded com payload minimizado
        INSERT INTO public.crm_activity_log (
            client_id, work_order_id, entity_type, entity_id, acao,
            dados_anteriores, dados_novos, descricao_humana, actor_id, occurred_at
        ) VALUES (
            v_wo.client_id, p_work_order_id, 'proposal', v_previous_active.id, 'proposal_superseded',
            pg_catalog.jsonb_build_object('status', v_previous_active.status),
            pg_catalog.jsonb_build_object('status', 'superseded', 'superseded_by_version', v_prop.version_number),
            'Orçamento comercial Rev. ' || v_previous_active.version_number || ' substituído pela Rev. ' || v_prop.version_number || '.',
            p_actor_id, v_now
        );
    END LOOP;

    -- 7. Finalização da Nova Proposta Oficial (issued_by definido com autoridade do banco)
    UPDATE public.work_order_proposals
    SET generation_status = 'ready',
        status = 'issued',
        pdf_storage_key = p_pdf_storage_key,
        pdf_sha256 = p_pdf_sha256,
        pdf_size_bytes = p_pdf_size_bytes,
        reservation_expires_at = NULL,
        issued_at = v_now,
        issued_by = p_actor_id,
        updated_at = v_now
    WHERE id = p_proposal_id;

    -- 8. Atualização dos Metadados Desnormalizados na work_orders
    UPDATE public.work_orders
    SET proposal_issued_at = v_now,
        proposal_valid_until = v_prop.valid_until,
        updated_at = v_now
    WHERE id = p_work_order_id;

    -- 9. Registro de Auditoria Append-Only
    INSERT INTO public.crm_activity_log (
        client_id, work_order_id, entity_type, entity_id, acao,
        dados_anteriores, dados_novos, descricao_humana, actor_id, occurred_at
    ) VALUES (
        v_wo.client_id, p_work_order_id, 'proposal', p_proposal_id, 'proposal_issued',
        NULL,
        pg_catalog.jsonb_build_object('proposal_id', p_proposal_id, 'version_number', v_prop.version_number, 'valid_until', v_prop.valid_until),
        'Orçamento comercial Rev. ' || v_prop.version_number || ' emitido oficialmente.',
        p_actor_id, v_now
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'is_idempotent_replay', false,
        'proposal_id', p_proposal_id,
        'version_number', v_prop.version_number,
        'status', 'issued',
        'issued_at', v_now,
        'issued_by', p_actor_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_work_order_proposal_atomic(UUID,UUID,VARCHAR,VARCHAR,BIGINT,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_work_order_proposal_atomic(UUID,UUID,VARCHAR,VARCHAR,BIGINT,UUID) TO service_role;

-- 07.3. RPC: public.accept_work_order_proposal_atomic
CREATE FUNCTION public.accept_work_order_proposal_atomic(
    p_work_order_id UUID,
    p_proposal_id UUID,
    p_expected_wo_updated_at TIMESTAMPTZ,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor_active BOOLEAN;
    v_wo RECORD;
    v_prop RECORD;
    v_now TIMESTAMPTZ := pg_catalog.now();
BEGIN
    -- 1. Validação de Ator Admin Ativo
    IF p_actor_id IS NULL THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor ID is required.';
    END IF;

    SELECT is_active INTO v_actor_active 
    FROM public.admin_users 
    WHERE user_id = p_actor_id;

    IF v_actor_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor is not an active administrator.';
    END IF;

    -- 2. Validação Rigorosa de Concorrência Otimista (Obrigatória)
    IF p_expected_wo_updated_at IS NULL THEN
        RAISE EXCEPTION 'ERR_EXPECTED_UPDATED_AT_REQUIRED: Expected updated_at timestamp is required.';
    END IF;

    -- 3. Lock Transacional Determinístico: WORK_ORDER -> PROPOSAL
    SELECT id, client_id, status_os, is_archived, updated_at 
    INTO v_wo
    FROM public.work_orders
    WHERE id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Work order % not found.', p_work_order_id;
    END IF;

    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Cannot accept proposals for an archived work order.';
    END IF;

    IF v_wo.status_os <> 'orcamento' THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS: Proposals can only be accepted when work order is in status orcamento (current: %).', v_wo.status_os;
    END IF;

    IF v_wo.updated_at <> p_expected_wo_updated_at THEN
        RAISE EXCEPTION 'ERR_CONCURRENCY_CONFLICT: Work order was modified by another user. Please refresh and try again.';
    END IF;

    -- Lock Transacional da Proposta
    SELECT * INTO v_prop
    FROM public.work_order_proposals
    WHERE id = p_proposal_id AND work_order_id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PROPOSAL_NOT_FOUND: Proposal % not found for work order %.', p_proposal_id, p_work_order_id;
    END IF;

    -- 4. Validação de Status da Proposta
    IF v_prop.generation_status <> 'ready' OR v_prop.status <> 'issued' THEN
        RAISE EXCEPTION 'ERR_INVALID_PROPOSAL_STATUS: Only active ready issued proposals can be accepted (current status: %, generation: %).', v_prop.status, v_prop.generation_status;
    END IF;

    -- 5. Atualização da Proposta para 'accepted'
    UPDATE public.work_order_proposals
    SET status = 'accepted',
        accepted_at = v_now,
        accepted_by = p_actor_id,
        updated_at = v_now
    WHERE id = p_proposal_id;

    -- 6. Atualização da Work Order para 'aprovada' vinculando accepted_proposal_id
    UPDATE public.work_orders
    SET status_os = 'aprovada',
        accepted_proposal_id = p_proposal_id,
        updated_at = v_now
    WHERE id = p_work_order_id;

    -- 7. Registro de Auditoria Append-Only
    INSERT INTO public.crm_activity_log (
        client_id, work_order_id, entity_type, entity_id, acao,
        dados_anteriores, dados_novos, descricao_humana, actor_id, occurred_at
    ) VALUES (
        v_wo.client_id, p_work_order_id, 'proposal', p_proposal_id, 'proposal_accepted',
        pg_catalog.jsonb_build_object('status_os', v_wo.status_os),
        pg_catalog.jsonb_build_object('proposal_id', p_proposal_id, 'version_number', v_prop.version_number, 'status_os', 'aprovada'),
        'Orçamento comercial Rev. ' || v_prop.version_number || ' aceito pelo cliente. OS aprovada.',
        p_actor_id, v_now
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'proposal_id', p_proposal_id,
        'version_number', v_prop.version_number,
        'status_os', 'aprovada',
        'accepted_at', v_now,
        'accepted_by', p_actor_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_work_order_proposal_atomic(UUID,UUID,TIMESTAMPTZ,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_work_order_proposal_atomic(UUID,UUID,TIMESTAMPTZ,UUID) TO service_role;

-- 07.4. RPC: public.mark_work_order_proposal_failed_atomic
CREATE FUNCTION public.mark_work_order_proposal_failed_atomic(
    p_proposal_id UUID,
    p_work_order_id UUID,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor_active BOOLEAN;
    v_prop RECORD;
    v_now TIMESTAMPTZ := pg_catalog.now();
BEGIN
    -- 1. Validação de Ator Admin Ativo
    IF p_actor_id IS NULL THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor ID is required.';
    END IF;

    SELECT is_active INTO v_actor_active 
    FROM public.admin_users 
    WHERE user_id = p_actor_id;

    IF v_actor_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor is not an active administrator.';
    END IF;

    -- 2. Lock Transacional Determinístico: WORK_ORDER -> PROPOSAL
    IF NOT EXISTS (
        SELECT 1 FROM public.work_orders 
        WHERE id = p_work_order_id 
        FOR UPDATE
    ) THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Work order % not found.', p_work_order_id;
    END IF;

    SELECT * INTO v_prop
    FROM public.work_order_proposals
    WHERE id = p_proposal_id AND work_order_id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PROPOSAL_NOT_FOUND: Proposal % not found for work order %.', p_proposal_id, p_work_order_id;
    END IF;

    -- Propostas finalizadas ('ready') não podem ser marcadas como 'failed'
    IF v_prop.generation_status = 'ready' THEN
        RAISE EXCEPTION 'ERR_CANNOT_FAIL_READY_PROPOSAL: Ready proposal cannot be marked as failed.';
    END IF;

    -- Se já estiver 'failed', retorna replay idempotente de sucesso
    IF v_prop.generation_status = 'failed' THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'is_idempotent_replay', true,
            'proposal_id', p_proposal_id,
            'generation_status', 'failed'
        );
    END IF;

    -- Transiciona 'reserved' para 'failed'
    UPDATE public.work_order_proposals
    SET generation_status = 'failed',
        reservation_expires_at = NULL,
        updated_at = v_now
    WHERE id = p_proposal_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'is_idempotent_replay', false,
        'proposal_id', p_proposal_id,
        'generation_status', 'failed'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_work_order_proposal_failed_atomic(UUID,UUID,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_work_order_proposal_failed_atomic(UUID,UUID,UUID) TO service_role;

COMMIT;
