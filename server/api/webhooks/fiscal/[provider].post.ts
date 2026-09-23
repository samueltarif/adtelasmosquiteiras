import { defineEventHandler, getRouterParam, readRawBody, getHeaders, createError } from 'h3'
import { getFiscalAdapter } from '../../../services/fiscal/adapterRegistry'
import { getSupabaseHeaders } from '../../../utils/crm'
import { uploadFiscalFileToR2, buildFiscalStorageKey, saveFiscalFileMetadata } from '../../../services/fiscal/fiscalStorage'

export default defineEventHandler(async (event) => {
  const providerName = getRouterParam(event, 'provider')
  if (!providerName) throw createError({ statusCode: 400, message: 'Provedor fiscal não especificado' })

  const rawBody = (await readRawBody(event)) || ''
  const headers = getHeaders(event) as Record<string, string>

  let adapter: any
  try {
    adapter = getFiscalAdapter(providerName)
  } catch {
    throw createError({ statusCode: 404, message: `Provedor ${providerName} não suportado` })
  }

  // Validação estrita de autenticação do webhook
  const isAuth = adapter.verifyWebhookAuthentication(event, rawBody, headers)
  if (!isAuth) {
    throw createError({ statusCode: 401, message: 'Assinatura ou token de webhook inválido' })
  }

  const payload = JSON.parse(rawBody || '{}')
  const webhookResult = await adapter.processWebhook(payload)
  if (!webhookResult || !webhookResult.documentId) {
    return { received: true, ignored: true, reason: 'Evento não mapeado para documento' }
  }

  const config = useRuntimeConfig()
  const supaHeaders = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const docId = webhookResult.documentId

  // Carrega documento
  const docs = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/fiscal_documents?id=eq.${docId}&limit=1`, { headers: supaHeaders })
  const doc = docs?.[0]
  if (!doc) return { received: true, error: 'Documento não encontrado' }

  // Adquire lease para finalização atômica
  const leaseRes = await $fetch<any>(`${config.supabaseUrl}/rest/v1/rpc/acquire_fiscal_execution_lease`, {
    method: 'POST',
    headers: supaHeaders,
    body: { p_document_id: docId, p_executor_id: `webhook:${providerName}:${Date.now()}`, p_lease_seconds: 60 }
  })
  if (!leaseRes?.acquired || !leaseRes?.lease_token) {
    return { received: true, retryLater: true }
  }

  if (webhookResult.status === 'autorizado') {
    let storagePending = false
    try {
      if (webhookResult.xmlContent) {
        const key = buildFiscalStorageKey(doc.ambiente, doc.tipo_documento, docId, 'autorizado.xml')
        const up = await uploadFiscalFileToR2(key, Buffer.from(webhookResult.xmlContent, 'utf-8'), 'application/xml')
        await saveFiscalFileMetadata(
          { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
          {
            documentId: docId,
            fileType: 'xml_autorizado',
            storageKey: key,
            sha256: up.sha256,
            sizeBytes: up.sizeBytes,
            contentType: 'application/xml'
          }
        )
      }
    } catch {
      storagePending = true
    }

    await $fetch(`${config.supabaseUrl}/rest/v1/rpc/complete_fiscal_emission_atomic`, {
      method: 'POST',
      headers: supaHeaders,
      body: {
        p_document_id: docId,
        p_lease_token: leaseRes.lease_token,
        p_target_status: 'autorizado',
        p_codigo_status: webhookResult.codigoStatus || '100',
        p_motivo_status: webhookResult.motivoStatus || 'Autorizado via Webhook',
        p_numero_doc: webhookResult.numeroDocumento || doc.numero_documento,
        p_serie: webhookResult.serie || doc.serie,
        p_chave_acesso: webhookResult.chaveAcesso,
        p_protocolo: webhookResult.protocolo,
        p_data_autorizacao: webhookResult.dataAutorizacao || new Date().toISOString(),
        p_storage_pending: storagePending
      }
    })
  } else if (webhookResult.status === 'rejeitado') {
    await $fetch(`${config.supabaseUrl}/rest/v1/rpc/complete_fiscal_emission_atomic`, {
      method: 'POST',
      headers: supaHeaders,
      body: {
        p_document_id: docId,
        p_lease_token: leaseRes.lease_token,
        p_target_status: 'rejeitado',
        p_codigo_status: webhookResult.codigoStatus || 'REJ',
        p_motivo_status: webhookResult.motivoStatus || 'Rejeição informada por webhook'
      }
    })
  }

  return { received: true, status: webhookResult.status }
})
