<script setup lang="ts">
import { computed } from 'vue'
import { relatedTelas } from '~/data/telas/related'
import ServiceImage from './ServiceImage.vue'
const props = defineProps<{ currentSlug: string }>()
const related = computed(() => relatedTelas.filter(item => item.slug !== props.currentSlug))
</script>
<template>
  <section class="td-section td-wrap"><p class="td-eyebrow">Conheça outros serviços</p><h2>Também podemos ajudar com:</h2><div class="td-related-grid"><NuxtLink v-for="item in related" :key="item.slug" :to="`/servicos/telas/${item.slug}`" data-cta-location="service_card" :data-service-key="item.key" :data-service-name="item.name"><ServiceImage :image="item.image" sizes="100px" /><div><h3>{{ item.name }}</h3><span>Saiba mais →</span></div></NuxtLink></div></section>
</template>
