# ESPECIFICAÇÃO TÉCNICA E SEGURANÇA — SQL 009 SERVICE MEDIA STORAGE

**Status:** EXECUTADO E VALIDADO EM 25/08/2026  
**Arquivo SQL Físico:** `supabase/manual/009_service_media_storage.sql`  
**Bucket Cloudflare R2:** `adtelas-site-media`  
**Custom Domain CDN:** `https://media.adtelasmosquiteiras.com.br`

---

## 0. Validação de Execução em Produção / Banco de Dados (25/08/2026)

A migração SQL 009 foi executada manualmente no Supabase SQL Editor e confirmada com sucesso via queries de POST-CHECK:
- **Tabela `public.service_media`:** Criada com 17 colunas e 9 CHECK constraints de negócio.
- **RLS Habilitada (`pg_class`):** `relrowsecurity = true`, `relforcerowsecurity = false`.
- **Privilégios de Execução de Funções (`has_function_privilege`):**
  - `public.set_featured_service_media(uuid, varchar)`: `anon_execute = false`, `auth_execute = false`, `service_execute = true`.
  - `public.set_service_media_updated_at()`: `anon_execute = false`, `auth_execute = false`, `service_execute = true`.
- **Privilégios da Tabela (`has_table_privilege`):**
  - `anon`: `can_select = true`, `can_insert = false`, `can_update = false`, `can_delete = false`.
  - `authenticated`: `can_select = true`, `can_insert = false`, `can_update = false`, `can_delete = false`.
  - `service_role`: `can_select = true`, `can_insert = true`, `can_update = true`, `can_delete = true`.

---

## 1. Arquitetura e Decisões de Engenharia

### 1.1. Fail-Fast Real e Transacionalidade
- **Fail-Fast Rigoroso:** O bloco `PRE-CHECK` investiga no catálogo de schemas (`information_schema.tables` e `pg_proc`) se a tabela `public.service_media` ou as funções `public.set_featured_service_media` e `public.set_service_media_updated_at` já existem. Em caso afirmativo, aborta com `RAISE EXCEPTION` antes de abrir a transação.
- **Transacional (`BEGIN...COMMIT`):** A criação de tabela, constraints, índices, triggers, funções RPC e políticas RLS é executada como uma unidade atômica no PostgreSQL.
- **Instruções de Rollback:** Script comentado no final do arquivo permitindo reversão controlada caso necessário.

### 1.2. Constraints e Regras de Negócio no Banco
1. **Allowlist Canônica de Serviços (`chk_service_media_service_key`):**
   Apenas as 12 chaves canônicas de serviços registradas no projeto são aceitas:
   `redes_janelas`, `redes_sacadas`, `redes_pets`, `redes_criancas`, `redes_escadas`, `telas_janelas`, `telas_portas`, `telas_sacadas`, `telas_removiveis`, `pet_screen`, `telas_restaurantes`, `vidracaria`.
2. **Consistência de MIME (`chk_service_media_type_mime_consistency`):**
   - `photo`: aceita exclusivamente `image/webp`, `image/jpeg`, `image/png` (AVIF removido na V1 por não ter parser de Magic Bytes implementado no backend).
   - `video`: aceita `video/mp4`, `video/webm`.
3. **Dimensões Obrigatórias (`chk_service_media_dimensions`):**
   - `photo`: `width > 0` e `height > 0` obrigatórios (reservam a proporção correta e reduzem drasticamente o Cumulative Layout Shift - CLS das imagens durante o carregamento).
   - `video`: dimensões positivas ou nulas.
4. **Tamanho e Ordem:**
   - `file_size_bytes > 0` (`chk_service_media_size`).
   - `sort_order >= 0` (`chk_service_media_sort_order`).
5. **Alt Text Válido (`chk_service_media_alt_text`):**
   - Exige `length(trim(alt_text)) >= 3` e máximo 255 caracteres, impedindo strings vazias ou apenas com espaços.
6. **Padronização de Storage Key (`chk_service_media_storage_key_prefix`):**
   - Exige que o caminho no bucket R2 inicie obrigatoriamente com `services/{service_key}/`.
