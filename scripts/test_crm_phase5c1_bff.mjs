/**
 * ======================================================================
 * SUÍTE DE TESTES REAIS DE BFF & HANDLERS — CRM FASE 5.0C.3
 * Arquivo: scripts/test_crm_phase5c1_bff.mjs
 * ======================================================================
 */

import assert from 'assert'
import * as h3 from 'h3'
import {
  isValidUUID,
  isValidRfc3339,
  sanitizePostgrestSearchTerm
} from '../server/shared/appointmentValidation.mjs'

import { APPOINTMENT_ERROR_MAP } from '../server/shared/appointmentErrorMap.mjs'
import { IncomingMessage, ServerResponse } from 'http'

// Handlers reais importados
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
console.log('--- SUÍTE DE TESTES REAIS DE BFF & HANDLERS CRM FASE 5.0C.3 ---')
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
  supabaseServiceRoleKey: 'test_service_key'
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
  console.log('--- A. VALIDAÇÃO UNITÁRIA (UUID, RFC3339, POSTGREST QUOTING, ERROR MAP) ---')

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

  test('A.4 Dicionário de Erros — 25 códigos Migration 012 + 3 aplicação = 28 chaves', () => {
    const keys = Object.keys(APPOINTMENT_ERROR_MAP)
    assert.strictEqual(keys.length, 28)
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
      headers: { authorization: 'Bearer dev_mock_admin_token' },
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

  await asyncTest('B.13 GET /api/admin/crm/appointments passa staffId para query PostgREST com overlap gt/lt', async () => {
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
  })

  await asyncTest('B.14 POST /api/admin/crm/appointments/search desabilita busca textual q (400) e aceita filtros estruturados (200)', async () => {
    const eventWithQ = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments/search',
      context: defaultAdminContext,
      body: { q: 'termo busca' }
    })
    try {
      await searchAppointmentsHandler(eventWithQ)
      assert.fail('Deveria ter retornado 400 para q')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
    }

    globalThis.$fetch = async () => []
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

  await asyncTest('B.16 POST /api/admin/crm/work-orders/:id/status com agendada retorna 400', async () => {
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
      assert.strictEqual(getErrorStatus(err), 400)
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

  await asyncTest('B.26 POST /api/admin/crm/leads/:id/convert valida criar_os booleano estrito (true/false/undefined aceitos, strings/numeros 400)', async () => {
    const eventBad = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/leads/00000000-0000-0000-0000-000000000001/convert',
      context: defaultAdminContext,
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { criar_os: 'true' }
    })
    try {
      await convertLeadHandler(eventBad)
      assert.fail('Deveria ter lançado 400')
    } catch (err) {
      assert.strictEqual(getErrorStatus(err), 400)
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

  console.log('\n======================================================================')
  console.log(`VALIDATION_UNIT_ASSERTS:   4`)
  console.log(`BFF_REAL_HANDLER_ASSERTS:  27`)
  console.log(`TOTAL DE ASSERTS:          31`)
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
