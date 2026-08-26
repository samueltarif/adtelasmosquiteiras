<script setup>
import { ref } from 'vue'
import ServicePublicGallery from '~/components/services/ServicePublicGallery.vue'

const showFormModal = ref(false)

useHead({
  title: 'Tela Mosquiteira para Janelas em SP | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Tela mosquiteira para janelas em São Paulo. Instalação sob medida para modelos de correr, basculantes e pivotantes. Solicite seu orçamento.'
    },
    { property: 'og:title', content: 'Tela Mosquiteira para Janelas em SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Instalação de telas mosquiteiras sob medida para todos os tipos de janelas residenciais e comerciais.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/tela_mosquiteira.png' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Serviços', path: '/servicos', current: false },
  { label: 'Telas Mosquiteiras', path: '/servicos/telas', current: false },
  { label: 'Janelas', path: '/servicos/telas/janelas', current: true }
]

const tiposJanelas = [
  {
    titulo: 'Janelas de Correr (Deslizantes)',
    descricao: 'Estrutura sobreposta que acompanha as folhas móveis da janela. Permite abertura e fechamento sem interferir no manuseio da esquadria.',
    indicacao: 'Salas, quartos e cozinhas com esquadrias padrão ou sob medida.'
  },
  {
    titulo: 'Janelas Basculantes e Maxim-ar',
    descricao: 'Painéis adaptados com fecho prático que permitem ventilação constante enquanto mantêm o vão protegido contra insetos.',
    indicacao: 'Banheiros, lavanderias, áreas de serviço e corredores.'
  },
  {
    titulo: 'Janelas Pivotantes e Projetantes',
    descricao: 'Quadros adaptados ao movimento da janela, garantindo abertura e fechamento adequados.',
    indicacao: 'Ambientes residenciais e projetos arquitetônicos.'
  }
]

const etapasInstalacao = [
  {
    passo: '01',
    titulo: 'Levantamento e Medição',
    descricao: 'Avaliação das dimensões exatas do vão e do tipo de esquadria existente no local.'
  },
  {
    passo: '02',
    titulo: 'Confecção da Estrutura',
    descricao: 'Montagem da estrutura sob medida com encaixe preciso para o vão da janela.'
  },
  {
    passo: '03',
    titulo: 'Instalação no Local',
    descricao: 'Fixação da tela na esquadria, conferência do ajuste e teste de abertura.'
  }
]

const faqs = [
  {
    pergunta: 'A tela mosquiteira interfere na circulação de ar ou na claridade?',
    resposta: 'A malha mosquiteira é desenvolvida com trama fina que permite a passagem natural de ar e luminosidade, retendo apenas insetos.'
  },
  {
    pergunta: 'Como é feita a limpeza de telas mosquiteiras em janelas?',
    resposta: 'A higienização pode ser realizada com pano macio umedecido em água e sabão neutro ou aspirador com bocal de cerdas suaves.'
  },
  {
    pergunta: 'É possível instalar tela mosquiteira em janelas de apartamentos?',
    resposta: 'Sim. As telas são instaladas de forma a respeitar as esquadrias e as características do condomínio.'
  },
  {
    pergunta: 'Qual a diferença entre tela de correr e tela fixa para janela?',
    resposta: 'A tela de correr se movimenta para dar acesso ao lado externo, enquanto a tela fixa permanece montada no vão.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Tela+Mosquiteira+de+Janelas.+Vim+pelo+site.&type=phone_number&app_absent=0'
</script>

<template>
  <div class="min-h-screen bg-white">
    <Breadcrumb :items="breadcrumbItems" />

    <section class="relative bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F49A1A]/20 text-[#F49A1A] border border-[#F49A1A]/30 mb-4">
              <Icon name="lucide:layout-grid" class="w-4 h-4" />
              Esquadrias Residenciais e Comerciais
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Tela Mosquiteira para Janelas Sob Medida
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Proteção contra pernilongos, mosquitos e insetos para janelas de quartos, salas, banheiros e cozinhas. Fabricação sob medida para qualquer tipo de abertura em São Paulo e região.
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
                src="/images/tela_mosquiteira.png"
                alt="Tela mosquiteira em janela"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" /> Estrutura sob medida</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:wind" class="w-4 h-4 text-[#F49A1A]" /> Ventilação preservada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Galeria Pública de Mídias Reais do Serviço -->
    <Suspense>
      <ServicePublicGallery service-key="telas_janelas" />
    </Suspense>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="max-w-3xl mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Compatibilidade com Diferentes Modelos de Janela
          </h2>
          <p class="text-gray-600 text-base">
            Cada esquadria possui particularidades de abertura. Nossas telas mosquiteiras são adaptadas à estrutura existente sem comprometer o fechamento original.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="tipo in tiposJanelas"
            :key="tipo.titulo"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] flex flex-col justify-between hover:border-[#22345F]/30 transition-colors"
          >
            <div>
              <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
                <Icon name="lucide:check" class="w-5 h-5" />
              </div>
              <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ tipo.titulo }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed mb-4">{{ tipo.descricao }}</p>
            </div>
            <div class="pt-4 border-t border-gray-200/80 text-xs text-gray-500">
              <strong class="text-[#22345F]">Indicado para:</strong> {{ tipo.indicacao }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-[#F9FAFB] border-y border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Processo de Medição e Instalação
          </h2>
          <p class="text-gray-600 text-sm md:text-base">
            Atendimento estruturado para garantir encaixe no vão e acabamento adequado.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="etapa in etapasInstalacao"
            :key="etapa.passo"
            class="bg-white rounded-2xl p-6 border border-[#E5EDF8] shadow-sm relative"
          >
            <span class="text-3xl font-extrabold text-[#F49A1A]/30 mb-2 block font-mono">{{ etapa.passo }}</span>
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ etapa.titulo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ etapa.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Perguntas Frequentes sobre Telas para Janelas
          </h2>
          <p class="text-gray-600 text-sm">Tire suas dúvidas antes de solicitar a instalação:</p>
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
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Outras Aplicações de Telas Mosquiteiras</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/servicos/telas/portas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:door-open" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas para Portas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/sacadas-e-varandas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:sun" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Sacadas e Varandas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/removivel" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:move" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas Removíveis</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/pet-screen" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:paw-print" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Tela Pet Screen</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Telas para Janelas"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>