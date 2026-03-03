# GA4 - Validação Rápida ⚡

## 🎯 Teste em 3 Passos

### 1️⃣ Build de Produção
```bash
cd nuxt-app
npm run build
```
✅ Deve compilar sem erros

### 2️⃣ Preview Local
```bash
npm run preview
```
✅ Servidor inicia (geralmente porta 3000)

### 3️⃣ Verificar no Navegador

Abra: http://localhost:3000

**Console (F12):**
```
[GA4] Inicializado: G-S0038L1Q6R
```

**Network (F12 → Network → Filtrar "gtag"):**
```
✅ gtag/js?id=G-S0038L1Q6R (Status: 200)
✅ Requisições para google-analytics.com
```

**Elements (F12 → Elements → <head>):**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R"></script>
```

---

## 🔍 Verificar no GA4 (Tempo Real)

1. Acesse: https://analytics.google.com/
2. Selecione: Propriedade `G-S0038L1Q6R`
3. Vá em: **Relatórios** → **Tempo real**
4. Navegue pelo site local
5. ✅ Deve aparecer 1 usuário ativo

---

## ✅ Checklist de Validação

- [ ] Build sem erros
- [ ] Preview funciona
- [ ] Console mostra `[GA4] Inicializado`
- [ ] Network mostra requisição gtag.js
- [ ] Script aparece no `<head>`
- [ ] GA4 Tempo Real mostra usuário

---

## 🚀 Deploy

Após validação local, faça o deploy:

```bash
git add .
git commit -m "feat: adiciona Google Analytics 4 (GA4)"
git push origin master
```

O GA4 será ativado automaticamente em produção! 🎉

---

## 📞 Suporte

Problemas? Veja `GA4-INSTALLATION-GUIDE.md` seção **Troubleshooting**.
