export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return {
      success: false, totalLeads: 0, whatsappClicks: 0, conversionRate: '0.0%',
      totalVisits: 0, uniqueVisitors: 0,
      dailyLeads: [], dailyVisits: [], serviceDistribution: [], topLocations: [], topPages: []
    }
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
  }

  try {
    // 1. Leads
    const leadsRes: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/leads?select=id,created_at,servico,cidade,bairro,status&order=created_at.asc`,
      { headers }
    )
    const leads = leadsRes || []
    const totalLeads = leads.length

    // 2. Cliques
    const clicksRes: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/lead_clicks?select=id`,
      { headers }
    )
    const whatsappClicks = clicksRes?.length || 0

    // 3. Page Views
    const viewsRes: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/page_views?select=id,created_at,path,ip_hash,session_id&order=created_at.asc`,
      { headers }
    )
    const views = viewsRes || []
    const totalVisits = views.length
    const uniqueSessions = new Set(views.map(v => v.session_id || v.ip_hash)).size

    // 4. Conversão: leads / visitas (mais realista que leads/clicks)
    let conversionRate = '0.0%'
    if (totalVisits > 0) {
      conversionRate = ((totalLeads / totalVisits) * 100).toFixed(1) + '%'
    } else if (whatsappClicks > 0) {
      conversionRate = ((totalLeads / whatsappClicks) * 100).toFixed(1) + '%'
    }

    // 5. Leads diários (15 dias)
    const dailyCounts: Record<string, number> = {}
    const dailyViewCounts: Record<string, number> = {}
    for (let i = 14; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const k = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      dailyCounts[k] = 0
      dailyViewCounts[k] = 0
    }

    leads.forEach(l => {
      if (!l.created_at) return
      const k = new Date(l.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (dailyCounts[k] !== undefined) dailyCounts[k]++
    })

    views.forEach(v => {
      if (!v.created_at) return
      const k = new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (dailyViewCounts[k] !== undefined) dailyViewCounts[k]++
    })

    const dailyLeads = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))
    const dailyVisits = Object.entries(dailyViewCounts).map(([date, count]) => ({ date, count }))

    // 6. Serviços
    const svcMap: Record<string, number> = { 'Redes de Proteção': 0, 'Telas Mosquiteiras': 0, 'Outros': 0 }
    leads.forEach(l => {
      const s = (l.servico || '').toLowerCase()
      if (s.includes('rede')) svcMap['Redes de Proteção']++
      else if (s.includes('tela') || s.includes('mosquiteira')) svcMap['Telas Mosquiteiras']++
      else svcMap['Outros']++
    })
    const serviceDistribution = Object.entries(svcMap).map(([name, count]) => ({
      name, count, percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
    }))

    // 7. Localizações
    const locMap: Record<string, number> = {}
    leads.forEach(l => { const c = l.cidade || 'São Paulo'; locMap[c] = (locMap[c] || 0) + 1 })
    const topLocations = Object.entries(locMap)
      .map(([name, count]) => ({ name, count, percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0 }))
      .sort((a, b) => b.count - a.count).slice(0, 4)

    // 8. Páginas mais visitadas
    const pageMap: Record<string, number> = {}
    views.forEach(v => {
      const p = (!v.path || v.path === '/') ? 'Home (/)' : v.path
      pageMap[p] = (pageMap[p] || 0) + 1
    })
    const topPages = Object.entries(pageMap)
      .map(([path, count]) => ({ path, count, percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0 }))
      .sort((a, b) => b.count - a.count).slice(0, 5)

    return {
      success: true, totalLeads, whatsappClicks, conversionRate,
      totalVisits, uniqueVisitors: uniqueSessions,
      dailyLeads, dailyVisits, serviceDistribution, topLocations, topPages
    }
  } catch (error: any) {
    console.error('[dashboard-stats] Erro:', error?.message)
    return {
      success: false, totalLeads: 0, whatsappClicks: 0, conversionRate: '0.0%',
      totalVisits: 0, uniqueVisitors: 0,
      dailyLeads: [], dailyVisits: [], serviceDistribution: [], topLocations: [], topPages: []
    }
  }
})
