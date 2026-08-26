# AUDITORIA DE ARQUITETURA — GALERIA PÚBLICA DE SERVIÇOS + R2 SITE MEDIA

**DATABASE_PHASE_009:** PASS (Executado e validado em 25/08/2026)  
**BACKEND_PHASE:** IMPLEMENTED_AND_VALIDATED (Fase 1B concluída com 32/32 testes)  
**REAL_R2_SMOKE_TEST:** PASS (Fase 1C concluída com 0 residual)  
**ADMIN_PANEL_PHASE:** IMPLEMENTED_AND_VALIDATED (Fase 2 concluída com 36/36 testes)  
**BROWSER_CORS_VALIDATED:** YES (Validado em navegador real pelo operador)  
**PUBLIC_GALLERY_PHASE:** IMPLEMENTED_AND_VALIDATED (Fase 3 concluída com 40/40 testes)  
**Data:** 26 de Agosto de 2026  
**Bucket Público:** `adtelas-site-media`  
**Custom Domain CDN:** `https://media.adtelasmosquiteiras.com.br`  
**Banco de Dados:** Supabase / PostgreSQL (`public.service_media`)

---

## 1. Sumário Executivo

Esta documentação consolida a auditoria e status de implementação do ecossistema de **Mídias Públicas e Galerias de Serviços** do site AD Telas e Redes, utilizando um bucket dedicado no Cloudflare R2 com entrega via CDN de alta performance e persistência de metadados no Supabase.

### 1.1. Separação Estrita de Ambientes e Credenciais

| Atributo | Bucket Privado (Leads) | Novo Bucket Público (Site Media) |
|---|---|---|
| **Identificador** | `adtelas-leads-private` | `adtelas-site-media` |
| **Finalidade** | Fotos e vídeos enviados por clientes via orçamento | Fotos e vídeos de serviços publicados pelo administrador |
| **Credenciais** | `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | `R2_SITE_MEDIA_ACCESS_KEY_ID` / `R2_SITE_MEDIA_SECRET_ACCESS_KEY` |
| **Acesso Leitura** | Privado (Presigned GET temporário para Admin) | Público irrestrito via CDN (`https://media.adtelasmosquiteiras.com.br`) |
| **Tabela no Banco** | `public.lead_media` | `public.service_media` (Criada e Ativa) |
| **Automação** | 100% isolado de leads | **Regra Absoluta:** Nenhuma mídia de lead é publicada automaticamente |

---

## 2. Inventário das Páginas Canônicas de Serviços (12 Rotas)

Atualmente, todas as 12 páginas canônicas de serviços utilizam imagens estáticas locais em `/public/images/`. A nova arquitetura permitirá enriquecer dinamicamente cada serviço com galerias completas de fotos reais e vídeos de instalações gerenciados pelo painel administrativo.

| # | Rota Canônica | Família | `service_key` | Imagem Hero Atual |
|---|---|---|---|---|
| 1 | `/servicos/redes/janelas` | Redes de Proteção | `redes_janelas` | `/images/redes_para_janelas.png` |
| 2 | `/servicos/redes/sacadas-e-varandas` | Redes de Proteção | `redes_sacadas` | `/images/redes_para_sacadas.jpg` |
| 3 | `/servicos/redes/gatos-e-pets` | Redes de Proteção | `redes_pets` | `/images/gato.png` |
| 4 | `/servicos/redes/criancas` | Redes de Proteção | `redes_criancas` | `/images/redes_para_criancas.png` |
| 5 | `/servicos/redes/escadas-e-mezaninos` | Redes de Proteção | `redes_escadas` | `/images/redes_para_escadas.jpg` |
| 6 | `/servicos/telas/janelas` | Telas Mosquiteiras | `telas_janelas` | `/images/tela_mosquiteira.png` |
| 7 | `/servicos/telas/portas` | Telas Mosquiteiras | `telas_portas` | `/images/telas_para_portas.jpeg` |
| 8 | `/servicos/telas/sacadas-e-varandas` | Telas Mosquiteiras | `telas_sacadas` | `/images/telas_para_varandas.jpg` |
| 9 | `/servicos/telas/removivel` | Telas Mosquiteiras | `telas_removiveis` | `/images/mosquiteira_removivel.png` |
| 10 | `/servicos/telas/pet-screen` | Telas Mosquiteiras | `pet_screen` | `/images/pets_pro.png` |
| 11 | `/servicos/telas/restaurantes` | Telas Mosquiteiras | `telas_restaurantes` | `/images/telas_para_restaurantes.jpg` |
| 12 | `/servicos/vidracaria` | Vidraçaria | `vidracaria` | `/images/vidro_janela_8mm.png` |

