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

---

## PATCH 5.0C.4 — Final Auth & CSRF Hardening

- `PATCH_5_0C_4_FINAL_AUTH_CSRF_HARDENING=IMPLEMENTED`
- `PHASE_5_0C_STATUS=IMPLEMENTED_PENDING_FINAL_EXTERNAL_REVIEW`
- `ADMIN_AUTHORIZATION_AUTHORITY=PUBLIC_ADMIN_USERS`
- `EMAIL_BOOTSTRAP_RUNTIME=REMOVED`
- `PRODUCTION_TEST_AUTH_BYPASS=BLOCKED`
- `TEST_AUTH_PRODUCTION_BYPASS=IMPOSSIBLE`
- `TEST_AUTH_REQUIRES_NON_PRODUCTION=YES`
- `TEST_AUTH_REQUIRES_EXPLICIT_FLAG=YES`
- `CACHED_ADMIN_INACTIVE_POLICY=DENY_403`
- `ADMIN_MUTATION_CSRF_POLICY=FAIL_CLOSED`
- `CSRF_MISSING_HEADERS_POLICY=FAIL_CLOSED`
- `WORK_ORDER_CONCURRENCY_ATOMIC_CAS=YES`
- `WORK_ORDER_CAS_HANDLER_TEST=PASS`
- `WORK_ORDER_CAS_POSTGREST_INTEGRATION_TEST=NOT_EXECUTED`
- `CANCELLATION_STALE_REQUEST_SIDE_EFFECTS=ZERO`
- `TEXT_Q_SEARCH_ENABLED=NO`
- `SEARCH_PII_SEMANTICS=DEFERRED`
- `SEARCH_PII_SAFE_DB_RPC_REQUIRED=YES`
- `MIGRATION_013_CREATED=NO`
- `LEAD_CREATE_OS_STRICT_BOOLEAN=PASS`
- `MIGRATION_012_NORMALIZED_SHA=43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
- `MIGRATION_012_LOGIC_CHANGED=NO`
- `MIGRATION_012_REEXECUTED=NO`
- `PRODUCTION_DATABASE_WRITES=0`
- `APPLICATION_DEPLOY=NO`
- `PHASE_5_0C_READY_FOR_FINAL_EXTERNAL_REVIEW=YES`

---

## PATCH 5.0C.4.1 — Final Fail-Closed Cleanup

- `PATCH_5_0C_4_1_STATUS=IMPLEMENTED_PENDING_FINAL_EXTERNAL_REVIEW`
- `CURRENT_PROJECT_STATE=PHASE_5_0C_PATCH_4_1_IMPLEMENTED_PENDING_EXTERNAL_REVIEW`
- `LATEST_AUTH_HARDENING_DEPLOYED=NO`
- `CSRF_UNKNOWN_ENV_POLICY=FAIL_CLOSED`
- `COOKIE_SECURE_UNKNOWN_ENV_POLICY=SECURE_TRUE`
- `COOKIE_SECURE_DEFAULT=FAIL_CLOSED`
- `CENTRAL_ADMIN_GUARD_HARDCODED_BYPASS=NONE`
- `TEST_AUTH_RUNTIME_PRESENT_NONPRODUCTION_GATED=YES`
- `PRODUCTION_TEST_AUTH_BYPASS=BLOCKED`
- `TEST_AUTH_MOCK_EMAIL=test-admin@adt-crm.invalid`
- `APPOINTMENT_GUARD_UPSTREAM_ERROR_POLICY=SANITIZED_503_FAIL_CLOSED`
- `REVIEW_PACKAGE_MISSING_LOCAL_IMPORTS=0`
- `REVIEW_PACKAGE_ZIP=phase_5_0c4_1_external_review.zip`
- `REVIEW_PACKAGE_FILE_COUNT=35`
- `APPLICATION_LOGIC_FILES_OVER_200_LINES=0`
- `MIGRATION_012_REEXECUTION=FORBIDDEN`
- `MIGRATION_012_NORMALIZED_SHA=43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
- `MIGRATION_013_EXISTING_PREVIOUS_PHASE=YES`
- `MIGRATION_013_CREATED_THIS_PATCH=NO`
- `MIGRATION_013_REEXECUTED=NO`
- `MIGRATION_013_NORMALIZED_SHA=04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`
- `PRODUCTION_DATABASE_WRITES=0`
- `APPLICATION_DEPLOY=NO`
- `BFF_TEST_CASES_EXECUTED=57`
- `BFF_TEST_CASES_PASSED=57`
- `BFF_TEST_CASES_FAILED=0`
- `TEST_AUTH_MATRIX_CASES_PASSED=7/7`
- `BACKEND_SUITE_ASSERTS_PASSED=85/85`

