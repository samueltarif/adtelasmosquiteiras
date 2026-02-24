<script setup>
/**
 * ============================================
 * MOBILE LANDING PAGE - ALTA CONVERSÃO
 * ============================================
 * Componente otimizado para Google Ads Mobile
 * Foco: WhatsApp, Ligação e Formulário
 * Framework: Nuxt 4 + Vue 3 + Tailwind CSS
 */

// ========== CONFIGURAÇÕES - ALTERE AQUI ==========
const config = {
  // WhatsApp
  whatsappNumber: '5511983586611', // ⚠️ ALTERAR: Número sem + e sem espaços
  whatsappMessage: 'Olá! Vi seu anúncio e gostaria de um orçamento para telas mosqueteiras.', // ⚠️ ALTERAR: Mensagem pré-preenchida
  
  // Telefone
  phoneNumber: '+5511983586611', // ⚠️ ALTERAR: Número com + para tel:
  phoneDisplay: '(11) 98358-6611', // ⚠️ ALTERAR: Formato de exibição
  
  // Textos
  logo: '/images/logo ad.png', // ⚠️ ALTERAR: Caminho da logo
  headline: 'Telas Mosqueteiras em São Paulo', // ⚠️ ALTERAR: Título principal
  subheadline: 'Instalação em 48h • Garantia 2 Anos • +500 Clientes', // ⚠️ ALTERAR: Subtítulo
  
  // Prova Social
  rating: 5.0, // ⚠️ ALTERAR: Nota de avaliação
  reviewCount: 487, // ⚠️ ALTERAR: Número de avaliações
  googleReviewUrl: 'https://www.google.com/search?q=AD+TELAS+MOSQUITEIRAS', // ⚠️ ALTERAR: Link das avaliações
  
  // CTAs
  primaryCtaText: 'Orçamento Grátis no WhatsApp',
  secondaryCtaText: 'Ligar Agora',
  
  // Analytics - IDs para tracking
  gtm: {
    headerWhatsapp: 'cta_whatsapp_header',
    heroWhatsapp: 'cta_whatsapp_hero',
    heroPhone: 'cta_phone_hero',
    stickyWhatsapp: 'cta_whatsapp_sticky',
    stickyPhone: 'cta_phone_sticky',
    formSubmit: 'form_submit_hero'
  }
}

// ========== COMPUTED ==========
const whatsappLink = computed(() => 
  `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage)}`
)

// ========== STATE ==========
const showFormModal = ref(false)
const formData = ref({
  name: '',
  phone: '',
  message: ''
})

// ========== METHODS ==========
const handleFormSubmit = () => {
  // ⚠️ IMPLEMENTAR: Lógica de envio do formulário
  console.log('Form submitted:', formData.value)
  
  // Exemplo: Enviar para API
  // await $fetch('/api/leads', { method: 'POST', body: formData.value })
  
  // Fechar modal
  showFormModal.value = false
  
  // Redirecionar para WhatsApp (opcional)
  window.open(whatsappLink.value, '_blank')
}

const trackEvent = (eventName) => {
  // ⚠️ IMPLEMENTAR: Tracking GA4/GTM
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      timestamp: new Date().toISOString()
    })
  }
  console.log('Event tracked:', eventName)
}
</script>

