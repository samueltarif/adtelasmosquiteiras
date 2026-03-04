<script setup lang="ts">
// App principal - Nuxt 3

// Google Analytics - Garantir carregamento em todas as páginas
useHead({
  script: [
    {
      src: 'https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R',
      async: true
    }
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