---

## 3. Configuração de Variáveis de Ambiente e Segurança

### 3.1. Variáveis Registradas no `.env` e `.env.example`
- `R2_SITE_MEDIA_ACCOUNT_ID`: Presente (Privado)
- `R2_SITE_MEDIA_ACCESS_KEY_ID`: Presente (Privado)
- `R2_SITE_MEDIA_SECRET_ACCESS_KEY`: Presente (Privado)
- `R2_SITE_MEDIA_BUCKET_NAME`: `adtelas-site-media` (Privado)
- `R2_SITE_MEDIA_ENDPOINT`: `https://871d1f3f3b1e573345d9bb791d4c5563.r2.cloudflarestorage.com` (Privado)
- `R2_SITE_MEDIA_PUBLIC_BASE_URL`: `https://media.adtelasmosquiteiras.com.br` (Público)

### 3.2. Mapeamento no `nuxt.config.ts`
- **Chaves Privadas (Server-Only):** Mapeadas na raiz do `runtimeConfig` (`r2SiteMediaAccountId`, `r2SiteMediaAccessKeyId`, `r2SiteMediaSecretAccessKey`, `r2SiteMediaBucketName`, `r2SiteMediaEndpoint`).
- **Chaves Públicas (Cliente e Servidor):** Apenas `public.r2SiteMediaPublicBaseUrl` (`https://media.adtelasmosquiteiras.com.br`).
- **Segurança CSP (Content Security Policy):** O domínio `https://media.adtelasmosquiteiras.com.br` está liberado nas diretivas `img-src`, `media-src` e `connect-src`.
- **Zero Vazamento de Segredos:** Nenhuma credencial privada é exposta no bundle cliente ou logs.

---

## 4. Arquitetura do Banco de Dados (`public.service_media`)

A especificação oficial endurecida e script transacional completo residem em **`supabase/manual/009_service_media_storage.sql`** e **`docs/SQL_009_SERVICE_MEDIA_HARDENING.md`**.

Principais garantias do schema:
1. **Allowlist Canônica (12 chaves):** `redes_janelas`, `redes_sacadas`, `redes_pets`, `redes_criancas`, `redes_escadas`, `telas_janelas`, `telas_portas`, `telas_sacadas`, `telas_removiveis`, `pet_screen`, `telas_restaurantes`, `vidracaria`.
2. **MIME & Magic Bytes:** `photo` aceita `image/webp`, `image/jpeg`, `image/png`; `video` aceita `video/mp4`, `video/webm`.
3. **Dimensões Obrigatórias para Fotos:** `width > 0` e `height > 0` (ajudam a reservar proporção e reduzem o CLS das imagens durante o carregamento).
4. **Unicidade de Destaque:** Índice parcial `UNIQUE(service_key) WHERE is_featured = true` (garante no máximo uma mídia featured por serviço).
5. **Atualização Atômica via RPC:** `public.set_featured_service_media` com `SET search_path = ''` executável exclusivamente via `service_role`.
6. **RLS e Isolamento:** Leitura pública irrestrita para `is_active = true`; mutações 100% server-side via backend Nitro (`service_role`). Zero mutação direta pelo navegador.

---

