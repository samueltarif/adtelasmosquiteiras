<script setup lang="ts">
import type { TelasService } from '~/data/telas/types'
import ServiceImage from './ServiceImage.vue'
import ServiceModelDiagram from './ServiceModelDiagram.vue'
defineProps<{ service: TelasService }>()
</script>
<template>
  <section id="modelos" class="td-section td-wrap">
    <div class="td-section-heading"><div><p class="td-eyebrow">Modelos e aplicações</p><h2>Soluções para cada necessidade</h2></div><p>O modelo é definido conforme o vão e a rotina do ambiente.</p></div>
    <div class="td-model-grid" :class="{ 'td-single-model': service.models.length === 1 }">
      <article v-for="model in service.models" :key="model.title" class="td-model-card">
        <ServiceImage v-if="model.image" :image="model.image" /><ServiceModelDiagram v-else-if="model.diagram" :kind="model.diagram" /><div><h3>{{ model.title }}</h3><p>{{ model.description }}</p><span class="td-model-highlight"><Icon name="lucide:circle-check" /> {{ model.highlight }}</span></div>
      </article>
    </div>
  </section>
</template>