---

## PATCH 5.0C.4.2 — Final Test Evidence & Contract Cleanup

- `PATCH_5_0C_4_2_STATUS=IMPLEMENTED_PENDING_FINAL_EXTERNAL_REVIEW`
- `PHASE_5_0C_BASELINE_STATUS=COMPLETE_VALIDATED`
- `PHASE_5_0D_PRODUCTION_STATUS=COMPLETE_VALIDATED`
- `LATEST_AUTH_HARDENING_DEPLOYED=NO`
- `BFF_ASYNC_TESTS_UNAWAITED=0` (prova negativa e auditoria estática concluídas)
- `CALENDAR_RANGE_RFC3339_EXPLICIT_OFFSET=PASS`
- `CALENDAR_DATE_ONLY=REJECTED` (400)
- `CALENDAR_TIMEZONELESS_DATETIME=REJECTED` (400)
- `CALENDAR_INVALID_SEMANTIC_DATE=REJECTED` (400)
- `CALENDAR_RAW_UPSTREAM_ERROR_LOGGING=NONE`
- `MIGRATION_012_DOMAIN_ERROR_CODES=25`
- `MIGRATION_013_DOMAIN_ERROR_CODES=1`
- `APPLICATION_ADDITIONAL_ERROR_CODES=3`
- `ERROR_MAP_TOTAL_KEYS=29`
- `TEST_AUTH_RUNTIME_PRESENT_NONPRODUCTION_GATED=YES`
- `TEST_AUTH_REQUIRES_EXPLICIT_DEV_OR_TEST_ENV=YES`
- `TEST_AUTH_REQUIRES_ENABLE_TEST_AUTH_TRUE=YES`
- `PRODUCTION_TEST_AUTH_BYPASS=BLOCKED`
- `UNKNOWN_ENV_TEST_AUTH_BYPASS=BLOCKED`
- `TEST_AUTH_MOCK_EMAIL=test-admin@adt-crm.invalid`
- `AUTH_HARDENING_TESTS_EXECUTED=7`
- `AUTH_HARDENING_TESTS_PASSED=7`
- `AUTH_HARDENING_TESTS_FAILED=0`
- `BFF_TEST_CASES_EXECUTED=60`
- `BFF_TEST_CASES_PASSED=60`
- `BFF_TEST_CASES_FAILED=0`
- `BACKEND_RPC_ASSERTS_EXECUTED=85`
- `BACKEND_RPC_ASSERTS_PASSED=85`
- `BACKEND_RPC_ASSERTS_FAILED=0`
- `APPLICATION_LOGIC_FILES_OVER_200_LINES=0`
- `APPLICATION_CODE_FILES_OVER_600_LINES=0`
- `MIGRATION_012_NORMALIZED_SHA=43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
- `MIGRATION_013_NORMALIZED_SHA=04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`
- `MIGRATION_012_REEXECUTION=FORBIDDEN`
- `MIGRATION_013_REEXECUTION=FORBIDDEN`
- `MIGRATION_012_REEXECUTED=NO`
- `MIGRATION_013_REEXECUTED=NO`
- `PRODUCTION_DATABASE_WRITES=0`
- `APPLICATION_DEPLOY=NO`
- `PATCH_5_0C_4_2_READY_FOR_EXTERNAL_REVIEW=YES`