7. **Featured Apenas Foto (`chk_service_media_featured_photo_only`):**
   - Bloqueia vídeos de serem marcados como `is_featured = true`.
8. **No Máximo Uma Mídia Featured por Serviço (`idx_unq_service_media_featured`):**
   - Índice parcial `CREATE UNIQUE INDEX idx_unq_service_media_featured ON public.service_media (service_key) WHERE (is_featured = true);`. Garante que cada serviço possua no máximo 1 foto de destaque (0 ou 1).

---

## 2. Trigger de Atualização Automática (`updated_at`)

A função `public.set_service_media_updated_at()` opera sob o princípio do menor privilégio (**`SECURITY INVOKER`**) com `SET search_path = ''`. O trigger `trg_service_media_updated_at` atualiza o timestamp `updated_at = pg_catalog.now()` antes de qualquer mutação (`UPDATE`) em qualquer coluna da tabela. O trigger é a **única fonte de atualização automática** de `updated_at`.

---

## 3. Função RPC Atômica com Validação Prévia do Alvo

```sql
CREATE OR REPLACE FUNCTION public.set_featured_service_media(
    p_media_id UUID,
    p_service_key VARCHAR(64)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_target_exists BOOLEAN;
BEGIN
    -- 1. VALIDAÇÃO PRÉVIA: Verifica se a mídia alvo existe, pertence ao serviço e é foto
    SELECT EXISTS (
        SELECT 1 FROM public.service_media
        WHERE id = p_media_id 
          AND service_key = p_service_key 
          AND media_type = 'photo'
    ) INTO v_target_exists;

    IF NOT v_target_exists THEN
        RAISE EXCEPTION 'Mídia alvo % inválida para o serviço % (deve existir e ser do tipo photo)', p_media_id, p_service_key;
    END IF;

    -- 2. Remove flag featured de qualquer outra mídia do mesmo serviço (Trigger atualiza updated_at)
    UPDATE public.service_media
    SET is_featured = false
    WHERE service_key = p_service_key AND is_featured = true AND id <> p_media_id;

    -- 3. Define a nova mídia como featured (Trigger atualiza updated_at)
    UPDATE public.service_media
    SET is_featured = true
    WHERE id = p_media_id AND service_key = p_service_key;

    RETURN TRUE;
END;
$$;
```

### 3.1. Privilégios de Execução da RPC (Bloqueio Total do Navegador)
- `REVOKE ALL ON FUNCTION public.set_featured_service_media(UUID, VARCHAR) FROM PUBLIC, anon, authenticated;`
- `GRANT EXECUTE ON FUNCTION public.set_featured_service_media(UUID, VARCHAR) TO service_role;`
- A mutação ocorre exclusivamente através do backend Nitro com sessão administrativa autenticada.

---

## 4. Row Level Security (RLS) e Políticas de Acesso

- `DIRECT_BROWSER_ADMIN_MUTATION = NONE`: Nenhuma operação de `INSERT`, `UPDATE` ou `DELETE` é permitida diretamente pelo cliente Supabase do navegador.
- **Visitantes Anônimos (`anon`) e Usuários Autenticados (`authenticated`):** Concedido apenas `SELECT` restrito a `is_active = true`.
- **Backend do Sistema (`service_role`):** Controle total concedido apenas a chamadas server-side protegidas.

---

## 5. Validação de Magic Bytes e Contrato de Upload

No endpoint futuro de finalização (`POST /api/admin/media/site/finalize-upload`), o backend valida o arquivo no Cloudflare R2 usando `HeadObjectCommand` e leitura Range GET de 512 bytes:

| Formato | MIME Type | Magic Bytes / Assinatura de Arquivo |
|---|---|---|
| **JPEG** | `image/jpeg` | `FF D8 FF` |
| **PNG** | `image/png` | `89 50 4E 47 0D 0A 1A 0A` |
| **WebP** | `image/webp` | Offset 0: `52 49 46 46` (RIFF) + Offset 8: `57 45 42 50` (WEBP) |
| **MP4** | `video/mp4` | Offset 4: `66 74 79 70` (ftyp) |
| **WebM** | `video/webm` | `1A 45 DF A3` (EBML Header) |

---

## 6. Limites Operacionais e Política de CORS

