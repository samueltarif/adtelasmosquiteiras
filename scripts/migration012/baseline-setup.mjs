/**
 * Preparação de Baseline e Testes de Preflight Fail-Fast da Migration 012
 * Arquivo: scripts/migration012/baseline-setup.mjs
 */

import { runSql, assert, TEST_DB } from './helpers.mjs'
import fs from 'fs'
import path from 'path'

export function setupCleanOfficialBaseline() {
  console.log('\n[2/8] Preparando Baseline Oficial (Schema Full + Migrations 001 a 011)...')
  runSql(`DROP DATABASE IF EXISTS ${TEST_DB};`, 'postgres')
  runSql(`CREATE DATABASE ${TEST_DB};`, 'postgres')

  runSql(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS extensions;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$ SELECT 'a0000000-0000-0000-0000-000000000001'::UUID; $$ LANGUAGE sql STABLE;
    CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS $$ SELECT '{"role": "authenticated"}'::JSONB; $$ LANGUAGE sql STABLE;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$ SELECT 'authenticated'::TEXT; $$ LANGUAGE sql STABLE;
  `)

  // Aplicar Schema Base Full
  const schemaFullPath = path.resolve('supabase/export/schema_full.sql')
  const schemaFullSql = fs.readFileSync(schemaFullPath, 'utf8')
  runSql(schemaFullSql)

  const baselineMigrations = [
    '001_v2_analytics_and_callbacks.sql', '002_fix_admin_rls.sql',
    '003_phase_b_identity_attribution_idempotency.sql', '004_cta_service_tracking.sql',
    '005_reset_admin_analytics_data.sql', '006_lead_email_delivery_state.sql',
    '007_lead_media_storage.sql', '008_admin_auth.sql',
    '009_service_media_storage.sql', '010_crm_core_tables.sql',
    '011_crm_work_order_proposals.sql'
  ]

  for (const m of baselineMigrations) {
    const mPath = path.resolve('supabase/manual', m)
    const mSql = fs.readFileSync(mPath, 'utf8')
    runSql(mSql)
  }

  // Seed fixture admin user com email obrigatório
  runSql(`
    INSERT INTO auth.users (id, email) VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@adtelas.com.br') ON CONFLICT DO NOTHING;
    INSERT INTO public.admin_users (user_id, email, role, is_active) VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@adtelas.com.br', 'admin', true) ON CONFLICT DO NOTHING;
  `)

  const check010 = runSql(`SELECT to_regclass('public.appointments') IS NOT NULL;`)
  assert(check010.stdout === 't', '3. Migration 010 executada com sucesso no baseline')

  const check011 = runSql(`
    SELECT to_regclass('public.work_order_proposals') IS NOT NULL AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'accepted_proposal_id');
  `)
  assert(check011.stdout === 't', '4. Migration 011 executada com sucesso no baseline')
  assert(check011.stdout === 't', '5. Baseline pós-011 verificado com work_order_proposals e accepted_proposal_id')
}

export function runPreflightAndRollbackTests(migrationSql) {
  console.log('\n[3/8] Testes de Preflight Fail-Fast, Dependências e Rollback Global...')

  // A. Teste de Preflight: Extensão btree_gist ausente
  runSql(`DROP EXTENSION IF EXISTS btree_gist CASCADE;`)
  const checkExtAbsent = runSql(`SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist');`)
  assert(checkExtAbsent.stdout === 'f', '5a. btree_gist ausente verificado no baseline (BTREE_GIST_ABSENT_TEST = PASS)')

  // B. Teste de Aborto com Rollback Global
  const corruptMigrationSql = migrationSql.replace('COMMIT;', 'SELECT 1/0; COMMIT;')
  const resCorrupt = runSql(corruptMigrationSql)
  assert(!resCorrupt.success, '6. Migration 012 com erro forçado aborta e executa rollback')

  const checkObjectsAfterRollback = runSql(`
    SELECT (to_regproc('public.create_appointment_atomic') IS NOT NULL) OR
           (to_regproc('public.fn_prevent_appointment_hard_delete') IS NOT NULL) OR
           EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_appointments_staff_active_period') OR
           EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'unq_active_installation_per_wo');
  `)
  assert(checkObjectsAfterRollback.stdout === 'f', '7. Zero objetos da 012 permanecem após rollback')

  // C. Teste de Preflight Negativo: Constraint com mesmo nome mas definição errada
  runSql(`ALTER TABLE public.appointments DROP CONSTRAINT chk_appointments_tipo;`)
  runSql(`ALTER TABLE public.appointments ADD CONSTRAINT chk_appointments_tipo CHECK (tipo_agendamento IN ('visita_tecnica', 'medicao'));`)
  const resBadCheck = runSql(migrationSql)
  assert(!resBadCheck.success && resBadCheck.stderr.includes('PREFLIGHT_FAILED') && resBadCheck.stderr.includes('chk_appointments_tipo'),
    '7a. Preflight rejeita constraint com mesmo nome mas definição semântica divergente (chk_appointments_tipo)')
  runSql(`ALTER TABLE public.appointments DROP CONSTRAINT chk_appointments_tipo;`)
  runSql(`ALTER TABLE public.appointments ADD CONSTRAINT chk_appointments_tipo CHECK (tipo_agendamento IN ('visita_tecnica', 'medicao', 'instalacao', 'manutencao', 'garantia'));`)

  // D. Teste de Preflight Negativo: crm_activity_log schema drift (coluna nullable alterada)
  runSql(`ALTER TABLE public.crm_activity_log ALTER COLUMN descricao_humana DROP NOT NULL;`)
  const resBadSchema = runSql(migrationSql)
  assert(!resBadSchema.success && resBadSchema.stderr.includes('PREFLIGHT_FAILED') && resBadSchema.stderr.includes('descricao_humana'),
    '7b. Preflight rejeita schema drift em crm_activity_log (descricao_humana nullable)')
  runSql(`ALTER TABLE public.crm_activity_log ALTER COLUMN descricao_humana SET NOT NULL;`)

  // E. Teste de Preflight: btree_gist pré-instalada -> preserva e prossegue
  runSql(`CREATE EXTENSION IF NOT EXISTS btree_gist;`)
  const checkExtPresent = runSql(`SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist');`)
  assert(checkExtPresent.stdout === 't', '7c. btree_gist pré-instalada verificada no baseline (BTREE_GIST_PREEXISTING_TEST = PASS)')

  // F. Aplicação da Migration 012 Candidata Real
  const tStart = Date.now()
  const resReal = runSql(migrationSql)
  const durationMs = Date.now() - tStart
  assert(resReal.success, `8. Migration 012 candidata aplicada com sucesso (${durationMs}ms)`, resReal.stderr)

  // G. Teste de Reaplicação (Drift Preflight)
  const resReapply = runSql(migrationSql)
  assert(!resReapply.success && resReapply.stderr.includes('PREFLIGHT_FAILED'),
    '9. Reaplicação direta da Migration 012 é rejeitada pelo preflight de drift')

  return durationMs
}
