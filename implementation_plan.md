# Implementation Plan — Fase 4.1 (Patch 4.1A.3): Orçamentos Comerciais, Versionamento e PDF Profissional

## 1. Visão Geral e Arquitetura Transacional em Duas Fases

A **Fase 4.1** implementa a gestão de **Orçamentos Comerciais Versionados e Imutáveis** vinculados a Ordens de Serviço (OS) em status `orcamento`.

Para garantir consistência absoluta entre o número da revisão (`Rev. NN`), o ID da proposta (`proposal_id`), a chave no storage R2 e os snapshots canônicos do banco de dados, adota-se o padrão de **Emissão em Duas Fases (Reserva DB -> Geração PDF -> Upload R2 -> Finalização DB)** com reconciliação de outcomes incertos e compensação SAGA.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ FLUXO OFICIAL DE EMISSÃO DA PROPOSTA (POST /api/admin/crm/work-orders/:id/proposals/issue)   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                             │
      ┌──────────────────────────────────────┴──────────────────────────────────────┐
      ▼                                                                             ▼
[ 1. FASE 1: RESERVA TRANSACIONAL DB ]                               [ 2. FASE 2: PDF & STORAGE R2 ]
RPC: reserve_work_order_proposal_atomic                               Backend Nitro (In-Memory)
- Lock FOR UPDATE: work_order                                         - Recebe frozen snapshots da reserva
- Valida ator admin ativo (public.admin_users)                        - Gera PDF com "OS-XXXX / Rev. NN"
- Valida status_os = 'orcamento', is_archived = false                 - Rótulo de prévia NÃO é usado aqui
- Valida idempotency_key e hash do payload (SHA-256)                  - Calcula SHA-256 e bytes do buffer
- Garante ONE_IN_FLIGHT (bloqueia 2ª reserva simultânea)             - Upload R2 Privado:
- Aloca version_number = MAX(version) + 1                               proposals/{wo_id}/{proposal_id}.pdf
- Gera proposal_id                                                    - Se timeout/incerto: reconcilia HEAD
- Captura snapshots canônicos de company_profile,                     - Se falhar: chama mark_failed RPC
  clients, client_addresses, items, measurements                                   │
- Grava work_order_proposals:                                                       │
    generation_status = 'reserved', status = NULL                                   │
- COMMIT & Retorna frozen snapshots + version_number                                │
      │                                                                             │
      └──────────────────────────────────────┬──────────────────────────────────────┘
                                             │
                                             ▼
                        [ 3. FASE 3: FINALIZAÇÃO ATÔMICA DB ]
                        RPC: finalize_work_order_proposal_atomic
                        - Lock FOR UPDATE ordenado: work_order -> proposal
                        - Valida ator admin ativo
                        - Revalida work_order (status_os = 'orcamento', is_archived = false)
                        - Valida generation_status == 'reserved'
                        - Valida ordem da revisão (version_number é a mais recente)
                        - Valida prefixo do R2 ('proposals/{wo}/{id}.pdf'), SHA-256 e bytes
                        - Atualiza: generation_status = 'ready', status = 'issued', issued_at = now()
                        - Transita proposta ativa anterior para 'superseded'
                        - Atualiza work_orders (proposal_issued_at, proposal_valid_until)
                        - Grava crm_activity_log (proposal_issued, proposal_superseded)
                        - COMMIT
                                             │
                        ┌────────────────────┴────────────────────┐
                        │ (Sucesso)                               │ (Resultado Incerto / Conexão Perdida)
                        ▼                                         ▼
                 Retorna HTTP 201                          Reconciliação Obrigatória:
                 { success: true, proposal }               - NÃO deleta R2 imediatamente
                                                           - Consulta proposta no banco
                                                           - Se ready -> sucesso
                                                           - Se reserved -> retry finalize
                                                           - Somente compensa R2 após provar
                                                             que finalização não foi commitada
```

---

## 2. Especificação da Migration 011 (`011_crm_work_order_proposals.sql`)

### 2.1. Preflight Fail-Fast Transacional

```sql
BEGIN;

-- 1. Verificação Fail-Fast de Pré-requisitos da Migration 010
DO $$
DECLARE
    v_missing_dep TEXT := '';
BEGIN
    IF to_regclass('public.work_orders') IS NULL THEN v_missing_dep := v_missing_dep || ' work_orders'; END IF;
    IF to_regclass('public.work_order_items') IS NULL THEN v_missing_dep := v_missing_dep || ' work_order_items'; END IF;
    IF to_regclass('public.work_order_measurements') IS NULL THEN v_missing_dep := v_missing_dep || ' work_order_measurements'; END IF;
    IF to_regclass('public.clients') IS NULL THEN v_missing_dep := v_missing_dep || ' clients'; END IF;
    IF to_regclass('public.client_addresses') IS NULL THEN v_missing_dep := v_missing_dep || ' client_addresses'; END IF;
    IF to_regclass('public.company_profile') IS NULL THEN v_missing_dep := v_missing_dep || ' company_profile'; END IF;
    IF to_regclass('public.admin_users') IS NULL THEN v_missing_dep := v_missing_dep || ' admin_users'; END IF;
    IF to_regclass('public.crm_activity_log') IS NULL THEN v_missing_dep := v_missing_dep || ' crm_activity_log'; END IF;

    IF v_missing_dep <> '' THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Missing prerequisite tables: %', v_missing_dep;
    END IF;

    -- Detecção de Drift: work_order_proposals não pode existir
    IF to_regclass('public.work_order_proposals') IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Table public.work_order_proposals already exists (drift detected).';
    END IF;
