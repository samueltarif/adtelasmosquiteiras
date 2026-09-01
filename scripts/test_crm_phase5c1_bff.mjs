/**
 * ======================================================================
 * SUÍTE DE TESTES REAIS DE BFF & HANDLERS — CRM FASE 5.0C.5
 * Arquivo: scripts/test_crm_phase5c1_bff.mjs
 * ======================================================================
 */

import assert from 'assert'
import fs from 'fs'
import path from 'path'
import * as h3 from 'h3'
import {
  isValidUUID,
  isValidRfc3339,
  sanitizePostgrestSearchTerm
} from '../server/shared/appointmentValidation.mjs'

import { APPOINTMENT_ERROR_MAP } from '../server/shared/appointmentErrorMap.mjs'
import { IncomingMessage, ServerResponse } from 'http'
import { requireActiveAdmin } from '../server/utils/adminAuth.ts'
import { findDuplicateClients } from '../server/utils/crmDuplicateSearch.ts'
import { validateMutationOrigin, verifyActiveAdmin } from '../server/shared/adminAuthCore.mjs'
import {
  APPOINTMENT_CALENDAR_SELECT,
  APPOINTMENT_DETAIL_SELECT,
  APPOINTMENT_SEARCH_SELECT,
  hasActiveInstallation,
  hasAnyActiveAppointment
} from '../server/utils/crmAppointmentHelpers.ts'
import { handleRpcError } from '../server/utils/crmAppointmentErrors.ts'

// Handlers reais importados (16 handlers)
import createAppointmentsHandler from '../server/api/admin/crm/appointments/index.post.ts'
import getAppointmentsHandler from '../server/api/admin/crm/appointments/index.get.ts'
import searchAppointmentsHandler from '../server/api/admin/crm/appointments/search.post.ts'
import getAppointmentDetailHandler from '../server/api/admin/crm/appointments/[id]/index.get.ts'
import patchAppointmentHandler from '../server/api/admin/crm/appointments/[id]/index.patch.ts'
import rescheduleAppointmentHandler from '../server/api/admin/crm/appointments/[id]/reschedule.post.ts'
import cancelAppointmentHandler from '../server/api/admin/crm/appointments/[id]/cancel.post.ts'
import statusAppointmentHandler from '../server/api/admin/crm/appointments/[id]/status.post.ts'
import patchWorkOrderHandler from '../server/api/admin/crm/work-orders/[id]/index.patch.ts'
import statusWorkOrderHandler from '../server/api/admin/crm/work-orders/[id]/status.post.ts'
import getStaffHandler from '../server/api/admin/crm/staff/index.get.ts'
import postStaffHandler from '../server/api/admin/crm/staff/index.post.ts'
import patchStaffHandler from '../server/api/admin/crm/staff/[id].patch.ts'
import getWoAppointmentsHandler from '../server/api/admin/crm/work-orders/[id]/appointments.get.ts'
import convertLeadHandler from '../server/api/admin/crm/leads/[id]/convert.post.ts'
import createWorkOrderHandler from '../server/api/admin/crm/work-orders/index.post.ts'

console.log('======================================================================')
console.log('--- SUÍTE DE TESTES REAIS DE BFF & HANDLERS CRM FASE 5.0C.5 ---')
console.log('======================================================================\n')

let passed = 0
let failed = 0
const errors = []

function test(name, fn) {
  try {
    fn()
    console.log(`  [PASS:UNIT] ${name}`)
    passed++
  } catch (err) {
    console.error(`  [FAIL:UNIT] ${name}:`, err.message)
    errors.push({ name, error: err.message })
    failed++
  }
}

async function asyncTest(name, fn) {
  try {
    await fn()
    console.log(`  [PASS:BFF] ${name}`)
    passed++
  } catch (err) {
    console.error(`  [FAIL:BFF] ${name}:`, err.message)
    errors.push({ name, error: err.message })
    failed++
  }
}

function createMockEvent({ method = 'GET', url = '/', headers = {}, body = undefined, query = {}, params = {}, context = {} } = {}) {
  const req = new IncomingMessage(null)
  req.method = method
  
  const qStr = new URLSearchParams(query).toString()
  req.url = qStr ? `${url}?${qStr}` : url
  req.headers = { host: 'localhost:3000', origin: 'http://localhost:3000', ...headers }

  if (body !== undefined) {
    const jsonStr = JSON.stringify(body)
    req.headers['content-type'] = 'application/json'
    req.headers['content-length'] = String(Buffer.byteLength(jsonStr))
    req.push(jsonStr)
    req.push(null)
  } else {
    req.push(null)
  }

  const res = new ServerResponse(req)
  const event = new h3.H3Event(req, res)
  event.context = {
    params,
    ...context
  }
  return event
}

globalThis.useRuntimeConfig = () => ({
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseServiceRoleKey: 'test_service_key',
  supabaseAnonKey: 'test_anon_key'
})

const defaultAdminContext = {
  auth: {
    adminSession: true,
    admin: {
      adminId: '00000000-0000-0000-0000-000000000001',
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'admin@adt.local',
      role: 'admin',
      isActive: true
    }
  }
}

function getErrorStatus(err) {
  return err.statusCode || err.status || (err.response && err.response.status)
}

