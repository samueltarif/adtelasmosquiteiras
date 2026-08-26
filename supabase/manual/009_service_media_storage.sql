-- ==============================================================================
-- MIGRAÇÃO 009: Gestão de Mídias Públicas de Serviços (Cloudflare R2 Site Media)
-- ==============================================================================
--
-- REGRAS DE INTEGRIDADE E SEGURANÇA:
--   1. FAIL-FAST REAL: Se public.service_media ou funções associadas existirem, aborta imediatamente.
--   2. TRANSAÇÃO ATÔMICA: Execução segura em bloco BEGIN...COMMIT.
--   3. ALLOWLIST CANÔNICA: Apenas as 12 chaves canônicas de serviços são aceitas no CHECK.
--   4. CONSISTÊNCIA DE MIME: photo aceita (webp, jpeg, png); video aceita (mp4, webm). Sem AVIF na V1.
--   5. DIMENSÕES OBRIGATÓRIAS: width > 0 e height > 0 para fotos (prevenção de CLS).
--   6. UNICIDADE DE DESTAQUE: No máximo 1 mídia featured por serviço (UNIQUE parcial).
--   7. FEATURED APENAS FOTO: Vídeos não podem ser marcados como featured na V1.
--   8. STORAGE_KEY PADRONIZADA: Obrigatório iniciar com 'services/{service_key}/'.
--   9. TRIGGER UPDATED_AT: Atualização automática via trigger BEFORE UPDATE.
--  10. RPC ATÔMICA PROTEGIDA: set_featured_service_media valida alvo antes de alterar estado.
--  11. PRIVILÉGIOS ESTREITOS: RPC bloqueada para PUBLIC/anon/authenticated; permitida apenas para service_role.
--  12. RLS ATIVA: Visitantes anônimos/autenticados apenas leem registros is_active = true.
-- ==============================================================================

-- ==============================================================================
-- A. PRE-CHECK DE SEGURANÇA (FAIL-FAST)
-- ==============================================================================
DO $$
DECLARE
    _table_exists BOOLEAN;
    _fn_featured_exists BOOLEAN;
    _fn_updated_at_exists BOOLEAN;
BEGIN
    -- 1. Verificar se a tabela já existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'service_media'
    ) INTO _table_exists;

    IF _table_exists THEN
        RAISE EXCEPTION 'ABORTING: Tabela public.service_media JÁ EXISTE no banco de dados. Abortando execução manual.';
    END IF;

    -- 2. Verificar se a função set_featured_service_media já existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'set_featured_service_media'
    ) INTO _fn_featured_exists;

    IF _fn_featured_exists THEN
        RAISE EXCEPTION 'ABORTING: Função public.set_featured_service_media JÁ EXISTE no banco de dados. Abortando execução manual.';
    END IF;

    -- 3. Verificar se a função set_service_media_updated_at já existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'set_service_media_updated_at'
    ) INTO _fn_updated_at_exists;

    IF _fn_updated_at_exists THEN
        RAISE EXCEPTION 'ABORTING: Função public.set_service_media_updated_at JÁ EXISTE no banco de dados. Abortando execução manual.';
    END IF;

    RAISE NOTICE 'PRE-CHECK OK: Nenhum objeto conflitante encontrado. Prosseguindo com a migração 009...';
END $$;

-- ==============================================================================
-- B. TRANSAÇÃO PRINCIPAL
-- ==============================================================================
BEGIN;

