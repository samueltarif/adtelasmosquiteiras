<script setup>
// Props para customização
const props = defineProps({
  logoSrc: {
    type: String,
    default: '/images/logo ad.png'
  },
  whatsappNumber: {
    type: String,
    default: '5511983586611'
  },
  whatsappMessage: {
    type: String,
    default: 'Olá! Gostaria de solicitar um orçamento.'
  },
  headline: {
    type: String,
    default: 'Telas Mosqueteiras em São Paulo'
  },
  subheadline: {
    type: String,
    default: 'Instalação em 48h • Garantia 2 Anos • +500 Clientes Satisfeitos'
  },
  rating: {
    type: Number,
    default: 5.0
  },
  reviewCount: {
    type: Number,
    default: 487
  },
  primaryCtaText: {
    type: String,
    default: 'Orçamento Grátis no WhatsApp'
  },
  secondaryCtaText: {
    type: String,
    default: 'Ligar Agora'
  },
  phoneNumber: {
    type: String,
    default: '+5511983586611'
  }
})

// Computed para links
const whatsappLink = computed(() => 
  `https://wa.me/${props.whatsappNumber}?text=${encodeURIComponent(props.whatsappMessage)}`
)
</script>

<template>
  <!-- Container Principal - Mobile Only -->
  <div class="md:hidden min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white">
    
    <!-- ========== HEADER FIXO COMPACTO ========== -->
    <header class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50 h-16">
      <div class="flex items-center justify-between h-full px-4">
        <!-- Logo -->
        <img 
          :src="logoSrc" 
          alt="Logo"
          class="h-10 w-auto"
        />
        
        <!-- WhatsApp Icon -->
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center w-12 h-12 bg-[#25D366] rounded-full shadow-lg active:scale-95 transition-transform"
          aria-label="Abrir WhatsApp"
        >
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
        </a>
      </div>
    </header>

    <!-- ========== HERO CONTENT (Abaixo do header) ========== -->
    <div class="pt-20 px-4 pb-8">
      
      <!-- 1. HEADLINE DIRETA -->
      <h1 class="text-[32px] leading-[1.1] font-extrabold mb-3 text-center">
        {{ headline }}
      </h1>
      
      <!-- 2. SUBHEADLINE COM BENEFÍCIOS -->
      <p class="text-base font-medium mb-5 text-center text-white/95 leading-relaxed">
        {{ subheadline }}
      </p>

      <!-- 3. PROVA SOCIAL COMPACTA -->
      <div class="flex items-center justify-center gap-3 mb-6 bg-white/10 backdrop-blur-sm rounded-xl py-3 px-4 border border-white/20">
        <!-- Estrelas -->
        <div class="flex gap-0.5">
          <svg 
            v-for="i in 5" 
            :key="i" 
            class="w-5 h-5 text-yellow-400" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </div>
        
        <!-- Rating e Reviews -->
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold">{{ rating }}</span>
          <span class="text-sm text-white/80">({{ reviewCount }} avaliações)</span>
        </div>
      </div>

      <!-- 4. CTAs VERTICAIS -->
      <div class="space-y-3 mb-6">
        <!-- CTA Primário - WhatsApp -->
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-3 w-full h-14 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          <span>{{ primaryCtaText }}</span>
        </a>

        <!-- CTA Secundário - Ligar -->
        <a 
          :href="`tel:${phoneNumber}`"
          class="flex items-center justify-center gap-3 w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm border-2 border-white/30 active:scale-[0.98] transition-all"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          <span>{{ secondaryCtaText }}</span>
        </a>
      </div>

      <!-- 5. TRUST BADGES (Opcional) -->
      <div class="flex items-center justify-center gap-4 text-xs text-white/80">
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>Resposta em 24h</span>
        </div>
        <div class="w-px h-4 bg-white/30"></div>
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
          </svg>
          <span>100% Seguro</span>
        </div>
      </div>

    </div>

    <!-- ========== BARRA STICKY INFERIOR ========== -->
    <StickyBottomBar
      :whatsapp-number="whatsappNumber"
      :whatsapp-message="whatsappMessage"
      :phone-number="phoneNumber"
      primary-text="WhatsApp"
      secondary-text="Ligar"
      secondary-action="call"
    />

  </div>
</template>
