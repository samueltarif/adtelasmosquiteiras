<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { TelasService } from '~/data/telas/types'
import ServiceHeader from './ServiceHeader.vue'
import ServiceHero from './ServiceHero.vue'
import ServiceProjectGallery from './ServiceProjectGallery.vue'
import ServiceModels from './ServiceModels.vue'
import ServiceBenefits from './ServiceBenefits.vue'
import ServiceProcess from './ServiceProcess.vue'
import ServiceQuoteCTA from './ServiceQuoteCTA.vue'
import ServiceTestimonials from './ServiceTestimonials.vue'
import ServiceFAQ from './ServiceFAQ.vue'
import RelatedServices from './RelatedServices.vue'
import ServiceFooter from './ServiceFooter.vue'
const props = defineProps<{ service: TelasService }>()
const hideFloating = ref(false)
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => { hideFloating.value = !!entry?.isIntersecting })
  const quote = document.getElementById('orcamento-servico')
  if (quote) observer.observe(quote)
})
onUnmounted(() => observer?.disconnect())
useHead(() => ({
  ...props.service.seo,
  script: [{ type: 'application/ld+json', key: 'telas-service', innerHTML: JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Service', name: props.service.name,
    description: props.service.description, serviceType: props.service.name,
    url: `https://www.adtelasmosquiteiras.com.br/servicos/telas/${props.service.slug}`,
    provider: { '@type': 'Organization', name: 'AD Telas e Redes', url: 'https://www.adtelasmosquiteiras.com.br' },
    areaServed: { '@type': 'City', name: 'São Paulo' }
  }) }]
}))
</script>
<template>
  <div class="telas-detail" :data-service-key="service.key" :data-service-name="service.name">
    <a class="td-skip" href="#service-content">Ir para o conteúdo</a>
    <ServiceHeader :service="service" />
    <main id="service-content">
      <ServiceHero :service="service" />
      <Suspense><ServiceProjectGallery :service="service" /></Suspense>
      <ServiceModels :service="service" />
      <ServiceBenefits :service="service" />
      <ServiceProcess :steps="service.process" />
      <ServiceQuoteCTA :service="service" />
      <ServiceTestimonials />
      <ServiceFAQ :service="service" />
      <RelatedServices :current-slug="service.slug" />
    </main>
    <ServiceFooter :service="service" />
    <a v-show="!hideFloating" :href="service.whatsappUrl" class="td-floating" data-cta-location="floating_whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Fale agora no WhatsApp" title="Fale agora no WhatsApp">
      <svg class="td-floating-badge" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="49" fill="#25D366" />
        <defs>
          <path id="td-fale-arc" d="M 19,50 A 31,31 0 0,1 81,50" fill="none" />
        </defs>
        <text fill="#ffffff" font-size="8.5" font-weight="900" font-family="'Inter', system-ui, -apple-system, sans-serif" letter-spacing="0.08em">
          <textPath href="#td-fale-arc" startOffset="50%" text-anchor="middle">FALE AGORA</textPath>
        </text>
        <g transform="translate(28, 33) scale(1.85)">
          <path fill="#ffffff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
        </g>
      </svg>
    </a>
  </div>
</template>
<style src="~/assets/css/telas-detail.css"></style>
