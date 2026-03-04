// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon'],
  css: ['~/assets/css/tailwind.css'],
  
  // Runtime Config - Variáveis de ambiente
  runtimeConfig: {
    // Privado (apenas servidor)
    gaApiSecret: process.env.GA_API_SECRET,
    
    // Público (cliente e servidor)
    public: {
      gaMeasurementId: process.env.GA_MEASUREMENT_ID || 'G-S0038L1Q6R'
    }
  },
  
  devServer: {
    port: 3001
  },
  
  // Security Headers
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://api.whatsapp.com https://www.google-analytics.com https://analytics.google.com; frame-ancestors 'none';"
        }
      }
    }
  },
  
  app: {
    head: {
      title: 'AD Telas e Redes SP - Proteção Profissional | Orçamento Rápido',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Telas de segurança e redes protetoras instaladas em SP. Proteja sua família com garantia de qualidade e instalação rápida.' },
        { name: 'keywords', content: 'tela de segurança SP, rede protetora, mosquiteiro, tela para varanda, proteção infantil' },
        { property: 'og:title', content: 'AD Telas e Redes - Proteção Profissional para Sua Família em SP' },
        { property: 'og:description', content: 'Instale telas de segurança com garantia. Proteja crianças, pets e sua casa contra insetos e quedas.' }
      ],
      htmlAttrs: {
        lang: 'pt-BR'
      }
    }
  }
})
