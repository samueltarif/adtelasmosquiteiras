/**
 * POST /api/admin/crm/appointments/:id/status
 * Transição de status do agendamento via RPC update_appointment_status_atomic.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { isValidAppointmentStatus } from '../../../../../shared/appointmentValidation.mjs'
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

  if (!isValidAppointmentStatus(body.status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_INVALID_STATUS_TRANSITION: Status de agendamento informado é inválido.',
      data: { error: { code: 'ERR_INVALID_STATUS_TRANSITION', message: 'Status de agendamento informado é inválido.' } }
    })
  }

  if (!body.expected_appointment_updated_at || typeof body.expected_appointment_updated_at !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'O campo "expected_appointment_updated_at" é obrigatório.' })
  }

  const rpcPayload = {
    p_actor_id: admin.userId,
    p_appointment_id: id,
    p_expected_appointment_updated_at: new Date(body.expected_appointment_updated_at).toISOString(),
    p_next_status: body.status
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const updatedAppointment = await $fetch<any>(
      `${config.supabaseUrl}/rest/v1/rpc/update_appointment_status_atomic`,
      {
        method: 'POST',
        headers,
        body: rpcPayload
      }
    )

    let fullAppointment = updatedAppointment
    if (updatedAppointment?.id) {
      const fetched = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/appointments?id=eq.${updatedAppointment.id}&select=${APPOINTMENT_DETAIL_SELECT}`,
        { headers }
      ).catch(() => [updatedAppointment])
      fullAppointment = fetched && fetched[0] ? fetched[0] : updatedAppointment
    }

    return {
      success: true,
      appointment: fullAppointment
    }
  } catch (err: any) {
    handleRpcError(err)
  }
})
