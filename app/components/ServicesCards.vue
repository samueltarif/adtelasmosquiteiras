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
      { titulo: 'Instalação em 48h' },
      { titulo: 'Garantia 2 anos' }
    ],
    url: '/servicos/redes'
  },
  {
    slug: 'telas',
    titulo: 'Telas Mosquiteiras',
    subtitulo: '18 serviços disponíveis',
    descricaoCurta: 'Proteção contra mosquitos transmissores de dengue, zika e chikungunya',
    imagem: '/images/TELA_MOSQUITEIRA.png',
    destaque: 'Anti-Dengue',
    beneficios: [
      { titulo: 'Visão 100% clara' },
      { titulo: 'Eficaz contra aedes' },
      { titulo: 'Instalação 48h' }
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
      
      <!-- CTA Ver Todos os Serviços -->
      <div class="text-center mt-12 md:mt-16">
        <div class="bg-gradient-to-br from-[#E5EDF8] to-white p-8 rounded-3xl border-2 border-[#E5EDF8] max-w-3xl mx-auto">
          <div class="mb-6">
            <div class="inline-flex items-center gap-2 bg-[#F49A1A] text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Icon name="lucide:check-circle" class="w-4 h-4" />
              35+ Serviços Disponíveis
            </div>
            <h3 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
              Explore Todos os Nossos Serviços
            </h3>
            <p class="text-base text-[#4B5563] mb-6">
              Redes de proteção, telas mosquiteiras e muito mais. Encontre a solução perfeita para sua necessidade.
            </p>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/servicos"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#22345F] text-white rounded-xl font-bold text-lg hover:bg-[#1a2847] transition-all duration-300 shadow-lg hover:shadow-xl group"
              data-gtm="home-ver-todos-servicos"
            >
              <span>Ver Todos os Serviços</span>
              <Icon name="lucide:arrow-right" class="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </NuxtLink>
            
            <a
              href="https://wa.me/5511983586611?text=Olá!%20Preciso%20de%20ajuda%20para%20escolher%20o%20serviço%20ideal"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg hover:shadow-xl"
              data-gtm="servicos-ajuda-whatsapp"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
              </svg>
              Falar com Especialista
            </a>
          </div>
        </div>
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
