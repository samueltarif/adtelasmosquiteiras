# DOCUMENTAÇÃO TÉCNICA DA IMPLEMENTAÇÃO — CRM FASE 5
## Agenda, Agendamentos e Gestão de Equipe Operacional

**Status da Fase**: `PHASE_5_0C_STATUS=COMPLETE`  
**Migration 012 Canônica**: `supabase/manual/012_crm_appointments_and_staff_engine.sql`  
**SHA-256 Canônico**: `43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`  
**Validação em Produção**: `VALIDATED` (Postflight Read-Only com 0 mutações)  
**Asserções em Testes Automatizados (Fase 5.0C)**: `85/85 PASS (100%)`  

---

## 1. Visão Geral da Arquitetura (Fase 5)

A arquitetura do módulo **Agenda e Equipe Operacional** do CRM AD Telas Mosquiteiras é dividida em duas camadas de proteção estrita:

1. **Camada de Banco de Dados (PostgreSQL 17 / Migration 012)**:
   - Toda e qualquer mutação na tabela `public.appointments` é realizada exclusivamente via **5 Stored Procedures (RPCs) atômicas** com `SECURITY DEFINER`, `search_path = ''` e travas `FOR UPDATE`.
   - Menor privilégio: DML direto (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) na tabela `appointments` foi revogado para todas as roles (`anon`, `authenticated`, `service_role`).
   - Exclusão temporal de técnicos garantida no nível físico via constraint `unq_appointments_staff_active_period` com extensão `btree_gist`.
   - Unicidade de instalação ativa por OS garantida pelo índice único parcial `unq_active_installation_per_wo`.
   - Triggers de bloqueio de deleção física (`fn_prevent_appointment_hard_delete` e `fn_prevent_crm_staff_hard_delete`).
   - Trigger de proteção de desativação de equipe (`fn_check_crm_staff_deactivation`).

2. **Camada BFF (Nitro / Nuxt 3)**:
   - Autenticação e autorização obrigatórias em todos os 12 endpoints através de `requireActiveAdmin`.
   - Proteção CSRF (`enforceMutationCsrf`) em todas as rotas mutantes (`POST`, `PATCH`).
   - Transporte seguro de termos de busca e PII exclusivamente via `POST /api/admin/crm/appointments/search` no corpo da requisição (`readBody`), nunca em query string.
   - Mapeador central de erros (`handleRpcError`) traduzindo exceções e SQLSTATEs para status HTTP padronizados (400, 403, 404, 409) com mensagens amigáveis em PT-BR e zero vazamento de stack ou detalhes internos do banco.
   - Proteção rígida da integridade de `work_orders.data_prevista`: remoção de escrita manual nos endpoints de OS e leads.

---

## 2. Especificação dos 12 Endpoints Nitro BFF

| # | Método | Rota | Descrição | RPC / Mecanismo | Status Sucesso |
|---|--------|------|-----------|-----------------|----------------|
| 1 | `GET` | `/api/admin/crm/appointments` | Consulta de calendário estruturada (máx 62 dias) | Select indexado + Joins | `200 OK` |
| 2 | `POST` | `/api/admin/crm/appointments/search` | Busca de compromissos com PII no corpo | Body `readBody` + Joins | `200 OK` |
| 3 | `POST` | `/api/admin/crm/appointments` | Criação de agendamento | `create_appointment_atomic` | `200 OK` |
| 4 | `GET` | `/api/admin/crm/appointments/:id` | Detalhes do agendamento com relações | Select detalhado + next_appointment | `200 OK` |
| 5 | `PATCH` | `/api/admin/crm/appointments/:id` | Edição não-temporal (staff, address, obs) | `update_appointment_atomic` | `200 OK` |
| 6 | `POST` | `/api/admin/crm/appointments/:id/reschedule` | Reagendamento com preservação histórica | `reschedule_appointment_atomic` | `200 OK` |
| 7 | `POST` | `/api/admin/crm/appointments/:id/cancel` | Cancelamento com justificativa obrigatória | `cancel_appointment_atomic` | `200 OK` |
| 8 | `POST` | `/api/admin/crm/appointments/:id/status` | Transição de status operacional | `update_appointment_status_atomic` | `200 OK` |
| 9 | `GET` | `/api/admin/crm/work-orders/:id/appointments` | Histórico completo de agendamentos da OS | Select ordenado por data_hora_inicio | `200 OK` |
| 10 | `GET` | `/api/admin/crm/staff` | Listagem da equipe com filtros | Select estruturado ordenado por nome | `200 OK` |
| 11 | `POST` | `/api/admin/crm/staff` | Cadastro de membro da equipe | Service role INSERT (`is_active=true`) | `200 OK` |
| 12 | `PATCH` | `/api/admin/crm/staff/:id` | Atualização de dados da equipe | Service role PATCH + Trigger check | `200 OK` |

