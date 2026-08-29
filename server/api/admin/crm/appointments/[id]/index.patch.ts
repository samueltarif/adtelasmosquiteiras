/**
 * PATCH /api/admin/crm/appointments/:id
 * Atualização não-temporal de agendamento via RPC update_appointment_atomic.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../../utils/crm.ts'
import { isValidUUID, isValidRfc3339 } from '../../../../../shared/appointmentValidation.mjs'
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

  // Bloqueio de campos temporais ou de transição de status no PATCH não-temporal
  if (body.data_hora_inicio !== undefined || body.data_hora_fim !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Alterações de horário devem ser realizadas via endpoint dedicado de reagendamento (/reschedule).'
    })
  }

  if (body.status_agendamento !== undefined || body.status !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Alterações de status devem ser realizadas via endpoint dedicado (/status ou /cancel).'
    })
  }

  if (!body.expected_appointment_updated_at || typeof body.expected_appointment_updated_at !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'O campo "expected_appointment_updated_at" é obrigatório para controle de concorrência.'
    })
  }

  if (!isValidRfc3339(body.expected_appointment_updated_at)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'expected_appointment_updated_at deve ser um timestamp RFC3339 válido com timezone explícito.'
    })
  }

  const updateStaff = body.staff_id !== undefined
  const updateAddress = body.address_id !== undefined
  const updateObservacoes = body.observacoes !== undefined

  if (!updateStaff && !updateAddress && !updateObservacoes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_NO_APPOINTMENT_CHANGES: Nenhum campo para atualização foi informado.',
      data: { error: { code: 'ERR_NO_APPOINTMENT_CHANGES', message: 'Nenhum campo para atualização foi informado.' } }
    })
  }

  const rpcPayload = {
    p_actor_id: admin.userId,
    p_appointment_id: id,
    p_expected_appointment_updated_at: new Date(body.expected_appointment_updated_at).toISOString(),
    p_staff_id: body.staff_id ? String(body.staff_id).trim() : null,
    p_address_id: body.address_id ? String(body.address_id).trim() : null,
    p_observacoes: body.observacoes !== undefined && body.observacoes !== null ? String(body.observacoes).trim() : null,
    p_update_staff: updateStaff,
    p_update_address: updateAddress,
    p_update_observacoes: updateObservacoes
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const updatedAppointment = await $fetch<any>(
      `${config.supabaseUrl}/rest/v1/rpc/update_appointment_atomic`,
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
