# TAXONOMIA DE CTA E ATRIBUIÇÃO POR SERVIÇO — FASE C.0 & C.0.1

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** Fase C.0 / C.0.1 — CTA Data Quality Gate & Finalização da Migration 004  
**Status:** `PHASE C.0.1 CTA DATA QUALITY: READY FOR REVIEW`  
**Deploy em Produção:** `PRODUCTION_CHANGED = NO (NÃO DEPLOYADO)`  
**Alterações de Banco:** `DATABASE_CHANGED = NO (AGUARDANDO AÇÃO MANUAL)`

---

## 1. Auditoria da Fase C.0.1 — Data Quality & Validação Server-Side

### 1.1 Eliminação do Default Sintético em Formulários Genéricos
- **Antes:** Formulários genéricos (`/orcamento`, `/contato`, modal) imputavam arbitrariamente `service_key = telas_janelas`.
- **Fase C.0.1:** Se nenhum serviço for selecionado explicitamente pelo usuário, `service_key = null` e `service_name = null`. Se selecionado (ex: `pet_screen`), o contexto do serviço é enviado e validado.

### 1.2 Normalização Canônica de `action_type`
- **Valores Canônicos:** `whatsapp`, `telefone`, `internal_cta`, `form_start`, `form_submit`.
- **Saneamento Server-Side:** Eventos legados enviados como `cta_interno` são normalizados no servidor para `internal_cta` sem alterar registros históricos do banco.

### 1.3 Validação Server-Side & Resolução do Nome Canônico
- O cliente envia `service_key` e `cta_location`.
- O servidor (`server/api/track-click.post.ts`):
  1. Valida `cta_location` contra `ALLOWED_CTA_LOCATIONS`. Se inválido, normaliza para `'other'`.
  2. Valida `service_key` contra o dicionário de taxonomia canônica `CANONICAL_SERVICE_TAXONOMY`.
  3. Resolve `service_name` estritamente a partir da taxonomia do servidor. Chaves inválidas ou nulas resultam em `service_key = null` e `service_name = null`.

---

## 2. Taxonomia Compartilhada Client/Server

