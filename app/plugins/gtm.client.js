// Google Tag Manager — inicializa dataLayer e injeta script GTM no head
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    window.dataLayer = window.dataLayer || []

    // Injeta o script GTM dinamicamente (client-only — evita hydration mismatch)
    ;(function (w, d, s, l, i) {
      w[l] = w[l] || []
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
      const f = d.getElementsByTagName(s)[0]
      const j = d.createElement(s)
      const dl = l !== 'dataLayer' ? '&l=' + l : ''
      j.async = true
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl
      f.parentNode.insertBefore(j, f)
    })(window, document, 'script', 'dataLayer', 'GTM-KZTR2DHT')

    function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag = gtag
  }
})
