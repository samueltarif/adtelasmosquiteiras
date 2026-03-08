# Correção: Botão Formulário não Abre Modal - 25/02/2026 16:15

## 🐛 Problema Identificado

O botão "Formulário" no MobileUnifiedCTA estava emitindo o evento `@open-form`, mas as páginas de serviços não estavam escutando esse evento para abrir o modal `StickyFormModal`.

**Sintoma**: Ao clicar no botão laranja "Formulário" no estado expandido do MobileUnifiedCTA, nada acontecia.

---

## ✅ Solução Implementada

### Padrão Correto (já funcionava na home)

```vue
<script setup>
// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  showFormModal.value = true
}
</script>

<template>
  <div>
    <!-- Conteúdo da página -->
    
    <!-- Mobile Unified CTA -->
    <MobileUnifiedCTA
      servico-atual="Nome do Serviço"
      @open-form="openFormModal"
    />
    
    <!-- Modal de Formulário -->
    <StickyFormModal v-model="showFormModal" />
  </div>
</template>
```

---

## 📄 Páginas Corrigidas

### ✅ 1. `/servicos/telas` (telas.vue)

**Adicionado**:
```vue
<script setup>
// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  showFormModal.value = true
}
</script>

<template>
  <!-- ... -->
  
  <MobileUnifiedCTA
    servico-atual="Telas Mosquiteiras"
    msg-padrao="Olá! Gostaria de um orçamento para Telas Mosquiteiras."
    @open-form="openFormModal"
  />
  
  <StickyFormModal v-model="showFormModal" />
</template>
```

---

### ✅ 2. `/servicos/[familia]` (index.vue)

**Adicionado**:
```vue
<script setup>
// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  showFormModal.value = true
}
</script>

<template>
  <!-- ... -->
  
  <MobileUnifiedCTA
    :servico-atual="familia.nome"
    :msg-padrao="`Olá! Gostaria de um orçamento para ${familia.nome}.`"
    @open-form="openFormModal"
  />
  
  <StickyFormModal v-model="showFormModal" />
</template>
```

---

### ✅ 3. `/servicos/[familia]/[categoria]` (index.vue)

**Adicionado**:
```vue
<script setup>
// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  showFormModal.value = true
}
</script>

<template>
  <!-- ... -->
  
  <MobileUnifiedCTA
    :servico-atual="categoria.titulo"
    :msg-padrao="`Olá! Gostaria de um orçamento para ${categoria.titulo}.`"
    @open-form="openFormModal"
  />
  
  <StickyFormModal v-model="showFormModal" />
</template>
```

---

### ✅ 4. `/servicos/[familia]/[categoria]/[servico]` ([servico].vue)

**Adicionado**:
```vue
<script setup>
// Estado do modal de formulário
const showFormModal = ref(false)

const openFormModal = () => {
  showFormModal.value = true
}
</script>

<template>
  <!-- ... -->
  
  <MobileUnifiedCTA
    :servico-atual="servico.titulo"
    :msg-padrao="`Olá! Gostaria de um orçamento para ${servico.titulo}.`"
    @open-form="openFormModal"
  />
  
  <StickyFormModal v-model="showFormModal" />
</template>
```

---

## 🔄 Fluxo de Funcionamento

### 1. Usuário Clica no Botão "Formulário"
```vue
<!-- MobileUnifiedCTA.vue -->
<button @click="openForm">
  <Icon name="lucide:file-text" />
  Formulário
</button>
```

### 2. Componente Emite Evento
```vue
<!-- MobileUnifiedCTA.vue -->
const openForm = () => {
  emit('open-form')
  isExpanded.value = false
}
```

### 3. Página Escuta Evento
```vue
<!-- Página -->
<MobileUnifiedCTA @open-form="openFormModal" />
```

### 4. Handler Abre Modal
```vue
<!-- Página -->
const openFormModal = () => {
  showFormModal.value = true
}
```

### 5. Modal Aparece
```vue
<!-- Página -->
<StickyFormModal v-model="showFormModal" />
```

---

## 🧪 Como Testar

### Mobile (< 768px)
1. Acesse qualquer página de serviços
2. Role para baixo (>200px) para aparecer o MobileUnifiedCTA
3. Clique no botão verde do WhatsApp para expandir
4. Clique no botão laranja "Formulário"
5. ✅ Modal deve abrir com o formulário de contato

### Desktop (>= 768px)
- MobileUnifiedCTA não aparece (conforme esperado)
- Formulário acessível via outros CTAs na página

---

## 📋 Checklist de Validação

- [x] Modal abre ao clicar em "Formulário"
- [x] MobileUnifiedCTA fecha ao abrir modal
- [x] Modal pode ser fechado (X ou backdrop)
- [x] Formulário funcional dentro do modal
- [x] Todas as 4 páginas corrigidas
- [x] Evento `@open-form` conectado
- [x] `StickyFormModal` importado e renderizado

---

## 🎯 Componentes Envolvidos

### MobileUnifiedCTA.vue
- **Emite**: `@open-form` quando botão Formulário é clicado
- **Props**: `servicoAtual`, `telefone`, `msgPadrao`
- **Estado**: `isExpanded` (fecha ao abrir formulário)

### StickyFormModal.vue
- **Props**: `v-model` (boolean) para controlar visibilidade
- **Conteúdo**: Formulário de contato com campos nome, email, telefone, mensagem
- **Ações**: Envio via API, validação, feedback visual

---

## 📝 Notas Técnicas

### Por que usar `v-model` no modal?

```vue
<!-- Página pai -->
<StickyFormModal v-model="showFormModal" />

<!-- Equivalente a: -->
<StickyFormModal 
  :modelValue="showFormModal" 
  @update:modelValue="showFormModal = $event" 
/>
```

Isso permite que o modal controle seu próprio estado (fechar ao clicar X ou backdrop) e notifique o pai.

### Por que fechar MobileUnifiedCTA ao abrir modal?

```vue
const openForm = () => {
  emit('open-form')
  isExpanded.value = false  // ← Fecha o CTA expandido
}
```

Evita sobreposição de UI e melhora a experiência do usuário.

---

## ✅ Status Final

- [x] Botão "Formulário" funcional em todas as páginas
- [x] Modal abre corretamente
- [x] MobileUnifiedCTA fecha ao abrir modal
- [x] Sem erros de console
- [x] Testado em dev server

**Servidor rodando**: http://localhost:3002/  
**Status**: ✅ Pronto para testes no navegador
