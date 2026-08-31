# PLANO DE IMPLEMENTAÇÃO — CRM AD TELAS MOSQUITEIRAS
## Arquivo Canônico de Continuidade e Governança do Projeto

> [!IMPORTANT]
> **CANONICAL_IMPLEMENTATION_PLAN_LOCATION = REPOSITORY_ROOT**
> Este é o documento canônico de governança e estado de fases do projeto.

---

## Status Consolidado das Fases

| Fase | Status |
|---|---|
| `FASE_5_0A` — Arquitetura e Contratos de Dados | `COMPLETE` |
| `FASE_5_0B` — Migration 012 (Motor de Agenda + Equipe) | `COMPLETE` |
| `FASE_5_0C` — Nitro BFF + Types + Guards (Patch 5.0C.1–5) | `COMPLETE_VALIDATED` |
| `FASE_5_0D.1` — Auditoria e Homologação da UI Existente | `APPROVED` |
| `FASE_5_0D.2` — Correção dos Blockers Legados de UI | `APPROVED` |
| `FASE_5_0D.3` — Final UI & Runtime Hardening / Playwright E2E Gate | `COMPLETE_VALIDATED` |
| `FASE_5_0D.4` — Final UI Evidence & Deploy Gate Fixes | `COMPLETE_VALIDATED` |
| `FASE_5_0D.5` — Final Deploy-Diff Evidence & UI Hygiene | `COMPLETE_VALIDATED` |
| `FASE_5_0D.6` — Final Release Gate Corrections | `COMPLETE_VALIDATED` |
| `FASE_5_0D.7` — Final Touch Target Coverage & Doc Consistency | `COMPLETE_VALIDATED` |
| `FASE_5_0D.8` — Final Touch Target Release Gate & Dynamic Measurement | `COMPLETE_VALIDATED` |
| `FASE_5_0D.9` — Final Touch Audit Evidence Hardening (Canonical 44x44) | `COMPLETE_VALIDATED` |
| `FASE_5_0D` — UI Agenda / Equipe / Ordens de Serviço | `READY_FOR_DEPLOY` |

---

## Migration 012 — Estado Absoluto

> [!CAUTION]
> **MIGRATION_012_REEXECUTION = FORBIDDEN**
> A Migration 012 já está fisicamente instalada no Supabase de produção.
> **NÃO reaplicar sob nenhuma hipótese.**
> **NÃO criar Migration 013 sem aprovação explícita.**

