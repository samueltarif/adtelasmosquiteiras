BEGIN;

DO $$
DECLARE
    v_entity_def TEXT;
    v_acao_def TEXT;
    v_con_def TEXT;
    v_extracted_entities TEXT[];
    v_sorted_entities TEXT[];
    v_extracted_actions TEXT[];
    v_sorted_actions TEXT[];
    v_expected_entities TEXT[] := ARRAY[
        'address', 'appointment', 'client', 'media', 'note',
        'payment', 'proposal', 'warranty', 'work_order', 'work_order_item'
    ];
    v_expected_actions_011 TEXT[] := ARRAY[
        'address_created', 'address_deleted', 'address_updated', 'appointment_cancelled', 'appointment_created',
        'appointment_rescheduled', 'client_archived', 'client_created', 'client_updated', 'converted_from_lead',
        'media_removed', 'media_uploaded', 'note_added', 'payment_cancelled', 'payment_received',
        'proposal_accepted', 'proposal_issued', 'proposal_superseded', 'warranty_issued', 'warranty_resolved',
        'warranty_triggered', 'work_order_cancelled', 'work_order_completed', 'work_order_created', 'work_order_status_changed'
    ];
    v_has_error BOOLEAN;
    v_spec TEXT;
    v_parts TEXT[];
    v_table_name TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') THEN
        NULL;
    END IF;

    FOREACH v_table_name IN ARRAY ARRAY[
        'appointments', 'crm_staff', 'work_orders', 'clients', 'client_addresses',
        'admin_users', 'crm_activity_log', 'warranties', 'work_order_proposals'
    ]
    LOOP
        IF to_regclass('public.' || v_table_name) IS NULL THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: Tabela public.% ausente.', v_table_name;
        END IF;
    END LOOP;

    FOREACH v_spec IN ARRAY ARRAY[
        'appointments.id.uuid.NO', 'appointments.work_order_id.uuid.NO', 'appointments.client_id.uuid.NO',
        'appointments.address_id.uuid.YES', 'appointments.staff_id.uuid.YES', 'appointments.tipo_agendamento.character varying.NO',
        'appointments.data_hora_inicio.timestamp with time zone.NO', 'appointments.data_hora_fim.timestamp with time zone.NO',
        'appointments.status_agendamento.character varying.NO', 'appointments.observacoes.text.YES',
        'appointments.rescheduled_from_id.uuid.YES', 'appointments.motivo_reagendamento_cancelamento.text.YES',
        'appointments.created_by.uuid.YES', 'appointments.created_at.timestamp with time zone.NO',
        'appointments.updated_at.timestamp with time zone.NO', 'crm_staff.id.uuid.NO',
        'crm_staff.nome.character varying.NO', 'crm_staff.funcao.character varying.NO',
        'crm_staff.is_active.boolean.NO', 'crm_staff.updated_at.timestamp with time zone.NO',
        'work_orders.id.uuid.NO', 'work_orders.client_id.uuid.NO', 'work_orders.address_id.uuid.YES',
        'work_orders.status_os.character varying.NO', 'work_orders.data_prevista.date.YES',
        'work_orders.is_archived.boolean.NO', 'work_orders.updated_at.timestamp with time zone.NO',
        'work_orders.accepted_proposal_id.uuid.YES', 'warranties.work_order_id.uuid.NO',
        'warranties.data_inicio.date.NO', 'warranties.data_termino.date.NO',
        'warranties.status_operacional.character varying.NO', 'crm_activity_log.client_id.uuid.NO',
        'crm_activity_log.work_order_id.uuid.YES', 'crm_activity_log.entity_type.character varying.NO',
        'crm_activity_log.entity_id.uuid.NO', 'crm_activity_log.acao.character varying.NO',
        'crm_activity_log.dados_anteriores.jsonb.YES', 'crm_activity_log.dados_novos.jsonb.YES',
        'crm_activity_log.descricao_humana.text.NO', 'crm_activity_log.actor_id.uuid.YES',
        'crm_activity_log.occurred_at.timestamp with time zone.NO'
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

    FOREACH v_con_def IN ARRAY ARRAY[
        'fk_appointments_work_order_client|f|FOREIGN KEY (work_order_id, client_id) REFERENCES work_orders(id, client_id) ON DELETE RESTRICT',
        'fk_appointments_client_address|f|FOREIGN KEY (address_id, client_id) REFERENCES client_addresses(id, client_id) ON DELETE RESTRICT',
        'fk_appointments_staff|f|FOREIGN KEY (staff_id) REFERENCES crm_staff(id) ON DELETE SET NULL',
        'fk_appointments_rescheduled_from|f|FOREIGN KEY (rescheduled_from_id) REFERENCES appointments(id) ON DELETE SET NULL'
    ]
    LOOP
        v_parts := string_to_array(v_con_def, '|');
        SELECT pg_get_constraintdef(oid) INTO v_con_def FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass AND conname = v_parts[1] AND contype = v_parts[2];
        IF v_con_def IS NULL OR v_con_def NOT LIKE v_parts[3] || '%' THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: Constraint % invalida: %', v_parts[1], v_con_def;
        END IF;
    END LOOP;

    SELECT pg_get_constraintdef(oid) INTO v_con_def FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass AND conname = 'chk_appointments_tipo' AND contype = 'c';
    IF v_con_def IS NULL OR NOT (
        v_con_def LIKE '%visita_tecnica%' AND v_con_def LIKE '%medicao%' AND
        v_con_def LIKE '%instalacao%' AND v_con_def LIKE '%manutencao%' AND v_con_def LIKE '%garantia%'
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: chk_appointments_tipo invalida: %', v_con_def;
    END IF;

    SELECT pg_get_constraintdef(oid) INTO v_con_def FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass AND conname = 'chk_appointments_status' AND contype = 'c';
    IF v_con_def IS NULL OR NOT (
        v_con_def LIKE '%agendado%' AND v_con_def LIKE '%confirmado%' AND
        v_con_def LIKE '%em_deslocamento%' AND v_con_def LIKE '%realizado%' AND
        v_con_def LIKE '%reagendado%' AND v_con_def LIKE '%cancelado%'
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: chk_appointments_status invalida: %', v_con_def;
    END IF;

    SELECT pg_get_constraintdef(oid) INTO v_con_def FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass AND conname = 'chk_appointments_intervalo' AND contype = 'c';
    IF v_con_def IS NULL OR v_con_def NOT LIKE '%data_hora_inicio < data_hora_fim%' THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: chk_appointments_intervalo invalida: %', v_con_def;
    END IF;

    SELECT pg_get_constraintdef(oid) INTO v_con_def FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass AND conname = 'chk_appointments_motive' AND contype = 'c';
    IF v_con_def IS NULL OR NOT (
        v_con_def LIKE '%reagendado%' AND v_con_def LIKE '%cancelado%' AND
        v_con_def LIKE '%motivo_reagendamento_cancelamento%' AND v_con_def LIKE '%>= 3%'
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: chk_appointments_motive invalida: %', v_con_def;
    END IF;

    FOREACH v_table_name IN ARRAY ARRAY['appointments', 'crm_staff', 'crm_activity_log', 'work_orders', 'warranties']
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = v_table_name AND c.relrowsecurity = true
        ) THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: RLS deve estar ativado na tabela public.%.', v_table_name;
        END IF;
    END LOOP;

    SELECT pg_get_constraintdef(oid) INTO v_entity_def FROM pg_constraint
    WHERE conrelid = 'public.crm_activity_log'::regclass AND conname = 'chk_activity_log_entity';
    IF v_entity_def IS NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Constraint chk_activity_log_entity ausente.';
    END IF;
    SELECT ARRAY(SELECT m[1] FROM pg_catalog.regexp_matches(v_entity_def, '''([^'']+)''', 'g') AS m) INTO v_extracted_entities;
    SELECT ARRAY(SELECT unnest(v_extracted_entities) ORDER BY 1) INTO v_sorted_entities;
    IF v_sorted_entities IS DISTINCT FROM v_expected_entities THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: CRM_ACTIVITY_CONSTRAINT_DRIFT: Entity allowlist diverge da pos-011.';
    END IF;

    SELECT pg_get_constraintdef(oid) INTO v_acao_def FROM pg_constraint
    WHERE conrelid = 'public.crm_activity_log'::regclass AND conname = 'chk_activity_log_acao';
    IF v_acao_def IS NULL THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Constraint chk_activity_log_acao ausente.';
    END IF;
    SELECT ARRAY(SELECT m[1] FROM pg_catalog.regexp_matches(v_acao_def, '''([^'']+)''', 'g') AS m) INTO v_extracted_actions;
    SELECT ARRAY(SELECT unnest(v_extracted_actions) ORDER BY 1) INTO v_sorted_actions;
    IF v_sorted_actions IS DISTINCT FROM v_expected_actions_011 THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: CRM_ACTIVITY_CONSTRAINT_DRIFT: Acao allowlist diverge da pos-011.';
    END IF;

    FOREACH v_spec IN ARRAY ARRAY[
        'SELECT 1 FROM public.appointments WHERE data_hora_inicio >= data_hora_fim|Agendamentos com data_hora_inicio >= data_hora_fim.',
        'SELECT 1 FROM public.appointments a WHERE a.staff_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.crm_staff s WHERE s.id = a.staff_id)|Agendamentos com staff_id orfao.',
        'SELECT 1 FROM public.appointments a WHERE NOT EXISTS (SELECT 1 FROM public.work_orders w WHERE w.id = a.work_order_id)|Agendamentos com work_order_id orfao.',
        'SELECT 1 FROM public.appointments a JOIN public.work_orders w ON w.id = a.work_order_id WHERE a.client_id <> w.client_id|Agendamentos com client_id divergente da OS.',
        'SELECT 1 FROM public.appointments a JOIN public.client_addresses ad ON ad.id = a.address_id WHERE a.address_id IS NOT NULL AND a.client_id <> ad.client_id|Agendamentos com address_id de outro cliente.',
        'SELECT 1 FROM public.appointments WHERE status_agendamento NOT IN (''agendado'', ''confirmado'', ''em_deslocamento'', ''realizado'', ''reagendado'', ''cancelado'')|Agendamentos com status invalido.',
        'SELECT 1 FROM public.appointments WHERE tipo_agendamento NOT IN (''visita_tecnica'', ''medicao'', ''instalacao'', ''manutencao'', ''garantia'')|Agendamentos com tipo invalido.',
        'SELECT 1 FROM public.appointments a1 JOIN public.appointments a2 ON a1.staff_id = a2.staff_id AND a1.id <> a2.id WHERE a1.staff_id IS NOT NULL AND a1.status_agendamento IN (''agendado'', ''confirmado'', ''em_deslocamento'') AND a2.status_agendamento IN (''agendado'', ''confirmado'', ''em_deslocamento'') AND tstzrange(a1.data_hora_inicio, a1.data_hora_fim, ''[)'') && tstzrange(a2.data_hora_inicio, a2.data_hora_fim, ''[)'')|Conflitos de sobreposicao ativa encontrados.',
        'SELECT 1 FROM public.appointments WHERE tipo_agendamento = ''instalacao'' AND status_agendamento IN (''agendado'', ''confirmado'', ''em_deslocamento'') GROUP BY work_order_id HAVING COUNT(*) > 1|OSs com mais de 1 instalacao ativa.'
    ]
    LOOP
        v_parts := string_to_array(v_spec, '|');
        EXECUTE 'SELECT EXISTS (' || v_parts[1] || ')' INTO v_has_error;
        IF v_has_error THEN
            RAISE EXCEPTION 'PREFLIGHT_FAILED: %', v_parts[2];
        END IF;
    END LOOP;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_appointments_staff_active_period') OR
       EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'unq_active_installation_per_wo') OR
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname IN ('create_appointment_atomic', 'update_appointment_atomic', 'reschedule_appointment_atomic', 'cancel_appointment_atomic', 'update_appointment_status_atomic', 'fn_prevent_appointment_hard_delete', 'fn_prevent_crm_staff_hard_delete', 'fn_check_crm_staff_deactivation')) THEN
        RAISE EXCEPTION 'PREFLIGHT_FAILED: Objetos da Migration 012 ja existem.';
    END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.appointments
    ADD CONSTRAINT unq_appointments_staff_active_period
    EXCLUDE USING gist (staff_id WITH =, tstzrange(data_hora_inicio, data_hora_fim, '[)') WITH &&)
    WHERE (status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento') AND staff_id IS NOT NULL);

CREATE UNIQUE INDEX unq_active_installation_per_wo
    ON public.appointments(work_order_id)
    WHERE (tipo_agendamento = 'instalacao' AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento'));

ALTER TABLE public.crm_activity_log DROP CONSTRAINT chk_activity_log_acao;
ALTER TABLE public.crm_activity_log ADD CONSTRAINT chk_activity_log_acao CHECK (
    acao IN (
        'client_created', 'converted_from_lead', 'client_updated', 'client_archived',
        'address_created', 'address_updated', 'address_deleted',
        'work_order_created', 'work_order_status_changed', 'work_order_completed', 'work_order_cancelled',
        'payment_received', 'payment_cancelled',
        'appointment_created', 'appointment_rescheduled', 'appointment_cancelled',
        'warranty_issued', 'warranty_triggered', 'warranty_resolved',
        'media_uploaded', 'media_removed', 'note_added',
        'proposal_issued', 'proposal_accepted', 'proposal_superseded',
        'appointment_status_changed', 'appointment_updated'
    )
);

CREATE FUNCTION public.fn_prevent_appointment_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ERR_HARD_DELETE_FORBIDDEN: Exclusao fisica de agendamentos e proibida. Utilize cancelamento auditavel.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_hard_delete_appointments
BEFORE DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_appointment_hard_delete();

CREATE FUNCTION public.fn_prevent_crm_staff_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ERR_HARD_DELETE_FORBIDDEN: Exclusao fisica de colaborador e proibida. Utilize desativacao logica (is_active = false).';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_hard_delete_crm_staff
BEFORE DELETE ON public.crm_staff
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_crm_staff_hard_delete();

CREATE FUNCTION public.fn_check_crm_staff_deactivation()
RETURNS TRIGGER AS $$
DECLARE
    v_active_appts INT;
BEGIN
    IF OLD.is_active = true AND NEW.is_active = false THEN
        SELECT COUNT(*) INTO v_active_appts FROM public.appointments
        WHERE staff_id = OLD.id AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento');
        IF v_active_appts > 0 THEN
            RAISE EXCEPTION 'ERR_STAFF_HAS_ACTIVE_APPOINTMENTS: O colaborador possui % agendamento(s) ativo(s). Reatribua ou cancele antes de desativar.', v_active_appts;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_crm_staff_deactivation
BEFORE UPDATE ON public.crm_staff
FOR EACH ROW EXECUTE FUNCTION public.fn_check_crm_staff_deactivation();

CREATE FUNCTION public.create_appointment_atomic(
    p_actor_id UUID, p_work_order_id UUID, p_tipo_agendamento VARCHAR(30),
    p_data_hora_inicio TIMESTAMPTZ, p_data_hora_fim TIMESTAMPTZ,
    p_staff_id UUID DEFAULT NULL, p_address_id UUID DEFAULT NULL, p_observacoes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_admin_active BOOLEAN;
    v_wo RECORD;
    v_staff RECORD;
    v_addr RECORD;
    v_warranty RECORD;
    v_appointment_id UUID;
    v_local_date DATE;
    v_new_appt RECORD;
BEGIN
    SELECT is_active INTO v_admin_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_admin_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_ADMIN_NOT_ACTIVE: Administrador inativo ou nao autorizado.';
    END IF;

    IF p_data_hora_inicio IS NULL OR p_data_hora_fim IS NULL OR p_data_hora_inicio >= p_data_hora_fim THEN
        RAISE EXCEPTION 'ERR_INVALID_APPOINTMENT_INTERVAL: data_hora_inicio e data_hora_fim sao obrigatorios e inicio deve ser anterior a fim.';
    END IF;

    IF p_tipo_agendamento NOT IN ('visita_tecnica', 'medicao', 'instalacao', 'manutencao', 'garantia') THEN
        RAISE EXCEPTION 'ERR_INVALID_APPOINTMENT_TIPO: Tipo de agendamento invalido: %', p_tipo_agendamento;
    END IF;

    SELECT id, client_id, address_id, status_os, is_archived INTO v_wo FROM public.work_orders WHERE id = p_work_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Ordem de Servico nao encontrada.';
    END IF;
    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Nao e permitido agendar em OS arquivada.';
    END IF;

    IF p_tipo_agendamento = 'instalacao' AND v_wo.status_os NOT IN ('aprovada', 'aguardando_agendamento') THEN
        RAISE EXCEPTION 'ERR_INSTALLATION_WORK_ORDER_STATUS: Instalacao exige OS aprovada ou aguardando_agendamento. Status: %', v_wo.status_os;
    END IF;
    IF p_tipo_agendamento IN ('visita_tecnica', 'medicao') AND v_wo.status_os NOT IN ('orcamento', 'aprovada', 'aguardando_agendamento') THEN
        RAISE EXCEPTION 'ERR_QUOTE_WORK_ORDER_STATUS: Visita/Medicao permitida apenas em orcamento, aprovada ou aguardando_agendamento.';
    END IF;
    IF p_tipo_agendamento = 'manutencao' AND v_wo.status_os IN ('orcamento', 'concluida', 'cancelada') THEN
        RAISE EXCEPTION 'ERR_MAINTENANCE_WORK_ORDER_STATUS: Manutencao exige OS operacional em aberto.';
    END IF;

    v_local_date := (p_data_hora_inicio AT TIME ZONE 'America/Sao_Paulo')::date;
    IF p_tipo_agendamento = 'garantia' THEN
        IF v_wo.status_os <> 'concluida' THEN
            RAISE EXCEPTION 'ERR_WARRANTY_WORK_ORDER_STATUS: Garantia exige OS em status concluida.';
        END IF;
        SELECT id INTO v_warranty FROM public.warranties
        WHERE work_order_id = p_work_order_id AND status_operacional IN ('normal', 'acionada', 'em_atendimento')
          AND data_inicio <= v_local_date AND data_termino >= v_local_date LIMIT 1;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_WARRANTY_NOT_ACTIVE: Nenhuma garantia ativa cobre a data local informada (%).', v_local_date;
        END IF;
    END IF;

    IF p_staff_id IS NOT NULL THEN
        SELECT id, is_active INTO v_staff FROM public.crm_staff WHERE id = p_staff_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_STAFF_NOT_FOUND: Colaborador nao encontrado.';
        ELSIF NOT v_staff.is_active THEN
            RAISE EXCEPTION 'ERR_STAFF_INACTIVE: Colaborador esta inativo.';
        END IF;
    END IF;

    IF p_address_id IS NOT NULL THEN
        SELECT id INTO v_addr FROM public.client_addresses WHERE id = p_address_id AND client_id = v_wo.client_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_ADDRESS_CLIENT_MISMATCH: O endereco nao pertence ao cliente da OS.';
        END IF;
    ELSE
        p_address_id := v_wo.address_id;
    END IF;

    BEGIN
        INSERT INTO public.appointments (
            work_order_id, client_id, address_id, staff_id, tipo_agendamento,
            data_hora_inicio, data_hora_fim, status_agendamento, observacoes, created_by
        ) VALUES (
            p_work_order_id, v_wo.client_id, p_address_id, p_staff_id, p_tipo_agendamento,
            p_data_hora_inicio, p_data_hora_fim, 'agendado', p_observacoes, p_actor_id
        ) RETURNING id INTO v_appointment_id;
    EXCEPTION
        WHEN SQLSTATE '23P01' THEN
            RAISE EXCEPTION 'ERR_STAFF_SCHEDULE_CONFLICT: Conflito de agenda: colaborador ja possui compromisso ativo no periodo.';
        WHEN SQLSTATE '23505' THEN
            RAISE EXCEPTION 'ERR_ACTIVE_INSTALLATION_EXISTS: A Ordem de Servico ja possui uma instalacao ativa.';
    END;

    IF p_tipo_agendamento = 'instalacao' THEN
        UPDATE public.work_orders SET status_os = 'agendada', data_prevista = v_local_date, updated_at = now() WHERE id = p_work_order_id;
        IF v_wo.status_os <> 'agendada' THEN
            INSERT INTO public.crm_activity_log (client_id, work_order_id, entity_type, entity_id, acao, dados_anteriores, dados_novos, descricao_humana, actor_id)
            VALUES (v_wo.client_id, p_work_order_id, 'work_order', p_work_order_id, 'work_order_status_changed',
                    jsonb_build_object('status_anterior', v_wo.status_os), jsonb_build_object('status_novo', 'agendada'),
                    'OS atualizada para agendada por criacao de instalacao.', p_actor_id);
        END IF;
    END IF;

    INSERT INTO public.crm_activity_log (client_id, work_order_id, entity_type, entity_id, acao, dados_novos, descricao_humana, actor_id)
    VALUES (v_wo.client_id, p_work_order_id, 'appointment', v_appointment_id, 'appointment_created',
            jsonb_build_object('appointment_id', v_appointment_id, 'tipo', p_tipo_agendamento, 'staff_id', p_staff_id, 'inicio', p_data_hora_inicio, 'fim', p_data_hora_fim),
            format('Agendamento de %s criado para %s.', p_tipo_agendamento, to_char(v_local_date, 'DD/MM/YYYY')), p_actor_id);

    SELECT * INTO v_new_appt FROM public.appointments WHERE id = v_appointment_id;
    RETURN to_jsonb(v_new_appt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE FUNCTION public.update_appointment_atomic(
    p_actor_id UUID, p_appointment_id UUID, p_expected_appointment_updated_at TIMESTAMPTZ,
    p_staff_id UUID DEFAULT NULL, p_address_id UUID DEFAULT NULL, p_observacoes TEXT DEFAULT NULL,
    p_update_staff BOOLEAN DEFAULT false, p_update_address BOOLEAN DEFAULT false, p_update_observacoes BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
    v_admin_active BOOLEAN;
    v_peek_wo_id UUID;
    v_wo RECORD;
    v_appt RECORD;
    v_staff RECORD;
    v_addr RECORD;
    v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_updated_appt RECORD;
BEGIN
    SELECT is_active INTO v_admin_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_admin_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_ADMIN_NOT_ACTIVE: Administrador inativo ou nao autorizado.';
    END IF;

    IF NOT p_update_staff AND NOT p_update_address AND NOT p_update_observacoes THEN
        RAISE EXCEPTION 'ERR_NO_APPOINTMENT_CHANGES: Nenhuma alteracao solicitada para o agendamento.';
    END IF;

    SELECT work_order_id INTO v_peek_wo_id FROM public.appointments WHERE id = p_appointment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_NOT_FOUND: Agendamento nao encontrado.';
    END IF;

    SELECT id, client_id, is_archived INTO v_wo FROM public.work_orders WHERE id = v_peek_wo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Ordem de Servico associada nao encontrada.';
    END IF;

    SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id FOR UPDATE;
    IF v_appt.work_order_id <> v_peek_wo_id THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_DRIFT: Inconsistencia de Ordem de Servico no agendamento.';
    END IF;

    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Nao e permitido alterar agendamento de OS arquivada.';
    END IF;
    IF v_appt.status_agendamento IN ('realizado', 'reagendado', 'cancelado') THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_TERMINAL: Agendamentos em estado terminal (%) nao podem ser alterados.', v_appt.status_agendamento;
    END IF;
    IF v_appt.updated_at IS DISTINCT FROM p_expected_appointment_updated_at THEN
        RAISE EXCEPTION 'ERR_CONCURRENCY_CONFLICT: O agendamento foi modificado por outro usuario. Recarregue os dados.';
    END IF;

    IF p_update_staff THEN
        IF p_staff_id IS NOT NULL THEN
            SELECT id, is_active INTO v_staff FROM public.crm_staff WHERE id = p_staff_id FOR UPDATE;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'ERR_STAFF_NOT_FOUND: Colaborador nao encontrado.';
            ELSIF NOT v_staff.is_active THEN
                RAISE EXCEPTION 'ERR_STAFF_INACTIVE: Colaborador esta inativo.';
            END IF;
        END IF;
        v_changed_fields := array_append(v_changed_fields, 'staff_id');
    ELSE
        p_staff_id := v_appt.staff_id;
    END IF;

    IF p_update_address THEN
        IF p_address_id IS NOT NULL THEN
            SELECT id INTO v_addr FROM public.client_addresses WHERE id = p_address_id AND client_id = v_appt.client_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'ERR_ADDRESS_CLIENT_MISMATCH: O endereco nao pertence ao cliente.';
            END IF;
        END IF;
        v_changed_fields := array_append(v_changed_fields, 'address_id');
    ELSE
        p_address_id := v_appt.address_id;
    END IF;

    IF p_update_observacoes THEN
        v_changed_fields := array_append(v_changed_fields, 'observacoes');
    ELSE
        p_observacoes := v_appt.observacoes;
    END IF;

    BEGIN
        UPDATE public.appointments SET staff_id = p_staff_id, address_id = p_address_id, observacoes = p_observacoes, updated_at = now() WHERE id = p_appointment_id;
    EXCEPTION
        WHEN SQLSTATE '23P01' THEN
            RAISE EXCEPTION 'ERR_STAFF_SCHEDULE_CONFLICT: Conflito de agenda: o colaborador ja possui compromisso ativo no periodo.';
    END;

    INSERT INTO public.crm_activity_log (client_id, work_order_id, entity_type, entity_id, acao, dados_anteriores, dados_novos, descricao_humana, actor_id)
    VALUES (v_appt.client_id, v_appt.work_order_id, 'appointment', p_appointment_id, 'appointment_updated',
            jsonb_build_object('appointment_id', p_appointment_id, 'staff_id_antigo', v_appt.staff_id),
            jsonb_build_object('appointment_id', p_appointment_id, 'staff_id_novo', p_staff_id, 'campos_alterados', v_changed_fields),
            'Agendamento atualizado.', p_actor_id);

    SELECT * INTO v_updated_appt FROM public.appointments WHERE id = p_appointment_id;
    RETURN to_jsonb(v_updated_appt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE FUNCTION public.reschedule_appointment_atomic(
    p_actor_id UUID, p_appointment_id UUID,
    p_new_data_hora_inicio TIMESTAMPTZ, p_new_data_hora_fim TIMESTAMPTZ,
    p_motivo TEXT, p_expected_appointment_updated_at TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
    v_admin_active BOOLEAN;
    v_peek_wo_id UUID;
    v_wo RECORD;
    v_appt RECORD;
    v_staff RECORD;
    v_warranty RECORD;
    v_new_appointment_id UUID;
    v_new_local_date DATE;
    v_new_appt RECORD;
BEGIN
    SELECT is_active INTO v_admin_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_admin_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_ADMIN_NOT_ACTIVE: Administrador inativo ou nao autorizado.';
    END IF;

    IF p_motivo IS NULL OR length(trim(p_motivo)) < 3 THEN
        RAISE EXCEPTION 'ERR_RESCHEDULE_REASON_REQUIRED: Justificativa de reagendamento obrigatoria (minimo 3 caracteres).';
    END IF;
    IF p_new_data_hora_inicio IS NULL OR p_new_data_hora_fim IS NULL OR p_new_data_hora_inicio >= p_new_data_hora_fim THEN
        RAISE EXCEPTION 'ERR_INVALID_APPOINTMENT_INTERVAL: Nova data_hora_inicio e data_hora_fim sao obrigatorios e inicio deve ser anterior a fim.';
    END IF;

    SELECT work_order_id INTO v_peek_wo_id FROM public.appointments WHERE id = p_appointment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_NOT_FOUND: Agendamento nao encontrado.';
    END IF;

    SELECT id, client_id, status_os, is_archived INTO v_wo FROM public.work_orders WHERE id = v_peek_wo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Ordem de Servico associada nao encontrada.';
    END IF;

    SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id FOR UPDATE;
    IF v_appt.work_order_id <> v_peek_wo_id THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_DRIFT: Inconsistencia de Ordem de Servico no agendamento.';
    END IF;

    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Nao e permitido reagendar compromisso de OS arquivada.';
    END IF;
    IF v_appt.status_agendamento NOT IN ('agendado', 'confirmado', 'em_deslocamento') THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS_TRANSITION: Somente agendamentos ativos podem ser reagendados. Status: %', v_appt.status_agendamento;
    END IF;
    IF v_appt.updated_at IS DISTINCT FROM p_expected_appointment_updated_at THEN
        RAISE EXCEPTION 'ERR_CONCURRENCY_CONFLICT: O agendamento foi modificado por outro usuario. Recarregue os dados.';
    END IF;

    IF v_appt.tipo_agendamento IN ('visita_tecnica', 'medicao') AND v_wo.status_os NOT IN ('orcamento', 'aprovada', 'aguardando_agendamento') THEN
        RAISE EXCEPTION 'ERR_QUOTE_WORK_ORDER_STATUS: Visita/Medicao permitida apenas em orcamento, aprovada ou aguardando_agendamento. Status: %', v_wo.status_os;
    END IF;
    IF v_appt.tipo_agendamento = 'manutencao' AND v_wo.status_os IN ('orcamento', 'concluida', 'cancelada') THEN
        RAISE EXCEPTION 'ERR_MAINTENANCE_WORK_ORDER_STATUS: Manutencao exige OS operacional em aberto. Status: %', v_wo.status_os;
    END IF;
    IF v_appt.tipo_agendamento = 'instalacao' AND v_wo.status_os <> 'agendada' THEN
        RAISE EXCEPTION 'ERR_INSTALLATION_WORK_ORDER_STATUS: Reagendamento de instalacao exige OS em status agendada. Status: %', v_wo.status_os;
    END IF;

    v_new_local_date := (p_new_data_hora_inicio AT TIME ZONE 'America/Sao_Paulo')::date;
    IF v_appt.tipo_agendamento = 'garantia' THEN
        IF v_wo.status_os <> 'concluida' THEN
            RAISE EXCEPTION 'ERR_WARRANTY_WORK_ORDER_STATUS: Garantia exige OS em status concluida.';
        END IF;
        SELECT id INTO v_warranty FROM public.warranties
        WHERE work_order_id = v_appt.work_order_id AND status_operacional IN ('normal', 'acionada', 'em_atendimento')
          AND data_inicio <= v_new_local_date AND data_termino >= v_new_local_date LIMIT 1;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_WARRANTY_NOT_ACTIVE: Nenhuma garantia ativa cobre a nova data local informada (%).', v_new_local_date;
        END IF;
    END IF;

    IF v_appt.staff_id IS NOT NULL THEN
        SELECT id, is_active INTO v_staff FROM public.crm_staff WHERE id = v_appt.staff_id FOR UPDATE;
        IF NOT FOUND OR NOT v_staff.is_active THEN
            RAISE EXCEPTION 'ERR_STAFF_INACTIVE: Colaborador esta inativo ou indisponivel.';
        END IF;
    END IF;

    UPDATE public.appointments SET status_agendamento = 'reagendado', motivo_reagendamento_cancelamento = p_motivo, updated_at = now() WHERE id = p_appointment_id;

    BEGIN
        INSERT INTO public.appointments (
            work_order_id, client_id, address_id, staff_id, tipo_agendamento,
            data_hora_inicio, data_hora_fim, status_agendamento, observacoes, rescheduled_from_id, created_by
        ) VALUES (
            v_appt.work_order_id, v_appt.client_id, v_appt.address_id, v_appt.staff_id, v_appt.tipo_agendamento,
            p_new_data_hora_inicio, p_new_data_hora_fim, 'agendado', v_appt.observacoes, p_appointment_id, p_actor_id
        ) RETURNING id INTO v_new_appointment_id;
    EXCEPTION
        WHEN SQLSTATE '23P01' THEN
            RAISE EXCEPTION 'ERR_STAFF_SCHEDULE_CONFLICT: Conflito de agenda: o colaborador ja possui compromisso ativo no novo horario.';
        WHEN SQLSTATE '23505' THEN
            RAISE EXCEPTION 'ERR_ACTIVE_INSTALLATION_EXISTS: Ja existe outra instalacao ativa para esta Ordem de Servico.';
    END;

    IF v_appt.tipo_agendamento = 'instalacao' THEN
        UPDATE public.work_orders SET data_prevista = v_new_local_date, updated_at = now() WHERE id = v_appt.work_order_id;
    END IF;

    INSERT INTO public.crm_activity_log (client_id, work_order_id, entity_type, entity_id, acao, dados_anteriores, dados_novos, descricao_humana, actor_id)
    VALUES (v_appt.client_id, v_appt.work_order_id, 'appointment', v_new_appointment_id, 'appointment_rescheduled',
            jsonb_build_object('appointment_id_antigo', p_appointment_id, 'inicio_antigo', v_appt.data_hora_inicio),
            jsonb_build_object('appointment_id_novo', v_new_appointment_id, 'inicio_novo', p_new_data_hora_inicio, 'reason_recorded', true),
            format('Agendamento reagendado para %s.', to_char(v_new_local_date, 'DD/MM/YYYY')), p_actor_id);

    SELECT * INTO v_new_appt FROM public.appointments WHERE id = v_new_appointment_id;
    RETURN to_jsonb(v_new_appt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE FUNCTION public.cancel_appointment_atomic(
    p_actor_id UUID, p_appointment_id UUID, p_motivo TEXT, p_expected_appointment_updated_at TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
    v_admin_active BOOLEAN;
    v_peek_wo_id UUID;
    v_wo RECORD;
    v_appt RECORD;
    v_rem_inst INT;
    v_cancelled_appt RECORD;
BEGIN
    SELECT is_active INTO v_admin_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_admin_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_ADMIN_NOT_ACTIVE: Administrador inativo ou nao autorizado.';
    END IF;

    IF p_motivo IS NULL OR length(trim(p_motivo)) < 3 THEN
        RAISE EXCEPTION 'ERR_CANCEL_REASON_REQUIRED: Justificativa de cancelamento obrigatoria (minimo 3 caracteres).';
    END IF;

    SELECT work_order_id INTO v_peek_wo_id FROM public.appointments WHERE id = p_appointment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_NOT_FOUND: Agendamento nao encontrado.';
    END IF;

    SELECT id, client_id, status_os, is_archived INTO v_wo FROM public.work_orders WHERE id = v_peek_wo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Ordem de Servico associada nao encontrada.';
    END IF;

    SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id FOR UPDATE;
    IF v_appt.work_order_id <> v_peek_wo_id THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_DRIFT: Inconsistencia de Ordem de Servico no agendamento.';
    END IF;

    IF v_appt.status_agendamento NOT IN ('agendado', 'confirmado', 'em_deslocamento') THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS_TRANSITION: Somente agendamentos ativos podem ser cancelados. Status: %', v_appt.status_agendamento;
    END IF;
    IF v_appt.updated_at IS DISTINCT FROM p_expected_appointment_updated_at THEN
        RAISE EXCEPTION 'ERR_CONCURRENCY_CONFLICT: O agendamento foi modificado por outro usuario. Recarregue os dados.';
    END IF;

    UPDATE public.appointments SET status_agendamento = 'cancelado', motivo_reagendamento_cancelamento = p_motivo, updated_at = now() WHERE id = p_appointment_id;

    IF v_appt.tipo_agendamento = 'instalacao' AND v_wo.status_os = 'agendada' AND NOT v_wo.is_archived THEN
        SELECT COUNT(*) INTO v_rem_inst FROM public.appointments
        WHERE work_order_id = v_appt.work_order_id AND id <> p_appointment_id
          AND tipo_agendamento = 'instalacao' AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento');

        IF v_rem_inst = 0 THEN
            UPDATE public.work_orders SET status_os = 'aguardando_agendamento', data_prevista = NULL, updated_at = now() WHERE id = v_appt.work_order_id;
            INSERT INTO public.crm_activity_log (client_id, work_order_id, entity_type, entity_id, acao, dados_anteriores, dados_novos, descricao_humana, actor_id)
            VALUES (v_appt.client_id, v_appt.work_order_id, 'work_order', v_appt.work_order_id, 'work_order_status_changed',
                    jsonb_build_object('status_anterior', 'agendada'), jsonb_build_object('status_novo', 'aguardando_agendamento'),
                    'OS revertida para aguardando_agendamento por cancelamento de instalacao.', p_actor_id);
        END IF;
    END IF;

    INSERT INTO public.crm_activity_log (client_id, work_order_id, entity_type, entity_id, acao, dados_novos, descricao_humana, actor_id)
    VALUES (v_appt.client_id, v_appt.work_order_id, 'appointment', p_appointment_id, 'appointment_cancelled',
            jsonb_build_object('appointment_id', p_appointment_id, 'reason_recorded', true),
            'Agendamento cancelado.', p_actor_id);

    SELECT * INTO v_cancelled_appt FROM public.appointments WHERE id = p_appointment_id;
    RETURN to_jsonb(v_cancelled_appt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE FUNCTION public.update_appointment_status_atomic(
    p_actor_id UUID, p_appointment_id UUID, p_next_status VARCHAR(30), p_expected_appointment_updated_at TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
    v_admin_active BOOLEAN;
    v_peek_wo_id UUID;
    v_wo RECORD;
    v_appt RECORD;
    v_is_valid BOOLEAN := false;
    v_updated_appt RECORD;
BEGIN
    SELECT is_active INTO v_admin_active FROM public.admin_users WHERE user_id = p_actor_id;
    IF v_admin_active IS NOT TRUE THEN
        RAISE EXCEPTION 'ERR_ADMIN_NOT_ACTIVE: Administrador inativo ou nao autorizado.';
    END IF;

    SELECT work_order_id INTO v_peek_wo_id FROM public.appointments WHERE id = p_appointment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_NOT_FOUND: Agendamento nao encontrado.';
    END IF;

    SELECT id, client_id, is_archived INTO v_wo FROM public.work_orders WHERE id = v_peek_wo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_NOT_FOUND: Ordem de Servico associada nao encontrada.';
    END IF;

    SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id FOR UPDATE;
    IF v_appt.work_order_id <> v_peek_wo_id THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_DRIFT: Inconsistencia de Ordem de Servico no agendamento.';
    END IF;

    IF v_wo.is_archived THEN
        RAISE EXCEPTION 'ERR_WORK_ORDER_ARCHIVED: Nao e permitido alterar status de agendamento em OS arquivada.';
    END IF;
    IF v_appt.status_agendamento IN ('realizado', 'reagendado', 'cancelado') THEN
        RAISE EXCEPTION 'ERR_APPOINTMENT_TERMINAL: Agendamentos em estado terminal (%) nao podem transicionar.', v_appt.status_agendamento;
    END IF;
    IF v_appt.updated_at IS DISTINCT FROM p_expected_appointment_updated_at THEN
        RAISE EXCEPTION 'ERR_CONCURRENCY_CONFLICT: O agendamento foi modificado por outro usuario. Recarregue os dados.';
    END IF;

    IF v_appt.status_agendamento = 'agendado' AND p_next_status IN ('confirmado', 'em_deslocamento') THEN
        v_is_valid := true;
    ELSIF v_appt.status_agendamento = 'confirmado' AND p_next_status IN ('em_deslocamento', 'realizado') THEN
        v_is_valid := true;
    ELSIF v_appt.status_agendamento = 'em_deslocamento' AND p_next_status = 'realizado' THEN
        v_is_valid := true;
    END IF;

    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'ERR_INVALID_STATUS_TRANSITION: Transicao de % para % nao e permitida.', v_appt.status_agendamento, p_next_status;
    END IF;

    UPDATE public.appointments SET status_agendamento = p_next_status, updated_at = now() WHERE id = p_appointment_id;

    INSERT INTO public.crm_activity_log (client_id, work_order_id, entity_type, entity_id, acao, dados_anteriores, dados_novos, descricao_humana, actor_id)
    VALUES (v_appt.client_id, v_appt.work_order_id, 'appointment', p_appointment_id, 'appointment_status_changed',
            jsonb_build_object('appointment_id', p_appointment_id, 'status_anterior', v_appt.status_agendamento),
            jsonb_build_object('appointment_id', p_appointment_id, 'status_novo', p_next_status),
            format('Status do agendamento alterado para %s.', p_next_status), p_actor_id);

    SELECT * INTO v_updated_appt FROM public.appointments WHERE id = p_appointment_id;
    RETURN to_jsonb(v_updated_appt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION
    public.create_appointment_atomic(UUID, UUID, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID, TEXT),
    public.update_appointment_atomic(UUID, UUID, TIMESTAMPTZ, UUID, UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN),
    public.reschedule_appointment_atomic(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TIMESTAMPTZ),
    public.cancel_appointment_atomic(UUID, UUID, TEXT, TIMESTAMPTZ),
    public.update_appointment_status_atomic(UUID, UUID, VARCHAR, TIMESTAMPTZ),
    public.fn_prevent_appointment_hard_delete(),
    public.fn_prevent_crm_staff_hard_delete(),
    public.fn_check_crm_staff_deactivation()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.create_appointment_atomic(UUID, UUID, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID, TEXT),
    public.update_appointment_atomic(UUID, UUID, TIMESTAMPTZ, UUID, UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN),
    public.reschedule_appointment_atomic(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TIMESTAMPTZ),
    public.cancel_appointment_atomic(UUID, UUID, TEXT, TIMESTAMPTZ),
    public.update_appointment_status_atomic(UUID, UUID, VARCHAR, TIMESTAMPTZ)
TO service_role;

REVOKE ALL ON public.appointments FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.appointments TO service_role;

REVOKE ALL ON public.crm_staff FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.crm_staff TO service_role;

COMMIT;
