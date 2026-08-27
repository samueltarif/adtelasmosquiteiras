import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da OS é obrigatório'
    })
  }

  const selectFields = 'id,client_id,work_order_id,conteudo,categoria,author_id,created_at,updated_at'

  try {
    const notes = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/crm_notes?work_order_id=eq.${id}&select=${selectFields}&order=created_at.desc`,
      {
        headers: getSupabaseHeaders(config.supabaseServiceRoleKey)
      }
    )

    return {
      notes: Array.isArray(notes) ? notes : []
    }
  } catch (err: any) {
    console.error('[WorkOrderNotesList] Erro ao listar notas da OS:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao listar anotações da ordem de serviço'
    })
  }
})
