/**
 * GET /api/admin/crm/staff
 * Listagem de membros da equipe técnica e operacional.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth.ts'
import { getSupabaseHeaders } from '../../../../utils/crm.ts'
import { isValidStaffRole } from '../../../../shared/appointmentValidation.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const query = getQuery(event)
  const selectFields = 'id,nome,telefone,email,funcao,is_active,created_at,updated_at'
  const params: string[] = [`select=${selectFields}`, 'order=nome.asc,id.asc']

  if (query.isActive !== undefined && query.isActive !== '') {
    if (query.isActive !== 'true' && query.isActive !== 'false') {
      throw createError({ statusCode: 400, statusMessage: 'isActive deve ser "true" ou "false".' })
    }
    params.push(`is_active=eq.${query.isActive}`)
  }

  if (query.funcao !== undefined && query.funcao !== '') {
    if (typeof query.funcao !== 'string' || !isValidStaffRole(query.funcao.trim())) {
      throw createError({ statusCode: 400, statusMessage: 'funcao inválida.' })
    }
    params.push(`funcao=eq.${encodeURIComponent(query.funcao.trim())}`)
  }

  try {
    const staff = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/crm_staff?${params.join('&')}`,
      { headers: getSupabaseHeaders(config.supabaseServiceRoleKey) }
    )

    return {
      success: true,
      staff: Array.isArray(staff) ? staff : []
    }
  } catch (err: any) {
    console.error('[CrmStaffList] Erro ao listar equipe técnica:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao listar equipe técnica.' })
  }
})
