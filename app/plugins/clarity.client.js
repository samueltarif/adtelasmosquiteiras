// Microsoft Clarity — gravações de sessão e mapas de calor (projeto z0ddp6avz0)
// Roda apenas no client. Não carrega em páginas administrativas.
// Marca cada gravação com origem/campanha/palavra-chave do anúncio e com o ID anônimo
// do visitante (o mesmo do dashboard), para cruzar gravação ↔ sessão ↔ lead.
export default defineNuxtPlugin(() => {
  if (window.location.pathname.startsWith('/admin')) return
  // Só grava o site oficial: ignora previews da Vercel (*.vercel.app) e localhost
  if (!/^(www\.)?adtelasmosquiteiras\.com\.br$/.test(window.location.hostname)) return
  if (window.clarity) return

  ;(function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) }
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y)
  })(window, document, 'clarity', 'script', 'z0ddp6avz0')

  try {
    const q = new URLSearchParams(window.location.search)
    const tags = {
      origem: q.get('utm_source') || (q.get('gclid') || q.get('gbraid') || q.get('wbraid') ? 'google' : null),
      campanha: q.get('utm_campaign'),
      palavra_chave: q.get('utm_term'),
      correspondencia: q.get('matchtype'),
      grupo_anuncio: q.get('adgroup_id'),
      dispositivo_ads: q.get('device')
    }
    for (const [k, v] of Object.entries(tags)) {
      if (v) window.clarity('set', k, String(v).slice(0, 100))
    }
    const visitorId = useAnalyticsIdentity().getOrCreateVisitorId()
    if (visitorId) window.clarity('identify', visitorId)
  } catch {}
})
