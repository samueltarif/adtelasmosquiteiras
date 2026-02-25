<script setup>
import { useServicos } from '~/composables/useServicos'

const { getFamiliaBySlug } = useServicos()
const familia = getFamiliaBySlug('redes')
const route = useRoute()

// Estado do modal de formulário
const showFormModal = ref(false)

// SEO
useHead({
  title: `${familia.nome} | Todos os Serviços | AD Telas`,
  meta: [
    { name: 'description', content: `${familia.descricao}. 17 serviços disponíveis em São Paulo.` }
  ]
})

// Breadcrumb
const breadcrumbItems = [
  { label: 'Início', to: '/' },
  { label: 'Serviços', to: '/servicos' },
  { label: familia.nome }
]

// Categorias
const categorias = Object.values(familia.categorias).map(cat => ({
  slug: cat.slug,
  titulo: cat.titulo,
  emoji: cat.emoji,
  descricao: cat.descricao,
  totalServicos: Object.keys(cat.servicos).length,
  url: `/servicos/redes/${cat.slug}`
}))

</script>

<template>
  <div class="min-h-screen bg-white">
    
    <!-- Breadcrumb -->
    <Breadcrumb :path="route.path" />
    
    <!-- Hero -->
    <section class="py-16 md:py-20 bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <div class="text-center">
          <div class="text-6xl md:text-8xl mb-6">{{ familia.icon }}</div>
          <h1 class="text-4xl md:text-6xl font-bold mb-6">{{ familia.nome }}</h1>
          <p class="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">{{ familia.descricao }}</p>
          
          <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-6 py-3 rounded-full text-lg font-bold">
            <Icon name="lucide:check-circle" class="w-5 h-5" />
            17 Serviços Disponíveis
          </div>
        </div>
      </div>
    </section>

    <!-- Categorias -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">
            Escolha a Categoria
          </h2>
          <p class="text-base md:text-lg text-[#4B5563]">
            Encontre o serviço perfeito para sua necessidade
          </p>
        </div>

        <!-- Grid de Categorias -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="categoria in categorias"
            :key="categoria.slug"
            :to="categoria.url"
            class="group bg-gradient-to-br from-[#E5EDF8] to-white p-8 rounded-3xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <!-- Icon -->
            <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Icon v-if="categoria.iconName" :name="categoria.iconName" class="w-10 h-10 text-[#22345F]" />
              <span v-else class="text-3xl">{{ categoria.emoji }}</span>
            </div>
            <h3 class="text-2xl font-bold text-[#22345F] mb-3 group-hover:text-[#F49A1A] transition-colors">
              {{ categoria.titulo }}
            </h3>
            <p class="text-[#4B5563] mb-4">{{ categoria.descricao }}</p>
            
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-[#F49A1A]">
                {{ categoria.totalServicos }} serviços
              </span>
              <Icon name="lucide:arrow-right" class="w-6 h-6 text-[#F49A1A] transition-transform group-hover:translate-x-1" />
            </div>
          </NuxtLink>
        </div>

      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 bg-gradient-to-b from-white to-[#F9FAFB]">
      <div class="container mx-auto px-4 md:px-6 max-w-4xl text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">
          Não encontrou o que procura?
        </h2>
        <p class="text-lg text-[#4B5563] mb-8">
          Fale com nossos especialistas e encontre a solução perfeita
        </p>
        <a
          href="https://wa.me/5511983586611?text=Olá!%20Preciso%20de%20ajuda%20com%20Redes%20de%20Proteção"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          Falar com Especialista
        </a>
      </div>
    </section>

    <!-- Mobile Unified CTA -->
    <MobileUnifiedCTA
      servico-atual="Redes de Proteção"
      @open-form="showFormModal = true"
    />
    
    <!-- Modal de Formulário -->
    <StickyFormModal v-model="showFormModal" />

  </div>
</template>
