# PLANO DE IMPLEMENTAÇÃO — PATCH 5.0C.4 + FASE 5.0D.A (EMENDADO)
## Auditoria, Hardening de Autenticação e Arquitetura da UI de Agenda & Equipe Operacional (CRM Fase 5.0)

> [!IMPORTANT]
> **GOVERNANÇA ABSOLUTA DE PRODUÇÃO**:
> - `PHASE_5_0C_FINAL_STATUS = COMPLETE_VALIDATED`
> - `PATCH_5_0C_4_AUTH_HARDENING_STATUS = COMPLETE_VALIDATED`
> - `PHASE_5_0C_4A_PLAN_STATUS = APPROVED_WITH_AMENDMENTS`
> - `PHASE_5_0C_4B_STATUS = COMPLETE_VALIDATED`
> - `PHASE_5_0C_4B_1_STATUS = COMPLETE_VALIDATED`
> - `PHASE_5_0C_4C_STATUS = COMPLETE_VALIDATED`
> - `PHASE_5_0C_4C_1_STATUS = COMPLETE_VALIDATED`
> - `PHASE_5_0C_4D_STATUS = COMPLETE_VALIDATED`
> - `PHASE_5_0D_IMPLEMENTATION_STATUS = IMPLEMENTED_LOCAL_NOT_RELEASED`
> - `PHASE_5_0D_PRODUCTION_RELEASE_AUTHORIZED = NO`
> - `PHASE_5_0D_START_AUTHORIZED = NO`
> - `MIGRATION_012_STATUS = INSTALLED_VALIDATED` (SHA: `43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`, reexecução proibida)
> - `MIGRATION_013_STATUS = INSTALLED_VALIDATED` (SHA: `04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`, reexecução proibida)
> - `MIGRATION_013_CANONICAL_FILE = supabase/manual/013_work_order_terminal_appointment_guard.sql`
> - `MIGRATION_013_CANDIDATE_SHA256 = 04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`
> - `MIGRATION_013_LOCAL_ASSERTS_CANONICAL = 58`
> - `MIGRATION_013_FILES_FOUND = 1`
> - `MIGRATION_013_DUPLICATE_NUMBERING = NO`
> - `MIGRATION_013_INSTALLED_PRODUCTION = YES`
> - `MIGRATION_013_PRODUCTION_VALIDATED = YES`
> - `FRESH_LOCAL_BACKUP_CREATED = YES`
> - `FRESH_BACKUP_PATH = backups/pre_migration_013_20260901_164555.sql`
> - `FRESH_BACKUP_SIZE_BYTES = 320289`
> - `FRESH_BACKUP_SHA256 = F4D6DBD91D4AF6C8BB439B0AEC2FA8914905503AF953A32CE729323A3DEE4AF4`
> - `FRESH_BACKUP_RESTORE_VALIDATION = PASS`
> - `PRODUCTION_DATABASE_WRITES = 0`
> - `APPLICATION_DEPLOY = NO`

---

## 1. Patch 5.0C.4 — Test Auth Fail-Closed Hardening

### 1.1. Problema e Vulnerabilidade Corrigida
Anteriormente, a política de bypass de autenticação de teste para desenvolvimento/testes locais possuía condição permissiva em cenários com `NODE_ENV` não configurado ou combinações inconsistentes.

### 1.2. Implementação Fail-Closed em `server/utils/adminAuthSession.ts`
Implementada a função canônica:
```ts
export function isTestAuthEnabled(): boolean {
  return (
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
    process.env.ENABLE_TEST_AUTH === 'true'
  )
}
```
Em `resolveSupabaseUser`, tokens mock (`dev_mock_admin_token`, `dev_mock_refresh_token`) só são avaliados se `isTestAuthEnabled() === true`. Em qualquer outro ambiente ou configuração, os tokens mock são sumariamente rejeitados e a requisição resulta em 401/403.

