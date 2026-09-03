/**
 * GET /api/admin/crm/appointments
 * Consulta estruturada de compromissos da Agenda para visualização em Calendário.
 * Range máximo permitido: 62 dias. Sem busca textual de PII via query string.
 *
 * PHASE_5_0D_0: Embeddings de FK composta corrigidos via !constraint_name.
 * O campo client é normalizado do work_order.client para a raiz do objeto
 * para compatibilidade com o contrato TypeScript CrmAppointmentSummary.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../utils/crm.ts'
import {
  isValidAppointmentDateRange,
  isValidAppointmentStatus,
  isValidAppointmentType,
  isValidRfc3339,
  isValidUUID
} from '../../../../shared/appointmentValidation.mjs'
import { APPOINTMENT_CALENDAR_SELECT } from '../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado no servidor' })
  }

  const query = getQuery(event)
  const startStr = typeof query.start === 'string' ? query.start.trim() : ''
  const endStr = typeof query.end === 'string' ? query.end.trim() : ''

  if (!startStr || !endStr) {
    throw createError({
      statusCode: 400,
      message: 'Os parâmetros temporais "start" e "end" são obrigatórios.'
    })
  }

  if (!isValidRfc3339(startStr) || !isValidRfc3339(endStr)) {
    throw createError({
      statusCode: 400,
      message: 'Os parâmetros "start" e "end" devem ser timestamps RFC3339 válidos com timezone explícito.'
    })
  }

  if (!isValidAppointmentDateRange(startStr, endStr, 62)) {
    throw createError({
      statusCode: 400,
      message: 'Intervalo de calendário inválido. O range máximo permitido é de 62 dias e a data de início deve ser anterior à de fim.'
    })
  }

  const params: string[] = [
    `select=${APPOINTMENT_CALENDAR_SELECT}`,
    `data_hora_fim=gt.${encodeURIComponent(startStr)}`,
    `data_hora_inicio=lt.${encodeURIComponent(endStr)}`,
    'order=data_hora_inicio.asc'
  ]

  const rawStaffId = (query.staff_id !== undefined ? query.staff_id : query.staffId) as string | undefined
  if (rawStaffId !== undefined && rawStaffId !== null && rawStaffId !== '') {
    if (typeof rawStaffId !== 'string' || !isValidUUID(rawStaffId)) {
      throw createError({ statusCode: 400, message: 'Parâmetro staff_id inválido. Deve ser um UUID válido.' })
    }
    params.push(`staff_id=eq.${encodeURIComponent(rawStaffId.trim())}`)
  }

  if (query.status !== undefined && query.status !== null && query.status !== '') {
    if (typeof query.status !== 'string' || !isValidAppointmentStatus(query.status.trim())) {
      throw createError({ statusCode: 400, message: 'Parâmetro status inválido.' })
    }
    params.push(`status_agendamento=eq.${encodeURIComponent(query.status.trim())}`)
  }

  if (query.tipo !== undefined && query.tipo !== null && query.tipo !== '') {
    if (typeof query.tipo !== 'string' || !isValidAppointmentType(query.tipo.trim())) {
      throw createError({ statusCode: 400, message: 'Parâmetro tipo inválido.' })
    }
    params.push(`tipo_agendamento=eq.${encodeURIComponent(query.tipo.trim())}`)
  }

  try {
    const raw = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/appointments?${params.join('&')}`,
      { headers: getSupabaseHeaders(config.supabaseServiceRoleKey) }
    )

    // Normalizar client do work_order.client para a raiz do objeto,
    // mantendo o contrato CrmAppointmentSummary: appt.client?.nome
    const appointments = Array.isArray(raw)
      ? raw.map((appt: any) => {
          const clientFromWo = appt?.work_order?.client ?? null
          return {
            ...appt,
            client: clientFromWo,
            work_order: appt?.work_order
              ? { id: appt.work_order.id, numero_os: appt.work_order.numero_os, status_os: appt.work_order.status_os }
              : null
          }
        })
      : []

    return { success: true, appointments }
  } catch (err: any) {
    const statusCode = err?.statusCode || err?.response?.status || err?.status || 'unknown'
    const rawCode = err?.code || err?.data?.code
    const technicalCode = (typeof rawCode === 'string' && /^[A-Z0-9_]{3,20}$/i.test(rawCode.trim()))
      ? rawCode.trim()
      : 'NONE'
    console.error(`[AppointmentsList] route=GET /api/admin/crm/appointments status=${statusCode} errorCode=${technicalCode}`)
    throw createError({ statusCode: 500, message: 'Não foi possível carregar os agendamentos da agenda.' })
  }
})
