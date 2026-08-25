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
  <!-- Header Desktop (>= 768px) -->
  <header 
    data-cta-location="header"
    class="hidden md:block fixed top-0 left-0 right-0 border-b border-gray-200 z-40 shadow-sm transition-all duration-300"
    :class="isScrolled ? 'bg-white/80 backdrop-blur-md' : 'bg-white'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-24">
        <!-- Logo -->
        <button 
          @click="goToHome"
          class="flex items-center p-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img 
            src="/images/logo_adt_telas_nova.png" 
            alt="AD Telas e Redes" 
            class="w-[140px] lg:w-[155px] h-auto"
          />
        </button>

        <!-- Menu de Navegação Desktop -->
        <nav class="flex items-center space-x-4 lg:space-x-6">
          <button
            v-for="item in menuItems"
            :key="item.id"
            @click="scrollToSection(item)"
            :class="[
              'px-3.5 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer min-h-[44px] flex items-center',
              item.highlight 
                ? 'bg-[#F49A1A] hover:bg-[#e08910] text-white rounded-xl font-bold shadow-md hover:shadow-lg' 
                : 'text-gray-700 hover:text-blue-600'
            ]"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>
    </div>
  </header>

  <!-- Header Mobile (< 768px) -->
  <header data-cta-location="header" class="md:hidden fixed top-0 left-0 right-0 z-40 px-2 sm:px-4 py-2">
    <div
      class="flex items-center justify-between bg-white rounded-2xl shadow-lg px-2.5 sm:px-3 h-14 w-full transition-all duration-300 border border-gray-100"
      :class="isScrolled ? 'shadow-xl bg-white/95 backdrop-blur-md' : 'shadow-md'"
    >
      <!-- Logo Mobile -->
      <button @click="goToHome" class="flex items-center py-1 pr-1.5 hover:opacity-80 transition-opacity min-h-[44px] cursor-pointer shrink-0">
        <img
          src="/images/logo_adt_telas_nova.png"
          alt="AD Telas e Redes"
          class="h-7 sm:h-8 w-auto max-w-[105px] sm:max-w-[120px] object-contain"
        />
      </button>

      <!-- Ações Direita Mobile (CTA Orçamento + WhatsApp + Hamburger) -->
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <!-- Botão Orçamento Compacto -->
        <NuxtLink
          to="/orcamento"
          class="px-2 sm:px-2.5 py-1.5 bg-[#F49A1A] hover:bg-[#e08910] text-white text-[11px] sm:text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 min-h-[36px] whitespace-nowrap cursor-pointer"
        >
          <span>Orçamento</span>
        </NuxtLink>

        <!-- WhatsApp Direto -->
        <a
          href="https://wa.me/5511983586611?text=Olá! Gostaria de um orçamento para telas mosquiteiras."
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 bg-[#25D366] hover:bg-[#20B858] text-white rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer min-h-[36px] min-w-[36px]"
          title="WhatsApp Direto"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
        </a>

        <!-- Botão Menu Hamburger -->
        <button
          @click="toggleMobileMenu"
          class="flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 text-gray-700 hover:text-[#22345F] bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors min-h-[36px] min-w-[36px] shrink-0 cursor-pointer"
          aria-label="Menu"
        >
          <svg class="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path :class="{'hidden': isMobileMenuOpen, 'inline-flex': !isMobileMenuOpen}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
            <path :class="{'hidden': !isMobileMenuOpen, 'inline-flex': isMobileMenuOpen}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Menu Mobile Dropdown Drawer -->
    <div
      v-show="isMobileMenuOpen"
      class="mt-2 bg-white/98 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transition-all"
    >
      <nav class="px-4 py-2 space-y-1">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="scrollToSection(item)"
          :class="[
            'block w-full text-left py-3 px-3 text-sm font-semibold rounded-xl transition-all min-h-[44px] flex items-center justify-between',
            item.highlight 
              ? 'bg-[#F49A1A] text-white font-bold my-1' 
              : 'text-gray-800 hover:bg-gray-50 hover:text-[#22345F]'
          ]"
        >
          <span>{{ item.label }}</span>
          <Icon v-if="!item.highlight" name="lucide:chevron-right" class="w-4 h-4 text-gray-400" />
        </button>
      </nav>
    </div>
  </header>
</template>