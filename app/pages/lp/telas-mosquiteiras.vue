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
const heroPassed = ref(false)
let heroObserver = null
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
    title: 'Janela de Correr em Alumínio',
    desc: 'Vedação impecável sem alterar a fachada.',
    img: '/images/telas_com_aluminio.jpg',
    tag: 'Janela'
  },
  {
    title: 'Porta Balcão de Correr',
    desc: 'Deslizamento suave para acesso à sacada.',
    img: '/images/mosquiteira_porta_de_correr.png',
    tag: 'Porta'
  },
  {
    title: 'Sacada Envidraçada',
    desc: 'Proteção total mantendo a ventilação e a vista.',
    img: '/images/telas_para_sacadas.jpg',
    tag: 'Sacada'
  },
  {
    title: 'Janela Residencial Sob Medida',
    desc: 'Acabamento discreto integrado à esquadria existente.',
    img: '/images/tela-para-janela.jpeg',
    tag: 'Janela'
  },
  {
    title: 'Tela Pet Screen Reforçada',
    desc: 'Malha de alta resistência contra arranhões de pets.',
    img: '/images/telas_pet_screen_especificacoes.jpg',
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

function handleScroll() {
  heroPassed.value = window.scrollY > 300
}

onMounted(() => {
  track('landing_view')
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
        <a
          :href="getWhatsappUrl('Olá! Vim pela página de anúncios e gostaria de tirar uma dúvida.')"
          target="_blank"
          rel="noopener noreferrer"
          class="lp-header-cta"
          @click="track('whatsapp_cta_click', { cta_location: 'lp_header' })"
        >
          <WhatsappIcon /> <span>Falar no WhatsApp</span>
        </a>
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

            <ul class="hero-checklist">
              <li><Icon name="lucide:check-circle-2" class="check-icon" /> <span><strong>Fabricação sob medida</strong> para qualquer vão</span></li>
              <li><Icon name="lucide:check-circle-2" class="check-icon" /> <span><strong>Instalação profissional</strong> com vedação total</span></li>
              <li><Icon name="lucide:check-circle-2" class="check-icon" /> <span><strong>Atendimento em São Paulo e região</strong></span></li>
            </ul>

            <!-- Google Rating Badge -->
            <a
              :href="googleReviewsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="hero-google-badge"
              title="Ver avaliações no Google"
            >
              <span class="stars" aria-hidden="true">★★★★★</span>
              <strong>{{ googleReviews.rating }} no Google</strong>
              <span>({{ googleReviews.count }} avaliações) ↗</span>
            </a>
          </div>

          <!-- Hero CTA Button -->
          <div class="hero-actions">
            <a
              :href="getWhatsappUrl('Olá! Gostaria de pedir um orçamento para telas mosquiteiras com esquadria de alumínio.')"
              target="_blank"
              rel="noopener noreferrer"
              class="button green hero-cta-btn"
              data-cta-location="lp_hero"
              @click="track('whatsapp_cta_click', { cta_location: 'lp_hero' })"
            >
              <WhatsappIcon />
              <span>PEDIR ORÇAMENTO NO WHATSAPP →</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Seção de Ação Rápida: Envie uma foto e informe seu CEP -->
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
            @click="track('whatsapp_cta_click', { cta_location: 'quick_photo_band' })"
          >
            <WhatsappIcon />
            <span>ENVIAR FOTO E PEDIR ORÇAMENTO AGORA →</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Galeria de Fotos REAIS de Instalações Feitas pela AD Telas -->
    <section class="section wrap" aria-labelledby="gallery-title">
      <div class="section-heading">
        <p class="eyebrow">INSTALAÇÕES REAIS AD TELAS</p>
        <h2 id="gallery-title">Fotos de Serviços Realizados</h2>
        <p>Veja como as telas ficam discretas, elegantes e perfeitamente integradas às esquadrias de alumínio.</p>
      </div>

      <div class="gallery-grid">
        <article v-for="item in realInstallations" :key="item.title" class="gallery-card">
          <div class="card-img-wrap">
            <img :src="item.img" :alt="item.title" width="480" height="360" loading="lazy" />
            <span class="card-badge">{{ item.tag }}</span>
          </div>
          <div class="card-body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
            <a
              :href="getWhatsappUrl(`Olá! Gostei da foto de ${item.title} e gostaria de um orçamento parecido.`)"
              target="_blank"
              rel="noopener noreferrer"
              class="card-cta-link"
              @click="track('whatsapp_cta_click', { cta_location: 'gallery_card', service: item.title })"
            >
              <span>Quero igual no WhatsApp</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </article>
      </div>
    </section>

    <!-- Modelos Objetivos: Janela | Porta | Sacada | Removível -->
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
              class="button outline-btn"
              @click="track('whatsapp_cta_click', { cta_location: 'quick_models', model: model.name })"
            >
              <WhatsappIcon />
              <span>Pedir para {{ model.name }} →</span>
            </a>
          </article>
        </div>
      </div>
    </section>

    <!-- Depoimentos Reais de Clientes -->
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

    <!-- CTA Final de Conversão -->
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

    <!-- Barra Fixa Inferior no Celular (WhatsApp Always Sticky) -->
    <aside v-show="heroPassed" class="mobile-sticky-bar" aria-label="Ação rápida no celular">
      <a
        :href="getWhatsappUrl('Olá! Estou no site e quero enviar uma foto para orçamento de telas mosquiteiras.')"
        target="_blank"
        rel="noopener noreferrer"
        class="mobile-whatsapp-btn"
        @click="track('whatsapp_cta_click', { cta_location: 'mobile_sticky_bottom' })"
      >
        <WhatsappIcon />
        <span>Falar no WhatsApp Agora</span>
      </a>
    </aside>
    <!-- Botão Flutuante Piscando: Falar agora no WhatsApp -->
    <a
      :href="getWhatsappUrl('Olá! Gostaria de falar com um especialista sobre telas mosquiteiras.')"
      class="floating-whatsapp"
      data-cta-location="floating_whatsapp"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar agora no WhatsApp"
      title="Falar agora no WhatsApp"
      @click="track('whatsapp_cta_click', { cta_location: 'floating_whatsapp' })"
    ><WhatsappIcon aria-hidden="true" /><span>Falar agora no WhatsApp</span></a>
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
  padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .lp-container {
    padding-bottom: 0;
  }
}

.wrap {
  width: min(1200px, calc(100% - 36px));
  margin-inline: auto;
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
  padding-block: 46px;
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
  justify-content: space-between;
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

@media (max-width: 420px) { .lp-brand-text { display: none; } }
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
  padding: 0 0 28px;
  max-width: 480px;
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

.hero-checklist {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: #f1f6fc;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
}

.hero-checklist li {
  display: flex;
  align-items: center;
  gap: 7px;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: #25d366;
  flex-shrink: 0;
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

@media (min-width: 768px) {
  .lp-hero {
    min-height: 640px;
    display: block;
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
  }
  .lp-hero-copy {
    padding: 60px 0 72px;
    max-width: 600px;
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
  .hero-checklist {
    font-size: 13.5px;
    margin-top: 16px;
    gap: 8px;
  }
  .hero-cta-btn {
    width: auto;
    min-height: 56px;
    padding: 14px 28px;
    font-size: 16px;
  }
}

/* Seção de Ação Rápida: Envie foto e CEP */
.quick-quote-band {
  background: #ffffff;
  padding: 32px 0 12px;
  margin-top: -16px;
  position: relative;
  z-index: 10;
}

.quick-quote-card {
  background: linear-gradient(135deg, #f7faff 0%, #eaf2fc 100%);
  border: 2px solid #c8dcf2;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 10px 30px rgba(18, 35, 47, 0.08);
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
  margin: 20px 0;
}

@media (min-width: 640px) {
  .quick-steps-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.step-card {
  background: #fff;
  border: 1px solid #d8e5f2;
  border-radius: 10px;
  padding: 14px;
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
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.35;
}

.quick-cta-row {
  text-align: center;
  margin-top: 12px;
}

.quick-cta-row .button {
  width: min(420px, 100%);
  min-height: 52px;
  font-size: 14.5px;
  font-weight: 800;
  border-radius: 9px;
  box-shadow: 0 4px 16px rgba(8, 124, 56, 0.4);
}

/* Galeria de Fotos Reais */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
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

.card-img-wrap {
  position: relative;
  background: #e8eef5;
  height: 160px;
  overflow: hidden;
}

@media (min-width: 640px) {
  .card-img-wrap {
    height: 220px;
  }
}

.card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.gallery-card:hover .card-img-wrap img {
  transform: scale(1.06);
}

.card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(13, 29, 48, 0.85);
  color: var(--brand-gold);
  font-size: 10.5px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.card-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-body h3 {
  font-size: 15px;
  margin-bottom: 4px;
}

.card-body p {
  font-size: 12.5px;
  line-height: 1.4;
  margin-bottom: 12px;
}

.card-cta-link {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #f0f6fa;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 750;
  color: var(--brand-blue);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.card-cta-link:hover {
  background: var(--brand-blue);
  color: #fff;
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
  border: 1.5px solid var(--brand-blue);
  color: var(--brand-blue);
  background: transparent;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
}

.outline-btn:hover {
  background: var(--brand-blue);
  color: #fff;
}

.outline-btn :deep(svg) {
  width: 17px;
  height: 17px;
  color: #25d366;
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

/* Barra Fixa Inferior no Mobile */
.mobile-sticky-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: rgba(13, 29, 48, 0.94);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding: 8px 14px calc(8px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.25);
}

@media (min-width: 768px) {
  .mobile-sticky-bar {
    display: none;
  }
}

.mobile-whatsapp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  width: 100%;
  border-radius: 999px;
  background: #25d366;
  color: #fff;
  font-size: 14.5px;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 3px 12px rgba(8, 124, 56, 0.4);
}

.mobile-whatsapp-btn :deep(svg) {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

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

</style>
