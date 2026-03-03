export default defineNuxtPlugin(() => {
  // Substitua G-XXXXXXXXXX pelo seu ID do Google Analytics
  const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'
  
  // Carregar script do Google Analytics
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
  
  // Inicializar gtag
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname
  })
  
  // Rastrear mudanças de rota
  const router = useRouter()
  router.afterEach((to) => {
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: to.fullPath
    })
  })
})
