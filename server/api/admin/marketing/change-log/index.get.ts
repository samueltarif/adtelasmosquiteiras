import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { parseSaoPauloToUtcIso } from '../../../../shared/adminMarketingChangeCore.mjs'

export default defineEventHandler(async (event) => {
  // 1. Exige Administrador Ativo
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const query = getQuery(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false, error: 'Supabase não configurado' }
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  const status = (query.status as string) || 'active'
  const changeType = query.change_type as string | undefined
  const scope = query.scope as string | undefined
  const campaignId = (query.campaign_id || query.google_campaign_id) as string | undefined
  const from = query.from as string | undefined
  const to = query.to as string | undefined
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))

  const params: string[] = [
    'select=*',
    'order=occurred_at.desc',
    `limit=${limit}`
  ]

  if (status !== 'all') {
    params.push(`status=eq.${encodeURIComponent(status)}`)
  }

  if (changeType) {
    params.push(`change_type=eq.${encodeURIComponent(changeType)}`)
  }

  if (scope) {
    params.push(`scope=eq.${encodeURIComponent(scope)}`)
  }

  if (campaignId) {
    params.push(`google_campaign_id=eq.${encodeURIComponent(campaignId)}`)
  }

  if (from) {
    const fromUtc = parseSaoPauloToUtcIso(from)
    if (fromUtc) params.push(`occurred_at=gte.${encodeURIComponent(fromUtc)}`)
  }

  if (to) {
    const toUtc = parseSaoPauloToUtcIso(to)
    if (toUtc) params.push(`occurred_at=lte.${encodeURIComponent(toUtc)}`)
  }

  try {
    const url = `${config.supabaseUrl}/rest/v1/marketing_change_log?${params.join('&')}`
    const data = await $fetch<any[]>(url, { headers })

    return {
      success: true,
      changes: data || [],
      total: data?.length || 0
    }
  } catch (error: any) {
    console.error('[admin/marketing/change-log] Erro ao listar alterações:', error?.message)
    return {
      success: false,
      error: error?.message || 'Erro ao consultar histórico de alterações de marketing'
    }
  }
})
