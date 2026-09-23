<script setup lang="ts">
import type { TelasService } from '~/data/telas/types'
defineProps<{ service: TelasService }>()
</script>
<template>
  <section id="duvidas" class="td-section td-wrap td-faq-layout"><div><p class="td-eyebrow">Dúvidas frequentes</p><h2>{{ service.name }}</h2></div><div><details v-for="faq in service.faq" :key="faq.pergunta"><summary>{{ faq.pergunta }}<Icon name="lucide:chevron-down" /></summary><p>{{ faq.resposta }}</p></details></div></section>
</template>
