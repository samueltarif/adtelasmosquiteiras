<script setup>
const props = defineProps({
  servicos: {
    type: Array,
    required: true
  },
  familiaSlug: {
    type: String,
    required: true
  },
  categoriaSlug: {
    type: String,
    required: true
  },
  columns: {
    type: Number,
    default: 3 // 1, 2, 3 ou 4
  }
})

// Tracking GA4
const trackClick = (servicoSlug) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'servico_card_clicked',
      familia: props.familiaSlug,
      categoria: props.categoriaSlug,
      servico: servicoSlug
    })
  }
}

// Classes de grid baseadas no número de colunas
const gridClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
}
</script>

<template>
  <div :class="['grid gap-6', gridClasses[columns]]">
    
    <NuxtLink
      v-for="servico in servicos"
      :key="servico.slug"
      :to="`/servicos/${familiaSlug}/${categoriaSlug}/${servico.slug}`"
      @click="trackClick(servico.slug)"
      class="group bg-white rounded-2xl overflow-hidden border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
      :data-gtm="`servico-${servico.slug}`"
    >
      <!-- Imagem -->
      <div class="relative h-48 overflow-hidden bg-gradient-to-br from-[#E5EDF8] to-[#F9FAFB]">
        <img
          :src="servico.imagem"
          :alt="servico.titulo"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        <!-- Badge Destaque -->
        <div v-if="servico.destaque" class="absolute top-3 right-3 bg-[#F49A1A] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          {{ servico.destaque }}
        </div>
      </div>

      <!-- Conteúdo -->
      <div class="p-5">
        <h3 class="text-lg font-bold text-[#22345F] mb-2 group-hover:text-[#F49A1A] transition-colors">
          {{ servico.titulo }}
        </h3>
        
        <p class="text-sm text-[#4B5563] mb-4">
          {{ servico.descricaoCurta }}
        </p>
        
        <!-- Botão Ver Mais -->
        <div class="flex items-center gap-2 text-[#25D366] font-semibold text-sm group-hover:gap-3 transition-all">
          <span>Ver detalhes</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </div>
      </div>
    </NuxtLink>
    
  </div>
</template>
