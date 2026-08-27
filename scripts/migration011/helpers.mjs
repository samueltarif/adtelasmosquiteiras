/**
 * Módulo de Utilitários, Execução SQL e Auditoria de Ambiente
 * Arquivo: scripts/migration011/helpers.mjs
 */

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export const EXPECTED_MIGRATION_SHA256 = 'C8A7850454A93E7BBE2DE997510CCBCA9E329E3ADD3C8ACD2A920DB3C07E8B88'
export const CONTAINER_NAME = process.env.PG_CONTAINER || 'adt-postgres-test'
export const DB_USER = 'postgres'
export const TEST_DB = 'test_db_011'

export const state = {
  passed: 0,
  failed: 0,
  testResults: []
}

export function assert(condition, testName, details = '') {
  if (condition) {
    state.passed++
    state.testResults.push({ name: testName, status: 'PASS', details })
    console.log(`  [PASS] ${testName}`)
  } else {
    state.failed++
    state.testResults.push({ name: testName, status: 'FAIL', details })
    console.error(`  [FAIL] ${testName} - ${details}`)
  }
}

export function runSql(sql, options = {}) {
  const user = options.user || DB_USER
  const db = options.db || TEST_DB
  const cmd = `docker exec -i ${CONTAINER_NAME} psql -U ${user} -d ${db} -v ON_ERROR_STOP=1 -t -A`
  try {
    const stdout = execSync(cmd, { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    return { success: true, stdout: stdout.trim(), stderr: '' }
  } catch (err) {
    return { success: false, stdout: (err.stdout || '').toString().trim(), stderr: (err.stderr || '').toString().trim(), error: err.message }
  }
}

export async function runAsyncSql(sql, options = {}) {
  const user = options.user || DB_USER
  const db = options.db || TEST_DB
  return new Promise((resolve) => {
    const proc = spawn('docker', ['exec', '-i', CONTAINER_NAME, 'psql', '-U', user, '-d', db, '-v', 'ON_ERROR_STOP=1', '-t', '-A'])
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => { stderr += d.toString() })
    proc.on('close', (code) => {
      resolve({ success: code === 0, stdout: stdout.trim(), stderr: stderr.trim() })
    })
    proc.stdin.write(sql)
    proc.stdin.end()
  })
}

export function getMigrationSql() {
  const migrationPath = path.resolve('supabase/manual/011_crm_work_order_proposals.sql')
  return fs.readFileSync(migrationPath, 'utf8')
}

export function auditEnvironmentAndSecurity() {
  console.log('[1/7] Auditoria de Segurança e Conexão Local...')
  const dockerInspect = execSync(`docker inspect ${CONTAINER_NAME}`, { encoding: 'utf8' })
  const containerInfo = JSON.parse(dockerInspect)[0]
  const isRunning = containerInfo.State.Running
  const portBindings = containerInfo.HostConfig.PortBindings['5432/tcp'] || []
  
  const hostPort = portBindings[0]?.HostPort || '54329'
  const hostIp = portBindings[0]?.HostIp || '0.0.0.0'
  const bindAddresses = portBindings.map(b => `${b.HostIp || '0.0.0.0'}:${b.HostPort}`).join(', ')

  assert(isRunning, `1. Container PostgreSQL local (${CONTAINER_NAME}) está ativo e rodando`)
  assert(hostPort === '54329' || hostPort === '54330', `1b. Porta do container mapeada para ${hostPort}`)
  assert(typeof bindAddresses === 'string' && bindAddresses.length > 0, `1c. Binding de porta inspecionado: ${bindAddresses}`)

  const migrationSql = getMigrationSql()
  const computedSha = crypto.createHash('sha256').update(migrationSql).digest('hex').toUpperCase()
  assert(computedSha === EXPECTED_MIGRATION_SHA256, `2. SHA-256 físico pré-execução corresponde exatamente ao esperado (${computedSha})`)

  return {
    hostPort,
    hostIp,
    bindAddresses,
    migrationSql,
    computedSha
  }
}

export function setupCleanBaseline(migrationSql) {
  console.log('\n[2/7] Criação e Validação do Baseline 010 no Banco Isolado...')
  
  execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB};"`)
  execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres -c "CREATE DATABASE ${TEST_DB};"`)
  execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d ${TEST_DB} -c "CREATE SCHEMA IF NOT EXISTS auth;"`)
  execSync(`docker exec -i ${CONTAINER_NAME} pg_dump -U postgres --schema-only -d postgres | docker exec -i ${CONTAINER_NAME} psql -U postgres -d ${TEST_DB}`)

  const reset011Sql = `
    ALTER TABLE public.work_orders DROP CONSTRAINT IF EXISTS fk_work_orders_accepted_proposal;
    ALTER TABLE public.work_orders DROP COLUMN IF EXISTS accepted_proposal_id;
    DROP TABLE IF EXISTS public.work_order_proposals CASCADE;
    DROP FUNCTION IF EXISTS public.fn_prevent_proposal_content_mutation() CASCADE;
    DROP FUNCTION IF EXISTS public.fn_prevent_proposal_delete() CASCADE;
    DROP FUNCTION IF EXISTS public.reserve_work_order_proposal_atomic(UUID,TIMESTAMPTZ,VARCHAR,VARCHAR,JSONB,DATE,UUID);
    DROP FUNCTION IF EXISTS public.finalize_work_order_proposal_atomic(UUID,UUID,VARCHAR,VARCHAR,BIGINT,UUID);
    DROP FUNCTION IF EXISTS public.accept_work_order_proposal_atomic(UUID,UUID,TIMESTAMPTZ,UUID);
    DROP FUNCTION IF EXISTS public.mark_work_order_proposal_failed_atomic(UUID,UUID,UUID);
    ALTER TABLE public.crm_activity_log DROP CONSTRAINT IF EXISTS chk_activity_log_entity;
    ALTER TABLE public.crm_activity_log ADD CONSTRAINT chk_activity_log_entity CHECK (
      entity_type IN ('client', 'address', 'work_order', 'work_order_item', 'appointment', 'payment', 'warranty', 'media', 'note')
    );
    ALTER TABLE public.crm_activity_log DROP CONSTRAINT IF EXISTS chk_activity_log_acao;
    ALTER TABLE public.crm_activity_log ADD CONSTRAINT chk_activity_log_acao CHECK (
      acao IN (
        'client_created', 'converted_from_lead', 'client_updated', 'client_archived',
        'address_created', 'address_updated', 'address_deleted',
        'work_order_created', 'work_order_status_changed', 'work_order_completed', 'work_order_cancelled',
        'payment_received', 'payment_cancelled',
        'appointment_created', 'appointment_rescheduled', 'appointment_cancelled',
        'warranty_issued', 'warranty_triggered', 'warranty_resolved',
        'media_uploaded', 'media_removed', 'note_added'
      )
    );
    INSERT INTO public.company_profile (
      id, trade_name, legal_name, cnpj, phone_display, whatsapp_number, email_contact,
      website, cep, street, number, complement, neighborhood, city, state, document_footer_text,
      logo_source, logo_path, logo_storage_key
    ) VALUES (
      1, 'AD Telas e Redes', 'AD Telas e Redes de Proteção Ltda', '12345678000190',
      '(11) 99999-0000', '5511999990000', 'contato@adtelas.com.br', 'https://adtelas.com.br',
      '01310100', 'Av Paulista', '1000', 'Conj 10', 'Bela Vista', 'São Paulo', 'SP',
      'Orçamento comercial válido por 10 dias.', 'static', '/images/logo_adt_telas_nova.png', NULL
    ) ON CONFLICT (id) DO NOTHING;
  `
  const baselineRes = runSql(reset011Sql)
  assert(baselineRes.success, '3. Baseline 010 e Company Profile seed restaurados com assert de runtime', baselineRes.stderr)
  if (!baselineRes.success) {
    console.error('FATAL: Falha ao configurar Baseline 010. Abortando execução.')
    process.exit(1)
  }

  // Validação explícita de ausência de objetos da 011 no baseline
  const checkNo011Table = runSql("SELECT to_regclass('public.work_order_proposals')::text;")
  assert(checkNo011Table.stdout === '', '3b. Baseline validado: public.work_order_proposals NÃO existe')

  const checkNo011Col = runSql("SELECT count(*) FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'accepted_proposal_id';")
  assert(checkNo011Col.stdout === '0', '3c. Baseline validado: work_orders.accepted_proposal_id NÃO existe')

  const check010Constraints = runSql("SELECT count(*) FROM pg_constraint WHERE conname IN ('chk_activity_log_entity', 'chk_activity_log_acao', 'unq_work_orders_id_client');")
  assert(check010Constraints.stdout === '3', '3d. Baseline validado: constraints canônicas da Migration 010 presentes')
}
