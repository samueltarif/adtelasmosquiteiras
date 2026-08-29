/**
 * POST /api/admin/crm/appointments/search
 * Busca de agendamentos com termos textuais/PII transmitidos com segurança no BODY.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../utils/crm.ts'
import { isValidAppointmentStatus, isValidAppointmentType } from '../../../../shared/appointmentValidation.mjs'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const body = await readBody(event).catch(() => ({}))
  if (body.q !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Busca textual "q" não é suportada em appointments. Utilize filtros estruturados (status, tipo, staff_id, client_id).'
    })
  }
  const limit = Math.min(Math.max(parseInt(String(body.limit || '20'), 10) || 20, 1), 100)
  const offset = Math.max(parseInt(String(body.offset || '0'), 10) || 0, 0)

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const params: string[] = [
    `select=${APPOINTMENT_DETAIL_SELECT}`,
    `limit=${limit}`,
    `offset=${offset}`,
    'order=data_hora_inicio.desc'
  ]

  if (body.status && isValidAppointmentStatus(body.status)) {
    params.push(`status_agendamento=eq.${encodeURIComponent(body.status)}`)
  }

  if (body.tipo && isValidAppointmentType(body.tipo)) {
    params.push(`tipo_agendamento=eq.${encodeURIComponent(body.tipo)}`)
  }

  if (body.staff_id && typeof body.staff_id === 'string' && body.staff_id.trim() !== '') {
    params.push(`staff_id=eq.${encodeURIComponent(body.staff_id.trim())}`)
  }

  if (body.client_id && typeof body.client_id === 'string' && body.client_id.trim() !== '') {
    params.push(`client_id=eq.${encodeURIComponent(body.client_id.trim())}`)
  }

  try {
    const appointments = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/appointments?${params.join('&')}`,
      { headers }
    )

    return {
      success: true,
      appointments: Array.isArray(appointments) ? appointments : [],
      limit,
      offset
    }
  } catch (err: any) {
    console.error('[AppointmentsSearch] Erro na busca de compromissos:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao pesquisar agendamentos.' })
  }
})
