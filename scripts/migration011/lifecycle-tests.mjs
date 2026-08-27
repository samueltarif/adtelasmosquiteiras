/**
 * Módulo de Testes do Ciclo de Vida Comercial, Parâmetros e Transições Atômicas
 * Arquivo: scripts/migration011/lifecycle-tests.mjs
 */

import { assert, runSql, TEST_DB } from './helpers.mjs'

export function runPreflightAndRollbackTests(migrationSql) {
  console.log('\n[3.5/7] Executando Provas de Drift no Preflight e Rollback Atômico...')

  // 1. Preflight Constraint Drift
  const driftTestSql = `
    BEGIN;
    ALTER TABLE public.crm_activity_log DROP CONSTRAINT chk_activity_log_entity;
    ALTER TABLE public.crm_activity_log ADD CONSTRAINT chk_activity_log_entity CHECK (entity_type IN ('client', 'drift_invalido'));
    ${migrationSql}
    ROLLBACK;
  `
  const driftRes = runSql(driftTestSql)
  assert(!driftRes.success && driftRes.stderr.includes('CRM_ACTIVITY_CONSTRAINT_DRIFT'), 'Preflight: Aborta com CRM_ACTIVITY_CONSTRAINT_DRIFT quando allowlist diverge')

  // Prova que 0 objetos da 011 foram criados após aborto do drift
  const checkTableDrift = runSql("SELECT to_regclass('public.work_order_proposals')::text;")
  assert(checkTableDrift.stdout === '', 'Preflight: Após falha de preflight, public.work_order_proposals NÃO existe')

  // 2. Global Rollback Proof Completo
  const rollbackSql = `
    BEGIN;
    ${migrationSql.replace('COMMIT;', 'RAISE EXCEPTION \'TEST_FORCED_ROLLBACK\'; COMMIT;')}
  `
  const rbRes = runSql(rollbackSql)
  assert(!rbRes.success && rbRes.stderr.includes('TEST_FORCED_ROLLBACK'), 'Rollback: Erro forçado antes do COMMIT provoca rollback completo')

  const checkTableRollback = runSql("SELECT to_regclass('public.work_order_proposals')::text;")
  assert(checkTableRollback.stdout === '', 'Rollback: public.work_order_proposals NÃO existe após rollback')

  const checkColRollback = runSql("SELECT count(*) FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'accepted_proposal_id';")
  assert(checkColRollback.stdout === '0', 'Rollback: work_orders.accepted_proposal_id NÃO existe após rollback')

  const checkProcRollback = runSql(`
    SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace 
    WHERE n.nspname = 'public' AND p.proname IN (
      'reserve_work_order_proposal_atomic', 'finalize_work_order_proposal_atomic',
      'accept_work_order_proposal_atomic', 'mark_work_order_proposal_failed_atomic',
      'fn_prevent_proposal_content_mutation', 'fn_prevent_proposal_delete'
    );
  `)
  assert(checkProcRollback.stdout === '0', 'Rollback: Zero RPCs ou funções da Migration 011 existem após rollback')

  // 3. Primeira Execução Real da Migration 011
  const startExec = Date.now()
  const execResult = runSql(migrationSql)
  const execDurationMs = Date.now() - startExec
  assert(execResult.success, `Execução: Migration 011 executada e commitada com sucesso (${execDurationMs}ms)`, execResult.stderr)

  // 4. Segunda Execução Fail-Fast
  const secondRunRes = runSql(migrationSql)
  assert(!secondRunRes.success && secondRunRes.stderr.includes('PREFLIGHT_FAILED'), 'Execução: Segunda execução falha no preflight por detecção de idempotência/drift')

  return execDurationMs
}

