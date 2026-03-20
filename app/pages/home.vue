<script setup>
useScrollAnimation()

// SEO otimizado para página principal
useHead({
  title: 'Telas Mosquiteiras e Redes de Proteção SP | Instalação em 24h',
  meta: [
    {
      name: 'description',
      content: 'Instalação profissional de telas mosquiteiras e redes de proteção em São Paulo. Atendemos 19 cidades, garantia de 2 anos, orçamento grátis. Proteja sua família e pets com segurança.'
    },
    // Open Graph para redes sociais
    { property: 'og:title', content: 'AD Telas e Redes SP - Proteção Profissional para Sua Família' },
    { property: 'og:description', content: 'Telas mosquiteiras e redes de proteção com instalação rápida em 24h. Atendemos toda Grande São Paulo com garantia de 2 anos.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.adtelasmosquiteiras.com.br/home' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/logo ad.png' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.adtelasmosquiteiras.com.br/home' }
  ]
})

const showFormModal = ref(false)
const openFormModal = () => { showFormModal.value = true }
</script>

<template>
  <div>
    <HeroSection />
    <ServicesCards />
    <ProblemsSection />
    <ValueProposition />
    <CaseStudies />
    <ReviewsCarousel />
    <SegmentedSolutions />
    <FaqSection />
    <CtaSection />
    <MobileUnifiedCTA
      servico-atual="Redes de Proteção ou Telas Mosquiteiras"
      @open-form="openFormModal"
    />
    <QuickHelpChat />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>
