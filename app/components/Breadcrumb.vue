<script setup>
import { computed } from 'vue'

const props = defineProps({
  path: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const router = useRouter()
const { getFamiliaBySlug, getCategoriaBySlug, getServicoBySlug } = useServicos()

// Usar path da prop ou route atual
const currentPath = computed(() => props.path || route.path)

// Gerar breadcrumb items baseado no path
const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Home', path: '/', current: false, icon: 'lucide:home' }
  ]

  const pathSegments = currentPath.value.split('/').filter(Boolean)
  
  // Se estiver na home, não mostrar breadcrumb
  if (pathSegments.length === 0) {
    return []
  }

  // Serviços hub
  if (pathSegments[0] === 'servicos') {
    items.push({ 
      label: 'Serviços', 
      path: '/servicos', 
      current: pathSegments.length === 1 
    })
    
    // Família
    if (pathSegments.length >= 2) {
      const familiaSlug = pathSegments[1]
      const familia = getFamiliaBySlug(familiaSlug)
      
      if (familia) {
        items.push({
          label: familia.nome,
          path: `/servicos/${familiaSlug}`,
          current: pathSegments.length === 2
        })
        
        // Categoria
        if (pathSegments.length >= 3) {
          const categoriaSlug = pathSegments[2]
          const categoria = getCategoriaBySlug(familiaSlug, categoriaSlug)
          
          if (categoria) {
            items.push({
              label: categoria.titulo,
              path: `/servicos/${familiaSlug}/${categoriaSlug}`,
              current: pathSegments.length === 3
            })
            
            // Serviço individual
            if (pathSegments.length >= 4) {
              const servicoSlug = pathSegments[3]
              const servico = getServicoBySlug(familiaSlug, categoriaSlug, servicoSlug)
              
              if (servico) {
                items.push({
                  label: servico.titulo,
                  path: `/servicos/${familiaSlug}/${categoriaSlug}/${servicoSlug}`,
                  current: true
                })
              }
            }
          }
        }
      }
    }
  }

  return items
})

// Breadcrumb truncado para mobile (Home > ... > Atual)
const truncatedItems = computed(() => {
  if (breadcrumbItems.value.length <= 3) {
    return breadcrumbItems.value
  }
  
  return [
    breadcrumbItems.value[0], // Home
    { label: '...', path: '', truncated: true }, // Ellipsis
    breadcrumbItems.value[breadcrumbItems.value.length - 1] // Atual
  ]
})

// Schema.org structured data para SEO
const breadcrumbSchema = computed(() => {
  if (breadcrumbItems.value.length === 0) return null
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbItems.value.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.label,
      'item': `https://adtelaseredes.com.br${item.path}`
    }))
  }
})

// Swipe left para voltar (mobile)
const handleSwipeLeft = () => {
  if (breadcrumbItems.value.length > 1) {
    const previousItem = breadcrumbItems.value[breadcrumbItems.value.length - 2]
    if (previousItem && !previousItem.current) {
      router.push(previousItem.path)
    }
  }
}

// Inject Schema.org structured data via useHead
useHead(() => {
  if (!breadcrumbSchema.value) return {}
  
  return {
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(breadcrumbSchema.value)
      }
    ]
  }
})
</script>

<template>
  <div v-if="breadcrumbItems.length > 0">
    <!-- Breadcrumb Navigation -->
    <nav 
      class="bg-gray-50 border-b border-gray-200 py-3 px-4 sm:px-6 lg:px-8 z-10 relative"
      aria-label="Navegação breadcrumb"
      @touchstart.passive="touchStartX = $event.touches[0].clientX"
      @touchend.passive="(e) => {
        const touchEndX = e.changedTouches[0].clientX
        if (touchStartX - touchEndX > 50) handleSwipeLeft()
      }"
    >
      <div class="max-w-7xl mx-auto">
        <!-- Desktop: Breadcrumb completo -->
        <ol 
          class="hidden md:flex items-center space-x-1 text-sm"
          itemscope 
          itemtype="https://schema.org/BreadcrumbList"
        >
          <li
            v-for="(item, index) in breadcrumbItems"
            :key="item.path"
            class="flex items-center"
            itemprop="itemListElement"
            itemscope
            itemtype="https://schema.org/ListItem"
          >
            <!-- Separador (exceto primeiro) -->
            <Icon
              v-if="index > 0"
              name="lucide:chevron-right"
              class="w-3 h-3 text-gray-400 mx-1.5 flex-shrink-0"
            />

            <!-- Ícone Home (primeiro item) -->
            <Icon
              v-if="item.icon"
              :name="item.icon"
              class="w-4 h-4 text-gray-600 mr-1.5"
            />

            <!-- Link ou texto atual -->
            <NuxtLink
              v-if="!item.current"
              :to="item.path"
              class="text-gray-700 hover:text-emerald-600 hover:underline transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded px-1"
              itemprop="item"
            >
              <span itemprop="name">{{ item.label }}</span>
            </NuxtLink>
            <span
              v-else
              class="text-gray-900 font-semibold"
              aria-current="page"
              itemprop="name"
            >
              {{ item.label }}
            </span>

            <meta itemprop="position" :content="String(index + 1)" />
          </li>
        </ol>

        <!-- Mobile: Breadcrumb truncado -->
        <ol 
          class="flex md:hidden items-center space-x-1 text-sm overflow-x-auto"
          itemscope 
          itemtype="https://schema.org/BreadcrumbList"
        >
          <li
            v-for="(item, index) in truncatedItems"
            :key="item.path || index"
            class="flex items-center flex-shrink-0"
            itemprop="itemListElement"
            itemscope
            itemtype="https://schema.org/ListItem"
          >
            <!-- Separador (exceto primeiro) -->
            <Icon
              v-if="index > 0"
              name="lucide:chevron-right"
              class="w-3 h-3 text-gray-400 mx-1.5"
            />

            <!-- Ícone Home (primeiro item) -->
            <Icon
              v-if="item.icon"
              :name="item.icon"
              class="w-4 h-4 text-gray-600 mr-1"
            />

            <!-- Ellipsis (truncado) -->
            <span
              v-if="item.truncated"
              class="text-gray-500 font-medium px-1"
            >
              ...
            </span>

            <!-- Link ou texto atual -->
            <NuxtLink
              v-else-if="!item.current"
              :to="item.path"
              class="text-gray-700 hover:text-emerald-600 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
              itemprop="item"
            >
              <span itemprop="name">{{ item.label }}</span>
            </NuxtLink>
            <span
              v-else
              class="text-gray-900 font-semibold truncate max-w-[200px]"
              aria-current="page"
              itemprop="name"
            >
              {{ item.label }}
            </span>

            <meta itemprop="position" :content="String(index + 1)" />
          </li>
        </ol>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* Scroll horizontal suave em mobile */
ol {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

ol::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* Performance: GPU acceleration */
nav {
  will-change: transform;
  transform: translateZ(0);
}
</style>