export function setupFixturesAndCompanyTests() {
  console.log('\n[4/7] Configurando Fixtures e Testando Proteção de Company Profile...')

  const fixtureSql = `
    DO $$
    DECLARE
      v_admin_id UUID := '11111111-1111-1111-1111-111111111111';
      v_client_id UUID := '22222222-2222-2222-2222-222222222222';
      v_addr_id UUID := '33333333-3333-3333-3333-333333333333';
      v_wo_id UUID := '44444444-4444-4444-4444-444444444444';
      v_item_id UUID := '55555555-5555-5555-5555-555555555555';
    BEGIN
      INSERT INTO auth.users (id, email) VALUES (v_admin_id, 'admin_local_test@adt.local') ON CONFLICT (id) DO NOTHING;
      IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_admin_id) THEN
        INSERT INTO public.admin_users (user_id, email, is_active) VALUES (v_admin_id, 'admin_local_test@adt.local', true);
      ELSE
        UPDATE public.admin_users SET is_active = true WHERE user_id = v_admin_id;
      END IF;

      INSERT INTO public.clients (id, tipo_cliente, nome, telefone_principal, email)
      VALUES (v_client_id, 'pessoa_fisica', 'Cliente Teste Ficticio', '11999990000', 'teste@adt.local')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.client_addresses (id, client_id, rotulo, cep, logradouro, numero, bairro, cidade, uf)
      VALUES (v_addr_id, v_client_id, 'Principal', '01310100', 'Av Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
      VALUES (v_wo_id, 'OS-2026-999001', v_client_id, v_addr_id, 'orcamento', false, 1000.00, 100.00, now())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, sort_order)
      VALUES (v_item_id, v_wo_id, 'rede_protecao', 'Rede de Proteção Janela', 2, 500.00, 1)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.work_order_measurements (id, work_order_item_id, ambiente, tipo_vao, largura_mm, altura_mm, quantidade, cor_estrutura, tipo_material, sort_order)
      VALUES (gen_random_uuid(), v_item_id, 'Quarto 1', 'janela', 1200, 1000, 2, 'branco', 'polietileno', 1)
      ON CONFLICT (id) DO NOTHING;
    END $$;
  `
  const fixRes = runSql(fixtureSql)
  assert(fixRes.success, 'Fixtures: Dados fictícios de teste inseridos com sucesso', fixRes.stderr)

  // Teste de Company Profile Ausente (id=1)
  const missingCompanyTest = runSql(`
    DO $$
    DECLARE
      v_err_msg TEXT := '';
    BEGIN
      DELETE FROM public.company_profile WHERE id = 1;
      BEGIN
        PERFORM public.reserve_work_order_proposal_atomic(
          '44444444-4444-4444-4444-444444444444',
          (SELECT updated_at FROM public.work_orders WHERE id = '44444444-4444-4444-4444-444444444444'),
          'k_test_comp',
          '0000000000000000000000000000000000000000000000000000000000000000',
          '{}'::jsonb,
          CURRENT_DATE + 5,
          '11111111-1111-1111-1111-111111111111'
        );
      EXCEPTION WHEN OTHERS THEN
        v_err_msg := SQLERRM;
      END;

      -- Restaura company_profile id=1
      INSERT INTO public.company_profile (
        id, trade_name, legal_name, cnpj, phone_display, whatsapp_number, email_contact,
        website, cep, street, number, complement, neighborhood, city, state, document_footer_text,
        logo_source, logo_path, logo_storage_key
      ) VALUES (
        1, 'AD Telas e Redes', 'AD Telas e Redes de Proteção Ltda', '12345678000190',
        '(11) 99999-0000', '5511999990000', 'contato@adtelas.com.br', 'https://adtelas.com.br',
        '01310100', 'Av Paulista', '1000', 'Conj 10', 'Bela Vista', 'São Paulo', 'SP',
        'Orçamento comercial válido por 10 dias.', 'static', '/images/logo_adt_telas_nova.png', NULL
      );

      IF v_err_msg !~ 'ERR_COMPANY_PROFILE_MISSING' THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected ERR_COMPANY_PROFILE_MISSING, got %', v_err_msg;
      END IF;
    END $$;
  `)
  assert(missingCompanyTest.success, 'Company Profile: Ausência de registro id=1 falha fechado com ERR_COMPANY_PROFILE_MISSING', missingCompanyTest.stderr)
}

