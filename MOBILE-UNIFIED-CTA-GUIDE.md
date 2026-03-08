# Guia de Implementação - Mobile Unified CTA

## ✅ IMPLEMENTAÇÃO COMPLETA

Data: 25/02/2026
Status: Pronto para deploy

---

## 📱 Componente Principal: MobileUnifiedCTA.vue

### Funcionalidades Implementadas

✅ **Estado Compacto (Padrão)**
- Fixed bottom-0, z-50
- Aparece após scroll 200px
- Verde WhatsApp gradient (emerald-500/600)
- Altura 70px (área de toque 44px+)
- Texto: "💬 Orçamento Grátis WhatsApp"
- Animação de pulso infinita
- Botão expandir no canto direito

✅ **Estado Expandido**
- Altura 240px com slide-up suave
- 3 botões de ação:
  1. WhatsApp (100% width, verde)
  2. Telefone (48% width, azul)
  3. Formulário (48% width, laranja)
- Botão X para fechar
- Swipe down para fechar
- Backdrop escuro com fade

✅ **Recursos Técnicos**
- Composition API (Vue 3/Nuxt 4)
- useWindowScroll() para detecção de scroll
- Touch events (touchstart, touchmove, touchend)
- Swipe gestures
- GPU accelerated animations
- Tailwind CSS + custom animations
- Acessibilidade (aria-expanded, aria-label)

### Props

```typescript
{
  servicoAtual: String,  // Nome do serviço atual
  telefone: String,      // Número WhatsApp (default: 5511983586611)
  msgPadrao: String      // Mensagem padrão WhatsApp
}
```

### Events

```typescript
{
  'open-form': void  // Emitido ao clicar no botão Formulário
}
```

---

## 🧭 Componente Breadcrumb.vue

### Funcionalidades

✅ Geração automática baseada no path
✅ Integração com useServicos()
✅ Navegação hierárquica:
  - Home
  - Serviços
  - Família (Redes/Telas)
  - Categoria
  - Serviço Individual
✅ Responsive (scroll horizontal em mobile)
✅ Ícones chevron-right como separadores
✅ Último item não clicável (página atual)

### Uso

```vue
<Breadcrumb :path="route.path" />
```

---

## 📄 Páginas Atualizadas

### 1. Home (index.vue)
```vue
<MobileUnifiedCTA
  servico-atual="Redes de Proteção ou Telas Mosquiteiras"
  @open-form="openFormModal"
/>
<StickyFormModal v-model="showFormModal" />
```

### 2. Família Redes (servicos/redes.vue)
```vue
<Breadcrumb :path="route.path" />
<MobileUnifiedCTA
  servico-atual="Redes de Proteção"
  @open-form="showFormModal = true"
/>
<StickyFormModal v-model="showFormModal" />
```

### 3. Família Telas (servicos/telas.vue)
- Mesma estrutura que redes.vue

### 4. Páginas de Categoria
```vue
<Breadcrumb :path="route.path" />
<MobileUnifiedCTA
  :servico-atual="`${familia.nome} - ${categoria.titulo}`"
  @open-form="showFormModal = true"
/>
```

### 5. Páginas de Serviço Individual
```vue
<Breadcrumb :path="route.path" />
<MobileUnifiedCTA
  :servico-atual="servico.titulo"
  @open-form="showFormModal = true"
/>
```

---

## 🗑️ Componentes Removidos/Substituídos

❌ **QuickHelpChat.vue** - Substituído por MobileUnifiedCTA
❌ **StickyBottomBar.vue** - Substituído por MobileUnifiedCTA
❌ **WhatsappFloating.vue** - Substituído por MobileUnifiedCTA
❌ **Múltiplos botões WhatsApp** - Unificados em 1 componente

---

## 🎨 Animações e Performance

### CSS Animations

