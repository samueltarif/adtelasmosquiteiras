<script setup lang="ts">
import type { ServiceText } from '~/data/telas/types'
defineProps<{ steps: ServiceText[] }>()
</script>
<template>
  <section class="td-process"><div class="td-wrap td-process-layout"><div><p class="td-eyebrow">Do orçamento à instalação</p><h2>Como funciona</h2><p>Entre em contato para começar.</p></div><ol><li v-for="(step,index) in steps" :key="step.title"><span>{{ index + 1 }}</span><div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></div></li></ol></div></section>
</template>
