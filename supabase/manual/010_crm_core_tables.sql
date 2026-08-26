-- ==============================================================================
-- MIGRATION 010 — CRM CORE + INFRASTRUCTURE COUNTER + COMPANY PROFILE
-- ==============================================================================
-- Projeto: AD Telas e Redes (adtelasmosquiteiras.com.br)
-- Data: 26 de Agosto de 2026
-- Versão: 2.0.2 (Final Pre-Runtime Patch & Complete Drift Validation)
--
-- Inventário Total: 16 Novas Tabelas
--   - 14 Tabelas CRM Core (Domínio de Negócio)
--   - 01 Tabela Infrastructure Helper (crm_work_order_counters)
--   - 01 Tabela Admin Configuration (company_profile Singleton)
--
-- Características de Engenharia:
--   - Transação DDL única e atômica (BEGIN ... COMMIT)
--   - Preflight fail-fast com validação estrita de dependências (tabelas e colunas)
--   - Detecção rigorosa de drift em tabelas e functions (sem CREATE OR REPLACE silencioso)
--   - Função trigger updated_at autocontida (crm_set_updated_at)
--   - Imutabilidade real da trilha de auditoria (crm_activity_log)
--   - Integridades relacionais compostas fechadas com ON DELETE RESTRICT
--   - Numeração de OS no fuso horário canônico 'America/Sao_Paulo'
--   - Assinatura estrita e privilégios mínimos nas RPCs e Triggers
--   - RLS ativa em 100% das 16 tabelas (Acesso exclusivo service_role)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- BLOCO 00: PRE-FLIGHT CHECK (FAIL-FAST E DETECÇÃO DE DRIFT EM TABELAS E FUNÇÕES)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_missing_dep TEXT := '';
    v_table_exists RECORD;
BEGIN
    -- 1. Validação de tabelas legadas essenciais
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
        v_missing_dep := v_missing_dep || ' public.leads;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_media') THEN
        v_missing_dep := v_missing_dep || ' public.lead_media;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
        v_missing_dep := v_missing_dep || ' public.admin_users;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        v_missing_dep := v_missing_dep || ' auth.users;';
    END IF;

    -- 2. Validação estrita de colunas legadas essenciais
    -- public.leads
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' public.leads.id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'servico') THEN
        v_missing_dep := v_missing_dep || ' public.leads.servico;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'valor_orcamento') THEN
        v_missing_dep := v_missing_dep || ' public.leads.valor_orcamento;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'status') THEN
        v_missing_dep := v_missing_dep || ' public.leads.status;';
    END IF;

    -- public.lead_media
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lead_media' AND column_name = 'lead_id') THEN
        v_missing_dep := v_missing_dep || ' public.lead_media.lead_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lead_media' AND column_name = 'storage_key') THEN
        v_missing_dep := v_missing_dep || ' public.lead_media.storage_key;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lead_media' AND column_name = 'safe_filename') THEN
        v_missing_dep := v_missing_dep || ' public.lead_media.safe_filename;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lead_media' AND column_name = 'media_type') THEN
        v_missing_dep := v_missing_dep || ' public.lead_media.media_type;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lead_media' AND column_name = 'mime_type') THEN
        v_missing_dep := v_missing_dep || ' public.lead_media.mime_type;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lead_media' AND column_name = 'file_size_bytes') THEN
        v_missing_dep := v_missing_dep || ' public.lead_media.file_size_bytes;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lead_media' AND column_name = 'upload_status') THEN
        v_missing_dep := v_missing_dep || ' public.lead_media.upload_status;';
    END IF;

    -- public.admin_users
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'user_id') THEN
        v_missing_dep := v_missing_dep || ' public.admin_users.user_id;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active') THEN
        v_missing_dep := v_missing_dep || ' public.admin_users.is_active;';
    END IF;

    -- auth.users
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id') THEN
        v_missing_dep := v_missing_dep || ' auth.users.id;';
    END IF;

    IF v_missing_dep <> '' THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Missing legacy database dependencies: %', v_missing_dep;
    END IF;

    -- 3. Detecção de Drift em Tabelas: Nenhuma das 16 novas tabelas pode existir previamente
    FOR v_table_exists IN (
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'crm_work_order_counters', 'company_profile', 'crm_staff', 'clients',
            'client_addresses', 'work_orders', 'work_order_items', 'work_order_measurements',
            'work_order_media', 'work_order_payments', 'appointments', 'warranties',
            'notification_rules', 'notification_deliveries', 'crm_activity_log', 'crm_notes'
        )
    ) LOOP
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Table % already exists in public schema (drift detected). Aborting.', v_table_exists.table_name;
    END LOOP;

    -- 4. Detecção de Drift em Funções: Nenhuma das 6 novas functions pode existir previamente
    IF to_regprocedure('public.crm_set_updated_at()') IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Function public.crm_set_updated_at() already exists in database (drift detected). Aborting.';
    END IF;
    IF to_regprocedure('public.prevent_crm_activity_log_mutation()') IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Function public.prevent_crm_activity_log_mutation() already exists in database (drift detected). Aborting.';
    END IF;
    IF to_regprocedure('public.fn_prevent_item_wo_change()') IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Function public.fn_prevent_item_wo_change() already exists in database (drift detected). Aborting.';
    END IF;
    IF to_regprocedure('public.fn_recalculate_work_order_totals()') IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Function public.fn_recalculate_work_order_totals() already exists in database (drift detected). Aborting.';
    END IF;
    IF to_regprocedure('public.fn_generate_work_order_number()') IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Function public.fn_generate_work_order_number() already exists in database (drift detected). Aborting.';
    END IF;
    IF to_regprocedure('public.convert_lead_to_client_atomic(UUID,UUID,character varying,character varying,character varying,character varying,character varying,jsonb,boolean,jsonb)') IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Function public.convert_lead_to_client_atomic(...) already exists in database (drift detected). Aborting.';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- BLOCO 01: EXTENSÕES E FUNÇÃO AUTOCONTIDA DE UPDATED_AT
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE FUNCTION public.crm_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_set_updated_at() TO service_role;

