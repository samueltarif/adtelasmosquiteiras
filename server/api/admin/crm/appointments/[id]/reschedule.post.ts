/**
 * POST /api/admin/crm/appointments/:id/reschedule
 * Reagendamento com preservação histórica via RPC reschedule_appointment_atomic.
 *
 * HOTFIX: Preserva p_expected_appointment_updated_at exatamente sem truncamento de microsegundos.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../../utils/crm.ts'
import { isValidIsoDateTime, isValidUUID, isValidRfc3339 } from '../../../../../shared/appointmentValidation.mjs'
import { handleRpcError } from '../../../../../utils/crmAppointmentErrors.ts'
import { APPOINTMENT_DETAIL_SELECT, normalizeAppointmentDetail } from '../../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !isValidUUID(id)) {
    throw createError({ statusCode: 400, message: 'ID do agendamento deve ser um UUID válido.' })
  }

  const body = await readBody(event).catch(() => ({}))

  if (!isValidRfc3339(body.new_data_hora_inicio) || !isValidRfc3339(body.new_data_hora_fim)) {
    throw createError({ statusCode: 400, message: 'Novas datas de início e fim devem ser timestamps RFC3339 válidos com timezone explícito.' })
  }

  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''
  if (!motivo || motivo.length < 3) {
    throw createError({
      statusCode: 400,
      message: 'ERR_RESCHEDULE_REASON_REQUIRED: O motivo do reagendamento é obrigatório (mínimo 3 caracteres).',
      data: { error: { code: 'ERR_RESCHEDULE_REASON_REQUIRED', message: 'O motivo do reagendamento é obrigatório (mínimo 3 caracteres).' } }
    })
  }

  if (!body.expected_appointment_updated_at || typeof body.expected_appointment_updated_at !== 'string') {
    throw createError({ statusCode: 400, message: 'O campo "expected_appointment_updated_at" é obrigatório.' })
  }

  const rawExpectedUpdatedAt = body.expected_appointment_updated_at.trim()
  if (!isValidRfc3339(rawExpectedUpdatedAt)) {
    throw createError({ statusCode: 400, message: 'expected_appointment_updated_at deve ser um timestamp RFC3339 válido com timezone explícito.' })
  }

  const rpcPayload = {
    p_actor_id: admin.userId,
    p_appointment_id: id,
    p_expected_appointment_updated_at: rawExpectedUpdatedAt,
    p_new_data_hora_inicio: body.new_data_hora_inicio.trim(),
    p_new_data_hora_fim: body.new_data_hora_fim.trim(),
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
      appointment: normalizeAppointmentDetail(fullAppointment)
    }
  } catch (err: any) {
    handleRpcError(err)
  }
})
