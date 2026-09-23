import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { validateFiscalPreconditions } from '../../../../../shared/fiscalValidation.mjs'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID do documento é obrigatório' })
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const docRes = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/fiscal_documents?id=eq.${id}&select=*,items:fiscal_document_items(*),attempts:fiscal_document_attempts(*),events:fiscal_document_events(*),files:fiscal_document_files(*)`,
      { headers }
    )
    const doc = docRes?.[0]
    if (!doc) throw createError({ statusCode: 404, message: 'Documento fiscal não encontrado' })

    // Ordenação local de tentativas e eventos
    if (Array.isArray(doc.attempts)) {
      doc.attempts.sort((a: any, b: any) => (b.attempt_number || 0) - (a.attempt_number || 0))
    }
    if (Array.isArray(doc.events)) {
      doc.events.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    // Diagnóstico de pré-condições sem valores presumidos
    const validation = validateFiscalPreconditions({
      documentType: doc.tipo_documento,
      company: doc.snapshot_emitente || {},
      recipient: doc.snapshot_destinatario || {},
      items: doc.items || doc.snapshot_itens || []
    })

    return {
      success: true,
      document: doc,
      diagnostics: validation
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[fiscal/[id].get] Erro:', err)
    throw createError({ statusCode: 500, message: 'Erro ao carregar detalhes do documento fiscal' })
  }
})
