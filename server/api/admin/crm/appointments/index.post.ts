/**
 * POST /api/admin/crm/appointments
 * Criação atômica de agendamento via RPC create_appointment_atomic.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'
import { isValidAppointmentType, isValidIsoDateTime } from '../../../../shared/appointmentValidation.mjs'
import { handleRpcError } from '../../../../utils/crmAppointmentErrors'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../utils/crmAppointmentHelpers'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const body = await readBody(event).catch(() => ({}))

  if (!body.work_order_id || typeof body.work_order_id !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'O campo "work_order_id" é obrigatório.' })
  }

  if (!isValidAppointmentType(body.tipo_agendamento)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de agendamento inválido.' })
  }

  if (!isValidIsoDateTime(body.data_hora_inicio) || !isValidIsoDateTime(body.data_hora_fim)) {
    throw createError({ statusCode: 400, statusMessage: 'Datas de início e fim devem ser timestamps ISO válidos.' })
  }

  const rpcPayload = {
    p_actor_id: admin.userId,
    p_work_order_id: body.work_order_id.trim(),
    p_address_id: body.address_id ? String(body.address_id).trim() : null,
    p_staff_id: body.staff_id ? String(body.staff_id).trim() : null,
    p_tipo_agendamento: body.tipo_agendamento,
    p_data_hora_inicio: new Date(body.data_hora_inicio).toISOString(),
    p_data_hora_fim: new Date(body.data_hora_fim).toISOString(),
    p_observacoes: body.observacoes ? String(body.observacoes).trim() : null
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const createdAppointment = await $fetch<any>(
      `${config.supabaseUrl}/rest/v1/rpc/create_appointment_atomic`,
      {
        method: 'POST',
        headers,
        body: rpcPayload
      }
    )

    // Reconciliação com relações completas
    let fullAppointment = createdAppointment
    if (createdAppointment?.id) {
      const fetched = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/appointments?id=eq.${createdAppointment.id}&select=${APPOINTMENT_DETAIL_SELECT}`,
        { headers }
      ).catch(() => [createdAppointment])
      fullAppointment = fetched && fetched[0] ? fetched[0] : createdAppointment
    }

    return {
      success: true,
      appointment: fullAppointment
    }
  } catch (err: any) {
    handleRpcError(err)
  }
})