### 1.3. Matriz de Testes Físicos (7 Cenários Validados)
O script `scripts/test_admin_auth_hardening.mjs` valida rigorosamente:
1. `NODE_ENV=production` + `ENABLE_TEST_AUTH=true` $\to$ **REJEITADO** (`TEST_AUTH_PRODUCTION_BYPASS = IMPOSSIBLE`).
2. `NODE_ENV=production` + `ENABLE_TEST_AUTH=false` $\to$ **REJEITADO**.
3. `NODE_ENV` indefinido + `ENABLE_TEST_AUTH=true` $\to$ **REJEITADO**.
4. `NODE_ENV=development` + `ENABLE_TEST_AUTH` ausente $\to$ **REJEITADO**.
5. `NODE_ENV=development` + `ENABLE_TEST_AUTH=false` $\to$ **REJEITADO**.
6. `NODE_ENV=development` + `ENABLE_TEST_AUTH=true` $\to$ **ACEITO** (mock autorizado para testes).
7. `NODE_ENV=test` + `ENABLE_TEST_AUTH=true` $\to$ **ACEITO** (mock autorizado para testes).

---

## 2. Types Canônicos de Contrato Físico

A UI e os composables utilizam rigorosamente os tipos TypeScript definidos em `app/types/crmAppointments.ts`:

- **Tipo Canônico de Calendário**: `AppointmentCalendarItem` (`CrmAppointmentSummary`).
  - Projeção mínima para calendário (`APPOINTMENT_CALENDAR_SELECT`): `id`, `work_order_id`, `client_id`, `address_id`, `staff_id`, `tipo_agendamento`, `status_agendamento`, `data_hora_inicio`, `data_hora_fim`, `client.nome`, `address.bairro`, `address.cidade`, `staff.nome`, `staff.funcao`, `work_order.numero_os`.
  - PII minimizada: telefones, e-mails, observações e justificativas são estritamente excluídos da listagem de calendário (`CALENDAR_PII_MINIMIZATION = PASS`).
- **Tipo Canônico de Detalhe**: `AppointmentWithRelations` (`CrmAppointmentDetail`).
  - Contém campos operacionais sensíveis e detalhados (`observacoes`, `motivo_reagendamento_cancelamento`, `rescheduled_from`, `next_appointment`, `created_by`, contatos completos), acessados sob demanda via `GET /api/admin/crm/appointments/:id`.
- **Tipo Canônico de Equipe**: `CrmStaff` (`id`, `nome`, `telefone`, `email`, `funcao`, `is_active`, `created_at`, `updated_at`).

---

## 3. Dependências de API & Reutilização de Endpoints da Fase 4

`NEW_API_ENDPOINTS_REQUIRED = 0`

A interface apoia-se em:
1. **12 Endpoints Canônicos de Agenda/Equipe (Fase 5.0C)**:
   - `GET /api/admin/crm/appointments` (grade temporal $\le 62$ dias)
   - `POST /api/admin/crm/appointments` (criação atômica)
   - `POST /api/admin/crm/appointments/search` (busca estruturada: status, tipo, staffId, clientId; `TEXT_Q_SEARCH_ENABLED = NO`, `SEARCH_PII_SEMANTICS = DEFERRED`)
   - `GET /api/admin/crm/appointments/:id` (detalhes sob demanda)
   - `PATCH /api/admin/crm/appointments/:id` (atualização não-temporal)
   - `POST /api/admin/crm/appointments/:id/reschedule` (reagendamento com CAS e motivo)
   - `POST /api/admin/crm/appointments/:id/cancel` (cancelamento com motivo)
   - `POST /api/admin/crm/appointments/:id/status` (transição progressiva de status)
   - `GET /api/admin/crm/work-orders/:id/appointments` (aba de agendamentos da OS)
   - `GET /api/admin/crm/staff` (listagem de equipe)
   - `POST /api/admin/crm/staff` (cadastro de membro)
   - `PATCH /api/admin/crm/staff/:id` (edição e desativação lógica)
