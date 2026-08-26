<script setup>
import { ref } from 'vue'
import ServicePublicGallery from '~/components/services/ServicePublicGallery.vue'

const showFormModal = ref(false)

useHead({
  title: 'Tela Mosquiteira para Sacada e Varanda em SP | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Tela mosquiteira sob medida para sacadas e varandas em São Paulo. Proteção contra insetos para sua área externa. Solicite um orçamento.'
    },
    { property: 'og:title', content: 'Tela Mosquiteira para Sacada e Varanda em SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Fechamento com tela mosquiteira sob medida para sacadas, terraços e varandas gourmet.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/telas_para_varandas.jpg' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Serviços', path: '/servicos', current: false },
  { label: 'Telas Mosquiteiras', path: '/servicos/telas', current: false },
  { label: 'Sacadas e Varandas', path: '/servicos/telas/sacadas-e-varandas', current: true }
]

const solucoesSacada = [
  {
    titulo: 'Integração com Envidraçamento',
    descricao: 'Telas deslizantes ou fixas projetadas para operar em conjunto com o fechamento de vidro existente.',
    indicacao: 'Varandas gourmet e sacadas com fechamento de vidro'
  },
  {
    titulo: 'Fechamento de Grandes Vãos',
    descricao: 'Módulos sob medida que cobrem extensões de varanda garantindo ventilação com proteção contra insetos.',
    indicacao: 'Apartamentos e casas com áreas externas'
  },
  {
    titulo: 'Painéis de Fácil Manuseio',
    descricao: 'Telas com encaixe prático para áreas onde é necessária a retirada periódica para limpeza dos vidros.',
    indicacao: 'Sacadas com acesso restrito'
  }
]

const distincaoSeguranca = [
  {
    titulo: 'Finalidade da Tela Mosquiteira',
    descricao: 'Desenvolvida especificamente para proteção contra insetos voadores, preservando a circulação de ar.'
  },
  {
    titulo: 'Diferença para Rede de Proteção',
    descricao: 'A tela mosquiteira não possui função de retenção de peso. Para segurança contra quedas em locais altos, deve-se utilizar a rede de proteção.'
  }
]

const faqs = [
  {
    pergunta: 'É possível instalar tela mosquiteira em sacada que já possui fechamento de vidro?',
    resposta: 'Sim. A tela mosquiteira é dimensionada para operar no espaço disponível no vão da varanda em harmonia com os vidros.'
  },
  {
    pergunta: 'A tela mosquiteira na sacada substitui a rede de proteção?',
    resposta: 'Não. A tela mosquiteira tem a função de proteção contra insetos. Para retenção física e segurança contra quedas em altura, deve ser utilizada a rede de proteção.'
  },
  {
    pergunta: 'Como fica a visibilidade da paisagem com a tela na varanda?',
    resposta: 'A malha fina é desenvolvida para manter boa transparência visual, preservando a visão externa.'
  },
  {
    pergunta: 'Posso combinar tela mosquiteira e rede de proteção na mesma sacada?',
    resposta: 'Sim. É comum a instalação combinada: a rede de proteção atua na segurança e a tela mosquiteira no bloqueio de insetos.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Tela+Mosquiteira+de+Sacadas+e+Varandas.+Vim+pelo+site.&type=phone_number&app_absent=0'
</script>

<template>
  <div class="min-h-screen bg-white">
    <Breadcrumb :items="breadcrumbItems" />

    <section class="relative bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F49A1A]/20 text-[#F49A1A] border border-[#F49A1A]/30 mb-4">
              <Icon name="lucide:sun" class="w-4 h-4" />
              Áreas Externas e Varandas Gourmet
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Tela Mosquiteira para Sacadas e Varandas
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Aproveite sua varanda gourmet e sacada com ar fresco e proteção contra pernilongos e mosquitos. Projetos sob medida adaptados a esquadrias e fechamentos em São Paulo e região.
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
                src="/images/telas_para_varandas.jpg"
                alt="Tela mosquiteira em varanda"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" /> Estrutura sob medida</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:wind" class="w-4 h-4 text-[#F49A1A]" /> Ventilação em área gourmet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Galeria Pública de Mídias Reais do Serviço -->
    <Suspense>
      <ServicePublicGallery service-key="telas_sacadas" />
    </Suspense>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="max-w-3xl mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Opções para Sacadas e Terraços
          </h2>
          <p class="text-gray-600 text-base">
            Configurações sob medida para harmonizar com o layout da sua área externa.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="solucao in solucoesSacada"
            :key="solucao.titulo"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] flex flex-col justify-between hover:border-[#22345F]/30 transition-colors"
          >
            <div>
              <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
                <Icon name="lucide:sun" class="w-5 h-5" />
              </div>
              <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ solucao.titulo }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed mb-4">{{ solucao.descricao }}</p>
            </div>
            <div class="pt-4 border-t border-gray-200/80 text-xs text-gray-500">
              <strong class="text-[#22345F]">Aplicação:</strong> {{ solucao.indicacao }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-14 bg-[#F9FAFB] border-y border-[#E5EDF8]">
      <div class="max-w-5xl mx-auto px-4 md:px-6">
        <div class="bg-white p-8 rounded-2xl border-2 border-[#22345F]/10 shadow-sm">
          <h2 class="text-xl md:text-2xl font-bold text-[#22345F] mb-6 flex items-center gap-2.5">
            <Icon name="lucide:info" class="w-6 h-6 text-[#F49A1A]" />
            Entendendo a Função Técnica do Produto
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="item in distincaoSeguranca" :key="item.titulo" class="bg-[#F9FAFB] p-5 rounded-xl border border-[#E5EDF8]">
              <h3 class="font-bold text-[#22345F] text-base mb-2">{{ item.titulo }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed">{{ item.descricao }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Perguntas Frequentes sobre Telas para Sacadas
          </h2>
          <p class="text-gray-600 text-sm">Respostas para as dúvidas comuns sobre varandas e terraços:</p>
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
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Outros Serviços Relacionados</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/servicos/telas/janelas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:layout-grid" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas para Janelas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/portas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:door-open" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas para Portas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/redes/sacadas-e-varandas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:shield" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Redes para Sacadas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/pet-screen" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:paw-print" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Tela Pet Screen</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Telas para Sacadas"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>