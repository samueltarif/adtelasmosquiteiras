# TAXONOMIA DE CTA E ATRIBUIÇÃO POR SERVIÇO — FASE C.0 / C.0.1 / C.0.2

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** Fase C.0.2 — Deploy Controlado da Taxonomia de CTA e Validação em Produção  
**Status:** `PHASE C.0.2 CTA PRODUCTION DEPLOY: PASS`  
**Deploy em Produção:** `PRODUCTION_DEPLOYED = YES (COMMIT 66a019c)`  
**Banco de Dados:** `SQL_004_APPLIED = YES` | `DATABASE_SCHEMA_CTA_READY = YES`

---

## 1. Confirmação da Aplicação Manual do SQL 004 no Supabase

A migration [`supabase/manual/004_cta_service_tracking.sql`](file:///d:/sicons/ADT/supabase/manual/004_cta_service_tracking.sql) foi **EXECUTADA MANUALMENTE PELO OPERADOR** no projeto Supabase oficial (`https://axjqhxpejwkuabeaoyaz.supabase.co`).

- **Colunas Adicionadas:**
  - `public.lead_clicks.service_key` (`character varying`, `nullable = YES`)
  - `public.lead_clicks.service_name` (`text`, `nullable = YES`)
- **Índice Criado:**
  - `idx_lead_clicks_service_key` (**PRESENTE**)
- **Integridade da Tabela:**
  - Contagem de `lead_clicks` antes da migration = 53
  - Contagem de `lead_clicks` após a migration = 53
  - Nenhum registro foi criado, alterado ou excluído DDL.

---

## 2. Deploy em Produção & Commit Approved

- **Repositório GitHub:** `samueltarif/adtelasmosquiteiras`
- **Branch:** `master`
- **Commit Publicado:** [`66a019c`](https://github.com/samueltarif/adtelasmosquiteiras/commit/66a019c)
- **Status do Deploy:** `PRODUCTION_DEPLOYED = YES`

---

## 3. Smoke Test de Produção (`https://www.adtelasmosquiteiras.com.br`)

| Endpoint | Status HTTP Esperado | Status Obtido | Resultado |
| :--- | :---: | :---: | :---: |
| `GET /` | `200 OK` | `200 OK` | **PASS** |
| `GET /servicos/telas` | `200 OK` | `200 OK` | **PASS** |
| `GET /servicos/redes` | `200 OK` | `200 OK` | **PASS** |
| `GET /servicos/vidracaria` | `200 OK` | `200 OK` | **PASS** |
| `GET /orcamento` | `200 OK` | `200 OK` | **PASS** |
| `GET /home` | `301 Redirect` | `301 -> /` | **PASS** |
| `GET /sitemap.xml` | `200 OK (20 URLs)` | `200 OK` | **PASS** |

---

## 4. Instruções para Validação Manual do Operador no Supabase

Após o operador acessar a página real em produção ([`https://www.adtelasmosquiteiras.com.br/servicos/telas`](https://www.adtelasmosquiteiras.com.br/servicos/telas)) e clicar no card **"Telas Mosquiteiras Removíveis"**, ele deverá executar a seguinte query no **SQL Editor** do Supabase para confirmar a captura da Fase C.0 / C.0.2:

### Query de Validação do Último Clique Capturado:
```sql
SELECT 
  created_at,
  tipo,
  origem,
  cta_location,
  service_key,
  service_name,
  visitor_id,
  session_id,
  event_id,
  landing_path,
  channel,
  utm_source,
  utm_medium,
  utm_campaign
FROM public.lead_clicks
ORDER BY created_at DESC
LIMIT 1;
```

### Query de Verificação de Idempotência (`event_id` Único):
```sql
SELECT 
  event_id, 
  COUNT(*) AS total_ocorrencias
FROM public.lead_clicks
WHERE event_id IS NOT NULL
GROUP BY event_id
HAVING COUNT(*) > 1;
```

*(Esperado: 0 linhas retornadas na query de duplicatas).*

---

📄 **Script SQL Estático `004` (Aplicado):** [`supabase/manual/004_cta_service_tracking.sql`](file:///d:/sicons/ADT/supabase/manual/004_cta_service_tracking.sql)  
📄 **Relatório da Fase B.3:** [`docs/ADMIN_DATA_CAPTURE_PHASE_B_IDENTITY_ATTRIBUTION.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_B_IDENTITY_ATTRIBUTION.md)
