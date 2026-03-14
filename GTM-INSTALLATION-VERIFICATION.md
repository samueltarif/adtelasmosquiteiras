git@github.com:samueltarif/adtelasmosquiteiras.git# Google Tag Manager - Verificação de Instalação

## ✅ Instalação Concluída

O Google Tag Manager (GTM-KZTR2DHT) foi instalado com sucesso no projeto.

## 📍 Onde foi instalado

### 1. Script no `<head>` (app/app.vue)
- O script GTM foi adicionado no `useHead()` do app.vue
- Carrega o mais alto possível no head da página
- ID do Container: **GTM-KZTR2DHT**

### 2. Noscript no `<body>` (app/app.vue)
- Tag `<noscript>` adicionada logo após a abertura do template
- Garante rastreamento mesmo com JavaScript desabilitado

### 3. Content Security Policy (nuxt.config.ts)
- Atualizado para permitir scripts do GTM
- Adicionado `frame-src` para permitir iframes do GTM
- Adicionado `connect-src` para comunicação com GTM

## 🧪 Como Verificar se está Funcionando

### Método 1: Inspeção do Código Fonte
1. Acesse http://localhost:3000/
2. Clique com botão direito > "Ver código-fonte da página"
3. Procure por `GTM-KZTR2DHT` no código
4. Você deve ver o script do GTM no início do `<head>`

### Método 2: Console do Navegador
1. Abra o DevTools (F12)
2. No Console, digite: `dataLayer` (com L maiúsculo)
3. Você deve ver um array com eventos do GTM
4. Você também deve ver a mensagem: "✅ Google Tag Manager carregado - GTM-KZTR2DHT"

### Método 3: Google Tag Assistant (Recomendado)
1. Instale a extensão "Tag Assistant Legacy" no Chrome
2. Acesse http://localhost:3000/
3. Clique no ícone da extensão
4. Você deve ver o container GTM-KZTR2DHT ativo

### Método 4: Network Tab
1. Abra DevTools (F12) > Aba Network
2. Recarregue a página
3. Procure por requisições para `googletagmanager.com`
4. Você deve ver requisições para `gtm.js?id=GTM-KZTR2DHT`

## 📊 Próximos Passos

Agora que o GTM está instalado, você pode:

1. **Configurar Tags no GTM**
   - Acesse https://tagmanager.google.com/
   - Configure Google Analytics, Facebook Pixel, etc.

2. **Criar Triggers**
   - Pageview
   - Cliques em botões
   - Envio de formulários
   - Eventos personalizados

3. **Testar no Preview Mode**
   - Use o modo Preview do GTM para testar antes de publicar
   - Verifique se os eventos estão sendo disparados corretamente

## 🔧 Arquivos Modificados

- ✅ `app/app.vue` - Adicionado noscript do GTM
- ✅ `app/plugins/gtm.client.js` - Plugin criado para carregar GTM no cliente
- ✅ `nuxt.config.ts` - Atualizado CSP para permitir GTM

## ⚠️ Importante

- O GTM está configurado para funcionar em todas as páginas do site
- O ID do container é: **GTM-KZTR2DHT**
- O servidor está rodando em: http://localhost:3000/


## 🐛 Troubleshooting

### Erro: CSP "connect-src" bloqueando Google Ads
- **Causa:** Content Security Policy bloqueando conexões do Google Ads
- **Solução:** ✅ Já corrigido! Adicionados domínios do Google Ads ao CSP
- **Domínios adicionados:**
  - `https://www.google.com` (para Google Ads conversions)
  - `https://googleads.g.doubleclick.net` (para scripts do Ads)
  - `https://region1.google-analytics.com` (para GA4)
  - `https://region1.analytics.google.com` (para GA4)
  - `https://stats.g.doubleclick.net` (para estatísticas)

### Erro: "datalayer is not defined"
- **Causa:** Você digitou `datalayer` (minúsculo)
- **Solução:** Digite `dataLayer` (com L maiúsculo) no console

### GTM não aparece no console
1. Limpe o cache do navegador (Ctrl + Shift + Delete)
2. Recarregue a página com cache limpo (Ctrl + Shift + R)
3. Verifique se há mensagem "✅ Google Tag Manager carregado" no console

### Script não está carregando
1. Verifique o console por erros de CSP (Content Security Policy)
2. Confirme que o arquivo `app/plugins/gtm.client.js` existe
3. Reinicie o servidor de desenvolvimento

### Como testar agora
1. Abra http://localhost:3000/
2. Abra o DevTools (F12)
3. No Console, digite: `dataLayer`
4. Você deve ver um array (pode estar vazio inicialmente, mas deve existir)
5. Procure pela mensagem: "✅ Google Tag Manager carregado - GTM-KZTR2DHT"
