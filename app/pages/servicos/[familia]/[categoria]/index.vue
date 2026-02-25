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
</script>

<template>
  <div class="min-h-screen bg-white">
    
    <!-- Breadcrumb -->
    <BreadcrumbServico
      :items="[
        { label: 'Início', to: '/' },
        { label: 'Serviços', to: '/servicos' },
        { label: familia.nome, to: `/servicos/${familia.slug}` },
        { label: categoria.titulo }
      ]"
    />
    
    <!-- Header -->
    <section class="py-12 md:py-16 bg-gradient-to-b from-[#F9FAFB] to-white border-b border-[#E5EDF8]">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <!-- Emoji -->
          <div class="text-5xl md:text-6xl">{{ categoria.emoji }}</div>
          
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
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          Falar no WhatsApp
        </a>
      </div>
    </section>
    
  </div>
</template>
