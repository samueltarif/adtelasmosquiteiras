/**
 * Teste de Paridade: Dashboard Google Ads vs Central de Exportação (Item 9)
 * Compara para o mesmo período: sessões, visitantes, pageviews, whatsapp, form_starts, leads
 * Arquivo: scripts/test_google_export_parity.mjs (<= 200 linhas)
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import { getSaoPauloDateRange, fetchAllPaginated } from '../server/shared/adminAnalyticsCore.mjs'
import { computeGoogleAdsData } from '../server/shared/adminGoogleAdsMetrics.mjs'
import { collectExportRawData } from '../server/utils/dashboard-export/exportDataCollector.ts'
import { buildExportTables } from '../server/utils/dashboard-export/exportDataBuilder.ts'

const envContent = fs.readFileSync('.env', 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let v = match[2] || ''
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[match[1]] = v.trim()
  }
}

const supabaseUrl = env.SUPABASE_URL || 'https://axjqhxpejwkuabeaoyaz.supabase.co'
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
const fetcher = (url, opts) => fetch(url, opts).then(r => r.json())

async function main() {
  console.log('======================================================================')
  console.log('TESTE DE PARIDADE: DASHBOARD GOOGLE ADS x CENTRAL DE EXPORTAÇÃO')
  console.log('======================================================================')

  // Período real com dados de Google Ads existentes
  const preset = 'custom'
  const customFrom = '2026-08-30'
  const customTo = '2026-09-29'
  const dateRange = getSaoPauloDateRange(preset, customFrom, customTo)
  const { startUtc, endUtc } = dateRange
  console.log(`Período analisado: ${dateRange.label} (${startUtc} até ${endUtc})`)

  // 1. Dashboard: buscar raw e chamar computeGoogleAdsData
  const viewsQuery = `select=id,created_at,visitor_id,session_id,path,landing_path,channel,utm_source,utm_medium,utm_campaign,utm_content,utm_term,google_campaign_id,google_adgroup_id,google_creative_id,google_match_type,google_network,google_device,google_target_id,gclid,gbraid,wbraid,is_bot,device_type&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
  const clicksQuery = `select=id,created_at,tipo,origem,landing_path,cta_location,visitor_id,session_id,channel,utm_source,utm_medium,utm_campaign,utm_content,utm_term,google_campaign_id,google_adgroup_id,google_creative_id,google_match_type,google_network,google_device,google_target_id,gclid,gbraid,wbraid,is_bot,device_type&created_at=gte.${startUtc}&created_at=lt.${endUtc}`
  const leadsQuery = `select=id,created_at,visitor_id,session_id,landing_path,conversion_path,origem,session_channel,first_touch_channel,utm_source,utm_medium,utm_campaign,first_touch_utm_campaign,utm_content,utm_term,first_touch_utm_term,google_campaign_id,first_touch_google_campaign_id,gclid,first_touch_gclid,nome,email,telefone,mensagem,observacoes,status&created_at=gte.${startUtc}&created_at=lt.${endUtc}`

  const [dashViews, dashClicks, dashLeads] = await Promise.all([
    fetchAllPaginated(supabaseUrl, 'page_views', viewsQuery, headers, 1000, fetcher),
    fetchAllPaginated(supabaseUrl, 'lead_clicks', clicksQuery, headers, 1000, fetcher),
    fetchAllPaginated(supabaseUrl, 'leads', leadsQuery, headers, 1000, fetcher)
  ])

  const dashMetrics = computeGoogleAdsData(dashViews, dashClicks, dashLeads, dateRange)

  // 2. Central de Exportação: collectExportRawData + buildExportTables
  const exportRaw = await collectExportRawData(supabaseUrl, serviceKey, {
    format: 'xlsx',
    period: preset,
    dateFrom: customFrom,
    dateTo: customTo,
    datasets: ['google_ads']
  }, fetcher)

  const exportTables = buildExportTables(exportRaw, {
    format: 'xlsx',
    period: preset,
    dateFrom: customFrom,
    dateTo: customTo,
    datasets: ['google_ads']
  })

  const exportRows = exportTables.google_ads.rows
  const getExportVal = (metricName) => {
    const row = exportRows.find(r => r[0] === metricName)
    return row ? row[1] : null
  }

  const expSessions = getExportVal('Sessões Google Ads')
  const expVisitors = getExportVal('Visitantes Únicos')
  const expPageviews = getExportVal('Pageviews')
  const expWhatsapp = getExportVal('Cliques no WhatsApp')
  const expFormStarts = getExportVal('Inícios de Formulário')
  const expLeads = getExportVal('Leads Convertidos')

  console.log('\n--- COMPARAÇÃO DE CONTAGENS REAIS ---')
  console.log(`Métrica                | Dashboard | Exportação | Match?`)
  console.log(`-----------------------+-----------+------------+-------`)
  console.log(`Sessões Google Ads     | ${String(dashMetrics.kpis.sessions).padEnd(9)} | ${String(expSessions).padEnd(10)} | ${dashMetrics.kpis.sessions === expSessions ? 'SIM' : 'NÃO'}`)
  console.log(`Visitantes Únicos      | ${String(dashMetrics.kpis.unique_visitors).padEnd(9)} | ${String(expVisitors).padEnd(10)} | ${dashMetrics.kpis.unique_visitors === expVisitors ? 'SIM' : 'NÃO'}`)
  console.log(`Pageviews              | ${String(dashMetrics.kpis.pageviews).padEnd(9)} | ${String(expPageviews).padEnd(10)} | ${dashMetrics.kpis.pageviews === expPageviews ? 'SIM' : 'NÃO'}`)
  console.log(`Cliques WhatsApp       | ${String(dashMetrics.kpis.whatsapp_clicks).padEnd(9)} | ${String(expWhatsapp).padEnd(10)} | ${dashMetrics.kpis.whatsapp_clicks === expWhatsapp ? 'SIM' : 'NÃO'}`)
  console.log(`Inícios de Formulário  | ${String(dashMetrics.kpis.form_starts).padEnd(9)} | ${String(expFormStarts).padEnd(10)} | ${dashMetrics.kpis.form_starts === expFormStarts ? 'SIM' : 'NÃO'}`)
  console.log(`Leads Convertidos      | ${String(dashMetrics.kpis.real_leads).padEnd(9)} | ${String(expLeads).padEnd(10)} | ${dashMetrics.kpis.real_leads === expLeads ? 'SIM' : 'NÃO'}`)

  assert.strictEqual(dashMetrics.kpis.sessions, expSessions, 'Sessões devem ser idênticas')
  assert.strictEqual(dashMetrics.kpis.unique_visitors, expVisitors, 'Visitantes devem ser idênticos')
  assert.strictEqual(dashMetrics.kpis.pageviews, expPageviews, 'Pageviews devem ser idênticos')
  assert.strictEqual(dashMetrics.kpis.whatsapp_clicks, expWhatsapp, 'WhatsApp clicks devem ser idênticos')
  assert.strictEqual(dashMetrics.kpis.form_starts, expFormStarts, 'Form starts devem ser idênticos')
  assert.strictEqual(dashMetrics.kpis.real_leads, expLeads, 'Leads devem ser idênticos')

  console.log('\n======================================================================')
  console.log('PARIDADE 100% CONFIRMADA: GOOGLE_EXPORT_PARITY=true')
  console.log('======================================================================')
}

main().catch(err => {
  console.error('Falha na verificação de paridade:', err)
  process.exit(1)
})
