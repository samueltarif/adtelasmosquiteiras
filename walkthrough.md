# Walkthrough — Fase B.2: Final Database Migration Hardening

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Status:** `PHASE B.2 FINAL MIGRATION HARDENING: READY FOR REVIEW`  
**Deploy em Produção:** `PRODUCTION_CHANGED = NO (NÃO EXECUTADO)`  
**Banco de Dados:** `DATABASE_CHANGED = NO (AGUARDANDO AÇÃO MANUAL)`

---

## 1. Resumo da Fase B.2

1. **Atualização do Baseline para 28 Registros em `public.leads`:**
   - 23 registros sintéticos legados + 4 de testes automatizados + 1 de teste de validação manual do formulário real em produção.
2. **Endurecimento de Tipos (`TEXT` para Atribuição Externa):**
   - Parâmetros derivados de query strings e referrers externos utilizam tipo `TEXT` em vez de `VARCHAR(100)` para prevenir estouros de limite em URLs ou UTMs longos.
3. **Suporte a Microsoft Ads (`microsoft_ads`):**
   - Classificação de canais atualizada no servidor e cliente para dar prioridade ao `msclkid` sobre referrer orgânico do Bing.
4. **Contexto Completo de First Touch em `public.leads`:**
   - Adicionadas 13 colunas `first_touch_*` para salvar a campanha e canal de aquisição inicial do visitante, persistidas via cookie `adt_ft_context` (365 dias).
5. **Bloco Transacional (`BEGIN; ... COMMIT;`):**
   - Script SQL [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql) estruturado em transação atômica.
6. **Validação do Pre-Deploy Gate:**
   - **`npx nuxi build`:** Exit Code 0 (PASS)
   - **Matriz de Testes Expandida da Fase B.2 (`test-phase-a.mjs` com mock local na porta 9999):** `20/20 PASSED (100%)`
   - **Suíte de Integridade SEO (`seo-validate-03c.mjs`):** `248/248 PASSED (100%)`

---

## 2. Documentos Registrados no Repositório

- 👉 [`docs/ADMIN_DATA_CAPTURE_PHASE_B_IDENTITY_ATTRIBUTION.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_B_IDENTITY_ATTRIBUTION.md)
- 👉 [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql)
- 👉 [`docs/ADMIN_DATA_CAPTURE_PHASE_A4_PRODUCTION_DEPLOY.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_A4_PRODUCTION_DEPLOY.md)
