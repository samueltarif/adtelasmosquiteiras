/**
 * POST /api/admin/crm/appointments
 * Criação atômica de agendamento via RPC create_appointment_atomic.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../utils/crm.ts'
import { isValidAppointmentType, isValidIsoDateTime, isValidUUID, isValidRfc3339 } from '../../../../shared/appointmentValidation.mjs'
import { handleRpcError } from '../../../../utils/crmAppointmentErrors.ts'
import { APPOINTMENT_DETAIL_SELECT } from '../../../../utils/crmAppointmentHelpers.ts'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const body = await readBody(event).catch(() => ({}))

  if (!body.work_order_id || !isValidUUID(body.work_order_id)) {
    throw createError({ statusCode: 400, statusMessage: 'O campo "work_order_id" deve ser um UUID válido.' })
  }

  if (body.staff_id && !isValidUUID(body.staff_id)) {
    throw createError({ statusCode: 400, statusMessage: 'staff_id deve ser um UUID válido.' })
  }

  if (body.address_id && !isValidUUID(body.address_id)) {
    throw createError({ statusCode: 400, statusMessage: 'address_id deve ser um UUID válido.' })
  }

  if (!isValidAppointmentType(body.tipo_agendamento)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de agendamento inválido.' })
  }

  if (!isValidRfc3339(body.data_hora_inicio) || !isValidRfc3339(body.data_hora_fim)) {
    throw createError({ statusCode: 400, statusMessage: 'Datas de início e fim devem ser timestamps RFC3339 válidos com timezone explícito.' })
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
