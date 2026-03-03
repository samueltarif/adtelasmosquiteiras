# 🎯 CONFIGURAÇÃO GOOGLE ANALYTICS - AD TELAS

## ✅ IMPLEMENTADO

### 1. Plugin Global (app/plugins/gtag.client.js)
- Rastreamento automático de todas as páginas
- Rastreamento de mudanças de rota (SPA)
- Carregamento assíncrono do script

### 2. Páginas HTML Estáticas
- ✅ `/politica-de-privacidade.html` - Tag adicionada
- ✅ `/termos-de-uso.html` - Tag adicionada

### 3. Rotas Dinâmicas Cobertas
- ✅ `/servicos/[familia]/[categoria]/[servico]` - Ex: `/servicos/telas/especiais/removivel`
- ✅ Todas as páginas Vue são rastreadas automaticamente pelo plugin

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### Passo 1: Obter ID do Google Analytics
1. Acesse [Google Analytics](https://analytics.google.com/)
2. Crie uma propriedade GA4 (se ainda não tiver)
3. Copie o ID de medição (formato: `G-XXXXXXXXXX`)

### Passo 2: Substituir o ID nos Arquivos

#### Arquivo 1: `app/plugins/gtag.client.js`
```javascript
// Linha 3 - Substituir:
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'
// Por:
const GA_MEASUREMENT_ID = 'G-SEU-ID-AQUI'
```

#### Arquivo 2: `public/politica-de-privacidade.html`
```html
<!-- Linha 8 - Substituir: -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<!-- Por: -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-SEU-ID-AQUI"></script>

<!-- Linha 13 - Substituir: -->
gtag('config', 'G-XXXXXXXXXX');
<!-- Por: -->
gtag('config', 'G-SEU-ID-AQUI');
```

#### Arquivo 3: `public/termos-de-uso.html`
```html
<!-- Linha 8 - Substituir: -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<!-- Por: -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-SEU-ID-AQUI"></script>

<!-- Linha 13 - Substituir: -->
gtag('config', 'G-XXXXXXXXXX');
<!-- Por: -->
gtag('config', 'G-SEU-ID-AQUI');
```

## 📊 VERIFICAÇÃO

### Testar se está funcionando:

1. **Build e Deploy:**
```bash
npm run build
```

2. **Abrir o site no navegador**

3. **Abrir DevTools (F12) > Console**

4. **Verificar se não há erros do gtag**

5. **Ir para Google Analytics > Relatórios > Tempo Real**
   - Deve aparecer 1 usuário ativo (você)
   - Deve mostrar a página que você está visitando

### Testar Rotas Específicas:
- ✅ Visitar: `/politica-de-privacidade`
- ✅ Visitar: `/termos-de-uso`
- ✅ Visitar: `/servicos/telas/especiais/removivel`
- ✅ Navegar entre páginas (deve rastrear cada mudança)

## 🎯 EVENTOS RASTREADOS

### Automático (Page Views):
- Todas as páginas Vue
- Páginas HTML estáticas
- Mudanças de rota (SPA navigation)

### Manual (já implementado no código):
- Cliques em botões WhatsApp
- Cliques em cards de serviços
- Submissão de formulários
- Cliques em CTAs

## 🔒 SEGURANÇA

O CSP (Content Security Policy) já foi atualizado no `nuxt.config.ts` para permitir:
- `https://www.googletagmanager.com`
- `https://www.google-analytics.com`
- `https://analytics.google.com`

## 📝 NOTAS

- O plugin é `.client.js` para rodar apenas no navegador
- Não afeta o SSR (Server-Side Rendering)
- Carregamento assíncrono não bloqueia a página
- Compatível com Nuxt 4

## ⚠️ IMPORTANTE

Após substituir o ID do Google Analytics, faça:
```bash
npm run build
git add .
git commit -m "Configure Google Analytics ID"
git push
```

## 🆘 TROUBLESHOOTING

### GA não aparece no Tempo Real:
1. Verificar se o ID está correto
2. Limpar cache do navegador
3. Verificar console do navegador por erros
4. Aguardar 5-10 minutos (pode haver delay)

### Páginas não rastreadas:
1. Verificar se o plugin está em `app/plugins/`
2. Verificar se o arquivo termina com `.client.js`
3. Rebuild do projeto

### CSP bloqueando scripts:
1. Verificar `nuxt.config.ts` > `nitro.routeRules`
2. Confirmar que Google Analytics está na whitelist