-- 1. Criação da Tabela public.service_media
CREATE TABLE public.service_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_key VARCHAR(64) NOT NULL,
    storage_key VARCHAR(512) NOT NULL,
    media_type VARCHAR(16) NOT NULL DEFAULT 'photo',
    mime_type VARCHAR(64) NOT NULL,
    title VARCHAR(255),
    alt_text VARCHAR(255) NOT NULL,
    caption TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    width INTEGER,
    height INTEGER,
    file_size_bytes BIGINT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),

    -- Restrições de Integridade Estrita
    CONSTRAINT unq_service_media_storage_key UNIQUE (storage_key),
    
    -- Allowlist das 12 chaves canônicas de serviços
    CONSTRAINT chk_service_media_service_key CHECK (service_key IN (
        'redes_janelas',
        'redes_sacadas',
        'redes_pets',
        'redes_criancas',
        'redes_escadas',
        'telas_janelas',
        'telas_portas',
        'telas_sacadas',
        'telas_removiveis',
        'pet_screen',
        'telas_restaurantes',
        'vidracaria'
    )),

    -- Tipo de mídia permitido
    CONSTRAINT chk_service_media_type CHECK (media_type IN ('photo', 'video')),

    -- Consistência cruzada estrita entre media_type e mime_type (V1 sem AVIF)
    CONSTRAINT chk_service_media_type_mime_consistency CHECK (
        (media_type = 'photo' AND mime_type IN ('image/webp', 'image/jpeg', 'image/png'))
        OR
        (media_type = 'video' AND mime_type IN ('video/mp4', 'video/webm'))
    ),

    -- Dimensões: Obrigatórias para foto, opcionais/positivas para vídeo
    CONSTRAINT chk_service_media_dimensions CHECK (
        (media_type = 'photo' AND width > 0 AND height > 0)
        OR
        (media_type = 'video' AND (width IS NULL OR width > 0) AND (height IS NULL OR height > 0))
    ),

    -- Tamanho em bytes estritamente positivo
    CONSTRAINT chk_service_media_size CHECK (file_size_bytes > 0),

    -- Ordem de exibição não-negativa
    CONSTRAINT chk_service_media_sort_order CHECK (sort_order >= 0),

    -- Alt Text não-vazio (mínimo 3 caracteres reais)
    CONSTRAINT chk_service_media_alt_text CHECK (length(trim(alt_text)) >= 3),

    -- Prefixo de storage_key deve seguir o padrão services/{service_key}/
    CONSTRAINT chk_service_media_storage_key_prefix CHECK (
        storage_key LIKE ('services/' || service_key || '/%')
    ),

    -- Featured apenas para fotos na V1
    CONSTRAINT chk_service_media_featured_photo_only CHECK (
        (NOT is_featured) OR (media_type = 'photo')
    )
);

-- 2. Índices de Performance e Unicidade Parcial
-- Garante NO MÁXIMO UMA foto de destaque (is_featured = true) por serviço
CREATE UNIQUE INDEX idx_unq_service_media_featured
    ON public.service_media (service_key)
    WHERE (is_featured = true);

-- Índice para a galeria pública de cada serviço
CREATE INDEX idx_service_media_public_gallery
    ON public.service_media (service_key, sort_order)
    WHERE is_active = true;

-- Índice para administração e ordenação temporal
CREATE INDEX idx_service_media_created_at
    ON public.service_media (created_at DESC);

