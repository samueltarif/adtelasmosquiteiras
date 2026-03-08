# BUGFIX - Vercel Analytics Removido

## 🐛 Problema Identificado

Erro no console:
```
GET http://localhost:3000/_vercel/insights/script.js net::ERR_ABORTED 404
Refused to execute script from '/_vercel/insights/script.js' because its MIME type ('application/json') is not executable
```

## ✅ Solução Aplicada

### 1. Removido `@vercel/analytics` do package.json
```json
// ANTES
"dependencies": {
  "@vercel/analytics": "^1.6.1",  // ❌ Removido
  ...
}

// DEPOIS
"dependencies": {
  // ✅ Sem Vercel Analytics
  ...
}
```

### 2. CSP Atualizado (nuxt.config.ts)
Removidos domínios do Vercel Analytics:
- ❌ `https://user-gen-media-assets.s3.amazonaws.com`
- ❌ `https://va.vercel-scripts.com`
- ❌ `https://vitals.vercel-insights.com`

Mantidos apenas:
- ✅ Google Analytics
- ✅ WhatsApp API

### 3. Dependências Reinstaladas
```bash
npm install
```

## 📊 Analytics Atual

Agora o projeto usa APENAS:
- ✅ **Google Analytics 4 (GA4)** - Measurement ID: `G-S0038L1Q6R`
- ✅ Configurado via plugin `app/plugins/ga.client.ts`
- ✅ Ativo apenas em produção

## 🧪 Testar Novamente

```bash
# Limpar cache
rm -rf .nuxt node_modules/.cache

# Rebuild
npm run build

# Preview
npm run preview
```

Agora NÃO deve aparecer erro do Vercel Analytics! ✅

## 📝 Notas

- Vercel Analytics estava instalado mas não configurado corretamente
- GA4 é suficiente para tracking
- Se precisar do Vercel Analytics no futuro, instalar via módulo Nuxt oficial

---

**Status:** ✅ Corrigido  
**Data:** 03/03/2026