## 5. Fluxo de Upload e Arquitetura de Execução

```
+------------------------------------------------------------------------------------------------+
|                                    FLUXO DE UPLOAD DIRETO                                      |
+------------------------------------------------------------------------------------------------+
|                                                                                                |
| 1. ADMIN (UI)                                                                                  |
|    - Seleciona o serviço e arquivos (fotos/vídeos).                                            |
|    - Preenche Alt Text obrigatório e legenda opcional.                                         |
|    - useImageCompressor comprime fotos para WebP (max 1920px, Q=82%) client-side.              |
|                                                                                                |
| 2. BACKEND NITRO (POST /api/admin/media/site/authorize-upload)                                 |
|    - Valida sessão RBAC ativa do Admin.                                                        |
|    - Gera storage_key única baseada em UUID: services/{service_key}/{uuid}.webp                |
|    - Gera S3 Presigned PUT URL exclusiva para adtelas-site-media (TTL 15 min).                 |
|                                                                                                |
| 3. BROWSER                                                                                     |
|    - Executa PUT direto no endpoint Cloudflare R2 com header:                                  |
|      Cache-Control: public, max-age=31536000, immutable                                        |
|                                                                                                |
| 4. BACKEND NITRO (POST /api/admin/media/site/finalize-upload)                                  |
|    - Executa HeadObjectCommand no R2 para validar que o arquivo existe fisicamente.            |
|    - Registra metadados na tabela public.service_media.                                        |
|                                                                                                |
| 5. FRONTEND PÚBLICO (Páginas de Serviços)                                                      |
|    - Consome GET https://media.adtelasmosquiteiras.com.br/{storage_key}                         |
|    - Entrega instantânea via CDN com cache de borda Cloudflare.                                |
+------------------------------------------------------------------------------------------------+
```

---

## 6. Otimização de Imagens, Cache e SEO

1. **Otimização no Cliente (Baixo consumo de computação no servidor):**
   - Reuso do composable comprovado `useImageCompressor.js`.
   - Conversão de fotos para formato WebP moderno, limitando a dimensão máxima a 1920px.
   - Redução típica de tamanho: de 5MB–10MB para 150KB–350KB sem perda perceptível de qualidade visual.
2. **Cache Imutável e Cache Busting Natural:**
   - Como cada arquivo recebe um nome único com UUID, os arquivos são gravados com `Cache-Control: public, max-age=31536000, immutable`.
   - Atualizações ou substituições de fotos geram um novo UUID e atualizam a referência no banco, evitando problemas de cache obsoleto no navegador dos clientes.
3. **SEO e Core Web Vitals:**
   - **Redução de Layout Shifts (CLS):** As tags `<img>` renderizadas no frontend público incluirão atributos explícitos de `width` e `height` obtidos no upload, reservando a proporção/espaço da mídia e reduzindo significativamente layout shifts causados pelo carregamento das imagens (embora não garantam isoladamente CLS global igual a zero).
   - **Acessibilidade e Indexação:** Cada foto terá seu `alt` textual específico inserido pelo administrador (ex: *"Instalação de rede de proteção em sacada de apartamento em Santana SP"*).
   - Atributos `loading="lazy"` e `decoding="async"` aplicados de forma consistente para auxiliar na estratégia de carregamento e despriorizar mídias fora da viewport inicial.

---

## 7. Componentes de Interface Propostos

### 7.1. Galeria Pública no Frontend (`app/components/services/ServicePublicGallery.vue`)
- **Padrão Visual:**
  - Imagem de Destaque / Hero com alta resolução e badge do serviço.
  - Grid responsivo de miniaturas (thumbnails) com borda de foco e indicador de quantidade (+N fotos).
  - Botão de ação "Ver todas as fotos da instalação".
