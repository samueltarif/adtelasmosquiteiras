<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useServicos } from '~/composables/useServicos'

const { WHATSAPP_NUMBER } = useServicos()
const route = useRoute()
const showFormModal = ref(false)

useHead({
  title: 'Telas Mosquiteiras em São Paulo | Modelos Sob Medida | AD Telas',
  meta: [
    { name: 'description', content: 'Telas mosquiteiras sob medida para janelas, portas, sacadas e ambientes comerciais em São Paulo. Instalação profissional. Solicite seu orçamento.' },
    { property: 'og:title', content: 'Telas Mosquiteiras SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Modelos de telas mosquiteiras sob medida para sua residência ou comércio. Solicite um orçamento.' },
  ]
})

// Principais modelos com landing pages dedicadas
const modelosPrincipais = [
  { path: '/servicos/telas/janelas', titulo: 'Telas para Janelas', desc: 'Modelos sob medida para janelas de correr, basculantes e pivotantes', icon: 'lucide:layout-grid', img: '/images/tela_mosquiteira.png' },
  { path: '/servicos/telas/portas', titulo: 'Telas para Portas', desc: 'Soluções para portas balcão e acessos frequentes com ajuste preciso', icon: 'lucide:door-open', img: '/images/telas_para_portas.jpeg' },
  { path: '/servicos/telas/sacadas-e-varandas', titulo: 'Sacadas e Varandas', desc: 'Proteção contra insetos para áreas externas e terraços', icon: 'lucide:sun', img: '/images/telas_para_varandas.jpg' },
  { path: '/servicos/telas/removivel', titulo: 'Telas Removíveis', desc: 'Praticidade para encaixar, retirar e higienizar quando desejar', icon: 'lucide:move', img: '/images/mosquiteira_removivel.png' },
  { path: '/servicos/telas/pet-screen', titulo: 'Pet Screen', desc: 'Modelo voltado para ambientes residenciais com animais', icon: 'lucide:paw-print', img: '/images/telas_pet_screen_especificacoes.jpg' },
  { path: '/servicos/telas/restaurantes', titulo: 'Restaurantes e Cozinhas', desc: 'Proteção contra insetos para ambientes comerciais e alimentícios', icon: 'lucide:utensils', img: '/images/telas_para_restaurantes.jpg' },
]

