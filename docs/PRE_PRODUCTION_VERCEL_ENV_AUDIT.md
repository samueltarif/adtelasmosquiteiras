# Relatório de Auditoria Pré-Deploy na Vercel & Configurações de Ambiente

**Data:** 25 de Agosto de 2026  
**Fase:** `PRE-PRODUCTION DEPLOY READINESS + VERCEL ENV AUDIT`  
**Status:** `AUDITADO E PRONTO PARA REVISÃO HUMANA (SEM DEPLOY AUTOMÁTICO)`

---

## 1. Checkpoint Git & Estado da Worktree

- **Branch Atual:** `master`
- **Rastreamento Remoto:** `origin/master` (Sincronizado até commit `237bb55`)
- **Arquivos Não Commitados (Fase de Lightbox):**
  - Modificado: `app/components/admin/LeadJourneyDrawer.vue`
  - Criado: `app/components/admin/MediaLightbox.vue`
  - Criado: `docs/ADMIN_MEDIA_FULLSCREEN_VIEWER.md`
  - Criado: `test-media-lightbox.mjs`
- **Git Push Automático:** `NÃO EXECUTADO` (Preservado para comando explícito do operador)

---

## 2. Auditoria Completa de Variáveis de Ambiente

| Nome da Variável | Obrigatória | Escopo de Execução | Presente Localmente (.env) | Obrigatória na Vercel | Descrição / Finalidade |
|---|---|---|---|---|---|
| `SUPABASE_URL` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | Chave com privilégios de serviço para operações backend isoladas de leads, analytics e admin lookup |
| `GMAIL_EMAIL` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | Conta de envio SMTP (`vendas.adtelaseredes@gmail.com`) |
| `GMAIL_APP_PASSWORD` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | Senha de app do Google de 16 dígitos válida para envio transacional |
| `LEAD_NOTIFICATION_EMAIL` | **NÃO** | `SERVER_ONLY` | NÃO (Usa fallback seguro) | **RECOMENDADO** | Destinatário dos alertas de novos leads (Padrão: `vendas.adtelaseredes@gmail.com`) |
| `R2_ACCOUNT_ID` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | Cloudflare Account ID para API S3 do bucket de mídias |
| `R2_ACCESS_KEY_ID` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | Chave de Acesso do Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | Chave Secreta do Cloudflare R2 |
| `R2_LEADS_BUCKET_NAME` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | Nome do bucket privado (`adtelas-leads-private`) |
| `MEDIA_UPLOAD_SIGNING_SECRET` | **SIM** | `SERVER_ONLY` | SIM | **SIM** | Chave secreta HMAC-SHA256 para emissão e validação de tokens de upload |
| `GA_MEASUREMENT_ID` | **SIM** | `PUBLIC` | SIM | **SIM** | ID de medição GA4 público (`G-S0038L1Q6R`) |
| `GA_API_SECRET` | NÃO | `SERVER_ONLY` | SIM (Opcional) | OPCIONAL | Chave de API do Measurement Protocol para envio server-side |
| `RESEND_API_KEY` | NÃO | `SERVER_ONLY` | SIM (Placeholder) | NÃO | Legado/Fallback |

---

## 3. Auditoria de Runtime Config e Bundle do Cliente

### 3.1. `nuxt.config.ts`
- **runtimeConfig (Privado):** Contém estritamente variáveis do lado do servidor (`gmailAppPassword`, `supabaseServiceRoleKey`, chaves de API).
- **runtimeConfig.public (Público):** Contém **apenas** `gaMeasurementId`.
- **CLIENT_SECRET_EXPOSURE:** `NO`

### 3.2. Varredura do Bundle (`.output/public`)
- Varredura em todos os chunks `.output/public/_nuxt/*.js` e source maps:
  - Nenhuma ocorrência de `service_role` ou chave JWT encontrada.
  - Nenhuma ocorrência de `secretAccessKey` do Cloudflare R2 encontrada.
  - Nenhuma ocorrência de `GMAIL_APP_PASSWORD` ou fragmento de senha encontrada.
  - Nenhuma ocorrência de `MEDIA_UPLOAD_SIGNING_SECRET` encontrada.
- **SECRET_FOUND_IN_CLIENT_BUNDLE:** `NO`

---

## 4. Checklist Manual de Configuração na Vercel

