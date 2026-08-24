<script setup lang="ts">
import { Separator } from 'radix-vue'
import { cn } from '../../../lib/utils'

interface Props {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  asChild?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true
})
</script>

<template>
  <Separator
    :orientation="props.orientation"
    :decorative="props.decorative"
    :as-child="props.asChild"
    :class="
      cn(
        'shrink-0 bg-white/[0.06]',
        props.orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        props.class
      )
    "
  />
</template>
