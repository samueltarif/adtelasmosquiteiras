# RELATÓRIO DE EXECUÇÃO — FASE A: CORREÇÃO DA FIDELIDADE DA CAPTURA DE DADOS

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-23  
**Fase:** Fase A — Data Capture Accuracy Fix  
**Status:** `READY FOR REVIEW`

---

## 1. Before State (Estado Anterior Auditado)

1. **Leads Sintéticos em Cliques de WhatsApp:** O backend `/api/track-click` criava uma linha fake com `nome: "Lead WhatsApp (...)"` na tabela `public.leads` a cada clique no WhatsApp, telefone ou CTAs.
2. **Duplicação de Formulários (Double-Lead):** O plugin `track-clicks.client.ts` interceptava o clique no botão submit e chamava `/api/track-click` (criando 1 lead fake), enquanto a página chamava `/api/send-lead` (criando 1 lead real). 1 submit = 2 linhas em `leads`.
3. **Double Pageview no Carregamento Inicial:** `track-visits.client.ts` disparava 2 chamadas POST para `/api/track-visit` em qualquer F5 ou primeira página devido à colisão de hooks (`app:mounted` + `router.afterEach`).
4. **Segurança RLS Frágil:** Direct anon inserts liberados via RLS no Supabase.

---

## 2. Code Changes & Soluções Aplicadas (Fase A)

### A) Remoção Completa de Leads Sintéticos em `track-click.post.ts`
- **Arquivo Modificado:** [`server/api/track-click.post.ts`](file:///d:/sicons/ADT/server/api/track-click.post.ts)
- **Alteração:** Removido completamente o bloco que inseria linhas sintéticas na tabela `public.leads`.
- **Resultado:**
  - `WHATSAPP CLICK` ➔ `lead_clicks = +1`, `leads = +0`
  - `PHONE CLICK` ➔ `lead_clicks = +1`, `leads = +0`
  - `CTA CLICK` ➔ `lead_clicks = +1`, `leads = +0`

### B) Proteção Contra Double-Lead em Formulários
- **Arquivos Modificados:** [`app/composables/useFormSubmit.js`](file:///d:/sicons/ADT/app/composables/useFormSubmit.js) & [`app/components/LeadForm.vue`](file:///d:/sicons/ADT/app/components/LeadForm.vue)
- **Alteração:** Adicionada trava de estado `if (isSubmitting.value) return` e `isSubmitting.value = true` durante o processamento para bloquear duplo clique, Enter repetido e retries simultâneos.
- **Resultado:**
  - `FORM SUBMIT` ➔ `leads (real) = +1`, `TOTAL_LEADS_CREATED = 1`

### C) Eliminação do Double Pageview em `track-visits.client.ts`
- **Arquivo Modificado:** [`app/plugins/track-visits.client.ts`](file:///d:/sicons/ADT/app/plugins/track-visits.client.ts)
- **Alteração:** Implementada trava de memória com timestamp (`lastTrackedPath` e `lastTrackedTime < 1000ms`) e uso exclusivo do hook `router.afterEach()`.
- **Resultado:**
  - `HARD LOAD / F5` ➔ 1 pageview
  - `NAVEGAÇÃO NuxtLink` ➔ 1 pageview por nova rota
  - `BACK / FORWARD` ➔ 1 pageview
  - `NOVA ABA` ➔ 1 pageview

### D) Tabela Canônica de Pageviews
- `CANONICAL_PAGEVIEW_TABLE = public.page_views`
- Documentação sincronizada em [`docs/schema.sql`](file:///d:/sicons/ADT/docs/schema.sql).

---

## 3. Preservação dos Registros Históricos Legados

- `LEGACY_SYNTHETIC_LEADS = 23`
- `LEGACY_ROWS_DELETED = 0`
- **Diretriz:** Os 23 registros legados com `nome LIKE 'Lead WhatsApp%'` foram mantidos intactos no banco de dados para histórico auditável, mas isolados das métricas e KPIs de leads reais do futuro Painel V2.

---

## 4. Auditoria de RLS & Requisição Direta

- `PUBLIC_DIRECT_DB_INSERT_REQUIRED = NO` (Todos os disparos do frontend são intermediados por rotas Nitro API server-side usando a `service_role_key`).
- `MANUAL_SUPABASE_ACTION_REQUIRED = YES` (Gerado o script de segurança estático em [`supabase/manual/002_fix_admin_rls.sql`](file:///d:/sicons/ADT/supabase/manual/002_fix_admin_rls.sql)).
- `SUPABASE_MCP_WRITES = 0` (Nenhum comando SQL foi executado via Supabase MCP).

---

## 5. Resultados de Validação & Testes

- **Suíte de Testes da Fase A (`test-phase-a.mjs`):** **3/3 PASSED (100%)**
- **Suíte Completa SEO & Integridade (`seo-validate-03c.mjs`):** **248/248 PASSED (100%)**
- **Compilação de Produção Nuxt/Nitro (`npx nuxi build`):** **Exit Code 0 (PASS)**
- **SEO Redirects:** `46/46 PASS` (45 SEO + 1 Técnico)
- **Sitemap XML:** `20 URLs (PASS)`
- **Fluxos Comerciais:** WhatsApp Direto, Telefone e Formulários 100% preservados.
- **Segurança Operacional:** `PRODUCTION CHANGED = NO`, `DATABASE CHANGED = NO`, `ADMIN AUTH CHANGED = NO`.

---

📄 **Relatório de Referência Auditada:** [`docs/ADMIN_DATA_CAPTURE_FORENSIC_AUDIT.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_FORENSIC_AUDIT.md)  
📄 **Script SQL Estático Futuro:** [`supabase/manual/002_fix_admin_rls.sql`](file:///d:/sicons/ADT/supabase/manual/002_fix_admin_rls.sql)
