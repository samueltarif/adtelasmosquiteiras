/**
 * Testes de Constraints, Índices e Triggers da Migration 012
 * Arquivo: scripts/migration012/constraints-tests.mjs
 */

import { runSql, assert } from './helpers.mjs'

export function setupTestFixtures() {
  const fixtureSql = `
    INSERT INTO auth.users (id, email) VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@adtelas.com.br') ON CONFLICT DO NOTHING;
    INSERT INTO public.admin_users (user_id, email, role, is_active) VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@adtelas.com.br', 'admin', true) ON CONFLICT DO NOTHING;

    INSERT INTO public.clients (id, nome, tipo_cliente, cpf_cnpj, telefone_principal, email)
    VALUES ('c0000000-0000-0000-0000-000000000001', 'Cliente Teste Agenda', 'pessoa_fisica', '12345678901', '11999998888', 'cliente@teste.com')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.client_addresses (id, client_id, logradouro, numero, bairro, cidade, uf, cep)
    VALUES ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Rua das Flores', '100', 'Centro', 'São Paulo', 'SP', '01001000')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.crm_staff (id, nome, funcao, is_active)
    VALUES ('b0000000-0000-0000-0000-000000000001', 'Técnico Carlos', 'instalador', true),
           ('b0000000-0000-0000-0000-000000000002', 'Técnico Roberto', 'instalador', true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, valor_total, valor_desconto)
    VALUES ('e0000000-0000-0000-0000-000000000001', 'OS-2026-0001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'aprovada', 1500.00, 0.00),
           ('e0000000-0000-0000-0000-000000000002', 'OS-2026-0002', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'orcamento', 800.00, 0.00),
           ('e0000000-0000-0000-0000-000000000003', 'OS-2026-0003', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'concluida', 2000.00, 0.00),
           ('e0000000-0000-0000-0000-000000000004', 'OS-2026-0004', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'aguardando_agendamento', 1200.00, 0.00)
    ON CONFLICT DO NOTHING;
  `
  runSql(fixtureSql)
}

export function runConstraintsAndTriggersTests() {
  console.log('\n[4/8] Testes de Exclusion Constraints, Índices e Triggers...')
  setupTestFixtures()

  // 1. Teste de Exclusion Constraint de Horário por Técnico (23P01)
  const appt1 = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000001',
      'instalacao',
      '2026-09-10T12:00:00Z',
      '2026-09-10T14:00:00Z',
      'b0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000001',
      'Instalação Principal'
    );
  `)
  assert(appt1.success, '10. Primeiro agendamento ativo criado para o Técnico Carlos', appt1.stderr)

  // Conflito de sobreposição direta (mesmo técnico, 13:00-15:00)
  const apptOverlap = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'visita_tecnica',
      '2026-09-10T13:00:00Z',
      '2026-09-10T15:00:00Z',
      'b0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000001',
      'Visita Conflitante'
    );
  `)
  assert(!apptOverlap.success && apptOverlap.stderr.includes('ERR_STAFF_SCHEDULE_CONFLICT'),
    '11. Exclusion Constraint GIST bloqueia sobreposição de horário para mesmo técnico')

  // 2. Teste do Partial Unique Index: No máximo 1 instalação ativa por OS (23505)
  runSql(`UPDATE public.work_orders SET status_os = 'aguardando_agendamento' WHERE id = 'e0000000-0000-0000-0000-000000000001';`)
  const secondInst = runSql(`
    SELECT public.create_appointment_atomic(
      'a0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000001',
      'instalacao',
      '2026-09-12T10:00:00Z',
      '2026-09-12T12:00:00Z',
      'b0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000001',
      'Segunda Instalação na mesma OS'
    );
  `)
  assert(!secondInst.success && secondInst.stderr.includes('ERR_ACTIVE_INSTALLATION_EXISTS'),
    '12. Partial Unique Index impede segunda instalação ativa para a mesma Ordem de Serviço')

  // 3. Teste do Trigger de Proteção contra DELETE Físico em appointments
  const parsedAppt1 = JSON.parse(appt1.stdout)
  const deleteAppt = runSql(`DELETE FROM public.appointments WHERE id = '${parsedAppt1.id}';`)
  assert(!deleteAppt.success && deleteAppt.stderr.includes('ERR_HARD_DELETE_FORBIDDEN'),
    '13. Trigger trg_prevent_hard_delete_appointments impede DELETE físico em appointments')

  // 4. Teste do Trigger de Proteção contra DELETE Físico em crm_staff
  const deleteStaff = runSql(`DELETE FROM public.crm_staff WHERE id = 'b0000000-0000-0000-0000-000000000001';`)
  assert(!deleteStaff.success && deleteStaff.stderr.includes('ERR_HARD_DELETE_FORBIDDEN'),
    '14. Trigger trg_prevent_hard_delete_crm_staff impede DELETE físico em crm_staff')

  // 5. Teste do Trigger de Bloqueio de Desativação de Staff com Compromissos Abertos
  const deactStaffWithAppt = runSql(`
    UPDATE public.crm_staff SET is_active = false WHERE id = 'b0000000-0000-0000-0000-000000000001';
  `)
  assert(!deactStaffWithAppt.success && deactStaffWithAppt.stderr.includes('ERR_STAFF_HAS_ACTIVE_APPOINTMENTS'),
    '15. Trigger trg_check_crm_staff_deactivation impede desativação de técnico com compromissos em aberto')

  // Desativação válida de técnico sem compromissos abertos
  const deactStaffClean = runSql(`
    UPDATE public.crm_staff SET is_active = false WHERE id = 'b0000000-0000-0000-0000-000000000002';
  `)
  assert(deactStaffClean.success, '16. Colaborador sem compromissos ativos pode ser desativado normalmente')
  runSql(`UPDATE public.crm_staff SET is_active = true WHERE id = 'b0000000-0000-0000-0000-000000000002';`)
}
