# DOCUMENTAÇÃO TÉCNICA — CRM FASE 5.0
## Agenda, Agendamentos, Equipe Operacional, BFF & Hardening de Autenticação (Patch 5.0C.4.2)

---

### 1. Visão Geral da Fase 5.0 & Governança Atual

A **Fase 5.0 do CRM** introduziu o motor de agendamentos atômicos, gestão de equipe operacional (*staff*), integração com Ordens de Serviço (OS), proteção de concorrência otimista atômica (*Compare-And-Set*), endurecimento estrito de autenticação e CSRF (*fail-closed*), busca segura e determinística de duplicidades de clientes, minimização de PII em calendário (`APPOINTMENT_CALENDAR_SELECT`), normalização canônica de números telefônicos brasileiros (DDD 55 de Santa Maria/RS sem confundir com DDI 55 do Brasil via `app/utils/phone.ts`), prova real de foco exato de retorno de modais/sheets WAI-ARIA, expansão e auditoria dinâmica física de touch targets $\ge 44\times 44\text{px}$ (`width >= 43.5 && height >= 43.5`) iterando sobre as 10 viewports reais (320 a 1920px) em 11 rotas físicas operacionais e públicas, modais, lightboxes e uploaders (`TOUCH_TARGET_UNDER_44_COUNT = 0`, `TOUCH_TARGET_REQUIRED_EXPECTED_COUNT = 484`, `FOUND = 484`, `MEASURED = 484`, `PASS = 484`, `FAIL = 0`), auditoria global de zero controles interativos aninhados (`NESTED_INTERACTIVE_CONTROLS = 0`), auditoria de zero overflow horizontal sem band-aids (`OVERFLOW_X_HIDDEN_BANDAID_COUNT = 0`), sanitização estrita de logging de erro de cliente (`CLIENT_SIDE_RAW_ERROR_OBJECT_LOGGING = 0`), correção de parser do git status (`AUDIT_GIT_STATUS_PARSER = FIXED`), modularização de `MediaUploader.vue` e `useFormSubmit.js`, e conformidade com limites de linhas (`APPLICATION_LOGIC_FILES_OVER_200_LINES = 0`, `APPLICATION_CODE_FILES_OVER_600_LINES = 0`, `CODE_SIZE_POLICY = PASS`).

**Estado Canônico Atual de Deploy e Produção**:
- `PHASE_5_0C_BASELINE_STATUS = COMPLETE_VALIDATED`
- `PHASE_5_0D_PRODUCTION_STATUS = COMPLETE_VALIDATED` (A Fase 5.0D já se encontra instalada e servida em produção)
- `PATCH_5_0C_4_2_STATUS = IMPLEMENTED_PENDING_FINAL_EXTERNAL_REVIEW`
- `LATEST_AUTH_HARDENING_DEPLOYED = NO` (Deploy do hardening pendente de autorização da revisão externa)
- `PRODUCTION_DATABASE_WRITES = 0`
- `APPLICATION_DEPLOY = NO`

---

### 2. Componentes e Estrutura de Arquivos