export function runCommercialTermsAndParametersMatrix() {
  console.log('\n[4.5/7] Executando Matrizes de Parâmetros (Terms, Valid Until, SHA, Storage Key)...')

  const validSha = 'a'.repeat(64)
  const validUntil = runSql("SELECT (now() AT TIME ZONE 'America/Sao_Paulo' + interval '10 days')::date::text;").stdout
  const woId = '44444444-4444-4444-4444-444444444444'
  const actorId = '11111111-1111-1111-1111-111111111111'

  // 1. Matriz de Termos Comerciais
  const termsMatrix = [
    { label: 'Termos vazios {}', payload: '{}', pass: true },
    { label: 'condicoes_pagamento válido', payload: '{"condicoes_pagamento": "50% entrada, 50% conclusao"}', pass: true },
    { label: 'condicoes_pagamento > 500 caracteres', payload: `{"condicoes_pagamento": "${'x'.repeat(501)}"}`, pass: false, err: 'ERR_COMMERCIAL_TEXT_TOO_LONG' },
    { label: 'observacoes_proposta válido', payload: '{"observacoes_proposta": "Instalação com andaime"}', pass: true },
    { label: 'observacoes_proposta > 2000 caracteres', payload: `{"observacoes_proposta": "${'x'.repeat(2001)}"}`, pass: false, err: 'ERR_COMMERCIAL_TEXT_TOO_LONG' },
    { label: 'prazo_instalacao_dias = 1', payload: '{"prazo_instalacao_dias": 1}', pass: true },
    { label: 'prazo_instalacao_dias = 365', payload: '{"prazo_instalacao_dias": 365}', pass: true },
    { label: 'prazo_instalacao_dias = 0', payload: '{"prazo_instalacao_dias": 0}', pass: false, err: 'ERR_INVALID_PRAZO_RANGE' },
    { label: 'prazo_instalacao_dias = 366', payload: '{"prazo_instalacao_dias": 366}', pass: false, err: 'ERR_INVALID_PRAZO_RANGE' },
    { label: 'prazo_instalacao_dias = 1.5', payload: '{"prazo_instalacao_dias": 1.5}', pass: false, err: 'ERR_INVALID_PRAZO_RANGE' },
    { label: 'incluir_medicoes = true', payload: '{"incluir_medicoes": true}', pass: true },
    { label: 'incluir_medicoes = false', payload: '{"incluir_medicoes": false}', pass: true },
    { label: 'incluir_medicoes = "true" (string)', payload: '{"incluir_medicoes": "true"}', pass: false, err: 'ERR_INVALID_COMMERCIAL_TERMS_TYPE' },
    { label: 'chave desconhecida', payload: '{"chave_desconhecida": 123}', pass: false, err: 'ERR_UNKNOWN_COMMERCIAL_KEYS' }
  ]

  for (const item of termsMatrix) {
    const res = runSql(`
      BEGIN;
      SELECT public.reserve_work_order_proposal_atomic(
        '${woId}', (SELECT updated_at FROM public.work_orders WHERE id = '${woId}'),
        'k_terms_${Math.random()}', '${validSha}', '${item.payload}'::jsonb, '${validUntil}', '${actorId}'
      );
      ROLLBACK;
    `)
    if (item.pass) {
      assert(res.success, `Commercial Terms: ${item.label} é ACEITO`, res.stderr)
    } else {
      assert(!res.success && res.stderr.includes(item.err), `Commercial Terms: ${item.label} é REJEITADO com ${item.err}`)
    }
  }

  // 2. Matriz de Data de Validade (Valid Until)
  const validUntilMatrix = [
    { label: 'Hoje SP', sql: "(now() AT TIME ZONE 'America/Sao_Paulo')::date", pass: true },
    { label: 'Futuro (+5 dias)', sql: "(now() AT TIME ZONE 'America/Sao_Paulo' + interval '5 days')::date", pass: true },
    { label: 'Ontem SP (-1 dia)', sql: "(now() AT TIME ZONE 'America/Sao_Paulo' - interval '1 day')::date", pass: false, err: 'ERR_VALID_UNTIL_IN_PAST' }
  ]

  for (const item of validUntilMatrix) {
    const res = runSql(`
      BEGIN;
      SELECT public.reserve_work_order_proposal_atomic(
        '${woId}', (SELECT updated_at FROM public.work_orders WHERE id = '${woId}'),
        'k_vu_${Math.random()}', '${validSha}', '{}'::jsonb, ${item.sql}, '${actorId}'
      );
      ROLLBACK;
    `)
    if (item.pass) {
      assert(res.success, `Valid Until: ${item.label} é ACEITO`, res.stderr)
    } else {
      assert(!res.success && res.stderr.includes(item.err), `Valid Until: ${item.label} é REJEITADO com ${item.err}`)
    }
  }

  // 3. Matriz de Expected Updated At
  // Reserve: NULL, Stale, Current
  const woCurrentUpd = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${woId}';`).stdout
  const resNullUpd = runSql(`SELECT public.reserve_work_order_proposal_atomic('${woId}', NULL, 'k_exp_null', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');`)
  assert(!resNullUpd.success && resNullUpd.stderr.includes('ERR_EXPECTED_UPDATED_AT_REQUIRED'), 'Expected Updated At: Reserve com NULL falha com ERR_EXPECTED_UPDATED_AT_REQUIRED')

  const resStaleUpd = runSql(`SELECT public.reserve_work_order_proposal_atomic('${woId}', now() - interval '10 minutes', 'k_exp_stale', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');`)
  assert(!resStaleUpd.success && resStaleUpd.stderr.includes('ERR_CONCURRENCY_CONFLICT'), 'Expected Updated At: Reserve com timestamp desatualizado falha com ERR_CONCURRENCY_CONFLICT')

  const resCurrUpd = runSql(`
    BEGIN;
    SELECT public.reserve_work_order_proposal_atomic('${woId}', '${woCurrentUpd}', 'k_exp_curr', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');
    ROLLBACK;
  `)
  assert(resCurrUpd.success, 'Expected Updated At: Reserve com timestamp atual é ACEITO')

  // 4. Address Fail-Closed e Bloqueio de Inconsistência
  const clientBId = '66666666-6666-6666-6666-666666666666'
  const addrBId = '66666666-aaaa-bbbb-cccc-666666666666'
  runSql(`
    INSERT INTO public.clients (id, tipo_cliente, nome, telefone_principal, email)
    VALUES ('${clientBId}', 'pessoa_fisica', 'Cliente B Teste', '11988887777', 'clientb@adt.local') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.client_addresses (id, client_id, rotulo, cep, logradouro, numero, bairro, cidade, uf)
    VALUES ('${addrBId}', '${clientBId}', 'Addr B', '01310100', 'Rua B', '200', 'Bairro B', 'São Paulo', 'SP') ON CONFLICT (id) DO NOTHING;
  `)

  // Tentativa de vincular endereço do Cliente B na OS do Cliente A
  const addrInconsistencyAttempt = runSql(`
    UPDATE public.work_orders SET address_id = '${addrBId}' WHERE id = '${woId}';
  `)
  assert(!addrInconsistencyAttempt.success && addrInconsistencyAttempt.stderr.includes('fk_work_orders_client_address'), 'Address Fail-Closed: Bloqueio de inconsistência de endereço via constraint fk_work_orders_client_address (ADDRESS_INCONSISTENCY_ALREADY_BLOCKED_BY_EXISTING_DB_CONSTRAINT=YES)')

  // 5. OS sem Endereço
  const noAddrWoId = '88888888-8888-8888-8888-888888888888'
  runSql(`
    INSERT INTO public.work_orders (id, numero_os, client_id, address_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
    VALUES ('${noAddrWoId}', 'OS-2026-NOADDR', '22222222-2222-2222-2222-222222222222', NULL, 'orcamento', false, 300.00, 0, now()) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, sort_order)
    VALUES (gen_random_uuid(), '${noAddrWoId}', 'tela_mosquiteira', 'Tela Sem Endereço', 1, 300.00, 1) ON CONFLICT DO NOTHING;
  `)
  const noAddrRes = runSql(`
    SELECT public.reserve_work_order_proposal_atomic(
      '${noAddrWoId}', (SELECT updated_at FROM public.work_orders WHERE id = '${noAddrWoId}'),
      'k_no_addr_test', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}'
    );
  `)
  assert(noAddrRes.success && JSON.parse(noAddrRes.stdout).address_snapshot === null, 'Address Fail-Closed: OS sem endereço reserva com address_snapshot=NULL')
}