-- ------------------------------------------------------------------------------
-- BLOCO 02: TABELAS DE INFRAESTRUTURA E CONFIGURAÇÃO
-- ------------------------------------------------------------------------------

-- 02.1. Tabela Helper: Contador Anual Concorrência-Safe para Numeração de OS
CREATE TABLE public.crm_work_order_counters (
    year INT PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_crm_counters_year CHECK (year >= 2020 AND year <= 2100),
    CONSTRAINT chk_crm_counters_last_number CHECK (last_number >= 0)
);

COMMENT ON TABLE public.crm_work_order_counters IS 'Tabela helper de infraestrutura para numeração anual concorrente de OS.';

-- 02.2. Tabela de Configuração: Perfil da Empresa (Singleton para Documentos e Branding)
CREATE TABLE public.company_profile (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    trade_name VARCHAR(150) NOT NULL DEFAULT 'AD Telas e Redes',
    legal_name VARCHAR(255) NULL,
    cnpj VARCHAR(20) NULL,
    phone_display VARCHAR(30) NULL,
    whatsapp_number VARCHAR(30) NULL,
    email_contact VARCHAR(255) NULL,
    website VARCHAR(255) NULL,
    cep VARCHAR(10) NULL,
    street VARCHAR(255) NULL,
    number VARCHAR(30) NULL,
    complement VARCHAR(100) NULL,
    neighborhood VARCHAR(100) NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    state VARCHAR(2) NOT NULL DEFAULT 'SP',
    business_hours VARCHAR(150) NULL,
    warranty_support_hours VARCHAR(150) NULL,
    document_footer_text TEXT NULL,
    logo_source VARCHAR(20) NOT NULL DEFAULT 'static',
    logo_path VARCHAR(255) NOT NULL DEFAULT '/images/logo_adt_telas_nova.png',
    logo_storage_key VARCHAR(512) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    CONSTRAINT chk_company_profile_singleton CHECK (id = 1),
    CONSTRAINT chk_company_profile_logo_source CHECK (logo_source IN ('static', 'r2')),
    CONSTRAINT chk_company_profile_logo_consistency CHECK (
        (logo_source = 'static' AND logo_path IS NOT NULL AND length(trim(logo_path)) >= 3) OR
        (logo_source = 'r2' AND logo_storage_key IS NOT NULL AND length(trim(logo_storage_key)) >= 3)
    ),
    CONSTRAINT chk_company_profile_state CHECK (length(state) = 2),
    CONSTRAINT fk_company_profile_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.company_profile IS 'Configuração singleton de identidade empresarial para orçamentos, OSs e termos.';

-- 02.3. Tabela Core: Equipe Técnica e Instaladores (Sem login Auth na V1)
CREATE TABLE public.crm_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30) NULL,
    email VARCHAR(255) NULL,
    funcao VARCHAR(50) NOT NULL DEFAULT 'instalador',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_crm_staff_nome CHECK (length(trim(nome)) >= 2),
    CONSTRAINT chk_crm_staff_funcao CHECK (funcao IN ('instalador', 'vistoriador', 'atendente', 'gestor'))
);

COMMENT ON TABLE public.crm_staff IS 'Catálogo de técnicos e instaladores para agendamentos e atribuição de serviços.';

-- ------------------------------------------------------------------------------
-- BLOCO 03: CLIENTES E ENDEREÇOS
-- ------------------------------------------------------------------------------

-- 03.1. Tabela Core: Clientes
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NULL,
    tipo_cliente VARCHAR(20) NOT NULL DEFAULT 'pessoa_fisica',
    nome VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NULL,
    razao_social VARCHAR(255) NULL,
    cpf_cnpj VARCHAR(20) NULL,
    telefone_principal VARCHAR(30) NOT NULL,
    telefone_secundario VARCHAR(30) NULL,
    email VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    observacoes TEXT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_clients_tipo CHECK (tipo_cliente IN ('pessoa_fisica', 'empresa', 'condominio')),
    CONSTRAINT chk_clients_status CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
    CONSTRAINT chk_clients_nome CHECK (length(trim(nome)) >= 2),
    CONSTRAINT chk_clients_telefone CHECK (length(regexp_replace(telefone_principal, '\D', '', 'g')) >= 10),
    CONSTRAINT fk_clients_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL,
    CONSTRAINT fk_clients_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX unq_clients_lead_id ON public.clients(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_clients_telefone_norm ON public.clients((regexp_replace(telefone_principal, '\D', '', 'g')));
CREATE INDEX idx_clients_email_lower ON public.clients((lower(email))) WHERE email IS NOT NULL;
CREATE INDEX idx_clients_nome_trgm ON public.clients USING gin (nome gin_trgm_ops);
CREATE INDEX idx_clients_status ON public.clients(status) WHERE is_archived = false;

COMMENT ON TABLE public.clients IS 'Cadastro central de clientes (PF/PJ/Condomínio) com suporte a conversão de leads.';

-- 03.2. Tabela Core: Endereços / Imóveis Atendidos (0:N por Cliente)
CREATE TABLE public.client_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    rotulo VARCHAR(50) NULL DEFAULT 'Principal',
    tipo_imovel VARCHAR(30) NULL DEFAULT 'outro',
    cep VARCHAR(10) NULL,
    logradouro VARCHAR(255) NULL,
    numero VARCHAR(30) NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    uf VARCHAR(2) NOT NULL DEFAULT 'SP',
    referencia TEXT NULL,
    observacoes_acesso TEXT NULL,
    is_principal BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_client_addresses_tipo CHECK (tipo_imovel IN ('casa', 'apartamento', 'comercial', 'condominio', 'outro')),
    CONSTRAINT chk_client_addresses_uf CHECK (length(uf) = 2),
    CONSTRAINT fk_client_addresses_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
    CONSTRAINT unq_client_addresses_id_client UNIQUE (id, client_id)
);