---

## 3. Especificação das 5 RPCs da Migration 012

### 3.1 `create_appointment_atomic`
- **Assinatura**: `(p_actor_id UUID, p_work_order_id UUID, p_tipo_agendamento VARCHAR, p_data_hora_inicio TIMESTAMPTZ, p_data_hora_fim TIMESTAMPTZ, p_staff_id UUID DEFAULT NULL, p_address_id UUID DEFAULT NULL, p_observacoes TEXT DEFAULT NULL)`
- **Ações**:
  1. Valida administrador ativo em `admin_users`.
  2. Valida integridade referencial cruzada (`address_id` pertence ao `client_id` da OS).
  3. Insere em `public.appointments` com `status_agendamento = 'agendado'`.
  4. Se `tipo_agendamento = 'instalacao'`: transiciona OS para `status_os = 'agendada'`, define `work_orders.data_prevista = v_local_date` (fuso America/Sao_Paulo).
  5. Grava evento `appointment_created` no `crm_activity_log`.

### 3.2 `update_appointment_atomic`
- **Assinatura**: `(p_actor_id UUID, p_appointment_id UUID, p_expected_appointment_updated_at TIMESTAMPTZ, p_staff_id UUID, p_address_id UUID, p_observacoes TEXT, p_update_staff BOOLEAN, p_update_address BOOLEAN, p_update_observacoes BOOLEAN)`
- **Ações**:
  1. Valida concorrência otimista (`updated_at IS NOT DISTINCT FROM p_expected_appointment_updated_at`).
  2. Bloqueia alterações em OS arquivada ou agendamento terminal.
  3. Atualiza campos não-temporais solicitados.
  4. Grava evento `appointment_updated` no `crm_activity_log`.

### 3.3 `reschedule_appointment_atomic`
- **Assinatura**: `(p_actor_id UUID, p_appointment_id UUID, p_new_data_hora_inicio TIMESTAMPTZ, p_new_data_hora_fim TIMESTAMPTZ, p_motivo TEXT, p_expected_appointment_updated_at TIMESTAMPTZ)`
- **Ações**:
  1. Valida motivo (mínimo 3 caracteres).
  2. Marca agendamento anterior como `status_agendamento = 'reagendado'`, registrando motivo.
  3. Insere novo agendamento com `rescheduled_from_id = p_appointment_id` e status `agendado`.
  4. Se `tipo_agendamento = 'instalacao'`: atualiza `work_orders.data_prevista` para a nova data.
  5. Grava evento `appointment_rescheduled` no `crm_activity_log`.

### 3.4 `cancel_appointment_atomic`
- **Assinatura**: `(p_actor_id UUID, p_appointment_id UUID, p_motivo TEXT, p_expected_appointment_updated_at TIMESTAMPTZ)`
- **Ações**:
  1. Valida motivo de cancelamento (mínimo 3 caracteres).
  2. Marca agendamento como `status_agendamento = 'cancelado'`, gravando motivo.
  3. Se agendamento cancelado era de instalação e não restam outras instalações ativas na OS: reverte OS para `status_os = 'aguardando_agendamento'` e limpa `work_orders.data_prevista = NULL`.
  4. Permite cancelamento mesmo em OS arquivada.
  5. Grava evento `appointment_cancelled` no `crm_activity_log`.

