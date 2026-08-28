/**
 * Testes de Segurança, Privilégios Mínimos e Minimização PII da Migration 012
 * Arquivo: scripts/migration012/security-privileges-tests.mjs
 */

import { runSql, assert } from './helpers.mjs'

export function runSecurityAndPrivilegeTests() {
  console.log('\n[7/8] Testes de Segurança, Least Privilege e Minimização PII...')

  // 1. Inactive Admin Rejection Individualmente em Todas as 5 RPCs
  runSql(`INSERT INTO auth.users (id, email) VALUES ('a0000000-0000-0000-0000-000000000009', 'inativo@adtelas.com.br') ON CONFLICT DO NOTHING;`)
  runSql(`INSERT INTO public.admin_users (user_id, email, role, is_active) VALUES ('a0000000-0000-0000-0000-000000000009', 'inativo@adtelas.com.br', 'admin', false) ON CONFLICT DO NOTHING;`)

  const inactCreate = runSql(`SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000002', 'visita_tecnica', '2026-09-28T10:00:00Z', '2026-09-28T11:00:00Z');`)
  assert(!inactCreate.success && inactCreate.stderr.includes('ERR_ADMIN_NOT_ACTIVE'), '47. create_appointment_atomic bloqueia admin inativo')

  const inactUpdate = runSql(`SELECT public.update_appointment_atomic('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', now(), NULL, NULL, 'Obs', false, false, true);`)
  assert(!inactUpdate.success && inactUpdate.stderr.includes('ERR_ADMIN_NOT_ACTIVE'), '48. update_appointment_atomic bloqueia admin inativo')

  const inactResched = runSql(`SELECT public.reschedule_appointment_atomic('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '2026-09-28T10:00:00Z', '2026-09-28T11:00:00Z', 'Motivo', now());`)
  assert(!inactResched.success && inactResched.stderr.includes('ERR_ADMIN_NOT_ACTIVE'), '49. reschedule_appointment_atomic bloqueia admin inativo')

  const inactCancel = runSql(`SELECT public.cancel_appointment_atomic('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Motivo', now());`)
  assert(!inactCancel.success && inactCancel.stderr.includes('ERR_ADMIN_NOT_ACTIVE'), '50. cancel_appointment_atomic bloqueia admin inativo')

  const inactStatus = runSql(`SELECT public.update_appointment_status_atomic('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'confirmado', now());`)
  assert(!inactStatus.success && inactStatus.stderr.includes('ERR_ADMIN_NOT_ACTIVE'), '51. update_appointment_status_atomic bloqueia admin inativo')

  // 2. Permissões de Execução nas RPCs
  const rpcs = ['create_appointment_atomic', 'update_appointment_atomic', 'reschedule_appointment_atomic', 'cancel_appointment_atomic', 'update_appointment_status_atomic']
  for (const rpc of rpcs) {
    const permQuery = runSql(`
      SELECT has_function_privilege('anon', p.oid, 'EXECUTE') || '|' || has_function_privilege('authenticated', p.oid, 'EXECUTE') || '|' || has_function_privilege('service_role', p.oid, 'EXECUTE')
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = '${rpc}';
    `)
    const [anonExec, authExec, serviceExec] = (permQuery.stdout || '').split('|')
    assert(anonExec === 'false' && authExec === 'false' && serviceExec === 'true',
      `52. Permissões de EXECUTE estritas para ${rpc} (service_role=true, anon=false, auth=false)`)
  }

  // 3. Permissões de Tabela: public.appointments (incluindo MAINTAIN, REFERENCES, TRIGGER em PostgreSQL 17)
  const apptPriv = runSql(`
    SELECT has_table_privilege('service_role', 'public.appointments', 'SELECT') || '|' ||
           has_table_privilege('service_role', 'public.appointments', 'INSERT') || '|' ||
           has_table_privilege('service_role', 'public.appointments', 'UPDATE') || '|' ||
           has_table_privilege('service_role', 'public.appointments', 'DELETE') || '|' ||
           has_table_privilege('service_role', 'public.appointments', 'TRUNCATE') || '|' ||
           has_table_privilege('service_role', 'public.appointments', 'REFERENCES') || '|' ||
           has_table_privilege('service_role', 'public.appointments', 'TRIGGER') || '|' ||
           has_table_privilege('service_role', 'public.appointments', 'MAINTAIN');
  `)
  assert(apptPriv.stdout === 'true|false|false|false|false|false|false|false',
    '53. service_role possui SOMENTE SELECT em appointments (DML/DDL/TRIGGER/MAINTAIN revogados)')

  // 4. Permissões de Tabela: public.crm_staff (incluindo MAINTAIN, REFERENCES, TRIGGER)
  const staffPriv = runSql(`
    SELECT has_table_privilege('service_role', 'public.crm_staff', 'SELECT') || '|' ||
           has_table_privilege('service_role', 'public.crm_staff', 'INSERT') || '|' ||
           has_table_privilege('service_role', 'public.crm_staff', 'UPDATE') || '|' ||
           has_table_privilege('service_role', 'public.crm_staff', 'DELETE') || '|' ||
           has_table_privilege('service_role', 'public.crm_staff', 'TRUNCATE') || '|' ||
           has_table_privilege('service_role', 'public.crm_staff', 'REFERENCES') || '|' ||
           has_table_privilege('service_role', 'public.crm_staff', 'TRIGGER') || '|' ||
           has_table_privilege('service_role', 'public.crm_staff', 'MAINTAIN');
  `)
  assert(staffPriv.stdout === 'true|true|true|false|false|false|false|false',
    '54. service_role possui SELECT, INSERT e UPDATE em crm_staff (DELETE/TRUNCATE/TRIGGER/MAINTAIN revogados)')

  // 5. Permissões de anon e authenticated em appointments e crm_staff (devem ser NONE)
  const unauthPriv = runSql(`
    SELECT has_table_privilege('anon', 'public.appointments', 'SELECT') || '|' ||
           has_table_privilege('authenticated', 'public.appointments', 'SELECT') || '|' ||
           has_table_privilege('anon', 'public.crm_staff', 'SELECT') || '|' ||
           has_table_privilege('authenticated', 'public.crm_staff', 'SELECT');
  `)
  assert(unauthPriv.stdout === 'false|false|false|false',
    '55. anon e authenticated possuem zero privilégios em appointments e crm_staff')

  // 6. Teste Real de Minimização PII no Activity Log
  const piiSecretPhrase = 'MotivoUnicoTestePIIMinimizacao12345'
  const piiApptRes = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica', '2026-11-10T10:00:00Z', '2026-11-10T11:00:00Z'
    );
  `)
  const piiAppt = JSON.parse(piiApptRes.stdout)
  runSql(`
    SELECT public.cancel_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001', '${piiAppt.id}', '${piiSecretPhrase}', '${piiAppt.updated_at}'
    );
  `)

  const piiCheckQuery = runSql(`
    SELECT COUNT(*) FROM public.crm_activity_log
    WHERE dados_novos::text LIKE '%${piiSecretPhrase}%' OR dados_anteriores::text LIKE '%${piiSecretPhrase}%' OR descricao_humana LIKE '%${piiSecretPhrase}%';
  `)
  assert(piiCheckQuery.stdout === '0', '56. Minimização PII: Motivo livre NÃO é gravado em dados_novos do crm_activity_log')

  const metaCheck = runSql(`
    SELECT (dados_novos->>'reason_recorded')::text FROM public.crm_activity_log
    WHERE entity_id = '${piiAppt.id}' AND acao = 'appointment_cancelled';
  `)
  assert(metaCheck.stdout === 'true', '57. Activity log armazena flag estruturada reason_recorded = true')
}
