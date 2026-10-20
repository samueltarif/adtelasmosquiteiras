/**
 * Lista de visitas (sessões) vindas do Google Ads, com o caminho de cada uma:
 * entrou → páginas vistas → abriu o pop-up → digitou → enviou (WhatsApp) → virou lead.
 * Usada na aba Google Ads do dashboard (tabela "Visitas do Google Ads").
 */
const isAds = (x) =>
  x.channel === 'google_ads' || !!(x.gclid || x.gbraid || x.wbraid) || (x.utm_medium || '').toLowerCase().includes('cpc')

export function buildGoogleAdsSessions(rawViews, rawClicks, rawLeads, limit = 100) {
  const sessions = new Map()

  for (const v of rawViews || []) {
    if (v.is_bot === true || !v.session_id || !isAds(v)) continue
    let s = sessions.get(v.session_id)
    if (!s) {
      s = {
        session_id: v.session_id,
        started_at: v.created_at,
        last_event_at: v.created_at,
        keyword: v.utm_term || null,
        match_type: v.google_match_type || null,
        device: v.device_type || v.google_device || null,
        entry_path: v.path || v.landing_path || '/',
        pageviews: 0,
        pages: [],
        opened_popup: false,
        typed: false,
        sent_whatsapp: false,
        lead: false
      }
      sessions.set(v.session_id, s)
    }
    s.pageviews++
    if (v.created_at < s.started_at) s.started_at = v.created_at
    if (v.created_at > s.last_event_at) s.last_event_at = v.created_at
    const p = v.path || '/'
    if (!s.pages.includes(p)) s.pages.push(p)
    if (!s.keyword && v.utm_term) s.keyword = v.utm_term
  }

  for (const c of rawClicks || []) {
    const s = c.session_id && sessions.get(c.session_id)
    if (!s || c.is_bot === true) continue
    if (c.tipo === 'form_start') s.opened_popup = true
    if (c.tipo === 'whatsapp_gate_typing') { s.typed = true; s.opened_popup = true }
    if (c.tipo === 'whatsapp') s.sent_whatsapp = true
    if (c.created_at > s.last_event_at) s.last_event_at = c.created_at
  }

  for (const l of rawLeads || []) {
    const s = l.session_id && sessions.get(l.session_id)
    if (s) s.lead = true
  }

  return [...sessions.values()]
    .map((s) => ({
      ...s,
      duration_seconds: Math.max(0, Math.round((new Date(s.last_event_at) - new Date(s.started_at)) / 1000))
    }))
    .sort((a, b) => (a.started_at < b.started_at ? 1 : -1))
    .slice(0, limit)
}
