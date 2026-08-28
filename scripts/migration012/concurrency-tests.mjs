/**
 * Testes de Concorrência Real com Duas Conexões Independentes
 * Arquivo: scripts/migration012/concurrency-tests.mjs
 */

import { runSql, runAsyncSql, assert } from './helpers.mjs'

export async function runConcurrencyTests() {
  console.log('\n[8/8] Testes de Concorrência Real com Duas Conexões Simultâneas...')

  // 1. Race Test: Dois agendamentos sobrepostos para o mesmo técnico Carlos
  const slotConflictSql1 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica',
      '2026-10-05T09:00:00Z',
      '2026-10-05T10:00:00Z',
      'b0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000001',
      'Slot Concorrente 1'
    );
  `
  const slotConflictSql2 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'medicao',
      '2026-10-05T09:30:00Z',
      '2026-10-05T10:30:00Z',
      'b0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000001',
      'Slot Concorrente 2'
    );
  `
  const [resSlot1, resSlot2] = await Promise.all([
    runAsyncSql(slotConflictSql1),
    runAsyncSql(slotConflictSql2)
  ])
  const conflictSuccesses = (resSlot1.success ? 1 : 0) + (resSlot2.success ? 1 : 0)
  assert(conflictSuccesses === 1, '50. Em concorrência real com sobreposição, exatamente 1 transação é aceita')

  // 2. Intervalos Adjacentes: 10:00-11:00 vs 11:00-12:00 -> Ambos aceitos
  const adjSql1 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica',
      '2026-10-05T10:00:00Z',
      '2026-10-05T11:00:00Z',
      'b0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000001'
    );
  `
  const adjSql2 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'medicao',
      '2026-10-05T11:00:00Z',
      '2026-10-05T12:00:00Z',
      'b0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000001'
    );
  `
  const [resAdj1, resAdj2] = await Promise.all([
    runAsyncSql(adjSql1),
    runAsyncSql(adjSql2)
  ])
  assert(resAdj1.success && resAdj2.success, '51. Intervalos adjacentes (ex: 10:00-11:00 e 11:00-12:00) são ambos aceitos')

  // 3. Técnicos Diferentes no mesmo horário -> Ambos aceitos
  const multiStaffSql1 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica',
      '2026-10-06T14:00:00Z',
      '2026-10-06T15:00:00Z',
      'b0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000001'
    );
  `
  const multiStaffSql2 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'medicao',
      '2026-10-06T14:00:00Z',
      '2026-10-06T15:00:00Z',
      'b0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000001'
    );
  `
  const [resStaff1, resStaff2] = await Promise.all([
    runAsyncSql(multiStaffSql1),
    runAsyncSql(multiStaffSql2)
  ])
  assert(resStaff1.success && resStaff2.success, '52. Técnicos diferentes no mesmo horário são ambos aceitos')

  // 4. Técnico NULL simultâneo no mesmo horário -> Ambos aceitos
  const nullStaffSql1 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica',
      '2026-10-07T14:00:00Z',
      '2026-10-07T15:00:00Z',
      NULL,
      'd0000000-0000-0000-0000-000000000001'
    );
  `
  const nullStaffSql2 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'medicao',
      '2026-10-07T14:00:00Z',
      '2026-10-07T15:00:00Z',
      NULL,
      'd0000000-0000-0000-0000-000000000001'
    );
  `
  const [resNull1, resNull2] = await Promise.all([
    runAsyncSql(nullStaffSql1),
    runAsyncSql(nullStaffSql2)
  ])
  assert(resNull1.success && resNull2.success, '53. Agendamentos sem técnico (staff_id = NULL) no mesmo horário não colidem')

  // 5. Race Test: Duas instalações simultâneas para a mesma OS (apenas 1 deve ter sucesso)
  runSql(`
    INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, valor_total, valor_desconto)
    VALUES ('e0000000-0000-0000-0000-000000000006', 'OS-2026-0006', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'aprovada', 2500.00, 0.00)
    ON CONFLICT DO NOTHING;
  `)
  const raceInstSql1 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000006',
      'instalacao',
      '2026-10-10T10:00:00Z',
      '2026-10-10T12:00:00Z',
      'b0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000001',
      'Race Instalação 1'
    );
  `
  const raceInstSql2 = `
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000006',
      'instalacao',
      '2026-10-10T14:00:00Z',
      '2026-10-10T16:00:00Z',
      'b0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000001',
      'Race Instalação 2'
    );
  `
  const [resRace1, resRace2] = await Promise.all([
    runAsyncSql(raceInstSql1),
    runAsyncSql(raceInstSql2)
  ])
  const raceSuccesses = (resRace1.success ? 1 : 0) + (resRace2.success ? 1 : 0)
  assert(raceSuccesses === 1, '54. Em concorrência real de criação de instalação para a mesma OS, exatamente 1 é aceita')
}
