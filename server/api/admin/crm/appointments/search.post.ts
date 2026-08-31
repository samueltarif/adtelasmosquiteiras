/**
 * POST /api/admin/crm/appointments/search
 * Busca de agendamentos com termos textuais/PII transmitidos com segurança no BODY.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../utils/crm.ts'
import { isValidAppointmentStatus, isValidAppointmentType, isValidUUID } from '../../../../shared/appointmentValidation.mjs'
import { APPOINTMENT_SEARCH_SELECT } from '../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const body = await readBody(event).catch(() => ({}))

  // 1. Validação estrita de "q" (DEFERRED)
  if (body.q !== undefined && body.q !== null) {
    if (typeof body.q !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'O parâmetro de busca "q" deve ser uma string.'
      })
    }
    if (body.q.trim() !== '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'SEARCH_PII_DEFERRED: Busca textual "q" não é suportada em appointments. Utilize filtros estruturados (status, tipo, staff_id, client_id).'
      })
    }
  }

  const limit = Math.min(Math.max(parseInt(String(body.limit || '20'), 10) || 20, 1), 100)
  const offset = Math.max(parseInt(String(body.offset || '0'), 10) || 0, 0)

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const params: string[] = [
    `select=${APPOINTMENT_SEARCH_SELECT}`,
    `limit=${limit}`,
    `offset=${offset}`,
    'order=data_hora_inicio.desc'
  ]

  // 2. Validação estrita de filtros estruturados
  if (body.status !== undefined && body.status !== null && body.status !== '') {
    if (typeof body.status !== 'string' || !isValidAppointmentStatus(body.status.trim())) {
      throw createError({ statusCode: 400, statusMessage: 'Parâmetro status inválido.' })
    }
    params.push(`status_agendamento=eq.${encodeURIComponent(body.status.trim())}`)
  }

  if (body.tipo !== undefined && body.tipo !== null && body.tipo !== '') {
    if (typeof body.tipo !== 'string' || !isValidAppointmentType(body.tipo.trim())) {
      throw createError({ statusCode: 400, statusMessage: 'Parâmetro tipo inválido.' })
    }
    params.push(`tipo_agendamento=eq.${encodeURIComponent(body.tipo.trim())}`)
  }

  const rawStaffId = body.staffId !== undefined ? body.staffId : body.staff_id
  if (rawStaffId !== undefined && rawStaffId !== null && rawStaffId !== '') {
    if (typeof rawStaffId !== 'string' || !isValidUUID(rawStaffId)) {
      throw createError({ statusCode: 400, statusMessage: 'Parâmetro staff_id inválido. Deve ser um UUID válido.' })
    }
    params.push(`staff_id=eq.${encodeURIComponent(rawStaffId.trim())}`)
  }

  const rawClientId = body.clientId !== undefined ? body.clientId : body.client_id
  if (rawClientId !== undefined && rawClientId !== null && rawClientId !== '') {
    if (typeof rawClientId !== 'string' || !isValidUUID(rawClientId)) {
      throw createError({ statusCode: 400, statusMessage: 'Parâmetro client_id inválido. Deve ser um UUID válido.' })
    }
    params.push(`client_id=eq.${encodeURIComponent(rawClientId.trim())}`)
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
    console.error('[AppointmentsSearch] Erro na busca de compromissos. Status:', err?.statusCode || 'unknown')
    throw createError({ statusCode: 500, statusMessage: 'Falha ao pesquisar agendamentos.' })
  }
})
