# Google Analytics 4 - Measurement Protocol API

## 📋 Informações da Configuração

**Measurement ID**: `G-S0038L1Q6R`  
**API Secret**: `vlGI0HwCRfSWv18FdS7gJQ`  
**Data de Criação**: 04/03/2026 08:13:23  
**Apelido**: ANALYTICS GOOGLE

## 🔐 Segurança

As credenciais estão armazenadas de forma segura:
- ✅ Arquivo `.env` (não versionado no Git)
- ✅ `.env.example` para referência
- ✅ `nuxt.config.ts` com `runtimeConfig`

## 📁 Arquivos Criados

### 1. Variáveis de Ambiente
**Arquivo**: `.env`
```env
GA_MEASUREMENT_ID=G-S0038L1Q6R
GA_API_SECRET=vlGI0HwCRfSWv18FdS7gJQ
```

### 2. API Server-Side
**Arquivo**: `server/api/track-event.post.js`

Endpoint para enviar eventos do servidor para o GA4.

### 3. Composable Helper
**Arquivo**: `app/composables/useGATracking.js`

Funções helper para facilitar o rastreamento de eventos.

## 🚀 Como Usar

### Método 1: Client-Side (Frontend)

```vue
<script setup>
const { trackFormSubmit, trackContactClick } = useGATracking()

const handleSubmit = () => {
  trackFormSubmit('orcamento', {
    servico: 'Telas Mosquiteiras',
    bairro: 'Vila Mariana'
  })
}

const handleWhatsAppClick = () => {
  trackContactClick('whatsapp', 'hero')
}
</script>
```

### Método 2: Server-Side (Backend)

```javascript
// Em uma API route
export default defineEventHandler(async (event) => {
  const { trackServerEvent } = useGATracking()
  
  // Processar formulário...
  
  // Enviar evento para GA4
  await trackServerEvent('form_submit', {
    form_name: 'orcamento',
    servico: 'Telas Mosquiteiras'
  })
  
  return { success: true }
})
```

### Método 3: Híbrido (Client + Server)

```vue
<script setup>
const { trackEvent } = useGATracking()

const handleCriticalAction = () => {
  // Envia tanto client-side quanto server-side
  trackEvent('purchase', {
    value: 1500,
    currency: 'BRL'
  })
}
</script>
```

## 📊 Eventos Pré-Configurados

### 1. Envio de Formulário
```javascript
trackFormSubmit('orcamento', {
  servico: 'Telas Mosquiteiras',
  bairro: 'Vila Mariana'
})
```

### 2. Clique em Contato
```javascript
trackContactClick('whatsapp', 'hero')
trackContactClick('phone', 'footer')
trackContactClick('email', 'contato')
```

### 3. Visualização de Serviço
```javascript
trackServiceView('Telas Mosquiteiras', 'Telas')
```

## 🔧 Configuração do nuxt.config.ts

```typescript
runtimeConfig: {
  // Privado (apenas servidor)
  gaApiSecret: process.env.GA_API_SECRET,
  
  // Público (cliente e servidor)
  public: {
    gaMeasurementId: process.env.GA_MEASUREMENT_ID || 'G-S0038L1Q6R'
  }
}
```

## 📡 Endpoint da API

### POST `/api/track-event`

**Body**:
```json
{
  "eventName": "form_submit",
  "eventParams": {
    "form_name": "orcamento",
    "servico": "Telas Mosquiteiras"
  },
  "clientId": "opcional.123456789"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Evento enviado com sucesso"
}
```

## 🎯 Casos de Uso

### 1. Rastreamento de Conversões Server-Side
Útil quando você precisa garantir que conversões críticas sejam rastreadas, mesmo se o usuário tiver bloqueadores de anúncios.

```javascript
// Após processar pagamento
await trackServerEvent('purchase', {
  transaction_id: 'TXN-12345',
  value: 1500,
  currency: 'BRL',
  items: [{
    item_name: 'Telas Mosquiteiras',
    quantity: 3
  }]
})
```

### 2. Rastreamento de Formulários
```javascript
// Página de orçamento
const submitForm = async () => {
  // Processar formulário...
  
  // Rastrear no GA4
  trackFormSubmit('orcamento', {
    servico: formData.servico,
    bairro: formData.bairro
  })
}
```

### 3. Rastreamento de Leads
```javascript
// Quando usuário clica em WhatsApp
const openWhatsApp = () => {
  trackContactClick('whatsapp', 'hero')
  window.open('https://wa.me/5511983586611', '_blank')
}
```

## 🔍 Verificação

### 1. DebugView no GA4
1. Acesse Google Analytics
2. Vá em **Admin** > **DebugView**
3. Envie um evento de teste
4. Veja o evento aparecer em tempo real

### 2. Console do Navegador
```javascript
// Verificar se gtag está carregado
console.log(window.gtag)

// Verificar dataLayer
console.log(window.dataLayer)
```

### 3. Network Tab
- Abra DevTools (F12)
- Vá na aba **Network**
- Filtre por "google-analytics" ou "collect"
- Envie um evento e veja a requisição

## 🚨 Troubleshooting

### Eventos não aparecem no GA4
- ✅ Verifique se o `.env` está configurado
- ✅ Reinicie o servidor Nuxt após alterar `.env`
- ✅ Aguarde até 24h para dados aparecerem em relatórios
- ✅ Use "DebugView" para verificação em tempo real

### Erro 403 na API
- ✅ Verifique se `GA_API_SECRET` está correto
- ✅ Verifique se `GA_MEASUREMENT_ID` está correto
- ✅ Certifique-se de que a chave secreta está ativa no GA4

### Eventos duplicados
- ✅ Use apenas `trackClientEvent` OU `trackServerEvent`
- ✅ Não use `trackEvent` se já estiver usando os outros

## 📚 Documentação Oficial

- [Measurement Protocol GA4](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Event Reference](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events)
- [Validation Server](https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events)

## 🔄 Próximos Passos

1. ✅ Implementar rastreamento de conversões
2. ✅ Configurar funis no GA4
3. ✅ Integrar com Google Ads
4. ✅ Criar relatórios customizados
5. ✅ Configurar alertas de conversão

## 📝 Notas Importantes

- A chave secreta **NUNCA** deve ser exposta no frontend
- Use server-side tracking apenas para eventos críticos
- Client-side tracking é suficiente para a maioria dos casos
- Eventos server-side não são bloqueados por ad-blockers
- Mantenha o `.env` sempre atualizado e seguro

---

**Última atualização**: 04/03/2026 14:35  
**Status**: ✅ Configurado e pronto para uso
