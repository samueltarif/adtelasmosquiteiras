import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../../../utils/crm'
import { generatePresignedDownloadUrl } from '../../../../../../../utils/r2Storage'

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

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Validação de existência da mídia na OS
  const mediaList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_order_media?id=eq.${mediaId}&work_order_id=eq.${id}&select=id,storage_key,safe_filename,mime_type`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(mediaList) || mediaList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Mídia não encontrada nesta ordem de serviço'
    })
  }

  const media = mediaList[0]

  try {
    const signedUrl = await generatePresignedDownloadUrl(media.storage_key, 300)

    return {
      signedUrl,
      expiresInSeconds: 300,
      filename: media.safe_filename,
      mimeType: media.mime_type
    }
  } catch (err: any) {
    console.error('[WorkOrderMediaSignedUrl] Erro ao gerar presigned download URL:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao gerar URL de visualização da mídia'
    })
  }
})
