import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../../../utils/crm'

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
  const itemId = getRouterParam(event, 'itemId')
  if (!id || !itemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'IDs de OS e item são obrigatórios'
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const measurements = Array.isArray(body.measurements) ? body.measurements : []

  if (measurements.length === 0) {
    return { success: true }
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    for (let i = 0; i < measurements.length; i++) {
      const m = measurements[i]
      if (m && m.id) {
        await $fetch(`${config.supabaseUrl}/rest/v1/work_order_measurements?id=eq.${m.id}&work_order_item_id=eq.${itemId}`, {
          method: 'PATCH',
          headers,
          body: { sort_order: i }
        })
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[MeasurementsReorder] Erro na reordenação de medições:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao reordenar medições'
    })
  }
})
