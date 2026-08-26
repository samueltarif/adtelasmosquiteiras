# IMPLEMENTAÇÃO DO BACKEND — SITE MEDIA & CLOUDFLARE R2 PUBLIC STORAGE

**Status:** IMPLEMENTADO E VALIDADO (FASES 1B E 1C CONCLUÍDAS)  
**REAL_R2_SMOKE_TEST:** PASS (100% validado em 25/08/2026 via `scripts/smoke-test-r2-site-media-manual.mjs`)  
**Data:** 25 de Agosto de 2026  
**Bucket Cloudflare R2:** `adtelas-site-media`  
**Custom Domain CDN:** `https://media.adtelasmosquiteiras.com.br`  
**Banco de Dados:** Supabase PostgreSQL (`public.service_media`)

---

## 1. Sumário da Entrega

Nesta fase foi implementada e testada a infraestrutura completa de backend para mídias públicas dos serviços no Cloudflare R2 e Supabase, mantendo 100% de isolamento físico e lógico em relação ao bucket privado de leads (`adtelas-leads-private`).

### 1.1. Status da Migração SQL 009
- **Status:** EXECUTADO E VALIDADO EM 25/08/2026.
- **Tabela `public.service_media`:** 17 colunas, 9 CHECK constraints de negócio.
- **RLS:** Habilitada (`relrowsecurity = true`).
- **Grants:** `anon` e `authenticated` possuem apenas `SELECT` onde `is_active = true`. Mutações são exclusivas via backend Nitro (`service_role`).
- **RPC `set_featured_service_media`:** `SECURITY DEFINER`, `SET search_path = ''`, execução revogada de `PUBLIC/anon/authenticated` e concedida a `service_role`.
- **Trigger `set_service_media_updated_at`:** `SECURITY INVOKER`, `SET search_path = ''`, atualiza `updated_at = pg_catalog.now()`.

---

## 2. Matriz de Isolamento de Credenciais e Armazenamento

| Atributo | Bucket Privado (Leads) | Bucket Público (Site Media) |
|---|---|---|
| **Identificador** | `adtelas-leads-private` | `adtelas-site-media` |
| **Finalidade** | Fotos/vídeos enviados por clientes em orçamentos | Fotos/vídeos de serviços administrados |
| **Credenciais** | `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | `R2_SITE_MEDIA_ACCESS_KEY_ID` / `R2_SITE_MEDIA_SECRET_ACCESS_KEY` |
| **Endpoint** | `R2_ACCOUNT_ID.r2.cloudflarestorage.com` | `R2_SITE_MEDIA_ENDPOINT` |
| **S3Client Instance** | `cachedS3Client` em `r2StorageCore.mjs` | `cachedSiteS3Client` em `r2SiteStorageCore.mjs` |
| **Acesso Leitura** | Presigned GET temporário para admin autenticado | Público irrestrito via CDN (`https://media.adtelasmosquiteiras.com.br`) |
| **Tabela DB** | `public.lead_media` | `public.service_media` |

---

## 3. Arquivos Criados e Estrutura

1. **`server/shared/siteMediaCore.mjs`:**
   - Single Source of Truth para as 12 `ALLOWED_SERVICE_KEYS`:
     `redes_janelas`, `redes_sacadas`, `redes_pets`, `redes_criancas`, `redes_escadas`, `telas_janelas`, `telas_portas`, `telas_sacadas`, `telas_removiveis`, `pet_screen`, `telas_restaurantes`, `vidracaria`.
   - Mapeamento de MIME e extensões (`photo`: webp, jpeg, png -> webp, jpg, png | `video`: mp4, webm -> mp4, webm).
   - Limites de tamanho: `MAX_PHOTO_BYTES = 10 MB`, `MAX_VIDEO_BYTES = 50 MB`, `MAX_FILES_PER_UPLOAD = 10`.
   - Gerador determinístico de storage key: `services/{service_key}/{uuid}.{ext}`.
   - Validador de Magic Bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `RIFF...WEBP`, MP4: `ftyp`, WebM: `1A 45 DF A3`).
   - Sanitizadores de `alt_text` (obrigatório, 3-255 caracteres sem HTML), `caption` e `title`.
   - Construtor de `publicUrl`.

2. **`server/shared/r2SiteStorageCore.mjs` & `server/utils/r2SiteStorage.ts`:**
   - Gestor do S3Client isolado para o bucket `adtelas-site-media`.
   - Geração de Presigned PUT URLs com `ContentType` e `CacheControl: public, max-age=31536000, immutable` (TTL 15 min).
   - `headSiteObjectInR2`: Validação física de existência e tamanho.
   - `getSiteObjectMagicBytes`: Leitura de cabeçalho via HTTP Range GET (512 bytes).
   - `deleteSiteObjectFromR2`: Exclusão física idempotente.

