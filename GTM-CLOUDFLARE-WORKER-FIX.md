# GTM + Cloudflare Worker - Correção do Transport URL

## O Problema

O GTM estava tentando carregar scripts da raiz do domínio (`https://www.adtelasmosquiteiras.com.br/?id=...`) em vez de usar o caminho `/metrics/` que o Cloudflare Worker está monitorando.

Resultado: O Worker não era acionado, o Cloudflare entregava o HTML da página inicial, e o navegador reclamava de erro de MIME type.

## A Solução Implementada

### 1. Ajuste no `gtm.client.js`

Adicionamos a configuração `transport_url` que força o GTM a enviar TODAS as requisições através do caminho `/metrics/`:

```javascript
// Configurar transport_url para forçar todas as requisições através do Worker
gtag('config', 'GTM-KZTR2DHT', {
  'transport_url': 'https://www.adtelasmosquiteiras.com.br/metrics/collect',
  'first_party_collection': true
});
```

### 2. Por que isso resolve?

- **Força o Caminho**: O `transport_url` avisa ao GTM: "Não mande dados para a raiz, mande para `/metrics/collect`"
- **Endpoint Específico**: O `/collect` é o endpoint padrão que o GTM/GA4 espera para coleta de dados
- **Ativa o Worker**: Assim que a URL contiver `/metrics`, a rota do Cloudflare (`*adtelasmosquiteiras.com.br/metrics*`) é acionada
- **MIME Type Correto**: O Worker busca o script real no Google e entrega como `application/javascript`
- **Elimina 404s**: Todas as requisições de coleta agora vão para um caminho válido

## Como Testar

### 1. Limpar Cache e Recarregar

```bash
# No navegador
1. Abra DevTools (F12)
2. Clique com botão direito no ícone de reload
3. Selecione "Limpar cache e recarregar forçado"
```

### 2. Verificar no Console

Você deve ver:
```
✅ GTM carregado via /metrics/ (Cloudflare Worker)
✅ Transport URL configurada: https://www.adtelasmosquiteiras.com.br/metrics/collect
```

### 3. Verificar na Aba Network

1. Abra DevTools → Network
2. Filtre por "gtm" ou "metrics"
3. Você deve ver requisições para:
   - `/metrics/gtm.js?id=GTM-KZTR2DHT` (Status 200, Type: script)
   - `/metrics/collect` (Status 200, requisições de coleta de dados)
   - Não deve haver erros 404 para `/metrics/`

### 4. Verificar MIME Type

Clique em qualquer requisição `/metrics/gtm.js` e verifique:
- **Content-Type**: `application/javascript; charset=utf-8`
- **Status**: `200 OK`

## Configuração do Cloudflare Worker

Certifique-se de que seu Worker está configurado com a rota:

```
*adtelasmosquiteiras.com.br/metrics*
```

E o código do Worker deve incluir:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Se a URL contém /metrics/, proxy para o Google
  if (url.pathname.startsWith('/metrics/')) {
    // Remover /metrics/ e construir URL do Google
    const path = url.pathname.replace('/metrics/', '')
    let googleUrl
    
    // Determinar o endpoint correto do Google
    if (path.startsWith('gtm.js') || path.startsWith('gtag/')) {
      googleUrl = `https://www.googletagmanager.com/${path}`
    } else if (path === 'collect' || path.startsWith('collect')) {
      googleUrl = `https://www.google-analytics.com/${path}`
    } else {
      googleUrl = `https://www.googletagmanager.com/${path}`
    }
    
    const response = await fetch(googleUrl + url.search, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })
    
    // Garantir MIME type correto para scripts
    const newHeaders = new Headers(response.headers)
    if (path.includes('.js')) {
      newHeaders.set('Content-Type', 'application/javascript; charset=utf-8')
    }
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    })
  }
  
  // Caso contrário, retornar a requisição normal
  return fetch(request)
}
```

## Por que usar `/metrics/collect`?

O endpoint `/collect` é o caminho padrão usado pelo Google Analytics e GTM para enviar dados de eventos. Ao configurar o `transport_url` com `/metrics/collect`:

1. **Evita 404s**: O GTM sabe exatamente para onde enviar os dados
2. **Compatibilidade**: Segue o padrão do Google Analytics Measurement Protocol
3. **Organização**: Separa claramente scripts (gtm.js) de coleta de dados (collect)
4. **Debugging**: Facilita identificar requisições de coleta no Network tab

## Checklist de Verificação

- [ ] O arquivo `gtm.client.js` contém a configuração `transport_url`
- [ ] O Cloudflare Worker está ativo e com a rota correta
- [ ] O cache do navegador foi limpo
- [ ] As requisições aparecem na aba Network com `/metrics/`
- [ ] O Content-Type é `application/javascript`
- [ ] Não há erros de MIME type no console
- [ ] O GTM está enviando eventos corretamente

## Troubleshooting

### Ainda vejo erro 404 em /metrics/

1. Verifique se o `transport_url` está configurado com `/collect` no final
2. Confirme que o Worker está tratando requisições para `/metrics/collect`
3. Teste diretamente: `https://www.adtelasmosquiteiras.com.br/metrics/collect`
4. Verifique os logs do Worker no Cloudflare Dashboard

### Ainda vejo erro de MIME type

1. Verifique se o Worker está realmente ativo no Cloudflare
2. Confirme que a rota do Worker é `*adtelasmosquiteiras.com.br/metrics*`
3. Limpe o cache do Cloudflare (Purge Everything)
4. Limpe o cache do navegador completamente

### O GTM não está rastreando eventos

1. Verifique no GTM Preview Mode se o container está carregando
2. Confirme que o `transport_url` está configurado corretamente
3. Verifique se há erros no console do navegador
4. Teste com o Google Tag Assistant

### Requisições ainda vão para a raiz

1. Confirme que o código do `gtm.client.js` foi salvo corretamente
2. Reinicie o servidor de desenvolvimento (`npm run dev`)
3. Faça um hard refresh no navegador (Ctrl+Shift+R)

## Próximos Passos

1. Testar em produção após deploy
2. Monitorar o GTM Debug View por 24h
3. Verificar se os eventos estão chegando no GA4
4. Confirmar que não há perda de dados

## Referências

- [GTM Server-Side Tagging](https://developers.google.com/tag-platform/tag-manager/server-side)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [First-Party Tracking](https://support.google.com/tagmanager/answer/9323295)
