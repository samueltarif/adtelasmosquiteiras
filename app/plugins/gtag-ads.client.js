/**
 * Google Ads (gtag.js) - AW-17981093809
 * Instalado conforme orientação oficial do Google Ads
 */
export default defineNuxtPlugin(() => {
  // Carregar script do gtag.js para Google Ads
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17981093809'
  document.head.appendChild(script)

  // Inicializar dataLayer e gtag
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag

  gtag('js', new Date())
  gtag('config', 'AW-17981093809')

  console.log('✅ Google Ads (gtag.js) carregado: AW-17981093809')
})
