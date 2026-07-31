<script setup>
// Cores da marca AD Telas Mosquiteiras:
// Azul escuro: #22345F (títulos)
// Laranja: #F49A1A (destaques, linha decorativa, indicadores)
// Azul claro: #E5EDF8 (bordas)
// Cinza escuro: #4B5563 (texto secundário)

import { ref, onMounted, onUnmounted } from 'vue'

// Array com as avaliações do Google
const reviews = [
  {
    id: 1,
    name: 'Ricardo Martins',
    rating: 5,
    date: 'Há 2 semanas',
    text: 'Serviço impecável! Instalaram as redes de proteção na varanda e nas janelas em menos de 3 horas. Equipe muito educada e caprichosa.',
    service: 'Redes de Proteção para Apartamento',
    image: '/images/avaliação1.png'
  },
  {
    id: 2,
    name: 'Fernanda Oliveira',
    rating: 5,
    date: 'Há 1 mês',
    text: 'Fiz a instalação das telas mosquiteiras em toda a casa. Acabou o problema com pernilongos e aedes aegypti! Recomendo de olhos fechados.',
    service: 'Telas Mosquiteiras',
    image: '/images/avaliação2.png'
  },
  {
    id: 3,
    name: 'Carlos Eduardo',
    rating: 5,
    date: 'Há 3 semanas',
    text: 'Tivemos um excelente atendimento desde o orçamento no WhatsApp até a finalização da instalação. Material resistente e garantia cumprida.',
    service: 'Rede para Pets e Crianças',
    image: '/images/avaliação3.png'
  },
  {
    id: 4,
    name: 'Juliana Costa',
    rating: 5,
    date: 'Há 1 mês',
    text: 'Atendimento muito ágil! Solicitei o orçamento e no dia seguinte já estavam fazendo a medição. Preço justo e ótimo acabamento.',
    service: 'Redes para Sacada',
    image: '/images/avaliação4.png'
  },
  {
    id: 5,
    name: 'Marcelo Souza',
    rating: 5,
    date: 'Há 2 meses',
    text: 'Excelente profissionalismo. Já é o segundo imóvel que instalo com a AD Telas. Segurança total para minha família.',
    service: 'Telas e Redes de Proteção',
    image: '/images/avaliação5.png'
  }
]

// Estado do carrossel
const currentIndex = ref(0)
let intervalId = null

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % reviews.length
}

const goToSlide = (index) => {
  currentIndex.value = index
}

const startAutoplay = () => {
  intervalId = setInterval(nextSlide, 4500)
}

const stopAutoplay = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

onMounted(() => { startAutoplay() })
onUnmounted(() => { stopAutoplay() })
</script>

<template>
  <section data-section="reviews" class="py-12 md:py-20 bg-[#F9FAFB]">
    <div class="max-w-[1200px] mx-auto px-5">
      
      <!-- Cabeçalho -->
      <div class="text-center mb-10">
        <!-- Badge Google Rating -->
        <div class="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-[#E5EDF8] mb-4">
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span class="font-bold text-[#22345F] text-sm">5.0 ★★★★★ no Google</span>
          <span class="text-[#4B5563] text-xs">(487+ avaliações)</span>
        </div>

        <h2 class="text-2xl md:text-4xl text-center text-[#22345F] font-bold mb-3">
          O Que Nossos Clientes Dizem no Google
        </h2>
        <div class="h-[3px] w-[60px] bg-[#F49A1A] mx-auto mb-4"></div>
        <p class="text-base text-[#4B5563]">
          Histórias reais de quem confiou a segurança de sua família à AD Telas e Redes
        </p>
      </div>

      <!-- Carrossel Container -->
      <div 
        class="relative max-w-4xl mx-auto"
        @mouseenter="stopAutoplay"
        @mouseleave="startAutoplay"
      >
        <!-- Slides -->
        <div class="overflow-hidden rounded-2xl border-2 border-[#E5EDF8] bg-white shadow-xl">
          <div 
            class="flex transition-transform duration-500 ease-in-out"
            :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
          >
            <div 
              v-for="review in reviews"
              :key="review.id"
              class="w-full flex-shrink-0 p-6 md:p-10"
            >
              <div class="grid md:grid-cols-12 gap-6 items-center">
                
                <!-- Print/Foto da Avaliação -->
                <div class="md:col-span-5 relative overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                  <img 
                    :src="review.image" 
                    :alt="`Avaliação Google - ${review.name}`"
                    class="w-full h-auto max-h-[320px] object-contain mx-auto"
                  />
                </div>

                <!-- Depoimento em texto estilo Google Review -->
                <div class="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <!-- Header da avaliação -->
                    <div class="flex items-center gap-3 mb-3">
                      <div class="w-10 h-10 rounded-full bg-[#22345F] text-white flex items-center justify-center font-bold text-lg">
                        {{ review.name.charAt(0) }}
                      </div>
                      <div>
                        <h4 class="font-bold text-[#22345F] text-base leading-tight">{{ review.name }}</h4>
                        <div class="flex items-center gap-2 mt-0.5">
                          <div class="flex text-[#F49A1A] text-sm">★★★★★</div>
                          <span class="text-xs text-[#4B5563]">{{ review.date }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Badge do serviço -->
                    <div class="inline-block bg-[#E5EDF8] text-[#22345F] text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      {{ review.service }}
                    </div>

                    <!-- Texto do depoimento -->
                    <p class="text-[#4B5563] text-sm md:text-base leading-relaxed italic mb-4">
                      "{{ review.text }}"
                    </p>
                  </div>

                  <!-- Selo Verificado Google -->
                  <div class="flex items-center gap-2 text-xs text-[#4B5563] pt-3 border-t border-gray-100">
                    <Icon name="lucide:check-circle" class="w-4 h-4 text-[#25D366]" />
                    <span>Avaliação Verificada no Google Meu Negócio</span>
                  </div>
                </div>

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
              'w-3 h-3 rounded-full transition-all duration-300 cursor-pointer',
              currentIndex === index 
                ? 'bg-[#F49A1A] scale-125' 
                : 'bg-gray-300 hover:bg-[#F49A1A]/50'
            ]"
          ></button>
        </div>

        <!-- Setas de navegação -->
        <button
          @click="goToSlide((currentIndex - 1 + reviews.length) % reviews.length)"
          class="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-[#F49A1A] hover:text-white text-[#22345F] rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-[#E5EDF8] cursor-pointer z-10"
          aria-label="Avaliação anterior"
        >
          <Icon name="lucide:chevron-left" class="w-6 h-6" />
        </button>
        
        <button
          @click="nextSlide"
          class="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-[#F49A1A] hover:text-white text-[#22345F] rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-[#E5EDF8] cursor-pointer z-10"
          aria-label="Próxima avaliação"
        >
          <Icon name="lucide:chevron-right" class="w-6 h-6" />
        </button>
      </div>

      <!-- Botão Veja Mais Avaliações -->
      <div class="text-center mt-8">
        <a
          href="https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,"
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