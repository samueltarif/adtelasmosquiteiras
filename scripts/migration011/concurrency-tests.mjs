/**
 * Módulo de Testes de Concorrência Real com Múltiplas Conexões PostgreSQL
 * Arquivo: scripts/migration011/concurrency-tests.mjs
 */

import { assert, runSql, runAsyncSql } from './helpers.mjs'

export async function runConcurrencyTests() {
  console.log('\n[6/7] Executando Testes de Concorrência Real com Duas Conexões Simultâneas...')

  const validSha = 'a'.repeat(64)
  const validUntil = runSql("SELECT (now() AT TIME ZONE 'America/Sao_Paulo' + interval '10 days')::date::text;").stdout
  const actorId = '11111111-1111-1111-1111-111111111111'

  // 1. Cenário A: Mesma chave de idempotência simultânea (Same Idempotency Key)
  const concSameWoId = '77777777-1111-7777-1111-777777777777'
  runSql(`
    INSERT INTO public.work_orders (id, numero_os, client_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
    VALUES ('${concSameWoId}', 'OS-2026-CONCSAME', '22222222-2222-2222-2222-222222222222', 'orcamento', false, 500.00, 0, now()) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, sort_order)
    VALUES (gen_random_uuid(), '${concSameWoId}', 'rede_protecao', 'Item Concorrencia Same', 1, 500.00, 1) ON CONFLICT DO NOTHING;
  `)
  const concSameUpd = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${concSameWoId}';`).stdout

  const [resSame1, resSame2] = await Promise.all([
    runAsyncSql(`SELECT public.reserve_work_order_proposal_atomic('${concSameWoId}', '${concSameUpd}', 'conc_key_SAME', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');`),
    runAsyncSql(`SELECT public.reserve_work_order_proposal_atomic('${concSameWoId}', '${concSameUpd}', 'conc_key_SAME', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');`)
  ])

  const countSame = runSql(`SELECT count(*) FROM public.work_order_proposals WHERE work_order_id = '${concSameWoId}';`).stdout
  const sameProposal1 = JSON.parse(resSame1.stdout || '{}').proposal_id
  const sameProposal2 = JSON.parse(resSame2.stdout || '{}').proposal_id

  assert(resSame1.success && resSame2.success, 'Concorrência: Ambas as conexões com mesma chave retornam com sucesso (CONCURRENT_SAME_IDEMPOTENCY_TEST=PASS)')
  assert(countSame === '1' && sameProposal1 === sameProposal2, 'Concorrência: Duas requisições simultâneas com mesma chave convergem para exatamente 1 registro no banco')

  // 2. Cenário B: Chaves de idempotência diferentes simultâneas (Different Keys)
  const concDiffWoId = '77777777-2222-7777-2222-777777777777'
  runSql(`
    INSERT INTO public.work_orders (id, numero_os, client_id, status_os, is_archived, valor_total, valor_desconto, updated_at)
    VALUES ('${concDiffWoId}', 'OS-2026-CONCDIFF', '22222222-2222-2222-2222-222222222222', 'orcamento', false, 500.00, 0, now()) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, sort_order)
    VALUES (gen_random_uuid(), '${concDiffWoId}', 'rede_protecao', 'Item Concorrencia Diff', 1, 500.00, 1) ON CONFLICT DO NOTHING;
  `)
  const concDiffUpd = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${concDiffWoId}';`).stdout

  const [resDiff1, resDiff2] = await Promise.all([
    runAsyncSql(`SELECT public.reserve_work_order_proposal_atomic('${concDiffWoId}', '${concDiffUpd}', 'conc_key_DIFF_A', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');`),
    runAsyncSql(`SELECT public.reserve_work_order_proposal_atomic('${concDiffWoId}', '${concDiffUpd}', 'conc_key_DIFF_B', '${validSha}', '{}'::jsonb, '${validUntil}', '${actorId}');`)
  ])

  const successCount = (resDiff1.success ? 1 : 0) + (resDiff2.success ? 1 : 0)
  const errorMsg = resDiff1.success ? resDiff2.stderr : resDiff1.stderr
  const countReserved = runSql(`SELECT count(*) FROM public.work_order_proposals WHERE work_order_id = '${concDiffWoId}' AND generation_status = 'reserved';`).stdout

  assert(successCount === 1, 'Concorrência: Exatamente 1 conexão obtém reserva quando chaves de idempotência diferem (CONCURRENT_DIFFERENT_IDEMPOTENCY_TEST=PASS)')
  assert(errorMsg.includes('ERR_PROPOSAL_ISSUE_IN_PROGRESS') || errorMsg.includes('could not serialize access'), 'Concorrência: Conexão concorrente perdedora é bloqueada com segurança por status de voo ou lock')
  assert(countReserved === '1', 'Concorrência: Nunca existem 2 propostas reservadas simultaneamente para a mesma OS')
}
