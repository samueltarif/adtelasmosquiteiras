<script setup lang="ts">
import type { TelasService } from '~/data/telas/types'
defineProps<{ service: TelasService }>()
</script>
<template>
  <section id="orcamento-servico" class="td-section td-quote" data-cta-location="service_page"><div class="td-wrap td-quote-grid">
    <div><p class="td-eyebrow">Solicite seu orçamento</p><h2>{{ service.slug === 'restaurantes' ? 'Proteção para o seu negócio.' : 'Proteja sua casa hoje mesmo.' }}</h2><p>Fale com nossa equipe sobre {{ service.name.toLowerCase() }}. Vamos ajudar a encontrar a solução para seu ambiente.</p><a :href="service.whatsappUrl" class="td-button td-whatsapp" target="_blank" rel="noopener noreferrer"><WhatsappIcon /> Orçamento no WhatsApp</a><a href="tel:+5511983586611" class="td-phone"><Icon name="lucide:phone" /> (11) 98358-6611</a></div>
    <div class="td-form"><h3>Prefere um formulário?</h3><p>Preencha seus dados para receber nosso contato.</p><LeadForm variant="modal" :service-name="service.name" :service-key="service.key" /><p class="td-privacy">Ao enviar, consulte nossa <NuxtLink to="/politica-de-privacidade">Política de Privacidade</NuxtLink>.</p></div>
  </div></section>
</template>