### 3.5 `update_appointment_status_atomic`
- **Assinatura**: `(p_actor_id UUID, p_appointment_id UUID, p_next_status VARCHAR, p_expected_appointment_updated_at TIMESTAMPTZ)`
- **Ações**:
  1. Valida máquina de estados (`agendado` -> `confirmado` -> `em_deslocamento` -> `realizado`).
  2. Impede transição em agendamentos em estado terminal (`realizado`, `reagendado`, `cancelado`).
  3. Atualiza `status_agendamento` e `updated_at`.
  4. Grava evento `appointment_status_changed` no `crm_activity_log`.

---

## 4. Regras de Integridade de `work_orders.data_prevista`

1. **Fonte Única da Verdade**: A coluna `work_orders.data_prevista` é **derivada automaticamente** do agendamento de instalação ativo pela Agenda.
2. **Guards de Aplicação**:
   - `PATCH /api/admin/crm/work-orders/:id`: Rejeita `data_prevista` e `dataPrevista` com `HTTP 400` (`ERR_DATA_PREVISTA_MANAGED_BY_AGENDA`).
   - `POST /api/admin/crm/work-orders/:id/status`: Rejeita transição manual para `agendada` com `HTTP 400` (`ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED`). Rejeita regressão manual para `aguardando_agendamento` com instalação ativa com `HTTP 409` (`ERR_ACTIVE_INSTALLATION_EXISTS`).
   - `POST /api/admin/crm/work-orders`: Rejeita criação manual com `dataPrevista` / `data_prevista`.
   - `POST /api/admin/crm/leads/:id/convert`: Rejeita `os_data.data_prevista` com `HTTP 400`.

---

## 5. Matriz de Mapeamento de Erros

| Código de Erro / SQLSTATE | Status HTTP | Mensagem ao Usuário |
|---------------------------|-------------|---------------------|
| `ERR_ADMIN_NOT_ACTIVE` | 403 Forbidden | Administrador inativo ou sem permissão de acesso. |
| `ERR_WORK_ORDER_NOT_FOUND` | 404 Not Found | Ordem de serviço não encontrada. |
| `ERR_APPOINTMENT_NOT_FOUND` | 404 Not Found | Agendamento não encontrado. |
| `ERR_STAFF_NOT_FOUND` | 404 Not Found | Membro da equipe operacional não encontrado. |
| `ERR_WORK_ORDER_ARCHIVED` | 409 Conflict | A ordem de serviço está arquivada e não permite novos agendamentos ou alterações operacionais. |
| `ERR_APPOINTMENT_TERMINAL` | 409 Conflict | O agendamento está em estado terminal (realizado, cancelado ou reagendado) e não pode ser modificado. |
| `ERR_CONCURRENCY_CONFLICT` | 409 Conflict | O agendamento foi modificado por outro usuário. Recarregue os dados e tente novamente. |
| `ERR_STAFF_SCHEDULE_CONFLICT` / `23P01` | 409 Conflict | Conflito de agenda: o técnico já possui outro compromisso ativo no intervalo de horário selecionado. |
| `ERR_ACTIVE_INSTALLATION_EXISTS` / `23505` | 409 Conflict | Já existe um agendamento de instalação ativo para esta Ordem de Serviço. |
| `ERR_STAFF_HAS_ACTIVE_APPOINTMENTS` | 409 Conflict | Não é possível desativar o membro da equipe pois ele possui agendamentos futuros pendentes. |
| `ERR_ADDRESS_CLIENT_MISMATCH` | 400 Bad Request | O endereço selecionado não pertence ao cliente desta ordem de serviço. |
| `ERR_INSTALLATION_WORK_ORDER_STATUS` | 400 Bad Request | Para agendar instalação, a ordem de serviço deve estar nos status aprovada, aguardando_agendamento ou agendada. |
| `ERR_WARRANTY_NOT_ACTIVE` | 400 Bad Request | Para agendamento do tipo garantia, a ordem de serviço deve possuir uma garantia ativa e válida. |
| `ERR_INVALID_STATUS_TRANSITION` | 400 Bad Request | Transição de status do agendamento inválida para o fluxo operacional. |
| `ERR_INVALID_APPOINTMENT_INTERVAL` | 400 Bad Request | Intervalo de agendamento inválido: a data de início deve ser estritamente anterior à data de fim. |
| `ERR_RESCHEDULE_REASON_REQUIRED` | 400 Bad Request | O motivo do reagendamento é obrigatório (mínimo 3 caracteres). |
| `ERR_CANCEL_REASON_REQUIRED` | 400 Bad Request | O motivo do cancelamento é obrigatório (mínimo 3 caracteres). |
| `ERR_NO_APPOINTMENT_CHANGES` | 400 Bad Request | Nenhum campo para atualização foi informado. |
| `ERR_DATA_PREVISTA_MANAGED_BY_AGENDA` | 400 Bad Request | A data prevista de instalação é gerenciada automaticamente pela Agenda através de agendamentos. |
| `ERR_SCHEDULE_VIA_APPOINTMENT_REQUIRED` | 400 Bad Request | Para agendar uma OS, crie um agendamento do tipo instalação na Agenda. |
| `ERR_HARD_DELETE_FORBIDDEN` | 400 Bad Request | Exclusão física é proibida. Utilize cancelamento auditável ou desativação lógica. |

