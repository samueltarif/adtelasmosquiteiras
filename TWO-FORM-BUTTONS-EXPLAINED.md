# Dois Botões de Formulário - Explicação - 25/02/2026 16:30

## 📱 Existem 2 Botões Diferentes para Abrir o Formulário

### 1️⃣ Botão do MobileUnifiedCTA (Bottom Bar Verde)
**Localização**: Fixed bottom, aparece após scroll >200px  
**Cor**: Verde WhatsApp (#25D366)  
**Comportamento**:
- Estado compacto: Botão verde com texto "💬 Orçamento Grátis WhatsApp"
- Ao clicar: Expande mostrando 3 opções
  - WhatsApp (verde, 100% width)
  - Ligar (azul, 48% width)
  - Formulário (laranja, 48% width)

**Componente**: `MobileUnifiedCTA.vue`  
**Trigger**: Scroll > 200px  
**Z-index**: 50

---

### 2️⃣ Botão do StickyFormModal (Botão Flutuante Laranja)
**Localização**: Fixed bottom-right, aparece após scroll >400px  
**Cor**: Laranja (#F49A1A)  
**Comportamento**:
- Botão flutuante com ícone de documento
- Texto: "Orçamento Grátis"
- Ao clicar: Abre modal diretamente

**Componente**: `StickyFormModal.vue`  
**Trigger**: Scroll > 400px  
**Z-index**: 40

---

## 🎯 Ambos Abrem o MESMO Modal

Ambos os botões controlam o mesmo modal através do `v-model`:

```vue
<!-- Página -->
<script setup>
const showFormModal = ref(false)

const openFormModal = () => {
  showFormModal.value = true
}
</script>

<template>
  <!-- Botão 1: MobileUnifiedCTA -->
  <MobileUnifiedCTA @open-form="openFormModal" />
  
  <!-- Botão 2: StickyFormModal (tem botão próprio) -->
  <StickyFormModal v-model="showFormModal" />
</template>
```

---

## 🔄 Fluxo de Funcionamento

### Botão 1: MobileUnifiedCTA → Formulário

```
1. Usuário rola >200px
   ↓
2. MobileUnifiedCTA aparece (verde)
   ↓
3. Usuário clica no botão verde
   ↓
4. CTA expande (3 opções)
   ↓
5. Usuário clica em "Formulário" (laranja)
   ↓
6. MobileUnifiedCTA emite @open-form
   ↓
7. Página chama openFormModal()
   ↓
8. showFormModal = true
   ↓
9. StickyFormModal recebe modelValue=true
   ↓
10. Modal aparece ✅
```

### Botão 2: StickyFormModal (Botão Próprio)

```
1. Usuário rola >400px
   ↓
2. Botão laranja flutuante aparece
   ↓
3. Usuário clica no botão laranja
   ↓
4. StickyFormModal.openModal() chamado
   ↓
5. Emite update:modelValue = true
   ↓
6. showFormModal = true (via v-model)
   ↓
7. Modal aparece ✅
```

---

## 🐛 Debug: Como Testar Cada Botão

### Testar Botão 1 (MobileUnifiedCTA)

1. Abrir página de serviços
2. Rolar >200px
3. Verificar console:
   ```
   🔵 MobileUnifiedCTA: Apareceu (scroll > 200px)
   ```
4. Clicar no botão verde
5. Verificar console:
   ```
   🔵 MobileUnifiedCTA: toggleExpand() chamado
   🔵 isExpanded agora é: true
   ```
6. Clicar em "Formulário" (laranja)
7. Verificar console:
   ```
   🔵 MobileUnifiedCTA: openForm() chamado
   🔵 Emitindo evento: open-form
   🟢 [PAGINA] openFormModal() chamado
   🟢 [PAGINA] showFormModal: false → true
   🟡 [MODAL] v-model mudou para: true
   🟡 [MODAL] Abrindo modal...
   ```

### Testar Botão 2 (StickyFormModal)

1. Abrir página de serviços
2. Rolar >400px
3. Verificar console:
   ```
   🟡 [STICKY-MODAL] Scroll detectado: 450px
   🟡 [STICKY-MODAL] Botão sticky visível: true
   ```
4. Verificar se botão laranja apareceu no canto inferior direito
5. Clicar no botão laranja
6. Verificar console:
   ```
   🟡 [STICKY-MODAL] openModal() chamado (botão próprio)
   🟡 [STICKY-MODAL] Emitindo update:modelValue = true
   🟡 [MODAL] v-model mudou para: true
   🟡 [MODAL] Abrindo modal...
   ```

---

## 🎨 Diferenças Visuais

### MobileUnifiedCTA (Botão 1)
```
┌─────────────────────────────────────────┐
│  [WhatsApp] 💬 Orçamento Grátis WhatsApp │ ← Verde
│                                    [↑]   │ ← Seta
└─────────────────────────────────────────┘
```

Expandido:
```
┌─────────────────────────────────────────┐
│  [WhatsApp] WhatsApp                [X] │ ← Verde 100%
├─────────────────────────────────────────┤
│  [📞] Ligar  │  [📝] Formulário         │ ← Azul 48% | Laranja 48%
└─────────────────────────────────────────┘
```

### StickyFormModal (Botão 2)
```
                              ┌──────────────┐
                              │ [📄] Orçamento│ ← Laranja
                              │     Grátis    │
                              └──────────────┘
```

---

## 📊 Comparação

| Característica | MobileUnifiedCTA | StickyFormModal |
|----------------|------------------|-----------------|
| Trigger Scroll | >200px | >400px |
| Posição | Bottom center | Bottom right |
| Cor | Verde | Laranja |
| Largura | Full width | Auto (pequeno) |
| Opções | 3 (WhatsApp, Ligar, Form) | 1 (Form direto) |
| Z-index | 50 | 40 |
| Animação | Slide up | Bounce |

---

## ✅ Checklist de Validação

### MobileUnifiedCTA
- [ ] Aparece após scroll >200px
- [ ] Botão verde visível
- [ ] Clique expande mostrando 3 opções
- [ ] Botão "Formulário" laranja visível
- [ ] Clique em "Formulário" abre modal
- [ ] Logs 🔵 e 🟢 aparecem no console

### StickyFormModal
- [ ] Aparece após scroll >400px
- [ ] Botão laranja flutuante visível no canto direito
- [ ] Clique abre modal diretamente
- [ ] Logs 🟡 aparecem no console
- [ ] Modal abre com formulário

### Modal (Ambos)
- [ ] Modal aparece com fundo escuro (overlay)
- [ ] Formulário visível dentro do modal
- [ ] Pode fechar com X
- [ ] Pode fechar clicando no backdrop
- [ ] Pode fechar arrastando para baixo (swipe)
- [ ] Body overflow fica hidden quando aberto

---

## 🔧 Troubleshooting

### Botão 1 não aparece
- Verificar se scroll >200px
- Verificar se `<MobileUnifiedCTA>` está na página
- Verificar classe `md:hidden` (só mobile)

### Botão 2 não aparece
- Verificar se scroll >400px
- Verificar se `<StickyFormModal>` está na página
- Verificar z-index (deve ser 40)
- Verificar se não está sobreposto pelo MobileUnifiedCTA

### Modal não abre
- Verificar logs no console
- Verificar se `v-model="showFormModal"` está correto
- Verificar se `showFormModal` é um `ref(false)`
- Verificar se `@open-form="openFormModal"` está no MobileUnifiedCTA

---

## 💡 Recomendação

Considere manter apenas 1 botão para evitar confusão:

**Opção A**: Manter apenas MobileUnifiedCTA (mais completo)
- Remove `StickyFormModal` botão próprio
- Mantém apenas o modal

**Opção B**: Manter ambos com triggers diferentes
- MobileUnifiedCTA: 200-400px (multi-opções)
- StickyFormModal: >400px (formulário direto)

**Opção C**: Unificar em um único componente
- Criar novo componente que combina ambos

---

**Status**: ✅ Ambos os botões funcionando  
**Logs**: ✅ Adicionados para debug  
**Próximo passo**: Testar ambos os botões no navegador
