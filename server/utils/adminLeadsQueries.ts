/**
 * adminLeadsQueries.ts
 * =====================================================================
 * Utilitários de consulta e agregação para a listagem administrativa de leads.
 * Modularizado (<= 200 linhas).
 * =====================================================================
 */

export interface LeadListItem {
  id: string
  created_at: string
  nome: string
  cidade: string | null
  bairro: string | null
  servico: string | null
  telefone: string | null
  email: string | null
  origem: string | null
  status: string
  session_channel: string | null
  channel: string | null
  landing_path: string | null
  conversion_path: string | null
  utm_source: string | null
  utm_campaign: string | null
  first_touch_channel: string | null
  first_touch_landing_path: string | null
  first_touch_utm_source: string | null
  first_touch_utm_campaign: string | null
  interactions_count: number
  last_interaction_at: string
  latest_landing_path: string | null
  latest_cta_location: string | null
  latest_short_code: string | null
  [key: string]: any
}

/**
 * Agrega dados de interações (whatsapp_attributions) aos leads da página atual.
 */
export async function attachAttributionsToLeads(
  leads: any[],
  supabaseUrl: string,
  headers: Record<string, string>
): Promise<LeadListItem[]> {
  if (!leads || leads.length === 0) return []

  const leadIds = leads.map(l => l.id)
  const idFilter = `(${leadIds.map(id => `"${id}"`).join(',')})`

  let attributions: any[] = []
  try {
    const fields = 'id,lead_id,short_code,clicked_at,created_at,landing_path,cta_location,channel,utm_source,utm_campaign'
    const res = await fetch(`${supabaseUrl}/rest/v1/whatsapp_attributions?lead_id=in.${encodeURIComponent(idFilter)}&select=${fields}&order=clicked_at.desc`, {
      headers
    })
    const data = await res.json()
    if (Array.isArray(data)) {
      attributions = data
    }
  } catch (err) {
    console.warn('[attachAttributionsToLeads] Falha ao buscar attributions em lote:', err)
  }

  // Agrupar por lead_id
  const attrByLead = new Map<string, any[]>()
  for (const attr of attributions) {
    if (!attr.lead_id) continue
    const list = attrByLead.get(attr.lead_id) || []
    list.push(attr)
    attrByLead.set(attr.lead_id, list)
  }

  return leads.map(lead => {
    const leadAttrs = attrByLead.get(lead.id) || []
    const count = leadAttrs.length
    const latestAttr = leadAttrs[0] || null

    const lastInteractionAt = latestAttr?.clicked_at || latestAttr?.created_at || lead.created_at

    return {
      ...lead,
      status: lead.status || 'Novo',
      interactions_count: count,
      last_interaction_at: lastInteractionAt,
      latest_landing_path: latestAttr?.landing_path || lead.landing_path || lead.conversion_path || '/',
      latest_cta_location: latestAttr?.cta_location || 'whatsapp_gate',
      latest_short_code: latestAttr?.short_code || null
    }
  })
}

/**
 * Normaliza o filtro de canal para comparação com o banco.
 */
export function normalizeChannelFilter(channel: string | undefined): string | null {
  if (!channel || channel === 'all' || channel === 'Todos') return null
  const c = channel.toLowerCase().trim()
  if (c.includes('google') && c.includes('ad')) return 'google_ads'
  if (c.includes('google') && (c.includes('org') || c.includes('seo'))) return 'google_organic'
  if (c.includes('direct') || c.includes('direto')) return 'direct'
  if (c.includes('meta') || c.includes('facebook') || c.includes('instagram')) return 'meta_ads'
  if (c.includes('tiktok')) return 'tiktok_ads'
  return c
}