- `SITE_MEDIA_MAX_PHOTO_BYTES`: **10 MB** (10.485.760 bytes).
- `SITE_MEDIA_MAX_VIDEO_BYTES`: **50 MB** (52.428.800 bytes).
- `SITE_MEDIA_MAX_FILES_PER_UPLOAD`: **10** arquivos por lote.
- **CORS no Cloudflare R2 (`adtelas-site-media`):**
  ```json
  [
    {
      "AllowedOrigins": [
        "https://www.adtelasmosquiteiras.com.br",
        "https://adtelasmosquiteiras.com.br",
        "http://localhost:3000",
        "http://localhost:3001"
      ],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedHeaders": ["Content-Type", "Cache-Control"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
  ```
- *Ação Humana Obrigatória:* `REMOVE_LOCALHOST_CORS_BEFORE_FINAL_PRODUCTION = YES` (remover origens localhost das regras de CORS antes do deploy final em produção).

---

## 7. Estratégia de Cache e Deleção Segura

- **Cache:** `Cache-Control: public, max-age=31536000, immutable` com nomes de arquivos versionados por UUID (`services/{service_key}/{uuid}.webp`).
- **Deleção Segura:**
  1. O backend valida a sessão de administrador.
  2. Executa `DeleteObjectCommand` no Cloudflare R2 (`adtelas-site-media`).
  3. Após confirmação do R2, executa `DELETE` na tabela `public.service_media`.
  4. Caso o R2 falhe, a deleção no banco é abortada para manter consistência e permitir nova tentativa.
- `IMMEDIATE_CDN_PURGE_IMPLEMENTED = NO` (como os UUIDs são imutáveis, arquivos novos recebem novas URLs automaticamente).

---

## 8. Matriz de Responsividade Permanente

A futura interface de galeria pública (`ServicePublicGallery.vue`) e o painel de gerenciamento (`/admin/galeria`) respeitam os breakpoints do projeto:
- **Mobile Pequeno:** 320px, 360px, 375px, 390px, 412px, 430px (zero overflow horizontal, touch targets >= 44px, safe-area-insets).
- **Tablet:** 768px, 1024px.
- **Desktop:** 1280px, 1920px (lightbox com zoom via mouse wheel, drag-and-drop e navegação por teclado).

---

## 9. Conjunto de Validações POST-CHECK (Read-Only)

O script `009_service_media_storage.sql` inclui 11 queries para validação pós-execução no Supabase SQL Editor:
1. `information_schema.tables`: Confirma criação da tabela `public.service_media`.
2. `information_schema.columns`: Valida tipos de dados e nulabilidade das 17 colunas (`id`, `service_key`, `storage_key`, `media_type`, `mime_type`, `title`, `alt_text`, `caption`, `sort_order`, `is_featured`, `is_active`, `width`, `height`, `file_size_bytes`, `created_by`, `created_at`, `updated_at`).
3. `pg_constraint`: Valida as constraints da tabela: PK (`id`), FK (`created_by`), UNIQUE (`storage_key`) e as 9 CHECK constraints de negócio (`service_key`, `type`, `type_mime_consistency`, `dimensions`, `size`, `sort_order`, `alt_text`, `storage_key_prefix`, `featured_photo_only`).
4. `pg_indexes`: Valida índice parcial UNIQUE (`idx_unq_service_media_featured`) e índices de busca (`idx_service_media_public_gallery`, `idx_service_media_created_at`).
5. `information_schema.triggers`: Valida trigger `trg_service_media_updated_at`.
6. `information_schema.routines`: Valida tipo de segurança das rotinas (`SECURITY INVOKER` para trigger, `SECURITY DEFINER` para RPC).
7. `information_schema.role_table_grants`: Valida concessões RLS.
8. `pg_policies`: Valida políticas de SELECT público e ALL para service_role.
9. `pg_class.relrowsecurity`: Prova que `relrowsecurity = true` na tabela.
10. `has_function_privilege`: Prova que `anon` e `authenticated` recebem `false` e `service_role` recebe `true` para execução das rotinas.
11. `has_table_privilege`: Prova que `anon` e `authenticated` possuem apenas `can_select = true` e zero permissão de mutação.

