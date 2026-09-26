<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { TelasService, ServiceImage } from '~/data/telas/types'
import ServiceImageComp from './ServiceImage.vue'

const props = defineProps<{ service: TelasService }>()

const heroSlides = computed<ServiceImage[]>(() => {
  const slides: ServiceImage[] = []
  const seen = new Set<string>()

  const add = (img?: ServiceImage | null) => {
    if (img && img.src && !seen.has(img.src)) {
      seen.add(img.src)
      slides.push(img)
    }
  }

  add(props.service.hero)
  if (Array.isArray(props.service.gallery)) {
    for (const g of props.service.gallery) add(g)
  }
  if (Array.isArray(props.service.models)) {
    for (const m of props.service.models) {
      if (m.image) add(m.image)
    }
  }

  return slides.length ? slides : (props.service.hero ? [props.service.hero] : [])
})

const currentSlideIndex = ref(0)
let slideTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (heroSlides.value.length > 1) {
    slideTimer = setInterval(() => {
      currentSlideIndex.value = (currentSlideIndex.value + 1) % heroSlides.value.length
    }, 4000)
  }
})

onUnmounted(() => {
  if (slideTimer) {
    clearInterval(slideTimer)
    slideTimer = null
  }
})

const formattedTitle = computed(() => {
  const title = props.service.title
  if (title.includes(' Sob Medida em São Paulo')) {
    const parts = title.split(' Sob Medida em São Paulo')
    return `${parts[0]} <span>Sob Medida em São Paulo</span>`
  }
  if (title.includes(' Sob Medida em SP')) {
    const parts = title.split(' Sob Medida em SP')
    return `${parts[0]} <span>Sob Medida em São Paulo</span>`
  }
  if (title.includes(' em São Paulo')) {
    const parts = title.split(' em São Paulo')
    return `${parts[0]} <span>em São Paulo</span>`
  }
  if (title.includes(' em SP')) {
    const parts = title.split(' em SP')
    return `${parts[0]} <span>em São Paulo</span>`
  }
  if (title.includes(' Sob Medida')) {
    const parts = title.split(' Sob Medida')
    return `${parts[0]} <span>Sob Medida${parts[1] || ''}</span>`
  }
  return title
})
</script>

<template>
  <section id="service-hero" class="td-hero" data-cta-location="hero">
    <div class="td-hero-bg">
      <div
        v-for="(slide, idx) in heroSlides"
        :key="slide.src"
        class="td-hero-slide"
        :class="{ 'is-active': idx === currentSlideIndex }"
      >
        <ServiceImageComp :image="slide" :eager="idx === 0" sizes="100vw lg:1200px" />
      </div>
    </div>
    <div class="td-wrap td-hero-grid">
      <div class="td-hero-copy">
        <nav class="td-hero-breadcrumbs" aria-label="Navegação estrutural">
          <NuxtLink to="/">Início</NuxtLink>
          <span aria-hidden="true">›</span>
          <NuxtLink to="/servicos/telas">Telas</NuxtLink>
          <span aria-hidden="true">›</span>
          <span class="td-current">{{ service.name.replace('Telas Mosquiteiras para ', '').replace('Telas Mosquiteiras ', '') }}</span>
        </nav>
        <p class="td-eyebrow">{{ service.eyebrow }}</p>
        <h1 v-html="formattedTitle"></h1>
        <p class="td-hero-description">{{ service.description }}</p>
        <div class="td-actions">
          <a :href="service.whatsappUrl" class="td-button td-whatsapp td-hero-cta" target="_blank" rel="noopener noreferrer">
            <WhatsappIcon /> Chame no WhatsApp <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
