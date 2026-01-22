<script setup>
import { ref } from 'vue'

// Estado do menu mobile
const isMobileMenuOpen = ref(false)

// Itens do menu de navegação
const menuItems = [
  { label: 'Início', id: 'hero' },
  { label: 'Serviços', id: 'problems' },
  { label: 'Vantagens', id: 'value' },
  { label: 'Cases', id: 'cases' },
  { label: 'Avaliações', id: 'reviews' },
  { label: 'Soluções', id: 'solutions' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contato', id: 'contact' }
]

// Função para alternar menu mobile
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Função para scroll suave para seções
const scrollToSection = (sectionId) => {
  isMobileMenuOpen.value = false // Fechar menu mobile
  
  if (sectionId === 'hero') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    const element = document.querySelector(`[data-section="${sectionId}"]`)
    if (element) {
      // Calcular offset para compensar o header fixo
      const headerHeight = 112 // Nova altura do header (h-28 = 112px)
      const elementPosition = element.offsetTop - headerHeight
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }
}
</script>

<template>
  <!-- Header Desktop -->
  <header class="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-28">
        <!-- Logo com 150px width, auto height, 10px padding -->
        <div class="flex items-center p-2.5">
          <img 
            src="/images/logo ad.png" 
            alt="AD Telas e Redes" 
            class="w-[150px] h-auto"
          />
        </div>

        <!-- Menu de Navegação - Esconde em telas < 768px -->
        <nav class="hidden md:flex items-center space-x-8">
          <button
            v-for="item in menuItems"
            :key="item.id"
            @click="scrollToSection(item.id)"
            class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
          >
            {{ item.label }}
          </button>
        </nav>

        <!-- Menu Mobile (Hamburger) - Aparece em telas < 768px -->
        <div class="md:hidden">
          <button 
            @click="toggleMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
          @click="scrollToSection(item.id)"
          class="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-base font-medium w-full text-left transition-colors duration-200"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </header>

  <!-- Header Mobile Sticky Compacto -->
  <header class="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm h-16">
    <div class="flex justify-between items-center h-full px-4">
      <!-- Logo Mobile -->
      <div class="flex items-center">
        <img 
          src="/images/logo ad.png" 
          alt="AD Telas" 
          class="h-12 w-auto"
        />
      </div>

      <!-- Telefone WhatsApp Compacto -->
      <a 
        href="https://wa.me/5511983586611?text=Olá! Vi seu site e gostaria de um orçamento para telas mosquiteiras."
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-center w-10 h-8 bg-[#25D366] hover:bg-[#20B858] text-white rounded-full transition-all duration-300 active:scale-95"
        title="WhatsApp: (11) 98358-6611"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
        </svg>
      </a>

      <!-- Menu Hamburger -->
      <button 
        @click="toggleMobileMenu"
        class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
      >
        <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
          <path :class="{'hidden': isMobileMenuOpen, 'inline-flex': !isMobileMenuOpen }" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path :class="{'hidden': !isMobileMenuOpen, 'inline-flex': isMobileMenuOpen }" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Menu Mobile Dropdown -->
    <div v-show="isMobileMenuOpen" class="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
      <nav class="px-4 py-3">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="scrollToSection(item.id)"
          class="block w-full text-left py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
        >
          {{ item.label }}
        </button>
      </nav>
    </div>
  </header>
</template>