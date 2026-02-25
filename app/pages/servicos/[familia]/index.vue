<script setup>
import { useServicos } from '~/composables/useServicos'

const route = useRoute()
const { getFamiliaBySlug } = useServicos()
const familia = getFamiliaBySlug(route.params.familia)

// Redirecionar se família não existir
if (!familia) {
  navigateTo('/servicos')
}

// Contar total de serviços
const totalServicos = Object.values(familia.categorias).reduce(
  (sum, cat) => sum + Object.keys(cat.servicos).length,
  0
)

// SEO
useHead({
  title: `${familia.nome} | Todos os Serviços | AD Telas`,
  meta: [
    { name: 'description', content: `${familia.descricao}. ${totalServicos} serviços disponíveis. Instalação em 48h. Garantia 2 anos.` },
    { name: 'keywords', content: `${familia.nome.toLowerCase()}, são paulo, instalação, garantia` },
    { property: 'og:title', content: `${familia.nome} | AD Telas` },
    { property: 'og:description', content: familia.descricao }
  ]
})

// Tracking GA4
onMounted(() => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view_familia',
      familia: familia.slug,
      total_servicos: totalServicos
    })
  }
})

// Tracking de clique em categoria
const trackCategoriaClick = (categoriaSlug) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'categoria_clicked',
      familia: familia.slug,
      categoria: categoriaSlug
    })
  }
}

// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  console.log('🟢 [FAMILIA] openFormModal() chamado')
  console.log('🟢 [FAMILIA] showFormModal antes:', showFormModal.value)
  showFormModal.value = true
  console.log('🟢 [FAMILIA] showFormModal depois:', showFormModal.value)
}
</script>

<template>
  <div class="min-h-screen bg-white">
    
    <!-- Breadcrumb -->
    <Breadcrumb />
    
    <!-- Hero -->
    <section class="py-16 md:py-24 bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>
      
      <div class="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
        <div class="text-center">
          <div class="text-6xl md:text-8xl mb-6">{{ familia.icon }}</div>
          <h1 class="text-4xl md:text-6xl font-bold mb-4">
            {{ familia.nome }}
          </h1>
          <p class="text-xl md:text-2xl text-white/90 mb-6 max-w-3xl mx-auto">
            {{ familia.descricao }}
          </p>
          <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
            <span class="text-lg font-semibold">{{ totalServicos }} serviços disponíveis</span>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Grid de Categorias (2x2) -->
    <section class="py-16 md:py-24 bg-gradient-to-b from-white to-[#F9FAFB]">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">
            Escolha uma Categoria
          </h2>
          <p class="text-base md:text-lg text-[#4B5563]">
            Encontre o serviço ideal para sua necessidade
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <NuxtLink
            v-for="(categoria, key) in familia.categorias"
            :key="key"
            :to="`/servicos/${familia.slug}/${categoria.slug}`"
            @click="trackCategoriaClick(categoria.slug)"
            class="group bg-white rounded-3xl p-8 md:p-10 border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            :data-gtm="`categoria-${categoria.slug}`"
          >
            <!-- Icon -->
            <div class="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <Icon v-if="categoria.iconName" :name="categoria.iconName" class="w-12 h-12 md:w-14 md:h-14 text-[#22345F]" />
              <span v-else class="text-5xl md:text-6xl">{{ categoria.emoji }}</span>
            </div>
            
            <!-- Título -->
            <h3 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3 group-hover:text-[#F49A1A] transition-colors">
              {{ categoria.titulo }}
            </h3>
            
            <!-- Descrição -->
            <p class="text-base text-[#4B5563] mb-6">
              {{ categoria.descricao }}
            </p>
            
            <!-- Contador + Botão -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-[#F49A1A] font-bold text-lg">
                <span>{{ Object.keys(categoria.servicos).length }}</span>
                <span class="text-[#4B5563] font-normal">serviços</span>
              </div>
              
              <div class="flex items-center gap-2 text-[#25D366] font-semibold group-hover:gap-3 transition-all">
                <span>Ver serviços</span>
                <Icon name="lucide:arrow-right" class="w-5 h-5" />
              </div>
            </div>
          </NuxtLink>
        </div>
        
      </div>
    </section>
    
    <!-- CTA WhatsApp -->
    <section class="py-12 bg-white border-t border-[#E5EDF8]">
      <div class="container mx-auto px-4 md:px-6 max-w-4xl text-center">
        <h3 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-4">
          Precisa de ajuda para escolher?
        </h3>
        <p class="text-base text-[#4B5563] mb-6">
          Fale com nossos especialistas e receba orientação personalizada
        </p>
        <a
          href="https://wa.me/5511983586611?text=Olá!%20Estou%20interessado%20em%20serviços%20de%20{{ familia.nome }}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
          data-gtm="familia-whatsapp"
        >
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Falar com Especialista
        </a>
      </div>
    </section>

    <!-- Mobile Unified CTA -->
    <MobileUnifiedCTA
      :servico-atual="familia.nome"
      :msg-padrao="`Olá! Gostaria de um orçamento para ${familia.nome}.`"
      @open-form="openFormModal"
    />

    <!-- Modal de Formulário -->
    <StickyFormModal v-model="showFormModal" />
    
  </div>
</template>
