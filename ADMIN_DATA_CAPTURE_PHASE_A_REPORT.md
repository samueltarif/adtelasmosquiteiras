# RELATÓRIO DE EXECUÇÃO — FASE A & FASE A.1: CORREÇÃO E HARDENING DA CAPTURA DE DADOS

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-23  
**Fase:** Fase A.1 — Hardening e Validação Final de Fidelidade de Dados  
**Status:** `READY FOR REVIEW`

---

## 1. Before State (Estado Anterior Auditado)

1. **Leads Sintéticos em Cliques de WhatsApp:** O backend `/api/track-click` criava uma linha fake com `nome: "Lead WhatsApp (...)"` na tabela `public.leads` a cada clique no WhatsApp, telefone ou CTAs.
2. **Duplicação de Formulários (Double-Lead):** O plugin `track-clicks.client.ts` interceptava o clique no botão submit e chamava `/api/track-click` (criando 1 lead fake), enquanto a página chamava `/api/send-lead` (criando 1 lead real). 1 submit = 2 linhas em `leads`.
3. **Double Pageview no Carregamento Inicial:** `track-visits.client.ts` disparava 2 chamadas POST para `/api/track-visit` em qualquer F5 ou primeira página devido à colisão de hooks (`app:mounted` + `router.afterEach`).
4. **Dashboard Contaminado:** O painel admin contava os 23 registros legados como "Leads Totais".

---

## 2. Code Changes & Soluções Aplicadas (Fase A & A.1)