- **Arquivo**: `supabase/manual/012_crm_appointments_and_staff_engine.sql`
- **Status**: `MIGRATION_012 = INSTALLED_VALIDATED`
- **SHA-256 Canônico LF**: `43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
- **MIGRATION_012_LOGIC_CHANGED** = `NO`
- **MIGRATION_012_REEXECUTED** = `NO`
- **PRODUCTION_DATABASE_WRITES** = `0`
- **APPLICATION_DEPLOY** = `NO`

---

## Relatório de Execução do Patch 5.0D.9

```ini
PATCH_5_0D_9_STATUS=COMPLETE_VALIDATED
TOUCH_TARGET_DIMENSION_POLICY=WIDTH_AND_HEIGHT_MIN_44
TOUCH_TARGET_SILENT_SKIP=DISABLED
TOUCH_TARGET_REQUIRED_EXPECTED_COUNT=484
TOUCH_TARGET_REQUIRED_FOUND_COUNT=484
TOUCH_TARGET_REQUIRED_MEASURED_COUNT=484
TOUCH_TARGET_REQUIRED_PASS_COUNT=484
TOUCH_TARGET_REQUIRED_FAIL_COUNT=0
TOUCH_TARGET_OPTIONAL_SKIPPED_COUNT=36
TOUCH_TARGET_UNDER_44_COUNT=0
TOUCH_TARGET_MIN_44PX=PASS
TOUCH_TARGET_DYNAMIC_DOM_SCAN=PASS
TOUCH_TARGET_CRITICAL_CONTROL_SCAN=PASS
CLIENT_ADDRESS_MODAL_RUNTIME_AUDITED=YES
MEDIA_LIGHTBOX_RUNTIME_AUDITED=YES
MEDIA_UPLOADER_RUNTIME_AUDITED=YES
CLIENT_CLEAR_SEARCH_RUNTIME_AUDITED=YES
STAFF_PHONE_EMAIL_RUNTIME_AUDITED=YES
WORK_ORDER_ALL_TABS_TOUCH_AUDITED=YES
PHOTO_UPLOADER_RUNTIME_RELEASE_USAGE=NO
TOUCH_TARGET_ROUTES_AUDITED=/admin/agenda,/admin/equipe,/admin/ordens-servico,/admin/ordens-servico/nova,/admin/ordens-servico/:id,/admin/leads,/admin/galeria,/admin/clientes,/admin/clientes/:id,/orcamento,/contato
ZERO_HORIZONTAL_OVERFLOW=PASS
OVERFLOW_X_HIDDEN_BANDAID_COUNT=0
NESTED_INTERACTIVE_CONTROLS=0
TOTAL_E2E_ASSERTS=663
BROWSER_PRIVATE_ROUTE_ASSERTS=9
BROWSER_VIEWPORT_ASSERTS=127
BROWSER_SINGLE_FETCH_ASSERTS=5
BROWSER_TOUCH_TARGET_ASSERTS=496
BROWSER_NESTED_CONTROL_ASSERTS=11
BROWSER_MODAL_A11Y_ASSERTS=10
BROWSER_LEGACY_UI_ASSERTS=5
E2E_PASS_COUNT=663
E2E_FAIL_COUNT=0
NPM_BUILD=PASS
APPLICATION_LOGIC_FILES_OVER_200_LINES=0
APPLICATION_CODE_FILES_OVER_600_LINES=0
CLIENT_SIDE_RAW_ERROR_OBJECT_LOGGING=0
MIGRATION_012_REEXECUTED=NO
PRODUCTION_DATABASE_WRITES=0
APPLICATION_DEPLOY=NO
FINAL_ZIP_INTERNAL_PLAN_MATCH=YES
PHASE_5_0D_READY_FOR_EXTERNAL_RELEASE_REVIEW=YES
PHASE_5_0D_READY_FOR_DEPLOY=YES
```

---

## Suítes de Testes e Resultados Consolidados

| Suíte de Teste | Asserts / Testes | Status | Detalhes |
|---|:---:|:---:|---|
| `scripts/test_admin_ui_phase5d_browser.mjs` | **663/663** | `100% PASS` | Playwright E2E real: 10 modais a11y, 10 viewports em 11 rotas operacionais e públicas (`/admin/agenda`, `/admin/equipe`, `/admin/ordens-servico`, `/admin/ordens-servico/nova`, `/admin/ordens-servico/:id` [todas as 7 abas], `/admin/leads`, `/admin/galeria`, `/admin/clientes`, `/admin/clientes/:id`, `/orcamento`, `/contato`), ClientAddressManager modal, LeadJourneyDrawer, MediaLightbox, MediaUploader, cards de staff, botão X limpar pesquisa de clientes, staff tel/mailto, touch targets $\ge 44\times 44\text{px}$ com medição estrita (`TOUCH_TARGET_UNDER_44_COUNT=0`, `EXPECTED=FOUND=MEASURED=PASS=484`), DDD 55 no DOM, data_prevista date-only civil, zero controles aninhados (`NESTED_INTERACTIVE_CONTROLS=0`), zero overflow, console errors = 0 |
| `scripts/test_admin_ui_phase5d.mjs` | **36/36** | `100% PASS` | Timezone SP, 409 CAS, URL state, Staff scopes, Guards, A11y, formatDateOnly, DDD 55, scanner de logs brutos no client = 0 |
| `scripts/test_crm_phase5c1_bff.mjs` | **49/49** | `100% PASS` | 16 Handlers Nitro, SQLSTATE estruturado, Zero PII Logging, Fail-closed, Guards OS |
| `scripts/test_admin_performance_patch1.mjs` | **70/70** | `100% PASS` | Auth, JWKS ES256/RS256, CSRF Same-Origin Fail-Closed |
| `scripts/audit_git_diff_loc.mjs` | — | `100% PASS` | Diff real (`git status --porcelain=v1 -z`): `APPLICATION_LOGIC_FILES_OVER_200 = 0`, `CODE_SIZE_POLICY = PASS` |
| `scripts/scan_raw_logs.js` | — | `100% PASS` | Zero logs brutos no diretório `app/` (`CLIENT_SIDE_RAW_ERROR_OBJECT_LOGGING=0`) |
| `npm run build` | 0 erros | `100% PASS` | Build Vite/Nitro Client + SSR Server 100% limpo |

---

## Pacote Delta de Revisão Externa

- **Arquivo**: `phase_5_0d9_delta_external_review.zip`
- **Sidecar**: `phase_5_0d9_delta_external_review.zip.sha256`

---

## Governança de Código e Limites Estritos

- **APPLICATION_LOGIC_MAX_LINES** = `200`
- **APPLICATION_CODE_MAX_LINES** = `600`
- **APPLICATION_LOGIC_FILES_OVER_200_LINES** = `0`
- **APPLICATION_CODE_FILES_OVER_600_LINES** = `0`
- **MAX_APPLICATION_LOGIC_FILE_LINES** = `199`
- **MAX_APPLICATION_CODE_FILE_LINES** = `476`
- **CODE_SIZE_POLICY** = `PASS`
- **MISSING_LOCAL_IMPORTS** = `0`
