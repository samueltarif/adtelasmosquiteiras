<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const carouselImages = [
  { src: '/images/mosquiteira_area_externa.png', alt: 'Mosquiteira área externa' },
  { src: '/images/mosquiteira_janela.png', alt: 'Mosquiteira para janela' },
  { src: '/images/mosquiteira_para_porta.png', alt: 'Mosquiteira para porta' },
  { src: '/images/mosquiteira_porta_de_correr.png', alt: 'Mosquiteira porta de correr' },
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

onMounted(() => { timer = setInterval(next, 3500) })
onUnmounted(() => { clearInterval(timer) })
</script>

<template>
  <section class="mt-16 md:mt-28 bg-white relative overflow-hidden">

    <!-- ===== MOBILE (< 768px) ===== -->
    <div class="block md:hidden">

      <!-- Carrossel full-width com overlay de headline -->
      <div class="relative w-full aspect-[4/3] overflow-hidden">
        <transition-group name="fade-carousel" tag="div" class="relative w-full h-full">
          <img
            v-for="(img, i) in carouselImages"
            v-show="currentIndex === i"
            :key="img.src"
            :src="img.src"
            :alt="img.alt"
            class="absolute inset-0 w-full h-full object-cover"
          />
        </transition-group>

        <!-- Gradiente inferior -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#22345F]/80 via-transparent to-transparent"></div>

        <!-- Headline sobre a imagem -->
        <div class="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h1 class="text-[28px] leading-[1.15] font-bold text-white tracking-tight drop-shadow">
            Telas Mosquiteiras<br>em São Paulo
          </h1>
          <p class="text-white/80 text-sm mt-1">Instalação profissional • Garantia 2 anos</p>
        </div>

        <!-- Dots -->
        <div class="absolute top-4 right-4 flex gap-1.5">
          <button
            v-for="(img, i) in carouselImages"
            :key="i"
            @click="goTo(i)"
            class="w-2 h-2 rounded-full transition-all"
            :class="currentIndex === i ? 'bg-white scale-125' : 'bg-white/40'"
          />
        </div>
      </div>

      <!-- Conteúdo abaixo do carrossel -->
      <div class="px-5 pt-5 pb-10">

        <!-- Trust badges compactos -->
        <div class="flex items-center justify-around py-3 mb-5 bg-gray-50 rounded-2xl">
          <div class="flex flex-col items-center gap-0.5">
            <span class="text-[#F49A1A] font-bold text-base">5.0 ★</span>
            <span class="text-gray-500 text-[11px]">487 avaliações</span>
          </div>
          <div class="w-px h-8 bg-gray-200"></div>
          <div class="flex flex-col items-center gap-0.5">
            <span class="text-[#22345F] font-bold text-base">+500</span>
            <span class="text-gray-500 text-[11px]">clientes</span>
          </div>
          <div class="w-px h-8 bg-gray-200"></div>
          <div class="flex flex-col items-center gap-0.5">
            <span class="text-[#22345F] font-bold text-base">10+</span>
            <span class="text-gray-500 text-[11px]">anos</span>
          </div>
          <div class="w-px h-8 bg-gray-200"></div>
          <div class="flex flex-col items-center gap-0.5">
            <span class="text-[#22345F] font-bold text-base">48h</span>
            <span class="text-gray-500 text-[11px]">instalação</span>
          </div>
        </div>

        <!-- CTAs: telas e redes em destaque -->
        <div class="grid grid-cols-2 gap-2 mb-2">
          <NuxtLink
            to="/servicos/telas"
            class="flex flex-col items-center justify-center gap-1 h-16 bg-[#22345F] text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all shadow-md"
          >
            <Icon name="lucide:grid" class="w-5 h-5" />
            <span>Telas Mosquiteiras</span>
          </NuxtLink>
          <NuxtLink
            to="/servicos/redes"
            class="flex flex-col items-center justify-center gap-1 h-16 bg-[#22345F] text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all shadow-md"
          >
            <Icon name="lucide:shield" class="w-5 h-5" />
            <span>Redes de Proteção</span>
          </NuxtLink>
        </div>

        <!-- CTA Notícias -->
        <div class="flex justify-center">
          <NuxtLink
            to="/por-que-instalar-tela-mosquiteira"
            class="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#F49A1A] text-white rounded-xl font-semibold text-sm active:scale-[0.97] transition-all"
          >
            <Icon name="lucide:newspaper" class="w-4 h-4 shrink-0" />
            Por que instalar tela mosquiteira?
          </NuxtLink>
        </div>

      </div>
    </div>

    <!-- ===== DESKTOP (>= 768px) ===== -->
    <div class="hidden md:block py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-12 items-center">

          <!-- Coluna esquerda: conteúdo -->
          <div>
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#22345F] rounded-full text-sm font-medium mb-6 border-2 border-[#22345F]/10 shadow-sm">
              <svg class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              Instalação em 24h • Garantia 2 Anos
            </div>

            <!-- Headline -->
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[#22345F] mb-4 leading-tight tracking-tight">
              Telas Mosquiteiras<br>
              <span class="text-[#F49A1A]">em São Paulo</span>
            </h1>

            <!-- Subheadline -->
            <p class="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              Instalação profissional de telas e redes para janelas, sacadas e áreas externas. Orçamento grátis e sem compromisso.
            </p>

            <!-- Trust badges desktop -->
            <div class="flex flex-wrap items-center gap-6 mb-10">
              <div class="flex items-center gap-2">
                <div class="flex gap-0.5">
                  <svg v-for="i in 5" :key="i" class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <span class="text-sm font-semibold text-[#22345F]">5.0</span>
                <span class="text-sm text-gray-500">(487 avaliações)</span>
              </div>
              <div class="w-px h-5 bg-gray-200"></div>
              <span class="text-sm text-gray-600 font-medium">+500 Clientes</span>
              <div class="w-px h-5 bg-gray-200"></div>
              <span class="text-sm text-gray-600 font-medium">10+ Anos de experiência</span>
            </div>

            <!-- CTAs -->
            <div class="flex flex-col gap-4">
              <!-- Telas e Redes em destaque -->
              <div class="flex gap-4">
                <NuxtLink
                  to="/servicos/telas"
                  class="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[#22345F] text-white rounded-2xl font-semibold text-base shadow-lg hover:bg-[#1a2a4f] transition-all"
                >
                  <Icon name="lucide:grid" class="w-5 h-5" />
                  Telas Mosquiteiras
                </NuxtLink>
                <NuxtLink
                  to="/servicos/redes"
                  class="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[#F49A1A] text-white rounded-2xl font-semibold text-base shadow-lg hover:bg-[#e08a10] transition-all"
                >
                  <Icon name="lucide:shield" class="w-5 h-5" />
                  Redes de Proteção
                </NuxtLink>
              </div>
              <!-- Notícias abaixo -->
              <NuxtLink
                to="/por-que-instalar-tela-mosquiteira"
                class="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#F49A1A] text-white rounded-2xl font-semibold text-base shadow-lg shadow-[#F49A1A]/20 hover:bg-[#e08a10] transition-all"
              >
                <Icon name="lucide:newspaper" class="w-5 h-5 shrink-0" />
                Por que instalar tela mosquiteira?
              </NuxtLink>
            </div>
          </div>

          <!-- Coluna direita: carrossel -->
          <div class="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-100">
            <div class="relative w-full h-[520px]">
              <transition-group name="fade-carousel" tag="div" class="relative w-full h-full">
                <img
                  v-for="(img, i) in carouselImages"
                  v-show="currentIndex === i"
                  :key="img.src"
                  :src="img.src"
                  :alt="img.alt"
                  class="absolute inset-0 w-full h-full object-cover"
                />
              </transition-group>

              <!-- Dots desktop -->
              <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                <button
                  v-for="(img, i) in carouselImages"
                  :key="i"
                  @click="goTo(i)"
                  class="w-2.5 h-2.5 rounded-full transition-all"
                  :class="currentIndex === i ? 'bg-white scale-125' : 'bg-white/40'"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
.fade-carousel-enter-active,
.fade-carousel-leave-active {
  transition: opacity 0.7s ease;
  position: absolute;
  inset: 0;
}
.fade-carousel-enter-from,
.fade-carousel-leave-to { opacity: 0; }
.fade-carousel-enter-to,
.fade-carousel-leave-from { opacity: 1; }
</style>