CREATE UNIQUE INDEX unq_client_addresses_principal ON public.client_addresses(client_id) WHERE is_principal = true;
CREATE INDEX idx_client_addresses_client_id ON public.client_addresses(client_id);
CREATE INDEX idx_client_addresses_bairro ON public.client_addresses(bairro);
CREATE INDEX idx_client_addresses_cidade ON public.client_addresses(cidade);

COMMENT ON TABLE public.client_addresses IS 'Locais de instalação e atendimento do cliente (0:N) com composite unique.';

-- ------------------------------------------------------------------------------
-- BLOCO 04: ORDENS DE SERVIÇO, ITENS, MEDIÇÕES E MÍDIAS
-- ------------------------------------------------------------------------------

-- 04.1. Tabela Core: Ordens de Serviço (OS)
CREATE TABLE public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_os VARCHAR(30) NOT NULL UNIQUE,
    client_id UUID NOT NULL,
    address_id UUID NULL,
    responsible_staff_id UUID NULL,
    status_os VARCHAR(30) NOT NULL DEFAULT 'orcamento',
    valor_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_final NUMERIC(12,2) GENERATED ALWAYS AS (valor_total - valor_desconto) STORED,
    proposal_issued_at TIMESTAMPTZ NULL,
    proposal_valid_until DATE NULL,
    data_prevista DATE NULL,
    data_conclusao DATE NULL,
    observacoes_gerais TEXT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_work_orders_status CHECK (status_os IN ('orcamento', 'aprovada', 'aguardando_agendamento', 'agendada', 'em_execucao', 'concluida', 'cancelada')),
    CONSTRAINT chk_work_orders_valor_total CHECK (valor_total >= 0),
    CONSTRAINT chk_work_orders_desconto_positivo CHECK (valor_desconto >= 0),
    CONSTRAINT chk_work_orders_desconto_menor_total CHECK (valor_desconto <= valor_total),
    CONSTRAINT fk_work_orders_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_work_orders_client_address FOREIGN KEY (address_id, client_id) REFERENCES public.client_addresses(id, client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_work_orders_staff FOREIGN KEY (responsible_staff_id) REFERENCES public.crm_staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_work_orders_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT unq_work_orders_id_client UNIQUE (id, client_id)
);

CREATE INDEX idx_work_orders_client_id ON public.work_orders(client_id);
CREATE INDEX idx_work_orders_address_id ON public.work_orders(address_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(status_os);
CREATE INDEX idx_work_orders_data_prevista ON public.work_orders(data_prevista);
CREATE INDEX idx_work_orders_proposal_valid_until ON public.work_orders(proposal_valid_until);

COMMENT ON TABLE public.work_orders IS 'Ordem de Serviço operacional agregadora com composite integrity para cliente e endereço.';

-- 04.2. Tabela Core: Itens da Ordem de Serviço (1:N)
CREATE TABLE public.work_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    service_key VARCHAR(64) NULL,
    categoria_operacional VARCHAR(50) NOT NULL DEFAULT 'outro',
    descricao VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_total NUMERIC(12,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    observacoes TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_work_order_items_categoria CHECK (categoria_operacional IN ('tela_mosquiteira', 'rede_protecao', 'vidracaria', 'manutencao', 'outro')),
    CONSTRAINT chk_work_order_items_descricao CHECK (length(trim(descricao)) >= 2),
    CONSTRAINT chk_work_order_items_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_work_order_items_preco_unitario CHECK (preco_unitario >= 0),
    CONSTRAINT chk_work_order_items_sort_order CHECK (sort_order >= 0),
    CONSTRAINT fk_work_order_items_wo FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE,
    CONSTRAINT unq_work_order_items_id_wo UNIQUE (id, work_order_id)
);

CREATE INDEX idx_work_order_items_wo_id ON public.work_order_items(work_order_id);
CREATE INDEX idx_work_order_items_categoria ON public.work_order_items(categoria_operacional);

COMMENT ON TABLE public.work_order_items IS 'Linhas de serviço/produto contratadas na OS com preco_total gerado e composite unique.';

-- 04.3. Tabela Core: Medições de Vãos Técnicos (1:N por Item)
CREATE TABLE public.work_order_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_item_id UUID NOT NULL,
    ambiente VARCHAR(100) NOT NULL,
    tipo_vao VARCHAR(50) NOT NULL DEFAULT 'janela',
    largura_mm INT NOT NULL,
    altura_mm INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    cor_estrutura VARCHAR(50) NULL DEFAULT 'Branco',
    tipo_material VARCHAR(100) NULL,
    observacoes TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_measurements_ambiente CHECK (length(trim(ambiente)) >= 2),
    CONSTRAINT chk_measurements_tipo_vao CHECK (tipo_vao IN ('janela', 'porta', 'sacada', 'maxim_ar', 'basculante', 'mezanino', 'outro')),
    CONSTRAINT chk_measurements_largura CHECK (largura_mm > 0),
    CONSTRAINT chk_measurements_altura CHECK (altura_mm > 0),
    CONSTRAINT chk_measurements_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_measurements_sort_order CHECK (sort_order >= 0),
    CONSTRAINT fk_measurements_item FOREIGN KEY (work_order_item_id) REFERENCES public.work_order_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_measurements_item_id ON public.work_order_measurements(work_order_item_id);

COMMENT ON TABLE public.work_order_measurements IS 'Medições de vãos em milímetros canônicos (largura_mm, altura_mm) vinculadas ao item.';

-- 04.4. Tabela Core: Mídias Privadas da OS (R2 adtelas-leads-private)
CREATE TABLE public.work_order_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    work_order_item_id UUID NULL,
    storage_key TEXT NOT NULL,
    safe_filename TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    etapa VARCHAR(20) NOT NULL DEFAULT 'antes',
    descricao TEXT NULL,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_wo_media_type CHECK (media_type IN ('photo', 'video')),
    CONSTRAINT chk_wo_media_etapa CHECK (etapa IN ('antes', 'durante', 'depois', 'laudo')),
    CONSTRAINT chk_wo_media_size CHECK (file_size_bytes > 0),
    CONSTRAINT fk_wo_media_wo FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_wo_media_item_wo FOREIGN KEY (work_order_item_id, work_order_id) REFERENCES public.work_order_items(id, work_order_id) ON DELETE SET NULL (work_order_item_id),
    CONSTRAINT fk_wo_media_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_wo_media_wo_id ON public.work_order_media(work_order_id);
CREATE INDEX idx_wo_media_item_id ON public.work_order_media(work_order_item_id);
CREATE INDEX idx_wo_media_storage_key ON public.work_order_media(storage_key);

COMMENT ON TABLE public.work_order_media IS 'Fotos e vídeos privados da OS armazenados no R2 com composite FK e SET NULL seguro.';

-- ------------------------------------------------------------------------------
-- BLOCO 05: FINANCEIRO, AGENDA E GARANTIAS
-- ------------------------------------------------------------------------------

-- 05.1. Tabela Core: Pagamentos Reais da Ordem de Serviço (1:N)
CREATE TABLE public.work_order_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    metodo_pagamento VARCHAR(30) NOT NULL DEFAULT 'pix',
    data_pagamento TIMESTAMPTZ NOT NULL DEFAULT now(),
    status_pagamento VARCHAR(20) NOT NULL DEFAULT 'confirmado',
    nota_comprovante TEXT NULL,
    cancelled_at TIMESTAMPTZ NULL,
    cancelled_by UUID NULL,
    motivo_cancelamento TEXT NULL,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_payments_valor CHECK (valor > 0),
    CONSTRAINT chk_payments_metodo CHECK (metodo_pagamento IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'boleto', 'transferencia')),
    CONSTRAINT chk_payments_status CHECK (status_pagamento IN ('confirmado', 'cancelado')),
    CONSTRAINT chk_payments_cancellation CHECK (
        (status_pagamento = 'confirmado' AND cancelled_at IS NULL AND motivo_cancelamento IS NULL) OR
        (status_pagamento = 'cancelado' AND cancelled_at IS NOT NULL AND motivo_cancelamento IS NOT NULL AND length(trim(motivo_cancelamento)) >= 3)
    ),
    CONSTRAINT fk_payments_wo FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_payments_wo_id ON public.work_order_payments(work_order_id);
