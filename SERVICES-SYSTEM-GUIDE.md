# Sistema de Cards de Serviços - Guia de Implementação

## 📋 Visão Geral

Sistema completo de cards de serviços clicáveis que levam a páginas dedicadas para cada serviço da AD Telas. Implementado com Nuxt 4 + Vue 3 + TailwindCSS seguindo o PRD da empresa.

---

## 🗂️ Arquivos Criados

### 1. `app/composables/useServicoData.js`
**Função:** Composable centralizado com todos os dados dos serviços

**Conteúdo:**
- Dados estruturados de 2 serviços (Rede de Proteção + Tela Mosquiteira)
- Benefícios, especificações técnicas, comparações, cases, FAQ
- Métodos helper para buscar serviços e gerar URLs WhatsApp
- Meta tags SEO por serviço

**Como adicionar novo serviço:**
```javascript
{
  slug: 'novo-servico',
  titulo: 'Nome do Serviço',
  subtitulo: 'Descrição curta',
  destaque: 'Diferencial principal',
  // ... copie a estrutura completa de um serviço existente
}
```

---

### 2. `app/components/ServicesCards.vue`
**Função:** Componente de cards clicáveis na home

**Características:**
- 2 cards lado a lado (desktop), empilhados (mobile)
- Hover: elevação + borda laranja
- Clique: navega para `/servicos/[slug]`
- Badges de destaque, benefícios, preço
- CTA verde "Ver Detalhes"
- Tracking GA4 em todos os cliques

**Como usar:**
```vue
<ServicesCards />
```

---

### 3. `app/pages/servicos/[slug].vue`
**Função:** Página dinâmica de cada serviço

**Estrutura (7 seções):**

1. **Hero Específico**
   - Título: "[Serviço] em São Paulo"
   - Imagem grande do serviço
   - Breadcrumb de navegação
   - CTA "Orçamento Grátis"
   - Badge flutuante "500+ instalações"

2. **Por que nossa [Serviço]**
   - 4 cards de benefícios com ícones
   - Grid responsivo

3. **Vídeo/Demo + Especificações**
   - Imagem demo do serviço instalado
   - 6 especificações técnicas em cards
   - CTA "Solicitar Orçamento Detalhado"

4. **Comparação: Nós vs Concorrentes**
   - Tabela comparativa visual
   - Checkmarks verdes (nós) vs X vermelho (concorrentes)
   - CTA "Quero a Melhor Opção"

5. **Cases de Sucesso**
   - 2 cases específicos do serviço
   - Formato: Problema → Solução → Resultado

6. **FAQ Específica**
   - 5 perguntas/respostas em accordion
   - CTA "Fale com um Especialista"

7. **CTA Final Agressivo**
   - Background azul escuro com pattern
   - "Proteja sua família HOJE!"
   - 3 benefícios rápidos
   - CTA gigante verde WhatsApp
   - Prova social (500+ clientes, nota 4.9)

**SEO:**
- Meta tags dinâmicas por serviço
- Title, description, keywords, Open Graph
- Breadcrumb estruturado

---

## 🎨 Paleta de Cores (PRD)

```css
Azul Escuro: #22345F  /* Títulos, confiança */
Laranja:     #F49A1A  /* Destaques, hover */
Verde Whats: #25D366  /* CTAs principais */
Azul Claro:  #E5EDF8  /* Bordas, backgrounds */
Cinza Escuro:#4B5563  /* Textos secundários */
```

---

## 📱 Responsividade

### Mobile (< 768px)
- Cards 100% largura, empilhados
- Botões full-width
- Texto reduzido (3xl → 2xl)
- Grid 1 coluna

### Desktop (≥ 768px)
- Cards lado a lado (grid-cols-2)
- Hover effects ativos
- Texto maior (5xl)
- Grid 2-4 colunas

---

## 🔧 Configurações Editáveis

### WhatsApp e Empresa
**Arquivo:** `app/composables/useServicoData.js`

```javascript
const WHATSAPP_NUMBER = '5511983586611'  // ← EDITE AQUI
const COMPANY_NAME = 'AD Telas e Redes'  // ← EDITE AQUI
```

### Imagens dos Serviços
**Arquivo:** `app/composables/useServicoData.js`

```javascript
imagem: '/images/familia.png',              // Card principal
imagemHero: '/images/familia.png',          // Hero da página
imagemDemo: '/images/protecaoinfantil.jpeg' // Seção demo
```

**Localização:** `public/images/`

### Preços
**Arquivo:** `app/composables/useServicoData.js`

```javascript
preco: 'A partir de R$ 89/m²'  // ← EDITE AQUI
```

---

## 📊 Tracking GA4/GTM

### Eventos Implementados

**ServicesCards.vue:**
- `servico_card_clicked` - Clique no card
- `servico-card-[slug]` - Data attribute GTM

**Página [slug].vue:**
- `servico_whatsapp_clicked` - Clique em qualquer CTA WhatsApp
  - Parâmetros: `slug`, `origem` (hero, especificacoes, comparacao, faq, cta-final)

**Data Attributes GTM:**
```html
data-gtm="servico-hero-whatsapp"
data-gtm="servico-specs-whatsapp"
data-gtm="servico-comparacao-whatsapp"
data-gtm="servico-faq-whatsapp"
data-gtm="servico-cta-final-whatsapp"
```

