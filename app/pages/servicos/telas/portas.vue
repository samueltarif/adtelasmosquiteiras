<script setup lang="ts">
import TelasServicePage from '~/components/telas/TelasServicePage.vue'
import service from '~/data/telas/portas'
definePageMeta({ layout: false })
</script>

<template>
  <TelasServicePage :service="service" />
</template>
