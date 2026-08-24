<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <tbody :class="cn('[&_tr:last-child]:border-0 divide-y divide-white/[0.03]', props.class)">
    <slot />
  </tbody>
</template>
