import { defineEventHandler, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const selectFields = 'id,nome,telefone,email,funcao,is_active'

  try {
    const staff = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/crm_staff?is_active=eq.true&select=${selectFields}&order=nome.asc`,
      {
        headers: getSupabaseHeaders(config.supabaseServiceRoleKey)
      }
    )

    return {
      staff: Array.isArray(staff) ? staff : []
    }
  } catch (err: any) {
    console.error('[CrmStaffList] Erro ao listar equipe técnica:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao listar equipe técnica'
    })
  }
})
