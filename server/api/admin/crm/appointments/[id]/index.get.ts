/**
 * GET /api/admin/crm/appointments/:id
 * Consulta detalhada de um agendamento com relações completas.
 *
 * PHASE_5_0D_0: Normaliza client do work_order.client para a raiz do objeto.
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../../utils/crm.ts'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do agendamento é obrigatório.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const list = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/appointments?id=eq.${id}&select=${APPOINTMENT_DETAIL_SELECT}`,
      { headers }
    )

    if (!Array.isArray(list) || list.length === 0) {
      throw createError({ statusCode: 404, message: 'Agendamento não encontrado.' })
    }

    const raw = list[0]

    // Normalizar client do work_order.client para raiz, mantendo contrato CrmAppointmentDetail
    const clientFromWo = raw?.work_order?.client ?? null
    const workOrder = raw?.work_order
      ? {
          id: raw.work_order.id,
          numero_os: raw.work_order.numero_os,
          status_os: raw.work_order.status_os,
          valor_final: raw.work_order.valor_final ?? null,
          is_archived: raw.work_order.is_archived ?? false
        }
      : null

    const appointment = { ...raw, client: clientFromWo, work_order: workOrder }

    // Busca próximo agendamento derivado deste (se houver sido reagendado)
    const nextList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/appointments?rescheduled_from_id=eq.${id}&select=id,data_hora_inicio,data_hora_fim,status_agendamento&limit=1`,
      { headers }
    ).catch(() => [])

    return {
      success: true,
      appointment: {
        ...appointment,
        next_appointment: Array.isArray(nextList) && nextList.length > 0 ? nextList[0] : null
      }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    const statusCode = err?.statusCode || 'unknown'
    console.error(`[AppointmentDetail] route=GET /api/admin/crm/appointments/${id} status=${statusCode}`)
    throw createError({ statusCode: 500, message: 'Falha ao carregar detalhes do agendamento.' })
  }
})
