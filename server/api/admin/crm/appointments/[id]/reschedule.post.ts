/**
 * POST /api/admin/crm/appointments/:id/reschedule
 * Reagendamento com preservação histórica via RPC reschedule_appointment_atomic.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { isValidIsoDateTime } from '../../../../../shared/appointmentValidation.mjs'
import { handleRpcError } from '../../../../../utils/crmAppointmentErrors'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../../utils/crmAppointmentHelpers'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID do agendamento é obrigatório.' })
  }

  const body = await readBody(event).catch(() => ({}))

  if (!isValidIsoDateTime(body.new_data_hora_inicio) || !isValidIsoDateTime(body.new_data_hora_fim)) {
    throw createError({ statusCode: 400, statusMessage: 'Novas datas de início e fim devem ser timestamps ISO válidos.' })
  }

  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''
  if (!motivo || motivo.length < 3) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_RESCHEDULE_REASON_REQUIRED: O motivo do reagendamento é obrigatório (mínimo 3 caracteres).',
      data: { error: { code: 'ERR_RESCHEDULE_REASON_REQUIRED', message: 'O motivo do reagendamento é obrigatório (mínimo 3 caracteres).' } }
    })
  }

  if (!body.expected_appointment_updated_at || typeof body.expected_appointment_updated_at !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'O campo "expected_appointment_updated_at" é obrigatório.' })
  }

  const rpcPayload = {
    p_actor_id: admin.userId,
    p_appointment_id: id,
    p_expected_appointment_updated_at: new Date(body.expected_appointment_updated_at).toISOString(),
    p_new_data_hora_inicio: new Date(body.new_data_hora_inicio).toISOString(),
    p_new_data_hora_fim: new Date(body.new_data_hora_fim).toISOString(),
    p_motivo: motivo
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const newAppointment = await $fetch<any>(
      `${config.supabaseUrl}/rest/v1/rpc/reschedule_appointment_atomic`,
      {
        method: 'POST',
        headers,
        body: rpcPayload
      }
    )

    let fullAppointment = newAppointment
    if (newAppointment?.id) {
      const fetched = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/appointments?id=eq.${newAppointment.id}&select=${APPOINTMENT_DETAIL_SELECT}`,
        { headers }
      ).catch(() => [newAppointment])
      fullAppointment = fetched && fetched[0] ? fetched[0] : newAppointment
    }

    return {
      success: true,
      appointment: fullAppointment
    }
  } catch (err: any) {
    handleRpcError(err)
  }
})
