<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <tr
    :class="
      cn(
        'border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] data-[state=selected]:bg-white/[0.04]',
        props.class
      )
    "
  >
    <slot />
  </tr>
</template>