- **Lightbox Fullscreen Interativo:**
  - Reuso da engine desenvolvida em `MediaLightbox.vue`:
    - Fullscreen real (`backdrop-blur-md`).
    - Pinch-to-zoom no mobile (1x a 5x).
    - Pan/arrastar com limites de borda.
    - Zoom via roda do mouse e double tap/double click.
    - Navegação por gestos de swipe e teclado (setas e ESC).

### 7.2. Painel Administrativo (`app/pages/admin/galeria.vue`)
- Integrado diretamente ao layout existente em `app/layouts/admin.vue`.
- Abas por família (`Telas`, `Redes`, `Vidraçaria`) e seletor por serviço canônico.
- Dropzone para upload múltiplo com barra de progresso individual.
- Ações rápidas por item:
  - Definir como Imagem Destaque (`is_featured`).
  - Ativar / Desativar (`is_active`).
  - Reordenar via Drag-and-Drop ou botões (`sort_order`).
  - Editar `alt_text` e `caption`.
  - Excluir mídia (remove o registro no banco e o arquivo no R2).

---

## 8. Histórico de Implementação (Fases Concluídas e Validadas)

1. **Fase 1A / 1B — Banco e Backend Nitro (CONCLUÍDO E VALIDADO):**
   - Migração SQL `supabase/manual/009_service_media_storage.sql` executada e protegida com RLS e idempotência.
   - Utilitário `server/utils/r2SiteStorage.ts` com S3Client exclusivo do bucket público `adtelas-site-media`.
   - Endpoints implementados e validados:
     - `POST /api/admin/media/site/authorize-upload` (Presigned PUT)
     - `POST /api/admin/media/site/finalize-upload` (HeadObject + Magic Bytes)
     - `GET /api/admin/media/site/list`
     - `POST /api/admin/media/site/update`
     - `POST /api/admin/media/site/set-featured`
     - `POST /api/admin/media/site/delete` (R2 DeleteObjectCommand + DB delete)
     - `GET /api/services/[service_key]/media` (Público com Cache HTTP e sanitização estrita)
   - Suíte de backend: **32/32 PASS**.

2. **Fase 1C — Real R2 Smoke Test (CONCLUÍDO E VALIDADO):**
   - Smoke test ponta a ponta com `PutObjectCommand`, `HeadObjectCommand`, `GetObjectCommand Range`, `DeleteObjectCommand` executado com zero registros residuais.

3. **Fase 2 & 2.1 — Painel Administrativo & Browser Security Gate (CONCLUÍDO E VALIDADO):**
   - Página `/admin/galeria` implementada com seleção por 3 famílias e 12 serviços canônicos, compressão WebP client-side, barra de progresso real via XHR PUT, badges de status, edição de metadados, reordenação e modal de exclusão.
   - Proteção de rota via middleware administrativo e touch targets `>= 44px`.
   - CORS de navegador validado no Cloudflare R2 com upload real de foto WebP em `telas_janelas`.
   - Suíte de UI Admin: **36/36 PASS**.

4. **Fase 3 & 3.1 — Galeria Pública de Serviços & Real Browser Visual Gate (CONCLUÍDO E VALIDADO):**
   - Componentes `app/components/ServicePublicGallery.vue` e `app/components/ServicePublicLightbox.vue` criados.
   - Integrados após o Hero em todas as 12 páginas canônicas de serviços.
   - Comportamentos validados: 0 mídias (oculta), 1 mídia (card elegante centralizado), 2-4 mídias (grids proporcionais), 5+ mídias (preview limitado + "+N fotos" e botão "Ver todas").
   - Lightbox com zoom (1x-5x), pan, swipe, double-tap, keyboard navigation (`ArrowLeft`, `ArrowRight`, `Escape`), focus trap & restore.
   - Suíte da Galeria Pública: **40/40 PASS**.
   - Nuxt build compilado com sucesso.

---
*Documento registrado em [docs/SITE_MEDIA_R2_PUBLIC_GALLERY_AUDIT.md](file:///d:/sicons/ADT/docs/SITE_MEDIA_R2_PUBLIC_GALLERY_AUDIT.md).*
