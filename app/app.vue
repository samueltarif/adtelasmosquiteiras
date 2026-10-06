<script setup lang="ts">
// App principal - Nuxt 4
const route = useRoute()

const canonicalUrl = computed(() => {
  const cleanPath = route.path === '/' ? '' : route.path.replace(/\/$/, '')
  return `https://www.adtelasmosquiteiras.com.br${cleanPath || '/'}`
})

const isAdminRoute = computed(() => route.path.startsWith('/admin'))

useHead(() => ({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl.value
    }
  ],
  meta: [
    { property: 'og:url', content: canonicalUrl.value }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://www.adtelasmosquiteiras.com.br/#website',
            url: 'https://www.adtelasmosquiteiras.com.br/',
            name: 'AD Telas e Redes',
            inLanguage: 'pt-BR',
            publisher: { '@id': 'https://www.adtelasmosquiteiras.com.br/#empresa' }
          },
          {
            '@type': 'LocalBusiness',
            '@id': 'https://www.adtelasmosquiteiras.com.br/#empresa',
            name: 'AD Telas e Redes',
            alternateName: 'AD Telas Mosquiteiras',
            legalName: 'Aelson Carlos dos Santos',
            taxID: '40.297.694/0001-95',
            url: 'https://www.adtelasmosquiteiras.com.br/',
            logo: 'https://www.adtelasmosquiteiras.com.br/images/logo_adt_telas_nova.png',
            telephone: '+55-11-98358-6611',
            areaServed: {
              '@type': 'AdministrativeArea',
              name: 'Estado de São Paulo'
            },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+55-11-98358-6611',
              contactType: 'customer service',
              areaServed: 'SP',
              availableLanguage: 'Portuguese'
            },
            sameAs: [
              'https://www.instagram.com/adtelaseredes',
              'https://www.facebook.com/adtelaseredes'
            ],
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Rua da Quimera, 78 - Jardim Valparaíso',
              postalCode: '02367-385',
              addressLocality: 'São Paulo',
              addressRegion: 'SP',
              addressCountry: 'BR'
            }
          }
        ]
      })
    }
  ],
  noscript: () => isAdminRoute.value ? [] : [
    {
      innerHTML: '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KZTR2DHT" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
      body: true
    }
  ]
}))
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <WhatsappLeadModal />
  </div>
</template>
