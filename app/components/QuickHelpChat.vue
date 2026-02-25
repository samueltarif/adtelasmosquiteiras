<script setup>
import { ref, computed } from 'vue'

// ============================================
// CONFIGURAÇÕES - Edite aqui conforme necessário
// ============================================
const WHATSAPP_NUMBER = '5511983586611' // Número WhatsApp da empresa
const COMPANY_NAME = 'AD Telas Mosquiteiras'

// Estados reativos
const isOpen = ref(false)
const currentStep = ref(1)
const selectedNeed = ref('')
const selectedService = ref('')
const selectedProperty = ref('')
const userName = ref('')
const userNeighborhood = ref('')

// Controle de animação de entrada
const showContent = ref(false)

// Toast de sucesso
const showSuccessToast = ref(false)

// Touch handlers para swipe down
const touchStartY = ref(0)
const touchEndY = ref(0)

// ============================================
// COMPUTED PROPERTIES
// ============================================
const progressPercentage = computed(() => {
  return (currentStep.value / 4) * 100
})

const canProceedStep4 = computed(() => {
  return userName.value.trim().length > 0 && userNeighborhood.value.trim().length > 0
})

// Mensagem WhatsApp pré-formatada
const whatsappMessage = computed(() => {
  let message = `Olá! Vim pelo chat rápido do site.\n\n`
  message += `Nome: ${userName.value}\n`
  
  if (userNeighborhood.value) {
    message += `Bairro: ${userNeighborhood.value}\n`
  }
  
  if (selectedNeed.value) {
    message += `Preciso proteger: ${selectedNeed.value}\n`
  }
  
  if (selectedService.value) {
    message += `Serviço: ${selectedService.value}\n`
  }
  
  if (selectedProperty.value) {
    message += `Tipo de imóvel: ${selectedProperty.value}\n`
  }
  
  message += `\nGostaria de receber um orçamento!`
  
  return encodeURIComponent(message)
})

// ============================================
// MÉTODOS
// ============================================
const openChat = () => {
  isOpen.value = true
  setTimeout(() => {
    showContent.value = true
  }, 50)
  // GA4 Event
  trackEvent('chat_opened')
}

const closeChat = () => {
  showContent.value = false
  setTimeout(() => {
    isOpen.value = false
    resetChat()
  }, 300)
  // GA4 Event
  trackEvent('chat_closed')
}


const resetChat = () => {
  currentStep.value = 1
  selectedNeed.value = ''
  selectedService.value = ''
  selectedProperty.value = ''
  userName.value = ''
  userNeighborhood.value = ''
}

const selectNeed = (need) => {
  selectedNeed.value = need
  
  // Determinar serviço baseado na necessidade
  if (need === 'Crianças' || need === 'Pets') {
    selectedService.value = 'Rede de Proteção para janelas/varanda'
  } else if (need === 'Contra mosquitos') {
    selectedService.value = 'Tela Mosquiteira invisível'
  } else if (need === 'Todos os 3') {
    selectedService.value = 'Pacote completo proteção familiar'
  }
  
  // GA4 Event
  trackEvent('chat_step1_selected', { need })
  
  // Avançar para próxima etapa
  setTimeout(() => {
    currentStep.value = 2
  }, 300)
}

const confirmService = () => {
  // GA4 Event
  trackEvent('chat_step2_confirmed', { service: selectedService.value })
  
  currentStep.value = 3
}

