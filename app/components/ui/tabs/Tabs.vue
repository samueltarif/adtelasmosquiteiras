<script setup lang="ts">
import { TabsRoot, useForwardPropsEmits } from 'radix-vue'
import { cn } from '../../../lib/utils'

interface Props {
  defaultValue?: string
  modelValue?: string
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  activationMode?: 'automatic' | 'manual'
  asChild?: boolean
  class?: string
}

const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <TabsRoot v-bind="forwarded" :class="cn('flex flex-col gap-4', props.class)">
    <slot />
  </TabsRoot>
</template>
