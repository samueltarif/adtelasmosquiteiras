import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { createFiscalDraftFromWorkOrder } from '../../../../services/fiscal/fiscalDraftService'
import type { FiscalDocumentType, FiscalEnvironment } from '../../../../services/fiscal/types'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado no servidor' })
  }

  const body = await readBody(event).catch(() => ({}))
  const { workOrderId, tipoDocumento, ambiente, isSimulated, selectedItemIds } = body

  if (!workOrderId) {
    throw createError({ statusCode: 400, message: 'O ID da Ordem de Serviço é obrigatório.' })
  }
  if (!tipoDocumento || !['nfe', 'nfse'].includes(tipoDocumento)) {
    throw createError({ statusCode: 400, message: 'Tipo de documento inválido (deve ser nfe ou nfse).' })
  }

  try {
    const draft = await createFiscalDraftFromWorkOrder(
      {
        url: config.supabaseUrl,
        serviceRoleKey: config.supabaseServiceRoleKey
      },
      {
        workOrderId,
        tipoDocumento: tipoDocumento as FiscalDocumentType,
        ambiente: (ambiente as FiscalEnvironment) || 'homologacao',
        isSimulated: Boolean(isSimulated),
        selectedItemIds: Array.isArray(selectedItemIds) ? selectedItemIds : undefined,
        actorId: admin.userId
      }
    )

    return {
      success: true,
      draft
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[fiscal/draft.post] Erro ao criar rascunho fiscal:', err)
    throw createError({ statusCode: 400, message: err.message || 'Erro ao gerar rascunho fiscal' })
  }
})
