<script setup>
import { ref } from 'vue'
import ServicePublicGallery from '~/components/services/ServicePublicGallery.vue'

const showFormModal = ref(false)

useHead({
  title: 'Rede de Proteção para Crianças em SP | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Redes de proteção para ambientes com crianças em janelas e sacadas em São Paulo. Instalação profissional sob medida. Solicite seu orçamento.'
    },
    { property: 'og:title', content: 'Rede de Proteção para Crianças em SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Proteção sob medida para janelas, sacadas e áreas de circulação infantil em apartamentos e casas.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/redes_para_criancas.png' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Serviços', path: '/servicos', current: false },
  { label: 'Redes de Proteção', path: '/servicos/redes', current: false },
  { label: 'Ambientes com Crianças', path: '/servicos/redes/criancas', current: true }
]

const areasRecomendadas = [
  {
    area: 'Janelas de Quartos e Salas',
    descricao: 'Áreas com móveis ou peitoris acessíveis que exigem proteção física contínua.'
  },
  {
    area: 'Sacadas e Varandas',
    descricao: 'Fechamento integral de vãos livres para segurança na circulação infantil.'
  },
  {
    area: 'Escadas e Desníveis',
    descricao: 'Proteção de vãos vazados em sobrados e mezaninos.'
  }
]

const diretrizesInstalacao = [
  {
    titulo: 'Espaçamento Regular de Fixadores',
    descricao: 'Distribuição dos pontos de fixação para garantir sustentação equilibrada.'
  },
  {
    titulo: 'Fechamento de Vãos',
    descricao: 'Instalação sob medida para fechamento de vãos em fachadas e aberturas residenciais.'
  },
  {
    titulo: 'Acompanhamento Periódico',
    descricao: 'Recomendação de inspeção visual regular para certificar que a rede permanece firme.'
  }
]

const faqs = [
  {
    pergunta: 'A partir de qual momento é recomendado instalar rede de proteção para crianças?',
    resposta: 'Recomenda-se a instalação antes mesmo do bebê começar a engatinhar ou se apoiar em móveis, mantendo a proteção ativa durante toda a infância.'
  },
  {
    pergunta: 'Em quais cômodos da residência a rede é mais indicada?',
    resposta: 'Principalmente nos dormitórios, salas com janelas amplas, varandas e vãos de escadas.'
  },
  {
    pergunta: 'A rede atrapalha a ventilação do quarto?',
    resposta: 'Não. A malha permite a circulação natural de ar e luz, mantendo o ambiente arejado.'
  },
  {
    pergunta: 'Como saber se a rede precisa de revisão?',
    resposta: 'Verifique regularmente se a malha permanece tensionada e se os fixadores continuam firmes na parede.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Rede+de+Prote%C3%A7%C3%A3o+para+Crian%C3%A7as.+Vim+pelo+site.&type=phone_number&app_absent=0'
</script>

<template>
  <div class="min-h-screen bg-white">
    <Breadcrumb :items="breadcrumbItems" />

    <section class="relative bg-gradient-to-br from-[#22345F] to-[#1a2847] text-white py-14 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F49A1A]/20 text-[#F49A1A] border border-[#F49A1A]/30 mb-4">
              <Icon name="lucide:shield" class="w-4 h-4" />
              Segurança Residencial Infantil
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Rede de Proteção para Ambientes com Crianças
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Instalação profissional de redes em janelas, sacadas e escadas para proteção de ambientes com circulação de crianças. Atendimento sob medida em São Paulo e região.
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
                src="/images/redes_para_criancas.png"
                alt="Rede de proteção em janela residencial"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" /> Instalação profissional</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:check-circle" class="w-4 h-4 text-[#F49A1A]" /> Fixação sob medida</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Galeria Pública de Mídias Reais do Serviço -->
    <Suspense>
      <ServicePublicGallery service-key="redes_criancas" />
    </Suspense>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="max-w-3xl mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Locais de Instalação para Proteção Infantil
          </h2>
          <p class="text-gray-600 text-base">
            Ambientes residenciais onde o fechamento de vãos previne acidentes em altura.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="item in areasRecomendadas"
            :key="item.area"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] hover:border-[#22345F]/30 transition-colors"
          >
            <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
              <Icon name="lucide:shield" class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ item.area }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ item.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-[#F9FAFB] border-y border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Procedimentos de Montagem
          </h2>
          <p class="text-gray-600 text-sm md:text-base">
            Critérios para assegurar fixação sólida em alvenaria e estruturas de apoio.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="dir in diretrizesInstalacao"
            :key="dir.titulo"
            class="bg-white rounded-2xl p-6 border border-[#E5EDF8] shadow-sm"
          >
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ dir.titulo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ dir.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-2">
            Perguntas Frequentes sobre Redes para Crianças
          </h2>
          <p class="text-gray-600 text-sm">Informações importantes para famílias:</p>
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
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Outros Serviços de Proteção Residencial</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/servicos/redes/janelas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:layout-grid" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Redes para Janelas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/redes/sacadas-e-varandas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:sun" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Redes para Sacadas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/redes/escadas-e-mezaninos" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:git-commit" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Escadas e Mezaninos</span>
          </NuxtLink>
          <NuxtLink to="/servicos/telas/janelas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:grid" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Telas Mosquiteiras</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Redes para Crianças"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>