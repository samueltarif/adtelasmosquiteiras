/**
 * Orquestrador Transacional de Emissão de Propostas Comerciais
 * Arquivo: server/utils/proposalOrchestrator.ts
 */

import crypto from 'crypto'
import { getSupabaseHeaders, type SupabaseConfig } from './crm'
import { generateProposalPdfBuffer, type ProposalPdfCommercialTerms } from './proposalPdf'
import {
  buildProposalStorageKey,
  uploadProposalPdfToR2,
  headProposalObjectInR2,
  generateProposalSignedDownloadUrl,
  deleteProposalObjectFromR2
} from './r2ProposalStorage'

export interface CanonicalCommercialTerms {
  condicoes_pagamento?: string | null
  prazo_instalacao_dias?: number | null
  incluir_medicoes?: boolean | null
  observacoes_proposta?: string | null
}

/**
 * Produz a representação canônica e determinística dos termos comerciais e calcula seu hash SHA-256.
 */
export function computeCommercialTermsInputHash(
  validUntil: string | null | undefined,
  terms: CanonicalCommercialTerms | null | undefined
): { canonicalJson: string; hashHex: string; sanitizedTerms: Record<string, any> } {
  const cleanValidUntil = validUntil ? String(validUntil).trim().slice(0, 10) : null
  
  const sanitizedTerms: Record<string, any> = {
    condicoes_pagamento: terms?.condicoes_pagamento ? String(terms.condicoes_pagamento).trim() : null,
    prazo_instalacao_dias: typeof terms?.prazo_instalacao_dias === 'number' && Number.isInteger(terms.prazo_instalacao_dias)
      ? Math.max(1, Math.min(365, terms.prazo_instalacao_dias))
      : (terms?.prazo_instalacao_dias ? parseInt(String(terms.prazo_instalacao_dias), 10) || null : null),
    incluir_medicoes: typeof terms?.incluir_medicoes === 'boolean' ? terms.incluir_medicoes : false,
    observacoes_proposta: terms?.observacoes_proposta ? String(terms.observacoes_proposta).trim() : null
  }

  // Objeto canônico com chaves ordenadas
  const canonicalObj = {
    condicoes_pagamento: sanitizedTerms.condicoes_pagamento,
    incluir_medicoes: sanitizedTerms.incluir_medicoes,
    observacoes_proposta: sanitizedTerms.observacoes_proposta,
    prazo_instalacao_dias: sanitizedTerms.prazo_instalacao_dias,
    valid_until: cleanValidUntil
  }

  const canonicalJson = JSON.stringify(canonicalObj)
  const hashHex = crypto.createHash('sha256').update(canonicalJson).digest('hex').toLowerCase()

  return { canonicalJson, hashHex, sanitizedTerms }
}

export interface OrchestrateProposalIssueParams {
  workOrderId: string
  expectedUpdatedAt?: string | null
  idempotencyKey: string
  validUntil?: string | null
  commercialTerms?: CanonicalCommercialTerms | null
  actorId?: string | null
  config: SupabaseConfig
}

export interface ProposalIssueResult {
  success: boolean
  proposalId: string
  versionNumber: number
  numeroOs: string
  status: string
  generationStatus: string
  issuedAt: string
  validUntil: string
  pdfStorageKey: string
  pdfSha256: string
  pdfSizeBytes: number
  isIdempotentReplay: boolean
  signedDownloadUrl?: string
  error?: string
}

/**
 * Executa o fluxo atômico completo de emissão em 2 fases:
 * 1. Reserva no PostgreSQL
 * 2. Geração do PDF em memória a partir dos snapshots congelados
 * 3. Upload para o R2 Privado com recuperação de timeout
 * 4. Finalização no PostgreSQL com idempotência e retorno
 */
