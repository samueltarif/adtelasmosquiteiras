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
  
  // Security Headers
  nitro: {
    routeRules: {
      // Redirects das URLs antigas /bairros/[slug] → /[slug]
      '/bairros/itaim-bibi': { redirect: '/tela-mosquiteira-em/itaim-bibi' },
      '/bairros/pinheiros': { redirect: '/tela-mosquiteira-em/pinheiros' },
      '/bairros/vila-olimpia': { redirect: '/tela-mosquiteira-em/vila-olimpia' },
      '/bairros/butanta': { redirect: '/tela-mosquiteira-em/butanta' },
      '/bairros/jardim-paulista': { redirect: '/tela-mosquiteira-em/jardim-paulista' },
      '/bairros/jardim-bonfiglioli': { redirect: '/tela-mosquiteira-em/jardim-bonfiglioli' },
      '/bairros/jardim-das-vertentes': { redirect: '/tela-mosquiteira-em/jardim-das-vertentes' },
      '/bairros/jardim-monte-kemel': { redirect: '/tela-mosquiteira-em/jardim-monte-kemel' },
      '/bairros/vila-sonia': { redirect: '/tela-mosquiteira-em/vila-sonia' },
      // Novos bairros (lote 1 — Aclimação a Americanópolis)
      '/bairros/aclamacao': { redirect: '/tela-mosquiteira-em/aclamacao' },
      '/bairros/agua-branca': { redirect: '/tela-mosquiteira-em/agua-branca' },
      '/bairros/agua-funda': { redirect: '/tela-mosquiteira-em/agua-funda' },
      '/bairros/agua-rasa': { redirect: '/tela-mosquiteira-em/agua-rasa' },
      '/bairros/alto-da-boa-vista': { redirect: '/tela-mosquiteira-em/alto-da-boa-vista' },
      '/bairros/alto-da-lapa': { redirect: '/tela-mosquiteira-em/alto-da-lapa' },
      '/bairros/alto-da-mooca': { redirect: '/tela-mosquiteira-em/alto-da-mooca' },
      '/bairros/alto-de-pinheiros': { redirect: '/tela-mosquiteira-em/alto-de-pinheiros' },
      '/bairros/alto-do-ipiranga': { redirect: '/tela-mosquiteira-em/alto-do-ipiranga' },
      '/bairros/americanopolis': { redirect: '/tela-mosquiteira-em/americanopolis' },
      // Novos bairros (lote 2 — Anhangabaú a Brooklin)
      '/bairros/anhangabau': { redirect: '/tela-mosquiteira-em/anhangabau' },
      '/bairros/anhanguera': { redirect: '/tela-mosquiteira-em/anhanguera' },
      '/bairros/aricanduva': { redirect: '/tela-mosquiteira-em/aricanduva' },
      '/bairros/artur-alvim': { redirect: '/tela-mosquiteira-em/artur-alvim' },
      '/bairros/barra-funda': { redirect: '/tela-mosquiteira-em/barra-funda' },
      '/bairros/bela-vista': { redirect: '/tela-mosquiteira-em/bela-vista' },
      '/bairros/belem': { redirect: '/tela-mosquiteira-em/belem' },
      '/bairros/bom-retiro': { redirect: '/tela-mosquiteira-em/bom-retiro' },
      '/bairros/bras': { redirect: '/tela-mosquiteira-em/bras' },
      '/bairros/brooklin': { redirect: '/tela-mosquiteira-em/brooklin' },
      // Novos bairros (lote 3 — Cambuci a Consolação)
      '/bairros/cambuci': { redirect: '/tela-mosquiteira-em/cambuci' },
      '/bairros/campo-belo': { redirect: '/tela-mosquiteira-em/campo-belo' },
      '/bairros/campo-grande': { redirect: '/tela-mosquiteira-em/campo-grande' },
      '/bairros/campo-limpo': { redirect: '/tela-mosquiteira-em/campo-limpo' },
      '/bairros/cangaiba': { redirect: '/tela-mosquiteira-em/cangaiba' },
      '/bairros/capao-redondo': { redirect: '/tela-mosquiteira-em/capao-redondo' },
      '/bairros/casa-verde': { redirect: '/tela-mosquiteira-em/casa-verde' },
      '/bairros/cidade-ademar': { redirect: '/tela-mosquiteira-em/cidade-ademar' },
      '/bairros/cidade-dutra': { redirect: '/tela-mosquiteira-em/cidade-dutra' },
      '/bairros/consolacao': { redirect: '/tela-mosquiteira-em/consolacao' },
      '/itaim-bibi': { redirect: '/tela-mosquiteira-em/itaim-bibi' },
      '/pinheiros': { redirect: '/tela-mosquiteira-em/pinheiros' },
      '/vila-olimpia': { redirect: '/tela-mosquiteira-em/vila-olimpia' },
      '/butanta': { redirect: '/tela-mosquiteira-em/butanta' },
      '/jardim-paulista': { redirect: '/tela-mosquiteira-em/jardim-paulista' },
      '/jardim-bonfiglioli': { redirect: '/tela-mosquiteira-em/jardim-bonfiglioli' },
      '/jardim-das-vertentes': { redirect: '/tela-mosquiteira-em/jardim-das-vertentes' },
      '/jardim-monte-kemel': { redirect: '/tela-mosquiteira-em/jardim-monte-kemel' },
      '/vila-sonia': { redirect: '/tela-mosquiteira-em/vila-sonia' },
      '/aclamacao': { redirect: '/tela-mosquiteira-em/aclamacao' },
      '/agua-branca': { redirect: '/tela-mosquiteira-em/agua-branca' },
      '/agua-funda': { redirect: '/tela-mosquiteira-em/agua-funda' },
      '/agua-rasa': { redirect: '/tela-mosquiteira-em/agua-rasa' },
      '/alto-da-boa-vista': { redirect: '/tela-mosquiteira-em/alto-da-boa-vista' },
      '/alto-da-lapa': { redirect: '/tela-mosquiteira-em/alto-da-lapa' },
      '/alto-da-mooca': { redirect: '/tela-mosquiteira-em/alto-da-mooca' },
      '/alto-de-pinheiros': { redirect: '/tela-mosquiteira-em/alto-de-pinheiros' },
      '/alto-do-ipiranga': { redirect: '/tela-mosquiteira-em/alto-do-ipiranga' },
      '/americanopolis': { redirect: '/tela-mosquiteira-em/americanopolis' },
      '/anhangabau': { redirect: '/tela-mosquiteira-em/anhangabau' },
      '/anhanguera': { redirect: '/tela-mosquiteira-em/anhanguera' },
      '/aricanduva': { redirect: '/tela-mosquiteira-em/aricanduva' },
      '/artur-alvim': { redirect: '/tela-mosquiteira-em/artur-alvim' },
      '/barra-funda': { redirect: '/tela-mosquiteira-em/barra-funda' },
      '/bela-vista': { redirect: '/tela-mosquiteira-em/bela-vista' },
      '/belem': { redirect: '/tela-mosquiteira-em/belem' },
      '/bom-retiro': { redirect: '/tela-mosquiteira-em/bom-retiro' },
      '/bras': { redirect: '/tela-mosquiteira-em/bras' },
      '/brooklin': { redirect: '/tela-mosquiteira-em/brooklin' },
      '/cambuci': { redirect: '/tela-mosquiteira-em/cambuci' },
      '/campo-belo': { redirect: '/tela-mosquiteira-em/campo-belo' },
      '/campo-grande': { redirect: '/tela-mosquiteira-em/campo-grande' },
      '/campo-limpo': { redirect: '/tela-mosquiteira-em/campo-limpo' },
      '/cangaiba': { redirect: '/tela-mosquiteira-em/cangaiba' },
      '/capao-redondo': { redirect: '/tela-mosquiteira-em/capao-redondo' },
      '/casa-verde': { redirect: '/tela-mosquiteira-em/casa-verde' },
      '/cidade-ademar': { redirect: '/tela-mosquiteira-em/cidade-ademar' },
      '/cidade-dutra': { redirect: '/tela-mosquiteira-em/cidade-dutra' },
      '/consolacao': { redirect: '/tela-mosquiteira-em/consolacao' },
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
      }
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
        { name: 'keywords', content: 'tela de segurança SP, rede protetora, mosquiteiro, tela para varanda, proteção infantil' },
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
