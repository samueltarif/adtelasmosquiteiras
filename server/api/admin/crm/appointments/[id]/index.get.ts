/**
 * GET /api/admin/crm/appointments/:id
 * Consulta detalhada de um agendamento com relações completas.
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../../utils/crmAppointmentHelpers'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID do agendamento é obrigatório.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const list = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/appointments?id=eq.${id}&select=${APPOINTMENT_DETAIL_SELECT}`,
      { headers }
    )

    if (!Array.isArray(list) || list.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Agendamento não encontrado.' })
    }

    const appointment = list[0]

    // Busca próximo agendamento derivado deste (se houver sido reagendado)
    let nextAppointment: any = null
    const nextList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/appointments?rescheduled_from_id=eq.${id}&select=id,data_hora_inicio,data_hora_fim,status_agendamento&limit=1`,
      { headers }
    ).catch(() => [])

    if (Array.isArray(nextList) && nextList.length > 0) {
      nextAppointment = nextList[0]
    }

    return {
      success: true,
      appointment: {
        ...appointment,
        next_appointment: nextAppointment
      }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('[AppointmentDetail] Erro ao carregar agendamento:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar detalhes do agendamento.' })
  }
})
