# RELATÓRIO DE DIAGNÓSTICO E RESOLUÇÃO — FASE A.3 & FASE A.3.1

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-23  
**Fase:** Fase A.3.1 — Remoção de Test Mode dos Endpoints de Produção e Preparação de Deploy  
**Status:** `PHASE A.3.1 TEST ISOLATION: READY FOR REVIEW`  
**Deploy em Produção:** `PRODUCTION_CHANGED = NO (AGUARDANDO REVISÃO)`

---

## 1. Evidência Real do Banco de Dados Supabase (Análise Forense)

Uma auditoria direta nos 27 registros existentes na tabela `public.leads` do Supabase revelou a seguinte distribuição exata:

- **23 registros (`nome LIKE 'Lead WhatsApp%'`):** Cliques legados sintéticos de WhatsApp criados pelo antigo código `track-click.post.ts`.
- **4 registros (`nome LIKE '%Teste Automatizado%'`):** Registros criados pelas execuções passadas da suíte de testes automatizados.
- **0 registros:** Leads reais de clientes comerciais (`CONFIRMED_REAL_CUSTOMER_LEADS = 0`).

Quando o operador humano tentou submeter um formulário com um nome único em produção, **nenhuma nova linha foi gravada no Supabase**.

---

## 2. Diagnóstico da Causa Raiz (Root Cause Analysis)

A investigação do fluxo completo (`Client Handler ➔ Composable ➔ Request ➔ /api/send-lead ➔ Supabase`) identificou **duas causas raízes distintas**:

