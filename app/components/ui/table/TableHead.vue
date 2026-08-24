<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <th
    :class="
      cn(
        'h-10 px-3 text-left align-middle font-semibold text-slate-400 uppercase tracking-wider [&:has([role=checkbox])]:pr-0',
        props.class
      )
    "
  >
    <slot />
  </th>
</template>
