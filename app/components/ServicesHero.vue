<script setup>
import { useServicos } from '~/composables/useServicos'

const { getAllFamilias } = useServicos()
const familias = getAllFamilias()

// Tracking GA4
const trackClick = (familiaSlug) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'familia_clicked',
      familia: familiaSlug
    })
  }
}
</script>

<template>
  <section class="py-16 md:py-24 bg-gradient-to-b from-white to-[#F9FAFB]">
    <div class="container mx-auto px-4 md:px-6 max-w-7xl">
      
      <!-- Header -->
      <div class="text-center mb-12 md:mb-16">
        <h1 class="text-3xl md:text-5xl font-bold text-[#22345F] mb-4">
          Nossos Serviços
        </h1>
        <p class="text-base md:text-lg text-[#4B5563] max-w-2xl mx-auto">
          Escolha entre Redes de Proteção ou Telas Mosquiteiras
        </p>
      </div>

      <!-- 2 Cards Grandes: Redes vs Telas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
        
        <NuxtLink
          v-for="familia in familias"
          :key="familia.slug"
          :to="`/servicos/${familia.slug}`"
          @click="trackClick(familia.slug)"
          class="group bg-white rounded-3xl overflow-hidden border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
          :data-gtm="`familia-${familia.slug}`"
        >
          <!-- Imagem -->
          <div class="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-[#E5EDF8] to-[#F9FAFB]">
            <img
              :src="familia.imagem"
              :alt="familia.nome"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            <!-- Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            
            <!-- Icon Badge -->
            <div class="absolute top-4 left-4 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Icon v-if="familia.iconName" :name="familia.iconName" class="w-10 h-10 text-[#22345F]" />
              <span v-else class="text-4xl">{{ familia.icon }}</span>
            </div>
          </div>

          <!-- Conteúdo -->
          <div class="p-6 md:p-8">
            <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3 group-hover:text-[#F49A1A] transition-colors">
              {{ familia.nome }}
            </h2>
            
            <p class="text-base text-[#4B5563] mb-6">
              {{ familia.descricao }}
            </p>
            
            <!-- Contador de Serviços -->
            <div class="flex items-center justify-between mb-6 p-4 bg-[#E5EDF8] rounded-xl">
              <span class="text-sm font-semibold text-[#22345F]">Total de serviços</span>
              <span class="text-2xl font-bold text-[#F49A1A]">
                {{ Object.values(familia.categorias).reduce((sum, cat) => sum + Object.keys(cat.servicos).length, 0) }}
              </span>
            </div>
            
            <!-- Botão visual (não interativo, o card inteiro é clicável) -->
            <div class="w-full px-6 py-4 bg-[#25D366] text-white rounded-xl font-bold text-base group-hover:bg-[#1fb854] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg group-hover:shadow-xl">
              <span>Ver Todos os Serviços</span>
              <Icon name="lucide:arrow-right" class="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </NuxtLink>
        
      </div>
      
    </div>
  </section>
</template>
