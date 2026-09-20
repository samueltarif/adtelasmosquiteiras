// GA4 via gtag.js
// Carregado para medição direta do Google Analytics 4
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    window.dataLayer = window.dataLayer || []
    function gtag() { window.dataLayer.push(arguments) }
    window.gtag = gtag

    // Não injeta scripts de marketing/ads em páginas administrativas
    if (window.location.pathname.startsWith('/admin')) {
      return
    }

    // Carregar gtag.js uma única vez (suporta múltiplos IDs)
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R'
    document.head.appendChild(script)

    gtag('js', new Date())
    gtag('config', 'G-S0038L1Q6R')
  }
})
