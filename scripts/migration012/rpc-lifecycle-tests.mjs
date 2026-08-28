/**
 * Testes do Ciclo de Vida das RPCs da Migration 012
 * Arquivo: scripts/migration012/rpc-lifecycle-tests.mjs
 */

import { runSql, assert } from './helpers.mjs'

export function runRpcLifecycleTests() {
  console.log('\n[5/8] Testes do Ciclo de Vida das 5 RPCs Atômicas...')

  // 1. Validação de Intervalos Nulos e Inválidos em create_appointment_atomic
  const resNullStart = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica', NULL, '2026-09-15T11:30:00Z'
    );
  `)
  assert(!resNullStart.success && resNullStart.stderr.includes('ERR_INVALID_APPOINTMENT_INTERVAL'),
    '17. create_appointment_atomic rejeita data_hora_inicio NULL')

  const resInverted = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica', '2026-09-15T12:00:00Z', '2026-09-15T10:00:00Z'
    );
  `)
  assert(!resInverted.success && resInverted.stderr.includes('ERR_INVALID_APPOINTMENT_INTERVAL'),
    '18. create_appointment_atomic rejeita inicio >= fim')

  // 2. Criação Válida de Visita Técnica em OS em Orçamento
  const resVisit = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica', '2026-09-15T10:00:00Z', '2026-09-15T11:30:00Z',
      'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Visita para orçamento'
    );
  `)
  assert(resVisit.success, '19. create_appointment_atomic cria visita técnica em OS em orçamento', resVisit.stderr)
  const visitAppt = JSON.parse(resVisit.stdout)

  // 3. update_appointment_atomic: Rejeição de Update Vazio
  const resEmptyUpdate = runSql(`
    SELECT public.update_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${visitAppt.id}', '${visitAppt.updated_at}',
      NULL, NULL, NULL, false, false, false
    );
  `)
  assert(!resEmptyUpdate.success && resEmptyUpdate.stderr.includes('ERR_NO_APPOINTMENT_CHANGES'),
    '20. update_appointment_atomic rejeita chamada sem alterações (ERR_NO_APPOINTMENT_CHANGES)')

  // 4. Concorrência Otimista com Token NULL em update_appointment_atomic
  const resNullToken = runSql(`
    SELECT public.update_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${visitAppt.id}', NULL,
      'b0000000-0000-0000-0000-000000000001', NULL, NULL, true, false, false
    );
  `)
  assert(!resNullToken.success && resNullToken.stderr.includes('ERR_CONCURRENCY_CONFLICT'),
    '21. update_appointment_atomic rejeita token de concorrência NULL (IS DISTINCT FROM)')

  // 5. Update Não-Temporal Válido
  const resUpdate = runSql(`
    SELECT public.update_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${visitAppt.id}', '${visitAppt.updated_at}',
      'b0000000-0000-0000-0000-000000000001', NULL, 'Obs atualizada', true, false, true
    );
  `)
  assert(resUpdate.success, '22. update_appointment_atomic altera técnico e observações', resUpdate.stderr)
  const updatedAppt = JSON.parse(resUpdate.stdout)

  // 6. reschedule_appointment_atomic com Token NULL e Validações
  const resReschedNullToken = runSql(`
    SELECT public.reschedule_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${visitAppt.id}',
      '2026-09-16T14:00:00Z', '2026-09-16T15:30:00Z', 'Cliente mudou', NULL
    );
  `)
  assert(!resReschedNullToken.success && resReschedNullToken.stderr.includes('ERR_CONCURRENCY_CONFLICT'),
    '23. reschedule_appointment_atomic rejeita token de concorrência NULL')

  const resReschedule = runSql(`
    SELECT public.reschedule_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${visitAppt.id}',
      '2026-09-16T14:00:00Z', '2026-09-16T15:30:00Z', 'Cliente solicitou mudança', '${updatedAppt.updated_at}'
    );
  `)
  assert(resReschedule.success, '24. reschedule_appointment_atomic cria novo compromisso vinculado', resReschedule.stderr)
  const newAppt = JSON.parse(resReschedule.stdout)

  // 7. update_appointment_status_atomic com Token NULL e Transições
  const resStatusNullToken = runSql(`
    SELECT public.update_appointment_status_atomic(
      'a0000000-0000-0000-0000-000000000001', '${newAppt.id}', 'confirmado', NULL
    );
  `)
  assert(!resStatusNullToken.success && resStatusNullToken.stderr.includes('ERR_CONCURRENCY_CONFLICT'),
    '25. update_appointment_status_atomic rejeita token de concorrência NULL')

  const resConfirmed = runSql(`
    SELECT public.update_appointment_status_atomic(
      'a0000000-0000-0000-0000-000000000001', '${newAppt.id}', 'confirmado', '${newAppt.updated_at}'
    );
  `)
  assert(resConfirmed.success, '26. update_appointment_status_atomic transiciona para confirmado', resConfirmed.stderr)
  const confirmedAppt = JSON.parse(resConfirmed.stdout)

  const resEnRoute = runSql(`
    SELECT public.update_appointment_status_atomic(
      'a0000000-0000-0000-0000-000000000001', '${newAppt.id}', 'em_deslocamento', '${confirmedAppt.updated_at}'
    );
  `)
  assert(resEnRoute.success, '27. update_appointment_status_atomic transiciona para em_deslocamento', resEnRoute.stderr)
  const enRouteAppt = JSON.parse(resEnRoute.stdout)

  const resRealized = runSql(`
    SELECT public.update_appointment_status_atomic(
      'a0000000-0000-0000-0000-000000000001', '${newAppt.id}', 'realizado', '${enRouteAppt.updated_at}'
    );
  `)
  assert(resRealized.success, '28. update_appointment_status_atomic transiciona para realizado', resRealized.stderr)

  // 8. cancel_appointment_atomic com Token NULL e Reversão de OS
  const resInst = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004',
      'instalacao', '2026-09-20T11:00:00Z', '2026-09-20T13:00:00Z',
      'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Instalação teste cancel'
    );
  `)
  const instAppt = JSON.parse(resInst.stdout)

  const resCancelNullToken = runSql(`
    SELECT public.cancel_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${instAppt.id}', 'Motivo cancelamento', NULL
    );
  `)
  assert(!resCancelNullToken.success && resCancelNullToken.stderr.includes('ERR_CONCURRENCY_CONFLICT'),
    '29. cancel_appointment_atomic rejeita token de concorrência NULL')

  const resCancel = runSql(`
    SELECT public.cancel_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${instAppt.id}',
      'Cliente precisou adiar sem data prevista', '${instAppt.updated_at}'
    );
  `)
  assert(resCancel.success, '30. cancel_appointment_atomic cancela compromisso ativo com motivo', resCancel.stderr)

  const checkWoAfterCancel = runSql(`
    SELECT status_os, data_prevista FROM public.work_orders WHERE id = 'e0000000-0000-0000-0000-000000000004';
  `)
  assert(checkWoAfterCancel.stdout === 'aguardando_agendamento|',
    '31. Cancelamento de instalação reverte OS para aguardando_agendamento e limpa data_prevista (NULL)')

  const checkWoActivity = runSql(`
    SELECT COUNT(*) FROM public.crm_activity_log
    WHERE work_order_id = 'e0000000-0000-0000-0000-000000000004' AND acao = 'work_order_status_changed';
  `)
  assert(Number(checkWoActivity.stdout) >= 2,
    '32. Auditoria da OS registrou work_order_status_changed tanto na criação quanto no cancelamento')
}
