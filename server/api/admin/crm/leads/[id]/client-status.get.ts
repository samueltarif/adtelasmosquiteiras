import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do lead é obrigatório.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/clients?select=id,nome,created_at&lead_id=eq.${id}&limit=1`, {
      headers
    })

    const isConverted = Array.isArray(res) && res.length > 0
    const client = isConverted ? res[0] : null

    return {
      success: true,
      isConverted,
      client
    }
  } catch (err: any) {
    console.error('[leads/client-status] Erro ao verificar status de conversão:', err)
    return {
      success: false,
      isConverted: false,
      client: null
    }
  }
})
