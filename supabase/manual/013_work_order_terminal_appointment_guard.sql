BEGIN;

-- ============================================================================
-- 1. DEFENSIVE LOCK TIMEOUTS & DETERMINISTIC TABLE LOCKING
-- ============================================================================
-- Política: MIGRATION_013_LOCK_ACQUISITION_POLICY = FAIL_FAST
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Adquire SHARE ROW EXCLUSIVE em ordem determinística para fechar a janela de escrita
-- MIGRATION_013_INSTALLATION_WRITE_WINDOW = CLOSED
LOCK TABLE public.work_orders, public.appointments IN SHARE ROW EXCLUSIVE MODE;

-- ============================================================================
-- 2. PREFLIGHT (FAIL-CLOSED)
-- ============================================================================
DO $$
DECLARE
    v_count INT;
    v_table_name TEXT;
    v_spec TEXT;
    v_parts TEXT[];
    v_rpcs TEXT[][] := ARRAY[
        ['create_appointment_atomic', 'p_actor_id uuid, p_work_order_id uuid, p_tipo_agendamento character varying, p_data_hora_inicio timestamp with time zone, p_data_hora_fim timestamp with time zone, p_staff_id uuid, p_address_id uuid, p_observacoes text'],
        ['update_appointment_atomic', 'p_actor_id uuid, p_appointment_id uuid, p_expected_appointment_updated_at timestamp with time zone, p_staff_id uuid, p_address_id uuid, p_observacoes text, p_update_staff boolean, p_update_address boolean, p_update_observacoes boolean'],
        ['reschedule_appointment_atomic', 'p_actor_id uuid, p_appointment_id uuid, p_new_data_hora_inicio timestamp with time zone, p_new_data_hora_fim timestamp with time zone, p_motivo text, p_expected_appointment_updated_at timestamp with time zone'],
        ['cancel_appointment_atomic', 'p_actor_id uuid, p_appointment_id uuid, p_motivo text, p_expected_appointment_updated_at timestamp with time zone'],
        ['update_appointment_status_atomic', 'p_actor_id uuid, p_appointment_id uuid, p_next_status character varying, p_expected_appointment_updated_at timestamp with time zone']
    ];
    v_rpc TEXT[];
    v_rpc_count INT;
    v_rpc_secdef BOOLEAN;
    v_rpc_sp TEXT;
    v_rpc_args TEXT;
    v_rpc_oid OID;
    v_rls_enabled BOOLEAN;
    v_priv TEXT;
    v_role TEXT;
    v_priv_list TEXT[] := ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
    v_all_priv_list TEXT[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
BEGIN
    -- 1. Verificar se tabelas principais existem
    FOREACH v_table_name IN ARRAY ARRAY['work_orders', 'appointments']
    LOOP
        IF to_regclass('public.' || v_table_name) IS NULL THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: Tabela public.% ausente.', v_table_name;
        END IF;
    END LOOP;

    -- 2. Verificar colunas e tipos esperados
    FOREACH v_spec IN ARRAY ARRAY[
        'work_orders.id.uuid.NO',
        'work_orders.status_os.character varying.NO',
        'appointments.work_order_id.uuid.NO',
        'appointments.status_agendamento.character varying.NO',
        'appointments.tipo_agendamento.character varying.NO'
    ]
    LOOP
        v_parts := string_to_array(v_spec, '.');
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = v_parts[1] AND column_name = v_parts[2]
              AND data_type = v_parts[3] AND is_nullable = v_parts[4]
        ) THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: Coluna %.% (tipo %, nullable %) ausente ou incorreta.',
                v_parts[1], v_parts[2], v_parts[3], v_parts[4];
        END IF;
    END LOOP;

    -- 3. MIGRATION_012_BASELINE_PRECHECK = FULL_5_RPC
    FOREACH v_rpc SLICE 1 IN ARRAY v_rpcs
    LOOP
        SELECT count(*)
        INTO v_rpc_count
        FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
          AND p.proname = v_rpc[1];

        IF v_rpc_count = 0 THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: RPC public.% da Migration 012 ausente (count=0).', v_rpc[1];
        END IF;

        IF v_rpc_count > 1 THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: RPC public.% da Migration 012 com múltiplos overloads (count=%).', v_rpc[1], v_rpc_count;
        END IF;

        SELECT p.oid, p.prosecdef,
               (SELECT option_value FROM pg_options_to_table(p.proconfig) WHERE option_name = 'search_path'),
               pg_get_function_identity_arguments(p.oid)
        INTO v_rpc_oid, v_rpc_secdef, v_rpc_sp, v_rpc_args
        FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
          AND p.proname = v_rpc[1];

        IF v_rpc_secdef IS NOT TRUE THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: RPC public.% não é SECURITY DEFINER.', v_rpc[1];
        END IF;

        IF v_rpc_sp IS NULL OR (v_rpc_sp <> '' AND v_rpc_sp <> '""') THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: RPC public.% possui search_path não-vazio (%).', v_rpc[1], v_rpc_sp;
        END IF;

        IF v_rpc_args <> v_rpc[2] THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: Assinatura da RPC public.% divergente. Esperado: %, Atual: %',
                v_rpc[1], v_rpc[2], v_rpc_args;
        END IF;

        -- Validação de privilégios efetivos de EXECUTE
        FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated', 'public']
        LOOP
            IF has_function_privilege(v_role, v_rpc_oid, 'EXECUTE') THEN
                RAISE EXCEPTION 'PREFLIGHT_FAILED: Role % possui EXECUTE indevido na RPC public.%.', v_role, v_rpc[1];
            END IF;
        END LOOP;

        IF NOT has_function_privilege('service_role', v_rpc_oid, 'EXECUTE') THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: service_role não possui EXECUTE na RPC public.%.', v_rpc[1];
        END IF;
    END LOOP;

    -- 4. Validação de RLS nas tabelas appointments e work_orders
    FOREACH v_table_name IN ARRAY ARRAY['appointments', 'work_orders']
    LOOP
        SELECT relrowsecurity INTO v_rls_enabled
        FROM pg_class
        WHERE oid = ('public.' || v_table_name)::regclass;

        IF v_rls_enabled IS NOT TRUE THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: RLS não habilitada em public.%.', v_table_name;
        END IF;
    END LOOP;

    -- 5. Validação de Menor Privilégio Efetivo em appointments
    FOREACH v_priv IN ARRAY v_priv_list
    LOOP
        IF has_table_privilege('service_role', 'public.appointments', v_priv) THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: service_role possui privilégio indevido % em public.appointments.', v_priv;
        END IF;
    END LOOP;

    IF NOT has_table_privilege('service_role', 'public.appointments', 'SELECT') THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: service_role não possui privilégio SELECT em public.appointments.';
    END IF;

    FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated', 'public']
    LOOP
        FOREACH v_priv IN ARRAY v_all_priv_list
        LOOP
            IF has_table_privilege(v_role, 'public.appointments', v_priv) THEN
                RAISE EXCEPTION 'PREFLIGHT_FAILED: Role % possui privilégio indevido % em public.appointments.', v_role, v_priv;
            END IF;
        END LOOP;
    END LOOP;

    -- 6. Garantir ausência total dos objetos próprios da 013 (Strict Fail-Closed)
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
          AND proname = 'fn_prevent_terminal_work_order_with_active_appointments'
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Função fn_prevent_terminal_work_order_with_active_appointments já existe.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgrelid = 'public.work_orders'::regclass
          AND tgname = 'trg_prevent_terminal_work_order_with_active_appointments'
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Trigger trg_prevent_terminal_work_order_with_active_appointments já existe em public.work_orders.';
    END IF;

    -- 7. Consulta de integridade de dados (Semântica Canônica de Garantia)
    SELECT COUNT(*) INTO v_count
    FROM public.work_orders wo
    WHERE (
        (wo.status_os = 'cancelada' AND EXISTS (
            SELECT 1 FROM public.appointments appt
            WHERE appt.work_order_id = wo.id
              AND appt.status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
        ))
        OR
        (wo.status_os = 'concluida' AND EXISTS (
            SELECT 1 FROM public.appointments appt
            WHERE appt.work_order_id = wo.id
              AND appt.status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
              AND appt.tipo_agendamento <> 'garantia'
        ))
    );

    IF v_count > 0 THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Existem % ordens de serviço em estado terminal com agendamentos ativos inválidos.', v_count;
    END IF;

