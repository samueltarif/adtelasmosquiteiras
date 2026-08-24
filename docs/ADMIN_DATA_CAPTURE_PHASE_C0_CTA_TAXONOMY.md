# TAXONOMIA DE CTA E ATRIBUIÇÃO POR SERVIÇO — FASE C.0 / C.0.1 / C.0.2 / C.0.3 (HOTFIX)

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** Hotfix C.0.3 — Service Context NULL em Service Card (Diagnóstico Forense + Correção Controlada)  
**Status:** `PHASE C.0.3 SERVICE CONTEXT HOTFIX: PASS`  
**Deploy em Produção:** `PRODUCTION_DEPLOYED = YES (COMMIT 9bf0792)`  
**Banco de Dados:** `SQL_004_APPLIED = YES` | `DATABASE_SCHEMA_CTA_READY = YES`

---

## 1. Diagnóstico Forense da Causa Raiz (`SERVICE_CONTEXT_TRACE`)

### 1.1 Evidência Registrada no Incidente
No teste real humano efetuado pelo operador em produção no card **"Telas Mosquiteiras Removíveis"** (`/servicos/telas`), a captura da Fase B funcionou 100% (`visitor_id`, `session_id`, `event_id`, `landing_path`, `channel`, `cta_location = service_card`), porém `service_key = NULL` e `service_name = NULL`.

### 1.2 Causa Raiz Exata Identificada
1. Em [`app/pages/servicos/telas/index.vue`](file:///d:/sicons/ADT/app/pages/servicos/telas/index.vue), o card gerava dinamicamente `:data-service-key="'telas_' + servico.slug"`.
2. Como o slug da opção Removíveis é `'removivel'` (no singular), a interpolação produziu `data-service-key="telas_removivel"` (no singular sem o "s" final).
3. Ao enviar o payload para `/api/track-click`, o servidor chamou `resolveCanonicalService('telas_removivel')`.
4. O dicionário de taxonomia canônica `CANONICAL_SERVICE_TAXONOMY` continha a chave no plural `telas_removiveis: 'Telas Mosquiteiras Removíveis'`.
5. Como `telas_removivel` não deu match exato na chave do dicionário, `resolveCanonicalService` descartou a chave desconhecida por segurança e retornou `{ service_key: null, service_name: null }`, resultando na gravação de `NULL` no banco de dados.

### 1.3 Matriz de Rastreio (`SERVICE_CONTEXT_TRACE`)
- **DOM_SERVICE_KEY (Antes):** `telas_removivel`
- **DOM_SERVICE_NAME:** `Telas Mosquiteiras Removíveis`
- **EVENT_TARGET:** Elemento `<a>` (Card de Serviço)
- **MATCHED_CTA_ELEMENT:** `<a data-cta-location="service_card" data-service-key="telas_removivel">`
- **CLIENT_SERVICE_KEY:** `telas_removivel`
- **REQUEST_SERVICE_KEY:** `telas_removivel`
- **SERVER_RECEIVED_SERVICE_KEY:** `telas_removivel`
- **SERVER_VALIDATED_SERVICE_KEY (Corrigido):** `telas_removiveis`
- **SERVER_RESOLVED_SERVICE_NAME (Corrigido):** `Telas Mosquiteiras Removíveis`
- **DB_SERVICE_KEY (Corrigido):** `telas_removiveis`
- **DB_SERVICE_NAME (Corrigido):** `Telas Mosquiteiras Removíveis`

---

## 2. Correções Aplicadas no Hotfix C.0.3

1. **Mapeamento Explícito de Slugs nos Componentes:**
   - Em [`app/pages/servicos/telas/index.vue`](file:///d:/sicons/ADT/app/pages/servicos/telas/index.vue) e [`app/pages/servicos/redes/index.vue`](file:///d:/sicons/ADT/app/pages/servicos/redes/index.vue), criadas funções auxiliares `getTelasServiceKey(slug)` e `getRedesServiceKey(slug)` que realizam o de-para exato para as chaves canônicas (ex: `removivel` ➔ `telas_removiveis`, `aluminio` ➔ `telas_perfis`, `pernilongos` ➔ `telas_anti_pernilongos`, `gatos` ➔ `redes_pets`).
2. **Resolução de Aliases no Servidor (Dupla Camada de Failsafe):**
   - Em [`server/utils/analytics.ts`](file:///d:/sicons/ADT/server/utils/analytics.ts), adicionado o dicionário `SERVICE_KEY_ALIASES`. Se qualquer cliente futuro ou variação enviar a forma singular (ex: `telas_removivel`), a função `resolveCanonicalService` normaliza automaticamente para a chave canônica no plural `telas_removiveis` e resolve `service_name = 'Telas Mosquiteiras Removíveis'`.
3. **Endurecimento da Traversing DOM no Client Plugin:**
   - Em [`app/plugins/track-clicks.client.ts`](file:///d:/sicons/ADT/app/plugins/track-clicks.client.ts), a função `getServiceContext` recebeu o elemento de origem do evento (`e.target`), permitindo busca multinível de sub-elementos (`<span>`, `<img>`, `<path>`) garantindo 100% de captura do contexto comercial.

---

## 3. Commit Publicado & Deploy

- **Commit:** [`9bf0792`](https://github.com/samueltarif/adtelasmosquiteiras/commit/9bf0792)
- **Mensagem:** `fix(analytics): Hotfix C.0.3 - Service context mapping and alias resolution for service_card clicks`
- **Repositório:** `samueltarif/adtelasmosquiteiras` (`master -> master`)
- **Status:** `PRODUCTION_DEPLOYED = YES`

---

## 4. Instrução para Teste Manual do Operador em Produção

Após o deploy em produção, abra a página em produção ([`https://www.adtelasmosquiteiras.com.br/servicos/telas`](https://www.adtelasmosquiteiras.com.br/servicos/telas)) e clique **UMA VEZ** no WhatsApp do card **"Telas Mosquiteiras Removíveis"** (sem necessidade de enviar mensagem no WhatsApp).

Em seguida, execute a query abaixo no **SQL Editor** do Supabase oficial para confirmar o registro correto:

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
  channel
FROM public.lead_clicks
ORDER BY created_at DESC
LIMIT 1;
```

> **Resultado Esperado:**
> - `tipo`: `whatsapp`
> - `origem`: `/servicos/telas`
> - `cta_location`: `service_card`
> - `service_key`: `telas_removiveis`
> - `service_name`: `Telas Mosquiteiras Removíveis`

---

📄 **Script SQL Estático `004` (Aplicado):** [`supabase/manual/004_cta_service_tracking.sql`](file:///d:/sicons/ADT/supabase/manual/004_cta_service_tracking.sql)  
📄 **Relatório da Fase B.3:** [`docs/ADMIN_DATA_CAPTURE_PHASE_B_IDENTITY_ATTRIBUTION.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_B_IDENTITY_ATTRIBUTION.md)
