<script setup>
import { useServicos } from '~/composables/useServicos'

const route = useRoute()
const { getFamiliaBySlug, getCategoriaBySlug } = useServicos()

const familia = getFamiliaBySlug(route.params.familia)
const categoria = getCategoriaBySlug(route.params.familia, route.params.categoria)

// Redirecionar se não existir
if (!familia || !categoria) {
  navigateTo('/servicos')
}

// Converter serviços object para array
const servicosArray = Object.values(categoria.servicos)

// SEO
useHead({
  title: `${categoria.titulo} | ${familia.nome} | AD Telas`,
  meta: [
    { name: 'description', content: `${categoria.descricao}. ${servicosArray.length} serviços de ${familia.nome.toLowerCase()} disponíveis. Instalação em 48h.` },
    { name: 'keywords', content: `${categoria.titulo.toLowerCase()}, ${familia.nome.toLowerCase()}, são paulo` },
    { property: 'og:title', content: `${categoria.titulo} | ${familia.nome}` },
    { property: 'og:description', content: categoria.descricao }
  ]
})

// Tracking GA4
onMounted(() => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view_categoria',
      familia: familia.slug,
      categoria: categoria.slug,
      total_servicos: servicosArray.length
    })
  }
})

// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  console.log('🟢 [CATEGORIA] openFormModal() chamado')
  console.log('🟢 [CATEGORIA] showFormModal antes:', showFormModal.value)
  showFormModal.value = true
  console.log('🟢 [CATEGORIA] showFormModal depois:', showFormModal.value)
}
</script>

<template>
  <div class="min-h-screen bg-white">
    
    <!-- Breadcrumb -->
    <Breadcrumb />
    
    <!-- Header -->
    <section class="py-12 md:py-16 bg-gradient-to-b from-[#F9FAFB] to-white border-b border-[#E5EDF8]">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <!-- Icon -->
          <div class="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Icon v-if="categoria.iconName" :name="categoria.iconName" class="w-10 h-10 md:w-12 md:h-12 text-[#22345F]" />
            <span v-else class="text-5xl md:text-6xl">{{ categoria.emoji }}</span>
          </div>
          
          <!-- Textos -->
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-2xl">{{ familia.icon }}</span>
              <span class="text-sm font-semibold text-[#4B5563] uppercase tracking-wide">
                {{ familia.nome }}
              </span>
            </div>
            <h1 class="text-3xl md:text-5xl font-bold text-[#22345F] mb-3">
              {{ categoria.titulo }}
            </h1>
            <p class="text-base md:text-lg text-[#4B5563] mb-4">
              {{ categoria.descricao }}
            </p>
            <div class="inline-flex items-center gap-2 bg-[#E5EDF8] px-4 py-2 rounded-full">
              <Icon name="lucide:layers" class="w-5 h-5 text-[#F49A1A]" />
              <span class="font-semibold text-[#22345F]">
                {{ servicosArray.length }} {{ servicosArray.length === 1 ? 'serviço' : 'serviços' }} disponíveis
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Grid de Serviços -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <ServiceGrid
          :servicos="servicosArray"
          :familia-slug="familia.slug"
          :categoria-slug="categoria.slug"
          :columns="3"
        />
      </div>
    </section>
    
    <!-- Navegação para outras categorias -->
    <section class="py-12 bg-[#F9FAFB] border-t border-[#E5EDF8]">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-8 text-center">
          Outras Categorias de {{ familia.nome }}
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            v-for="(cat, key) in familia.categorias"
            :key="key"
            v-show="cat.slug !== categoria.slug"
            :to="`/servicos/${familia.slug}/${cat.slug}`"
            class="group bg-white rounded-xl p-6 border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all hover:shadow-lg"
          >
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ cat.emoji }}</span>
              <div class="flex-1">
                <h3 class="font-bold text-[#22345F] group-hover:text-[#F49A1A] transition-colors">
                  {{ cat.titulo }}
                </h3>
                <p class="text-sm text-[#4B5563]">
                  {{ Object.keys(cat.servicos).length }} serviços
                </p>
              </div>
              <Icon name="lucide:chevron-right" class="w-5 h-5 text-[#25D366]" />
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
    
    <!-- CTA WhatsApp -->
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4 md:px-6 max-w-4xl text-center">
        <h3 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-4">
          Não encontrou o que procura?
        </h3>
        <p class="text-base text-[#4B5563] mb-6">
          Fale conosco e encontraremos a solução ideal para você
        </p>
        <a
          :href="`https://wa.me/5511983586611?text=Olá!%20Estou%20procurando%20serviços%20de%20${categoria.titulo}`"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
          data-gtm="categoria-whatsapp"
        >
          <Icon name="lucide:message-circle" class="w-6 h-6" />
          Falar no WhatsApp
        </a>
      </div>
    </section>

    <!-- Mobile Unified CTA -->
    <MobileUnifiedCTA
      :servico-atual="categoria.titulo"
      :msg-padrao="`Olá! Gostaria de um orçamento para ${categoria.titulo}.`"
      @open-form="openFormModal"
    />

    <!-- Modal de Formulário -->
    <StickyFormModal v-model="showFormModal" />
    
  </div>
</template>
