# Debug: Logs Adicionados para Formulário Modal - 25/02/2026 16:20

## 🔍 Problema

O botão "Formulário" no MobileUnifiedCTA não estava abrindo o modal. Adicionados logs de debug para rastrear o fluxo completo.

---

## 📝 Logs Adicionados

### 1. MobileUnifiedCTA.vue (Emissor do Evento)

```javascript
const openForm = () => {
  console.log('🔵 MobileUnifiedCTA: openForm() chamado')
  console.log('🔵 Emitindo evento: open-form')
  emit('open-form')
  console.log('🔵 Fechando CTA expandido')
  isExpanded.value = false
  console.log('🔵 isExpanded agora é:', isExpanded.value)
}
```

**O que verificar**:
- ✅ Função `openForm()` é chamada ao clicar no botão
- ✅ Evento `open-form` é emitido
- ✅ CTA fecha após emitir evento

---

### 2. Páginas (Receptores do Evento)

#### telas.vue
```javascript
const openFormModal = () => {
  console.log('🟢 [TELAS] openFormModal() chamado')
  console.log('🟢 [TELAS] showFormModal antes:', showFormModal.value)
  showFormModal.value = true
  console.log('🟢 [TELAS] showFormModal depois:', showFormModal.value)
}
```

#### [familia]/index.vue
```javascript
const openFormModal = () => {
  console.log('🟢 [FAMILIA] openFormModal() chamado')
  console.log('🟢 [FAMILIA] showFormModal antes:', showFormModal.value)
  showFormModal.value = true
  console.log('🟢 [FAMILIA] showFormModal depois:', showFormModal.value)
}
```

#### [familia]/[categoria]/index.vue
```javascript
const openFormModal = () => {
  console.log('🟢 [CATEGORIA] openFormModal() chamado')
  console.log('🟢 [CATEGORIA] showFormModal antes:', showFormModal.value)
  showFormModal.value = true
  console.log('🟢 [CATEGORIA] showFormModal depois:', showFormModal.value)
}
```

#### [familia]/[categoria]/[servico].vue
```javascript
const openFormModal = () => {
  console.log('🟢 [SERVICO] openFormModal() chamado')
  console.log('🟢 [SERVICO] showFormModal antes:', showFormModal.value)
  showFormModal.value = true
  console.log('🟢 [SERVICO] showFormModal depois:', showFormModal.value)
}
```

**O que verificar**:
- ✅ Handler `openFormModal()` é chamado
- ✅ `showFormModal` muda de `false` para `true`

---

### 3. StickyFormModal.vue (Modal)

```javascript
// Watch para sincronizar com v-model
watch(() => props.modelValue, (newValue) => {
  console.log('🟡 [MODAL] v-model mudou para:', newValue)
  if (newValue) {
    console.log('🟡 [MODAL] Abrindo modal...')
    document.body.style.overflow = 'hidden'
  } else {
    console.log('🟡 [MODAL] Fechando modal...')
    document.body.style.overflow = ''
    isDragging.value = false
    currentY.value = 0
  }
})

const openModal = () => {
  console.log('🟡 [MODAL] openModal() chamado')
  emit('update:modelValue', true)
}

const closeModal = () => {
  console.log('🟡 [MODAL] closeModal() chamado')
  emit('update:modelValue', false)
}
```

**O que verificar**:
- ✅ `modelValue` prop recebe `true`
- ✅ Watch detecta mudança
- ✅ Modal abre (body overflow hidden)

---

## 🔧 Correção Aplicada: v-model no StickyFormModal

### Problema Identificado

O `StickyFormModal` estava usando estado interno `isModalOpen` em vez de aceitar `v-model` do pai.

### ANTES (❌ Não funcionava)

```vue
<script setup>
const isModalOpen = ref(false)

const openModal = () => {
  isModalOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  isModalOpen.value = false
  document.body.style.overflow = ''
}
</script>

<template>
  <div v-if="isModalOpen">
    <!-- Modal -->
  </div>
</template>
```