// Ordenados pelos mais buscados no Google (volume de busca)
const categorias = [
  {
    slug: 'residencial',
    titulo: 'Residencial',
    emoji: '🏠',
    iconName: 'lucide:home',
    descricao: 'Para janelas, portas, varandas e mais',
    servicos: [
      { slug: 'janelas',     titulo: 'Telas Mosquiteiras para Janelas',     descricaoCurta: 'Proteção sob medida para janelas residenciais',        destaque: 'Sob Medida', imagem: '/images/tela_mosquiteira.png', imagens: ['/images/tela_mosquiteira.png', '/images/mosquiteira_janela.png'] },
      { slug: 'portas',      titulo: 'Telas Mosquiteiras para Portas',      descricaoCurta: 'Passagem protegida para portas e acessos',             destaque: 'Sob Medida', imagem: '/images/telas_para_portas.jpeg', imagens: ['/images/telas_para_portas.jpeg', '/images/mosquiteira_para_porta.png'] },
      { slug: 'varandas',    titulo: 'Telas Mosquiteiras para Varandas',    descricaoCurta: 'Aproveite a varanda com proteção contra insetos',       destaque: 'Área externa', imagem: '/images/telas_para_varandas.jpg', imagens: ['/images/telas_para_varandas.jpg', '/images/mosquiteira_area_externa.png'] },
      { slug: 'sacadas',     titulo: 'Telas Mosquiteiras para Sacadas',     descricaoCurta: 'Proteção sob medida contra mosquitos na sacada',       destaque: 'Sob Medida', imagem: '/images/telas_para_sacadas.jpg', imagens: ['/images/telas_para_sacadas.jpg', '/images/telas_para_varandas.jpg'] },
      { slug: 'apartamentos',titulo: 'Telas Mosquiteiras para Apartamentos',descricaoCurta: 'Solução sob medida anti-mosquito para apartamentos',   destaque: 'Sob Medida', imagem: '/images/telas_para_apartamento.jpg', imagens: ['/images/telas_para_apartamento.jpg', '/images/tela_mosquiteira.png'] },
      { slug: 'banheiro',    titulo: 'Telas Mosquiteiras para Banheiro',    descricaoCurta: 'Proteção para janelas de banheiro e ventilação',       destaque: 'Sob Medida', imagem: '/images/telas_para_banheiro.jpg', imagens: ['/images/telas_para_banheiro.jpg', '/images/telas_para_basculante.jpg'] },
    ]
  },
  {
    slug: 'especiais',
    titulo: 'Modelos Especiais',
    emoji: '🔧',
    iconName: 'lucide:wrench',
    descricao: 'Sistemas diferenciados de abertura',
    servicos: [
      { slug: 'correr',    titulo: 'Telas Mosquiteiras de Correr',         descricaoCurta: 'Sistema deslizante prático para janelas',            destaque: 'Deslizante', imagem: '/images/telas_de_correr.jpg', imagens: ['/images/telas_de_correr.jpg', '/images/mosquiteira_porta_de_correr.png'] },
      { slug: 'removivel', titulo: 'Telas Mosquiteiras Removíveis',        descricaoCurta: 'Fácil de remover, instalar e limpar',               destaque: 'Removível', imagem: '/images/mosquiteira_removivel.png', imagens: ['/images/mosquiteira_removivel.png', '/images/tela_mosquiteira.png'] },
      { slug: 'aluminio',  titulo: 'Telas Mosquiteiras com Perfis',        descricaoCurta: 'Estrutura com perfis sob medida',                   destaque: 'Sob Medida', imagem: '/images/telas_com_aluminio.jpg', imagens: ['/images/telas_com_aluminio.jpg', '/images/telas_com_aco_inox.jpg'] },
      { slug: 'basculante',titulo: 'Telas Mosquiteiras para Basculantes',  descricaoCurta: 'Específica para janelas basculantes',               destaque: 'Sob Medida', imagem: '/images/telas_para_basculante.jpg', imagens: ['/images/telas_para_basculante.jpg', '/images/telas_para_banheiro.jpg'] },
      { slug: 'pivotante', titulo: 'Telas Mosquiteiras Pivotantes',        descricaoCurta: 'Abertura giratória funcional',                      destaque: 'Pivotante', imagem: '/images/telas_de_correr.jpg', imagens: ['/images/telas_de_correr.jpg', '/images/mosquiteira_removivel.png'] },
      { slug: 'acoinox',   titulo: 'Telas Mosquiteiras Especiais',       descricaoCurta: 'Opção sob medida para projetos específicos',        destaque: 'Sob Medida', imagem: '/images/telas_com_aco_inox.jpg', imagens: ['/images/telas_com_aco_inox.jpg', '/images/telas_com_aluminio.jpg'] },
    ]
  },
  {
    slug: 'pet',
    titulo: 'Pet Screen',
    emoji: '🐾',
    iconName: 'lucide:paw-print',
    descricao: 'Telas para ambientes com animais',
    servicos: [
      { slug: 'pets',       titulo: 'Telas Mosquiteiras Pet Screen',         descricaoCurta: 'Modelo para casas com cães e gatos',                destaque: 'Pet Screen', imagem: '/images/telas_pet_screen_especificacoes.jpg', imagens: ['/images/telas_pet_screen_especificacoes.jpg', '/images/pets_pro.png'] },
      { slug: 'pernilongos',titulo: 'Telas Mosquiteiras Anti-Pernilongos',   descricaoCurta: 'Malha fina para proteção contra insetos',           destaque: 'Malha Fina', imagem: '/images/telas_anti-pernilongos.jpg', imagens: ['/images/telas_anti-pernilongos.jpg', '/images/tela_mosquiteira.png'] },
    ]
  },
  {
    slug: 'comercial',
    titulo: 'Fachadas e Ambientes Comerciais',
    emoji: '🏢',
    iconName: 'lucide:building-2',
    descricao: 'Soluções para grandes áreas e comércios',
    servicos: [
      { slug: 'fachadas',    titulo: 'Telas Mosquiteiras para Fachadas',    descricaoCurta: 'Proteção para fachadas de edifícios',               destaque: 'Fachadas', imagem: '/images/telas_para_fachadas_especificacoes.png', imagens: ['/images/telas_para_fachadas_especificacoes.png', '/images/telas_para_coberturas.jpg'] },
      { slug: 'coberturas',  titulo: 'Telas Mosquiteiras para Coberturas',  descricaoCurta: 'Proteção em áreas cobertas e vãos',                 destaque: 'Sob Medida', imagem: '/images/telas_para_coberturas.jpg', imagens: ['/images/telas_para_coberturas.jpg', '/images/telas_para_restaurantes.jpg'] },
      { slug: 'restaurantes',titulo: 'Telas Mosquiteiras para Restaurantes',descricaoCurta: 'Ambiente protegido contra insetos para seu negócio',destaque: 'Comercial', imagem: '/images/telas_para_restaurantes.jpg', imagens: ['/images/telas_para_restaurantes.jpg', '/images/telas_para_fachadas_especificacoes.png'] },
      { slug: 'industrias',  titulo: 'Telas Mosquiteiras para Indústrias',  descricaoCurta: 'Proteção para galpões e indústrias',                destaque: 'Industrial', imagem: '/images/telas_para_coberturas.jpg', imagens: ['/images/telas_para_coberturas.jpg', '/images/telas_para_restaurantes.jpg'] },
    ]
  }
]

