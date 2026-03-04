export default defineNuxtPlugin(() => {
  const GA_MEASUREMENT_ID = 'G-S0038L1Q6R'
  
  // Carregar script do Google Analytics
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
  
  // Inicializar gtag e tornar global
  window.dataLayer = window.dataLayer || []
  window.gtag = function() {
    window.dataLayer.push(arguments)
  }
  
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    send_page_view: true
  })
  
  // Rastrear mudanças de rota (SPA navigation)
  const router = useRouter()
  router.afterEach((to) => {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: to.fullPath,
      page_title: document.title
    })
  })
  
  // Log para debug
  console.log('✅ Google Analytics carregado:', GA_MEASUREMENT_ID)
})
