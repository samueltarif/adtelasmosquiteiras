/**
 * POST /api/admin/crm/staff
 * Cadastro de novo membro na equipe técnica/operacional.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders, normalizePhone, normalizeEmail } from '../../../../utils/crm'
import { isValidStaffRole } from '../../../../shared/appointmentValidation.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const body = await readBody(event).catch(() => ({}))
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''

  if (!nome || nome.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Nome do membro da equipe deve ter no mínimo 2 caracteres.' })
  }

  const funcao = body.funcao && isValidStaffRole(body.funcao) ? body.funcao : 'instalador'
  const telefone = body.telefone ? normalizePhone(body.telefone) || null : null
  const email = body.email ? normalizeEmail(body.email) || null : null

  const payload = {
    nome,
    telefone,
    email,
    funcao,
    is_active: true
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const createdList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/crm_staff`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: payload
      }
    )

    if (!Array.isArray(createdList) || createdList.length === 0) {
      throw new Error('Retorno vazio ao criar membro da equipe no Supabase')
    }

    return {
      success: true,
      staff: createdList[0]
    }
  } catch (err: any) {
    console.error('[CrmStaffCreate] Erro ao cadastrar membro da equipe:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao cadastrar membro da equipe.' })
  }
})
