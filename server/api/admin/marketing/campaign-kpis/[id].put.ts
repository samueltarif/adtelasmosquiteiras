// server/api/admin/marketing/campaign-kpis/[id].put.ts
// PUT /api/admin/marketing/campaign-kpis/:id — Atualiza entrada existente.

import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'
import { validateNonNegativeNumber, validateIsoDate, validatePeriod } from '../../../../../app/utils/campaignKpiGoals'

const ALLOWED_PLATFORMS = ['google_ads', 'instagram_ads', 'facebook_ads', 'tiktok_ads', 'microsoft_ads', 'outro']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const NUMERIC_FIELDS = [
  'planned_budget', 'spend', 'impressions', 'clicks', 'whatsapp_contacts',
  'leads', 'sales', 'revenue',
  'target_ctr', 'target_cpc', 'target_cpl', 'target_cpa', 'target_roas',
  'target_leads', 'target_sales', 'target_lead_to_sale_rate', 'target_budget',
] as const

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

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Payload inválido.' })
  }

  if (!body.platform || !ALLOWED_PLATFORMS.includes(body.platform)) {
    throw createError({ statusCode: 400, message: 'Plataforma inválida.' })
  }

  const campaignName = typeof body.campaign_name === 'string' ? body.campaign_name.trim() : ''
  if (!campaignName || campaignName.length > 300) {
    throw createError({ statusCode: 400, message: 'Nome da campanha obrigatório (máx. 300 caracteres).' })
  }

  const startRes = validateIsoDate(body.period_start, 'period_start')
  if (!startRes.ok) throw createError({ statusCode: 400, message: startRes.error })
  const endRes = validateIsoDate(body.period_end, 'period_end')
  if (!endRes.ok) throw createError({ statusCode: 400, message: endRes.error })
  const periodRes = validatePeriod(startRes.value, endRes.value)
  if (!periodRes.ok) throw createError({ statusCode: 400, message: periodRes.error })

  const numericPayload: Record<string, number | null> = {}
  for (const field of NUMERIC_FIELDS) {
    const res = validateNonNegativeNumber(body[field], field)
    if (!res.ok) throw createError({ statusCode: 400, message: res.error })
    numericPayload[field] = res.value
  }

  const payload = {
    platform: body.platform,
    campaign_name: campaignName,
    utm_campaign: typeof body.utm_campaign === 'string' && body.utm_campaign.trim()
      ? body.utm_campaign.trim().slice(0, 200) : null,
    period_start: startRes.value,
    period_end: endRes.value,
    notes: typeof body.notes === 'string' && body.notes.trim()
      ? body.notes.trim().slice(0, 2000) : null,
    ...numericPayload,
  }

  const headers = { ...getSupabaseHeaders(config.supabaseServiceRoleKey), Prefer: 'return=representation' }
  const url = `${config.supabaseUrl}/rest/v1/campaign_kpi_entries?id=eq.${id}`

  try {
    const result = await $fetch<any[]>(url, { method: 'PATCH', headers, body: payload })
    if (!Array.isArray(result) || result.length === 0) {
      throw createError({ statusCode: 404, message: 'Entrada não encontrada.' })
    }
    return { data: result[0] }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: 'Erro ao atualizar entrada de KPI.' })
  }
})
