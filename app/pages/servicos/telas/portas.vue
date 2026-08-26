<script setup>
import { ref } from 'vue'
import ServicePublicGallery from '~/components/services/ServicePublicGallery.vue'

const showFormModal = ref(false)

useHead({
  title: 'Tela Mosquiteira para Portas em SP | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Tela mosquiteira para portas e passagens em São Paulo. Modelos sob medida para residências e apartamentos. Solicite seu orçamento.'
    },
    { property: 'og:title', content: 'Tela Mosquiteira para Portas em SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Instalação sob medida de telas mosquiteiras para portas de giro e portas balcão de correr.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/telas_para_portas.jpeg' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Serviços', path: '/servicos', current: false },
  { label: 'Telas Mosquiteiras', path: '/servicos/telas', current: false },
  { label: 'Portas', path: '/servicos/telas/portas', current: true }
]

const tiposPortas = [
  {
    titulo: 'Porta de Giro com Fecho Prático',
    descricao: 'Estrutura articulada com dobradiças e fecho funcional. Indicada para acessos frequentes a quintais, varandas e áreas de serviço.',
    destaque: 'Passagem prática no dia a dia'
  },
  {
    titulo: 'Porta Balcão de Correr',
    descricao: 'Painel deslizante montado paralelamente às folhas existentes, acompanhando o vão sem ocupar espaço útil do ambiente.',
    destaque: 'Acompanha o vão da porta balcão'
  },
  {
    titulo: 'Porta Dupla',
    descricao: 'Configuração sob medida para vãos amplos com duas folhas centrais e fechamento centralizado.',
    destaque: 'Ideal para passagens amplas'
  }
]

const diferenciaisPortas = [
  {
    titulo: 'Ajuste à Altura da Porta',
    descricao: 'A solução é dimensionada conforme as características da porta e do piso no local.'
  },
  {
    titulo: 'Estrutura para Passagens',
    descricao: 'Estrutura projetada para a rotina de abertura e fechamento de acessos residenciais.'
  },
  {
    titulo: 'Puxadores Integrados',
    descricao: 'Acessórios para manuseio confortável por dentro e por fora do ambiente.'
  }
]

const faqs = [
  {
    pergunta: 'A tela para porta impede a entrada de animais de estimação?',
    resposta: 'A tela convencional tem como finalidade principal o bloqueio de insetos voadores. Para lares com animais de estimação, o modelo Pet Screen é a opção com malha mais espessa.'
  },
  {
    pergunta: 'Como é feito o fechamento na base da porta?',
    resposta: 'A solução é dimensionada conforme as características da porta e as condições do vão.'
  },
  {
    pergunta: 'A porta de correr precisa de guia de apoio?',
    resposta: 'É instalada uma guia de apoio superior e inferior para orientar o deslocamento alinhado do painel.'
  },
  {
    pergunta: 'Qual o procedimento para solicitar uma tela de porta?',
    resposta: 'Basta entrar em contato para combinarmos a medição das dimensões da sua porta e elaboração da proposta sob medida.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Tela+Mosquiteira+de+Portas.+Vim+pelo+site.&type=phone_number&app_absent=0'
</script>

<template>
  <div class="min-h-screen bg-white">
    <Breadcrumb :items="breadcrumbItems" />

    <section class="relative bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F49A1A]/20 text-[#F49A1A] border border-[#F49A1A]/30 mb-4">
              <Icon name="lucide:door-open" class="w-4 h-4" />
              Passagens e Acessos Externos
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Tela Mosquiteira para Portas
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Mantenha portas abertas para ventilação contínua com proteção contra mosquitos e pernilongos. Modelos sob medida para portas de giro e portas balcão em São Paulo e região.
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
                src="/images/telas_para_portas.jpeg"
                alt="Tela mosquiteira em porta"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" /> Ajuste sob medida</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:door-open" class="w-4 h-4 text-[#F49A1A]" /> Passagem facilitada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Galeria Pública de Mídias Reais do Serviço -->
    <Suspense>
      <ServicePublicGallery service-key="telas_portas" />
    </Suspense>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="max-w-3xl mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Modelos de Portas Mosquiteiras
          </h2>
          <p class="text-gray-600 text-base">
            Opções projetadas de acordo com a abertura da porta e a rotina do imóvel.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="tipo in tiposPortas"
            :key="tipo.titulo"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] flex flex-col justify-between hover:border-[#22345F]/30 transition-colors"
          >
            <div>
              <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
                <Icon name="lucide:door-open" class="w-5 h-5" />
              </div>
              <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ tipo.titulo }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed mb-4">{{ tipo.descricao }}</p>
            </div>
            <div class="pt-4 border-t border-gray-200/80 text-xs text-gray-500">
              <strong class="text-[#22345F]">Destaque:</strong> {{ tipo.destaque }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-[#F9FAFB] border-y border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Detalhes de Acabamento
          </h2>
          <p class="text-gray-600 text-sm md:text-base">
            Elementos desenvolvidos para manuseio prático e ajuste no vão.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="item in diferenciaisPortas"
            :key="item.titulo"
            class="bg-white rounded-2xl p-6 border border-[#E5EDF8] shadow-sm"
          >
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ item.titulo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ item.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Perguntas Frequentes sobre Telas para Portas
          </h2>
          <p class="text-gray-600 text-sm">Informações práticas sobre fabricação e uso:</p>
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
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Outras Opções de Telas Mosquiteiras</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/servicos/telas/janelas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:layout-grid" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas para Janelas</span>
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
      servico-atual="Telas para Portas"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>