<template>
  <!-- ============================================ -->
  <!-- CONTAINER PRINCIPAL - MOBILE ONLY           -->
  <!-- ============================================ -->
  <div class="md:hidden min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
    
    <!-- ========================================== -->
    <!-- HEADER FIXO COMPACTO                       -->
    <!-- ========================================== -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm h-16">
      <div class="flex items-center justify-between h-full px-4">
        <!-- Logo -->
        <img 
          :src="config.logo" 
          alt="Logo"
          class="h-10 w-auto"
        />
        
        <!-- WhatsApp Header -->
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          :data-gtm-event="config.gtm.headerWhatsapp"
          @click="trackEvent(config.gtm.headerWhatsapp)"
          class="flex items-center justify-center w-12 h-12 bg-[#25D366] rounded-full shadow-lg active:scale-95 transition-transform"
          aria-label="Abrir WhatsApp"
        >
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
        </a>
      </div>
    </header>

    <!-- ========================================== -->
    <!-- HERO SECTION - PRIMEIRA DOBRA              -->
    <!-- ========================================== -->
    <section class="pt-20 px-4 pb-24 text-white">
      
      <!-- 1. PROVA SOCIAL IMEDIATA -->
      <a 
        :href="config.googleReviewUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="block bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-5 border border-white/20 active:scale-[0.98] transition-transform"
      >
        <div class="flex items-center justify-center gap-2 mb-2">
          <!-- Logo Google -->
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          
          <!-- Estrelas -->
          <div class="flex gap-0.5">
            <svg 
              v-for="i in 5" 
              :key="i" 
              class="w-4 h-4 text-yellow-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
          
          <!-- Rating -->
          <span class="text-white font-bold text-sm">{{ config.rating }}</span>
          <span class="text-white/90 text-xs">({{ config.reviewCount }})</span>
        </div>
        
        <p class="text-white/95 text-sm text-center italic">
          "Instalação perfeita, super pontuais"
        </p>
      </a>

      <!-- 2. HEADLINE -->
      <h1 class="text-[32px] leading-[1.1] font-extrabold mb-3 text-center">
        {{ config.headline }}
      </h1>
      
      <!-- 3. SUBHEADLINE -->
      <p class="text-base font-medium mb-6 text-center text-white/95 leading-relaxed">
        {{ config.subheadline }}
      </p>

      <!-- 4. CTAs PRINCIPAIS -->
      <div class="space-y-3 mb-6">
        <!-- CTA Primário - WhatsApp -->
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          :data-gtm-event="config.gtm.heroWhatsapp"
          @click="trackEvent(config.gtm.heroWhatsapp)"
          class="flex items-center justify-center gap-3 w-full h-14 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          <span>{{ config.primaryCtaText }}</span>
        </a>

        <!-- CTA Secundário - Ligar -->
        <a 
          :href="`tel:${config.phoneNumber}`"
          :data-gtm-event="config.gtm.heroPhone"
          @click="trackEvent(config.gtm.heroPhone)"
          class="flex items-center justify-center gap-3 w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm border-2 border-white/30 active:scale-[0.98] transition-all"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          <span>{{ config.secondaryCtaText }}: {{ config.phoneDisplay }}</span>
        </a>
      </div>

      <!-- 5. TRUST BADGES -->
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

    </section>

    <!-- ========================================== -->
    <!-- BARRA STICKY INFERIOR                      -->
    <!-- ========================================== -->
    <div class="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div class="flex gap-2 p-3">
        
        <!-- Botão WhatsApp (60%) -->
        <a 
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          :data-gtm-event="config.gtm.stickyWhatsapp"
          @click="trackEvent(config.gtm.stickyWhatsapp)"
          class="flex-[3] flex items-center justify-center gap-2 h-14 bg-[#25D366] hover:bg-[#1fb854] text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          <span>WhatsApp</span>
        </a>

        <!-- Botão Ligar (40%) -->
        <a 
          :href="`tel:${config.phoneNumber}`"
          :data-gtm-event="config.gtm.stickyPhone"
          @click="trackEvent(config.gtm.stickyPhone)"
          class="flex-[2] flex items-center justify-center gap-2 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          <span>Ligar</span>
        </a>

      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL DE FORMULÁRIO (OPCIONAL)             -->
    <!-- ========================================== -->
    <Teleport to="body">
      <div 
        v-if="showFormModal"
        class="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="showFormModal = false"
      >
        <div class="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 animate-slide-up">
          
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900">Solicitar Orçamento</h3>
            <button 
              @click="showFormModal = false"
              class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fechar"
            >
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Formulário -->
          <form 
            @submit.prevent="handleFormSubmit" 
            :data-gtm-event="config.gtm.formSubmit"
            class="space-y-4"
          >
            <!-- Nome -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input 
                id="name"
                v-model="formData.name"
                type="text" 
                required
                placeholder="Seu nome"
                class="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <!-- Telefone -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
                Telefone/WhatsApp
              </label>
              <input 
                id="phone"
                v-model="formData.phone"
                type="tel" 
                required
                placeholder="(11) 99999-9999"
                class="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <!-- Mensagem -->
            <div>
              <label for="message" class="block text-sm font-medium text-gray-700 mb-1">
                Mensagem (opcional)
              </label>
              <textarea 
                id="message"
                v-model="formData.message"
                rows="3"
                placeholder="Conte-nos sobre seu projeto..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
              ></textarea>
            </div>

            <!-- Botão Submit -->
            <button 
              type="submit"
              class="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-base shadow-lg active:scale-[0.98] transition-all"
            >
              Enviar Solicitação
            </button>

            <!-- Aviso LGPD -->
            <p class="text-xs text-gray-500 text-center">
              Ao enviar, você concorda com nossa política de privacidade
            </p>
          </form>

        </div>
      </div>
    </Teleport>

  </div>

  <!-- ========================================== -->
  <!-- MENSAGEM PARA DESKTOP                      -->
  <!-- ========================================== -->
  <div class="hidden md:flex items-center justify-center min-h-screen bg-gray-100">
    <div class="text-center p-8">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
      </svg>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        Visualização Mobile
      </h1>
      <p class="text-gray-600 mb-4">
        Este componente foi otimizado para dispositivos móveis.
      </p>
      <p class="text-sm text-gray-500">
        Abra em um celular ou reduza a largura do navegador.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Animação para modal */
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
