import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
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

  const body = await readBody(event).catch(() => ({}))
  const items = Array.isArray(body.items) ? body.items : []

  if (items.length === 0) {
    return { success: true }
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    // Atualiza ordenação normalizada 0..N-1
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it && it.id) {
        await $fetch(`${config.supabaseUrl}/rest/v1/work_order_items?id=eq.${it.id}&work_order_id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: { sort_order: i }
        })
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[WorkOrderItemsReorder] Erro na reordenação de itens:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao reordenar itens da ordem de serviço'
    })
  }
})
