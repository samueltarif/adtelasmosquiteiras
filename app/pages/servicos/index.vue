<script setup>
import { useServicos } from '~/composables/useServicos'

const { getTotalServicos } = useServicos()
const totalServicos = getTotalServicos()

// SEO
useHead({
  title: 'Nossos Serviços | Redes de Proteção e Telas Mosquiteiras | AD Telas',
  meta: [
    { name: 'description', content: `${totalServicos} serviços de redes de proteção e telas mosquiteiras em São Paulo. Instalação em 48h. Garantia 2 anos. Orçamento grátis!` },
    { name: 'keywords', content: 'redes de proteção, telas mosquiteiras, janelas, sacadas, pets, crianças, são paulo' },
    { property: 'og:title', content: 'Nossos Serviços | AD Telas e Redes' },
    { property: 'og:description', content: `${totalServicos} serviços disponíveis. Proteção para sua família e seu lar.` }
  ]
})

// Tracking GA4
onMounted(() => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view_servicos',
      page_title: 'Serviços Principal'
    })
  }
})
</script>

<template>
  <div class="min-h-screen bg-white">
    
    <!-- Breadcrumb -->
    <BreadcrumbServico
      :items="[
        { label: 'Início', to: '/' },
        { label: 'Serviços' }
      ]"
    />
    
    <!-- Hero com 2 Cards: Redes vs Telas -->
    <ServicesHero />
    
    <!-- CTA Adicional -->
    <section class="py-12 bg-white border-t border-[#E5EDF8]">
      <div class="container mx-auto px-4 md:px-6 max-w-4xl text-center">
        <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-4">
          Não sabe qual serviço escolher?
        </h2>
        <p class="text-base text-[#4B5563] mb-6">
          Fale com nossos especialistas e receba uma recomendação personalizada
        </p>
        <a
          href="https://wa.me/5511983586611?text=Olá!%20Preciso%20de%20ajuda%20para%20escolher%20o%20serviço%20ideal"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
          data-gtm="servicos-ajuda-whatsapp"
        >
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Falar com Especialista
        </a>
      </div>
    </section>
    
  </div>
</template>
