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
</script>

<template>
  <div class="min-h-screen bg-white">
    
    <!-- Breadcrumb -->
    <BreadcrumbServico
      :items="[
        { label: 'Início', to: '/' },
        { label: 'Serviços', to: '/servicos' },
        { label: familia.nome }
      ]"
    />
    
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
            <!-- Emoji -->
            <div class="text-5xl md:text-6xl mb-6">{{ categoria.emoji }}</div>
            
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
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          Falar com Especialista
        </a>
      </div>
    </section>
    
  </div>
</template>