### A) Remoção Completa de Leads Sintéticos em `track-click.post.ts`
- **Arquivo Modificado:** [`server/api/track-click.post.ts`](file:///d:/sicons/ADT/server/api/track-click.post.ts)
- **Alteração:** Removido completamente o bloco que inseria linhas sintéticas na tabela `public.leads`.
- **Resultado:**
  - `WHATSAPP CLICK` ➔ `lead_clicks = +1`, `leads = +0`
  - `PHONE CLICK` ➔ `lead_clicks = +1`, `leads = +0`
  - `CTA CLICK` ➔ `lead_clicks = +1`, `leads = +0`

### B) Proteção Contra Double-Lead em Formulários & Idempotência Client-Side
- **Arquivos Modificados:** [`app/composables/useFormSubmit.js`](file:///d:/sicons/ADT/app/composables/useFormSubmit.js) & [`app/components/LeadForm.vue`](file:///d:/sicons/ADT/app/components/LeadForm.vue)
- **Alteração:** Adicionada trava de estado `if (isSubmitting.value) return` e `isSubmitting.value = true` durante o processamento para bloquear duplo clique, Enter repetido e retries simultâneos.
- **Resultado:**
  - `FORM SUBMIT` ➔ `leads (real) = +1`, `TOTAL_LEADS_CREATED = 1`

### C) Eliminação do Double Pageview em `track-visits.client.ts`
- **Arquivo Modificado:** [`app/plugins/track-visits.client.ts`](file:///d:/sicons/ADT/app/plugins/track-visits.client.ts)
- **Estratégia de Deduplicação:** `SAME_ROUTE_MEMOIZATION_LOCK` (Janela de 1000ms baseada em `lastTrackedPath` / `lastTrackedTime`). Navegações reais entre rotas distintas (ex: Rota A ➔ Rota B ➔ Rota A) são 100% preservadas.
- **Resultado:**
  - `HARD LOAD / F5` ➔ 1 pageview
  - `NAVEGAÇÃO NuxtLink` ➔ 1 pageview por nova rota
  - `BACK / FORWARD` ➔ 1 pageview
  - `NOVA ABA` ➔ 1 pageview

### D) Purificação do Painel Backend (`dashboard-stats.get.ts`)
- **Arquivo Modificado:** [`server/api/admin/dashboard-stats.get.ts`](file:///d:/sicons/ADT/server/api/admin/dashboard-stats.get.ts)
- **Alteração:** O backend agora filtra `realLeads` (`!nome.startsWith('Lead WhatsApp')`) e isola `legacySyntheticCount = 23`. O `CURRENT_ADMIN_TOTAL_LEADS` é retornado **LIMPO** (`totalLeads = realLeads.length`) sem alterar nem apagar nenhuma linha do banco de dados.

### E) Tabela Canônica de Pageviews
- `CANONICAL_PAGEVIEW_TABLE = public.page_views`
- Documentação sincronizada em [`docs/schema.sql`](file:///d:/sicons/ADT/docs/schema.sql).

---

## 3. Preservação dos Registros Históricos Legados

- `LEGACY_SYNTHETIC_LEADS = 23`
- `LEGACY_ROWS_DELETED = 0`
- **Diretriz:** Os 23 registros legados com `nome LIKE 'Lead WhatsApp%'` foram mantidos intactos no banco de dados para histórico auditável, mas isolados das métricas de leads reais.

---

## 4. Auditoria de RLS & Requisição Direta

- `PUBLIC_DIRECT_DB_INSERT_REQUIRED = NO` (Todos os disparos do frontend são intermediados por rotas Nitro API server-side usando a `service_role_key`).
- `MANUAL_SUPABASE_ACTION_REQUIRED = YES` (Gerado o script de segurança estático em [`supabase/manual/002_fix_admin_rls.sql`](file:///d:/sicons/ADT/supabase/manual/002_fix_admin_rls.sql)).
- `SUPABASE_MCP_WRITES = 0` (Nenhum comando SQL foi executado via Supabase MCP).

---

## 5. Controlled Test Matrix (Fase A.1)

| Código | Cenário de Teste | Ação Executada | Resultado Esperado | Status |
|---|---|---|---|:---:|
| **Teste A** | Abertura Direta da Home | GET `/` (Initial Load) | POST `/api/track-visit` ➔ HTTP 200 (1 pageview) | `PASS` |
| **Teste B** | F5 / Hard Reload | F5 na Home | POST `/api/track-visit` ➔ HTTP 200 (1 pageview) | `PASS` |
| **Teste C** | Navegação SPA Home ➔ Telas | NuxtLink `/` ➔ `/servicos/telas` | POST `/api/track-visit` ➔ HTTP 200 (1 pageview) | `PASS` |
| **Teste D** | Navegação SPA Telas ➔ Janelas | NuxtLink Telas ➔ `/servicos/telas/janelas` | POST `/api/track-visit` ➔ HTTP 200 (1 pageview) | `PASS` |
| **Teste E** | Browser Back | Histórico Back | POST `/api/track-visit` ➔ HTTP 200 (1 pageview) | `PASS` |
| **Teste F** | Browser Forward | Histórico Forward | POST `/api/track-visit` ➔ HTTP 200 (1 pageview) | `PASS` |
| **Teste G** | Nova Aba | Abrir `/areas-atendidas` | POST `/api/track-visit` ➔ HTTP 200 (1 pageview) | `PASS` |
| **Teste H** | Sequência SPA de 5 Páginas | 5 rotas consecutivas | 5 requisições POST `/api/track-visit` HTTP 200 | `PASS` |
| **Teste I** | 1 Clique no WhatsApp | Click no botão WhatsApp | `track-click` = 1, `lead_clicks` +1, `leads` fake +0 | `PASS` |
| **Teste J** | 1 Clique no Telefone | Click em link `tel:` | `track-click` = 1, `lead_clicks` +1, `leads` fake +0 | `PASS` |
| **Teste K** | 1 CTA Interno | Click em link de serviço | `track-click` = 1, `leads` fake +0 | `PASS` |
| **Teste L** | 1 Form Submit Real | Submit do formulário | `send-lead` = 1, `leads` real +1 | `PASS` |
| **Teste M** | Form Submit + Click Plugin | Submit em botão | Total `leads` criados = 1 (Sem duplicação) | `PASS` |
| **Teste N** | Dashboard Stats Backend | GET `/api/admin/dashboard-stats` | Retorna `totalLeads = realLeads.length`, `legacySyntheticCount = 23` | `PASS` |

**Resultado Geral da Matriz:** **14/14 PASSED (100%)**

---

## 6. Comportamentos em Falhas de Rede (Tracking & Form Failures)

- **`TRACKING_FAILURE_BEHAVIOR = RESILIENT_OPEN_DESTINATION`:** Se o endpoint `/api/track-click` ou `/api/track-visit` falhar ou expirar (timeout/HTTP 500), a navegação do usuário ou abertura do aplicativo do WhatsApp **não** é bloqueada (comportamento fire-and-forget assíncrono).
- **`FORM_FAILURE_BEHAVIOR = RESILIENT_FALLBACK_WHATSAPP`:** Se a API de envio de formulários (`/api/send-lead`) falhar ou retornar erro 500, o formulário captura o erro no bloco `catch` e abre o WhatsApp Web/App do cliente preenchendo automaticamente os dados digitados com alerta explicativo.

---

## 7. Resultados Globais de Validação & SEO

- **Matriz Controlada da Fase A.1 (`test-phase-a.mjs`):** **14/14 PASSED (100%)**
- **Suíte Completa SEO & Integridade (`seo-validate-03c.mjs`):** **248/248 PASSED (100%)**
- **Compilação de Produção Nuxt/Nitro (`npx nuxi build`):** **Exit Code 0 (PASS)**
- **SEO Redirects:** `46/46 PASS` (45 SEO + 1 Técnico `/home`)
- **Sitemap XML:** `20 URLs (PASS)`
- **Segurança Operacional:** `PRODUCTION CHANGED = NO`, `DATABASE CHANGED = NO`, `ADMIN AUTH CHANGED = NO`.

---

📄 **Relatório de Referência Auditada:** [`docs/ADMIN_DATA_CAPTURE_FORENSIC_AUDIT.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_FORENSIC_AUDIT.md)  
📄 **Script SQL Estático Futuro:** [`supabase/manual/002_fix_admin_rls.sql`](file:///d:/sicons/ADT/supabase/manual/002_fix_admin_rls.sql)
