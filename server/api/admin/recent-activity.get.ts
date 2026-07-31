export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false, events: [] }
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  try {
    // Busca as 5 visitas mais recentes
    const viewsRes: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/page_views?select=id,created_at,path&order=created_at.desc&limit=5`,
      { headers }
    ).catch(() => [])

    // Busca os 5 cliques mais recentes
    const clicksRes: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/lead_clicks?select=id,created_at,tipo,origem&order=created_at.desc&limit=5`,
      { headers }
    ).catch(() => [])

    // Busca os 5 leads mais recentes
    const leadsRes: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/leads?select=id,created_at,nome,servico,cidade,bairro,origem&order=created_at.desc&limit=5`,
      { headers }
    ).catch(() => [])

    // Combina tudo em uma lista unificada de eventos
    const events: any[] = []

    for (const v of viewsRes || []) {
      const displayPath = (!v.path || v.path === '/') ? 'Home (/)' : v.path
      events.push({
        tipo: 'visita',
        label: 'Visita a página',
        sublabel: displayPath,
        created_at: v.created_at
      })
    }

    for (const c of clicksRes || []) {
      const tipoLabel: Record<string, string> = {
        whatsapp: 'Clique no WhatsApp',
        telefone: 'Ligação pelo site',
        formulario_submit: 'Início de formulário',
        cta_interno: 'Clique em CTA'
      }
      const displayPath = (!c.origem || c.origem === '/') ? 'Home (/)' : c.origem
      events.push({
        tipo: c.tipo || 'click',
        label: tipoLabel[c.tipo] || 'Interação no site',
        sublabel: displayPath,
        created_at: c.created_at
      })
    }

    for (const l of leadsRes || []) {
      const local = [l.bairro, l.cidade].filter(Boolean).join(', ') || 'Localização não informada'
      events.push({
        tipo: 'lead',
        label: `Novo lead${l.nome ? ': ' + l.nome : ''}`,
        sublabel: [l.servico, local].filter(Boolean).join(' · '),
        created_at: l.created_at
      })
    }

    // Ordena por data decrescente e retorna os 8 mais recentes
    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      success: true,
      events: events.slice(0, 8)
    }
  } catch (error: any) {
    console.error('[recent-activity] Erro:', error?.message)
    return { success: false, events: [] }
  }
})
