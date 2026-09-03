# FASE 5.0D.0 — RUNTIME INTEGRATION & UI STABILIZATION
## Correção dos Erros 400 na Agenda / Equipe CRM

> [!IMPORTANT]
> - `PHASE_5_0C_FINAL_STATUS = COMPLETE_VALIDATED`
> - `MIGRATION_012_STATUS = INSTALLED_VALIDATED` (reexecução proibida)
> - `MIGRATION_013_STATUS = INSTALLED_VALIDATED` (reexecução proibida)
> - `PRODUCTION_DATABASE_WRITES = 0`
> - `SUPABASE_MCP_WRITES = 0` (apenas leitura)

---

## Diagnóstico Físico Confirmado

### Problema 1 — PGRST100: WorkOrdersSearch

**Arquivo**: `server/api/admin/crm/work-orders/search.post.ts` (L29–38)

**Causa Raiz Física Confirmada**:
O endpoint gera o seguinte filtro PostgREST:
```
or=(numero_os.ilike.*samu*,client.nome.ilike.*samu*)
```
O PostgREST **não suporta** dot-notation (`client.nome`) dentro de `or=()` para colunas de tabelas relacionadas via embedding. `client.nome` pertence à tabela `clients` joinada com `clients!inner`, não à tabela `work_orders` diretamente.

**Solução**:
1. Remover `client.nome.ilike.*...` e `client.telefone_principal.ilike.*...` do `or=()`.
2. Implementar busca em dois passos no BFF:
   - Passo 1: buscar `work_orders` com `numero_os.ilike.*q*` (coluna direta ✅)
   - Passo 2: se resultado for insuficiente e query parecer nome/telefone, buscar `clients` por `nome.ilike.*q*` e `telefone_principal.ilike.*q*` → obter `client_id[]` → buscar `work_orders?client_id=in.(...)` 
   - Mesclar resultados, deduplicar por `id`, respeitar `limit`
3. Nunca expor o erro PostgREST bruto no log (remover `console.error('[WorkOrdersSearch] Erro Supabase:', errText)`)
4. Melhorar log: `[WorkOrdersSearch] status=${status} errorCode=${safeCode}`

**AppointmentCreateModal**: já usa corretamente `POST /api/admin/crm/work-orders/search` com `{ search, limit }`. Adicionar debounce de 350ms e controle de stale request.

---

### Problema 2 — AppointmentsList 400

**Arquivo**: `app/composables/useCrmAgenda.ts` → `app/pages/admin/agenda/index.vue`
**Causa da Chamada**: `getCalendarDayRange` / `getCalendarWeekRange` / `getCalendarMonthRange` em `app/utils/crmDateTime.ts`

**Causa Raiz Física Confirmada**:
`toSaoPauloIso('2026-09-02', '00:00')` retorna `2026-09-02T03:00:00.000Z` (UTC com `.000Z`).

O valor é um ISO 8601 válido e passa `isValidIsoDateTime`. O `isValidAppointmentDateRange` também passa. Então o erro 400 não vem da validação do range — o BFF aceita o formato `.000Z`. 

**Investigação adicional necessária**: o log mostra `Status: 400` no terminal server, mas o BFF em `index.get.ts` linha 79 converte qualquer erro para `statusCode: 500`. Logo o 400 que aparece no log vem **antes** do BFF — ou seja, o `$fetch` interno ao Supabase está retornando 400.

**Causa real**: o `APPOINTMENT_CALENDAR_SELECT` contém campos de join que podem ter nome diferente do schema real. Ou os parâmetros de filtro `data_hora_fim=gt.${encodeURIComponent(startStr)}` estão sendo corretamente enviados.

> [!IMPORTANT]
> Auditar `APPOINTMENT_CALENDAR_SELECT` em `server/utils/crmAppointmentHelpers.ts` para confirmar se os campos de join existem no schema real.

---

### Problema 3 — Fetch Duplicado

**Arquivo**: `app/pages/admin/agenda/index.vue`

`onMounted` e `watch(() => route.query)` podem disparar em sequência na primeira carga porque o `watch` é reativo e `router.replace()` dentro de `syncStateFromQuery` pode re-disparar o watcher antes que `isInitialMounting = false` seja executado (é `async`, há um `await fetchStaff()` e `await loadCalendarData()` antes).

**Solução**: garantir que o `watch` na query da rota use a flag `isInitialMounting` corretamente — já implementado mas precisa de verificação de timing.

---

## Arquivos a Modificar

### Correção Crítica 1 — BFF WorkOrdersSearch

