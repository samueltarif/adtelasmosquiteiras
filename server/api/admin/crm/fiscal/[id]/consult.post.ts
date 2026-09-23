import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { reconcileFiscalDocument } from '../../../../../services/fiscal/fiscalOrchestrator'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID do documento é obrigatório' })
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const executorId = `consult:${admin.userId}:${Date.now()}`

  try {
    const res = await reconcileFiscalDocument(
      {
        url: config.supabaseUrl,
        serviceRoleKey: config.supabaseServiceRoleKey
      },
      {
        documentId: id,
        executorId
      }
    )

    return {
      success: true,
      result: res
    }
  } catch (err: any) {
    console.error('[fiscal/consult.post] Erro ao consultar documento fiscal:', err)
    throw createError({ statusCode: 500, message: err.message || 'Erro ao consultar status no provedor.' })
  }
})
