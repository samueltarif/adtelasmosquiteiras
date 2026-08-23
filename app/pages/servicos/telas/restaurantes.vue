<script setup>
import { ref } from 'vue'

const showFormModal = ref(false)

useHead({
  title: 'Tela Mosquiteira para Restaurantes e Cozinhas em SP | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Telas mosquiteiras sob medida para cozinhas, bares e restaurantes em São Paulo. Proteção contra insetos para seu estabelecimento. Solicite um orçamento.'
    },
    { property: 'og:title', content: 'Tela Mosquiteira para Restaurantes e Cozinhas em SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Telas mosquiteiras comerciais para cozinhas profissionais, lanchonetes e áreas de manipulação de alimentos.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/telas_para_restaurantes.jpg' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Serviços', path: '/servicos', current: false },
  { label: 'Telas Mosquiteiras', path: '/servicos/telas', current: false },
  { label: 'Restaurantes', path: '/servicos/telas/restaurantes', current: true }
]

const aplicacoesComerciais = [
  {
    ambiente: 'Cozinhas e Áreas de Preparo',
    descricao: 'Telas sob medida em janelas e aberturas para manter o ambiente arejado e protegido contra insetos voadores.'
  },
  {
    ambiente: 'Despensas e Armazenamento',
    descricao: 'Fechamento de vãos de ventilação para conservar alimentos com circulação de ar.'
  },
  {
    ambiente: 'Portas de Acesso e Passagens',
    descricao: 'Portas mosquiteiras sob medida para áreas com circulação operacional.'
  }
]

const beneficiosComerciais = [
  {
    titulo: 'Estrutura Sob Medida para Estabelecimentos',
    descricao: 'Perfis e telas dimensionados para a rotina de cozinhas profissionais.'
  },
  {
    titulo: 'Instalação Sob Medida',
    descricao: 'Adaptação técnica a diferentes dimensões de esquadrias comerciais.'
  },
  {
    titulo: 'Atendimento para Empresas',
    descricao: 'Planejamento de atendimento conforme a necessidade do comércio ou estabelecimento.'
  }
]

const faqs = [
  {
    pergunta: 'Quais áreas de um restaurante necessitam de telas mosquiteiras?',
    resposta: 'Geralmente as aberturas em áreas de manipulação de alimentos, cozinhas, despensas e acessos operacionais.'
  },
  {
    pergunta: 'Como realizar a limpeza de telas em ambientes comerciais?',
    resposta: 'Recomenda-se a limpeza periódica com água e detergente neutro, com auxílio de pano macio ou esponja suave.'
  },
  {
    pergunta: 'Vocês atendem em horários combinados com o estabelecimento?',
    resposta: 'O cronograma de instalação é combinado previamente para melhor conveniência do cliente.'
  },
  {
    pergunta: 'Como solicitar orçamento para estabelecimentos comerciais?',
    resposta: 'Basta entrar em contato pelo WhatsApp ou formulário informando a quantidade aproximada de vãos para agendarmos a avaliação técnica.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Telas+Mosquiteiras+de+Restaurantes.+Vim+pelo+site.&type=phone_number&app_absent=0'
</script>

<template>
  <div class="min-h-screen bg-white">
    <Breadcrumb :items="breadcrumbItems" />

    <section class="relative bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F49A1A]/20 text-[#F49A1A] border border-[#F49A1A]/30 mb-4">
              <Icon name="lucide:utensils" class="w-4 h-4" />
              Comércio e Setor Alimentício
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Tela Mosquiteira para Restaurantes e Cozinhas
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Proteção essencial contra moscas e insetos para cozinhas profissionais, bares, restaurantes, lanchonetes e padarias em São Paulo e região. Instalação sob medida.
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
                src="/images/telas_para_restaurantes.jpg"
                alt="Tela mosquiteira em ambiente comercial"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" /> Estrutura sob medida</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:utensils" class="w-4 h-4 text-[#F49A1A]" /> Ambientes comerciais</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="max-w-3xl mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Locais de Aplicação em Cozinhas Comerciais
          </h2>
          <p class="text-gray-600 text-base">
            Soluções dimensionadas para os pontos críticos de ventilação e circulação do seu negócio.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="item in aplicacoesComerciais"
            :key="item.ambiente"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] hover:border-[#22345F]/30 transition-colors"
          >
            <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
              <Icon name="lucide:building-2" class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ item.ambiente }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ item.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-[#F9FAFB] border-y border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Diferenciais para Empresas e Estabelecimentos
          </h2>
          <p class="text-gray-600 text-sm md:text-base">
            Estrutura técnica e atendimento voltado a negócios do ramo gastronômico.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="beneficio in beneficiosComerciais"
            :key="beneficio.titulo"
            class="bg-white rounded-2xl p-6 border border-[#E5EDF8] shadow-sm"
          >
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ beneficio.titulo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ beneficio.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Perguntas Frequentes sobre Telas para Restaurantes
          </h2>
          <p class="text-gray-600 text-sm">Informações sobre atendimento a empresas e manutenções:</p>
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
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Outros Serviços de Telas Mosquiteiras</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <NuxtLink to="/servicos/telas/sacadas-e-varandas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:sun" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Sacadas e Varandas</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Telas para Restaurantes"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>