<script setup>
import { ref } from 'vue'
import ServicePublicGallery from '~/components/services/ServicePublicGallery.vue'

const showFormModal = ref(false)

useHead({
  title: 'Tela Pet Screen em SP | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Tela Pet Screen para ambientes com animais em São Paulo. Instalação sob medida para portas e janelas. Solicite seu orçamento.'
    },
    { property: 'og:title', content: 'Tela Pet Screen em SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Telas mosquiteiras com malha Pet Screen para residências com cães e gatos.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/telas_pet_screen_especificacoes.jpg' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Serviços', path: '/servicos', current: false },
  { label: 'Telas Mosquiteiras', path: '/servicos/telas', current: false },
  { label: 'Pet Screen', path: '/servicos/telas/pet-screen', current: true }
]

const caracteristicasPetScreen = [
  {
    titulo: 'Modelo para Ambientes com Pets',
    descricao: 'Tela desenvolvida para aplicação em portas e janelas de residências com cães e gatos.'
  },
  {
    titulo: 'Proteção Contra Insetos',
    descricao: 'Trama milimétrica para impedir a entrada de pernilongos e mosquitos com ventilação contínua.'
  },
  {
    titulo: 'Estrutura Sob Medida',
    descricao: 'Perfis ajustados ao vão para manter a tela instalada de forma contínua.'
  }
]

const distincaoTecnica = [
  {
    produto: 'Tela Mosquiteira Pet Screen',
    funcao: 'Tela mosquiteira com malha mais espessa para ambientes com cães e gatos. Não substitui rede de proteção contra quedas em altura.'
  },
  {
    produto: 'Rede de Proteção para Pets',
    funcao: 'Estrutura para retenção mecânica e prevenção de acidentes em janelas e sacadas altas.'
  }
]

const faqs = [
  {
    pergunta: 'O que diferencia a tela Pet Screen da tela mosquiteira convencional?',
    resposta: 'A tela Pet Screen é um modelo voltado para ambientes com animais de estimação, indicada para locais de passagem e circulação de cães e gatos.'
  },
  {
    pergunta: 'A tela Pet Screen substitui a rede de proteção em janelas e sacadas de prédios?',
    resposta: 'Não. A tela Pet Screen tem foco em proteção contra insetos. Para segurança contra quedas em apartamentos e sobrados, a indicação é a Rede de Proteção.'
  },
  {
    pergunta: 'Onde a tela Pet Screen é mais indicada?',
    resposta: 'Em portas de correr, acessos a quintais e janelas baixas onde cães e gatos costumam circular.'
  },
  {
    pergunta: 'Como deve ser feita a higienização da tela Pet Screen?',
    resposta: 'A limpeza pode ser realizada com pano úmido e detergente neutro, removendo pelos e poeira acumulados.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Tela+Pet+Screen.+Vim+pelo+site.&type=phone_number&app_absent=0'
</script>

<template>
  <div class="min-h-screen bg-white">
    <Breadcrumb :items="breadcrumbItems" />

    <section class="relative bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F49A1A]/20 text-[#F49A1A] border border-[#F49A1A]/30 mb-4">
              <Icon name="lucide:paw-print" class="w-4 h-4" />
              Ambientes Residenciais com Animais
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Tela Pet Screen para Ambientes com Animais
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Tela mosquiteira indicada para ambientes com animais de estimação em portas e janelas residenciais. Instalação sob medida em São Paulo e região.
            </p>

            <div class="flex flex-col sm:flex-row gap-3.5">
              <a
                :href="whatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#25D366] hover:bg-[#1fb854] text-white font-bold rounded-xl transition-all shadow-lg text-base"
              >
                <Icon name="lucide:message-circle" class="w-5 h-5" />
                Solicitar Orçamento no WhatsApp
              </a>
              <button
                @click="showFormModal = true"
                class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all text-base"
              >
                <Icon name="lucide:file-text" class="w-5 h-5" />
                Pedir Contato
              </button>
            </div>
          </div>

          <div class="lg:col-span-5">
            <div class="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-white/5">
              <img
                src="/images/telas_pet_screen_especificacoes.jpg"
                alt="Tela Pet Screen em ambiente residencial"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" /> Modelo Pet Screen</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:paw-print" class="w-4 h-4 text-[#F49A1A]" /> Ideal para passagens</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Galeria Pública de Mídias Reais do Serviço -->
    <Suspense>
      <ServicePublicGallery service-key="pet_screen" />
    </Suspense>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="max-w-3xl mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Características da Tela Pet Screen
          </h2>
          <p class="text-gray-600 text-base">
            Conheça os atributos estruturais que diferenciam este modelo para lares com animais.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="item in caracteristicasPetScreen"
            :key="item.titulo"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] hover:border-[#22345F]/30 transition-colors"
          >
            <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
              <Icon name="lucide:paw-print" class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ item.titulo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ item.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-14 bg-[#F9FAFB] border-y border-[#E5EDF8]">
      <div class="max-w-5xl mx-auto px-4 md:px-6">
        <div class="bg-white p-8 rounded-2xl border-2 border-[#22345F]/10 shadow-sm">
          <h2 class="text-xl md:text-2xl font-bold text-[#22345F] mb-6 flex items-center gap-2.5">
            <Icon name="lucide:info" class="w-6 h-6 text-[#F49A1A]" />
            Diferença Entre Tela Pet Screen e Rede de Proteção
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="item in distincaoTecnica" :key="item.produto" class="bg-[#F9FAFB] p-5 rounded-xl border border-[#E5EDF8]">
              <h3 class="font-bold text-[#22345F] text-base mb-2">{{ item.produto }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed">{{ item.funcao }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Perguntas Frequentes sobre Pet Screen
          </h2>
          <p class="text-gray-600 text-sm">Informações sobre o uso e aplicações:</p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(faq, i) in faqs"
            :key="i"
            class="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5EDF8]"
          >
            <h3 class="font-bold text-[#22345F] text-base mb-2 flex items-start gap-2.5">
              <Icon name="lucide:help-circle" class="w-5 h-5 text-[#F49A1A] shrink-0 mt-0.5" />
              <span>{{ faq.pergunta }}</span>
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed pl-7.5">{{ faq.resposta }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 bg-[#F9FAFB] border-t border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Outros Serviços para Ambientes com Animais</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/servicos/redes/gatos-e-pets" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:shield" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Redes para Gatos e Pets</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/portas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:door-open" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas para Portas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/janelas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:layout-grid" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas para Janelas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/removivel" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:move" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas Removíveis</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Tela Pet Screen"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>