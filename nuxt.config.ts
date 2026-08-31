import { getNitroRedirectRules } from './server/redirectsMap'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon'],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['lucide']
    },
    clientBundle: {
      scan: true
    }
  },
  css: ['~/assets/css/tailwind.css'],
  
  // Runtime Config - Variáveis de ambiente
  runtimeConfig: {
    // Privado (apenas servidor)
    gaApiSecret: process.env.GA_API_SECRET,
    gmailEmail: process.env.GMAIL_EMAIL,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
    leadNotificationEmail: process.env.LEAD_NOTIFICATION_EMAIL,
    resendApiKey: process.env.RESEND_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY,
    newsApiKey: process.env.NEWS_API_KEY,
    mediastackApiKey: process.env.MEDIASTACK_API_KEY,
    newsdataApiKey: process.env.NEWSDATA_API_KEY,
    
    // Cloudflare R2 - Lead Media Privado
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2LeadsBucketName: process.env.R2_LEADS_BUCKET_NAME,
    mediaUploadSigningSecret: process.env.MEDIA_UPLOAD_SIGNING_SECRET,

    // Cloudflare R2 - Mídias do Site / Galerias Públicas
    r2SiteMediaAccountId: process.env.R2_SITE_MEDIA_ACCOUNT_ID,
    r2SiteMediaAccessKeyId: process.env.R2_SITE_MEDIA_ACCESS_KEY_ID,
    r2SiteMediaSecretAccessKey: process.env.R2_SITE_MEDIA_SECRET_ACCESS_KEY,
    r2SiteMediaBucketName: process.env.R2_SITE_MEDIA_BUCKET_NAME,
    r2SiteMediaEndpoint: process.env.R2_SITE_MEDIA_ENDPOINT,
    
    // Público (cliente e servidor)
    public: {
      gaMeasurementId: process.env.GA_MEASUREMENT_ID || 'G-S0038L1Q6R',
      r2SiteMediaPublicBaseUrl: process.env.R2_SITE_MEDIA_PUBLIC_BASE_URL || 'https://media.adtelasmosquiteiras.com.br'
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
            "img-src 'self' data: blob: https: https://*.google-analytics.com https://*.googletagmanager.com https://googletagmanager.com https://ssl.gstatic.com https://www.gstatic.com https://*.g.doubleclick.net https://*.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://pagead2.googlesyndication.com https://ad.doubleclick.net https://ade.googlesyndication.com https://adservice.google.com https://*.r2.cloudflarestorage.com https://media.adtelasmosquiteiras.com.br",
            // Fontes
            "font-src 'self' data: https://fonts.gstatic.com",
            // Conexões (GA4 + GTM + Google Ads + WhatsApp + R2 Direct Upload)
            "connect-src 'self' https://google.com https://*.google.com https://www.google.com https://www.google.com.br https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://*.g.doubleclick.net https://pagead2.googlesyndication.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://region1.google-analytics.com https://region1.analytics.google.com https://stats.g.doubleclick.net https://*.whatsapp.com https://api.whatsapp.com https://viacep.com.br https://servicodados.ibge.gov.br https://cloudflareinsights.com https://*.r2.cloudflarestorage.com https://media.adtelasmosquiteiras.com.br",
            // Mídia (Vídeos HTML5 R2)
            "media-src 'self' blob: data: https://*.r2.cloudflarestorage.com https://media.adtelasmosquiteiras.com.br",
            // Frames
            "frame-src https://www.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://bid.g.doubleclick.net https://vercel.live",
            "frame-ancestors 'none'"
          ].join('; ')
        }
      },
      // Fase 03C / 03D-PRE: SINGLE_REDIRECT_MAP_SOURCE (45 Redirects 301)
      ...getNitroRedirectRules()
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
