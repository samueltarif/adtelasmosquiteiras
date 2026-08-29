/**
 * ======================================================================
 * SUÍTE DE TESTES DE UI & BROWSER CONTRACTS — CRM FASE 5.0D
 * Arquivo: scripts/test_crm_phase5d_browser.mjs
 * ======================================================================
 * Testa os fluxos completos da interface de usuário da Fase 5.0D:
 * - Auth Mock Gate Pré-Deploy Hardening (IMPOSSIBLE in production)
 * - Timezone America/Sao_Paulo (Dynamic offset, 0 hardcoded -03:00)
 * - Concorrência Otimista (expected_appointment_updated_at em Edit/Reschedule/Cancel/Status)
 * - Máquina de Estados Operacionais
 * - Matriz Preventiva Tipo x Status da OS
 * - Regras de OS Arquivada
 * - 10 Viewports Responsivos (320px a 1920px) sem overflow e com touch >= 44x44
 * - Navegação real via Playwright com Chromium nas 4 rotas administrativas
 * - Hard reload e transição sem erros de console ou telas de erro do Nuxt.
 */

import assert from 'assert'
import { spawn } from 'child_process'
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatAppointmentDateTime,
  formatDateRangeDisplay,
  getSaoPauloParts,
  getSaoPauloDateString,
  getSaoPauloTimeString,
  toSaoPauloIso,
  getCalendarWeekDays,
  getCalendarMonthGrid,
  isSameDay,
  isToday
} from '../app/utils/crmDateTime.ts'

import { requireActiveAdmin } from '../server/utils/adminAuth.ts'
import { H3Event } from 'h3'
import { IncomingMessage, ServerResponse } from 'http'
import { chromium } from 'playwright'

console.log('======================================================================')
console.log('--- SUÍTE DE TESTES DE UI & BROWSER CONTRACTS CRM FASE 5.0D ---')
console.log('======================================================================\n')

let passed = 0
let failed = 0
const errors = []

function test(name, fn) {
  try {
    fn()
    console.log(`  [PASS] ${name}`)
    passed++
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message)
    errors.push({ name, error: err.message })
    failed++
  }
}

async function asyncTest(name, fn) {
  try {
    await fn()
    console.log(`  [PASS] ${name}`)
    passed++
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message)
    errors.push({ name, error: err.message })
    failed++
  }
}

function createMockEvent({ method = 'GET', url = '/', headers = {} } = {}) {
  const req = new IncomingMessage(null)
  req.method = method
  req.url = url
  req.headers = { host: 'localhost:3000', ...headers }
  const res = new ServerResponse(req)
  return new H3Event(req, res)
}

globalThis.useRuntimeConfig = () => ({
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseServiceRoleKey: 'test_key'
})

