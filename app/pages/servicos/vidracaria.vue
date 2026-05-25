<script setup>
const WHATSAPP_NUMBER = '5511983586611'
const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,'

const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Olá! Vi o site e gostaria de um orçamento para Vidraçaria. Vim pelo site: https://www.adtelasmosquiteiras.com.br/servicos/vidracaria`

const servico = {
  slug: 'vidracaria',
  titulo: 'Vidraçaria',
  destaque: 'Instalação Profissional',
  descricaoCurta: 'Box de banheiro, janelas, portas e espelhos com instalação rápida e garantia',
  imagem: '/images/mosquiteira_janela.png',
  imagemEspecificacoes: '/images/mosquiteira_area_externa.png',
  metaTitle: 'Vidraçaria em São Paulo | Box, Janelas e Portas de Vidro | AD Telas',
  metaDescription: 'Serviços de vidraçaria em SP: box de banheiro, janelas, portas e espelhos. Instalação em 24h, garantia 2 anos, orçamento grátis.',
  beneficios: [
    { icone: 'shield', titulo: 'Vidro Temperado', descricao: 'Segurança certificada, resistente a impactos e variações de temperatura' },
    { icone: 'clock', titulo: 'Instalação em 24h', descricao: 'Agendamento rápido, equipe especializada e pontual' },
    { icone: 'check', titulo: 'Sob Medida', descricao: 'Medição precisa e corte personalizado para qualquer ambiente' },
    { icone: 'award', titulo: 'Garantia 2 Anos', descricao: 'Cobertura total contra defeitos de material e instalação' }
  ],
  especificacoes: [
    { label: 'Material', valor: 'Vidro temperado 8mm, 10mm ou 12mm' },
    { label: 'Tipos', valor: 'Box, janelas, portas, espelhos, divisórias' },
    { label: 'Acabamento', valor: 'Inox, alumínio ou cromado' },
    { label: 'Garantia', valor: '2 anos' },
    { label: 'Instalação', valor: '24h após medição' },
    { label: 'Orçamento', valor: 'Gratuito e sem compromisso' }
  ],
  comparacao: [
    'Vidro temperado certificado',
    'Instalação em 24h',
    'Garantia 2 anos',
    'Medição gratuita',
    'Acabamento premium'
  ],
  faq: [
    { pergunta: 'Qual a diferença entre vidro comum e temperado?', resposta: 'O vidro temperado passa por um processo térmico que aumenta sua resistência em até 5x. Em caso de quebra, fragmenta em pedaços pequenos e arredondados, reduzindo o risco de cortes graves.' },
    { pergunta: 'Quanto tempo leva a instalação de um box de banheiro?', resposta: 'Após a medição e fabricação, a instalação leva em média 2 a 4 horas. O prazo total do pedido é de 24 a 48 horas.' },
    { pergunta: 'Vocês fazem medição gratuita?', resposta: 'Sim! A visita técnica e medição são totalmente gratuitas e sem compromisso. Entre em contato pelo WhatsApp para agendar.' },
    { pergunta: 'Atendem condomínios e empresas?', resposta: 'Sim, atendemos residências, condomínios, escritórios e estabelecimentos comerciais em toda a Grande São Paulo.' },
    { pergunta: 'A garantia cobre o quê?', resposta: 'Nossa garantia de 2 anos cobre defeitos de fabricação, problemas na instalação e falhas nos ferragens e perfis utilizados.' }
  ]
}

useHead({
  title: servico.metaTitle,
  meta: [
    { name: 'description', content: servico.metaDescription },
    { property: 'og:title', content: servico.metaTitle },
    { property: 'og:description', content: servico.metaDescription },
    { property: 'og:image', content: servico.imagem },
    { property: 'og:type', content: 'website' }
  ]
})

const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...params })
  }
}

const trackWhatsApp = (origem = 'hero') => {
  trackEvent('servico_whatsapp_clicked', { servico: 'vidracaria', origem })
}

onMounted(() => {
  trackEvent('servico_page_view', { servico: 'vidracaria' })
})

const showFormModal = ref(false)
const openFormModal = () => { showFormModal.value = true }
</script>

