<script setup>
import { ref } from 'vue'

const showFormModal = ref(false)

useHead({
  title: 'Áreas Atendidas em São Paulo e Região | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Consulte as regiões e cidades atendidas pela AD Telas e Redes em São Paulo e Grande SP. Utilize nosso verificador de CEP para consultar disponibilidade.'
    },
    { property: 'og:title', content: 'Áreas Atendidas | AD Telas e Redes' },
    { property: 'og:description', content: 'Consulte a cobertura de atendimento para instalação de telas mosquiteiras e redes de proteção em São Paulo.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/familia.png' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Áreas Atendidas', path: '/areas-atendidas', current: true }
]

const regioesPrincipais = [
  {
    regiao: 'São Paulo (Capital)',
    descricao: 'Atendimento na capital paulista com agendamento de visita técnica sob medida.',
    icon: 'lucide:map-pin'
  },
  {
    regiao: 'Região Metropolitana',
    descricao: 'Atendimento a municípios da Grande São Paulo mediante consulta prévia por CEP.',
    icon: 'lucide:building-2'
  },
  {
    regiao: 'Residências e Empresas',
    descricao: 'Projetos sob medida para apartamentos, casas e imóveis comerciais.',
    icon: 'lucide:home'
  }
]

const faqs = [
  {
    pergunta: 'Como consultar se meu endereço é atendido?',
    resposta: 'Consulte seu CEP no verificador acima para verificar a disponibilidade de atendimento no seu endereço.'
  },
  {
    pergunta: 'A empresa atende cidades do litoral?',
    resposta: 'Atualmente o atendimento da AD Telas e Redes é concentrado na cidade de São Paulo e municípios selecionados da Grande São Paulo, sem cobertura em cidades do litoral.'
  },
  {
    pergunta: 'Como funciona o agendamento de visita para medição?',
    resposta: 'Após a verificação do CEP e contato por nossos canais de atendimento, combinamos data e horário para avaliação das medidas no local.'
  },
  {
    pergunta: 'Como solicitar uma proposta de orçamento?',
    resposta: 'Você pode solicitar uma proposta personalizada entrando em contato pelo WhatsApp ou formulário.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+consultar+atendimento+para+minha+regi%C3%A3o.+Vim+pelo+site.&type=phone_number&app_absent=0'
</script>

<template>
  <div class="min-h-screen bg-white">
    <Breadcrumb :items="breadcrumbItems" />

    <section class="relative bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F49A1A]/20 text-[#F49A1A] border border-[#F49A1A]/30 mb-4">
              <Icon name="lucide:map-pin" class="w-4 h-4" />
              Cobertura Geográfica
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Áreas Atendidas pela AD Telas e Redes
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Instalação de telas mosquiteiras e redes de proteção sob medida em São Paulo e região metropolitana. Consulte seu CEP abaixo para verificar a disponibilidade de atendimento no seu endereço.
            </p>

            <div class="flex flex-col sm:flex-row gap-3.5">
              <a
                href="#consulta-cep"
                class="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#F49A1A] hover:bg-[#e08a10] text-white font-bold rounded-xl transition-all shadow-lg text-base"
              >
                <Icon name="lucide:search" class="w-5 h-5" />
                Consultar meu CEP
              </a>
              <a
                :href="whatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#1fb854] text-white font-semibold rounded-xl transition-all text-base"
              >
                <Icon name="lucide:message-circle" class="w-5 h-5" />
                Falar com Atendimento
              </a>
            </div>
          </div>

          <div class="lg:col-span-5">
            <div class="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-white/5">
              <img
                src="/images/familia.png"
                alt="Atendimento AD Telas e Redes"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:map-pin" class="w-4 h-4 text-[#F49A1A]" /> São Paulo e Região</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:check-circle" class="w-4 h-4 text-[#F49A1A]" /> Atendimento sob medida</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ferramenta de Consulta por CEP -->
    <section id="consulta-cep" class="py-16 bg-[#F9FAFB] border-b border-[#E5EDF8]">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Verifique a Cobertura para o seu CEP
          </h2>
          <p class="text-gray-600 text-sm md:text-base">
            Digite seu CEP para verificar a disponibilidade de atendimento no seu endereço:
          </p>
        </div>

        <CepSearch />
      </div>
    </section>

    <!-- Regiões Atendidas -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="max-w-3xl mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Regiões de Atendimento
          </h2>
          <p class="text-gray-600 text-base">
            Atendimento sob medida para residências, apartamentos e empresas na capital e municípios atendidos.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="item in regioesPrincipais"
            :key="item.regiao"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] hover:border-[#22345F]/30 transition-colors"
          >
            <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
              <Icon :name="item.icon" class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ item.regiao }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ item.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ sobre Áreas Atendidas -->
    <section class="py-16 bg-[#F9FAFB] border-t border-[#E5EDF8]">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Perguntas Frequentes sobre Atendimento e Cobertura
          </h2>
          <p class="text-gray-600 text-sm">Informações sobre agendamento e áreas atendidas:</p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(faq, i) in faqs"
            :key="i"
            class="bg-white rounded-xl p-5 border border-[#E5EDF8] shadow-sm"
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

    <!-- Hubs de Serviços -->
    <section class="py-12 bg-white border-t border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Conheça Nossas Linhas de Serviços</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <NuxtLink to="/servicos/telas" class="group bg-[#F9FAFB] p-6 rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-[#22345F]/10 flex items-center justify-center mb-4 group-hover:bg-[#F49A1A]/20 transition-colors">
                <Icon name="lucide:grid" class="w-6 h-6 text-[#22345F] group-hover:text-[#F49A1A] transition-colors" />
              </div>
              <h3 class="font-bold text-[#22345F] text-lg mb-2">Telas Mosquiteiras</h3>
              <p class="text-gray-600 text-sm">Modelos para janelas, portas, sacadas e ambientes comerciais.</p>
            </div>
            <span class="text-xs font-bold text-[#F49A1A] mt-4 flex items-center gap-1">Ver modelos <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" /></span>
          </NuxtLink>

          <NuxtLink to="/servicos/redes" class="group bg-[#F9FAFB] p-6 rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-[#22345F]/10 flex items-center justify-center mb-4 group-hover:bg-[#F49A1A]/20 transition-colors">
                <Icon name="lucide:shield" class="w-6 h-6 text-[#22345F] group-hover:text-[#F49A1A] transition-colors" />
              </div>
              <h3 class="font-bold text-[#22345F] text-lg mb-2">Redes de Proteção</h3>
              <p class="text-gray-600 text-sm">Proteção para janelas, sacadas, escadas, crianças e pets.</p>
            </div>
            <span class="text-xs font-bold text-[#F49A1A] mt-4 flex items-center gap-1">Ver modelos <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" /></span>
          </NuxtLink>

          <NuxtLink to="/servicos/vidracaria" class="group bg-[#F9FAFB] p-6 rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-[#22345F]/10 flex items-center justify-center mb-4 group-hover:bg-[#F49A1A]/20 transition-colors">
                <Icon name="lucide:layers" class="w-6 h-6 text-[#22345F] group-hover:text-[#F49A1A] transition-colors" />
              </div>
              <h3 class="font-bold text-[#22345F] text-lg mb-2">Vidraçaria</h3>
              <p class="text-gray-600 text-sm">Soluções em vidro para residências.</p>
            </div>
            <span class="text-xs font-bold text-[#F49A1A] mt-4 flex items-center gap-1">Ver serviços <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" /></span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Áreas Atendidas"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>