END $$;
```

---

### 2.2. Tabela `public.work_order_proposals` (Alinhada ao Schema Real e com Cross-Field Constraints)

```sql
CREATE TABLE public.work_order_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    client_id UUID NOT NULL,
    version_number INT NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    idempotency_request_sha256 VARCHAR(64) NOT NULL,
    
    -- Estados: Técnico (generation_status) e Comercial (status)
    -- Durante reserva, status comercial é obrigatoriamente NULL
    generation_status VARCHAR(20) NOT NULL DEFAULT 'reserved', -- 'reserved', 'ready', 'failed'
    status VARCHAR(20) NULL,                                   -- NULL (em reserva/falha) ou 'issued', 'superseded', 'accepted'
    
    -- Snapshots Imutáveis Capturados na Reserva PostgreSQL
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
    
    -- Lease de Reserva Técnica para Tratamento de Falhas/Processos Mortos
    reservation_expires_at TIMESTAMPTZ NULL,
    
    -- Datas e Auditoria
    issued_at TIMESTAMPTZ NULL,
    valid_until DATE NOT NULL,
    issued_by UUID NULL,
    accepted_at TIMESTAMPTZ NULL,
    accepted_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints de Domínio e Validação Estrutural JSONB
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
    
    -- Cross-Field Constraints Estritas entre Estado Técnico e Comercial
    CONSTRAINT chk_proposals_generation_cross_field CHECK (
        (generation_status = 'reserved' AND status IS NULL AND pdf_storage_key IS NULL AND pdf_sha256 IS NULL AND pdf_size_bytes IS NULL AND issued_at IS NULL) OR
        (generation_status = 'failed' AND status IS NULL AND pdf_storage_key IS NULL AND pdf_sha256 IS NULL AND pdf_size_bytes IS NULL AND issued_at IS NULL) OR
        (generation_status = 'ready' AND status IN ('issued', 'superseded', 'accepted') AND pdf_storage_key IS NOT NULL AND pdf_sha256 IS NOT NULL AND pdf_size_bytes IS NOT NULL AND issued_at IS NOT NULL)
    ),
    
    -- Consistência de Aceitação (Par accepted_at / accepted_by e status)
    CONSTRAINT chk_proposals_accepted_consistency CHECK (
        ((accepted_at IS NULL AND accepted_by IS NULL) AND status IN ('issued', 'superseded')) OR
        ((accepted_at IS NOT NULL AND accepted_by IS NOT NULL) AND status IN ('accepted', 'superseded'))
    ),
    
    -- Integridade Referencial Composta (Garante que client_id pertence exatamente à work_order_id)
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

-- Garantia de no MÁXIMO UMA proposta 'accepted' por OS
CREATE UNIQUE INDEX unq_proposals_one_accepted ON public.work_order_proposals(work_order_id) 
    WHERE status = 'accepted' AND generation_status = 'ready';

-- Garantia de no MÁXIMO UMA proposta ativa 'issued' por OS
CREATE UNIQUE INDEX unq_proposals_one_issued ON public.work_order_proposals(work_order_id) 
    WHERE status = 'issued' AND generation_status = 'ready';

-- Garantia de ONE_IN_FLIGHT: no máximo UMA reserva 'reserved' por OS
CREATE UNIQUE INDEX unq_proposals_one_reserved ON public.work_order_proposals(work_order_id) 
    WHERE generation_status = 'reserved';
```

---

### 2.3. Alteração em `public.work_orders` (Integridade Composta de Proposta Aceita)

```sql
-- Adiciona coluna de proposta aceita vinculada com foreign key composta RESTRICT (sem IF NOT EXISTS)
ALTER TABLE public.work_orders
    ADD COLUMN accepted_proposal_id UUID NULL;

ALTER TABLE public.work_orders
    ADD CONSTRAINT fk_work_orders_accepted_proposal 
    FOREIGN KEY (accepted_proposal_id, id) 
    REFERENCES public.work_order_proposals(id, work_order_id) 
    ON DELETE RESTRICT;

