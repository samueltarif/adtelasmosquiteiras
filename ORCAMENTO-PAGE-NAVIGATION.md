# Página de Orçamento - Navegação e Descoberta

## Data: 03/03/2026 14:20

## Objetivo
Tornar a página `/orcamento` facilmente acessível para os usuários através de múltiplos pontos de entrada no site.

## Alterações Implementadas

### 1. Header - Menu de Navegação
**Arquivo**: `nuxt-app/app/components/Header.vue`

#### Adicionado item "Orçamento" no menu
- Posicionado entre "FAQ" e "Contato"
- Estilo destacado com cor laranja (#F49A1A)
- Funciona em desktop e mobile
- Propriedade `highlight: true` para destaque visual

```javascript
const menuItems = [
  // ... outros itens
  { label: 'Orçamento', id: '/orcamento', type: 'link', highlight: true },
  { label: 'Contato', id: '/contato', type: 'link' }
]
```

#### Estilos aplicados
- **Desktop**: Botão com fundo laranja, texto branco, bordas arredondadas
- **Mobile (dropdown)**: Texto laranja destacado
- **Mobile (sticky)**: Texto laranja destacado

### 2. Hero Section - CTAs Principais
**Arquivo**: `nuxt-app/app/components/HeroSection.vue`

#### Desktop (>= 768px)
Adicionado 3 botões de CTA:
1. **WhatsApp** (verde) - Orçamento via WhatsApp
2. **Formulário** (laranja) - Link para `/orcamento` ✨ NOVO
3. **Ligar** (azul escuro) - Telefone direto

```vue
<NuxtLink 
  to="/orcamento"
  class="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-[#F49A1A] rounded-2xl font-medium text-base border-2 border-[#F49A1A] hover:bg-[#F49A1A]/5 transition-all"
>
  <Icon name="lucide:file-text" class="w-5 h-5" />
  <span>Preencher Formulário</span>
</NuxtLink>
```

#### Mobile (< 768px)
Grid com 2 botões secundários:
1. **Formulário** (laranja) - Link para `/orcamento` ✨ NOVO
2. **Ligar** (azul escuro) - Telefone direto

```vue
<div class="grid grid-cols-2 gap-3 mb-6">
  <NuxtLink 
    to="/orcamento"
    class="flex items-center justify-center gap-1.5 h-12 bg-white text-[#F49A1A] rounded-2xl font-medium text-sm border-2 border-[#F49A1A]"
  >
    <Icon name="lucide:file-text" class="w-4 h-4" />
    <span>Formulário</span>
  </NuxtLink>
  <!-- ... -->
</div>
```

## Pontos de Entrada para /orcamento

### Principais
1. **Header Desktop** - Menu de navegação (sempre visível)
2. **Header Mobile** - Menu hamburguer (sempre visível)
3. **Hero Desktop** - Botão "Preencher Formulário" (primeira seção)
4. **Hero Mobile** - Botão "Formulário" (primeira seção)

### Futuros (Sugestões)
- Footer - Link direto
- Páginas de serviços individuais - CTA específico
- Página 404 - Sugestão de contato
- Sticky bottom bar mobile - Botão adicional

## Hierarquia Visual

### Cores e Prioridade
1. **Verde (#25D366)** - WhatsApp (prioridade máxima)
2. **Laranja (#F49A1A)** - Orçamento/Formulário (prioridade alta)
3. **Azul (#22345F)** - Telefone (prioridade média)

### Tamanhos
- **Desktop**: Botões grandes (px-8 py-4)
- **Mobile**: Botões médios (h-12, h-14)

## Tracking GA4

A página `/orcamento` já possui tracking integrado:
- `form_submit` - Quando formulário é enviado
- `contact_click` - Quando usuário clica em WhatsApp/Telefone

## Testes Realizados

✅ Build completado com sucesso
✅ Navegação desktop funcional
✅ Navegação mobile funcional
✅ Ícones Lucide carregando corretamente
✅ Estilos responsivos aplicados

## Próximos Passos (Opcional)

1. Adicionar link no Footer
2. Adicionar CTA em páginas de serviços
3. A/B test: Testar diferentes textos nos botões
4. Heatmap: Analisar cliques nos CTAs
5. Analytics: Monitorar taxa de conversão da página

## Observações

- Todos os links usam `NuxtLink` para navegação SPA
- Ícones usam `lucide:file-text` para consistência
- Cores seguem a paleta da marca (logo)
- Design responsivo mobile-first
- Acessibilidade: botões com labels claros

---

**Status**: ✅ Implementado e testado
**Build**: ✅ Sucesso
**Commit**: Pendente aprovação do usuário
