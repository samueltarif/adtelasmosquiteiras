// Session + campaign grouping is an interest signal, not a confirmed conversation.
export function whatsappProspects(clicks) {
  const groups = new Map()
  const seen = new Set()
  for (const c of [...clicks].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))) {
    if (c.tipo !== 'whatsapp' || c.is_bot === true || seen.has(c.event_id || c.id)) continue
    seen.add(c.event_id || c.id)
    const key = JSON.stringify([c.session_id || c.id, c.google_campaign_id || '', c.utm_campaign || ''])
    if (groups.has(key)) { groups.get(key).clicks++; continue }
    groups.set(key, {
      id: c.id, created_at: c.created_at, clicks: 1,
      service: c.service_name || 'Não informado',
      campaign: c.utm_campaign || '', campaign_id: c.google_campaign_id || '',
      source: c.channel || c.utm_source || 'Origem não identificada',
      page: c.landing_path || c.origem || '/',
      keyword: c.utm_term || '', has_click_id: Boolean(c.gclid || c.gbraid || c.wbraid)
    })
  }
  return [...groups.values()]
}
