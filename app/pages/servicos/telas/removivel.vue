<script setup>
import { ref } from 'vue'
import ServicePublicGallery from '~/components/services/ServicePublicGallery.vue'

const showFormModal = ref(false)

useHead({
  title: 'Tela Mosquiteira Removível em SP | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Tela mosquiteira removível sob medida em São Paulo. Prática de retirar e higienizar quando necessário. Solicite seu orçamento.'
    },
    { property: 'og:title', content: 'Tela Mosquiteira Removível em SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Telas mosquiteiras de encaixe e remoção prática para limpeza em janelas residenciais.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/mosquiteira_removivel.png' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Serviços', path: '/servicos', current: false },
  { label: 'Telas Mosquiteiras', path: '/servicos/telas', current: false },
  { label: 'Removível', path: '/servicos/telas/removivel', current: true }
]

const vantagensRemovivel = [
  {
    titulo: 'Higienização Prática',
    descricao: 'Como o quadro pode ser desencaixado, a limpeza pode ser realizada com água e sabão neutro fora do vão.'
  },
  {
    titulo: 'Preservação da Estrutura',
    descricao: 'Sistemas de fixação com mínimo impacto na esquadria existente.'
  },
  {
    titulo: 'Praticidade para Imóveis Residenciais',
    descricao: 'Solução sob medida de fácil retirada quando necessário.'
  }
]

const tiposFixacao = [
  {
    tipo: 'Sistema de Fácil Encaixe',
    detalhes: 'O modelo removível permite retirada quando necessário para limpeza ou acesso ao vão.'
  },
  {
    tipo: 'Instalação Perimetral',
    detalhes: 'Estrutura ajustada ao requadro da janela para utilização prática no dia a dia.'
  },
  {
    tipo: 'Encaixe no Vão',
    detalhes: 'Quadro dimensionado conforme o modelo da esquadria existente.'
  }
]

const faqs = [
  {
    pergunta: 'Como é feito o processo de retirada da tela para higienização?',
    resposta: 'O quadro é desencaixado de forma simples através dos pontos de encaixe, permitindo a retirada sem necessidade de ferramentas.'
  },
  {
    pergunta: 'A tela removível permanece firme no vão?',
    resposta: 'A tela é dimensionada para permanecer acomodada no vão durante o uso diário no ambiente residencial.'
  },
  {
    pergunta: 'Posso usar tela removível em janelas basculantes?',
    resposta: 'Sim. É uma aplicação frequente para basculantes, pois facilita o manuseio da alavanca da janela quando necessário.'
  },
  {
    pergunta: 'Como realizar a higienização da tela removível?',
    resposta: 'A limpeza pode ser feita com água corrente e sabão neutro fora do vão, facilitando a secagem antes do reenquadramento.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Tela+Mosquiteira+Remov%C3%ADvel.+Vim+pelo+site.&type=phone_number&app_absent=0'
</script>

<template>
  <div class="min-h-screen bg-white">
    <Breadcrumb :items="breadcrumbItems" />

    <section class="relative bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F49A1A]/20 text-[#F49A1A] border border-[#F49A1A]/30 mb-4">
              <Icon name="lucide:move" class="w-4 h-4" />
              Praticidade e Higienização Fácil
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Tela Mosquiteira Removível
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Sistema prático que permite retirar o quadro a qualquer momento para limpeza ou para acessar o lado externo da janela. Fabricação sob medida em São Paulo.
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
                src="/images/mosquiteira_removivel.png"
                alt="Tela mosquiteira removível em janela"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" /> Desencaixe prático</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:sparkles" class="w-4 h-4 text-[#F49A1A]" /> Limpeza facilitada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Galeria Pública de Mídias Reais do Serviço -->
    <Suspense>
      <ServicePublicGallery service-key="telas_removiveis" />
    </Suspense>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="max-w-3xl mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Por Que Escolher o Modelo Removível?
          </h2>
          <p class="text-gray-600 text-base">
            Diferenciais de um sistema pensado para quem valoriza praticidade na manutenção da casa.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="vantagem in vantagensRemovivel"
            :key="vantagem.titulo"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] hover:border-[#22345F]/30 transition-colors"
          >
            <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
              <Icon name="lucide:check" class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ vantagem.titulo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ vantagem.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-[#F9FAFB] border-y border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Sistemas de Fixação Utilizados
          </h2>
          <p class="text-gray-600 text-sm md:text-base">
            Opções que se adaptam à esquadria sem danificar a janela.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="item in tiposFixacao"
            :key="item.tipo"
            class="bg-white rounded-2xl p-6 border border-[#E5EDF8] shadow-sm"
          >
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ item.tipo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ item.detalhes }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Perguntas Frequentes sobre Telas Removíveis
          </h2>
          <p class="text-gray-600 text-sm">Informações sobre o funcionamento e manutenção:</p>
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
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Outros Modelos de Telas Mosquiteiras</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/servicos/telas/janelas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:layout-grid" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas para Janelas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/portas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:door-open" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas para Portas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/sacadas-e-varandas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:sun" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Sacadas e Varandas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/pet-screen" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:paw-print" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Tela Pet Screen</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Telas Removíveis"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>