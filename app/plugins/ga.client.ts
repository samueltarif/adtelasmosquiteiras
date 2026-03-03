/**
 * Google Analytics 4 (GA4) Plugin
 * 
 * Measurement ID: G-S0038L1Q6R
 * Domínio: https://www.adtelasmosquiteiras.com.br/
 * 
 * Este plugin injeta o Google Analytics 4 apenas no lado do cliente
 * e apenas em ambiente de produção.
 */

export default defineNuxtPlugin(() => {
  // Apenas executar no cliente (navegador)
  if (process.server) return

  // Apenas executar em produção
  if (process.env.NODE_ENV !== 'production') {
    console.log('[GA4] Desabilitado em desenvolvimento')
    return
  }

  const GA_MEASUREMENT_ID = 'G-S0038L1Q6R'

  // Inicializar dataLayer
  window.dataLayer = window.dataLayer || []
  
  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }

  // Injetar script gtag.js
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Configurar GA4
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true
  })

  console.log('[GA4] Inicializado:', GA_MEASUREMENT_ID)

  // Disponibilizar gtag globalmente para uso em componentes (opcional)
  return {
    provide: {
      gtag
    }
  }
})

// Declaração de tipos TypeScript
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}
