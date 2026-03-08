# ✅ Google Analytics 4 - Checklist de Verificação

## 📋 Status da Instalação

### ✅ Configuração Completa

**Measurement ID**: `G-S0038L1Q6R`  
**Data de Configuração**: 04/03/2026

## 🔍 Como Verificar se Está Funcionando

### Método 1: Página de Teste (RECOMENDADO)
1. Acesse: `http://localhost:3001/test-ga` (desenvolvimento)
2. Ou: `https://seu-site.com/test-ga` (produção)
3. Verifique os 4 indicadores:
   - ✅ Script Carregado
   - ✅ gtag() Function
   - ✅ dataLayer
   - ✅ Measurement ID
4. Clique em "Enviar Evento de Teste"
5. Verifique no GA4 Real-Time

### Método 2: Console do Navegador
1. Abra qualquer página do site
2. Pressione F12 (DevTools)
3. Vá na aba **Console**
4. Digite e execute:

```javascript
// Verificar se gtag está carregado
console.log('gtag:', typeof window.gtag)
// Deve retornar: "function"

// Verificar dataLayer
console.log('dataLayer:', window.dataLayer)
// Deve retornar: Array com eventos

// Verificar script no DOM
console.log('Script GA:', document.querySelector('script[src*="googletagmanager"]'))
// Deve retornar: <script> element
```

### Método 3: Network Tab
1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Filtre por "google" ou "collect"
4. Recarregue a página
5. Você deve ver requisições para:
   - `googletagmanager.com/gtag/js`
   - `google-analytics.com/g/collect`

### Método 4: Google Analytics Real-Time
1. Acesse [Google Analytics](https://analytics.google.com/)
2. Selecione a propriedade com ID `G-S0038L1Q6R`
3. Vá em **Relatórios** > **Tempo Real**
4. Abra seu site em outra aba
5. Você deve ver **1 usuário ativo**
6. Navegue entre páginas e veja os page views

### Método 5: Google Tag Assistant (Extensão)
1. Instale [Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Abra seu site
3. Clique no ícone da extensão
4. Deve mostrar: "Google Analytics: GA4" com ícone verde

## 📁 Arquivos de Configuração

### 1. Plugin Global ✅
**Arquivo**: `app/plugins/gtag.client.js`
```javascript
const GA_MEASUREMENT_ID = 'G-S0038L1Q6R'
```
- Carrega em todas as páginas Vue/Nuxt
- Rastreia mudanças de rota (SPA)
- Torna `window.gtag` disponível globalmente

### 2. App.vue ✅
**Arquivo**: `app/app.vue`
```vue
useHead({
  script: [
    {
      src: 'https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R',
      async: true
    }
  ]
})
```
- Fallback para garantir carregamento
- Adiciona script no `<head>` de todas as páginas

### 3. Páginas HTML Estáticas ✅
**Arquivos**:
- `public/politica-de-privacidade.html`
- `public/termos-de-uso.html`

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-S0038L1Q6R');
</script>
```

## 🎯 Páginas Rastreadas

### Rotas Vue/Nuxt (via plugin)
- ✅ `/` - Home
- ✅ `/orcamento` - Orçamento
- ✅ `/contato` - Contato
- ✅ `/servicos` - Serviços
- ✅ `/servicos/redes` - Redes
- ✅ `/servicos/telas` - Telas
- ✅ `/servicos/[familia]/[categoria]/[servico]` - Páginas individuais
- ✅ `/test-ga` - Página de teste

### Páginas HTML Estáticas (via tag direta)
- ✅ `/politica-de-privacidade`
- ✅ `/termos-de-uso`

## 🐛 Troubleshooting

### ❌ Script não carrega
**Problema**: Script do GA não aparece no Network tab

**Soluções**:
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Desative bloqueadores de anúncios (AdBlock, uBlock, etc.)
3. Desative extensões de privacidade (Privacy Badger, Ghostery)
4. Teste em modo anônimo/privado
5. Verifique se o arquivo `app/plugins/gtag.client.js` existe
6. Reinicie o servidor Nuxt (`npm run dev`)

### ❌ gtag is not a function
**Problema**: `window.gtag` não está disponível

**Soluções**:
1. Aguarde 2-3 segundos após carregar a página
2. Verifique se o script está no `<head>`:
   ```javascript
   document.querySelector('script[src*="googletagmanager"]')
   ```
3. Verifique o console por erros de CSP (Content Security Policy)
4. Verifique se o plugin tem extensão `.client.js`

### ❌ Eventos não aparecem no GA4
**Problema**: Eventos enviados mas não aparecem no Real-Time

**Soluções**:
1. Aguarde 30-60 segundos (pode haver delay)
2. Verifique se o Measurement ID está correto: `G-S0038L1Q6R`
3. Verifique se a propriedade GA4 está ativa
4. Use DebugView no GA4 para ver eventos em tempo real
5. Verifique se o evento foi enviado:
   ```javascript
   console.log(window.dataLayer)
   ```

### ❌ Dados não aparecem em relatórios
**Problema**: Real-Time funciona mas relatórios estão vazios

**Soluções**:
1. Aguarde até 24-48 horas para dados aparecerem
2. Verifique se o filtro de data está correto
3. Verifique se há filtros ativos nos relatórios
4. Use "Tempo Real" para verificação imediata

## 📊 Eventos Configurados

### Eventos Automáticos
- ✅ `page_view` - Visualização de página
- ✅ `session_start` - Início de sessão
- ✅ `first_visit` - Primeira visita

### Eventos Customizados
- ✅ `form_submit` - Envio de formulário
- ✅ `contact_click` - Clique em contato
- ✅ `test_event` - Evento de teste (página /test-ga)

## 🔐 Segurança

### Content Security Policy (CSP)
O `nuxt.config.ts` está configurado para permitir GA4:

```javascript
'Content-Security-Policy': 
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; 
   connect-src 'self' https://www.google-analytics.com https://analytics.google.com;"
```

### Variáveis de Ambiente
- ✅ `.env` - Credenciais seguras (não versionado)
- ✅ `.gitignore` - Protege `.env`
- ✅ `runtimeConfig` - Expõe apenas o necessário

## 📈 Próximos Passos

1. ✅ Verificar instalação (use `/test-ga`)
2. ✅ Configurar conversões no GA4
3. ✅ Criar funis de conversão
4. ✅ Integrar com Google Ads
5. ✅ Configurar relatórios customizados
6. ✅ Configurar alertas de conversão

## 🆘 Suporte

### Links Úteis
- [Google Analytics](https://analytics.google.com/)
- [Tag Assistant](https://tagassistant.google.com/)
- [Documentação GA4](https://support.google.com/analytics/answer/9304153)
- [DebugView](https://support.google.com/analytics/answer/7201382)

### Comandos Úteis

```bash
# Verificar se o plugin existe
ls app/plugins/gtag.client.js

# Verificar variáveis de ambiente
cat .env

# Reiniciar servidor
npm run dev

# Build de produção
npm run build
```

---

**Última atualização**: 04/03/2026 14:45  
**Status**: ✅ Totalmente configurado e testado  
**Página de Teste**: `/test-ga`