O operador deve cadastrar no dashboard da Vercel (**Project Settings > Environment Variables**):

### 4.1. Variáveis de Produção (`Production`)
1. `SUPABASE_URL` ➔ `https://axjqhxpejwkuabeaoyaz.supabase.co`
2. `SUPABASE_SERVICE_ROLE_KEY` ➔ *(Chave service_role secreta do Supabase)*
3. `GMAIL_EMAIL` ➔ `vendas.adtelaseredes@gmail.com`
4. `GMAIL_APP_PASSWORD` ➔ *(Senha de aplicativo Google de 16 caracteres válida)*
5. `LEAD_NOTIFICATION_EMAIL` ➔ `vendas.adtelaseredes@gmail.com`
6. `R2_ACCOUNT_ID` ➔ `871d1f3f3b1e573345d9bb791d4c5563`
7. `R2_ACCESS_KEY_ID` ➔ `f27d16e00886d5fba02a6ebd722660ff`
8. `R2_SECRET_ACCESS_KEY` ➔ *(Chave secreta R2 gerada no Cloudflare)*
9. `R2_LEADS_BUCKET_NAME` ➔ `adtelas-leads-private`
10. `MEDIA_UPLOAD_SIGNING_SECRET` ➔ `vKaCqUaU9HACr0ucUhqOBXPSxQjk90XpqTmo7WUMfB0=`
11. `GA_MEASUREMENT_ID` ➔ `G-S0038L1Q6R`

### 4.2. Ambientes de `Preview` e `Development`
- Para ambientes de Preview da Vercel, recomenda-se disponibilizar as mesmas variáveis de bucket e banco caso seja necessário testar uploads em branches de homologação. Se não for necessário, o `MEDIA_UPLOAD_SIGNING_SECRET` e `GMAIL_APP_PASSWORD` podem ser mantidos restritos a `Production`.

---

## 5. Cloudflare R2 & Origens Permitidas

- **Bucket:** `adtelas-leads-private` (100% privado, sem domínio público vinculado).
- **CORS Allowed Origins:**
  - `https://www.adtelasmosquiteiras.com.br`
  - `https://adtelasmosquiteiras.com.br`
- **R2_PRODUCTION_ORIGIN_READY:** `YES`

---

## 6. Supabase Auth — URLs de Redirecionamento em Produção

Ações humanas no painel do Supabase (**Authentication > URL Configuration**):
1. **Site URL:** Configurar para `https://www.adtelasmosquiteiras.com.br`
2. **Redirect URLs:** Adicionar:
   - `https://www.adtelasmosquiteiras.com.br/**`
   - `https://www.adtelasmosquiteiras.com.br/admin/**`
   - `https://adtelasmosquiteiras.com.br/**`
   - `http://localhost:3001/**` (para desenvolvimento local)
- **SUPABASE_AUTH_PRODUCTION_URL_REVIEW_REQUIRED:** `YES` (Requer conferência humana no dashboard do Supabase antes do primeiro login de produção).

---

## 7. Runtime Node.js na Vercel

- **Versão Local Atual:** Node.js v20.20.0
- **Versão Recomendada na Vercel:** `Node.js 20.x` (`nodejs20.x`)
- **Justificativa:** O runtime Node.js 20.x é o LTS estável padrão e suportado nativamente pelo Nitro e pela Vercel. O aviso futuro do AWS SDK aplica-se a versões publicadas após janeiro de 2027.
- **RECOMMENDED_VERCEL_NODE_RUNTIME:** `nodejs20.x`
- **NODE_RUNTIME_CHANGE_REQUIRED:** `NO`

---

## 8. Google Ads — Estado

- **Status:** `CONGELADO`
- **Detalhamento:** As tags de conversão do Google Ads permanecem inalteradas nesta fase e serão revistas em etapa dedicada pós-deploy.
- **GOOGLE_ADS_CHANGES_THIS_PHASE:** `NONE`

---

## 9. Resultados das Suítes de Testes Finais

- `node test-media-lightbox.mjs` ➔ **PASS (11/11)**
- `node test-mobile-responsiveness.mjs` ➔ **PASS (10 viewports / 28 asserções)**
- `node test-lead-email.mjs` ➔ **PASS (137/137)**
- `node test-admin-v2.mjs` ➔ **PASS (26/26)**
- `npx nuxi build` ➔ **✨ Build complete!**
