<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Props para v-model
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isVisible = ref(false)
const startY = ref(0)
const currentY = ref(0)
const isDragging = ref(false)

// Watch para sincronizar com v-model
watch(() => props.modelValue, (newValue) => {
  console.log('🟡 [MODAL] v-model mudou para:', newValue)
  if (newValue) {
    console.log('🟡 [MODAL] Abrindo modal...')
    document.body.style.overflow = 'hidden'
  } else {
    console.log('🟡 [MODAL] Fechando modal...')
    document.body.style.overflow = ''
    isDragging.value = false
    currentY.value = 0
  }
})

const handleScroll = () => {
  // Mostrar botão após rolar 400px
  const shouldShow = window.scrollY > 400
  if (shouldShow !== isVisible.value) {
    console.log('🟡 [STICKY-MODAL] Scroll detectado:', window.scrollY, 'px')
    console.log('🟡 [STICKY-MODAL] Botão sticky visível:', shouldShow)
  }
  isVisible.value = shouldShow
}

const openModal = () => {
  console.log('🟡 [STICKY-MODAL] openModal() chamado (botão próprio)')
  console.log('🟡 [STICKY-MODAL] Emitindo update:modelValue = true')
  emit('update:modelValue', true)
}

const closeModal = () => {
  console.log('🟡 [STICKY-MODAL] closeModal() chamado')
  console.log('🟡 [STICKY-MODAL] Emitindo update:modelValue = false')
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
  console.log('🟡 [STICKY-MODAL] Componente montado')
  console.log('🟡 [STICKY-MODAL] modelValue inicial:', props.modelValue)
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
    console.log('🟡 [STICKY-MODAL] Scroll listener adicionado')
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
              <p class="text-sm text-gray-600">Resposta em até 2 horas</p>
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
          <LeadForm variant="modal" />

          <!-- Trust Indicators -->
          <div class="mt-6 pt-4 border-t border-gray-100">
            <div class="flex items-center justify-center gap-6 text-gray-500 text-xs">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span>Resposta Rápida</span>
              </div>
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span>Sem Compromisso</span>
              </div>
            </div>
          </div>
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