<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '#imports'
import { useServicos } from '~/composables/useServicos'
import { googleReviews, googleReviewsUrl, reviews } from '~/data/telas/reviews'
import MultiStepLeadForm from '~/components/funnel/MultiStepLeadForm.vue'

definePageMeta({ layout: false })

const { WHATSAPP_NUMBER } = useServicos()
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER || '5511983586611'}?text=${encodeURIComponent('Olá! Gostaria de um orçamento para telas mosquiteiras sob medida.')}`

useHead({
  title: 'Orçamento de Telas Mosquiteiras Sob Medida | AD Telas e Redes SP',
  meta: [
    { name: 'description', content: 'Solicite seu orçamento gratuito de telas mosquiteiras sob medida em menos de 1 minuto. Atendimento em todo o estado de SP.' },
    { name: 'robots', content: 'noindex, follow' },
    { property: 'og:title', content: 'Orçamento de Telas Mosquiteiras Sob Medida | AD Telas' },
    { property: 'og:description', content: 'Proteja sua família contra mosquitos e pernilongos com instalação profissional em SP.' },
    { property: 'og:url', content: 'https://www.adtelasmosquiteiras.com.br/lp/orcamento-telas-mosquiteiras' }
  ]
})

function scrollToForm() {
  const el = document.getElementById('formulario-orcamento')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const activeFaq = ref<number | null>(null)
function toggleFaq(index: number) {
  activeFaq.value = activeFaq.value === index ? null : index
}

const faqs = [
  {
    q: 'Preciso ter as medidas exatas para receber o orçamento?',
    a: 'Não! Você pode apenas informar a quantidade aproximada e nos enviar uma foto do vão pelo WhatsApp. Nossos técnicos orientam sobre o modelo ideal e validam as medidas na vistoria técnica.'
  },
  {
    q: 'As telas danificam ou alteram a esquadria original?',
    a: 'Não. Utilizamos perfis de alumínio sob medida com pintura eletrostática que se integram perfeitamente às suas esquadrias (branca, preta, bronze ou natural), sem estragar a estrutura.'
  },
  {
    q: 'Vocês atendem quais cidades e regiões?',
    a: 'Atendemos a Capital de São Paulo, Grande São Paulo, Litoral Paulista e Interior do Estado de SP com instalação profissional no local.'
  },
  {
    q: 'Qual é o prazo médio de instalação?',
    a: 'Após a aprovação do orçamento e validação das medidas, o tempo médio para fabricação e instalação sob medida varia entre 3 a 7 dias úteis.'
  }
]
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] text-[#22345F] font-sans antialiased selection:bg-[#F49A1A] selection:text-[#22345F]">
    <!-- Top Header -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3" aria-label="AD Telas e Redes">
          <img src="/images/logo-adt-lp.png" alt="AD Telas e Redes" width="96" height="48" class="h-10 sm:h-12 w-auto" />
          <div class="flex flex-col">
            <span class="font-extrabold text-sm sm:text-base tracking-tight text-[#22345F]">AD TELAS</span>
            <span class="text-[10px] font-semibold tracking-wider text-amber-600 uppercase">Orçamento Rápido</span>
          </div>
        </NuxtLink>

        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-200 transition-colors"
        >
          <Icon name="lucide:message-circle" class="w-4 h-4 text-emerald-600" />
          <span class="hidden sm:inline">WhatsApp Direto</span>
          <span class="sm:hidden">WhatsApp</span>
        </a>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-8 sm:pt-14 pb-12 sm:pb-20 overflow-hidden bg-gradient-to-b from-white via-amber-50/20 to-[#F8FAFC]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <!-- Textos do Hero -->
          <div class="lg:col-span-6 space-y-5 text-center lg:text-left">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-[#22345F] text-xs font-bold tracking-wide uppercase">
              <Icon name="lucide:shield-check" class="w-4 h-4 text-[#F49A1A]" />
              TELA MOSQUITEIRA SOB MEDIDA
            </div>

            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-[#22345F] tracking-tight leading-[1.15]">
              Proteja sua casa contra mosquitos com <span class="text-[#F49A1A]">telas sob medida</span>
            </h1>

            <p class="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Instalação profissional para janelas, portas e sacadas em todo o estado de São Paulo. Mantenha a ventilação natural com vedação impecável.
            </p>

            <!-- Prova Social no Hero -->
            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1">
              <a
                :href="googleReviewsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-amber-300 transition-all text-xs text-[#22345F]"
              >
                <div class="flex text-amber-500">
                  <Icon v-for="i in 5" :key="i" name="lucide:star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <span><strong>{{ googleReviews.rating }} no Google</strong> ({{ googleReviews.count }} avaliações)</span>
              </a>

              <div class="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-xs text-[#22345F]">
                <Icon name="lucide:award" class="w-4 h-4 text-[#F49A1A]" />
                <span>Garantia informada na proposta</span>
              </div>
            </div>

            <!-- Botões Hero -->
            <div class="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <button
                type="button"
                class="w-full sm:w-auto min-h-[52px] px-8 py-3.5 bg-[#F49A1A] hover:bg-[#e78b0e] text-[#22345F] font-extrabold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
                @click="scrollToForm"
              >
                <span>RECEBER MEU ORÇAMENTO</span>
                <Icon name="lucide:arrow-down" class="w-4 h-4" />
              </button>

              <a
                :href="whatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full sm:w-auto min-h-[52px] px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-2xl border-2 border-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Icon name="lucide:message-circle" class="w-4 h-4 text-emerald-600" />
                <span>Prefiro falar pelo WhatsApp</span>
              </a>
            </div>

            <p class="text-xs text-gray-500 flex items-center justify-center lg:justify-start gap-1.5">
              <Icon name="lucide:clock" class="w-3.5 h-3.5 text-gray-400" />
              Leva menos de 1 minuto. Sem compromisso.
            </p>
          </div>

          <!-- Formulário Multi-Step no Topo -->
          <div class="lg:col-span-6">
            <MultiStepLeadForm cta-location="lp_funnel_hero" />
          </div>
        </div>
      </div>
    </section>

    <!-- Como Funciona -->
    <section class="py-14 sm:py-20 bg-white border-y border-gray-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-widest">Processo Ágil</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#22345F] mt-1">
            Como funciona seu orçamento em 4 passos
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center font-bold text-base">
              1
            </div>
            <h3 class="font-bold text-[#22345F] text-base">Preencha o formulário</h3>
            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Responda perguntas simples sobre os vãos que você deseja proteger.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#F49A1A] text-[#22345F] flex items-center justify-center font-bold text-base">
              2
            </div>
            <h3 class="font-bold text-[#22345F] text-base">Envie fotos no WhatsApp</h3>
            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Fotografe as janelas e portas para identificarmos o modelo de esquadria correto.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#22345F] text-white flex items-center justify-center font-bold text-base">
              3
            </div>
            <h3 class="font-bold text-[#22345F] text-base">Receba o orçamento</h3>
            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Enviamos a proposta completa sem compromisso, com opções de cores e acabamentos.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
              4
            </div>
            <h3 class="font-bold text-[#22345F] text-base">Instalação sob medida</h3>
            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Nossa equipe instala rapidamente na sua residência com acabamento limpo.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Modelos e Aplicações -->
    <section class="py-14 sm:py-20 bg-[#F8FAFC]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-widest">Modelos Disponíveis</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#22345F] mt-1">
            Soluções completas para cada ambiente
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src="/images/janela_correr_aluminio_1.webp" alt="Tela de correr em janela" class="w-full h-48 object-cover" loading="lazy" decoding="async" />
            <div class="p-5 space-y-2">
              <span class="text-xs font-bold text-[#F49A1A] uppercase">Janelas</span>
              <h3 class="font-bold text-[#22345F] text-lg">Janelas de Correr e Maxim-ar</h3>
              <p class="text-xs text-gray-600 leading-relaxed">
                Deslizamento suave em perfis de alumínio ajustados à esquadria existente.
              </p>
            </div>
          </div>

          <div class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src="/images/porta_balcao_correr_1.webp" alt="Tela para portas" class="w-full h-48 object-cover" loading="lazy" decoding="async" />
            <div class="p-5 space-y-2">
              <span class="text-xs font-bold text-[#F49A1A] uppercase">Portas</span>
              <h3 class="font-bold text-[#22345F] text-lg">Portas Balcão e Passagem</h3>
              <p class="text-xs text-gray-600 leading-relaxed">
                Praticidade com trava e vedação inferior que resiste ao tráfego diário.
              </p>
            </div>
          </div>

          <div class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src="/images/sacada_envidracada_1.webp" alt="Tela para sacadas" class="w-full h-48 object-cover" loading="lazy" decoding="async" />
            <div class="p-5 space-y-2">
              <span class="text-xs font-bold text-[#F49A1A] uppercase">Sacadas</span>
              <h3 class="font-bold text-[#22345F] text-lg">Sacadas e Áreas Gourmet</h3>
              <p class="text-xs text-gray-600 leading-relaxed">
                Proteção ampla que mantém a vista panorâmica e a circulação de ar livre.
              </p>
            </div>
          </div>

          <div class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src="/images/telas_pet_screen_especificacoes.webp" alt="Tela Pet Screen" class="w-full h-48 object-cover" loading="lazy" decoding="async" />
            <div class="p-5 space-y-2">
              <span class="text-xs font-bold text-[#F49A1A] uppercase">Reforçada</span>
              <h3 class="font-bold text-[#22345F] text-lg">Tela Pet Screen para Pets</h3>
              <p class="text-xs text-gray-600 leading-relaxed">
                Malha reforçada resistente a unhas e arranhões de cães e gatos.
              </p>
            </div>
          </div>

          <div class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src="/images/tela-mosquiteira-removivel.webp" alt="Tela removível" class="w-full h-48 object-cover" loading="lazy" decoding="async" />
            <div class="p-5 space-y-2">
              <span class="text-xs font-bold text-[#F49A1A] uppercase">Removível</span>
              <h3 class="font-bold text-[#22345F] text-lg">Telas Removíveis</h3>
              <p class="text-xs text-gray-600 leading-relaxed">
                Fácil de retirar e recolocar para higienização periódica descomplicada.
              </p>
            </div>
          </div>

          <div class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src="/images/telas_para_banheiro.webp" alt="Tela para basculantes" class="w-full h-48 object-cover" loading="lazy" decoding="async" />
            <div class="p-5 space-y-2">
              <span class="text-xs font-bold text-[#F49A1A] uppercase">Banheiros</span>
              <h3 class="font-bold text-[#22345F] text-lg">Basculantes e Lavabos</h3>
              <p class="text-xs text-gray-600 leading-relaxed">
                Vedação em vãos pequenos e basculantes sem comprometer a exaustão de ar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Depoimentos Reais -->
    <section class="py-14 sm:py-20 bg-white border-y border-gray-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-10">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-widest">Avaliações Reais</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#22345F] mt-1">
            O que nossos clientes dizem
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(rev, idx) in reviews" :key="idx" class="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between space-y-4">
            <div class="space-y-2">
              <div class="flex text-amber-400">
                <Icon v-for="i in 5" :key="i" name="lucide:star" class="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <p class="text-sm text-gray-700 italic">"{{ rev.text }}"</p>
            </div>
            <div class="pt-3 border-t border-gray-200 flex items-center justify-between">
              <span class="font-bold text-sm text-[#22345F]">{{ rev.name }}</span>
              <span class="text-[11px] text-gray-500 font-medium">Cliente Google</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-14 sm:py-20 bg-[#F8FAFC]">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-widest">Tire suas Dúvidas</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#22345F] mt-1">
            Perguntas Frequentes
          </h2>
        </div>

        <div class="space-y-3">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
          >
            <button
              type="button"
              class="w-full p-5 text-left font-bold text-[#22345F] flex items-center justify-between gap-4 focus:outline-none"
              @click="toggleFaq(idx)"
            >
              <span>{{ faq.q }}</span>
              <Icon
                name="lucide:chevron-down"
                class="w-5 h-5 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': activeFaq === idx }"
              />
            </button>
            <div v-if="activeFaq === idx" class="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Final -->
    <section class="py-14 sm:py-16 bg-gradient-to-r from-[#22345F] to-[#1a294d] text-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
        <h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Pronto para deixar sua casa livre de mosquitos?
        </h2>
        <p class="text-gray-300 max-w-xl mx-auto text-sm sm:text-base">
          Preencha o formulário e receba uma estimativa gratuita feita por especialistas.
        </p>
        <div class="pt-2">
          <button
            type="button"
            class="px-8 py-4 bg-[#F49A1A] hover:bg-[#e78b0e] text-[#22345F] font-black text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all transform active:scale-95 inline-flex items-center gap-2"
            @click="scrollToForm"
          >
            <span>RECEBER MEU ORÇAMENTO AGORA</span>
            <Icon name="lucide:arrow-up" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>

    <!-- Rodapé -->
    <footer class="bg-gray-900 text-gray-400 py-10 text-xs">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span class="font-bold text-gray-200">AD Telas e Redes</span> · Especialistas em Telas Mosquiteiras e Redes de Proteção em SP.
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink to="/politica-de-privacidade" class="hover:text-white underline transition-colors">
            Política de Privacidade
          </NuxtLink>
          <span>·</span>
          <NuxtLink to="/" class="hover:text-white transition-colors">
            Início
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
