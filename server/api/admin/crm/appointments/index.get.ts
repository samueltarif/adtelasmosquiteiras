/**
 * GET /api/admin/crm/appointments
 * Consulta estruturada de compromissos da Agenda para visualização em Calendário.
 * Range máximo permitido: 62 dias. Sem busca textual de PII via query string.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../utils/crm.ts'
import { isValidAppointmentDateRange, isValidAppointmentStatus, isValidAppointmentType, isValidUUID } from '../../../../shared/appointmentValidation.mjs'
import { APPOINTMENT_CALENDAR_SELECT } from '../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const query = getQuery(event)
  const startStr = typeof query.start === 'string' ? query.start.trim() : ''
  const endStr = typeof query.end === 'string' ? query.end.trim() : ''

  if (!startStr || !endStr) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Os parâmetros temporais "start" e "end" (ISO 8601) são obrigatórios.'
    })
  }

  if (!isValidAppointmentDateRange(startStr, endStr, 62)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Intervalo de calendário inválido. O range máximo permitido é de 62 dias e a data de início deve ser anterior à de fim.'
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
      throw createError({ statusCode: 400, statusMessage: 'Parâmetro staff_id inválido. Deve ser um UUID válido.' })
    }
    params.push(`staff_id=eq.${encodeURIComponent(rawStaffId.trim())}`)
  }

  if (query.status !== undefined && query.status !== null && query.status !== '') {
    if (typeof query.status !== 'string' || !isValidAppointmentStatus(query.status.trim())) {
      throw createError({ statusCode: 400, statusMessage: 'Parâmetro status inválido.' })
    }
    params.push(`status_agendamento=eq.${encodeURIComponent(query.status.trim())}`)
  }

  if (query.tipo !== undefined && query.tipo !== null && query.tipo !== '') {
    if (typeof query.tipo !== 'string' || !isValidAppointmentType(query.tipo.trim())) {
      throw createError({ statusCode: 400, statusMessage: 'Parâmetro tipo inválido.' })
    }
    params.push(`tipo_agendamento=eq.${encodeURIComponent(query.tipo.trim())}`)
  }

  try {
    const appointments = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/appointments?${params.join('&')}`,
      { headers: getSupabaseHeaders(config.supabaseServiceRoleKey) }
    )

    return {
      success: true,
      appointments: Array.isArray(appointments) ? appointments : []
    }
  } catch (err: any) {
    console.error('[AppointmentsList] Erro ao consultar compromissos. Status:', err?.statusCode || 'unknown')
    throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar agendamentos da agenda.' })
  }
})
