# Google Analytics 4 - Configuração Completa

## ✅ STATUS: CONFIGURADO

**ID do Google Analytics**: `G-S0038L1Q6R`

## Arquivos Configurados

### 1. Plugin Global (Rotas Vue/Nuxt) ✅
**Arquivo**: `app/plugins/gtag.client.js`

```javascript
const GA_MEASUREMENT_ID = 'G-S0038L1Q6R'
```

Este plugin rastreia automaticamente:
- Todas as rotas Vue/Nuxt (/, /servicos, /orcamento, etc.)
- Mudanças de página (SPA navigation)
- Page views

### 2. Política de Privacidade ✅
**Arquivo**: `public/politica-de-privacidade.html`

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-S0038L1Q6R');
</script>
```

### 3. Termos de Uso ✅
**Arquivo**: `public/termos-de-uso.html`

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-S0038L1Q6R');
</script>
```

## Páginas Rastreadas

### Rotas Vue/Nuxt (via plugin)
- ✅ `/` - Home
- ✅ `/orcamento` - Página de orçamento
- ✅ `/contato` - Página de contato
- ✅ `/servicos` - Listagem de serviços
- ✅ `/servicos/redes` - Redes de proteção
- ✅ `/servicos/telas` - Telas mosquiteiras
- ✅ `/servicos/[familia]/[categoria]/[servico]` - Páginas individuais

### Páginas HTML Estáticas (via tag direta)
- ✅ `/politica-de-privacidade` - Política de privacidade
- ✅ `/termos-de-uso` - Termos de uso

## Eventos Customizados Configurados

### Página de Orçamento
```javascript
// Envio de formulário
window.dataLayer.push({
  event: 'form_submit',
  form_name: 'orcamento',
  servico: 'Nome do Serviço'
})

// Clique em contato
window.dataLayer.push({
  event: 'contact_click',
  method: 'whatsapp' | 'phone',
  origem: 'card' | 'footer'
})
```

## Como Verificar se Está Funcionando

### Método 1: Google Analytics Real-Time
1. Acesse [Google Analytics](https://analytics.google.com/)
2. Vá em **Relatórios** > **Tempo real**
3. Abra seu site em outra aba
4. Você deve ver 1 usuário ativo

### Método 2: Console do Navegador
1. Abra o site
2. Pressione F12 (DevTools)
3. Vá na aba **Console**
4. Digite: `window.dataLayer`
5. Você deve ver um array com eventos

### Método 3: Google Tag Assistant
1. Instale a extensão [Tag Assistant](https://tagassistant.google.com/)
2. Abra seu site
3. Clique no ícone da extensão
4. Deve mostrar "Google Analytics: GA4" detectado

## Troubleshooting

### Tag não aparece no Google Analytics
- ✅ Verifique se o ID `G-S0038L1Q6R` está correto
- ✅ Aguarde até 24h para dados aparecerem nos relatórios
- ✅ Use "Tempo Real" para verificação imediata
- ✅ Desative bloqueadores de anúncios/rastreamento

### Eventos customizados não aparecem
- ✅ Verifique `window.dataLayer` no console
- ✅ Eventos podem levar até 24h para aparecer em relatórios
- ✅ Use "DebugView" no GA4 para debug em tempo real

### Páginas não rastreadas
- ✅ Verifique se o plugin está em `app/plugins/gtag.client.js`
- ✅ Verifique se o arquivo tem extensão `.client.js`
- ✅ Limpe o cache do navegador e do Nuxt

## CSP (Content Security Policy)

O `nuxt.config.ts` já está configurado para permitir Google Analytics:

```javascript
script: [
  "'self'",
  "'unsafe-inline'",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com"
],
connect: [
  "'self'",
  "https://www.google-analytics.com",
  "https://analytics.google.com"
]
```

## Próximos Passos

1. ✅ Configurar conversões no GA4
2. ✅ Criar funis de conversão
3. ✅ Configurar eventos de e-commerce (se aplicável)
4. ✅ Integrar com Google Ads
5. ✅ Configurar relatórios customizados

## Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Use o Google Tag Assistant
3. Consulte a [documentação oficial do GA4](https://support.google.com/analytics/answer/9304153)

---

**Última atualização**: 03/03/2026 14:30
**Status**: ✅ Totalmente configurado e funcionando
