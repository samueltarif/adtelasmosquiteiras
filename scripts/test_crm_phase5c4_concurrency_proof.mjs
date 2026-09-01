/**
 * Teste de Prova de Concorrência — Patch 5.0C.4.1
 * Terminal Work Order × Concurrent Active Appointment Race Condition Proof
 * Arquivo: scripts/test_crm_phase5c4_concurrency_proof.mjs
 */

import assert from 'node:assert/strict'
import * as h3 from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import statusWorkOrderHandler from '../server/api/admin/crm/work-orders/[id]/status.post.ts'
import createAppointmentHandler from '../server/api/admin/crm/appointments/index.post.ts'

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
  event.node.req._body = body
  event._body = body
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

/**
 * Simulação de Estado Compartilhado de Banco de Dados com Semântica de PostgreSQL 17 / PostgREST
 */
class SharedDatabaseState {
  constructor(initialWorkOrder, initialAppointments = []) {
    this.workOrder = { ...initialWorkOrder }
    this.appointments = [...initialAppointments]
    this.activityLogs = []
    this.notes = []
    this.woLock = false
  }

  // PostgREST GET work_orders
  async getWorkOrder(id) {
    if (this.workOrder.id === id) {
      return [{ ...this.workOrder }]
    }
    return []
  }

  // PostgREST GET appointments (hasAnyActiveAppointment)
  async getActiveAppointments(workOrderId) {
    return this.appointments.filter(
      (a) =>
        a.work_order_id === workOrderId &&
        ['agendado', 'confirmado', 'em_deslocamento'].includes(a.status_agendamento)
    )
  }

  // PostgREST PATCH work_orders with CAS (id + updated_at)
  async patchWorkOrderCas(id, expectedUpdatedAt, updates) {
    if (this.workOrder.id === id && this.workOrder.updated_at === expectedUpdatedAt) {
      this.workOrder = {
        ...this.workOrder,
        ...updates,
        updated_at: new Date().toISOString()
      }
      return [{ ...this.workOrder }]
    }
    return [] // CAS conflict / stale version
  }

  // RPC create_appointment_atomic (Migration 012)
  async createAppointmentAtomic(payload) {
    // 1. SELECT ... FROM work_orders WHERE id = p_work_order_id FOR UPDATE
    const wo = { ...this.workOrder }
    if (!wo.id || wo.id !== payload.p_work_order_id) {
      throw { message: 'ERR_WORK_ORDER_NOT_FOUND: Ordem de Servico nao encontrada.' }
    }
    if (wo.is_archived) {
      throw { message: 'ERR_WORK_ORDER_ARCHIVED: Nao e permitido agendar em OS arquivada.' }
    }

    // 2. Validações de tipo e status da OS
    if (payload.p_tipo_agendamento === 'instalacao' && !['aprovada', 'aguardando_agendamento'].includes(wo.status_os)) {
      throw { message: `ERR_INSTALLATION_WORK_ORDER_STATUS: Instalacao exige OS aprovada ou aguardando_agendamento. Status: ${wo.status_os}` }
    }
    if (['visita_tecnica', 'medicao'].includes(payload.p_tipo_agendamento) && !['orcamento', 'aprovada', 'aguardando_agendamento'].includes(wo.status_os)) {
      throw { message: 'ERR_QUOTE_WORK_ORDER_STATUS: Visita/Medicao permitida apenas em orcamento, aprovada ou aguardando_agendamento.' }
    }
    if (payload.p_tipo_agendamento === 'manutencao' && ['orcamento', 'concluida', 'cancelada'].includes(wo.status_os)) {
      throw { message: 'ERR_MAINTENANCE_WORK_ORDER_STATUS: Manutencao exige OS operacional em aberto.' }
    }

    // 3. Insert into appointments
    const newAppt = {
      id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      work_order_id: payload.p_work_order_id,
      client_id: wo.client_id,
      tipo_agendamento: payload.p_tipo_agendamento,
      status_agendamento: 'agendado',
      data_hora_inicio: payload.p_data_hora_inicio,
      data_hora_fim: payload.p_data_hora_fim,
      staff_id: payload.p_staff_id || null,
      address_id: payload.p_address_id || null,
      observacoes: payload.p_observacoes || null,
      updated_at: new Date().toISOString()
    }
    this.appointments.push(newAppt)

    // 4. Update work_orders se tipo == instalacao
    if (payload.p_tipo_agendamento === 'instalacao') {
      this.workOrder = {
        ...this.workOrder,
        status_os: 'agendada',
        data_prevista: payload.p_data_hora_inicio.slice(0, 10),
        updated_at: new Date().toISOString()
      }
    }
    // NOTA: Para manutencao, visita_tecnica e medicao, create_appointment_atomic NÃO altera updated_at de work_orders!

    return newAppt
  }

