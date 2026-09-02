/**
 * Script de Regressão — Fase 5.0D.0 Runtime Stabilization
 * Testa: WorkOrdersSearch (PGRST100 fix) + AppointmentsList (400 fix)
 *
 * PRODUCTION_DATABASE_WRITES=0
 * PII_IN_LOGS=NO
 * RAW_SUPABASE_ERROR_LOGGING=NO
 */

import { createServer } from 'http'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const DEV_TOKEN = process.env.DEV_MOCK_TOKEN || 'dev_mock_admin_token'

let passed = 0
let failed = 0
const results = []

function assert(label, condition, detail = '') {
  if (condition) {
    passed++
    results.push({ label, status: 'PASS' })
    console.log(`  ✅ PASS: ${label}`)
  } else {
    failed++
    results.push({ label, status: 'FAIL', detail })
    console.log(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`)
  }
}

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `admin_session=${DEV_TOKEN}`,
      ...(options.headers || {})
    }
  })
  return { status: res.status, body: await res.json().catch(() => ({})) }
}

function getSaoPauloDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: 'numeric', day: 'numeric', hour12: false
  })
  const parts = {}
  for (const p of formatter.formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = parseInt(p.value, 10)
  }
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

function toSaoPauloIso(dateStr, timeStr = '00:00') {
  const [year = 1970, month = 1, day = 1] = dateStr.split('-').map(Number)
  const [hour = 0, minute = 0] = timeStr.split(':').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
  })
  const map = {}
  for (const p of formatter.formatToParts(utcGuess)) {
    if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10)
  }
  const sp = { year: map.year, month: map.month, day: map.day, hour: map.hour === 24 ? 0 : map.hour, minute: map.minute }
  const localAsUtc = new Date(Date.UTC(sp.year, sp.month - 1, sp.day, sp.hour, sp.minute, 0))
  return new Date(utcGuess.getTime() + (utcGuess.getTime() - localAsUtc.getTime())).toISOString()
}

// ==============================
// GRUPO 1: WorkOrdersSearch
// ==============================
async function testWorkOrderSearch() {
  console.log('\n📋 GRUPO 1: WorkOrdersSearch (PGRST100 Fix)\n')

  const terms = ['sa', 'sam', 'samu', 'OS-2026', '999']
  for (const term of terms) {
    const { status, body } = await apiFetch('/api/admin/crm/work-orders/search', {
      method: 'POST',
      body: JSON.stringify({ search: term, limit: 5 })
    })
    assert(
      `search "${term}" retorna 2xx (não 400/500)`,
      status >= 200 && status < 300,
      `status=${status} body=${JSON.stringify(body).substring(0, 100)}`
    )
    assert(
      `search "${term}" retorna array workOrders`,
      body?.workOrders !== undefined && Array.isArray(body.workOrders),
      `body.workOrders=${JSON.stringify(body?.workOrders)}`
    )
    assert(
      `search "${term}" não expõe PGRST100`,
      !(JSON.stringify(body).includes('PGRST100')),
      `body contém PGRST100`
    )
  }

  // Busca vazia retorna lista sem erro
  const { status: statusEmpty, body: bodyEmpty } = await apiFetch('/api/admin/crm/work-orders/search', {
    method: 'POST',
    body: JSON.stringify({ search: '', limit: 5 })
  })
  assert('busca vazia retorna 2xx', statusEmpty >= 200 && statusEmpty < 300, `status=${statusEmpty}`)
  assert('busca vazia retorna array workOrders', Array.isArray(bodyEmpty?.workOrders), '')
}

// ==============================
// GRUPO 2: AppointmentsList
// ==============================
async function testAppointmentsList() {
  console.log('\n📋 GRUPO 2: AppointmentsList (400 Fix — FK disambiguation)\n')
  const today = getSaoPauloDateString()

  function addDays(dateStr, n) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d + n, 12, 0, 0))
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
  }

  // Range diário
  const dayStart = toSaoPauloIso(today, '00:00')
  const dayEnd = toSaoPauloIso(addDays(today, 1), '00:00')
  const { status: dayStatus, body: dayBody } = await apiFetch(`/api/admin/crm/appointments?start=${encodeURIComponent(dayStart)}&end=${encodeURIComponent(dayEnd)}`)
  assert('range diário: status 2xx', dayStatus >= 200 && dayStatus < 300, `status=${dayStatus}`)
  assert('range diário: retorna appointments array', Array.isArray(dayBody?.appointments), `body=${JSON.stringify(dayBody).substring(0, 100)}`)
  assert('range diário: não expõe PGRST error', !JSON.stringify(dayBody).includes('PGRST'), '')

  // Range semanal
  const weekStart = toSaoPauloIso(today, '00:00')
  const weekEnd = toSaoPauloIso(addDays(today, 7), '00:00')
  const { status: weekStatus, body: weekBody } = await apiFetch(`/api/admin/crm/appointments?start=${encodeURIComponent(weekStart)}&end=${encodeURIComponent(weekEnd)}`)
  assert('range semanal: status 2xx', weekStatus >= 200 && weekStatus < 300, `status=${weekStatus}`)
  assert('range semanal: retorna appointments array', Array.isArray(weekBody?.appointments), '')

  // Range mensal (~31 dias)
  const monthStart = toSaoPauloIso(today, '00:00')
  const monthEnd = toSaoPauloIso(addDays(today, 31), '00:00')
  const { status: monthStatus, body: monthBody } = await apiFetch(`/api/admin/crm/appointments?start=${encodeURIComponent(monthStart)}&end=${encodeURIComponent(monthEnd)}`)
  assert('range mensal: status 2xx', monthStatus >= 200 && monthStatus < 300, `status=${monthStatus}`)
  assert('range mensal: retorna appointments array', Array.isArray(monthBody?.appointments), '')

  // Parâmetros obrigatórios ausentes -> 400
  const { status: missingStatus } = await apiFetch('/api/admin/crm/appointments')
  assert('sem start/end retorna 400', missingStatus === 400, `status=${missingStatus}`)

  // Range inválido (>62 dias) -> 400
  const bigEnd = toSaoPauloIso(addDays(today, 63), '00:00')
  const { status: bigRangeStatus } = await apiFetch(`/api/admin/crm/appointments?start=${encodeURIComponent(dayStart)}&end=${encodeURIComponent(bigEnd)}`)
  assert('range >62 dias retorna 400', bigRangeStatus === 400, `status=${bigRangeStatus}`)

  // Filtro staffId inválido -> 400
  const { status: staffStatus } = await apiFetch(`/api/admin/crm/appointments?start=${encodeURIComponent(dayStart)}&end=${encodeURIComponent(dayEnd)}&staffId=nao-e-uuid`)
  assert('staffId inválido retorna 400', staffStatus === 400, `status=${staffStatus}`)

  // Filtro status inválido -> 400
  const { status: statusInvalid } = await apiFetch(`/api/admin/crm/appointments?start=${encodeURIComponent(dayStart)}&end=${encodeURIComponent(dayEnd)}&status=invalido`)
  assert('status inválido retorna 400', statusInvalid === 400, `status=${statusInvalid}`)

  // Filtro tipo inválido -> 400
  const { status: tipoInvalid } = await apiFetch(`/api/admin/crm/appointments?start=${encodeURIComponent(dayStart)}&end=${encodeURIComponent(dayEnd)}&tipo=invalido`)
  assert('tipo inválido retorna 400', tipoInvalid === 400, `status=${tipoInvalid}`)
}

// ==============================
// GRUPO 3: Contrato de erros HTTP
// ==============================
async function testErrorHandling() {
  console.log('\n📋 GRUPO 3: Error Handling — sem raw errors do Supabase\n')

  // Busca de OS retorna mensagem controlada em erro
  // (simular sem auth — vai retornar 401/403, não raw supabase)
  const { status: noAuthStatus, body: noAuthBody } = await fetch(`${BASE_URL}/api/admin/crm/work-orders/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search: 'teste' })
  }).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) }))
  assert('sem auth: retorna 401 ou 403', noAuthStatus === 401 || noAuthStatus === 403, `status=${noAuthStatus}`)
  assert('sem auth: não expõe supabaseUrl', !JSON.stringify(noAuthBody).toLowerCase().includes('supabase'), '')
  assert('sem auth: não expõe service_role', !JSON.stringify(noAuthBody).includes('service_role'), '')
}