---

## 6. Evidência de Testes Automatizados Locais (Fase 5.0C)

```
=================================================================
SUÍTE DE TESTES AUTOMATIZADOS — BACKEND CRM FASE 5.0C
=================================================================
Total de Asserts Executados: 85
Asserts Aprovados (PASS):    85
Asserts Reprovados (FAIL):   0

Todos os testes passaram com 100% de sucesso!
```

---

## 7. Conformidade com Limites de Código

- **Regra**: Todo arquivo de lógica da aplicação deve possuir `<= 200` linhas (`APPLICATION_LOGIC_MAX_LINES=200`).
- **Resultado da Auditoria Estática**:
  - `server/api/admin/crm/appointments/index.get.ts`: 60 linhas
  - `server/api/admin/crm/appointments/search.post.ts`: 64 linhas
  - `server/api/admin/crm/appointments/index.post.ts`: 73 linhas
  - `server/api/admin/crm/appointments/[id]/index.get.ts`: 57 linhas
  - `server/api/admin/crm/appointments/[id]/index.patch.ts`: 91 linhas
  - `server/api/admin/crm/appointments/[id]/reschedule.post.ts`: 74 linhas
  - `server/api/admin/crm/appointments/[id]/cancel.post.ts`: 66 linhas
  - `server/api/admin/crm/appointments/[id]/status.post.ts`: 70 linhas
  - `server/api/admin/crm/work-orders/[id]/appointments.get.ts`: 39 linhas
  - `server/api/admin/crm/staff/index.get.ts`: 41 linhas
  - `server/api/admin/crm/staff/index.post.ts`: 55 linhas
  - `server/api/admin/crm/staff/[id].patch.ts`: 73 linhas
  - `server/api/admin/crm/work-orders/[id]/index.patch.ts`: 124 linhas
  - `server/api/admin/crm/work-orders/[id]/status.post.ts`: 144 linhas
  - `server/api/admin/crm/work-orders/index.post.ts`: 128 linhas
  - `server/api/admin/crm/leads/[id]/convert.post.ts`: 148 linhas
  - `server/shared/appointmentValidation.mjs`: 58 linhas
  - `server/utils/crmAppointmentErrors.ts`: 152 linhas
  - `server/utils/crmAppointmentHelpers.ts`: 67 linhas
  - `app/types/crmAppointments.ts`: 120 linhas
  - `server/shared/appointmentTypes.ts`: 7 linhas
- **Arquivos Acima do Limite**: **0** (100% em conformidade).

---

## 8. Segurança em Produção

- **Total de Escritas em Produção na Fase 5.0C**: **0** (`PRODUCTION_DATABASE_WRITES=0`).
- **Nenhum Dado Real Afetado**: Validação confirmada pelo postflight read-only de produção.