3. **Endpoints da API:**
   - **`POST /api/admin/media/site/authorize-upload`:** Autentica admin, valida serviço/MIME/tamanho, gera storage key e retorna Presigned PUT URL.
   - **`POST /api/admin/media/site/finalize-upload`:** Executa `HeadObject`, valida Magic Bytes, calcula `sort_order` no servidor, checa idempotência e persiste em `public.service_media`. Em caso de arquivo forjado, executa cleanup no R2.
   - **`GET /api/admin/media/site/list`:** Lista mídias para o painel com filtro opcional por `service_key`.
   - **`POST /api/admin/media/site/update`:** Atualiza `alt_text`, `caption`, `title`, `is_active` e `sort_order`.
   - **`POST /api/admin/media/site/set-featured`:** Executa a RPC `set_featured_service_media` atômica via `service_role`.
   - **`POST /api/admin/media/site/delete`:** Localiza storage key no banco, exclui no R2 e deleta o registro.
   - **`GET /api/services/[service_key]/media`:** Endpoint público com cache HTTP balanceado (`max-age=60, s-maxage=300, stale-while-revalidate=600`), retornando apenas mídias ativas sanitizadas (sem expor `created_by` ou dados administrativos).

4. **`scripts/test-site-media-backend.mjs`:**
   - Suíte de 32 testes automatizados cobrindo todos os cenários de segurança, validação, Magic Bytes, idempotência, sanitização e isolamento.

---

## 4. Resultados dos Testes Automatizados

```
======================================================================
SITE MEDIA BACKEND & R2 PUBLIC STORAGE TEST SUITE
======================================================================

--- 1. VALIDAÇÃO DE TAXONOMIA, TIPOS E AUTORIZAÇÃO ---
  [PASS] 1. anon authorize → denied (401)
  [PASS] 2. invalid service_key → denied
  [PASS] 3. unsupported MIME → denied
  [PASS] 4. oversized photo → denied (> 10MB)
  [PASS] 5. oversized video → denied (> 50MB)
  [PASS] 6. filename não influencia storage_key (zero path traversal)
  [PASS] 7. storage_key server-generated (UUID v4 + ext canônica)
  [PASS] 8. wrong prefix finalize → denied

--- 2. VALIDAÇÃO DE HEADOBJECT E MAGIC BYTES ---
  [PASS] 9. HeadObject missing → denied (404)
  [PASS] 10. ContentLength invalid (zero bytes) → denied
  [PASS] 11. MIME mismatch → denied
  [PASS] 12. fake JPEG → denied por Magic Bytes
  [PASS] 13. fake PNG → denied por Magic Bytes
  [PASS] 14. fake WebP → denied por Magic Bytes
  [PASS] 15. fake MP4 → denied por Magic Bytes
  [PASS] 16. fake WebM → denied por Magic Bytes
  [PASS] 17. valid JPEG → accepted
  [PASS] 18. valid PNG → accepted
  [PASS] 19. valid WebP → accepted
  [PASS] 20. valid MP4 → accepted
  [PASS] 21. valid WebM → accepted

--- 3. VALIDAÇÃO DE PERSISTÊNCIA, IDEMPOTÊNCIA E ADMIN ---
  [PASS] 22. duplicate finalize → no duplicate DB row (idempotent result)
  [PASS] 23. anon list admin → denied (401)
  [PASS] 24. admin list → allowed com publicUrl construída
  [PASS] 25. anon update → denied (401)
  [PASS] 26. anon delete → denied (401)
  [PASS] 27. featured usa RPC server-side set_featured_service_media
  [PASS] 28. public endpoint só retorna is_active=true
  [PASS] 29. public endpoint não vaza created_by ou dados internos
  [PASS] 30. delete não aceita storage_key arbitrária (obtida server-side pelo id)
  [PASS] 31. lead-media credentials never used (isolamento de credenciais e buckets)
  [PASS] 32. site-media secrets never client exposed

======================================================================
TEST SUITE FINISHED: 32 PASSED | 0 FAILED
======================================================================
```

---

## 5. Requisitos para a Próxima Fase (Painel Administrativo / UI)

- **shadcn MCP Obrigatório:** Card, Dialog, Tabs, Switch, Skeleton, Dropdown, Table, Input, Textarea.
- **Matriz de Responsividade Permanente:**
  - Breakpoints: 320px, 360px, 375px, 390px, 412px, 430px, 768px, 1024px, 1280px, 1920px.
  - Touch targets >= 44px.
  - Upload mobile funcional com compressão WebP client-side via `useImageCompressor.js`.
  - Lightbox fullscreen com pinch-zoom 1x-5x e suporte a teclado/touch.
