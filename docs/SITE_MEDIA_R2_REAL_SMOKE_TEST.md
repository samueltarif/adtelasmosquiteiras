# RELATÓRIO DE SMOKE TEST REAL — CLOUDFLARE R2 SITE MEDIA

**Status:** REAL_R2_SMOKE_TEST = PASS  
**Data:** 25 de Agosto de 2026  
**Bucket Testado:** `adtelas-site-media`  
**Custom Domain CDN:** `https://media.adtelasmosquiteiras.com.br`  
**Script de Execução:** `scripts/smoke-test-r2-site-media-manual.mjs`

---

## 1. Sumário Executivo

Foi realizado o smoke test real e isolado de conectividade, permissões de escrita, leitura parcial e entrega via CDN no bucket **`adtelas-site-media`**.

Todos os comandos reais do AWS SDK S3 v3 e a entrega via Custom Domain Cloudflare foram validados com 100% de sucesso e zero resíduos deixados no bucket.

---

## 2. Matriz de Resultados Reais

| Etapa / Validação | Operação Real | Resultado | Detalhes |
|---|---|---|---|
| **Isolamento de Credenciais** | Checagem de Ambiente | **PASS** | Bucket `adtelas-site-media` isolado de `adtelas-leads-private` |
| **Presigned PUT** | `generateSitePresignedUploadUrl` + `fetch(PUT)` | **PASS** | Upload real de 74 bytes (JPEG 1x1) com status HTTP 200 |
| **HeadObject** | `HeadObjectCommand` | **PASS** | `exists: true`, `ContentLength: 74`, `ContentType: image/jpeg` |
| **Range GET (Magic Bytes)** | `GetObjectCommand` (`Range: bytes=0-511`) | **PASS** | 74 bytes recebidos, assinatura JPEG (`FF D8 FF`) confirmada |
| **Custom Domain Público (CDN)** | `GET https://media.adtelasmosquiteiras.com.br/...` | **PASS** | Entrega pública via CDN funcionando com status HTTP 200 |
| **Delete Real** | `DeleteObjectCommand` | **PASS** | Objeto temporário excluído com sucesso |
| **Confirmação de Zero Residual** | `HeadObjectCommand` pós-delete | **PASS** | `exists: false` (Zero arquivos residuais no bucket) |
| **Isolamento de Banco de Dados** | Supabase | **PASS** | 0 linhas criadas em `public.service_media` (`DATABASE_CHANGED = NO`) |
| **Isolamento Bucket Leads** | `adtelas-leads-private` | **PASS** | Nenhuma operação realizada no bucket de leads |

---

## 3. Comportamentos Arquiteturais e Riscos Conhecidos

### 3.1. CORS de Navegador
- **Status Atual:** `BROWSER_CORS_VALIDATED = NO`
- **Motivo:** O teste foi executado via runtime Node.js server-side. A validação real de preflight `OPTIONS` e headers `Access-Control-Allow-Origin` para uploads diretos originados do browser será realizada e atestada durante a Fase 2 (Painel Administrativo / UI com browser subagent).

### 3.2. Comportamento em Caso de Falha de Exclusão (R2 vs DB)
- **Cenário:** No endpoint `POST /api/admin/media/site/delete`, o arquivo físico é excluído primeiro do R2 (`DeleteObjectCommand`) e em seguida o registro é removido do Supabase (`DELETE FROM service_media`).
- **Comportamento se DB falhar:** Caso o banco falhe após a exclusão do R2, existirá temporariamente um registro órfão no banco apontando para um objeto inexistente no R2 (`DELETE_R2_SUCCESS_DB_FAILURE_BEHAVIOR = ORPHAN_DB_ROW_POSSIBLE_ON_DB_EXCEPTION`). Esse registro pode ser re-excluído ou limpo pelo admin.

### 3.3. Concorrência de `sort_order`
- **Cenário:** Se dois uploads para o mesmo `service_key` executarem `finalize-upload` no exato mesmo instante, ambos consultarão o mesmo `MAX(sort_order)` e receberão o mesmo índice (`CONCURRENT_SORT_ORDER_DUPLICATE_POSSIBLE = YES`).
- **Impacto:** Nulo/inofensivo, pois `sort_order` não possui constraint `UNIQUE` e a ordem visual pode ser ajustada pelo recurso de reordenação (drag-and-drop / manual) no painel.

---

## 4. Próxima Fase

- **Fase 2:** Implementação do Painel Administrativo de Gerenciamento de Mídias (`/admin/galeria`) com **shadcn MCP** e conformidade estrita com a matriz de responsividade (320px a 1920px).
