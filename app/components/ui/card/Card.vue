<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl text-white shadow-sm transition-all',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
