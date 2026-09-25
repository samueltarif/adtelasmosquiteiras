<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const carouselImages = [
  { src: '/images/redes_para_sacadas.jpg', alt: 'Rede de proteção para sacada' },
  { src: '/images/mosquiteira_janela.png', alt: 'Mosquiteira para janela' },
  { src: '/images/redes_para_janelas.png', alt: 'Rede de proteção para janela' },
  { src: '/images/vidro_janela_8mm.png', alt: 'Janela de vidro temperado' },
  { src: '/images/mosquiteira_removivel.png', alt: 'Mosquiteira removível' },
  { src: '/images/tela_mosquiteira.png', alt: 'Tela mosquiteira' },
]

const currentIndex = ref(0)
let timer = null

function next() {
  currentIndex.value = (currentIndex.value + 1) % carouselImages.length
}

function goTo(i) {
  currentIndex.value = i
}

function scrollToServices() {
  const el = document.getElementById('services') || document.getElementById('servicos')
  if (el) {
    const headerHeight = 70
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

onMounted(() => { timer = setInterval(next, 3500) })
onUnmounted(() => { clearInterval(timer) })
</script>

<template>
  <section data-cta-location="hero" class="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden bg-black">
    <h1 class="sr-only">Telas Mosquiteiras e Redes de Proteção em São Paulo</h1>

    <!-- Carrossel de fundo full-screen cobrindo todo o topo e passando por trás do menu -->
    <div class="absolute inset-0 w-full h-full overflow-hidden">
      <transition-group name="fade-carousel" tag="div" class="relative w-full h-full">
        <img
          v-for="(img, i) in carouselImages"
          v-show="currentIndex === i"
          :key="img.src"
          :src="img.src"
          :alt="img.alt"
          :loading="i === 0 ? 'eager' : 'lazy'"
          :fetchpriority="i === 0 ? 'high' : 'auto'"
          class="absolute inset-0 w-full h-full object-cover"
        />
      </transition-group>

      <!-- Gradientes escuros com vinheta idêntica à referência IM Esquadrias -->
      <!-- Desktop: gradiente lateral esquerdo para texto legível -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent hidden md:block"></div>
      <!-- Mobile e base: gradiente vertical que deixa os 60% superiores limpos e a base bem escura -->
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/90 via-40% to-transparent"></div>
    </div>

    <!-- Conteúdo do Hero colado embaixo exatamente como na referência IM Esquadrias -->
    <div class="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex-1 flex flex-col justify-end pb-7 sm:pb-10 lg:pb-12 pt-20">
      
      <!-- Pill Badge: visível no desktop onde existe na referência -->
      <div class="hidden sm:inline-flex items-center gap-2 self-start px-4 py-1.5 bg-black/40 text-white rounded-full text-xs sm:text-sm font-semibold mb-5 border border-white/20 backdrop-blur-md uppercase tracking-wider">
        <span class="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse"></span>
        Especialistas em Telas e Redes
      </div>

      <!-- Headline -->
      <h2 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight drop-shadow-lg mb-3 sm:mb-4 max-w-3xl">
        Sua Casa Protegida de<br>
        <span class="text-[#00D2FF]">Mosquitos Todos os Dias</span>
      </h2>

      <!-- Subheadline -->
      <p class="text-white/85 text-sm sm:text-lg lg:text-xl leading-relaxed drop-shadow-sm mb-6 sm:mb-8 max-w-2xl font-normal">
        Telas mosquiteiras sob medida para janelas e portas, com instalação rápida e acabamento profissional.
      </p>

      <!-- Botões de Ação estilo referência IM Esquadrias -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
        <!-- Botão Primário Verde com seta -->
        <NuxtLink
          to="/orcamento"
          class="inline-flex items-center justify-center gap-2.5 py-4 px-8 bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-base sm:text-lg rounded-full shadow-xl shadow-green-500/25 active:scale-[0.98] transition-all text-center"
        >
          <span>Solicitar Orçamento</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>

        <!-- Botão Secundário Preto Translúcido com borda branca -->
        <button
          @click="scrollToServices"
          class="inline-flex items-center justify-center gap-2 py-4 px-8 bg-black/40 hover:bg-black/60 text-white font-semibold text-base sm:text-lg rounded-full border border-white/50 backdrop-blur-md active:scale-[0.98] transition-all text-center cursor-pointer"
        >
          <span>Ver Serviços</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-carousel-enter-active,
.fade-carousel-leave-active {
  transition: opacity 0.8s ease-in-out;
  position: absolute;
  inset: 0;
}
.fade-carousel-enter-from,
.fade-carousel-leave-to { opacity: 0; }
.fade-carousel-enter-to,
.fade-carousel-leave-from { opacity: 1; }
</style>
