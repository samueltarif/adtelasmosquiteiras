import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import {
  ALLOWED_MIME_TYPES,
  headSiteObjectInR2,
  getSiteObjectMagicBytes,
  validateSiteMediaMagicBytes,
  deleteSiteObjectFromR2,
  buildPublicMediaUrl,
  isSiteR2Configured
} from '../../../../../utils/r2SiteStorage'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const body = await readBody(event).catch(() => ({}))

  const storageKey = typeof body.storage_key === 'string' ? body.storage_key.trim() : ''
  const mimeType = typeof body.mime_type === 'string' ? body.mime_type.trim() : ''

  if (!storageKey || !storageKey.startsWith('branding/company/')) {
    throw createError({ statusCode: 400, message: 'Chave de armazenamento inválida.' })
  }

  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw createError({ statusCode: 400, message: 'Formato MIME inválido.' })
  }

  if (!isSiteR2Configured() || !config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de armazenamento ou banco indisponível.' })
  }

  // 1. Valida existência física do objeto no R2
  const head = await headSiteObjectInR2(storageKey)
  if (!head.exists || !head.contentLength || head.contentLength <= 0) {
    throw createError({ statusCode: 400, message: 'O arquivo não foi encontrado no R2.' })
  }

  const MAX_LOGO_SIZE = 5 * 1024 * 1024
  if (head.contentLength > MAX_LOGO_SIZE) {
    await deleteSiteObjectFromR2(storageKey).catch(() => {})
    throw createError({ statusCode: 400, message: 'O arquivo excede o limite de 5 MB.' })
  }

  // 2. Valida magic bytes reais do buffer no R2
  const buffer = await getSiteObjectMagicBytes(storageKey)
  const magicCheck = validateSiteMediaMagicBytes(buffer, mimeType)
  if (!magicCheck.valid) {
    await deleteSiteObjectFromR2(storageKey).catch(() => {})
    throw createError({ statusCode: 400, message: 'Assinatura binária do arquivo incompatível com a extensão.' })
  }

  // 3. Consulta logo anterior para posterior limpeza controlada
  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  let oldStorageKey: string | null = null
  try {
    const currentProfile = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/company_profile?id=eq.1&limit=1`, { headers })
    if (Array.isArray(currentProfile) && currentProfile.length > 0 && currentProfile[0].logo_source === 'r2') {
      oldStorageKey = currentProfile[0].logo_storage_key
    }
  } catch (profErr) {
    console.warn('[logo/finalize] Falha ao consultar logo anterior:', profErr)
  }

  // 4. Atualiza company_profile no banco
  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/company_profile?id=eq.1`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: {
        logo_source: 'r2',
        logo_storage_key: storageKey,
        updated_by: admin.userId
      }
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw new Error('Falha ao atualizar registro do perfil no banco.')
    }

    // 5. Limpa logo antiga no R2 se for diferente e pertencer a branding/company/
    if (oldStorageKey && oldStorageKey !== storageKey && oldStorageKey.startsWith('branding/company/')) {
      await deleteSiteObjectFromR2(oldStorageKey).catch((cleanErr) => {
        console.warn('[logo/finalize] Falha ao remover logo anterior do R2:', cleanErr)
      })
    }

    const updatedProfile = res[0]
    return {
      success: true,
      profile: {
        ...updatedProfile,
        logo_url: buildPublicMediaUrl(storageKey)
      }
    }
  } catch (dbErr: any) {
    console.error('[logo/finalize] Erro ao atualizar banco. Executando compensação no R2...', dbErr)
    // SAGA Compensação: deleta o novo objeto R2 enviado
    await deleteSiteObjectFromR2(storageKey).catch(() => {})
    throw createError({ statusCode: 500, message: 'Erro ao salvar a nova logo no perfil da empresa.' })
  }
})
