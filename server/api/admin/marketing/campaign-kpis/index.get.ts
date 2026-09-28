// server/api/admin/marketing/campaign-kpis/index.get.ts
// GET /api/admin/marketing/campaign-kpis
// Lista entradas com filtros: platform, utm_campaign, period_start_from, period_start_to, limit, offset.

import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'

const ALLOWED_PLATFORMS = ['google_ads', 'instagram_ads', 'facebook_ads', 'tiktok_ads', 'microsoft_ads', 'outro']
const MAX_LIMIT = 100

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const query = getQuery(event)
  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const base = `${config.supabaseUrl}/rest/v1/campaign_kpi_entries`

  // Filtros
  const params: string[] = ['select=*', 'order=period_start.desc,created_at.desc']

  const platform = typeof query.platform === 'string' ? query.platform.trim() : ''
  if (platform && ALLOWED_PLATFORMS.includes(platform)) {
    params.push(`platform=eq.${encodeURIComponent(platform)}`)
  }

  const utmCampaign = typeof query.utm_campaign === 'string' ? query.utm_campaign.trim() : ''
  if (utmCampaign && utmCampaign.length <= 200) {
    params.push(`utm_campaign=eq.${encodeURIComponent(utmCampaign)}`)
  }

  const fromDate = typeof query.from === 'string' ? query.from.trim() : ''
  if (fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
    params.push(`period_start=gte.${fromDate}`)
  }

  const toDate = typeof query.to === 'string' ? query.to.trim() : ''
  if (toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    params.push(`period_end=lte.${toDate}`)
  }

  const rawLimit = Number(query.limit)
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : 50
  params.push(`limit=${limit}`)

  const rawOffset = Number(query.offset)
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0
  params.push(`offset=${offset}`)

  try {
    const data = await $fetch<any[]>(`${base}?${params.join('&')}`, { headers })
    return { data: Array.isArray(data) ? data : [], limit, offset }
  } catch (err: any) {
    throw createError({ statusCode: 500, message: 'Erro ao buscar entradas de KPI.' })
  }
})
