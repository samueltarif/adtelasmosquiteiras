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

  const selectFields = 'id,work_order_id,work_order_item_id,storage_key,safe_filename,media_type,mime_type,file_size_bytes,etapa,descricao,created_by,created_at,item:work_order_items(id,descricao,categoria_operacional)'

  try {
    const media = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_media?work_order_id=eq.${id}&select=${selectFields}&order=created_at.desc`,
      {
        headers: getSupabaseHeaders(config.supabaseServiceRoleKey)
      }
    )

    return {
      media: Array.isArray(media) ? media : []
    }
  } catch (err: any) {
    console.error('[WorkOrderMediaList] Erro ao listar mídias da OS:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao listar mídias da ordem de serviço'
    })
  }
})
