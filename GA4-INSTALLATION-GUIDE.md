# Guia de Instalação - Google Analytics 4 (GA4)

## 📊 Informações do GA4

- **Measurement ID:** `G-S0038L1Q6R`
- **Domínio:** https://www.adtelasmosquiteiras.com.br/
- **Método:** gtag.js (instalação manual)
- **Framework:** Nuxt 3 (SSR/SPA)

---

## ✅ Instalação Concluída

### Arquivos Criados/Modificados:

1. **`app/plugins/ga.client.ts`** (NOVO)
   - Plugin cliente que injeta o GA4
   - Executa apenas no navegador
   - Ativo apenas em produção

2. **`nuxt.config.ts`** (MODIFICADO)
   - CSP atualizado para permitir Google Analytics
   - Domínios adicionados:
     - `https://www.googletagmanager.com`
     - `https://www.google-analytics.com`
     - `https://analytics.google.com`

---

## 🚀 Como Funciona

### Plugin GA4 (`app/plugins/ga.client.ts`)

O plugin:
1. ✅ Verifica se está no cliente (navegador)
2. ✅ Verifica se está em produção
3. ✅ Injeta o script `gtag.js` dinamicamente
4. ✅ Inicializa o dataLayer
5. ✅ Configura o GA4 com o Measurement ID
6. ✅ Disponibiliza `gtag()` globalmente

### Comportamento por Ambiente:

#### Desenvolvimento (`npm run dev`)
```
[GA4] Desabilitado em desenvolvimento
```
- ❌ GA4 não carrega
- ❌ Não envia dados
- ✅ Console mostra mensagem informativa

#### Produção (`npm run build` + deploy)
```
[GA4] Inicializado: G-S0038L1Q6R
```
- ✅ GA4 carrega automaticamente
- ✅ Envia pageviews
- ✅ Rastreia eventos

---

## 🧪 Como Testar

### 1. Testar em Desenvolvimento (Verificar que NÃO carrega)

```bash
npm run dev
```

1. Abra http://localhost:3001
2. Abra DevTools (F12) → Console
3. Deve aparecer: `[GA4] Desabilitado em desenvolvimento`
4. Inspecione `<head>` → NÃO deve ter script do gtag.js

### 2. Testar em Produção Local

```bash
# Build de produção
npm run build

# Preview do build
npm run preview
```

1. Abra http://localhost:3000 (ou porta do preview)
2. Abra DevTools (F12) → Console
3. Deve aparecer: `[GA4] Inicializado: G-S0038L1Q6R`
4. Inspecione `<head>` → Deve ter:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R"></script>
   ```

### 3. Verificar no Network

1. DevTools → Aba Network
2. Filtrar por "gtag" ou "google-analytics"
3. Deve aparecer:
   - `gtag/js?id=G-S0038L1Q6R` (Status 200)
   - Requisições para `www.google-analytics.com`

### 4. Verificar no GA4 (Tempo Real)

1. Acesse [Google Analytics](https://analytics.google.com/)
2. Selecione a propriedade `G-S0038L1Q6R`
3. Vá em **Relatórios** → **Tempo real**
4. Navegue pelo site em produção
5. Deve aparecer:
   - Usuários ativos
   - Páginas visualizadas
   - Eventos

---

## 📝 Comandos Úteis

### Desenvolvimento (GA4 desabilitado)
```bash
npm run dev
```

### Build de Produção
```bash
npm run build
```

### Preview do Build
```bash
npm run preview
```

### Deploy (Vercel/Netlify)
```bash
# O GA4 será ativado automaticamente em produção
git push origin master
```

---

## 🎯 Eventos Rastreados Automaticamente

O GA4 rastreia automaticamente:

- ✅ **page_view** - Visualizações de página
- ✅ **session_start** - Início de sessão
- ✅ **first_visit** - Primeira visita
- ✅ **scroll** - Rolagem de página (90%)
- ✅ **click** - Cliques em links externos
- ✅ **file_download** - Downloads de arquivos

---

## 🔧 Eventos Personalizados (Opcional)

Se quiser rastrear eventos personalizados, use o `gtag()` disponibilizado:

### Em Componentes Vue:

```vue
<script setup>
const { $gtag } = useNuxtApp()