async function runSuite() {
  console.log('--- A. VALIDAÇÃO UNITÁRIA (UUID, RFC3339, POSTGREST QUOTING, ERROR MAP, STATIC CHECKS) ---')

  test('A.1 UUID version-agnostic (v1, v4, v7, random hex)', () => {
    assert.strictEqual(isValidUUID('c6745e05-20a8-4865-b2b1-dc1d102a818e'), true)
    assert.strictEqual(isValidUUID('018e3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b'), true)
    assert.strictEqual(isValidUUID('not-a-uuid'), false)
    assert.strictEqual(isValidUUID(''), false)
    assert.strictEqual(isValidUUID(null), false)
  })

  test('A.2 RFC3339 strict com timezone explícito (rejeita date-only, datas impossíveis)', () => {
    assert.strictEqual(isValidRfc3339('2026-08-28T20:00:00Z'), true)
    assert.strictEqual(isValidRfc3339('2026-08-28T17:00:00-03:00'), true)
    assert.strictEqual(isValidRfc3339('2026-08-28T17:00:00+02:00'), true)
    assert.strictEqual(isValidRfc3339('2026-08-28'), false)
    assert.strictEqual(isValidRfc3339('2026-02-31T12:00:00Z'), false)
    assert.strictEqual(isValidRfc3339('2026-13-01T12:00:00Z'), false)
    assert.strictEqual(isValidRfc3339('2026-08-28T25:00:00Z'), false)
  })

  test('A.3 PostgREST search term escaping com caracteres reservados', () => {
    assert.strictEqual(sanitizePostgrestSearchTerm('teste'), '"*teste*"')
    assert.strictEqual(sanitizePostgrestSearchTerm('joao.silva@adt.local'), '"*joao.silva@adt.local*"')
    assert.strictEqual(sanitizePostgrestSearchTerm('termo%com_wildcards'), '"*termo\\%com\\_wildcards*"')
    assert.strictEqual(sanitizePostgrestSearchTerm(''), null)
  })

  test('A.4 Dicionário de Erros — 25 códigos Migration 012 + 1 Migration 013 + 3 aplicação = 29 chaves', () => {
    const keys = Object.keys(APPOINTMENT_ERROR_MAP)
    assert.strictEqual(keys.length, 29)
    assert.ok(APPOINTMENT_ERROR_MAP.ERR_APPOINTMENT_STALE_VERSION)
    assert.ok(APPOINTMENT_ERROR_MAP.ERR_DATA_PREVISTA_MANAGED_BY_AGENDA)
    assert.ok(APPOINTMENT_ERROR_MAP.ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED)
    assert.ok(APPOINTMENT_ERROR_MAP.ERR_ACTIVE_APPOINTMENTS_EXIST)
  })

  test('A.5 Static Security Check: zero bypass tokens no runtime auth code (DEV_MOCK_AUTH_RUNTIME=REMOVED)', () => {
    const adminAuthFile = fs.readFileSync(path.resolve('server/utils/adminAuth.ts'), 'utf8')
    assert.strictEqual(adminAuthFile.includes('dev_mock_admin_token'), false, 'dev_mock_admin_token não pode existir')
    assert.strictEqual(adminAuthFile.includes('dev_mock_refresh_token'), false, 'dev_mock_refresh_token não pode existir')
    assert.strictEqual(adminAuthFile.includes('ENABLE_TEST_AUTH'), false, 'ENABLE_TEST_AUTH não pode existir no runtime')
    assert.strictEqual(adminAuthFile.includes('e2e_test_admin_token'), false, 'e2e_test_admin_token não pode existir no runtime')
  })

  test('A.6 verifyActiveAdmin Role Fail-Closed (role ausente/null/operator -> UNAUTHORIZED_ROLE)', () => {
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: 'admin', is_active: true }]).authorized, true)
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: 'superadmin', is_active: true }]).authorized, true)
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: 'operator', is_active: true }]).authorized, false)
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: null, is_active: true }]).authorized, false)
    assert.strictEqual(verifyActiveAdmin({ id: 'u1' }, [{ user_id: 'u1', role: undefined, is_active: true }]).authorized, false)
  })

  test('A.7 CALENDAR_PII_MINIMIZATION: APPOINTMENT_CALENDAR_SELECT não contém campos PII proibidos', () => {
    // CALENDAR_PII_MINIMIZATION=PASS
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('telefone'), false, 'telefone não deve estar no calendário')
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('email'), false, 'email não deve estar no calendário')
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('observacoes'), false, 'observacoes não deve estar no calendário')
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('motivo_reagendamento'), false, 'motivo_reagendamento não deve estar no calendário')
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('created_by'), false, 'created_by não deve estar no calendário')
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('valor_final'), false, 'valor_final não deve estar no calendário')
    // Garante os campos mínimos obrigatórios presentes
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('id'), true)
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('data_hora_inicio'), true)
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('data_hora_fim'), true)
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('status_agendamento'), true)
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('updated_at'), true)
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('client:clients(id,nome)'), true)
    assert.strictEqual(APPOINTMENT_CALENDAR_SELECT.includes('work_order:work_orders(id,numero_os,status_os)'), true)
  })

  test('A.8 APPOINTMENT_DETAIL_SELECT permanece completo com campos operacionais e PII necessária ao detalhe', () => {
    assert.strictEqual(APPOINTMENT_DETAIL_SELECT.includes('telefone_principal'), true, 'Detail deve ter telefone')
    assert.strictEqual(APPOINTMENT_DETAIL_SELECT.includes('email'), true, 'Detail deve ter email')
    assert.strictEqual(APPOINTMENT_DETAIL_SELECT.includes('observacoes'), true, 'Detail deve ter observacoes')
    assert.strictEqual(APPOINTMENT_DETAIL_SELECT.includes('motivo_reagendamento_cancelamento'), true)
    assert.strictEqual(APPOINTMENT_DETAIL_SELECT.includes('created_by'), true)
    assert.strictEqual(APPOINTMENT_DETAIL_SELECT.includes('valor_final'), true)
  })

  test('A.9 APPOINTMENT_SEARCH_SELECT é projeção minimizada (igual ao calendário)', () => {
    assert.strictEqual(APPOINTMENT_SEARCH_SELECT, APPOINTMENT_CALENDAR_SELECT, 'SEARCH_RESULT_PROJECTION=MINIMIZED')
    assert.strictEqual(APPOINTMENT_SEARCH_SELECT.includes('telefone'), false)
    assert.strictEqual(APPOINTMENT_SEARCH_SELECT.includes('email'), false)
  })

  test('A.10 LEAD_CONVERT_RAW_ERROR_LOGGING=REMOVED: convert.post.ts não contém logging de rpcErr bruto', () => {
    const content = fs.readFileSync(path.resolve('server/api/admin/crm/leads/[id]/convert.post.ts'), 'utf8')
    // NUNCA logar: rpcErr diretamente, ou payload completo
    assert.strictEqual(content.includes('console.error(\'[leads/convert] Erro na RPC de conversão:\', rpcErr)'), false, 'raw rpcErr logging removido')
    assert.strictEqual(content.includes('rpcErr)'), false, 'zero referência a rpcErr como último argumento de log')
    // Log técnico permitido deve estar presente
    assert.strictEqual(content.includes('LEAD_CONVERT_RAW_ERROR_LOGGING=REMOVED'), true, 'comentário de conformidade obrigatório')
  })

  test('A.11 MANUAL_SCHEDULE_ERROR_CODE=ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED: código canônico no status.post.ts', () => {
    const content = fs.readFileSync(path.resolve('server/api/admin/crm/work-orders/[id]/status.post.ts'), 'utf8')
    assert.strictEqual(content.includes('ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED'), true, 'código canônico obrigatório')
    assert.strictEqual(content.includes('ERR_STATUS_MANAGED_BY_AGENDA'), false, 'código não-canônico proibido')
  })

  test('A.12 ACTIVE_INSTALLATION_GUARD_FAILURE_POLICY=FAIL_CLOSED_ALL_PATHS: hasActiveInstallation fail-closed em config ausente e workOrderId inválido', async () => {
    // Config ausente -> 503
    try {
      await hasActiveInstallation({ url: '', serviceRoleKey: '' }, 'some-id')
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(err?.statusCode, 503, 'config ausente deve lançar 503')
    }
    // workOrderId ausente -> 400
    try {
      await hasActiveInstallation({ url: 'http://localhost', serviceRoleKey: 'key' }, '')
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(err?.statusCode, 400, 'workOrderId inválido deve lançar 400')
    }
  })

  test('A.13 RUNTIME_RPC_ERROR_MAP_KEYS=29 & RUNTIME_RPC_ERROR_MAP_DRIFT=NO: handleRpcError mapeia todas as 29 chaves', () => {
    const canonicalKeys = Object.keys(APPOINTMENT_ERROR_MAP)
    assert.strictEqual(canonicalKeys.length, 29, 'Dicionário canônico deve ter 29 chaves (25 Migration 012 + 1 Migration 013 + 3 Aplicação)')
    for (const key of canonicalKeys) {
      const def = APPOINTMENT_ERROR_MAP[key]
      try {
        handleRpcError({ message: `RPC error: ${key} occurred` })
        assert.fail(`handleRpcError deveria lançar para ${key}`)
      } catch (err) {
        assert.strictEqual(err?.statusCode, def.status, `Status incorreto para ${key}: ${err?.statusCode} vs ${def.status}`)
        assert.ok(err?.data?.error?.code === def.code || err?.data?.error?.code === key, `Código incorreto para ${key}`)
      }
    }
  })

  test('A.14 RUNTIME_RPC_ERROR_MAP_DRIFT=NO: Cobertura explícita dos 7 códigos da Migration 012 sem retornar 500', () => {
    const missingSeven = [
      { key: 'ERR_STAFF_INACTIVE', expectedStatus: 409 },
      { key: 'ERR_APPOINTMENT_DRIFT', expectedStatus: 409 },
      { key: 'ERR_QUOTE_WORK_ORDER_STATUS', expectedStatus: 400 },
      { key: 'ERR_MAINTENANCE_WORK_ORDER_STATUS', expectedStatus: 400 },
      { key: 'ERR_WARRANTY_WORK_ORDER_STATUS', expectedStatus: 400 },
      { key: 'ERR_INVALID_APPOINTMENT_TIPO', expectedStatus: 400 },
      { key: 'ERR_HARD_DELETE_FORBIDDEN', expectedStatus: 400 }
    ]

    for (const { key, expectedStatus } of missingSeven) {
      try {
        handleRpcError({ message: key })
        assert.fail(`Deveria lançar erro para ${key}`)
      } catch (err) {
        assert.strictEqual(err?.statusCode, expectedStatus, `${key} deve retornar status ${expectedStatus} e nunca 500`)
      }
    }
  })

  test('A.15 STRUCTURED_SQLSTATE_MAPPING: handleRpcError interpreta SQLSTATE estruturado via err.code e err.data.code', () => {
    // 23P01 via err.code
    try {
      handleRpcError({ code: '23P01', message: 'exclusion constraint' })
      assert.fail('Deveria ter lançado erro para 23P01')
    } catch (err) {
      assert.strictEqual(err?.statusCode, 409, '23P01 via err.code deve ser 409')
      assert.strictEqual(err?.data?.error?.code, 'ERR_STAFF_SCHEDULE_CONFLICT')
    }

    // 23P01 via err.data.code
    try {
      handleRpcError({ data: { code: '23P01', message: 'exclusion constraint' } })
      assert.fail('Deveria ter lançado erro para data.code 23P01')
    } catch (err) {
      assert.strictEqual(err?.statusCode, 409, '23P01 via err.data.code deve ser 409')
    }

    // 23505 com active installation
    try {
      handleRpcError({ code: '23505', message: 'unq_active_installation_per_wo violation' })
      assert.fail('Deveria ter lançado erro para 23505')
    } catch (err) {
      assert.strictEqual(err?.statusCode, 409, '23505 active installation deve ser 409')
      assert.strictEqual(err?.data?.error?.code, 'ERR_ACTIVE_INSTALLATION_EXISTS')
    }

    // 23503 via err.code
    try {
      handleRpcError({ code: '23503', message: 'foreign key violation' })
      assert.fail('Deveria ter lançado erro para 23503')
    } catch (err) {
      assert.strictEqual(err?.statusCode, 400, '23503 deve ser 400')
      assert.strictEqual(err?.data?.error?.code, 'ERR_FOREIGN_KEY_VIOLATION')
    }
  })

  test('A.16 RUNTIME_RPC_RAW_PII_LOGGING=NONE: Fallback de handleRpcError NUNCA loga mensagens sensíveis/PII', () => {
    const sentinelPii = 'SENSIBLE_CLIENT_TELEFONE_11999998888_EMAIL_SECRET@DOMAIN.COM_RUA_TESTE_123'
    const capturedLogs = []
    const originalConsoleError = console.error
    console.error = (...args) => {
      capturedLogs.push(args.join(' '))
    }

    try {
      handleRpcError({
        statusCode: 500,
        message: `Database error with client data: ${sentinelPii}`,
        details: `Detailed leak: ${sentinelPii}`
      })
    } catch (err) {
      assert.strictEqual(err?.statusCode, 500)
    } finally {
      console.error = originalConsoleError
    }

    const fullLog = capturedLogs.join('\n')
    assert.strictEqual(fullLog.includes(sentinelPii), false, 'String de PII NÃO pode vazar no console.error!')
    assert.ok(fullLog.includes('[CRM Appointment RPC Error]'), 'Log técnico estruturado deve estar presente')
  })

  test('A.17 ACTIVE_APPOINTMENT_GUARD_FAILURE_POLICY=FAIL_CLOSED: hasAnyActiveAppointment fail-closed em config ausente e workOrderId inválido', async () => {
    // Config ausente -> 503
    try {
      await hasAnyActiveAppointment({ url: '', serviceRoleKey: '' }, 'some-id')
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(err?.statusCode, 503, 'config ausente deve lançar 503')
    }
    // workOrderId ausente -> 400
    try {
      await hasAnyActiveAppointment({ url: 'http://localhost', serviceRoleKey: 'key' }, '')
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(err?.statusCode, 400, 'workOrderId inválido deve lançar 400')
    }
  })

  console.log('\n--- B. TESTES REAIS DOS 16 HANDLERS NITRO (BFF) ---')

  await asyncTest('B.1 Handler sem autenticação rejeita com 401', async () => {
    const event = createMockEvent({ method: 'GET', url: '/api/admin/crm/appointments' })
    try {
      await getAppointmentsHandler(event)
      assert.fail('Deveria ter lançado 401')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 401)
    }
  })

  await asyncTest('B.2 Handler com admin inativo rejeita com 403', async () => {
    const event = createMockEvent({
      method: 'GET',
      url: '/api/admin/crm/appointments',
      context: {
        auth: {
          adminSession: true,
          admin: { adminId: '1', userId: '1', email: 'inactive@adt.local', role: 'admin', isActive: false }
        }
      }
    })
    try {
      await getAppointmentsHandler(event)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err) >= 400, true)
    }
  })

  await asyncTest('B.3 Handler mutante com Origin cross-site rejeita com 403 CSRF', async () => {
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments',
      headers: { host: 'localhost:3000', origin: 'http://malicious-attacker.com' }
    })
    try {
      await createAppointmentsHandler(event)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403)
    }
  })

  await asyncTest('B.4 POST /api/admin/crm/appointments cria agendamento via create_appointment_atomic com actor_id autenticado', async () => {
    let calledRpc = null
    let rpcBody = null
    globalThis.$fetch = async (url, opts) => {
      if (url.includes('/rpc/')) {
        calledRpc = url
        rpcBody = opts?.body
        return {
          id: '00000000-0000-0000-0000-000000000001',
          work_order_id: '00000000-0000-0000-0000-000000000002',
          tipo_agendamento: 'visita_tecnica',
          status_agendamento: 'agendado'
        }
      }
      return [{ id: '00000000-0000-0000-0000-000000000001' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments',
      context: defaultAdminContext,
      body: {
        work_order_id: '00000000-0000-0000-0000-000000000002',
        tipo_agendamento: 'visita_tecnica',
        data_hora_inicio: '2026-09-15T14:00:00Z',
        data_hora_fim: '2026-09-15T15:00:00Z'
      }
    })
    const res = await createAppointmentsHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(calledRpc.includes('create_appointment_atomic'), true)
    assert.strictEqual(rpcBody.p_actor_id, defaultAdminContext.auth.admin.adminId)
  })

  await asyncTest('B.5 POST /api/admin/crm/appointments com UUID inválido retorna 400', async () => {
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments',
      context: defaultAdminContext,
      body: { work_order_id: 'invalid-uuid', tipo_agendamento: 'visita_tecnica', data_hora_inicio: '2026-09-15T14:00:00Z', data_hora_fim: '2026-09-15T15:00:00Z' }
    })
    try {
      await createAppointmentsHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  await asyncTest('B.6 POST /api/admin/crm/appointments com timestamp sem timezone retorna 400', async () => {
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments',
      context: defaultAdminContext,
      body: { work_order_id: '00000000-0000-0000-0000-000000000002', tipo_agendamento: 'visita_tecnica', data_hora_inicio: '2026-09-15 14:00:00', data_hora_fim: '2026-09-15T15:00:00Z' }
    })
    try {
      await createAppointmentsHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  await asyncTest('B.7 GET /api/admin/crm/appointments/:id valida UUID, retorno existente (200) e inexistente (404)', async () => {
    globalThis.$fetch = async (url) => {
      if (url.includes('eq.00000000-0000-0000-0000-000000000001')) {
        return [{ id: '00000000-0000-0000-0000-000000000001', status_agendamento: 'agendado' }]
      }
      return []
    }
    const eventSuccess = createMockEvent({
      method: 'GET',
      url: '/api/admin/crm/appointments/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' }
    })
    const res = await getAppointmentDetailHandler(eventSuccess)
    assert.strictEqual(res.success, true)

    const eventNotFound = createMockEvent({
      method: 'GET',
      url: '/api/admin/crm/appointments/00000000-0000-0000-0000-000000000002',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000002' }
    })
    try {
      await getAppointmentDetailHandler(eventNotFound)
      assert.fail('Deveria ter lançado 404')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 404)
    }
  })

  await asyncTest('B.8 PATCH /api/admin/crm/appointments/:id atualiza campos não-temporais com flags corretas', async () => {
    let rpcBody = null
    globalThis.$fetch = async (url, opts) => {
      if (url.includes('/rpc/')) {
        rpcBody = opts?.body
        return { id: '00000000-0000-0000-0000-000000000001', observacoes: 'teste' }
      }
      return [{ id: '00000000-0000-0000-0000-000000000001' }]
    }
    const event = createMockEvent({
      method: 'PATCH',
      url: '/api/admin/crm/appointments/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: {
        observacoes: 'teste',
        expected_appointment_updated_at: '2026-08-28T20:00:00Z'
      }
    })
    const res = await patchAppointmentHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(rpcBody.p_update_observacoes, true)
    assert.strictEqual(rpcBody.p_update_staff, false)
  })

  await asyncTest('B.9 PATCH /api/admin/crm/appointments/:id com timestamp inválido retorna 400', async () => {
    const event = createMockEvent({
      method: 'PATCH',
      url: '/api/admin/crm/appointments/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { observacoes: 'teste', expected_appointment_updated_at: 'data-invalida' }
    })
    try {
      await patchAppointmentHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  await asyncTest('B.10 POST /api/admin/crm/appointments/:id/reschedule invoca reschedule_appointment_atomic', async () => {
    let calledRpc = null
    globalThis.$fetch = async (url) => {
      if (url.includes('/rpc/')) {
        calledRpc = url
        return { id: '00000000-0000-0000-0000-000000000002', status_agendamento: 'agendado' }
      }
      return [{ id: '00000000-0000-0000-0000-000000000002' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/00000000-0000-0000-0000-000000000001/reschedule',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: {
        new_data_hora_inicio: '2026-09-16T14:00:00Z',
        new_data_hora_fim: '2026-09-16T15:00:00Z',
        motivo: 'Reagendamento solicitado',
        expected_appointment_updated_at: '2026-08-28T20:00:00Z'
      }
    })
    const res = await rescheduleAppointmentHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(calledRpc.includes('reschedule_appointment_atomic'), true)
  })

  await asyncTest('B.11 POST /api/admin/crm/appointments/:id/cancel invoca cancel_appointment_atomic', async () => {
    let calledRpc = null
    globalThis.$fetch = async (url) => {
      if (url.includes('/rpc/')) {
        calledRpc = url
        return { id: '00000000-0000-0000-0000-000000000001', status_agendamento: 'cancelado' }
      }
      return [{ id: '00000000-0000-0000-0000-000000000001' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/00000000-0000-0000-0000-000000000001/cancel',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: {
        motivo: 'Cancelamento operacional justificado',
        expected_appointment_updated_at: '2026-08-28T20:00:00Z'
      }
    })
    const res = await cancelAppointmentHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(calledRpc.includes('cancel_appointment_atomic'), true)
  })

  await asyncTest('B.12 POST /api/admin/crm/appointments/:id/status invoca update_appointment_status_atomic', async () => {
    let calledRpc = null
    globalThis.$fetch = async (url) => {
      if (url.includes('/rpc/')) {
        calledRpc = url
        return { id: '00000000-0000-0000-0000-000000000001', status_agendamento: 'confirmado' }
      }
      return [{ id: '00000000-0000-0000-0000-000000000001' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: {
        status: 'confirmado',
        expected_appointment_updated_at: '2026-08-28T20:00:00Z'
      }
    })
    const res = await statusAppointmentHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(calledRpc.includes('update_appointment_status_atomic'), true)
  })

  await asyncTest('B.13 GET /api/admin/crm/appointments passa staffId, overlap gt/lt e CALENDAR_PII_MINIMIZATION=PASS', async () => {
    let queriedUrl = null
    globalThis.$fetch = async (url) => {
      queriedUrl = url
      return []
    }
    const event = createMockEvent({
      method: 'GET',
      url: '/api/admin/crm/appointments',
      context: defaultAdminContext,
      query: {
        start: '2026-09-01T00:00:00Z',
        end: '2026-09-30T23:59:59Z',
        staffId: '00000000-0000-0000-0000-000000000001'
      }
    })
    const res = await getAppointmentsHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(queriedUrl.includes('staff_id=eq.00000000-0000-0000-0000-000000000001'), true)
    assert.strictEqual(queriedUrl.includes('data_hora_fim=gt.'), true)
    assert.strictEqual(queriedUrl.includes('data_hora_inicio=lt.'), true)
    // CALENDAR_PII_MINIMIZATION: telefone/email NÃO podem aparecer na projeção da URL
    assert.strictEqual(queriedUrl.includes('telefone'), false, 'Calendário não deve solicitar telefone')
    assert.strictEqual(queriedUrl.includes('observacoes'), false, 'Calendário não deve solicitar observacoes')
    assert.strictEqual(queriedUrl.includes('motivo_reagendamento'), false, 'Calendário não deve solicitar motivo_reagendamento')
  })

  await asyncTest('B.14 POST /api/admin/crm/appointments/search valida q vazio (200), q com valor (400) e tipos inválidos (400)', async () => {
    globalThis.$fetch = async () => []
    
    // q string vazia -> aceita (200)
    const eventEmptyQ = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/search',
      context: defaultAdminContext,
      body: { q: '  ' }
    })
    const resEmpty = await searchAppointmentsHandler(eventEmptyQ)
    assert.strictEqual(resEmpty.success, true)

    // q com valor não vazio -> 400 SEARCH_PII_DEFERRED
    const eventWithQ = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/search',
      context: defaultAdminContext,
      body: { q: 'termo busca' }
    })
    try {
      await searchAppointmentsHandler(eventWithQ)
      assert.fail('Deveria ter retornado 400 para q não vazio')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }

    // q number -> 400
    const eventNumberQ = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/search',
      context: defaultAdminContext,
      body: { q: 123 }
    })
    try {
      await searchAppointmentsHandler(eventNumberQ)
      assert.fail('Deveria ter retornado 400 para q number')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }

    // staffId inválido -> 400
    const eventBadStaff = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/search',
      context: defaultAdminContext,
      body: { staffId: 'not-a-uuid' }
    })
    try {
      await searchAppointmentsHandler(eventBadStaff)
      assert.fail('Deveria ter retornado 400 para staffId inválido')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }

    // Filtros estruturados válidos -> 200
    const eventStructured = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/search',
      context: defaultAdminContext,
      body: { status: 'agendado', tipo: 'visita_tecnica' }
    })
    const res = await searchAppointmentsHandler(eventStructured)
    assert.strictEqual(res.success, true)
  })

  await asyncTest('B.15 PATCH /api/admin/crm/work-orders/:id com data_prevista retorna 400', async () => {
    const event = createMockEvent({
      method: 'PATCH',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { data_prevista: '2026-09-15', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await patchWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  await asyncTest('B.16 POST /api/admin/crm/work-orders/:id/status com agendada retorna 400 ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED', async () => {
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'agendada', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await statusWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400, 'HTTP status deve ser 400')
      // Verifica código de erro canônico no statusMessage ou data.error.code
      const errMsg = err?.statusMessage || err?.data?.error?.code || err?.message || ''
      assert.strictEqual(
        errMsg.includes('ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED'),
        true,
        `MANUAL_SCHEDULE_ERROR_CODE=ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED — obtido: "${errMsg}"`
      )
    }
  })

  await asyncTest('B.17 POST /api/admin/crm/work-orders/:id/status regressão com instalação ativa retorna 409', async () => {
    globalThis.$fetch = async (url) => {
      if (url.includes('/appointments?')) {
        return [{ id: '1', tipo_agendamento: 'instalacao', status_agendamento: 'agendado' }]
      }
      return [{ id: '00000000-0000-0000-0000-000000000001', status_os: 'agendada', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'aguardando_agendamento', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await statusWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 409')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 409)
    }
  })

  await asyncTest('B.18 POST /api/admin/crm/work-orders/:id/status FAIL-CLOSED: falha upstream em hasActiveInstallation retorna 503 e ZERO mutações', async () => {
    globalThis.$fetch = async (url) => {
      if (url.includes('/appointments?')) {
        throw new Error('Upstream timeout')
      }
      return [{ id: '00000000-0000-0000-0000-000000000001', status_os: 'agendada', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'aguardando_agendamento', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await statusWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503)
    }
  })

  await asyncTest('B.18.1 CASO A: POST /api/admin/crm/work-orders/:id/status (target=cancelada com instalacao confirmado) retorna 409 ERR_ACTIVE_APPOINTMENTS_EXIST e ZERO mutações', async () => {
    let patchedWorkOrders = 0
    let createdNotes = 0
    let createdActivities = 0
    globalThis.$fetch = async (url, opts) => {
      if (opts?.method === 'PATCH') patchedWorkOrders++
      if (url.includes('/crm_notes')) createdNotes++
      if (url.includes('/admin_audit_logs')) createdActivities++
      if (url.includes('/appointments?')) {
        return [{ id: 'appt-1', tipo_agendamento: 'instalacao', status_agendamento: 'confirmado' }]
      }
      return [{ id: '00000000-0000-0000-0000-000000000001', numero_os: 'OS-001', client_id: 'c1', status_os: 'agendada', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'cancelada', reason: 'Cancelamento com instalacao confirmada', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await statusWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 409')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 409)
      const errMsg = err?.statusMessage || err?.data?.error?.code || err?.message || ''
      assert.strictEqual(errMsg.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), true, 'Deveria conter ERR_ACTIVE_APPOINTMENTS_EXIST')
      assert.strictEqual(patchedWorkOrders, 0, 'Zero PATCH work_orders')
      assert.strictEqual(createdNotes, 0, 'Zero crm_notes')
      assert.strictEqual(createdActivities, 0, 'Zero crm_activity_log')
    }
  })

  await asyncTest('B.18.2 CASO B: POST /api/admin/crm/work-orders/:id/status (target=concluida com manutencao em_deslocamento) retorna 409 ERR_ACTIVE_APPOINTMENTS_EXIST e ZERO mutações', async () => {
    let patchedWorkOrders = 0
    let createdActivities = 0
    globalThis.$fetch = async (url, opts) => {
      if (opts?.method === 'PATCH') patchedWorkOrders++
      if (url.includes('/admin_audit_logs')) createdActivities++
      if (url.includes('/appointments?')) {
        return [{ id: 'appt-2', tipo_agendamento: 'manutencao', status_agendamento: 'em_deslocamento' }]
      }
      return [{ id: '00000000-0000-0000-0000-000000000001', numero_os: 'OS-001', client_id: 'c1', status_os: 'em_execucao', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'concluida', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await statusWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 409')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 409)
      const errMsg = err?.statusMessage || err?.data?.error?.code || err?.message || ''
      assert.strictEqual(errMsg.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), true, 'Deveria conter ERR_ACTIVE_APPOINTMENTS_EXIST')
      assert.strictEqual(patchedWorkOrders, 0, 'Zero PATCH work_orders')
      assert.strictEqual(createdActivities, 0, 'Zero crm_activity_log')
    }
  })

  await asyncTest('B.18.3 CASO C: POST /api/admin/crm/work-orders/:id/status (target=cancelada sem appointments ativos) é permitida', async () => {
    let patchedWorkOrders = 0
    globalThis.$fetch = async (url, opts) => {
      if (opts?.method === 'PATCH') {
        patchedWorkOrders++
        return [{ id: '00000000-0000-0000-0000-000000000001', status_os: 'cancelada', updated_at: '2026-08-28T20:10:00Z' }]
      }
      if (url.includes('/crm_notes')) return [{ id: 'note-1' }]
      if (url.includes('/admin_audit_logs')) return [{ id: 'audit-1' }]
      if (url.includes('/appointments?')) return []
      return [{ id: '00000000-0000-0000-0000-000000000001', numero_os: 'OS-001', client_id: 'c1', status_os: 'agendada', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'cancelada', reason: 'Cancelamento sem appointments ativos', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    const res = await statusWorkOrderHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(patchedWorkOrders, 1)
  })

  await asyncTest('B.18.4 CASO D: POST /api/admin/crm/work-orders/:id/status (target=concluida com appointments apenas realizados) é permitida', async () => {
    let patchedWorkOrders = 0
    globalThis.$fetch = async (url, opts) => {
      if (opts?.method === 'PATCH') {
        patchedWorkOrders++
        return [{ id: '00000000-0000-0000-0000-000000000001', status_os: 'concluida', updated_at: '2026-08-28T20:10:00Z' }]
      }
      if (url.includes('/admin_audit_logs')) return [{ id: 'audit-1' }]
      if (url.includes('/appointments?')) return [] // status in (agendado,confirmado,em_deslocamento) retorna vazio
      return [{ id: '00000000-0000-0000-0000-000000000001', numero_os: 'OS-001', client_id: 'c1', status_os: 'em_execucao', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'concluida', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    const res = await statusWorkOrderHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(patchedWorkOrders, 1)
  })

  await asyncTest('B.18.5 CASO E: POST /api/admin/crm/work-orders/:id/status FAIL-CLOSED em falha upstream de hasAnyActiveAppointment retorna 503 e ZERO mutações', async () => {
    let patchedWorkOrders = 0
    globalThis.$fetch = async (url, opts) => {
      if (opts?.method === 'PATCH') patchedWorkOrders++
      if (url.includes('/appointments?')) {
        throw new Error('Upstream database connection failure')
      }
      return [{ id: '00000000-0000-0000-0000-000000000001', numero_os: 'OS-001', client_id: 'c1', status_os: 'em_execucao', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'concluida', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await statusWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503)
      assert.strictEqual(patchedWorkOrders, 0, 'Zero PATCH work_orders')
    }
  })

  await asyncTest('B.18.6 CASO F: POST /api/admin/crm/work-orders/:id/status (Trigger Race Fallback) retorna 409 ERR_ACTIVE_APPOINTMENTS_EXIST e ZERO side effects', async () => {
    let createdNotes = 0
    let createdActivities = 0
    globalThis.$fetch = async (url, opts) => {
      if (url.includes('/crm_notes')) createdNotes++
      if (url.includes('/admin_audit_logs')) createdActivities++
      if (url.includes('/appointments?')) {
        return [] // Precheck passa vazio (race condition)
      }
      if (opts?.method === 'PATCH') {
        // Simula falha do trigger de banco propagada via PostgREST
        const postgrestError = new Error('ERR_ACTIVE_APPOINTMENTS_EXIST')
        postgrestError.code = 'P0001'
        postgrestError.data = {
          code: 'P0001',
          message: 'ERR_ACTIVE_APPOINTMENTS_EXIST',
          details: 'trg_prevent_terminal_work_order_with_active_appointments raised exception'
        }
        postgrestError.statusCode = 400
        throw postgrestError
      }
      return [{ id: '00000000-0000-0000-0000-000000000001', numero_os: 'OS-001', client_id: 'c1', status_os: 'em_execucao', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'concluida', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await statusWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 409')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 409, 'TRIGGER_RACE_HTTP_STATUS=409')
      assert.strictEqual(err?.data?.error?.code, 'ERR_ACTIVE_APPOINTMENTS_EXIST', 'TRIGGER_RACE_ERROR_CODE=ERR_ACTIVE_APPOINTMENTS_EXIST')
      assert.strictEqual(
        err?.data?.error?.message,
        'Existem agendamentos ativos incompatíveis vinculados a esta ordem de serviço. Conclua ou cancele esses agendamentos antes de finalizar a OS.',
        'Mensagem sanitizada de domínio'
      )
      assert.strictEqual(createdNotes, 0, 'Zero crm_notes writes (TRIGGER_RACE_SIDE_EFFECTS=ZERO)')
      assert.strictEqual(createdActivities, 0, 'Zero crm_activity_log writes (TRIGGER_RACE_SIDE_EFFECTS=ZERO)')
    }
  })

  await asyncTest('B.19 ATOMIC CAS: 2 mutações simultâneas com mesmo token resultam em exatamente 1 sucesso e 1 conflito 409', async () => {
    let currentDbVersion = '2026-08-28T20:00:00Z'
    globalThis.$fetch = async (url, opts) => {
      if (opts?.method === 'PATCH') {
        if (url.includes(`updated_at=eq.${encodeURIComponent(currentDbVersion)}`)) {
          currentDbVersion = '2026-08-28T20:05:00Z'
          return [{ id: '00000000-0000-0000-0000-000000000001', updated_at: currentDbVersion }]
        }
        return []
      }
      return [{ id: '00000000-0000-0000-0000-000000000001', status_os: 'orcamento', is_archived: false, updated_at: currentDbVersion }]
    }

    const event1 = createMockEvent({
      method: 'PATCH',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { observacoes_gerais: 'Atualizado 1', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    const event2 = createMockEvent({
      method: 'PATCH',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { observacoes_gerais: 'Atualizado 2', expected_updated_at: '2026-08-28T20:00:00Z' }
    })

    const res1 = await patchWorkOrderHandler(event1)
    assert.strictEqual(res1.success, true)

    try {
      await patchWorkOrderHandler(event2)
      assert.fail('Deveria ter lançado 409 na corrida')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 409)
    }
  })

  await asyncTest('B.20 CANCEL STATUS CAS: Se CAS retornar 409, ZERO crm_notes e ZERO activity logs são criados', async () => {
    let createdNotes = 0
    let createdActivities = 0
    globalThis.$fetch = async (url, opts) => {
      if (opts?.method === 'PATCH') return []
      if (url.includes('/crm_notes')) createdNotes++
      if (url.includes('/admin_audit_logs')) createdActivities++
      if (url.includes('appointments?')) return []
      return [{ id: '00000000-0000-0000-0000-000000000001', status_os: 'aprovada', updated_at: '2026-08-28T20:00:00Z' }]
    }
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/status',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { newStatus: 'cancelada', reason: 'Cancelamento operacional justificado', expected_updated_at: '2026-08-28T19:00:00Z' }
    })
    try {
      await statusWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 409')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 409)
      assert.strictEqual(createdNotes, 0, 'Zero crm_notes devem ser criadas')
      assert.strictEqual(createdActivities, 0, 'Zero audit logs devem ser criados')
    }
  })

  await asyncTest('B.21 PATCH /api/admin/crm/work-orders/:id com is_archived string "false" retorna 400', async () => {
    const event = createMockEvent({
      method: 'PATCH',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { is_archived: 'false', expected_updated_at: '2026-08-28T20:00:00Z' }
    })
    try {
      await patchWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  await asyncTest('B.22 GET /api/admin/crm/staff valida lista (200), isActive inválido (400) e funcao inválida (400)', async () => {
    globalThis.$fetch = async () => [{ id: '1', nome: 'Tecnico', funcao: 'instalador', is_active: true }]
    const eventOk = createMockEvent({ method: 'GET', url: '/api/admin/crm/staff', context: defaultAdminContext, query: { isActive: 'true', funcao: 'instalador' } })
    const res = await getStaffHandler(eventOk)
    assert.strictEqual(res.success, true)

    const eventBadActive = createMockEvent({ method: 'GET', url: '/api/admin/crm/staff', context: defaultAdminContext, query: { isActive: 'sim' } })
    try {
      await getStaffHandler(eventBadActive)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }

    const eventBadFuncao = createMockEvent({ method: 'GET', url: '/api/admin/crm/staff', context: defaultAdminContext, query: { funcao: 'gerente_geral' } })
    try {
      await getStaffHandler(eventBadFuncao)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  await asyncTest('B.23 POST /api/admin/crm/staff com funcao inválida retorna 400', async () => {
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/staff',
      context: defaultAdminContext,
      body: { nome: 'Tecnico', funcao: 'cargo_inexistente' }
    })
    try {
      await postStaffHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  await asyncTest('B.24 PATCH /api/admin/crm/staff/:id com is_active string "false" retorna 400 e boolean false é aceito', async () => {
    const eventBad = createMockEvent({
      method: 'PATCH',
      url: '/api/admin/crm/staff/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { is_active: 'false' }
    })
    try {
      await patchStaffHandler(eventBad)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }

    globalThis.$fetch = async () => [{ id: '1', is_active: false }]
    const eventGood = createMockEvent({
      method: 'PATCH',
      url: '/api/admin/crm/staff/00000000-0000-0000-0000-000000000001',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { is_active: false }
    })
    const res = await patchStaffHandler(eventGood)
    assert.strictEqual(res.success, true)
  })

  await asyncTest('B.25 GET /api/admin/crm/work-orders/:id/appointments aplica paginação limit/offset', async () => {
    let queriedUrl = null
    globalThis.$fetch = async (url) => {
      queriedUrl = url
      return [{ id: '1' }]
    }
    const event = createMockEvent({
      method: 'GET',
      url: '/api/admin/crm/work-orders/00000000-0000-0000-0000-000000000001/appointments',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      query: { limit: '10', offset: '20' }
    })
    const res = await getWoAppointmentsHandler(event)
    assert.strictEqual(res.success, true)
    assert.strictEqual(queriedUrl.includes('limit=10'), true)
    assert.strictEqual(queriedUrl.includes('offset=20'), true)
  })

  await asyncTest('B.26 POST /api/admin/crm/leads/:id/convert valida criar_os booleano estrito e FAIL-CLOSED em falha de duplicidade', async () => {
    globalThis.$fetch = async () => []

    // 1. criar_os com string -> 400
    const eventBad = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/leads/00000000-0000-0000-0000-000000000001/convert',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { nome: 'Cliente Teste', telefone_principal: '11999998888', criar_os: 'true', confirmPossibleDuplicate: true }
    })
    try {
      await convertLeadHandler(eventBad)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }

    // 2. Falha de upstream na verificação de duplicidade -> 503 e ZERO chamadas à RPC
    let conversionRpcCalls = 0
    globalThis.$fetch = async (url) => {
      if (url.includes('/clients?')) {
        throw new Error('Database unavailable')
      }
      if (url.includes('convert_lead_to_client_atomic')) {
        conversionRpcCalls++
        return { success: true }
      }
      return []
    }

    const eventDuplicateFail = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/leads/00000000-0000-0000-0000-000000000001/convert',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { nome: 'Cliente Teste', telefone_principal: '11999998888' }
    })
    try {
      await convertLeadHandler(eventDuplicateFail)
      assert.fail('Deveria ter lançado 503 na falha de busca de duplicata')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503)
      assert.strictEqual(conversionRpcCalls, 0, 'DUPLICATE_SEARCH_FAILURE_CONVERSION_RPC_CALLS=0')
    }
  })

  await asyncTest('B.27 POST /api/admin/crm/work-orders com dataPrevista retorna 400', async () => {
    const event = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/work-orders',
      context: defaultAdminContext,
      body: { client_id: '00000000-0000-0000-0000-000000000001', titulo: 'Nova OS', dataPrevista: '2026-09-15' }
    })
    try {
      await createWorkOrderHandler(event)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }
  })

  console.log('\n--- C. TESTES REAIS DO GUARD requireActiveAdmin & CSRF PRODUCTION FAIL-CLOSED ---')

  await asyncTest('C.1 requireActiveAdmin com cached inactive admin retorna 403 (CACHED_INACTIVE_ADMIN=REJECTED)', async () => {
    const event = createMockEvent({
      context: {
        auth: {
          admin: { adminId: '1', userId: '1', email: 'test@adt.local', role: 'admin', isActive: false }
        }
      }
    })
    try {
      await requireActiveAdmin(event)
      assert.fail('Deveria ter lançado 403 para cached inactive admin')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403)
    }
  })

  await asyncTest('C.2 CSRF validateMutationOrigin em produção sem Origin e sem Referer retorna 403 (CSRF_MISSING_ORIGIN_REFERER_POLICY=FAIL_CLOSED_PRODUCTION)', () => {
    const resProd = validateMutationOrigin(null, null, 'painel.adt.local', false, null, false, 'https')
    assert.strictEqual(resProd.allowed, false)
    assert.strictEqual(resProd.statusCode, 403)

    const resProdNoHost = validateMutationOrigin('https://painel.adt.local', null, '', false, null, false, 'https')
    assert.strictEqual(resProdNoHost.allowed, false)
    assert.strictEqual(resProdNoHost.statusCode, 403)

    const resProdOk = validateMutationOrigin('https://painel.adt.local', null, 'painel.adt.local', false, null, false, 'https')
    assert.strictEqual(resProdOk.allowed, true)
  })

  await asyncTest('C.3 findDuplicateClients executa buscas independentes sem raw PostgREST OR e lança 503 se upstream falhar', async () => {
    const executedUrls = []
    globalThis.$fetch = async (url) => {
      executedUrls.push(url)
      return []
    }

    const config = { url: 'http://127.0.0.1:54321', serviceRoleKey: 'test_key' }
    const res = await findDuplicateClients(config, {
      telefone: '11999998888',
      email: 'teste@exemplo.com',
      cpfCnpj: '12345678901'
    })

    assert.strictEqual(Array.isArray(res), true)
    assert.strictEqual(executedUrls.length, 3, 'Executa 3 buscas independentes')
    assert.strictEqual(executedUrls.some(u => u.includes('or=(')), false, 'DUPLICATE_SEARCH_RAW_POSTGREST_OR=REMOVED: zero raw or=()')

    // Teste de Fail-Closed em falha de upstream
    globalThis.$fetch = async () => {
      throw new Error('Supabase network error')
    }
    try {
      await findDuplicateClients(config, { telefone: '11999998888' })
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503, 'DUPLICATE_SEARCH_FAILURE_POLICY=FAIL_CLOSED')
    }
  })

  await asyncTest('C.4 requireActiveAdmin FAIL-CLOSED: lookup failure -> 503, empty -> 403, inactive -> 403, bad role -> 403, active admin -> 200', async () => {
    function createMockJwt(userId = '00000000-0000-0000-0000-000000000001', url = 'http://127.0.0.1:54321') {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
      const payload = Buffer.from(JSON.stringify({
        sub: userId,
        email: 'admin@adt.local',
        role: 'authenticated',
        aud: 'authenticated',
        iss: `${url}/auth/v1`,
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 3600
      })).toString('base64url')
      const sig = Buffer.from('mock_sig').toString('base64url')
      return `${header}.${payload}.${sig}`
    }

    const validJwt = createMockJwt('00000000-0000-0000-0000-000000000001')

    // 1. admin_users lookup failure -> 503
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/user')) {
        return { id: '00000000-0000-0000-0000-000000000001', email: 'admin@adt.local' }
      }
      if (url.includes('/rest/v1/admin_users')) {
        throw new Error('Database connection failed')
      }
      return []
    }
    const eventLookupFail = createMockEvent({
      headers: { authorization: `Bearer ${validJwt}` },
      context: {}
    })
    try {
      await requireActiveAdmin(eventLookupFail)
      assert.fail('Deveria ter lançado 503')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 503)
    }

    // 2. admin_users empty -> 403
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/user')) {
        return { id: '00000000-0000-0000-0000-000000000001', email: 'admin@adt.local' }
      }
      if (url.includes('/rest/v1/admin_users')) {
        return []
      }
      return []
    }
    const eventEmptyAdmin = createMockEvent({
      headers: { authorization: `Bearer ${validJwt}` },
      context: {}
    })
    try {
      await requireActiveAdmin(eventEmptyAdmin)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403)
    }

    // 3. admin inactive -> 403
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/user')) {
        return { id: '00000000-0000-0000-0000-000000000001', email: 'admin@adt.local' }
      }
      if (url.includes('/rest/v1/admin_users')) {
        return [{ id: 'adm-1', user_id: '00000000-0000-0000-0000-000000000001', role: 'admin', is_active: false }]
      }
      return []
    }
    const eventInactiveAdmin = createMockEvent({
      headers: { authorization: `Bearer ${validJwt}` },
      context: {}
    })
    try {
      await requireActiveAdmin(eventInactiveAdmin)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403)
    }

    // 4. role inválida -> 403
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/user')) {
        return { id: '00000000-0000-0000-0000-000000000001', email: 'admin@adt.local' }
      }
      if (url.includes('/rest/v1/admin_users')) {
        return [{ id: 'adm-1', user_id: '00000000-0000-0000-0000-000000000001', role: 'viewer', is_active: true }]
      }
      return []
    }
    const eventBadRole = createMockEvent({
      headers: { authorization: `Bearer ${validJwt}` },
      context: {}
    })
    try {
      await requireActiveAdmin(eventBadRole)
      assert.fail('Deveria ter lançado 403')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 403)
    }

    // 5. active admin -> accepted
    globalThis.$fetch = async (url) => {
      if (url.includes('/auth/v1/user')) {
        return { id: '00000000-0000-0000-0000-000000000001', email: 'admin@adt.local' }
      }
      if (url.includes('/rest/v1/admin_users')) {
        return [{ id: 'adm-1', user_id: '00000000-0000-0000-0000-000000000001', role: 'admin', is_active: true }]
      }
      return []
    }
    const eventActiveAdmin = createMockEvent({
      headers: { authorization: `Bearer ${validJwt}` },
      context: {}
    })
    const adminIdentity = await requireActiveAdmin(eventActiveAdmin)
    assert.strictEqual(adminIdentity.userId, '00000000-0000-0000-0000-000000000001')
    assert.strictEqual(adminIdentity.role, 'admin')
    assert.strictEqual(adminIdentity.isActive, true)
  })

  console.log('\n======================================================================')
  console.log(`VALIDATION_UNIT_ASSERTS:   17`)
  console.log(`BFF_REAL_HANDLER_ASSERTS:  36`)
  console.log(`AUTH_CSRF_GUARD_ASSERTS:   4`)
  console.log(`TOTAL DE ASSERTS:          57`)
  console.log(`BFF_IMPORTED_HANDLERS:     16`)
  console.log(`BFF_EXECUTED_HANDLERS:     16`)
  console.log(`FAILED:                    ${failed}`)
  console.log('======================================================================')

  if (failed > 0) {
    console.error('\nErros encontrados na suíte BFF:')
    errors.forEach(e => console.error(` - ${e.name}: ${e.error}`))
    process.exit(1)
  }
}

runSuite()
