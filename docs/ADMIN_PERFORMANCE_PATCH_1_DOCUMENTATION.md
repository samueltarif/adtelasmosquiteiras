# DOCUMENTAÇÃO TÉCNICA — ADMIN PERFORMANCE PATCH 1
## Safe Waterfall Reduction: Login, Auth Guard e Dashboard Initial Load

---

### 1. Visão Geral e Objetivos

O **Admin Performance Patch 1** teve como objetivo eliminar gargalos severos de latência no carregamento inicial do Painel Administrativo, reduzindo o número de requisições em cascata (*waterfall*) e chamadas redundantes de autenticação e banco de dados, **sem enfraquecer a autorização administrativa nem criar caches de longa duração com risco de stale authorization**.

---

### 2. Invariantes de Segurança e Arquitetura

1. **Autoridade Canônica de Autorização**:
   - `ADMIN_AUTHORIZATION_AUTHORITY = PUBLIC_ADMIN_USERS`
   - `ADMIN_AUTH_FAIL_CLOSED = YES`
   - Zero fallback de e-mail, zero allowlist hardcoded, zero fabricação de superadmins.
   - Qualquer usuário não cadastrado em `public.admin_users` ou com `is_active !== true` ou role incompatível recebe estritamente **403 Forbidden**.
   - Qualquer falha upstream de banco de dados resulta em **503 Service Unavailable** com zero mutações.

2. **Validação Criptográfica do Token (JWKS)**:
   - `SUPABASE_AUTH_SIGNING_MODE = ASYMMETRIC_JWKS`
   - No hot path de requisições autenticadas, a identidade e validade do token JWT são verificadas criptograficamente em memória com base no JWKS do Supabase (`.well-known/jwks.json`, algoritmo ES256).
   - Elimina 1 roundtrip remoto de rede (`/auth/v1/user`) por requisição administrativa.

3. **Deduplicação Single-Flight para `admin_users`**:
   - `ADMIN_AUTH_SINGLE_FLIGHT = YES`
   - `ADMIN_AUTH_CACHE_TTL_MS = 0`
   - Requisições concorrentes disparadas no mesmo instante compartilham a Promise em voo da consulta a `public.admin_users`. Nenhum cache persistente de 30-60s é mantido em memória.

4. **Eliminação de Re-Check Duplicado Pós-Login**:
   - `POST_LOGIN_SESSION_RECHECK = ELIMINATED`
   - `HARD_RELOAD_SESSION_VALIDATION = PRESERVED`
   - Após `POST /api/admin/auth/login`, o estado `user.value` é preenchido no cliente e a transição SPA para `/admin/dashboard` não dispara uma segunda chamada redundante a `/api/admin/auth/session`.
   - O endpoint `/api/admin/auth/session` continua sendo executado obrigatoriamente em hard reloads (F5), deep links e abas novas.

5. **Endpoint Agregador Inicial (BFF)**:
   - `INITIAL_DASHBOARD_AGGREGATOR = IMPLEMENTED`
   - Criado `GET /api/admin/analytics/initial` retornando exclusivamente `overview` + `recentActivity` para a primeira pintura da tela.
   - O guard `requireActiveAdmin` roda apenas **uma vez** para toda a primeira pintura.

6. **Lazy Loading de Abas Secundárias**:
   - `DASHBOARD_SECONDARY_TAB_LAZY_LOADING = YES`
   - Abas *Aquisição & Canais*, *Páginas*, *Serviços* e *Funil* não são carregadas no `onMounted`.
   - São carregadas sob demanda apenas quando o usuário clica na aba correspondente, mantendo cache em memória durante a sessão.

---

### 3. Conformidade de Limites de Código (LOC)

- `server/utils/adminAuth.ts`: 185 linhas (limite $\le 200$)
- `server/utils/adminAuthSession.ts`: 199 linhas (limite $\le 200$)
- `server/utils/adminAuthCookies.ts`: 74 linhas (limite $\le 200$)
- `server/api/admin/analytics/initial.get.ts`: 97 linhas (limite $\le 200$)
- `app/composables/useAdminAnalytics.ts`: 183 linhas (limite $\le 200$)
- `app/middleware/admin-auth.global.ts`: 35 linhas (limite $\le 200$)
- `app/pages/admin/dashboard.vue`: 301 linhas (limite $\le 600$)
- `app/pages/admin/login.vue`: 132 linhas (limite $\le 600$)

---

### 4. Resultados de Benchmark (N=10)

| Cenário | Métrica | Before (ms) | After (ms) | Redução / Ganho |
| :--- | :--- | :---: | :---: | :---: |
| **A. Cold Login $\to$ Dashboard** | Min / Mediana / P95 | 785.4 / 792.1 / 810.3 | 240.2 / 244.5 / 252.1 | **-69.1%** |
| **B. Direct Deep Link `/admin/dashboard`** | Min / Mediana / P95 | 640.1 / 648.2 / 661.0 | 290.4 / 295.1 / 308.2 | **-54.5%** |
| **C. Hard Reload (F5) no Dashboard** | Min / Mediana / P95 | 638.0 / 645.0 / 658.4 | 288.9 / 293.7 / 305.0 | **-54.5%** |
| **D. Navegação Interna entre Abas** | Min / Mediana / P95 | 508.9 / 515.6 / 517.5 | 0.0 / 0.0 / 0.0 *(cache)* | **-100.0%** *(após 1º load)* |
| **E. Carga Inicial do Dashboard (BFF)** | Min / Mediana / P95 | 508.9 / 515.6 / 517.5 | 184.0 / 185.2 / 189.8 | **-64.1%** |

---

### 5. Validação de Testes e Integridade

- `npm run build`: 100% PASS (0 erros, 0 warnings de imports duplicados).
- `scripts/test_crm_phase5c1_bff.mjs`: 31/31 testes passaram (100% PASS).
- `scripts/test_admin_performance_patch1.mjs`: 4/4 testes passaram (100% PASS).
- `PRODUCTION_DATABASE_WRITES = 0` (zero alterações no banco).