```css
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.1; }
}

.animate-pulse-slow {
  animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### GPU Acceleration

```css
.transition-all {
  will-change: transform, height;
  transform: translateZ(0);
}
```

### Performance Targets

✅ 60fps animations
✅ No layout shift (CLS < 0.1)
✅ Instant response (<100ms)
✅ Smooth transitions (300ms)

---

## 📱 Responsividade

### Breakpoints

- **Mobile:** < 768px (componente visível)
- **Tablet/Desktop:** ≥ 768px (componente oculto)

### Classe Tailwind

```vue
class="md:hidden"
```

---

## ♿ Acessibilidade

### ARIA Attributes

```html
aria-label="Solicitar orçamento grátis pelo WhatsApp"
aria-expanded="false"
aria-current="page"
```

### Keyboard Navigation

✅ Tab navigation
✅ Enter/Space para ativar
✅ Escape para fechar (quando expandido)

### Focus States

```css
focus-visible:ring-2 focus-visible:ring-emerald-500
```

---

## 🔗 Integração WhatsApp

### URL Format

```javascript
const whatsappUrl = computed(() => {
  const servico = props.servicoAtual ? `\n\n📋 ${props.servicoAtual}` : ''
  const mensagem = `${props.msgPadrao}${servico}\n\nPode me ajudar?`
  return `https://wa.me/${props.telefone}?text=${encodeURIComponent(mensagem)}`
})
```

### Exemplo de Mensagem

```
Olá! Gostaria de um orçamento.

📋 Redes para Janelas

Pode me ajudar?
```

---

## 🚀 Deploy Instructions

### 1. Build

```bash
cd nuxt-app
npm run build
```

### 2. Test

```bash
npm run preview
```

### 3. Verificações

✅ Mobile < 768px: Componente aparece após scroll 200px
✅ Desktop ≥ 768px: Componente oculto
✅ WhatsApp abre com mensagem correta
✅ Telefone abre discador
✅ Formulário abre modal
✅ Swipe down fecha expandido
✅ Backdrop fecha expandido
✅ Animações suaves 60fps

### 4. Deploy

```bash
# Vercel/Netlify
npm run build
# Deploy .output/

# Node.js
node .output/server/index.mjs
```

---

## 📊 Métricas de Sucesso

### Objetivos

🎯 **Taxa de conversão:** +25%
🎯 **Cliques WhatsApp:** +40%
🎯 **Tempo para lead:** -50%
🎯 **Taxa de rejeição:** -15%

### Tracking

```javascript
// Google Analytics 4
gtag('event', 'cta_click', {
  'event_category': 'mobile_unified_cta',
  'event_label': 'whatsapp',
  'value': 1
})
```

---

## 🐛 Troubleshooting

### Componente não aparece

- Verificar breakpoint (< 768px)
- Verificar scroll position (> 200px)
- Verificar z-index (50)

### Animações travando

- Verificar GPU acceleration
- Reduzir complexidade de animações
- Usar `will-change` com moderação

### WhatsApp não abre

- Verificar encoding da mensagem
- Verificar número de telefone
- Testar em dispositivo real

---

## 📝 Próximos Passos

### Fase 2 (Opcional)

- [ ] A/B testing de mensagens
- [ ] Analytics detalhado
- [ ] Personalização por página
- [ ] Variações de cor por família
- [ ] Animações de entrada customizadas
- [ ] Suporte a mais idiomas

---

## ✅ Checklist Final

- [x] MobileUnifiedCTA.vue criado
- [x] Breadcrumb.vue criado
- [x] index.vue atualizado
- [x] servicos/redes.vue atualizado
- [x] servicos/telas.vue atualizado
- [x] Componentes antigos removidos
- [x] Animações implementadas
- [x] Acessibilidade implementada
- [x] Responsividade testada
- [x] Performance otimizada
- [x] Documentação completa

---

**Status:** ✅ Pronto para produção
**Data:** 25/02/2026
**Versão:** 1.0.0

