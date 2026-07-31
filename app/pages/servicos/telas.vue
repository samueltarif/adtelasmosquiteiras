<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useServicos } from '~/composables/useServicos'

const { WHATSAPP_NUMBER } = useServicos()
const route = useRoute()
const showFormModal = ref(false)

useHead({
  title: 'Telas Mosquiteiras em São Paulo | Janelas, Portas, Varanda e Mais | AD Telas',
  meta: [
    { name: 'description', content: 'Telas mosquiteiras para janelas, portas, varandas, pets e fachadas. Proteção contra dengue, zika e chikungunya. Instalação em 24h, garantia 2 anos!' },
    { property: 'og:title', content: 'Telas Mosquiteiras SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Todos os modelos de telas mosquiteiras em um só lugar. Orçamento grátis!' },
  ]
})

// Ordenados pelos mais buscados no Google (volume de busca)
const categorias = [
  {
    slug: 'residencial',
    titulo: 'Residencial',
    emoji: '🏠',
    iconName: 'lucide:home',
    descricao: 'Para janelas, portas, varandas e mais',
    servicos: [
      { slug: 'janelas',     titulo: 'Telas Mosquiteiras para Janelas',     descricaoCurta: 'Visão 100% clara, proteção total contra mosquitos',        destaque: 'Mais Buscado', imagem: '/images/tela_mosquiteira.png', imagens: ['/images/tela_mosquiteira.png', '/images/mosquiteira_janela.png'] },
      { slug: 'portas',      titulo: 'Telas Mosquiteiras para Portas',      descricaoCurta: 'Ventilação máxima sem deixar mosquitos entrarem',          destaque: 'Fácil abertura', imagem: '/images/telas_para_portas.jpeg', imagens: ['/images/telas_para_portas.jpeg', '/images/mosquiteira_para_porta.png'] },
      { slug: 'varandas',    titulo: 'Telas Mosquiteiras para Varandas',    descricaoCurta: 'Aproveite a varanda sem insetos',                          destaque: 'Área completa', imagem: '/images/telas_para_varandas.jpg', imagens: ['/images/telas_para_varandas.jpg', '/images/mosquiteira_area_externa.png'] },
      { slug: 'sacadas',     titulo: 'Telas Mosquiteiras para Sacadas',     descricaoCurta: 'Proteção total contra mosquitos na sacada',                destaque: 'Instalação rápida', imagem: '/images/telas_para_sacadas.jpg', imagens: ['/images/telas_para_sacadas.jpg', '/images/telas_para_varandas.jpg'] },
      { slug: 'apartamentos',titulo: 'Telas Mosquiteiras para Apartamentos',descricaoCurta: 'Solução completa anti-mosquito para apartamentos',         destaque: 'Pacote completo', imagem: '/images/telas_para_apartamento.jpg', imagens: ['/images/telas_para_apartamento.jpg', '/images/tela_mosquiteira.png'] },
      { slug: 'banheiro',    titulo: 'Telas Mosquiteiras para Banheiro',    descricaoCurta: 'Proteção em áreas úmidas contra insetos',                  destaque: 'Anti-mofo', imagem: '/images/telas_para_banheiro.jpg', imagens: ['/images/telas_para_banheiro.jpg', '/images/telas_para_basculante.jpg'] },
    ]
  },
  {
    slug: 'especiais',
    titulo: 'Modelos Especiais',
    emoji: '🔧',
    iconName: 'lucide:wrench',
    descricao: 'Sistemas diferenciados de abertura',
    servicos: [
      { slug: 'correr',    titulo: 'Telas Mosquiteiras de Correr',         descricaoCurta: 'Sistema deslizante prático para qualquer janela',    destaque: 'Fácil uso', imagem: '/images/telas_de_correr.jpg', imagens: ['/images/telas_de_correr.jpg', '/images/mosquiteira_porta_de_correr.png'] },
      { slug: 'removivel', titulo: 'Telas Mosquiteiras Removíveis',        descricaoCurta: 'Fácil de remover, instalar e limpar',               destaque: 'Prática', imagem: '/images/mosquiteira_removivel.png', imagens: ['/images/mosquiteira_removivel.png', '/images/tela_mosquiteira.png'] },
      { slug: 'aluminio',  titulo: 'Telas Mosquiteiras com Alumínio',      descricaoCurta: 'Estrutura em alumínio reforçado e durável',         destaque: 'Durável', imagem: '/images/telas_com_aluminio.jpg', imagens: ['/images/telas_com_aluminio.jpg', '/images/telas_com_aco_inox.jpg'] },
      { slug: 'basculante',titulo: 'Telas Mosquiteiras para Basculantes',  descricaoCurta: 'Específica para janelas basculantes',               destaque: 'Sob medida', imagem: '/images/telas_para_basculante.jpg', imagens: ['/images/telas_para_basculante.jpg', '/images/telas_para_banheiro.jpg'] },
      { slug: 'pivotante', titulo: 'Telas Mosquiteiras Pivotantes',        descricaoCurta: 'Abertura giratória moderna e funcional',           destaque: 'Moderna', imagem: '/images/telas_de_correr.jpg', imagens: ['/images/telas_de_correr.jpg', '/images/mosquiteira_removivel.png'] },
      { slug: 'acoinox',   titulo: 'Telas Mosquiteiras com Aço Inox',      descricaoCurta: 'Máxima resistência e durabilidade — opção premium', destaque: 'Premium', imagem: '/images/telas_com_aco_inox.jpg', imagens: ['/images/telas_com_aco_inox.jpg', '/images/telas_com_aluminio.jpg'] },
    ]
  },
  {
    slug: 'pet',
    titulo: 'Pet Screen',
    emoji: '🐾',
    iconName: 'lucide:paw-print',
    descricao: 'Telas reforçadas resistentes a arranhões',
    servicos: [
      { slug: 'pets',       titulo: 'Telas Mosquiteiras Pet Screen',         descricaoCurta: 'Resistente a arranhões de gatos e cachorros',     destaque: 'Anti-arranhão', imagem: '/images/telas_pet_screen_especificacoes.jpg', imagens: ['/images/telas_pet_screen_especificacoes.jpg', '/images/pets_pro.png'] },
      { slug: 'pernilongos',titulo: 'Telas Mosquiteiras Anti-Pernilongos',   descricaoCurta: 'Malha extra fina — barra até os menores insetos', destaque: 'Malha micro', imagem: '/images/telas_anti-pernilongos.jpg', imagens: ['/images/telas_anti-pernilongos.jpg', '/images/tela_mosquiteira.png'] },
    ]
  },
  {
    slug: 'comercial',
    titulo: 'Fachadas Grandes',
    emoji: '🏢',
    iconName: 'lucide:building-2',
    descricao: 'Soluções para grandes áreas comerciais',
    servicos: [
      { slug: 'fachadas',    titulo: 'Telas Mosquiteiras para Fachadas',    descricaoCurta: 'Proteção para grandes fachadas de prédios',      destaque: 'Grande porte', imagem: '/images/telas_para_fachadas_especificacoes.png', imagens: ['/images/telas_para_fachadas_especificacoes.png', '/images/telas_para_coberturas.jpg'] },
      { slug: 'coberturas',  titulo: 'Telas Mosquiteiras para Coberturas',  descricaoCurta: 'Proteção em áreas cobertas e toldos',           destaque: 'Sob medida', imagem: '/images/telas_para_coberturas.jpg', imagens: ['/images/telas_para_coberturas.jpg', '/images/telas_para_restaurantes.jpg'] },
      { slug: 'restaurantes',titulo: 'Telas Mosquiteiras para Restaurantes',descricaoCurta: 'Ambiente livre de insetos para seu negócio',    destaque: 'Comercial', imagem: '/images/telas_para_restaurantes.jpg', imagens: ['/images/telas_para_restaurantes.jpg', '/images/telas_para_fachadas_especificacoes.png'] },
      { slug: 'industrias',  titulo: 'Telas Mosquiteiras para Indústrias',  descricaoCurta: 'Proteção industrial de alta resistência',       destaque: 'Alta resistência', imagem: '/images/telas_para_coberturas.jpg', imagens: ['/images/telas_para_coberturas.jpg', '/images/telas_para_restaurantes.jpg'] },
    ]
  }
]

