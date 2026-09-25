<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const route = useRoute()
const isHomePage = computed(() => route.path === '/')

// Estado do menu mobile
const isMobileMenuOpen = ref(false)

// Estado do scroll (para transparência)
const isScrolled = ref(false)

// Itens do menu de navegação
const menuItems = [
  { label: 'Início', id: 'hero', type: 'scroll' },
  { label: 'Serviços', id: 'services', type: 'scroll' },
  { label: 'Avaliações', id: 'reviews', type: 'scroll' },
  { label: 'FAQ', id: 'faq', type: 'scroll' },
  { label: 'Orçamento', id: '/orcamento', type: 'link', highlight: true },
  { label: 'Contato', id: '/contato', type: 'link' }
]

// Itens do menu desktop estilo IM Esquadrias
const desktopMenuItems = [
  { label: 'Início', id: 'hero', type: 'scroll' },
  { label: 'Serviços', id: 'services', type: 'scroll' },
  { label: 'Avaliações', id: 'reviews', type: 'scroll' },
  { label: 'FAQ', id: 'faq', type: 'scroll' },
  { label: 'Contato', id: '/contato', type: 'link', isBox: true }
]

// Função para alternar menu mobile
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Função para scroll suave para seções ou navegação
const scrollToSection = (item) => {
  isMobileMenuOpen.value = false

  // Se for um link direto (type: 'link'), navegar
  if (item.type === 'link') {
    navigateTo(item.id)
    return
  }

  const route = useRoute()
  const isHome = route.path === '/'

  if (!isHome) {
    // Navegar para home com hash para scroll após carregamento
    navigateTo(`/#${item.id}`)
    return
  }

  // Scroll para seção na home
  if (item.id === 'hero') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    const element = document.getElementById(item.id) || 
                    document.querySelector(`[data-section="${item.id}"]`) ||
                    (item.id === 'services' ? document.getElementById('servicos') : null)
    if (element) {
      const headerHeight = 80
      const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight
      window.scrollTo({ top: elementPosition, behavior: 'smooth' })
    }
  }
}

// Função para voltar à home (logo)
const goToHome = () => {
  isMobileMenuOpen.value = false
  navigateTo('/')
}

// Detectar scroll para aplicar transparência
const handleScroll = () => {
  isScrolled.value = window.scrollY > 30
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <!-- Header Desktop (>= 768px) Transparente sobre a foto na Home -->
  <header 
    data-cta-location="header"
    class="hidden md:block fixed top-0 left-0 right-0 z-40 transition-all duration-300"
    :class="[
      (isScrolled || !isHomePage)
        ? 'bg-[#22345F]/95 backdrop-blur-md shadow-lg border-b border-white/10'
        : 'bg-transparent'
    ]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo Desktop (Emblema Circular como na referência) -->
        <button 
          @click="goToHome"
          class="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          aria-label="Ir para página inicial AD Telas e Redes"
        >
          <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center p-1.5 shadow-lg border border-white/30">
            <img 
              src="/images/logo_adt_telas_nova.png" 
              alt="AD Telas e Redes" 
              class="h-10 w-auto object-contain"
            />
          </div>
        </button>

        <!-- Menu de Navegação Desktop estilo referência IM Esquadrias -->
        <nav class="flex items-center space-x-6 lg:space-x-8">
          <template v-for="item in desktopMenuItems" :key="item.id">
            <button
              v-if="!item.isBox"
              @click="scrollToSection(item)"
              class="text-sm font-semibold transition-colors duration-200 cursor-pointer text-white/90 hover:text-[#00D2FF]"
            >
              {{ item.label }}
            </button>
            <button
              v-else
              @click="scrollToSection(item)"
              class="text-sm font-semibold transition-all duration-200 cursor-pointer text-white px-3.5 py-1 rounded border border-white/40 bg-black/20 hover:bg-white/20"
            >
              {{ item.label }}
            </button>
          </template>
        </nav>

        <!-- Ações Direita Desktop (Telefone + Botão Orçamento estilo referência) -->
        <div class="flex items-center gap-4 lg:gap-6">
          <a
            href="https://wa.me/5511983586611?text=Ol%C3%A1%21%20Vim%20pelo%20site%20e%20gostaria%20de%20um%20or%C3%A7amento."
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors"
          >
            <Icon name="lucide:phone" class="w-4 h-4 text-white" />
            <span>(11) 98358-6611</span>
          </a>

          <NuxtLink
            to="/orcamento"
            class="px-5 py-2 rounded-lg border border-white/80 hover:border-white text-white hover:bg-white hover:text-[#22345F] text-sm font-semibold shadow-md active:scale-95 transition-all cursor-pointer bg-black/10"
          >
            Solicitar Orçamento
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>

  <!-- Header Mobile (< 768px) Transparente sobre as fotos -->
  <header 
    data-cta-location="header" 
    class="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300"
    :class="[
      (isScrolled || isMobileMenuOpen || !isHomePage)
        ? 'bg-[#22345F]/95 backdrop-blur-md shadow-lg border-b border-white/10'
        : 'bg-transparent'
    ]"
  >
    <div class="flex items-center justify-between w-full">
      <!-- Logo Mobile em Emblema Circular -->
      <button @click="goToHome" class="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
        <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center p-1 shadow-lg border border-white/30">
          <img
            src="/images/logo_adt_telas_nova.png"
            alt="AD Telas e Redes"
            class="h-9 w-auto object-contain"
          />
        </div>
      </button>

      <!-- Botão Menu Hamburger (3 barrinhas) -->
      <button
        @click="toggleMobileMenu"
        class="flex items-center justify-center w-12 h-12 text-white hover:text-white/80 transition-all active:scale-90 cursor-pointer"
        aria-label="Menu"
      >
        <svg v-if="!isMobileMenuOpen" class="w-8 h-8 text-white drop-shadow-md" stroke="currentColor" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-8 h-8 text-white drop-shadow-md" stroke="currentColor" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Backdrop escuro para fechar ao tocar fora -->
    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false" 
      class="fixed inset-0 top-[70px] z-[-1] bg-black/60 backdrop-blur-xs"
    ></div>

    <!-- Menu Mobile Dropdown Drawer -->
    <transition name="slide-dropdown">
      <div
        v-show="isMobileMenuOpen"
        class="mt-3 bg-[#22345F]/98 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 p-2"
      >
        <nav class="space-y-1">
          <button
            v-for="item in menuItems"
            :key="item.id"
            @click="scrollToSection(item)"
            :class="[
              'w-full text-left py-3 px-4 text-sm font-semibold rounded-xl transition-all min-h-[44px] flex items-center justify-between',
              item.highlight 
                ? 'bg-[#F49A1A] hover:bg-[#e08910] text-white font-bold my-1 shadow-md' 
                : 'text-white hover:bg-white/10 active:bg-white/20'
            ]"
          >
            <span>{{ item.label }}</span>
            <Icon v-if="!item.highlight" name="lucide:chevron-right" class="w-4 h-4 text-white/50" />
            <Icon v-else name="lucide:sparkles" class="w-4 h-4 text-white" />
          </button>
        </nav>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.slide-dropdown-enter-active,
.slide-dropdown-leave-active {
  transition: all 0.25s ease-out;
}
.slide-dropdown-enter-from,
.slide-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
