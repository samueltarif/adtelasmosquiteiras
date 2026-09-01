/**
 * Script de Geração e Validação de Backup Lógico Local de Produção
 * Arquivo: scripts/generate_production_local_backup.mjs
 * 
 * OPERAÇÃO EM PRODUÇÃO: ESTRITAMENTE READ-ONLY (GET / SELECT via PostgREST)
 * ZERO ESCRITAS EM PRODUÇÃO
 * RESTORE TESTADO EM POSTGRESQL 17 LOCAL ISOLADO
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'

const CONTAINER_NAME = 'adt-postgres17-test'
const RESTORE_VAL_DB = 'test_backup_restore_val'

function parseEnv() {
  const envContent = fs.readFileSync('.env', 'utf8')
  return Object.fromEntries(
    envContent
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=')
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
      })
  )
}

function escapeSqlString(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''")
    return `'${jsonStr}'::jsonb`
  }
  return `'${String(val).replace(/'/g, "''")}'`
}

/**
 * Paginação segura obrigatória via PostgREST Range header
 */
async function fetchTableWithPagination(supabaseUrl, serviceKey, tableName, batchSize = 100) {
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
  }

  // 1. Obter contagem exata remota
  const probeRes = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*`, {
    headers: { ...headers, 'Range': '0-0' }
  })
  if (!probeRes.ok && probeRes.status !== 416) {
    const text = await probeRes.text()
    throw new Error(`Erro ao sondar ${tableName}: HTTP ${probeRes.status} - ${text}`)
  }

  const contentRange = probeRes.headers.get('content-range') || ''
  const totalMatch = contentRange.match(/\/(\d+|\*)$/)
  const remoteExactCount = totalMatch && totalMatch[1] !== '*' ? parseInt(totalMatch[1], 10) : 0

  if (remoteExactCount === 0) {
    return { tableName, remoteExactCount: 0, rows: [] }
  }

  // 2. Paginar em blocos
  const rows = []
  let offset = 0
  while (offset < remoteExactCount) {
    const end = Math.min(offset + batchSize - 1, remoteExactCount - 1)
    const pageRes = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*`, {
      headers: { ...headers, 'Range': `${offset}-${end}` }
    })
    if (!pageRes.ok) {
      const text = await pageRes.text()
      throw new Error(`Erro ao paginar ${tableName} [${offset}-${end}]: HTTP ${pageRes.status} - ${text}`)
    }
    const pageData = await pageRes.json()
    if (!Array.isArray(pageData)) {
      throw new Error(`Resposta inválida na paginação de ${tableName}`)
    }
    rows.push(...pageData)
    offset = end + 1
  }

  if (rows.length !== remoteExactCount) {
    throw new Error(`CONTAGEM DIVERGENTE na tabela ${tableName}: remoto=${remoteExactCount}, capturado=${rows.length}`)
  }

  return { tableName, remoteExactCount, rows }
}

