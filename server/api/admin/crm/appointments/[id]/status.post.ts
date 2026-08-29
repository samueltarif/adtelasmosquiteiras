/**
 * POST /api/admin/crm/appointments/:id/status
 * Transição de status do agendamento via RPC update_appointment_status_atomic.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../../utils/crm.ts'
import { isValidAppointmentStatus, isValidUUID, isValidRfc3339 } from '../../../../../shared/appointmentValidation.mjs'
import { handleRpcError } from '../../../../../utils/crmAppointmentErrors.ts'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !isValidUUID(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID do agendamento deve ser um UUID válido.' })
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

  if (!isValidRfc3339(body.expected_appointment_updated_at)) {
    throw createError({ statusCode: 400, statusMessage: 'expected_appointment_updated_at deve ser um timestamp RFC3339 válido com timezone explícito.' })
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