---

## 🚀 Como Integrar na Home

### Opção 1: Substituir ServicesSection atual
**Arquivo:** `app/pages/index.vue`

```vue
<template>
  <div>
    <Header />
    <HeroSection />
    
    <!-- ANTES -->
    <!-- <ServicesSection /> -->
    
    <!-- DEPOIS -->
    <ServicesCards />
    
    <ValueProposition />
    <!-- ... resto dos componentes -->
  </div>
</template>
```

### Opção 2: Adicionar em nova seção
```vue
<template>
  <div>
    <Header />
    <HeroSection />
    <ProblemsSection />
    
    <!-- Nova seção de serviços -->
    <ServicesCards />
    
    <ServicesSection />  <!-- Mantém a antiga -->
    <!-- ... resto -->
  </div>
</template>
```

---

## 🧪 Testes Recomendados

### Funcionalidade
- [ ] Cards clicáveis navegam para `/servicos/rede-protecao`
- [ ] Cards clicáveis navegam para `/servicos/tela-mosquiteira`
- [ ] Página 404 se slug inválido (redireciona para home)
- [ ] Todos os CTAs WhatsApp abrem com mensagem pré-formatada
- [ ] Breadcrumb "Início" volta para home

### Responsividade
- [ ] Cards empilham em mobile (< 768px)
- [ ] Imagens carregam corretamente
- [ ] Texto legível em todas as resoluções
- [ ] Botões acessíveis no mobile

### SEO
- [ ] Meta tags aparecem no `<head>`
- [ ] Title único por serviço
- [ ] Open Graph tags corretas
- [ ] Imagens têm alt text

### Performance
- [ ] Imagens com lazy loading (exceto hero)
- [ ] Transições suaves (300ms)
- [ ] Sem layout shift

---

## 🎯 Conversão: Funil de Vendas

### Jornada do Usuário

1. **Home** → Vê cards de serviços
2. **Clique** → Navega para página dedicada
3. **Hero** → Lê título + descrição + preço
4. **Benefícios** → Entende diferenciais (4 cards)
5. **Especificações** → Vê detalhes técnicos
6. **Comparação** → Compara com concorrentes
7. **Cases** → Vê prova social
8. **FAQ** → Tira dúvidas
9. **CTA Final** → Clica "Orçamento GRÁTIS"
10. **WhatsApp** → Conversa com atendente

### Pontos de Conversão (7 CTAs)
- Hero: "Orçamento Grátis para [Serviço]"
- Especificações: "Solicitar Orçamento Detalhado"
- Comparação: "Quero a Melhor Opção!"
- FAQ: "Fale com um Especialista"
- CTA Final: "Solicitar Orçamento GRÁTIS Agora"

---

## 📈 Métricas de Sucesso

### KPIs Recomendados

**Taxa de Clique (CTR):**
- Home → Página serviço: > 15%
- Página serviço → WhatsApp: > 20%

**Tempo na Página:**
- Página serviço: > 2 minutos

**Taxa de Conversão:**
- Visitantes → Leads WhatsApp: > 5%

**Scroll Depth:**
- Chegam no CTA final: > 60%

---

## 🔄 Roadmap Futuro

### Fase 2 (Opcional)
- [ ] Adicionar mais serviços (Tela Pet, Tela Varanda)
- [ ] Galeria de fotos por serviço
- [ ] Vídeos de instalação
- [ ] Calculadora de preço online
- [ ] Formulário de orçamento inline (sem WhatsApp)
- [ ] Depoimentos em vídeo
- [ ] Chat ao vivo

### Fase 3 (Avançado)
- [ ] Sistema de agendamento online
- [ ] Painel admin para editar serviços
- [ ] Blog com artigos por serviço
- [ ] Comparador de serviços lado a lado
- [ ] Simulador 3D de instalação

---

## 🐛 Troubleshooting

### Problema: Página não carrega
**Solução:** Verifique se o slug existe no `useServicoData.js`

### Problema: Imagens não aparecem
**Solução:** Verifique se as imagens estão em `public/images/`

### Problema: WhatsApp não abre
**Solução:** Verifique o número no formato `5511983586611` (sem espaços/caracteres)

### Problema: Eventos GA4 não disparam
**Solução:** Verifique se `window.dataLayer` existe no console

---

## 📞 Contato Técnico

**Desenvolvedor:** Kiro AI Assistant  
**Data Criação:** 25 de Fevereiro de 2026  
**Versão:** 1.0  
**Framework:** Nuxt 4.2.2 + Vue 3.5.26 + TailwindCSS 6.14.0

---

## ✅ Checklist de Implementação

- [x] Criar `useServicoData.js` com dados dos serviços
- [x] Criar `ServicesCards.vue` com cards clicáveis
- [x] Criar `pages/servicos/[slug].vue` com página dinâmica
- [ ] Adicionar `<ServicesCards />` na home
- [ ] Testar navegação entre páginas
- [ ] Testar CTAs WhatsApp
- [ ] Validar responsividade mobile
- [ ] Configurar eventos GA4
- [ ] Otimizar imagens (WebP, lazy loading)
- [ ] Testar SEO (meta tags, Open Graph)
- [ ] Deploy em produção

---

**Sistema pronto para uso! 🚀**
