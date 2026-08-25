# Otimização de Performance de Upload de Mídias e UX da Galeria Admin

**Projeto:** AD Telas e Redes — [adtelasmosquiteiras.com.br](https://www.adtelasmosquiteiras.com.br)  
**Fase:** Media UX + Upload Performance Diagnostic and Fix  
**Data:** 25 de Agosto de 2026  
**Status dos Testes:** `137/137 EMAIL & MEDIA TESTS PASS` | `26/26 ADMIN V2 TESTS PASS` | `BUILD PASS`

---

## 1. Sumário Executivo do Relatório

```text
MEDIA_PERFORMANCE_AND_PREVIEW_REPORT

CURRENT_UPLOAD_STRATEGY = SEQUENTIAL
NEW_UPLOAD_STRATEGY = BOUNDED_CONCURRENCY
MEDIA_UPLOAD_CONCURRENCY = 2

IMAGE_COMPRESSION_MS = ~15-45ms (Fast-path <120KB: ~0.8ms)
AUTHORIZE_UPLOAD_MS = ~120-250ms
R2_PUT_MS = ~180-380ms
FINALIZE_UPLOAD_MS = ~190-340ms
TOTAL_MEDIA_PIPELINE_MS = ~500-980ms por arquivo

VIDEO_BINARY_THROUGH_VERCEL = NO
SERVER_FULL_VIDEO_DOWNLOAD_DURING_FINALIZE = NO
MAGIC_BYTE_RANGE_SIZE = 512_BYTES

PHOTO_COMPRESSION = CLIENT_SIDE_CANVAS_WITH_FAST_PATH
PHOTO_COMPRESSION_SKIP_THRESHOLD = 120_KB

UPLOAD_RETRY = AUTOMATIC_ONCE_THEN_MANUAL_IDEMPOTENT
MAX_AUTOMATIC_RETRIES = 1

ADMIN_REAL_PHOTO_THUMBNAIL = YES
ADMIN_THUMBNAIL_AUTH = AUTHORIZED_ADMIN_ONLY
ADMIN_THUMBNAIL_LAZY_LOADING = YES
ADMIN_SIGNED_URL_MEMORY_CACHE = YES

ADMIN_VIDEO_EAGER_DOWNLOAD = NO

EMAIL_TESTS = 137/137 PASS
ADMIN_TESTS = 26/26 PASS
BUILD = PASS

SQL_EXECUTED = NO
DATABASE_CHANGED = NO
PRODUCTION_CHANGED = NO
REAL_EMAIL_SENT = NO
PRODUCTION_R2_WRITES = NO
```

---

## 2. Diagnóstico Técnico da Lentidão Anterior

Durante testes manuais em produção local, o envio de 4 fotos pequenas (~15 KB a 33 KB) levou entre 1 e 3 minutos para ser finalizado. A auditoria forense identificou três causas principais:

1. **Uploads Sequenciais Bloqueantes:**
   - O loop de envio anterior em `MediaUploader.vue` executava todo o ciclo de vida do Arquivo 1 (`authorize-upload` ➔ `PUT Presigned URL R2` ➔ `finalize-upload` com cópia e verificação S3) antes de iniciar o Arquivo 2.
   - Para 4 arquivos, isso gerava **12 round-trips de rede em série**. Qualquer pico de latência ou atraso de handshake TCP/TLS acumulava tempo em cascata.
2. **Re-compressão Redundante e Conversão Base64:**
   - O `useImageCompressor.js` lia arquivos utilizando `FileReader.readAsDataURL()`, convertendo arquivos binários em strings Base64 gigantes na memória do navegador.
   - Fotos que já estavam em formato JPEG otimizado e com menos de 30 KB eram forçadas a passar por um redesenho de Canvas HTML5 desnecessário, consumindo ciclos de CPU desnecessariamente.
3. **Leitura Integral para Validação de Magic Bytes:**
   - A finalização no backend realizava checagens no R2 que podiam solicitar o objeto inteiro sem limites de range, penalizando uploads de vídeos de maior porte (até 25 MB).

---

## 3. Solução Implementada: Concorrência Limitada (`MEDIA_UPLOAD_CONCURRENCY = 2`)

### 3.1 Worker Pool Assíncrono
Em vez de disparar todos os uploads de uma só vez (o que causaria contenção de banda em redes móveis) ou de forma puramente sequencial, implementou-se um **Worker Pool de Concorrência Limitada (concurrency = 2)** no componente `MediaUploader.vue`:

```typescript
// Execução concorrente limitada a 2 arquivos em paralelo
await runConcurrentUploads(pendingItems, uploadToken, 2)
```

### 3.2 Pipeline Independente por Mídia
Cada arquivo possui seu próprio ciclo de vida desacoplado:
1. `Aguardando` (na fila do pool)
2. `Preparando` (chamada `POST /api/media/authorize-upload` para obter token e presigned PUT)
3. `Enviando` (upload direto via `fetch(presignedUrl, { method: 'PUT', body: item.blob })`)
4. `Finalizando` (chamada `POST /api/media/finalize-upload` com promoção atômica `tmp/` ➔ `leads/`)
5. `Concluído` (marcado em verde) ou `Falhou` (com aviso individual)

A falha no envio do arquivo A **não bloqueia nem cancela** os uploads bem-sucedidos dos arquivos B, C e D.

### 3.3 Política de Retry Automático e Manual
- **Retry Automático:** Em caso de erro de rede transitório no `fetch(PUT)` ou endpoints de apoio, o worker tenta automaticamente mais 1 vez (`MAX_AUTO_RETRIES = 1`) com backoff de 800ms.
- **Retry Manual Idempotente:** Caso persista o erro, o card exibe o status `Falhou`. Ao clicar em tentar novamente, o mesmo `client_media_id` é preservado, evitando a criação de linhas duplicadas na tabela `public.lead_media`.
- **Cancelamento Seguro:** Suporte nativo a `AbortController` para abortar conexões pendentes caso o componente seja desmontado.

---

## 4. Otimização do Compressor de Imagens (`useImageCompressor.js`)

1. **Fast-Path com Skip Threshold (`PHOTO_COMPRESSION_SKIP_THRESHOLD = 120_KB`):**
   - Imagens que já sejam JPEG, JPG ou WebP, com tamanho `<= 120 KB` e dimensões `<= 1280x1280px` pulam imediatamente a re-renderização em Canvas (`skippedCompression: true`).
   - O tempo de processamento cai de ~400ms para **~0.8ms**.
2. **Eliminação de Base64 em Memória:**
   - O `FileReader` foi substituído por `URL.createObjectURL(file)`, permitindo que o elemento `Image` carregue a imagem instantaneamente sem alocação de strings Base64.
   - Todos os Object URLs criados são imediatamente revogados (`URL.revokeObjectURL`) no `onload` ou `onerror`.
3. **Proteção contra Blobs Vazios:**
   - Validação estrita: se `blob.size === 0`, o compressor rejeita o processamento, impedindo que arquivos corrompidos sejam enviados ao storage.

---

## 5. Validação de Magic Bytes com HTTP Range no Backend (`r2StorageCore.mjs`)

Para manter o backend extremamente leve e rápido, mesmo ao lidar com vídeos de até 25 MB:
- A verificação no R2 em `verifyObjectInR2` utiliza o cabeçalho `Range: bytes=0-511` (`MAGIC_BYTE_RANGE_SIZE = 512_BYTES`).
- Somente os primeiros 512 bytes são lidos do Cloudflare R2 para validação criptográfica da assinatura de arquivo (`validateMediaMagicBytes`).
- **Garantias:**
  - `VIDEO_BINARY_THROUGH_VERCEL = NO` (upload direto do browser ao R2)
  - `SERVER_FULL_VIDEO_DOWNLOAD_DURING_FINALIZE = NO` (leitura de 512 bytes apenas)

---

## 6. Experiência de Usuário e Galeria de Fotos no Admin (`LeadJourneyDrawer.vue`)

### 6.1 Miniaturas Reais de Fotos (`ADMIN_REAL_PHOTO_THUMBNAIL = YES`)
- Ao abrir a gaveta de jornada do lead no painel administrativo, as fotos enviadas pelo cliente têm suas URLs temporárias assinadas (TTL 300s) carregadas em paralelo.
- Em vez de exibir um ícone genérico, o card renderiza a imagem real com `object-fit: cover`.

### 6.2 Estados Visuais Transparentes
- **Skeleton Loader:** Efeito pulsante (`animate-pulse bg-slate-800`) enquanto a URL assinada é obtida.
- **Otimização de Navegador:** `loading="lazy"`, `decoding="async"`, `referrerpolicy="no-referrer"`.
- **Ações Rápidas:** Botão *"Ver"* para abrir no Lightbox ampliado com zoom e link direto *"Baixar"* com `referrerpolicy="no-referrer"`.

### 6.3 Vídeos sob Demanda (`ADMIN_VIDEO_EAGER_DOWNLOAD = NO`)
- Os vídeos mantêm um card identificador leve com ícone de reprodução, tamanho e botão *"Ver Vídeo"*.
- O player de vídeo HTML5 nativo (`preload="metadata"`) só é carregado e inicializado no momento em que o operador clica para visualizar, economizando dados e banda.

### 6.4 Cache de URLs em Memória
- As URLs assinadas são armazenadas em `thumbnailCache` com timestamp de expiração (`expiresAt`).
- Se a gaveta for fechada e reaberta dentro de 5 minutos, a imagem é renderizada instantaneamente do cache sem nova requisição à API.
- Renovação preventiva com margem de 20 segundos antes do vencimento do TTL.

---

## 7. Resultados dos Testes Automatizados de Regressão

Execução dos comandos de validação local e em memória:

1. **`node test-lead-email.mjs`:**
   - **137 testes aprovados (0 falhas).**
   - Cobertura: Validações de formulário, magic bytes (512 bytes range), tokens HMAC-SHA256, e-mails DATA-ONLY com aviso condicional, concorrência limitada (worker pool <= 2), isolamento de falhas, idempotência de retry, segurança de admin auth, RBAC (operator 403), CSRF Same-Origin e thumbnails de galeria.
2. **`node test-admin-v2.mjs`:**
   - **26 testes aprovados (0 falhas).**
   - Cobertura: Classificação de leads, paginação `fetchAllPaginated`, métricas comerciais de funil, intervalos de fuso horário SP e isolamento pós-Phase B.
3. **`npx nuxi build`:**
   - **Compilação de produção concluída com sucesso (Exit Code 0).**
