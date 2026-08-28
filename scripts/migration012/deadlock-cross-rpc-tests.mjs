/**
 * Testes de Deadlock, Cross-RPC e Isolamento de Concorrência
 * Arquivo: scripts/migration012/deadlock-cross-rpc-tests.mjs
 */

import { runSql, runAsyncSql, assert } from './helpers.mjs'

export async function runDeadlockAndCrossRpcTests() {
  console.log('\n[8.2] Testes de Deadlock Cross-RPC com Conexões Paralelas...')

  // 1. Cross-RPC: update_appointment_atomic (Troca Staff) vs reschedule_appointment_atomic (Novo Horário)
  const seedRes1 = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
      'visita_tecnica', '2026-11-20T09:00:00Z', '2026-11-20T10:00:00Z',
      'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Seed Cross 1'
    );
  `)
  const appt1 = JSON.parse(seedRes1.stdout)

  const crossSql1A = `
    SELECT public.update_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${appt1.id}', '${appt1.updated_at}',
      'b0000000-0000-0000-0000-000000000002', NULL, NULL, true, false, false
    );
  `
  const crossSql1B = `
    SELECT public.reschedule_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${appt1.id}',
      '2026-11-20T14:00:00Z', '2026-11-20T15:00:00Z', 'Mudança Cross 1', '${appt1.updated_at}'
    );
  `

  const [res1A, res1B] = await Promise.all([runAsyncSql(crossSql1A), runAsyncSql(crossSql1B)])
  const hasDeadlock1 = (res1A.stderr.includes('40P01') || res1B.stderr.includes('40P01'))
  assert(!hasDeadlock1, '58. Cross-RPC (update vs reschedule) não gera deadlock (40P01)')

  // 2. Cross-RPC: cancel_appointment_atomic vs update_appointment_status_atomic
  const seedRes2 = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
      'visita_tecnica', '2026-11-21T09:00:00Z', '2026-11-21T10:00:00Z',
      'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Seed Cross 2'
    );
  `)
  const appt2 = JSON.parse(seedRes2.stdout)

  const crossSql2A = `
    SELECT public.cancel_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${appt2.id}', 'Cancelamento Cross', '${appt2.updated_at}'
    );
  `
  const crossSql2B = `
    SELECT public.update_appointment_status_atomic(
      'a0000000-0000-0000-0000-000000000001', '${appt2.id}', 'confirmado', '${appt2.updated_at}'
    );
  `

  const [res2A, res2B] = await Promise.all([runAsyncSql(crossSql2A), runAsyncSql(crossSql2B)])
  const hasDeadlock2 = (res2A.stderr.includes('40P01') || res2B.stderr.includes('40P01'))
  assert(!hasDeadlock2, '59. Cross-RPC (cancel vs status) não gera deadlock (40P01)')
}
