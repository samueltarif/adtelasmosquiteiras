<script setup>
import { useServicoData } from '~/composables/useServicoData'
import ServicoEspecificacoes from '~/components/servicos/ServicoEspecificacoes.vue'
import ServicoCtaFinal from '~/components/servicos/ServicoCtaFinal.vue'

const route = useRoute()
const { getServicoBySlug, getWhatsAppUrl, GOOGLE_REVIEWS_URL } = useServicoData()

const servico = getServicoBySlug(route.params.slug)

if (!servico) {
  await navigateTo('/servicos')
  throw createError({ statusCode: 404, message: 'Serviço não encontrado' })
}

useHead({
  title: servico?.metaTitle || 'Serviços | AD Telas',
  meta: [
    { name: 'description', content: servico?.metaDescription || 'Serviços de redes e telas' },
    { property: 'og:title', content: servico?.metaTitle || 'Serviços | AD Telas' },
    { property: 'og:description', content: servico?.metaDescription || 'Serviços de redes e telas' },
    { property: 'og:image', content: servico?.imagemHero || '/images/familia.png' },
    { property: 'og:type', content: 'website' }
  ]
})

const scrollToContact = () => {
  document.getElementById('contato-final')?.scrollIntoView({ behavior: 'smooth' })
}

const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...params })
  }
}

const whatsappHeroUrl = computed(() => getWhatsAppUrl(servico, 'hero'))
const whatsappSpecsUrl = computed(() => getWhatsAppUrl(servico, 'especificacoes'))
const whatsappComparacaoUrl = computed(() => getWhatsAppUrl(servico, 'comparacao'))
const whatsappFaqUrl = computed(() => getWhatsAppUrl(servico, 'faq'))
const whatsappFinalUrl = computed(() => getWhatsAppUrl(servico, 'cta-final'))
</script>

