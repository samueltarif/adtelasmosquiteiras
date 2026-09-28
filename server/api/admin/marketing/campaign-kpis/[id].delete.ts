// server/api/admin/marketing/campaign-kpis/[id].delete.ts
// DELETE /api/admin/marketing/campaign-kpis/:id — Remove entrada de KPI.

import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const id = getRouterParam(event, 'id') || ''
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'ID inválido.' })
  }

  const headers = { ...getSupabaseHeaders(config.supabaseServiceRoleKey), Prefer: 'return=representation' }
  const url = `${config.supabaseUrl}/rest/v1/campaign_kpi_entries?id=eq.${id}`

  try {
    const result = await $fetch<any[]>(url, { method: 'DELETE', headers })
    if (!Array.isArray(result) || result.length === 0) {
      throw createError({ statusCode: 404, message: 'Entrada não encontrada.' })
    }
    return { deleted: true, id }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao excluir entrada de KPI.' })
  }
})
