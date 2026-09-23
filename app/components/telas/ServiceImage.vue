<script setup lang="ts">
import type { ServiceImage } from '~/data/telas/types'
defineProps<{ image: ServiceImage; eager?: boolean; sizes?: string }>()
</script>

<template>
  <img :src="image.src" :srcset="image.smallWidth < image.width ? `${image.small} ${image.smallWidth}w, ${image.src} ${image.width}w` : undefined"
    :sizes="sizes || '(min-width: 1024px) 33vw, 85vw'" :alt="image.alt" :width="image.width" :height="image.height"
    :loading="eager ? 'eager' : 'lazy'" :fetchpriority="eager ? 'high' : undefined" decoding="async" />
</template>
