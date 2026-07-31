<script setup>
import { ref, onMounted } from 'vue'

const WHATSAPP_NUMBER = '5511983586611'
const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,'

const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vi o site e gostaria de um orçamento para Vidraçaria. Vim pelo site: https://www.adtelasmosquiteiras.com.br/servicos/vidracaria')}`

const getWhatsappItemUrl = (itemTitulo) => {
  const msg = `Olá! Gostaria de um orçamento para:\n\nServiço: ${itemTitulo}\n\nVim pelo site: https://www.adtelasmosquiteiras.com.br/servicos/vidracaria`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

const servico = {
  slug: 'vidracaria',
  titulo: 'Vidraçaria',
  destaque: 'Instalação Profissional',
  descricaoCurta: 'Janelas de vidro temperado, telhados de vidro e fachadas corporativas com instalação rápida e garantia de 2 anos.',
  imagem: '/images/vidro_janela_8mm.png',
  imagemEspecificacoes: '/images/vidro_fachada.jpg',
  metaTitle: 'Vidraçaria em São Paulo | Janelas, Telhados e Fachadas de Vidro | AD Telas',
  metaDescription: 'Serviços de vidraçaria em SP: janelas de vidro temperado 8mm, telhados de vidro e fachadas corporativas. Instalação em 24h, garantia 2 anos, orçamento grátis.',
  beneficios: [
    { icone: 'shield', titulo: 'Vidro Temperado', descricao: 'Segurança certificada, alta resistência a impactos e variações térmicas' },
    { icone: 'clock', titulo: 'Instalação em 24h', descricao: 'Agendamento rápido, equipe técnica especializada e pontual' },
    { icone: 'check', titulo: 'Sob Medida', descricao: 'Medição precisa e projeto personalizado para qualquer ambiente' },
    { icone: 'award', titulo: 'Garantia 2 Anos', descricao: 'Cobertura total contra defeitos de material e instalação' }
  ],
  especificacoes: [
    { label: 'Material', valor: 'Vidro temperado 8mm, 10mm ou 12mm' },
    { label: 'Projetos', valor: 'Janelas de correr, telhados de vidro, fachadas, portas' },
    { label: 'Acabamento', valor: 'Perfis de alumínio, inox ou cromado' },
    { label: 'Garantia', valor: '2 anos de garantia completa' },
    { label: 'Instalação', valor: 'Em até 24h após medição' },
    { label: 'Orçamento', valor: '100% Gratuito sem compromisso' }
  ],
  comparacao: [
    'Vidro temperado certificado',
    'Instalação rápida em 24h',
    'Garantia de 2 anos',
    'Medição presencial gratuita',
    'Acabamento premium'
  ],
  faq: [
    { pergunta: 'Qual a vantagem do vidro temperado 8mm?', resposta: 'O vidro temperado de 8mm passa por tratamento térmico que o torna até 5x mais resistente que o vidro comum, oferecendo máxima segurança e durabilidade contra ventos e impactos.' },
    { pergunta: 'Quanto tempo leva a instalação?', resposta: 'Após medição técnica e aprovação, a instalação é realizada rapidamente, geralmente levando entre 2 a 4 horas.' },
    { pergunta: 'Vocês realizam medição gratuita?', resposta: 'Sim! A visita técnica e medição no local são 100% gratuitas e sem compromisso em toda a Grande São Paulo.' },
    { pergunta: 'Atendem condomínios e estabelecimentos comerciais?', resposta: 'Sim, atendemos residências, apartamentos, condomínios, lojas e edifícios corporativos.' }
  ]
}

// 4 Produtos / Serviços de Vidraçaria solicitados
const produtosVidracaria = [
  {
    titulo: 'Janela de Vidro Temperado 8mm - 4 Folhas',
    descricao: 'Janela ampla com vidro temperado 8mm incolor, 4 folhas de correr.',
    imagem: '/images/vidro_janela_8mm.png',
    destaque: 'Mais Vendido'
  },
  {
    titulo: 'Janela de Vidro',
    descricao: 'Opção ideal para quem busca luminosidade sem abrir mão do conforto. Vidros de qualidade que proporcionam silêncio, vedação e harmonia visual aos espaços.',
    imagem: '/images/vidro_janela_slide.jpg',
    destaque: 'Sob Medida'
  },
  {
    titulo: 'Telhado de Vidro',
    descricao: 'Perfeito para áreas externas e corredores, o telhado de vidro garante iluminação natural, conforto térmico e sofisticação ao ambiente.',
    imagem: '/images/vidro_telhado.jpg',
    destaque: 'Iluminação Natural'
  },
  {
    titulo: 'Fachada de Vidro',
    descricao: 'Vidros de alta performance para fachadas comerciais e corporativas, com design contemporâneo, proteção solar e excelente resistência às variações climáticas.',
    imagem: '/images/vidro_fachada.jpg',
    destaque: 'Alta Performance'
  }
]

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

          <!-- Conteúdo Hero -->
          <div>
            <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Icon name="lucide:check-circle" class="w-4 h-4" />
              {{ servico.destaque }}
            </div>

            <h1 class="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Serviços de <span class="text-[#38BDF8]">Vidraçaria</span>
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
              >
                <WhatsappIcon class="w-6 h-6" />
                Orçamento no WhatsApp
              </a>
              <a
                href="#catalogo-vidros"
                class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 text-center"
              >
                Ver Modelos de Vidros
              </a>
            </div>
          </div>

          <!-- Imagem Destaque Hero -->
          <div class="relative">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                :src="servico.imagem"
                :alt="servico.titulo"
                class="w-full h-80 md:h-[420px] object-cover"
                loading="eager"
              />
            </div>
            <div class="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl border border-[#E5EDF8]">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                  <Icon name="lucide:check-circle" class="w-6 h-6 text-white" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-[#22345F]">5 Mil+</p>
                  <p class="text-sm text-[#4B5563]">Projetos Entregues</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- SEÇÃO PRINCIPAL: SERVIÇOS DE VIDRAÇARIA (LAYOUT ADAPTADO AO PROJETO) -->
    <section id="catalogo-vidros" class="py-16 md:py-24 bg-[#0B1528] text-white">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        
        <!-- Header da Seção -->
        <div class="text-center mb-12 md:mb-16">
          <h2 class="text-3xl md:text-5xl font-bold text-white mb-4">
            Serviços de <span class="text-[#38BDF8]">Vidraçaria</span>
          </h2>
          <p class="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Instalação e substituição de vidros temperados, janelas e esquadrias de vidro sob medida. Acabamento premium com materiais de alta qualidade.
          </p>
        </div>

        <!-- Grid dos 4 Cards de Vidraçaria -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <a
            v-for="produto in produtosVidracaria"
            :key="produto.titulo"
            :href="getWhatsappItemUrl(produto.titulo)"
            target="_blank"
            rel="noopener noreferrer"
            class="group relative rounded-2xl overflow-hidden border-2 border-white/10 hover:border-[#38BDF8] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col bg-white/5 backdrop-blur-sm cursor-pointer"
          >
            <!-- Imagem do Card com Overlay Gradient -->
            <div class="relative h-64 md:h-72 overflow-hidden bg-gray-900">
              <img
                :src="produto.imagem"
                :alt="produto.titulo"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              
              <!-- Gradient Overlay de Leitura -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

              <!-- Badge do Destaque -->
              <div class="absolute top-3 left-3 bg-[#F49A1A] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {{ produto.destaque }}
              </div>

              <!-- Conteúdo sobreposto na imagem (Estilo Card Dark Premium) -->
              <div class="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end">
                <h3 class="text-lg md:text-xl font-bold text-white mb-2 leading-tight group-hover:text-[#38BDF8] transition-colors">
                  {{ produto.titulo }}
                </h3>
                <p class="text-xs md:text-sm text-gray-200 line-clamp-3 leading-relaxed mb-3">
                  {{ produto.descricao }}
                </p>

                <!-- Botão WhatsApp sobreposto -->
                <div class="flex items-center justify-between pt-2 border-t border-white/20">
                  <span class="text-xs text-gray-300 flex items-center gap-1">
                    <Icon name="lucide:clock" class="w-3.5 h-3.5 text-[#F49A1A]" /> Instalação 24h
                  </span>
                  <span class="inline-flex items-center gap-1.5 text-[#25D366] text-xs font-bold group-hover:translate-x-1 transition-transform">
                    <Icon name="lucide:message-circle" class="w-4 h-4" /> WhatsApp
                  </span>
                </div>
              </div>
            </div>
          </a>
        </div>

      </div>
    </section>

    <!-- Benefícios -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        <div class="text-center mb-12 md:mb-16">
          <h2 class="text-3xl md:text-5xl font-bold text-[#22345F] mb-4">
            Por que Escolher Nossa Vidraçaria?
          </h2>
          <p class="text-base md:text-lg text-[#4B5563] max-w-2xl mx-auto">
            Qualidade, segurança e garantia que você e sua família podem confiar
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(beneficio, index) in servico.beneficios"
            :key="index"
            class="bg-gradient-to-br from-[#E5EDF8] to-white p-6 rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl"
          >
            <div class="w-14 h-14 bg-[#F49A1A] rounded-2xl flex items-center justify-center mb-4 text-white">
              <Icon v-if="beneficio.icone === 'shield'" name="lucide:shield-check" class="w-7 h-7" />
              <Icon v-else-if="beneficio.icone === 'clock'" name="lucide:clock" class="w-7 h-7" />
              <Icon v-else-if="beneficio.icone === 'check'" name="lucide:check-circle" class="w-7 h-7" />
              <Icon v-else name="lucide:award" class="w-7 h-7" />
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
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                :src="servico.imagemEspecificacoes"
                :alt="`${servico.titulo} - especificações`"
                class="w-full h-[380px] object-cover"
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
          <p class="text-base md:text-lg text-[#4B5563]">Veja por que somos a melhor escolha em São Paulo</p>
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
          <p class="text-base md:text-lg text-[#4B5563]">Tire suas dúvidas sobre serviços de vidraçaria</p>
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
      </div>
    </section>

    <!-- CTA Final -->
    <section id="contato-final" class="py-16 md:py-24 bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white relative overflow-hidden">
      <div class="container mx-auto px-4 md:px-6 max-w-4xl relative z-10 text-center">
        <h2 class="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          Modernize seu espaço HOJE!<br/>
          Instalação em 24h
        </h2>
        <p class="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Janelas de vidro temperado, telhados de vidro e fachadas corporativas com acabamento premium e garantia.
        </p>

        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackWhatsApp('cta-final')"
          class="inline-flex items-center gap-3 px-10 py-5 bg-[#25D366] text-white rounded-2xl font-bold text-xl hover:bg-[#1fb854] transition-all duration-300 shadow-2xl hover:scale-105 mb-6"
        >
          <WhatsappIcon class="w-7 h-7" />
          Solicitar Orçamento GRÁTIS Agora
        </a>
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
