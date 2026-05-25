<script setup>
useScrollAnimation()

useHead({
  title: 'Telas Mosquiteiras e Redes de Proteção SP | Instalação em 24h',
  meta: [
    {
      name: 'description',
      content: 'Instalação profissional de telas mosquiteiras e redes de proteção em São Paulo. Atendemos 19 cidades, garantia de 2 anos, orçamento grátis. Proteja sua família e pets com segurança.'
    },
    { property: 'og:title', content: 'AD Telas e Redes SP - Proteção Profissional para Sua Família' },
    { property: 'og:description', content: 'Telas mosquiteiras e redes de proteção com instalação rápida em 24h. Atendemos toda Grande São Paulo com garantia de 2 anos.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.adtelasmosquiteiras.com.br/' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/logo_adt_telas.png' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.adtelasmosquiteiras.com.br/' }
  ]
})

const showFormModal = ref(false)
const openFormModal = () => { showFormModal.value = true }

onMounted(() => {
  const hash = window.location.hash?.replace('#', '')
  if (hash) {
    setTimeout(() => {
      const el = document.getElementById(hash)
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
    <div id="problems"><ServicesCards /><ProblemsSection /></div>
    <div id="value"><ValueProposition /></div>
    <div id="cases"><CaseStudies /></div>
    <div id="reviews"><ReviewsCarousel /></div>
    <div id="solutions"><SegmentedSolutions /></div>
    <div id="faq"><FaqSection /></div>
    <CtaSection />
    <MobileUnifiedCTA
      servico-atual="Redes de Proteção ou Telas Mosquiteiras"
      @open-form="openFormModal"
    />
    <QuickHelpChat />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>
