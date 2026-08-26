<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Props para v-model e contexto de serviço
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  serviceName: {
    type: String,
    default: ''
  },
  serviceKey: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const isVisible = ref(false)
const startY = ref(0)
const currentY = ref(0)
const isDragging = ref(false)

// Watch para sincronizar com v-model
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    isDragging.value = false
    currentY.value = 0
  }
})

const handleScroll = () => {
  // Mostrar botão após rolar 400px
  isVisible.value = window.scrollY > 400
}

const openModal = () => {
  emit('update:modelValue', true)
}

const closeModal = () => {
  emit('update:modelValue', false)
}

// Touch handlers para swipe down
const handleTouchStart = (e) => {
  startY.value = e.touches[0].clientY
  isDragging.value = true
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  
  currentY.value = e.touches[0].clientY - startY.value
  
  // Só permite arrastar para baixo
  if (currentY.value < 0) {
    currentY.value = 0
  }
}

const handleTouchEnd = () => {
  if (!isDragging.value) return
  
  // Se arrastou mais de 100px, fecha o modal
  if (currentY.value > 100) {
    closeModal()
  } else {
    currentY.value = 0
  }
  
  isDragging.value = false
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Verificar posição inicial
    handleScroll()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    document.body.style.overflow = '' // Cleanup
  }
})
</script>

<template>
  <!-- Botão Sticky REMOVIDO - apenas o modal permanece -->
  
  <!-- Modal Overlay -->
  <Teleport to="body">
    <div 
      v-if="modelValue"
      class="fixed inset-0 bg-black/50 z-[100] flex items-end"
      @click="closeModal"
    >
      <!-- Modal Content -->
      <div 
        class="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto transform transition-transform duration-300"
        :style="{ transform: `translateY(${currentY}px)` }"
        @click.stop
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Handle para arrastar -->
        <div class="sticky top-0 bg-white pt-3 pb-2 flex justify-center border-b border-gray-100 z-10">
          <div class="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <!-- Conteúdo com padding -->
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="text-xl font-bold text-gray-800">Orçamento Grátis</h3>
              <p class="text-sm text-gray-600">Resposta em alguns minutos</p>
            </div>
            <button
              @click="closeModal"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <LeadForm
            variant="modal"
            :service-name="serviceName"
            :service-key="serviceKey"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>