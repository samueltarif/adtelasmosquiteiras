/**
 * GET /api/admin/crm/work-orders/:id/appointments
 * Histórico cronológico completo de agendamentos vinculados a uma Ordem de Serviço.
 */

import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../../utils/crm.ts'
import { isValidUUID } from '../../../../../shared/appointmentValidation.mjs'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !isValidUUID(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID da ordem de serviço deve ser um UUID válido.' })
  }

  const query = getQuery(event)
  const limit = Math.min(Math.max(parseInt(String(query.limit || '50'), 10) || 50, 1), 100)
  const offset = Math.max(parseInt(String(query.offset || '0'), 10) || 0, 0)

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const appointments = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/appointments?work_order_id=eq.${id}&select=${APPOINTMENT_DETAIL_SELECT}&limit=${limit}&offset=${offset}&order=data_hora_inicio.asc,created_at.asc,id.asc`,
      { headers }
    )

    return {
      success: true,
      appointments: Array.isArray(appointments) ? appointments : []
    }
  } catch (err: any) {
    console.error('[WorkOrderAppointments] Erro ao carregar agendamentos da OS:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar histórico de agendamentos da OS.' })
  }
})
