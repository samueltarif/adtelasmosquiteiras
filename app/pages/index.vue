<script setup>
useScrollAnimation()

useHead({
  title: 'Telas Mosquiteiras e Redes de Proteção em SP | AD Telas',
  meta: [
    {
      name: 'description',
      content: 'Telas mosquiteiras, redes de proteção para janelas, sacadas e pets e vidraçaria em São Paulo. Conheça os serviços sob medida e solicite seu orçamento.'
    },
    { property: 'og:title', content: 'AD Telas e Redes SP - Proteção Profissional para Sua Família' },
    { property: 'og:description', content: 'Telas mosquiteiras, redes de proteção e vidraçaria em São Paulo. Encontre o serviço para seu imóvel e solicite um orçamento sob medida.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.adtelasmosquiteiras.com.br/' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/logo_adt_telas_nova.png' },
  ],
  // Canonical gerado dinamicamente pelo app.vue para todas as páginas
})

const showFormModal = ref(false)
const openFormModal = () => { showFormModal.value = true }

onMounted(() => {
  const hash = window.location.hash?.replace('#', '')
  if (hash) {
    setTimeout(() => {
      const el = document.getElementById(hash) || 
                 document.querySelector(`[data-section="${hash}"]`) ||
                 (hash === 'services' ? document.getElementById('servicos') : null)
      if (el) {
        const headerHeight = 112
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }, 300)
  }
})
</script>

<template>
  <div>
    <div id="hero"><HeroSection /></div>
    <div id="services"><ServicesCards /></div>
    <HomeServiceGuide />
    <div id="reviews"><ReviewsCarousel /></div>
    <div id="faq"><FaqSection /></div>
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>
