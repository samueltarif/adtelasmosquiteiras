<script setup lang="ts">
// App principal - Nuxt 3
// GTM é carregado via plugin (app/plugins/gtm.client.js)
</script>

<template>
  <div>
    <!-- Google Tag Manager (noscript) -->
    <noscript>
      <iframe 
        src="https://www.googletagmanager.com/ns.html?id=GTM-KZTR2DHT"
        height="0" 
        width="0" 
        style="display:none;visibility:hidden"
      ></iframe>
    </noscript>
    <!-- End Google Tag Manager (noscript) -->
    
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
