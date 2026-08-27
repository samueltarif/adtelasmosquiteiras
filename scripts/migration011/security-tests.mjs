/**
 * Módulo de Testes de Segurança, RLS, Privilégios e Triggers de Integridade
 * Arquivo: scripts/migration011/security-tests.mjs
 */

import { assert, runSql } from './helpers.mjs'

export function runSecurityAndPrivilegeTests() {
  console.log('\n[3/7] Executando Matriz de Privilégios de Tabela (RLS) e RPCs...')

  // 1. RLS - Papel anon (5 operações)
  const anonSelect = runSql('SET ROLE anon; SELECT * FROM public.work_order_proposals;')
  assert(!anonSelect.success && anonSelect.stderr.includes('permission denied'), 'Privilégio: anon SELECT em work_order_proposals é NEGADO')

  const anonInsert = runSql("SET ROLE anon; INSERT INTO public.work_order_proposals (work_order_id, client_id, version_number, idempotency_key, idempotency_request_sha256, company_snapshot, client_snapshot, items_snapshot, totals_snapshot, commercial_terms, valid_until) VALUES (gen_random_uuid(), gen_random_uuid(), 1, 'k', '0000000000000000000000000000000000000000000000000000000000000000', '{}', '{}', '[]', '{}', '{}', CURRENT_DATE);")
  assert(!anonInsert.success && anonInsert.stderr.includes('permission denied'), 'Privilégio: anon INSERT em work_order_proposals é NEGADO')

  const anonUpdate = runSql("SET ROLE anon; UPDATE public.work_order_proposals SET valid_until = CURRENT_DATE;")
  assert(!anonUpdate.success && anonUpdate.stderr.includes('permission denied'), 'Privilégio: anon UPDATE em work_order_proposals é NEGADO')

  const anonDelete = runSql("SET ROLE anon; DELETE FROM public.work_order_proposals;")
  assert(!anonDelete.success && anonDelete.stderr.includes('permission denied'), 'Privilégio: anon DELETE em work_order_proposals é NEGADO')

  const anonTruncate = runSql("SET ROLE anon; TRUNCATE TABLE public.work_order_proposals;")
  assert(!anonTruncate.success && anonTruncate.stderr.includes('permission denied'), 'Privilégio: anon TRUNCATE em work_order_proposals é NEGADO')

  // 2. RLS - Papel authenticated (5 operações)
  const authSelect = runSql('SET ROLE authenticated; SELECT * FROM public.work_order_proposals;')
  assert(!authSelect.success && authSelect.stderr.includes('permission denied'), 'Privilégio: authenticated SELECT em work_order_proposals é NEGADO')

  const authInsert = runSql("SET ROLE authenticated; INSERT INTO public.work_order_proposals (work_order_id, client_id, version_number, idempotency_key, idempotency_request_sha256, company_snapshot, client_snapshot, items_snapshot, totals_snapshot, commercial_terms, valid_until) VALUES (gen_random_uuid(), gen_random_uuid(), 1, 'k', '0000000000000000000000000000000000000000000000000000000000000000', '{}', '{}', '[]', '{}', '{}', CURRENT_DATE);")
  assert(!authInsert.success && authInsert.stderr.includes('permission denied'), 'Privilégio: authenticated INSERT em work_order_proposals é NEGADO')

  const authUpdate = runSql("SET ROLE authenticated; UPDATE public.work_order_proposals SET valid_until = CURRENT_DATE;")
  assert(!authUpdate.success && authUpdate.stderr.includes('permission denied'), 'Privilégio: authenticated UPDATE em work_order_proposals é NEGADO')

  const authDelete = runSql("SET ROLE authenticated; DELETE FROM public.work_order_proposals;")
  assert(!authDelete.success && authDelete.stderr.includes('permission denied'), 'Privilégio: authenticated DELETE em work_order_proposals é NEGADO')

  const authTruncate = runSql("SET ROLE authenticated; TRUNCATE TABLE public.work_order_proposals;")
  assert(!authTruncate.success && authTruncate.stderr.includes('permission denied'), 'Privilégio: authenticated TRUNCATE em work_order_proposals é NEGADO')

  // 3. RLS - Papel service_role (Menor Privilégio: apenas SELECT direto)
  const srvSelect = runSql('SET ROLE service_role; SELECT count(*) FROM public.work_order_proposals;')
  assert(srvSelect.success, 'Privilégio: service_role SELECT direto em work_order_proposals é PERMITIDO')

  const srvInsert = runSql("SET ROLE service_role; INSERT INTO public.work_order_proposals (work_order_id, client_id, version_number, idempotency_key, idempotency_request_sha256, company_snapshot, client_snapshot, items_snapshot, totals_snapshot, commercial_terms, valid_until) VALUES (gen_random_uuid(), gen_random_uuid(), 1, 'k', '0000000000000000000000000000000000000000000000000000000000000000', '{}', '{}', '[]', '{}', '{}', CURRENT_DATE);")
  assert(!srvInsert.success && srvInsert.stderr.includes('permission denied'), 'Privilégio: service_role INSERT direto é NEGADO (Menor Privilégio)')

  const srvUpdate = runSql("SET ROLE service_role; UPDATE public.work_order_proposals SET valid_until = CURRENT_DATE;")
  assert(!srvUpdate.success && srvUpdate.stderr.includes('permission denied'), 'Privilégio: service_role UPDATE direto é NEGADO (Menor Privilégio)')

  const srvDelete = runSql("SET ROLE service_role; DELETE FROM public.work_order_proposals;")
  assert(!srvDelete.success && srvDelete.stderr.includes('permission denied'), 'Privilégio: service_role DELETE direto é NEGADO (Menor Privilégio)')

  const srvTruncate = runSql("SET ROLE service_role; TRUNCATE TABLE public.work_order_proposals;")
  assert(!srvTruncate.success && srvTruncate.stderr.includes('permission denied'), 'Privilégio: service_role TRUNCATE direto é NEGADO (Menor Privilégio)')

  // 4. RPC EXECUTE Privileges para anon (4 RPCs)
  const rpcs = [
    { name: 'reserve_work_order_proposal_atomic', sql: "SELECT public.reserve_work_order_proposal_atomic(gen_random_uuid(), now(), 'k', '0000000000000000000000000000000000000000000000000000000000000000', '{}'::jsonb, CURRENT_DATE, gen_random_uuid());" },
    { name: 'finalize_work_order_proposal_atomic', sql: "SELECT public.finalize_work_order_proposal_atomic(gen_random_uuid(), gen_random_uuid(), 'proposals/x/y.pdf', '0000000000000000000000000000000000000000000000000000000000000000', 1024, gen_random_uuid());" },
    { name: 'accept_work_order_proposal_atomic', sql: "SELECT public.accept_work_order_proposal_atomic(gen_random_uuid(), gen_random_uuid(), now(), gen_random_uuid());" },
    { name: 'mark_work_order_proposal_failed_atomic', sql: "SELECT public.mark_work_order_proposal_failed_atomic(gen_random_uuid(), gen_random_uuid(), gen_random_uuid());" }
  ]

  for (const rpc of rpcs) {
    const resAnon = runSql(`SET ROLE anon; ${rpc.sql}`)
    assert(!resAnon.success && resAnon.stderr.includes('permission denied'), `RPC Privilégio: anon EXECUTE em ${rpc.name} é NEGADO`)

    const resAuth = runSql(`SET ROLE authenticated; ${rpc.sql}`)
    assert(!resAuth.success && resAuth.stderr.includes('permission denied'), `RPC Privilégio: authenticated EXECUTE em ${rpc.name} é NEGADO`)

    // Para service_role, chamamos em transação que reverte: o erro NÃO pode ser de 'permission denied for function'
    const resSrv = runSql(`BEGIN; SET ROLE service_role; ${rpc.sql}; ROLLBACK;`)
    assert(!resSrv.stderr.includes('permission denied for function') && !resSrv.stderr.includes('permission denied for schema'), `RPC Privilégio: service_role EXECUTE em ${rpc.name} está CONCEDIDO`)
  }
}

