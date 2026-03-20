<script setup lang="ts">
// App principal - Nuxt 4

useHead({
  script: [
    // Schema.org Organization markup para logo aparecer no Google
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'AD Telas e Redes',
        alternateName: 'AD Telas Mosquiteiras',
        url: 'https://www.adtelasmosquiteiras.com.br',
        logo: 'https://www.adtelasmosquiteiras.com.br/images/logo ad.png',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+55-11-98358-6611',
          contactType: 'customer service',
          areaServed: 'BR',
          availableLanguage: 'Portuguese'
        },
        sameAs: [
          'https://www.instagram.com/adtelaseredes',
          'https://www.facebook.com/adtelaseredes'
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'São Paulo',
          addressRegion: 'SP',
          addressCountry: 'BR'
        }
      })
    }
  ]
})
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
