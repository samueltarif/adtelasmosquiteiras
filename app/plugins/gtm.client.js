// Google Tag Manager — inicializa dataLayer e injeta script GTM no head
// Roda apenas no client (sufixo .client.js), garantindo que window está disponível
export default defineNuxtPlugin(() => {
  // Inicializa dataLayer antes de qualquer push — evita race condition
  window.dataLayer = window.dataLayer || []

  // Define gtag globalmente antes de injetar o script GTM
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }

  // Não injeta scripts de marketing/ads em páginas administrativas
  if (window.location.pathname.startsWith('/admin')) {
    return
  }

  // Sinaliza início do GTM
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })

  // Injeta script GTM no head
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-KZTR2DHT'
  document.head.insertBefore(script, document.head.firstChild)
})
