# PLANO DE IMPLEMENTAÇÃO — FASE 5.0

## CRM — Agenda, Agendamentos e Equipe Operacional
## PostgreSQL 17 / Supabase

---

### Status do Plano
- **Fase 5.0A**: APROVADA
- **Fase 5.0B.1/5.0B.2**: APROVADAS (74/74 Testes Locais PG17 PASS)
- **Fase 5.0B.3**: APROVADA (Preflight Read-Only PASS)
- **Fase 5.0B.4 (Backup Gate)**: CONCLUÍDO (Backup Lógico Local Validado e Restaurado com 100% no PG17 Local)
- **Fase 5.0B.4 (Instalação Controlada)**: PRONTA PARA EXECUÇÃO NO SUPABASE SQL EDITOR

---

### 1. Dados de Backup e Pré-Execução

- **Arquivo da Migration 012**: `supabase/manual/012_crm_appointments_and_staff_engine.sql`
- **SHA-256 Físico Canônico**: `43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
- **Target de Produção**: `axjqhxpejwkuabeaoyaz.supabase.co` (Schema `public`)
- **Backup Local Criado**: `backups/pre_migration_012_20260828_153949.sql`
- **SHA-256 do Backup**: `31C930E066764A635E2EF77B0ABAF916B3320E5FFB2039EF8AD9CDB00AF8DB34`
- **Validação de Restore Local**: `PASS` (100% de integridade confirmada no banco `test_backup_restore_val`)

---

### 2. Snapshot de Contagens BEFORE

- `appointments`: 0
- `work_orders`: 4
- `work_order_proposals`: 2
- `crm_staff`: 0
- `crm_activity_log`: 4
- `warranties`: 0
- `admin_users`: 1 (ativo)

---

### 3. FASE 5.0B.4 — Production Installation & Postflight

- **SHA Executado**: `43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F`
- **Instrução de Execução**: Executar o script `supabase/manual/012_crm_appointments_and_staff_engine.sql` integralmente no Supabase SQL Editor (`BEGIN ... COMMIT`).
- **Verificação Pós-Execução**: Script automatizado `scripts/postflight_production_012_read_only.mjs` pronto para validar a criação das 5 RPCs, constraints, triggers, privileges, RLS e contagens.
