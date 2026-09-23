import { defineEventHandler, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { reconcileFiscalDocument } from '../../../../../services/fiscal/fiscalOrchestrator'
import type { FiscalDocumentRecord } from '../../../../../services/fiscal/types'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const workerId = `sweep:${admin.userId}:${Date.now()}`

  // Busca documentos retidos em processando cujo lease expirou ou está nulo
  const nowIso = new Date().toISOString()
  const stuckDocs = await $fetch<FiscalDocumentRecord[]>(
    `${config.supabaseUrl}/rest/v1/fiscal_documents?status=eq.processando&or=(locked_until.is.null,locked_until.lt.${nowIso})&limit=10`,
    { headers }
  ).catch(() => [])

  const results: any[] = []

  for (const doc of stuckDocs) {
    try {
      const rec = await reconcileFiscalDocument(
        { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
        { documentId: doc.id, executorId: workerId }
      )
      results.push({ documentId: doc.id, status: rec.status, resolved: true })
    } catch (err: any) {
      results.push({ documentId: doc.id, resolved: false, error: err.message })
    }
  }

  return {
    success: true,
    processedCount: stuckDocs.length,
    results
  }
})
