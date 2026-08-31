/**
 * Formatação de Eventos de Atividade Recente para Analytics
 * Arquivo: server/shared/adminAnalyticsActivity.mjs
 */

export function formatRecentActivityEvents(recentViews, recentClicks, recentLeads) {
  const events = []
  for (const v of (recentViews || [])) {
    events.push({
      tipo: 'visita',
      label: 'Visita a página',
      sublabel: (!v.path || v.path === '/') ? 'Home (/)' : v.path,
      created_at: v.created_at,
      channel: v.channel || null,
      device_type: v.device_type || null,
      is_bot: v.is_bot || false
    })
  }

  const tipoLabel = {
    whatsapp: 'Clique no WhatsApp',
    telefone: 'Ligação pelo site',
    formulario_submit: 'Início de formulário',
    internal_cta: 'Clique em CTA'
  }

  for (const c of (recentClicks || [])) {
    events.push({
      tipo: c.tipo || 'click',
      label: tipoLabel[c.tipo] || 'Interação no site',
      sublabel: (!c.origem || c.origem === '/') ? 'Home (/)' : c.origem,
      created_at: c.created_at,
      service_name: c.service_name || null,
      service_key: c.service_key || null,
      cta_location: c.cta_location || null,
      channel: c.channel || null,
      device_type: c.device_type || null
    })
  }

  for (const l of (recentLeads || [])) {
    const local = [l.bairro, l.cidade].filter(Boolean).join(', ') || 'Localização não informada'
    events.push({
      tipo: 'lead',
      label: `Novo lead${l.nome ? ': ' + l.nome : ''}`,
      sublabel: [l.servico, local].filter(Boolean).join(' · '),
      created_at: l.created_at,
      channel: l.channel || null,
      landing_path: l.landing_path || null
    })
  }

  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return events.slice(0, 10)
}
