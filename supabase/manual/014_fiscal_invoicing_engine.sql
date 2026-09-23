-- ==============================================================================
-- MIGRATION 014: MOTOR FISCAL (NF-E / NFS-E), RESERVA EXCLUSIVA E LEASE PERSISTENTE
-- Projeto: AD Telas e Redes
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- BLOCO 01: PREFLIGHT DE DEPENDÊNCIAS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_table_name TEXT;
BEGIN
    FOREACH v_table_name IN ARRAY ARRAY[
        'work_orders', 'clients', 'client_addresses', 'work_order_items', 'company_profile'
    ]
    LOOP
        IF to_regclass('public.' || v_table_name) IS NULL THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: Tabela public.% ausente. Impossível aplicar Migration 014.', v_table_name;
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- BLOCO 02: CONFIGURAÇÕES FISCAIS E PERFIS
-- ------------------------------------------------------------------------------

-- 02.1. Configurações Fiscais da Empresa (Singleton)
CREATE TABLE IF NOT EXISTS public.company_fiscal_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    inscricao_municipal VARCHAR(30) NULL,
    inscricao_estadual VARCHAR(30) NULL,
    regime_tributario VARCHAR(30) NULL,
    cnae_principal VARCHAR(15) NULL,
    cnaes_secundarios TEXT[] NULL,
    codigo_municipio_ibge VARCHAR(7) NULL,
    ambiente_padrao VARCHAR(20) NOT NULL DEFAULT 'homologacao',
    provedor_ativo VARCHAR(50) NOT NULL DEFAULT 'mock_sandbox',
    nfe_serie VARCHAR(10) NULL,
    nfe_proximo_numero INT NULL,
    nfse_serie VARCHAR(10) NULL,
    nfse_proximo_numero INT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    CONSTRAINT chk_company_fiscal_singleton CHECK (id = 1),
    CONSTRAINT chk_company_fiscal_ambiente CHECK (ambiente_padrao IN ('homologacao', 'producao')),
    CONSTRAINT chk_company_fiscal_regime CHECK (regime_tributario IS NULL OR regime_tributario IN ('simples_nacional', 'simples_nacional_excesso', 'regime_normal', 'mei')),
    CONSTRAINT fk_company_fiscal_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 02.2. Complemento Fiscal do Destinatário (1:1 com clients)
CREATE TABLE IF NOT EXISTS public.client_fiscal_profiles (
    client_id UUID PRIMARY KEY,
    indicador_ie VARCHAR(5) NULL,
    inscricao_estadual VARCHAR(30) NULL,
    inscricao_municipal VARCHAR(30) NULL,
    email_fiscal VARCHAR(255) NULL,
    codigo_municipio_ibge VARCHAR(7) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_client_fiscal_indicador_ie CHECK (indicador_ie IS NULL OR indicador_ie IN ('1', '2', '9')),
    CONSTRAINT fk_client_fiscal_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- 02.3. Templates de Parametrização Fiscal (Serviços e Mercadorias)
CREATE TABLE IF NOT EXISTS public.fiscal_document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    tipo_item VARCHAR(20) NOT NULL,
    cfop VARCHAR(10) NULL,
    ncm VARCHAR(15) NULL,
    cest VARCHAR(15) NULL,
    cst_icms VARCHAR(10) NULL,
    csosn VARCHAR(10) NULL,
    codigo_servico_lc116 VARCHAR(20) NULL,
    codigo_tributacao_municipio VARCHAR(30) NULL,
    aliquota_iss_padrao NUMERIC(5,2) NULL,
    cClassTrib VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_fiscal_template_tipo_doc CHECK (tipo_documento IN ('nfe', 'nfse')),
    CONSTRAINT chk_fiscal_template_tipo_item CHECK (tipo_item IN ('servico', 'mercadoria'))
);

-- ------------------------------------------------------------------------------
-- BLOCO 03: DOCUMENTOS, ITENS E HISTÓRICO FISCAL
-- ------------------------------------------------------------------------------

