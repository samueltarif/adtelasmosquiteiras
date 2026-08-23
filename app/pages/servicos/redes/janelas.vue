<script setup>
import { ref } from 'vue'

const showFormModal = ref(false)

useHead({
  title: 'Rede de Proteção para Janelas em SP | AD Telas e Redes',
  meta: [
    {
      name: 'description',
      content: 'Redes de proteção para janelas de apartamentos e casas em São Paulo. Instalação profissional sob medida. Solicite seu orçamento.'
    },
    { property: 'og:title', content: 'Rede de Proteção para Janelas em SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Instalação profissional de redes de proteção em janelas residenciais para segurança de crianças e pets.' },
    { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/redes_para_janelas.png' },
    { property: 'og:type', content: 'website' }
  ]
})

const breadcrumbItems = [
  { label: 'Home', path: '/', current: false, icon: 'lucide:home' },
  { label: 'Serviços', path: '/servicos', current: false },
  { label: 'Redes de Proteção', path: '/servicos/redes', current: false },
  { label: 'Janelas', path: '/servicos/redes/janelas', current: true }
]

const tiposAplicacaoJanelas = [
  {
    tipo: 'Janelas de Apartamentos',
    descricao: 'Fixação perimetral ao requadro da janela, atendendo aos padrões residenciais.'
  },
  {
    tipo: 'Janelas de Dormitórios e Salas',
    descricao: 'Fechamento com tensão uniforme que permite a abertura normal das folhas de vidro para ventilação.'
  },
  {
    tipo: 'Janelas Basculantes',
    descricao: 'Rede ajustada ao vão para conciliar ventilação e barreira física.'
  }
]

const caracteristicasRede = [
  {
    titulo: 'Instalação Sob Medida para o Vão',
    descricao: 'Rede de proteção instalada sob medida para o vão da janela, permitindo ventilação com barreira física.'
  },
  {
    titulo: 'Fixação Adequada ao Requadro',
    descricao: 'Pontos de fixação instalados conforme a estrutura da parede no local.'
  },
  {
    titulo: 'Distribuição Perimetral',
    descricao: 'Corda perimetral para fixação contínua ao redor de todo o vão.'
  }
]

const faqs = [
  {
    pergunta: 'Como é planejada a instalação da rede para janelas?',
    resposta: 'A instalação é planejada conforme as dimensões do vão e a necessidade de proteção no imóvel residencial.'
  },
  {
    pergunta: 'A instalação da rede danifica a esquadria da janela?',
    resposta: 'A furação é feita no requadro de alvenaria com fixadores apropriados, sem perfurar os vidros ou travas da janela.'
  },
  {
    pergunta: 'A rede de proteção interfere no fechamento da janela?',
    resposta: 'Não. A rede é instalada com afastamento calculado para que as folhas de correr ou basculantes abram e fechem livremente.'
  },
  {
    pergunta: 'Com que frequência deve ser feita a verificação da rede?',
    resposta: 'Recomenda-se a verificação periódica do tensionamento dos fios e da firmeza dos pontos de fixação.'
  }
]

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=5511983586611&text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+para+Rede+de+Prote%C3%A7%C3%A3o+de+Janelas.+Vim+pelo+site.&type=phone_number&app_absent=0'
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
              Janelas Residenciais e Apartamentos
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-white">
              Rede de Proteção para Janelas
            </h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Segurança essencial para janelas de apartamentos e sobrados. Instalação profissional sob medida em São Paulo e região.
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
                src="/images/redes_para_janelas.png"
                alt="Rede de proteção em janela"
                class="w-full h-80 object-cover"
                loading="eager"
              />
              <div class="p-4 bg-[#22345F]/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span class="flex items-center gap-1.5"><Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" /> Instalação sob medida</span>
                <span class="flex items-center gap-1.5"><Icon name="lucide:check-circle" class="w-4 h-4 text-[#F49A1A]" /> Sob medida para o vão</span>
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
            Aplicações em Janelas Residenciais
          </h2>
          <p class="text-gray-600 text-base">
            Instalação perimétrica adaptada às características da sua janela e tipo de parede.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="app in tiposAplicacaoJanelas"
            :key="app.tipo"
            class="bg-[#F9FAFB] rounded-2xl p-6 border-2 border-[#E5EDF8] hover:border-[#22345F]/30 transition-colors"
          >
            <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center mb-4">
              <Icon name="lucide:shield" class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#22345F] text-lg mb-2">{{ app.tipo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ app.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-[#F9FAFB] border-y border-[#E5EDF8]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-[#22345F] mb-3">
            Materiais e Fixação Profissional
          </h2>
          <p class="text-gray-600 text-sm md:text-base">
            Elementos de montagem desenvolvidos para conferir estabilidade mecânica na alvenaria.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="item in caracteristicasRede"
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
            Perguntas Frequentes sobre Redes para Janelas
          </h2>
          <p class="text-gray-600 text-sm">Tire suas dúvidas antes de instalar:</p>
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
        <h2 class="text-xl font-bold text-[#22345F] mb-6">Outras Aplicações de Redes de Proteção</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/servicos/redes/sacadas-e-varandas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:sun" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Sacadas e Varandas</span>
          </NuxtLink>
          <NuxtLink to="/servicos/redes/gatos-e-pets" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:paw-print" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Gatos e Pets</span>
          </NuxtLink>
          <NuxtLink to="/servicos/redes/criancas" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:shield" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Ambientes com Crianças</span>
          </NuxtLink>
          <NuxtLink to="/servicos/redes/escadas-e-mezaninos" class="bg-white p-4 rounded-xl border border-[#E5EDF8] hover:border-[#F49A1A] transition-all flex items-center gap-3">
            <Icon name="lucide:git-commit" class="w-5 h-5 text-[#22345F]" />
            <span class="text-sm font-semibold text-[#22345F]">Escadas e Mezaninos</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Redes para Janelas"
      @open-form="showFormModal = true"
    />
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>