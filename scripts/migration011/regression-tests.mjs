/**
 * Módulo de Testes de Regressão de Activity Log, Versionamento e Minimização de Dados
 * Arquivo: scripts/migration011/regression-tests.mjs
 */

import { assert, runSql } from './helpers.mjs'

export function runVersioningAndActivityRegressionTests(readyProposalId) {
  console.log('\n[7/7] Executando Testes de Versionamento e Regressão de 22 Ações do Activity Log...')

  const validSha = 'a'.repeat(64)
  const validUntil = runSql("SELECT (now() AT TIME ZONE 'America/Sao_Paulo' + interval '10 days')::date::text;").stdout
  const woId = '44444444-4444-4444-4444-444444444444'
  const actorId = '11111111-1111-1111-1111-111111111111'

  // 1. Versionamento Rev. 1 -> Rev. 2 (Reabertura da OS)
  runSql(`UPDATE public.work_orders SET status_os = 'orcamento', accepted_proposal_id = NULL, updated_at = now() WHERE id = '${woId}';`)
  const woUpdatedReopened = runSql(`SELECT updated_at FROM public.work_orders WHERE id = '${woId}';`).stdout

  const rev2Res = runSql(`
    SELECT public.reserve_work_order_proposal_atomic(
      '${woId}',
      '${woUpdatedReopened}',
      'key_rev2_test',
      '${validSha}',
      '{"condicoes_pagamento": "30 dias"}'::jsonb,
      '${validUntil}',
      '${actorId}'
    );
  `)
  const rev2Json = JSON.parse(rev2Res.stdout)
  assert(rev2Json.version_number === 2, 'Versionamento: Rev. 2 alocada sequencialmente com version_number=2')

  const rev2StorageKey = `proposals/${woId}/${rev2Json.proposal_id}.pdf`
  const finalizeRev2 = runSql(`
    SELECT public.finalize_work_order_proposal_atomic(
      '${rev2Json.proposal_id}',
      '${woId}',
      '${rev2StorageKey}',
      '${'e'.repeat(64)}',
      2048000,
      '${actorId}'
    );
  `)
  assert(finalizeRev2.success, 'Versionamento: Rev. 2 finalizada com sucesso', finalizeRev2.stderr)

  const rev1StatusAfterRev2 = runSql(`SELECT status, accepted_at IS NOT NULL FROM public.work_order_proposals WHERE id = '${readyProposalId}';`).stdout
  assert(rev1StatusAfterRev2.includes('superseded') && rev1StatusAfterRev2.includes('t'), 'Versionamento: Rev. 1 transicionou para superseded preservando metadados de aceite histórico')

  // 2. Teste Individual das 22 Ações Legadas da Migration 010
  const legacyActions = [
    { entity: 'client', acao: 'client_created', desc: 'Cliente cadastrado' },
    { entity: 'client', acao: 'converted_from_lead', desc: 'Convertido de lead' },
    { entity: 'client', acao: 'client_updated', desc: 'Dados do cliente atualizados' },
    { entity: 'client', acao: 'client_archived', desc: 'Cliente arquivado' },
    { entity: 'address', acao: 'address_created', desc: 'Endereço cadastrado' },
    { entity: 'address', acao: 'address_updated', desc: 'Endereço atualizado' },
    { entity: 'address', acao: 'address_deleted', desc: 'Endereço removido' },
    { entity: 'work_order', acao: 'work_order_created', desc: 'OS criada' },
    { entity: 'work_order', acao: 'work_order_status_changed', desc: 'Status da OS alterado' },
    { entity: 'work_order', acao: 'work_order_completed', desc: 'OS concluída' },
    { entity: 'work_order', acao: 'work_order_cancelled', desc: 'OS cancelada' },
    { entity: 'payment', acao: 'payment_received', desc: 'Pagamento recebido' },
    { entity: 'payment', acao: 'payment_cancelled', desc: 'Pagamento cancelado' },
    { entity: 'appointment', acao: 'appointment_created', desc: 'Agendamento criado' },
    { entity: 'appointment', acao: 'appointment_rescheduled', desc: 'Agendamento remarcado' },
    { entity: 'appointment', acao: 'appointment_cancelled', desc: 'Agendamento cancelado' },
    { entity: 'warranty', acao: 'warranty_issued', desc: 'Garantia emitida' },
    { entity: 'warranty', acao: 'warranty_triggered', desc: 'Garantia acionada' },
    { entity: 'warranty', acao: 'warranty_resolved', desc: 'Garantia resolvida' },
    { entity: 'media', acao: 'media_uploaded', desc: 'Mídia enviada' },
    { entity: 'media', acao: 'media_removed', desc: 'Mídia removida' },
    { entity: 'note', acao: 'note_added', desc: 'Nota interna adicionada' }
  ]

  let passedLegacyActions = 0
  for (const item of legacyActions) {
    const res = runSql(`
      INSERT INTO public.crm_activity_log (
        client_id, work_order_id, entity_type, entity_id, acao, descricao_humana, occurred_at
      ) VALUES (
        '22222222-2222-2222-2222-222222222222', '${woId}', '${item.entity}', gen_random_uuid(), '${item.acao}', '${item.desc}', now()
      );
    `)
    if (res.success) {
      passedLegacyActions++
    }
    assert(res.success, `Activity Log Legado [${item.acao}]: Inserção com entity_type='${item.entity}' é VÁLIDA`, res.stderr)
  }

  assert(passedLegacyActions === 22, `Activity Log Legado: Todas as 22 ações da Migration 010 foram testadas e aprovadas (${passedLegacyActions}/22)`)

  // 3. Verificação de Novos Eventos de Proposta e Minimização de Dados (Sem PII)
  const proposalEvents = runSql(`
    SELECT acao, dados_novos::text 
    FROM public.crm_activity_log 
    WHERE entity_type = 'proposal' 
    ORDER BY occurred_at ASC;
  `).stdout

  assert(proposalEvents.includes('proposal_issued'), 'Novos Eventos: Evento proposal_issued registrado no activity log')
  assert(proposalEvents.includes('proposal_accepted'), 'Novos Eventos: Evento proposal_accepted registrado no activity log')
  assert(proposalEvents.includes('proposal_superseded'), 'Novos Eventos: Evento proposal_superseded registrado no activity log')

  // Minimização estrita de payload (sem PII)
  const hasNoPii = !proposalEvents.toLowerCase().includes('cpf') &&
                   !proposalEvents.toLowerCase().includes('telefone') &&
                   !proposalEvents.toLowerCase().includes('email') &&
                   !proposalEvents.toLowerCase().includes('logradouro') &&
                   !proposalEvents.toLowerCase().includes('cliente teste ficticio')

  assert(hasNoPii, 'Privacidade e Minimização: Payloads de activity log de propostas NÃO contêm dados pessoais (PII) ou endereços')

  return {
    legacyTested: legacyActions.length,
    legacyPassed: passedLegacyActions
  }
}
