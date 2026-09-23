/**
 * Orquestrador Transacional de Emissão e Reconciliação Fiscal — AD Telas e Redes
 */

import { getSupabaseHeaders, type SupabaseConfig } from '../../utils/crm'
import { getFiscalAdapter } from './adapterRegistry'
import { persistAuthorizedFiscalFiles } from './fiscalStorage'
import type { FiscalDocumentRecord } from './types'

async function finalizeAtomic(
  config: SupabaseConfig,
  doc: FiscalDocumentRecord,
  leaseToken: string,
  res: any
) {
  const headers = getSupabaseHeaders(config.serviceRoleKey)
  if (res.status === 'autorizado') {
    const storagePending = await persistAuthorizedFiscalFiles(config, doc, res.xmlContent, res.pdfBuffer)
    return await $fetch(`${config.url}/rest/v1/rpc/complete_fiscal_emission_atomic`, {
      method: 'POST',
      headers,
      body: {
        p_document_id: doc.id,
        p_lease_token: leaseToken,
        p_target_status: 'autorizado',
        p_codigo_status: res.codigoStatus || '100',
        p_motivo_status: res.motivoStatus || 'Autorizado',
        p_numero_doc: res.numeroDocumento || doc.numero_documento,
        p_serie: res.serie || doc.serie,
        p_chave_acesso: res.chaveAcesso || null,
        p_protocolo: res.protocolo || null,
        p_data_autorizacao: res.dataAutorizacao || new Date().toISOString(),
        p_storage_pending: storagePending
      }
    })
  }

  if (res.status === 'rejeitado') {
    return await $fetch(`${config.url}/rest/v1/rpc/complete_fiscal_emission_atomic`, {
      method: 'POST',
      headers,
      body: {
        p_document_id: doc.id,
        p_lease_token: leaseToken,
        p_target_status: 'rejeitado',
        p_codigo_status: res.codigoStatus || 'REJ',
        p_motivo_status: res.motivoStatus || 'Rejeição fiscal',
        p_storage_pending: false
      }
    })
  }

  await $fetch(`${config.url}/rest/v1/rpc/release_fiscal_execution_lease`, {
    method: 'POST',
    headers,
    body: { p_document_id: doc.id, p_lease_token: leaseToken }
  }).catch(() => {})

  return { success: res.success ?? false, status: res.status || 'processando', requiresPolling: true, message: res.motivoStatus }
}

export async function transmitFiscalDocument(
  config: SupabaseConfig,
  params: { documentId: string; executorId: string; actorId?: string | null }
) {
  const headers = getSupabaseHeaders(config.serviceRoleKey)
  const { documentId, executorId, actorId } = params

  const reserveRes = await $fetch<any>(`${config.url}/rest/v1/rpc/reserve_fiscal_items_atomic`, {
    method: 'POST',
    headers,
    body: { p_document_id: documentId, p_executor_id: executorId, p_lease_seconds: 180 }
  })
  const leaseToken = reserveRes?.lease_token

  const docs = await $fetch<FiscalDocumentRecord[]>(
    `${config.url}/rest/v1/fiscal_documents?id=eq.${documentId}&select=*,items:fiscal_document_items(*)`,
    { headers }
  )
  const doc = docs?.[0]
  if (!doc) throw new Error('Documento fiscal não encontrado após reserva.')

  const adapter = getFiscalAdapter(doc.provider)
  const attemptStartTime = Date.now()

  await $fetch(`${config.url}/rest/v1/fiscal_documents?id=eq.${documentId}`, {
    method: 'PATCH',
    headers,
    body: { transmission_phase: 'dispatched_awaiting_response' }
  })

  let transmitResult: any
  let httpStatus = 200
  let errorMessage: string | null = null

  try {
    transmitResult = await adapter.transmit(
      doc,
      doc.snapshot_itens || (doc as any).items || [],
      doc.snapshot_emitente,
      doc.snapshot_destinatario,
      doc.snapshot_endereco,
      doc.idempotency_key
    )
  } catch (err: any) {
    httpStatus = err?.statusCode || 500
    errorMessage = err?.message || 'Erro de comunicação com o provedor fiscal'
    transmitResult = { success: false, status: 'processando', requiresPolling: true, motivoStatus: errorMessage }
  }

  const durationMs = Date.now() - attemptStartTime

  await $fetch(`${config.url}/rest/v1/fiscal_document_attempts`, {
    method: 'POST',
    headers,
    body: {
      fiscal_document_id: documentId,
      attempt_number: (await getNextAttemptNumber(config, documentId)),
      transmission_phase: transmitResult.status === 'autorizado' ? 'completed' : 'dispatched_awaiting_response',
      http_status: httpStatus,
      duration_ms: durationMs,
      status_result: transmitResult.status,
      error_code: transmitResult.codigoStatus || null,
      error_message: errorMessage || transmitResult.motivoStatus || null,
      actor_id: actorId || null
    }
  }).catch(() => {})

  return await finalizeAtomic(config, doc, leaseToken, transmitResult)
}

export async function reconcileFiscalDocument(
  config: SupabaseConfig,
  params: { documentId: string; executorId: string }
) {
  const headers = getSupabaseHeaders(config.serviceRoleKey)
  const { documentId, executorId } = params

  const leaseRes = await $fetch<any>(`${config.url}/rest/v1/rpc/acquire_fiscal_execution_lease`, {
    method: 'POST',
    headers,
    body: { p_document_id: documentId, p_executor_id: executorId, p_lease_seconds: 120 }
  })
  if (!leaseRes?.acquired || !leaseRes?.lease_token) {
    throw new Error('Não foi possível adquirir a trava de execução para este documento.')
  }
  const leaseToken = leaseRes.lease_token

  const docs = await $fetch<FiscalDocumentRecord[]>(`${config.url}/rest/v1/fiscal_documents?id=eq.${documentId}`, { headers })
  const doc = docs?.[0]
  if (!doc) throw new Error('Documento não encontrado.')

  const adapter = getFiscalAdapter(doc.provider)
  const consultRes = await adapter.consult(doc, doc.idempotency_key)

  return await finalizeAtomic(config, doc, leaseToken, consultRes)
}

async function getNextAttemptNumber(config: SupabaseConfig, docId: string): Promise<number> {
  const headers = getSupabaseHeaders(config.serviceRoleKey)
  const attempts = await $fetch<any[]>(
    `${config.url}/rest/v1/fiscal_document_attempts?fiscal_document_id=eq.${docId}&select=attempt_number&order=attempt_number.desc&limit=1`,
    { headers }
  ).catch(() => [])
  return (attempts?.[0]?.attempt_number || 0) + 1
}
