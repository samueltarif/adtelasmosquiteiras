<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useServicos } from '~/composables/useServicos'

const { WHATSAPP_NUMBER } = useServicos()
definePageMeta({ layout: false })
const heroVisible = ref(true)
const menuOpen = ref(false)
const quoteVisible = ref(true)
let quoteObserver = null
function openQuoteForm() {
  const formEl = document.getElementById('orcamento-telas')
  const nameInput = document.getElementById('quote-name')
  if (formEl) {
    formEl.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    setTimeout(() => {
      nameInput?.focus({ preventScroll: true })
    }, 450)
  }
}

useHead({
  title: 'Telas Mosquiteiras em São Paulo | Modelos Sob Medida | AD Telas',
  meta: [
    { name: 'description', content: 'Telas mosquiteiras sob medida para janelas, portas, sacadas e ambientes comerciais em São Paulo. Instalação profissional. Solicite seu orçamento.' },
    { property: 'og:title', content: 'Telas Mosquiteiras SP | AD Telas e Redes' },
    { property: 'og:description', content: 'Modelos de telas mosquiteiras sob medida para sua residência ou comércio. Solicite um orçamento.' },
  ]
})

// Principais modelos com landing pages dedicadas
const modelosPrincipais = [
  { path: '/servicos/telas/janelas', titulo: 'Telas para Janelas', desc: 'Modelos sob medida para janelas de correr, basculantes e pivotantes', icon: 'lucide:layout-grid', img: '/images/tela_mosquiteira.png' },
  { path: '/servicos/telas/portas', titulo: 'Telas para Portas', desc: 'Soluções para portas balcão e acessos frequentes com ajuste preciso', icon: 'lucide:door-open', img: '/images/telas_para_portas.jpeg' },
  { path: '/servicos/telas/sacadas-e-varandas', titulo: 'Sacadas e Varandas', desc: 'Proteção contra insetos para áreas externas e terraços', icon: 'lucide:sun', img: '/images/telas_para_varandas.jpg' },
  { path: '/servicos/telas/removivel', titulo: 'Telas Removíveis', desc: 'Praticidade para encaixar, retirar e higienizar quando desejar', icon: 'lucide:move', img: '/images/mosquiteira_removivel.png' },
  { path: '/servicos/telas/pet-screen', titulo: 'Pet Screen', desc: 'Modelo voltado para ambientes residenciais com animais', icon: 'lucide:paw-print', img: '/images/telas_pet_screen_especificacoes.jpg' },
  { path: '/servicos/telas/restaurantes', titulo: 'Restaurantes e Cozinhas', desc: 'Proteção contra insetos para ambientes comerciais e alimentícios', icon: 'lucide:utensils', img: '/images/telas_para_restaurantes.jpg' },
]