<template>
  <div class="min-h-screen bg-white">

    <Breadcrumb />

    <!-- Hero -->
    <section class="relative bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white py-16 md:py-24 overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>

      <div class="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

          <!-- Conteúdo -->
          <div>
            <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Icon name="lucide:check-circle" class="w-4 h-4" />
              {{ servico.destaque }}
            </div>

            <h1 class="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {{ servico.titulo }} em São Paulo
            </h1>

            <p class="text-lg md:text-xl text-white/90 mb-8">
              {{ servico.descricaoCurta }}
            </p>

            <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8">
              <div class="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366]" />
                  <span class="text-white font-semibold">Instalação em 24h</span>
                </div>
                <div class="flex items-center gap-2">
                  <Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366]" />
                  <span class="text-white font-semibold">Garantia 2 anos</span>
                </div>
                <div class="flex items-center gap-2">
                  <Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366]" />
                  <span class="text-white font-semibold">Orçamento Grátis</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-4">
              <a
                :href="whatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                @click="trackWhatsApp('hero')"
                class="flex-1 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 flex items-center justify-center gap-2 shadow-xl"
                data-gtm="vidracaria-hero-whatsapp"
              >
                <WhatsappIcon class="w-6 h-6" />
                Orçamento Grátis
              </a>
              <NuxtLink
                to="/servicos"
                class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 text-center"
              >
                Ver Todos os Serviços
              </NuxtLink>
            </div>
          </div>

          <!-- Imagem -->
          <div class="relative">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                :src="servico.imagem"
                :alt="servico.titulo"
                class="w-full h-auto"
                loading="eager"
              />
            </div>
            <div class="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                  <Icon name="lucide:check-circle" class="w-6 h-6 text-white" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-[#22345F]">5 Mil+</p>
                  <p class="text-sm text-[#4B5563]">Clientes</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Benefícios -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <div class="text-center mb-12 md:mb-16">
          <h2 class="text-3xl md:text-5xl font-bold text-[#22345F] mb-4">
            Por que nossa Vidraçaria?
          </h2>
          <p class="text-base md:text-lg text-[#4B5563] max-w-2xl mx-auto">
            Qualidade, segurança e garantia que você pode confiar
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(beneficio, index) in servico.beneficios"
            :key="index"
            class="bg-gradient-to-br from-[#E5EDF8] to-white p-6 rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl"
          >
            <div class="w-14 h-14 bg-[#F49A1A] rounded-2xl flex items-center justify-center mb-4">
              <svg v-if="beneficio.icone === 'shield'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <svg v-else-if="beneficio.icone === 'clock'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <svg v-else-if="beneficio.icone === 'check'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <svg v-else-if="beneficio.icone === 'award'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-[#22345F] mb-2">{{ beneficio.titulo }}</h3>
            <p class="text-sm text-[#4B5563]">{{ beneficio.descricao }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Especificações -->
    <section class="py-16 md:py-24 bg-gradient-to-b from-white to-[#F9FAFB]">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

          <div class="order-2 md:order-1">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                :src="servico.imagemEspecificacoes"
                :alt="`${servico.titulo} - especificações`"
                class="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>

          <div class="order-1 md:order-2">
            <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-6">
              Especificações Técnicas
            </h2>
            <div class="space-y-4">
              <div
                v-for="(spec, index) in servico.especificacoes"
                :key="index"
                class="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-[#E5EDF8]"
              >
                <div class="w-10 h-10 bg-[#E5EDF8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:check-circle" class="w-5 h-5 text-[#22345F]" />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-[#4B5563] mb-1">{{ spec.label }}</p>
                  <p class="text-base font-bold text-[#22345F]">{{ spec.valor }}</p>
                </div>
              </div>
            </div>
            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click="trackWhatsApp('especificacoes')"
              class="mt-8 w-full px-8 py-4 bg-[#F49A1A] text-white rounded-xl font-bold text-lg hover:bg-[#d88715] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              data-gtm="vidracaria-specs-whatsapp"
            >
              <WhatsappIcon class="w-6 h-6" />
              Solicitar Orçamento Detalhado
            </a>
          </div>

        </div>
      </div>
    </section>

    <!-- Comparação -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-6 max-w-5xl">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">
            Nossa Vidraçaria vs Concorrentes
          </h2>
          <p class="text-base md:text-lg text-[#4B5563]">Veja por que somos a melhor escolha</p>
        </div>

        <div class="bg-white rounded-3xl border-2 border-[#E5EDF8] overflow-hidden shadow-xl">
          <div class="grid grid-cols-3 bg-[#22345F] text-white">
            <div class="p-4 md:p-6"></div>
            <div class="p-4 md:p-6 text-center border-l-2 border-white/20">
              <p class="font-bold text-lg md:text-xl">AD Telas</p>
            </div>
            <div class="p-4 md:p-6 text-center border-l-2 border-white/20">
              <p class="font-bold text-lg md:text-xl">Concorrentes</p>
            </div>
          </div>
          <div
            v-for="(item, index) in servico.comparacao"
            :key="index"
            class="grid grid-cols-3 border-b-2 border-[#E5EDF8] last:border-b-0"
          >
            <div class="p-4 md:p-6 flex items-center">
              <p class="text-sm md:text-base font-semibold text-[#22345F]">{{ item }}</p>
            </div>
            <div class="p-4 md:p-6 flex items-center justify-center border-l-2 border-[#E5EDF8] bg-[#E5EDF8]/30">
              <Icon name="lucide:check-circle" class="w-6 h-6 md:w-8 md:h-8 text-[#25D366]" />
            </div>
            <div class="p-4 md:p-6 flex items-center justify-center border-l-2 border-[#E5EDF8]">
              <Icon name="lucide:x-circle" class="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            </div>
          </div>
        </div>

        <div class="text-center mt-8">
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            @click="trackWhatsApp('comparacao')"
            class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
            data-gtm="vidracaria-comparacao-whatsapp"
          >
            <WhatsappIcon class="w-6 h-6" />
            Quero a Melhor Opção!
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 md:py-24 bg-gradient-to-b from-[#F9FAFB] to-white">
      <div class="container mx-auto px-4 md:px-6 max-w-4xl">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">Perguntas Frequentes</h2>
          <p class="text-base md:text-lg text-[#4B5563]">Tire suas dúvidas sobre vidraçaria</p>
        </div>

        <div class="space-y-4">
          <details
            v-for="(item, index) in servico.faq"
            :key="index"
            class="group bg-white rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 overflow-hidden"
          >
            <summary class="flex items-center justify-between p-6 cursor-pointer list-none">
              <h3 class="text-base md:text-lg font-bold text-[#22345F] pr-4">{{ item.pergunta }}</h3>
              <Icon name="lucide:chevron-down" class="w-6 h-6 text-[#F49A1A] flex-shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div class="px-6 pb-6">
              <p class="text-sm md:text-base text-[#4B5563] leading-relaxed">{{ item.resposta }}</p>
            </div>
          </details>
        </div>

        <div class="text-center mt-12 p-8 bg-gradient-to-br from-[#E5EDF8] to-white rounded-2xl border-2 border-[#E5EDF8]">
          <p class="text-lg font-semibold text-[#22345F] mb-4">Ainda tem dúvidas?</p>
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            @click="trackWhatsApp('faq')"
            class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
            data-gtm="vidracaria-faq-whatsapp"
          >
            <WhatsappIcon class="w-6 h-6" />
            Fale com um Especialista
          </a>
        </div>
      </div>
    </section>

    <!-- CTA Final -->
    <section id="contato-final" class="py-16 md:py-24 bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white relative overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>

      <div class="container mx-auto px-4 md:px-6 max-w-4xl relative z-10 text-center">
        <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-4 py-2 rounded-full text-sm font-bold mb-6">
          <Icon name="lucide:clock" class="w-4 h-4" />
          Oferta por tempo limitado
        </div>

        <h2 class="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          Modernize seu espaço HOJE!<br/>
          Instalação em 24h
        </h2>

        <p class="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Box de banheiro, janelas, portas e espelhos com vidro temperado de qualidade premium e instalação profissional.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
          <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <Icon name="lucide:check-circle" class="w-6 h-6 text-[#25D366]" />
            <span class="font-semibold">Orçamento Grátis</span>
          </div>
          <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <Icon name="lucide:check-circle" class="w-6 h-6 text-[#25D366]" />
            <span class="font-semibold">Instalação 24h</span>
          </div>
          <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <Icon name="lucide:check-circle" class="w-6 h-6 text-[#25D366]" />
            <span class="font-semibold">Garantia 2 Anos</span>
          </div>
        </div>

        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackWhatsApp('cta-final')"
          class="inline-flex items-center gap-3 px-10 py-5 bg-[#25D366] text-white rounded-2xl font-bold text-xl hover:bg-[#1fb854] transition-all duration-300 shadow-2xl hover:scale-105 mb-6"
          data-gtm="vidracaria-cta-final-whatsapp"
        >
          <WhatsappIcon class="w-7 h-7" />
          Solicitar Orçamento GRÁTIS Agora
        </a>

        <div class="flex items-center justify-center gap-6 text-sm text-white/80">
          <div class="flex items-center gap-2">
            <Icon name="lucide:star" class="w-5 h-5 text-[#F49A1A]" />
            <span>5 Mil+ clientes satisfeitos</span>
          </div>
          <a
            :href="GOOGLE_REVIEWS_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-white transition-colors"
          >
            <span class="font-semibold">Nota 5.0</span>
            <div class="flex gap-0.5">
              <Icon v-for="i in 5" :key="i" name="lucide:star" class="w-4 h-4 text-[#F49A1A] fill-current" />
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- Voltar -->
    <section class="py-8 bg-white border-t-2 border-[#E5EDF8]">
      <div class="container mx-auto px-4 md:px-6 text-center">
        <NuxtLink
          to="/servicos"
          class="inline-flex items-center gap-2 text-[#22345F] hover:text-[#F49A1A] font-semibold transition-colors"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
          Voltar para Serviços
        </NuxtLink>
      </div>
    </section>

    <MobileUnifiedCTA
      servico-atual="Vidraçaria"
      msg-padrao="Olá! Gostaria de um orçamento para Vidraçaria."
      @open-form="openFormModal"
    />

    <StickyFormModal v-model="showFormModal" />

  </div>
</template>

<style scoped>
details[open] summary ~ * {
  animation: slideDown 0.3s ease-out;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
