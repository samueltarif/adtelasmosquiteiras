<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useServicos } from '~/composables/useServicos'

const { getFamiliaBySlug } = useServicos()
const familia = getFamiliaBySlug('telas')

const showFormModal = ref(false)
const openFormModal = () => { showFormModal.value = true }

useHead({
  title: `${familia.nome} | Todos os Serviços | AD Telas`,
  meta: [
    { name: 'description', content: `${familia.descricao}. 18 serviços disponíveis em São Paulo.` }
  ]
})

// Imagens por categoria para o carrossel de fundo dos cards
const categoriaImages = {
  residencial: [
    '/images/telas_para_varandas.jpg',
    '/images/telas_para_sacadas.jpg',
    '/images/telas_para_apartamento.jpg',
    '/images/telas_para_banheiro.jpg',
    '/images/telas_para_portas.jpeg',
    '/images/tela_mosquiteira.png',
  ],
  especiais: [
    '/images/telas_de_correr.jpg',
    '/images/telas_pivotantes.webp',
    '/images/telas_removiveis.webp',
    '/images/telas_para_basculante.jpg',
    '/images/telas_com_aluminio.jpg',
    '/images/telas_com_aco_inox.jpg',
  ],
  pet: [
    '/images/telas_pet_screen.webp',
    '/images/telas_anti-pernilongos.jpg',
    '/images/gato.png',
    '/images/pets_pro.png',
  ],
  comercial: [
    '/images/telas_para_fachadas.webp',
    '/images/telas_para_coberturas.jpg',
    '/images/telas_para_restaurantes.jpg',
    '/images/telas_para_industrias.webp',
  ],
}

const categorias = Object.values(familia.categorias).map(cat => ({
  slug: cat.slug,
  titulo: cat.titulo,
  emoji: cat.emoji,
  iconName: cat.iconName,
  descricao: cat.descricao,
  totalServicos: Object.keys(cat.servicos).length,
  url: `/servicos/telas/${cat.slug}`,
  images: categoriaImages[cat.slug] || [],
  cardIndex: ref(0),
}))

// Hero: 3 blocos independentes
const blocks = [
  {
    images: [
      { src: '/images/mosquiteira_area_externa.png', alt: 'Mosquiteira área externa' },
      { src: '/images/mosquiteira_porta_de_correr.png', alt: 'Mosquiteira porta de correr' },
    ],
    index: ref(0)
  },
  {
    images: [
      { src: '/images/mosquiteira_janela.png', alt: 'Mosquiteira para janela' },
      { src: '/images/tela_mosquiteira.png', alt: 'Tela mosquiteira' },
    ],
    index: ref(0)
  },
  {
    images: [
      { src: '/images/mosquiteira_para_porta.png', alt: 'Mosquiteira para porta' },
      { src: '/images/mosquiteira_removivel.png', alt: 'Mosquiteira removível' },
    ],
    index: ref(0)
  }
]

const carouselImages = blocks.flatMap(b => b.images)
const currentIndex = ref(0)
let timers = []

onMounted(() => {
  timers.push(setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % carouselImages.length
  }, 3500))
  blocks.forEach((block, i) => {
    setTimeout(() => {
      timers.push(setInterval(() => {
        block.index.value = (block.index.value + 1) % block.images.length
      }, 3500))
    }, i * 1200)
  })
  // Carrossel dos cards de categoria (cada um com offset diferente)
  categorias.forEach((cat, i) => {
    if (cat.images.length > 1) {
      setTimeout(() => {
        timers.push(setInterval(() => {
          cat.cardIndex.value = (cat.cardIndex.value + 1) % cat.images.length
        }, 3000))
      }, i * 800)
    }
  })
})
onUnmounted(() => { timers.forEach(t => clearInterval(t)) })
</script>

<template>
  <div class="min-h-screen bg-white">
    
    <!-- Breadcrumb -->
    <Breadcrumb />
    
    <!-- Hero com carrossel -->
    <!-- Mobile: carrossel único -->
    <section class="md:hidden w-full h-72 relative overflow-hidden">
      <img
        v-for="(img, i) in carouselImages"
        :key="img.src"
        :src="img.src"
        :alt="img.alt"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        :class="currentIndex === i ? 'opacity-100' : 'opacity-0'"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-[#22345F]/70 via-[#22345F]/60 to-[#22345F]/80"></div>
      <div class="absolute inset-0 flex items-center justify-center px-4 text-center text-white">
        <h1 class="text-3xl font-bold">{{ familia.nome }}</h1>
      </div>
    </section>

    <!-- Desktop: 3 blocos lado a lado -->
    <section class="hidden md:block w-full relative overflow-hidden" style="height: 420px;">
      <div class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <h1 class="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{{ familia.nome }}</h1>
      </div>
      <div class="flex h-full">
        <div
          v-for="(block, bi) in blocks"
          :key="bi"
          class="relative flex-1 overflow-hidden"
          :class="bi === 1 ? 'border-x-2 border-white/20' : ''"
        >
          <img
            v-for="(img, i) in block.images"
            :key="img.src"
            :src="img.src"
            :alt="img.alt"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            :class="block.index.value === i ? 'opacity-100' : 'opacity-0'"
          />
          <div class="absolute inset-0 bg-[#22345F]/60"></div>
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NuxtLink
            v-for="categoria in categorias"
            :key="categoria.slug"
            :to="categoria.url"
            class="group relative overflow-hidden rounded-3xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-[260px]"
          >
            <!-- Carrossel de fundo -->
            <div class="absolute inset-0">
              <img
                v-for="(img, i) in categoria.images"
                :key="img"
                :src="img"
                :alt="categoria.titulo"
                class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                :class="categoria.cardIndex.value === i ? 'opacity-100' : 'opacity-0'"
              />
              <!-- Overlay gradiente para legibilidade -->
              <div class="absolute inset-0 bg-gradient-to-t from-[#22345F]/90 via-[#22345F]/50 to-white/80"></div>
            </div>

            <!-- Conteúdo sobre o carrossel -->
            <div class="relative z-10 p-8 flex flex-col h-full">
              <div class="w-16 h-16 bg-white/90 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <Icon v-if="categoria.iconName" :name="categoria.iconName" class="w-10 h-10 text-[#22345F]" />
                <span v-else class="text-3xl">{{ categoria.emoji }}</span>
              </div>
              <h3 class="text-2xl font-bold text-white mb-3 drop-shadow">
                {{ categoria.titulo }}
              </h3>
              <p class="text-white/80 mb-4 text-sm">{{ categoria.descricao }}</p>
              <div class="flex items-center justify-between mt-auto">
                <span class="text-sm font-semibold text-[#F49A1A]">
                  {{ categoria.totalServicos }} serviços
                </span>
                <Icon name="lucide:arrow-right" class="w-6 h-6 text-[#F49A1A] transition-transform group-hover:translate-x-1" />
              </div>
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
          href="https://wa.me/5511983586611?text=Olá!%20Preciso%20de%20ajuda%20com%20Telas%20Mosquiteiras.%20Vim%20pelo%20site%3A%20https://www.adtelasmosquiteiras.com.br/home"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.424h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
          </svg>
          Falar com Especialista
        </a>
      </div>
    </section>

    <!-- Mobile Unified CTA -->
    <MobileUnifiedCTA
      servico-atual="Telas Mosquiteiras"
      msg-padrao="Olá! Gostaria de um orçamento para Telas Mosquiteiras."
      @open-form="openFormModal"
    />

    <!-- Modal de Formulário -->
    <StickyFormModal v-model="showFormModal" />

  </div>
</template>

