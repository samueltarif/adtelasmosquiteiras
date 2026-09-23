import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { transmitFiscalDocument } from '../../../../../services/fiscal/fiscalOrchestrator'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID do documento é obrigatório' })
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const executorId = `manual:${admin.userId}:${Date.now()}`

  try {
    const result = await transmitFiscalDocument(
      {
        url: config.supabaseUrl,
        serviceRoleKey: config.supabaseServiceRoleKey
      },
      {
        documentId: id,
        executorId,
        actorId: admin.userId
      }
    )

    return {
      success: true,
      result
    }
  } catch (err: any) {
    console.error('[fiscal/transmit.post] Erro na transmissão fiscal:', err)
    if (err.message?.includes('ERR_ITEM_BALANCE_EXCEEDED')) {
      throw createError({ statusCode: 409, message: 'Saldo insuficiente nos itens da OS para esta emissão.' })
    }
    if (err.message?.includes('ERR_LEASE_COLLISION')) {
      throw createError({ statusCode: 409, message: 'Este documento já está sendo processado por outra solicitação.' })
    }
    throw createError({ statusCode: 500, message: err.message || 'Erro ao transmitir documento fiscal.' })
  }
})