END $$;

-- ============================================================================
-- 3. DDL - TRIGGER FUNCTION & TRIGGER DEFINITIONS (FAIL-CLOSED CREATE FUNCTION)
-- ============================================================================

CREATE FUNCTION public.fn_prevent_terminal_work_order_with_active_appointments()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
BEGIN
    IF NEW.status_os = 'cancelada' THEN
        IF EXISTS (
            SELECT 1
            FROM public.appointments
            WHERE work_order_id = NEW.id
              AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
        ) THEN
            RAISE EXCEPTION 'ERR_ACTIVE_APPOINTMENTS_EXIST';
        END IF;
    ELSIF NEW.status_os = 'concluida' THEN
        IF EXISTS (
            SELECT 1
            FROM public.appointments
            WHERE work_order_id = NEW.id
              AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
              AND tipo_agendamento <> 'garantia'
        ) THEN
            RAISE EXCEPTION 'ERR_ACTIVE_APPOINTMENTS_EXIST';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Revogar execução de qualquer role externa (execução interna pelo trigger)
REVOKE ALL ON FUNCTION public.fn_prevent_terminal_work_order_with_active_appointments() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_prevent_terminal_work_order_with_active_appointments() FROM anon, authenticated, service_role;

-- Criação do trigger BEFORE UPDATE apenas para a coluna status_os em transições para terminal
CREATE TRIGGER trg_prevent_terminal_work_order_with_active_appointments
BEFORE UPDATE OF status_os
ON public.work_orders
FOR EACH ROW
WHEN (OLD.status_os IS DISTINCT FROM NEW.status_os AND NEW.status_os IN ('concluida', 'cancelada'))
EXECUTE FUNCTION public.fn_prevent_terminal_work_order_with_active_appointments();

