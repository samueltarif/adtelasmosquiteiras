<script setup lang="ts">
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from 'radix-vue'
import { cn } from '../../../lib/utils'

interface Props {
  checked?: boolean
  defaultChecked?: boolean
  required?: boolean
  name?: string
  value?: string
  id?: string
  disabled?: boolean
  class?: string
}

const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'update:checked', value: boolean): void
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer inline-flex min-h-[44px] min-w-[48px] shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50 p-1',
        props.class
      )
    "
  >
    <div
      class="h-6 w-11 rounded-full border-2 border-transparent transition-colors bg-slate-700 peer-data-[state=checked]:bg-emerald-600 relative flex items-center p-0.5 pointer-events-none"
    >
      <SwitchThumb
        :class="
          cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
          )
        "
      />
    </div>
  </SwitchRoot>
</template>