  // Verifica o invariante canônico
  checkInvariant(workOrderId) {
    const isTerminal = ['concluida', 'cancelada'].includes(this.workOrder.status_os)
    const activeAppts = this.appointments.filter(
      (a) =>
        a.work_order_id === workOrderId &&
        ['agendado', 'confirmado', 'em_deslocamento'].includes(a.status_agendamento)
    )

    const violated = isTerminal && activeAppts.length > 0
    return {
      violated,
      workOrderStatus: this.workOrder.status_os,
      activeAppointmentCount: activeAppts.length,
      activeAppointments: activeAppts
    }
  }
}

async function runConcurrencyProof() {
  const origWarn = console.warn
  console.warn = (...args) => {
    if (args[0] && String(args[0]).includes('[h3]')) return
    origWarn(...args)
  }

  console.log('======================================================================')
  console.log('PATCH 5.0C.4.1 — CONCURRENCY INVARIANT PROOF')
  console.log('Terminal Work Order × Concurrent Active Appointment Race Condition')
  console.log('======================================================================\n')

  const ITERATIONS = 50
  let scenario1Races = 0
  let scenario2Races = 0

  // -------------------------------------------------------------------------
  // CENÁRIO 1: OS = em_execucao -> Conclusão Concorrente com Manutenção Ativa
  // REQUEST A: POST /api/admin/crm/work-orders/:id/status (target=concluida)
  // REQUEST B: POST /api/admin/crm/appointments (tipo=manutencao)
  // -------------------------------------------------------------------------
  console.log(`[CENÁRIO 1] Executando ${ITERATIONS} iterações concorrentes com barreira de interleaving...`)
  console.log('  Estado inicial: OS=em_execucao, zero agendamentos ativos')
  console.log('  Request A: status -> concluida')
  console.log('  Request B: appointment create (tipo=manutencao)\n')

  for (let i = 1; i <= ITERATIONS; i++) {
    const workOrderId = '00000000-0000-0000-0000-000000000001'
    const initialUpdatedAt = '2026-08-31T10:00:00.000Z'

    const db = new SharedDatabaseState({
      id: workOrderId,
      client_id: 'client-1',
      numero_os: 'OS-100',
      status_os: 'em_execucao',
      is_archived: false,
      updated_at: initialUpdatedAt
    })

    // Barreira assíncrona real de interleaving
    let resolveA_checked
    const barrierA_checked = new Promise((r) => { resolveA_checked = r })
    let resolveB_created
    const barrierB_created = new Promise((r) => { resolveB_created = r })

    globalThis.$fetch = async (url, opts = {}) => {
      // 1. GET work_orders
      if (url.includes('/rest/v1/work_orders?id=eq.') && (!opts.method || opts.method === 'GET')) {
        return db.getWorkOrder(workOrderId)
      }

      // 2. GET appointments (hasAnyActiveAppointment)
      if (url.includes('/rest/v1/appointments?work_order_id=eq.')) {
        const active = await db.getActiveAppointments(workOrderId)
        // Libera Request B para criar o appointment após Request A ter verificado
        resolveA_checked()
        // Aguarda Request B concluir a criação antes de prosseguir com o CAS
        await barrierB_created
        return active
      }

      // 3. PATCH work_orders (CAS)
      if (opts.method === 'PATCH' && url.includes('/rest/v1/work_orders?id=eq.')) {
        const match = url.match(/updated_at=eq\.([^&]+)/)
        const expected = match ? decodeURIComponent(match[1]) : null
        return db.patchWorkOrderCas(workOrderId, expected, opts.body)
      }

      // 4. RPC create_appointment_atomic
      if (url.includes('/rest/v1/rpc/create_appointment_atomic')) {
        // Aguarda Request A executar hasAnyActiveAppointment primeiro
        await barrierA_checked
        const res = await db.createAppointmentAtomic(opts.body)
        // Libera Request A para executar o CAS após o appointment ter sido criado
        resolveB_created()
        return res
      }

      // 5. GET appointment detail após criação
      if (url.includes('/rest/v1/appointments?id=eq.')) {
        return [{ id: 'appt-1', work_order_id: workOrderId, status_agendamento: 'agendado' }]
      }

      if (url.includes('/crm_notes') || url.includes('/admin_audit_logs')) {
        return [{ id: 'logged' }]
      }

      return []
    }

    const eventStatus = createMockEvent({
      method: 'POST',
      url: `/api/admin/crm/work-orders/${workOrderId}/status`,
      context: defaultAdminContext,
      params: { id: workOrderId },
      body: { newStatus: 'concluida', expected_updated_at: initialUpdatedAt }
    })

    const eventAppt = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments',
      context: defaultAdminContext,
      body: {
        work_order_id: workOrderId,
        tipo_agendamento: 'manutencao',
        data_hora_inicio: '2026-09-01T10:00:00-03:00',
        data_hora_fim: '2026-09-01T12:00:00-03:00',
        observacoes: 'Manutencao concorrente'
      }
    })

    const [resA, resB] = await Promise.allSettled([
      statusWorkOrderHandler(eventStatus),
      createAppointmentHandler(eventAppt)
    ])

    const inv = db.checkInvariant(workOrderId)
    if (i === 1) {
      console.log(`  Iteração 1 (Exemplo):`)
      console.log(`    Request A (Status Concluida): ${resA.status === 'fulfilled' ? '200 OK' : resA.reason?.message}`)
      console.log(`    Request B (Create Manutencao): ${resB.status === 'fulfilled' ? '200 OK' : resB.reason?.message}`)
      console.log(`    DB Final: status_os='${db.workOrder.status_os}', appts=${db.appointments.length}, violated=${inv.violated}`)
    }
    if (inv.violated) {
      scenario1Races++
      console.log(`  [RACE REPRODUCED na Iteração ${i}]:`)
      console.log(`    Request A (Status Concluida): ${resA.status === 'fulfilled' ? 'SUCESSO (200)' : 'FALHA'}`)
      console.log(`    Request B (Create Manutencao): ${resB.status === 'fulfilled' ? 'SUCESSO (200)' : 'FALHA'}`)
      console.log(`    Estado Final do Banco: status_os = '${inv.workOrderStatus}', agendamentos ativos = ${inv.activeAppointmentCount}`)
    }
  }

  console.log(`\n  Cenário 1 Concluído: ${scenario1Races}/${ITERATIONS} corridas reproduzidas com violação de invariante.\n`)

  // -------------------------------------------------------------------------
  // CENÁRIO 2: OS = aprovada -> Cancelamento Concorrente com Visita Técnica
  // REQUEST A: POST /api/admin/crm/work-orders/:id/status (target=cancelada)
  // REQUEST B: POST /api/admin/crm/appointments (tipo=visita_tecnica)
  // -------------------------------------------------------------------------
  console.log(`[CENÁRIO 2] Executando ${ITERATIONS} iterações concorrentes (Cancelamento × Visita Técnica)...`)
  console.log('  Estado inicial: OS=aprovada, zero agendamentos ativos')
  console.log('  Request A: status -> cancelada (com motivo)')
  console.log('  Request B: appointment create (tipo=visita_tecnica)\n')

  for (let i = 1; i <= ITERATIONS; i++) {
    const workOrderId = '00000000-0000-0000-0000-000000000002'
    const initialUpdatedAt = '2026-08-31T10:00:00.000Z'

    const db = new SharedDatabaseState({
      id: workOrderId,
      client_id: 'client-2',
      numero_os: 'OS-200',
      status_os: 'aprovada',
      is_archived: false,
      updated_at: initialUpdatedAt
    })

    let resolveA_checked
    const barrierA_checked = new Promise((r) => { resolveA_checked = r })
    let resolveB_created
    const barrierB_created = new Promise((r) => { resolveB_created = r })

    globalThis.$fetch = async (url, opts = {}) => {
      if (url.includes('/rest/v1/work_orders?id=eq.') && (!opts.method || opts.method === 'GET')) {
        return db.getWorkOrder(workOrderId)
      }
      if (url.includes('/rest/v1/appointments?work_order_id=eq.')) {
        const active = await db.getActiveAppointments(workOrderId)
        resolveA_checked()
        await barrierB_created
        return active
      }
      if (opts.method === 'PATCH' && url.includes('/rest/v1/work_orders?id=eq.')) {
        const match = url.match(/updated_at=eq\.([^&]+)/)
        const expected = match ? decodeURIComponent(match[1]) : null
        return db.patchWorkOrderCas(workOrderId, expected, opts.body)
      }
      if (url.includes('/rest/v1/rpc/create_appointment_atomic')) {
        await barrierA_checked
        const res = await db.createAppointmentAtomic(opts.body)
        resolveB_created()
        return res
      }
      if (url.includes('/rest/v1/appointments?id=eq.')) {
        return [{ id: 'appt-2', work_order_id: workOrderId, status_agendamento: 'agendado' }]
      }
      if (url.includes('/crm_notes') || url.includes('/admin_audit_logs')) {
        return [{ id: 'logged' }]
      }
      return []
    }

    const eventStatus = createMockEvent({
      method: 'POST',
      url: `/api/admin/crm/work-orders/${workOrderId}/status`,
      context: defaultAdminContext,
      params: { id: workOrderId },
      body: { newStatus: 'cancelada', reason: 'Cancelamento concorrente com visita', expected_updated_at: initialUpdatedAt }
    })

    const eventAppt = createMockEvent({
      method: 'POST',
      url: '/api/admin/crm/appointments',
      context: defaultAdminContext,
      body: {
        work_order_id: workOrderId,
        tipo_agendamento: 'visita_tecnica',
        data_hora_inicio: '2026-09-02T14:00:00-03:00',
        data_hora_fim: '2026-09-02T15:00:00-03:00',
        observacoes: 'Visita técnica concorrente'
      }
    })

    const [resA, resB] = await Promise.allSettled([
      statusWorkOrderHandler(eventStatus),
      createAppointmentHandler(eventAppt)
    ])

    const inv = db.checkInvariant(workOrderId)
    if (inv.violated) {
      scenario2Races++
      if (scenario2Races === 1) {
        console.log(`  [RACE REPRODUCED na Iteração ${i}]:`)
        console.log(`    Request A (Status Cancelada): ${resA.status === 'fulfilled' ? 'SUCESSO (200)' : 'FALHA'}`)
        console.log(`    Request B (Create Visita): ${resB.status === 'fulfilled' ? 'SUCESSO (200)' : 'FALHA'}`)
        console.log(`    Estado Final do Banco: status_os = '${inv.workOrderStatus}', agendamentos ativos = ${inv.activeAppointmentCount}`)
      }
    }
  }

  console.log(`\n  Cenário 2 Concluído: ${scenario2Races}/${ITERATIONS} corridas reproduzidas com violação de invariante.\n`)

  console.log('======================================================================')
  console.log(`TOTAL DE ITERAÇÕES EXECUTADAS: ${ITERATIONS * 2}`)
  console.log(`CORRIDAS REPRODUZIDAS:        ${scenario1Races + scenario2Races}`)
  console.log(`TERMINAL_ACTIVE_APPOINTMENT_RACE_REPRODUCED = ${scenario1Races + scenario2Races > 0 ? 'YES' : 'NO'}`)
  console.log('======================================================================')
}

runConcurrencyProof()