export function runImmutabilityAndTriggerMatrixTests(readyProposalId, reservedProposalId, failedProposalId) {
  console.log('\n[4/7] Executando Matriz de Imutabilidade e Triggers em Runtime...')

  // 1. Hard Delete nos 3 estados (reserved, failed, ready)
  const delReserved = runSql(`
    DO $$ BEGIN
      -- bypass de RLS via superuser para testar trigger de integridade
      DELETE FROM public.work_order_proposals WHERE id = '${reservedProposalId}';
    END $$;
  `)
  assert(!delReserved.success && delReserved.stderr.includes('DELETE_FORBIDDEN'), 'Hard Delete: DELETE em proposta RESERVED é BLOQUEADO por trigger')

  const delFailed = runSql(`
    DO $$ BEGIN
      DELETE FROM public.work_order_proposals WHERE id = '${failedProposalId}';
    END $$;
  `)
  assert(!delFailed.success && delFailed.stderr.includes('DELETE_FORBIDDEN'), 'Hard Delete: DELETE em proposta FAILED é BLOQUEADO por trigger')

  const delReady = runSql(`
    DO $$ BEGIN
      DELETE FROM public.work_order_proposals WHERE id = '${readyProposalId}';
    END $$;
  `)
  assert(!delReady.success && delReady.stderr.includes('DELETE_FORBIDDEN'), 'Hard Delete: DELETE em proposta READY é BLOQUEADO por trigger')

  // 2. Matriz de Imutabilidade Completa (14 campos)
  const immutableFields = [
    { field: 'company_snapshot', val: "'{\"trade_name\": \"Alterado\"}'::jsonb" },
    { field: 'client_snapshot', val: "'{\"nome\": \"Alterado\"}'::jsonb" },
    { field: 'address_snapshot', val: "'{\"logradouro\": \"Alterado\"}'::jsonb" },
    { field: 'items_snapshot', val: "'[]'::jsonb" },
    { field: 'totals_snapshot', val: "'{\"valor_total\": 0}'::jsonb" },
    { field: 'commercial_terms', val: "'{\"condicoes_pagamento\": \"Alterado\"}'::jsonb" },
    { field: 'pdf_storage_key', val: "'proposals/mutated/path.pdf'" },
    { field: 'pdf_sha256', val: "'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'" },
    { field: 'pdf_size_bytes', val: '999999' },
    { field: 'reservation_expires_at', val: 'now()' },
    { field: 'issued_at', val: 'now() + interval \'1 day\'' },
    { field: 'valid_until', val: 'CURRENT_DATE + 30' },
    { field: 'issued_by', val: 'gen_random_uuid()' },
    { field: 'version_number', val: '99' }
  ]

  for (const item of immutableFields) {
    const resMut = runSql(`UPDATE public.work_order_proposals SET ${item.field} = ${item.val} WHERE id = '${readyProposalId}';`)
    assert(!resMut.success && resMut.stderr.includes('MUTATION_BLOCKED'), `Imutabilidade: Mutação de ${item.field} em proposta ready é BLOQUEADA`)
  }

  // 3. Acceptance Metadata Origin Trigger Tests (Cenários A, B, C)
  // 3. Acceptance Metadata Origin Trigger Tests (Cenários A, B, C)
  const validCompany = '\'{"trade_name": "AD Telas", "cnpj": "12345678000190"}\'::jsonb'
  const validClient = '\'{"nome": "Cliente Ficticio", "telefone_principal": "11999990000"}\'::jsonb'
  const validItems = '\'[{"categoria_operacional": "rede_protecao", "descricao": "Item 1", "quantidade": 1, "preco_unitario": 100, "preco_total": 100}]\'::jsonb'
  const validTotals = '\'{"valor_total": 100, "valor_desconto": 0, "valor_final": 100}\'::jsonb'

  // Cenário A: issued -> superseded com accepted_at/by setados (deve falhar)
  const scnA = runSql(`
    DO $$
    DECLARE
      v_p_id UUID := gen_random_uuid();
      v_wo_id UUID := '55555555-aaaa-5555-aaaa-555555555555';
    BEGIN
      INSERT INTO public.work_orders (id, numero_os, client_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
      VALUES (v_wo_id, 'OS-2026-SCNA', '22222222-2222-2222-2222-222222222222', 'orcamento', false, 100, 0, now()) ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.work_order_proposals (
        id, work_order_id, client_id, version_number, idempotency_key, idempotency_request_sha256,
        company_snapshot, client_snapshot, items_snapshot, totals_snapshot, commercial_terms, valid_until,
        generation_status, status, pdf_storage_key, pdf_sha256, pdf_size_bytes, issued_at, issued_by
      ) VALUES (
        v_p_id, v_wo_id, '22222222-2222-2222-2222-222222222222', 80, 'k_scna', '0000000000000000000000000000000000000000000000000000000000000000',
        ${validCompany}, ${validClient}, ${validItems}, ${validTotals}, '{}'::jsonb, CURRENT_DATE + 5,
        'ready', 'issued', 'proposals/' || v_wo_id || '/' || v_p_id || '.pdf', '0000000000000000000000000000000000000000000000000000000000000000', 1024, now(), '11111111-1111-1111-1111-111111111111'
      );

      -- Tentativa inválida de transicionar para superseded criando accepted_at
      UPDATE public.work_order_proposals SET status = 'superseded', accepted_at = now(), accepted_by = '11111111-1111-1111-1111-111111111111' WHERE id = v_p_id;
    END $$;
  `)
  assert(!scnA.success && scnA.stderr.includes('MUTATION_BLOCKED'), 'Acceptance Trigger: Transição issued -> superseded com accepted_at não-nulo é BLOQUEADA')

  // Cenário B: accepted -> superseded preservando accepted_at/by (deve ser permitido)
  const scnB = runSql(`
    DO $$
    DECLARE
      v_p_id UUID := gen_random_uuid();
      v_wo_id UUID := '55555555-bbbb-5555-bbbb-555555555555';
    BEGIN
      INSERT INTO public.work_orders (id, numero_os, client_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
      VALUES (v_wo_id, 'OS-2026-SCNB', '22222222-2222-2222-2222-222222222222', 'orcamento', false, 100, 0, now()) ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.work_order_proposals (
        id, work_order_id, client_id, version_number, idempotency_key, idempotency_request_sha256,
        company_snapshot, client_snapshot, items_snapshot, totals_snapshot, commercial_terms, valid_until,
        generation_status, status, pdf_storage_key, pdf_sha256, pdf_size_bytes, issued_at, issued_by,
        accepted_at, accepted_by
      ) VALUES (
        v_p_id, v_wo_id, '22222222-2222-2222-2222-222222222222', 81, 'k_scnb', '0000000000000000000000000000000000000000000000000000000000000000',
        ${validCompany}, ${validClient}, ${validItems}, ${validTotals}, '{}'::jsonb, CURRENT_DATE + 5,
        'ready', 'accepted', 'proposals/' || v_wo_id || '/' || v_p_id || '.pdf', '0000000000000000000000000000000000000000000000000000000000000000', 1024, now(), '11111111-1111-1111-1111-111111111111',
        now(), '11111111-1111-1111-1111-111111111111'
      );

      -- Transição válida para superseded mantendo accepted_at e accepted_by idênticos
      UPDATE public.work_order_proposals SET status = 'superseded' WHERE id = v_p_id;
    END $$;
  `)
  assert(scnB.success, 'Acceptance Trigger: Transição accepted -> superseded preservando metadados de aceite é PERMITIDA', scnB.stderr)

  // Cenário C: accepted -> superseded alterando accepted_at/by (deve falhar)
  const scnC = runSql(`
    DO $$
    DECLARE
      v_p_id UUID := gen_random_uuid();
      v_wo_id UUID := '55555555-cccc-5555-cccc-555555555555';
    BEGIN
      INSERT INTO public.work_orders (id, numero_os, client_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
      VALUES (v_wo_id, 'OS-2026-SCNC', '22222222-2222-2222-2222-222222222222', 'orcamento', false, 100, 0, now()) ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.work_order_proposals (
        id, work_order_id, client_id, version_number, idempotency_key, idempotency_request_sha256,
        company_snapshot, client_snapshot, items_snapshot, totals_snapshot, commercial_terms, valid_until,
        generation_status, status, pdf_storage_key, pdf_sha256, pdf_size_bytes, issued_at, issued_by,
        accepted_at, accepted_by
      ) VALUES (
        v_p_id, v_wo_id, '22222222-2222-2222-2222-222222222222', 82, 'k_scnc', '0000000000000000000000000000000000000000000000000000000000000000',
        ${validCompany}, ${validClient}, ${validItems}, ${validTotals}, '{}'::jsonb, CURRENT_DATE + 5,
        'ready', 'accepted', 'proposals/' || v_wo_id || '/' || v_p_id || '.pdf', '0000000000000000000000000000000000000000000000000000000000000000', 1024, now(), '11111111-1111-1111-1111-111111111111',
        now(), '11111111-1111-1111-1111-111111111111'
      );

      -- Tentativa inválida de alterar accepted_by durante superseded
      UPDATE public.work_order_proposals SET status = 'superseded', accepted_by = gen_random_uuid() WHERE id = v_p_id;
    END $$;
  `)
  assert(!scnC.success && scnC.stderr.includes('MUTATION_BLOCKED'), 'Acceptance Trigger: Alteração de metadados de aceite na transição para superseded é BLOQUEADA')
}
