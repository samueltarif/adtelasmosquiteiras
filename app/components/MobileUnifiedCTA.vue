<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  servicoAtual: {
    type: String,
    default: ''
  },
  telefone: {
    type: String,
    default: '5511983586611'
  },
  msgPadrao: {
    type: String,
    default: 'Olá! Gostaria de um orçamento.'
  }
})

// Estado
const isVisible = ref(false)
const isExpanded = ref(false)
const scrollY = ref(0)
const touchStartY = ref(0)
const touchCurrentY = ref(0)
const isDragging = ref(false)

// Computed
const whatsappUrl = computed(() => {
  const servico = props.servicoAtual ? `\n\nServiço: ${props.servicoAtual}` : ''
  const mensagem = `${props.msgPadrao}${servico}\n\nPode me ajudar?`
  return `https://wa.me/${props.telefone}?text=${encodeURIComponent(mensagem)}`
})

const telefoneUrl = computed(() => `tel:+${props.telefone}`)

// Scroll handler
const handleScroll = () => {
  scrollY.value = window.scrollY
  isVisible.value = scrollY.value > 200
}

// Touch handlers para swipe
const handleTouchStart = (e) => {
  if (!isExpanded.value) return
  touchStartY.value = e.touches[0].clientY
  isDragging.value = true
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  touchCurrentY.value = e.touches[0].clientY
}

const handleTouchEnd = () => {
  if (!isDragging.value) return
  
  const deltaY = touchCurrentY.value - touchStartY.value
  
  // Swipe down para fechar (> 50px)
  if (deltaY > 50) {
    isExpanded.value = false
  }
  
  isDragging.value = false
  touchStartY.value = 0
  touchCurrentY.value = 0
}

// Toggle expand
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// Abrir modal de formulário
const emit = defineEmits(['open-form'])
const openForm = () => {
  console.log('🔵 MobileUnifiedCTA: openForm() chamado')
  console.log('🔵 Emitindo evento: open-form')
  emit('open-form')
  console.log('🔵 Fechando CTA expandido')
  isExpanded.value = false
  console.log('🔵 isExpanded agora é:', isExpanded.value)
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // Check initial position
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <!-- Mobile Only: < 768px -->
  <div 
    v-show="isVisible"
    class="md:hidden fixed bottom-0 left-0 right-0 z-[60] transition-all duration-300 ease-out"
    :class="{ 'translate-y-0': isVisible, 'translate-y-full': !isVisible }"
  >
    <!-- Backdrop quando expandido -->
    <Transition name="fade">
      <div
        v-if="isExpanded"
        class="fixed inset-0 bg-black/50 -z-10"
        @click="isExpanded = false"
      />
    </Transition>

    <!-- Container Principal -->
    <div
      class="bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out"
      :class="isExpanded ? 'h-[240px]' : 'h-[70px]'"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Handle para swipe (quando expandido) -->
      <div
        v-if="isExpanded"
        class="flex justify-center pt-2 pb-1"
      >
        <div class="w-12 h-1 bg-gray-300 rounded-full" />
      </div>

      <!-- ESTADO COMPACTO -->
      <div v-if="!isExpanded" class="h-full">
        <div
          class="w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 px-6 relative overflow-hidden group cursor-pointer"
          @click="toggleExpand"
          role="button"
          tabindex="0"
          aria-label="Ver opções de contato"
          @keydown.enter="toggleExpand"
          @keydown.space.prevent="toggleExpand"
        >
          <!-- Animação de pulso -->
          <span class="absolute inset-0 bg-white/20 animate-pulse-slow" />
          
          <!-- Ícone WhatsApp -->
          <svg class="w-7 h-7 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>

          <!-- Texto -->
          <span class="text-white font-bold text-base relative z-10 flex items-center gap-2">
            <Icon name="lucide:message-circle" class="w-5 h-5" />
            Orçamento Grátis WhatsApp
          </span>

          <!-- Ícone expandir (canto direito) -->
          <div class="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/20 rounded-full z-20 pointer-events-none">
            <Icon name="lucide:chevron-up" class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <!-- ESTADO EXPANDIDO -->
      <div v-else class="flex flex-col gap-3 p-4 pt-2">
        <!-- Botão Fechar -->
        <button
          @click="isExpanded = false"
          class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
          aria-label="Fechar opções"
        >
          <Icon name="lucide:x" class="w-5 h-5 text-gray-600" />
        </button>

        <!-- 1. WhatsApp (100% width) -->
        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all duration-200 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-base shadow-lg"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          WhatsApp
        </a>

        <!-- 2 e 3: Telefone e Formulário (lado a lado, 48% cada) -->
        <div class="flex gap-3">
          <!-- 2. Ligar -->
          <a
            :href="telefoneUrl"
            class="flex-1 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm shadow-lg"
          >
            <Icon name="lucide:phone" class="w-5 h-5" />
            Ligar
          </a>

          <!-- 3. Formulário -->
          <button
            @click="openForm"
            class="flex-1 h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-200 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm shadow-lg"
          >
            <Icon name="lucide:file-text" class="w-5 h-5" />
            Formulário
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animação de pulso suave */
@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.1;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Transição fade para backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* GPU acceleration */
.transition-all {
  will-change: transform, height;
  transform: translateZ(0);
}
</style>
