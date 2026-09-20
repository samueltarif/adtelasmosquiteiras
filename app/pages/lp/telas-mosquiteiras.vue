<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

definePageMeta({ layout: false })

const { WHATSAPP_NUMBER } = useServicos()
const { track, startForm } = useLandingTracking()
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de um orçamento para telas mosquiteiras sob medida. Vim pela página https://www.adtelasmosquiteiras.com.br/lp/telas-mosquiteiras')}`
const formVisible = ref(false)
let formObserver

useHead({
  title: 'Telas Mosquiteiras Sob Medida | Orçamento | AD Telas',
  meta: [
    { name: 'description', content: 'Telas mosquiteiras sob medida em São Paulo. Escolha janelas, portas, sacadas, removíveis, Pet Screen ou restaurantes e peça seu orçamento gratuito.' },
    { name: 'robots', content: 'noindex, follow' },
    { property: 'og:title', content: 'Telas Mosquiteiras Sob Medida | AD Telas' },
    { property: 'og:description', content: 'Escolha onde instalar e solicite seu orçamento gratuito para telas mosquiteiras em São Paulo.' },
    { property: 'og:url', content: 'https://www.adtelasmosquiteiras.com.br/lp/telas-mosquiteiras' }
  ]
  // app.vue supplies the canonical without campaign parameters.
})

const services = [
  { slug: 'janelas', title: 'Telas para Janelas', detail: 'Correr, basculantes e mais', icon: 'lucide:layout-grid', key: 'telas_janelas' },
  { slug: 'portas', title: 'Telas para Portas', detail: 'Portas balcão e acessos', icon: 'lucide:door-open', key: 'telas_portas' },
  { slug: 'sacadas-e-varandas', title: 'Sacadas e Varandas', detail: 'Proteção contra insetos', icon: 'lucide:sun', key: 'telas_sacadas' },
  { slug: 'removivel', title: 'Telas Removíveis', detail: 'Encaixe e retirada prática', icon: 'lucide:move', key: 'telas_removiveis' },
  { slug: 'pet-screen', title: 'Pet Screen', detail: 'Ambientes com animais', icon: 'lucide:paw-print', key: 'pet_screen' },
  { slug: 'restaurantes', title: 'Restaurantes e Cozinhas', detail: 'Ambientes comerciais', icon: 'lucide:utensils', key: 'telas_restaurantes' }
]

function scrollTo(id) {
  const target = document.getElementById(id)
  target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  target?.focus({ preventScroll: true })
}

function quote(location) {
  track('quote_cta_click', { cta_location: location, destination_url: '#orcamento-telas' })
  scrollTo('lp-quote')
}

onMounted(() => {
  track('landing_view')
  const form = document.getElementById('orcamento-telas')
  if (form && 'IntersectionObserver' in window) {
    formObserver = new IntersectionObserver(([entry]) => { formVisible.value = entry.isIntersecting }, { threshold: 0 })
    formObserver.observe(form)
  }
})
onUnmounted(() => formObserver?.disconnect())
</script>

