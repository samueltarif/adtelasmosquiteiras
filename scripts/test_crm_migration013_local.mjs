/**
 * Suíte de Testes da Migration 013 e Prova de Concorrência — Fase 5.0C.4B
 * Arquivo: scripts/test_crm_migration013_local.mjs
 */

import { execFile } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { runSql, assert, state, TEST_DB } from './migration012/helpers.mjs';
import { setupCleanOfficialBaseline } from './migration012/baseline-setup.mjs';
import { handleRpcError } from '../server/utils/crmAppointmentErrors.ts';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função para rodar comandos SQL de forma assíncrona concorrente real via execFile
function runSqlConcurrent(sql, db = TEST_DB) {
  return new Promise((resolve) => {
    execFile(
      'docker',
      ['exec', 'adt-postgres17-test', 'psql', '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-c', sql],
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            stdout: stdout ? stdout.trim() : '',
            stderr: stderr ? stderr.trim() : error.message
          });
        } else {
          resolve({
            success: true,
            stdout: stdout ? stdout.trim() : '',
            stderr: ''
          });
        }
      }
    );
  });
}

// Inicializar Fixtures necessárias
function setupTestFixtures() {
  const fixtureSql = `
    INSERT INTO auth.users (id, email) VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@adtelas.com.br') ON CONFLICT DO NOTHING;
    INSERT INTO public.admin_users (user_id, email, role, is_active) VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@adtelas.com.br', 'admin', true) ON CONFLICT DO NOTHING;

    INSERT INTO public.clients (id, nome, tipo_cliente, cpf_cnpj, telefone_principal, email)
    VALUES ('c0000000-0000-0000-0000-000000000001', 'Cliente Teste Invariante', 'pessoa_fisica', '12345678901', '11999998888', 'cliente@teste.com')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.client_addresses (id, client_id, logradouro, numero, bairro, cidade, uf, cep)
    VALUES ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Rua das Flores', '100', 'Centro', 'São Paulo', 'SP', '01001000')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.crm_staff (id, nome, funcao, is_active)
    VALUES ('b0000000-0000-0000-0000-000000000001', 'Técnico Carlos 013', 'instalador', true),
           ('b0000000-0000-0000-0000-000000000002', 'Técnico Roberto 013', 'instalador', true)
    ON CONFLICT DO NOTHING;
  `;
  runSql(fixtureSql);
}

function createWorkOrder(id, status, numero) {
  const sql = `
    INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, valor_total, valor_desconto, is_archived)
    VALUES ('${id}', '${numero}', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '${status}', 1000.00, 0.00, false);
  `;
  const res = runSql(sql);
  if (!res.success) {
    throw new Error(`Erro ao criar OS: ${res.stderr}`);
  }
}

function createActiveAppointmentDirect(apptId, woId, status = 'agendado', tipo = 'manutencao') {
  const motive = ['reagendado', 'cancelado'].includes(status) ? "'Justificativa'" : 'NULL';
  const sql = `
    INSERT INTO public.appointments (id, work_order_id, client_id, address_id, staff_id, tipo_agendamento, data_hora_inicio, data_hora_fim, status_agendamento, motivo_reagendamento_cancelamento)
    VALUES ('${apptId}', '${woId}', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', NULL, '${tipo}', '2026-10-10T10:00:00Z', '2026-10-10T11:00:00Z', '${status}', ${motive});
  `;
  const res = runSql(sql);
  if (!res.success) {
    throw new Error(`Erro ao criar Appointment direto: ${res.stderr}`);
  }
}

function createActiveWarranty(warrantyId, woId) {
  const sql = `
    INSERT INTO public.warranties (id, work_order_id, client_id, data_inicio, data_termino, status_operacional)
    VALUES ('${warrantyId}', '${woId}', 'c0000000-0000-0000-0000-000000000001', '2026-01-01', '2027-12-31', 'normal')
    ON CONFLICT DO NOTHING;
  `;
  const res = runSql(sql);
  if (!res.success) {
    throw new Error(`Erro ao criar Garantia: ${res.stderr}`);
  }
}