### 🔴 Causa Raiz 1: Colisão de Trava em `useFormSubmit.js` (Formulários `/orcamento` e `/contato`)
- **Mecanismo da Falha:** No composable [`useFormSubmit.js`](file:///d:/sicons/ADT/app/composables/useFormSubmit.js), foi adicionada na Fase A.1 a trava `if (isSubmitting.value) return`.
- **Conflito:** As páginas [`app/pages/orcamento.vue`](file:///d:/sicons/ADT/app/pages/orcamento.vue) e [`app/pages/contato.vue`](file:///d:/sicons/ADT/app/pages/contato.vue) executavam `isSubmitting.value = true` no handler da página **antes** de chamar `redirectToThankYou(fields)`.
- **Efeito:** Quando `redirectToThankYou` era invocado, `isSubmitting.value` já estava `true`. O `if (isSubmitting.value) return` **abortava silenciosamente a execução**, e o método `$fetch('/api/send-lead')` **nunca chegou a ser disparado no navegador**!

### 🔴 Causa Raiz 2: Omissão de Campos em `LeadForm.vue` (Formulário Hero/Modal)
- **Mecanismo da Falha:** O componente [`app/components/LeadForm.vue`](file:///d:/sicons/ADT/app/components/LeadForm.vue) chamava `/api/send-lead` diretamente, mas a payload enviada no body omitia os campos `telefone` e `email`.

---

## 3. Correções Aplicadas no Código-Fonte (Fase A.3 & A.3.1)

### ✅ Fix 1: Refatoração do Gerenciamento de Trava em `useFormSubmit.js`
- **Arquivo Modificado:** [`app/composables/useFormSubmit.js`](file:///d:/sicons/ADT/app/composables/useFormSubmit.js)
- **Solução:** `useFormSubmit.js` gerencia `isSubmitting` exclusivamente em seu bloco `try...finally`. As páginas `orcamento.vue` e `contato.vue` agora delegam a submissão diretamente para `redirectToThankYou(formData.value)` sem alterar a trava previamente.

### ✅ Fix 2: Correção do Payload em `LeadForm.vue`
- **Arquivo Modificado:** [`app/components/LeadForm.vue`](file:///d:/sicons/ADT/app/components/LeadForm.vue)
- **Solução:** Adicionados explicitamente os campos `telefone`, `email` e `mensagem` na payload enviada ao endpoint `/api/send-lead`.

### ✅ Fix 3: Remoção Total de Test Bypass dos Endpoints de Produção (`PRODUCTION_TEST_BYPASS = NONE`)
- **Arquivos Limpos:** [`server/api/send-lead.post.ts`](file:///d:/sicons/ADT/server/api/send-lead.post.ts), [`server/api/track-click.post.ts`](file:///d:/sicons/ADT/server/api/track-click.post.ts), [`server/api/track-visit.post.ts`](file:///d:/sicons/ADT/server/api/track-visit.post.ts)
- **Garantia de Segurança:** Removidas **100% das flags/headers de bypass de teste** (`isTest`, `x-test-mode`, `testMode`). Nenhum cliente ou usuário externo pode solicitar ao backend público de produção que finja sucesso sem gravar no banco.
- **Resultado:**
  - `SEND_LEAD_TEST_BYPASS: NONE`
  - `TRACK_CLICK_TEST_BYPASS: NONE`
  - `TRACK_VISIT_TEST_BYPASS: NONE`

---

## 4. Descontaminação Rígida dos KPIs no Backend (`dashboard-stats.get.ts`)

- **Arquivo Modificado:** [`server/api/admin/dashboard-stats.get.ts`](file:///d:/sicons/ADT/server/api/admin/dashboard-stats.get.ts)
- **Nova Regra de Cálculo:**
  - `LEGACY_SYNTHETIC_WHATSAPP = 23` (`nome.startsWith('Lead WhatsApp')`)
  - `AUTOMATED_TEST_LEADS = 4` (`nome.includes('Teste Automatizado')`)
  - `realLeads` = registros sem prefixo sintético ou de teste.
  - `CURRENT_ADMIN_REAL_LEADS_COUNT = 0` (Corretamente reportado como 0 enquanto não existirem leads comerciais reais).
  - `CURRENT_ADMIN_KPI_CONTAMINATED = NO` (KPI do painel purificado sem alterar nem apagar nenhuma linha do banco de dados).
  - `LEGACY_KPI_FILTER = TEMPORARY` (Filtro por nome é temporário para isolar os 27 registros históricos conhecidos).

---

## 5. Resultados do Pre-Deploy Gate & Testes (Fase A.3.1)

- **Compilação de Produção Nuxt/Nitro (`npx nuxi build`):** **Exit Code 0 (PASS)**
- **Matriz de Testes Controlados Sem Test Bypass (`test-phase-a.mjs`):** **16/16 PASSED (100%)**
- **Suíte de Integridade SEO (`seo-validate-03c.mjs`):** **248/248 PASSED (100%)**
- **SEO Redirects:** `46/46 PASS`
- **Sitemap XML:** `20 URLs (PASS)`
- **Segurança Operacional:** `PRODUCTION CHANGED = NO`, `DATABASE CHANGED = NO`, `ADMIN AUTH CHANGED = NO`.

---

## 6. Plano de Re-Teste Manual do Usuário em Produção (Pós-Deploy)

Após a aprovação desta fase e deploy em produção pelo operador:

1. Acesse `https://www.adtelasmosquiteiras.com.br/orcamento` ou `/contato`.
2. Preencha o formulário com um nome e telefone identificáveis.
3. Clique em **Enviar**.
4. Verifique no SQL Editor do Supabase:
   ```sql
   SELECT * FROM public.leads ORDER BY created_at DESC LIMIT 1;
   ```
5. **Resultado Esperado:** O registro será salvo no banco de produção com o status `Novo` e a payload completa contendo nome, e-mail, telefone, serviço e mensagem.

---

📄 **Relatório de Validação de Produção:** [`docs/ADMIN_DATA_CAPTURE_PHASE_A2_PRODUCTION_VALIDATION.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_A2_PRODUCTION_VALIDATION.md)  
📄 **Script SQL Estático Futuro de RLS:** [`supabase/manual/002_fix_admin_rls.sql`](file:///d:/sicons/ADT/supabase/manual/002_fix_admin_rls.sql)
