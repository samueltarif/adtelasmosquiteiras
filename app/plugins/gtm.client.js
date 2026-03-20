// Google Tag Manager — inicializa dataLayer e expor gtag helper
// O script GTM é carregado via useHead em app.vue
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    window.dataLayer = window.dataLayer || []

    function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag = gtag
  }
})