Definida em [`app/utils/ctaTaxonomy.ts`](file:///d:/sicons/ADT/app/utils/ctaTaxonomy.ts) e [`server/utils/analytics.ts`](file:///d:/sicons/ADT/server/utils/analytics.ts):

- **Locations Permitidas (13):** `header`, `hero`, `footer`, `floating_whatsapp`, `sticky_mobile`, `service_card`, `service_page`, `quote_form`, `contact_form`, `cep_result`, `modal`, `faq`, `other`.
- **Action Types Canônicos (5):** `whatsapp`, `telefone`, `internal_cta`, `form_start`, `form_submit`.

---

## 3. Matriz de Cobertura de CTAs (`CTA_COVERAGE_MATRIX`)

| `cta_location` | Componente | Página | Implementado | Testado | Observações |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `header` | `Header.vue` | Global | SIM | SIM | Anotado com `data-cta-location="header"` |
| `hero` | `HeroSection.vue` | `/` (Home) | SIM | SIM | Anotado no container hero |
| `footer` | `Footer.vue` | Global | SIM | SIM | Anotado no rodapé institucional |
| `floating_whatsapp` | `WhatsappFloating.vue` | Global | SIM | SIM | Botão flutuante global no canto inferior |
| `sticky_mobile` | `MobileUnifiedCTA.vue` | Global Mobile | SIM | SIM | Container da barra fixa mobile |
| `service_card` | `ServicesCards.vue`, `servicos/telas/index.vue`, `servicos/redes/index.vue`, `servicos/vidracaria.vue` | Home & Categorias | SIM | SIM | Envia `data-service-key` e `data-service-name` |
| `service_page` | `pages/servicos/telas/janelas.vue`, etc. | Páginas internas | SIM | SIM | CTAs internos das landing pages |
| `quote_form` | `LeadForm.vue`, `orcamento.vue` | `/orcamento`, Modals | SIM | SIM | Contexto de serviço dinâmico (NULL default) |
| `contact_form` | `contato.vue` | `/contato` | SIM | SIM | Formulário de contato institucional |
| `cep_result` | `CepSearch.vue` | Home & Categorias | SIM | SIM | Resultado de busca de atendimento por CEP |
| `modal` | `StickyFormModal.vue` | Global Modals | SIM | SIM | Popup modal de orçamento |
| `faq` | `FAQSection.vue` | `/` & Categorias | SIM | SIM | Links de contato dentro de sanfonas de FAQ |
| `other` | Server Fallback | Global | SIM | SIM | Fallback automático sanitizado no servidor |

---

## 4. Auditoria dos Service Keys Reais (`SERVICE_KEYS_REAL_AUDIT`)

| `service_key` | `service_name` | Componente Fonte | Página Fonte | Renderizado |
| :--- | :--- | :--- | :--- | :---: |
| `telas_janelas` | Telas Mosquiteiras para Janelas | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_portas` | Telas Mosquiteiras para Portas | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_varandas` | Telas Mosquiteiras para Varandas | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_sacadas` | Telas Mosquiteiras para Sacadas | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_apartamentos` | Telas Mosquiteiras para Apartamentos | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_banheiro` | Telas Mosquiteiras para Banheiro | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_correr` | Telas Mosquiteiras de Correr | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_removiveis` | Telas Mosquiteiras Removíveis | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_perfis` | Telas Mosquiteiras com Perfis | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_basculantes` | Telas Mosquiteiras para Basculantes | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_pivotantes` | Telas Mosquiteiras Pivotantes | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_especiais` | Telas Mosquiteiras Especiais | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_anti_pernilongos` | Telas Mosquiteiras Anti-Pernilongos | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_fachadas` | Telas Mosquiteiras para Fachadas | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_coberturas` | Telas Mosquiteiras para Coberturas | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_restaurantes` | Telas Mosquiteiras para Restaurantes | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `telas_industrias` | Telas Mosquiteiras para Indústrias | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `pet_screen` | Telas Mosquiteiras Pet Screen | `servicos/telas/index.vue` | `/servicos/telas` | SIM |
| `redes_janelas` | Redes de Proteção para Janelas | `servicos/redes/index.vue` | `/servicos/redes` | SIM |
| `redes_sacadas` | Redes de Proteção para Sacadas e Varandas | `servicos/redes/index.vue` | `/servicos/redes` | SIM |
| `redes_pets` | Redes de Proteção para Gatos e Pets | `servicos/redes/index.vue` | `/servicos/redes` | SIM |
| `redes_criancas` | Redes de Proteção para Crianças | `servicos/redes/index.vue` | `/servicos/redes` | SIM |
| `redes_escadas` | Redes de Proteção para Escadas e Mezaninos | `servicos/redes/index.vue` | `/servicos/redes` | SIM |
| `vidracaria` | Serviços de Vidraçaria | `servicos/vidracaria.vue` | `/servicos/vidracaria` | SIM |

---

## 5. Exemplo de Payloads de Interação

### A. Clique no Card "Telas Mosquiteiras Removíveis"
```json
{
  "event_id": "c6a8f192-3b4e-4f12-a890-7d12f4581290",
  "visitor_id": "8e3b1c9a-4d2f-4c12-b890-1e23f456789a",
  "session_id": "3f9c2d1b-5e4a-4b12-9890-2f34a567891b",
  "tipo": "whatsapp",
  "origem": "/servicos/telas",
  "cta_location": "service_card",
  "service_key": "telas_removiveis",
  "service_name": "Telas Mosquiteiras Removíveis",
  "landing_path": "/",
  "channel": "instagram"
}
```

### B. Clique no WhatsApp Flutuante
```json
{
  "event_id": "f1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
  "visitor_id": "8e3b1c9a-4d2f-4c12-b890-1e23f456789a",
  "session_id": "3f9c2d1b-5e4a-4b12-9890-2f34a567891b",
  "tipo": "whatsapp",
  "origem": "/",
  "cta_location": "floating_whatsapp",
  "service_key": null,
  "service_name": null,
  "landing_path": "/",
  "channel": "direct"
}
```

### C. Formulário Genérico de Orçamento (Sem serviço selecionado)
```json
{
  "event_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "visitor_id": "8e3b1c9a-4d2f-4c12-b890-1e23f456789a",
  "session_id": "3f9c2d1b-5e4a-4b12-9890-2f34a567891b",
  "tipo": "internal_cta",
  "origem": "/orcamento",
  "cta_location": "quote_form",
  "service_key": null,
  "service_name": null,
  "landing_path": "/orcamento",
  "channel": "google_organic"
}
```

---

## 6. Migration Estática `004` (`supabase/manual/004_cta_service_tracking.sql`)

```sql
-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE VIA MCP)
-- ======================================================================
-- Projeto: AD Telas e Redes — adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/004_cta_service_tracking.sql
-- Status: FINAL_REVIEW_NOT_EXECUTED (Aguardando instrução manual do operador).
-- ======================================================================

SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'lead_clicks';

SELECT COUNT(*) AS total_lead_clicks_before FROM public.lead_clicks;

BEGIN;

ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS service_key VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS service_name TEXT;

CREATE INDEX IF NOT EXISTS idx_lead_clicks_service_key ON public.lead_clicks(service_key);

COMMIT;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lead_clicks'
  AND column_name IN ('service_key', 'service_name', 'cta_location', 'visitor_id', 'session_id');

SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'idx_lead_clicks_service_key';

SELECT COUNT(*) AS total_lead_clicks_after FROM public.lead_clicks;

/*
BEGIN;
DROP INDEX IF EXISTS public.idx_lead_clicks_service_key;
ALTER TABLE public.lead_clicks DROP COLUMN IF EXISTS service_name, DROP COLUMN IF EXISTS service_key;
COMMIT;
*/
```

- **Status:** **`MANUAL_SUPABASE_ACTION_REQUIRED = YES (NÃO EXECUTADO)`**.

---

## 7. Validação do Quality Gate

- **`npx nuxi build`:** **Exit Code 0 (PASS)**
- **Matriz de Testes da Fase C.0.1 (`test-phase-a.mjs`):** **24/24 PASSED (100%)**
- **Suíte de Integridade SEO (`seo-validate-03c.mjs`):** **248/248 PASSED (100%)**

---

📄 **Script SQL Estático `004`:** [`supabase/manual/004_cta_service_tracking.sql`](file:///d:/sicons/ADT/supabase/manual/004_cta_service_tracking.sql)  
📄 **Relatório da Fase B.3:** [`docs/ADMIN_DATA_CAPTURE_PHASE_B_IDENTITY_ATTRIBUTION.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_B_IDENTITY_ATTRIBUTION.md)
