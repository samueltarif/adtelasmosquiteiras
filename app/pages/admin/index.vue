<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

await navigateTo('/admin/dashboard', { replace: true })
</script>

<template>
  <div class="p-8 text-center text-slate-400">
    Redirecionando para o Dashboard...
  </div>
</template>