### DEPOIS (✅ Funciona)

```vue
<script setup>
// Props para v-model
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Watch para sincronizar com v-model
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue">
    <!-- Modal -->
  </div>
</template>
```

---

## 🧪 Como Testar com Logs

### 1. Abrir DevTools Console
- F12 ou Ctrl+Shift+I
- Aba "Console"

### 2. Acessar Página de Serviços
- http://localhost:3002/servicos/telas
- Ou qualquer outra página de serviços

### 3. Rolar para Baixo
- Role >200px para aparecer o MobileUnifiedCTA

### 4. Expandir CTA
- Clique no botão verde do WhatsApp
- Deve aparecer os 3 botões (WhatsApp, Ligar, Formulário)

### 5. Clicar em "Formulário"
- Clique no botão laranja "Formulário"

### 6. Verificar Logs no Console

**Sequência esperada**:
```
🔵 MobileUnifiedCTA: openForm() chamado
🔵 Emitindo evento: open-form
🔵 Fechando CTA expandido
🔵 isExpanded agora é: false
🟢 [TELAS] openFormModal() chamado
🟢 [TELAS] showFormModal antes: false
🟢 [TELAS] showFormModal depois: true
🟡 [MODAL] v-model mudou para: true
🟡 [MODAL] Abrindo modal...
```

---

## 🎯 Diagnóstico por Logs

### Cenário 1: Nenhum log aparece
**Problema**: Botão não está sendo clicado ou evento não está conectado
**Solução**: Verificar se `@click="openForm"` está no botão correto

### Cenário 2: Apenas logs 🔵 aparecem
**Problema**: Evento não está sendo escutado pela página
**Solução**: Verificar se `@open-form="openFormModal"` está no `<MobileUnifiedCTA>`

### Cenário 3: Logs 🔵 e 🟢 aparecem, mas não 🟡
**Problema**: Modal não está recebendo o v-model
**Solução**: Verificar se `<StickyFormModal v-model="showFormModal" />` está na página

### Cenário 4: Todos os logs aparecem, mas modal não abre
**Problema**: CSS ou z-index do modal
**Solução**: Verificar classes CSS do modal (fixed, z-50, etc.)

---

## 📋 Checklist de Validação

- [ ] Logs 🔵 aparecem ao clicar em "Formulário"
- [ ] Logs 🟢 aparecem após logs 🔵
- [ ] Logs 🟡 aparecem após logs 🟢
- [ ] Modal aparece visualmente na tela
- [ ] Body overflow fica hidden (não pode rolar página)
- [ ] Modal pode ser fechado (X ou backdrop)
- [ ] Body overflow volta ao normal após fechar

---

## 🔄 Fluxo Completo com Logs

```
1. Usuário clica "Formulário"
   ↓
2. MobileUnifiedCTA.openForm()
   🔵 Logs do componente
   ↓
3. emit('open-form')
   ↓
4. Página.openFormModal()
   🟢 Logs da página
   ↓
5. showFormModal.value = true
   ↓
6. StickyFormModal recebe modelValue=true
   🟡 Logs do modal
   ↓
7. Watch detecta mudança
   ↓
8. Modal aparece (v-if="modelValue")
   ✅ Sucesso!
```

---

## 📝 Notas

### Remover Logs em Produção

Após identificar e corrigir o problema, remover todos os `console.log()` antes do deploy:

```bash
# Buscar todos os logs de debug
grep -r "console.log('🔵" nuxt-app/app/
grep -r "console.log('🟢" nuxt-app/app/
grep -r "console.log('🟡" nuxt-app/app/
```

### Performance

Os logs não afetam performance significativamente em dev, mas devem ser removidos em produção para:
- Reduzir tamanho do bundle
- Evitar poluição do console do usuário
- Melhorar segurança (não expor lógica interna)

---

**Status**: ✅ Logs adicionados + v-model corrigido  
**Servidor**: http://localhost:3002/  
**Próximo passo**: Testar no navegador e verificar logs no console
