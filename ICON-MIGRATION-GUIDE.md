# Guia de Migração de Ícones SVG para Nuxt Icon

## ✅ MIGRAÇÃO COMPLETA

Todos os ícones inline SVG foram substituídos por componentes Nuxt Icon.

---

## ✅ Instalação Completa

```bash
npm install @nuxt/icon
```

Adicionar em `nuxt.config.ts`:
```typescript
modules: ['@nuxtjs/tailwindcss', '@nuxt/icon']
```

## 📦 Ícones Disponíveis

Nuxt Icon usa Iconify, que tem acesso a 200,000+ ícones de várias bibliotecas:
- Lucide (recomendado): `lucide:icon-name`
- Heroicons: `heroicons:icon-name`
- Material Design: `mdi:icon-name`
- Font Awesome: `fa:icon-name`

Buscar ícones: https://icones.js.org/

## 🔄 Substituições Recomendadas

### Check/CheckCircle
```vue
<!-- ANTES -->
<svg class="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
</svg>

<!-- DEPOIS -->
<Icon name="lucide:check-circle" class="w-5 h-5 text-[#25D366]" />
```

### ChevronRight (setas →)
```vue
<!-- ANTES -->
<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
</svg>

<!-- DEPOIS -->
<Icon name="lucide:chevron-right" class="w-4 h-4" />
```

### ChevronDown (setas ↓)
```vue
<!-- ANTES -->
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
</svg>

<!-- DEPOIS -->
<Icon name="lucide:chevron-down" class="w-6 h-6" />
```

### Arrow Right (→)
```vue
<!-- ANTES -->
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
</svg>

<!-- DEPOIS -->
<Icon name="lucide:arrow-right" class="w-5 h-5" />
```

### Star (⭐)
```vue
<!-- ANTES -->
<svg class="w-4 h-4 text-[#F49A1A]" fill="currentColor" viewBox="0 0 20 20">
  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
</svg>

<!-- DEPOIS -->
<Icon name="lucide:star" class="w-4 h-4 text-[#F49A1A]" />
```

### X/Close
```vue
<!-- ANTES -->
<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
</svg>

<!-- DEPOIS -->
<Icon name="lucide:x-circle" class="w-6 h-6" />
```

### WhatsApp (manter SVG original)
O ícone do WhatsApp deve ser mantido como SVG inline pois é um logo específico e precisa ser exato.

## 📝 Arquivos Atualizados ✅

1. ✅ `app/pages/servicos/redes.vue` - check-circle, arrow-right
2. ✅ `app/pages/servicos/telas.vue` - check-circle, arrow-right
3. ✅ `app/pages/servicos/[familia]/index.vue` - arrow-right
4. ✅ `app/pages/servicos/[familia]/[categoria]/index.vue` - chevron-right, layers
5. ✅ `app/pages/servicos/[familia]/[categoria]/[servico].vue` - check-circle, arrow-right, chevron-down, star, clock, arrow-left, x-circle
6. ✅ `app/components/ServicesCards.vue` - check-circle, arrow-right

### Ícones Migrados

| Ícone | Uso | Páginas |
|-------|-----|---------|
| `lucide:check-circle` | Benefits, confirmações | Todas as páginas de serviço |
| `lucide:arrow-right` | Navegação, CTAs | Todas as páginas de serviço |
| `lucide:chevron-right` | Navegação de categoria | [categoria]/index.vue |
| `lucide:chevron-down` | Dropdowns, accordions | [servico].vue FAQ |
| `lucide:star` | Avaliações, reviews | [servico].vue |
| `lucide:clock` | Ofertas por tempo limitado | [servico].vue CTA |
| `lucide:arrow-left` | Navegação voltar | [servico].vue footer |
| `lucide:x-circle` | Comparações negativas | [servico].vue |
| `lucide:layers` | Badge de contagem | [categoria]/index.vue |

### WhatsApp SVG Mantido
O ícone do WhatsApp permanece como SVG inline (logo específico da marca).

## 🎯 Benefícios

- ✅ Código mais limpo e legível
- ✅ Tamanho de bundle menor
- ✅ Fácil trocar ícones
- ✅ Consistência visual
- ✅ Suporte a tree-shaking
- ✅ Build completo com sucesso (2.59 MB total, 658 kB gzip)

## 🚀 Exemplo Completo

```vue
<template>
  <div class="flex items-center gap-2">
    <Icon name="lucide:check-circle" class="w-5 h-5 text-green-500" />
    <span>Instalação em 48h</span>
  </div>
</template>
```

## 📚 Recursos

- Documentação: https://nuxt.com/modules/icon
- Buscar ícones: https://icones.js.org/
- Lucide Icons: https://lucide.dev/icons/