<template>
  <div class="lp-shell min-h-screen bg-[#F8FAFC] font-sans text-[#22345F] leading-relaxed">
    <a href="#lp-main" class="sr-only focus:not-sr-only focus:block focus:p-4 focus:bg-white">Pular para o conteúdo</a>
    <header class="bg-white border-b border-[#E5EDF8]" data-cta-location="lp_header">
      <div class="max-w-6xl mx-auto px-5 h-[72px] flex items-center justify-between gap-4">
        <img src="/images/logo-adt-lp.png" alt="AD Telas e Redes" width="112" height="56" class="w-28 h-14 object-contain" fetchpriority="high" />
        <a href="#orcamento-telas" class="lp-link text-sm font-bold" @click.prevent="quote('lp_header')">Pedir orçamento <span aria-hidden="true">↗</span></a>
      </div>
    </header>

    <main id="lp-main">
      <div class="max-w-6xl mx-auto lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:items-start lg:px-6 lg:py-12">
        <section class="px-5 pt-6 pb-7 lg:p-0" aria-labelledby="lp-title" data-cta-location="lp_hero">
          <span class="inline-block rounded-full bg-[#FFF0D9] px-3 py-1 text-xs font-bold tracking-wide">Telas Sob Medida</span>
          <h1 id="lp-title" class="mt-3 text-[32px] leading-[1.1] font-bold tracking-tight sm:text-4xl lg:text-5xl">Telas Mosquiteiras<br><span class="text-[#22345F]">Sob Medida</span></h1>
          <p class="mt-3 text-base text-slate-600 max-w-lg">Para janelas, portas, sacadas e outros ambientes. Instalação profissional em São Paulo.</p>
          <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            <span class="inline-flex items-center gap-1.5"><Icon name="lucide:check" class="h-4 w-4" />Sob medida</span>
            <span class="inline-flex items-center gap-1.5"><Icon name="lucide:check" class="h-4 w-4" />Orçamento gratuito</span>
          </div>
          <a href="#lp-services" class="lp-primary mt-5 w-full sm:w-auto" @click.prevent="scrollTo('lp-services')">Escolher minha tela <Icon name="lucide:arrow-down" class="h-5 w-5" /></a>
          <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="lp-link mt-2 sm:ml-3 flex justify-center sm:justify-start gap-2 text-sm font-semibold"><WhatsappIcon class="h-5 w-5" />Falar pelo WhatsApp</a>
        </section>

        <section id="lp-services" tabindex="-1" class="px-5 pb-7 lg:p-0 scroll-mt-4 focus:outline-none" aria-labelledby="lp-services-title">
          <h2 id="lp-services-title" class="text-sm font-bold tracking-wider">ONDE VOCÊ PRECISA INSTALAR?</h2>
          <p class="mt-1 mb-4 text-sm text-slate-600">Escolha uma opção para ver modelos e detalhes.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NuxtLink v-for="service in services" :key="service.slug" :to="`/servicos/telas/${service.slug}`" :data-service-key="service.key" :data-service-name="service.title" data-cta-location="service_card" class="lp-service group flex items-center gap-3 rounded-2xl border border-[#D7E1EF] bg-white px-4 py-3 hover:border-[#22345F] hover:shadow-sm" @click="track('service_card_click', { service: service.slug, destination_url: `/servicos/telas/${service.slug}` })">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF2FA]"><Icon :name="service.icon" class="h-5 w-5" /></span>
              <span class="min-w-0 flex-1"><span class="block text-base font-bold leading-tight">{{ service.title }}</span><span class="block mt-1 text-sm text-slate-600">{{ service.detail }}</span></span>
              <span class="shrink-0 text-sm font-semibold" aria-hidden="true">Ver →</span>
            </NuxtLink>
          </div>
        </section>
      </div>

      <section class="border-y border-[#E5EDF8] bg-white px-5 py-6" aria-labelledby="lp-trust-title">
        <div class="max-w-6xl mx-auto">
          <h2 id="lp-trust-title" class="text-lg font-bold mb-4">Por que escolher a AD Telas?</h2>
          <ul class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-700">
            <li class="flex gap-2"><Icon name="lucide:ruler" class="h-5 w-5 shrink-0" />Instalação sob medida</li>
            <li class="flex gap-2"><Icon name="lucide:message-circle" class="h-5 w-5 shrink-0" />Orçamento gratuito</li>
            <li class="flex gap-2"><Icon name="lucide:map-pin" class="h-5 w-5 shrink-0" />Atendimento em São Paulo</li>
            <li class="flex gap-2"><Icon name="lucide:wrench" class="h-5 w-5 shrink-0" />Instalação profissional</li>
          </ul>
        </div>
      </section>

      <section id="lp-quote" tabindex="-1" class="max-w-xl mx-auto px-5 py-8 scroll-mt-4 focus:outline-none" @focusin="startForm">
        <LandingQuoteForm :show-trust-badges="false" cta-location="lp_form" description="Informe onde deseja instalar. Nossa equipe retorna pelo WhatsApp." />
      </section>

      <section class="px-5 pb-7 text-center" aria-labelledby="lp-contact-title" data-cta-location="lp_bottom">
        <h2 id="lp-contact-title" class="text-lg font-bold">Prefere conversar com a equipe?</h2>
        <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="lp-whatsapp mt-3"><WhatsappIcon class="h-5 w-5" />Falar pelo WhatsApp</a>
        <p class="mt-2"><a :href="`tel:+${WHATSAPP_NUMBER}`" class="lp-link text-sm underline underline-offset-4">Ou ligue: (11) 98358-6611</a></p>
      </section>
    </main>

    <footer class="border-t border-[#E5EDF8] px-5 py-6 text-center text-sm text-slate-600">
      <p class="font-semibold text-[#22345F]">AD Telas e Redes · São Paulo</p>
      <NuxtLink to="/politica-de-privacidade" class="lp-link underline underline-offset-4">Política de Privacidade</NuxtLink>
    </footer>

    <div v-show="!formVisible" class="lp-sticky sm:hidden fixed inset-x-0 bottom-0 border-t border-[#E5EDF8] bg-white px-4 pt-2 z-30" data-cta-location="lp_sticky">
      <a href="#orcamento-telas" class="lp-primary w-full" @click.prevent="quote('lp_sticky')">Pedir orçamento gratuito</a>
    </div>
  </div>
</template>

<style scoped>
.lp-shell { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
.lp-primary, .lp-whatsapp { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-weight: 700; background: #f49a1a; color: #22345f; }
.lp-whatsapp { background: #25d366; color: #12351f; }
.lp-link { display: inline-flex; min-height: 44px; align-items: center; }
.lp-service { min-height: 96px; }
.lp-sticky { padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
.lp-shell :is(a, button):focus-visible { outline: 3px solid #22345f; outline-offset: 3px; }
@media (min-width: 640px) { .lp-shell { padding-bottom: 0; } }
@media (prefers-reduced-motion: reduce) { .lp-shell { scroll-behavior: auto; } }
</style>