-- 03.1. Documentos Fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    client_id UUID NOT NULL,
    address_id UUID NULL,
    numero_documento VARCHAR(30) NULL,
    serie VARCHAR(10) NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    ambiente VARCHAR(20) NOT NULL,
    is_simulated BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(25) NOT NULL DEFAULT 'rascunho',
    transmission_phase VARCHAR(30) NOT NULL DEFAULT 'draft',
    storage_pending BOOLEAN NOT NULL DEFAULT false,
    locked_by_executor VARCHAR(100) NULL,
    locked_until TIMESTAMPTZ NULL,
    lease_token UUID NULL,
    last_attempt_at TIMESTAMPTZ NULL,
    next_retry_at TIMESTAMPTZ NULL,
    provider VARCHAR(50) NOT NULL,
    provider_reference VARCHAR(100) NULL,
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    chave_acesso VARCHAR(44) NULL,
    numero_protocolo VARCHAR(60) NULL,
    data_autorizacao TIMESTAMPTZ NULL,
    codigo_status VARCHAR(20) NULL,
    motivo_status TEXT NULL,
    valor_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_servicos NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_produtos NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_liquido NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_iss NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_icms NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_pis NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_cofins NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_ibs NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_cbs NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_retencoes NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    snapshot_emitente JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_destinatario JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_fiscal_doc_tipo CHECK (tipo_documento IN ('nfe', 'nfse')),
    CONSTRAINT chk_fiscal_doc_ambiente CHECK (ambiente IN ('homologacao', 'producao')),
    CONSTRAINT chk_fiscal_doc_status CHECK (status IN ('rascunho', 'processando', 'autorizado', 'rejeitado', 'cancelado', 'falha_processamento')),
    CONSTRAINT chk_fiscal_doc_phase CHECK (transmission_phase IN ('draft', 'locked_pre_send', 'dispatched_awaiting_response', 'completed')),
    CONSTRAINT chk_fiscal_doc_valor_total CHECK (valor_total >= 0),
    CONSTRAINT chk_fiscal_doc_valor_desconto CHECK (valor_desconto >= 0),
    CONSTRAINT chk_fiscal_doc_valor_liquido CHECK (valor_liquido >= 0),
    CONSTRAINT fk_fiscal_doc_wo FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fiscal_doc_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fiscal_doc_address FOREIGN KEY (address_id) REFERENCES public.client_addresses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fiscal_doc_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_fiscal_doc_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fiscal_docs_wo ON public.fiscal_documents(work_order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_docs_client ON public.fiscal_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_docs_status ON public.fiscal_documents(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_docs_amb ON public.fiscal_documents(ambiente, is_simulated);
CREATE INDEX IF NOT EXISTS idx_fiscal_docs_lease ON public.fiscal_documents(locked_until) WHERE locked_until IS NOT NULL;

-- 03.2. Itens do Documento Fiscal
CREATE TABLE IF NOT EXISTS public.fiscal_document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_document_id UUID NOT NULL,
    work_order_item_id UUID NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    quantidade NUMERIC(10,3) NOT NULL,
    valor_unitario NUMERIC(10,2) NOT NULL,
    valor_total NUMERIC(12,2) NOT NULL,
    valor_desconto NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_liquido NUMERIC(12,2) NOT NULL,
    tipo_item VARCHAR(20) NOT NULL,
    ncm VARCHAR(15) NULL,
    cest VARCHAR(15) NULL,
    cfop VARCHAR(10) NULL,
    cst_icms VARCHAR(10) NULL,
    csosn VARCHAR(10) NULL,
    codigo_servico_lc116 VARCHAR(20) NULL,
    codigo_tributacao_municipio VARCHAR(30) NULL,
    aliquota_iss NUMERIC(5,2) NULL,
    iss_retido BOOLEAN NOT NULL DEFAULT false,
    cClassTrib VARCHAR(20) NULL,
    aliquota_ibs NUMERIC(5,2) NULL,
    aliquota_cbs NUMERIC(5,2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_fiscal_item_qtd CHECK (quantidade > 0),
    CONSTRAINT chk_fiscal_item_valor_un CHECK (valor_unitario >= 0),
    CONSTRAINT chk_fiscal_item_valor_tot CHECK (valor_total >= 0),
    CONSTRAINT chk_fiscal_item_tipo CHECK (tipo_item IN ('servico', 'mercadoria')),
    CONSTRAINT fk_fiscal_items_doc FOREIGN KEY (fiscal_document_id) REFERENCES public.fiscal_documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_fiscal_items_wo_item FOREIGN KEY (work_order_item_id) REFERENCES public.work_order_items(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fiscal_items_doc ON public.fiscal_document_items(fiscal_document_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_items_wo_item ON public.fiscal_document_items(work_order_item_id);

-- 03.3. Histórico Append-Only de Tentativas de Transmissão
CREATE TABLE IF NOT EXISTS public.fiscal_document_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_document_id UUID NOT NULL,
    attempt_number INT NOT NULL,
    transmission_phase VARCHAR(30) NOT NULL,
    request_payload JSONB NULL,
    response_payload JSONB NULL,
    http_status INT NULL,
    duration_ms INT NULL,
    status_result VARCHAR(30) NOT NULL,
    error_code VARCHAR(50) NULL,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id UUID NULL,
    CONSTRAINT fk_fiscal_attempts_doc FOREIGN KEY (fiscal_document_id) REFERENCES public.fiscal_documents(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fiscal_attempts_actor FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fiscal_attempts_doc ON public.fiscal_document_attempts(fiscal_document_id, attempt_number);

-- 03.4. Eventos Fiscais Oficiais
CREATE TABLE IF NOT EXISTS public.fiscal_document_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_document_id UUID NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    protocolo VARCHAR(60) NULL,
    descricao TEXT NOT NULL,
    xml_evento_storage_key VARCHAR(512) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id UUID NULL,
    CONSTRAINT fk_fiscal_events_doc FOREIGN KEY (fiscal_document_id) REFERENCES public.fiscal_documents(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fiscal_events_actor FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fiscal_events_doc ON public.fiscal_document_events(fiscal_document_id);

-- 03.5. Arquivos Fiscais no R2 Privado
CREATE TABLE IF NOT EXISTS public.fiscal_document_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_document_id UUID NOT NULL,
    tipo_arquivo VARCHAR(30) NOT NULL,
    storage_key VARCHAR(512) NOT NULL UNIQUE,
    sha256 VARCHAR(64) NOT NULL,
    size_bytes INT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_fiscal_file_tipo CHECK (tipo_arquivo IN ('xml_autorizado', 'xml_cancelamento', 'danfe_pdf', 'danfse_pdf')),
    CONSTRAINT fk_fiscal_files_doc FOREIGN KEY (fiscal_document_id) REFERENCES public.fiscal_documents(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fiscal_files_doc ON public.fiscal_document_files(fiscal_document_id);

-- ------------------------------------------------------------------------------
-- BLOCO 04: TRIGGERS DE IMUTABILIDADE E PROTEÇÃO DO HISTÓRICO
-- ------------------------------------------------------------------------------

-- 04.1. Blindagem de Itens (Editáveis apenas em rascunho ou rejeitado)
CREATE OR REPLACE FUNCTION public.fn_protect_fiscal_items()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_status VARCHAR(25);
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT status INTO v_parent_status FROM public.fiscal_documents WHERE id = OLD.fiscal_document_id;
    ELSE
        SELECT status INTO v_parent_status FROM public.fiscal_documents WHERE id = NEW.fiscal_document_id;
    END IF;

    IF v_parent_status IN ('processando', 'autorizado', 'cancelado', 'falha_processamento') THEN
        RAISE EXCEPTION 'ERR_FISCAL_ITEMS_LOCKED: Itens não podem ser modificados no status atual da nota (%).', v_parent_status;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trg_protect_fiscal_items ON public.fiscal_document_items;
CREATE TRIGGER trg_protect_fiscal_items
BEFORE INSERT OR UPDATE OR DELETE ON public.fiscal_document_items
FOR EACH ROW EXECUTE FUNCTION public.fn_protect_fiscal_items();

-- 04.2. Blindagem do Cabeçalho Fiscal e Snapshots
CREATE OR REPLACE FUNCTION public.fn_protect_fiscal_documents()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('processando', 'autorizado', 'cancelado', 'falha_processamento') THEN
            RAISE EXCEPTION 'ERR_DOCUMENT_DELETE_FORBIDDEN: Documento no status % não pode ser excluído fisicamente.', OLD.status;
        END IF;
        RETURN OLD;
    END IF;

    -- Em processando, falha_processamento, autorizado ou cancelado: congela valores fiscais e snapshots
    IF OLD.status IN ('processando', 'falha_processamento', 'autorizado', 'cancelado') THEN
        IF (NEW.valor_total IS DISTINCT FROM OLD.valor_total) OR
           (NEW.valor_servicos IS DISTINCT FROM OLD.valor_servicos) OR
           (NEW.valor_produtos IS DISTINCT FROM OLD.valor_produtos) OR
           (NEW.valor_desconto IS DISTINCT FROM OLD.valor_desconto) OR
           (NEW.valor_liquido IS DISTINCT FROM OLD.valor_liquido) OR
           (NEW.valor_iss IS DISTINCT FROM OLD.valor_iss) OR
           (NEW.valor_icms IS DISTINCT FROM OLD.valor_icms) OR
           (NEW.valor_pis IS DISTINCT FROM OLD.valor_pis) OR
           (NEW.valor_cofins IS DISTINCT FROM OLD.valor_cofins) OR
           (NEW.valor_ibs IS DISTINCT FROM OLD.valor_ibs) OR
           (NEW.valor_cbs IS DISTINCT FROM OLD.valor_cbs) OR
           (NEW.valor_retencoes IS DISTINCT FROM OLD.valor_retencoes) OR
           (NEW.snapshot_emitente IS DISTINCT FROM OLD.snapshot_emitente) OR
           (NEW.snapshot_destinatario IS DISTINCT FROM OLD.snapshot_destinatario) OR
           (NEW.snapshot_endereco IS DISTINCT FROM OLD.snapshot_endereco) OR
           (NEW.snapshot_itens IS DISTINCT FROM OLD.snapshot_itens) OR
           (NEW.work_order_id IS DISTINCT FROM OLD.work_order_id) OR
           (NEW.client_id IS DISTINCT FROM OLD.client_id) OR
           (NEW.address_id IS DISTINCT FROM OLD.address_id) OR
           (NEW.provider IS DISTINCT FROM OLD.provider) OR
           (NEW.tipo_documento IS DISTINCT FROM OLD.tipo_documento) OR
           (NEW.ambiente IS DISTINCT FROM OLD.ambiente) OR
           (NEW.is_simulated IS DISTINCT FROM OLD.is_simulated) OR
           (NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key) THEN
            RAISE EXCEPTION 'ERR_FISCAL_HEADER_FROZEN: Dados fiscais, financeiros e cadastrais estão congelados no status %.', OLD.status;
        END IF;

        -- Em autorizado ou cancelado: proíbe alterar chaves de acesso e número já emitidos
        IF OLD.status IN ('autorizado', 'cancelado') THEN
            IF (NEW.numero_documento IS DISTINCT FROM OLD.numero_documento) OR
               (NEW.serie IS DISTINCT FROM OLD.serie) OR
               (NEW.chave_acesso IS DISTINCT FROM OLD.chave_acesso) OR
               (NEW.numero_protocolo IS DISTINCT FROM OLD.numero_protocolo) OR
               (NEW.data_autorizacao IS DISTINCT FROM OLD.data_autorizacao) THEN
                RAISE EXCEPTION 'ERR_FISCAL_PROTOCOL_IMMUTABLE: Protocolo e identificadores de documento autorizado/cancelado são imutáveis.';
            END IF;

            -- Apenas autoriza transição de autorizado -> cancelado
            IF OLD.status = 'cancelado' AND NEW.status IS DISTINCT FROM 'cancelado' THEN
                RAISE EXCEPTION 'ERR_CANCELLED_DOCUMENT_TERMINAL: Documento cancelado é terminal.';
            END IF;
            IF OLD.status = 'autorizado' AND NEW.status NOT IN ('autorizado', 'cancelado') THEN
                RAISE EXCEPTION 'ERR_INVALID_STATUS_TRANSITION: Documento autorizado só pode transicionar para cancelado.';
            END IF;
        END IF;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trg_protect_fiscal_documents ON public.fiscal_documents;
CREATE TRIGGER trg_protect_fiscal_documents
BEFORE UPDATE OR DELETE ON public.fiscal_documents
FOR EACH ROW EXECUTE FUNCTION public.fn_protect_fiscal_documents();

-- 04.3. Append-Only em fiscal_document_attempts
CREATE OR REPLACE FUNCTION public.fn_prevent_attempts_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ERR_ATTEMPTS_HISTORY_IS_APPEND_ONLY: Tentativas de transmissão são estritamente append-only.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trg_prevent_attempts_mutation ON public.fiscal_document_attempts;
CREATE TRIGGER trg_prevent_attempts_mutation
BEFORE UPDATE OR DELETE ON public.fiscal_document_attempts
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_attempts_mutation();

-- ------------------------------------------------------------------------------
-- BLOCO 05: RPCS PRIVILEGIADAS — RESERVA ATÔMICA E LEASE PERSISTENTE
-- ------------------------------------------------------------------------------

-- 05.1. Reserva Atômica de Saldo e Início de Transmissão (transmit)
CREATE OR REPLACE FUNCTION public.reserve_fiscal_items_atomic(
    p_document_id UUID,
    p_executor_id VARCHAR(100),
    p_lease_seconds INT DEFAULT 180
) RETURNS JSONB AS $$
DECLARE
    v_doc RECORD;
    v_item RECORD;
    v_qtd_comprometida NUMERIC(10,3);
    v_lease_secs INT;
    v_lease_token UUID;
    v_item_ids UUID[];
BEGIN
    v_lease_secs := LEAST(600, GREATEST(10, COALESCE(p_lease_seconds, 180)));
    v_lease_token := gen_random_uuid();

    -- 1. Carrega documento e valida status
    SELECT id, work_order_id, ambiente, is_simulated, status, locked_by_executor, locked_until
    INTO v_doc
    FROM public.fiscal_documents
    WHERE id = p_document_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_DOC_NOT_FOUND: Documento fiscal % não encontrado.', p_document_id;
    END IF;

    IF v_doc.status NOT IN ('rascunho', 'rejeitado', 'falha_processamento') THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS_FOR_TRANSMIT: Documento no status % não pode iniciar transmissão.', v_doc.status;
    END IF;

    -- Valida lease atual
    IF v_doc.locked_until IS NOT NULL AND v_doc.locked_until >= now() AND v_doc.locked_by_executor <> p_executor_id THEN
        RAISE EXCEPTION 'ERR_LEASE_COLLISION: Documento já em execução por % até %.', v_doc.locked_by_executor, v_doc.locked_until;
    END IF;

    -- 2. Coleta IDs dos itens da OS faturados por esta nota
    SELECT array_agg(DISTINCT work_order_item_id) INTO v_item_ids
    FROM public.fiscal_document_items
    WHERE fiscal_document_id = p_document_id;

    IF v_item_ids IS NULL OR array_length(v_item_ids, 1) = 0 THEN
        RAISE EXCEPTION 'ERR_EMPTY_ITEMS: Documento fiscal não possui itens associados.';
    END IF;

    -- 3. Bloqueia exclusivamente os itens da OS em ordem consistente determinística (ORDER BY id ASC)
    PERFORM id
    FROM public.work_order_items
    WHERE id = ANY(v_item_ids)
    ORDER BY id ASC
    FOR UPDATE;

    -- 4. Para cada item, valida saldo disponível no mesmo ambiente
    FOR v_item IN (
        SELECT fdi.work_order_item_id, fdi.quantidade AS qtd_solicitada, woi.quantidade AS qtd_os
        FROM public.fiscal_document_items fdi
        JOIN public.work_order_items woi ON woi.id = fdi.work_order_item_id
        WHERE fdi.fiscal_document_id = p_document_id
    )
    LOOP
        SELECT COALESCE(SUM(fdi.quantidade), 0)
        INTO v_qtd_comprometida
        FROM public.fiscal_document_items fdi
        JOIN public.fiscal_documents fd ON fd.id = fdi.fiscal_document_id
        WHERE fdi.work_order_item_id = v_item.work_order_item_id
          AND fd.ambiente = v_doc.ambiente
          AND fd.is_simulated = v_doc.is_simulated
          AND fd.status IN ('processando', 'autorizado', 'falha_processamento')
          AND fd.id <> p_document_id;

        IF (v_qtd_comprometida + v_item.qtd_solicitada) > v_item.qtd_os THEN
            RAISE EXCEPTION 'ERR_ITEM_BALANCE_EXCEEDED: Item % ultrapassa saldo da OS (Solicitado: %, Disponível: %).',
                v_item.work_order_item_id, v_item.qtd_solicitada, (v_item.qtd_os - v_qtd_comprometida);
        END IF;
    END LOOP;

    -- 5. Atualiza documento para processando com lease persistente e token de aquisição
    UPDATE public.fiscal_documents
    SET status = 'processando',
        transmission_phase = 'locked_pre_send',
        locked_by_executor = p_executor_id,
        locked_until = now() + (v_lease_secs || ' seconds')::interval,
        lease_token = v_lease_token,
        last_attempt_at = now(),
        updated_at = now()
    WHERE id = p_document_id;

    RETURN jsonb_build_object(
        'success', true,
        'document_id', p_document_id,
        'status', 'processando',
        'transmission_phase', 'locked_pre_send',
        'lease_token', v_lease_token,
        'locked_until', now() + (v_lease_secs || ' seconds')::interval
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 05.2. Aquisição Atômica de Lease por Documento
CREATE OR REPLACE FUNCTION public.acquire_fiscal_execution_lease(
    p_document_id UUID,
    p_executor_id VARCHAR(100),
    p_lease_seconds INT DEFAULT 180
) RETURNS JSONB AS $$
DECLARE
    v_updated INT;
    v_lease_secs INT;
    v_lease_token UUID;
BEGIN
    v_lease_secs := LEAST(600, GREATEST(10, COALESCE(p_lease_seconds, 180)));
    v_lease_token := gen_random_uuid();

    UPDATE public.fiscal_documents
    SET locked_by_executor = p_executor_id,
        locked_until = now() + (v_lease_secs || ' seconds')::interval,
        lease_token = v_lease_token,
        updated_at = now()
    WHERE id = p_document_id
      AND status IN ('rascunho', 'processando', 'rejeitado', 'falha_processamento')
      AND (locked_until IS NULL OR locked_until < now() OR locked_by_executor = p_executor_id);

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated > 0 THEN
        RETURN jsonb_build_object(
            'acquired', true,
            'lease_token', v_lease_token,
            'locked_until', now() + (v_lease_secs || ' seconds')::interval
        );
    ELSE
        RETURN jsonb_build_object('acquired', false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 05.3. Renovação de Lease (Exclusivo para o Detentor do Token Vigente)
CREATE OR REPLACE FUNCTION public.renew_fiscal_execution_lease(
    p_document_id UUID,
    p_lease_token UUID,
    p_lease_seconds INT DEFAULT 180
) RETURNS BOOLEAN AS $$
DECLARE
    v_lease_secs INT;
    v_updated INT;
BEGIN
    IF p_lease_token IS NULL THEN
        RETURN false;
    END IF;

    v_lease_secs := LEAST(600, GREATEST(10, COALESCE(p_lease_seconds, 180)));

    UPDATE public.fiscal_documents
    SET locked_until = now() + (v_lease_secs || ' seconds')::interval,
        updated_at = now()
    WHERE id = p_document_id
      AND lease_token = p_lease_token
      AND locked_until >= now();

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 05.4. Liberação de Lease por Documento (Apenas pelo Dono do Lease Vigente)
CREATE OR REPLACE FUNCTION public.release_fiscal_execution_lease(
    p_document_id UUID,
    p_lease_token UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_updated INT;
BEGIN
    IF p_lease_token IS NULL THEN
        RETURN false;
    END IF;

    UPDATE public.fiscal_documents
    SET locked_by_executor = NULL,
        locked_until = NULL,
        lease_token = NULL,
        updated_at = now()
    WHERE id = p_document_id
      AND lease_token = p_lease_token
      AND locked_until >= now();

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 05.5. Conclusão Atômica de Emissão (Transição de Status Garantindo Token de Aquisição Vigente)
CREATE OR REPLACE FUNCTION public.complete_fiscal_emission_atomic(
    p_document_id UUID,
    p_lease_token UUID,
    p_target_status VARCHAR(25),
    p_codigo_status VARCHAR(20) DEFAULT NULL,
    p_motivo_status TEXT DEFAULT NULL,
    p_numero_doc VARCHAR(30) DEFAULT NULL,
    p_serie VARCHAR(10) DEFAULT NULL,
    p_chave_acesso VARCHAR(44) DEFAULT NULL,
    p_protocolo VARCHAR(60) DEFAULT NULL,
    p_data_autorizacao TIMESTAMPTZ DEFAULT NULL,
    p_storage_pending BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
    v_doc RECORD;
BEGIN
    -- 1. Confere lease vigente e exclusivo através do token de aquisição
    SELECT id, status, locked_by_executor, locked_until, lease_token
    INTO v_doc
    FROM public.fiscal_documents
    WHERE id = p_document_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_DOC_NOT_FOUND: Documento fiscal % não encontrado.', p_document_id;
    END IF;

    IF p_lease_token IS NULL OR v_doc.lease_token IS DISTINCT FROM p_lease_token OR v_doc.locked_until < now() THEN
        RAISE EXCEPTION 'ERR_LEASE_LOST_OR_EXPIRED: O executor perdeu a reserva vigente deste documento (token expirado ou substituído). Operação rejeitada.';
    END IF;

    IF p_target_status NOT IN ('autorizado', 'rejeitado', 'falha_processamento') THEN
        RAISE EXCEPTION 'ERR_INVALID_TARGET_STATUS: Status final % inválido.', p_target_status;
    END IF;

    -- 2. Atualiza estado e libera lease
    UPDATE public.fiscal_documents
    SET status = p_target_status,
        transmission_phase = 'completed',
        codigo_status = COALESCE(p_codigo_status, codigo_status),
        motivo_status = COALESCE(p_motivo_status, motivo_status),
        numero_documento = COALESCE(p_numero_doc, numero_documento),
        serie = COALESCE(p_serie, serie),
        chave_acesso = COALESCE(p_chave_acesso, chave_acesso),
        numero_protocolo = COALESCE(p_protocolo, numero_protocolo),
        data_autorizacao = CASE WHEN p_target_status = 'autorizado' THEN COALESCE(p_data_autorizacao, now()) ELSE data_autorizacao END,
        storage_pending = p_storage_pending,
        locked_by_executor = NULL,
        locked_until = NULL,
        lease_token = NULL,
        updated_at = now()
    WHERE id = p_document_id;

    -- 3. Registra evento oficial auditável
    INSERT INTO public.fiscal_document_events (
        fiscal_document_id, tipo_evento, protocolo, descricao
    ) VALUES (
        p_document_id,
        CASE 
            WHEN p_target_status = 'autorizado' THEN 'autorizacao'
            WHEN p_target_status = 'rejeitado' THEN 'rejeicao'
            ELSE 'falha_processamento'
        END,
        p_protocolo,
        COALESCE(p_motivo_status, 'Transição de status fiscal para ' || p_target_status)
    );

    RETURN jsonb_build_object(
        'success', true,
        'document_id', p_document_id,
        'status', p_target_status,
        'chave_acesso', p_chave_acesso,
        'protocolo', p_protocolo,
        'storage_pending', p_storage_pending
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ------------------------------------------------------------------------------
-- BLOCO 06: ROW LEVEL SECURITY (RLS) E PRIVILÉGIOS MÍNIMOS
-- ------------------------------------------------------------------------------

ALTER TABLE public.company_fiscal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_fiscal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_document_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_document_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_document_files ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.company_fiscal_settings,
                    public.client_fiscal_profiles,
                    public.fiscal_document_templates,
                    public.fiscal_documents,
                    public.fiscal_document_items,
                    public.fiscal_document_attempts,
                    public.fiscal_document_events,
                    public.fiscal_document_files FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.reserve_fiscal_items_atomic(UUID, VARCHAR, INT),
                        public.acquire_fiscal_execution_lease(UUID, VARCHAR, INT),
                        public.renew_fiscal_execution_lease(UUID, UUID, INT),
                        public.release_fiscal_execution_lease(UUID, UUID),
                        public.complete_fiscal_emission_atomic(UUID, UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TIMESTAMPTZ, BOOLEAN) FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.company_fiscal_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.client_fiscal_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.fiscal_document_templates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fiscal_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fiscal_document_items TO service_role;
GRANT SELECT, INSERT ON TABLE public.fiscal_document_attempts TO service_role;
GRANT SELECT, INSERT ON TABLE public.fiscal_document_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.fiscal_document_files TO service_role;

GRANT EXECUTE ON FUNCTION public.reserve_fiscal_items_atomic(UUID, VARCHAR, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.acquire_fiscal_execution_lease(UUID, VARCHAR, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.renew_fiscal_execution_lease(UUID, UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_fiscal_execution_lease(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_fiscal_emission_atomic(UUID, UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TIMESTAMPTZ, BOOLEAN) TO service_role;

COMMIT;
