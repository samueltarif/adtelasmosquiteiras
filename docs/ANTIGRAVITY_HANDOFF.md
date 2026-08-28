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
  - **Postflight Read-Only de Produção**: `PASS` (100% dos testes de menor privilégio e integridade aprovados com zero mutações em dados reais).
  - **5 Stored Procedures (RPCs) Instaladas**:
    1. `create_appointment_atomic`
    2. `update_appointment_atomic`
    3. `reschedule_appointment_atomic`
    4. `cancel_appointment_atomic`
    5. `update_appointment_status_atomic`
  - **Mecanismos Físicos de Banco Ativos**:
    - Extensão `btree_gist` instalada;
    - Exclusion constraint temporal `unq_appointments_staff_active_period` (GIST) para bloqueio no nível de banco de sobreposição de horários de técnicos;
    - Índice parcial de unicidade `unq_active_installation_per_wo` (máximo de 1 instalação ativa por OS);
    - Triggers de bloqueio de exclusão física `trg_prevent_hard_delete_appointments` e `trg_prevent_hard_delete_crm_staff`;
    - Trigger de bloqueio de desativação de técnico com compromissos pendentes `trg_check_crm_staff_deactivation`;
    - Row-Level Security (RLS) habilitada e validada;
    - Menor privilégio: DML direto (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) na tabela `public.appointments` revogado (`42501 permission denied for table appointments`);
    - Entidades e ações de `proposals` (Migration 011) integralmente preservadas no `crm_activity_log`.

---

## 2. Backup Lógico de Segurança Pré-Migration 012

- **Estratégia**: Snapshot lógico local antes da instalação da Migration 012.
- **Arquivo de Backup Local**: `backups/pre_migration_012_20260828_153949.sql`
- **SHA-256 do Arquivo**: `31C930E066764A635E2EF77B0ABAF916B3320E5FFB2039EF8AD9CDB00AF8DB34`
- **Validação de Restore Local em PostgreSQL 17**: `PASS` (100% íntegro).
- **Segurança de Dados Pessoais / Secrets**: O diretório `backups/` permanece listado no `.gitignore`. **NUNCA** fazer commit ou push do arquivo de backup e nunca expor seu conteúdo.

---

## 3. Próxima Etapa de Desenvolvimento

- **Próxima Fase**: `NEXT_PHASE=5.0C`
- **Nome da Fase**: **FASE 5.0C — Nitro BFF + Types + Data Prevista Guards**
- **Status Inicial**: `PRONTA PARA INÍCIO / EM PROGRESSO CONFORME COMANDOS DO USUÁRIO`
- **Objetivos Exclusivos da Fase 5.0C**:
  1. Tipos TypeScript canônicos do módulo Agenda/Equipe (`app/types/crmAppointments.ts`, `server/shared/appointmentTypes.ts`);
  2. Implementação e roteamento dos 12 endpoints Nitro BFF aprovados;
  3. Integração server-side com as 5 RPCs da Migration 012;
  4. Mapeamento centralizado de erros de domínio e SQLSTATEs (`server/utils/crmAppointmentErrors.ts`);
  5. Proteção e bloqueio dos fluxos legados de escrita em `work_orders.data_prevista` e transições manuais de status;
  6. Testes automatizados backend/API em PostgreSQL 17 local (`scripts/test_crm_phase5_backend.mjs`);
  7. Documentação técnica (`docs/CRM_PHASE_5_IMPLEMENTATION.md`).
- **PROIBIÇÃO DA FASE 5.0C**: **NÃO** implementar componentes visuais Vue, páginas de admin (`/admin/agenda`, `/admin/equipe`), visualizador de calendário ou drag & drop nesta fase.

---

## 4. Matriz dos 12 Endpoints Nitro BFF Aprovados

| # | Método | Rota | Descrição | Mecanismo / RPC |
|---|---|---|---|---|
| 1 | `GET` | `/api/admin/crm/appointments` | Consulta de calendário estruturada (máx 62 dias) | Select indexado + Joins |
| 2 | `POST` | `/api/admin/crm/appointments/search` | Busca textual/PII transmitida no body com segurança | Body (`readBody`) + Joins |
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

---

## 5. Regras de Integridade de `data_prevista` (Pendência Crítica)

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

## 9. Diretrizes de Responsividade Futura (Etapa de UI)

Quando a fase de interface visual for iniciada, a implementação e os testes visuais devem obrigatoriamente cobrir a matriz canônica de resoluções:

- **Mobile**: `320px`, `360px`, `375px`, `390px`, `412px`, `430px`;
- **Tablet**: `768px`, `1024px`;
- **Desktop / Wide**: `1280px`, `1920px`.

