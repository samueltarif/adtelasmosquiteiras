# DOCUMENTAÇÃO TÉCNICA — PAINEL ADMIN V2 (FASE C.1.2.2)
**Final Analytics Snapshot & Identity Floor Verification**

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** C.1.2.2 — Final Data Snapshot & Canonical Identity Floor  
**Status:** `ADMIN PANEL V2 — C.1.2.2 FINAL DATA SNAPSHOT: READY FOR REVIEW`  
**Deploy em Produção:** `PRODUCTION_CHANGED = NO`  
**Banco de Dados:** `DATABASE_CHANGED = NO` | `MANUAL_SUPABASE_ACTION_REQUIRED = NO`

---

## 1. Auditoria Forense do Primeiro Evento de Identidade no Supabase

Foi realizada a auditoria direta na base de dados em produção (via consultas REST de leitura estrita com service role key) em todas as tabelas de telemetria (`public.page_views`, `public.lead_clicks`, `public.leads`):

| Campo de Auditoria | Valor Confirmado no Banco | Detalhes do Registro |
|---|---|---|
| **FIRST_IDENTITY_EVENT_TABLE** | `public.page_views` | Primeira inserção após implantação do client de identidade |
| **FIRST_IDENTITY_EVENT_ID** | `6c268a33-f96d-4eeb-bb5e-b0eb949b14dd` | UUID canônico do evento |
| **FIRST_IDENTITY_EVENT_AT** | `2026-08-24T11:27:35.488Z` | `2026-08-24 08:27:35` no fuso de São Paulo (UTC-3) |
| **FIRST_IDENTITY_VISITOR_ID** | `fccbe5c3-803d-40fc-9937-5cb9bae93dc0` | Primeiro visitor persistente registrado |
| **FIRST_IDENTITY_SESSION_ID** | `ec676d34-0586-4c11-a3dc-82588b308f77` | Primeira sessão persistente registrada |

### 📌 Conclusão do Piso Temporal:
- **`OLD_PHASE_B_START_AT`:** `2026-08-24T00:00:00.000Z` (meia-noite artificial)
- **`NEW_PHASE_B_START_AT`:** **`2026-08-24T11:27:35.488Z`** (timestamp real do primeiro evento no banco)
- **`HARDCODED_MIDNIGHT_PHASE_B_START`:** **`NO`**

---

## 2. Relação com o Filtro "Hoje" e o Banner "Período Misto"

1. **Início civil de "Hoje" em São Paulo (UTC-3):**
   - `TODAY_REQUEST_START_UTC = 2026-08-24T03:00:00.000Z` (00:00 BRT)
   - `TODAY_REQUEST_END_UTC = 2026-08-25T03:00:00.000Z` (24:00 BRT)
2. **Piso de Identidade Calculado:**
   - `TODAY_IDENTITY_START_UTC = MAX('2026-08-24T03:00:00.000Z', '2026-08-24T11:27:35.488Z') = 2026-08-24T11:27:35.488Z`
3. **Condição de Período Misto:**
   - Como `requestedStartUtc (03:00 UTC) < phaseBStartAt (11:27 UTC)`, a madrugada/manhã do dia 24/08 contém horas anteriores à telemetria de identidade.
   - **`TODAY_LEGACY_OVERLAP = true`** ➔ O banner **"Período Misto"** DEVE ser exibido em "Hoje" para total transparência técnica comercial.

---

## 3. Snapshot de Renderização em Runtime (OVERVIEW_RENDER_SNAPSHOT)

Captura simultânea do response HTTP interceptado no runtime e dos valores renderizados nos cards da UI:

```json
{
  "requestUrl": "http://localhost:3025/api/admin/analytics/overview?preset=today",
  "responseReceivedAt": "2026-08-24T13:07:22-03:00",
  "api": {
    "uniqueVisitors": 4,
    "sessions": 5,
    "pageviews": 15,
    "realLeads": 0,
    "whatsappClicks": 5,
    "phoneClicks": 0
  },
  "ui": {
    "uniqueVisitors": 4,
    "sessions": 5,
    "pageviews": 15,
    "realLeads": 0,
    "whatsappClicks": 5,
    "phoneClicks": 0
  },
  "exactMatch": true
}
```

### 📸 Screenshot de Confirmação Exata:
![Dashboard Today Exact Snapshot](file:///C:/Users/Vendas2/.gemini/antigravity-ide/brain/94c3b47d-cbd2-41f4-92b8-37968108f9ba/c122_dashboard_today_exact.png)

---

## 4. Matriz de Testes & Regressão Automatizada

- **`test-admin-v2.mjs`:** `26/26 PASS` (Piso canônico de identidade baseado no primeiro evento de banco, exclusão de sessões legadas, normalização de canais, half-open date ranges, monotonicidade do funil)
- **`test-phase-a.mjs`:** `24/24 PASS` (Captura, CTA taxonomy, idempotência e integridade da Fase C.0)
- **`seo-validate-03c.mjs`:** `248/248 PASS` (SEO, tags canonical, 46 redirects 301, 20 URLs sitemap)
- **`npx nuxi build`:** `Exit Code 0` (`✨ Build complete!`)