export async function orchestrateProposalIssue(
  params: OrchestrateProposalIssueParams
): Promise<ProposalIssueResult> {
  const { workOrderId, idempotencyKey, actorId, config } = params
  const headers = getSupabaseHeaders(config.serviceRoleKey)

  // 1. Calcula hash canônico dos inputs comerciais
  const { hashHex, sanitizedTerms } = computeCommercialTermsInputHash(params.validUntil, params.commercialTerms)

  // 2. Chamada da RPC de Reserva Atômica
  const reservePayload = {
    p_work_order_id: workOrderId,
    p_expected_wo_updated_at: params.expectedUpdatedAt || null,
    p_idempotency_key: idempotencyKey,
    p_idempotency_request_sha256: hashHex,
    p_commercial_terms: sanitizedTerms,
    p_valid_until: params.validUntil ? params.validUntil.slice(0, 10) : null,
    p_actor_id: actorId || null
  }

  let reserveRes: any = null
  try {
    reserveRes = await $fetch<any>(`${config.url}/rest/v1/rpc/reserve_work_order_proposal_atomic`, {
      method: 'POST',
      headers,
      body: reservePayload
    })
  } catch (err: any) {
    const errMsg = err?.data?.message || err?.message || 'Erro ao reservar versão da proposta no banco de dados'
    throw new Error(`RESERVE_FAILED: ${errMsg}`)
  }

  if (!reserveRes || !reserveRes.proposal_id) {
    throw new Error('RESERVE_FAILED: Resposta inválida da RPC de reserva.')
  }

  const proposalId = reserveRes.proposal_id
  const versionNumber = reserveRes.version_number
  const numeroOs = reserveRes.numero_os

  // Se for replay de proposta já finalizada com sucesso (ready)
  if (reserveRes.generation_status === 'ready') {
    const storageKey = reserveRes.pdf_storage_key || buildProposalStorageKey(workOrderId, proposalId)
    const signedUrl = await generateProposalSignedDownloadUrl(storageKey).catch(() => undefined)

    return {
      success: true,
      proposalId,
      versionNumber,
      numeroOs,
      status: reserveRes.status || 'issued',
      generationStatus: 'ready',
      issuedAt: reserveRes.issued_at || new Date().toISOString(),
      validUntil: reserveRes.valid_until,
      pdfStorageKey: storageKey,
      pdfSha256: reserveRes.pdf_sha256,
      pdfSizeBytes: reserveRes.pdf_size_bytes,
      isIdempotentReplay: true,
      signedDownloadUrl: signedUrl
    }
  }

  // 3. Geração do PDF em memória usando EXATAMENTE os snapshots retornados pela reserva
  let pdfBuffer: Buffer
  let pdfSha256: string
  let pdfSizeBytes: number
  const storageKey = buildProposalStorageKey(workOrderId, proposalId)

  try {
    pdfBuffer = await generateProposalPdfBuffer({
      isPreview: false,
      versionNumber,
      numeroOs,
      issuedAt: new Date(),
      validUntil: reserveRes.valid_until,
      companySnapshot: reserveRes.company_snapshot || {},
      clientSnapshot: reserveRes.client_snapshot || {},
      addressSnapshot: reserveRes.address_snapshot || null,
      itemsSnapshot: reserveRes.items_snapshot || [],
      totalsSnapshot: reserveRes.totals_snapshot || {},
      commercialTerms: reserveRes.commercial_terms || sanitizedTerms
    })

    pdfSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex').toLowerCase()
    pdfSizeBytes = pdfBuffer.length
  } catch (pdfErr: any) {
    console.error('[orchestrateProposalIssue] Falha na geração do PDF:', pdfErr)
    // Marca proposta como failed no banco
    await $fetch(`${config.url}/rest/v1/rpc/mark_work_order_proposal_failed_atomic`, {
      method: 'POST',
      headers,
      body: {
        p_proposal_id: proposalId,
        p_work_order_id: workOrderId,
        p_actor_id: actorId || null
      }
    }).catch((markErr) => console.error('[mark_failed] Erro ao marcar falha:', markErr))

    throw new Error(`PDF_GENERATION_FAILED: ${pdfErr?.message || 'Falha ao renderizar PDF do orçamento'}`)
  }

  // 4. Upload para o R2 Privado com recuperação em caso de timeout
  let uploadSuccess = false
  try {
    const uploadRes = await uploadProposalPdfToR2(storageKey, pdfBuffer)
    uploadSuccess = uploadRes.success
  } catch (r2Err: any) {
    console.warn('[orchestrateProposalIssue] Erro no upload R2, verificando existência via HEAD:', r2Err?.message)
    // Unknown outcome recovery via HEAD
    const headRes = await headProposalObjectInR2(storageKey).catch(() => ({ exists: false }))
    if (headRes.exists && headRes.contentLength === pdfSizeBytes) {
      uploadSuccess = true
    } else {
      // Falha comprovada no R2 -> marca falha no banco
      await $fetch(`${config.url}/rest/v1/rpc/mark_work_order_proposal_failed_atomic`, {
        method: 'POST',
        headers,
        body: {
          p_proposal_id: proposalId,
          p_work_order_id: workOrderId,
          p_actor_id: actorId || null
        }
      }).catch((markErr) => console.error('[mark_failed] Erro ao marcar falha:', markErr))

      throw new Error(`R2_UPLOAD_FAILED: ${r2Err?.message || 'Falha no upload do documento para o storage seguro'}`)
    }
  }

  // 5. Finalização no PostgreSQL
  const finalizePayload = {
    p_proposal_id: proposalId,
    p_work_order_id: workOrderId,
    p_pdf_storage_key: storageKey,
    p_pdf_sha256: pdfSha256,
    p_pdf_size_bytes: pdfSizeBytes,
    p_actor_id: actorId || null
  }

  let finalizeRes: any = null
  try {
    finalizeRes = await $fetch<any>(`${config.url}/rest/v1/rpc/finalize_work_order_proposal_atomic`, {
      method: 'POST',
      headers,
      body: finalizePayload
    })
  } catch (finErr: any) {
    console.warn('[orchestrateProposalIssue] Erro ao finalizar no banco, verificando idempotência e estado:', finErr?.message)
    // Finalize unknown outcome recovery
    const checkList = await $fetch<any[]>(
      `${config.url}/rest/v1/work_order_proposals?id=eq.${proposalId}&select=*`,
      { headers }
    ).catch(() => [])

    if (Array.isArray(checkList) && checkList.length > 0 && checkList[0].generation_status === 'ready') {
      finalizeRes = checkList[0]
    } else {
      throw new Error(`FINALIZE_FAILED: ${finErr?.data?.message || finErr?.message || 'Falha ao registrar finalização da proposta'}`)
    }
  }

  const signedUrl = await generateProposalSignedDownloadUrl(storageKey).catch(() => undefined)

  return {
    success: true,
    proposalId,
    versionNumber,
    numeroOs,
    status: finalizeRes?.status || 'issued',
    generationStatus: 'ready',
    issuedAt: finalizeRes?.issued_at || new Date().toISOString(),
    validUntil: finalizeRes?.valid_until || reserveRes.valid_until,
    pdfStorageKey: storageKey,
    pdfSha256,
    pdfSizeBytes,
    isIdempotentReplay: !!finalizeRes?.is_idempotent_replay,
    signedDownloadUrl: signedUrl
  }
}