**Regras de UX e Layout**:
- Alvos de toque (touch targets) de botões e itens interativos: no mínimo `44x44px`;
- Zero scroll horizontal indesejado (`zero real horizontal overflow`);
- **Proibido** usar `overflow-x: hidden` no `body`/`html` como paliativo para consertar layouts desalinhados.

---

## 10. Arquivos Canônicos e Leituras Obrigatórias

Ao retomar o projeto em uma nova sessão, os seguintes arquivos reais existentes no repositório devem ser consultados:

### Documentação e Governança
1. [`docs/ANTIGRAVITY_HANDOFF.md`](file:///d:/sicons/ADT/docs/ANTIGRAVITY_HANDOFF.md) (Este documento);
2. [`docs/CRM_PHASE_5_IMPLEMENTATION.md`](file:///d:/sicons/ADT/docs/CRM_PHASE_5_IMPLEMENTATION.md) (Especificação técnica completa dos endpoints, RPCs, errors e guards);
3. [`implementation_plan.md`](file:///C:/Users/Vendas2/.gemini/antigravity-ide/brain/7064ca89-3739-4b4b-99aa-476634e7cae6/implementation_plan.md) (Evidências de execução de todas as fases).

### Banco de Dados / Migrations Canônicas
4. [`supabase/manual/010_crm_core_tables.sql`](file:///d:/sicons/ADT/supabase/manual/010_crm_core_tables.sql) (Fase 4 — Baseline do CRM);
5. [`supabase/manual/011_crm_work_order_proposals.sql`](file:///d:/sicons/ADT/supabase/manual/011_crm_work_order_proposals.sql) (Fase 4.5 — Motor de Propostas);
6. [`supabase/manual/012_crm_appointments_and_staff_engine.sql`](file:///d:/sicons/ADT/supabase/manual/012_crm_appointments_and_staff_engine.sql) (Fase 5.0B — Motor de Agenda e Equipe Instalado).

### Tipos, Utilitários e Endpoints Backend
7. [`app/types/crmAppointments.ts`](file:///d:/sicons/ADT/app/types/crmAppointments.ts) (Types TypeScript canônicos);
8. [`server/shared/appointmentValidation.mjs`](file:///d:/sicons/ADT/server/shared/appointmentValidation.mjs) (Regras de validação);
9. [`server/utils/crmAppointmentErrors.ts`](file:///d:/sicons/ADT/server/utils/crmAppointmentErrors.ts) (Mapeador central de erros HTTP/RPC);
10. [`server/utils/crmAppointmentHelpers.ts`](file:///d:/sicons/ADT/server/utils/crmAppointmentHelpers.ts) (Helpers de consulta da agenda);
11. [`server/utils/adminAuth.ts`](file:///d:/sicons/ADT/server/utils/adminAuth.ts) (Autenticação e CSRF de administradores);
12. [`server/utils/crm.ts`](file:///d:/sicons/ADT/server/utils/crm.ts) (Utilitários compartilhados do CRM e Activity Log).

### Scripts de Teste e Validação
13. [`scripts/test_crm_phase5_backend.mjs`](file:///d:/sicons/ADT/scripts/test_crm_phase5_backend.mjs) (Suíte de testes locais da Fase 5.0C);
14. [`scripts/postflight_production_012_read_only.mjs`](file:///d:/sicons/ADT/scripts/postflight_production_012_read_only.mjs) (Auditoria read-only em produção).

---

## 11. Protocolo Obrigatório para Início de Nova Sessão

> [!IMPORTANT]
> **ANTES DE ESCREVER CÓDIGO EM UMA NOVA SESSÃO DO ANTIGRAVITY:**
> 1. Ler integralmente [`docs/ANTIGRAVITY_HANDOFF.md`](file:///d:/sicons/ADT/docs/ANTIGRAVITY_HANDOFF.md);
> 2. Ler [`implementation_plan.md`](file:///C:/Users/Vendas2/.gemini/antigravity-ide/brain/7064ca89-3739-4b4b-99aa-476634e7cae6/implementation_plan.md);
> 3. Auditar o estado real do repository;
> 4. Confirmar que a **Migration 012 já está instalada** em produção e **NÃO DEVE ser reaplicada**;
> 5. Resumir o estado atual do projeto de forma concisa;
> 6. Confirmar qual é a próxima etapa autorizada pelo usuário (e.g., Fase 5.0D para UI ou validação de 5.0C);
> 7. Somente então iniciar alterações após comando explícito do usuário.