#### A. Banco de Dados / Engine PostgreSQL 17
- **Migration 012**: `supabase/manual/012_crm_appointments_and_staff_engine.sql`
  - **SHA-256 Canônico LF**: `43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
  - **Status da Migration 012**: `INSTALLED_VALIDATED` / `REEXECUTION=FORBIDDEN`
  - **5 RPCs Atômicas**:
    1. `create_appointment_atomic`: Cria agendamento com validação de overlap, limites de status e actor_id.
    2. `update_appointment_atomic`: Atualiza dados do agendamento com validação de janelas e status.
    3. `reschedule_appointment_atomic`: Reagenda agendamento existente encadeando `rescheduled_from_id`.
    4. `cancel_appointment_atomic`: Cancela agendamento garantindo atomicidade e auditoria.
    5. `update_appointment_status_atomic`: Transiciona status com validação de regras de negócio.
- **Migration 013**: `supabase/manual/013_work_order_terminal_appointment_guard.sql`
  - **SHA-256 Canônico LF**: `04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`
  - **Status da Migration 013**: `INSTALLED_VALIDATED` / `REEXECUTION=FORBIDDEN`
  - **Objetos Instalados**:
    - Trigger Function: `public.fn_prevent_terminal_work_order_with_active_appointments()` (`VOLATILE`, `SECURITY DEFINER`, `search_path = ''`, `row_security = off`).
    - Trigger: `trg_prevent_terminal_work_order_with_active_appointments` (invariante terminal impedindo OS `concluida` ou `cancelada` com agendamento ativo).

#### B. Handlers BFF (Nitro / Nuxt 4) — 16 Handlers Executados
- `server/api/admin/crm/appointments/index.post.ts`: Criação de agendamento via `create_appointment_atomic`.
- `server/api/admin/crm/appointments/index.get.ts`: Consulta estruturada de calendário com projeção minimizada `APPOINTMENT_CALENDAR_SELECT`, validação estrita de timestamps RFC3339 com timezone explícito (`CALENDAR_RANGE_RFC3339_EXPLICIT_OFFSET=PASS`), intervalo máximo de 62 dias e sanitização de logs de erro (`CALENDAR_RAW_UPSTREAM_ERROR_LOGGING=NONE`).
- `server/api/admin/crm/appointments/search.post.ts`: Busca estruturada com validação estrita de tipos para `q` (DEFERRED), `staffId`, `clientId`, `status` e `tipo`.
- `server/api/admin/crm/appointments/[id]/index.get.ts`: Detalhes do agendamento.
- `server/api/admin/crm/appointments/[id]/index.patch.ts`: Edição não-temporal via `update_appointment_atomic`.
- `server/api/admin/crm/appointments/[id]/reschedule.post.ts`: Reagendamento via `reschedule_appointment_atomic`.
- `server/api/admin/crm/appointments/[id]/cancel.post.ts`: Cancelamento via `cancel_appointment_atomic`.
- `server/api/admin/crm/appointments/[id]/status.post.ts`: Transição de status via `update_appointment_status_atomic`.
- `server/api/admin/crm/work-orders/[id]/index.patch.ts`: Atualização de OS com CAS atômico (`id = x AND updated_at = y`).
- `server/api/admin/crm/work-orders/[id]/status.post.ts`: Transição de status com verificação atômica de agendamento de instalação ativo e guards.
- `server/api/admin/crm/work-orders/[id]/appointments.get.ts`: Histórico ordenado de agendamentos da OS.
- `server/api/admin/crm/work-orders/index.post.ts`: Criação de OS com rejeição estrita de `data_prevista`/`dataPrevista` (400).
- `server/api/admin/crm/staff/index.get.ts`: Consulta de equipe técnica.
- `server/api/admin/crm/staff/index.post.ts`: Cadastro de técnico.
- `server/api/admin/crm/staff/[id].patch.ts`: Edição e desativação lógica de técnico com validação estrita de booleano.
- `server/api/admin/crm/leads/[id]/convert.post.ts`: Conversão de lead com validação booleana estrita (`criar_os`) e busca de duplicidade fail-closed.

#### C. Utilitários e Helpers Modulares
- `app/utils/phone.ts`: Helper canônico de normalização de números telefônicos e links `tel:` / WhatsApp com suporte a DDD 55 sem duplicar DDI (`BRAZIL_DDD_55_NORMALIZATION=PASS`).
- `server/utils/crmDuplicateSearch.ts`: Busca determinística de duplicidades por telefone, email e CPF/CNPJ com consultas independentes, sem raw postgrest `or=(...)`, fail-closed (503) e zero logging de PII.
- `server/utils/crm.ts`: Utilitários do CRM, auditoria sanitizada e re-export de duplicidades.
- `server/shared/appointmentValidation.mjs`: Validações puras de UUID, RFC3339 com timezone explícito (`isValidRfc3339`), quoting e enums.
- `server/shared/appointmentErrorMap.mjs`: Mapeamento canônico de erros (25 Migration 012 + 1 Migration 013 + 3 aplicação = 29 chaves).
- `server/utils/crmAppointmentErrors.ts`: Formatador de erros HTTP para handlers BFF.
- `server/utils/crmAppointmentHelpers.ts`: Helper de verificação de instalação ativa e relações com `is_archived`, com sanitização fail-closed 503 em falhas de upstream.
- `server/utils/adminAuth.ts`: Guard de autenticação fail-closed (`CENTRAL_ADMIN_GUARD_HARDCODED_BYPASS=NONE`).
- `server/utils/adminAuthSession.ts`: Resolução de sessão com test auth estritamente limitado e e-mail sintético (`test-admin@adt-crm.invalid`).
- `server/utils/adminAuthCookies.ts`: Gestão de cookies de sessão com política fail-closed (`secure: true` para todos os ambientes exceto dev/test).
- `server/shared/adminAuthCore.mjs`: Funções puras de auth, RBAC fail-closed (`admin`, `superadmin`), `isExplicitDevOrTestEnvironment()` e validação CSRF com fail-closed incondicional em produção e ambientes desconhecidos.
- `app/composables/useModalA11y.ts`: Focus Trap, Escape e Restauração Exata de Foco para todos os 10 modais/sheets com suporte a pilha de modais (topmost dismiss).
- `app/composables/useLeadJourneyMedia.ts`: Cache em memória de thumbnails de mídia com renovação segura de signed URLs.
- `app/composables/useSiteMediaUpload.ts` e `app/composables/useLightboxZoom.ts`: Módulos desacoplados de upload e lightbox zoom/pan $\le 200$ linhas.

---

### 3. Dicionário de Códigos de Erro de Domínio

- **MIGRATION_012_DOMAIN_ERROR_CODES = 25**:
  1. `ERR_ADMIN_NOT_ACTIVE` (403)
  2. `ERR_WORK_ORDER_NOT_FOUND` (404)
  3. `ERR_APPOINTMENT_NOT_FOUND` (404)
  4. `ERR_STAFF_NOT_FOUND` (404)
  5. `ERR_STAFF_INACTIVE` (409)
  6. `ERR_WORK_ORDER_ARCHIVED` (409)
  7. `ERR_APPOINTMENT_TERMINAL` (409)
  8. `ERR_CONCURRENCY_CONFLICT` (409)
  9. `ERR_STAFF_SCHEDULE_CONFLICT` (409)
  10. `ERR_ACTIVE_INSTALLATION_EXISTS` (409)
  11. `ERR_STAFF_HAS_ACTIVE_APPOINTMENTS` (409)
  12. `ERR_APPOINTMENT_DRIFT` (409)
  13. `ERR_ADDRESS_CLIENT_MISMATCH` (400)
  14. `ERR_INSTALLATION_WORK_ORDER_STATUS` (400)
  15. `ERR_QUOTE_WORK_ORDER_STATUS` (400)
  16. `ERR_MAINTENANCE_WORK_ORDER_STATUS` (400)
  17. `ERR_WARRANTY_WORK_ORDER_STATUS` (400)
  18. `ERR_WARRANTY_NOT_ACTIVE` (400)
  19. `ERR_INVALID_STATUS_TRANSITION` (400)
  20. `ERR_INVALID_APPOINTMENT_INTERVAL` (400)
  21. `ERR_INVALID_APPOINTMENT_TIPO` (400)
  22. `ERR_RESCHEDULE_REASON_REQUIRED` (400)
  23. `ERR_CANCEL_REASON_REQUIRED` (400)
  24. `ERR_NO_APPOINTMENT_CHANGES` (400)
  25. `ERR_HARD_DELETE_FORBIDDEN` (400)

- **MIGRATION_013_DOMAIN_ERROR_CODES = 1**:
  26. `ERR_ACTIVE_APPOINTMENTS_EXIST` (409 - Guard de integridade para OS terminal com agendamento ativo)

- **APPLICATION_ADDITIONAL_ERROR_CODES = 3**:
  27. `ERR_APPOINTMENT_STALE_VERSION` (409 - Concorrência otimista / CAS)
  28. `ERR_DATA_PREVISTA_MANAGED_BY_AGENDA` (400 - Guard de autoridade de data prevista)
  29. `ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED` (400 - Guard de transição manual para agendada)

- **ERROR_MAP_TOTAL_KEYS = 29** (25 Migration 012 + 1 Migration 013 + 3 Aplicação)

---

### 4. Arquitetura de Autenticação de Teste (Test Auth)

A arquitetura física mantém o runtime de autenticação de teste estritamente delimitado a ambientes de teste e desenvolvimento:
- `TEST_AUTH_RUNTIME_PRESENT_NONPRODUCTION_GATED = YES`
- `TEST_AUTH_REQUIRES_EXPLICIT_DEV_OR_TEST_ENV = YES`
- `TEST_AUTH_REQUIRES_ENABLE_TEST_AUTH_TRUE = YES`
- `PRODUCTION_TEST_AUTH_BYPASS = BLOCKED`
- `UNKNOWN_ENV_TEST_AUTH_BYPASS = BLOCKED`
- `CENTRAL_ADMIN_GUARD_HARDCODED_BYPASS = NONE`
- `TEST_AUTH_MOCK_EMAIL = test-admin@adt-crm.invalid`

---

### 5. Validação e Testes Automatizados

1. **Suíte BFF CRM (`scripts/test_crm_phase5c1_bff.mjs`)**:
   - `BFF_TEST_CASES_EXECUTED = 60`
   - `BFF_TEST_CASES_PASSED = 60` (100% PASS)
   - `BFF_TEST_CASES_FAILED = 0`
   - `BFF_ASYNC_TESTS_UNAWAITED = 0` (prova negativa e auditoria estática concluídas)
   - `CALENDAR_RANGE_RFC3339_EXPLICIT_OFFSET = PASS`
   - `CALENDAR_DATE_ONLY = REJECTED` (400)
   - `CALENDAR_TIMEZONELESS_DATETIME = REJECTED` (400)
   - `CALENDAR_INVALID_SEMANTIC_DATE = REJECTED` (400)
   - `CALENDAR_RAW_UPSTREAM_ERROR_LOGGING = NONE`
   - 16/16 handlers Nitro importados e executados.
   - Minimização de PII validada (`CALENDAR_PII_MINIMIZATION = PASS`).
   - Tratamento estruturado de SQLSTATE (`23P01`, `23505`, `23503`).
   - Zero log de PII em runtime RPC (`RUNTIME_RPC_RAW_PII_LOGGING = NONE`).
   - Fail-closed comprovado em autenticação, CSRF, guards de OS e busca de duplicidades.

2. **Suíte Test Auth Hardening (`scripts/test_admin_auth_hardening.mjs`)**:
   - `AUTH_HARDENING_TESTS_EXECUTED = 7`
   - `AUTH_HARDENING_TESTS_PASSED = 7` (100% PASS)
   - `AUTH_HARDENING_TESTS_FAILED = 0`
   - Matriz completa de 7 cenários fail-closed validada.

3. **Suíte Backend Regressiva (`scripts/test_crm_phase5_backend.mjs`)**:
   - `BACKEND_RPC_ASSERTS_EXECUTED = 85`
   - `BACKEND_RPC_ASSERTS_PASSED = 85` (100% PASS)
   - `BACKEND_RPC_ASSERTS_FAILED = 0`

4. **Auditoria de Linhas de Código**:
   - `APPLICATION_LOGIC_FILES_OVER_200_LINES = 0`
   - `APPLICATION_CODE_FILES_OVER_600_LINES = 0`
   - `CODE_SIZE_POLICY = PASS`

5. **Status de Migrações e Integridade**:
   - `MIGRATION_012_NORMALIZED_SHA = 43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
   - `MIGRATION_013_NORMALIZED_SHA = 04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`
   - `MIGRATION_012_GIT_DIFF = EMPTY`
   - `MIGRATION_013_GIT_DIFF = EMPTY`
   - `MIGRATION_012_REEXECUTED = NO`
   - `MIGRATION_013_REEXECUTED = NO`
   - `PRODUCTION_DATABASE_WRITES = 0`
   - `APPLICATION_DEPLOY = NO`