#### [MODIFY] `server/api/admin/crm/work-orders/search.post.ts`
- Remover `or=()` com campos de tabela relacionada
- Implementar busca em dois passos: primeiro por `numero_os`, depois por `client_id` via busca em `clients`
- Remover log bruto do erro Supabase
- Adicionar log estruturado sem PII
- Corrigir `statusMessage` → `message` para H3 warning

---

### Correção Crítica 2 — AppointmentCreateModal debounce e stale request

#### [MODIFY] `app/components/admin/agenda/AppointmentCreateModal.vue`
- Adicionar debounce de 350ms em `handleSearchWorkOrders`
- Adicionar controle de stale request via `searchRequestId`
- Melhorar mensagem de erro no catch
- Adicionar estado `searchError`

---

### Auditoria 3 — APPOINTMENT_CALENDAR_SELECT

#### [AUDIT] `server/utils/crmAppointmentHelpers.ts`
- Confirmar que todos os campos do SELECT existem no schema real
- Confirmar nomes dos joins (`client:clients(...)`, `work_order:work_orders(...)`, etc.)

---

### Correção 4 — BFF Appointments Log e H3 message

#### [MODIFY] `server/api/admin/crm/appointments/index.get.ts`
- Melhorar log de erro (sem expor dados do Supabase)
- Avaliar se `statusMessage` deve virar `message`

---

## Verificação de LOC

- `search.post.ts`: atualmente 88 linhas (lógica), limite 200 LOC ✅
- `AppointmentCreateModal.vue`: atualmente 385 linhas (componente), limite 600 LOC ✅

---

## Resultado Final Esperado

```
WORK_ORDER_SEARCH_PGRST100 = FIXED
APPOINTMENTS_LIST_400 = FIXED (após auditoria APPOINTMENT_CALENDAR_SELECT)
APPOINTMENT_DUPLICATE_FETCH = NO
DIRECT_SUPABASE_SEARCH_FROM_MODAL = NO
RAW_SUPABASE_ERROR_LOGGING = NO
H3_LONG_STATUS_MESSAGE_WARNINGS = 0
SUPABASE_MCP_WRITES = 0
PRODUCTION_DATABASE_WRITES = 0
MIGRATION_012_REEXECUTED = NO
MIGRATION_013_CREATED = NO
```

---

## FASE 5.0D — Production Release Status & Closure

- `PHASE_5_0D_FINAL_RELEASE_CLOSURE=PASS`
- `PHASE_5_0D_IMPLEMENTATION_STATUS=COMPLETE_VALIDATED`
- `PHASE_5_0D_PRODUCTION_DEPLOY=COMPLETE`
- `PHASE_5_0D_PRODUCTION_VALIDATED=YES`
- `PHASE_5_0D_OFFICIALLY_CLOSED=YES`

### Commits & Código
- `APPLICATION_RELEASE_COMMIT=59307fc82040aab6bef95a01469186d17ae805d3`
- `PRODUCTION_DEPLOY_COMMIT=61645695029b9f71c4c3e8006e8653229b478cfc`
- `REMOTE_MASTER_HEAD=534257640430193c72c6b1fd89966ee3aa99f297`
- `APPLICATION_CODE_DIFF_AFTER_RELEASE=NONE`
- `APPLICATION_CODE_CHANGES=0`

### Validação de Produção & Smoke Test Autenticado
- `AUTHENTICATED_PRODUCTION_SMOKE=PASS`
- `POST_DEPLOY_SMOKE_TEST=PASS`
- `PRODUCTION_PUBLIC_SCHEMA_WRITES=0`
- `PRODUCTION_BUSINESS_DATA_WRITES=0`
- `PRODUCTION_TEST_DATA_CREATED=NO`
- `PRODUCTION_AUTHENTICATION_OCCURRED=YES`
- `PRODUCTION_AUTH_STATE_STRICTLY_READ_ONLY=NO`
- `PGRST100_AUTHENTICATED_SMOKE=0`
- `UNEXPECTED_HTTP_400=0`
- `HTTP_5XX=0`

### Governança de Banco de Dados & Migrations
- `MIGRATION_012_REEXECUTED=NO`
- `MIGRATION_013_EXISTING_PREVIOUS_PHASE=YES` (instalada na Fase 5.0C.4)
- `MIGRATION_013_REEXECUTED=NO`
- `MIGRATION_014_CREATED=NO`
- `PRODUCTION_SCHEMA_CHANGES=0`
- `HANDOFF_RELEASE_STATUS_SYNCHRONIZED=YES`