-- 3. Função e Trigger para Atualização Automática de updated_at (Least Privilege: SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.set_service_media_updated_at()
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

CREATE TRIGGER trg_service_media_updated_at
    BEFORE UPDATE ON public.service_media
    FOR EACH ROW
    EXECUTE FUNCTION public.set_service_media_updated_at();

-- 4. Função RPC Atômica para Definir Mídia de Destaque
CREATE OR REPLACE FUNCTION public.set_featured_service_media(
    p_media_id UUID,
    p_service_key VARCHAR(64)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_target_exists BOOLEAN;
BEGIN
    -- 1. VALIDAÇÃO PRÉVIA: Verifica se a mídia alvo existe, pertence ao serviço e é foto
    SELECT EXISTS (
        SELECT 1 FROM public.service_media
        WHERE id = p_media_id 
          AND service_key = p_service_key 
          AND media_type = 'photo'
    ) INTO v_target_exists;

    IF NOT v_target_exists THEN
        RAISE EXCEPTION 'Mídia alvo % inválida para o serviço % (deve existir e ser do tipo photo)', p_media_id, p_service_key;
    END IF;

    -- 2. Remove flag featured de qualquer outra mídia do mesmo serviço (Trigger atualiza updated_at)
    UPDATE public.service_media
    SET is_featured = false
    WHERE service_key = p_service_key AND is_featured = true AND id <> p_media_id;

    -- 3. Define a nova mídia como featured (Trigger atualiza updated_at)
    UPDATE public.service_media
    SET is_featured = true
    WHERE id = p_media_id AND service_key = p_service_key;

    RETURN TRUE;
END;
$$;

-- 5. Row Level Security (RLS) e Privilégios
ALTER TABLE public.service_media ENABLE ROW LEVEL SECURITY;

-- Revogar permissões perigosas diretas de modificação
REVOKE ALL ON public.service_media FROM PUBLIC;
REVOKE ALL ON public.service_media FROM anon;
REVOKE ALL ON public.service_media FROM authenticated;

-- Conceder apenas SELECT a anon e authenticated
GRANT SELECT ON public.service_media TO anon;
GRANT SELECT ON public.service_media TO authenticated;
GRANT ALL ON public.service_media TO service_role;

-- Bloquear execução das funções de RPC para público / anônimo / autenticado
REVOKE ALL ON FUNCTION public.set_featured_service_media(UUID, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_featured_service_media(UUID, VARCHAR) FROM anon;
REVOKE ALL ON FUNCTION public.set_featured_service_media(UUID, VARCHAR) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_featured_service_media(UUID, VARCHAR) TO service_role;

REVOKE ALL ON FUNCTION public.set_service_media_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_service_media_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_service_media_updated_at() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_service_media_updated_at() TO service_role;

-- 6. Políticas de RLS
CREATE POLICY "public_read_active_service_media"
    ON public.service_media FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "service_role_manage_service_media"
    ON public.service_media FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;

-- ==============================================================================
-- C. POST-CHECK (VALIDAÇÃO READ-ONLY DA MIGRAÇÃO)
-- ==============================================================================

-- 1. Validar Tabela
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'service_media';

-- 2. Validar Colunas e Tipos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'service_media'
ORDER BY ordinal_position;

-- 3. Validar Constraints
SELECT conname AS constraint_name, contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'public.service_media'::regclass
ORDER BY conname;

-- 4. Validar Índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'service_media'
ORDER BY indexname;

-- 5. Validar Trigger de updated_at
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'service_media';

-- 6. Validar Funções e Privilégios
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name IN ('set_featured_service_media', 'set_service_media_updated_at');

-- 7. Validar Privilégios da Tabela (RLS)
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'service_media';

-- 8. Validar Políticas RLS
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'service_media';

-- 9. Validar RLS Habilitada na Tabela (relrowsecurity = true)
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'service_media';

-- 10. Validar Privilégios de Execução das Funções (has_function_privilege)
SELECT 
    'public.set_featured_service_media(uuid, varchar)' AS function_signature,
    has_function_privilege('anon', 'public.set_featured_service_media(uuid, varchar)', 'EXECUTE') AS anon_execute,           -- Esperado: false
    has_function_privilege('authenticated', 'public.set_featured_service_media(uuid, varchar)', 'EXECUTE') AS auth_execute,   -- Esperado: false
    has_function_privilege('service_role', 'public.set_featured_service_media(uuid, varchar)', 'EXECUTE') AS service_execute  -- Esperado: true
UNION ALL
SELECT 
    'public.set_service_media_updated_at()' AS function_signature,
    has_function_privilege('anon', 'public.set_service_media_updated_at()', 'EXECUTE') AS anon_execute,                      -- Esperado: false
    has_function_privilege('authenticated', 'public.set_service_media_updated_at()', 'EXECUTE') AS auth_execute,              -- Esperado: false
    has_function_privilege('service_role', 'public.set_service_media_updated_at()', 'EXECUTE') AS service_execute             -- Esperado: true
;

-- 11. Validar Privilégios da Tabela por Role (has_table_privilege)
SELECT 
    role_name,
    has_table_privilege(role_name, 'public.service_media', 'SELECT') AS can_select,
    has_table_privilege(role_name, 'public.service_media', 'INSERT') AS can_insert,
    has_table_privilege(role_name, 'public.service_media', 'UPDATE') AS can_update,
    has_table_privilege(role_name, 'public.service_media', 'DELETE') AS can_delete
FROM (
    VALUES ('anon'), ('authenticated'), ('service_role')
) AS roles(role_name);

-- ==============================================================================
-- D. INSTRUÇÃO DE ROLLBACK (EM CASO DE NECESSIDADE MANUAL)
-- ==============================================================================
-- DROP TRIGGER IF EXISTS trg_service_media_updated_at ON public.service_media;
-- DROP FUNCTION IF EXISTS public.set_service_media_updated_at();
-- DROP FUNCTION IF EXISTS public.set_featured_service_media(UUID, VARCHAR);
-- DROP TABLE IF EXISTS public.service_media CASCADE;