2. **Reutilização de Endpoints da Fase 4 para Ordens de Serviço e Clientes** (`EXISTING_WORK_ORDER_API_REUSE = YES`):
   - `GET /api/admin/crm/work-orders` / `POST /api/admin/crm/work-orders/search` para seleção de OS.
   - `GET /api/admin/crm/work-orders/:id` para obter os dados vinculados da OS (cliente e endereço padrão).
   - `GET /api/admin/crm/clients/:id` (`CLIENT_ADDRESS_SOURCE = GET_CLIENT_DETAIL`) para obter endereços alternativos do mesmo cliente (sem criar endpoints de endereços).
3. **Fluxo Estrito de Seleção de OS (`APPOINTMENT_CREATE_OS_SELECTION_FLOW = PLANNED`)**:
   - Usuário seleciona a OS $\to$ Cliente é derivado da OS $\to$ Endereço padrão vem da OS $\to$ Endereço alternativo vem do detalhe do mesmo cliente $\to$ Browser nunca envia `client_id` como autoridade.

---

## 4. Gestão de Timezone: Relógio Civil America/Sao_Paulo $\leftrightarrow$ RFC3339

- `TIMEZONE = America/Sao_Paulo`
- `HARDCODED_UTC_MINUS_3 = NO`
- `SAO_PAULO_DATETIME_ROUNDTRIP_TESTS = PLANNED`

### Helpers Canônicos em `app/utils/crmDateTime.ts`:
1. **RFC3339 $\to$ Wall-Clock Local (`rfc3339ToSaoPauloLocalInput`)**:
   - Converte timestamp RFC3339/UTC para string formatada `"YYYY-MM-DDTHH:mm"` no relógio civil de São Paulo via `Intl.DateTimeFormat` com `formatToParts`.
2. **Wall-Clock Local $\to$ RFC3339 (`saoPauloLocalDateTimeToRfc3339`)**:
   - Converte `"YYYY-MM-DDTHH:mm"` de São Paulo para RFC3339 calculando o offset exato via `Intl.DateTimeFormat` (sem assumir offset estático).
   - Proibido `new Date("YYYY-MM-DDTHH:mm")` como autoridade local.
3. **Casos de Teste de Round-Trip**:
   - Virada de dia (23:59 $\to$ 00:00).
   - Virada de mês (ex: 28/02 $\to$ 01/03, 31/03 $\to$ 01/04).
   - Virada de ano (31/12 $\to$ 01/01).
   - 29/02 em ano bissexto válido.
   - Data inválida (ex: 31 de abril).
   - Navegador/processo em fuso UTC, America/New_York e Asia/Tokyo.

---

## 5. Algoritmo de Lanes para Agendamentos Simultâneos (Overlapping)

- `OVERLAP_LANE_CAPACITY = MAX_CONCURRENT`
- **Algoritmo V1**:
  1. Ordenar eventos do dia por `data_hora_inicio`, `data_hora_fim`, `id`.
  2. Liberar faixas cujo `laneEnd <= next.data_hora_inicio` (respeitando intervalo $[start, end)$).
  3. Atribuir o menor `laneIndex` livre.
  4. Registrar `maxConcurrentLanes` (pico máximo de concorrência) dentro de cada componente conexo de conflito.
  5. Computar `width = 100 / maxConcurrentLanes` e `left = laneIndex * width`.
  6. **Exemplo canônico**: A (09:00–11:00), B (10:00–12:00), C (11:00–13:00) $\to$ Peak concurrency = 2 (quando C inicia às 11:00, a faixa de A é liberada).

---

## 6. Acessibilidade e Autoridade Modal

- `MODAL_A11Y_AUTHORITY = SHADCN_RADIX_PRIMITIVES`
- Autoridade primária: Primitivas Radix / shadcn (Dialog, Sheet, AlertDialog).
- Garantias obrigatórias:
  - Focus trap nativo e `aria-modal="true"`.
  - Fechamento por tecla `Escape` e backdrop click.
  - Restauração exata do foco ao elemento de disparo após fechamento.
  - Rótulos e descrições acessíveis (`aria-labelledby`, `aria-describedby`).
  - `useModalA11y.ts` mantido apenas como fallback para lacunas específicas se necessário.

---

## 7. Visões de Calendário e Regras Operacionais V1

