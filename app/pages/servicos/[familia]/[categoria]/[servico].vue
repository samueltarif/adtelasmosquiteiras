<script setup>
import { useServicos } from '~/composables/useServicos'

// ============================================
// ROUTE & DATA
// ============================================
const route = useRoute()
const { getServicoBySlug, getWhatsAppUrl, GOOGLE_REVIEWS_URL } = useServicos()

// Buscar serviço pelo slug (familia/categoria/servico)
const servico = getServicoBySlug(
  route.params.familia,
  route.params.categoria,
  route.params.servico
)

// Se serviço não encontrado, redirecionar para página de serviços
if (!servico) {
  navigateTo('/servicos')
}

// ============================================
// SEO & META TAGS
// ============================================
useHead({
  title: servico.metaTitle,
  meta: [
    { name: 'description', content: servico.metaDescription },
    { name: 'keywords', content: servico.keywords.join(', ') },
    { property: 'og:title', content: servico.metaTitle },
    { property: 'og:description', content: servico.metaDescription },
    { property: 'og:image', content: servico.imagem },
    { property: 'og:type', content: 'website' }
  ]
})

// ============================================
// MÉTODOS
// ============================================
const scrollToContact = () => {
  const element = document.getElementById('contato-final')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const openWhatsApp = (origem = 'hero') => {
  const url = getWhatsAppUrl(servico.familia, servico.categoria, servico.slug)
  
  // GA4 Event
  trackEvent('servico_whatsapp_clicked', {
    familia: servico.familia,
    categoria: servico.categoria,
    servico: servico.slug,
    origem
  })
  
  window.open(url, '_blank')
}

// Função para tracking de eventos
const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params
    })
  }
}

// GA4 Page View
onMounted(() => {
  trackEvent('servico_page_view', {
    familia: servico.familia,
    categoria: servico.categoria,
    servico: servico.slug
  })
})

// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  console.log('🟢 [SERVICO] openFormModal() chamado')
  console.log('🟢 [SERVICO] showFormModal antes:', showFormModal.value)
  showFormModal.value = true
  console.log('🟢 [SERVICO] showFormModal depois:', showFormModal.value)
}
</script>