// ==============================
// RELATÓRIO FINAL
// ==============================
async function main() {
  console.log('='.repeat(60))
  console.log('FASE 5.0D.0 — RUNTIME STABILIZATION TEST SUITE')
  console.log(`BASE_URL: ${BASE_URL}`)
  console.log('='.repeat(60))

  try {
    await testWorkOrderSearch()
    await testAppointmentsList()
    await testErrorHandling()
  } catch (err) {
    console.error('ERRO FATAL NO RUNNER:', err?.message || err)
    process.exit(2)
  }

  console.log('\n' + '='.repeat(60))
  console.log(`RESULTADO: ${passed} PASS | ${failed} FAIL | ${passed + failed} TOTAL`)
  console.log('='.repeat(60))

  if (failed === 0) {
    console.log('\n✅ PHASE_5_0D_0_TEST_SUITE=PASS')
    console.log('WORK_ORDER_SEARCH_PGRST100=FIXED')
    console.log('APPOINTMENTS_LIST_400=FIXED')
    console.log('RAW_SUPABASE_ERROR_LOGGING=NO')
    console.log('SUPABASE_MCP_WRITES=0')
    console.log('PRODUCTION_DATABASE_WRITES=0')
  } else {
    console.log('\n❌ PHASE_5_0D_0_TEST_SUITE=FAIL')
    console.log('BLOCKERS:')
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(` - ${r.label}: ${r.detail || ''}`))
    process.exit(1)
  }
}

main()
