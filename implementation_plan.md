# Implementation Plan (DEFINITIVO) — LEAD MEDIA STORAGE + ADMIN MEDIA GALLERY + DATA-ONLY EMAIL

**Projeto:** AD Telas e Redes (`https://www.adtelasmosquiteiras.com.br`)  
**Fase:** Lead Media Storage + Admin Media Gallery + Data-Only Email (Ajustes Finais de Continuidade, Recuperação e Isolamento)  
**Status:** `READY_FOR_HUMAN_REVIEW` (Nenhuma implementação iniciada, nenhum SQL executado, nenhuma alteração em Cloudflare e nenhum deploy realizado).  

---

## User Review Required

> [!IMPORTANT]
> **AÇÃO MANUAL NECESSÁRIA NO SUPABASE (`007_lead_media_storage.sql`)**:
> - O script [`supabase/manual/007_lead_media_storage.sql`](file:///d:/sicons/ADT/supabase/manual/007_lead_media_storage.sql) estrutura a tabela `public.lead_media` com a máquina de estados completa (`pending`, `finalizing`, `uploaded`, `failed`, `deleted`), coluna `finalizing_at` para recuperação de stale locks, constraints `UNIQUE(storage_key)`, `UNIQUE(lead_id, client_media_id)` e bloqueio absoluto de acesso anônimo (`ANON_LEAD_MEDIA_ACCESS = DENIED`).
> - **NÃO será executado automaticamente via MCP**. Permanece estático aguardando sua auditoria e execução manual no SQL Editor do Supabase oficial.
> - `SUPABASE_MCP_WRITES = 0`.

> [!IMPORTANT]
> **AÇÕES MANUAIS NECESSÁRIAS NO CLOUDFLARE R2 (`MANUAL_CLOUDFLARE_ACTION_REQUIRED = YES`)**:
> 1. **Bucket Privado Dedicado:** Bucket `adtelas-leads-private` com `LEAD_MEDIA_BUCKET_PUBLIC_ACCESS = DISABLED` (zero `r2.dev` e zero custom domain público).
> 2. **Configuração de CORS:** CORS restrito às origens de produção (`https://www.adtelasmosquiteiras.com.br`) ou origens locais em desenvolvimento, método `PUT`, headers `Content-Type` e `x-amz-*`.
> 3. **Lifecycle Rule Restrita a Temporários:** Regra de expiração de 24 horas configurada **estritamente para o prefixo `tmp/leads/`**.

---

## 1. Decisões de Segurança e Resiliência (`SECURITY_AND_RESILIENCE_DECISIONS`)

```
LEAD_CREATION_ORDER:                           FIRST (O lead é criado e persistido antes de qualquer upload ou objeto R2)
EMAIL_DELIVERY_DEPENDS_ON_MEDIA:               NO (Notificação por e-mail DATA-ONLY é disparada imediatamente na criação do lead)

DUPLICATE_SEND_LEAD_MEDIA_CONTINUATION:        SUPPORTED (Retry com mesmo submission_id permite continuar uploads)
IDEMPOTENT_RESPONSE_RETURNS_LEAD_ID:          YES (Localiza lead existente e retorna leadId)
IDEMPOTENT_RESPONSE_RETURNS_FRESH_UPLOAD_TOKEN: YES (Gera novo uploadToken de 15 min para o browser continuar)
DUPLICATE_RESPONSE_RESENDS_EMAIL:              NO (Zero reenvio de e-mail em retry idempotente)

MEDIA_UPLOAD_AUTH_METHOD:                      SIGNED_UPLOAD_TOKEN_HMAC_SHA256 (Token assinado após salvar o lead)
MEDIA_UPLOAD_TOKEN_TTL:                        15_MINUTES
MEDIA_UPLOAD_RATE_LIMIT:                       10_REQUESTS_PER_MINUTE_PER_IP (Proteção de camada de aplicação)
MEDIA_UPLOAD_QUOTA_METHOD:                     SERVER_LEAD_MEDIA_COUNT_AND_SIZE_VALIDATION (Max 4 fotos, 2 vídeos, 50MB total)

MEDIA_UPLOAD_SIGNING_SECRET_METHOD:            DEDICATED_SERVER_SECRET (Variável MEDIA_UPLOAD_SIGNING_SECRET exclusiva server-side)
SUPABASE_KEY_REUSED_FOR_MEDIA_HMAC:            NO (Chave do Supabase NÃO é reutilizada para assinar tokens de upload)

CURRENT_R2_BUCKET_PUBLIC:                      SEPARATE_FROM_LEAD_STORAGE (Mídia pública do site não se mistura com leads)
LEAD_MEDIA_BUCKET:                             adtelas-leads-private
LEAD_MEDIA_BUCKET_PUBLIC_ACCESS:               DISABLED (Zero r2.dev, zero custom domain público)
R2_CORS_REQUIRED:                              YES
R2_CORS_ENVIRONMENT_STRATEGY:                  STRICT_ENV_DRIVEN_ORIGINS
R2_PRODUCTION_ALLOWED_ORIGINS:                 ["https://www.adtelasmosquiteiras.com.br"]
R2_DEVELOPMENT_ALLOWED_ORIGINS:                ["http://localhost:*", "http://127.0.0.1:*"]
CSP_R2_HOST_STRATEGY:                          SPECIFIC_ACCOUNT_R2_HOSTNAME_WHEN_AVAILABLE

MEDIA_TEMP_PREFIX:                             tmp/leads/{leadId}/{uuid}.{ext}
MEDIA_FINAL_PREFIX:                            leads/{leadId}/{uuid}.{ext}
MEDIA_PROMOTION_METHOD:                        COPY_OBJECT_THEN_DELETE_TEMP (Promove objeto válido e remove temporário)
R2_LIFECYCLE_PREFIX:                           tmp/leads/ (Atua EXCLUSIVAMENTE sobre uploads temporários abandonados)
VALID_MEDIA_RETENTION:                         PENDING_BUSINESS_RETENTION_POLICY (Nunca expirar automaticamente leads/)

MEDIA_DB_STATE_MACHINE:                        PENDING_FINALIZING_UPLOADED_FAILED_DELETED
FINALIZING_TIMESTAMP_FIELD:                    finalizing_at (TIMESTAMPTZ NULL em public.lead_media)
FINALIZING_STALE_TIMEOUT:                      10_MINUTES (Threshold determinístico para recuperação de crashes)
FINALIZE_CONCURRENCY_CONTROL:                  ATOMIC_UPDATE_PENDING_TO_FINALIZING_RETURNING_ROW
STALE_FINALIZING_RECOVERY_METHOD:              R2_STATE_AUDIT_BEFORE_RECLAIM (Audita R2 tmp/final antes de reprocessar)

MEDIA_PROMOTION_TRANSACTION_STRATEGY:          VERIFY_TEMP_COPY_TO_FINAL_CONFIRM_DB_THEN_DELETE_TEMP
DB_UPDATE_FAILURE_COMPENSATION:                DELETE_PROMOTED_FINAL_OBJECT_AND_SET_FAILED
TEMP_DELETE_FAILURE_BEHAVIOR:                  SAFE_FALLTHROUGH_HANDLED_BY_TMP_LIFECYCLE_24H

MEDIA_IDEMPOTENCY_METHOD:                      UNIQUE_LEAD_ID_CLIENT_MEDIA_ID (Constraint unq_lead_media_lead_client_media_id)
MEDIA_STORAGE_KEY_UNIQUENESS:                  UUID_V4_STORAGE_KEY_UNIQUE_CONSTRAINT (unq_lead_media_storage_key)
POST_UPLOAD_VERIFICATION:                      HEAD_OBJECT_AND_RANGE_MAGIC_BYTES_VERIFICATION (HeadObject + Magic Bytes check)
INVALID_OBJECT_CLEANUP:                        IMMEDIATE_DELETE (Delete imediato do R2 temporário se falhar na verificação)

AUTHORIZE_UPLOAD_IDEMPOTENCY:                  REUSE_EXISTING_PENDING_STORAGE_KEY_FOR_SAME_CLIENT_MEDIA_ID
FINALIZE_UPLOAD_IDEMPOTENCY:                   IDEMPOTENT_SUCCESS_IF_ALREADY_UPLOADED

AUTHORITATIVE_UPLOAD_QUOTA:                    DATABASE_AND_SIGNED_TOKEN (Contagem autoritativa em public.lead_media)
IP_RATE_LIMIT_STORAGE_METHOD:                  BEST_EFFORT (Sem dependência de Redis adicional nesta fase)

EXISTING_LEAD_STATUS_TAXONOMY:                 Novo, Em Atendimento, Orçado, Fechado, Perdido
NEW_LEAD_DEFAULT_COMMERCIAL_STATUS:            Novo (Preserva exatamente o padrão atual de public.leads.status)

ADMIN_AUTH_IMPLEMENTATION:                     DEFERRED_BY_USER (Implementação de login/sessão admin adiada pelo usuário)
MEDIA_STORAGE_BEFORE_ADMIN_AUTH:               ALLOWED (Uploads e metadados funcionam normalmente em background)
MEDIA_PRIVATE_VIEWING_BEFORE_ADMIN_AUTH:       DENIED (Endpoints retornam 401/403 até autenticação real existir)
MEDIA_PRIVATE_DOWNLOAD_BEFORE_ADMIN_AUTH:      DENIED (Endpoints retornam 401/403 até autenticação real existir)
ADMIN_SECRET_BYPASS:                           NONE (Zero bypass por secret estático ou token de query)
ADMIN_MEDIA_METADATA_AUTH_REQUIRED:            YES
UNAUTHENTICATED_MEDIA_METADATA_ACCESS:         DENIED
UNAUTHENTICATED_MEDIA_BINARY_ACCESS:           DENIED

SIGNED_URL_AUTHORITY:                          /api/admin/media/signed-url (Único ponto gerador de signed GET)
LEAD_JOURNEY_RETURNS_SIGNED_URLS:              NO (Retorna apenas metadados técnicos sob autenticação)
SIGNED_GET_URL_TTL:                            300_SECONDS (5 minutos, gerada sob demanda no Admin)

CSP_CONNECT_SRC:                               https://*.r2.cloudflarestorage.com
CSP_IMG_SRC:                                   https://*.r2.cloudflarestorage.com blob: data:
CSP_MEDIA_SRC:                                 https://*.r2.cloudflarestorage.com blob:

ORPHAN_MEDIA_CLEANUP_METHOD:                   R2_LIFECYCLE_RULE_ON_TMP_PREFIX_AND_SERVER_SCHEDULED_PURGE
ABANDONED_UPLOAD_RETENTION:                    24_HOURS (Somente para tmp/leads/)
DELETED_LEAD_MEDIA_BEHAVIOR:                   DELETE_OBJECTS_FROM_R2_VIA_SERVER_THEN_DB

LEAD_MEDIA_RLS:                                ENABLED (Revogado acesso anon e authenticated; exclusivo service_role server-side)
ANON_LEAD_MEDIA_ACCESS:                        DENIED
CLIENT_DIRECT_SUPABASE_MEDIA_ACCESS:           NO

PRIVACY_POLICY_UPDATE_REQUIRED:                YES (Documentar finalidade de orçamento, armazenamento seguro e direitos do titular)
PRIVACY_RETENTION_DECISION_REQUIRED:           YES (Decisão humana para política de retenção de orçamentos)

SMTP_PRODUCTION_READINESS:                     PENDING_MANUAL_VALIDATION_BLOCKER (Requer 1 teste manual real pelo operador antes do deploy)

NAME_REQUIRED:                                 YES (trim, min 2 chars, client e server 400)
PHONE_REQUIRED:                                YES (normalizado, 10-11 dígitos, client e server 400)
EMAIL_REQUIRED:                                NO (opcional, validado se preenchido)

EMAIL_MEDIA_CLAIM:                             NONE (Zero alegação de mídia disponível no e-mail)
CUSTOMER_MEDIA_EMAIL_ATTACHMENTS:              NONE (Zero fotos, zero vídeos, zero Base64, zero URLs privadas no e-mail)

MOV_UPLOAD_SUPPORT:                            ALLOWED_WITH_FALLBACK
MOV_BROWSER_PLAYBACK_GUARANTEE:                NO_HTML5_GUARANTEE_FALLBACK_TO_DOWNLOAD

SQL_007_READY_FOR_HUMAN_REVIEW:                YES
SQL_007_EXECUTED:                              NO

MANUAL_SUPABASE_ACTION_REQUIRED:               YES (Execução manual do SQL 007 pelo operador)
MANUAL_CLOUDFLARE_ACTION_REQUIRED:             YES (CORS e Lifecycle em tmp/leads/ no bucket privado R2)
SUPABASE_MCP_WRITES:                           0

PRODUCTION_CHANGED:                            NO (Nenhum deploy realizado)
DATABASE_CHANGED:                              NO (Nenhum SQL executado)
```

---

## 2. Máquina de Estados e Recuperação de Stale Locks

### 2.1. Sequência Atômica com Recuperação de Crash
```
1. ATOMIC ACQUISITION NO POSTGRESQL:
   UPDATE public.lead_media
   SET upload_status = 'finalizing', finalizing_at = now()
   WHERE lead_id = $1 AND client_media_id = $2
     AND (
       upload_status = 'pending'
       OR (upload_status = 'finalizing' AND finalizing_at < now() - INTERVAL '10 minutes')
     )
   RETURNING *;

   ├── Se 0 linhas retornadas:
   │   ├── Se status é 'uploaded' ➔ Retorna { success: true, idempotent: true } imediato.
   │   ├── Se status é 'finalizing' (< 10 min) ➔ Retorna 202 Accepted (processamento em andamento).
   │   └── Se status é 'failed' ➔ Retorna erro correspondente.
   └── Se 1 linha retornada ➔ Obteve lock com sucesso, prossegue para auditoria de R2.

2. AUDITORIA DETERMINÍSTICA DO ESTADO DO R2 (Recuperação de Crash):
   ├── Cenário A (Crash antes do CopyObject):
   │   Objeto temporário existe em tmp/leads/ e destino final NÃO existe em leads/
   │   ➔ Executa validação de Magic Bytes e prossegue com a cópia normal.
   ├── Cenário B (Crash após CopyObject, antes do UPDATE no banco):
   │   Objeto final já existe íntegro em leads/
   │   ➔ Valida objeto final, atualiza banco para 'uploaded' e deleta temporário.
   └── Cenário C (Crash após UPDATE no banco, antes do Delete temp):
   │   Banco já estaria como 'uploaded', tratado na verificação de 0 linhas acima.

3. PROMOÇÃO NO R2 (tmp/ ➔ leads/):
   CopyObjectCommand: tmp/leads/{leadId}/{uuid}.{ext} ➔ leads/{leadId}/{uuid}.{ext}
   HeadObjectCommand no destino final para confirmação.

4. PERSISTÊNCIA NO BANCO:
   UPDATE public.lead_media
   SET storage_key = finalKey, upload_status = 'uploaded', verified_at = now()
   WHERE lead_id = $1 AND client_media_id = $2;
   ├── Se o UPDATE no banco falhar:
   │   ├── COMPENSAÇÃO: DeleteObjectCommand no objeto promovido leads/{leadId}/{uuid}.{ext}
   │   └── UPDATE public.lead_media SET upload_status = 'failed'
   └── Se o UPDATE no banco tiver sucesso ➔ Prossegue.

5. LIMPEZA DO TEMPORÁRIO:
   DeleteObjectCommand em tmp/leads/{leadId}/{uuid}.{ext}
   (Se falhar, o arquivo final já é válido e o temporário será expurgado pelo Lifecycle 24h).
```

---

## 3. Detalhamento dos Componentes a Serem Implementados

### Componente 1: Segurança, Tokens e Storage R2 Privado

#### [NEW] [server/utils/mediaAuth.ts](file:///d:/sicons/ADT/server/utils/mediaAuth.ts)
- Funções puras e seguras:
  - `createMediaUploadToken({ leadId, submissionId, maxFiles, maxBytes })`: gera token HMAC-SHA256 utilizando estritamente a variável de ambiente `MEDIA_UPLOAD_SIGNING_SECRET` com expiração de 15 minutos.
  - `verifyMediaUploadToken(token)`: valida assinatura, integridade e expiração do token.

#### [NEW] [server/utils/r2Storage.ts](file:///d:/sicons/ADT/server/utils/r2Storage.ts)
- Utilitário S3 para o bucket privado `adtelas-leads-private`:
  - `generatePresignedUploadUrl(tempStorageKey, mimeType, expiresInSeconds)`: gera Presigned PUT URL.
  - `generatePresignedDownloadUrl(finalStorageKey, expiresInSeconds)`: gera Presigned GET URL (TTL 300s).
  - `verifyAndPromoteObject({ tempKey, finalKey, expectedMime, maxBytes })`: executa verificação de `HeadObject` + Magic Bytes, promove o arquivo com `CopyObjectCommand` e deleta o temporário.
  - `deleteObjectImmediately(key)`: limpeza imediata de arquivos inválidos ou compensação de falhas no banco.
  - `deleteLeadObjectsFromR2(storageKeys)`: limpeza em lote para exclusão de leads.

#### [NEW] [server/api/media/authorize-upload.post.ts](file:///d:/sicons/ADT/server/api/media/authorize-upload.post.ts)
- Exige `Authorization: Bearer <uploadToken>`.
- Valida tipo MIME permitido e limites por lead (`maxFiles: 6`, `maxBytes: 50MB`).
- Idempotente: se `(lead_id, client_media_id)` já existir como `pending`, reutiliza a chave temporária.
- Registra status `pending` sob chave temporária `tmp/leads/...`.
- Retorna URL assinada para upload direto.

#### [NEW] [server/api/media/finalize-upload.post.ts](file:///d:/sicons/ADT/server/api/media/finalize-upload.post.ts)
- Exige `Authorization: Bearer <uploadToken>`.
- Executa a transição atômica `pending` ➔ `finalizing` com `finalizing_at`, auditoria de recuperação de stale locks, compensação em falha de banco e idempotência garantida.

---

### Componente 2: E-mail Data-Only e Orquestração

#### [MODIFY] [server/shared/leadEmailCore.mjs](file:///d:/sicons/ADT/server/shared/leadEmailCore.mjs)
- Validação estrita de campos obrigatórios:
  - `Nome`: trim, length >= 2 caracteres.
  - `Telefone`: normalizado, 10 ou 11 dígitos.
- E-mail estritamente **DATA-ONLY**:
  - `CUSTOMER_MEDIA_EMAIL_ATTACHMENTS = NONE`.
  - `EMAIL_MEDIA_CLAIM = NONE` (zero afirmações sobre existência ou disponibilidade de mídia no template).
  - Logotipo oficial mantido exclusivamente via CID (`cid:adtelas-icon`).
  - Zero URLs privadas ou assinadas no corpo do e-mail.

#### [MODIFY] [server/utils/emailService.ts](file:///d:/sicons/ADT/server/utils/emailService.ts)
- Atualização para envio exclusivo de dados e branding CID (sem anexos de clientes).

#### [MODIFY] [server/api/send-lead.post.ts](file:///d:/sicons/ADT/server/api/send-lead.post.ts)
- Cria lead no banco com `status = 'Novo'` (`NEW_LEAD_DEFAULT_COMMERCIAL_STATUS`).
- Dispara a notificação de e-mail DATA-ONLY imediatamente.
- **Tratamento de Idempotência e Continuidade de Upload (`DUPLICATE_SEND_LEAD_MEDIA_CONTINUATION`):**
  - Se `submission_id` já existir: localiza o lead existente, **NÃO reenvia e-mail**, gera um novo `uploadToken` válido de 15 minutos e retorna `{ success: true, idempotent: true, leadSaved: true, leadId, submissionId, uploadToken }`, permitindo que o browser prossiga com uploads interrompidos.

---

### Componente 3: Painel Admin e Galeria Privada

#### [NEW] [server/api/admin/media/signed-url.get.ts](file:///d:/sicons/ADT/server/api/admin/media/signed-url.get.ts)
- **Autoridade Centralizada de URLs Assinadas (`SIGNED_URL_AUTHORITY`).**
- Como a autenticação administrativa está adiada (`ADMIN_AUTH_IMPLEMENTATION = DEFERRED_BY_USER`), retorna estritamente `401 Unauthorized` (`MEDIA_PRIVATE_VIEWING_BEFORE_ADMIN_AUTH = DENIED`).
- Zero bypass por admin secret ou token de query.

#### [MODIFY] [server/api/admin/analytics/lead-journey.get.ts](file:///d:/sicons/ADT/server/api/admin/analytics/lead-journey.get.ts)
- Como a autenticação administrativa está adiada (`ADMIN_MEDIA_METADATA_AUTH_REQUIRED = YES`), não expõe metadados de mídia para requisições não autenticadas (`UNAUTHENTICATED_MEDIA_METADATA_ACCESS = DENIED`).

#### [MODIFY] [app/components/admin/LeadJourneyDrawer.vue](file:///d:/sicons/ADT/app/components/admin/LeadJourneyDrawer.vue)
- Seção **ARQUIVOS DO CLIENTE**:
  - Preparada com estrutura completa de galeria, lightbox e player HTML5, que permanecerá em estado seguro até a ativação da autenticação administrativa futura.

---

### Componente 4: Frontend e Formulários Comerciais

#### [MODIFY] [app/components/MediaUploader.vue](file:///d:/sicons/ADT/app/components/MediaUploader.vue)
- Suporte a fotos (JPEG, PNG, WebP) e vídeos (MP4, WebM, MOV).
- Compressão client-side de fotos via Canvas (JPEG max 1280px, q=0.8).
- Validação client-side de vídeos (max 25MB cada, max 50MB total).
- Orquestrador de upload com estados visuais claros: `selected` ➔ `uploading` (com progresso) ➔ `uploaded` / `failed`.

#### [MODIFY] [app/pages/orcamento.vue](file:///d:/sicons/ADT/app/pages/orcamento.vue), [app/pages/contato.vue](file:///d:/sicons/ADT/app/pages/contato.vue) e [app/components/LeadForm.vue](file:///d:/sicons/ADT/app/components/LeadForm.vue)
- Validação estrita de Nome e Telefone no client (botão desabilitado se inválido).
- Fluxo: envia lead primeiro ➔ recebe `uploadToken` ➔ envia mídias diretamente ao R2 com feedback de progresso na tela ➔ redireciona para `/obrigado`.

#### [MODIFY] [nuxt.config.ts](file:///d:/sicons/ADT/nuxt.config.ts)
- Ajustes de CSP restritos ao endpoint do R2 derivado de variáveis de ambiente.

---

## 4. Matriz de Testes Isolados Planejada (`test-lead-email.mjs`)

Suite de testes 100% mockada em memória (sem chamadas reais a Gmail, Supabase ou Cloudflare R2):

1. `Nome ausente ➔ 400`
2. `Nome apenas com espaços em branco ➔ 400`
3. `Nome com menos de 2 caracteres ➔ 400`
4. `Telefone ausente ➔ 400`
5. `Telefone com menos de 10 dígitos ➔ 400`
6. `Nome e Telefone válidos ➔ Aceito (200) com status inicial 'Novo'`
7. `E-mail opcional vazio ➔ Aceito`
8. `Mensagem opcional vazia ➔ Aceito`
9. `Lead sem mídia ➔ Lead salvo com prioridade máxima + E-mail data-only disparado`
10. `Geração de uploadToken com HMAC e secret dedicado (TTL 15 min)`
11. `Upload com token inválido ou assinatura forjada ➔ 401/403 Denied`
12. `Upload com token expirado ➔ 401 Denied`
13. `Upload com submission_id inventado sem token ➔ Denied`
14. `Autorização de foto (JPEG/PNG/WebP) ➔ Presigned PUT em tmp/leads/ + status pending`
15. `Autorização de vídeo (MP4/WebM) ➔ Presigned PUT em tmp/leads/ + status pending`
16. `Autorização de tipo proibido (SVG, EXE, PDF, HTML) ➔ 400 Rejeitado`
17. `Autorização excedendo contagem (> 4 fotos ou > 2 vídeos) ➔ 400 Rejeitado`
18. `Autorização excedendo tamanho (> 25MB vídeo ou > 50MB total) ➔ 400 Rejeitado`
19. `Authorize idempotente: retry com mesmo (lead_id, client_media_id) ➔ Reutiliza chave pendente sem duplicar`
20. `Finalize atômico: adquire estado 'finalizing' com timestamp finalizing_at`
21. `Finalize concorrente: segunda requisição simultânea retorna 202 sem duplicar CopyObject`
22. `Recuperação de stale finalizing (> 10 min): audita R2 e recupera promoção pendente`
23. `Finalize com objeto válido no R2 ➔ Promove de tmp/leads/ para leads/, confirma banco e deleta temp`
24. `Finalize com falha no banco pós-cópia ➔ Executa compensação deletando objeto em leads/`
25. `Finalize com falha na deleção de temp ➔ Mantém arquivo final válido (resolvido por lifecycle tmp)`
26. `Finalize com objeto inexistente no R2 ➔ Deleta temp imediato e marca 'failed'`
27. `Finalize com Magic Bytes divergentes do MIME declarado ➔ Deleta temp imediato e marca 'failed'`
28. `Finalize com tamanho no R2 maior que o autorizado ➔ Deleta temp imediato e marca 'failed'`
29. `Finalize idempotente: se já estiver 'uploaded', retorna sucesso imediato`
30. `Retry de /api/send-lead com mesmo submission_id ➔ Não duplica lead, não reenvia e-mail e retorna novo uploadToken`
31. `Falha ou cancelamento no upload de mídia ➔ Lead comercial e e-mail permanecem 100% preservados`
32. `Abandono do browser durante upload de vídeo ➔ Lead salvo no banco e notificação comercial já enviada`
33. `Isolamento entre leads: Lead A não acessa e não lista mídias do Lead B`
34. `E-mail SMTP enviado com ZERO anexos de clientes (CUSTOMER_MEDIA_EMAIL_ATTACHMENTS = NONE)`
35. `E-mail SMTP não contém alegações sobre mídia disponível (EMAIL_MEDIA_CLAIM = NONE)`
36. `E-mail SMTP mantém anexo inline de branding CID (cid:adtelas-icon)`
37. `E-mail SMTP não contém Base64, URLs privadas ou assinadas do R2`
38. `Admin media metadata sem sessão administrativa ➔ 401/403 Denied`
39. `Admin media signed-url sem sessão administrativa ➔ 401/403 Denied`
40. `Exclusão de lead aciona remoção dos objetos correspondentes no R2`
41. `Página /obrigado não dispara novo e-mail nem repete uploads`
