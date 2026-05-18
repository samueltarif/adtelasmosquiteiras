<script setup>
import { useServicos } from '~/composables/useServicos'

// ============================================
// COMPOSABLES
// ============================================
const { getAllFamilias } = useServicos()
const familias = getAllFamilias()

// Mapear famílias para cards
const servicosCards = [
  {
    slug: 'redes',
    titulo: 'Redes de Proteção',
    subtitulo: '17 serviços disponíveis',
    descricaoCurta: 'Proteção certificada contra quedas para crianças, pets e adultos',
    imagem: '/images/familia.png',
    destaque: 'Mais Procurado',
    beneficios: [
      { titulo: 'Resiste até 500kg' },
      { titulo: 'Instalação em 24h' },
      { titulo: 'Garantia 2 anos' }
    ],
    url: '/servicos/redes'
  },
  {
    slug: 'telas',
    titulo: 'Telas Mosquiteiras',
    subtitulo: '18 serviços disponíveis',
    descricaoCurta: 'Proteção contra mosquitos transmissores de dengue, zika e chikungunya',
    imagem: '/images/tela_mosquiteira.png',
    destaque: 'Anti-Dengue',
    beneficios: [
      { titulo: 'Visão 100% clara' },
      { titulo: 'Eficaz contra aedes' },
      { titulo: 'Instalação 24h' }
    ],
    url: '/servicos/telas'
  }
]

// ============================================
// MÉTODOS
// ============================================
const navigateToService = (url) => {
  // GA4 Event
  trackEvent('servico_card_clicked', { url })
  
  // Navegar para página do serviço
  navigateTo(url)
}

// Função para tracking de eventos (integração com GA4/GTM)
const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params
    })
  }
}
</script>

<template>
  <section id="servicos" class="py-16 md:py-24 bg-gradient-to-b from-white to-[#F9FAFB]">
    <div class="container mx-auto px-4 md:px-6 max-w-7xl">
      
      <!-- Header da Seção -->
      <div class="text-center mb-12 md:mb-16">
        <h2 class="text-3xl md:text-5xl font-bold text-[#22345F] mb-4">
          Nossos Serviços
        </h2>
        <p class="text-base md:text-lg text-[#4B5563] max-w-2xl mx-auto">
          Soluções completas para proteger sua família e seu lar
        </p>
      </div>

      <!-- Grid de Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
        
        <!-- Card de Serviço -->
        <NuxtLink
          v-for="servico in servicosCards"
          :key="servico.slug"
          :to="servico.url"
          class="group bg-white rounded-3xl overflow-hidden border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
          :data-gtm="`servico-card-${servico.slug}`"
        >
          <!-- Imagem do Serviço -->
          <div class="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-[#E5EDF8] to-[#F9FAFB]">
            <img
              :src="servico.imagem"
              :alt="servico.titulo"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            <!-- Badge de Destaque -->
            <div class="absolute top-4 left-4 bg-[#F49A1A] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
              <Icon name="lucide:check-circle" class="w-4 h-4" />
              {{ servico.destaque }}
            </div>
            
            <!-- Overlay Gradient -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <!-- Conteúdo do Card -->
          <div class="p-6 md:p-8">
            
            <!-- Título -->
            <h3 class="text-xl md:text-2xl font-bold text-[#22345F] mb-2 group-hover:text-[#F49A1A] transition-colors">
              {{ servico.titulo }}
            </h3>
            
            <!-- Subtítulo -->
            <p class="text-sm md:text-base text-[#4B5563] mb-4">
              {{ servico.subtitulo }}
            </p>
            
            <!-- Descrição Curta -->
            <p class="text-sm text-[#4B5563] mb-6">
              {{ servico.descricaoCurta }}
            </p>
            
            <!-- Benefícios (Checkmarks) -->
            <div class="space-y-2 mb-6">
              <div
                v-for="(beneficio, index) in servico.beneficios.slice(0, 3)"
                :key="index"
                class="flex items-center gap-2 text-sm text-[#22345F]"
              >
                <Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366] flex-shrink-0" />
                <span class="font-medium">{{ beneficio.titulo }}</span>
              </div>
            </div>
            
            <!-- Botão Ver Detalhes -->
            <NuxtLink
              :to="servico.url"
              class="w-full px-6 py-4 bg-[#25D366] text-white rounded-xl font-bold text-base hover:bg-[#1fb854] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg group-hover:shadow-xl"
              :data-gtm="`servico-btn-${servico.slug}`"
            >
              <span>Ver Detalhes</span>
              <Icon name="lucide:arrow-right" class="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </NuxtLink>
            
          </div>
        </NuxtLink>
        
      </div>
      

      
    </div>
  </section>
</template>

<style scoped>
/* Animações suaves */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

.group:hover .group-hover\:translate-x-1 {
  transform: translateX(0.25rem);
}
</style>
