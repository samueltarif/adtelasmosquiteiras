/**
 * Testes de Regras de Negócio, Timezone, Garantias e Estados Terminais
 * Arquivo: scripts/migration012/business-rules-tests.mjs
 */

import { runSql, assert } from './helpers.mjs'

export function runBusinessRulesTests() {
  console.log('\n[6/8] Testes de Timezone, Garantias, OS Arquivada e Imutabilidade...')

  // 1. Timezone: 2026-09-01T01:30:00Z -> 2026-08-31 em America/Sao_Paulo (22:30 de 31/08)
  runSql(`
    INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, valor_total, valor_desconto)
    VALUES ('e0000000-0000-0000-0000-000000000005', 'OS-2026-0005', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'aprovada', 1800.00, 0.00)
    ON CONFLICT DO NOTHING;
  `)
  const resTz = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005',
      'instalacao', '2026-09-01T01:30:00Z', '2026-09-01T03:00:00Z',
      'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Teste Fuso'
    );
  `)
  assert(resTz.success, '33. Criação de agendamento em horário UTC de virada de dia', resTz.stderr)
  const tzWo = runSql(`SELECT data_prevista FROM public.work_orders WHERE id = 'e0000000-0000-0000-0000-000000000005';`)
  assert(tzWo.stdout === '2026-08-31', '34. data_prevista convertida para 2026-08-31 em America/Sao_Paulo')

  // 2. Garantias (public.warranties) no Create e no Reschedule
  runSql(`
    INSERT INTO public.warranties (id, work_order_id, client_id, status_operacional, data_inicio, data_termino)
    VALUES ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'normal', '2026-01-01', '2026-12-31')
    ON CONFLICT DO NOTHING;
  `)
  const resWarValid = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003',
      'garantia', '2026-09-25T14:00:00Z', '2026-09-25T15:00:00Z',
      'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Garantia válida'
    );
  `)
  assert(resWarValid.success, '35. Agendamento do tipo garantia com termo ativo é aceito', resWarValid.stderr)
  const warAppt = JSON.parse(resWarValid.stdout)

  // 2a. Reagendamento de garantia para depois do término -> REJECT
  const resReschedAfter = runSql(`
    SELECT public.reschedule_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${warAppt.id}',
      '2027-02-01T14:00:00Z', '2027-02-01T15:00:00Z', 'Reagendamento expirado', '${warAppt.updated_at}'
    );
  `)
  assert(!resReschedAfter.success && resReschedAfter.stderr.includes('ERR_WARRANTY_NOT_ACTIVE'),
    '36. reschedule_appointment_atomic rejeita reagendamento de garantia após data_termino')

  // 2b. Reagendamento de garantia para antes do início -> REJECT
  const resReschedBefore = runSql(`
    SELECT public.reschedule_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${warAppt.id}',
      '2025-12-15T14:00:00Z', '2025-12-15T15:00:00Z', 'Reagendamento prematuro', '${warAppt.updated_at}'
    );
  `)
  assert(!resReschedBefore.success && resReschedBefore.stderr.includes('ERR_WARRANTY_NOT_ACTIVE'),
    '37. reschedule_appointment_atomic rejeita reagendamento de garantia antes de data_inicio')

  // 2c. Reagendamento de garantia dentro da cobertura -> PASS
  const resReschedValid = runSql(`
    SELECT public.reschedule_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${warAppt.id}',
      '2026-10-15T14:00:00Z', '2026-10-15T15:00:00Z', 'Reagendamento dentro do prazo', '${warAppt.updated_at}'
    );
  `)
  assert(resReschedValid.success, '38. reschedule_appointment_atomic aceita garantia dentro do período de cobertura')
  const newWarAppt = JSON.parse(resReschedValid.stdout)

  // 3. Cobertura Completa de OS Arquivada (is_archived = true)
  runSql(`UPDATE public.work_orders SET is_archived = true WHERE id = 'e0000000-0000-0000-0000-000000000003';`)

  const resArchCreate = runSql(`
    SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'garantia', '2026-11-01T14:00:00Z', '2026-11-01T15:00:00Z');
  `)
  assert(!resArchCreate.success && resArchCreate.stderr.includes('ERR_WORK_ORDER_ARCHIVED'), '39. create_appointment_atomic bloqueia OS arquivada')

  const resArchUpdate = runSql(`
    SELECT public.update_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${newWarAppt.id}', '${newWarAppt.updated_at}', NULL, NULL, 'Obs', false, false, true);
  `)
  assert(!resArchUpdate.success && resArchUpdate.stderr.includes('ERR_WORK_ORDER_ARCHIVED'), '40. update_appointment_atomic bloqueia OS arquivada')

  const resArchResched = runSql(`
    SELECT public.reschedule_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${newWarAppt.id}', '2026-11-02T14:00:00Z', '2026-11-02T15:00:00Z', 'Motivo', '${newWarAppt.updated_at}');
  `)
  assert(!resArchResched.success && resArchResched.stderr.includes('ERR_WORK_ORDER_ARCHIVED'), '41. reschedule_appointment_atomic bloqueia OS arquivada')

  const resArchStatus = runSql(`
    SELECT public.update_appointment_status_atomic('a0000000-0000-0000-0000-000000000001', '${newWarAppt.id}', 'confirmado', '${newWarAppt.updated_at}');
  `)
  assert(!resArchStatus.success && resArchStatus.stderr.includes('ERR_WORK_ORDER_ARCHIVED'), '42. update_appointment_status_atomic bloqueia OS arquivada')

  const resArchCancel = runSql(`
    SELECT public.cancel_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${newWarAppt.id}', 'Cancelamento de higienizacao', '${newWarAppt.updated_at}');
  `)
  assert(resArchCancel.success, '43. cancel_appointment_atomic permite cancelamento ativo em OS arquivada para liberação de agenda')
  runSql(`UPDATE public.work_orders SET is_archived = false WHERE id = 'e0000000-0000-0000-0000-000000000003';`)

  // 4. Testes Individuais de Imutabilidade em Estados Terminais
  const cancelledApptId = newWarAppt.id
  const cancelledApptUpdated = JSON.parse(resArchCancel.stdout).updated_at

  const resUpdCancelled = runSql(`
    SELECT public.update_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${cancelledApptId}', '${cancelledApptUpdated}', NULL, NULL, 'Obs', false, false, true);
  `)
  assert(!resUpdCancelled.success && resUpdCancelled.stderr.includes('ERR_APPOINTMENT_TERMINAL'),
    '44. update_appointment_atomic rejeita alteração em agendamento cancelado')

  const resUpdRescheduled = runSql(`
    SELECT public.update_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${warAppt.id}', '${JSON.parse(resReschedValid.stdout).updated_at}', NULL, NULL, 'Obs', false, false, true);
  `)
  assert(!resUpdRescheduled.success && resUpdRescheduled.stderr.includes('ERR_APPOINTMENT_TERMINAL'),
    '45. update_appointment_atomic rejeita alteração em agendamento reagendado')

  const resStatusFromCancelled = runSql(`
    SELECT public.update_appointment_status_atomic('a0000000-0000-0000-0000-000000000001', '${cancelledApptId}', 'agendado', '${cancelledApptUpdated}');
  `)
  assert(!resStatusFromCancelled.success && (resStatusFromCancelled.stderr.includes('ERR_APPOINTMENT_TERMINAL') || resStatusFromCancelled.stderr.includes('ERR_INVALID_STATUS_TRANSITION')),
    '46. update_appointment_status_atomic rejeita transição a partir de agendamento cancelado')
}
