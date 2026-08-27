import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  logCrmActivity
} from '../../../../../../../utils/crm'
import { deleteObjectImmediately } from '../../../../../../../utils/r2Storage'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const id = getRouterParam(event, 'id')
  const mediaId = getRouterParam(event, 'mediaId')
  if (!id || !mediaId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'IDs de OS e mídia são obrigatórios'
    })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Valida existência da mídia vinculada à OS
  const mediaList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_media?id=eq.${mediaId}&work_order_id=eq.${id}&select=*,work_order:work_orders(id,client_id,numero_os)`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(mediaList) || mediaList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Mídia não encontrada nesta ordem de serviço'
    })
  }

  const media = mediaList[0]
  const storageKey = media.storage_key
  const clientId = media.work_order?.client_id

  // 2. Consulta referências restantes do storage_key em lead_media e work_order_media
  let leadReferencesCount = 0
  let woReferencesCount = 0

  try {
    const leadRefs = await fetch(
      `${config.supabaseUrl}/rest/v1/lead_media?storage_key=eq.${encodeURIComponent(storageKey)}&select=id`,
      {
        headers: { ...headers, 'Prefer': 'count=exact' }
      }
    )
    const leadRange = leadRefs.headers.get('content-range') || ''
    if (leadRange.includes('/')) {
      leadReferencesCount = parseInt(leadRange.split('/')[1], 10) || 0
    }

    const woRefs = await fetch(
      `${config.supabaseUrl}/rest/v1/work_order_media?storage_key=eq.${encodeURIComponent(storageKey)}&id=neq.${mediaId}&select=id`,
      {
        headers: { ...headers, 'Prefer': 'count=exact' }
      }
    )
    const woRange = woRefs.headers.get('content-range') || ''
    if (woRange.includes('/')) {
      woReferencesCount = parseInt(woRange.split('/')[1], 10) || 0
    }
  } catch (refErr: any) {
    console.error('[SafeDelete] Erro ao consultar referências do storage_key:', refErr?.message || refErr)
  }

  const referencesRemaining = leadReferencesCount + woReferencesCount

  // 3. Ordem Segura de Exclusão (WORK_ORDER_MEDIA_SAFE_DELETE_ORDER=REFERENCE_CHECK_THEN_R2_THEN_DB)
  if (referencesRemaining === 0) {
    // Caso B: Nenhuma outra entidade referencia o arquivo físico -> R2 Delete PRIMEIRO
    try {
      await deleteObjectImmediately(storageKey)
    } catch (r2Err: any) {
      console.error('[SafeDelete] Falha ao excluir objeto físico no R2. Abortando deleção do banco para preservação de metadados e retry:', r2Err?.message || r2Err)
      throw createError({
        statusCode: 502,
        statusMessage: 'Falha na exclusão do arquivo no armazenamento R2. A mídia foi preservada para nova tentativa.'
      })
    }

    // R2 Delete teve sucesso -> Deleta registro do banco
    try {
      await $fetch(`${config.supabaseUrl}/rest/v1/work_order_media?id=eq.${mediaId}`, {
        method: 'DELETE',
        headers
      })
    } catch (dbErr: any) {
      console.error('[SafeDelete] Erro ao deletar registro no banco após exclusão no R2:', dbErr?.message || dbErr)
      throw createError({
        statusCode: 500,
        statusMessage: 'Falha ao remover registro de mídia no banco'
      })
    }
  } else {
    // Caso A: Arquivo compartilhado com Lead ou outra OS -> Deleta SOMENTE o registro do banco
    try {
      await $fetch(`${config.supabaseUrl}/rest/v1/work_order_media?id=eq.${mediaId}`, {
        method: 'DELETE',
        headers
      })
    } catch (dbErr: any) {
      console.error('[SafeDelete] Erro ao deletar registro no banco:', dbErr?.message || dbErr)
      throw createError({
        statusCode: 500,
        statusMessage: 'Falha ao remover registro de mídia no banco'
      })
    }
  }

  // 4. Registro de Auditoria
  if (clientId) {
    await logCrmActivity(config, {
      clientId,
      workOrderId: id,
      entityType: 'media',
      entityId: mediaId,
      acao: 'media_removed',
      descricaoHumana: `Mídia técnica removida (${media.safe_filename})`,
      dadosAnteriores: {
        media_id: mediaId,
        etapa: media.etapa,
        media_type: media.media_type
      },
      actorId: admin.userId
    })
  }

  return { success: true }
})
