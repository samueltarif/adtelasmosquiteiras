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
    newsApiKey: process.env.NEWS_API_KEY,
    mediastackApiKey: process.env.MEDIASTACK_API_KEY,
    newsdataApiKey: process.env.NEWSDATA_API_KEY,
    
    // Público (cliente e servidor)
    public: {
      gaMeasurementId: process.env.GA_MEASUREMENT_ID || 'G-S0038L1Q6R'
    }
  },
  
  devServer: {
    port: 3001
  },
  
  // Security Headers & SEO 301 Redirects
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Content-Security-Policy': [
            "default-src 'self'",
            // GTM container + GA4 + Google Ads
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://www.googleadservices.com https://www.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live https://static.cloudflareinsights.com",
            "script-src-elem 'self' 'unsafe-inline' https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://www.googleadservices.com https://www.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live https://static.cloudflareinsights.com",
            // Estilos
            "style-src 'self' 'unsafe-inline' https://googletagmanager.com https://tagmanager.google.com https://www.googletagmanager.com https://fonts.googleapis.com",
            "style-src-elem 'self' 'unsafe-inline' https://googletagmanager.com https://tagmanager.google.com https://www.googletagmanager.com https://fonts.googleapis.com",
            // Imagens
            "img-src 'self' data: blob: https: https://*.google-analytics.com https://*.googletagmanager.com https://googletagmanager.com https://ssl.gstatic.com https://www.gstatic.com https://*.g.doubleclick.net https://*.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://pagead2.googlesyndication.com https://ad.doubleclick.net https://ade.googlesyndication.com https://adservice.google.com",
            // Fontes
            "font-src 'self' data: https://fonts.gstatic.com",
            // Conexões (GA4 + GTM + Google Ads + WhatsApp)
            "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://*.g.doubleclick.net https://*.google.com https://www.google.com.br https://pagead2.googlesyndication.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://region1.google-analytics.com https://region1.analytics.google.com https://stats.g.doubleclick.net https://*.whatsapp.com https://api.whatsapp.com https://viacep.com.br https://servicodados.ibge.gov.br https://cloudflareinsights.com",
            // Frames
            "frame-src https://www.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://bid.g.doubleclick.net https://vercel.live",
            "frame-ancestors 'none'"
          ].join('; ')
        }
      },
      // Fase 03C: COMPLETE_URL_MIGRATION_MAP (45 Redirects 301)
      '/bairros': { redirect: { to: '/areas-atendidas', statusCode: 301 } },
      '/servicos/rede-protecao': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/tela-mosquiteira': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/redes/residencial': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/redes/pets': { redirect: { to: '/servicos/redes/gatos-e-pets', statusCode: 301 } },
      '/servicos/redes/comercial': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/telas/residencial': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/especiais': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/pet': { redirect: { to: '/servicos/telas/pet-screen', statusCode: 301 } },
      '/servicos/telas/comercial': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/redes/residencial/janelas': { redirect: { to: '/servicos/redes/janelas', statusCode: 301 } },
      '/servicos/redes/residencial/sacadas': { redirect: { to: '/servicos/redes/sacadas-e-varandas', statusCode: 301 } },
      '/servicos/redes/residencial/varandas': { redirect: { to: '/servicos/redes/sacadas-e-varandas', statusCode: 301 } },
      '/servicos/redes/residencial/apartamentos': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/redes/residencial/portas': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/redes/residencial/escadas': { redirect: { to: '/servicos/redes/escadas-e-mezaninos', statusCode: 301 } },
      '/servicos/redes/residencial/basculantes': { redirect: { to: '/servicos/redes/janelas', statusCode: 301 } },
      '/servicos/redes/pets/criancas': { redirect: { to: '/servicos/redes/criancas', statusCode: 301 } },
      '/servicos/redes/pets/gatos': { redirect: { to: '/servicos/redes/gatos-e-pets', statusCode: 301 } },
      '/servicos/redes/pets/cachorros': { redirect: { to: '/servicos/redes/gatos-e-pets', statusCode: 301 } },
      '/servicos/redes/pets/animais': { redirect: { to: '/servicos/redes/gatos-e-pets', statusCode: 301 } },
      '/servicos/redes/pets/idosos': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/redes/comercial/piscinas': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/redes/comercial/telhados': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/redes/comercial/portoes': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/redes/comercial/muros': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/redes/comercial/coberturas': { redirect: { to: '/servicos/redes', statusCode: 301 } },
      '/servicos/telas/residencial/janelas': { redirect: { to: '/servicos/telas/janelas', statusCode: 301 } },
      '/servicos/telas/residencial/portas': { redirect: { to: '/servicos/telas/portas', statusCode: 301 } },
      '/servicos/telas/residencial/varandas': { redirect: { to: '/servicos/telas/sacadas-e-varandas', statusCode: 301 } },
      '/servicos/telas/residencial/sacadas': { redirect: { to: '/servicos/telas/sacadas-e-varandas', statusCode: 301 } },
      '/servicos/telas/residencial/apartamentos': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/residencial/banheiro': { redirect: { to: '/servicos/telas/janelas', statusCode: 301 } },
      '/servicos/telas/especiais/correr': { redirect: { to: '/servicos/telas/janelas', statusCode: 301 } },
      '/servicos/telas/especiais/pivotante': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/especiais/removivel': { redirect: { to: '/servicos/telas/removivel', statusCode: 301 } },
      '/servicos/telas/especiais/basculante': { redirect: { to: '/servicos/telas/janelas', statusCode: 301 } },
      '/servicos/telas/especiais/aluminio': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/especiais/acoinox': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/pet/pets': { redirect: { to: '/servicos/telas/pet-screen', statusCode: 301 } },
      '/servicos/telas/pet/pernilongos': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/comercial/fachadas': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/comercial/coberturas': { redirect: { to: '/servicos/telas', statusCode: 301 } },
      '/servicos/telas/comercial/restaurantes': { redirect: { to: '/servicos/telas/restaurantes', statusCode: 301 } },
      '/servicos/telas/comercial/industrias': { redirect: { to: '/servicos/telas', statusCode: 301 } }
    }
  },
  
  app: {
    head: {
      title: 'AD Telas e Redes SP - Proteção Profissional | Orçamento Rápido',
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/logo_adt_telas_nova.png' },
        { rel: 'apple-touch-icon', href: '/images/logo_adt_telas_nova.png' },
        { rel: 'shortcut icon', href: '/images/logo_adt_telas_nova.png' }
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Telas de segurança e redes protetoras instaladas em SP. Proteja sua família com garantia de qualidade e instalação rápida.' },
        { property: 'og:title', content: 'AD Telas e Redes - Proteção Profissional para Sua Família em SP' },
        { property: 'og:description', content: 'Instale telas de segurança com garantia. Proteja crianças, pets e sua casa contra insetos e quedas.' },
        { property: 'og:image', content: 'https://www.adtelasmosquiteiras.com.br/images/logo_adt_telas_nova.png' },
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
