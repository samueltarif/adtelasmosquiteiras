# DOCUMENTAÇÃO TÉCNICA — CRM FASE 5.0
## Agenda, Agendamentos, Equipe Operacional, BFF & Hardening de Autenticação (Patch 5.0D.9)

---

### 1. Visão Geral da Fase 5.0 & Patch 5.0D.9

A **Fase 5.0 do CRM** introduziu o motor de agendamentos atômicos, gestão de equipe operacional (*staff*), integração com Ordens de Serviço (OS), proteção de concorrência otimista atômica (*Compare-And-Set*), endurecimento estrito de autenticação e CSRF (*fail-closed*), busca segura e determinística de duplicidades de clientes, minimização de PII em calendário (`APPOINTMENT_CALENDAR_SELECT`), normalização canônica de números telefônicos brasileiros (DDD 55 de Santa Maria/RS sem confundir com DDI 55 do Brasil via `app/utils/phone.ts`), prova real de foco exato de retorno de modais/sheets WAI-ARIA, expansão e auditoria dinâmica física de touch targets $\ge 44\times 44\text{px}$ (`width >= 43.5 && height >= 43.5`) iterando sobre as 10 viewports reais (320 a 1920px) em 11 rotas físicas operacionais e públicas, modais, lightboxes e uploaders (`TOUCH_TARGET_UNDER_44_COUNT = 0`, `TOUCH_TARGET_REQUIRED_EXPECTED_COUNT = 484`, `FOUND = 484`, `MEASURED = 484`, `PASS = 484`, `FAIL = 0`), auditoria global de zero controles interativos aninhados (`NESTED_INTERACTIVE_CONTROLS = 0`), auditoria de zero overflow horizontal sem band-aids (`OVERFLOW_X_HIDDEN_BANDAID_COUNT = 0`), sanitização estrita de logging de erro de cliente (`CLIENT_SIDE_RAW_ERROR_OBJECT_LOGGING = 0`), correção de parser do git status (`AUDIT_GIT_STATUS_PARSER = FIXED`), modularização de `MediaUploader.vue` e `useFormSubmit.js`, e conformidade com limites de linhas (`APPLICATION_LOGIC_FILES_OVER_200_LINES = 0`, `APPLICATION_CODE_FILES_OVER_600_LINES = 0`, `CODE_SIZE_POLICY = PASS`).

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

#### B. Handlers BFF (Nitro / Nuxt 4) — 16 Handlers Executados
- `server/api/admin/crm/appointments/index.post.ts`: Criação de agendamento via `create_appointment_atomic`.
- `server/api/admin/crm/appointments/index.get.ts`: Consulta estruturada de calendário com projeção minimizada `APPOINTMENT_CALENDAR_SELECT` e validação estrita 400 em filtros e intervalos temporais (máximo 62 dias).
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
- `server/shared/appointmentValidation.mjs`: Validações puras de UUID, RFC3339 com timezone, quoting e enums.
- `server/shared/appointmentErrorMap.mjs`: Mapeamento canônico de erros (25 Migration 012 + 3 aplicação = 28 chaves).
- `server/utils/crmAppointmentErrors.ts`: Formatador de erros HTTP para handlers BFF.
- `server/utils/crmAppointmentHelpers.ts`: Helper de verificação de instalação ativa e relações com `is_archived`.
- `server/utils/adminAuth.ts`: Guard de autenticação fail-closed sem tokens de teste em runtime.
- `server/shared/adminAuthCore.mjs`: Funções puras de auth, RBAC fail-closed (`admin`, `superadmin`) e validação CSRF Same-Origin com fail-closed em produção.
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

- **APPLICATION_ADDITIONAL_ERROR_CODES = 3**:
  26. `ERR_APPOINTMENT_STALE_VERSION` (409 - Concorrência otimista / CAS)
  27. `ERR_DATA_PREVISTA_MANAGED_BY_AGENDA` (400 - Guard de autoridade de data prevista)
  28. `ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED` (400 - Guard de transição para agendada)

- **ERROR_MAP_TOTAL_KEYS = 28**

---

### 4. Validação e Testes Automatizados

