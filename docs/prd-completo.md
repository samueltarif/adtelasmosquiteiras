# 📋 Documento de Requisitos do Produto (PRD) — AD Telas e Redes SP

> **Versão:** 3.0.0  
> **Status:** Atualizado & Otimizado para Produção  
> **Última Atualização:** Agosto/2026  
> **Domínio Oficial:** `https://www.adtelasmosquiteiras.com.br`  

---

## 📑 Sumário Executivo

1. [Visão Geral e Objetivos do Produto](#1-visão-geral-e-objetivos-do-produto)
2. [Stack Tecnológica e Arquitetura do Sistema](#2-stack-tecnológica-e-arquitetura-do-sistema)
3. [Catálogo Completo de Serviços e Produtos](#3-catálogo-completo-de-serviços-e-produtos)
4. [Mapeamento Completo de Páginas e Estrutura de URLs](#4-mapeamento-completo-de-páginas-e-estrutura-de-urls)
5. [Estratégia e Engenharia de SEO (Search Engine Optimization)](#5-estratégia-e-engenharia-de-seo-search-engine-optimization)
6. [Auditoria de SEO e Schema.org por Página](#6-auditoria-de-seo-e-schemaorg-por-página)
7. [Ecossistema de Tags do Google e Analytics (GTM, GA4, Google Ads)](#7-ecossistema-de-tags-do-google-e-analytics-gtm-ga4-google-ads)
8. [Sistema de Conversão, Rastreamento de Leads e Painel Admin](#8-sistema-de-conversão-rastreamento-de-leads-e-painel-admin)
9. [Cobertura Geográfica e Consulta de CEP](#9-cobertura-geográfica-e-consulta-de-cep)
10. [Segurança, Content Security Policy (CSP) e Performance](#10-segurança-content-security-policy-csp-e-performance)

---

## 🎯 1. VISÃO GERAL E OBJETIVOS DO PRODUTO

### 1.1 Propósito
A plataforma da **AD Telas e Redes** é uma aplicação web moderna, de alta performance e focada em conversão, desenvolvida para atender residências, condomínios e estabelecimentos comerciais na Grande São Paulo e regiões metropolitanas. O produto combina:
*   **Catálogo Digital e Institucional:** Apresentação técnica e visual de redes de proteção certificadas, telas mosquiteiras sob medida e soluções de vidraçaria.
*   **Motor de Captação de Leads:** Múltiplos canais de conversão rápida (WhatsApp direto, formulários em 2 etapas, modais responsivos e discagem telefônica).
*   **Painel Administrativo Interno:** Dashboard analítico de métricas, visitantes, cliques em WhatsApp e gerenciamento de status de leads.

### 1.2 Objetivos de Negócio
1.  **Geração de Leads Qualificados:** Canalizar o tráfego orgânico e pago diretamente para atendimento humanizado no WhatsApp com mensagens pré-formatadas contextualizadas por produto e localização.
2.  **Autoridade em SEO Local e Temático:** Ranqueamento orgânico em buscas comerciais de alta intenção (ex: *"redes de proteção para janelas sp"*, *"tela mosquiteira sob medida"*, *"vidro temperado sp"*).
3.  **Transparência e Confiança:** Transmitir credibilidade com certificação técnica (suporte a 500kg, conformidade ABNT/INMETRO, proteção UV), garantia de 2 anos, instalação em 24h a 48h e avaliações reais do Google Reviews.

### 1.3 Personas e Casos de Uso
*   **Famílias com Crianças e Idosos:** Prioridade em segurança contra quedas em apartamentos, sacadas, escadas e janelas.
*   **Tutores de Pets (Gatos e Cães):** Busca por redes e telas resistentes a mordidas/arranhões (*Pet Screen*) para evitar acidentes e fugas.
*   **Moradores com Foco em Saúde:** Prevenção ativa contra vetores de dengue, zika e chikungunya, permitindo manter janelas abertas e ambientes arejados.
*   **Empresas, Restaurantes e Indústrias:** Conformidade sanitária (telas anti-insetos para cozinhas industriais) e soluções em vidraçaria corporativa.

---

## ⚙️ 2. STACK TECNOLÓGICA E ARQUITETURA DO SISTEMA

### 2.1 Tecnologias Centrais
*   **Framework Full-Stack:** Nuxt v4.2.2 (SSR / Server-Side Rendering com Nitro Engine).
*   **Engine de Interface:** Vue.js v3.5.26 (Composition API, `<script setup>`).
*   **Compilador e Bundler:** Vite v7.3.1.
*   **Design & Estilização:** Tailwind CSS v6.14.0 com design system personalizado.
*   **Iconografia:** `@nuxt/icon` v2.2.1 integrando pacote de ícones vetoriais *Lucide*.
*   **Backend & Banco de Dados:** Supabase (PostgreSQL, REST API, Edge Functions).
*   **Serviço de Emails Transacionais:** Resend API e Nodemailer (fallback SMTP).
*   **Rastreamento e Tags:** Google Tag Manager (`GTM-KZTR2DHT`), Google Analytics 4 (`G-S0038L1Q6R`), Google Ads (`AW-17981093809`).

### 2.2 Estrutura de Diretórios do Projeto
```
d:\sicons\ADT\
├── app/
│   ├── assets/
│   │   └── css/tailwind.css             # Diretivas Tailwind e classes utilitárias
│   ├── components/
│   │   ├── Breadcrumb.vue               # Breadcrumb institucional
│   │   ├── BreadcrumbServico.vue        # Breadcrumb da hierarquia de serviços
│   │   ├── CepSearch.vue                # Validador de cobertura por CEP (ViaCEP)
│   │   ├── CtaButton.vue / CtaButtons.vue # Botões de chamada para ação
│   │   ├── FaqSection.vue               # Acordeão de perguntas frequentes
│   │   ├── FloatingButtons.vue          # Botões flutuantes auxiliares
│   │   ├── Footer.vue                   # Rodapé institucional e links legais
│   │   ├── Header.vue                   # Cabeçalho com navegação desktop/mobile
│   │   ├── HeroSection.vue              # Hero principal da Home
│   │   ├── LeadForm.vue                 # Formulário de leads em 2 etapas
│   │   ├── MobileHeroOptimized.vue      # Hero mobile de alta conversão
│   │   ├── MobileUnifiedCTA.vue         # Barra fixa inferior mobile de conversão
│   │   ├── ReviewsCarousel.vue          # Carrossel de avaliações do Google
│   │   ├── ServiceCategoryCards.vue     # Cards de categorias de serviços
│   │   ├── ServiceGrid.vue              # Grade de itens de serviço
│   │   ├── ServicesCards.vue            # Cards de apresentação das famílias
│   │   ├── StickyFormModal.vue          # Modal de formulário dinâmico
│   │   ├── WhatsappFloating.vue         # Botão pulsante fixo do WhatsApp
│   │   └── WhatsappModal.vue            # Modal de envio de lead para WhatsApp
│   ├── composables/
│   │   ├── useClickTracker.ts           # Rastreamento de cliques em CTAs
│   │   ├── useFaq.js                    # FAQs estruturadas
│   │   ├── useFormSubmit.js             # Submissão de leads para API/Supabase/Email
│   │   ├── useGATracking.js             # Helper para eventos GA4 e Measurement Protocol
│   │   ├── useScrollAnimation.js        # Animações de entrada no viewport
│   │   ├── useScrollTo.js               # Rolagem suave com offset de cabeçalho
│   │   ├── useSegments.js               # Segmentação de públicos
│   │   ├── useServicoData.js            # Base estruturada dos serviços flat
│   │   ├── useServicos.js               # Gerenciador da árvore hierárquica (35+ serviços)
│   │   └── useWhatsappModal.js          # Controle de estado do modal de WhatsApp
│   ├── layouts/
│   │   ├── default.vue                  # Layout público principal
│   │   └── admin.vue                    # Layout do painel administrativo
│   ├── pages/
│   │   ├── index.vue                    # Home Page principal
│   │   ├── contato.vue                  # Página de Contato
│   │   ├── orcamento.vue                # Página de Orçamento online
│   │   ├── obrigado.vue                 # Página de Agradecimento (pós-conversão)
│   │   ├── por-que-instalar-tela-mosquiteira.vue # Artigo educativo de autoridade
│   │   ├── admin/
│   │   │   ├── dashboard.vue            # Dashboard de métricas e acessos
│   │   │   └── leads.vue                # Gestão de leads capturados
│   │   └── servicos/
│   │       ├── index.vue                # Central / Hub de Serviços
│   │       ├── redes.vue                # Hub da Família Redes de Proteção
│   │       ├── telas.vue                # Hub da Família Telas Mosquiteiras
│   │       ├── vidracaria.vue           # Página especializada em Vidraçaria
│   │       ├── [slug].vue               # Rota de serviço direto
│   │       ├── [familia]/
│   │       │   ├── index.vue            # Listagem de categorias da família
│   │       │   └── [categoria]/
│   │       │       ├── index.vue        # Listagem de serviços da categoria
│   │       │       └── [servico].vue    # Página individual de serviço hierárquico
│   └── plugins/
│       ├── gtag.client.js               # Injeção e inicialização do GA4 e Google Ads
│       ├── gtm.client.js                # Injeção e inicialização do GTM (Container)
│       ├── track-clicks.client.ts       # Event delegation para gravação de cliques
│       └── track-visits.client.ts       # Gravação de visitas SPA e session ID
├── server/
│   └── api/
│       ├── send-lead.post.ts            # Gravação de lead no Supabase + envio de email
│       ├── track-click.post.ts          # Gravação de cliques no banco
│       ├── track-event.post.js          # Measurement Protocol server-side
│       ├── track-visit.post.ts          # Gravação de pageviews no banco
│       ├── cep/[cep].get.ts             # Proxy de consulta ViaCEP e validação de cidade
│       ├── cron-tick.post.ts            # Processamento de automações periódicas
│       └── admin/
│           ├── dashboard-stats.get.ts   # Métricas consolidadas do dashboard
│           ├── leads.get.ts             # Listagem e busca de leads
│           ├── recent-activity.get.ts   # Log de eventos recentes
│           └── update-lead.post.ts      # Alteração de status e anotações do lead
├── public/
│   ├── images/                          # Imagens, fotos técnicas, banners e logos
│   ├── favicon.ico
│   ├── robots.txt                       # Diretivas para motores de busca
│   ├── politica-de-privacidade.html     # Termos de privacidade em conformidade com LGPD
│   └── termos-de-uso.html               # Termos de uso do serviço
└── nuxt.config.ts                       # Configuração global do Nuxt, SEO e Nitro CSP
```

---

## 🛠️ 3. CATÁLOGO COMPLETO DE SERVIÇOS E PRODUTOS

O catálogo é modelado no composable [`useServicos.js`](file:///d:/sicons/ADT/app/composables/useServicos.js) em uma arquitetura hierárquica escalável de **2 Famílias Principais**, **7 Categorias Temáticas** e **35 Serviços Especializados**, complementados pela divisão dedicada de **Vidraçaria**.

```
                           AD TELAS E REDES
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
 🛡️ Redes de Proteção     🦟 Telas Mosquiteiras       🪟 Vidraçaria
 (17 Serviços)            (18 Serviços)               (3 Linhas Principais)
 ├── Residencial (7)      ├── Residencial (7)         ├── Janelas Temperadas
 ├── Pets & Crianças (5)  ├── Modelos Especiais (6)   ├── Telhados de Vidro
 └── Comercial (5)        ├── Linha Pet (1)           └── Fachadas Comerciais
                          └── Comercial (4)
```

### 3.1 Família 1: Redes de Proteção (17 Serviços)
*   **Material:** Fios 100% polietileno virgem de alta densidade com tratamento anti-UV e antioxidante.
*   **Resistência Técnica:** Suporta impactos de até 500 kg/m² com certificado e malha 3x3cm ou 5x5cm.
*   **Categorias e Itens:**
    1.  **Residencial:** Janelas, Portas Balcão, Sacadas, Varandas, Apartamentos Completos, Escadas/Mezaninos, Janelas Basculantes.
    2.  **Pets e Família:** Redes para Crianças, Redes para Gatos, Redes para Cachorros, Redes para Animais/Aves, Redes para Idosos.
    3.  **Comercial e Áreas Externas:** Redes para Piscinas, Redes para Coberturas, Redes para Muros, Redes para Telhados, Redes para Portões.

### 3.2 Família 2: Telas Mosquiteiras (18 Serviços)
*   **Material:** Fibra de vidro revestida em PVC antichamas, perfis de alumínio anodizado ou aço inox.
*   **Funcionalidade:** Bloqueio 100% de pernilongos, Aedes aegypti, moscas e escorpiões com circulação de ar inalterada.
*   **Categorias e Itens:**
    1.  **Residencial:** Janelas, Portas, Sacadas, Varandas, Apartamentos, Banheiros, Basculantes.
    2.  **Modelos Especiais:** Telas de Correr (trilho), Telas Removíveis (magnéticas/velcro), Telas Anti-pernilongos, Estrutura em Alumínio Anodizado, Telas em Aço Inox, Telas para Fachadas.
    3.  **Linha Pet:** Tela *Pet Screen* (malha reforçada ultrarresistente a arranhões de cães e gatos).
    4.  **Comercial e Sanitária:** Telas para Restaurantes (normas ANVISA), Indústrias, Escolas e Hospitais.

### 3.3 Divisão de Vidraçaria
*   **Página:** [`/servicos/vidracaria`](file:///d:/sicons/ADT/app/pages/servicos/vidracaria.vue)
*   **Aplicações:** Janelas em Vidro Temperado 8mm, Telhados e Coberturas de Vidro Laminado, Fachadas Comerciais e Pele de Vidro.

---

## 🗺️ 4. MAPEAMENTO COMPLETO DE PÁGINAS E ESTRUTURA DE URLS

O projeto possui **16 arquivos `.vue` de páginas** que geram um ecossistema de **56 URLs públicas canônicas** e **8 endpoints de API**.

### 4.1 Sitemap Completo de Rotas Canônicas

| Rota / URL | Arquivo Vue Correspondente | Tipo / Finalidade |
| :--- | :--- | :--- |
| `/` | [`app/pages/index.vue`](file:///d:/sicons/ADT/app/pages/index.vue) | Landing Page principal de alta conversão |
| `/orcamento` | [`app/pages/orcamento.vue`](file:///d:/sicons/ADT/app/pages/orcamento.vue) | Formulário de solicitação de orçamento detalhado |
| `/contato` | [`app/pages/contato.vue`](file:///d:/sicons/ADT/app/pages/contato.vue) | Dados institucionais, telefones, mapa e canais |
| `/obrigado` | [`app/pages/obrigado.vue`](file:///d:/sicons/ADT/app/pages/obrigado.vue) | Página de confirmação e disparo de conversão Ads |
| `/por-que-instalar-tela-mosquiteira` | [`app/pages/por-que-instalar-tela-mosquiteira.vue`](file:///d:/sicons/ADT/app/pages/por-que-instalar-tela-mosquiteira.vue) | Artigo de autoridade médica/sanitária sobre dengue e zika |
| `/servicos` | [`app/pages/servicos/index.vue`](file:///d:/sicons/ADT/app/pages/servicos/index.vue) | Hub geral com resumo das soluções |
| `/servicos/redes` | [`app/pages/servicos/redes.vue`](file:///d:/sicons/ADT/app/pages/servicos/redes.vue) | Landing da família Redes de Proteção |
| `/servicos/telas` | [`app/pages/servicos/telas.vue`](file:///d:/sicons/ADT/app/pages/servicos/telas.vue) | Landing da família Telas Mosquiteiras |
| `/servicos/vidracaria` | [`app/pages/servicos/vidracaria.vue`](file:///d:/sicons/ADT/app/pages/servicos/vidracaria.vue) | Landing especializada de Vidraçaria |
| `/servicos/rede-protecao` | [`app/pages/servicos/[slug].vue`](file:///d:/sicons/ADT/app/pages/servicos/[slug].vue) | Landing direta do serviço de redes |
| `/servicos/tela-mosquiteira` | [`app/pages/servicos/[slug].vue`](file:///d:/sicons/ADT/app/pages/servicos/[slug].vue) | Landing direta do serviço de telas |
| `/servicos/:familia/:categoria` | [`app/pages/servicos/[familia]/[categoria]/index.vue`](file:///d:/sicons/ADT/app/pages/servicos/[familia]/[categoria]/index.vue) | 7 páginas de categorias intermediárias |
| `/servicos/:familia/:categoria/:servico` | [`app/pages/servicos/[familia]/[categoria]/[servico].vue`](file:///d:/sicons/ADT/app/pages/servicos/[familia]/[categoria]/[servico].vue) | 35 páginas individuais de serviços |
| `/admin/dashboard` | [`app/pages/admin/dashboard.vue`](file:///d:/sicons/ADT/app/pages/admin/dashboard.vue) | Painel gerencial com métricas em tempo real |
| `/admin/leads` | [`app/pages/admin/leads.vue`](file:///d:/sicons/ADT/app/pages/admin/leads.vue) | Tabela e CRM simplificado de leads |

### 4.2 Endpoints de API Backend (`server/api/`)

*   `POST /api/send-lead`: Grava novo lead no Supabase e dispara notificação por e-mail (Resend/Nodemailer).
*   `POST /api/track-click`: Registra eventos de clique em botões de WhatsApp, ligações e formulários.
*   `POST /api/track-visit`: Registra pageviews com sessão única para alimentar o Dashboard.
*   `POST /api/track-event`: Gateway do Google Measurement Protocol server-side.
*   `GET /api/cep/[cep]`: Validação de CEP via ViaCEP e checagem de cidades atendidas.
*   `POST /api/cron-tick`: Endpoint de cron jobs para manutenção de banco e métricas periódicas.
*   `GET /api/admin/dashboard-stats`: Consolidação de leads hoje, semana, taxa de conversão e top canais.
*   `GET /api/admin/leads` & `POST /api/admin/update-lead`: Leitura e atualização de status do CRM.

---

## 🔍 5. ESTRATÉGIA E ENGENHARIA DE SEO

A estratégia de SEO do projeto foi concebida para obter a nota máxima em rastreabilidade, indexação e relevância semântica pelos robôs de busca do Google (Googlebot).

### 5.1 Pilares de Otimização Técnica

```
                    ARQUITETURA DE SEO
   ┌───────────────────────┼───────────────────────┐
   │                       │                       │
 Meta Tags & Open Graph  Schema.org (JSON-LD)     Semântica & UX
 ├── Title dinâmico      ├── LocalBusiness        ├── H1 único por página
 ├── Meta Description    ├── Service / Product    ├── Hierarquia H2/H3
 ├── Canonical URLs      ├── FAQPage              ├── Imagens com Alt
 └── OG Images 512x512   └── BreadcrumbList       └── Zero layout shifts (CLS)
```

1.  **Metadados Estritos via `useHead`:**
    *   Todas as páginas definem `title` exclusivo, `description` persuasiva com chamada de ação (CTA) e número de telefone, `keywords` de cauda longa, `htmlAttrs: { lang: 'pt-BR' }` e tags Open Graph completas.
2.  **Dados Estruturados JSON-LD (Schema.org):**
    *   Permite que o Google exiba *Rich Snippets* (perguntas frequentes no resultado de busca, estrelas de avaliação, endereço comercial e botões de contato).
3.  **Hierarquia de Cabeçalhos (Heading Structure):**
    *   Garantia estrita de **exatamente um `<h1>` por página**, com subtítulos organizados sequencialmente em `<h2>` e `<h3>`.
4.  **Performance e Core Web Vitals:**
    *   Renderização SSR ultrarrápida via Nuxt Nitro.
    *   Carregamento assíncrono de scripts externos (`gtag`, `gtm`) sem bloquear a renderização da árvore DOM.
    *   Imagens dimensionadas e otimizadas em formato moderno.

---

## 📊 6. AUDITORIA DE SEO E SCHEMA.ORG POR PÁGINA

Abaixo está o detalhamento de como cada página principal do site está configurada e como se posiciona referente ao SEO:

### 6.1 Página Inicial — Home (`/`)
*   **Arquivo:** [`app/pages/index.vue`](file:///d:/sicons/ADT/app/pages/index.vue)
*   **Title:** `AD Telas e Redes SP - Proteção Profissional | Orçamento Rápido`
*   **Meta Description:** `Telas de segurança e redes protetoras instaladas em SP. Proteja sua família com garantia de qualidade e instalação rápida.`
*   **Hierarquia Semântica:**
    *   `H1`: *"Telas Mosquiteiras e Redes de Proteção em São Paulo"*
    *   `H2`: *"Serviços em Destaque"*, *"Diferenciais e Qualidade"*, *"Avaliações de Clientes"*, *"Perguntas Frequentes"*
*   **Schema.org (JSON-LD):**
    *   `LocalBusiness` + `HomeAndConstructionBusiness`: Informa nome comercial, telefone `+55-11-98358-6611`, horário de funcionamento, faixa de preço, área de atendimento (São Paulo e Grande SP) e geo-coordenadas.
    *   `FAQPage`: Marcação das perguntas frequentes para exibição de respostas diretas na SERP do Google.

### 6.2 Página de Orçamento (`/orcamento`)
*   **Arquivo:** [`app/pages/orcamento.vue`](file:///d:/sicons/ADT/app/pages/orcamento.vue)
*   **Title:** `Solicitar Orçamento Grátis | Telas e Redes | AD Telas SP`
*   **Meta Description:** `Peça seu orçamento de telas mosquiteiras ou redes de proteção em São Paulo. Atendimento rápido, medição gratuita e instalação em até 24h.`
*   **SEO Focus:** Foco em palavras de conversão de fundo de funil (*"preço tela mosquiteira"*, *"orçamento rede de proteção sp"*, *"valor rede janela"*).

### 6.3 Página de Contato (`/contato`)
*   **Arquivo:** [`app/pages/contato.vue`](file:///d:/sicons/ADT/app/pages/contato.vue)
*   **Title:** `Contato | AD Telas e Redes de Proteção SP`
*   **Meta Description:** `Entre em contato com a AD Telas e Redes. Atendimento rápido por WhatsApp, telefone ou formulário em toda a Grande São Paulo.`
*   **SEO Focus:** Validação de NAP (Name, Address, Phone) para SEO local e autoridade de marca.

### 6.4 Artigo Educativo / Conscientização (`/por-que-instalar-tela-mosquiteira`)
*   **Arquivo:** [`app/pages/por-que-instalar-tela-mosquiteira.vue`](file:///d:/sicons/ADT/app/pages/por-que-instalar-tela-mosquiteira.vue)
*   **Title:** `Por que instalar tela mosquiteira? Casos reais e riscos de saúde | AD Telas`
*   **Meta Description:** `Dengue, zika, malária, chikungunya: veja casos reais de mortes e doenças causadas por mosquitos em SP e entenda por que a tela mosquiteira é essencial.`
*   **Schema.org (JSON-LD):** `Article` com fontes governamentais do Ministério da Saúde.
*   **SEO Focus:** Conteúdo de topo/meio de funil captando buscas sobre surtos de dengue, prevenção de zika para gestantes e proteção familiar.

### 6.5 Catálogo Hierárquico de Serviços (`/servicos/...`)
*   **Arquivos:** [`servicos/[familia]/[categoria]/[servico].vue`](file:///d:/sicons/ADT/app/pages/servicos/[familia]/[categoria]/[servico].vue) e [`servicos/[slug].vue`](file:///d:/sicons/ADT/app/pages/servicos/[slug].vue)
*   **Title Dinâmico:** `[Nome do Serviço] em São Paulo | [Nome da Família] | AD Telas` (ex: *"Redes de Proteção para Janelas em São Paulo | Redes de Proteção | AD Telas"*)
*   **Meta Description Dinâmica:** `[Nome do Serviço]: [Descrição Curta do Serviço]. Instalação 24h. Garantia 2 anos. Orçamento grátis!`
*   **Schema.org (JSON-LD):**
    *   `Service`: Nome do serviço, fornecedor, certificações e política de garantia.
    *   `BreadcrumbList`: Caminho rastreável completo (`Home > Serviços > Família > Categoria > Serviço`).

### 6.6 Página Especializada em Vidraçaria (`/servicos/vidracaria`)
*   **Arquivo:** [`app/pages/servicos/vidracaria.vue`](file:///d:/sicons/ADT/app/pages/servicos/vidracaria.vue)
*   **Title:** `Vidraçaria em São Paulo | Janelas de Vidro, Telhados e Fachadas | AD Telas`
*   **Meta Description:** `Serviços profissionais de vidraçaria em SP. Janelas em vidro temperado 8mm, telhados e coberturas de vidro e fachadas com instalação rápida e garantia.`
*   **SEO Focus:** Ranqueamento para projetos de envidraçamento de alto padrão e vidros laminados/temperados.

---

## 🏷️ 7. ECOSSISTEMA DE TAGS DO GOOGLE E ANALYTICS

O projeto implementa uma arquitetura robusta de mensuração de tráfego, rastreamento de conversão e eventos de usuário dividida em três pilares integrados:

```
                          ECOSSISTEMA GOOGLE
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
  Google Tag Manager          Google Analytics 4           Google Ads
  Container: GTM-KZTR2DHT     Measurement ID: G-S0038L1Q6R Conversion ID: AW-17981093809
  (Gerenciador de Tags)       (Métricas de Navegação)      (Rastreamento de Leads)
```

### 7.1 Plugin 1: Google Tag Manager (`app/plugins/gtm.client.js`)
*   **Container ID:** `GTM-KZTR2DHT`
*   **Mecanismo:** 
    *   Inicializa o array `window.dataLayer` imediatamente antes da injeção do script para evitar qualquer perda de eventos durante o carregamento inicial (*race condition*).
    *   Define `window.gtag` como ponte para o `dataLayer`.
    *   Injeta o script oficial do GTM no `<head>` do documento de forma não-bloqueante.

### 7.2 Plugin 2: Google Analytics 4 & Google Ads (`app/plugins/gtag.client.js`)
*   **GA4 Measurement ID:** `G-S0038L1Q6R`
*   **Google Ads Conversion Tag:** `AW-17981093809`
*   **Mecanismo:**
    *   Carrega a biblioteca oficial `gtag.js` diretamente com suporte a múltiplos destinos de disparo.
    *   Garante que o evento de conversão do Google Ads funcione mesmo em caso de falha de carregamento de containers de terceiros.

### 7.3 Plugin 3: Rastreamento Global de Cliques (`app/plugins/track-clicks.client.ts`)
*   **Tecnologia:** *Global Event Delegation* no objeto `document`.
*   **Funcionamento:** Intercepta automaticamente cliques em qualquer elemento `<a>` ou `<button>` do site:
    1.  **WhatsApp:** Links com `wa.me`, `whatsapp.com` ou atributos `data-gtm="whatsapp"` disparam evento analítico e gravam no Supabase via `/api/track-click`.
    2.  **Ligações Telefônicas:** Links com `tel:` disparam contagem de clique em telefone.
    3.  **Envios de Formulário:** Botões de envio registram a tentativa de conversão.
    4.  **CTAs Internos:** Navegação estratégica para `/orcamento` ou `/contato`.

### 7.4 Plugin 4: Rastreamento de Sessões e Visitas (`app/plugins/track-visits.client.ts`)
*   **Mecanismo:**
    *   Gera um identificador de sessão pseudo-anônimo (`adt_sid`) no `sessionStorage`.
    *   Dispara o registro de visita em background (`fire-and-forget`) para `/api/track-visit` a cada transição de rota no roteador do Nuxt (`router.afterEach`), ignorando rotas de administração (`/admin/*`).

### 7.5 Measurement Protocol Server-Side (`useGATracking.js` / `/api/track-event`)
*   Permite o disparo seguro de eventos críticos diretamente do servidor para a API do Google Analytics 4 via `GA_API_SECRET`, garantindo que conversões reais sejam registradas mesmo que o usuário utilize bloqueadores de anúncios no navegador (*ad-blockers*).

---

## 📈 8. SISTEMA DE CONVERSÃO, RASTREAMENTO DE LEADS E PAINEL ADMIN

### 8.1 Pontos de Contato de Alta Conversão
1.  **Botão Flutuante Pulsante do WhatsApp:** Fixado no canto inferior direito com animação contínua e mensagem contextualizada.
2.  **Barra Inferior Mobile Unificada (`MobileUnifiedCTA.vue`):** Barra fixa para smartphones exibindo botão direto de WhatsApp, discagem rápida para `(11) 98358-6611` e botão para abrir formulário em modal.
3.  **Formulário de Captação em 2 Etapas (`LeadForm.vue`):**
    *   *Etapa 1:* Nome + Cidade (reduz abandono).
    *   *Etapa 2:* Região/Endereço + Tipo de Serviço desejado.
4.  **Modal WhatsApp Rápido (`WhatsappModal.vue`):** Abre a partir dos cards de serviço, gerando a mensagem formatada para abertura imediata no aplicativo.

### 8.2 Painel Administrativo (`/admin/dashboard` e `/admin/leads`)
*   **Visão Geral de Métricas:**
    *   Total de Leads capturados no dia, semana e mês.
    *   Taxa de conversão estimada (Visitas vs Cliques em WhatsApp).
    *   Gráfico de distribuição de interesse por tipo de serviço.
    *   Log de atividade recente em tempo real.
*   **CRM de Leads:**
    *   Listagem completa com filtros por status (`Novo`, `Em Atendimento`, `Orçado`, `Fechado`, `Perdido`).
    *   Pesquisa instantânea por nome, cidade ou telefone.
    *   Modal de visualização detalhada com atalho para chamar o lead diretamente no WhatsApp.

---

## 📍 9. COBERTURA GEOGRÁFICA E CONSULTA DE CEP

O sistema é configurado para validar e atender a **19 cidades** da Região Metropolitana de São Paulo e polos regionais:

1.  **São Paulo (Capital)**
2.  **Guarulhos**
3.  **Osasco**
4.  **São Bernardo do Campo**
5.  **Barueri / Alphaville**
6.  **Jundiaí**
7.  **Mogi das Cruzes**
8.  **Taboão da Serra**
9.  **Suzano**
10. **Itapevi**
11. **Embu-Guaçu**
12. **Sorocaba**
13. **Cajamar**
14. **Mairiporã**
15. **Santana de Parnaíba**
16. **Cotia / Granja Viana**
17. **Itapecerica da Serra**
18. **Embu das Artes**
19. **São Roque**

### Validação por CEP (`CepSearch.vue` & `/api/cep/[cep]`)
*   O usuário digita o CEP de 8 dígitos.
*   O backend consulta a API pública *ViaCEP* e cruza o código do município retornado (código IBGE) com o rol de cidades homologadas.
*   Se atendido, exibe confirmação visual verde com o endereço e botão de orçamento para a localidade.
*   Se não atendido, oferece botão de consulta com a equipe comercial via WhatsApp.

---

## 🔒 10. SEGURANÇA, CONTENT SECURITY POLICY (CSP) E PERFORMANCE

### 10.1 Cabeçalhos de Segurança (Nitro Headers)
Configurados em [`nuxt.config.ts`](file:///d:/sicons/ADT/nuxt.config.ts) para proteção contra ataques comuns de injeção e clickjacking:
*   `X-Content-Type-Options: nosniff` — Previne MIME-type sniffing.
*   `X-Frame-Options: DENY` — Impede que o site seja incorporado em iframes maliciosos.
*   `X-XSS-Protection: 1; mode=block` — Ativa proteção XSS nos navegadores legados.
*   `Referrer-Policy: strict-origin-when-cross-origin` — Protege dados de referência externa.
*   `Permissions-Policy: camera=(), microphone=(), geolocation=()` — Bloqueia acesso indevido a periféricos.

### 10.2 Content Security Policy (CSP)
Diretiva rigorosa que autoriza apenas as origens legítimas e indispensáveis para o funcionamento da plataforma:
*   **Scripts (`script-src`, `script-src-elem`):** `'self'`, `'unsafe-inline'`, `'unsafe-eval'`, `https://*.googletagmanager.com`, `https://googletagmanager.com`, `https://tagmanager.google.com`, `https://www.googleadservices.com`, `https://www.google.com`, `https://pagead2.googlesyndication.com`, `https://googleads.g.doubleclick.net`, `https://vercel.live`, `https://static.cloudflareinsights.com`.
*   **Estilos (`style-src`, `style-src-elem`):** `'self'`, `'unsafe-inline'`, `https://fonts.googleapis.com`, `https://googletagmanager.com`.
*   **Conexões (`connect-src`):** `'self'`, `https://*.google-analytics.com`, `https://*.analytics.google.com`, `https://*.googletagmanager.com`, `https://*.g.doubleclick.net`, `https://*.google.com`, `https://*.whatsapp.com`, `https://api.whatsapp.com`, `https://viacep.com.br`, `https://cloudflareinsights.com`, APIs do Supabase.
*   **Imagens (`img-src`):** `'self'`, `data:`, `blob:`, `https:`, Google Analytics, Google Ads, Google Static Maps.
*   **Fontes (`font-src`):** `'self'`, `data:`, `https://fonts.gstatic.com`.
*   **Frames (`frame-src`, `frame-ancestors`):** `https://www.googletagmanager.com`, `https://bid.g.doubleclick.net`, `https://vercel.live`; `frame-ancestors 'none'`.

---

## 🎯 Conclusão

O ecossistema da **AD Telas e Redes SP** está consolidado como uma aplicação web de alto padrão de engenharia, integrando:
*   **SEO de Ponta:** Estruturação semântica, Schema.org completo em JSON-LD, sitemap limpo e URLs canônicas.
*   **Rastreamento Preciso:** GTM + GA4 + Google Ads + Measurement Protocol e gravação em banco próprio.
*   **Alta Performance & Segurança:** Nuxt 4 SSR, CSP restritiva e arquitetura livre de dados redundantes.