async function main() {
  console.log('=================================================================');
  console.log('FASE 5.0C.4B — SUÍTE DE TESTES LOCAIS DA MIGRATION 013 & CONCORRÊNCIA');
  console.log('=================================================================\n');

  const startTime = Date.now();
  let deadlockCount = 0;

  // 1. Preparar Baseline
  setupCleanOfficialBaseline();

  // 2. Aplicar Migration 012
  console.log('\nAplicando Migration 012 baseline...');
  const migration012File = path.resolve('supabase/manual/012_crm_appointments_and_staff_engine.sql');
  const migration012Sql = fs.readFileSync(migration012File, 'utf8');
  const res012 = runSql(migration012Sql);
  assert(res012.success, 'Migration 012 aplicada com sucesso', res012.stderr);

  // 3. Validar SHA Normalized LF da Migration 012
  console.log('\n[1] Verificando integridade SHA-256 LF da Migration 012...');
  const normalized012Content = migration012Sql.replace(/\r\n/g, '\n');
  const sha012 = crypto.createHash('sha256').update(normalized012Content, 'utf8').digest('hex').toUpperCase();
  assert(sha012 === '43D5620DFDF590F2C3F9BE551ADE5FEE33754844E4A0815B4B4A94540D7A6C5F',
    `SHA-256 da Migration 012 confere exatamente (${sha012})`);

  // Carregar SQL da Migration 013
  const migration013File = path.resolve('supabase/manual/013_work_order_terminal_appointment_guard.sql');
  const migration013Sql = fs.readFileSync(migration013File, 'utf8');

  // 4. Teste de Rollback Transacional
  console.log('\n[2] Executando Teste de Rollback Transacional...');
  const corruptSql = migration013Sql.replace('COMMIT;', 'SELECT 1/0; COMMIT;');
  const resCorrupt = runSql(corruptSql);
  assert(!resCorrupt.success, 'Migration 013 corrompida foi rejeitada com rollback automático (PARTIAL_INSTALLATION_AFTER_FAILURE=NO)');

  const checkObjectsAfterRollback = runSql(`
    SELECT (to_regproc('public.fn_prevent_terminal_work_order_with_active_appointments') IS NOT NULL) OR
           EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_terminal_work_order_with_active_appointments');
  `);
  assert(checkObjectsAfterRollback.stdout === 'f', 'Nenhum objeto da Migration 013 ficou no banco após o rollback');

  // 5. Teste de Lock Contention + Timeout + Fail-Fast Rollback
  console.log('\n[3] Executando Teste de Lock Contention, Timeout e Fail-Fast Rollback...');
  const blockerPromise = runSqlConcurrent(`BEGIN; LOCK TABLE public.work_orders IN EXCLUSIVE MODE; SELECT pg_sleep(1.2); COMMIT;`);
  await sleep(100);

  const fastTimeoutSql = migration013Sql.replace("SET LOCAL lock_timeout = '5s';", "SET LOCAL lock_timeout = '500ms';");
  const resTimeout = runSql(fastTimeoutSql);
  await blockerPromise;

  assert(!resTimeout.success && (resTimeout.stderr.includes('lock_not_available') || resTimeout.stderr.includes('canceling statement due to lock timeout')),
    'Migration 013 abortou com fail-fast no lock_timeout ao encontrar contenção de tabela');

  const checkObjectsAfterTimeout = runSql(`
    SELECT (to_regproc('public.fn_prevent_terminal_work_order_with_active_appointments') IS NOT NULL) OR
           EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_terminal_work_order_with_active_appointments');
  `);
  assert(checkObjectsAfterTimeout.stdout === 'f', 'Nenhum objeto da Migration 013 foi persistido após timeout de lock');

  // 6. Aplicar Migration 013 Oficial
  console.log('\nAplicando Migration 013 oficial...');
  const res013 = runSql(migration013Sql);
  assert(res013.success, 'Migration 013 oficial aplicada com sucesso (PREFLIGHT_FAIL_CLOSED=PASS, GLOBAL_TRANSACTION=YES)', res013.stderr);

  // 7. Teste de Reaplicação Rejeitada (Preflight Fail-Closed)
  console.log('\n[4] Executando Teste de Reaplicação Rejeitada (Preflight Fail-Closed)...');
  const resReapply = runSql(migration013Sql);
  assert(!resReapply.success && resReapply.stderr.includes('PREFLIGHT_FAILED'),
    'Reaplicação da Migration 013 falhou no preflight conforme esperado');

  // 8. Validação de Propriedades da Função e Privilégios no Catálogo
  console.log('\n[5] Validando Propriedades da Função e Privilégios...');
  const fnProps = runSql(`
    SELECT p.prosecdef::text || '|' || p.provolatile::text || '|' ||
           COALESCE((SELECT option_value FROM pg_options_to_table(p.proconfig) WHERE option_name = 'search_path'), '<null>') || '|' ||
           has_function_privilege('public', p.oid, 'EXECUTE')::text || '|' ||
           has_function_privilege('anon', p.oid, 'EXECUTE')::text || '|' ||
           has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || '|' ||
           has_function_privilege('service_role', p.oid, 'EXECUTE')::text
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'fn_prevent_terminal_work_order_with_active_appointments';
  `);
  const [secDef, vola, sp, pubEx, anonEx, authEx, srEx] = fnProps.stdout.split('|');
  assert(secDef === 'true', 'FUNCTION_SECURITY_DEFINER = YES');
  assert(vola === 'v', 'FUNCTION_VOLATILITY = VOLATILE');
  assert(sp === '' || sp === '""', 'FUNCTION_EMPTY_SEARCH_PATH = YES');
  assert(pubEx === 'false', 'FUNCTION_PUBLIC_EXECUTE = NO');
  assert(anonEx === 'false', 'ANON_EXECUTE = NO');
  assert(authEx === 'false', 'AUTHENTICATED_EXECUTE = NO');
  assert(srEx === 'false', 'FUNCTION_SERVICE_ROLE_DIRECT_EXECUTE = NO');

  // Configurar Fixtures
  setupTestFixtures();

  // 9. Testes de Regressão Não Terminal / Campos Não-Status
  console.log('\n[6] Executando Testes de Regressão Não-Terminal e Mesma Transição...');
  const woRegId = crypto.randomUUID();
  createWorkOrder(woRegId, 'orcamento', 'OS-REG-0001');

  const resUpdateVal = runSql(`UPDATE public.work_orders SET valor_total = 1100.00 WHERE id = '${woRegId}';`);
  assert(resUpdateVal.success, 'NON_STATUS_UPDATE_REGRESSION = PASS: Permitido atualizar campos não-status');

  const resSameStatus = runSql(`UPDATE public.work_orders SET status_os = 'orcamento' WHERE id = '${woRegId}';`);
  assert(resSameStatus.success, 'SAME_STATUS_UPDATE_REGRESSION = PASS: Permitido UPDATE com mesmo status_os');

  const resUpdateStatus = runSql(`UPDATE public.work_orders SET status_os = 'aprovada' WHERE id = '${woRegId}';`);
  assert(resUpdateStatus.success, 'Permitida transição não-terminal (orcamento -> aprovada)');

  // 10. Matriz Funcional Completa (A até I)
  console.log('\n[7] Executando Matriz Funcional Completa...');

  // A. OS sem appointments ativos: concluida ALLOW, cancelada ALLOW
  {
    const wo1 = crypto.randomUUID();
    createWorkOrder(wo1, 'aprovada', 'OS-NOAPPT-1');
    const res1 = runSql(`UPDATE public.work_orders SET status_os = 'concluida' WHERE id = '${wo1}';`);
    assert(res1.success, 'A. OS sem appointments: concluida ALLOW');

    const wo2 = crypto.randomUUID();
    createWorkOrder(wo2, 'aprovada', 'OS-NOAPPT-2');
    const res2 = runSql(`UPDATE public.work_orders SET status_os = 'cancelada' WHERE id = '${wo2}';`);
    assert(res2.success, 'A. OS sem appointments: cancelada ALLOW');
  }

  // B. Active visita_tecnica: concluida BLOCK, cancelada BLOCK
  {
    const wo = crypto.randomUUID();
    createWorkOrder(wo, 'aprovada', 'OS-VT-1');
    createActiveAppointmentDirect(crypto.randomUUID(), wo, 'agendado', 'visita_tecnica');
    const r1 = runSql(`UPDATE public.work_orders SET status_os = 'concluida' WHERE id = '${wo}';`);
    assert(!r1.success && r1.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), 'B. visita_tecnica: concluida BLOCK');
    const r2 = runSql(`UPDATE public.work_orders SET status_os = 'cancelada' WHERE id = '${wo}';`);
    assert(!r2.success && r2.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), 'B. visita_tecnica: cancelada BLOCK');
  }

  // C. Active medicao: concluida BLOCK, cancelada BLOCK
  {
    const wo = crypto.randomUUID();
    createWorkOrder(wo, 'aprovada', 'OS-MED-1');
    createActiveAppointmentDirect(crypto.randomUUID(), wo, 'confirmado', 'medicao');
    const r1 = runSql(`UPDATE public.work_orders SET status_os = 'concluida' WHERE id = '${wo}';`);
    assert(!r1.success && r1.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), 'C. medicao: concluida BLOCK');
    const r2 = runSql(`UPDATE public.work_orders SET status_os = 'cancelada' WHERE id = '${wo}';`);
    assert(!r2.success && r2.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), 'C. medicao: cancelada BLOCK');
  }

  // D. Active instalacao: concluida BLOCK, cancelada BLOCK
  {
    const wo = crypto.randomUUID();
    createWorkOrder(wo, 'aprovada', 'OS-INS-1');
    createActiveAppointmentDirect(crypto.randomUUID(), wo, 'em_deslocamento', 'instalacao');
    const r1 = runSql(`UPDATE public.work_orders SET status_os = 'concluida' WHERE id = '${wo}';`);
    assert(!r1.success && r1.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), 'D. instalacao: concluida BLOCK');
    const r2 = runSql(`UPDATE public.work_orders SET status_os = 'cancelada' WHERE id = '${wo}';`);
    assert(!r2.success && r2.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), 'D. instalacao: cancelada BLOCK');
  }

  // E. Active manutencao: concluida BLOCK, cancelada BLOCK
  {
    const wo = crypto.randomUUID();
    createWorkOrder(wo, 'aprovada', 'OS-MAN-1');
    createActiveAppointmentDirect(crypto.randomUUID(), wo, 'agendado', 'manutencao');
    const r1 = runSql(`UPDATE public.work_orders SET status_os = 'concluida' WHERE id = '${wo}';`);
    assert(!r1.success && r1.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), 'E. manutencao: concluida BLOCK');
    const r2 = runSql(`UPDATE public.work_orders SET status_os = 'cancelada' WHERE id = '${wo}';`);
    assert(!r2.success && r2.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'), 'E. manutencao: cancelada BLOCK');
  }

  // F. Appointments terminais (realizado, reagendado, cancelado): ALLOW
  for (const ts of ['concluida', 'cancelada']) {
    for (const tas of ['realizado', 'reagendado', 'cancelado']) {
      const woId = crypto.randomUUID();
      createWorkOrder(woId, 'aprovada', `OS-TERM-${crypto.randomUUID().substring(0, 6)}`);
      createActiveAppointmentDirect(crypto.randomUUID(), woId, tas, 'instalacao');
      const res = runSql(`UPDATE public.work_orders SET status_os = '${ts}' WHERE id = '${woId}';`);
      assert(res.success, `F. Terminal: OS '${ts}' com appointment '${tas}' ALLOW`);
    }
  }

  // G. Garantia Ativa em OS Concluída: ALLOW
  for (const statusGarantia of ['agendado', 'confirmado', 'em_deslocamento']) {
    const woConcId = crypto.randomUUID();
    const apptGarantiaId = crypto.randomUUID();
    createWorkOrder(woConcId, 'concluida', `OS-GAR-${crypto.randomUUID().substring(0, 6)}`);
    createActiveWarranty(crypto.randomUUID(), woConcId);
    createActiveAppointmentDirect(apptGarantiaId, woConcId, statusGarantia, 'garantia');

    const resWoVal = runSql(`UPDATE public.work_orders SET updated_at = now() WHERE id = '${woConcId}';`);
    assert(resWoVal.success, `G. CONCLUDED_WORK_ORDER_ACTIVE_WARRANTY_ALLOWED = PASS (${statusGarantia})`);
  }

  // 11. Testes Determinísticos de Duas Conexões com Barreiras — Ordem A e Ordem B
  console.log('\n[8] Executando Testes Determinísticos com 2 Conexões em Ambas as Ordens...');

  // --- CENÁRIO 1: Manutenção vs Concluída ---
  // Ordem A: create_appointment_atomic trava a OS primeiro
  {
    const woId = crypto.randomUUID();
    createWorkOrder(woId, 'em_execucao', 'OS-DET-1A');
    const pA = runSqlConcurrent(`
      BEGIN;
      SELECT id FROM public.work_orders WHERE id = '${woId}' FOR UPDATE;
      SELECT pg_sleep(0.4);
      SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'manutencao', '2026-11-10T10:00:00Z', '2026-11-10T11:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Deterministic Appt');
      COMMIT;
    `);
    await sleep(80);
    const pB = runSqlConcurrent(`UPDATE public.work_orders SET status_os = 'concluida', updated_at = now() WHERE id = '${woId}';`);

    const [resA, resB] = await Promise.all([pA, pB]);
    assert(resA.success, 'Cenário 1 (Ordem A): create_appointment_atomic obteve lock primeiro e teve SUCESSO');
    assert(!resB.success && resB.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'),
      'Cenário 1 (Ordem A): UPDATE terminal acordou e foi bloqueado por ERR_ACTIVE_APPOINTMENTS_EXIST');
  }

  // Ordem B: UPDATE terminal trava a OS primeiro
  {
    const woId = crypto.randomUUID();
    createWorkOrder(woId, 'em_execucao', 'OS-DET-1B');
    const pA = runSqlConcurrent(`
      BEGIN;
      SELECT id FROM public.work_orders WHERE id = '${woId}' FOR UPDATE;
      SELECT pg_sleep(0.4);
      UPDATE public.work_orders SET status_os = 'concluida', updated_at = now() WHERE id = '${woId}';
      COMMIT;
    `);
    await sleep(80);
    const pB = runSqlConcurrent(`SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'manutencao', '2026-11-10T14:00:00Z', '2026-11-10T15:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Deterministic Appt');`);

    const [resA, resB] = await Promise.all([pA, pB]);
    assert(resA.success, 'Cenário 1 (Ordem B): UPDATE terminal obteve lock primeiro e teve SUCESSO');
    assert(!resB.success && resB.stderr.includes('ERR_MAINTENANCE_WORK_ORDER_STATUS'),
      'Cenário 1 (Ordem B): create_appointment_atomic acordou e foi rejeitado por status terminal da OS');
  }

  // --- CENÁRIO 2: Instalação vs Cancelada ---
  // Ordem A: create_appointment_atomic trava primeiro
  {
    const woId = crypto.randomUUID();
    createWorkOrder(woId, 'aprovada', 'OS-DET-2A');
    const pA = runSqlConcurrent(`
      BEGIN;
      SELECT id FROM public.work_orders WHERE id = '${woId}' FOR UPDATE;
      SELECT pg_sleep(0.4);
      SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'instalacao', '2026-11-11T10:00:00Z', '2026-11-11T11:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Deterministic Inst');
      COMMIT;
    `);
    await sleep(80);
    const pB = runSqlConcurrent(`UPDATE public.work_orders SET status_os = 'cancelada', updated_at = now() WHERE id = '${woId}';`);

    const [resA, resB] = await Promise.all([pA, pB]);
    assert(resA.success, 'Cenário 2 (Ordem A): create_appointment_atomic travou primeiro e teve SUCESSO');
    assert(!resB.success && resB.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'),
      'Cenário 2 (Ordem A): UPDATE cancelada acordou e foi bloqueado por ERR_ACTIVE_APPOINTMENTS_EXIST');
  }

  // Ordem B: UPDATE cancelada trava primeiro
  {
    const woId = crypto.randomUUID();
    createWorkOrder(woId, 'aprovada', 'OS-DET-2B');
    const pA = runSqlConcurrent(`
      BEGIN;
      SELECT id FROM public.work_orders WHERE id = '${woId}' FOR UPDATE;
      SELECT pg_sleep(0.4);
      UPDATE public.work_orders SET status_os = 'cancelada', updated_at = now() WHERE id = '${woId}';
      COMMIT;
    `);
    await sleep(80);
    const pB = runSqlConcurrent(`SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'instalacao', '2026-11-11T14:00:00Z', '2026-11-11T15:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Deterministic Inst');`);

    const [resA, resB] = await Promise.all([pA, pB]);
    assert(resA.success, 'Cenário 2 (Ordem B): UPDATE cancelada travou primeiro e teve SUCESSO');
    assert(!resB.success && resB.stderr.includes('ERR_INSTALLATION_WORK_ORDER_STATUS'),
      'Cenário 2 (Ordem B): create_appointment_atomic acordou e foi rejeitado por status terminal da OS');
  }

  // --- CENÁRIO 3: Visita Técnica vs Cancelada ---
  // Ordem A: create_appointment_atomic trava primeiro
  {
    const woId = crypto.randomUUID();
    createWorkOrder(woId, 'aprovada', 'OS-DET-3A');
    const pA = runSqlConcurrent(`
      BEGIN;
      SELECT id FROM public.work_orders WHERE id = '${woId}' FOR UPDATE;
      SELECT pg_sleep(0.4);
      SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'visita_tecnica', '2026-11-12T10:00:00Z', '2026-11-12T11:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Deterministic VT');
      COMMIT;
    `);
    await sleep(80);
    const pB = runSqlConcurrent(`UPDATE public.work_orders SET status_os = 'cancelada', updated_at = now() WHERE id = '${woId}';`);

    const [resA, resB] = await Promise.all([pA, pB]);
    assert(resA.success, 'Cenário 3 (Ordem A): create_appointment_atomic travou primeiro e teve SUCESSO');
    assert(!resB.success && resB.stderr.includes('ERR_ACTIVE_APPOINTMENTS_EXIST'),
      'Cenário 3 (Ordem A): UPDATE cancelada acordou e foi bloqueado por ERR_ACTIVE_APPOINTMENTS_EXIST');
  }

  // Ordem B: UPDATE cancelada trava primeiro
  {
    const woId = crypto.randomUUID();
    createWorkOrder(woId, 'aprovada', 'OS-DET-3B');
    const pA = runSqlConcurrent(`
      BEGIN;
      SELECT id FROM public.work_orders WHERE id = '${woId}' FOR UPDATE;
      SELECT pg_sleep(0.4);
      UPDATE public.work_orders SET status_os = 'cancelada', updated_at = now() WHERE id = '${woId}';
      COMMIT;
    `);
    await sleep(80);
    const pB = runSqlConcurrent(`SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'visita_tecnica', '2026-11-12T14:00:00Z', '2026-11-12T15:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Deterministic VT');`);

    const [resA, resB] = await Promise.all([pA, pB]);
    assert(resA.success, 'Cenário 3 (Ordem B): UPDATE cancelada travou primeiro e teve SUCESSO');
    assert(!resB.success && resB.stderr.includes('ERR_QUOTE_WORK_ORDER_STATUS'),
      'Cenário 3 (Ordem B): create_appointment_atomic acordou e foi rejeitado por status terminal da OS');
  }

  // 12. Concorrência com outras RPCs: cancel_appointment_atomic, reschedule, status
  console.log('\n[9] Executando Testes de Concorrência com Outras RPCs (cancel, reschedule, status)...');

  // A) cancel_appointment_atomic vs UPDATE concluida
  {
    const woId = crypto.randomUUID();
    const apptId = crypto.randomUUID();
    createWorkOrder(woId, 'em_execucao', 'OS-RPC-CANC');
    createActiveAppointmentDirect(apptId, woId, 'agendado', 'instalacao');
    const apptUpd = (await runSqlConcurrent(`SELECT updated_at::text FROM public.appointments WHERE id = '${apptId}';`)).stdout;

    const [rA, rB] = await Promise.all([
      runSqlConcurrent(`SELECT public.cancel_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${apptId}', 'Cancelamento concorrente', '${apptUpd}'::timestamptz);`),
      runSqlConcurrent(`UPDATE public.work_orders SET status_os = 'concluida', updated_at = now() WHERE id = '${woId}';`)
    ]);
    if (rA.stderr.includes('40P01') || rB.stderr.includes('40P01')) deadlockCount++;
    const finalWo = (await runSqlConcurrent(`SELECT status_os FROM public.work_orders WHERE id = '${woId}';`)).stdout;
    const finalAppt = (await runSqlConcurrent(`SELECT status_agendamento FROM public.appointments WHERE id = '${apptId}';`)).stdout;
    assert(!(finalWo === 'concluida' && ['agendado', 'confirmado', 'em_deslocamento'].includes(finalAppt)),
      'cancel_appointment_atomic vs UPDATE concluida: Estado final consistente');
  }

  // B) update_appointment_status_atomic (realizado) vs UPDATE concluida
  {
    const woId = crypto.randomUUID();
    const apptId = crypto.randomUUID();
    createWorkOrder(woId, 'em_execucao', 'OS-RPC-STAT');
    createActiveAppointmentDirect(apptId, woId, 'em_deslocamento', 'instalacao');
    const apptUpd = (await runSqlConcurrent(`SELECT updated_at::text FROM public.appointments WHERE id = '${apptId}';`)).stdout;

    const [rA, rB] = await Promise.all([
      runSqlConcurrent(`SELECT public.update_appointment_status_atomic('a0000000-0000-0000-0000-000000000001', '${apptId}', 'realizado', '${apptUpd}'::timestamptz);`),
      runSqlConcurrent(`UPDATE public.work_orders SET status_os = 'concluida', updated_at = now() WHERE id = '${woId}';`)
    ]);
    if (rA.stderr.includes('40P01') || rB.stderr.includes('40P01')) deadlockCount++;
    const finalWo = (await runSqlConcurrent(`SELECT status_os FROM public.work_orders WHERE id = '${woId}';`)).stdout;
    const finalAppt = (await runSqlConcurrent(`SELECT status_agendamento FROM public.appointments WHERE id = '${apptId}';`)).stdout;
    assert(!(finalWo === 'concluida' && ['agendado', 'confirmado', 'em_deslocamento'].includes(finalAppt)),
      'update_appointment_status_atomic (realizado) vs UPDATE concluida: Estado final consistente');
  }

  // 13. Stress Tests de Concorrência (50 iterações por cenário)
  console.log('\n[10] Executando Stress Tests de Concorrência (50 iterações por cenário)...');
  let forbiddenFinalStates = 0;
  let totalStressIterations = 0;

  // Stress 1: maintenance vs concluida
  for (let i = 0; i < 50; i++) {
    totalStressIterations++;
    const woId = crypto.randomUUID();
    await runSqlConcurrent(`INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, valor_total, valor_desconto, is_archived) VALUES ('${woId}', 'OS-STR-1-${i}', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'em_execucao', 1000.00, 0.00, false);`);

    const sqlA = `UPDATE public.work_orders SET status_os = 'concluida', updated_at = now() WHERE id = '${woId}';`;
    const sqlB = `SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'manutencao', '2026-10-12T10:00:00Z', '2026-10-12T11:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Stress Appt 1');`;

    const [resA, resB] = await Promise.all([runSqlConcurrent(sqlA), runSqlConcurrent(sqlB)]);
    if (resA.stderr.includes('40P01') || resB.stderr.includes('40P01')) deadlockCount++;

    const checkRes = await runSqlConcurrent(`SELECT wo.status_os || '|' || (SELECT COUNT(*) FROM public.appointments WHERE work_order_id = '${woId}' AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento') AND tipo_agendamento <> 'garantia') FROM public.work_orders wo WHERE wo.id = '${woId}';`);
    const [finalWo, activeApptsCount] = checkRes.stdout.split('|');
    if (finalWo === 'concluida' && parseInt(activeApptsCount || '0', 10) > 0) forbiddenFinalStates++;
  }

  // Stress 2: installation vs cancelada
  for (let i = 0; i < 50; i++) {
    totalStressIterations++;
    const woId = crypto.randomUUID();
    await runSqlConcurrent(`INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, valor_total, valor_desconto, is_archived) VALUES ('${woId}', 'OS-STR-2-${i}', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'aprovada', 1000.00, 0.00, false);`);

    const sqlA = `UPDATE public.work_orders SET status_os = 'cancelada', updated_at = now() WHERE id = '${woId}';`;
    const sqlB = `SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'instalacao', '2026-10-13T14:00:00Z', '2026-10-13T15:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Stress Appt 2');`;

    const [resA, resB] = await Promise.all([runSqlConcurrent(sqlA), runSqlConcurrent(sqlB)]);
    if (resA.stderr.includes('40P01') || resB.stderr.includes('40P01')) deadlockCount++;

    const checkRes = await runSqlConcurrent(`SELECT wo.status_os || '|' || (SELECT COUNT(*) FROM public.appointments WHERE work_order_id = '${woId}' AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')) FROM public.work_orders wo WHERE wo.id = '${woId}';`);
    const [finalWo, activeApptsCount] = checkRes.stdout.split('|');
    if (finalWo === 'cancelada' && parseInt(activeApptsCount || '0', 10) > 0) forbiddenFinalStates++;
  }

  // Stress 3: visita_tecnica vs cancelada
  for (let i = 0; i < 50; i++) {
    totalStressIterations++;
    const woId = crypto.randomUUID();
    await runSqlConcurrent(`INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, valor_total, valor_desconto, is_archived) VALUES ('${woId}', 'OS-STR-3-${i}', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'aprovada', 1000.00, 0.00, false);`);

    const sqlA = `UPDATE public.work_orders SET status_os = 'cancelada', updated_at = now() WHERE id = '${woId}';`;
    const sqlB = `SELECT public.create_appointment_atomic('a0000000-0000-0000-0000-000000000001', '${woId}', 'visita_tecnica', '2026-10-13T14:00:00Z', '2026-10-13T15:00:00Z', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Stress Appt 3');`;

    const [resA, resB] = await Promise.all([runSqlConcurrent(sqlA), runSqlConcurrent(sqlB)]);
    if (resA.stderr.includes('40P01') || resB.stderr.includes('40P01')) deadlockCount++;

    const checkRes = await runSqlConcurrent(`SELECT wo.status_os || '|' || (SELECT COUNT(*) FROM public.appointments WHERE work_order_id = '${woId}' AND status_agendamento IN ('agendado', 'confirmado', 'em_deslocamento')) FROM public.work_orders wo WHERE wo.id = '${woId}';`);
    const [finalWo, activeApptsCount] = checkRes.stdout.split('|');
    if (finalWo === 'cancelada' && parseInt(activeApptsCount || '0', 10) > 0) forbiddenFinalStates++;
  }

  assert(forbiddenFinalStates === 0, `FORBIDDEN_FINAL_STATE_COUNT = 0 (${totalStressIterations} iterações executadas)`);
  assert(deadlockCount === 0, `DEADLOCK_40P01_COUNT = 0`);

  // 14. Validação de Mapeamento de Erro BFF
  console.log('\n[11] Validando Mapeador de Erro BFF para ERR_ACTIVE_APPOINTMENTS_EXIST...');
  try {
    handleRpcError({ message: 'ERROR: ERR_ACTIVE_APPOINTMENTS_EXIST' });
    assert(false, 'handleRpcError deveria ter lançado H3Error');
  } catch (err) {
    assert(err.statusCode === 409, `ERR_ACTIVE_APPOINTMENTS_EXIST_HTTP = 409 (status=${err.statusCode})`);
    assert(err.data?.error?.code === 'ERR_ACTIVE_APPOINTMENTS_EXIST', 'Código de erro retornado confere');
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n=================================================================');
  console.log(`RESULTADO DA SUÍTE DE TESTES DA MIGRATION 013 (${totalDuration}ms):`);
  console.log(`  TOTAL DE ASSERTS EXECUTADOS: ${state.passed + state.failed}`);
  console.log(`  ASSERTS APROVADOS (PASS):   ${state.passed}`);
  console.log(`  ASSERTS REPROVADOS (FAIL):  ${state.failed}`);
  console.log(`  CONCURRENT_STRESS_ITERATIONS: ${totalStressIterations}`);
  console.log(`  FORBIDDEN_FINAL_STATE_COUNT: ${forbiddenFinalStates}`);
  console.log(`  DEADLOCK_40P01_COUNT:       ${deadlockCount}`);
  console.log('=================================================================\n');

  if (state.failed > 0) {
    console.error('ERRO: A suíte de testes da Migration 013 falhou.');
    process.exit(1);
  } else {
    console.log('SUCESSO: Todos os testes passaram e o invariante concorrente foi homologado!');
  }
}

main().catch((err) => {
  console.error('ERRO FATAL NA EXECUÇÃO DO TESTE:', err);
  process.exit(1);
});
