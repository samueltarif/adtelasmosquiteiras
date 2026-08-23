<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useServicos } from '~/composables/useServicos'

const { WHATSAPP_NUMBER } = useServicos()
const route = useRoute()
const showFormModal = ref(false)

useHead({
  title: 'Redes de Proteção em São Paulo | Modelos Sob Medida | AD Telas',
  meta: [
    { name: 'description', content: 'Redes de proteção sob medida para janelas, sacadas, pets e mezaninos em São Paulo. Instalação profissional. Solicite seu orçamento.' },
    { property: 'og:title', content: 'Redes de Proteção SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Serviços de redes de proteção sob medida para sua residência ou apartamento. Solicite um orçamento.' },
  ]
})

// Principais modelos com landing pages dedicadas
const modelosPrincipais = [
  { path: '/servicos/redes/janelas', titulo: 'Redes para Janelas', desc: 'Proteção para janelas de apartamentos e casas com instalação sob medida', icon: 'lucide:layout-grid', img: '/images/redes_para_janelas.png' },
  { path: '/servicos/redes/sacadas-e-varandas', titulo: 'Sacadas e Varandas', desc: 'Fechamento de vãos externos com fixação segura e acabamento discreto', icon: 'lucide:sun', img: '/images/redes_para_sacadas.jpg' },
  { path: '/servicos/redes/gatos-e-pets', titulo: 'Gatos e Pets', desc: 'Redes para prevenir fugas e quedas de animais em janelas e sacadas', icon: 'lucide:paw-print', img: '/images/gato.png' },
  { path: '/servicos/redes/criancas', titulo: 'Ambientes com Crianças', desc: 'Proteção sob medida para áreas com circulação infantil', icon: 'lucide:shield', img: '/images/redes_para_criancas.png' },
  { path: '/servicos/redes/escadas-e-mezaninos', titulo: 'Escadas e Mezaninos', desc: 'Segurança para vãos internos, corrimãos e desníveis residenciais', icon: 'lucide:git-commit', img: '/images/redes_para_escadas.jpg' },
]

// Ordenados pelos mais buscados no Google (volume de busca)
const categorias = [
  {
    slug: 'residencial',
    titulo: 'Residencial',
    emoji: '🏠',
    iconName: 'lucide:home',
    descricao: 'Para janelas, sacadas, varandas e mais',
    servicos: [
      { slug: 'janelas',     titulo: 'Redes de Proteção para Janelas',     descricaoCurta: 'Proteção sob medida para todas as janelas',     destaque: 'Sob Medida', imagem: '/images/redes_para_janelas.png', imagens: ['/images/redes_para_janelas.png', '/images/redes_para_apartamentos.png'] },
      { slug: 'sacadas',     titulo: 'Redes de Proteção para Sacadas',     descricaoCurta: 'Fechamento de vãos para sacadas residenciais', destaque: 'Sob Medida', imagem: '/images/redes_para_sacadas.jpg', imagens: ['/images/redes_para_sacadas.jpg', '/images/bebe.png'] },
      { slug: 'varandas',    titulo: 'Redes de Proteção para Varandas',    descricaoCurta: 'Proteção sob medida para varandas e terraços',  destaque: 'Área externa', imagem: '/images/bebe.png', imagens: ['/images/bebe.png', '/images/redes_para_sacadas.jpg'] },
      { slug: 'apartamentos',titulo: 'Redes de Proteção para Apartamentos',descricaoCurta: 'Solução completa para apartamentos e prédios', destaque: 'Sob Medida', imagem: '/images/redes_para_apartamentos.png', imagens: ['/images/redes_para_apartamentos.png', '/images/redes_para_janelas.png'] },
      { slug: 'portas',      titulo: 'Redes de Proteção para Portas',      descricaoCurta: 'Proteção para portas e vãos de passagem',       destaque: 'Sob Medida', imagem: '/images/redes_para_portas.png', imagens: ['/images/redes_para_portas.png', '/images/redes_para_basculantes.png'] },
      { slug: 'escadas',     titulo: 'Redes de Proteção para Escadas',     descricaoCurta: 'Segurança em escadas e mezaninos',             destaque: 'Sob Medida', imagem: '/images/redes_para_escadas.jpg', imagens: ['/images/redes_para_escadas.jpg', '/images/redes_para_janelas.png'] },
      { slug: 'basculantes', titulo: 'Redes de Proteção para Basculantes', descricaoCurta: 'Proteção sob medida para janelas basculantes', destaque: 'Sob Medida', imagem: '/images/redes_para_basculantes.png', imagens: ['/images/redes_para_basculantes.png', '/images/redes_para_portas.png'] },
    ]
  },
  {
    slug: 'pets',
    titulo: 'Pets & Crianças',
    emoji: '🐶',
    iconName: 'lucide:dog',
    descricao: 'Segurança para quem você mais ama',
    servicos: [
      { slug: 'gatos',     titulo: 'Redes de Proteção para Gatos',     descricaoCurta: 'Proteção contra quedas e fugas de gatos',       destaque: 'Pets', imagem: '/images/gato.png', imagens: ['/images/gato.png', '/images/redes_para_animais.png'] },
      { slug: 'criancas',  titulo: 'Redes de Proteção para Crianças',  descricaoCurta: 'Proteção sob medida para ambientes infantis',    destaque: 'Instalação Profissional', imagem: '/images/redes_para_criancas.png', imagens: ['/images/redes_para_criancas.png', '/images/protecaoinfantil.jpeg'] },
      { slug: 'cachorros', titulo: 'Redes de Proteção para Cachorros', descricaoCurta: 'Proteção para cães em sacadas e janelas',       destaque: 'Sob Medida', imagem: '/images/redes_para_cachorros.png', imagens: ['/images/redes_para_cachorros.png', '/images/pets_pro.png'] },
      { slug: 'animais',   titulo: 'Redes de Proteção para Animais',   descricaoCurta: 'Proteção sob medida para animais de estimação', destaque: 'Versátil', imagem: '/images/redes_para_animais.png', imagens: ['/images/redes_para_animais.png', '/images/gato.png'] },
      { slug: 'idosos',    titulo: 'Redes de Proteção para Idosos',    descricaoCurta: 'Segurança adicional para ambientes residenciais',destaque: 'Sob Medida', imagem: '/images/redes_para_idosos.png', imagens: ['/images/redes_para_idosos.png', '/images/bebe.png'] },
    ]
  },
  {
    slug: 'comercial',
    titulo: 'Comercial & Áreas Externas',
    emoji: '🏢',
    iconName: 'lucide:building-2',
    descricao: 'Para piscinas, telhados, portões e mais',
    servicos: [
      { slug: 'piscinas',   titulo: 'Redes de Proteção para Piscinas',   descricaoCurta: 'Proteção para áreas de piscina',               destaque: 'Piscinas', imagem: '/images/redes_para_piscinas.jpg', imagens: ['/images/redes_para_piscinas.jpg', '/images/redes_para_coberturas.jpg'] },
      { slug: 'telhados',   titulo: 'Redes de Proteção para Telhados',   descricaoCurta: 'Fechamento de vãos e proteção contra pássaros',    destaque: 'Sob Medida', imagem: '/images/redes_para_telhados.jpg', imagens: ['/images/redes_para_telhados.jpg', '/images/redes_para_muros.jpg'] },
      { slug: 'portoes',    titulo: 'Redes de Proteção para Portões',    descricaoCurta: 'Proteção para vãos de portões e garagens',     destaque: 'Portões', imagem: '/images/redes_para_portoes.jpg', imagens: ['/images/redes_para_portoes.jpg', '/images/redes_para_muros.jpg'] },
      { slug: 'muros',      titulo: 'Redes de Proteção para Muros',      descricaoCurta: 'Complemento de altura e segurança em muros',    destaque: 'Muros', imagem: '/images/redes_para_muros.jpg', imagens: ['/images/redes_para_muros.jpg', '/images/redes_para_portoes.jpg'] },
      { slug: 'coberturas', titulo: 'Redes de Proteção para Coberturas', descricaoCurta: 'Proteção sob medida para áreas cobertas',      destaque: 'Sob Medida', imagem: '/images/redes_para_coberturas.jpg', imagens: ['/images/redes_para_coberturas.jpg', '/images/redes_para_telhados.jpg'] },
    ]
  }
]

