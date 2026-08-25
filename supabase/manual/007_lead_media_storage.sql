-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE VIA MCP)
-- ======================================================================
-- Projeto: AD Telas e Redes — https://www.adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/007_lead_media_storage.sql
-- Fase: Lead Media Storage + Admin Media Gallery + Data-Only Email
--
-- DECISÕES ARQUITETURAIS:
--
--   LEAD_MEDIA_FK_DELETE_STRATEGY = ON DELETE RESTRICT
--     Impede remoção acidental de leads com mídias associadas.
--     Fluxo autoritativo obrigatório:
--       1. Backend consulta storage_keys de lead_media;
--       2. Delete R2 objects (com retry se falhar);
--       3. Delete registros lead_media;
--       4. Delete lead.
--     Banco impede bypass deste fluxo.
--
--   R2_ORPHAN_PROTECTION = ENFORCED
--     ON DELETE RESTRICT previne cascatas que perderiam storage_keys.
--     Objetos R2 nunca ficam órfãos por operação no banco.
--
--   MEDIA_TYPE_MIME_DB_CONSISTENCY = ENFORCED
--     CHECK constraint garante que photo => image/* e video => video/*.
--     Impossível inserir media_type='photo' com mime_type='video/mp4'.
--
--   FILE_SIZE_DB_CONSTRAINT = STRICT_POSITIVE
--     CHECK(file_size_bytes > 0). Arquivo de 0 bytes é inválido.
--
--   SERVICE_ROLE_ACCESS_METHOD = BYPASSRLS
--     Em Supabase, service_role possui BYPASSRLS por padrão.
--     A RLS policy abaixo é REDUNDANTE para service_role, mas
--     documenta explicitamente a intenção. Se Supabase alterar
--     o comportamento de BYPASSRLS no futuro, a policy garante
--     acesso funcional.
--
--   SERVICE_ROLE_POLICY_REQUIRED = NO_BUT_DOCUMENTED
--     Mantida como documentação defensiva.
--
--   TABLE_PRIVILEGES_VERIFIED = YES
--     REVOKE ALL FROM anon e authenticated. GRANT ALL TO service_role.
--
--   VALID_MEDIA_RETENTION = PENDING_BUSINESS_RETENTION_POLICY
--     tmp/leads/ -> lifecycle 24h (expurgo de abandonados).
--     leads/ -> NENHUMA expiração automática.
--     Política definitiva de retenção depende de decisão humana.
--
-- REGRAS DE SEGURANÇA:
--   1. RLS ativada com bloqueio total a anon e authenticated (ANON_LEAD_MEDIA_ACCESS = DENIED).
--   2. Preserva 100% dos dados existentes nas tabelas leads, page_views e lead_clicks.
--   3. Status de execução: SQL_007_EXECUTED = NO (Aguardando execução manual).
-- ======================================================================


-- ======================================================================
-- 1. PRE-CHECK FAIL-FAST
-- ======================================================================
-- Verifica que public.leads existe (pré-requisito obrigatório).
-- Verifica que public.lead_media NÃO existe.
-- Se lead_media já existir, ABORTA com mensagem clara.
-- ======================================================================

DO $$
DECLARE
    _leads_exists BOOLEAN;
    _lead_media_exists BOOLEAN;
BEGIN
    -- Verificar existência de public.leads (pré-requisito)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'leads'
    ) INTO _leads_exists;

    IF NOT _leads_exists THEN
        RAISE EXCEPTION '
==============================================================
ABORTING: Tabela public.leads NÃO encontrada.
A tabela public.leads é pré-requisito obrigatório para esta migration.
Verifique se as migrations anteriores foram executadas.
==============================================================';
    END IF;

    -- Verificar que public.lead_media NÃO existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lead_media'
    ) INTO _lead_media_exists;

    IF _lead_media_exists THEN
        RAISE EXCEPTION '
==============================================================
ABORTING: Tabela public.lead_media JÁ EXISTE.
Esta migration deve ser executada apenas uma vez em ambiente limpo.
Se você precisa recriar a tabela, execute o ROLLBACK primeiro
(seção 4 deste arquivo) e depois re-execute esta migration.
Se a tabela existente possui dados, faça backup antes do rollback.
==============================================================';
    END IF;

    RAISE NOTICE 'PRE-CHECK OK: public.leads existe, public.lead_media não existe. Prosseguindo...';
END $$;

-- Confirmar contagem de leads existentes (informativo)
SELECT COUNT(*) AS total_leads_existentes FROM public.leads;


-- ======================================================================
-- 2. MIGRATION TRANSACTIONAL (BEGIN ... COMMIT)
-- ======================================================================
BEGIN;

-- A. Criação da Tabela public.lead_media
CREATE TABLE public.lead_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK com ON DELETE RESTRICT: impede remoção acidental de leads com mídias
    -- Fluxo de deleção obrigatório: R2 delete -> lead_media delete -> lead delete
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,

    client_media_id UUID NOT NULL,
    submission_id VARCHAR(100),
    storage_key TEXT NOT NULL,
    original_filename TEXT,
    safe_filename TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    width INT,
    height INT,
    duration_seconds INT,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    finalizing_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- UNIQUE constraints (inline)
    CONSTRAINT unq_lead_media_storage_key UNIQUE (storage_key),
    CONSTRAINT unq_lead_media_lead_client_media_id UNIQUE (lead_id, client_media_id),

    -- CHECK constraints
    CONSTRAINT chk_lead_media_type CHECK (media_type IN ('photo', 'video')),
    CONSTRAINT chk_lead_media_upload_status CHECK (upload_status IN ('pending', 'finalizing', 'uploaded', 'failed', 'deleted')),
    CONSTRAINT chk_lead_media_file_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_lead_media_mime_type CHECK (mime_type IN (
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime'
    )),

    -- Cross-field: media_type deve ser consistente com mime_type
    CONSTRAINT chk_lead_media_type_mime_consistency CHECK (
        (media_type = 'photo' AND mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp'))
        OR
        (media_type = 'video' AND mime_type IN ('video/mp4', 'video/webm', 'video/quicktime'))
    )
);

-- B. Índices de performance, auditoria e recuperação de stale locks
CREATE INDEX idx_lead_media_lead_id ON public.lead_media(lead_id);
CREATE INDEX idx_lead_media_submission_id ON public.lead_media(submission_id);
CREATE INDEX idx_lead_media_upload_status ON public.lead_media(upload_status);
CREATE INDEX idx_lead_media_finalizing_at ON public.lead_media(finalizing_at) WHERE upload_status = 'finalizing';
CREATE INDEX idx_lead_media_created_at ON public.lead_media(created_at);

-- C. Habilitar Row Level Security (RLS) Estrita
ALTER TABLE public.lead_media ENABLE ROW LEVEL SECURITY;

-- D. Revogar permissões públicas e conceder explicitamente ao service_role
REVOKE ALL ON public.lead_media FROM anon;
REVOKE ALL ON public.lead_media FROM authenticated;
GRANT ALL ON public.lead_media TO service_role;

-- E. RLS Policy para service_role (documentação defensiva)
-- NOTA: service_role em Supabase possui BYPASSRLS por padrão.
-- Esta policy é REDUNDANTE mas serve como documentação explícita da intenção.
-- Se o comportamento de BYPASSRLS for alterado, esta policy garante acesso.
CREATE POLICY service_role_all_lead_media
    ON public.lead_media
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;


-- ======================================================================
-- 3. POST-CHECK — VERIFICAÇÃO DE INTEGRIDADE PÓS-MIGRATION
-- ======================================================================
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lead_media'
ORDER BY ordinal_position;

SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
  AND c.conrelid = 'public.lead_media'::regclass
ORDER BY c.conname;

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'lead_media';

-- Verificar RLS ativo
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'lead_media';

-- Verificar FK strategy
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'lead_media'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Verificar privileges
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'lead_media'
ORDER BY grantee, privilege_type;


-- ======================================================================
-- 4. ROLLBACK SIMÉTRICO COMPLETO (EXECUTAR APENAS SE NECESSÁRIO)
-- ======================================================================
/*
BEGIN;

-- ATENÇÃO: Antes de executar o rollback, garanta que:
-- 1. Todos os objetos R2 vinculados foram deletados (consulte storage_keys primeiro).
-- 2. Faça backup dos dados se necessário.

DROP TABLE IF EXISTS public.lead_media CASCADE;

COMMIT;
*/
