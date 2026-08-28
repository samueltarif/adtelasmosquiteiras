/**
 * POST /api/admin/crm/appointments/:id/cancel
 * Cancelamento de agendamento via RPC cancel_appointment_atomic.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
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

  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''
  if (!motivo || motivo.length < 3) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_CANCEL_REASON_REQUIRED: O motivo do cancelamento é obrigatório (mínimo 3 caracteres).',
      data: { error: { code: 'ERR_CANCEL_REASON_REQUIRED', message: 'O motivo do cancelamento é obrigatório (mínimo 3 caracteres).' } }
    })
  }

  if (!body.expected_appointment_updated_at || typeof body.expected_appointment_updated_at !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'O campo "expected_appointment_updated_at" é obrigatório.' })
  }

  const rpcPayload = {
    p_actor_id: admin.userId,
    p_appointment_id: id,
    p_expected_appointment_updated_at: new Date(body.expected_appointment_updated_at).toISOString(),
    p_motivo: motivo
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const cancelledAppointment = await $fetch<any>(
      `${config.supabaseUrl}/rest/v1/rpc/cancel_appointment_atomic`,
      {
        method: 'POST',
        headers,
        body: rpcPayload
      }
    )

    let fullAppointment = cancelledAppointment
    if (cancelledAppointment?.id) {
      const fetched = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/appointments?id=eq.${cancelledAppointment.id}&select=${APPOINTMENT_DETAIL_SELECT}`,
        { headers }
      ).catch(() => [cancelledAppointment])
      fullAppointment = fetched && fetched[0] ? fetched[0] : cancelledAppointment
    }

    return {
      success: true,
      appointment: fullAppointment
    }
  } catch (err: any) {
    handleRpcError(err)
  }
})
