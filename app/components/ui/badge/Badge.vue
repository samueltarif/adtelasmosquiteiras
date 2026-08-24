<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-indigo-600 text-white shadow hover:bg-indigo-700',
        secondary: 'border-transparent bg-slate-800 text-slate-100 hover:bg-slate-700',
        destructive: 'border-transparent bg-rose-600 text-white shadow hover:bg-rose-700',
        outline: 'text-slate-100 border-white/10 hover:bg-white/[0.04]',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
        amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

type BadgeVariants = VariantProps<typeof badgeVariants>

const props = defineProps<{
  variant?: BadgeVariants['variant']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
