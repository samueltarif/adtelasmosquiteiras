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
    '/images/telas_de_correr.jpg',
    '/images/mosquiteira_removivel.png',
    '/images/telas_para_basculante.jpg',
    '/images/telas_com_aluminio.jpg',
    '/images/telas_com_aco_inox.jpg',
  ],
  pet: [
    '/images/telas_pet_screen_especificacoes.jpg',
    '/images/telas_anti-pernilongos.jpg',
    '/images/gato.png',
    '/images/pets_pro.png',
  ],
  comercial: [
    '/images/telas_para_fachadas_especificacoes.png',
    '/images/telas_para_coberturas.jpg',
    '/images/telas_para_restaurantes.jpg',
    '/images/telas_para_coberturas.jpg',
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
          href="https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21%20Preciso%20de%20ajuda%20com%20Telas%20Mosquiteiras.%20Vim%20pelo%20site%3A%20https%3A%2F%2Fwww.adtelasmosquiteiras.com.br&type=phone_number&app_absent=0"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
        >
          <WhatsappIcon class="w-6 h-6" />
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

