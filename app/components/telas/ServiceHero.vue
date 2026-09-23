<script setup lang="ts">
import type { TelasService } from '~/data/telas/types'
import ServiceImage from './ServiceImage.vue'
defineProps<{ service: TelasService }>()
</script>

<template>
  <section id="service-hero" class="td-hero" data-cta-location="hero">
    <div class="td-wrap td-hero-grid">
      <div class="td-hero-copy">
        <p class="td-eyebrow">{{ service.eyebrow }}</p>
        <h1>{{ service.title }}</h1>
        <p class="td-hero-description">{{ service.description }}</p>
        <div class="td-actions">
          <a :href="service.whatsappUrl" class="td-button td-gold" target="_blank" rel="noopener noreferrer"><WhatsappIcon /> Orçamento no WhatsApp <span aria-hidden="true">→</span></a>
          <a href="#orcamento-servico" class="td-button td-outline"><Icon name="lucide:clipboard-list" /> Solicitar Orçamento</a>
        </div>
        <ul class="td-hero-benefits"><li><Icon name="lucide:shield-check" /> Proteção contra insetos</li><li><Icon name="lucide:wind" /> Mais ventilação</li><li><Icon name="lucide:ruler" /> Feito sob medida</li></ul>
      </div>
      <div class="td-hero-photo"><ServiceImage :image="service.hero" eager sizes="(min-width: 1024px) 50vw, 100vw" /><span class="td-photo-note"><Icon name="lucide:house" /> Conforto para o seu ambiente</span></div>
    </div>
  </section>
</template>