const trackButtonClick = () => {
  if ($gtag) {
    $gtag('event', 'button_click', {
      button_name: 'whatsapp_cta',
      page_location: window.location.href
    })
  }
}
</script>

<template>
  <button @click="trackButtonClick">
    Falar no WhatsApp
  </button>
</template>
```

### Exemplos de Eventos Úteis:

```typescript
// Clique em botão WhatsApp
$gtag('event', 'whatsapp_click', {
  button_location: 'hero_section'
})

// Envio de formulário
$gtag('event', 'form_submit', {
  form_name: 'lead_form',
  form_step: 'step_2'
})

// Clique em serviço
$gtag('event', 'service_click', {
  service_name: 'Redes para Janelas',
  service_category: 'Residencial'
})

// Visualização de telefone
$gtag('event', 'phone_reveal', {
  phone_location: 'header'
})
```

---

## 🔍 Verificação de Instalação

### Checklist:

- [x] Plugin criado em `app/plugins/ga.client.ts`
- [x] CSP atualizado em `nuxt.config.ts`
- [x] Measurement ID correto: `G-S0038L1Q6R`
- [x] Apenas cliente (`.client.ts`)
- [x] Apenas produção (`NODE_ENV === 'production'`)
- [x] Script gtag.js injetado dinamicamente
- [x] dataLayer inicializado
- [x] gtag() disponível globalmente

### Validação Rápida:

```bash
# 1. Build
npm run build

# 2. Preview
npm run preview

# 3. Abrir navegador
# http://localhost:3000

# 4. Console deve mostrar:
# [GA4] Inicializado: G-S0038L1Q6R

# 5. Network deve mostrar:
# gtag/js?id=G-S0038L1Q6R (200 OK)
```

---

## 🐛 Troubleshooting

### GA4 não carrega em produção

**Problema:** Script não aparece no `<head>`

**Solução:**
1. Verificar se `NODE_ENV=production` está definido
2. Verificar console do navegador
3. Verificar se CSP não está bloqueando

### Erro de CSP

**Problema:** `Refused to load script from 'https://www.googletagmanager.com'`

**Solução:**
- Verificar se o CSP em `nuxt.config.ts` inclui:
  - `script-src ... https://www.googletagmanager.com`
  - `connect-src ... https://www.google-analytics.com`

### Dados não aparecem no GA4

**Problema:** Tempo Real não mostra usuários

**Solução:**
1. Aguardar 1-2 minutos (delay normal)
2. Verificar se está em produção
3. Verificar Network → deve ter requisições para `google-analytics.com`
4. Verificar se o Measurement ID está correto

### Plugin não executa

**Problema:** Console não mostra mensagem do GA4

**Solução:**
1. Verificar se o arquivo está em `app/plugins/ga.client.ts`
2. Verificar se tem extensão `.client.ts` (não `.ts`)
3. Rebuild: `npm run build`

---

## 📊 Relatórios Úteis no GA4

### Tempo Real
- **Caminho:** Relatórios → Tempo real
- **Uso:** Verificar se o GA4 está funcionando agora

### Aquisição
- **Caminho:** Relatórios → Aquisição → Visão geral
- **Uso:** Ver de onde vêm os visitantes

### Engajamento
- **Caminho:** Relatórios → Engajamento → Páginas e telas
- **Uso:** Ver páginas mais visitadas

### Conversões
- **Caminho:** Relatórios → Conversões
- **Uso:** Rastrear objetivos (configurar manualmente)

---

## 🎓 Recursos Adicionais

- [Documentação GA4](https://support.google.com/analytics/answer/9304153)
- [gtag.js Reference](https://developers.google.com/analytics/devguides/collection/gtagjs)
- [Eventos GA4](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Nuxt Plugins](https://nuxt.com/docs/guide/directory-structure/plugins)

---

## ✅ Status da Instalação

**Data:** 03/03/2026  
**Versão:** 1.0  
**Status:** ✅ Instalado e Funcional  
**Measurement ID:** G-S0038L1Q6R  
**Ambiente:** Produção apenas  

---

**Instalação concluída com sucesso!** 🎉

O Google Analytics 4 está configurado e pronto para rastrear visitantes em produção.