// Ordenados pelos mais buscados no Google (volume de busca)
const categorias = [
  {
    slug: 'residencial',
    titulo: 'Residencial',
    emoji: '🏠',
    iconName: 'lucide:home',
    descricao: 'Para janelas, portas, varandas e mais',
    servicos: [
      { slug: 'janelas',     titulo: 'Telas Mosquiteiras para Janelas',     descricaoCurta: 'Proteção sob medida para janelas residenciais',        destaque: 'Sob Medida', imagem: '/images/tela_mosquiteira.png', imagens: ['/images/tela_mosquiteira.png', '/images/mosquiteira_janela.png'] },
      { slug: 'portas',      titulo: 'Telas Mosquiteiras para Portas',      descricaoCurta: 'Passagem protegida para portas e acessos',             destaque: 'Sob Medida', imagem: '/images/telas_para_portas.jpeg', imagens: ['/images/telas_para_portas.jpeg', '/images/mosquiteira_para_porta.png'] },
      { slug: 'varandas',    titulo: 'Telas Mosquiteiras para Varandas',    descricaoCurta: 'Aproveite a varanda com proteção contra insetos',       destaque: 'Área externa', imagem: '/images/telas_para_varandas.jpg', imagens: ['/images/telas_para_varandas.jpg', '/images/mosquiteira_area_externa.png'] },
      { slug: 'sacadas',     titulo: 'Telas Mosquiteiras para Sacadas',     descricaoCurta: 'Proteção sob medida contra mosquitos na sacada',       destaque: 'Sob Medida', imagem: '/images/telas_para_sacadas.jpg', imagens: ['/images/telas_para_sacadas.jpg', '/images/telas_para_varandas.jpg'] },
      { slug: 'apartamentos',titulo: 'Telas Mosquiteiras para Apartamentos',descricaoCurta: 'Solução sob medida anti-mosquito para apartamentos',   destaque: 'Sob Medida', imagem: '/images/telas_para_apartamento.jpg', imagens: ['/images/telas_para_apartamento.jpg', '/images/tela_mosquiteira.png'] },
      { slug: 'banheiro',    titulo: 'Telas Mosquiteiras para Banheiro',    descricaoCurta: 'Proteção para janelas de banheiro e ventilação',       destaque: 'Sob Medida', imagem: '/images/telas_para_banheiro.jpg', imagens: ['/images/telas_para_banheiro.jpg', '/images/telas_para_basculante.jpg'] },
    ]
  },
  {
    slug: 'especiais',
    titulo: 'Modelos Especiais',
    emoji: '🔧',
    iconName: 'lucide:wrench',
    descricao: 'Sistemas diferenciados de abertura',
    servicos: [
      { slug: 'correr',    titulo: 'Telas Mosquiteiras de Correr',         descricaoCurta: 'Sistema deslizante prático para janelas',            destaque: 'Deslizante', imagem: '/images/telas_de_correr.jpg', imagens: ['/images/telas_de_correr.jpg', '/images/mosquiteira_porta_de_correr.png'] },
      { slug: 'removivel', titulo: 'Telas Mosquiteiras Removíveis',        descricaoCurta: 'Fácil de remover, instalar e limpar',               destaque: 'Removível', imagem: '/images/mosquiteira_removivel.png', imagens: ['/images/mosquiteira_removivel.png', '/images/tela_mosquiteira.png'] },
      { slug: 'aluminio',  titulo: 'Telas Mosquiteiras com Perfis',        descricaoCurta: 'Estrutura com perfis sob medida',                   destaque: 'Sob Medida', imagem: '/images/telas_com_aluminio.jpg', imagens: ['/images/telas_com_aluminio.jpg', '/images/telas_com_aco_inox.jpg'] },
      { slug: 'basculante',titulo: 'Telas Mosquiteiras para Basculantes',  descricaoCurta: 'Específica para janelas basculantes',               destaque: 'Sob Medida', imagem: '/images/telas_para_basculante.jpg', imagens: ['/images/telas_para_basculante.jpg', '/images/telas_para_banheiro.jpg'] },
      { slug: 'pivotante', titulo: 'Telas Mosquiteiras Pivotantes',        descricaoCurta: 'Abertura giratória funcional',                      destaque: 'Pivotante', imagem: '/images/telas_de_correr.jpg', imagens: ['/images/telas_de_correr.jpg', '/images/mosquiteira_removivel.png'] },
      { slug: 'acoinox',   titulo: 'Telas Mosquiteiras Especiais',       descricaoCurta: 'Opção sob medida para projetos específicos',        destaque: 'Sob Medida', imagem: '/images/telas_com_aco_inox.jpg', imagens: ['/images/telas_com_aco_inox.jpg', '/images/telas_com_aluminio.jpg'] },
    ]
  },
  {
    slug: 'pet',
    titulo: 'Pet Screen',
    emoji: '🐾',
    iconName: 'lucide:paw-print',
    descricao: 'Telas para ambientes com animais',
    servicos: [
      { slug: 'pets',       titulo: 'Telas Mosquiteiras Pet Screen',         descricaoCurta: 'Modelo para casas com cães e gatos',                destaque: 'Pet Screen', imagem: '/images/telas_pet_screen_especificacoes.jpg', imagens: ['/images/telas_pet_screen_especificacoes.jpg', '/images/pets_pro.png'] },
      { slug: 'pernilongos',titulo: 'Telas Mosquiteiras Anti-Pernilongos',   descricaoCurta: 'Malha fina para proteção contra insetos',           destaque: 'Malha Fina', imagem: '/images/telas_anti-pernilongos.jpg', imagens: ['/images/telas_anti-pernilongos.jpg', '/images/tela_mosquiteira.png'] },
    ]
  },
  {
    slug: 'comercial',
    titulo: 'Fachadas e Ambientes Comerciais',
    emoji: '🏢',
    iconName: 'lucide:building-2',
    descricao: 'Soluções para grandes áreas e comércios',
    servicos: [
      { slug: 'fachadas',    titulo: 'Telas Mosquiteiras para Fachadas',    descricaoCurta: 'Proteção para fachadas de edifícios',               destaque: 'Fachadas', imagem: '/images/telas_para_fachadas_especificacoes.png', imagens: ['/images/telas_para_fachadas_especificacoes.png', '/images/telas_para_coberturas.jpg'] },
      { slug: 'coberturas',  titulo: 'Telas Mosquiteiras para Coberturas',  descricaoCurta: 'Proteção em áreas cobertas e vãos',                 destaque: 'Sob Medida', imagem: '/images/telas_para_coberturas.jpg', imagens: ['/images/telas_para_coberturas.jpg', '/images/telas_para_restaurantes.jpg'] },
      { slug: 'restaurantes',titulo: 'Telas Mosquiteiras para Restaurantes',descricaoCurta: 'Ambiente protegido contra insetos para seu negócio',destaque: 'Comercial', imagem: '/images/telas_para_restaurantes.jpg', imagens: ['/images/telas_para_restaurantes.jpg', '/images/telas_para_fachadas_especificacoes.png'] },
      { slug: 'industrias',  titulo: 'Telas Mosquiteiras para Indústrias',  descricaoCurta: 'Proteção para galpões e indústrias',                destaque: 'Industrial', imagem: '/images/telas_para_coberturas.jpg', imagens: ['/images/telas_para_coberturas.jpg', '/images/telas_para_restaurantes.jpg'] },
    ]
  }
]

