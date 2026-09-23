<script setup lang="ts">
import type { TelasService } from '~/data/telas/types'
defineProps<{ service: TelasService }>()
const icons = ['lucide:ruler', 'lucide:panels-top-left', 'lucide:hand', 'lucide:shield-check', 'lucide:wrench']
</script>
<template>
  <section id="detalhes" class="td-section td-tint"><div class="td-wrap">
    <p class="td-eyebrow">Detalhes que fazem a diferença</p><h2>Mais qualidade em cada detalhe</h2>
    <div class="td-benefit-grid"><article v-for="(item,i) in service.benefits" :key="item.title"><Icon :name="icons[i % icons.length]!" /><h3>{{ item.title }}</h3><p>{{ item.description }}</p></article></div>
    <aside v-if="service.technical.length" class="td-technical"><h3>Entenda a função do produto</h3><div v-for="item in service.technical" :key="item.title"><strong>{{ item.title }}</strong><p>{{ item.description }}</p></div><NuxtLink v-if="service.slug === 'pet-screen'" to="/servicos/redes/gatos-e-pets" class="td-text-link">Conheça as redes de proteção para pets →</NuxtLink></aside>
  </div></section>
</template>