const getWhatsappUrl = (servicoTitulo) => {
  const msg = `Olá! Gostaria de um orçamento para:\n\nServiço: ${servicoTitulo}\n\nVim pelo site: https://www.adtelasmosquiteiras.com.br/\n\nPode me ajudar?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

// Hero carousel & Card image indices
const heroImages = [
  { src: '/images/tela_mosquiteira.png',        alt: 'Tela mosquiteira para janela' },
  { src: '/images/mosquiteira_janela.png',      alt: 'Mosquiteira janela' },
  { src: '/images/telas_para_varandas.jpg',     alt: 'Telas para varanda' },
  { src: '/images/telas_para_portas.jpeg',      alt: 'Telas para portas' },
  { src: '/images/mosquiteira_removivel.png',   alt: 'Mosquiteira removível' },
  { src: '/images/telas_de_correr.jpg',         alt: 'Telas de correr' },
]
const heroIndex = ref(0)
const cardImageIndex = ref(0)
let heroTimer = null
let cardTimer = null

onMounted(() => { 
  heroTimer = setInterval(() => { heroIndex.value = (heroIndex.value + 1) % heroImages.length }, 3500)
  cardTimer = setInterval(() => { cardImageIndex.value = (cardImageIndex.value + 1) % 2 }, 3000)
})
onUnmounted(() => { 
  clearInterval(heroTimer)
  clearInterval(cardTimer)
})
</script>

<template>
  <div class="min-h-screen bg-white">

    <!-- Breadcrumb -->
    <Breadcrumb :path="route.path" />

    <!-- Hero -->
    <section class="relative w-full overflow-hidden" style="height: 360px;">
      <img
        v-for="(img, i) in heroImages"
        :key="img.src"
        :src="img.src"
        :alt="img.alt"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        :class="heroIndex === i ? 'opacity-100' : 'opacity-0'"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#22345F]/90 via-[#22345F]/60 to-[#22345F]/30"></div>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span class="inline-block bg-[#F49A1A] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide">🦟 18 Serviços Disponíveis</span>
        <h1 class="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-3">
          Telas Mosquiteiras em São Paulo
        </h1>
        <p class="text-white/90 text-base md:text-lg max-w-2xl">
          Proteção contra dengue, zika e chikungunya • Instalação em 24h • Garantia 2 anos
        </p>
        <div class="flex gap-3 mt-6 flex-wrap justify-center">
          <a
            href="https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Telas+Mosquiteiras.+Vim+pelo+site.&type=phone_number&app_absent=0"
            target="_blank"
            class="flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1fb854] transition-all shadow-lg"
          >
            <Icon name="lucide:message-circle" class="w-5 h-5" />
            Orçamento Grátis no WhatsApp
          </a>
          <a
            href="tel:+5511983586611"
            class="flex items-center gap-2 bg-white/20 backdrop-blur text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-all border border-white/40"
          >
            <Icon name="lucide:phone" class="w-5 h-5" />
            Ligar Agora
          </a>
        </div>
      </div>
    </section>

    <!-- Trust bar -->
    <div class="bg-[#22345F] py-3">
      <div class="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 text-white text-sm">
        <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" />Garantia 2 anos</span>
        <span class="flex items-center gap-1.5"><Icon name="lucide:clock" class="w-4 h-4 text-[#F49A1A]" />Instalação em 24h</span>
        <span class="flex items-center gap-1.5"><Icon name="lucide:star" class="w-4 h-4 text-[#F49A1A]" />5.0 ★ (487 avaliações)</span>
        <span class="flex items-center gap-1.5"><Icon name="lucide:map-pin" class="w-4 h-4 text-[#F49A1A]" />Toda Grande SP</span>
      </div>
    </div>

    <!-- Seções de serviços por categoria -->
    <template v-for="(categoria, ci) in categorias" :key="categoria.slug">
      <section
        class="py-14 md:py-20"
        :class="ci % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'"
      >
        <div class="max-w-7xl mx-auto px-4 md:px-6">

          <!-- Cabeçalho da categoria -->
          <div class="flex items-center gap-3 mb-8">
            <div class="w-12 h-12 rounded-2xl bg-[#22345F] flex items-center justify-center shrink-0">
              <Icon :name="categoria.iconName" class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-[#22345F]">{{ categoria.titulo }}</h2>
              <p class="text-[#4B5563] text-sm">{{ categoria.descricao }}</p>
            </div>
          </div>

          <!-- Grid de serviços -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <a
              v-for="servico in categoria.servicos"
              :key="servico.slug"
              :href="getWhatsappUrl(servico.titulo)"
              target="_blank"
              rel="noopener noreferrer"
              class="group bg-white rounded-2xl overflow-hidden border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col cursor-pointer"
            >
              <!-- Imagem -->
              <div class="relative h-44 overflow-hidden bg-[#E5EDF8]">
                <img
                  v-for="(imgSrc, imgIdx) in (servico.imagens || [servico.imagem])"
                  :key="imgSrc"
                  :src="imgSrc"
                  :alt="servico.titulo"
                  class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 group-hover:scale-105"
                  :class="cardImageIndex % (servico.imagens?.length || 1) === imgIdx ? 'opacity-100' : 'opacity-0'"
                  loading="lazy"
                />
                <!-- Badge destaque -->
                <div class="absolute top-3 left-3 bg-[#F49A1A] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                  {{ servico.destaque }}
                </div>
                <!-- Overlay hover -->
                <div class="absolute inset-0 bg-[#22345F]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div class="flex items-center gap-2 bg-[#25D366] text-white font-bold px-4 py-2 rounded-xl shadow-lg text-sm">
                    <Icon name="lucide:message-circle" class="w-4 h-4" />
                    Pedir Orçamento
                  </div>
                </div>
              </div>

              <!-- Conteúdo -->
              <div class="p-4 flex flex-col flex-1">
                <h3 class="text-[15px] font-bold text-[#22345F] mb-1 leading-snug">{{ servico.titulo }}</h3>
                <p class="text-xs text-[#4B5563] mb-3 flex-1">{{ servico.descricaoCurta }}</p>
                <div class="flex items-center justify-between mt-auto">
                  <span class="text-[11px] text-[#4B5563] flex items-center gap-1">
                    <Icon name="lucide:clock" class="w-3 h-3 text-[#F49A1A]" /> Instalação 24h
                  </span>
                  <span class="flex items-center gap-1 text-[#25D366] text-xs font-semibold">
                    <Icon name="lucide:message-circle" class="w-4 h-4" /> WhatsApp
                  </span>
                </div>
              </div>
            </a>
          </div>

        </div>
      </section>
    </template>

    <!-- CTA Final -->
    <section class="py-16 bg-gradient-to-br from-[#22345F] to-[#1a2847]">
      <div class="max-w-3xl mx-auto px-4 text-center">
        <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">
          Não encontrou o que procura?
        </h2>
        <p class="text-white/80 mb-8 text-base">
          Fale com nossos especialistas. Atendemos qualquer necessidade!
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Preciso+de+ajuda+com+Telas+Mosquiteiras.+Vim+pelo+site.&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all shadow-lg"
          >
            <WhatsappIcon class="w-6 h-6" />
            Falar com Especialista
          </a>
          <a
            href="tel:+5511983586611"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/15 text-white rounded-xl font-bold text-lg hover:bg-white/25 transition-all border border-white/30"
          >
            <Icon name="lucide:phone" class="w-6 h-6" />
            (11) 98358-6611
          </a>
        </div>
      </div>
    </section>

    <!-- Mobile CTA -->
    <MobileUnifiedCTA
      servico-atual="Telas Mosquiteiras"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />

  </div>
</template>
