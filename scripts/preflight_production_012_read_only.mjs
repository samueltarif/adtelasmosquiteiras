/**
 * Script de Pré-Voo Read-Only de Produção para Migration 012
 * Arquivo: scripts/preflight_production_012_read_only.mjs
 * 
 * EXECUTA EXCLUSIVAMENTE CONSULTAS DE LEITURA (SELECT / INTROSPECÇÃO DE METADATA)
 * ZERO ESCRITAS / ZERO MUTAÇÕES / ZERO DDL / ZERO DML
 */

import fs from 'fs'
import crypto from 'crypto'

const EXPECTED_MIGRATION_SHA256 = '43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F'

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

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`)
  }
  return res.json()
}

async function main() {
  console.log('=================================================================')
  console.log('FASE 5.0B.3 — PRODUCTION PREFLIGHT READ-ONLY (MIGRATION 012)')
  console.log('=================================================================\n')

  const env = parseEnv()
  const supabaseUrl = env.SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('FATAL: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env')
    process.exit(1)
  }

  const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  }

  // 1. Identificação do Banco de Produção
  console.log('[1/12] Identificação do Alvo de Produção...')
  console.log(`  Target Project Ref: ${projectRef}`)
  console.log(`  Target URL Host: ${new URL(supabaseUrl).host}`)
  console.log(`  Target Schema: public`)

  // 2. Validação do SHA-256 Local
  console.log('\n[2/12] Validação do SHA-256 Físico da Migration 012 Local...')
  const migrationSql = fs.readFileSync('supabase/manual/012_crm_appointments_and_staff_engine.sql', 'utf8')
  const localSha = crypto.createHash('sha256').update(fs.readFileSync('supabase/manual/012_crm_appointments_and_staff_engine.sql')).digest('hex').toUpperCase()
  const shaMatch = localSha === EXPECTED_MIGRATION_SHA256
  console.log(`  Local SHA-256:    ${localSha}`)
  console.log(`  Expected SHA-256: ${EXPECTED_MIGRATION_SHA256}`)
  console.log(`  SHA Match: ${shaMatch ? 'YES' : 'NO'}`)
  if (!shaMatch) {
    console.error('FATAL: SHA-256 local diverge do esperado! Abortando.')
    process.exit(1)
  }

  // 3. Introspecção OpenAPI
  console.log('\n[3/12] Introspecção OpenAPI e Tabelas de Produção...')
  const openapi = await fetchJson(`${supabaseUrl}/rest/v1/`, headers)
  const definitions = openapi.definitions || {}
  const availableTables = Object.keys(definitions)
  console.log(`  Total de Tabelas Expostas no Schema: ${availableTables.length}`)

  // 4. Baseline Migration 010
  console.log('\n[4/12] Validação do Baseline da Migration 010...')
  const required010Tables = [
    'crm_staff', 'clients', 'client_addresses', 'work_orders',
    'work_order_items', 'work_order_measurements', 'work_order_media',
    'work_order_payments', 'appointments', 'warranties',
    'crm_activity_log', 'crm_notes'
  ]
  const missing010Tables = required010Tables.filter(t => !availableTables.includes(t))
  console.log(`  Tabelas Migration 010 Encontradas: ${required010Tables.length - missing010Tables.length}/${required010Tables.length}`)
  const m010BaselinePass = missing010Tables.length === 0
  if (!m010BaselinePass) {
    console.error(`  FATAL: Tabelas 010 ausentes: ${missing010Tables.join(', ')}`)
  }

  // 5. Baseline Migration 011
  console.log('\n[5/12] Validação do Baseline da Migration 011...')
  const workOrderProposalsExists = availableTables.includes('work_order_proposals')
  const acceptedProposalIdExists = definitions.work_orders?.properties?.accepted_proposal_id !== undefined
  
  const rpcs011 = [
    'reserve_work_order_proposal_atomic',
    'finalize_work_order_proposal_atomic',
    'accept_work_order_proposal_atomic',
    'mark_work_order_proposal_failed_atomic'
  ]
  const openapiPaths = Object.keys(openapi.paths || {})
  const missing011Rpcs = rpcs011.filter(rpc => !openapiPaths.includes(`/rpc/${rpc}`))
  
  console.log(`  public.work_order_proposals: ${workOrderProposalsExists ? 'YES' : 'NO'}`)
  console.log(`  work_orders.accepted_proposal_id: ${acceptedProposalIdExists ? 'YES' : 'NO'}`)
  console.log(`  Migration 011 RPCs Encontradas: ${rpcs011.length - missing011Rpcs.length}/${rpcs011.length}`)
  const m011BaselinePass = workOrderProposalsExists && acceptedProposalIdExists && missing011Rpcs.length === 0

  // 6. Ausência da Migration 012 em Produção
  console.log('\n[6/12] Confirmando Ausência de Objetos da Migration 012 em Produção...')
  const rpcs012 = [
    'create_appointment_atomic',
    'update_appointment_atomic',
    'reschedule_appointment_atomic',
    'cancel_appointment_atomic',
    'update_appointment_status_atomic'
  ]
  const present012Rpcs = rpcs012.filter(rpc => openapiPaths.includes(`/rpc/${rpc}`))
  console.log(`  Migration 012 RPCs Presentes: ${present012Rpcs.length} (esperado: 0)`)
  const m012NotInstalled = present012Rpcs.length === 0

  // 7. Schema de appointments
  console.log('\n[7/12] Validação de Schema de appointments...')
  const apptProps = definitions.appointments?.properties || {}
  const expectedApptCols = [
    'id', 'work_order_id', 'client_id', 'address_id', 'staff_id',
    'tipo_agendamento', 'data_hora_inicio', 'data_hora_fim', 'status_agendamento',
    'observacoes', 'rescheduled_from_id', 'motivo_reagendamento_cancelamento',
    'created_by', 'created_at', 'updated_at'
  ]
  const missingApptCols = expectedApptCols.filter(c => apptProps[c] === undefined)
  console.log(`  Colunas de appointments Encontradas: ${expectedApptCols.length - missingApptCols.length}/${expectedApptCols.length}`)
  const apptSchemaPass = missingApptCols.length === 0

  // 8. Schema de crm_staff
  console.log('\n[8/12] Validação de Schema de crm_staff...')
  const staffProps = definitions.crm_staff?.properties || {}
  const expectedStaffCols = ['id', 'nome', 'telefone', 'email', 'funcao', 'is_active', 'created_at', 'updated_at']
  const missingStaffCols = expectedStaffCols.filter(c => staffProps[c] === undefined)
  console.log(`  Colunas de crm_staff Encontradas: ${expectedStaffCols.length - missingStaffCols.length}/${expectedStaffCols.length}`)
  const staffSchemaPass = missingStaffCols.length === 0

  // 9. Schema e Allowlist de crm_activity_log
  console.log('\n[9/12] Validação de Schema e Allowlist de crm_activity_log...')
  const actProps = definitions.crm_activity_log?.properties || {}
  const expectedActCols = [
    'client_id', 'work_order_id', 'entity_type', 'entity_id', 'acao',
    'dados_anteriores', 'dados_novos', 'descricao_humana', 'actor_id', 'occurred_at'
  ]
  const missingActCols = expectedActCols.filter(c => actProps[c] === undefined)
  console.log(`  Colunas de crm_activity_log Encontradas: ${expectedActCols.length - missingActCols.length}/${expectedActCols.length}`)
  const actSchemaPass = missingActCols.length === 0

  // 10. Auditoria de Dados Existentes em appointments (Integridade e Overlaps)
  console.log('\n[10/12] Preflight de Dados em appointments (Read-Only)...')
  const apptRows = await fetchJson(`${supabaseUrl}/rest/v1/appointments?select=*`, headers)
  console.log(`  Total de Agendamentos Existentes: ${apptRows.length}`)

  // A. Intervalos inválidos
  let invalidIntervalCount = 0
  for (const a of apptRows) {
    if (new Date(a.data_hora_inicio).getTime() >= new Date(a.data_hora_fim).getTime()) {
      invalidIntervalCount++
    }
  }
  console.log(`  INVALID_APPOINTMENT_INTERVAL_COUNT: ${invalidIntervalCount}`)

  // B. Orfandade
  const woRows = await fetchJson(`${supabaseUrl}/rest/v1/work_orders?select=id,client_id,address_id`, headers)
  const woMap = new Map(woRows.map(w => [w.id, w]))

  const staffRows = await fetchJson(`${supabaseUrl}/rest/v1/crm_staff?select=id,is_active`, headers)
  const staffSet = new Set(staffRows.map(s => s.id))

  const addrRows = await fetchJson(`${supabaseUrl}/rest/v1/client_addresses?select=id,client_id`, headers)
  const addrToClient = new Map(addrRows.map(a => [a.id, a.client_id]))

  let orphanWoCount = 0
  let orphanStaffCount = 0
  let clientMismatchCount = 0
  let addrClientMismatchCount = 0

  for (const a of apptRows) {
    if (!woMap.has(a.work_order_id)) {
      orphanWoCount++
    } else {
      const wo = woMap.get(a.work_order_id)
      if (a.client_id !== wo.client_id) {
        clientMismatchCount++
      }
    }
    if (a.staff_id && !staffSet.has(a.staff_id)) {
      orphanStaffCount++
    }
    if (a.address_id) {
      const addrClient = addrToClient.get(a.address_id)
      if (addrClient && addrClient !== a.client_id) {
        addrClientMismatchCount++
      }
    }
  }

  console.log(`  ORPHAN_WORK_ORDER_COUNT: ${orphanWoCount}`)
  console.log(`  ORPHAN_STAFF_COUNT: ${orphanStaffCount}`)
  console.log(`  APPOINTMENT_CLIENT_MISMATCH_COUNT: ${clientMismatchCount}`)
  console.log(`  APPOINTMENT_ADDRESS_CLIENT_MISMATCH_COUNT: ${addrClientMismatchCount}`)

  // C. Double booking em técnicos
  const activeStatuses = ['agendado', 'confirmado', 'em_deslocamento']
  const activeStaffAppts = apptRows.filter(a => a.staff_id && activeStatuses.includes(a.status_agendamento))
  
  let existingActiveStaffOverlapCount = 0
  for (let i = 0; i < activeStaffAppts.length; i++) {
    for (let j = i + 1; j < activeStaffAppts.length; j++) {
      const a1 = activeStaffAppts[i]
      const a2 = activeStaffAppts[j]
      if (a1.staff_id === a2.staff_id) {
        const s1 = new Date(a1.data_hora_inicio).getTime()
        const e1 = new Date(a1.data_hora_fim).getTime()
        const s2 = new Date(a2.data_hora_inicio).getTime()
        const e2 = new Date(a2.data_hora_fim).getTime()
        if (s1 < e2 && s2 < e1) {
          existingActiveStaffOverlapCount++
          console.warn(`  [OVERLAP DETECTADO] Técnico ID: ${a1.staff_id} entre Appt ${a1.id} e Appt ${a2.id}`)
        }
      }
    }
  }
  console.log(`  EXISTING_ACTIVE_STAFF_OVERLAP_COUNT: ${existingActiveStaffOverlapCount}`)

  // D. Múltiplas instalações ativas por OS
  const activeInstallations = apptRows.filter(a => a.tipo_agendamento === 'instalacao' && activeStatuses.includes(a.status_agendamento))
  const instByWo = new Map()
  for (const inst of activeInstallations) {
    instByWo.set(inst.work_order_id, (instByWo.get(inst.work_order_id) || 0) + 1)
  }
  let multipleActiveInstWoCount = 0
  for (const [woId, count] of instByWo.entries()) {
    if (count > 1) {
      multipleActiveInstWoCount++
      console.warn(`  [INSTALAÇÃO DUPLICADA] OS ID: ${woId} possui ${count} instalações ativas`)
    }
  }
  console.log(`  WORK_ORDERS_WITH_MULTIPLE_ACTIVE_INSTALLATIONS: ${multipleActiveInstWoCount}`)

  // E. Tipos e Status fora da allowlist
  const allowedTipos = ['visita_tecnica', 'medicao', 'instalacao', 'manutencao', 'garantia']
  const allowedStatuses = ['agendado', 'confirmado', 'em_deslocamento', 'realizado', 'reagendado', 'cancelado']
  const invalidTypeCount = apptRows.filter(a => !allowedTipos.includes(a.tipo_agendamento)).length
  const invalidStatusCount = apptRows.filter(a => !allowedStatuses.includes(a.status_agendamento)).length
  console.log(`  INVALID_APPOINTMENT_TYPE_COUNT: ${invalidTypeCount}`)
  console.log(`  INVALID_APPOINTMENT_STATUS_COUNT: ${invalidStatusCount}`)

  // 11. Validação de admin_users e warranties
  console.log('\n[11/12] Validação de admin_users e warranties...')
  const adminRows = await fetchJson(`${supabaseUrl}/rest/v1/admin_users?select=user_id,is_active`, headers)
  const activeAdminCount = adminRows.filter(a => a.is_active).length
  console.log(`  ACTIVE_ADMIN_COUNT: ${activeAdminCount}`)

  const warProps = definitions.warranties?.properties || {}
  const expectedWarCols = ['work_order_id', 'data_inicio', 'data_termino', 'status_operacional']
  const missingWarCols = expectedWarCols.filter(c => warProps[c] === undefined)
  console.log(`  Colunas de warranties Encontradas: ${expectedWarCols.length - missingWarCols.length}/${expectedWarCols.length}`)

  // 12. Resumo Final
  console.log('\n[12/12] Resumo Geral do Preflight Read-Only de Produção...')
  const preflightPass = shaMatch &&
                        m010BaselinePass &&
                        m011BaselinePass &&
                        m012NotInstalled &&
                        apptSchemaPass &&
                        staffSchemaPass &&
                        actSchemaPass &&
                        missingWarCols.length === 0 &&
                        invalidIntervalCount === 0 &&
                        orphanWoCount === 0 &&
                        orphanStaffCount === 0 &&
                        clientMismatchCount === 0 &&
                        addrClientMismatchCount === 0 &&
                        existingActiveStaffOverlapCount === 0 &&
                        multipleActiveInstWoCount === 0 &&
                        invalidTypeCount === 0 &&
                        invalidStatusCount === 0 &&
                        activeAdminCount >= 1

  console.log(`\nPRODUCTION_MIGRATION_012_PREFLIGHT: ${preflightPass ? 'PASS' : 'FAIL'}`)
  console.log(`MIGRATION_012_READY_FOR_CONTROLLED_INSTALLATION: ${preflightPass ? 'YES' : 'NO'}`)
}

main().catch(err => {
  console.error('ERRO FATAL NO PREFLIGHT:', err)
  process.exit(1)
})