const getWhatsappUrl = (servicoTitulo) => {
  const msg = `Olá! Gostaria de um orçamento para:\n\nServiço: ${servicoTitulo}\n\nVim pelo site: https://www.adtelasmosquiteiras.com.br/\n\nPode me ajudar?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

// Hero carousel & Card image indices
const heroImages = [
  { src: '/images/redes_para_janelas.png',     alt: 'Redes para janelas' },
  { src: '/images/redes_para_sacadas.jpg',     alt: 'Redes para sacadas' },
  { src: '/images/gato.png',                   alt: 'Redes para gatos' },
  { src: '/images/redes_para_criancas.png',    alt: 'Redes para crianças' },
  { src: '/images/redes_para_apartamentos.png',alt: 'Redes para apartamentos' },
  { src: '/images/redes_para_piscinas.jpg',    alt: 'Redes para piscinas' },
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
        <span class="inline-block bg-[#F49A1A] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide">🛡️ Redes Sob Medida</span>
        <h1 class="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-3">
          Redes de Proteção em São Paulo
        </h1>
        <p class="text-white/90 text-base md:text-lg max-w-2xl">
          Instalação profissional sob medida em São Paulo • Atendimento para residências e apartamentos
        </p>
        <div class="flex gap-3 mt-6 flex-wrap justify-center">
          <a
            href="https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Redes+de+Prote%C3%A7%C3%A3o.+Vim+pelo+site.&type=phone_number&app_absent=0"
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

    <!-- Navegação Direta para Páginas Específicas de Redes -->
    <section class="py-12 bg-[#F9FAFB] border-b border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="text-center max-w-2xl mx-auto mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">Páginas de Aplicações Específicas</h2>
          <p class="text-gray-600 text-sm">Conheça detalhes sobre cada aplicação de rede de proteção:</p>
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
                    <Icon name="lucide:check-circle" class="w-3 h-3 text-[#F49A1A]" /> Sob Medida
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
            href="https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Preciso+de+ajuda+com+Redes+de+Prote%C3%A7%C3%A3o.+Vim+pelo+site.&type=phone_number&app_absent=0"
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
      servico-atual="Redes de Proteção"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />

  </div>
</template>
