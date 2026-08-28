/**
 * GET /api/admin/crm/appointments
 * Consulta estruturada de compromissos da Agenda para visualização em Calendário.
 * Range máximo permitido: 62 dias. Sem busca textual de PII via query string.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'
import { isValidAppointmentDateRange, isValidAppointmentStatus, isValidAppointmentType } from '../../../../shared/appointmentValidation.mjs'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../utils/crmAppointmentHelpers'

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
    `select=${APPOINTMENT_DETAIL_SELECT}`,
    `data_hora_fim=gte.${encodeURIComponent(startStr)}`,
    `data_hora_inicio=lte.${encodeURIComponent(endStr)}`,
    'order=data_hora_inicio.asc'
  ]

  if (query.staff_id && typeof query.staff_id === 'string' && query.staff_id.trim() !== '') {
    params.push(`staff_id=eq.${encodeURIComponent(query.staff_id.trim())}`)
  }

  if (query.status && typeof query.status === 'string' && isValidAppointmentStatus(query.status.trim())) {
    params.push(`status_agendamento=eq.${encodeURIComponent(query.status.trim())}`)
  }

  if (query.tipo && typeof query.tipo === 'string' && isValidAppointmentType(query.tipo.trim())) {
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
    console.error('[AppointmentsList] Erro ao consultar compromissos:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar agendamentos da agenda.' })
  }
})