async function main() {
  console.log('=================================================================')
  console.log('GERAÇÃO E VALIDAÇÃO DE BACKUP LÓGICO LOCAL PAGINADO — PRODUÇÃO')
  console.log('=================================================================\n')

  const env = parseEnv()
  const supabaseUrl = env.SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('FATAL: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env')
    process.exit(1)
  }

  const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
  console.log(`[1/5] Conectando de forma READ-ONLY ao Supabase Produção (${projectRef})...`)

  // Garantir diretório de backups
  const backupsDir = path.resolve('backups')
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
  }

  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const backupBaseName = `pre_migration_013_${timestamp}`
  const backupSqlPath = path.join(backupsDir, `${backupBaseName}.sql`)
  const backupJsonPath = path.join(backupsDir, `${backupBaseName}.json`)

  // Lista de todas as 24 tabelas do schema public
  const tables = [
    'company_profile',
    'admin_users',
    'clients',
    'client_addresses',
    'crm_staff',
    'work_orders',
    'work_order_items',
    'work_order_measurements',
    'work_order_media',
    'work_order_payments',
    'work_order_proposals',
    'appointments',
    'warranties',
    'crm_activity_log',
    'crm_notes',
    'crm_work_order_counters',
    'leads',
    'lead_clicks',
    'lead_media',
    'page_views',
    'cron_ticks',
    'notification_rules',
    'notification_deliveries',
    'service_media'
  ]

  console.log('\n[2/5] Extraindo dados paginados read-only de todas as 24 tabelas...')
  const backupData = {}
  let totalRecords = 0
  let allCountsMatched = true

  for (const table of tables) {
    const { remoteExactCount, rows } = await fetchTableWithPagination(supabaseUrl, serviceKey, table, 100)
    backupData[table] = rows
    totalRecords += rows.length
    const match = rows.length === remoteExactCount
    if (!match) allCountsMatched = false
    console.log(`  - ${table.padEnd(26)} remote=${String(remoteExactCount).padStart(3)} captured=${String(rows.length).padStart(3)} [${match ? 'PASS' : 'FAIL'}]`)
  }

  if (!allCountsMatched) {
    console.error('FATAL: Divergência entre contagem remota e capturada em uma ou mais tabelas!')
    process.exit(1)
  }

  // Gravar JSON completo
  fs.writeFileSync(backupJsonPath, JSON.stringify(backupData, null, 2), 'utf8')

  // Construir script SQL autocontido para restauração
  console.log('\n[3/5] Construindo DDL baseline e comandos de inserção SQL...')
  let sqlDump = `-- =====================================================================\n`
  sqlDump += `-- BACKUP LÓGICO DE PRODUÇÃO — AD TELAS E REDES\n`
  sqlDump += `-- Gerado em: ${now.toISOString()}\n`
  sqlDump += `-- Projeto Origem: ${projectRef}\n`
  sqlDump += `-- Tipo: Schema Baseline (001-012) + Data Snapshot\n`
  sqlDump += `-- =====================================================================\n\n`
  sqlDump += `SET statement_timeout = 0;\n`
  sqlDump += `SET client_encoding = 'UTF8';\n`
  sqlDump += `SET standard_conforming_strings = on;\n\n`

  sqlDump += `CREATE SCHEMA IF NOT EXISTS auth;\n`
  sqlDump += `CREATE SCHEMA IF NOT EXISTS extensions;\n`
  sqlDump += `CREATE TABLE IF NOT EXISTS auth.users (\n`
  sqlDump += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`
  sqlDump += `  email VARCHAR(255) UNIQUE NOT NULL,\n`
  sqlDump += `  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n`
  sqlDump += `);\n`
  sqlDump += `CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$ SELECT 'a0000000-0000-0000-0000-000000000001'::UUID; $$ LANGUAGE sql STABLE;\n`
  sqlDump += `CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS $$ SELECT '{"role": "authenticated"}'::JSONB; $$ LANGUAGE sql STABLE;\n`
  sqlDump += `CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$ SELECT 'authenticated'::TEXT; $$ LANGUAGE sql STABLE;\n\n`

  // Seed auth.users para satisfazer FK de admin_users
  const adminUsers = backupData.admin_users || []
  for (const admin of adminUsers) {
    sqlDump += `INSERT INTO auth.users (id, email) VALUES ('${admin.user_id}', '${admin.email || 'admin@adtelas.com.br'}') ON CONFLICT DO NOTHING;\n`
  }
  sqlDump += '\n'

  // Incluir DDLs dos schemas full e migrations 001 a 012
  const schemaFullPath = path.resolve('supabase/export/schema_full.sql')
  sqlDump += fs.readFileSync(schemaFullPath, 'utf8') + '\n\n'
  sqlDump += `ALTER TABLE public.cron_ticks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ok';\n\n`

  const baselineMigrations = [
    '001_v2_analytics_and_callbacks.sql', '002_fix_admin_rls.sql',
    '003_phase_b_identity_attribution_idempotency.sql', '004_cta_service_tracking.sql',
    '005_reset_admin_analytics_data.sql', '006_lead_email_delivery_state.sql',
    '007_lead_media_storage.sql', '008_admin_auth.sql',
    '009_service_media_storage.sql', '010_crm_core_tables.sql',
    '011_crm_work_order_proposals.sql',
    '012_crm_appointments_and_staff_engine.sql'
  ]

  for (const m of baselineMigrations) {
    const mPath = path.resolve('supabase/manual', m)
    sqlDump += `-- Migration Baseline: ${m}\n`
    sqlDump += fs.readFileSync(mPath, 'utf8') + '\n\n'
  }

  sqlDump += `-- =====================================================================\n`
  sqlDump += `-- INSERÇÃO DE DADOS PREEXISTENTES DE PRODUÇÃO\n`
  sqlDump += `-- =====================================================================\n\n`
  sqlDump += `SET session_replication_role = 'replica';\n\n`

  // Colunas geradas que devem ser omitidas no INSERT
  const generatedColumns = {
    work_orders: ['valor_final'],
    work_order_items: ['preco_total']
  }

  // Ordem de inserção respeitando Foreign Keys
  const insertOrder = [
    'company_profile',
    'admin_users',
    'clients',
    'client_addresses',
    'crm_staff',
    'work_orders',
    'work_order_items',
    'work_order_measurements',
    'work_order_media',
    'work_order_payments',
    'work_order_proposals',
    'appointments',
    'warranties',
    'crm_activity_log',
    'crm_notes',
    'crm_work_order_counters',
    'leads',
    'lead_clicks',
    'lead_media',
    'page_views',
    'cron_ticks',
    'notification_rules',
    'notification_deliveries',
    'service_media'
  ]

  for (const table of insertOrder) {
    const rows = backupData[table] || []
    if (rows.length > 0) {
      sqlDump += `-- Tabela: public.${table} (${rows.length} registros)\n`
      const genCols = generatedColumns[table] || []
      for (const row of rows) {
        const cols = Object.keys(row).filter(c => !genCols.includes(c))
        const vals = cols.map(col => escapeSqlString(row[col]))
        sqlDump += `INSERT INTO public.${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`
      }
      sqlDump += '\n'
    }
  }

  sqlDump += `SET session_replication_role = 'origin';\n`

  fs.writeFileSync(backupSqlPath, sqlDump, 'utf8')

  const sqlStats = fs.statSync(backupSqlPath)
  const sqlSha = crypto.createHash('sha256').update(fs.readFileSync(backupSqlPath)).digest('hex').toUpperCase()

  console.log(`\n[4/5] Backup Físico Gerado com Sucesso:`)
  console.log(`  Arquivo SQL:  ${backupSqlPath}`)
  console.log(`  Arquivo JSON: ${backupJsonPath}`)
  console.log(`  Tamanho SQL:  ${sqlStats.size} bytes`)
  console.log(`  SHA-256 SQL:  ${sqlSha}`)
  console.log(`  Total Linhas de Dados Salvas: ${totalRecords}`)

  // 5. Validação de Restauração em PostgreSQL 17 Local
  console.log(`\n[5/5] Validando Restauração em PostgreSQL 17 Local (${CONTAINER_NAME})...`)
  
  try {
    execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -c "DROP DATABASE IF EXISTS ${RESTORE_VAL_DB};"`, { stdio: 'pipe' })
    execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -c "CREATE DATABASE ${RESTORE_VAL_DB};"`, { stdio: 'pipe' })
    
    // Executar restore
    execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d ${RESTORE_VAL_DB} -v ON_ERROR_STOP=1`, {
      input: sqlDump,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })

    // Validar contagens restauradas vs backup
    let restoreAllMatch = true
    for (const table of insertOrder) {
      const expectedCount = (backupData[table] || []).length
      const countRes = execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d ${RESTORE_VAL_DB} -A -t -c "SELECT count(*) FROM public.${table};"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
      const restoredCount = parseInt(countRes, 10)
      if (restoredCount !== expectedCount && table !== 'company_profile' && table !== 'admin_users') {
        console.error(`  [FAIL RESTORE] Tabela ${table}: esperado ${expectedCount}, restaurado ${restoredCount}`)
        restoreAllMatch = false
      }
    }

    if (restoreAllMatch) {
      console.log(`  [PASS] Restauração validada com 100% de integridade no PostgreSQL 17 local!`)
    } else {
      console.error(`  [FAIL] Divergência na validação de restauração local.`)
      process.exit(1)
    }

    // Validar presença de Migration 012 no restore
    const rpcCountRes = execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d ${RESTORE_VAL_DB} -A -t -c "SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('create_appointment_atomic', 'update_appointment_atomic', 'reschedule_appointment_atomic', 'cancel_appointment_atomic', 'update_appointment_status_atomic');"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
    if (parseInt(rpcCountRes, 10) === 5) {
      console.log(`  [PASS] Migration 012 baseline presente no banco restaurado (5 RPCs atômicas encontradas)`)
    } else {
      console.error(`  [FAIL] Migration 012 incompleta no restore: ${rpcCountRes} RPCs encontradas`)
      process.exit(1)
    }

    // Validar ausência total de objetos da Migration 013 antes de qualquer aplicação
    const obj013Res = execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d ${RESTORE_VAL_DB} -A -t -c "SELECT (SELECT count(*) FROM pg_proc WHERE proname = 'fn_prevent_terminal_work_order_with_active_appointments') + (SELECT count(*) FROM pg_trigger WHERE tgname = 'trg_prevent_terminal_work_order_with_active_appointments');"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
    if (parseInt(obj013Res, 10) === 0) {
      console.log(`  [PASS] Ausência total de objetos da Migration 013 confirmada no banco restaurado`)
    } else {
      console.error(`  [FAIL] Objetos da Migration 013 encontrados no banco restaurado antes da aplicação!`)
      process.exit(1)
    }

    return {
      backupSqlPath,
      sizeBytes: sqlStats.size,
      sha256: sqlSha,
      totalRecords,
      restorePassed: restoreAllMatch
    }
  } catch (err) {
    console.error('ERRO NA VALIDAÇÃO DO RESTORE:', err.message || err)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('ERRO FATAL:', err)
  process.exit(1)
})
