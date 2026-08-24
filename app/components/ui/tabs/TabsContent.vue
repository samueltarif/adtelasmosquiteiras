<script setup lang="ts">
import { TabsContent } from 'radix-vue'
import { cn } from '../../../lib/utils'

interface Props {
  value: string
  asChild?: boolean
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <TabsContent
    :value="props.value"
    :as-child="props.asChild"
    :class="
      cn(
        'mt-2 ring-offset-background focus-visible:outline-none',
        props.class
      )
    "
  >
    <slot />
  </TabsContent>
</template>
