export default defineNuxtPlugin(() => {
  const GA_MEASUREMENT_ID = 'AW-473885322'
  
  // Inicializar dataLayer ANTES de carregar o script
  window.dataLayer = window.dataLayer || []
  
  // Criar função gtag e tornar global
  function gtag() {
    window.dataLayer.push(arguments)
  }
  
  // Expor gtag globalmente
  window.gtag = gtag
  
  // Carregar script do Google Ads
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
  
  // Configurar Google Ads
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
  
  // Rastrear mudanças de rota (SPA navigation)
  const router = useRouter()
  router.afterEach((to) => {
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: to.fullPath,
      page_title: document.title
    })
  })
  
  // Log para debug
  console.log('✅ Google Ads carregado:', GA_MEASUREMENT_ID)
  console.log('✅ window.gtag disponível:', typeof window.gtag)
  
  // Disponibilizar via provide/inject (opcional)
  return {
    provide: {
      gtag
    }
  }
})