<template>
  <div class="min-h-screen bg-white">

    <!-- Hero -->
    <section class="relative bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white py-16 md:py-24 overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>
      
      <div class="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          
          <!-- Conteúdo -->
          <div>
            <!-- Breadcrumb -->
            <nav class="mb-6">
              <ol class="flex items-center gap-2 text-sm text-white/70">
                <li>
                  <NuxtLink to="/" class="hover:text-white transition-colors">Início</NuxtLink>
                </li>
                <li>
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                </li>
                <li class="text-white font-medium">{{ servico.titulo }}</li>
              </ol>
            </nav>
            
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-4 py-2 rounded-full text-sm font-bold mb-6">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              {{ servico.destaque }}
            </div>
            
            <!-- Título -->
            <h1 class="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {{ servico.titulo }} em São Paulo
            </h1>
            
            <!-- Descrição -->
            <p class="text-lg md:text-xl text-white/90 mb-8">
              {{ servico.descricaoCompleta }}
            </p>
            
            <!-- Diferenciais -->
            <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8">
              <div class="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-white font-semibold">Instalação em 24h</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-white font-semibold">Garantia 2 anos</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-white font-semibold">Orçamento Grátis</span>
                </div>
              </div>
            </div>
            
            <!-- CTA Principal -->
            <div class="flex flex-col sm:flex-row gap-4">
              <a
                :href="whatsappHeroUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
                data-cta-location="hero"
                data-gtm="servico-hero-whatsapp"
                @click="trackEvent('servico_whatsapp_clicked', { slug: servico.slug, origem: 'hero' })"
              >
                <WhatsappIcon class="w-6 h-6" />
                Orçamento Grátis para {{ servico.titulo.split(' ')[0] }}
              </a>
              
              <button
                @click="scrollToContact"
                class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
              >
                Ver Mais Detalhes
              </button>
            </div>
          </div>
          
          <!-- Imagem -->
          <div class="relative">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                :src="servico.imagemHero"
                :alt="servico.titulo"
                class="w-full h-auto"
                loading="eager"
              />
            </div>
            
            <!-- Badge Flutuante -->
            <div class="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p class="text-2xl font-bold text-[#22345F]">500+</p>
                  <p class="text-sm text-[#4B5563]">Instalações</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>

    <!-- Por que nossa [serviço] -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        
        <div class="text-center mb-12 md:mb-16">
          <h2 class="text-3xl md:text-5xl font-bold text-[#22345F] mb-4">
            Por que nossa {{ servico.titulo.split(' ')[0] }}?
          </h2>
          <p class="text-base md:text-lg text-[#4B5563] max-w-2xl mx-auto">
            Qualidade, segurança e garantia que você pode confiar
          </p>
        </div>
        
        <!-- Grid de Benefícios -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(beneficio, index) in servico.beneficios"
            :key="index"
            class="bg-gradient-to-br from-[#E5EDF8] to-white p-6 rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl"
          >
            <!-- Ícone -->
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
              <svg v-else-if="beneficio.icone === 'eye'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg v-else-if="beneficio.icone === 'bug'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <svg v-else-if="beneficio.icone === 'wind'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
              <svg v-else-if="beneficio.icone === 'sparkles'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            
            <!-- Título -->
            <h3 class="text-lg font-bold text-[#22345F] mb-2">
              {{ beneficio.titulo }}
            </h3>
            
            <!-- Descrição -->
            <p class="text-sm text-[#4B5563]">
              {{ beneficio.descricao }}
            </p>
          </div>
        </div>
        
      </div>
    </section>

    <!-- Demo e Especificações (Componente Modular) -->
    <ServicoEspecificacoes
      :servico="servico"
      :whatsapp-url="whatsappSpecsUrl"
      @whatsapp-click="(origem) => trackEvent('servico_whatsapp_clicked', { slug: servico.slug, origem })"
    />

    <!-- Comparação -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-6 max-w-5xl">
        
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">
            Nossa {{ servico.titulo.split(' ')[0] }} vs Concorrentes
          </h2>
          <p class="text-base md:text-lg text-[#4B5563]">
            Veja por que somos a melhor escolha
          </p>
        </div>
        
        <!-- Tabela de Comparação -->
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
            v-for="(item, index) in servico.comparacao.nos"
            :key="index"
            class="grid grid-cols-3 border-b-2 border-[#E5EDF8] last:border-b-0"
          >
            <div class="p-4 md:p-6 flex items-center">
              <p class="text-sm md:text-base font-semibold text-[#22345F]">{{ item }}</p>
            </div>
            <div class="p-4 md:p-6 flex items-center justify-center border-l-2 border-[#E5EDF8] bg-[#E5EDF8]/30">
              <svg class="w-6 h-6 md:w-8 md:h-8 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="p-4 md:p-6 flex items-center justify-center border-l-2 border-[#E5EDF8]">
              <svg class="w-6 h-6 md:w-8 md:h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
        
        <!-- CTA Comparação -->
        <div class="text-center mt-8">
          <a
            :href="whatsappComparacaoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
            data-cta-location="comparacao"
            data-gtm="servico-comparacao-whatsapp"
            @click="trackEvent('servico_whatsapp_clicked', { slug: servico.slug, origem: 'comparacao' })"
          >
            <WhatsappIcon class="w-6 h-6" />
            Quero a Melhor Opção!
          </a>
        </div>
        
      </div>
    </section>

    <!-- Cases de Sucesso -->
    <section class="py-16 md:py-24 bg-gradient-to-b from-[#F9FAFB] to-white">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">
            Cases de Sucesso
          </h2>
          <p class="text-base md:text-lg text-[#4B5563]">
            Veja como ajudamos nossos clientes
          </p>
        </div>
        
        <!-- Grid de Cases -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div
            v-for="(caso, index) in servico.cases"
            :key="index"
            class="bg-white rounded-2xl p-6 md:p-8 border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 hover:shadow-xl"
          >
            <!-- Header -->
            <div class="flex items-start gap-4 mb-6">
              <div class="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-[#22345F]">{{ caso.cliente }}</h3>
                <p class="text-sm text-[#4B5563]">{{ caso.local }}</p>
              </div>
            </div>
            
            <!-- Problema -->
            <div class="mb-4">
              <p class="text-xs font-semibold text-[#F49A1A] mb-2">PROBLEMA</p>
              <p class="text-sm text-[#4B5563]">{{ caso.problema }}</p>
            </div>
            
            <!-- Solução -->
            <div class="mb-4">
              <p class="text-xs font-semibold text-[#22345F] mb-2">SOLUÇÃO</p>
              <p class="text-sm text-[#4B5563]">{{ caso.solucao }}</p>
            </div>
            
            <!-- Resultado -->
            <div class="p-4 bg-[#E5EDF8] rounded-xl">
              <p class="text-xs font-semibold text-[#25D366] mb-2">RESULTADO</p>
              <p class="text-base font-bold text-[#22345F]">{{ caso.resultado }}</p>
            </div>
          </div>
        </div>
        
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-6 max-w-4xl">
        
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-[#22345F] mb-4">
            Perguntas Frequentes
          </h2>
          <p class="text-base md:text-lg text-[#4B5563]">
            Tire suas dúvidas sobre {{ servico.titulo.toLowerCase() }}
          </p>
        </div>
        
        <!-- Accordion FAQ -->
        <div class="space-y-4">
          <details
            v-for="(item, index) in servico.faq"
            :key="index"
            class="group bg-white rounded-2xl border-2 border-[#E5EDF8] hover:border-[#F49A1A] transition-all duration-300 overflow-hidden"
          >
            <summary class="flex items-center justify-between p-6 cursor-pointer list-none">
              <h3 class="text-base md:text-lg font-bold text-[#22345F] pr-4">
                {{ item.pergunta }}
              </h3>
              <svg class="w-6 h-6 text-[#F49A1A] flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <div class="px-6 pb-6">
              <p class="text-sm md:text-base text-[#4B5563] leading-relaxed">
                {{ item.resposta }}
              </p>
            </div>
          </details>
        </div>
        
        <!-- CTA Dúvidas FAQ -->
        <div class="text-center mt-12 p-8 bg-gradient-to-br from-[#E5EDF8] to-white rounded-2xl border-2 border-[#E5EDF8]">
          <p class="text-lg font-semibold text-[#22345F] mb-4">
            Ainda tem dúvidas?
          </p>
          <a
            :href="whatsappFaqUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
            data-cta-location="faq"
            data-gtm="servico-faq-whatsapp"
            @click="trackEvent('servico_whatsapp_clicked', { slug: servico.slug, origem: 'faq' })"
          >
            <WhatsappIcon class="w-6 h-6" />
            Fale com um Especialista
          </a>
        </div>
        
      </div>
    </section>

    <!-- CTA Final (Componente Modular) -->
    <ServicoCtaFinal
      :servico="servico"
      :whatsapp-url="whatsappFinalUrl"
      :reviews-url="GOOGLE_REVIEWS_URL"
      @whatsapp-click="(origem) => trackEvent('servico_whatsapp_clicked', { slug: servico.slug, origem })"
      @rating-click="trackEvent('servico_rating_clicked')"
    />
    
    <!-- Voltar para Home -->
    <section class="py-8 bg-white border-t-2 border-[#E5EDF8]">
      <div class="container mx-auto px-4 md:px-6 text-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-[#22345F] hover:text-[#F49A1A] font-semibold transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Voltar para página inicial
        </NuxtLink>
      </div>
    </section>
    
  </div>
</template>

<style scoped>
/* Animações suaves */
details[open] summary ~ * {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
