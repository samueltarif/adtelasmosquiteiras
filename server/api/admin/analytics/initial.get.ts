/**
 * GET /api/admin/analytics/initial
 * Endpoint BFF dedicado para carregamento inicial do Dashboard (Primeira Pintura).
 * Executa requireActiveAdmin uma única vez e retorna Overview + Recent Activity.
 *
 * PATCH 1.4:
 * - submission_id adicionado à projeção de leads (paridade com classifyLeadRecord)
 * - Erros sanitizados: zero message bruta ao cliente, zero upstream PII nos logs
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import {
  getSaoPauloDateRange,
  fetchAllPaginated,
  computeOverviewData,
  formatRecentActivityEvents,
  PHASE_B_START_ISO
} from '../../../utils/adminAnalytics.ts'
import { requireActiveAdmin } from '../../../utils/adminAuth.ts'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const preset = (query.preset as string) || 'today'
  const customFrom = query.dateFrom as string | undefined
  const customTo = query.dateTo as string | undefined

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 503, message: 'Serviço de analytics temporariamente indisponível.' })
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  const dateRange = getSaoPauloDateRange(preset, customFrom, customTo)
  const { startUtc, endUtc } = dateRange

  try {
    const [rawViews, rawClicks, rawLeads, rawHistory, recentViews, recentClicks, recentLeads] = await Promise.all([
      fetchAllPaginated(
        config.supabaseUrl,
        'page_views',
        `select=id,created_at,visitor_id,session_id,path,device_type,is_bot&created_at=gte.${startUtc}&created_at=lt.${endUtc}&order=created_at.asc`,
        headers
      ),
      fetchAllPaginated(
        config.supabaseUrl,
        'lead_clicks',
        `select=id,created_at,tipo,origem,cta_location,service_key,service_name,visitor_id,session_id,is_bot,channel&created_at=gte.${startUtc}&created_at=lt.${endUtc}&order=created_at.asc`,
        headers
      ),
      // PATCH 1.4: submission_id adicionado para paridade com classifyLeadRecord
      fetchAllPaginated(
        config.supabaseUrl,
        'leads',
        `select=id,submission_id,created_at,nome,servico,cidade,bairro,status,visitor_id,session_id,email,telefone,mensagem,observacoes,landing_path,utm_campaign,session_channel&created_at=gte.${startUtc}&created_at=lt.${endUtc}&order=created_at.asc`,
        headers
      ),
      fetchAllPaginated(
        config.supabaseUrl,
        'page_views',
        `select=visitor_id,created_at&visitor_id=not.is.null&created_at=gte.${PHASE_B_START_ISO}&order=created_at.asc`,
        headers
      ),
      $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/page_views?select=id,created_at,path,visitor_id,session_id,channel,device_type,is_bot&order=created_at.desc&limit=5`,
        { headers }
      ).catch(() => []),
      $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/lead_clicks?select=id,created_at,tipo,origem,cta_location,service_key,service_name,visitor_id,channel,device_type&order=created_at.desc&limit=5`,
        { headers }
      ).catch(() => []),
      $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/leads?select=id,submission_id,created_at,nome,servico,cidade,bairro,origem,session_channel,landing_path&order=created_at.desc&limit=5`,
        { headers }
      ).catch(() => [])
    ])

    const overview = computeOverviewData(rawViews, rawClicks, rawLeads, rawHistory, dateRange, preset)
    const recentEvents = formatRecentActivityEvents(recentViews, recentClicks, recentLeads)

    return {
      success: true,
      overview,
      recentActivity: {
        success: true,
        events: recentEvents
      }
    }
  } catch {
    // INITIAL_ANALYTICS_RAW_ERROR_EXPOSURE=NONE: Zero message bruta ao cliente ou nos logs
    console.error('[analytics/initial] INITIAL_ANALYTICS_FAILED')
    throw createError({ statusCode: 503, message: 'Serviço de analytics temporariamente indisponível.' })
  }
})