const selectProperty = (property) => {
  selectedProperty.value = property
  
  // GA4 Event
  trackEvent('chat_step3_selected', { property })
  
  // Avançar para próxima etapa
  setTimeout(() => {
    currentStep.value = 4
  }, 300)
}

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const openWhatsApp = () => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage.value}`
  
  // Mostrar toast de sucesso
  showSuccessToast.value = true
  
  // GA4 Event
  trackEvent('chat_whatsapp_opened', {
    need: selectedNeed.value,
    service: selectedService.value,
    property: selectedProperty.value
  })
  
  // Abrir WhatsApp após pequeno delay
  setTimeout(() => {
    window.open(url, '_blank')
  }, 500)
  
  // Fechar modal e esconder toast após 2s
  setTimeout(() => {
    showSuccessToast.value = false
    closeChat()
  }, 2000)
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

// Touch handlers para swipe down
const handleTouchStart = (e) => {
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  touchEndY.value = e.touches[0].clientY
}

const handleTouchEnd = () => {
  const swipeDistance = touchEndY.value - touchStartY.value
  
  // Se swipe para baixo > 100px, fecha o modal
  if (swipeDistance > 100) {
    closeChat()
  }
  
  touchStartY.value = 0
  touchEndY.value = 0
}

// Fechar ao clicar fora
const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    closeChat()
  }
}

// Sem máscara necessária para bairro
</script>

<template>
  <!-- Bolha Flutuante - Inferior Esquerda -->
  <div class="fixed bottom-6 left-6 z-40">
    <button
      @click="openChat"
      class="flex items-center gap-2 bg-[#FFF7ED] hover:bg-[#F49A1A] text-[#22345F] hover:text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-[#F49A1A] group"
      aria-label="Abrir ajuda rápida"
      data-gtm="quick_help_bubble_clicked"
    >
      <!-- Ícone Chat -->
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
      
      <!-- Texto -->
      <span class="font-semibold text-sm whitespace-nowrap">
        Ajuda rápida?
      </span>
      
      <!-- Indicador de pulso -->
      <span class="absolute -top-1 -right-1 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F49A1A] opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-[#F49A1A]"></span>
      </span>
    </button>
  </div>

  <!-- Modal/Bottom Sheet -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="translate-y-full md:translate-y-0 md:scale-95 opacity-0"
          enter-to-class="translate-y-0 md:scale-100 opacity-100"
          leave-active-class="transition-all duration-300"
          leave-from-class="translate-y-0 md:scale-100 opacity-100"
          leave-to-class="translate-y-full md:translate-y-0 md:scale-95 opacity-0"
        >
          <div
            v-if="showContent"
            class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[90vh] overflow-hidden shadow-2xl border-2 border-[#E5EDF8]"
            @click.stop
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#22345F] to-[#1a2847] text-white p-4 relative">
              <!-- Drag Handle (Mobile) -->
              <div class="md:hidden w-12 h-1 bg-white/30 rounded-full mx-auto mb-3"></div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-6 h-6 text-[#F49A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <div>
                    <h3 class="font-bold text-lg">Ajuda Rápida</h3>
                    <p class="text-xs text-white/80">{{ COMPANY_NAME }}</p>
                  </div>
                </div>
                
                <button
                  @click="closeChat"
                  class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Fechar"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <!-- Progress Bar -->
              <div class="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div 
                  class="bg-[#F49A1A] h-full transition-all duration-500 ease-out"
                  :style="{ width: `${progressPercentage}%` }"
                ></div>
              </div>
              
              <!-- Step Indicator -->
              <div class="mt-2 text-center text-xs text-white/70">
                Etapa {{ currentStep }} de 4
              </div>
            </div>


            <!-- Content Area -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              
              <!-- ETAPA 1: O que você precisa proteger? -->
              <div v-if="currentStep === 1" class="space-y-4 animate-fade-in">
                <div class="text-center mb-6">
                  <div class="w-16 h-16 bg-[#F49A1A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-[#F49A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <h4 class="text-xl font-bold text-[#22345F] mb-2">
                    O que você precisa proteger?
                  </h4>
                  <p class="text-sm text-[#4B5563]">
                    Escolha a opção que melhor descreve sua necessidade
                  </p>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                  <button
                    @click="selectNeed('Crianças')"
                    class="flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#E5EDF8] rounded-2xl hover:border-[#F49A1A] hover:bg-[#FFF7ED] transition-all duration-200 group"
                    data-gtm="chat_step1_criancas"
                  >
                    <span class="text-3xl">👶</span>
                    <span class="text-sm font-semibold text-[#22345F] group-hover:text-[#F49A1A]">Crianças</span>
                  </button>
                  
                  <button
                    @click="selectNeed('Pets')"
                    class="flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#E5EDF8] rounded-2xl hover:border-[#F49A1A] hover:bg-[#FFF7ED] transition-all duration-200 group"
                    data-gtm="chat_step1_pets"
                  >
                    <Icon name="lucide:cat" class="w-8 h-8 text-[#22345F] group-hover:text-[#F49A1A]" />
                    <span class="text-sm font-semibold text-[#22345F] group-hover:text-[#F49A1A]">Pets</span>
                  </button>
                  
                  <button
                    @click="selectNeed('Contra mosquitos')"
                    class="flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#E5EDF8] rounded-2xl hover:border-[#F49A1A] hover:bg-[#FFF7ED] transition-all duration-200 group"
                    data-gtm="chat_step1_mosquitos"
                  >
                    <Icon name="lucide:bug" class="w-8 h-8 text-[#22345F] group-hover:text-[#F49A1A]" />
                    <span class="text-sm font-semibold text-[#22345F] group-hover:text-[#F49A1A]">Contra mosquitos</span>
                  </button>
                  
                  <button
                    @click="selectNeed('Todos os 3')"
                    class="flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#E5EDF8] rounded-2xl hover:border-[#F49A1A] hover:bg-[#FFF7ED] transition-all duration-200 group"
                    data-gtm="chat_step1_todos"
                  >
                    <span class="text-3xl">✨</span>
                    <span class="text-sm font-semibold text-[#22345F] group-hover:text-[#F49A1A]">Todos os 3</span>
                  </button>
                </div>
              </div>

              <!-- ETAPA 2: Confirmação do Serviço -->
              <div v-if="currentStep === 2" class="space-y-4 animate-fade-in">
                <div class="text-center mb-6">
                  <div class="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h4 class="text-xl font-bold text-[#22345F] mb-2">
                    Perfeito! Recomendamos:
                  </h4>
                </div>
                
                <div class="bg-gradient-to-br from-[#E5EDF8] to-white p-5 rounded-2xl border-2 border-[#22345F]/20">
                  <div class="flex items-start gap-3 mb-4">
                    <div class="w-10 h-10 bg-[#F49A1A] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div>
                      <h5 class="font-bold text-[#22345F] mb-1">{{ selectedService }}</h5>
                      <p class="text-sm text-[#4B5563]">
                        <span v-if="selectedNeed === 'Crianças' || selectedNeed === 'Pets'">
                          Proteção certificada com garantia de 2 anos. Suporta até 500kg.
                        </span>
                        <span v-else-if="selectedNeed === 'Contra mosquitos'">
                          Transparência 85%, eficaz contra dengue e aedes. Instalação em 48h.
                        </span>
                        <span v-else>
                          Solução completa: rede de proteção + tela mosquiteira. Máxima segurança.
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <!-- Badges de Prova Social -->
                  <div class="flex flex-wrap gap-2 mb-3">
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-semibold text-[#22345F] border border-[#E5EDF8]">
                      <svg class="w-3 h-3 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      500+ instalações
                    </span>
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-semibold text-[#22345F] border border-[#E5EDF8]">
                      <svg class="w-3 h-3 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      Garantia 2 anos
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-2 text-xs text-[#4B5563]">
                    <svg class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Instalação em 48h</span>
                    <span class="text-gray-300">•</span>
                    <svg class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>São Paulo</span>
                  </div>
                </div>
                
                <div class="flex gap-3">
                  <button
                    @click="goBack"
                    class="px-4 py-3 text-[#4B5563] text-sm font-medium hover:text-[#22345F] transition-colors"
                  >
                    ← Voltar
                  </button>
                  <button
                    @click="confirmService"
                    class="flex-1 px-6 py-4 bg-[#F49A1A] text-white rounded-xl font-bold text-base hover:bg-[#d88715] transition-all shadow-lg"
                    data-gtm="chat_step2_confirmed"
                  >
                    Continuar
                  </button>
                </div>
              </div>

              <!-- ETAPA 3: Tipo de Imóvel -->
              <div v-if="currentStep === 3" class="space-y-4 animate-fade-in">
                <div class="text-center mb-6">
                  <div class="w-16 h-16 bg-[#F49A1A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-[#F49A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                  </div>
                  <h4 class="text-xl font-bold text-[#22345F] mb-2">
                    Tipo de imóvel?
                  </h4>
                  <p class="text-sm text-[#4B5563]">
                    Isso nos ajuda a preparar o orçamento ideal
                  </p>
                </div>
                
                <div class="space-y-3">
                  <button
                    @click="selectProperty('Apartamento')"
                    class="w-full flex items-center gap-3 p-4 bg-white border-2 border-[#E5EDF8] rounded-xl hover:border-[#F49A1A] hover:bg-[#FFF7ED] transition-all duration-200 group"
                    data-gtm="chat_step3_apartamento"
                  >
                    <Icon name="lucide:building" class="w-6 h-6 text-[#22345F] group-hover:text-[#F49A1A]" />
                    <span class="text-sm font-semibold text-[#22345F] group-hover:text-[#F49A1A]">Apartamento</span>
                  </button>
                  
                  <button
                    @click="selectProperty('Casa')"
                    class="w-full flex items-center gap-3 p-4 bg-white border-2 border-[#E5EDF8] rounded-xl hover:border-[#F49A1A] hover:bg-[#FFF7ED] transition-all duration-200 group"
                    data-gtm="chat_step3_casa"
                  >
                    <Icon name="lucide:home" class="w-6 h-6 text-[#22345F] group-hover:text-[#F49A1A]" />
                    <span class="text-sm font-semibold text-[#22345F] group-hover:text-[#F49A1A]">Casa</span>
                  </button>
                  
                  <button
                    @click="selectProperty('Outros')"
                    class="w-full flex items-center gap-3 p-4 bg-white border-2 border-[#E5EDF8] rounded-xl hover:border-[#F49A1A] hover:bg-[#FFF7ED] transition-all duration-200 group"
                    data-gtm="chat_step3_outros"
                  >
                    <Icon name="lucide:warehouse" class="w-6 h-6 text-[#22345F] group-hover:text-[#F49A1A]" />
                    <span class="text-sm font-semibold text-[#22345F] group-hover:text-[#F49A1A]">Outros</span>
                  </button>
                </div>
                
                <button
                  @click="goBack"
                  class="w-full px-4 py-3 text-[#4B5563] text-sm font-medium hover:text-[#22345F] transition-colors text-center"
                >
                  ← Voltar
                </button>
              </div>

              <!-- ETAPA 4: Dados para Orçamento -->
              <div v-if="currentStep === 4" class="space-y-4 animate-fade-in">
                <div class="text-center mb-6">
                  <div class="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <h4 class="text-xl font-bold text-[#22345F] mb-2">
                    Quase lá! 🎉
                  </h4>
                  <p class="text-sm text-[#4B5563]">
                    Preencha seus dados para receber o orçamento
                  </p>
                </div>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-semibold text-[#22345F] mb-2">
                      Seu nome
                    </label>
                    <input
                      v-model="userName"
                      type="text"
                      placeholder="Digite seu nome"
                      class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors text-[#22345F]"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-semibold text-[#22345F] mb-2">
                      Bairro
                    </label>
                    <input
                      v-model="userNeighborhood"
                      type="text"
                      placeholder="Ex: Vila Mariana, Moema..."
                      class="w-full px-4 py-3 border-2 border-[#E5EDF8] rounded-xl focus:border-[#F49A1A] focus:outline-none transition-colors text-[#22345F]"
                    />
                  </div>
                </div>
                
                <div class="space-y-3">
                  <button
                    @click="openWhatsApp"
                    :disabled="!canProceedStep4"
                    :class="[
                      'w-full px-6 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg',
                      canProceedStep4 
                        ? 'bg-[#25D366] text-white hover:bg-[#1fb854] cursor-pointer hover:shadow-xl' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    ]"
                    data-gtm="chat_whatsapp_final"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                    </svg>
                    Falar no WhatsApp Agora
                  </button>
                  
                  <button
                    @click="goBack"
                    class="w-full px-4 py-2 text-[#4B5563] text-sm font-medium hover:text-[#22345F] transition-colors"
                  >
                    ← Voltar
                  </button>
                </div>
                
                <p class="text-xs text-center text-[#4B5563]">
                  Ao continuar, você será redirecionado para o WhatsApp
                </p>
              </div>
              
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast de Sucesso -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showSuccessToast"
        class="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-4 bg-[#25D366] text-white rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm"
      >
        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div>
          <p class="font-bold text-sm">Mensagem enviada!</p>
          <p class="text-xs text-white/90">Continuando no WhatsApp...</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Animação fade-in */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Scroll suave */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #F49A1A #E5EDF8;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #E5EDF8;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #F49A1A;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #d88715;
}
</style>
