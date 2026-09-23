import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { getFiscalAdapter } from '../../../../../services/fiscal/adapterRegistry'
import { uploadFiscalFileToR2, buildFiscalStorageKey, saveFiscalFileMetadata } from '../../../../../services/fiscal/fiscalStorage'
import type { FiscalDocumentRecord } from '../../../../../services/fiscal/types'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID do documento é obrigatório' })
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const docs = await $fetch<FiscalDocumentRecord[]>(`${config.supabaseUrl}/rest/v1/fiscal_documents?id=eq.${id}`, { headers })
  const doc = docs?.[0]
  if (!doc) throw createError({ statusCode: 404, message: 'Documento não encontrado' })

  if (doc.status !== 'autorizado' && doc.status !== 'cancelado') {
    throw createError({ statusCode: 400, message: 'Arquivos oficiais só estão disponíveis para notas autorizadas ou canceladas.' })
  }

  const adapter = getFiscalAdapter(doc.provider)
  const files = await adapter.fetchFiles(doc, doc.idempotency_key)

  let uploadedCount = 0
  if (files.xmlContent) {
    const key = buildFiscalStorageKey(doc.ambiente, doc.tipo_documento, doc.id, 'autorizado.xml')
    const up = await uploadFiscalFileToR2(key, Buffer.from(files.xmlContent, 'utf-8'), 'application/xml')
    await saveFiscalFileMetadata(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      {
        documentId: doc.id,
        fileType: 'xml_autorizado',
        storageKey: key,
        sha256: up.sha256,
        sizeBytes: up.sizeBytes,
        contentType: 'application/xml'
      }
    )
    uploadedCount++
  }

  if (files.pdfBuffer) {
    const key = buildFiscalStorageKey(doc.ambiente, doc.tipo_documento, doc.id, 'danfe.pdf')
    const up = await uploadFiscalFileToR2(key, files.pdfBuffer, 'application/pdf')
    await saveFiscalFileMetadata(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      {
        documentId: doc.id,
        fileType: 'danfe_pdf',
        storageKey: key,
        sha256: up.sha256,
        sizeBytes: up.sizeBytes,
        contentType: 'application/pdf'
      }
    )
    uploadedCount++
  }

  if (uploadedCount > 0) {
    await $fetch(`${config.supabaseUrl}/rest/v1/fiscal_documents?id=eq.${doc.id}`, {
      method: 'PATCH',
      headers,
      body: { storage_pending: false }
    })
  }

  return { success: true, uploadedCount, storagePending: false }
})
