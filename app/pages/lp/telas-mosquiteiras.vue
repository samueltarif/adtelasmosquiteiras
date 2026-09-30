<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useServicos } from '~/composables/useServicos'
import { useLandingTracking } from '~/composables/useLandingTracking'
import { reviews, googleReviews, googleReviewsUrl } from '~/data/telas/reviews'

definePageMeta({ layout: false })

const { WHATSAPP_NUMBER } = useServicos()
const { track, startForm } = useLandingTracking()

const baseWhatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`
function getWhatsappUrl(text) {
  const msg = text || 'Olá! Gostaria de um orçamento para telas mosquiteiras com esquadria de alumínio. Vim pela página de anúncios.'
  return `${baseWhatsappUrl}?text=${encodeURIComponent(msg)}`
}

const showForm = ref(false)
function toggleForm() {
  showForm.value = !showForm.value
  if (showForm.value) {
    track('form_toggle_open')
    setTimeout(() => {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }
}

useHead({
  title: 'Telas Mosquiteiras com Esquadria de Alumínio | Orçamento Rápido | AD Telas',
  meta: [
    { name: 'description', content: 'Telas mosquiteiras sob medida para janelas, portas e sacadas em alumínio. Instalação em São Paulo, Grande SP, Litoral, Campinas e Sorocaba. Orçamento rápido pelo WhatsApp.' },
    { name: 'robots', content: 'noindex, follow' },
    { property: 'og:title', content: 'Telas Mosquiteiras com Esquadria de Alumínio | AD Telas' },
    { property: 'og:description', content: 'Envie uma foto da sua janela ou porta e receba seu orçamento rápido pelo WhatsApp.' },
    { property: 'og:url', content: 'https://www.adtelasmosquiteiras.com.br/lp/telas-mosquiteiras' }
  ]
})

// Fotos reais de instalações feitas pela AD Telas
const realInstallations = [
  {
    title: 'Telas Mosquiteiras para janelas',
    desc: 'Acabamento discreto integrado à esquadria existente.',
    img: '/images/telas_para_banheiro.jpg',
    images: [
      '/images/telas_para_banheiro.jpg',
      '/images/tela_paraJanela.png',
      '/images/telas_para_banheiro_especificacoes.jpg'
    ],
    tag: 'Janela'
  },
  {
    title: 'Janela de Correr em Alumínio',
    desc: 'Vedação impecável sem alterar a fachada.',
    img: '/images/janela_correr_aluminio_1.png',
    images: [
      '/images/janela_correr_aluminio_1.png',
      '/images/janela_correr_aluminio_2.png',
      '/images/janela_correr_aluminio_3.png'
    ],
    tag: 'Janela'
  },
  {
    title: 'Porta Balcão de Correr',
    desc: 'Deslizamento suave para acesso à sacada.',
    img: '/images/porta_balcao_correr_1.png',
    images: [
      '/images/porta_balcao_correr_1.png',
      '/images/porta_balcao_correr_2.png',
      '/images/porta_balcao_correr_3.png'
    ],
    tag: 'Porta'
  },
  {
    title: 'Sacada Envidraçada',
    desc: 'Proteção total mantendo a ventilação e a vista.',
    img: '/images/sacada_envidracada_1.png',
    images: [
      '/images/sacada_envidracada_1.png',
      '/images/sacada_envidracada_2.png'
    ],
    tag: 'Sacada'
  },
  {
    title: 'Tela Pet Screen Reforçada',
    desc: 'Malha de alta resistência contra arranhões de pets.',
    img: '/images/telas_pet_screen_especificacoes.jpg',
    images: [
      '/images/telas_pet_screen_especificacoes.jpg',
      '/images/telas_pet_screen_cores.jpg',
      '/images/telas_pet_screen_rolo.jpg'
    ],
    tag: 'Pet Screen'
  },
  {
    title: 'Tela Removível com Fecho',
    desc: 'Fácil manuseio para retirar, higienizar e recolocar.',
    img: '/images/tela-mosquiteira-removivel.jpeg',
    tag: 'Removível'
  }
]

// 4 Aplicações diretas (Janela | Porta | Sacada | Removível)
const quickModels = [
  {
    name: 'Janela',
    title: 'Telas para Janelas',
    desc: 'Modelos de correr, basculantes e maxim-ar com perfis de alumínio ajustados ao milímetro.',
    icon: 'lucide:layout-grid',
    msg: 'Olá! Gostaria de um orçamento para tela mosquiteira em JANELA.'
  },
  {
    name: 'Porta',
    title: 'Telas para Portas',
    desc: 'Portas de correr e abrir sob medida, ideais para passagens frequentes e saídas de varanda.',
    icon: 'lucide:door-open',
    msg: 'Olá! Gostaria de um orçamento para tela mosquiteira em PORTA.'
  },
  {
    name: 'Sacada',
    title: 'Telas para Sacadas',
    desc: 'Soluções para áreas gourmet e sacadas envidraçadas, protegendo todo o ambiente.',
    icon: 'lucide:sun',
    msg: 'Olá! Gostaria de um orçamento para tela mosquiteira em SACADA.'
  },
  {
    name: 'Removível',
    title: 'Telas Removíveis',
    desc: 'Praticidade total: você encaixa e retira com facilidade para higienização periódica.',
    icon: 'lucide:move',
    msg: 'Olá! Gostaria de um orçamento para tela mosquiteira REMOVÍVEL.'
  }
]

const activeSlides = ref({})
let carouselInterval = null
const comparisonSection = ref(null)
const showFloatingWhatsapp = ref(false)
let comparisonObserver = null

onMounted(() => {
  track('landing_view')

  comparisonObserver = new IntersectionObserver(([entry]) => {
    showFloatingWhatsapp.value = entry.isIntersecting || entry.boundingClientRect.top < 0
  })
  if (comparisonSection.value) comparisonObserver.observe(comparisonSection.value)

  // Inicializa os índices de slides para todos os cards que possuem múltiplas fotos
  realInstallations.forEach((item, index) => {
    if (item.images?.length) {
      activeSlides.value[index] = 0
    }
  })

  // Alterna as fotos a cada 3 segundos como carrossel para os cards com múltiplas fotos
  carouselInterval = setInterval(() => {
    realInstallations.forEach((item, index) => {
      if (item.images?.length) {
        activeSlides.value[index] = ((activeSlides.value[index] || 0) + 1) % item.images.length
      }
    })
  }, 3000)
})

onUnmounted(() => {
  comparisonObserver?.disconnect()
  if (carouselInterval) {
    clearInterval(carouselInterval)
    carouselInterval = null
  }
})
</script>

<template>
  <div class="lp-container">
    <!-- Header Transparente com Logo -->
    <header class="lp-header" data-cta-location="lp_header">
      <div class="wrap lp-header-inner">
        <NuxtLink to="/" class="lp-brand" aria-label="AD Telas e Redes">
          <img src="/images/logo-adt-lp.png" alt="AD Telas e Redes" width="112" height="56" fetchpriority="high" />
          <div class="lp-brand-text">
            <span>AD TELAS E REDES</span>
            <small>TELAS MOSQUITEIRAS</small>
          </div>
        </NuxtLink>

      </div>
    </header>

    <!-- Hero com Foto Ocupando o Topo e Gradiente Escuro Suave -->
    <section class="lp-hero" aria-label="Apresentação das Telas Mosquiteiras">
      <div class="lp-hero-photo">
        <img
          src="/images/telas-hero-casal.jpg"
          width="1440"
          height="960"
          alt="Instalação de tela mosquiteira sob medida em sala de estar"
          fetchpriority="high"
        />
      </div>

      <div class="wrap lp-hero-inner">
        <div class="lp-hero-copy">
          <div class="lp-hero-text">
            <p class="eyebrow">TELA MOSQUITEIRA SOB MEDIDA</p>
            <h1>Telas Mosquiteiras <span>com Esquadria de Alumínio</span></h1>
            <p class="hero-description">
              Telas sob medida para janelas, portas e sacadas, com instalação em São Paulo, Grande SP, Litoral, Campinas e Sorocaba.
            </p>
            <p class="hero-subtext">
              Proteja sua casa contra mosquitos sem perder ventilação.
            </p>


          </div>

          <div class="hero-trust" aria-label="Confiança e atendimento AD Telas">
            <a :href="googleReviewsUrl" target="_blank" rel="noopener noreferrer" class="hero-trust-item" :title="`Avaliação conferida em ${googleReviews.checkedAt}`">
              <Icon name="lucide:star" aria-hidden="true" />
              <span><strong>{{ googleReviews.rating }} no Google</strong><small>{{ googleReviews.count }} avaliações · {{ googleReviews.checkedAt }}</small></span>
            </a>
            <div class="hero-trust-item">
              <Icon name="lucide:users" aria-hidden="true" />
              <span><strong>Mais de 1.000</strong><small>clientes atendidos</small></span>
            </div>
            <div class="hero-trust-item">
              <Icon name="lucide:shield-check" aria-hidden="true" />
              <span><strong>2 anos de garantia</strong><small>contra defeitos de instalação</small></span>
            </div>
            <div class="hero-trust-item">
              <Icon name="lucide:clock" aria-hidden="true" />
              <span><strong>Visita em até 24h</strong><small>orçamento gratuito no local</small></span>
            </div>
          </div>

          <!-- Hero CTA Button -->
          <div class="hero-actions">
            <a
              :href="getWhatsappUrl('Olá! Gostaria de pedir um orçamento para telas mosquiteiras com esquadria de alumínio.')"
              target="_blank"
              rel="noopener noreferrer"
              class="button green hero-cta-btn"
              data-cta-location="lp_hero"
              data-gtm="lp-whatsapp-hero"
              data-track-type="whatsapp"
              data-service-key="telas-mosquiteiras"
              data-service-name="Telas Mosquiteiras"
              @click="track('whatsapp_cta_click', { cta_location: 'lp_hero' })"
            >
              <WhatsappIcon />
              <span>Solicitar orçamento grátis agora</span>
            </a>
            <p class="hero-cta-note">Pelo WhatsApp · Sem compromisso</p>
            <p class="hero-installation-note"><strong>Tempo de instalação:</strong> confirmado no orçamento, conforme o modelo e a quantidade de telas.</p>
          </div>
        </div>
      </div>

      <!-- Rodapé Compacto do Hero: 2 frases lado a lado e 1 centralizada embaixo -->
      <div class="hero-footer-bar">
        <div class="wrap hero-benefits-box">
          <div class="hero-benefits-row-top">
            <div class="hero-benefit-item">
              <Icon name="lucide:check-circle-2" class="check-icon" />
              <span><strong>Fabricação sob medida</strong><span class="benefit-sub"> para qualquer vão</span></span>
            </div>
            <div class="hero-benefit-item">
              <Icon name="lucide:check-circle-2" class="check-icon" />
              <span><strong>Instalação profissional</strong><span class="benefit-sub"> com vedação total</span></span>
            </div>
          </div>
          <div class="hero-benefits-row-bottom">
            <div class="hero-benefit-item">
              <Icon name="lucide:check-circle-2" class="check-icon" />
              <span><strong>Atendimento em São Paulo e região</strong></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section ref="comparisonSection" class="section wrap comparison-section" aria-labelledby="comparison-title">
      <div class="section-heading">
        <p class="eyebrow">ABRA ESPAÇO PARA O CONFORTO</p>
        <h2 id="comparison-title">Ar entrando. Insetos do lado de fora.</h2>
        <p>Veja o que uma tela sob medida pode mudar no seu dia a dia.</p>
      </div>
      <div class="comparison-grid">
        <article class="comparison-card comparison-without">
          <div class="comparison-photo">
            <img src="/images/lp-comparativo-mosquito.jpg" alt="Mosquito pousado em uma superfície, em foto ilustrativa" width="800" height="533" loading="lazy" decoding="async" />
            <span>Sem tela</span>
          </div>
          <div class="comparison-copy">
            <h3>Uma abertura para os insetos</h3>
            <ul>
              <li><Icon name="lucide:x" aria-hidden="true" />Mosquitos podem entrar pelas janelas</li>
              <li><Icon name="lucide:x" aria-hidden="true" />Incômodo com insetos dentro de casa</li>
              <li><Icon name="lucide:x" aria-hidden="true" />Janelas fechadas reduzem a ventilação</li>
            </ul>
          </div>
        </article>
        <article class="comparison-card comparison-with">
          <div class="comparison-photo">
            <img src="/images/telas/catalogo/mosquiteira-janela.webp" alt="Tela mosquiteira ajustada à esquadria de uma janela" width="800" height="600" loading="lazy" decoding="async" />
            <span>Com tela AD Telas</span>
          </div>
          <div class="comparison-copy">
            <h3>Mais conforto com a janela aberta</h3>
            <ul>
              <li><Icon name="lucide:check" aria-hidden="true" />Ventilação natural no ambiente</li>
              <li><Icon name="lucide:check" aria-hidden="true" />Barreira contra a entrada de insetos</li>
              <li><Icon name="lucide:check" aria-hidden="true" />Instalação sob medida para o seu vão</li>
            </ul>
          </div>
        </article>
      </div>
      <p class="comparison-caption">Imagens ilustrativas do comparativo.</p>
      <div class="comparison-action">
        <p><strong>Visita gratuita em até 24h.</strong> Receba seu orçamento no local, sem compromisso.</p>
        <a :href="getWhatsappUrl()" target="_blank" rel="noopener noreferrer" class="button green" data-cta-location="lp_comparison" data-gtm="lp-whatsapp-comparison" data-track-type="whatsapp" data-service-key="telas-mosquiteiras" data-service-name="Telas Mosquiteiras" @click="track('whatsapp_cta_click', { cta_location: 'lp_comparison' })">
          <WhatsappIcon aria-hidden="true" /><span>Solicitar orçamento grátis agora</span>
        </a>
      </div>
      <div class="installation-details">
        <p><strong>Garantia de 2 anos</strong><span>Contra defeitos de instalação.</span></p>
        <p><strong>Durabilidade estimada de 5 anos</strong><span>Consulte os cuidados de uso e manutenção com nossa equipe.</span></p>
        <p><strong>Instalação agendada</strong><span>O prazo depende do modelo, das medidas e da quantidade de telas. Confirmamos no orçamento.</span></p>
      </div>
    </section>

    <!-- 1. Galeria de Fotos REAIS de Instalações Feitas pela AD Telas -->
    <section class="section wrap" aria-labelledby="gallery-title">
      <div class="section-heading">
        <p class="eyebrow">INSTALAÇÕES REAIS AD TELAS</p>
        <h2 id="gallery-title">Fotos de Serviços Realizados</h2>
        <p>Veja como as telas ficam discretas, elegantes e perfeitamente integradas às esquadrias de alumínio.</p>
      </div>

      <div class="gallery-grid">
        <article v-for="(item, cIndex) in realInstallations" :key="item.title" class="gallery-card">
          <div class="card-img-wrap" :class="{ 'has-carousel': item.images?.length }">
            <template v-if="item.images && item.images.length">
              <div
                v-for="(imgSrc, sIndex) in item.images"
                :key="imgSrc"
                class="carousel-slide"
                :class="{ active: (activeSlides[cIndex] ?? 0) === sIndex }"
              >
                <img
                  :src="imgSrc"
                  :alt="`${item.title} - Foto ${sIndex + 1}`"
                  width="480"
                  height="600"
                  :loading="sIndex === 0 ? 'eager' : 'lazy'"
                />
              </div>
              <div class="carousel-dots" :aria-label="`Fotos de ${item.title}`">
                <button
                  v-for="(imgSrc, sIndex) in item.images"
                  :key="sIndex"
                  type="button"
                  class="carousel-dot"
                  :class="{ active: (activeSlides[cIndex] ?? 0) === sIndex }"
                  :aria-label="`Ver foto ${sIndex + 1}`"
                  @click.stop.prevent="activeSlides[cIndex] = sIndex"
                />
              </div>
            </template>
            <template v-else>
              <img :src="item.img" :alt="item.title" width="480" height="600" loading="lazy" />
            </template>
            <span class="card-badge">{{ item.tag }}</span>
          </div>
          <div class="card-body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
            <a
              :href="getWhatsappUrl(`Olá! Gostei da foto de ${item.title} e gostaria de falar com um consultor para um orçamento.`)"
              target="_blank"
              rel="noopener noreferrer"
              class="card-cta-link pulse-subtle"
              data-cta-location="gallery_card"
              data-gtm="lp-whatsapp-gallery"
              data-track-type="whatsapp"
              data-service-key="telas-mosquiteiras"
              data-service-name="Telas Mosquiteiras"
              @click="track('whatsapp_cta_click', { cta_location: 'gallery_card', service: item.title })"
            >
              <WhatsappIcon class="cta-wa-icon" />
              <span>Fale agora pelo Whatsapp</span>
              <span aria-hidden="true" class="cta-arrow">→</span>
            </a>
          </div>
        </article>
      </div>
    </section>

    <!-- 2. Modelos Objetivos: Janela | Porta | Sacada | Removível -->
    <section class="section bg-light" aria-labelledby="models-title">
      <div class="wrap">
        <div class="section-heading">
          <p class="eyebrow">ONDE VOCÊ PRECISA INSTALAR?</p>
          <h2 id="models-title">Janela · Porta · Sacada · Removível</h2>
          <p>Você não precisa estudar modelos complexos. Escolha o ambiente e nossa equipe indica a melhor opção.</p>
        </div>

        <div class="models-grid">
          <article v-for="model in quickModels" :key="model.name" class="model-box">
            <div class="model-box-top">
              <div class="model-icon">
                <Icon :name="model.icon" />
              </div>
              <div>
                <span class="model-tag">{{ model.name }}</span>
                <h3>{{ model.title }}</h3>
              </div>
            </div>
            <p class="model-desc">{{ model.desc }}</p>
            <a
              :href="getWhatsappUrl(model.msg)"
              target="_blank"
              rel="noopener noreferrer"
              class="button outline-btn pulse-subtle"
              data-cta-location="quick_models"
              data-gtm="lp-whatsapp-models"
              data-track-type="whatsapp"
              data-service-key="telas-mosquiteiras"
              data-service-name="Telas Mosquiteiras"
              @click="track('whatsapp_cta_click', { cta_location: 'quick_models', model: model.name })"
            >
              <WhatsappIcon />
              <span>Fale agora pelo Whatsapp</span>
            </a>
          </article>
        </div>
      </div>
    </section>

    <!-- 3. Depoimentos Reais de Clientes (Google Reviews) -->
    <section class="section wrap" aria-labelledby="reviews-title">
      <div class="section-heading">
        <p class="eyebrow">DEPOIMENTOS REAIS NO GOOGLE</p>
        <h2 id="reviews-title">Quem já confiou na AD Telas, recomenda</h2>
        <div class="google-badge-inline">
          <span class="stars" aria-hidden="true">★★★★★</span>
          <strong>Nota {{ googleReviews.rating }} de 5,0</strong>
          <span>· {{ googleReviews.count }} avaliações reais conferidas</span>
        </div>
      </div>

      <div class="reviews-grid">
        <article v-for="rev in reviews" :key="rev.name" class="review-card">
          <div class="review-stars">★★★★★</div>
          <blockquote>“{{ rev.text }}”</blockquote>
          <div class="review-author">
            <div class="author-avatar">{{ rev.name.charAt(0) }}</div>
            <div>
              <strong>{{ rev.name }}</strong>
              <small>Cliente verificado no Google</small>
            </div>
          </div>
        </article>
      </div>

      <div class="text-center mt-6">
        <a :href="googleReviewsUrl" target="_blank" rel="noopener noreferrer" class="link-muted">
          Conferir todas as avaliações no Google Reviews ↗
        </a>
      </div>
    </section>

    <!-- 4. Seção de Ação Rápida: Envie uma foto e informe seu CEP (Agora posicionada APÓS os depoimentos) -->
    <section class="quick-quote-band" aria-labelledby="quick-quote-title">
      <div class="wrap quick-quote-card">
        <div class="quick-quote-header">
          <div class="icon-camera-bubble">
            <Icon name="lucide:camera" />
          </div>
          <div>
            <span class="pill-accent">ORÇAMENTO RÁPIDO</span>
            <h2 id="quick-quote-title">Envie uma foto da sua janela, porta ou sacada pelo WhatsApp e informe seu CEP</h2>
            <p>Não precisa saber medidas exatas agora. Nossa equipe analisa o seu espaço e envia a recomendação ideal.</p>
          </div>
        </div>

        <div class="quick-steps-grid">
          <div class="step-card">
            <span class="step-num">1</span>
            <strong>Tire uma foto</strong>
            <p>Fotografe o vão ou esquadria onde deseja a proteção.</p>
          </div>
          <div class="step-card">
            <span class="step-num">2</span>
            <strong>Informe seu CEP</strong>
            <p>Para calcularmos a taxa de visita ou instalação na sua região.</p>
          </div>
          <div class="step-card">
            <span class="step-num">3</span>
            <strong>Receba o valor</strong>
            <p>Valores transparentes e agendamento rápido da instalação.</p>
          </div>
        </div>

        <div class="quick-cta-row">
          <a
            :href="getWhatsappUrl('Olá! Quero enviar a foto do meu vão para orçamento de tela mosquiteira. Meu CEP é: ')"
            target="_blank"
            rel="noopener noreferrer"
            class="button green pulse-btn"
            data-cta-location="quick_photo_band"
            data-gtm="lp-whatsapp-quick-band"
            data-track-type="whatsapp"
            data-service-key="telas-mosquiteiras"
            data-service-name="Telas Mosquiteiras"
            @click="track('whatsapp_cta_click', { cta_location: 'quick_photo_band' })"
          >
            <WhatsappIcon />
            <span>ENVIAR FOTO E PEDIR ORÇAMENTO AGORA →</span>
          </a>
        </div>
      </div>
    </section>

    <!-- 5. CTA Final de Conversão -->
    <section class="final-cta-section">
      <div class="wrap final-cta-box">
        <p class="eyebrow text-gold">ATENDIMENTO IMEDIATO</p>
        <h2>Pronto para proteger sua casa com telas sob medida?</h2>
        <p class="cta-subtitle">
          Envie sua mensagem pelo WhatsApp ou tire uma foto do seu vão. Atendemos São Paulo, Grande SP, Litoral, Campinas e Sorocaba.
        </p>

        <div class="final-cta-actions">
          <a
            :href="getWhatsappUrl('Olá! Quero enviar uma foto e pedir um orçamento para telas mosquiteiras sob medida.')"
            target="_blank"
            rel="noopener noreferrer"
            class="button green final-btn pulse-btn"
            data-cta-location="final_cta"
            data-gtm="lp-whatsapp-final"
            data-track-type="whatsapp"
            data-service-key="telas-mosquiteiras"
            data-service-name="Telas Mosquiteiras"
            @click="track('whatsapp_cta_click', { cta_location: 'final_cta' })"
          >
            <WhatsappIcon />
            <span>ENVIAR FOTO E PEDIR ORÇAMENTO</span>
          </a>

          <button type="button" class="button secondary form-toggle-btn" @click="toggleForm">
            <Icon name="lucide:file-text" />
            <span>{{ showForm ? 'Fechar formulário' : 'Prefiro preencher formulário' }}</span>
          </button>
        </div>

        <!-- Formulário Opcional Desdobrável -->
        <div v-if="showForm" id="form-section" class="form-wrapper">
          <LandingQuoteForm
            :show-trust-badges="false"
            :inline-validation="true"
            cta-location="lp_custom_form"
            description="Preencha seus dados para receber o orçamento gratuito diretamente da nossa equipe técnica."
          />
        </div>

        <div class="trust-footer-pills">
          <span>✓ Orçamento Gratuito</span>
          <span>✓ Sem Compromisso</span>
          <span>✓ Pagamento Facilitado</span>
          <span>✓ Garantia de Vedação</span>
        </div>
      </div>
    </section>

    <!-- Rodapé -->
    <footer class="lp-footer">
      <div class="wrap lp-footer-inner">
        <div>
          <strong>AD Telas e Redes</strong>
          <p>Telas mosquiteiras com esquadria de alumínio sob medida para residências e empresas.</p>
        </div>
        <div class="footer-links">
          <a href="tel:+5511983586611">(11) 98358-6611</a>
          <NuxtLink to="/politica-de-privacidade">Política de Privacidade</NuxtLink>
        </div>
      </div>
      <div class="wrap copyright">
        © {{ new Date().getFullYear() }} AD Telas. Todos os direitos reservados.
      </div>
    </footer>

    <!-- Botão Flutuante Piscando: Falar agora no WhatsApp -->
    <a
      :href="getWhatsappUrl('Olá! Gostaria de falar com um especialista sobre telas mosquiteiras.')"
      v-show="showFloatingWhatsapp"
      class="floating-whatsapp"
      data-cta-location="floating_whatsapp"
      data-gtm="lp-whatsapp-floating"
      data-track-type="whatsapp"
      data-service-key="telas-mosquiteiras"
      data-service-name="Telas Mosquiteiras"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale agora pelo Whatsapp"
      title="Fale agora pelo Whatsapp"
      @click="track('whatsapp_cta_click', { cta_location: 'floating_whatsapp' })"
    ><WhatsappIcon aria-hidden="true" /><span>Fale agora pelo Whatsapp</span></a>
  </div>
</template>

<style scoped>
/* Reset & Variáveis */
.lp-container {
  --brand-blue: #234b73;
  --brand-dark: #0d1d30;
  --brand-gold: #f2bd16;
  --whatsapp: #087c38;
  --ink: #182f49;
  --text-muted: #566879;
  --border-light: #d8e2ec;
  --bg-light: #f4f7fa;
  color: var(--ink);
  background: #fff;
  font-family: inherit;
  line-height: 1.5;
  padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px));
}

.wrap {
  width: min(1240px, calc(100% - 24px));
  margin-inline: auto;
}
@media (max-width: 480px) {
  .wrap {
    width: calc(100% - 16px);
  }
}

h1, h2, h3, p {
  margin: 0;
}

h1, h2, h3 {
  line-height: 1.15;
  letter-spacing: -0.03em;
}

h2 {
  font-size: clamp(24px, 3.2vw, 36px);
  font-weight: 800;
  color: var(--brand-blue);
}

h3 {
  font-size: 18px;
  font-weight: 750;
  color: var(--brand-blue);
}

p {
  color: var(--text-muted);
}

.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brand-gold);
  margin-bottom: 6px;
  display: block;
}

.text-gold {
  color: var(--brand-gold) !important;
}

.bg-light {
  background-color: var(--bg-light);
}

.section {
  padding-block: 48px;
}

@media (min-width: 768px) {
  .section {
    padding-block: 64px;
  }
}

.section-heading {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 32px;
}

.section-heading p:last-child {
  margin-top: 10px;
  font-size: 15px;
}

/* Header Transparente */
.lp-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: linear-gradient(180deg, rgba(8, 20, 36, 0.75) 0%, rgba(8, 20, 36, 0.25) 65%, transparent 100%);
  border-bottom: none;
}

.lp-header-inner {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  height: 72px;
}

.lp-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.lp-brand img {
  width: 100px;
  height: auto;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

@media (max-width: 420px) {
  .lp-brand-text { display: none; }
}

.lp-brand-text {
  display: flex;
  flex-direction: column;
  color: #fff;
  line-height: 1.1;
}

.lp-brand-text span {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.lp-brand-text small {
  font-size: 9.5px;
  letter-spacing: 0.1em;
  color: var(--brand-gold);
}

.lp-header-cta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #25d366;
  color: #fff;
  font-size: 12.5px;
  font-weight: 750;
  text-decoration: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.lp-header-cta:hover {
  transform: scale(1.04);
  filter: brightness(1.08);
}

.lp-header-cta :deep(svg) {
  width: 17px;
  height: 17px;
}

/* Hero Section */
.lp-hero {
  position: relative;
  overflow: hidden;
  background: var(--brand-dark);
  color: white;
  min-height: 100svh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-top: calc(72px + env(safe-area-inset-top, 0px));
}

.lp-hero-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.lp-hero-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 72% 10%;
}

.lp-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(11, 24, 40, 0.2) 0%, rgba(11, 24, 40, 0.36) 35%, rgba(11, 24, 40, 0.75) 68%, rgba(11, 24, 40, 0.94) 100%),
              linear-gradient(90deg, rgba(11, 24, 40, 0.6) 0%, rgba(11, 24, 40, 0.2) 65%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}

.lp-hero-inner {
  position: relative;
  z-index: 2;
  width: 100%;
  box-sizing: border-box;
  padding: 0 16px 0 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.lp-hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 85px 0 20px;
  max-width: 500px;
  width: 100%;
  text-align: left;
}

.lp-hero h1 {
  font-size: clamp(23px, 6vw, 30px);
  font-weight: 800;
  color: #fff;
  line-height: 1.16;
  letter-spacing: -0.03em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
}

.lp-hero h1 span {
  display: block;
  color: var(--brand-gold);
}

.hero-description {
  font-size: 14px;
  margin-top: 8px;
  max-width: 400px;
  color: #f0f4fa;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.8);
  line-height: 1.45;
}

.hero-subtext {
  font-size: 13.5px;
  font-weight: 600;
  margin-top: 6px;
  color: #dbe7f5;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.hero-google-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 6px 12px;
  background: rgba(13, 29, 48, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  font-size: 12px;
  color: #fff;
  text-decoration: none;
  backdrop-filter: blur(6px);
  width: fit-content;
}

.stars {
  color: var(--brand-gold);
  letter-spacing: 1px;
}

.hero-actions {
  margin-top: 18px;
}

.button {
  min-height: 50px;
  padding: 12px 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 8px;
  font-size: 14.5px;
  font-weight: 750;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease, filter 0.2s ease, background-color 0.2s ease;
}

.green {
  background: var(--whatsapp);
  color: #fff;
  border: 1px solid var(--whatsapp);
}

.green:hover {
  background: #06662e;
  filter: brightness(1.05);
}

.hero-cta-btn {
  width: min(340px, 100%);
  min-height: 54px;
  font-size: 15px;
  font-weight: 800;
  border-radius: 9px;
  box-shadow: 0 4px 18px rgba(8, 124, 56, 0.5);
}

.hero-cta-btn :deep(svg), .pulse-btn :deep(svg) {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.pulse-btn {
  animation: pulse-green 2s infinite ease-in-out;
}

@keyframes pulse-green {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(37, 211, 102, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
}

/* Rodapé Compacto do Hero: 2 frases lado a lado e 1 centralizada embaixo */
.hero-footer-bar {
  position: relative;
  z-index: 5;
  width: 100%;
  background: rgba(8, 20, 36, 0.90);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  padding: 10px 0;
  margin-top: auto;
}

.hero-benefits-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 100%;
}

.hero-benefits-row-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
}

.hero-benefits-row-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.hero-benefit-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #f1f6fc;
  line-height: 1.25;
}

.hero-benefit-item .check-icon {
  width: 15px;
  height: 15px;
  color: #25d366;
  flex-shrink: 0;
}

.benefit-sub {
  display: none;
}

@media (min-width: 640px) {
  .benefit-sub {
    display: inline;
  }
  .hero-footer-bar {
    padding: 11px 0;
  }
  .hero-benefits-box {
    gap: 6px;
  }
  .hero-benefits-row-top {
    gap: 36px;
  }
  .hero-benefit-item {
    font-size: 13.5px;
    gap: 8px;
  }
  .hero-benefit-item .check-icon {
    width: 17px;
    height: 17px;
  }
}

@media (min-width: 768px) {
  .lp-hero {
    min-height: 640px;
    display: flex;
    flex-direction: column;
    padding-top: 80px;
  }
  .lp-hero-photo img {
    object-position: 75% 15%;
  }
  .lp-hero::after {
    background: linear-gradient(90deg, #0d1f35f8 0%, #122a47ed 36%, #16325585 62%, #16325520 84%, transparent 100%);
  }
  .lp-hero-inner {
    padding: 0;
    display: block;
    margin-top: auto;
  }
  /* Posicionamento do bloco ~2cm (75px) mais para a direita no desktop e trazido mais para baixo */
  .lp-hero-copy {
    padding: 120px 0 36px;
    margin-left: 75px;
    max-width: 640px;
    display: block;
  }
  .lp-hero h1 {
    font-size: clamp(38px, 4vw, 54px);
    line-height: 1.14;
  }
  .hero-description {
    font-size: 16px;
    max-width: 520px;
    margin-top: 14px;
  }
  .hero-subtext {
    font-size: 15px;
    margin-top: 8px;
  }
  .hero-cta-btn {
    width: auto;
    min-height: 56px;
    padding: 14px 28px;
    font-size: 16px;
  }

}

/* Galeria de Fotos Reais - Verticalmente Aumentadas */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (min-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }
}

.gallery-card {
  background: #fff;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(18, 35, 47, 0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.gallery-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(18, 35, 47, 0.12);
}

/* Altura verticalmente aumentada conforme solicitação */
.card-img-wrap {
  position: relative;
  background: #e8eef5;
  height: 280px;
  overflow: hidden;
}

@media (min-width: 640px) {
  .card-img-wrap {
    height: 380px;
  }
}

.card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.35s ease;
}

.gallery-card:hover .card-img-wrap img {
  transform: scale(1.05);
}

/* Carrossel de Fotos nos Cards */
.carousel-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.7s ease-in-out;
  pointer-events: none;
}

.carousel-slide.active {
  opacity: 1;
  pointer-events: auto;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.carousel-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 5;
  background: rgba(13, 29, 48, 0.55);
  backdrop-filter: blur(4px);
  padding: 4px 7px;
  border-radius: 999px;
}

.carousel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.25s ease, width 0.25s ease, border-radius 0.25s ease;
}

.carousel-dot.active {
  background: #25d366;
  width: 15px;
  border-radius: 4px;
}

.card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 6;
  background: rgba(13, 29, 48, 0.85);
  color: var(--brand-gold);
  font-size: 10.5px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.card-body {
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-body h3 {
  font-size: 15.5px;
  margin-bottom: 4px;
}

.card-body p {
  font-size: 12.5px;
  line-height: 1.4;
  margin-bottom: 14px;
}

.card-cta-link {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 8px;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 750;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}

.card-cta-link .cta-wa-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.card-cta-link .cta-arrow {
  margin-left: 2px;
}

@media (min-width: 640px) {
  .card-cta-link {
    font-size: 13px;
    padding: 11px 14px;
    gap: 8px;
    justify-content: space-between;
  }

  .card-cta-link .cta-wa-icon {
    width: 18px;
    height: 18px;
  }

  .card-cta-link .cta-arrow {
    margin-left: auto;
  }
}

/* Animação que Pisca Levemente nos Botões de Ação dos Cards */
.pulse-subtle {
  animation: pulse-subtle-glow 2.2s infinite ease-in-out;
  border: 1.5px solid #087c38 !important;
  background: #f0faf3 !important;
  color: #087c38 !important;
  font-weight: 750 !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.pulse-subtle:hover {
  background: #087c38 !important;
  color: #fff !important;
  transform: scale(1.03);
}

@keyframes pulse-subtle-glow {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.6), 0 2px 8px rgba(8, 124, 56, 0.15);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.025);
    box-shadow: 0 0 0 8px rgba(37, 211, 102, 0), 0 4px 16px rgba(8, 124, 56, 0.35);
    filter: brightness(1.08);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(37, 211, 102, 0), 0 2px 8px rgba(8, 124, 56, 0.15);
    filter: brightness(1);
  }
}

/* Modelos Objetivos: Janela | Porta | Sacada | Removível */
.models-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 768px) {
  .models-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }
}

.model-box {
  background: #fff;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(18, 35, 47, 0.04);
}

.model-box-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.model-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #edf3fa;
  color: var(--brand-blue);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.model-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.model-tag {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--brand-gold);
  letter-spacing: 0.08em;
  display: block;
}

.model-box-top h3 {
  font-size: 15px;
}

.model-desc {
  font-size: 12.5px;
  line-height: 1.45;
  margin-bottom: 16px;
  flex: 1;
}

.outline-btn {
  min-height: 42px;
  font-size: 12.5px;
  font-weight: 750;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.outline-btn :deep(svg) {
  width: 17px;
  height: 17px;
}

/* Depoimentos */
.google-badge-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 6px 14px;
  background: #fff;
  border: 1px solid var(--border-light);
  border-radius: 999px;
  font-size: 13px;
}

.reviews-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 768px) {
  .reviews-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
}

.review-card {
  background: #fff;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.review-stars {
  color: var(--brand-gold);
  letter-spacing: 2px;
  font-size: 16px;
  margin-bottom: 10px;
}

.review-card blockquote {
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.55;
  color: #334455;
  font-style: italic;
  flex: 1;
}

.review-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e6eef7;
  color: var(--brand-blue);
  font-weight: 800;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.review-author strong {
  display: block;
  font-size: 13px;
  color: var(--ink);
}

.review-author small {
  display: block;
  font-size: 11px;
  color: #7b8e9e;
}

.text-center {
  text-align: center;
}

.mt-6 {
  margin-top: 24px;
}

.link-muted {
  font-size: 13px;
  font-weight: 650;
  color: var(--brand-blue);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Seção de Ação Rápida: Envie foto e CEP (Posicionada Após Depoimentos) */
.quick-quote-band {
  background: #f1f6fb;
  padding: 48px 0;
  position: relative;
  z-index: 10;
}

.quick-quote-card {
  background: #ffffff;
  border: 2px solid #c8dcf2;
  border-radius: 16px;
  padding: 26px 20px;
  box-shadow: 0 10px 30px rgba(18, 35, 47, 0.08);
}

@media (min-width: 768px) {
  .quick-quote-card {
    padding: 32px 28px;
  }
}

.quick-quote-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.icon-camera-bubble {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--brand-blue);
  color: #fff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.icon-camera-bubble :deep(svg) {
  width: 26px;
  height: 26px;
}

.pill-accent {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--brand-blue);
  background: #d4e5f7;
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.quick-quote-header h2 {
  font-size: clamp(19px, 2.8vw, 24px);
  color: var(--brand-blue);
  line-height: 1.25;
}

.quick-quote-header p {
  font-size: 13.5px;
  margin-top: 6px;
  color: #435465;
}

.quick-steps-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin: 22px 0;
}

@media (min-width: 640px) {
  .quick-steps-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.step-card {
  background: #f8fbfe;
  border: 1px solid #d8e5f2;
  border-radius: 10px;
  padding: 16px 14px;
  position: relative;
}

.step-num {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--brand-gold);
  color: #0d1d30;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
}

.step-card strong {
  display: block;
  font-size: 14px;
  color: var(--brand-blue);
}

.step-card p {
  font-size: 12.5px;
  margin-top: 4px;
  line-height: 1.35;
}

.quick-cta-row {
  text-align: center;
  margin-top: 14px;
}

.quick-cta-row .button {
  width: min(440px, 100%);
  min-height: 52px;
  font-size: 14.5px;
  font-weight: 800;
  border-radius: 9px;
  box-shadow: 0 4px 16px rgba(8, 124, 56, 0.4);
}

/* Final CTA */
.final-cta-section {
  background: linear-gradient(180deg, #13273e 0%, #0d1d30 100%);
  color: #fff;
  padding: 48px 0;
  text-align: center;
}

.final-cta-box {
  max-width: 680px;
}

.final-cta-box h2 {
  color: #fff;
  font-size: clamp(23px, 3.4vw, 34px);
  margin-bottom: 10px;
}

.cta-subtitle {
  color: #d8e5f2;
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.final-cta-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

@media (min-width: 640px) {
  .final-cta-actions {
    flex-direction: row;
    justify-content: center;
  }
}

.final-btn {
  width: min(380px, 100%);
  min-height: 54px;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 6px 20px rgba(8, 124, 56, 0.45);
}

.secondary {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
}

.secondary:hover {
  background: rgba(255, 255, 255, 0.22);
}

.form-toggle-btn {
  width: min(340px, 100%);
  min-height: 52px;
  font-size: 13.5px;
}

.form-wrapper {
  margin-top: 28px;
  background: #fff;
  color: var(--ink);
  padding: 24px;
  border-radius: 14px;
  text-align: left;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.trust-footer-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
  margin-top: 26px;
  font-size: 12px;
  color: #b2c9de;
}

/* Footer */
.lp-footer {
  background: #091524;
  color: #8c9fae;
  padding: 32px 0 24px;
  font-size: 13px;
}

.lp-footer-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 640px) {
  .lp-footer-inner {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.lp-footer strong {
  color: #fff;
  font-size: 15px;
}

.lp-footer p {
  color: #8c9fae;
  font-size: 12.5px;
  margin-top: 4px;
}

.footer-links {
  display: flex;
  gap: 16px;
  align-items: center;
}

.footer-links a {
  color: #b2c9de;
  text-decoration: none;
}

.footer-links a:hover {
  color: #fff;
}

.copyright {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 11.5px;
  text-align: center;
  color: #6a7d8d;
}

/* Botão Flutuante Piscando: Falar agora no WhatsApp */
.floating-whatsapp {
  position: fixed;
  right: calc(16px + env(safe-area-inset-right, 0px));
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  z-index: 35;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 52px;
  padding: 0 18px;
  border-radius: 999px;
  background: #087c38;
  color: #fff;
  box-shadow: 0 4px 18px rgba(8, 124, 56, 0.45);
  border: 2px solid #fff;
  text-decoration: none;
  animation: pulse-whatsapp 2s infinite ease-in-out;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.floating-whatsapp:hover {
  background: #06662e;
  transform: scale(1.04);
}

.floating-whatsapp :deep(svg) {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

.floating-whatsapp span {
  display: inline-block;
  font-size: 13.5px;
  font-weight: 700;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .floating-whatsapp {
    right: 24px;
    bottom: 24px;
    height: 54px;
    padding: 0 22px;
  }
  .floating-whatsapp span {
    font-size: 14.5px;
  }
}

@keyframes pulse-whatsapp {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.8), 0 4px 18px rgba(8, 124, 56, 0.4); filter: brightness(1); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 14px rgba(37, 211, 102, 0), 0 8px 24px rgba(8, 124, 56, 0.55); filter: brightness(1.12); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0), 0 4px 18px rgba(8, 124, 56, 0.4); filter: brightness(1); }
}

/* Prova de confiança próxima à decisão, sem acrescentar altura fixa. */
.hero-trust {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}
.hero-trust-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  min-height: 58px;
  padding: 10px;
  border: 1px solid #ffffff30;
  border-radius: 10px;
  background: #0d1d30d9;
  color: #fff;
  text-decoration: none;
}
.hero-trust-item > .icon { flex: 0 0 18px; width: 18px; height: 18px; color: var(--brand-gold); }
.hero-trust-item strong { display: block; font-size: 13px; line-height: 1.3; }
.hero-trust-item small { display: block; margin-top: 3px; font-size: 11px; line-height: 1.4; color: #dae6f3; }
.hero-cta-note { margin-top: 7px; color: #fff; font-size: 12px; }
.hero-installation-note { margin-top: 8px; max-width: 470px; color: #e1e9f2; font-size: 12px; line-height: 1.45; }
.hero-trust-item:focus-visible, .comparison-action a:focus-visible { outline: 3px solid var(--brand-gold); outline-offset: 3px; }
.comparison-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.comparison-card { min-width: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 16px; background: #fff; }
.comparison-with { border-color: #91c6a5; background: #f4faf6; }
.comparison-photo { position: relative; aspect-ratio: 16 / 9; overflow: hidden; }
.comparison-photo img { width: 100%; height: 100%; object-fit: cover; }
.comparison-photo > span { position: absolute; left: 14px; bottom: 14px; padding: 7px 12px; background: #233449; color: #fff; font-size: 14px; font-weight: 750; border-radius: 8px; }
.comparison-with .comparison-photo > span { background: #087c38; }
.comparison-copy { padding: 20px; }
.comparison-copy h3 { font-size: 19px; line-height: 1.3; }
.comparison-copy ul { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 10px; }
.comparison-copy li { display: flex; align-items: flex-start; gap: 9px; font-size: 14px; }
.comparison-copy li .icon { flex: 0 0 18px; width: 18px; height: 18px; margin-top: 2px; color: #9a4242; }
.comparison-with li .icon { color: #087c38; }
.comparison-caption { margin-top: 8px; color: var(--text-muted); font-size: 11px; }
.comparison-action { margin-top: 24px; padding: 20px; background: #edf5f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.comparison-action p { max-width: 440px; font-size: 15px; }
.comparison-action .button { flex-shrink: 0; }
.comparison-action :deep(svg) { width: 24px; height: 24px; flex-shrink: 0; }
.installation-details { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 24px; }
.installation-details p { border-left: 3px solid var(--brand-gold); padding-left: 12px; font-size: 14px; }
.installation-details strong, .installation-details span { display: block; }
.installation-details span { margin-top: 5px; font-size: 13px; color: var(--text-muted); }
@media (max-width: 767px) {
  .lp-hero { min-height: 0; }
  .lp-hero-inner { padding: 0 12px; }
  .lp-hero-copy { max-width: none; padding: 34px 0 18px; }
  .hero-actions { margin-top: 12px; }
  .hero-cta-btn { width: 100%; padding-inline: 12px; font-size: 14px; }
  .hero-trust { margin-top: 12px; gap: 6px; }
  .hero-trust-item { padding: 8px; gap: 6px; }
  .hero-trust-item strong { font-size: 12px; }
  .hero-trust-item small { font-size: 10.5px; }
  .hero-benefits-row-top { flex-wrap: wrap; gap: 6px 12px; }
  .comparison-grid { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .comparison-photo { aspect-ratio: 2 / 1; }
  .comparison-copy { padding: 16px; }
  .comparison-copy h3 { font-size: 18px; }
  .comparison-action { flex-direction: column; align-items: stretch; gap: 14px; padding: 16px; }
  .comparison-action .button { width: 100%; padding-inline: 10px; }
  .installation-details { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .floating-whatsapp { animation: none; max-width: calc(100vw - 32px); }
}
@media (prefers-reduced-motion: reduce) {
  .lp-container *, .lp-container *::before, .lp-container *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
</style>
