<script setup>
import { ref } from 'vue'

const { scrollTo } = useScrollTo()

// Estado do menu mobile
const isMobileMenuOpen = ref(false)

// Itens do menu de navegação
const menuItems = [
  { label: 'Início', id: 'hero' },
  { label: 'Serviços', id: 'problems' },
  { label: 'Vantagens', id: 'value' },
  { label: 'Cases', id: 'cases' },
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
      const headerHeight = 120 // Altura aproximada do header (h-24 md:h-28)
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
  <header class="fixed top-0 left-0 right-0 bg-surface border-b border-border z-50 shadow-sm h-24 md:h-28 overflow-visible">
    <div class="max-w-[1200px] mx-auto px-5 flex justify-between items-center h-full">
      <!-- Logo -->
      <div class="flex items-center">
        <img 
          src="/images/logo ad.png" 
          alt="AD Telas e Redes" 
          class="h-28 md:h-36 w-auto relative z-10"
        />
      </div>

      <!-- Menu de Navegação -->
      <nav class="hidden lg:flex items-center gap-6">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="scrollToSection(item.id)"
          class="text-sm font-medium text-text-secondary hover:text-primary transition-colors duration-300 cursor-pointer"
        >
          {{ item.label }}
        </button>
      </nav>

      <!-- Menu Mobile (Hamburger) -->
      <div class="lg:hidden">
        <button 
          @click="toggleMobileMenu"
          class="w-8 h-8 flex flex-col justify-center items-center gap-1.5"
        >
          <span 
            :class="[
              'w-6 h-0.5 bg-text-primary transition-all duration-300',
              isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
            ]"
          ></span>
          <span 
            :class="[
              'w-6 h-0.5 bg-text-primary transition-all duration-300',
              isMobileMenuOpen ? 'opacity-0' : ''
            ]"
          ></span>
          <span 
            :class="[
              'w-6 h-0.5 bg-text-primary transition-all duration-300',
              isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
            ]"
          ></span>
        </button>
      </div>
    </div>

    <!-- Menu Mobile Dropdown -->
    <div 
      v-if="isMobileMenuOpen"
      class="lg:hidden absolute top-full left-0 right-0 bg-surface border-b border-border shadow-lg"
    >
      <nav class="max-w-[1200px] mx-auto px-5 py-4">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="scrollToSection(item.id)"
          class="block w-full text-left py-3 text-base font-medium text-text-secondary hover:text-primary transition-colors duration-300 border-b border-border last:border-b-0"
        >
          {{ item.label }}
        </button>
      </nav>
    </div>
  </header>
</template>