- `CALENDAR_VIEWS = DAY,WEEK,MONTH,LIST`
- `CALENDAR_VIEW_DAY = YES`, `CALENDAR_VIEW_WEEK = YES`, `CALENDAR_VIEW_MONTH = YES`, `CALENDAR_VIEW_LIST = YES`.
- `MOBILE_DEFAULT_CALENDAR_VIEW = DAY_OR_LIST`.
- `BUSINESS_HOURS_POLICY = INFORMATIONAL_ONLY` (07:00–19:00 é âncora; a grade expande e permite scroll para compromissos fora desse intervalo).
- `APPOINTMENT_STAFF_MODEL = SINGLE_STAFF_V1`.
- `DRAG_AND_DROP = DISABLED`.
- Agendamentos em estado terminal (`realizado`, `reagendado`, `cancelado`) desabilitam mutações temporais/operacionais incompatíveis.
- Ordens de serviço arquivadas não podem ser selecionadas para novos agendamentos.

---

## 8. Contrato da Página de Equipe (`/admin/equipe`)

- Visualização híbrida: Tabela no Desktop ($\ge 768\text{px}$) e Cards no Mobile ($< 768\text{px}$).
- Filtros estruturados: `isActive` (todos, ativos, inativos) e `funcao` (instalador, vistoriador, atendente, gestor).
- Operações: Cadastrar membro, Editar dados, Ativar/Desativar logicamente (**ZERO DELETE**).
- Tratamento de erro 409 `ERR_STAFF_HAS_ACTIVE_APPOINTMENTS` com orientação ao usuário.
- Estados explícitos: `LOADING` (Skeleton), `EMPTY`, `ERROR_WITH_RETRY`, `SAVING`.

---

## 9. Concorrência e Tokens nas Ordens de Serviço Existentes

- `WORK_ORDER_UI_EXPECTED_UPDATED_AT = REQUIRED`:
  - `WorkOrderStatusModal.vue`, `WorkOrderGeneralEditModal.vue` e demais formulários enviam `expected_updated_at`.
  - Em caso de conflito 409 (`WORK_ORDER_STALE_VERSION`): notificar concorrência, executar refetch imediato da OS, atualizar o token e preservar a previsibilidade da UX.
- `MANUAL_STATUS_AGENDADA_UI = BLOCKED`: Opção `agendada` desabilitada na alteração manual de status da OS.
- `MANUAL_DATA_PREVISTA_UI = REMOVED`: Campo manual de `data_prevista` removido de todos os modais de OS.

---

## 10. UX de Mutação, Request Locks & Estados de Interface

- Request lock obrigatório em todos os formulários (botão primário desabilitado durante envio, prevenindo duplo clique).
- Refetch de dados canônicos após qualquer mutação bem-sucedida.
- Estados de UI padronizados: `LOADING`, `EMPTY`, `ERROR_WITH_RETRY`, `SAVING`, `CONCURRENCY_CONFLICT`.

---

## 11. Busca Textual e Responsividade

- `TEXT_Q_SEARCH_ENABLED = NO`, `SEARCH_PII_SEMANTICS = DEFERRED` (filtros estruturados apenas: `staffId`, `clientId`, `status`, `tipo`).
- 10 Viewports obrigatórios testados: `[320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1920]`.
- Touch targets $\ge 44\times 44\text{px}$ para todos os elementos interativos.
- Zero overflow horizontal na página (`scrollWidth <= clientWidth`). Scroll horizontal localizado na barra de abas é permitido e contido.

---

## 12. Documentação e Governança

