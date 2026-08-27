import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  ALLOWED_MEDIA_ETAPAS
} from '../../../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
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

  const body = await readBody(event).catch(() => ({}))
  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Valida existência da mídia vinculada à OS
  const mediaList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_media?id=eq.${mediaId}&work_order_id=eq.${id}&select=*`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(mediaList) || mediaList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Mídia não encontrada nesta ordem de serviço'
    })
  }

  const currentMedia = mediaList[0]
  const updates: Record<string, any> = {}

  if (body.etapa !== undefined) {
    if (!ALLOWED_MEDIA_ETAPAS.includes(body.etapa)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Etapa inválida. Permitidas: ${ALLOWED_MEDIA_ETAPAS.join(', ')}`
      })
    }
    updates.etapa = body.etapa
  }

  if (body.descricao !== undefined) {
    updates.descricao = body.descricao ? String(body.descricao).trim() : null
  }

  if (body.work_order_item_id !== undefined) {
    if (body.work_order_item_id === null || body.work_order_item_id === '') {
      updates.work_order_item_id = null
    } else {
      const itemId = String(body.work_order_item_id).trim()
      const itemCheck = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/work_order_items?id=eq.${itemId}&work_order_id=eq.${id}&select=id`,
        { headers }
      ).catch(() => [])

      if (!Array.isArray(itemCheck) || itemCheck.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'O item selecionado não pertence a esta ordem de serviço'
        })
      }
      updates.work_order_item_id = itemId
    }
  }

  if (Object.keys(updates).length === 0) {
    return {
      success: true,
      media: currentMedia
    }
  }

  try {
    const patchedRes = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_order_media?id=eq.${mediaId}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: updates
      }
    )

    const updatedMedia = patchedRes && patchedRes[0] ? patchedRes[0] : { ...currentMedia, ...updates }

    return {
      success: true,
      media: updatedMedia
    }
  } catch (err: any) {
    console.error('[WorkOrderMediaPatch] Erro ao editar metadados de mídia:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao atualizar metadados da mídia'
    })
  }
})