const getWhatsappUrl = (servicoTitulo) => {
  const msg = `Olá! Gostaria de um orçamento para:\n\nServiço: ${servicoTitulo}\n\nVim pelo site: https://www.adtelasmosquiteiras.com.br/\n\nPode me ajudar?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

const getTelasServiceKey = (slug) => {
  const map = {
    removivel: 'telas_removiveis',
    aluminio: 'telas_perfis',
    basculante: 'telas_basculantes',
    pivotante: 'telas_pivotantes',
    acoinox: 'telas_especiais',
    pets: 'pet_screen',
    pernilongos: 'telas_anti_pernilongos'
  }
  return map[slug] || (slug.startsWith('telas') ? slug : 'telas_' + slug)
}

const getTelasDetailPath = (slug) => {
  const map = {
    janelas: '/servicos/telas/janelas',
    portas: '/servicos/telas/portas',
    varandas: '/servicos/telas/sacadas-e-varandas',
    sacadas: '/servicos/telas/sacadas-e-varandas',
    apartamentos: '/servicos/telas/janelas',
    banheiro: '/servicos/telas/janelas',
    correr: '/servicos/telas/janelas',
    removivel: '/servicos/telas/removivel',
    aluminio: '/servicos/telas/removivel',
    basculante: '/servicos/telas/janelas',
    pivotante: '/servicos/telas/janelas',
    acoinox: '/servicos/telas/removivel',
    pets: '/servicos/telas/pet-screen',
    pernilongos: '/servicos/telas/janelas',
    fachadas: '/servicos/telas/restaurantes',
    coberturas: '/servicos/telas/sacadas-e-varandas',
    restaurantes: '/servicos/telas/restaurantes',
    industrias: '/servicos/telas/restaurantes'
  }
  return map[slug] || null
}

// Public Google profile checked on 2026-09-22; curated snapshot, not a live feed.
const googleReviewsUrl = 'https://share.google/FZ810y9akHJ1iFS9q'
const googleReviews = { rating: '5,0', count: 49, checkedAt: '22/09/2026' }
const reviews = [
 {name:'Valter Jose', text:'Excelente serviço. Muito bem feito. Recomendo!!'},
 {name:'Giovana Naomi', text:'A instalação ficou perfeita, atendimento também. Recomendo o serviço, foram super pontuais e profissionais.'},
 {name:'Edna Oliveira', text:'Profissional pontual, orçamento certo, serviço limpo e de qualidade, recomendo 👍🏾'}
]
const benefits = [
 {icon:'lucide:ruler',title:'Produtos sob medida',text:'Telas feitas para as medidas do seu ambiente.'},
 {icon:'lucide:wrench',title:'Instalação profissional',text:'Cuidado na montagem e no acabamento.'},
 {icon:'lucide:wind',title:'Conforto no dia a dia',text:'Proteção contra insetos com ventilação.'},
 {icon:'lucide:map-pin',title:'São Paulo e região',text:'Atendimento no local da instalação.'}
]
const faqs = [
 {q:'Vocês atendem em quais regiões?',a:'Atendemos São Paulo e região. Informe o CEP da instalação para confirmar o atendimento no seu endereço.'},
 {q:'As telas são realmente sob medida?',a:'Sim. O modelo e as medidas são definidos de acordo com as janelas, portas ou vãos do seu ambiente.'},
 {q:'Quanto tempo leva para instalar?',a:'O prazo depende do modelo, das medidas e da quantidade de telas. Nossa equipe confirma o prazo no orçamento.'},
 {q:'Posso escolher a cor da tela?',a:'Fale com nossa equipe para consultar as opções de acabamento disponíveis para o modelo escolhido.'},
 {q:'Como faço a limpeza?',a:'Os cuidados variam conforme o modelo. As telas removíveis facilitam a retirada para limpeza; nossa equipe orienta sobre a manutenção.'}
]
onMounted(() => {
 quoteObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
   if (entry.target.id === 'telas-hero') heroVisible.value = entry.isIntersecting
   else quoteVisible.value = entry.isIntersecting
  }
 })
 for (const id of ['telas-hero','orcamento-telas']) {
  const el = document.getElementById(id)
  if (el) quoteObserver.observe(el)
 }
})
onUnmounted(() => quoteObserver?.disconnect())
</script>

<template>
 <div class="telas-page">
  <a class="skip-link" href="#conteudo-telas">Ir para o conteúdo</a>
  <header class="site-header" data-cta-location="header">
   <div class="wrap header-inner">
    <NuxtLink to="/" aria-label="AD Telas — início"><img src="/images/logo-adt-lp.png" width="112" height="56" alt="AD Telas e Redes" /></NuxtLink>
    <nav aria-label="Navegação da página" class="desktop-nav"><a href="#solucoes">Serviços</a><a href="#galeria">Galeria</a><a href="#diferenciais">Sobre nós</a><a href="#avaliacoes">Avaliações</a><a href="#duvidas">Dúvidas</a></nav>
    <a :href="getWhatsappUrl('Telas Mosquiteiras')" class="button green header-cta" target="_blank" rel="noopener noreferrer"><WhatsappIcon /> <span>Orçamento <span class="desktop-word">pelo WhatsApp</span></span></a>
    <button class="menu-toggle" :aria-expanded="menuOpen" aria-controls="telas-menu" aria-label="Abrir navegação" @click="menuOpen = !menuOpen"><Icon :name="menuOpen ? 'lucide:x' : 'lucide:menu'" /></button>
   </div>
   <nav v-if="menuOpen" id="telas-menu" class="mobile-nav" aria-label="Navegação mobile" @click="menuOpen = false"><a href="#solucoes">Serviços</a><a href="#galeria">Galeria</a><a href="#avaliacoes">Avaliações</a><a href="#duvidas">Dúvidas</a><a href="#orcamento-telas">Orçamento</a></nav>
  </header>
  <main id="conteudo-telas">
   <section id="telas-hero" class="hero" data-cta-location="hero" data-service-key="telas" data-service-name="Telas Mosquiteiras">
    <picture class="hero-photo"><source media="(max-width: 767px)" srcset="/images/telas-instalacao-640.jpg" /><img src="/images/telas-instalacao-1440.jpg" width="1440" height="960" alt="Imagem ilustrativa de instalação de tela mosquiteira em uma janela" fetchpriority="high" /></picture>
    <div class="wrap hero-inner"><div class="hero-copy">
     <p class="eyebrow">Mais conforto para o seu dia a dia</p>
     <h1>Telas Mosquiteiras <span>Sob Medida em São Paulo</span></h1>
     <p class="hero-description">Proteja sua família de insetos com soluções sob medida para janelas, portas e sacadas. Instalação profissional, com acabamento discreto para sua casa.</p>
     <div class="hero-actions"><a :href="getWhatsappUrl('Telas Mosquiteiras')" class="button green" target="_blank" rel="noopener noreferrer"><WhatsappIcon /> Pedir orçamento pelo WhatsApp <span aria-hidden="true">→</span></a><a href="#orcamento-telas" class="button secondary" @click.prevent="openQuoteForm"><Icon name="lucide:clipboard-list" /> Receber orçamento pelo formulário</a></div>
     <ul class="hero-benefits"><li><Icon name="lucide:shield-check" /> Proteção contra insetos</li><li><Icon name="lucide:wind" /> Mais ventilação</li><li><Icon name="lucide:ruler" /> Feito sob medida</li></ul>
    </div></div>
   </section>
   <section id="solucoes" class="section wrap">
    <div class="section-heading"><p class="eyebrow">Nossos serviços</p><h2>Soluções para cada ambiente</h2><p>Telas mosquiteiras sob medida para sua casa ou empresa.</p></div>
    <div class="services-grid">
     <NuxtLink v-for="modelo in modelosPrincipais.slice(0,4)" :key="modelo.path" :to="modelo.path" class="service-card" data-cta-location="service_card" :data-service-key="getTelasServiceKey(modelo.path.split('/').pop())" :data-service-name="modelo.titulo" :aria-label="'Saiba mais: ' + modelo.titulo">
      <img :src="modelo.img" :alt="modelo.titulo" width="480" height="360" loading="lazy" /><div class="card-body"><h3>{{ modelo.titulo }}</h3><p>{{ modelo.desc }}</p><span class="card-link">Saiba mais <span aria-hidden="true">→</span></span></div>
     </NuxtLink>
    </div>
    <details class="more-services"><summary>Ver mais modelos e aplicações <span aria-hidden="true">＋</span></summary><div class="extra-services"><div v-for="categoria in categorias" :key="categoria.slug"><h3>{{ categoria.titulo }}</h3><div v-for="servico in categoria.servicos" :key="servico.slug" class="extra-row" data-cta-location="service_card" :data-service-key="getTelasServiceKey(servico.slug)" :data-service-name="servico.titulo"><NuxtLink :to="getTelasDetailPath(servico.slug)">{{ servico.titulo }} →</NuxtLink><a :href="getWhatsappUrl(servico.titulo)" target="_blank" rel="noopener noreferrer" :aria-label="'Orçamento pelo WhatsApp: ' + servico.titulo"><WhatsappIcon /></a></div></div></div></details>
   </section>
   <section id="galeria" class="gallery-section"><div class="wrap gallery-layout"><div><p class="eyebrow">Modelos e aplicações</p><h2>Veja as telas de perto</h2><p>Acabamentos discretos e soluções que se adaptam ao seu ambiente.</p><a href="#solucoes" class="text-link">Encontrar meu modelo →</a></div><div class="gallery-grid"><figure v-for="modelo in modelosPrincipais.slice(0,4)" :key="modelo.path"><img :src="modelo.img" :alt="modelo.titulo" width="360" height="420" loading="lazy" /><figcaption>{{ modelo.titulo }}</figcaption></figure></div></div></section>
   <section id="diferenciais" class="section wrap benefits-layout"><div><p class="eyebrow">Cuidado em cada detalhe</p><h2>Por que escolher a AD Telas?</h2></div><div class="benefits-grid"><article v-for="item in benefits" :key="item.title"><Icon :name="item.icon" /><h3>{{ item.title }}</h3><p>{{ item.text }}</p></article></div></section>
   <section class="contact-band" data-cta-location="service_page"><div class="wrap"><p class="eyebrow">Vamos cuidar do seu projeto</p><h2>Solicite seu orçamento agora mesmo</h2><p>Conte o que você precisa. Nossa equipe ajuda a encontrar a tela para o seu ambiente.</p><div class="band-actions"><a :href="getWhatsappUrl('Telas Mosquiteiras')" class="button green" target="_blank" rel="noopener noreferrer"><WhatsappIcon /> Quero falar no WhatsApp →</a><a class="button secondary" href="#orcamento-telas" @click.prevent="openQuoteForm">Preencher formulário</a></div><p class="band-note">✓ Atendimento no local <span>✓ Orçamento gratuito</span></p></div></section>
   <section id="avaliacoes" class="section wrap"><div class="section-heading"><p class="eyebrow">Quem já escolheu a AD Telas</p><h2>O que nossos clientes dizem</h2><p>Depoimentos de clientes no Google.</p></div><div class="google-review-summary"><a :href="googleReviewsUrl" target="_blank" rel="noopener noreferrer" class="google-rating"><span class="stars" aria-hidden="true">★★★★★</span><strong>{{ googleReviews.rating }} de 5 no Google</strong><span>{{ googleReviews.count }} avaliações ↗</span></a><p>Dados conferidos em {{ googleReviews.checkedAt }}.</p></div><div class="reviews-grid"><article v-for="review in reviews" :key="review.name" class="review"><span class="stars" aria-label="5 estrelas">★★★★★</span><blockquote>“{{ review.text }}”</blockquote><div class="review-person"><span class="avatar" aria-hidden="true">{{ review.name.charAt(0) }}</span><div><strong>{{ review.name }}</strong><a :href="googleReviewsUrl" target="_blank" rel="noopener noreferrer">Ver avaliações no Google ↗</a></div></div></article></div></section>
   <section class="process-section wrap"><div class="section-heading"><h2>Como funciona</h2><p>Do primeiro contato à instalação.</p></div><ol class="process-grid"><li v-for="(step,index) in [{title:'Faça seu contato',text:'Pelo WhatsApp ou formulário.',icon:'lucide:message-circle'},{title:'Conte sobre seu espaço',text:'Avaliamos o modelo e as medidas.',icon:'lucide:ruler'},{title:'Receba seu orçamento',text:'Uma proposta para o seu projeto.',icon:'lucide:clipboard-list'},{title:'Agende a instalação',text:'Com a nossa equipe profissional.',icon:'lucide:wrench'}]" :key="step.title"><span class="step-number">{{ index + 1 }}</span><Icon :name="step.icon" /><h3>{{ step.title }}</h3><p>{{ step.text }}</p></li></ol></section>
   <section id="duvidas" class="faq-section"><div class="wrap faq-layout"><div><p class="eyebrow">Pode perguntar</p><h2>Dúvidas frequentes</h2><p>Saiba mais sobre nossas telas mosquiteiras.</p></div><div><details v-for="faq in faqs" :key="faq.q" class="faq"><summary>{{ faq.q }}<span aria-hidden="true">＋</span></summary><p>{{ faq.a }}</p></details></div></div></section>
   <section class="section wrap quote-layout" data-cta-location="quote_form"><div><p class="eyebrow">Seu projeto começa aqui</p><h2>Mais conforto para sua casa.</h2><p>Preencha seus dados para receber um orçamento. Se preferir, converse diretamente com nossa equipe.</p><a :href="getWhatsappUrl('Telas Mosquiteiras')" class="button green" target="_blank" rel="noopener noreferrer"><WhatsappIcon /> Chamar no WhatsApp</a><a href="tel:+5511983586611" class="phone-link"><Icon name="lucide:phone" /> (11) 98358-6611</a></div><LandingQuoteForm :show-trust-badges="false" /></section>
  </main>
  <footer data-cta-location="footer"><div class="wrap footer-grid"><div><NuxtLink to="/" class="footer-brand">AD TELAS<span>MOSQUITEIRAS SOB MEDIDA</span></NuxtLink><p>Mais conforto para você e sua família.</p></div><div><h2>Navegue</h2><NuxtLink to="/">Início</NuxtLink><a href="#galeria">Galeria</a><a href="#duvidas">Dúvidas</a><a href="#orcamento-telas">Orçamento</a></div><div><h2>Serviços</h2><NuxtLink v-for="modelo in modelosPrincipais" :key="modelo.path" :to="modelo.path">{{ modelo.titulo }}</NuxtLink></div><div><h2>Atendimento</h2><a :href="getWhatsappUrl('Telas Mosquiteiras')" target="_blank" rel="noopener noreferrer">Fale no WhatsApp ↗</a><a href="tel:+5511983586611">(11) 98358-6611</a><p>São Paulo e região</p></div></div><div class="wrap footer-bottom"><span>© {{ new Date().getFullYear() }} AD Telas. Todos os direitos reservados.</span><NuxtLink to="/politica-de-privacidade">Política de Privacidade</NuxtLink></div></footer>
  <a
    :href="getWhatsappUrl('Telas Mosquiteiras')"
    class="floating-whatsapp"
    :class="{ 'above-sticky': !heroVisible && !quoteVisible }"
    data-cta-location="floating_whatsapp"
    data-service-key="telas"
    data-service-name="Telas Mosquiteiras"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Pedir orçamento pelo WhatsApp"
    title="Pedir orçamento pelo WhatsApp"
  ><WhatsappIcon aria-hidden="true" /><span>Falar no WhatsApp</span></a>
  <div v-show="!heroVisible && !quoteVisible" class="mobile-sticky" data-cta-location="service_page"><a class="button green" href="#orcamento-telas" @click.prevent="openQuoteForm">Pedir orçamento gratuito <span aria-hidden="true">→</span></a></div>
 </div>
</template>

<style scoped>
.google-review-summary{text-align:center;margin:-8px 0 25px}.google-rating{display:inline-flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 14px;min-height:48px;padding:10px 18px;border:1px solid #dce5ef;border-radius:8px;background:#f2f5f9;font-size:14px}.google-rating strong{color:var(--brand-blue)}.google-rating>span:last-child{text-decoration:underline;text-underline-offset:3px}.google-review-summary p{font-size:12px;margin-top:8px}

.floating-whatsapp{position:fixed;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:21;display:flex;align-items:center;justify-content:center;gap:10px;width:56px;height:56px;border-radius:999px;background:#087c38;color:#fff;box-shadow:0 4px 18px #12232f40;border:2px solid #fff}
.floating-whatsapp:hover{background:#06662e}
.floating-whatsapp :deep(svg){width:28px;height:28px;flex-shrink:0}
.floating-whatsapp span{display:none}
@media(max-width:767px){.floating-whatsapp.above-sticky{bottom:calc(88px + env(safe-area-inset-bottom,0px))}}
@media(min-width:768px){.floating-whatsapp{right:24px;bottom:24px;width:auto;padding:0 20px}.floating-whatsapp span{display:inline;font-size:14px;font-weight:700}}

.telas-page :deep(.iconify){width:24px;height:24px;flex-shrink:0}.benefits-grid :deep(.iconify){width:30px;height:30px;color:var(--brand-blue);margin-bottom:12px}.process-grid :deep(.iconify){width:27px;height:27px;margin-bottom:12px;color:var(--brand-blue)}
.telas-page{--brand-blue:#234b73;--brand-gold:#f2bd16;--whatsapp:#087c38;--ink:#182f49;color:var(--ink);background:#fff;font-family:inherit;line-height:1.5;padding-bottom:calc(80px + env(safe-area-inset-bottom))}.wrap{width:min(1200px,calc(100% - 40px));margin-inline:auto}h1,h2,h3,p{margin:0}h1,h2,h3{line-height:1.15;letter-spacing:-.035em}h2{font-size:clamp(27px,3vw,36px);font-weight:800}h3{font-size:19px;font-weight:750}p{color:#52616b}a,button,summary{-webkit-tap-highlight-color:transparent}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #234b73;outline-offset:4px}section[id],:deep(#orcamento-telas){scroll-margin-top:24px}.button{min-height:48px;padding:12px 18px;display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:7px;font-size:14px;font-weight:700;text-align:center;line-height:1.4}.button svg,.button :deep(svg){width:21px;height:21px;flex-shrink:0}.green{color:white;background:var(--whatsapp);border:1px solid var(--whatsapp)}.green:hover{background:#06662e}.secondary{background:#f1f6f7;color:var(--ink);border:1px solid #d5e0e5}.eyebrow{font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--brand-blue);margin-bottom:12px}.section{padding-block:46px}.section-heading{text-align:center;margin-bottom:25px}.section-heading p:last-child{margin-top:10px;font-size:14px}.site-header{border-bottom:1px solid #e8edef;background:white;position:relative;z-index:2}.header-inner{display:flex;align-items:center;justify-content:space-between;gap:10px;height:72px}.header-inner img{width:105px;height:auto}.desktop-nav{display:none}.header-cta{font-size:12px;min-height:44px;padding:9px 11px}.desktop-word{display:none}.menu-toggle{display:grid;place-items:center;min-width:44px;min-height:44px}.mobile-nav{display:grid;padding:8px 20px 16px;border-top:1px solid #eee}.mobile-nav a{padding:12px}.skip-link{position:absolute;left:16px;top:-100px;z-index:10;background:white;padding:12px}.skip-link:focus{top:10px}.hero{display:flex;flex-direction:column;background:#f1f5fa;position:relative}.hero-inner{order:0}.hero-copy{padding:30px 0 25px}.hero h1{font-size:clamp(34px,8.7vw,48px);font-weight:800;max-width:650px}.hero h1 span{display:block;color:var(--brand-blue)}.hero-description{font-size:15px;margin-top:18px;max-width:540px}.hero-actions{display:grid;gap:10px;margin-top:22px}.hero-benefits{display:flex;gap:14px;margin:23px 0 0;padding:0;list-style:none;font-size:11px;font-weight:600}.hero-benefits li{flex:1;display:flex;align-items:center;gap:7px}.hero-benefits :deep(svg){width:24px;height:24px;flex-shrink:0;color:var(--brand-blue)}.hero-photo{order:1;height:230px;overflow:hidden}.hero-photo img{width:100%;height:100%;object-fit:cover;object-position:65% 45%}.services-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.service-card{overflow:hidden;border:1px solid #e0e7eb;border-radius:8px;background:white;display:flex;flex-direction:column;box-shadow:0 4px 14px #12232f06}.service-card:hover{border-color:#7894b0}.service-card>img{width:100%;height:135px;object-fit:cover}.card-body{padding:13px 11px;display:flex;flex:1;flex-direction:column}.card-body h3{font-size:17px;letter-spacing:-.025em}.card-body p{font-size:12px;margin:9px 0 14px;line-height:1.5}.card-link{margin-top:auto;display:flex;justify-content:space-between;align-items:center;min-height:44px;font-size:12px;font-weight:700;color:var(--brand-blue);border-top:1px solid #edf1f2}.more-services{margin-top:22px;border-bottom:1px solid #e2e8e6}.more-services summary,.faq summary{display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:50px;cursor:pointer;list-style:none;font-size:14px;font-weight:650}.more-services summary::-webkit-details-marker,.faq summary::-webkit-details-marker{display:none}.more-services[open]>summary span,.faq[open]>summary span{transform:rotate(45deg)}.extra-services{display:grid;gap:24px;padding:20px 0}.extra-services h3{font-size:16px;margin-bottom:8px}.extra-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #edf1f2;font-size:13px}.extra-row a{padding:12px 0;min-height:44px}.extra-row a:last-child{min-width:44px;display:grid;place-items:center;color:var(--brand-blue)}.extra-row :deep(svg){width:21px;height:21px}.gallery-section{padding:36px 0;background:#f2f5f9}.gallery-layout>div>p:not(.eyebrow){margin-top:14px;font-size:14px}.text-link{display:inline-flex;min-height:44px;align-items:center;font-size:14px;font-weight:650;color:var(--brand-blue);margin-top:12px}.gallery-grid{display:grid;grid-template-columns:repeat(4,155px);gap:12px;overflow:auto;margin-top:24px;padding-bottom:10px;scroll-snap-type:x proximity}.gallery-grid figure{margin:0;scroll-snap-align:start}.gallery-grid img{width:100%;height:190px;object-fit:cover;border-radius:7px}.gallery-grid figcaption{font-size:12px;padding-top:8px}.benefits-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 18px;margin-top:26px}.benefits-grid article>:deep(svg){width:30px;height:30px;color:var(--brand-blue);margin-bottom:12px}.benefits-grid h3{font-size:16px;letter-spacing:-.02em}.benefits-grid p{font-size:13px;margin-top:8px}.contact-band{padding:42px 0;background:linear-gradient(90deg,#132c4aed,#172f4cdc),url('/images/telas-instalacao-1440.jpg') center 53%/cover;text-align:center;color:white}.contact-band p{color:#e0e8f2;margin-top:14px}.contact-band .eyebrow{color:#f2bd16}.band-actions{display:grid;gap:10px;margin-top:24px}.band-note{font-size:12px;display:flex;justify-content:center;gap:20px}.reviews-grid{display:grid;gap:15px}.review{border:1px solid #e1e8eb;border-radius:8px;padding:22px;display:flex;flex-direction:column}.stars{color:#a96a00;letter-spacing:2px;font-size:17px}.review blockquote{font-size:14px;margin:12px 0 22px;line-height:1.6}.review-person{display:flex;align-items:center;gap:12px;margin-top:auto;font-size:13px}.avatar{background:#edf3fa;color:var(--brand-blue);width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:700}.review-person a{display:flex;align-items:center;font-size:11px;min-height:44px;text-decoration:underline;text-underline-offset:3px}.process-section{padding-bottom:46px}.process-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:25px 18px;list-style:none;padding:0;margin:0}.process-grid li{position:relative;padding:15px 0 0 12px;border-left:1px solid #e2e8e6}.process-grid :deep(svg){width:27px;height:27px;margin-bottom:12px;color:var(--brand-blue)}.process-grid h3{font-size:15px;letter-spacing:-.02em}.process-grid p{font-size:13px;margin-top:8px}.step-number{position:absolute;right:10px;top:8px;font-size:25px;color:#bdcde0;font-weight:800}.faq-section{background:#f5f7fa;padding:40px 0}.faq-layout>div>p:last-child{margin-top:12px;font-size:14px}.faq-layout>div:last-child{margin-top:22px}.faq{border-bottom:1px solid #dfe6e4}.faq summary{padding:12px 0}.faq summary span{font-size:20px;color:var(--brand-blue)}.faq>p{padding:0 20px 18px 0;font-size:14px}.quote-layout>div>p:not(.eyebrow){margin:18px 0 22px;font-size:15px}.phone-link{display:flex;align-items:center;gap:10px;min-height:48px;margin-top:12px;font-weight:650;font-size:15px}.quote-layout>:deep(#orcamento-telas){margin-top:25px}.quote-layout :deep(button[type=submit]){background:var(--brand-gold);color:var(--ink)}.quote-layout :deep(input),.quote-layout :deep(select){font-size:16px}footer{background:#142b46;color:#fff;padding:40px 0 20px}.footer-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px 20px}.footer-grid>div:first-child{grid-column:1/-1}.footer-grid h2{font-size:16px;letter-spacing:0;margin-bottom:12px}.footer-grid a:not(.footer-brand){display:flex;align-items:center;min-height:44px;font-size:13px;color:#dce5ef}.footer-grid p{color:#bacadc;font-size:13px;margin-top:12px}.footer-brand{font-size:26px;font-weight:800;letter-spacing:-.04em}.footer-brand span{display:block;font-size:10px;letter-spacing:.13em;font-weight:500}.footer-bottom{border-top:1px solid #ffffff20;margin-top:32px;padding-top:18px;font-size:11px;color:#bacadc;display:flex;flex-direction:column;gap:12px}.footer-bottom a{min-height:44px;display:flex;align-items:center}.mobile-sticky{position:fixed;bottom:0;inset-inline:0;padding:10px 20px calc(10px + env(safe-area-inset-bottom));background:#ffffffef;border-top:1px solid #dce5ef;z-index:20}.mobile-sticky .button{width:100%}
@media(min-width:768px){.telas-page{padding-bottom:0}.wrap{width:min(1200px,calc(100% - 64px))}.header-inner{height:80px}.header-inner img{width:120px}.desktop-word{display:inline}.menu-toggle,.mobile-nav,.mobile-sticky{display:none!important}.desktop-nav{display:flex;gap:22px;font-size:13px}.desktop-nav a{padding:14px 0}.header-cta{font-size:13px;padding-inline:16px}.hero{min-height:560px;display:block;color:white;background:#142b46}.hero-photo{position:absolute;inset:0;height:auto}.hero-photo img{object-position:center 45%}.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#11253df5 0%,#18324fe6 28%,#18324f80 53%,transparent 79%)}.hero-inner{position:relative;z-index:1}.hero-copy{padding:68px 0;max-width:620px}.hero h1{font-size:clamp(40px,4.1vw,57px)}.hero h1 span{color:#f2bd16}.hero .eyebrow{color:#c6d5e6}.hero-description{color:#f0f4fa;font-size:17px;max-width:510px}.hero-actions{display:flex;flex-wrap:wrap;max-width:580px}.hero .secondary,.contact-band .secondary{background:#ffffff0d;color:white;border-color:#c1cfdf}.hero-benefits{font-size:12px;max-width:500px;margin-top:30px}.hero-benefits :deep(svg){color:#f2bd16}.section{padding-block:56px}.services-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.service-card>img{height:190px}.card-body{padding:19px}.card-body h3{font-size:19px}.card-body p{font-size:14px}.card-link{font-size:13px;background:#f2f6f6;border:1px solid #e2e9ea;padding-inline:13px;border-radius:5px}.extra-services{grid-template-columns:repeat(2,minmax(0,1fr))}.gallery-layout{display:grid;grid-template-columns:250px 1fr;gap:35px;align-items:center}.gallery-grid{margin:0;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;overflow:visible}.gallery-grid img{height:220px}.benefits-layout{display:grid;grid-template-columns:240px 1fr;gap:35px;align-items:center}.benefits-grid{grid-template-columns:repeat(4,minmax(0,1fr));margin-top:0;gap:20px}.benefits-grid article{border-left:1px solid #e4ebe7;padding-left:20px}.band-actions{display:flex;justify-content:center}.contact-band{padding-block:50px}.reviews-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.process-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.faq-layout{display:grid;grid-template-columns:1fr 1.7fr;gap:70px}.faq-layout>div:last-child{margin-top:0}.quote-layout{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}.quote-layout>:deep(#orcamento-telas){margin-top:0}.footer-grid{grid-template-columns:1.5fr 1fr 1fr 1.2fr}.footer-grid>div:first-child{grid-column:auto}.footer-bottom{flex-direction:row;align-items:center;justify-content:space-between}}
.mobile-sticky .green{background:var(--brand-gold);border-color:var(--brand-gold);color:var(--ink)}
.mobile-sticky .green:hover,.quote-layout :deep(button[type=submit]):hover{background:#dfab08}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style>
