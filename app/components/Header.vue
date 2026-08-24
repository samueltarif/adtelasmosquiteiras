<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

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
      const headerHeight = 112
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
  // Aplica transparência após rolar 50px
  isScrolled.value = window.scrollY > 50
}

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <!-- Header Desktop -->
  <header 
    data-cta-location="header"
    class="hidden md:block fixed top-0 left-0 right-0 border-b border-gray-200 z-40 shadow-sm transition-all duration-300"
    :class="isScrolled ? 'bg-white/70 backdrop-blur-md' : 'bg-white'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-28">
        <!-- Logo com 150px width, auto height, 10px padding -->
        <button 
          @click="goToHome"
          class="flex items-center p-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img 
            src="/images/logo_adt_telas_nova.png" 
            alt="AD Telas e Redes" 
            class="w-[150px] h-auto"
          />
        </button>

        <!-- Menu de Navegação -->
        <nav class="hidden md:flex items-center space-x-6">
          <button
            v-for="item in menuItems"
            :key="item.id"
            @click="scrollToSection(item)"
            :class="[
              'px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer',
              item.highlight 
                ? 'bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-lg font-bold' 
                : 'text-gray-700 hover:text-blue-600'
            ]"
          >
            {{ item.label }}
          </button>
        </nav>

        <div class="md:hidden">
          <button 
            @click="toggleMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 cursor-pointer"
          >
            <span class="sr-only">Abrir menu principal</span>
            <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path :class="{'hidden': isMobileMenuOpen, 'inline-flex': !isMobileMenuOpen }" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path :class="{'hidden': !isMobileMenuOpen, 'inline-flex': isMobileMenuOpen }" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Menu Mobile Dropdown -->
    <div v-show="isMobileMenuOpen" class="md:hidden">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="scrollToSection(item)"
          :class="[
            'block px-3 py-2 text-base font-medium w-full text-left transition-colors duration-200 cursor-pointer',
            item.highlight
              ? 'bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-lg font-bold'
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          ]"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </header>

  <!-- Header Mobile -->
  <header data-cta-location="header" class="md:hidden fixed top-0 left-0 right-0 z-40 px-3 py-2">
    <div
      class="flex items-center bg-white rounded-full shadow-md px-2 h-14 gap-1 transition-all duration-300"
      :class="isScrolled ? 'shadow-xl' : 'shadow-md'"
    >
      <!-- Logo — tamanho fixo, não encolhe -->
      <button @click="goToHome" class="flex-shrink-0 pl-1 pr-2 hover:opacity-80 transition-opacity">
        <img
          src="/images/logo_adt_telas_nova.png"
          alt="AD Telas"
          class="h-8 w-auto"
        />
      </button>

      <!-- Divisor -->
      <div class="w-px h-6 bg-gray-200 flex-shrink-0"></div>

      <!-- Nav — 3 itens fixos, sem overflow, texto menor -->
      <nav class="flex items-center flex-1 justify-around min-w-0 px-1">
        <button
          v-for="item in menuItems.filter(i => ['hero','problems','reviews'].includes(i.id))"
          :key="item.id"
          @click="scrollToSection(item)"
          class="relative flex-shrink-0 px-1.5 py-1 text-[11px] font-medium text-gray-600 hover:text-[#22345F] whitespace-nowrap leading-tight"
          :class="item.id === 'hero' ? 'text-[#22345F] font-bold' : ''"
        >
          {{ item.label }}
          <!-- underline laranja no item ativo -->
          <span
            v-if="item.id === 'hero'"
            class="absolute bottom-0 left-1 right-1 h-0.5 bg-[#F49A1A] rounded-full"
          ></span>
        </button>
      </nav>

      <!-- Divisor -->
      <div class="w-px h-6 bg-gray-200 flex-shrink-0"></div>

      <!-- Ações direita — tamanhos compactos -->
      <div class="flex items-center gap-1.5 flex-shrink-0 pr-1">
        <!-- WhatsApp -->
        <a
          href="https://wa.me/5511983586611?text=Olá! Vi seu site e gostaria de um orçamento para telas mosquiteiras."
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center w-8 h-8 bg-[#25D366] hover:bg-[#20B858] text-white rounded-full transition-all active:scale-95 flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
        </a>

        <!-- Hamburguer -->
        <button
          @click="toggleMobileMenu"
          class="flex items-center justify-center w-7 h-7 text-gray-600 hover:text-[#22345F] transition-colors flex-shrink-0"
        >
          <svg class="h-4 w-4" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path :class="{'hidden': isMobileMenuOpen, 'inline-flex': !isMobileMenuOpen}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
            <path :class="{'hidden': !isMobileMenuOpen, 'inline-flex': isMobileMenuOpen}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Menu Mobile Dropdown -->
    <div
      v-show="isMobileMenuOpen"
      class="mt-2 bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      <nav class="px-4 py-3">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="scrollToSection(item)"
          :class="[
            'block w-full text-left py-2.5 text-sm font-medium transition-colors border-b border-gray-100 last:border-b-0',
            item.highlight ? 'text-[#F49A1A] font-bold' : 'text-gray-800 hover:text-[#22345F]'
          ]"
        >
          {{ item.label }}
        </button>
      </nav>
    </div>
  </header>
</template>