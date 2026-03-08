# PRD - Product Requirements Document
# AD Telas e Redes - Sistema Completo de Landing Page e Catálogo de Serviços

**Versão:** 2.0  
**Data:** 03 de Março de 2026  
**Empresa:** AD Telas e Redes  
**Tecnologia:** Nuxt 3 + Vue 3 + Tailwind CSS  
**Contato:** (11) 98358-6611

---

## 📋 ÍNDICE

1. [Visão Geral do Projeto](#visão-geral)
2. [Arquitetura de Serviços](#arquitetura-serviços)
3. [Sistema de Navegação](#navegação)
4. [Componentes e Botões CTA](#componentes-cta)
5. [Formulários e Conversão](#formulários)
6. [Páginas e Rotas](#páginas)
7. [Especificações Técnicas](#especificações)
8. [Fluxo de Conversão](#fluxo-conversão)

---

## 🎯 1. VISÃO GERAL DO PROJETO

### 1.1 Objetivo
Landing page e catálogo digital para empresa de instalação de redes de proteção e telas mosquiteiras em São Paulo, com foco em conversão via WhatsApp.

### 1.2 Público-Alvo
- Famílias com crianças pequenas (0-10 anos)
- Donos de pets (gatos e cachorros)
- Moradores de apartamentos em São Paulo
- Pessoas preocupadas com dengue/mosquitos
- Condomínios e empresas

### 1.3 Proposta de Valor
- Instalação em 48 horas
- Garantia de 2 anos
- Material certificado INMETRO
- Orçamento grátis e rápido
- Atendimento via WhatsApp


---

## 🏗️ 2. ARQUITETURA DE SERVIÇOS

### 2.1 Estrutura Hierárquica

O sistema possui **35+ serviços** organizados em:
- **2 Famílias** (Redes de Proteção + Telas Mosquiteiras)
- **8 Categorias** (4 por família)
- **35 Serviços específicos**

### 2.2 FAMÍLIA 1: REDES DE PROTEÇÃO (17 serviços)

#### Categoria 1: Residencial (7 serviços)
1. **Redes para Janelas** ⭐ Mais vendido
   - Proteção invisível para todas as janelas
   - Imagem: `/images/Redes_para_Janelas.png`
   - Especificações: `/images/Redes_para_Janelas_especificações.png`

2. **Redes para Portas**
   - Segurança sem bloquear ventilação
   - Destaque: Ventilação total

3. **Redes para Sacadas**
   - Aproveite sua sacada com segurança
   - Destaque: Resiste 500kg

4. **Redes para Varandas**
   - Proteção total para varandas
   - Destaque: Instalação 48h

5. **Redes para Apartamentos**
   - Solução completa para seu apartamento
   - Destaque: Pacote completo

6. **Redes para Escadas**
   - Segurança em escadas e mezaninos
   - Destaque: Sob medida

7. **Redes para Basculantes**
   - Proteção para janelas basculantes
   - Destaque: Fácil abertura

#### Categoria 2: Pets & Crianças (5 serviços)
8. **Redes para Crianças** 🏆 Certificado INMETRO
   - Máxima segurança para os pequenos
   - Imagem: `/images/Redes_para_Crianças.png`

9. **Redes para Gatos**
   - Impeça fugas e quedas de gatos
   - Destaque: Malha reforçada

10. **Redes para Cachorros**
    - Proteção para cães de todos os portes
    - Destaque: Extra resistente

11. **Redes para Animais**
    - Proteção para todos os tipos de pets
    - Destaque: Versátil

12. **Redes para Idosos**
    - Segurança para a terceira idade
    - Destaque: Cuidado especial

#### Categoria 3: Comercial (5 serviços)
13. **Redes para Portões**
    - Proteção para portões e entradas
    - Destaque: Alta durabilidade

14. **Redes para Muros**
    - Segurança adicional em muros
    - Destaque: Anti-invasão

15. **Redes para Telhados**
    - Proteção contra pombos e pássaros
    - Destaque: Anti-pombos

16. **Redes para Piscinas**
    - Segurança em áreas de piscina
    - Destaque: Resistente à água

17. **Redes para Coberturas**
    - Proteção para áreas cobertas
    - Destaque: Sob medida


### 2.3 FAMÍLIA 2: TELAS MOSQUITEIRAS (18 serviços)

#### Categoria 1: Residencial (6 serviços)
18. **Telas para Janelas** ⭐ 85% transparência
    - Visão 100% clara, proteção total
    - Imagem: `/images/TELA_MOSQUITEIRA.png`

19. **Telas para Portas**
    - Ventilação sem mosquitos
    - Destaque: Fácil abertura

20. **Telas para Varandas**
    - Aproveite a varanda sem insetos
    - Destaque: Área completa

21. **Telas para Sacadas**
    - Proteção total contra mosquitos
    - Destaque: Instalação rápida

22. **Telas para Apartamentos**
    - Solução completa anti-mosquito
    - Destaque: Pacote completo

23. **Telas para Banheiro**
    - Proteção em áreas úmidas
    - Destaque: Anti-mofo

#### Categoria 2: Modelos Especiais (6 serviços)
24. **Telas de Correr**
    - Sistema deslizante prático
    - Destaque: Fácil uso

25. **Telas Pivotantes**
    - Abertura giratória
    - Destaque: Moderna

26. **Telas Removíveis**
    - Fácil de remover e limpar
    - Destaque: Prática

27. **Telas para Basculantes**
    - Específica para janelas basculantes
    - Destaque: Sob medida

28. **Telas com Alumínio**
    - Estrutura em alumínio reforçado
    - Destaque: Durável

29. **Telas com Aço Inox** 💎 Premium
    - Máxima resistência e durabilidade
    - Destaque: Premium

#### Categoria 3: Pet Screen (2 serviços)
30. **Telas Pet Screen**
    - Resistente a arranhões de pets
    - Destaque: Anti-arranhão

31. **Telas Anti-Pernilongos**
    - Malha extra fina contra pernilongos
    - Destaque: Malha micro

#### Categoria 4: Comercial/Fachadas (4 serviços)
32. **Telas para Fachadas**
    - Proteção para grandes fachadas
    - Destaque: Grande porte

33. **Telas para Coberturas**
    - Proteção em áreas cobertas
    - Destaque: Sob medida

34. **Telas para Restaurantes**
    - Ambiente livre de insetos
    - Destaque: Comercial

35. **Telas para Indústrias**
    - Proteção industrial
    - Destaque: Alta resistência


---

## 🧭 3. SISTEMA DE NAVEGAÇÃO

### 3.1 Header Desktop
**Componente:** `Header.vue`

**Características:**
- Altura: 112px (h-28)
- Logo: 150px width, auto height
- Fundo: Branco com transparência ao rolar (bg-white/70 backdrop-blur-md)
- Posição: Fixed top

**Menu de Navegação (8 itens):**
1. Início → Scroll para #hero
2. Serviços → Scroll para #problems
3. Vantagens → Scroll para #value
4. Cases → Scroll para #cases
5. Avaliações → Scroll para #reviews
6. Soluções → Scroll para #solutions
7. FAQ → Scroll para #faq
8. Contato → Scroll para #contact

**Comportamento:**
- Scroll suave com offset de 112px (altura do header)
- Menu hambúrguer em mobile (< 768px)
- Transparência progressiva após 50px de scroll

### 3.2 Header Mobile
**Características:**
- Altura: 64px (h-16)
- Logo compacto: h-12
- Botão WhatsApp animado (pulso + ping)
- Menu hambúrguer

**Botão WhatsApp Header Mobile:**
- Cor: #25D366 (verde WhatsApp)
- Tamanho: 40px × 32px
- Animações: pulse + ping
- Link direto: `https://wa.me/5511983586611`

### 3.3 Breadcrumb
**Componente:** `Breadcrumb.vue`

**Estrutura:**
```
Home > Família > Categoria > Serviço
```

**Exemplo:**
```
Home > Redes de Proteção > Residencial > Redes para Janelas
```

**Características:**
- Ícones Lucide para cada nível
- Links clicáveis para navegação
- Cor primária: #1D7BA6
- Responsivo (oculta em mobile < 640px)


---

## 🎨 4. COMPONENTES E BOTÕES CTA

### 4.1 WhatsApp Floating Button
**Componente:** `WhatsappFloating.vue`

**Características:**
- Posição: Fixed bottom-right
- Desktop: bottom-30px, right-30px
- Mobile: bottom-20px, right-20px
- Tamanho: 60px × 60px (mobile), 70px × 70px (desktop)
- Z-index: 99

**Animações:**
- Círculo externo: animate-ping (pulso rápido)
- Círculo médio: animate-pulse (pulso médio)
- Botão principal: animate-bounce (salto)
- Hover: scale(1.2) + translateY(-8px)

**Cor:**
- Background: #25D366 (verde WhatsApp)
- Hover: #1DA851 (verde escuro)

**Link:**
```
https://wa.me/5511983586611?text=Oi! Gostaria de um orçamento para instalar telas de segurança
```

### 4.2 Mobile Unified CTA
**Componente:** `MobileUnifiedCTA.vue`

**Visibilidade:**
- Aparece após scroll > 200px
- Apenas mobile (< 768px)
- Z-index: 60

**Estado Compacto (70px altura):**
- Botão único verde gradiente
- Texto: "Orçamento Grátis WhatsApp"
- Ícone WhatsApp + ícone message-circle
- Ícone chevron-up (canto direito)
- Animação de pulso no fundo

**Estado Expandido (240px altura):**
1. **Botão WhatsApp (100% width, 56px altura)**
   - Gradiente: from-emerald-500 to-emerald-600
   - Ícone WhatsApp + texto "WhatsApp"
   - Link: WhatsApp com mensagem personalizada

2. **Botão Ligar (48% width, 56px altura)**
   - Gradiente: from-blue-500 to-blue-600
   - Ícone phone + texto "Ligar"
   - Link: `tel:+5511983586611`

3. **Botão Formulário (48% width, 56px altura)**
   - Gradiente: from-orange-500 to-orange-600
   - Ícone file-text + texto "Formulário"
   - Abre modal StickyFormModal

**Interações:**
- Swipe down para fechar (> 50px)
- Backdrop escuro quando expandido
- Handle visual para arrastar

### 4.3 Sticky Bottom Bar (Alternativa)
**Componente:** `StickyBottomBar.vue`

**Layout:**
- Altura: 80px (inclui padding)
- 2 botões lado a lado

**Botão 1 - WhatsApp (60% largura):**
- Cor: #25D366
- Altura: 56px
- Ícone + texto "WhatsApp"

**Botão 2 - Ligar/Formulário (40% largura):**
- Cor: blue-600
- Altura: 56px
- Ícone + texto configurável
- Pode ser: tel: ou abrir modal


### 4.4 CTA Section (Desktop)
**Componente:** `CtaSection.vue`

**Design:**
- Fundo: Gradiente azul (from-#1D7BA6 to-#0F4F7D)
- Padding: py-10 (mobile), py-20 (desktop)
- Border-radius: rounded-3xl
- Shadow: shadow-2xl

**Elementos:**
- Título: "Não Deixe Sua Família em Risco" (branco)
- Linha decorativa: 1px × 80px (laranja #F49A1A)
- Subtítulo: "Agende uma avaliação gratuita..." (branco/90)
- 2 logos AD Telas (laterais, animate-bounce)

**Botão Principal:**
- Fundo: Branco
- Texto: Azul escuro (#22345F)
- Borda: 2px laranja (#F49A1A)
- Tamanho: px-8 py-4
- Ícone WhatsApp verde (#25D366)
- Texto: "CLIQUE AQUI"
- Hover: scale(1.05) + shadow-2xl

**Texto de Urgência:**
- Cor: Laranja (#F49A1A)
- Ícones: lucide:zap (raios)
- Texto: "Resposta rápida garantida!"

### 4.5 Quick Help Chat
**Componente:** `QuickHelpChat.vue`

**Posição:**
- Fixed bottom-left
- Desktop: bottom-30px, left-30px
- Mobile: bottom-90px, left-20px
- Z-index: 50

**Características:**
- Botão circular com ícone message-circle
- Tooltip "Precisa de ajuda?"
- Abre chat/modal de ajuda rápida
- Cor: Azul primário

### 4.6 Hero Section CTAs
**Componente:** `HeroSection.vue`

**Desktop - 2 Botões:**
1. **Botão Primário - WhatsApp**
   - Cor: #25D366
   - Tamanho: px-8 py-4
   - Texto: "Fale com Especialista"
   - Ícone: WhatsApp

2. **Botão Secundário - Formulário**
   - Cor: Azul (#1D7BA6)
   - Tamanho: px-8 py-4
   - Texto: "Solicitar Orçamento"
   - Ícone: file-text

**Mobile - Botão Único:**
- WhatsApp full-width
- Altura: 56px
- Texto: "Orçamento Grátis WhatsApp"

### 4.7 Service Cards CTAs
**Componente:** `ServicesCards.vue`

**Cada Card possui:**
1. **Botão WhatsApp**
   - Cor: #25D366
   - Texto: "Orçamento Grátis"
   - Mensagem personalizada por serviço

2. **Link "Ver Detalhes"**
   - Cor: Azul
   - Navega para página do serviço
   - Ícone: arrow-right


---

## 📝 5. FORMULÁRIOS E CONVERSÃO

### 5.1 Lead Form (2 Passos)
**Componente:** `LeadForm.vue`

**Variantes:**
- `variant="desktop"` - Sidebar desktop
- `variant="modal"` - Modal mobile

#### PASSO 1 - Dados Rápidos (Obrigatórios)
**Campos:**
1. **Nome** (obrigatório)
   - Type: text
   - Placeholder: "Digite seu nome"
   - Validação: required

2. **Cidade** (obrigatório)
   - Type: text
   - Placeholder: "Ex: São Paulo"
   - Validação: required

**Botão:**
- Texto: "Continuar no WhatsApp"
- Cor: #25D366
- Ícone: WhatsApp
- Estados: normal, loading, success
- Ação: Envia direto para WhatsApp

**Link Opcional:**
- "Ou adicionar mais detalhes para orçamento mais preciso"
- Leva para Passo 2

#### PASSO 2 - Detalhes Opcionais
**Aviso:**
- Background: blue-50
- Texto: "Opcional - Ajuda a enviar um orçamento mais preciso"

**Campos:**
1. **Bairro/Região** (opcional)
   - Type: text
   - Placeholder: "Ex: Vila Mariana, Pinheiros"

2. **Tipo de Serviço** (opcional)
   - Type: select
   - Opções:
     - Tela Mosqueteira
     - Rede de Proteção
     - Tela Pet Screen
     - Proteção Infantil
     - Outro

**Botões:**
1. **Voltar** (40% largura)
   - Borda: gray-300
   - Ícone: arrow-left

2. **Enviar no WhatsApp** (60% largura)
   - Cor: #25D366
   - Ícone: WhatsApp

**Mensagem WhatsApp Gerada:**
```
Olá! Meu nome é [NOME], moro em [CIDADE], bairro [BAIRRO].
Gostaria de um orçamento para: [SERVIÇO].
Pode me ajudar?
```

**Trust Indicators:**
- ✓ 100% Seguro
- ✓ Sem Spam

### 5.2 Sticky Form Modal
**Componente:** `StickyFormModal.vue`

**Características:**
- Teleport to body
- Z-index: 100
- Backdrop: bg-black/50
- Animação: slide-up

**Conteúdo:**
- Handle para arrastar (swipe down)
- Título: "Orçamento Grátis"
- Subtítulo: "Resposta em até 2 horas"
- LeadForm variant="modal"
- Botão fechar (X)

**Interações:**
- Swipe down > 100px = fecha
- Click no backdrop = fecha
- Botão X = fecha

**v-model:**
```vue
<StickyFormModal v-model="showFormModal" />
```


---

## 📄 6. PÁGINAS E ROTAS

### 6.1 Página Inicial (/)
**Arquivo:** `pages/index.vue`

**Seções (em ordem):**
1. **HeroSection** - Hero principal com CTAs
2. **ServicesCards** - Cards clicáveis dos 2 serviços principais
3. **ProblemsSection** - Problemas que resolvemos
4. **ValueProposition** - Proposta de valor
5. **CaseStudies** - Cases de sucesso
6. **ReviewsCarousel** - Carrossel de avaliações
7. **SegmentedSolutions** - Soluções por segmento
8. **FaqSection** - Perguntas frequentes
9. **CtaSection** - CTA final

**Componentes Fixos:**
- Header (topo)
- WhatsappFloating (bottom-right)
- MobileUnifiedCTA (bottom, mobile)
- QuickHelpChat (bottom-left)
- StickyFormModal (modal)

### 6.2 Página de Família
**Rota:** `/servicos/[familia]`
**Exemplo:** `/servicos/redes` ou `/servicos/telas`

**Conteúdo:**
- Hero da família
- Grid de categorias (4 cards)
- Cada categoria mostra seus serviços
- Breadcrumb: Home > Família

### 6.3 Página de Categoria
**Rota:** `/servicos/[familia]/[categoria]`
**Exemplo:** `/servicos/redes/residencial`

**Conteúdo:**
- Hero da categoria
- Grid de serviços (cards)
- Filtros por tipo
- Breadcrumb: Home > Família > Categoria

### 6.4 Página de Serviço Específico
**Rota:** `/servicos/[familia]/[categoria]/[servico]`
**Exemplo:** `/servicos/redes/residencial/janelas`

**Seções:**
1. **Hero do Serviço**
   - Título do serviço
   - Descrição curta
   - Badge de destaque
   - 2 CTAs (WhatsApp + Formulário)
   - Imagem principal

2. **Benefícios (4 cards)**
   - Ícone + Título + Descrição
   - Grid 2×2 (mobile: 1 coluna)

3. **Especificações Técnicas**
   - Tabela label/valor
   - Material, resistência, garantia, etc.

4. **Comparação (Nós vs Concorrentes)**
   - 2 colunas
   - Lista de diferenciais

5. **Cases de Sucesso**
   - Cliente, local, problema, solução, resultado
   - Cards com depoimentos

6. **FAQ Específica**
   - Accordion com perguntas/respostas
   - 5-8 perguntas por serviço

7. **CTA Final**
   - Botão WhatsApp grande
   - Formulário lateral (desktop)

**Breadcrumb:**
```
Home > Família > Categoria > Serviço
```

### 6.5 Páginas Especiais

#### /servicos/redes
**Arquivo:** `pages/servicos/redes.vue`
- Landing específica para Redes de Proteção
- Hero customizado
- Grid de 17 serviços

#### /servicos/telas
**Arquivo:** `pages/servicos/telas.vue`
- Landing específica para Telas Mosquiteiras
- Hero customizado
- Grid de 18 serviços

#### /servicos/[slug]
**Arquivo:** `pages/servicos/[slug].vue`
- Rota dinâmica para serviços individuais
- Fallback para serviços sem categoria


---

## ⚙️ 7. ESPECIFICAÇÕES TÉCNICAS

### 7.1 Stack Tecnológico
- **Framework:** Nuxt 3.4.2
- **Vue:** 3.5.26
- **CSS:** Tailwind CSS 6.14.0
- **Ícones:** @nuxt/icon 2.2.1 (Lucide)
- **Analytics:** @vercel/analytics 1.6.1
- **Node:** >= 18.x

### 7.2 Configuração Nuxt
**Arquivo:** `nuxt.config.ts`

**Módulos:**
```typescript
modules: ['@nuxtjs/tailwindcss', '@nuxt/icon']
```

**Dev Server:**
```typescript
devServer: {
  port: 3001
}
```

**Security Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: (configurado)

**SEO Meta Tags:**
- Title: "AD Telas e Redes SP - Proteção Profissional"
- Description: "Telas de segurança e redes protetoras..."
- Keywords: "tela de segurança SP, rede protetora..."
- OG Tags configurados

### 7.3 Composables

#### useServicos.js
**Localização:** `app/composables/useServicos.js`

**Funções:**
- `getAllFamilias()` - Retorna array de famílias
- `getFamiliaBySlug(slug)` - Busca família por slug
- `getCategoriaBySlug(familiaSlug, categoriaSlug)` - Busca categoria
- `getServicoBySlug(familiaSlug, categoriaSlug, servicoSlug)` - Busca serviço
- `getTotalServicos()` - Conta total de serviços
- `getWhatsAppUrl(familiaSlug, categoriaSlug, servicoSlug)` - Gera URL WhatsApp

**Constantes:**
- `WHATSAPP_NUMBER`: '5511983586611'
- `COMPANY_NAME`: 'AD Telas e Redes'
- `GOOGLE_REVIEWS_URL`: (link completo)

#### useServicoData.js
**Localização:** `app/composables/useServicoData.js`

**Dados:**
- Array de serviços com dados completos
- Benefícios, especificações, comparações
- Cases, FAQ, imagens

**Funções:**
- `getServicoBySlug(slug)` - Busca serviço
- `getAllServicos()` - Lista todos
- `getWhatsAppMessage(servico, origem)` - Gera mensagem
- `getWhatsAppUrl(servico, origem)` - Gera URL

#### useWhatsappModal.js
**Funções:**
- Controle de estado do modal WhatsApp
- Open/close modal

#### useScrollAnimation.js
**Funções:**
- Animações ao rolar página
- Intersection Observer

#### useScrollTo.js
**Funções:**
- Scroll suave para seções
- Offset para header fixo

### 7.4 Estrutura de Pastas
```
nuxt-app/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── tailwind.css
│   ├── components/
│   │   ├── Breadcrumb.vue
│   │   ├── CaseStudies.vue
│   │   ├── CtaSection.vue
│   │   ├── FaqSection.vue
│   │   ├── Footer.vue
│   │   ├── Header.vue
│   │   ├── HeroSection.vue
│   │   ├── LeadForm.vue
│   │   ├── MobileUnifiedCTA.vue
│   │   ├── ProblemsSection.vue
│   │   ├── QuickHelpChat.vue
│   │   ├── ReviewsCarousel.vue
│   │   ├── SegmentedSolutions.vue
│   │   ├── ServicesCards.vue
│   │   ├── StickyFormModal.vue
│   │   ├── ValueProposition.vue
│   │   └── WhatsappFloating.vue
│   ├── composables/
│   │   ├── useFaq.js
│   │   ├── useScrollAnimation.js
│   │   ├── useScrollTo.js
│   │   ├── useSegments.js
│   │   ├── useServicoData.js
│   │   ├── useServicos.js
│   │   └── useWhatsappModal.js
│   ├── pages/
│   │   ├── index.vue
│   │   └── servicos/
│   │       ├── index.vue
│   │       ├── redes.vue
│   │       ├── telas.vue
│   │       ├── [familia]/
│   │       │   ├── index.vue
│   │       │   └── [categoria]/
│   │       │       ├── index.vue
│   │       │       └── [servico].vue
│   │       └── [slug].vue
│   └── app.vue
├── public/
│   ├── images/
│   │   ├── logo ad.png
│   │   ├── familia.png
│   │   ├── TELA_MOSQUITEIRA.png
│   │   └── [35+ imagens de serviços]
│   ├── favicon.ico
│   ├── robots.txt
│   ├── politica-de-privacidade.html
│   └── termos-de-uso.html
├── nuxt.config.ts
├── tailwind.config.js
├── package.json
└── tsconfig.json
```


---

## 🔄 8. FLUXO DE CONVERSÃO

### 8.1 Jornada do Usuário - Desktop

#### Entrada (Landing Page)
1. Usuário acessa site
2. Vê Hero com 2 CTAs principais
3. Scroll para ver serviços

#### Exploração
4. Clica em card de serviço (Redes ou Telas)
5. Navega para página da família
6. Escolhe categoria de interesse
7. Clica em serviço específico

#### Página de Serviço
8. Lê benefícios e especificações
9. Vê comparação com concorrentes
10. Lê cases de sucesso
11. Consulta FAQ

#### Conversão
12. **Opção A:** Clica em botão WhatsApp
    - Abre WhatsApp com mensagem pré-preenchida
    - Mensagem inclui: nome do serviço, categoria, família

13. **Opção B:** Preenche formulário lateral
    - Passo 1: Nome + Cidade (obrigatório)
    - Passo 2: Bairro + Tipo de serviço (opcional)
    - Clica "Enviar no WhatsApp"
    - Abre WhatsApp com dados preenchidos

#### Componentes Sempre Visíveis
- WhatsApp Floating (bottom-right) - Z-index 99
- Quick Help Chat (bottom-left) - Z-index 50

### 8.2 Jornada do Usuário - Mobile

#### Entrada
1. Usuário acessa site mobile
2. Vê Hero compacto com CTA único
3. Header com botão WhatsApp animado

#### Exploração
4. Scroll > 200px
5. **Mobile Unified CTA aparece** (bottom, z-index 60)
   - Estado compacto: "Orçamento Grátis WhatsApp"

#### Interação com CTA
6. Usuário clica no CTA compacto
7. CTA expande mostrando 3 opções:
   - WhatsApp (100% width)
   - Ligar (48% width)
   - Formulário (48% width)

#### Conversão - Opção 1: WhatsApp Direto
8. Clica em "WhatsApp"
9. Abre app WhatsApp com mensagem

#### Conversão - Opção 2: Ligar
10. Clica em "Ligar"
11. Abre discador com número

#### Conversão - Opção 3: Formulário
12. Clica em "Formulário"
13. Modal slide-up aparece (z-index 100)
14. Preenche dados (2 passos)
15. Clica "Enviar no WhatsApp"
16. Abre WhatsApp com dados

#### Componentes Sempre Visíveis (Mobile)
- Header compacto com WhatsApp
- Mobile Unified CTA (após scroll)
- WhatsApp Floating (bottom-right)

### 8.3 Pontos de Conversão (Total: 12+)

#### Página Inicial
1. Hero - Botão WhatsApp primário
2. Hero - Botão Formulário secundário
3. ServicesCards - 2 botões WhatsApp (1 por card)
4. CtaSection - Botão WhatsApp grande
5. WhatsApp Floating - Sempre visível
6. Mobile Unified CTA - 3 opções

#### Páginas de Serviço
7. Hero do Serviço - Botão WhatsApp
8. Hero do Serviço - Botão Formulário
9. Sidebar Desktop - LeadForm
10. CTA Final - Botão WhatsApp
11. WhatsApp Floating - Sempre visível
12. Mobile Unified CTA - 3 opções

#### Componentes Globais
- Header Mobile - Botão WhatsApp
- Quick Help Chat - Ajuda rápida

### 8.4 Mensagens WhatsApp Personalizadas

#### Mensagem Genérica (Floating Button)
```
Oi! Gostaria de um orçamento para instalar telas de segurança
```

#### Mensagem de Serviço Específico
```
Olá! Gostaria de um orçamento para:

Serviço: [Nome do Serviço]
Categoria: [Família] > [Categoria]

Pode me ajudar?
```

#### Mensagem do Formulário (Passo 1)
```
Olá! Meu nome é [NOME], moro em [CIDADE].
Gostaria de um orçamento para telas mosqueteiras.
Pode me ajudar?
```

#### Mensagem do Formulário (Passo 2 - Completo)
```
Olá! Meu nome é [NOME], moro em [CIDADE], bairro [BAIRRO].
Gostaria de um orçamento para: [SERVIÇO].
Pode me ajudar?
```


---

## 🎨 9. DESIGN SYSTEM

### 9.1 Paleta de Cores

#### Cores Primárias
- **Azul Escuro:** `#22345F` - Texto principal, títulos
- **Azul Médio:** `#1D7BA6` - Links, botões secundários
- **Azul Escuro Fundo:** `#0F4F7D` - Gradientes, fundos
- **Laranja:** `#F49A1A` - Destaques, urgência, bordas
- **Verde WhatsApp:** `#25D366` - Botões WhatsApp
- **Verde WhatsApp Hover:** `#1fb854` - Hover WhatsApp

#### Cores Secundárias
- **Azul Claro:** `#E5EDF8` - Fundos suaves
- **Cinza 50:** `#F9FAFB` - Background sections
- **Cinza 100:** `#F3F4F6` - Borders suaves
- **Cinza 600:** `#4B5563` - Texto secundário
- **Cinza 800:** `#1F2937` - Texto principal

#### Cores de Status
- **Success:** `#10B981` (green-500)
- **Error:** `#EF4444` (red-500)
- **Warning:** `#F59E0B` (amber-500)
- **Info:** `#3B82F6` (blue-500)

### 9.2 Tipografia

#### Fonte
- **Family:** System fonts (Tailwind default)
- **Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto

#### Tamanhos
- **Hero Title:** text-4xl md:text-6xl (36px / 60px)
- **Section Title:** text-3xl md:text-4xl (30px / 36px)
- **Card Title:** text-xl md:text-2xl (20px / 24px)
- **Body:** text-base (16px)
- **Small:** text-sm (14px)
- **Tiny:** text-xs (12px)

#### Pesos
- **Bold:** font-bold (700)
- **Semibold:** font-semibold (600)
- **Medium:** font-medium (500)
- **Normal:** font-normal (400)

### 9.3 Espaçamentos

#### Padding/Margin
- **Tiny:** 0.5rem (8px)
- **Small:** 1rem (16px)
- **Medium:** 1.5rem (24px)
- **Large:** 2rem (32px)
- **XLarge:** 3rem (48px)
- **2XLarge:** 4rem (64px)

#### Sections
- **Mobile:** py-10 (40px vertical)
- **Desktop:** py-20 (80px vertical)

### 9.4 Border Radius
- **Small:** rounded-lg (8px)
- **Medium:** rounded-xl (12px)
- **Large:** rounded-2xl (16px)
- **XLarge:** rounded-3xl (24px)
- **Full:** rounded-full (9999px)

### 9.5 Shadows
- **Small:** shadow-sm
- **Medium:** shadow-md
- **Large:** shadow-lg
- **XLarge:** shadow-xl
- **2XLarge:** shadow-2xl

### 9.6 Animações

#### Durations
- **Fast:** 200ms
- **Normal:** 300ms
- **Slow:** 500ms

#### Easings
- **Default:** ease-out
- **Smooth:** cubic-bezier(0.4, 0, 0.6, 1)

#### Animações Customizadas
```css
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.1; }
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

### 9.7 Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1023px
- **Desktop:** >= 1024px
- **Large Desktop:** >= 1280px

### 9.8 Z-Index Hierarchy
- **Header:** 40
- **Quick Help Chat:** 50
- **Mobile Unified CTA:** 60
- **WhatsApp Floating:** 99
- **Modal Overlay:** 100


---

## 📊 10. MÉTRICAS E ANALYTICS

### 10.1 Eventos de Conversão

#### Cliques em Botões WhatsApp
- `whatsapp_click_hero` - Hero principal
- `whatsapp_click_floating` - Botão flutuante
- `whatsapp_click_cta_section` - Seção CTA
- `whatsapp_click_service_card` - Card de serviço
- `whatsapp_click_mobile_unified` - CTA mobile
- `whatsapp_click_header_mobile` - Header mobile

#### Cliques em Formulário
- `form_open_hero` - Abrir do hero
- `form_open_mobile_cta` - Abrir do CTA mobile
- `form_step1_complete` - Completar passo 1
- `form_step2_complete` - Completar passo 2
- `form_submit_whatsapp` - Enviar para WhatsApp

#### Navegação
- `service_card_click` - Clique em card de serviço
- `breadcrumb_click` - Navegação por breadcrumb
- `menu_item_click` - Item do menu
- `scroll_to_section` - Scroll para seção

#### Telefone
- `phone_click_mobile_cta` - Ligar do CTA mobile
- `phone_click_sticky_bar` - Ligar da barra sticky

### 10.2 Vercel Analytics
**Instalado:** @vercel/analytics 1.6.1

**Métricas Automáticas:**
- Page views
- Unique visitors
- Bounce rate
- Session duration
- Device type
- Geographic location

### 10.3 Goals de Conversão

#### Primário
- **WhatsApp Opens:** > 5% dos visitantes
- **Form Submissions:** > 2% dos visitantes

#### Secundário
- **Service Page Views:** > 30% dos visitantes
- **Scroll Depth:** > 50% da página
- **Time on Site:** > 2 minutos

### 10.4 A/B Tests Sugeridos

#### Teste 1: CTA Mobile
- **Variante A:** Mobile Unified CTA (atual)
- **Variante B:** Sticky Bottom Bar
- **Métrica:** Taxa de clique

#### Teste 2: Formulário
- **Variante A:** 2 passos (atual)
- **Variante B:** 1 passo (todos campos)
- **Métrica:** Taxa de conclusão

#### Teste 3: Hero CTAs
- **Variante A:** 2 botões (WhatsApp + Formulário)
- **Variante B:** 1 botão (WhatsApp apenas)
- **Métrica:** Taxa de conversão


---

## 🔐 11. SEGURANÇA E PERFORMANCE

### 11.1 Security Headers (Configurados)

```typescript
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'..."
}
```

### 11.2 Performance Optimizations

#### Imagens
- Formato: PNG, JPG, WebP
- Lazy loading: Nativo do navegador
- Dimensões: Otimizadas por uso
- CDN: Servidas do /public

#### CSS
- Tailwind CSS com PurgeCSS
- Apenas classes utilizadas no build
- Minificação automática

#### JavaScript
- Code splitting automático (Nuxt)
- Tree shaking
- Minificação em produção

#### Fonts
- System fonts (sem carregamento externo)
- Fallback stack completo

### 11.3 SEO Optimizations

#### Meta Tags Dinâmicas
```typescript
metaTitle: `${servico.titulo} em São Paulo | ${familia.nome} | AD Telas`
metaDescription: `${servico.titulo}: ${servico.descricaoCurta}. Instalação 48h. Garantia 2 anos.`
```

#### Structured Data
- Organization schema
- LocalBusiness schema
- Product schema (por serviço)
- Review schema

#### Sitemap
- Geração automática
- Todas as páginas de serviços
- Prioridades configuradas

#### Robots.txt
```
User-agent: *
Allow: /
Sitemap: https://adtelas.com.br/sitemap.xml
```

### 11.4 Acessibilidade (WCAG 2.1)

#### Navegação por Teclado
- Todos os botões acessíveis via Tab
- Focus visible em todos os elementos
- Skip links para conteúdo principal

#### ARIA Labels
- Botões com aria-label descritivo
- Modais com aria-modal="true"
- Menus com aria-expanded

#### Contraste
- Mínimo 4.5:1 para texto normal
- Mínimo 3:1 para texto grande
- Testado com ferramentas automáticas

#### Semântica HTML
- Headers hierárquicos (h1, h2, h3)
- Landmarks (nav, main, footer)
- Listas semânticas (ul, ol)


---

## 🚀 12. DEPLOYMENT E MANUTENÇÃO

### 12.1 Build Commands

#### Development
```bash
npm run dev
# Inicia servidor em http://localhost:3001
```

#### Production Build
```bash
npm run build
# Gera build otimizado em .output/
```

#### Preview
```bash
npm run preview
# Preview do build de produção
```

#### Generate (SSG)
```bash
npm run generate
# Gera site estático em .output/public/
```

### 12.2 Environment Variables

**Arquivo:** `.env`

```env
# WhatsApp
NUXT_PUBLIC_WHATSAPP_NUMBER=5511983586611

# Google Reviews
NUXT_PUBLIC_GOOGLE_REVIEWS_URL=https://...

# Analytics
NUXT_PUBLIC_VERCEL_ANALYTICS_ID=...
```

### 12.3 Deployment (Vercel)

#### Configuração Automática
- Push para `main` → Deploy automático
- Preview deploys para PRs
- Edge Functions habilitadas

#### Domínio
- Produção: `adtelas.com.br`
- Preview: `*.vercel.app`

#### Environment
- Node: 18.x
- Build Command: `npm run build`
- Output Directory: `.output/public`

### 12.4 Monitoramento

#### Vercel Analytics
- Real User Monitoring (RUM)
- Core Web Vitals
- Performance insights

#### Error Tracking
- Console errors capturados
- Build errors notificados
- Runtime errors logados

### 12.5 Backup e Versionamento

#### Git
- Repository: GitHub/GitLab
- Branch principal: `main`
- Feature branches: `feature/*`
- Hotfix branches: `hotfix/*`

#### Imagens
- Backup em `/public/images/`
- Versionadas no Git
- Total: 70+ imagens


---

## 📱 13. RESPONSIVIDADE E MOBILE-FIRST

### 13.1 Estratégia Mobile-First

#### Breakpoints Utilizados
```css
/* Mobile: < 768px (padrão) */
/* Tablet: md: >= 768px */
/* Desktop: lg: >= 1024px */
/* Large Desktop: xl: >= 1280px */
```

#### Componentes Mobile-Specific
1. **MobileUnifiedCTA** - CTA unificado bottom
2. **Header Mobile** - Header compacto 64px
3. **MobileHeroOptimized** - Hero otimizado
4. **StickyFormModal** - Modal full-screen

### 13.2 Adaptações por Dispositivo

#### Header
- **Desktop:** 112px altura, menu horizontal
- **Mobile:** 64px altura, menu hambúrguer

#### Hero Section
- **Desktop:** 2 colunas (texto + imagem)
- **Mobile:** 1 coluna, imagem reduzida

#### Service Cards
- **Desktop:** Grid 2 colunas
- **Mobile:** 1 coluna, stack vertical

#### Formulário
- **Desktop:** Sidebar fixa
- **Mobile:** Modal slide-up

#### CTAs
- **Desktop:** WhatsApp Floating + Quick Help
- **Mobile:** Mobile Unified CTA + Floating

### 13.3 Touch Interactions

#### Swipe Gestures
- **Modal:** Swipe down para fechar
- **CTA Mobile:** Swipe down quando expandido
- **Carousel:** Swipe horizontal

#### Touch Targets
- Mínimo: 44px × 44px (Apple HIG)
- Botões principais: 56px altura
- Espaçamento: 8px entre elementos

#### Feedback Visual
- Active state: scale(0.98)
- Hover (desktop): scale(1.05)
- Loading: spinner animado
- Success: checkmark verde

### 13.4 Performance Mobile

#### Lazy Loading
- Imagens: loading="lazy"
- Componentes: defineAsyncComponent
- Rotas: lazy imports

#### Viewport Optimization
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

#### Font Loading
- System fonts (sem download)
- Fallback stack completo

#### Image Optimization
- Responsive images: srcset
- Formatos modernos: WebP
- Dimensões apropriadas


---

## 🎯 14. RESUMO DE TODOS OS BOTÕES E CTAs

### 14.1 Botões Globais (Sempre Visíveis)

#### 1. WhatsApp Floating Button
- **Localização:** Bottom-right, fixed
- **Visibilidade:** Todas as páginas
- **Z-index:** 99
- **Tamanho:** 60px × 60px (mobile), 70px × 70px (desktop)
- **Cor:** #25D366
- **Animações:** ping + pulse + bounce
- **Ação:** Abre WhatsApp com mensagem genérica

#### 2. Header WhatsApp (Mobile)
- **Localização:** Header mobile, direita
- **Visibilidade:** Mobile < 768px
- **Tamanho:** 40px × 32px
- **Cor:** #25D366
- **Animações:** pulse + ping
- **Ação:** Abre WhatsApp

#### 3. Mobile Unified CTA
- **Localização:** Bottom, fixed
- **Visibilidade:** Mobile < 768px, após scroll > 200px
- **Z-index:** 60
- **Estados:** Compacto (70px) / Expandido (240px)
- **Botões no estado expandido:**
  - WhatsApp (100% width, 56px)
  - Ligar (48% width, 56px)
  - Formulário (48% width, 56px)

#### 4. Quick Help Chat
- **Localização:** Bottom-left, fixed
- **Visibilidade:** Todas as páginas
- **Z-index:** 50
- **Ação:** Abre chat de ajuda

### 14.2 Botões da Página Inicial

#### Hero Section (Desktop)
5. **Botão Primário - WhatsApp**
   - Texto: "Fale com Especialista"
   - Cor: #25D366
   - Tamanho: px-8 py-4

6. **Botão Secundário - Formulário**
   - Texto: "Solicitar Orçamento"
   - Cor: #1D7BA6
   - Tamanho: px-8 py-4

#### Hero Section (Mobile)
7. **Botão Único WhatsApp**
   - Texto: "Orçamento Grátis WhatsApp"
   - Full-width, 56px altura

#### Services Cards
8. **Card Redes - WhatsApp**
   - Texto: "Orçamento Grátis"
   - Cor: #25D366

9. **Card Redes - Ver Detalhes**
   - Link para `/servicos/redes`
   - Cor: Azul

10. **Card Telas - WhatsApp**
    - Texto: "Orçamento Grátis"
    - Cor: #25D366

11. **Card Telas - Ver Detalhes**
    - Link para `/servicos/telas`
    - Cor: Azul

#### CTA Section
12. **Botão WhatsApp Grande**
    - Texto: "CLIQUE AQUI"
    - Fundo: Branco
    - Texto: #22345F
    - Borda: 2px #F49A1A
    - Ícone WhatsApp verde

### 14.3 Botões das Páginas de Serviço

#### Hero do Serviço
13. **Botão WhatsApp Primário**
    - Texto: "Orçamento Grátis"
    - Cor: #25D366
    - Mensagem personalizada com nome do serviço

14. **Botão Formulário Secundário**
    - Texto: "Preencher Formulário"
    - Cor: #1D7BA6

#### Sidebar Desktop
15. **LeadForm - Passo 1**
    - Botão: "Continuar no WhatsApp"
    - Cor: #25D366
    - Estados: normal, loading, success

16. **LeadForm - Passo 2**
    - Botão Voltar (40% width)
    - Botão Enviar (60% width, #25D366)

#### CTA Final
17. **Botão WhatsApp Final**
    - Similar ao CTA Section
    - Mensagem com contexto do serviço

### 14.4 Botões do Formulário Modal

#### StickyFormModal
18. **Botão Fechar (X)**
    - Top-right do modal
    - Ícone X

19. **LeadForm Modal - Passo 1**
    - Botão: "Continuar no WhatsApp"
    - Full-width, 56px

20. **LeadForm Modal - Passo 2**
    - Botão Voltar
    - Botão Enviar

### 14.5 Botões de Navegação

#### Header Menu
21-28. **8 Itens de Menu**
    - Início, Serviços, Vantagens, Cases, Avaliações, Soluções, FAQ, Contato
    - Scroll suave para seções

#### Breadcrumb
29. **Links de Navegação**
    - Home, Família, Categoria
    - Navegação hierárquica

### 14.6 Total de Pontos de Conversão

**Contagem por Tipo:**
- Botões WhatsApp diretos: 12
- Botões de Formulário: 6
- Botões de Telefone: 2
- Links de navegação: 10+

**Total Estimado:** 30+ pontos de conversão


---

## 📋 15. CHECKLIST DE FUNCIONALIDADES

### 15.1 Navegação ✅
- [x] Header desktop com 8 itens de menu
- [x] Header mobile com menu hambúrguer
- [x] Scroll suave para seções
- [x] Breadcrumb hierárquico
- [x] Logo clicável (volta para home)
- [x] Transparência do header ao rolar

### 15.2 Serviços ✅
- [x] 2 Famílias de serviços
- [x] 8 Categorias (4 por família)
- [x] 35+ Serviços específicos
- [x] Imagens para cada serviço
- [x] Especificações técnicas
- [x] Sistema de rotas dinâmicas

### 15.3 CTAs e Conversão ✅
- [x] WhatsApp Floating Button
- [x] Mobile Unified CTA (3 opções)
- [x] Header WhatsApp (mobile)
- [x] Quick Help Chat
- [x] LeadForm 2 passos
- [x] StickyFormModal
- [x] Mensagens WhatsApp personalizadas
- [x] 30+ pontos de conversão

### 15.4 Formulários ✅
- [x] Passo 1: Nome + Cidade (obrigatório)
- [x] Passo 2: Bairro + Serviço (opcional)
- [x] Validação de campos
- [x] Estados: normal, loading, success
- [x] Integração com WhatsApp
- [x] Trust indicators

### 15.5 Componentes ✅
- [x] HeroSection
- [x] ServicesCards
- [x] ProblemsSection
- [x] ValueProposition
- [x] CaseStudies
- [x] ReviewsCarousel
- [x] SegmentedSolutions
- [x] FaqSection
- [x] CtaSection
- [x] Footer

### 15.6 Responsividade ✅
- [x] Mobile-first design
- [x] Breakpoints: mobile, tablet, desktop
- [x] Touch interactions
- [x] Swipe gestures
- [x] Componentes mobile-specific
- [x] Imagens responsivas

### 15.7 Performance ✅
- [x] Lazy loading de imagens
- [x] Code splitting
- [x] Tree shaking
- [x] Minificação CSS/JS
- [x] System fonts (sem download)
- [x] Otimização de build

### 15.8 SEO ✅
- [x] Meta tags dinâmicas
- [x] Open Graph tags
- [x] Structured data
- [x] Sitemap
- [x] Robots.txt
- [x] URLs semânticas

### 15.9 Segurança ✅
- [x] Security headers configurados
- [x] CSP policy
- [x] XSS protection
- [x] HTTPS enforced
- [x] No inline scripts perigosos

### 15.10 Acessibilidade ✅
- [x] Navegação por teclado
- [x] ARIA labels
- [x] Contraste adequado
- [x] Semântica HTML
- [x] Focus visible
- [x] Skip links


---

## 🔮 16. ROADMAP E MELHORIAS FUTURAS

### 16.1 Fase 2 - Curto Prazo (1-3 meses)

#### Analytics Avançado
- [ ] Google Analytics 4 integration
- [ ] Facebook Pixel
- [ ] Hotjar/Clarity heatmaps
- [ ] Conversion funnel tracking

#### Otimizações de Conversão
- [ ] A/B testing framework
- [ ] Exit-intent popup
- [ ] Chatbot integration
- [ ] Live chat support

#### Conteúdo
- [ ] Blog de conteúdo SEO
- [ ] Vídeos de instalação
- [ ] Galeria de projetos
- [ ] Depoimentos em vídeo

### 16.2 Fase 3 - Médio Prazo (3-6 meses)

#### Funcionalidades
- [ ] Calculadora de orçamento online
- [ ] Agendamento de visita técnica
- [ ] Sistema de cupons/descontos
- [ ] Programa de indicação

#### Integrações
- [ ] CRM integration (RD Station, HubSpot)
- [ ] Email marketing (Mailchimp)
- [ ] SMS notifications
- [ ] Google Calendar para agendamentos

#### Expansão
- [ ] Área do cliente
- [ ] Acompanhamento de pedido
- [ ] Sistema de avaliações
- [ ] Programa de fidelidade

### 16.3 Fase 4 - Longo Prazo (6-12 meses)

#### E-commerce
- [ ] Venda direta de produtos
- [ ] Pagamento online
- [ ] Carrinho de compras
- [ ] Sistema de frete

#### Mobile App
- [ ] App iOS/Android
- [ ] Push notifications
- [ ] Geolocalização
- [ ] AR para visualização

#### Automação
- [ ] Chatbot com IA
- [ ] Resposta automática WhatsApp
- [ ] Follow-up automatizado
- [ ] Remarketing dinâmico

### 16.4 Melhorias Técnicas Contínuas

#### Performance
- [ ] Image optimization (WebP, AVIF)
- [ ] CDN implementation
- [ ] Service Worker (PWA)
- [ ] Edge caching

#### SEO
- [ ] Schema markup expansion
- [ ] Internal linking strategy
- [ ] Content optimization
- [ ] Backlink building

#### UX
- [ ] User testing sessions
- [ ] Accessibility audit
- [ ] Mobile UX improvements
- [ ] Loading states refinement


---

## 📞 17. INFORMAÇÕES DE CONTATO E SUPORTE

### 17.1 Contatos da Empresa

**AD Telas e Redes**
- **Telefone/WhatsApp:** (11) 98358-6611
- **Número Internacional:** +55 11 98358-6611
- **WhatsApp Link:** `https://wa.me/5511983586611`

**Horário de Atendimento:**
- Segunda a Sexta: 8h às 18h
- Sábado: 8h às 13h
- Domingo: Fechado

**Área de Atuação:**
- São Paulo - Capital
- Grande São Paulo
- Região Metropolitana

### 17.2 Links Importantes

**Google Reviews:**
```
https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,
```

**Redes Sociais:**
- Instagram: @adtelassp (sugerido)
- Facebook: /adtelassp (sugerido)

### 17.3 Documentação Técnica

**Guias Disponíveis:**
- `IMPLEMENTATION-GUIDE.md` - Guia de implementação
- `SERVICES-SYSTEM-GUIDE.md` - Sistema de serviços
- `SERVICOS-35-GUIDE.md` - Guia dos 35 serviços
- `MOBILE-CONVERSION-README.md` - Conversão mobile
- `MOBILE-UNIFIED-CTA-GUIDE.md` - CTA unificado
- `TWO-FORM-BUTTONS-EXPLAINED.md` - Sistema de formulários
- `STICKY-BOTTOM-BAR-GUIDE.md` - Barra sticky
- `QUICK-HELP-CHAT-GUIDE.md` - Chat de ajuda

### 17.4 Suporte Técnico

**Para Desenvolvedores:**
- Documentação: Este PRD
- Código: Comentado em português
- Composables: Documentados inline
- Componentes: Props documentadas

**Para Manutenção:**
- Atualizar serviços: `app/composables/useServicos.js`
- Atualizar imagens: `/public/images/`
- Atualizar textos: Componentes Vue
- Atualizar contato: Buscar por `5511983586611`


---

## 🎓 18. GLOSSÁRIO

### 18.1 Termos Técnicos

**Composable**
- Função reutilizável do Vue 3 Composition API
- Prefixo `use` (ex: useServicos)
- Retorna estado e métodos reativos

**Teleport**
- Recurso do Vue 3 para renderizar componentes em outro local do DOM
- Usado para modais e overlays

**Z-index**
- Propriedade CSS que controla a ordem de empilhamento
- Valores maiores ficam "por cima"

**Lazy Loading**
- Carregamento sob demanda de recursos
- Melhora performance inicial

**SSR (Server-Side Rendering)**
- Renderização no servidor
- Melhor SEO e performance inicial

**SSG (Static Site Generation)**
- Geração de site estático
- Páginas pré-renderizadas no build

### 18.2 Termos de Negócio

**CTA (Call-to-Action)**
- Botão ou elemento que incentiva ação
- Ex: "Orçamento Grátis", "Fale Conosco"

**Conversão**
- Ação desejada do usuário
- Ex: Clicar em WhatsApp, preencher formulário

**Lead**
- Potencial cliente que demonstrou interesse
- Forneceu dados de contato

**Funil de Conversão**
- Jornada do visitante até conversão
- Etapas: Visitante → Lead → Cliente

**Bounce Rate**
- Taxa de rejeição
- Visitantes que saem sem interagir

### 18.3 Termos do Produto

**Família**
- Categoria principal de serviços
- Ex: Redes de Proteção, Telas Mosquiteiras

**Categoria**
- Subcategoria dentro de uma família
- Ex: Residencial, Pets, Comercial

**Serviço**
- Produto/serviço específico
- Ex: Redes para Janelas, Telas Pet Screen

**Destaque**
- Badge/tag de diferenciação
- Ex: "Mais vendido", "Certificado INMETRO"

**Especificações**
- Detalhes técnicos do serviço
- Material, resistência, garantia, etc.


---

## 📊 19. APÊNDICES

### 19.1 Apêndice A - Lista Completa de Componentes

#### Componentes de Layout
1. `Header.vue` - Cabeçalho principal
2. `Footer.vue` - Rodapé
3. `Breadcrumb.vue` - Navegação hierárquica
4. `BreadcrumbServico.vue` - Breadcrumb específico

#### Componentes de Conteúdo
5. `HeroSection.vue` - Hero principal
6. `ServicesCards.vue` - Cards de serviços
7. `ServiceGrid.vue` - Grid de serviços
8. `ServiceCategoryCards.vue` - Cards de categorias
9. `ServicesHero.vue` - Hero de serviços
10. `ProblemsSection.vue` - Seção de problemas
11. `ValueProposition.vue` - Proposta de valor
12. `CaseStudies.vue` - Cases de sucesso
13. `ReviewsCarousel.vue` - Carrossel de avaliações
14. `SegmentedSolutions.vue` - Soluções segmentadas
15. `FaqSection.vue` - Perguntas frequentes

#### Componentes de Conversão
16. `CtaSection.vue` - Seção CTA principal
17. `CtaButton.vue` - Botão CTA individual
18. `CtaButtons.vue` - Grupo de botões CTA
19. `PureCTAButtons.vue` - CTAs puros
20. `LeadForm.vue` - Formulário de lead
21. `StickyFormModal.vue` - Modal de formulário
22. `WhatsappFloating.vue` - Botão WhatsApp flutuante
23. `WhatsappModal.vue` - Modal WhatsApp
24. `QuickHelpChat.vue` - Chat de ajuda rápida
25. `SocialButtons.vue` - Botões sociais

#### Componentes Mobile
26. `MobileHeroOptimized.vue` - Hero mobile otimizado
27. `MobileLandingComplete.vue` - Landing mobile completa
28. `MobileUnifiedCTA.vue` - CTA unificado mobile
29. `StickyBottomBar.vue` - Barra sticky bottom
30. `StickyBottomBarVariants.vue` - Variantes da barra
31. `StickyCtaMobile.vue` - CTA sticky mobile
32. `StickyFooterCta.vue` - CTA footer sticky
33. `FloatingButtons.vue` - Botões flutuantes

**Total:** 33 componentes

### 19.2 Apêndice B - Lista Completa de Composables

1. `useServicos.js` - Sistema de serviços (35+)
2. `useServicoData.js` - Dados de serviços
3. `useWhatsappModal.js` - Modal WhatsApp
4. `useScrollAnimation.js` - Animações de scroll
5. `useScrollTo.js` - Scroll suave
6. `useSegments.js` - Segmentos de clientes
7. `useFaq.js` - Perguntas frequentes

**Total:** 7 composables

### 19.3 Apêndice C - Lista Completa de Páginas

1. `/` - Página inicial
2. `/servicos` - Índice de serviços
3. `/servicos/redes` - Landing Redes de Proteção
4. `/servicos/telas` - Landing Telas Mosquiteiras
5. `/servicos/[familia]` - Página de família
6. `/servicos/[familia]/[categoria]` - Página de categoria
7. `/servicos/[familia]/[categoria]/[servico]` - Página de serviço
8. `/servicos/[slug]` - Serviço individual (fallback)
9. `/mobile-test` - Teste mobile
10. `/test-modal` - Teste modal
11. `/test-simple` - Teste simples

**Total:** 11 páginas/rotas

### 19.4 Apêndice D - Lista Completa de Imagens

#### Imagens Principais
- `logo ad.png` - Logo da empresa
- `familia.png` - Imagem família (hero)
- `TELA_MOSQUITEIRA.png` - Tela mosquiteira principal
- `bebe.png` - Bebê (proteção infantil)
- `gato.png` - Gato (proteção pets)
- `pets_pro.png` - Pets profissional
- `menino_janela.png` - Menino na janela
- `mosquitoo.png` - Mosquito
- `bb.png` - Bebê alternativo
- `protecaoinfantil.jpeg` - Proteção infantil
- `tela_proteção_servico.png` - Serviço de tela

#### Avaliações (5 imagens)
- `avaliação1.png` até `avaliação5.png`

#### Redes de Proteção (17 serviços × 2 imagens = 34)
- Cada serviço tem:
  - Imagem principal: `Redes_para_[Nome].png/jpg`
  - Especificações: `Redes_para_[Nome]_especificações.png/jpg`

#### Telas Mosquiteiras (18 serviços × 2 imagens = 36)
- Cada serviço tem:
  - Imagem principal: `Telas_[Nome].png/jpg/webp`
  - Especificações: `Telas_[Nome]_especificações.png/jpg/webp`

**Total Estimado:** 70+ imagens


---

## ✅ 20. CONCLUSÃO

### 20.1 Resumo Executivo

Este PRD documenta um sistema completo de landing page e catálogo digital para a **AD Telas e Redes**, empresa especializada em instalação de redes de proteção e telas mosquiteiras em São Paulo.

**Números do Projeto:**
- **35+ serviços** organizados hierarquicamente
- **33 componentes** Vue reutilizáveis
- **30+ pontos de conversão** estrategicamente posicionados
- **11 páginas/rotas** dinâmicas
- **70+ imagens** otimizadas
- **7 composables** para lógica de negócio

### 20.2 Diferenciais Técnicos

1. **Arquitetura Escalável**
   - Sistema hierárquico: Famílias → Categorias → Serviços
   - Fácil adicionar novos serviços
   - Rotas dinâmicas automáticas

2. **Conversão Otimizada**
   - Mobile-first design
   - 30+ pontos de conversão
   - Formulário em 2 passos
   - WhatsApp integrado

3. **Performance**
   - Nuxt 3 com SSR/SSG
   - Lazy loading
   - Code splitting
   - Otimização de imagens

4. **SEO**
   - Meta tags dinâmicas
   - Structured data
   - URLs semânticas
   - Sitemap automático

### 20.3 Objetivos Alcançados

✅ **Conversão:** Múltiplos pontos de contato via WhatsApp  
✅ **Usabilidade:** Interface intuitiva e responsiva  
✅ **Performance:** Carregamento rápido e otimizado  
✅ **SEO:** Estrutura otimizada para buscadores  
✅ **Manutenibilidade:** Código organizado e documentado  
✅ **Escalabilidade:** Fácil adicionar novos serviços  

### 20.4 Próximos Passos

1. **Imediato:**
   - Deploy em produção
   - Configurar analytics
   - Testar conversões

2. **Curto Prazo:**
   - Implementar A/B tests
   - Adicionar blog
   - Integrar CRM

3. **Médio Prazo:**
   - Calculadora de orçamento
   - Sistema de agendamento
   - Área do cliente

### 20.5 Contato para Suporte

**Desenvolvedor/Manutenção:**
- Documentação completa neste PRD
- Código comentado em português
- Guias específicos disponíveis

**Empresa:**
- WhatsApp: (11) 98358-6611
- Atendimento: Segunda a Sábado

---

## 📝 HISTÓRICO DE VERSÕES

**v2.0** - 03/03/2026
- PRD completo e detalhado
- Documentação de todos os 35 serviços
- Mapeamento de todos os botões e CTAs
- Especificações técnicas completas
- Guias de implementação

**v1.0** - Data anterior
- Versão inicial do sistema
- Estrutura básica implementada

---

## 📄 LICENÇA E PROPRIEDADE

**Proprietário:** AD Telas e Redes  
**Desenvolvido em:** 2026  
**Tecnologia:** Nuxt 3 + Vue 3 + Tailwind CSS  
**Documentação:** Português (Brasil)  

---

**FIM DO DOCUMENTO**

*Este PRD é um documento vivo e deve ser atualizado conforme o projeto evolui.*

