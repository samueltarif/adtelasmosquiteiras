/**
 * PATCH /api/admin/crm/staff/:id
 * Atualização de dados de membro da equipe técnica/operacional.
 * A trigger trg_check_crm_staff_deactivation impede desativação com compromissos futuros.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders, normalizePhone, normalizeEmail } from '../../../../utils/crm'
import { isValidStaffRole } from '../../../../shared/appointmentValidation.mjs'
import { handleRpcError } from '../../../../utils/crmAppointmentErrors'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID do membro da equipe é obrigatório.' })
  }

  const body = await readBody(event).catch(() => ({}))
  const updates: Record<string, any> = {}

  if (body.nome !== undefined) {
    const nome = String(body.nome).trim()
    if (nome.length < 2) {
      throw createError({ statusCode: 400, statusMessage: 'Nome do membro da equipe deve ter no mínimo 2 caracteres.' })
    }
    updates.nome = nome
  }

  if (body.telefone !== undefined) {
    updates.telefone = body.telefone ? normalizePhone(body.telefone) || null : null
  }

  if (body.email !== undefined) {
    updates.email = body.email ? normalizeEmail(body.email) || null : null
  }

  if (body.funcao !== undefined) {
    if (!isValidStaffRole(body.funcao)) {
      throw createError({ statusCode: 400, statusMessage: 'Função do membro da equipe é inválida.' })
    }
    updates.funcao = body.funcao
  }

  if (body.is_active !== undefined) {
    updates.is_active = Boolean(body.is_active)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum campo para atualização foi informado.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const patchedList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/crm_staff?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: updates
      }
    )

    if (!Array.isArray(patchedList) || patchedList.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Membro da equipe não encontrado.' })
    }

    return {
      success: true,
      staff: patchedList[0]
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    handleRpcError(err)
  }
})
