<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)
const isModalOpen = ref(false)

const handleScroll = () => {
  // Mostrar botão após rolar 400px
  isVisible.value = window.scrollY > 400
}

const openModal = () => {
  isModalOpen.value = true
  document.body.style.overflow = 'hidden' // Prevenir scroll
}

const closeModal = () => {
  isModalOpen.value = false
  document.body.style.overflow = '' // Restaurar scroll
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
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
  <!-- Botão Sticky -->
  <div 
    v-if="isVisible && !isModalOpen"
    class="fixed bottom-20 right-4 z-40 md:hidden animate-bounce"
  >
    <button
      @click="openModal"
      class="bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold text-sm hover:scale-105 transition-all duration-300"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      Orçamento Grátis
    </button>
  </div>

  <!-- Modal Overlay -->
  <div 
    v-if="isModalOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden flex items-end"
    @click="closeModal"
  >
    <!-- Modal Content -->
    <div 
      class="bg-white w-full rounded-t-2xl p-6 transform transition-all duration-300 animate-slide-up"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-xl font-bold text-gray-800">Orçamento Grátis</h3>
          <p class="text-sm text-gray-600">Resposta em até 2 horas</p>
        </div>
        <button
          @click="closeModal"
          class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
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