CREATE INDEX idx_payments_status ON public.work_order_payments(status_pagamento);
CREATE INDEX idx_payments_data ON public.work_order_payments(data_pagamento);

COMMENT ON TABLE public.work_order_payments IS 'Lançamentos de recebimentos da OS com cancelamento auditável e sem hard delete.';

-- 05.2. Tabela Core: Agendamentos e Visitas Técnicas
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    client_id UUID NOT NULL,
    address_id UUID NULL,
    staff_id UUID NULL,
    tipo_agendamento VARCHAR(30) NOT NULL DEFAULT 'instalacao',
    data_hora_inicio TIMESTAMPTZ NOT NULL,
    data_hora_fim TIMESTAMPTZ NOT NULL,
    status_agendamento VARCHAR(30) NOT NULL DEFAULT 'agendado',
    observacoes TEXT NULL,
    rescheduled_from_id UUID NULL,
    motivo_reagendamento_cancelamento TEXT NULL,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_appointments_tipo CHECK (tipo_agendamento IN ('visita_tecnica', 'medicao', 'instalacao', 'manutencao', 'garantia')),
    CONSTRAINT chk_appointments_status CHECK (status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento', 'realizado', 'reagendado', 'cancelado')),
    CONSTRAINT chk_appointments_intervalo CHECK (data_hora_inicio < data_hora_fim),
    CONSTRAINT chk_appointments_motive CHECK (
        status_agendamento NOT IN ('reagendado', 'cancelado') OR
        (motivo_reagendamento_cancelamento IS NOT NULL AND length(trim(motivo_reagendamento_cancelamento)) >= 3)
    ),
    CONSTRAINT fk_appointments_work_order_client FOREIGN KEY (work_order_id, client_id) REFERENCES public.work_orders(id, client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_client_address FOREIGN KEY (address_id, client_id) REFERENCES public.client_addresses(id, client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_staff FOREIGN KEY (staff_id) REFERENCES public.crm_staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_appointments_rescheduled_from FOREIGN KEY (rescheduled_from_id) REFERENCES public.appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_appointments_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_appointments_wo_id ON public.appointments(work_order_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX idx_appointments_periodo ON public.appointments(data_hora_inicio, data_hora_fim);
CREATE INDEX idx_appointments_status ON public.appointments(status_agendamento);

COMMENT ON TABLE public.appointments IS 'Compromissos presenciais com integridade relacional composta para OS, cliente e endereço.';

-- 05.3. Tabela Core: Termos e Controle de Garantias
CREATE TABLE public.warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    work_order_item_id UUID NULL,
    client_id UUID NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    prazo_meses INT NOT NULL DEFAULT 12,
    status_operacional VARCHAR(30) NOT NULL DEFAULT 'normal',
    termos_condicoes TEXT NULL,
    observacoes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_warranties_prazo CHECK (prazo_meses > 0),
    CONSTRAINT chk_warranties_datas CHECK (data_inicio <= data_termino),
    CONSTRAINT chk_warranties_status CHECK (status_operacional IN ('normal', 'acionada', 'em_atendimento', 'resolvida', 'cancelada')),
    CONSTRAINT fk_warranties_work_order_client FOREIGN KEY (work_order_id, client_id) REFERENCES public.work_orders(id, client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_warranties_item_wo FOREIGN KEY (work_order_item_id, work_order_id) REFERENCES public.work_order_items(id, work_order_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX unq_warranties_item ON public.warranties(work_order_item_id) WHERE work_order_item_id IS NOT NULL;
CREATE UNIQUE INDEX unq_warranties_global_wo ON public.warranties(work_order_id) WHERE work_order_item_id IS NULL;
CREATE INDEX idx_warranties_wo_id ON public.warranties(work_order_id);
CREATE INDEX idx_warranties_client_id ON public.warranties(client_id);
CREATE INDEX idx_warranties_termino ON public.warranties(data_termino);
CREATE INDEX idx_warranties_status ON public.warranties(status_operacional);

COMMENT ON TABLE public.warranties IS 'Garantias com suporte a cobertura por item ou global da OS e composite integrity.';

-- ------------------------------------------------------------------------------
-- BLOCO 06: AUTOMAÇÃO DE NOTIFICAÇÕES E AUDITORIA
-- ------------------------------------------------------------------------------

-- 06.1. Tabela Core: Regras de Notificação do Agendador
CREATE TABLE public.notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_regra VARCHAR(100) NOT NULL,
    tipo_regra VARCHAR(40) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    horario_disparo TIME NOT NULL DEFAULT '09:00:00',
    dias_semana SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5,6}'::smallint[],
    offset_dias INT NOT NULL DEFAULT 0,
    destinatario_tipo VARCHAR(20) NOT NULL DEFAULT 'interno',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    configuracoes_extras JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_notif_rules_nome CHECK (length(trim(nome_regra)) >= 3),
    CONSTRAINT chk_notif_rules_tipo CHECK (tipo_regra IN ('agenda_diaria', 'agenda_semanal', 'agenda_personalizada', 'lembrete_visita', 'garantia_a_vencer', 'garantia_vencimento', 'pos_venda')),
    CONSTRAINT chk_notif_rules_destinatario CHECK (destinatario_tipo IN ('interno', 'cliente', 'ambos')),
    CONSTRAINT chk_notif_rules_dias_semana CHECK (
        cardinality(dias_semana) BETWEEN 1 AND 7 AND
        dias_semana <@ ARRAY[1,2,3,4,5,6,7]::smallint[] AND
        NOT (dias_semana @> ARRAY[NULL::smallint])
    )
);

CREATE INDEX idx_notif_rules_tipo ON public.notification_rules(tipo_regra) WHERE is_active = true;

COMMENT ON TABLE public.notification_rules IS 'Políticas e regras de agendamento de avisos e resumos de e-mail.';

-- 06.2. Tabela Core: Entregas de Notificação e Controle Concorrente
CREATE TABLE public.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    rule_id UUID NOT NULL,
    entity_type VARCHAR(30) NOT NULL DEFAULT 'digest',
    entity_id UUID NULL,
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    scheduled_for TIMESTAMPTZ NOT NULL,
    processing_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
    attempts INT NOT NULL DEFAULT 1,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ NULL,
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_notif_deliveries_entity CHECK (entity_type IN ('digest', 'appointment', 'warranty', 'work_order')),
    CONSTRAINT chk_notif_deliveries_status CHECK (status IN ('processing', 'sent', 'failed', 'uncertain', 'skipped')),
    CONSTRAINT chk_notif_deliveries_attempts CHECK (attempts >= 1),
    CONSTRAINT fk_notif_deliveries_rule FOREIGN KEY (rule_id) REFERENCES public.notification_rules(id) ON DELETE RESTRICT
);

CREATE INDEX idx_notif_deliveries_rule_id ON public.notification_deliveries(rule_id);
CREATE INDEX idx_notif_deliveries_status ON public.notification_deliveries(status);
CREATE INDEX idx_notif_deliveries_scheduled_for ON public.notification_deliveries(scheduled_for);
CREATE INDEX idx_notif_deliveries_locked_until ON public.notification_deliveries(locked_until) WHERE status = 'processing';

COMMENT ON TABLE public.notification_deliveries IS 'Auditoria de entregas com reserva prévia concorrente e tratamento de status uncertain.';

-- 06.3. Tabela Core: Trilha de Auditoria Corporativa (Append-Only Imutável)
CREATE TABLE public.crm_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    work_order_id UUID NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id UUID NOT NULL,
    acao VARCHAR(50) NOT NULL,
    dados_anteriores JSONB NULL,
    dados_novos JSONB NULL,
    descricao_humana TEXT NOT NULL,
    actor_id UUID NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_activity_log_entity CHECK (entity_type IN ('client', 'address', 'work_order', 'work_order_item', 'appointment', 'payment', 'warranty', 'media', 'note')),
    CONSTRAINT chk_activity_log_acao CHECK (acao IN (
        'client_created', 'converted_from_lead', 'client_updated', 'client_archived',
        'address_created', 'address_updated', 'address_deleted',
        'work_order_created', 'work_order_status_changed', 'work_order_completed', 'work_order_cancelled',
        'payment_received', 'payment_cancelled',
        'appointment_created', 'appointment_rescheduled', 'appointment_cancelled',
        'warranty_issued', 'warranty_triggered', 'warranty_resolved',
        'media_uploaded', 'media_removed',
        'note_added'
    )),
    CONSTRAINT fk_activity_log_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_activity_log_wo_client FOREIGN KEY (work_order_id, client_id) REFERENCES public.work_orders(id, client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_activity_log_actor FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_log_client_time ON public.crm_activity_log(client_id, occurred_at DESC);
CREATE INDEX idx_activity_log_wo_id ON public.crm_activity_log(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_activity_log_entity ON public.crm_activity_log(entity_type, entity_id);

COMMENT ON TABLE public.crm_activity_log IS 'Trilha de auditoria append-only imutável com minimização estrita de PII e FK RESTRICT.';

-- 06.4. Tabela Core: Anotações Humanas de Atendimento
CREATE TABLE public.crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    work_order_id UUID NULL,
    conteudo TEXT NOT NULL,
    categoria VARCHAR(30) NOT NULL DEFAULT 'geral',
    author_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_crm_notes_conteudo CHECK (length(trim(conteudo)) >= 2),
    CONSTRAINT chk_crm_notes_categoria CHECK (categoria IN ('geral', 'atendimento', 'financeiro', 'tecnico', 'cobranca')),
    CONSTRAINT fk_crm_notes_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_crm_notes_wo_client FOREIGN KEY (work_order_id, client_id) REFERENCES public.work_orders(id, client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_crm_notes_author FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_crm_notes_client_id ON public.crm_notes(client_id, created_at DESC);
CREATE INDEX idx_crm_notes_wo_id ON public.crm_notes(work_order_id) WHERE work_order_id IS NOT NULL;

COMMENT ON TABLE public.crm_notes IS 'Anotações humanas de atendimento vinculadas a clientes e OSs com composite foreign key RESTRICT.';

-- ------------------------------------------------------------------------------
-- BLOCO 07: TRIGGERS E FUNÇÕES DE BANCO
-- ------------------------------------------------------------------------------

-- 07.1. Triggers de updated_at autocontidos
CREATE TRIGGER trg_company_profile_updated_at
BEFORE UPDATE ON public.company_profile
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_crm_staff_updated_at
BEFORE UPDATE ON public.crm_staff
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_client_addresses_updated_at
BEFORE UPDATE ON public.client_addresses
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_work_order_items_updated_at
BEFORE UPDATE ON public.work_order_items
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_work_order_measurements_updated_at
BEFORE UPDATE ON public.work_order_measurements
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_warranties_updated_at
BEFORE UPDATE ON public.warranties
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_notification_rules_updated_at
BEFORE UPDATE ON public.notification_rules
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TRIGGER trg_crm_notes_updated_at
BEFORE UPDATE ON public.crm_notes
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

-- 07.2. Trigger: Imutabilidade Estrita do Activity Log (Append-Only Real)
CREATE FUNCTION public.prevent_crm_activity_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'ERR_CRM_ACTIVITY_LOG_IMMUTABLE: Records in crm_activity_log cannot be updated or deleted.';
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_crm_activity_log_mutation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_crm_activity_log_mutation() TO service_role;

CREATE TRIGGER trg_prevent_crm_activity_log_mutation
BEFORE UPDATE OR DELETE ON public.crm_activity_log
FOR EACH ROW EXECUTE FUNCTION public.prevent_crm_activity_log_mutation();

-- 07.3. Trigger: Imutabilidade de work_order_id em work_order_items
CREATE FUNCTION public.fn_prevent_item_wo_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF NEW.work_order_id <> OLD.work_order_id THEN
        RAISE EXCEPTION 'ERR_CANNOT_CHANGE_WORK_ORDER_ID_OF_ITEM';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_prevent_item_wo_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_prevent_item_wo_change() TO service_role;

CREATE TRIGGER trg_prevent_item_wo_change
BEFORE UPDATE ON public.work_order_items
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_item_wo_change();

-- 07.4. Trigger: Totalizador Concorrência-Safe de Ordens de Serviço
CREATE FUNCTION public.fn_recalculate_work_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_wo_id UUID;
    v_novo_total NUMERIC(12,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_wo_id := OLD.work_order_id;
    ELSE
        v_wo_id := NEW.work_order_id;
    END IF;
    
    -- Pessimistic row lock na OS para serializar cálculos concorrentes
    PERFORM 1 FROM public.work_orders WHERE id = v_wo_id FOR UPDATE;
    
    SELECT COALESCE(SUM(preco_total), 0.00)
    INTO v_novo_total
    FROM public.work_order_items
    WHERE work_order_id = v_wo_id;
    
    UPDATE public.work_orders
    SET valor_total = v_novo_total,
        updated_at = pg_catalog.now()
    WHERE id = v_wo_id;
    
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_recalculate_work_order_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_recalculate_work_order_totals() TO service_role;

CREATE TRIGGER trg_recalculate_work_order_totals
AFTER INSERT OR UPDATE OR DELETE ON public.work_order_items
FOR EACH ROW EXECUTE FUNCTION public.fn_recalculate_work_order_totals();

-- 07.5. Trigger: Numeração Anual Automática Concorrente no Timezone de SP
CREATE FUNCTION public.fn_generate_work_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_year INT;
    v_seq INT;
BEGIN
    IF NEW.numero_os IS NULL OR trim(NEW.numero_os) = '' THEN
        -- Determinação determinística do ano fiscal no fuso horário 'America/Sao_Paulo'
        v_year := EXTRACT(YEAR FROM (COALESCE(NEW.created_at, pg_catalog.now()) AT TIME ZONE 'America/Sao_Paulo'))::INT;
        
        INSERT INTO public.crm_work_order_counters (year, last_number)
        VALUES (v_year, 1)
        ON CONFLICT (year) DO UPDATE
        SET last_number = public.crm_work_order_counters.last_number + 1
        RETURNING last_number INTO v_seq;
        
        NEW.numero_os := 'OS-' || v_year::TEXT || '-' || LPAD(v_seq::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_generate_work_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_generate_work_order_number() TO service_role;

CREATE TRIGGER trg_generate_work_order_number
BEFORE INSERT ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.fn_generate_work_order_number();

-- ------------------------------------------------------------------------------
-- BLOCO 08: FUNCTION RPC ATÔMICA LEAD → CLIENTE
-- ------------------------------------------------------------------------------

CREATE FUNCTION public.convert_lead_to_client_atomic(
    p_lead_id UUID,
    p_actor_id UUID,
    p_tipo_cliente VARCHAR,
    p_nome VARCHAR,
    p_telefone_principal VARCHAR,
    p_email VARCHAR,
    p_cpf_cnpj VARCHAR,
    p_endereco_data JSONB,
    p_criar_os BOOLEAN,
    p_os_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_client_id UUID;
    v_address_id UUID := NULL;
    v_work_order_id UUID := NULL;
    v_numero_os VARCHAR(30) := NULL;
    v_lead RECORD;
    v_os_categoria VARCHAR(50);
    v_os_descricao VARCHAR(255);
    v_os_valor NUMERIC(12,2);
    v_os_prevista DATE;
    v_item_id UUID;
BEGIN
    -- 1. Validação defensiva do Ator (Administrador ativo)
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = p_actor_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR';
    END IF;

    -- 2. Validação estrita dos parâmetros do Cliente
    IF p_nome IS NULL OR length(trim(p_nome)) < 2 THEN
        RAISE EXCEPTION 'ERR_INVALID_CLIENT_NAME: Client name must have at least 2 characters.';
    END IF;
    IF p_telefone_principal IS NULL OR length(regexp_replace(p_telefone_principal, '\D', '', 'g')) < 10 THEN
        RAISE EXCEPTION 'ERR_INVALID_PHONE_NUMBER: Valid phone with DDD is required.';
    END IF;

    -- 3. Validação dos payloads JSON opcionais
    IF p_criar_os = true AND (p_os_data IS NULL OR jsonb_typeof(p_os_data) <> 'object') THEN
        RAISE EXCEPTION 'ERR_OS_DATA_REQUIRED: Valid JSON object is required when p_criar_os is true.';
    END IF;
    IF p_endereco_data IS NOT NULL AND jsonb_typeof(p_endereco_data) <> 'object' THEN
        RAISE EXCEPTION 'ERR_INVALID_ADDRESS_DATA: Address data must be a valid JSON object.';
    END IF;

    -- 4. Lock pessimista no Lead para impedir conversões concorrentes
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_LEAD_NOT_FOUND';
    END IF;

    -- 5. Validação de idempotência: Verifica se o lead já foi convertido
    SELECT id INTO v_client_id FROM public.clients WHERE lead_id = p_lead_id;
    IF v_client_id IS NOT NULL THEN
        RAISE EXCEPTION 'ERR_LEAD_ALREADY_CONVERTED';
    END IF;

    -- 6. Criação do Cliente
    INSERT INTO public.clients (
        lead_id,
        tipo_cliente,
        nome,
        cpf_cnpj,
        telefone_principal,
        email,
        status,
        created_by
    ) VALUES (
        p_lead_id,
        COALESCE(p_tipo_cliente, 'pessoa_fisica'),
        trim(p_nome),
        NULLIF(trim(p_cpf_cnpj), ''),
        trim(p_telefone_principal),
        NULLIF(trim(p_email), ''),
        'ativo',
        p_actor_id
    ) RETURNING id INTO v_client_id;

    -- 7. Criação opcional do Endereço Inicial
    IF p_endereco_data IS NOT NULL THEN
        INSERT INTO public.client_addresses (
            client_id,
            rotulo,
            tipo_imovel,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            uf,
            is_principal
        ) VALUES (
            v_client_id,
            COALESCE(p_endereco_data->>'rotulo', 'Principal'),
            COALESCE(p_endereco_data->>'tipo_imovel', 'outro'),
            NULLIF(trim(p_endereco_data->>'cep'), ''),
            NULLIF(trim(p_endereco_data->>'logradouro'), ''),
            NULLIF(trim(p_endereco_data->>'numero'), ''),
            NULLIF(trim(p_endereco_data->>'complemento'), ''),
            NULLIF(trim(p_endereco_data->>'bairro'), ''),
            COALESCE(NULLIF(trim(p_endereco_data->>'cidade'), ''), 'São Paulo'),
            COALESCE(NULLIF(trim(p_endereco_data->>'uf'), ''), 'SP'),
            true
        ) RETURNING id INTO v_address_id;
    END IF;

    -- 8. Criação opcional da Primeira Ordem de Serviço
    IF p_criar_os = true THEN
        v_os_categoria := COALESCE(p_os_data->>'categoria_operacional', 'outro');
        v_os_descricao := COALESCE(p_os_data->>'descricao', COALESCE(v_lead.servico, 'Serviço Inicial'));
        v_os_valor := COALESCE((p_os_data->>'valor_orcamento')::NUMERIC, COALESCE(v_lead.valor_orcamento, 0.00));
        v_os_prevista := NULLIF(p_os_data->>'data_prevista', '')::DATE;

        -- Inserção da OS (O trigger gera o numero_os se for passado NULL)
        INSERT INTO public.work_orders (
            client_id,
            address_id,
            status_os,
            valor_total,
            valor_desconto,
            data_prevista,
            created_by
        ) VALUES (
            v_client_id,
            v_address_id,
            'orcamento',
            0.00,
            0.00,
            v_os_prevista,
            p_actor_id
        ) RETURNING id, numero_os INTO v_work_order_id, v_numero_os;

        -- Inserção do Item Inicial da OS (O trigger recalcula o valor_total da OS)
        INSERT INTO public.work_order_items (
            work_order_id,
            service_key,
            categoria_operacional,
            descricao,
            quantidade,
            preco_unitario
        ) VALUES (
            v_work_order_id,
            NULL,
            v_os_categoria,
            v_os_descricao,
            1,
            v_os_valor
        ) RETURNING id INTO v_item_id;

        -- Associação lógica instantânea de fotos privadas do Lead na OS (Zero cópia no R2)
        INSERT INTO public.work_order_media (
            work_order_id,
            work_order_item_id,
            storage_key,
            safe_filename,
            media_type,
            mime_type,
            file_size_bytes,
            etapa,
            descricao,
            created_by
        )
        SELECT 
            v_work_order_id,
            v_item_id,
            storage_key,
            safe_filename,
            media_type,
            mime_type,
            file_size_bytes,
            'antes',
            'Mídia importada da solicitação original do Lead',
            p_actor_id
        FROM public.lead_media
        WHERE lead_id = p_lead_id AND upload_status = 'uploaded';
    END IF;

    -- 9. Atualização do status do Lead original
    UPDATE public.leads
    SET status = 'Fechado'
    WHERE id = p_lead_id;

    -- 10. Registro de auditoria com minimização estrita de PII
    INSERT INTO public.crm_activity_log (
        client_id,
        work_order_id,
        entity_type,
        entity_id,
        acao,
        dados_novos,
        descricao_humana,
        actor_id
    ) VALUES (
        v_client_id,
        v_work_order_id,
        'client',
        v_client_id,
        'converted_from_lead',
        jsonb_build_object(
            'lead_id', p_lead_id,
            'client_id', v_client_id,
            'work_order_id', v_work_order_id,
            'has_address', (v_address_id IS NOT NULL)
        ),
        'Cliente convertido a partir de Lead de marketing com sucesso.',
        p_actor_id
    );

    -- 11. Retorno com os identificadores gerados
    RETURN jsonb_build_object(
        'success', true,
        'client_id', v_client_id,
        'address_id', v_address_id,
        'work_order_id', v_work_order_id,
        'numero_os', v_numero_os
    );
END;
$$;

-- Permissões estritas da RPC (Restrito exclusivamente a service_role)
REVOKE ALL ON FUNCTION public.convert_lead_to_client_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, BOOLEAN, JSONB
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.convert_lead_to_client_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, BOOLEAN, JSONB
) TO service_role;

-- ------------------------------------------------------------------------------
-- BLOCO 09: ROW LEVEL SECURITY (RLS) E PRIVILÉGIOS (16 TABELAS)
-- ------------------------------------------------------------------------------

-- Habilitação de RLS em todas as 16 tabelas novas
ALTER TABLE public.crm_work_order_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

-- Revogação total de acesso direto para papéis públicos/anônimos/autenticados diretos
REVOKE ALL ON public.crm_work_order_counters FROM anon, authenticated;
REVOKE ALL ON public.company_profile FROM anon, authenticated;
REVOKE ALL ON public.crm_staff FROM anon, authenticated;
REVOKE ALL ON public.clients FROM anon, authenticated;
REVOKE ALL ON public.client_addresses FROM anon, authenticated;
REVOKE ALL ON public.work_orders FROM anon, authenticated;
REVOKE ALL ON public.work_order_items FROM anon, authenticated;
REVOKE ALL ON public.work_order_measurements FROM anon, authenticated;
REVOKE ALL ON public.work_order_media FROM anon, authenticated;
REVOKE ALL ON public.work_order_payments FROM anon, authenticated;
REVOKE ALL ON public.appointments FROM anon, authenticated;
REVOKE ALL ON public.warranties FROM anon, authenticated;
REVOKE ALL ON public.notification_rules FROM anon, authenticated;
REVOKE ALL ON public.notification_deliveries FROM anon, authenticated;
REVOKE ALL ON public.crm_activity_log FROM anon, authenticated;
REVOKE ALL ON public.crm_notes FROM anon, authenticated;

-- Concessão exclusiva de privilégio total para service_role (BFF Nitro)
GRANT ALL ON public.crm_work_order_counters TO service_role;
GRANT ALL ON public.company_profile TO service_role;
GRANT ALL ON public.crm_staff TO service_role;
GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.client_addresses TO service_role;
GRANT ALL ON public.work_orders TO service_role;
GRANT ALL ON public.work_order_items TO service_role;
GRANT ALL ON public.work_order_measurements TO service_role;
GRANT ALL ON public.work_order_media TO service_role;
GRANT ALL ON public.work_order_payments TO service_role;
GRANT ALL ON public.appointments TO service_role;
GRANT ALL ON public.warranties TO service_role;
GRANT ALL ON public.notification_rules TO service_role;
GRANT ALL ON public.notification_deliveries TO service_role;
GRANT ALL ON public.crm_activity_log TO service_role;
GRANT ALL ON public.crm_notes TO service_role;

-- ------------------------------------------------------------------------------
-- BLOCO 10: SEED INICIAL DO PERFIL DA EMPRESA (SOMENTE DADOS CONFIRMADOS)
-- ------------------------------------------------------------------------------

INSERT INTO public.company_profile (
    id,
    trade_name,
    legal_name,
    cnpj,
    phone_display,
    whatsapp_number,
    email_contact,
    website,
    cep,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    business_hours,
    warranty_support_hours,
    document_footer_text,
    logo_source,
    logo_path,
    logo_storage_key
) VALUES (
    1,
    'AD Telas e Redes',
    NULL,                                  -- TO_BE_DEFINED
    '40.297.694/0001-95',                  -- CONFIRMADO em Footer.vue e politica-de-privacidade.vue
    '(11) 98358-6611',                     -- CONFIRMADO em Footer.vue e contato.vue
    '5511983586611',                       -- CONFIRMADO em contato.vue e orcamento.vue
    'vendas.adtelaseredes@gmail.com',      -- CONFIRMADO em Footer.vue
    'https://www.adtelasmosquiteiras.com.br', -- CONFIRMADO em app.vue
    NULL,                                  -- TO_BE_DEFINED
    NULL,                                  -- TO_BE_DEFINED
    NULL,                                  -- TO_BE_DEFINED
    NULL,                                  -- TO_BE_DEFINED
    NULL,                                  -- TO_BE_DEFINED
    'São Paulo',                           -- CONFIRMADO
    'SP',                                  -- CONFIRMADO
    NULL,                                  -- TO_BE_DEFINED
    NULL,                                  -- TO_BE_DEFINED
    NULL,                                  -- TO_BE_DEFINED
    'static',                              -- CONFIRMADO
    '/images/logo_adt_telas_nova.png',     -- CONFIRMADO em Header.vue e emailService.ts
    NULL                                   -- NULL inicialmente
);

COMMIT;

-- ==============================================================================
-- FIM DA MIGRATION 010 (PRONTA PARA REVISÃO ESTÁTICA E VALIDAÇÃO FINAL)
-- ==============================================================================
