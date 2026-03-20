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
    gmailEmail: process.env.GMAIL_EMAIL,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
    resendApiKey: process.env.RESEND_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
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
      '/': { redirect: '/home' },
      // Redirects das URLs antigas /bairros/[slug] → /[slug]
      '/bairros/itaim-bibi': { redirect: '/itaim-bibi' },
      '/bairros/pinheiros': { redirect: '/pinheiros' },
      '/bairros/vila-olimpia': { redirect: '/vila-olimpia' },
      '/bairros/butanta': { redirect: '/butanta' },
      '/bairros/jardim-paulista': { redirect: '/jardim-paulista' },
      '/bairros/jardim-bonfiglioli': { redirect: '/jardim-bonfiglioli' },
      '/bairros/jardim-das-vertentes': { redirect: '/jardim-das-vertentes' },
      '/bairros/jardim-monte-kemel': { redirect: '/jardim-monte-kemel' },
      '/bairros/vila-sonia': { redirect: '/vila-sonia' },
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://vercel.live https://static.cloudflareinsights.com; script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://vercel.live https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.whatsapp.com https://viacep.com.br https://servicodados.ibge.gov.br https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://www.google.com https://www.google.com.br https://region1.google-analytics.com https://region1.analytics.google.com https://stats.g.doubleclick.net https://www.googleadservices.com https://googleads.g.doubleclick.net https://cloudflareinsights.com; frame-src https://www.googletagmanager.com https://bid.g.doubleclick.net https://vercel.live; frame-ancestors 'none';"
        }
      }
    }
  },
  
  app: {
    head: {
      title: 'AD Telas e Redes SP - Proteção Profissional | Orçamento Rápido',
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/logo ad.png' },
        { rel: 'apple-touch-icon', href: '/images/logo ad.png' },
        { rel: 'shortcut icon', href: '/images/logo ad.png' }
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Telas de segurança e redes protetoras instaladas em SP. Proteja sua família com garantia de qualidade e instalação rápida.' },
        { name: 'keywords', content: 'tela de segurança SP, rede protetora, mosquiteiro, tela para varanda, proteção infantil' },
        { property: 'og:title', content: 'AD Telas e Redes - Proteção Profissional para Sua Família em SP' },
        { property: 'og:description', content: 'Instale telas de segurança com garantia. Proteja crianças, pets e sua casa contra insetos e quedas.' },
        { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/logo ad.png' },
        { property: 'og:image:width', content: '512' },
        { property: 'og:image:height', content: '512' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://www.adtelasmosquiteiras.com.br' }
      ],
      htmlAttrs: {
        lang: 'pt-BR'
      }
    }
  }
})
