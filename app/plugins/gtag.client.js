/**
 * Google Analytics (gtag.js) - G-S0038L1Q6R
 * Instalado conforme orientação oficial do Google Analytics
 */
export default defineNuxtPlugin(() => {
  // Carregar script do gtag.js
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R'
  document.head.appendChild(script)

  // Inicializar dataLayer e gtag
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag

  gtag('js', new Date())
  gtag('config', 'G-S0038L1Q6R')

  console.log('✅ Google Analytics (gtag.js) carregado: G-S0038L1Q6R')
})
