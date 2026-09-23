<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { TelasService } from '~/data/telas/types'
import ServiceHeader from './ServiceHeader.vue'
import ServiceHero from './ServiceHero.vue'
import ServiceTrustBar from './ServiceTrustBar.vue'
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
    <div class="td-breadcrumb"><Breadcrumb :items="service.breadcrumbs" /></div>
    <main id="service-content">
      <ServiceHero :service="service" />
      <ServiceTrustBar />
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
    <a v-show="!hideFloating" :href="service.whatsappUrl" class="td-floating" data-cta-location="floating_whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Orçamento no WhatsApp"><WhatsappIcon /><span>Falar no WhatsApp</span></a>
  </div>
</template>
<style src="~/assets/css/telas-detail.css"></style>