const getWhatsappUrl = (servicoTitulo) => {
  const msg = `Olá! Gostaria de um orçamento para:\n\nServiço: ${servicoTitulo}\n\nVim pelo site: https://www.adtelasmosquiteiras.com.br/\n\nPode me ajudar?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

const getTelasServiceKey = (slug) => {
  const map = {
    removivel: 'telas_removiveis',
    aluminio: 'telas_perfis',
    basculante: 'telas_basculantes',
    pivotante: 'telas_pivotantes',
    acoinox: 'telas_especiais',
    pets: 'pet_screen',
    pernilongos: 'telas_anti_pernilongos'
  }
  return map[slug] || (slug.startsWith('telas') ? slug : 'telas_' + slug)
}

const getTelasDetailPath = (slug) => {
  const map = {
    janelas: '/servicos/telas/janelas',
    portas: '/servicos/telas/portas',
    varandas: '/servicos/telas/sacadas-e-varandas',
    sacadas: '/servicos/telas/sacadas-e-varandas',
    apartamentos: '/servicos/telas/janelas',
    banheiro: '/servicos/telas/janelas',
    correr: '/servicos/telas/janelas',
    removivel: '/servicos/telas/removivel',
    aluminio: '/servicos/telas/removivel',
    basculante: '/servicos/telas/janelas',
    pivotante: '/servicos/telas/janelas',
    acoinox: '/servicos/telas/removivel',
    pets: '/servicos/telas/pet-screen',
    pernilongos: '/servicos/telas/janelas',
    fachadas: '/servicos/telas/restaurantes',
    coberturas: '/servicos/telas/sacadas-e-varandas',
    restaurantes: '/servicos/telas/restaurantes',
    industrias: '/servicos/telas/restaurantes'
  }
  return map[slug] || null
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
        :loading="i === 0 ? 'eager' : 'lazy'"
        :fetchpriority="i === 0 ? 'high' : 'auto'"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        :class="heroIndex === i ? 'opacity-100' : 'opacity-0'"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#22345F]/90 via-[#22345F]/60 to-[#22345F]/30"></div>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span class="inline-block bg-[#F49A1A] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide">🦟 Telas Sob Medida</span>
        <h1 class="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-3">
          Telas Mosquiteiras em São Paulo
        </h1>
        <p class="text-white/90 text-base md:text-lg max-w-2xl">
          Instalação profissional sob medida para residências e comércios em São Paulo
        </p>
        <div class="flex gap-3 mt-6 flex-wrap justify-center">
          <a
            href="https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Telas+Mosquiteiras.+Vim+pelo+site.&type=phone_number&app_absent=0"
            target="_blank"
            class="flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1fb854] transition-all shadow-lg"
          >
            <Icon name="lucide:message-circle" class="w-5 h-5" />
            Solicitar Orçamento no WhatsApp
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

    <!-- Trust bar (neutral factual) -->
    <div class="bg-[#22345F] py-3">
      <div class="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 text-white text-sm">
        <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" />Instalação sob medida</span>
        <span class="flex items-center gap-1.5"><Icon name="lucide:clock" class="w-4 h-4 text-[#F49A1A]" />Atendimento sob medida</span>
        <span class="flex items-center gap-1.5"><Icon name="lucide:check-circle" class="w-4 h-4 text-[#F49A1A]" />Orçamento sob medida</span>
        <span class="flex items-center gap-1.5"><Icon name="lucide:map-pin" class="w-4 h-4 text-[#F49A1A]" />São Paulo e Região</span>
      </div>
    </div>

    <!-- Navegação Direta para Páginas Específicas de Telas -->
    <section class="py-12 bg-[#F9FAFB] border-b border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="text-center max-w-2xl mx-auto mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">Páginas de Modelos Específicos</h2>
          <p class="text-gray-600 text-sm">Conheça detalhes sobre cada tipo de tela mosquiteira e sua aplicação ideal:</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="modelo in modelosPrincipais"
            :key="modelo.path"
            :to="modelo.path"
            class="group bg-white p-5 rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all hover:shadow-lg flex items-start gap-4"
          >
            <div class="w-12 h-12 rounded-xl bg-[#22345F]/10 flex items-center justify-center shrink-0 group-hover:bg-[#F49A1A]/20 transition-colors">
              <Icon :name="modelo.icon" class="w-6 h-6 text-[#22345F] group-hover:text-[#F49A1A] transition-colors" />
            </div>
            <div>
              <h3 class="font-bold text-[#22345F] text-base group-hover:text-[#F49A1A] transition-colors flex items-center gap-1.5">
                {{ modelo.titulo }}
                <Icon name="lucide:arrow-right" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p class="text-gray-600 text-xs mt-1">{{ modelo.desc }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

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
            <div
              v-for="servico in categoria.servicos"
              :key="servico.slug"
              class="group bg-white rounded-2xl overflow-hidden border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
            >
              <!-- Área clicável do Serviço (Foto + Título + Descrição) -->
              <NuxtLink
                v-if="getTelasDetailPath(servico.slug)"
                :to="getTelasDetailPath(servico.slug)"
                :aria-label="`Ver detalhes sobre ${servico.titulo}`"
                class="flex flex-col flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F49A1A] rounded-t-2xl"
              >
                <!-- Imagem com hover interativo -->
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
                  <!-- Overlay hover "Ver Detalhes" -->
                  <div class="absolute inset-0 bg-[#22345F]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div class="flex items-center gap-2 bg-[#22345F] text-white font-bold px-4 py-2 rounded-xl shadow-lg text-sm">
                      <Icon name="lucide:arrow-right" class="w-4 h-4 text-[#F49A1A]" />
                      Ver Detalhes
                    </div>
                  </div>
                </div>

                <!-- Conteúdo textual -->
                <div class="p-4 flex flex-col flex-1">
                  <h3 class="text-[15px] font-bold text-[#22345F] group-hover:text-[#F49A1A] transition-colors mb-1 leading-snug flex items-center justify-between">
                    <span>{{ servico.titulo }}</span>
                    <Icon name="lucide:chevron-right" class="w-4 h-4 text-[#F49A1A] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </h3>
                  <p class="text-xs text-[#4B5563] mb-3 flex-1">{{ servico.descricaoCurta }}</p>
                  <div class="flex items-center text-[11px] text-[#4B5563] gap-1 mt-auto">
                    <Icon name="lucide:check-circle" class="w-3 h-3 text-[#F49A1A]" /> Sob Medida
                  </div>
                </div>
              </NuxtLink>

              <!-- Fallback quando card não possui detailPath -->
              <div v-else class="flex flex-col flex-1">
                <div class="relative h-44 overflow-hidden bg-[#E5EDF8]">
                  <img
                    :src="servico.imagem"
                    :alt="servico.titulo"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div class="absolute top-3 left-3 bg-[#F49A1A] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                    {{ servico.destaque }}
                  </div>
                </div>
                <div class="p-4 flex flex-col flex-1">
                  <h3 class="text-[15px] font-bold text-[#22345F] mb-1 leading-snug">{{ servico.titulo }}</h3>
                  <p class="text-xs text-[#4B5563] mb-3 flex-1">{{ servico.descricaoCurta }}</p>
                  <div class="flex items-center text-[11px] text-[#4B5563] gap-1 mt-auto">
                    <Icon name="lucide:check-circle" class="w-3 h-3 text-[#F49A1A]" /> Sob Medida
                  </div>
                </div>
              </div>

              <!-- Barra de Ações (WhatsApp CTA Isolado) -->
              <div class="px-4 pb-4 pt-2 border-t border-[#E5EDF8]/60 bg-gray-50/50 mt-auto flex items-center justify-between gap-2">
                <NuxtLink
                  v-if="getTelasDetailPath(servico.slug)"
                  :to="getTelasDetailPath(servico.slug)"
                  class="text-xs font-semibold text-[#22345F] hover:text-[#F49A1A] flex items-center gap-1 transition-colors focus:outline-none focus-visible:underline"
                  :aria-label="`Saiba mais sobre ${servico.titulo}`"
                >
                  Saiba mais &rarr;
                </NuxtLink>
                <span v-else class="text-xs text-gray-500">Instalação SP</span>

                <a
                  :href="getWhatsappUrl(servico.titulo)"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta-location="service_card"
                  :data-service-key="getTelasServiceKey(servico.slug)"
                  :data-service-name="servico.titulo"
                  :aria-label="`Solicitar orçamento de ${servico.titulo} pelo WhatsApp`"
                  class="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1fb854] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
                  @click.stop
                >
                  <Icon name="lucide:message-circle" class="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
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