- [CRM_PHASE_5_IMPLEMENTATION.md](file:///d:/sicons/ADT/docs/CRM_PHASE_5_IMPLEMENTATION.md) atualizado com o Patch 5.0C.4 e emendas da Fase 5.0D.A.
- [ANTIGRAVITY_HANDOFF.md](file:///d:/sicons/ADT/docs/ANTIGRAVITY_HANDOFF.md) atualizado com o status de homologação de autenticação e gates da UI.

---

## 13. FASE 5.0C.4A — Work Order Terminal Appointment Integrity (Planejamento da Migration 013)

### 13.1. Auditoria Física Inicial
- **Auditoria de Migrations**: Migrations 010, 011 e 012 auditadas fisicamente no diretório `supabase/manual/`.
- **Triggers Existentes em `public.work_orders`**:
  - `trg_work_orders_updated_at` (010)
  - `trg_recalculate_work_order_totals` (010)
  - `trg_generate_work_order_number` (010)
- **Triggers Existentes em `public.appointments`**:
  - `trg_appointments_updated_at` (010)
  - `trg_prevent_hard_delete_appointments` (012)
- **Constatação**: `TERMINAL_ACTIVE_APPOINTMENT_DB_GUARD_EXISTS = NO`. Não existe trigger no banco de dados bloqueando a transição de `work_orders` para status terminal (`concluida` ou `cancelada`) quando existem agendamentos ativos.

### 13.2. Análise da Race Condition & Serialização via Lock Order
- **Root Cause**: O precheck read-only no BFF (`hasAnyActiveAppointment`) e o `UPDATE work_orders` ocorrem em transações distintas ou instantes de tempo separados. Uma chamada concorrente a `create_appointment_atomic` pode inserir um agendamento ativo após o precheck e antes do `UPDATE`.
- **Serialização por Row Lock**:
  - `create_appointment_atomic` executa:
    ```sql
    SELECT id, status_os, is_archived FROM public.work_orders WHERE id = p_work_order_id FOR UPDATE;
    ```
  - Qualquer `UPDATE public.work_orders` adquire row lock exclusivo (`ExclusiveLock`) sobre a mesma tupla da tabela `public.work_orders`.
  - **Cenário A (create_appointment_atomic bloqueia primeiro)**:
    1. Transação A adquire `FOR UPDATE` na OS, valida que não está terminal, insere o compromisso ativo e faz `COMMIT`.
    2. Transação B (`UPDATE work_orders`) adquire a trava na sequência. O trigger `BEFORE UPDATE` executa no snapshot atualizado, detecta o compromisso ativo recém-comitado e lança `ERR_ACTIVE_APPOINTMENTS_EXIST`. Transação B é abortada.
  - **Cenário B (UPDATE work_orders bloqueia primeiro)**:
    1. Transação B adquire a trava da OS, o trigger valida que não há compromisso ativo, altera o status para `concluida` ou `cancelada` e faz `COMMIT`.
    2. Transação A (`create_appointment_atomic`) adquire a trava, reavalia a linha (semântica `READ COMMITTED` / `FOR UPDATE`), observa o novo `status_os` terminal e lança a exceção correspondente (`ERR_INSTALLATION_WORK_ORDER_STATUS`, `ERR_MAINTENANCE_WORK_ORDER_STATUS` ou `ERR_QUOTE_WORK_ORDER_STATUS`). Transação A é abortada.
- **Conclusão**: `CROSS_TABLE_RACE_CONFIRMED = YES`. A serialização na linha de `public.work_orders` elimina 100% da corrida, garantindo a invariante cruzada.

### 13.3. Arquitetura da Migration 013 Proposta
- **Arquivo Canônico**: `supabase/manual/013_work_order_terminal_appointment_guard.sql`
- **SHA-256 LF Congelado**: `04CC6E99D8DBEC4F63A8B18AF105165C166BF9BBDDE8FB0F4964713D02A90E08`
- **Arquivos 013 Encontrados**: 1 (`MIGRATION_013_DUPLICATE_NUMBERING = NO`)
- **Escopo Exclusivo**: `WORK_ORDER_TERMINAL_ACTIVE_APPOINTMENT_GUARD` (`SEARCH_RPC_INCLUDED = NO`).
- **Função**:
  ```sql
  CREATE FUNCTION public.fn_prevent_terminal_work_order_with_active_appointments()
  RETURNS trigger
  LANGUAGE plpgsql
  VOLATILE
  SECURITY DEFINER
  SET search_path = ''
  SET row_security = off
  AS $$
  BEGIN
    IF NEW.status_os = 'cancelada' THEN
      IF EXISTS (
        SELECT 1
        FROM public.appointments
        WHERE work_order_id = NEW.id
          AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
      ) THEN
        RAISE EXCEPTION 'ERR_ACTIVE_APPOINTMENTS_EXIST';
      END IF;
    ELSIF NEW.status_os = 'concluida' THEN
      IF EXISTS (
        SELECT 1
        FROM public.appointments
        WHERE work_order_id = NEW.id
          AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')
          AND tipo_agendamento <> 'garantia'
      ) THEN
        RAISE EXCEPTION 'ERR_ACTIVE_APPOINTMENTS_EXIST';
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$;
  ```
- **Trigger**:
  ```sql
  CREATE TRIGGER trg_prevent_terminal_work_order_with_active_appointments
  BEFORE UPDATE OF status_os ON public.work_orders
  FOR EACH ROW
  WHEN (
    OLD.status_os IS DISTINCT FROM NEW.status_os
    AND NEW.status_os IN ('concluida', 'cancelada')
  )
  EXECUTE FUNCTION public.fn_prevent_terminal_work_order_with_active_appointments();
  ```
- **Segurança e Privilégios**: `SECURITY DEFINER`, `SET search_path = ''`, `SET row_security = off`, nomes qualificados `public.work_orders` e `public.appointments`. Execução direta revogada de `PUBLIC`, `anon`, `authenticated` e `service_role` (`FUNCTION_SERVICE_ROLE_DIRECT_EXECUTE = NO`).

### 13.4. Preflight Fail-Closed Expandido da Migration 013
- Validação de existência de `public.work_orders`, `public.appointments`, `status_os`, `status_agendamento` e `tipo_agendamento`.
- Validação explícita de RLS: `public.appointments.relrowsecurity = true` E `public.work_orders.relrowsecurity = true` (`WORK_ORDERS_RLS_PREFLIGHT = IMPLEMENTED`).
- Confirmação de que a Migration 012 está instalada e que o trigger/function 013 ainda não existem.
- Consulta de integridade considerando exceção legítima de garantia em OS concluída.

### 13.5. Postcheck Semântico Robusto
- `TRIGGER_WHEN_POSTCHECK = SEMANTIC`: A validação do trigger no catálogo verifica propriedades estruturais do nó WHEN (presença de `IS DISTINCT FROM`, `concluida` e `cancelada`, ausência de status intermediários) de forma robusta e independente de serialização textual específica do PostgreSQL.

### 13.6. Testes com 2 Conexões Simultâneas Reais (PostgreSQL 17 Local)
- Execução de 58/58 asserts (100% PASS) em `scripts/test_crm_migration013_local.mjs`:
  - Cenário 1 (manutenção vs concluida) em ambas as ordens de aquisição de lock.
  - Cenário 2 (instalação vs cancelada) em ambas as ordens de aquisição de lock.
  - Cenário 3 (visita técnica vs cancelada) em ambas as ordens de aquisição de lock.
  - 150 iterações concorrentes de estresse: `FORBIDDEN_FINAL_STATE_COUNT = 0`, `DEADLOCK_40P01_COUNT = 0`.
  - `CONCLUDED_WORK_ORDER_ACTIVE_WARRANTY_ALLOWED = PASS`.

### 13.7. Dicionário de Erros e Limpeza de Runtime
- `MIGRATION_012_DOMAIN_ERROR_CODES = 25`
- `MIGRATION_013_DOMAIN_ERROR_CODES = 1` (`ERR_ACTIVE_APPOINTMENTS_EXIST` $\to$ HTTP 409)
- `DATABASE_DOMAIN_ERROR_CODES_TOTAL = 26`
- `APPLICATION_ADDITIONAL_ERROR_CODES = 3`
- `ERROR_MAP_TOTAL_KEYS = 29`
- `DEV_MOCK_AUTH_RUNTIME_FOUND_AFTER = NO`
- `PRODUCTION_MOCK_TOKEN_BYPASS = IMPOSSIBLE`