<template>
  <div class="min-h-screen bg-white">
    
    <!-- ============================================ -->
    <!-- BREADCRUMB -->
    <!-- ============================================ -->
    <Breadcrumb />
    
    <!-- ============================================ -->
    <!-- 1. HERO ESPECÍFICO DO SERVIÇO -->
    <!-- ============================================ -->
    <section class="relative bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white py-16 md:py-24 overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>
      
      <div class="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          
          <!-- Conteúdo -->
          <div>
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Icon name="lucide:check-circle" class="w-4 h-4" />
              {{ servico.destaque }}
            </div>
            
            <!-- Título -->
            <h1 class="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {{ servico.titulo }} em São Paulo
            </h1>
            
            <!-- Descrição -->
            <p class="text-lg md:text-xl text-white/90 mb-8">
              {{ servico.descricaoCurta }}
            </p>
            
            <!-- Diferenciais -->
            <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8">
              <div class="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366]" />
                  <span class="text-white font-semibold">Instalação em 48h</span>
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
            
            <!-- CTA Principal -->
            <div class="flex flex-col sm:flex-row gap-4">
              <button
                @click="openWhatsApp('hero')"
                class="flex-1 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
                data-gtm="servico-hero-whatsapp"
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                </svg>
                Orçamento Grátis
              </button>
              
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
                :src="servico.imagem"
                :alt="servico.titulo"
                class="w-full h-auto"
                loading="eager"
              />
            </div>
            
            <!-- Badge Flutuante -->
            <div class="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                  <Icon name="lucide:check-circle" class="w-6 h-6 text-white" />
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


    <!-- ============================================ -->
    <!-- 2. POR QUE NOSSA [SERVIÇO] -->
    <!-- ============================================ -->
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


    <!-- ============================================ -->
    <!-- 3. ESPECIFICAÇÕES TÉCNICAS -->
    <!-- ============================================ -->
    <section class="py-16 md:py-24 bg-gradient-to-b from-white to-[#F9FAFB]">
      <div class="container mx-auto px-4 md:px-6 max-w-7xl">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          
          <!-- Imagem Demo -->
          <div class="order-2 md:order-1">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                :src="servico.imagemEspecificacoes || servico.imagem"
                :alt="`${servico.titulo} - especificações técnicas`"
                class="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
          
          <!-- Especificações Técnicas -->
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
            
            <!-- CTA -->
            <button
              @click="openWhatsApp('especificacoes')"
              class="mt-8 w-full px-8 py-4 bg-[#F49A1A] text-white rounded-xl font-bold text-lg hover:bg-[#d88715] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              data-gtm="servico-specs-whatsapp"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
              </svg>
              Solicitar Orçamento Detalhado
            </button>
          </div>
          
        </div>
      </div>
    </section>


    <!-- ============================================ -->
    <!-- 4. COMPARAÇÃO: NÓS VS CONCORRENTES -->
    <!-- ============================================ -->
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
              <Icon name="lucide:check-circle" class="w-6 h-6 md:w-8 md:h-8 text-[#25D366]" />
            </div>
            <div class="p-4 md:p-6 flex items-center justify-center border-l-2 border-[#E5EDF8]">
              <Icon name="lucide:x-circle" class="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            </div>
          </div>
        </div>
        
        <!-- CTA -->
        <div class="text-center mt-8">
          <button
            @click="openWhatsApp('comparacao')"
            class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
            data-gtm="servico-comparacao-whatsapp"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
            </svg>
            Quero a Melhor Opção!
          </button>
        </div>
        
      </div>
    </section>


    <!-- ============================================ -->
    <!-- 5. FAQ ESPECÍFICA -->
    <!-- ============================================ -->
    <section class="py-16 md:py-24 bg-gradient-to-b from-[#F9FAFB] to-white">
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
              <Icon name="lucide:chevron-down" class="w-6 h-6 text-[#F49A1A] flex-shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div class="px-6 pb-6">
              <p class="text-sm md:text-base text-[#4B5563] leading-relaxed">
                {{ item.resposta }}
              </p>
            </div>
          </details>
        </div>
        
        <!-- CTA Dúvidas -->
        <div class="text-center mt-12 p-8 bg-gradient-to-br from-[#E5EDF8] to-white rounded-2xl border-2 border-[#E5EDF8]">
          <p class="text-lg font-semibold text-[#22345F] mb-4">
            Ainda tem dúvidas?
          </p>
          <button
            @click="openWhatsApp('faq')"
            class="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#1fb854] transition-all duration-300 shadow-lg"
            data-gtm="servico-faq-whatsapp"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
            </svg>
            Fale com um Especialista
          </button>
        </div>
        
      </div>
    </section>


    <!-- ============================================ -->
    <!-- 6. CTA FINAL AGRESSIVO -->
    <!-- ============================================ -->
    <section id="contato-final" class="py-16 md:py-24 bg-gradient-to-br from-[#22345F] via-[#1a2847] to-[#22345F] text-white relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>
      
      <div class="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
        
        <div class="text-center">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 bg-[#F49A1A] px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Icon name="lucide:clock" class="w-4 h-4" />
            Oferta por tempo limitado
          </div>
          
          <!-- Título -->
          <h2 class="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Proteja sua família HOJE!<br/>
            Instalação em 48h
          </h2>
          
          <!-- Descrição -->
          <p class="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Não espere acontecer um acidente. Garanta a segurança do seu lar com {{ servico.titulo.toLowerCase() }} de qualidade premium.
          </p>
          
          <!-- Benefícios Rápidos -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
            <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <Icon name="lucide:check-circle" class="w-6 h-6 text-[#25D366]" />
              <span class="font-semibold">Orçamento Grátis</span>
            </div>
            <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <Icon name="lucide:check-circle" class="w-6 h-6 text-[#25D366]" />
              <span class="font-semibold">Instalação 48h</span>
            </div>
            <div class="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <Icon name="lucide:check-circle" class="w-6 h-6 text-[#25D366]" />
              <span class="font-semibold">Garantia 2 Anos</span>
            </div>
          </div>
          
          <!-- CTA Principal -->
          <button
            @click="openWhatsApp('cta-final')"
            class="inline-flex items-center gap-3 px-10 py-5 bg-[#25D366] text-white rounded-2xl font-bold text-xl hover:bg-[#1fb854] transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 mb-6"
            data-gtm="servico-cta-final-whatsapp"
          >
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
            </svg>
            Solicitar Orçamento GRÁTIS Agora
          </button>
          
          <!-- Prova Social -->
          <div class="flex items-center justify-center gap-6 text-sm text-white/80">
            <div class="flex items-center gap-2">
              <Icon name="lucide:star" class="w-5 h-5 text-[#F49A1A]" />
              <span>500+ clientes satisfeitos</span>
            </div>
            <a
              :href="GOOGLE_REVIEWS_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group"
              data-gtm="servico-rating-clicked"
            >
              <span class="font-semibold group-hover:underline">Nota 5.0</span>
              <!-- 5 Estrelinhas -->
              <div class="flex gap-0.5">
                <Icon v-for="i in 5" :key="i" name="lucide:star" class="w-4 h-4 text-[#F49A1A] fill-current" />
              </div>
            </a>
          </div>
          
        </div>
        
      </div>
    </section>
    
    <!-- Voltar -->
    <section class="py-8 bg-white border-t-2 border-[#E5EDF8]">
      <div class="container mx-auto px-4 md:px-6 text-center">
        <NuxtLink
          :to="`/servicos/${servico.familia}/${servico.categoria}`"
          class="inline-flex items-center gap-2 text-[#22345F] hover:text-[#F49A1A] font-semibold transition-colors"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
          Voltar para {{ servico.categoriaTitulo }}
        </NuxtLink>
      </div>
    </section>

    <!-- Mobile Unified CTA -->
    <MobileUnifiedCTA
      :servico-atual="servico.titulo"
      :msg-padrao="`Olá! Gostaria de um orçamento para ${servico.titulo}.`"
      @open-form="openFormModal"
    />

    <!-- Modal de Formulário -->
    <StickyFormModal v-model="showFormModal" />
    
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
