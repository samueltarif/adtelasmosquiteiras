<script setup lang="ts">
import { TabsList } from 'radix-vue'
import { cn } from '../../../lib/utils'

interface Props {
  loop?: boolean
  asChild?: boolean
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <TabsList
    :loop="props.loop"
    :as-child="props.asChild"
    :class="
      cn(
        'inline-flex h-11 items-center justify-start rounded-xl bg-white/[0.03] p-1 text-slate-400 border border-white/[0.06]',
        props.class
      )
    "
  >
    <slot />
  </TabsList>
</template>