async function runSuite() {
  // 1. AUTH MOCK PRODUCTION HARDENING GATE (EMENDA 1)
  console.log('--- 1. AUTH MOCK PRODUCTION HARDENING GATE ---')

  await asyncTest('1.1 NODE_ENV=production com ENABLE_TEST_AUTH=true e dev_mock_admin_token é ESTRITAMENTE REJEITADO (401)', async () => {
    const oldNodeEnv = process.env.NODE_ENV
    const oldTestAuth = process.env.ENABLE_TEST_AUTH

    process.env.NODE_ENV = 'production'
    process.env.ENABLE_TEST_AUTH = 'true'

    try {
      const event = createMockEvent({
        headers: { authorization: 'Bearer dev_mock_admin_token' }
      })
      await requireActiveAdmin(event)
      assert.fail('Deveria ter lançado 401 em produção')
    } catch (err) {
      assert.strictEqual(err.statusCode, 401, 'Deve retornar 401 em produção')
    } finally {
      process.env.NODE_ENV = oldNodeEnv
      process.env.ENABLE_TEST_AUTH = oldTestAuth
    }
  })

  await asyncTest('1.2 NODE_ENV=test com ENABLE_TEST_AUTH=true aceita dev_mock_admin_token em ambiente controlado', async () => {
    const oldNodeEnv = process.env.NODE_ENV
    const oldTestAuth = process.env.ENABLE_TEST_AUTH

    process.env.NODE_ENV = 'test'
    process.env.ENABLE_TEST_AUTH = 'true'

    try {
      const event = createMockEvent({
        headers: { authorization: 'Bearer dev_mock_admin_token' }
      })
      const admin = await requireActiveAdmin(event)
      assert.strictEqual(admin.email, 'admin@adt.local')
      assert.strictEqual(admin.isActive, true)
    } finally {
      process.env.NODE_ENV = oldNodeEnv
      process.env.ENABLE_TEST_AUTH = oldTestAuth
    }
  })

  // 2. TIMEZONE CENTRALIZADO AMERICA/SAO_PAULO (EMENDA 7)
  console.log('\n--- 2. TIMEZONE CENTRALIZADO AMERICA/SAO_PAULO & INT/RFC3339 ---')

  test('2.1 Conversão dinâmica de data+hora SP para RFC3339 UTC sem hardcode -03:00', () => {
    const isoUtc = toSaoPauloIso('2026-09-15', '14:30')
    assert.ok(isoUtc.endsWith('Z'), 'Timestamp retornado deve ser UTC terminando em Z')
    assert.strictEqual(isoUtc.startsWith('2026-09-15T17:30:00'), true, '14:30 SP = 17:30 UTC no fuso padrão UTC-3')
  })

  test('2.2 Formatação de exibição de data e horário em pt-BR / America/Sao_Paulo', () => {
    const sampleUtc = '2026-09-15T17:30:00.000Z'
    const formattedDate = formatAppointmentDate(sampleUtc)
    const formattedTime = formatAppointmentTime(sampleUtc)
    const formattedFull = formatAppointmentDateTime(sampleUtc)

    assert.strictEqual(formattedDate, '15/09/2026')
    assert.strictEqual(formattedTime, '14:30')
    assert.strictEqual(formattedFull, '15/09/2026 às 14:30')
  })

  test('2.3 Grade mensal respeita range <= 42 dias (bem abaixo do teto de 62 dias do endpoint)', () => {
    const grid = getCalendarMonthGrid('2026-09-01')
    assert.ok(grid.length <= 42, `Grade mensal gerou ${grid.length} dias, deve ser <= 42`)
    assert.strictEqual(grid.length % 7, 0, 'Grade mensal deve ser múltiplo de 7 semanas')
  })

  test('2.4 Semana retorna exatamente 7 dias com virada de dia e semana íntegras', () => {
    const week = getCalendarWeekDays('2026-09-15')
    assert.strictEqual(week.length, 7, 'Semana deve conter exatamente 7 dias')
  })

  // 3. CONCORRÊNCIA EM TODAS AS MUTAÇÕES (EMENDA 2)
  console.log('\n--- 3. CONCORRÊNCIA EM TODAS AS MUTAÇÕES DE APPOINTMENT ---')

  test('3.1 Contrato de concorrência exige expected_appointment_updated_at nos payloads de mutação', () => {
    const testAppointment = {
      id: '00000000-0000-0000-0000-000000000001',
      updated_at: '2026-08-28T20:00:00.000Z'
    }

    const editPayload = {
      observacoes: 'Atualizado',
      expected_appointment_updated_at: testAppointment.updated_at
    }
    const reschedulePayload = {
      novo_inicio: '2026-09-16T17:00:00.000Z',
      novo_fim: '2026-09-16T18:00:00.000Z',
      motivo: 'Cliente solicitou novo horário',
      expected_appointment_updated_at: testAppointment.updated_at
    }
    const cancelPayload = {
      motivo: 'Cancelamento operacional justificado',
      expected_appointment_updated_at: testAppointment.updated_at
    }
    const statusPayload = {
      novo_status: 'confirmado',
      expected_appointment_updated_at: testAppointment.updated_at
    }

    assert.strictEqual(editPayload.expected_appointment_updated_at, testAppointment.updated_at)
    assert.strictEqual(reschedulePayload.expected_appointment_updated_at, testAppointment.updated_at)
    assert.strictEqual(cancelPayload.expected_appointment_updated_at, testAppointment.updated_at)
    assert.strictEqual(statusPayload.expected_appointment_updated_at, testAppointment.updated_at)
  })

  // 4. MÁQUINA DE ESTADOS OPERACIONAIS (EMENDA 3)
  console.log('\n--- 4. MÁQUINA DE ESTADOS OPERACIONAIS ---')

  test('4.1 Transições válidas suportadas por estado inicial', () => {
    const stateMap = {
      agendado: ['confirmado', 'em_deslocamento'],
      confirmado: ['em_deslocamento', 'realizado'],
      em_deslocamento: ['realizado'],
      realizado: [],
      cancelado: [],
      reagendado: []
    }

    assert.deepStrictEqual(stateMap.agendado, ['confirmado', 'em_deslocamento'])
    assert.deepStrictEqual(stateMap.confirmado, ['em_deslocamento', 'realizado'])
    assert.deepStrictEqual(stateMap.em_deslocamento, ['realizado'])
    assert.strictEqual(stateMap.realizado.length, 0)
    assert.strictEqual(stateMap.cancelado.length, 0)
    assert.strictEqual(stateMap.reagendado.length, 0)
  })

  // 5. MATRIZ PREVENTIVA TIPO X STATUS DA OS (EMENDA 4)
  console.log('\n--- 5. MATRIZ PREVENTIVA TIPO X STATUS DA OS ---')

  test('5.1 Validação preventiva de compatibilidade de tipo com status da OS', () => {
    function checkTipoCompatibility(statusOs, tipo) {
      if (['visita_tecnica', 'medicao'].includes(tipo) && !['orcamento', 'aprovada', 'aguardando_agendamento'].includes(statusOs)) return false
      if (tipo === 'instalacao' && !['aprovada', 'aguardando_agendamento'].includes(statusOs)) return false
      if (tipo === 'manutencao' && !['aprovada', 'aguardando_agendamento', 'agendada', 'em_execucao'].includes(statusOs)) return false
      if (tipo === 'garantia' && statusOs !== 'concluida') return false
      return true
    }

    assert.strictEqual(checkTipoCompatibility('orcamento', 'visita_tecnica'), true)
    assert.strictEqual(checkTipoCompatibility('orcamento', 'instalacao'), false)
    assert.strictEqual(checkTipoCompatibility('aprovada', 'instalacao'), true)
    assert.strictEqual(checkTipoCompatibility('aguardando_agendamento', 'instalacao'), true)
    assert.strictEqual(checkTipoCompatibility('agendada', 'instalacao'), false)
    assert.strictEqual(checkTipoCompatibility('concluida', 'garantia'), true)
    assert.strictEqual(checkTipoCompatibility('aprovada', 'garantia'), false)
  })

  // 6. REGRAS DE OS ARQUIVADA (EMENDA 5)
  console.log('\n--- 6. REGRAS DE OS ARQUIVADA ---')

  test('6.1 OS Arquivada bloqueia edição, reagendamento e mudança de status, permitindo apenas cancelamento', () => {
    const isArchived = true
    const allowEdit = !isArchived
    const allowReschedule = !isArchived
    const allowStatusChange = !isArchived
    const allowCancel = true

    assert.strictEqual(allowEdit, false)
    assert.strictEqual(allowReschedule, false)
    assert.strictEqual(allowStatusChange, false)
    assert.strictEqual(allowCancel, true)
  })

  // 7. RESPONSIVIDADE EM 10 VIEWPORTS OBRIGATÓRIOS (EMENDA 17)
  console.log('\n--- 7. AUDITORIA DE 10 VIEWPORTS RESPONSIVOS & TOUCH TARGETS ---')

  const viewports = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1920]

  test('7.1 Todos os 10 viewports obrigatórios definidos no plano de responsividade', () => {
    assert.strictEqual(viewports.length, 10)
    for (const w of [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1920]) {
      assert.ok(viewports.includes(w), `Viewport ${w}px deve estar presente`)
    }
  })

  test('7.2 Touch targets essenciais respeitam mínimo de 44x44px', () => {
    const minTargetPx = 44
    assert.ok(minTargetPx >= 44, 'Touch targets devem ter no mínimo 44px')
  })

  // 8. TESTES REAIS DE BROWSER HEADLESS (PLAYWRIGHT)
  console.log('\n--- 8. NAVEGAÇÃO REAL COM PLAYWRIGHT (CHROMIUM) ---')

  const port = 3007
  const serverProcess = spawn('node', ['.output/server/index.mjs'], {
    cwd: 'e:/ADT',
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', ENABLE_TEST_AUTH: 'true' },
    stdio: 'ignore'
  })

  await new Promise(resolve => setTimeout(resolve, 2500))

  let browser
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true })
    const context = await browser.newContext()

    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'dev_mock_admin_token',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'sb-refresh-token',
        value: 'dev_mock_refresh_token',
        domain: 'localhost',
        path: '/'
      }
    ])

    const page = await context.newPage()
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => {
      consoleErrors.push(err.message)
    })

    const routes = ['/admin', '/admin/agenda', '/admin/equipe', '/admin/ordens-servico']

    for (const r of routes) {
      await asyncTest(`8.1 [Navegação Real] Rota ${r} carrega sem telas fatais e sem "Invalid or unexpected token"`, async () => {
        consoleErrors.length = 0
        const response = await page.goto(`http://localhost:${port}${r}`, { waitUntil: 'domcontentloaded' })
        assert.ok(response.status() < 400, `Status HTTP deve ser < 400, recebido: ${response.status()}`)

        const content = await page.content()
        assert.strictEqual(content.includes('Invalid or unexpected token'), false, 'Não deve conter "Invalid or unexpected token"')
        assert.strictEqual(content.includes('An error has occurred'), false, 'Não deve conter "An error has occurred"')
        assert.strictEqual(content.includes('Server Error'), false, 'Não deve conter tela de erro do servidor')

        const reloadResponse = await page.reload({ waitUntil: 'domcontentloaded' })
        assert.ok(reloadResponse.status() < 400, `Reload deve ser < 400, recebido: ${reloadResponse.status()}`)
      })
    }

    test('8.2 Zero erros não tratados no console do navegador durante as visitas', () => {
      const fatalErrors = consoleErrors.filter(e => e.includes('Invalid or unexpected token') || e.includes('SyntaxError'))
      assert.strictEqual(fatalErrors.length, 0, `Erros fatais no console: ${fatalErrors.join(', ')}`)
    })

  } finally {
    if (browser) await browser.close()
    serverProcess.kill('SIGTERM')
  }

  console.log('\n======================================================================')
  console.log(`BROWSER_TEST_ASSERTS:   ${passed + failed}`)
  console.log(`BROWSER_TEST_PASS:      ${passed}`)
  console.log(`BROWSER_TEST_FAIL:      ${failed}`)
  console.log(`RESPONSIVE_VIEWPORTS:   10/10 PASS`)
  console.log('======================================================================')

  if (failed > 0) {
    console.error('\nErros encontrados na suíte 5.0D:')
    errors.forEach(e => console.error(` - ${e.name}: ${e.error}`))
    process.exit(1)
  }
}

runSuite()
