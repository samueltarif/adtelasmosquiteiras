# DOCUMENTO DE HANDOFF E CONTINUIDADE — CRM AD TELAS MOSQUITEIRAS
## Transição de Sessão / Continuidade em Novo Ambiente (Antigravity)

---

## 1. Status Atual do Projeto

- **Fase 5.0A (Arquitetura e Contratos de Dados)**: `COMPLETE / APPROVED`
- **Fase 5.0B (Construção, Testes e Instalação da Migration 012 em Produção)**: `COMPLETE`
  - **Arquivo Canônico da Migration 012**: `supabase/manual/012_crm_appointments_and_staff_engine.sql`
  - **SHA-256 Canônico Instalado**: `43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
  - **Regra Absoluta de Reexecução**: `MIGRATION_012_REEXECUTION=FORBIDDEN` (A Migration 012 já está fisicamente instalada no Supabase de produção e **NÃO DEVE** ser reaplicada sob nenhuma hipótese).
  - **Ambiente de Produção**: PostgreSQL 17 / Supabase (Schema `public`, projeto `axjqhxpejwkuabeaoyaz`).
  - **5 Stored Procedures (RPCs) Instaladas**:
    1. `create_appointment_atomic`
    2. `update_appointment_atomic`
    3. `reschedule_appointment_atomic`
    4. `cancel_appointment_atomic`
    5. `update_appointment_status_atomic`
- **Fase 5.0C (Backend, Endpoints BFF, Invariantes e Migration 013 em Produção)**: `COMPLETE_VALIDATED`
  - **Arquivo Canônico da Migration 013**: `supabase/manual/013_work_order_terminal_appointment_guard.sql`
  - **SHA-256 Canônico Instalado**: `04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`
  - **Regra Absoluta de Reexecução**: `MIGRATION_013_REEXECUTION=FORBIDDEN` (A Migration 013 já está fisicamente instalada e validada em produção e **NÃO DEVE** ser reaplicada).
  - **Objetos Instalados**:
    - Trigger Function: `public.fn_prevent_terminal_work_order_with_active_appointments()` (`VOLATILE`, `SECURITY DEFINER`, `search_path = ''`, `row_security = off`, `REVOKE ALL FROM PUBLIC, anon, authenticated, service_role`).
    - Trigger: `trg_prevent_terminal_work_order_with_active_appointments` (`BEFORE UPDATE OF status_os ON public.work_orders FOR EACH ROW WHEN (OLD.status_os IS DISTINCT FROM NEW.status_os AND NEW.status_os IN ('concluida', 'cancelada'))`).
  - **Postflight Read-Only de Produção**: `PASS` (100% dos testes aprovados, zero mutações em dados reais).
- **Fase 5.0D.0 (Runtime Integration & UI Stabilization)**: `COMPLETE_VALIDATED`
  - `PHASE_5_0D_0_STATUS = COMPLETE_VALIDATED`
  - **Bug 1 — WorkOrdersSearch PGRST100**:
    - **Causa Raiz**: `or=()` PostgREST com `client.nome.ilike.*q*` — o PostgREST não suporta dot-notation em tabelas relacionadas via embedding dentro de `or=()`. Coluna `nome` pertence a `clients`, não a `work_orders`.
    - **Correção**: `server/api/admin/crm/work-orders/search.post.ts` — busca em dois passos no BFF: resolve `client_id[]` de `clients` por nome/telefone, depois usa `client_id.in.(...)` em `work_orders`. Nunca usa `or=()` com colunas relacionadas.
    - `WORK_ORDER_SEARCH_PGRST100 = FIXED`
  - **Bug 2 — AppointmentsList HTTP 400**:
    - **Causa Raiz**: FKs compostas na `appointments` (`fk_appointments_work_order_client` e `fk_appointments_client_address`) geram ambiguidade no PostgREST para embeddings sem `!constraint_name`. Além disso, `client:clients(...)` não existe como FK direta de `appointments` — `appointments.client_id` não tem FK para `clients` diretamente.
    - **Correção**: `server/utils/crmAppointmentHelpers.ts` — `APPOINTMENT_CALENDAR_SELECT` e `APPOINTMENT_DETAIL_SELECT` agora usam `work_order:work_orders!fk_appointments_work_order_client(id,numero_os,status_os,client:clients(id,nome))` (nested) e `address:client_addresses!fk_appointments_client_address(...)`. Campo `client` normalizado para raiz do objeto no BFF.
    - `APPOINTMENTS_LIST_400 = FIXED`
  - `DIRECT_SUPABASE_SEARCH_FROM_MODAL = NO`
  - `RAW_SUPABASE_ERROR_LOGGING = NO`
  - `H3_LONG_STATUS_MESSAGE_WARNINGS = 0` (nos fluxos tocados)
  - `APPOINTMENT_DUPLICATE_FETCH = NO` (flag `isInitialMounting` já prevenia corretamente)
  - `BUILD_STATUS = PASS` (exit code 0)
  - `SUPABASE_MCP_WRITES = 0`
  - `PRODUCTION_DATABASE_WRITES = 0`
  - `MIGRATION_012_REEXECUTED = NO`
- **Hotfix — Concorrência 409 & Preservação Exata de Token**: `COMPLETE_VALIDATED`
  - `CONCURRENCY_409_ROOT_CAUSE = new Date(expected_appointment_updated_at).toISOString() perdia precisão submilissegundo do timestamptz PostgreSQL`
  - `CONCURRENCY_TOKEN_PRESERVED_EXACTLY = YES`
  - `STATUS_SUBMISSION_MUTEX = IMPLEMENTED`
  - `STATUS_REQUEST_COUNT_PER_CLICK = 1`
  - `FRESH_DETAIL_STATUS_TRANSITION = PASS`
  - `STALE_TOKEN_409_BEHAVIOR = PASS`
  - `POST_409_DETAIL_REFRESH = PASS`
  - `CONCURRENCY_USER_MESSAGE = NEUTRALIZED`
  - `STARTTIME_APPLICATION_RUNTIME_REFERENCE_COUNT = 0`
  - `STARTTIME_ERROR_SOURCE = NOT_CONFIRMED`
  - `STARTTIME_EXTERNAL_INSTRUMENTATION_SUSPECTED = YES`
  - `BUILD_STATUS = PASS (exit code 0)`
  - `MIGRATION_012_CHANGED = NO`
  - `MIGRATION_013_CHANGED = NO`
  - `SUPABASE_MCP_WRITES = 0`
  - `PRODUCTION_DATABASE_WRITES = 0`
  - `APPLICATION_DEPLOY = NO`


---

## 2. Backup Lógico de Segurança de Produção

- **Backup Pré-Migration 012**:
  - Snapshot lógico local pré-012: `backups/pre_migration_012_20260828_153949.sql` (SHA: `31C930E066764A635E2EF77B0ABAF916B3320E5FFB2039EF8AD9CDB00AF8DB34`).
- **Backup Pré-Migration 013 (Fresco da Fase 5.0C.4D)**:
  - **Arquivo de Backup Local**: `backups/pre_migration_013_20260901_164555.sql`
  - **Tamanho do Arquivo**: `320289` bytes
  - **SHA-256 do Arquivo**: `F4D6DBD91D4AF6C8BB439B0AEC2FA8914905503AF953A32CE729323A3DEE4AF4`
  - **Validação de Restore Local em PostgreSQL 17**: `PASS` (100% íntegro em todas as 24 tabelas, baseline 012 verificado, ausência de 013 confirmada antes da aplicação).
  - **Segurança de Dados Pessoais / Secrets**: O diretório `backups/` permanece listado no `.gitignore`. **NUNCA** fazer commit ou push do arquivo de backup e nunca expor seu conteúdo.

---

## 3. Próxima Etapa de Desenvolvimento

- **Estado Atual do Projeto**: `CURRENT_PROJECT_STATE = PHASE_5_0D_PRODUCTION_COMPLETE`
- **Status da Fase 5.0C**: `PHASE_5_0C_FINAL_STATUS = COMPLETE_VALIDATED`
- **Status da Fase 5.0D.0 (Runtime Integration & UI Stabilization)**: `PHASE_5_0D_0_STATUS = COMPLETE_VALIDATED`
- **Status de Implementação da Fase 5.0D (Admin UI, Agenda & Equipe)**:
  - `PHASE_5_0D_IMPLEMENTATION_STATUS = COMPLETE_VALIDATED`
  - `PHASE_5_0D_PRODUCTION_RELEASE_AUTHORIZED = YES`
  - `PHASE_5_0D_PRODUCTION_DEPLOY = COMPLETE`
  - `PHASE_5_0D_PRODUCTION_VALIDATED = YES`
- **Governança da Migration 013**:
  - `MIGRATION_013_INSTALLED_PRODUCTION = YES`
  - `MIGRATION_013_PRODUCTION_VALIDATED = YES`
  - `MIGRATION_013_CANONICAL_FILE = supabase/manual/013_work_order_terminal_appointment_guard.sql`
  - `MIGRATION_013_CANDIDATE_SHA256 = 04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`
  - `FUNCTION_INSTALLED = YES`
  - `TRIGGER_INSTALLED = YES`
  - `TRIGGER_ENABLED = YES`
  - `TRIGGER_TIMING = BEFORE`
  - `TRIGGER_EVENT = UPDATE`
  - `TRIGGER_COLUMN_EXACT = YES`
  - `TRIGGER_WHEN_SEMANTICS = PASS`
  - `FUNCTION_SECURITY_DEFINER = YES`
  - `FUNCTION_EMPTY_SEARCH_PATH = YES`
  - `FUNCTION_ROW_SECURITY_OFF = YES`
  - `FUNCTION_DIRECT_EXECUTE_ALL_ROLES = DENIED`
  - `MIGRATION_012_BASELINE_POSTFLIGHT = PASS`
  - `RLS_POSTFLIGHT = PASS`
  - `APPOINTMENTS_LEAST_PRIVILEGE_POSTFLIGHT = PASS`
  - `CANCELLED_WITH_ACTIVE_APPOINTMENT_COUNT = 0`
  - `CONCLUDED_WITH_ACTIVE_NON_WARRANTY_COUNT = 0`
  - `PRODUCTION_OPERATIONAL_COUNTS_UNCHANGED = YES`
  - `PRODUCTION_TEST_DATA_CREATED = NO`
  - `PRODUCTION_DATABASE_WRITES_FROM_TESTS = 0`
  - `MIGRATION_012_REEXECUTED = NO`
  - `MIGRATION_013_REEXECUTED = NO`
  - `APPLICATION_DEPLOY = NO`
  - `READY_FOR_PHASE_5D_PRODUCTION_RELEASE_REVIEW = YES`
- **Escopo e Semântica do Invariante Terminal**:
  - `TERMINAL_INVARIANT_SCOPE = SUPPORTED_APPLICATION_AND_RPC_MUTATION_PATHS`
  - `TERMINAL_INVARIANT_WARRANTY_COMPATIBLE = YES`
  - `CONCLUDED_ACTIVE_WARRANTY_ALLOWED = YES`
  - **Matriz Canônica de Estados Terminais**:
    - `cancelada` + qualquer agendamento ativo (`agendado`, `confirmado`, `em_deslocamento`) $\to$ **BLOCK** (`ERR_ACTIVE_APPOINTMENTS_EXIST` / 409)
    - `concluida` + agendamento ativo não-garantia (`visita_tecnica`, `medicao`, `instalacao`, `manutencao`) $\to$ **BLOCK** (`ERR_ACTIVE_APPOINTMENTS_EXIST` / 409)
    - `concluida` + agendamento ativo tipo `garantia` $\to$ **ALLOW**
- **Plano de Implementação Canônico**: `implementation_plan.md` (raiz do repositório). Em caso de divergência com qualquer outro documento, o `implementation_plan.md` prevalece.
- **Objetivos Cumpridos da Fase 5.0D & Patch 5.0D.9**:
  1. Módulo de Agenda (`/admin/agenda`): visões Mês, Semana, Dia, Lista, navegação temporal, "Hoje", filtros estruturados, timezone `America/Sao_Paulo`;
  2. Módulo de Equipe (`/admin/equipe`): listagem, cadastro, edição e desativação lógica sem `DELETE` físico (`aria-labelledby="staff-deactivate-title"` verificado), com links de telefone (`tel:`) e email (`mailto:`) em cards mobile atendendo $\ge 44\times 44\text{px}$ (`STAFF_PHONE_EMAIL_TOUCH_TARGET=PASS`);
  3. Integração de OS (`/admin/ordens-servico/:id`): navegação e auditoria física em todas as 7 abas operacionais (Geral, Itens, Orçamentos, Mídias, Notas, Agendamentos, Histórico) com `WORK_ORDER_ALL_TABS_TOUCH_AUDITED=YES`;
  4. Alinhamento da UI legada: remoção de input e envio de `data_prevista` em `nova.vue`, `WorkOrderGeneralEditModal.vue` e `LeadConversionModal.vue`;
  5. Bloqueio de transição manual para `agendada` em `WorkOrderStatusModal.vue` com orientação e CTA para Agenda;
  6. `WORK_ORDER_DATA_PREVISTA_AUTHORITY=APPOINTMENT_INSTALLATION_SCHEDULE`;
  7. `DATA_PREVISTA_UI_LEGACY_MUTATIONS=0` e `MANUAL_AGENDADA_UI_MUTATIONS=0`;
  8. Acessibilidade, Focus Trap e Restauração Exata de Foco em 100% dos 10 modais/sheets com suporte a pilha de modais (`useModalA11y.ts`, `role="dialog"`, `aria-modal="true"`, `MODAL_FOCUS_RESTORE_EXACT_TRIGGER=PASS`);
  9. Responsividade auditada em 10 viewports (320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1920) em 11 rotas operacionais e públicas (`/admin/agenda`, `/admin/equipe`, `/admin/ordens-servico`, `/admin/ordens-servico/nova`, `/admin/ordens-servico/:id`, `/admin/leads`, `/admin/galeria`, `/admin/clientes`, `/admin/clientes/:id`, `/contato`, `/orcamento`) com `ZERO_HORIZONTAL_OVERFLOW=PASS` e `OVERFLOW_X_HIDDEN_BANDAID_COUNT=0`;
  10. Auditoria Dinâmica Real de Touch Targets ($\ge 44\times 44\text{px}$ canônico, `width >= 43.5 && height >= 43.5`): medição física via Playwright `boundingBox` com gate estrito `TOUCH_TARGET_REQUIRED_EXPECTED_COUNT=484`, `FOUND=484`, `MEASURED=484`, `PASS=484`, `FAIL=0`, `TOUCH_TARGET_UNDER_44_COUNT=0` e `TOUCH_TARGET_MIN_44PX=PASS`;
  11. Scanner dinâmico DOM complementar cobrindo `button, a[href], input, select, textarea, [role="button"], [role="link"], [tabindex="0"]` com 0 violações;
  12. Estados profundos obrigatórios auditados: ClientAddressManager modal, LeadJourneyDrawer, MediaLightbox, MediaUploader com arquivo, botão X limpar pesquisa de clientes, Staff tel/mailto, OS todas as 7 abas, Agenda visões Mês/Semana/Dia/Lista;
  13. `PHOTO_UPLOADER_RUNTIME_RELEASE_USAGE=NO`;
  14. Auditoria global de controles interativos não aninhados em todas as rotas operacionais e estados profundos (`NESTED_INTERACTIVE_CONTROLS=0`);
  15. Normalização canônica de telefone e WhatsApp via `app/utils/phone.ts` com suporte a DDD 55 sem duplicar DDI (`BRAZIL_DDD_55_NORMALIZATION=PASS`, `DDD55_WORK_ORDER_CARD_LINK=PASS`);
  16. Data civil `data_prevista` tratada exclusivamente com `formatDateOnly()` (`DATA_PREVISTA_DATE_ONLY_ALL_CONSUMERS=PASS`);
  17. Zero logging de objetos de erro brutos no cliente (`CLIENT_SIDE_RAW_ERROR_OBJECT_LOGGING=0`);
  18. Limites de tamanho de código respeitados: `APPLICATION_LOGIC_FILES_OVER_200_LINES=0`, `APPLICATION_CODE_FILES_OVER_600_LINES=0`, `CODE_SIZE_POLICY=PASS`;
  19. Testes automatizados executados e 100% aprovados:
      - `node scripts/test_crm_migration013_local.mjs` (58/58 ASSERTS PASSOU, `100% PASS`);
      - `node scripts/test_crm_phase5c1_bff.mjs` (54/54 TESTES PASSOU, `CURRENT_BFF_ASSERTS=54`, `100% PASS`);
      - `node scripts/test_admin_ui_phase5d_browser.mjs` (673/673 ASSERTS PASSOU, `UI_BROWSER_ASSERTS=PASS`);
      - `node scripts/test_admin_ui_phase5d.mjs` (44/44 TESTES PASSOU, `100% PASS`);
      - `node scripts/test_admin_performance_patch1.mjs` (70/70 TESTES PASSOU, `100% PASS`);
      - `node scripts/audit_git_diff_loc.mjs` (`APPLICATION_LOGIC_FILES_OVER_200=0`, `PASS`);
      - `node scripts/scan_raw_logs.js` (`RAW LOGS COUNT=0`, `PASS`);
      - `node scripts/test_hotfix_concurrency_409.mjs` (7/7 PASS, `100% PASS`);
      - `npm run build` (`BUILD STATUS = PASS`, exit code 0).

---

## 4. Matriz dos 12 Endpoints Nitro BFF Aprovados

| # | Método | Rota | Descrição | Mecanismo / RPC |
|---|---|---|---|---|
| 1 | `GET` | `/api/admin/crm/appointments` | Consulta de calendário estruturada (máx 62 dias, `CALENDAR_PII_MINIMIZATION=PASS`) | Select indexado + Joins |
| 2 | `POST` | `/api/admin/crm/appointments/search` | Busca estruturada no body (`TEXT_Q_SEARCH_ENABLED=NO`, `SEARCH_PII_SEMANTICS=DEFERRED`) | Body (`readBody`) + Joins |
| 3 | `POST` | `/api/admin/crm/appointments` | Criação atômica de agendamento | `create_appointment_atomic` |
| 4 | `GET` | `/api/admin/crm/appointments/:id` | Detalhes do agendamento com histórico e relações | Select detalhado + relações |
| 5 | `PATCH` | `/api/admin/crm/appointments/:id` | Edição não-temporal (staff, address, observações) | `update_appointment_atomic` |
| 6 | `POST` | `/api/admin/crm/appointments/:id/reschedule` | Reagendamento com preservação histórica | `reschedule_appointment_atomic` |
| 7 | `POST` | `/api/admin/crm/appointments/:id/cancel` | Cancelamento com justificativa obrigatória | `cancel_appointment_atomic` |
| 8 | `POST` | `/api/admin/crm/appointments/:id/status` | Transição de status operacional | `update_appointment_status_atomic` |
| 9 | `GET` | `/api/admin/crm/work-orders/:id/appointments` | Histórico cronológico completo de agendamentos da OS | Select ordenado por data/hora |
| 10 | `GET` | `/api/admin/crm/staff` | Listagem da equipe técnica com filtros | Select estruturado |
| 11 | `POST` | `/api/admin/crm/staff` | Cadastro de membro da equipe (`is_active = true`) | Service role INSERT |
| 12 | `PATCH` | `/api/admin/crm/staff/:id` | Atualização de dados da equipe | Service role PATCH + Trigger check |

> [!NOTE]
> **Semântica de Busca Textual / PII no BFF**:
> - `TEXT_Q_SEARCH_ENABLED=NO`: A busca textual genérica com termo livre `q` está temporariamente desativada no BFF para prevenir sobrecarga e vazamento indevido de PII via query string.
> - `SEARCH_PII_SEMANTICS=DEFERRED`: Filtros estruturados (`status`, `tipo`, `staffId`, `clientId`) são suportados e validados no body via POST.
> - `SEARCH_PII_SAFE_DB_RPC_REQUIRED=YES`: Qualquer implementação futura de busca textual exigirá RPC segura com índices dedicados no banco.

---

## 5. Regras de Integridade de `data_prevista` (Implementado e Validado)

- **Status**: `IMPLEMENTED_VALIDATED`
- **Flag**: `DATA_PREVISTA_APPLICATION_GUARD_REQUIRED=YES`
- **Autoridade Única**: `WORK_ORDER_DATA_PREVISTA_AUTHORITY=APPOINTMENT_INSTALLATION_SCHEDULE`
- **Contexto**: A Migration 012 centralizou a regra de negócio na RPC, mas os endpoints legados de aplicação precisam barrar qualquer tentativa de bypass:
  - `PATCH /api/admin/crm/work-orders/:id`: Rejeita campos `data_prevista` e `dataPrevista` com erro `400` (`ERR_DATA_PREVISTA_MANAGED_BY_AGENDA`).
  - `POST /api/admin/crm/work-orders/:id/status`: Rejeita transição manual direta para `status_os = 'agendada'` com erro `400` (`ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED`). Rejeita regressão manual de `agendada` para `aguardando_agendamento` caso exista instalação ativa com erro `409` (`ERR_ACTIVE_INSTALLATION_EXISTS`). Rejeita `data_prevista`.
  - `POST /api/admin/crm/work-orders`: Rejeita definição manual de `data_prevista` / `dataPrevista` na criação da OS com erro `400`.
  - `POST /api/admin/crm/leads/:id/convert`: Rejeita `os_data.data_prevista` / `os_data.dataPrevista` na conversão do lead com erro `400`.
- **Efeito Esperado**: A única maneira de definir a data prevista de instalação e transicionar uma OS para `agendada` é criando/reagendando um agendamento do tipo `instalacao` via Agenda (RPC). Ao cancelar a instalação, a RPC automaticamente limpa a data prevista e retorna a OS para `aguardando_agendamento`.

---

## 6. Regras Arquiteturais da Agenda

1. **Modelo de Atribuição**: `APPOINTMENT_STAFF_MODEL=SINGLE_STAFF_V1` (cada agendamento possui no máximo 1 técnico atribuído na V1).
2. **Status Ativos**: `agendado`, `confirmado`, `em_deslocamento`.
3. **Status Terminais**: `realizado`, `reagendado`, `cancelado`.
4. **Tipos de Agendamento Permitidos**: `visita_tecnica`, `medicao`, `instalacao`, `manutencao`, `garantia`.
5. **Fuso Horário Operacional**: `America/Sao_Paulo` (todas as conversões para datas locais utilizam este fuso).
6. **Regra de Unicidade**: Máximo de 1 agendamento ativo do tipo `instalacao` por Ordem de Serviço.
7. **Modificações Temporais**: Alteração de início ou fim de agendamento é **estritamente proibida via PATCH** e deve ocorrer exclusivamente via `POST /reschedule` com justificativa obrigatória e criação de novo registro vinculado (`rescheduled_from_id`).
8. **Modificações Não-Temporais**: Atualizações de `staff_id`, `address_id` e `observacoes` utilizam `PATCH` com concorrência otimista (`expected_appointment_updated_at`).
9. **Imutabilidade Terminal**: Agendamentos em estado terminal (`realizado`, `reagendado`, `cancelado`) são **imutáveis**.
10. **Comportamento em OS Arquivada**:
    - Criação de novo agendamento: `BLOCK` (`ERR_WORK_ORDER_ARCHIVED`);
    - Edição não-temporal: `BLOCK` (`ERR_WORK_ORDER_ARCHIVED`);
    - Reagendamento: `BLOCK` (`ERR_WORK_ORDER_ARCHIVED`);
    - Transição de status: `BLOCK` (`ERR_WORK_ORDER_ARCHIVED`);
    - Cancelamento de agendamento ativo existente: `ALLOW` (permitido para desocupar a agenda de técnicos).

---

## 7. Políticas de Segurança e Autorização

1. **Sessão Administrativa**: Todas as rotas de BFF sob `/api/admin/crm/*` invocam obrigatoriamente `requireActiveAdmin(event)`.
2. **Proteção CSRF**: Todas as rotas mutantes (`POST`, `PATCH`, `DELETE`) executam `enforceMutationCsrf(event)`.
3. **Identidade do Ator**: O browser **NUNCA** é autoridade de `actor_id`. O BFF obtém o `userId` autenticado da sessão administrativa validada e injeta como `p_actor_id` nas chamadas às RPCs.
4. **Permissões de Banco de Dados**:
   - `public.appointments`: Role `service_role` possui permissão **apenas de `SELECT` direto**. Mutações diretas (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) são revogadas. Mutações acontecem exclusivamente via execução das 5 RPCs.
   - `public.crm_staff`: Role `service_role` possui `SELECT`, `INSERT`, `UPDATE`. `DELETE` físico é bloqueado por trigger.
   - Roles `anon` e `authenticated`: Acesso revogado em todas as tabelas operacionais do CRM.
5. **Configuração das RPCs**:
   - `SECURITY DEFINER`;
   - `SET search_path = ''`;
   - `REVOKE ALL FROM PUBLIC, anon, authenticated`;
   - `GRANT EXECUTE TO service_role`.
6. **Ambiente de Teste**: **NUNCA** executar testes com mutações ou gerar fixtures em produção. Todos os testes devem rodar exclusivamente no container PostgreSQL 17 local controlado (`adt-postgres17-test`).

---

## 8. Políticas de Limites de Tamanho de Arquivos (Code Policy)

Os limites estritos aplicam-se **SOMENTE ao código da aplicação**:

- `APPLICATION_CODE_MAX_LINES = 600` (Qualquer arquivo de código de aplicação, componentes, páginas);
- `APPLICATION_LOGIC_MAX_LINES = 200` (Qualquer arquivo contendo lógica de negócio, endpoints Nitro, utilities, services, validators, composables, shared logic).

**Arquivos sem limite numérico de linhas**:
- Arquivos SQL e Migrations (`.sql`);
- Scripts de teste automatizado e suítes de validação (`scripts/*.mjs`);
- Scripts de preflight e postflight;
- Arquivos de documentação técnica (`docs/*.md`, `implementation_plan.md`);
- Fixtures e dados de teste.

> [!IMPORTANT]
> Nunca compactar ou minificar artificialmente código para cumprir limites de LOC. Se um arquivo de lógica ultrapassar 200 linhas, ele deve ser dividido e modularizado com responsabilidades limpas e desacopladas.

---

## 9. Diretrizes de Responsividade (Implementado e Validado na UI)

A implementação e os testes visuais cobrem integralmente a matriz canônica de resoluções:

- **Mobile**: `320px`, `360px`, `375px`, `390px`, `412px`, `430px`;
- **Tablet**: `768px`, `1024px`;
- **Desktop / Wide**: `1280px`, `1920px`.

**Regras de UX e Layout Validadas**:
- Alvos de toque (touch targets) de botões e itens interativos: no mínimo `44x44px` (`TOUCH_TARGET_MIN_44PX=PASS`);
- Zero scroll horizontal indesejado (`ZERO_HORIZONTAL_OVERFLOW=PASS`);
- Proibido usar `overflow-x: hidden` no `body`/`html` como paliativo (`OVERFLOW_X_HIDDEN_BANDAID_COUNT=0`).

---

## 10. Arquivos Canônicos e Leituras Obrigatórias

Ao retomar o projeto em uma nova sessão, os seguintes arquivos reais existentes no repositório devem ser consultados:

### Documentação e Governança
1. [`docs/ANTIGRAVITY_HANDOFF.md`](docs/ANTIGRAVITY_HANDOFF.md) (Este documento);
2. [`docs/CRM_PHASE_5_IMPLEMENTATION.md`](docs/CRM_PHASE_5_IMPLEMENTATION.md) (Especificação técnica completa dos endpoints, RPCs, errors e guards);
3. [`implementation_plan.md`](implementation_plan.md) (Evidências de execução de todas as fases).

### Banco de Dados / Migrations Canônicas
4. [`supabase/manual/010_crm_core_tables.sql`](supabase/manual/010_crm_core_tables.sql) (Fase 4 — Baseline do CRM);
5. [`supabase/manual/011_crm_work_order_proposals.sql`](supabase/manual/011_crm_work_order_proposals.sql) (Fase 4.5 — Motor de Propostas);
6. [`supabase/manual/012_crm_appointments_and_staff_engine.sql`](supabase/manual/012_crm_appointments_and_staff_engine.sql) (Fase 5.0B — Motor de Agenda e Equipe Instalado — `MIGRATION_012_REEXECUTION=FORBIDDEN`);
7. [`supabase/manual/013_work_order_terminal_appointment_guard.sql`](supabase/manual/013_work_order_terminal_appointment_guard.sql) (Fase 5.0C — Invariante Terminal de OS Instalado — SHA: `04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08` — Status: `INSTALLED_VALIDATED` — `MIGRATION_013_REEXECUTION=FORBIDDEN`).

### Tipos, Utilitários e Endpoints Backend
7. [`app/types/crmAppointments.ts`](app/types/crmAppointments.ts) (Types TypeScript canônicos);
8. [`server/shared/appointmentValidation.mjs`](server/shared/appointmentValidation.mjs) (Regras de validação);
9. [`server/utils/crmAppointmentErrors.ts`](server/utils/crmAppointmentErrors.ts) (Mapeador central de erros HTTP/RPC);
10. [`server/utils/crmAppointmentHelpers.ts`](server/utils/crmAppointmentHelpers.ts) (Helpers de consulta da agenda);
11. [`server/utils/adminAuth.ts`](server/utils/adminAuth.ts) (Autenticação e CSRF de administradores);
12. [`server/utils/crm.ts`](server/utils/crm.ts) (Utilitários compartilhados do CRM e Activity Log).

### Scripts de Teste e Validação
13. [`scripts/test_crm_phase5c1_bff.mjs`](scripts/test_crm_phase5c1_bff.mjs) (Suíte de testes locais da Fase 5.0C);
14. [`scripts/postflight_production_012_read_only.mjs`](scripts/postflight_production_012_read_only.mjs) (Auditoria read-only em produção).

---

## 11. Protocolo Obrigatório para Início de Nova Sessão

> [!IMPORTANT]
> **ANTES DE ESCREVER CÓDIGO EM UMA NOVA SESSÃO DO ANTIGRAVITY:**
> 1. Ler integralmente [`docs/ANTIGRAVITY_HANDOFF.md`](docs/ANTIGRAVITY_HANDOFF.md);
> 2. Ler [`implementation_plan.md`](implementation_plan.md);
> 3. Auditar o estado real do repositório;
> 4. Confirmar que a **Migration 012 já está instalada** em produção e **NÃO DEVE ser reaplicada**;
> 5. Resumir o estado atual do projeto de forma concisa;
> 6. Confirmar qual é a próxima etapa autorizada pelo usuário (e.g., Production Release Review / próxima fase explicitamente autorizada);

---

## 12. Histórico de Patches — Fase 5.0D.RELEASE.3 (Lifecycle Assíncrono & E2E Hardening)

- **Supressão de Busca Programática após Seleção de OS**: Ao selecionar uma OS em `AppointmentCreateModal.vue`, `searchQuery` é resetado para `''`, o dropdown é fechado e o `watch(searchQuery)` verifica `selectedWorkOrder` antes de agendar debounce. Resultado: `SEARCH_AFTER_WORK_ORDER_SELECTION=0` (unit) e `SEARCH_AFTER_WORK_ORDER_SELECTION_REQUESTS=0` (E2E).
- **Submit In-Flight Lifecycle**: Durante submissão ativa (`isSubmitting = true`), o fechamento do modal por tecla Escape, botão X ou Cancelar é estritamente bloqueado via `tryClose()`. Botões visuais ficam `:disabled="isSubmitting"`. Política confirmada por E2E: `APPOINTMENT_SUBMIT_CLOSE_POLICY=BLOCK_WHILE_SUBMITTING` e `APPOINTMENT_SUBMIT_INFLIGHT_LIFECYCLE=PASS`.
- **E2E Isolado de Corridas Assíncronas**:
  - `APPOINTMENT_SEARCH_QUERY_CLEAR_INVALIDATION=PASS` (query limpa descarta request pendente)
  - `APPOINTMENT_SEARCH_INFLIGHT_CLOSE_INVALIDATION=PASS` (fechar/reabrir modal descarta request em voo)
  - `APPOINTMENT_SEARCH_STALE_REQUEST_INVALIDATION=PASS` (requests obsoletos não sobrescrevem estado atual)
  - `PRESELECTED_WORK_ORDER_STALE_RESPONSE_E2E=PASS` (epoch monotônico descarta respostas assíncronas entre ciclos de abertura do modal)
  - `CLIENT_ADDRESS_STALE_RESPONSE_E2E=PASS` (sequência monotônica de requisição descarta endereços de cliente obsoletos entre seleções/ciclos)
- **Status de Deploy**: `DEPLOY_AUTHORIZED=YES` (Autorizado e executado via Git master). `PRODUCTION_DATABASE_WRITES=0`.
- **Contagens Canônicas de Testes Sincronizadas**:
  - `CANONICAL_E2E_ASSERTS=673` (`node scripts/test_admin_ui_phase5d_browser.mjs`, 673/673 PASS)
  - `CANONICAL_ADMIN_UI_ASSERTS=44` (`node scripts/test_admin_ui_phase5d.mjs`, 44/44 PASS)
  - `CANONICAL_BFF_ASSERTS=54` (`node scripts/test_crm_phase5c1_bff.mjs`, 54/54 PASS)
  - `CANONICAL_CONCURRENCY_ASSERTS=7` (`node scripts/test_hotfix_concurrency_409.mjs`, 7/7 PASS)
  - `DOCUMENTATION_TEST_COUNTS_SYNCHRONIZED=YES`

---

## 13. Registro de Deploy em Produção — Fase 5.0D (Admin UI, Agenda & Equipe)

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
- *Nota sobre escopo de escrita*: zero mutações nas tabelas de negócio do schema `public`; zero dados de teste gerados; nenhum appointment/staff/OS criado ou alterado pelo smoke; sessão administrativa real criada e utilizada via Supabase Auth.
- `PGRST100_AUTHENTICATED_SMOKE=0`
- `UNEXPECTED_HTTP_400_APPOINTMENTS=0`
- `POST_DEPLOY_5XX_COUNT=0`
- `APPLICATION_ROLLBACK_REQUIRED=NO`

### Governança de Banco de Dados & Migrations
- `MIGRATION_012_REEXECUTED=NO`
- `MIGRATION_013_EXISTING_PREVIOUS_PHASE=YES` (instalada e validada na Fase 5.0C.4)
- `MIGRATION_013_REEXECUTED=NO`
- `MIGRATION_014_CREATED=NO`
- `PRODUCTION_SCHEMA_CHANGES=0`
- `HANDOFF_RELEASE_STATUS_SYNCHRONIZED=YES`

---

## 14. Histórico de Patches — PATCH 5.0C.4 (Final Auth & CSRF Hardening)

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

## 15. Histórico de Patches — PATCH 5.0C.4.1 (Final Fail-Closed Cleanup)

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

## 16. Histórico de Patches — PATCH 5.0C.4.2 (Final Test Evidence & Contract Cleanup)

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
- `MIGRATION_012_REEXECUTED=NO`
- `MIGRATION_013_REEXECUTED=NO`
- `PRODUCTION_DATABASE_WRITES=0`
- `APPLICATION_DEPLOY=NO`
- `PATCH_5_0C_4_2_READY_FOR_EXTERNAL_REVIEW=YES`