-- ============================================================================
-- 4. POSTCONDITIONS (STRICT SEMANTIC & CATALOG VERIFICATION)
-- ============================================================================
DO $$
DECLARE
    v_prosecdef BOOLEAN;
    v_proowner OID;
    v_sp TEXT;
    v_rls TEXT;
    v_provola "char";
    v_foid OID;
    v_tgenabled "char";
    v_tgtype INT2;
    v_tgfoid OID;
    v_tgrelid OID;
    v_tgqual TEXT;
    v_tgattr INT2VECTOR;
    v_status_attnum INT2;
    v_tgattr_count INT;
    v_trigdef TEXT;
    v_when_clause TEXT;
    v_canonical_when TEXT;
    v_count INT;
    v_role TEXT;
BEGIN
    -- 1. Validar FUNCTION: existência, SECURITY DEFINER, search_path='', row_security=off, VOLATILE e owner esperado
    SELECT p.oid, p.prosecdef, p.proowner, p.provolatile,
           (SELECT option_value FROM pg_options_to_table(p.proconfig) WHERE option_name = 'search_path'),
           (SELECT option_value FROM pg_options_to_table(p.proconfig) WHERE option_name = 'row_security')
    INTO v_foid, v_prosecdef, v_proowner, v_provola, v_sp, v_rls
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'fn_prevent_terminal_work_order_with_active_appointments';

    IF v_foid IS NULL THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Função fn_prevent_terminal_work_order_with_active_appointments não encontrada.';
    END IF;

    IF NOT v_prosecdef THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Função fn_prevent_terminal_work_order_with_active_appointments não é SECURITY DEFINER.';
    END IF;

    IF v_provola <> 'v' THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Função fn_prevent_terminal_work_order_with_active_appointments não é VOLATILE (provolatile=%).', v_provola;
    END IF;

    IF v_sp IS NULL OR (v_sp <> '' AND v_sp <> '""') THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Função fn_prevent_terminal_work_order_with_active_appointments search_path não é exatamente vazio (sp=%).', v_sp;
    END IF;

    IF v_rls IS NULL OR v_rls <> 'off' THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Função fn_prevent_terminal_work_order_with_active_appointments row_security não é exatamente off (rls=%).', v_rls;
    END IF;

    IF v_proowner <> CURRENT_USER::regrole::oid THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Função fn_prevent_terminal_work_order_with_active_appointments owner divergente (esperado=%, atual=%).',
            CURRENT_USER, pg_get_userbyid(v_proowner);
    END IF;

    -- Validar que nenhuma role possui EXECUTE direto
    FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated', 'public', 'service_role']
    LOOP
        IF has_function_privilege(v_role, v_foid, 'EXECUTE') THEN
            RAISE EXCEPTION 'POSTCHECK_FAILED: Role % possui EXECUTE direto indevido na função fn_prevent_terminal_work_order_with_active_appointments.', v_role;
        END IF;
    END LOOP;

    -- 2. Validar TRIGGER no catálogo: tabela, função, enabled, row-level, timing, event, column e WHEN clause
    SELECT t.tgenabled, t.tgtype, t.tgfoid, t.tgrelid, t.tgqual, t.tgattr
    INTO v_tgenabled, v_tgtype, v_tgfoid, v_tgrelid, v_tgqual, v_tgattr
    FROM pg_trigger t
    WHERE t.tgrelid = 'public.work_orders'::regclass
      AND t.tgname = 'trg_prevent_terminal_work_order_with_active_appointments';

    IF v_tgenabled IS NULL THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger trg_prevent_terminal_work_order_with_active_appointments não encontrado em public.work_orders.';
    END IF;

    IF v_tgenabled <> 'O' THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger trg_prevent_terminal_work_order_with_active_appointments não está habilitado (tgenabled=%).', v_tgenabled;
    END IF;

    -- Row level: (tgtype & 1) = 1
    IF (v_tgtype & 1) <> 1 THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger trg_prevent_terminal_work_order_with_active_appointments não é FOR EACH ROW.';
    END IF;

    -- Timing: (tgtype & 2) = 2 (BEFORE)
    IF (v_tgtype & 2) <> 2 THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger trg_prevent_terminal_work_order_with_active_appointments não é BEFORE (tgtype=%).', v_tgtype;
    END IF;

    -- Event: (tgtype & 16) = 16 (UPDATE)
    IF (v_tgtype & 16) <> 16 THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger trg_prevent_terminal_work_order_with_active_appointments não é evento UPDATE (tgtype=%).', v_tgtype;
    END IF;

    -- Não deve escutar INSERT, DELETE, TRUNCATE
    IF (v_tgtype & (4 | 8 | 32 | 64)) <> 0 THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger trg_prevent_terminal_work_order_with_active_appointments possui eventos indevidos (tgtype=%).', v_tgtype;
    END IF;

    -- Função de execução vinculada
    IF v_tgfoid <> 'public.fn_prevent_terminal_work_order_with_active_appointments'::regproc::oid THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger aponta para função incorreta (esperado=fn_prevent_terminal_work_order_with_active_appointments, atual=%).',
            v_tgfoid;
    END IF;

    -- Coluna de disparo: EXATAMENTE status_os
    SELECT attnum INTO v_status_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.work_orders'::regclass AND attname = 'status_os';

    SELECT array_length(string_to_array(v_tgattr::text, ' ')::int[], 1)
    INTO v_tgattr_count;

    IF v_tgattr_count IS NULL OR v_tgattr_count <> 1 THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger deve disparar para EXATAMENTE 1 coluna, mas tgattr contém % colunas (tgattr=%).',
            COALESCE(v_tgattr_count, 0), v_tgattr;
    END IF;

    IF NOT (v_status_attnum = ANY(string_to_array(v_tgattr::text, ' ')::int[])) THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger não está restrito à coluna status_os (attnum=%, tgattr=%).',
            v_status_attnum, v_tgattr;
    END IF;

    -- WHEN clause: verificação semântica robusta (independente de serialização textual/whitespace/casts)
    IF v_tgqual IS NULL THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Trigger não possui cláusula WHEN (tgqual é nulo).';
    END IF;

    SELECT pg_get_triggerdef(t.oid)
    INTO v_trigdef
    FROM pg_trigger t
    WHERE t.tgrelid = 'public.work_orders'::regclass
      AND t.tgname = 'trg_prevent_terminal_work_order_with_active_appointments';

    v_when_clause := substring(v_trigdef FROM 'WHEN \((.+)\) EXECUTE FUNCTION');

    IF v_when_clause IS NULL THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Não foi possível extrair a cláusula WHEN da definição do trigger.';
    END IF;

    -- Validação Semântica 1: transição com IS DISTINCT FROM entre status_os antigo e novo
    IF NOT (
        v_when_clause ~* 'old\.status_os' AND
        v_when_clause ~* 'new\.status_os' AND
        v_when_clause ~* 'IS\s+DISTINCT\s+FROM'
    ) THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Cláusula WHEN não valida transição com IS DISTINCT FROM (when=%).', v_when_clause;
    END IF;

    -- Validação Semântica 2: novos status permitidos devem ser exatamente 'concluida' e 'cancelada'
    IF NOT (
        v_when_clause ~* 'concluida' AND
        v_when_clause ~* 'cancelada'
    ) THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Cláusula WHEN não restringe para ambos os status concluida e cancelada (when=%).', v_when_clause;
    END IF;

    -- Validação Semântica 3: proibido conter status não-terminais na condição
    IF (
        v_when_clause ~* 'orcamento' OR
        v_when_clause ~* 'aprovada' OR
        v_when_clause ~* 'em_execucao' OR
        v_when_clause ~* 'aguardando'
    ) THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Cláusula WHEN contém status não-terminais indevidos (when=%).', v_when_clause;
    END IF;

    -- 3. Confirmar sanidade final pós-DDL
    SELECT COUNT(*) INTO v_count
    FROM public.work_orders wo
    WHERE (
        (wo.status_os = 'cancelada' AND EXISTS (
            SELECT 1 FROM public.appointments appt
            WHERE appt.work_order_id = wo.id
              AND appt.status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
        ))
        OR
        (wo.status_os = 'concluida' AND EXISTS (
            SELECT 1 FROM public.appointments appt
            WHERE appt.work_order_id = wo.id
              AND appt.status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
              AND appt.tipo_agendamento <> 'garantia'
        ))
    );

    IF v_count > 0 THEN
        RAISE EXCEPTION 'POSTCHECK_FAILED: Inconsistência detectada no postcheck final: % registros.', v_count;
    END IF;
END $$;

COMMIT;
