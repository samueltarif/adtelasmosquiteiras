import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { getFiscalFilePresignedUrl } from '../../../../../services/fiscal/fiscalStorage'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const fileType = String(query.type || 'xml') // 'xml' | 'pdf'

  if (!id) throw createError({ statusCode: 400, message: 'ID do documento é obrigatório' })
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const targetType = fileType === 'pdf' ? 'danfe_pdf' : 'xml_autorizado'

  const files = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/fiscal_document_files?fiscal_document_id=eq.${id}&tipo_arquivo=eq.${targetType}&limit=1`,
    { headers }
  )
  const file = files?.[0]
  if (!file) {
    throw createError({ statusCode: 404, message: `Arquivo ${fileType.toUpperCase()} não encontrado no armazenamento.` })
  }

  const presignedUrl = await getFiscalFilePresignedUrl(file.storage_key, 300)
  return {
    success: true,
    fileType: file.tipo_arquivo,
    storageKey: file.storage_key,
    downloadUrl: presignedUrl,
    sha256: file.sha256
  }
})
