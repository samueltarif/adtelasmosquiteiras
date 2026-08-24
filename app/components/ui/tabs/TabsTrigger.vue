<script setup lang="ts">
import { TabsTrigger } from 'radix-vue'
import { cn } from '../../../lib/utils'

interface Props {
  value: string
  disabled?: boolean
  asChild?: boolean
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <TabsTrigger
    :value="props.value"
    :disabled="props.disabled"
    :as-child="props.asChild"
    :class="
      cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-indigo-600/30 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/40 data-[state=active]:shadow-lg',
        props.class
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>
