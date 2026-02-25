<script setup>
// Cores da marca AD Telas Mosquiteiras:
// Azul escuro: #22345F (títulos)
// Laranja: #F49A1A (destaques, linha decorativa, indicadores)
// Azul claro: #E5EDF8 (bordas)
// Cinza escuro: #4B5563 (texto secundário)

import { ref, onMounted, onUnmounted } from 'vue'

// Array com as avaliações
const reviews = [
  {
    id: 1,
    image: '/images/avaliação1.png',
    alt: 'Avaliação de cliente satisfeito 1'
  },
  {
    id: 2,
    image: '/images/avaliação2.png',
    alt: 'Avaliação de cliente satisfeito 2'
  },
  {
    id: 3,
    image: '/images/avaliação3.png',
    alt: 'Avaliação de cliente satisfeito 3'
  },
  {
    id: 4,
    image: '/images/avaliação4.png',
    alt: 'Avaliação de cliente satisfeito 4'
  },
  {
    id: 5,
    image: '/images/avaliação5.png',
    alt: 'Avaliação de cliente satisfeito 5'
  }
]

// Estado do carrossel
const currentIndex = ref(0)
let intervalId = null

// Função para ir para o próximo slide
const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % reviews.length
}

// Função para ir para slide específico
const goToSlide = (index) => {
  currentIndex.value = index
}

// Iniciar autoplay
const startAutoplay = () => {
  intervalId = setInterval(nextSlide, 4000) // Muda a cada 4 segundos
}

// Parar autoplay
const stopAutoplay = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// Lifecycle hooks
onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<template>
  <section data-section="reviews" class="py-10 md:py-20 bg-white">
    <div class="max-w-[1200px] mx-auto px-5">
      <h2 class="text-2xl md:text-4xl text-center mb-5 text-[#22345F] font-bold">
        Avaliações dos Nossos Clientes
      </h2>
      <div class="h-[3px] w-[60px] bg-[#F49A1A] mx-auto mb-8"></div>
      <p class="text-base md:text-lg text-center text-[#4B5563] mb-12">
        Veja o que nossos clientes falam sobre nossos serviços
      </p>

      <!-- Carrossel Container -->
      <div 
        class="relative max-w-4xl mx-auto"
        @mouseenter="stopAutoplay"
        @mouseleave="startAutoplay"
      >
        <!-- Slides -->
        <div class="overflow-hidden rounded-xl shadow-lg">
          <div 
            class="flex transition-transform duration-500 ease-in-out"
            :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
          >
            <div 
              v-for="review in reviews"
              :key="review.id"
              class="w-full flex-shrink-0"
            >
              <div class="bg-white p-4 md:p-6">
                <img 
                  :src="review.image" 
                  :alt="review.alt"
                  class="w-full h-auto max-h-[600px] object-contain mx-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Indicadores -->
        <div class="flex justify-center mt-6 gap-2">
          <button
            v-for="(review, index) in reviews"
            :key="review.id"
            @click="goToSlide(index)"
            :class="[
              'w-3 h-3 rounded-full transition-all duration-300',
              currentIndex === index 
                ? 'bg-[#F49A1A] scale-110' 
                : 'bg-gray-300 hover:bg-[#F49A1A]/50'
            ]"
          ></button>
        </div>

        <!-- Setas de navegação -->
        <button
          @click="goToSlide((currentIndex - 1 + reviews.length) % reviews.length)"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-[#E5EDF8]"
        >
          <svg class="w-5 h-5 text-[#22345F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <button
          @click="nextSlide"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-[#E5EDF8]"
        >
          <svg class="w-5 h-5 text-[#22345F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

      <!-- Botão Veja Mais Avaliações -->
      <div class="text-center mt-8">
        <a
          href="https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-3 bg-[#F49A1A] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#d88715] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group border-2 border-[#F49A1A]"
        >
          <!-- Google Icon -->
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Veja Mais Avaliações no Google
          <!-- External Link Icon -->
          <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </a>
      </div>
    </div>
  </section>
</template>