1. **Suíte de Testes E2E com Browser Real Playwright (`scripts/test_admin_ui_phase5d_browser.mjs`)**:
   - 663/663 asserts aprovados (100% PASS).
   - `UI_BROWSER_ASSERTS=PASS`.
   - `UI_BROWSER_ASSERTS_TOTAL=663/663`.
   - Prova real dos 10 modais/sheets com abertura, Focus Trap, Escape e restauração exata de foco ao trigger disparador (`MODAL_FOCUS_RESTORE_EXACT_TRIGGER=PASS`).
   - Auditoria de zero overflow horizontal em 10 viewports (320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1920) em 11 rotas operacionais e públicas (`ZERO_HORIZONTAL_OVERFLOW=PASS`, `OVERFLOW_X_HIDDEN_BANDAID_COUNT=0`).
   - Touch targets $\ge 44\times 44\text{px}$ auditados iterando sobre as 10 viewports reais em todos os controles operacionais e estados profundos (`TOUCH_TARGET_MIN_44PX=PASS`, `TOUCH_TARGET_UNDER_44_COUNT=0`, `TOUCH_TARGET_REQUIRED_EXPECTED_COUNT=484`, `FOUND=484`, `MEASURED=484`, `PASS=484`, `FAIL=0`).
   - Controles interativos aninhados: 0 em todas as rotas operacionais e estados profundos (`NESTED_INTERACTIVE_CONTROLS=0`).
   - Normalização de telefone e WhatsApp com DDD 55 (`BRAZIL_DDD_55_NORMALIZATION=PASS`, `DDD55_WORK_ORDER_CARD_LINK=PASS`).
   - Data civil `data_prevista` sem deslocamento UTC em cards e tabelas (`DATA_PREVISTA_DATE_ONLY_ALL_CONSUMERS=PASS`).
   - Zero console errors inesperados no browser (`BROWSER_UNEXPECTED_CONSOLE_ERRORS=0`, `BROWSER_UNEXPECTED_PAGE_ERRORS=0`, `BROWSER_UNEXPECTED_NETWORK_5XX=0`).

2. **Suíte UI e Domínio CRM (`scripts/test_admin_ui_phase5d.mjs`)**:
   - 36/36 testes aprovados (100% PASS).
   - Timezone operacional `America/Sao_Paulo` (zero hardcoded `-03:00`).
   - Helper puro `formatDateOnly` sem deslocamento UTC para datas `YYYY-MM-DD`.
   - Alinhamento da UI legada: `DATA_PREVISTA_UI_LEGACY_MUTATIONS=0`, `MANUAL_AGENDADA_UI_MUTATIONS=0`.
   - `WORK_ORDER_DATA_PREVISTA_AUTHORITY=APPOINTMENT_INSTALLATION_SCHEDULE`.
   - `CLIENT_SIDE_RAW_ERROR_OBJECT_LOGGING=0` (scanner global dinâmico em `app/`).
   - `BRAZIL_DDD_55_NORMALIZATION=PASS`.

3. **Suíte BFF CRM (`scripts/test_crm_phase5c1_bff.mjs`)**:
   - 49/49 asserts aprovados (100% PASS).
   - 16/16 handlers Nitro executados.
   - Minimização de PII validada (`CALENDAR_PII_MINIMIZATION=PASS`).
   - Tratamento estruturado de SQLSTATE (`23P01`, `23505`, `23503`).
   - Zero log de PII em runtime RPC (`RUNTIME_RPC_RAW_PII_LOGGING=NONE`).
   - Zero bypass tokens no runtime (`DEV_MOCK_AUTH_RUNTIME=REMOVED`).
   - Fail-closed comprovado em autenticação, CSRF, guards de OS e busca de duplicidades.

4. **Suíte de Auth & Segurança (`scripts/test_admin_performance_patch1.mjs`)**:
   - 70/70 testes aprovados (100% PASS).
   - Criptografia assimétrica JWKS (ES256/RS256).
   - Rate limiting de rotação JWKS.
   - Single flight deduplication.
   - CSRF em produção fail-closed incondicional.

5. **Auditoria de Linhas de Código (Git Diff Real & Global)**:
   - `DEPLOY_DIFF_SOURCE=git status --porcelain=v1 -z`
   - `DEPLOY_DIFF_APPLICATION_LOGIC_FILES_OVER_200=0`
   - `DEPLOY_DIFF_APPLICATION_CODE_FILES_OVER_600=0`
   - `APPLICATION_LOGIC_FILES_OVER_200_LINES=0`
   - `APPLICATION_CODE_FILES_OVER_600_LINES=0`
   - `CODE_SIZE_POLICY=PASS`

6. **Status de Produção e Integridade**:
   - `MIGRATION_012_LOGIC_CHANGED = NO`
   - `MIGRATION_012_REEXECUTED = NO`
   - `MIGRATION_013_CREATED = NO`
   - `PRODUCTION_DATABASE_WRITES = 0`
   - `APPLICATION_DEPLOY = NO`
