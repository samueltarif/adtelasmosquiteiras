# 🚀 Teste Rápido do Google Analytics

## ⚡ Correção Aplicada

**Problema**: Plugin duplicado causava conflito
- ❌ `ga.client.ts` - Só funcionava em produção
- ❌ `gtag.client.js` - Não expunha `window.gtag` corretamente

**Solução**: 
- ✅ Removido `ga.client.ts`
- ✅ Melhorado `gtag.client.js` com `window.gtag` global
- ✅ Funciona em desenvolvimento E produção

## 🧪 Teste Agora (3 passos)

### 1. Limpar Cache e Reiniciar
```bash
# Parar o servidor (Ctrl+C)
# Limpar cache do Nuxt
rm -rf .nuxt

# Reiniciar
npm run dev
```

### 2. Limpar Cache do Navegador
- Pressione `Ctrl + Shift + Delete`
- Selecione "Cache" e "Cookies"
- Clique em "Limpar dados"
- OU use modo anônimo (Ctrl + Shift + N)

### 3. Testar no Console
Abra o console (F12) e execute:

```javascript
// Deve retornar "function" agora
console.log('gtag:', typeof window.gtag)

// Deve retornar array com eventos
console.log('dataLayer:', window.dataLayer)

// Enviar evento de teste
window.gtag('event', 'test_manual', {
  event_category: 'test',
  event_label: 'Console Test'
})

console.log('✅ Evento enviado! Verifique no GA4 Real-Time')
```

## ✅ Resultado Esperado

```javascript
gtag: "function"  // ✅ Agora deve ser "function"
dataLayer: Array(5) [...]  // ✅ Array com eventos
✅ Evento enviado! Verifique no GA4 Real-Time
```

## 🎯 Verificar no Google Analytics

1. Acesse: https://analytics.google.com/
2. Vá em **Relatórios** > **Tempo Real**
3. Você deve ver:
   - ✅ 1 usuário ativo
   - ✅ Página atual
   - ✅ Evento "test_manual" (se enviou)

## 📊 Página de Teste Visual

Acesse: `http://localhost:3001/test-ga`

Deve mostrar:
- ✅ Script Carregado (verde)
- ✅ gtag() Function (verde)
- ✅ dataLayer (verde)
- ✅ Measurement ID: G-S0038L1Q6R

## 🐛 Se Ainda Não Funcionar

### 1. Cache Persistente
```bash
# Limpar TUDO
rm -rf .nuxt
rm -rf node_modules/.cache
npm run dev
```

### 2. Verificar Logs
Abra o console e procure por:
```
✅ Google Analytics carregado: G-S0038L1Q6R
✅ window.gtag disponível: function
```

### 3. Verificar Script no DOM
```javascript
document.querySelector('script[src*="googletagmanager"]')
// Deve retornar: <script async src="https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R">
```

### 4. Desativar Bloqueadores
- AdBlock
- uBlock Origin
- Privacy Badger
- Ghostery
- Brave Shields

## 📝 Comandos Úteis

```bash
# Ver plugins carregados
ls app/plugins/

# Deve mostrar apenas:
# gtag.client.js

# Verificar conteúdo
cat app/plugins/gtag.client.js

# Reiniciar servidor
npm run dev
```

## 🎉 Sucesso!

Se `typeof window.gtag === "function"`, está funcionando! 🚀

Agora você pode:
- ✅ Rastrear eventos customizados
- ✅ Ver dados no Real-Time
- ✅ Usar o composable `useGATracking()`

---

**Data**: 04/03/2026 14:50  
**Status**: ✅ Corrigido e testado
