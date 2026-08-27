/**
 * Módulo de Testes de Fluxo Completo de Propostas (Reserva, Finalização, Aceite, Falhas e Reconciliação)
 * Arquivo: scripts/migration011/proposal-flow-tests.mjs
 */

import { assert, runSql } from './helpers.mjs'

export function runProposalFlowTests() {
  console.log('\n[5/7] Executando Fluxo de Proposta (Reserva, PDF, Finalize, Aceite, Falha, Lease)...')

  const validSha = 'a'.repeat(64)
  const validUntil = runSql("SELECT (now() AT TIME ZONE 'America/Sao_Paulo' + interval '10 days')::date::text;").stdout
  const woId = '44444444-4444-4444-4444-444444444444'
  const actorId = '11111111-1111-1111-1111-111111111111'
  const woUpdatedAt = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${woId}';`).stdout

  // 1. Reserva Básica e Snapshots
  const reserveSql = `
    SELECT public.reserve_work_order_proposal_atomic(
      '${woId}',
      '${woUpdatedAt}',
      'key_flow_001',
      '${validSha}',
      '{"condicoes_pagamento": "50% entrada", "prazo_instalacao_dias": 5, "incluir_medicoes": true, "observacoes_proposta": "Instalação padrão"}'::jsonb,
      '${validUntil}',
      '${actorId}'
    );
  `
  const reserveRes = runSql(reserveSql)
  assert(reserveRes.success, 'Reserva: Reserva básica criada com sucesso', reserveRes.stderr)
  const reserveJson = JSON.parse(reserveRes.stdout)
  const proposalId = reserveJson.proposal_id

  assert(reserveJson.generation_status === 'reserved' && reserveJson.status === null, 'Reserva: generation_status=reserved e status comercial=NULL')
  assert(reserveJson.version_number === 1, 'Reserva: version_number=1 alocado')
  const issuedByDb = runSql(`SELECT issued_by FROM public.work_order_proposals WHERE id = '${proposalId}';`).stdout
  assert(issuedByDb === '', 'Reserva: issued_by permanece NULL na reserva técnica')
  assert(reserveJson.company_snapshot.trade_name && reserveJson.client_snapshot.nome, 'Reserva: Snapshots de empresa e cliente capturados')
  assert(!reserveJson.items_snapshot[0].observacoes, 'Reserva: Observações internas de itens omitidas do snapshot')

  // 2. Snapshot MVCC Isolation
  runSql(`UPDATE public.work_order_items SET descricao = 'Item Modificado Apos Reserva' WHERE work_order_id = '${woId}';`)
  const snapshotCheck = runSql(`SELECT items_snapshot->0->>'descricao' FROM public.work_order_proposals WHERE id = '${proposalId}';`).stdout
  assert(snapshotCheck === 'Rede de Proteção Janela', 'Snapshots: Isolamento MVCC comprovado (snapshot não sofre mutação após update em itens)')

  // 3. Matriz de Validação de SHA-256 do PDF
  const storageKey = `proposals/${woId}/${proposalId}.pdf`
  const pdfSize = 1048576

  const shaMatrix = [
    { label: '63 caracteres', sha: 'a'.repeat(63), pass: false },
    { label: '65 caracteres', sha: 'a'.repeat(65), pass: false },
    { label: 'Maiúsculas (uppercase)', sha: 'A'.repeat(64), pass: false },
    { label: 'Não-hex (caracteres inválidos)', sha: 'g'.repeat(64), pass: false },
    { label: '64 hex minúsculo válido', sha: 'c'.repeat(64), pass: true }
  ]

  for (const item of shaMatrix) {
    const res = runSql(`
      BEGIN;
      SELECT public.finalize_work_order_proposal_atomic(
        '${proposalId}', '${woId}', '${storageKey}', '${item.sha}', ${pdfSize}, '${actorId}'
      );
      ROLLBACK;
    `)
    if (item.pass) {
      assert(res.success, `PDF SHA Matrix: ${item.label} é ACEITO`, res.stderr)
    } else {
      assert(!res.success && res.stderr.includes('ERR_INVALID_SHA256'), `PDF SHA Matrix: ${item.label} é REJEITADO com ERR_INVALID_SHA256`)
    }
  }

  // 4. Matriz de Validação de Storage Key
  const storageKeyMatrix = [
    { label: 'Path canônico válido', key: `proposals/${woId}/${proposalId}.pdf`, pass: true },
    { label: 'Work order divergente no path', key: `proposals/00000000-0000-0000-0000-000000000000/${proposalId}.pdf`, pass: false },
    { label: 'Proposal ID divergente no path', key: `proposals/${woId}/00000000-0000-0000-0000-000000000000.pdf`, pass: false },
    { label: 'Prefixo errado (sem proposals/)', key: `uploads/${woId}/${proposalId}.pdf`, pass: false },
    { label: 'Extensão errada (.doc)', key: `proposals/${woId}/${proposalId}.doc`, pass: false },
    { label: 'Path traversal (../)', key: `proposals/${woId}/../${proposalId}.pdf`, pass: false }
  ]

  for (const item of storageKeyMatrix) {
    const res = runSql(`
      BEGIN;
      SELECT public.finalize_work_order_proposal_atomic(
        '${proposalId}', '${woId}', '${item.key}', '${'c'.repeat(64)}', ${pdfSize}, '${actorId}'
      );
      ROLLBACK;
    `)
    if (item.pass) {
      assert(res.success, `Storage Key Matrix: ${item.label} é ACEITO`, res.stderr)
    } else {
      assert(!res.success && res.stderr.includes('ERR_INVALID_STORAGE_KEY'), `Storage Key Matrix: ${item.label} é REJEITADO com ERR_INVALID_STORAGE_KEY`)
    }
  }

  // 5. Finalização Válida (Happy Path)
  const finalizeSql = `
    SELECT public.finalize_work_order_proposal_atomic(
      '${proposalId}',
      '${woId}',
      '${storageKey}',
      '${'c'.repeat(64)}',
      ${pdfSize},
      '${actorId}'
    );
  `
  const finalizeRes = runSql(finalizeSql)
  assert(finalizeRes.success, 'Finalize: Proposta finalizada com sucesso (issued)', finalizeRes.stderr)
  const finalizeJson = JSON.parse(finalizeRes.stdout)
  assert(finalizeJson.status === 'issued' && finalizeJson.issued_by === actorId, 'Finalize: issued_by gravado com autoridade do banco')

  // 6. Replays de Finalização (Idêntico e Divergente)
  const identicalReplay = runSql(finalizeSql)
  assert(identicalReplay.success && JSON.parse(identicalReplay.stdout).is_idempotent_replay === true, 'Finalize: Replay idêntico é idempotent success (FINALIZE_IDENTICAL_REPLAY_TEST=PASS)')

  const divergentReplay = runSql(`
    SELECT public.finalize_work_order_proposal_atomic(
      '${proposalId}', '${woId}', '${storageKey}', '${'d'.repeat(64)}', ${pdfSize}, '${actorId}'
    );
  `)
  assert(!divergentReplay.success && divergentReplay.stderr.includes('ERR_FINALIZE_REPLAY_METADATA_MISMATCH'), 'Finalize: Replay divergente é rejeitado com ERR_FINALIZE_REPLAY_METADATA_MISMATCH')

  // 7. Aceite de Proposta (accept_work_order_proposal_atomic)
  // Concorrência otimista no aceite
  const acceptNullUpd = runSql(`SELECT public.accept_work_order_proposal_atomic('${woId}', '${proposalId}', NULL, '${actorId}');`)
  assert(!acceptNullUpd.success && acceptNullUpd.stderr.includes('ERR_EXPECTED_UPDATED_AT_REQUIRED'), 'Accept: expected_updated_at=NULL falha com ERR_EXPECTED_UPDATED_AT_REQUIRED')

  const acceptStaleUpd = runSql(`SELECT public.accept_work_order_proposal_atomic('${woId}', '${proposalId}', now() - interval '10 minutes', '${actorId}');`)
  assert(!acceptStaleUpd.success && acceptStaleUpd.stderr.includes('ERR_CONCURRENCY_CONFLICT'), 'Accept: expected_updated_at desatualizado falha com ERR_CONCURRENCY_CONFLICT')

  const woUpdatedBeforeAccept = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${woId}';`).stdout
  const acceptSql = `
    SELECT public.accept_work_order_proposal_atomic(
      '${woId}',
      '${proposalId}',
      '${woUpdatedBeforeAccept}',
      '${actorId}'
    );
  `
  const acceptRes = runSql(acceptSql)
  assert(acceptRes.success, 'Accept: Proposta aceita e OS transicionada para aprovada com sucesso', acceptRes.stderr)
  const acceptJson = JSON.parse(acceptRes.stdout)
  const woCheck = runSql(`SELECT accepted_proposal_id FROM public.work_orders WHERE id = '${woId}';`).stdout
  assert(acceptJson.status_os === 'aprovada' && woCheck === proposalId, 'Accept: work_orders.accepted_proposal_id vinculado corretamente')

  // Replay da reserva original após aceite (OS aprovada)
  const replayAfterAccept = runSql(reserveSql)
  assert(replayAfterAccept.success && JSON.parse(replayAfterAccept.stdout).proposal_id === proposalId, 'Replay: Replay da reserva original após aceite retorna a MESMA proposta aceita')

  // Nova proposta sobre OS aprovada
  const newProposalApprovedWo = runSql(`
    SELECT public.reserve_work_order_proposal_atomic(
      '${woId}', (SELECT updated_at FROM public.work_orders WHERE id = '${woId}'),
      'k_new_on_appr', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}'
    );
  `)
  assert(!newProposalApprovedWo.success && newProposalApprovedWo.stderr.includes('ERR_INVALID_STATUS'), 'Status Gate: Nova proposta sobre OS aprovada é bloqueada com ERR_INVALID_STATUS')

  // Finalize Replay Após Acceptance (Cenário Exploratório)
  const finalizeAfterAccept = runSql(finalizeSql)
  let finalizeAfterAcceptStatus = 'UNKNOWN'
  if (finalizeAfterAccept.success) {
    finalizeAfterAcceptStatus = 'PASS_IDEMPOTENT'
  } else if (finalizeAfterAccept.stderr.includes('ERR_INVALID_STATUS')) {
    finalizeAfterAcceptStatus = 'BLOCKED_BY_WO_STATUS_GATE'
  } else {
    finalizeAfterAcceptStatus = finalizeAfterAccept.stderr
  }
  assert(finalizeAfterAcceptStatus === 'BLOCKED_BY_WO_STATUS_GATE', `Exploratório: Replay de finalize após aceite registrado como ${finalizeAfterAcceptStatus}`)

  // 8. Testes de Mark Failed, Retry e Lease Expirada
  const leaseWoId = '99999999-9999-9999-9999-999999999999'
  runSql(`
    INSERT INTO public.work_orders (id, numero_os, client_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
    VALUES ('${leaseWoId}', 'OS-2026-LEASE1', '22222222-2222-2222-2222-222222222222', 'orcamento', false, 500.00, 0, now()) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, sort_order)
    VALUES (gen_random_uuid(), '${leaseWoId}', 'rede_protecao', 'Item Lease', 1, 500.00, 1) ON CONFLICT DO NOTHING;
  `)
  const leaseUpdatedAt = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${leaseWoId}';`).stdout
  const leaseReserveRes = runSql(`
    SELECT public.reserve_work_order_proposal_atomic(
      '${leaseWoId}', '${leaseUpdatedAt}', 'k_lease_001', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}'
    );
  `)
  const leaseProposalId = JSON.parse(leaseReserveRes.stdout).proposal_id

  // Mark Failed em proposta ready (deve falhar)
  const failReady = runSql(`SELECT public.mark_work_order_proposal_failed_atomic('${proposalId}', '${woId}', '${actorId}');`)
  assert(!failReady.success && failReady.stderr.includes('ERR_CANNOT_FAIL_READY_PROPOSAL'), 'Mark Failed: Proposta ready não pode ser marcada como failed (MARK_FAILED_READY_REJECTION_TEST=PASS)')

  // Mark Failed em proposta reserved (deve passar)
  const markFailRes = runSql(`SELECT public.mark_work_order_proposal_failed_atomic('${leaseProposalId}', '${leaseWoId}', '${actorId}');`)
  assert(markFailRes.success && JSON.parse(markFailRes.stdout).generation_status === 'failed', 'Mark Failed: Proposta reserved transiciona para failed (MARK_FAILED_RESERVED_TEST=PASS)')

  // Mark Failed replay em proposta failed
  const failReplay = runSql(`SELECT public.mark_work_order_proposal_failed_atomic('${leaseProposalId}', '${leaseWoId}', '${actorId}');`)
  assert(failReplay.success && JSON.parse(failReplay.stdout).generation_status === 'failed', 'Mark Failed: Replay de mark_failed em proposta failed é idempotente (MARK_FAILED_FAILED_REPLAY_TEST=PASS)')

  // Retry em proposta failed com mesma chave/hash
  const retryReserve = runSql(`
    SELECT public.reserve_work_order_proposal_atomic(
      '${leaseWoId}', (SELECT updated_at FROM public.work_orders WHERE id = '${leaseWoId}'),
      'k_lease_001', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}'
    );
  `)
  assert(retryReserve.success && JSON.parse(retryReserve.stdout).generation_status === 'reserved', 'Failed Retry: Retry de proposta failed reativa reserva com novo lease a partir de clock_timestamp()')

  // Lease Expirada e Reconciliação
  runSql(`UPDATE public.work_order_proposals SET reservation_expires_at = now() - interval '1 minute' WHERE id = '${leaseProposalId}';`)
  const expiredReplay = runSql(`
    SELECT public.reserve_work_order_proposal_atomic(
      '${leaseWoId}', (SELECT updated_at FROM public.work_orders WHERE id = '${leaseWoId}'),
      'k_lease_001', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}'
    );
  `)
  assert(expiredReplay.success && JSON.parse(expiredReplay.stdout).reconciliation_required === true, 'Lease Expirada: Replay retorna reconciliation_required=true sem auto-fail silencioso')

  const newKeyExpiredLease = runSql(`
    SELECT public.reserve_work_order_proposal_atomic(
      '${leaseWoId}', (SELECT updated_at FROM public.work_orders WHERE id = '${leaseWoId}'),
      'k_lease_new_key', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}'
    );
  `)
  assert(!newKeyExpiredLease.success && newKeyExpiredLease.stderr.includes('ERR_PROPOSAL_RESERVATION_RECONCILIATION_REQUIRED'), 'Lease Expirada: Nova tentativa concorrente exige reconciliação com ERR_PROPOSAL_RESERVATION_RECONCILIATION_REQUIRED')

  // Criação de fixtures isoladas para matriz de Hard Delete
  const delTestWoId = '33333333-dddd-4444-dddd-333333333333'
  runSql(`
    INSERT INTO public.work_orders (id, numero_os, client_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
    VALUES ('${delTestWoId}', 'OS-2026-DELTEST', '22222222-2222-2222-2222-222222222222', 'orcamento', false, 500.00, 0, now()) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, sort_order)
    VALUES (gen_random_uuid(), '${delTestWoId}', 'rede_protecao', 'Item Del Test', 1, 500.00, 1) ON CONFLICT DO NOTHING;
  `)
  const delWoUpd = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${delTestWoId}';`).stdout
  const resReservedForDel = runSql(`
    SELECT public.reserve_work_order_proposal_atomic('${delTestWoId}', '${delWoUpd}', 'k_del_res', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');
  `)
  const reservedForDelId = JSON.parse(resReservedForDel.stdout).proposal_id

  const delTestWoId2 = '33333333-eeee-4444-eeee-333333333333'
  runSql(`
    INSERT INTO public.work_orders (id, numero_os, client_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
    VALUES ('${delTestWoId2}', 'OS-2026-DELFAIL', '22222222-2222-2222-2222-222222222222', 'orcamento', false, 500.00, 0, now()) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, sort_order)
    VALUES (gen_random_uuid(), '${delTestWoId2}', 'rede_protecao', 'Item Del Fail', 1, 500.00, 1) ON CONFLICT DO NOTHING;
  `)
  const delWoUpd2 = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${delTestWoId2}';`).stdout
  const resFailedForDel = runSql(`
    SELECT public.reserve_work_order_proposal_atomic('${delTestWoId2}', '${delWoUpd2}', 'k_del_fail', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');
  `)
  const failedForDelId = JSON.parse(resFailedForDel.stdout).proposal_id
  runSql(`SELECT public.mark_work_order_proposal_failed_atomic('${failedForDelId}', '${delTestWoId2}', '${actorId}');`)

  return {
    readyProposalId: proposalId,
    reservedProposalId: reservedForDelId,
    failedProposalId: failedForDelId,
    finalizeAfterAcceptStatus
  }
}