CREATE INDEX idx_work_orders_accepted_proposal ON public.work_orders(accepted_proposal_id) WHERE accepted_proposal_id IS NOT NULL;
```

---

### 2.4. Trigger de Imutabilidade Estrita de Conteúdo (`fn_prevent_proposal_content_mutation`)

```sql
CREATE OR REPLACE FUNCTION public.fn_prevent_proposal_content_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    -- Se a proposta já estava finalizada ('ready'), bloqueia qualquer alteração em snapshots, metadados, PDF ou generation_status
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
           OLD.issued_at <> NEW.issued_at OR
           OLD.valid_until <> NEW.valid_until OR
           OLD.issued_by IS DISTINCT FROM NEW.issued_by OR
           OLD.created_at <> NEW.created_at THEN
            RAISE EXCEPTION 'MUTATION_BLOCKED: Proposal content, snapshots and PDF metadata are permanently immutable once issued.';
        END IF;
        
        -- Validação de Transições Comerciais Permitidas
        IF OLD.status = 'superseded' AND NEW.status <> 'superseded' THEN
            RAISE EXCEPTION 'MUTATION_BLOCKED: A superseded proposal cannot change status.';
        END IF;
        IF OLD.status = 'accepted' AND NEW.status NOT IN ('accepted', 'superseded') THEN
            RAISE EXCEPTION 'MUTATION_BLOCKED: An accepted proposal can only transition to superseded upon work order reopening and new revision.';
        END IF;
        
        -- Preservação de accepted_at e accepted_by
        IF OLD.accepted_at IS NOT NULL AND (NEW.accepted_at <> OLD.accepted_at OR NEW.accepted_by <> OLD.accepted_by) THEN
            RAISE EXCEPTION 'MUTATION_BLOCKED: Accepted metadata is permanent and cannot be modified or cleared.';
        END IF;
    END IF;
    
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_proposal_content_mutation
BEFORE UPDATE ON public.work_order_proposals
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_proposal_content_mutation();
```

---

### 2.5. Bloqueio de Hard-Delete de Propostas

```sql
CREATE OR REPLACE FUNCTION public.fn_prevent_proposal_delete()
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
```

---

### 2.6. Hardening de Segurança (RLS e Privilégios)

```sql
-- RLS e Revogação de Acesso Direto do Frontend
ALTER TABLE public.work_order_proposals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.work_order_proposals FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.work_order_proposals TO service_role;
```

---

## 3. Funções RPC PostgreSQL Atômicas (Security Definer)

### 3.1. RPC: `public.reserve_work_order_proposal_atomic`

```sql
CREATE OR REPLACE FUNCTION public.reserve_work_order_proposal_atomic(
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
    v_client RECORD;
    v_address RECORD;
    v_company RECORD;
    v_items JSONB;
    v_totals JSONB;
    v_company_snapshot JSONB;
    v_client_snapshot JSONB;
    v_address_snapshot JSONB := NULL;
    v_next_version INT;
    v_proposal_id UUID;
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_incluir_medicoes BOOLEAN := COALESCE((p_commercial_terms->>'incluir_medicoes')::boolean, false);
BEGIN
    -- 1. Validação de Ator Admin Ativo
    IF p_actor_id IS NULL THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor ID is required.';
    END IF;

    SELECT is_active INTO v_actor_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_actor_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor is not an active administrator.';
    END IF;

    -- 2. Validação de Formato SHA-256
    IF p_idempotency_request_sha256 !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'ERR_INVALID_IDEMPOTENCY_SHA: Idempotency request hash must be exactly 64 lowercase hexadecimal characters.';
    END IF;

    -- 3. Lock transacional da Work Order (Padronização: WORK_ORDER_THEN_PROPOSAL)
    SELECT id, numero_os, client_id, address_id, status_os, is_archived, valor_total, valor_desconto, valor_final, updated_at 
    INTO v_wo
    FROM public.work_orders
    WHERE id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Work order % not found.', p_work_order_id;
    END IF;

    -- 4. Validação de Arquivamento e Status
    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Cannot issue proposals for an archived work order.';
    END IF;

    IF v_wo.status_os <> 'orcamento' THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS: Proposals can only be issued when work order is in status orcamento (current: %).', v_wo.status_os;
    END IF;

    -- 5. Validação de Concorrência Otimista
    IF p_expected_wo_updated_at IS NOT NULL AND v_wo.updated_at <> p_expected_wo_updated_at THEN
        RAISE EXCEPTION 'ERR_CONCURRENCY_CONFLICT: Work order was modified by another user. Please refresh and try again.';
    END IF;

    -- 6. Idempotency Check Seguro sob Lock
    SELECT * INTO v_existing_proposal 
    FROM public.work_order_proposals 
    WHERE work_order_id = p_work_order_id AND idempotency_key = p_idempotency_key;
    
    IF FOUND THEN
        IF v_existing_proposal.idempotency_request_sha256 <> p_idempotency_request_sha256 THEN
            RAISE EXCEPTION 'ERR_IDEMPOTENCY_MISMATCH: Idempotency key reused with different commercial payload.';
        END IF;

        -- Se a reserva anterior estava em 'failed', permite reativação controlada se for a versão mais recente
        IF v_existing_proposal.generation_status = 'failed' THEN
            SELECT COALESCE(MAX(version_number), 0) INTO v_next_version
            FROM public.work_order_proposals
            WHERE work_order_id = p_work_order_id;

            IF v_existing_proposal.version_number = v_next_version THEN
                UPDATE public.work_order_proposals
                SET generation_status = 'reserved', updated_at = v_now
                WHERE id = v_existing_proposal.id;
            ELSE
                RAISE EXCEPTION 'ERR_CANNOT_RETRY_FAILED_OLD_VERSION: A newer revision already exists.';
            END IF;
        END IF;

        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'is_idempotent_replay', true,
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
            'valid_until', v_existing_proposal.valid_until
        );
    END IF;

    -- 7. Verificação de Reserva em Andamento (ONE_IN_FLIGHT)
    IF EXISTS (
        SELECT 1 FROM public.work_order_proposals 
        WHERE work_order_id = p_work_order_id AND generation_status = 'reserved'
    ) THEN
        RAISE EXCEPTION 'ERR_PROPOSAL_ISSUE_IN_PROGRESS: Another proposal issuance is currently in progress for this work order.';
    END IF;

    -- 8. Captura Canônica de Snapshots dentro da Transação (Fail-Closed)
    -- 8.1. Company Snapshot (Campos Reais da Migration 010)
    SELECT * INTO v_company FROM public.company_profile WHERE id = 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_COMPANY_PROFILE_MISSING: Company profile record (id=1) is missing in database.';
    END IF;

    v_company_snapshot := pg_catalog.jsonb_build_object(
        'trade_name', v_company.trade_name,
        'legal_name', v_company.legal_name,
        'cnpj', v_company.cnpj,
        'phone_display', v_company.phone_display,
        'whatsapp_number', v_company.whatsapp_number,
        'email_contact', v_company.email_contact,
        'website', v_company.website,
        'cep', v_company.cep,
        'street', v_company.street,
        'number', v_company.number,
        'complement', v_company.complement,
        'neighborhood', v_company.neighborhood,
        'city', v_company.city,
        'state', v_company.state,
        'document_footer_text', v_company.document_footer_text,
        'logo_source', v_company.logo_source,
        'logo_path', v_company.logo_path,
        'logo_storage_key', v_company.logo_storage_key
    );

    -- 8.2. Client Snapshot
    SELECT * INTO v_client FROM public.clients WHERE id = v_wo.client_id;
    v_client_snapshot := pg_catalog.jsonb_build_object(
        'nome', v_client.nome,
        'nome_fantasia', v_client.nome_fantasia,
        'razao_social', v_client.razao_social,
        'cpf_cnpj', v_client.cpf_cnpj,
        'telefone_principal', v_client.telefone_principal,
        'email', v_client.email,
        'tipo_cliente', v_client.tipo_cliente
    );

    -- 8.3. Address Snapshot (se houver)
    IF v_wo.address_id IS NOT NULL THEN
        SELECT * INTO v_address FROM public.client_addresses WHERE id = v_wo.address_id AND client_id = v_wo.client_id;
        IF FOUND THEN
            v_address_snapshot := pg_catalog.jsonb_build_object(
                'logradouro', v_address.logradouro,
                'numero', v_address.numero,
                'complemento', v_address.complemento,
                'bairro', v_address.bairro,
                'cidade', v_address.cidade,
                'uf', v_address.uf,
                'cep', v_address.cep,
                'rotulo', v_address.rotulo
            );
        END IF;
    END IF;

    -- 8.4. Items Snapshot com medições opcionais (Campos Reais da Migration 010, sem observacoes internas)
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
    ) INTO v_items
    FROM public.work_order_items i
    WHERE i.work_order_id = p_work_order_id;

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'ERR_NO_ITEMS: Cannot issue a proposal for a work order with no items.';
    END IF;

    -- 8.5. Totals Snapshot
    v_totals := pg_catalog.jsonb_build_object(
        'valor_total', v_wo.valor_total,
        'valor_desconto', v_wo.valor_desconto,
        'valor_final', v_wo.valor_final,
        'moeda', 'BRL'
    );

    -- 9. Cálculo atômico da próxima versão
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM public.work_order_proposals
    WHERE work_order_id = p_work_order_id;

    -- 10. Inserção da Reserva Técnica (status comercial é NULL durante reserva)
    INSERT INTO public.work_order_proposals (
        work_order_id, client_id, version_number, idempotency_key, idempotency_request_sha256,
        generation_status, status,
        company_snapshot, client_snapshot, address_snapshot, items_snapshot, totals_snapshot, commercial_terms,
        pdf_storage_key, pdf_sha256, pdf_size_bytes,
        issued_at, valid_until, issued_by
    ) VALUES (
        p_work_order_id, v_wo.client_id, v_next_version, p_idempotency_key, p_idempotency_request_sha256,
        'reserved', NULL,
        v_company_snapshot, v_client_snapshot, v_address_snapshot, v_items, v_totals, p_commercial_terms,
        NULL, NULL, NULL,
        NULL, p_valid_until, p_actor_id
    ) RETURNING id INTO v_proposal_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'is_idempotent_replay', false,
        'proposal_id', v_proposal_id,
        'version_number', v_next_version,
        'numero_os', v_wo.numero_os,
        'generation_status', 'reserved',
        'status', NULL,
        'company_snapshot', v_company_snapshot,
        'client_snapshot', v_client_snapshot,
        'address_snapshot', v_address_snapshot,
        'items_snapshot', v_items,
        'totals_snapshot', v_totals,
        'commercial_terms', p_commercial_terms,
        'valid_until', p_valid_until
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_work_order_proposal_atomic(UUID,TIMESTAMPTZ,VARCHAR,VARCHAR,JSONB,DATE,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_work_order_proposal_atomic(UUID,TIMESTAMPTZ,VARCHAR,VARCHAR,JSONB,DATE,UUID) TO service_role;
```

---

### 3.2. RPC: `public.finalize_work_order_proposal_atomic`

```sql
CREATE OR REPLACE FUNCTION public.finalize_work_order_proposal_atomic(
    p_proposal_id UUID,
    p_work_order_id UUID,
    p_pdf_storage_key VARCHAR(255),
    p_pdf_sha256 VARCHAR(64),
    p_pdf_size_bytes INT,
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
    v_now TIMESTAMPTZ := pg_catalog.now();
    v_expected_storage_key VARCHAR(255) := 'proposals/' || p_work_order_id || '/' || p_proposal_id || '.pdf';
    v_previous_active RECORD;
    v_max_version INT;
BEGIN
    -- 1. Validação de Ator Admin Ativo
    IF p_actor_id IS NULL THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor ID is required.';
    END IF;

    SELECT is_active INTO v_actor_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_actor_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor is not an active administrator.';
    END IF;

    -- 2. Validação de Formato e Prefixo do Storage Key e SHA-256
    IF p_pdf_storage_key <> v_expected_storage_key THEN
        RAISE EXCEPTION 'ERR_INVALID_STORAGE_KEY: Storage key % does not match expected canonical path %.', p_pdf_storage_key, v_expected_storage_key;
    END IF;

    IF p_pdf_sha256 !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'ERR_INVALID_SHA256: SHA-256 hash must be exactly 64 lowercase hexadecimal characters.';
    END IF;

    IF p_pdf_size_bytes <= 0 THEN
        RAISE EXCEPTION 'ERR_INVALID_FILE_SIZE: PDF file size must be greater than zero.';
    END IF;

    -- 3. Lock transacional ordenado: WORK_ORDER -> PROPOSAL
    SELECT id, client_id, status_os, is_archived, accepted_proposal_id, updated_at INTO v_wo
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

    -- 4. Replay Idempotente com Verificação de Metadados
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
            'issued_at', v_prop.issued_at
        );
    END IF;

    IF v_prop.generation_status <> 'reserved' THEN
        RAISE EXCEPTION 'ERR_INVALID_GENERATION_STATUS: Proposal cannot be finalized in generation status %.', v_prop.generation_status;
    END IF;

    -- 5. Validação de Ordem da Revisão (Bloqueia finalização fora de ordem)
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
    ) LOOP
        -- Se for superseder proposta anteriormente 'accepted', exige que a OS já tenha sido formalmente reaberta (accepted_proposal_id IS NULL)
        IF v_previous_active.status = 'accepted' AND v_wo.accepted_proposal_id IS NOT NULL THEN
            RAISE EXCEPTION 'ERR_ACCEPTED_SUPERSEDE_REQUIRES_REOPENED_WO: Cannot supersede accepted proposal while it is still linked as the active accepted proposal of the work order.';
        END IF;

        UPDATE public.work_order_proposals
        SET status = 'superseded', updated_at = v_now
        WHERE id = v_previous_active.id;

        -- Registra auditoria de superseded
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

    -- 7. Finalização da Nova Proposta Oficial
    UPDATE public.work_order_proposals
    SET generation_status = 'ready',
        status = 'issued',
        pdf_storage_key = p_pdf_storage_key,
        pdf_sha256 = p_pdf_sha256,
        pdf_size_bytes = p_pdf_size_bytes,
        issued_at = v_now,
        updated_at = v_now
    WHERE id = p_proposal_id;

    -- 8. Atualização dos campos desnormalizados de metadados na work_orders
    UPDATE public.work_orders
    SET proposal_issued_at = v_now,
        proposal_valid_until = v_prop.valid_until,
        updated_at = v_now
    WHERE id = p_work_order_id;

    -- 9. Registro de auditoria append-only minimizado
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
        'issued_at', v_now
    );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_work_order_proposal_atomic(UUID,UUID,VARCHAR,VARCHAR,INT,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_work_order_proposal_atomic(UUID,UUID,VARCHAR,VARCHAR,INT,UUID) TO service_role;
```

---

### 3.3. RPC: `public.accept_work_order_proposal_atomic`

```sql
CREATE OR REPLACE FUNCTION public.accept_work_order_proposal_atomic(
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

    SELECT is_active INTO v_actor_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_actor_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor is not an active administrator.';
    END IF;

    -- 2. Lock transacional ordenado: WORK_ORDER -> PROPOSAL
    SELECT id, client_id, status_os, is_archived, updated_at INTO v_wo
    FROM public.work_orders
    WHERE id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Work order % not found.', p_work_order_id;
    END IF;

    -- 3. Validação de Arquivamento e Status da OS
    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Cannot accept proposals for an archived work order.';
    END IF;

    IF v_wo.status_os <> 'orcamento' THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS: Proposals can only be accepted when work order is in status orcamento (current: %).', v_wo.status_os;
    END IF;

    -- 4. Lock transacional da Proposta
    SELECT * INTO v_prop
    FROM public.work_order_proposals
    WHERE id = p_proposal_id AND work_order_id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PROPOSAL_NOT_FOUND: Proposal % not found for work order %.', p_proposal_id, p_work_order_id;
    END IF;

    -- 5. Validação de Status e Concorrência
    IF v_prop.generation_status <> 'ready' OR v_prop.status <> 'issued' THEN
        RAISE EXCEPTION 'ERR_INVALID_PROPOSAL_STATUS: Only active ready issued proposals can be accepted (current status: %, generation: %).', v_prop.status, v_prop.generation_status;
    END IF;

    IF p_expected_wo_updated_at IS NOT NULL AND v_wo.updated_at <> p_expected_wo_updated_at THEN
        RAISE EXCEPTION 'ERR_CONCURRENCY_CONFLICT: Work order was modified by another user. Please refresh and try again.';
    END IF;

    -- 6. Atualização da Proposta para 'accepted'
    UPDATE public.work_order_proposals
    SET status = 'accepted',
        accepted_at = v_now,
        accepted_by = p_actor_id,
        updated_at = v_now
    WHERE id = p_proposal_id;

    -- 7. Atualização da Work Order para 'aprovada' com link da proposta
    UPDATE public.work_orders
    SET status_os = 'aprovada',
        accepted_proposal_id = p_proposal_id,
        updated_at = v_now
    WHERE id = p_work_order_id;

    -- 8. Registro de auditoria append-only
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
        'accepted_at', v_now
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_work_order_proposal_atomic(UUID,UUID,TIMESTAMPTZ,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_work_order_proposal_atomic(UUID,UUID,TIMESTAMPTZ,UUID) TO service_role;
```

---

### 3.4. RPC: `public.mark_work_order_proposal_failed_atomic` (Recovery de Falhas)

```sql
CREATE OR REPLACE FUNCTION public.mark_work_order_proposal_failed_atomic(
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

    SELECT is_active INTO v_actor_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_actor_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED_ADMIN_ACTOR: Actor is not an active administrator.';
    END IF;

    -- 2. Lock transacional da Proposta
    SELECT * INTO v_prop
    FROM public.work_order_proposals
    WHERE id = p_proposal_id AND work_order_id = p_work_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PROPOSAL_NOT_FOUND: Proposal % not found for work order %.', p_proposal_id, p_work_order_id;
    END IF;

    -- Se já estiver pronta, bloqueia marcar como failed
    IF v_prop.generation_status = 'ready' THEN
        RAISE EXCEPTION 'ERR_CANNOT_FAIL_READY_PROPOSAL: Ready proposal cannot be marked as failed.';
    END IF;

    UPDATE public.work_order_proposals
    SET generation_status = 'failed',
        updated_at = v_now
    WHERE id = p_proposal_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'proposal_id', p_proposal_id,
        'generation_status', 'failed'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_work_order_proposal_failed_atomic(UUID,UUID,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_work_order_proposal_failed_atomic(UUID,UUID,UUID) TO service_role;
```

---

## 4. Reabertura da OS e Política de Limpeza de `accepted_proposal_id`

No endpoint existente `POST /api/admin/crm/work-orders/:id/status.post.ts`:
- Quando a OS transiciona de `aprovada` para `orcamento` (reabertura):
  - `work_orders.accepted_proposal_id` é explicitamente setado como `NULL`.
  - A proposta aceita anterior mantém seu status e timestamps históricos até que uma nova revisão seja oficialmente finalizada, momento em que transita para `superseded`.

---

## 5. Geração de PDF Server-Side & Rótulo de Prévia

- **`PDF_ENGINE_RECOMMENDATION = pdfkit`**
- **`PROPOSAL_PDF_FONT_STRATEGY = LOCAL_EMBEDDED_UNICODE_FONT`**
- **`PDF_UTF8_SUPPORT_VERIFIED = PENDING_IMPLEMENTATION_RUNTIME_TEST`** (Será comprovado em runtime com testes reais de acentuação).
- **`PDF_EXTERNAL_NETWORK_DEPENDENCIES = NONE`**
- **`PREVIEW_VERSION_LABEL = PREVIEW_NOT_OFFICIAL`**:
  - O PDF de prévia exibe em marca d'água/cabeçalho: `"PRÉVIA — DOCUMENTO NÃO OFICIAL"`. O número de versão oficial `Rev. NN` somente aparece após a reserva no banco de dados.
- **`ITEM_INTERNAL_NOTES_IN_PROPOSAL_PDF = NEVER_AUTOMATIC`**:
  - `work_order_items.observacoes` é considerado nota técnica interna e NÃO é impresso no PDF da proposta comercial.

---

## 6. Endpoints BFF Nitro da Fase 4.1 (6 Endpoints Protegidos)

| Método | Rota | Descrição & Proteção |
| :--- | :--- | :--- |
| `GET` | `/api/admin/crm/work-orders/:id/proposals` | Lista o histórico de propostas da OS (`requireActiveAdmin`). |
| `POST` | `/api/admin/crm/work-orders/:id/proposals/preview` | Gera stream de preview do PDF em memória com rótulo "NÃO OFICIAL" (`requireActiveAdmin` + CSRF). |
| `POST` | `/api/admin/crm/work-orders/:id/proposals/issue` | Orquestra o fluxo Reserva -> PDF -> R2 -> Finalize com reconciliação de falhas (`requireActiveAdmin` + CSRF). |
| `GET` | `/api/admin/crm/work-orders/:id/proposals/:proposalId` | Retorna snapshots e dados da proposta (`requireActiveAdmin`). |
| `GET` | `/api/admin/crm/work-orders/:id/proposals/:proposalId/signed-url` | Gera Presigned GET URL (TTL 300s) no bucket privado `adtelas-leads-private` (`requireActiveAdmin`). |
| `POST` | `/api/admin/crm/work-orders/:id/proposals/:proposalId/accept` | Aceita a proposta e transita OS para `aprovada` via RPC atômica (`requireActiveAdmin` + CSRF). |

---

## 7. Matriz de Testes Expandida (60 Casos de Teste)

### 7.1. Suíte Automatizada Backend & Contratos (`scripts/test_crm_phase4_1.mjs` - 50 Testes):
1. **Alinhamento de Schema Real & Fail-Closed:**
   - Teste 01: Preflight da Migration 011 valida dependências e falha fast em caso de drift.
   - Teste 02: `company_profile` com campos reais (`street`, `number`, `neighborhood`, `city`, `state`, `email_contact`, `website`) capturado fielmente.
   - Teste 03: Ausência de `company_profile` (id=1) dispara erro `ERR_COMPANY_PROFILE_MISSING` (fail-closed).
   - Teste 04: Logo estático preserva `logo_path` e logo R2 preserva `logo_storage_key`.
   - Teste 05: `work_order_measurements` com campos reais (`ambiente`, `tipo_vao`, `cor_estrutura`, `tipo_material`) capturado fielmente.
   - Teste 06: Inexistência de campo `vao_nome` confirmada; nenhuma referência inválida gerada.
   - Teste 07: Observações internas de itens (`observacoes`) não são incluídas no `items_snapshot` da proposta.
2. **Reserva, Idempotência & ONE_IN_FLIGHT:**
   - Teste 08: Durante reserva, `generation_status = 'reserved'` e `status` comercial é obrigatoriamente `NULL`.
   - Teste 09: Replay com mesma `idempotency_key` e mesmo hash de requisição retorna a mesma reserva.
   - Teste 10: Reutilização de `idempotency_key` com hash divergente rejeitada com HTTP 409 (`ERR_IDEMPOTENCY_MISMATCH`).
   - Teste 11: Tentativa de iniciar 2ª reserva concorrente enquanto uma está em `reserved` rejeitada por `ONE_IN_FLIGHT`.
   - Teste 12: Conflito otimista (`expected_wo_updated_at` desatualizado) rejeitado com HTTP 409.
   - Teste 13: Emissão bloqueada se a OS estiver arquivada (`is_archived = true`).
   - Teste 14: Emissão bloqueada se o status da OS não for `orcamento`.
   - Teste 15: Ator admin inativo ou nulo rejeitado com `ERR_UNAUTHORIZED_ADMIN_ACTOR`.
   - Teste 16: Hash de requisição serializado canonicamente validando campos obrigatórios (`valid_until`, termos comerciais).
3. **Integridade Referencial Composta & Banco de Dados:**
   - Teste 17: Tentativa de vincular proposta a `client_id` divergente da OS rejeitada por FK composta.
   - Teste 18: Tentativa de aceitar proposta de outra OS em `work_orders.accepted_proposal_id` rejeitada por FK composta RESTRICT.
   - Teste 19: Partial unique index bloqueia duas propostas com status `accepted` simultâneas.
   - Teste 20: Partial unique index bloqueia duas propostas com status `issued` ativas simultâneas.
   - Teste 21: Cross-field constraint bloqueia `generation_status = 'ready'` sem PDF metadata e status preenchidos.
   - Teste 22: Trigger de imutabilidade bloqueia UPDATE em snapshots, hashes ou metadados de propostas finalizadas.
   - Teste 23: Trigger de deleção bloqueia DELETE físico em propostas.
   - Teste 24: Deleção física da OS com propostas bloqueada por `ON DELETE RESTRICT`.
   - Teste 25: Deleção de admin (`issued_by`/`accepted_by`) bloqueada por `ON DELETE RESTRICT`.
4. **Finalização, R2, Concorrência e SAGA:**
   - Teste 26: Finalização valida prefixo canônico de storage key (`proposals/{wo_id}/{proposal_id}.pdf`).
   - Teste 27: Finalização valida formato SHA-256 (64 hex minúsculo) e tamanho do PDF (>0).
   - Teste 28: Finalização fora de ordem (versão não é a mais recente) bloqueada por `ERR_OUT_OF_ORDER_FINALIZATION`.
   - Teste 29: Lock order consistente (`work_order -> proposal`) validado sem deadlocks.
   - Teste 30: Finalização revalida status da OS (`status_os = 'orcamento'`, `is_archived = false`).
   - Teste 31: Replay de finalização com mesmos metadados de PDF retorna sucesso idempotente.
   - Teste 32: Replay de finalização com metadados de PDF divergentes rejeitado com HTTP 409 (`ERR_FINALIZE_REPLAY_METADATA_MISMATCH`).
   - Teste 33: Finalização bem-sucedida atualiza `generation_status = 'ready'`, `status = 'issued'`, `issued_at = now()`.
   - Teste 34: Finalização transita automaticamente propostas ativas anteriores para `superseded`.
   - Teste 35: Evento `proposal_superseded` gravado em `crm_activity_log` com payload minimizado.
   - Teste 36: Falha simulada de finalização aciona RPC `mark_work_order_proposal_failed_atomic`.
   - Teste 37: Reserva falha (`failed`) pode ser retomada por retry da mesma `idempotency_key` se for a versão mais recente.
   - Teste 38: Resultado incerto de finalização é reconciliado antes de qualquer compensação; commit confirmado NUNCA deleta R2.
   - Teste 39: Resultado incerto de upload R2 é reconciliado via HEAD antes de classificar como falha.
5. **Aceitação & Reabertura de OS:**
   - Teste 40: Aceitação de proposta transita proposta para `accepted` e OS para `aprovada` atomicamente via RPC.
   - Teste 41: `accepted_at` e `accepted_by` preenchidos exclusivamente com autoridade do banco.
   - Teste 42: Aceitação bloqueada se OS não estiver em `orcamento`.
   - Teste 43: Aceitação bloqueada se OS estiver arquivada (`is_archived = true`).
   - Teste 44: Aceitação de proposta que não está em `issued` rejeitada com erro.
   - Teste 45: Reabertura da OS (`aprovada` -> `orcamento`) limpa `accepted_proposal_id` no banco.
   - Teste 46: Emissão de nova revisão após reabertura transita proposta aceita anterior para `superseded` preservando `accepted_at`/`accepted_by`.
   - Teste 47: Tentativa de superseder proposta aceita antes de reabrir a OS rejeitada com erro.
6. **PDF, Formatação e Segurança:**
   - Teste 48: Preview em memória gera stream PDF com rótulo "PRÉVIA — DOCUMENTO NÃO OFICIAL" e zero persistência.
   - Teste 49: Endpoints protegidos por `requireActiveAdmin` e mutações protegidas por CSRF.
   - Teste 50: RLS ativa e privilégios revogados de `PUBLIC`, `anon` e `authenticated` (acesso direto do browser bloqueado).

### 7.2. Suíte de Testes Playwright Browser (`scripts/test_crm_phase4_1_browser.mjs` - 10 Testes):
- Testes 51 a 60:
  - Navegação para a ficha da OS e abertura da Tab "Orçamentos".
  - Abertura do modal de emissão e configuração de termos comerciais.
  - Renderização da prévia em stream PDF no browser com rótulo "NÃO OFICIAL".
  - Confirmação de emissão com carregamento do card da Rev. 1.
  - Download do PDF oficial via Presigned URL temporária.
  - Ação de "Marcar como Aprovado pelo Cliente" e transição para `aprovada`.
  - Verificação de layout e zero overflow horizontal nos 10 viewports obrigatórios (320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1920 px).

---

## 8. Resumo Consolidado das Variáveis de Decisão (Patch 4.1A.3)

```ini
PLAN_REVISION_4_1A_3_STATUS=AUDITED_AND_REVISED

COMPANY_PROFILE_SCHEMA_ALIGNMENT=PASS
MEASUREMENT_SCHEMA_ALIGNMENT=PASS

COMPANY_PROFILE_MISSING_POLICY=FAIL_CLOSED
PROPOSAL_LOGO_REFERENCE_SNAPSHOT=SOURCE_PLUS_PATH_OR_STORAGE_KEY

ITEM_INTERNAL_NOTES_IN_PROPOSAL_SNAPSHOT=EXCLUDED

RESERVED_PROPOSAL_COMMERCIAL_STATUS=NULL
PROPOSAL_GENERATION_CROSS_FIELD_CONSTRAINTS=DATABASE_ENFORCED

PROPOSAL_ACTOR_FK_DELETE_ACTION=RESTRICT
PROPOSAL_RPC_ACTOR_VALIDATION=ACTIVE_ADMIN_REQUIRED

ONE_IN_FLIGHT_PROPOSAL_PER_WORK_ORDER=YES
OUT_OF_ORDER_PROPOSAL_FINALIZATION=BLOCKED
PROPOSAL_RPC_LOCK_ORDER=WORK_ORDER_THEN_PROPOSAL

FINALIZE_REVALIDATES_WORK_ORDER_STATE=YES
ACCEPTED_SUPERSEDE_REQUIRES_REOPENED_WO=YES

FINALIZE_IDEMPOTENCY_METADATA_CHECK=REQUIRED

SHA256_DATABASE_VALIDATION=LOWERCASE_HEX_64
IDEMPOTENCY_HASH_INPUT=CANONICAL_NORMALIZED_ISSUE_CONFIGURATION

PDF_MAX_BYTES=TO_BE_MEASURED_DURING_IMPLEMENTATION

FAILED_RESERVATION_RETRY_POLICY=RETRY_SAME_IDEMPOTENCY_KEY_OR_ABANDON_ON_NEWER_REVISION
PROPOSED_RPC_FUNCTIONS=public.reserve_work_order_proposal_atomic, public.finalize_work_order_proposal_atomic, public.accept_work_order_proposal_atomic, public.mark_work_order_proposal_failed_atomic

FINALIZE_UNKNOWN_OUTCOME_POLICY=RECONCILE_BEFORE_COMPENSATION
R2_PUT_UNKNOWN_OUTCOME_POLICY=RECONCILE_OR_IDEMPOTENT_REUPLOAD

PROPOSAL_SNAPSHOT_CONSISTENCY_STRATEGY=FOR_UPDATE_WORK_ORDER_LOCK_PLUS_CANONICAL_READ_IN_SINGLE_TRANSACTION

PREVIEW_VERSION_LABEL=PREVIEW_NOT_OFFICIAL

PROPOSAL_PDF_FONT_STRATEGY=LOCAL_EMBEDDED_UNICODE_FONT
PDF_UTF8_SUPPORT_VERIFIED=PENDING_IMPLEMENTATION_RUNTIME_TEST

MIGRATION_011_FAIL_FAST_PREFLIGHT=REQUIRED
MIGRATION_011_GLOBAL_TRANSACTION=REQUIRED

PHASE_4_1_API_ENDPOINT_COUNT=6
PHASE_4_1_TEST_CASE_COUNT=60

BLOCKERS=NONE

PHASE_4_1_PLAN_READY_FOR_MIGRATION_DESIGN_REVIEW=YES
```
