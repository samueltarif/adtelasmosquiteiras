import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  validateServiceKey,
  validateMediaTypeAndMime,
  validateFileSize,
  validateStorageKeyFormat,
  validateSiteMediaMagicBytes,
  sanitizeAltText,
  sanitizeCaption,
  sanitizeTitle,
  buildPublicMediaUrl,
  headSiteObjectInR2,
  getSiteObjectMagicBytes,
  deleteSiteObjectFromR2
} from '../../../../utils/r2SiteStorage'

/**
 * ======================================================================
 * ADMIN SITE MEDIA — FINALIZE UPLOAD
 * ======================================================================
 * POST /api/admin/media/site/finalize-upload
 *
 * Valida fisicamente o arquivo enviado ao Cloudflare R2 via HeadObject e
 * Magic Bytes (Range GET 512 bytes), calcula sort_order de forma segura e
 * persiste o registro na tabela public.service_media via service_role.
 *
 * REGRAS DE INTEGRIDADE:
 * 1. Autenticação administrativa estrita com RBAC.
 * 2. Validação da storage_key no padrão services/{service_key}/{uuid}.{ext}.
 * 3. HeadObjectCommand obrigatório (valida existência física e tamanho).
 * 4. Validação real de Magic Bytes nos primeiros 512 bytes do arquivo.
 * 5. Limpeza automática do R2 caso arquivo seja corrompido ou forjado.
 * 6. Idempotência garantida: se storage_key já existir, retorna sem duplicar.
 * 7. Inserção no Supabase estritamente via service_role server-side.
 * ======================================================================
 */

export default defineEventHandler(async (event) => {
  // 1. Guard de Autenticação e RBAC Administrativo
  const admin = await requireActiveAdmin(event)

  // 2. Proteção de Cache
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')

  const config = useRuntimeConfig()
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      message: 'Configuração de banco de dados indisponível no servidor'
    })
  }

  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'Payload inválido. Objeto JSON esperado.'
    })
  }

  const {
    service_key,
    storage_key,
    media_type,
    mime_type,
    width,
    height,
    alt_text,
    caption,
    title
  } = body

  // 3. Validação de service_key e storage_key format
  if (!validateServiceKey(service_key)) {
    throw createError({
      statusCode: 400,
      message: `service_key "${service_key}" inválida.`
    })
  }

  const keyCheck = validateStorageKeyFormat(storage_key, service_key)
  if (!keyCheck.valid) {
    throw createError({
      statusCode: 400,
      message: keyCheck.error
    })
  }

  // 4. Validação de media_type e mime_type
  const typeCheck = validateMediaTypeAndMime(media_type, mime_type)
  if (!typeCheck.valid) {
    throw createError({
      statusCode: 400,
      message: typeCheck.error
    })
  }

  // 5. Validação de Dimensões (Obrigatórias para Fotos)
  let validWidth: number | null = null
  let validHeight: number | null = null

  if (typeCheck.mediaType === 'photo') {
    const numWidth = parseInt(width, 10)
    const numHeight = parseInt(height, 10)
    if (isNaN(numWidth) || numWidth <= 0 || isNaN(numHeight) || numHeight <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Para fotos, width e height devem ser números inteiros estritamente positivos (prevenção de CLS).'
      })
    }
    validWidth = numWidth
    validHeight = numHeight
  } else {
    // Para vídeo, dimensões podem ser opcionais/positivas
    if (width !== undefined && width !== null) {
      const numWidth = parseInt(width, 10)
      if (!isNaN(numWidth) && numWidth > 0) validWidth = numWidth
    }
    if (height !== undefined && height !== null) {
      const numHeight = parseInt(height, 10)
      if (!isNaN(numHeight) && numHeight > 0) validHeight = numHeight
    }
  }

  // 6. Validação e Sanitização de Textos
  let cleanAltText: string
  try {
    cleanAltText = sanitizeAltText(alt_text)
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      message: err?.message || 'alt_text inválido'
    })
  }

  const cleanCaption = sanitizeCaption(caption)
  const cleanTitle = sanitizeTitle(title)

  // 7. Validação Física no Cloudflare R2 (HeadObject)
  let head: { exists: boolean; contentLength?: number; contentType?: string }
  try {
    head = await headSiteObjectInR2(storage_key)
  } catch (err: any) {
    console.error('Erro ao consultar HeadObject no R2 Site Media:', err?.message || err)
    throw createError({
      statusCode: 502,
      message: 'Falha na comunicação com o serviço de armazenamento'
    })
  }

  if (!head.exists || !head.contentLength || head.contentLength <= 0) {
    throw createError({
      statusCode: 404,
      message: 'Objeto não encontrado no armazenamento R2. O upload pode ter falhado ou expirado.'
    })
  }

  // Validação de limite real do tamanho em bytes retornado pelo R2
  const sizeCheck = validateFileSize(typeCheck.mediaType, head.contentLength)
  if (!sizeCheck.valid) {
    // Remove objeto excedente do R2
    await deleteSiteObjectFromR2(storage_key)
    throw createError({
      statusCode: 400,
      message: sizeCheck.error
    })
  }

  // 8. Validação de Magic Bytes (Range GET 512 bytes)
  let magicBuffer: Buffer
  try {
    magicBuffer = await getSiteObjectMagicBytes(storage_key)
  } catch (err: any) {
    console.error('Erro ao ler Magic Bytes do R2 Site Media:', err?.message || err)
    throw createError({
      statusCode: 502,
      message: 'Falha ao validar integridade binária do arquivo no armazenamento'
    })
  }

  const isMagicValid = validateSiteMediaMagicBytes(magicBuffer, typeCheck.mimeType)
  if (!isMagicValid) {
    // Cleanup de segurança no R2: remove arquivo inválido/forjado
    await deleteSiteObjectFromR2(storage_key)
    throw createError({
      statusCode: 400,
      message: `Assinatura binária do arquivo (Magic Bytes) incompatível com o tipo de mídia declarado ("${typeCheck.mimeType}"). O arquivo foi rejeitado e removido.`
    })
  }

  const dbHeaders = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  // 9. Idempotência: Checa se storage_key já foi persistida anteriormente
  try {
    const existing: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/service_media?storage_key=eq.${encodeURIComponent(storage_key)}&select=*`,
      { headers: dbHeaders }
    )

    if (existing && existing.length > 0) {
      const record = existing[0]
      return {
        success: true,
        idempotent: true,
        media: {
          ...record,
          publicUrl: buildPublicMediaUrl(config.public?.r2SiteMediaPublicBaseUrl, record.storage_key)
        }
      }
    }
  } catch (err: any) {
    console.error('Erro ao verificar idempotência de service_media:', err?.message || err)
  }

  // 10. Cálculo de sort_order no Servidor (MAX + 1)
  let nextSortOrder = 0
  try {
    const highest: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/service_media?service_key=eq.${encodeURIComponent(service_key)}&select=sort_order&order=sort_order.desc&limit=1`,
      { headers: dbHeaders }
    )
    if (highest && highest.length > 0 && typeof highest[0].sort_order === 'number') {
      nextSortOrder = highest[0].sort_order + 1
    }
  } catch (err: any) {
    console.warn('Aviso: Falha ao consultar MAX(sort_order), utilizando valor padrão 0:', err?.message || err)
  }

  // 11. Inserção na Tabela public.service_media
  const insertPayload = {
    service_key,
    storage_key,
    media_type: typeCheck.mediaType,
    mime_type: typeCheck.mimeType,
    title: cleanTitle,
    alt_text: cleanAltText,
    caption: cleanCaption,
    sort_order: nextSortOrder,
    is_featured: false,
    is_active: true,
    width: validWidth,
    height: validHeight,
    file_size_bytes: head.contentLength,
    created_by: admin.userId
  }

  try {
    const inserted: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/service_media`,
      {
        method: 'POST',
        headers: dbHeaders,
        body: insertPayload
      }
    )

    const record = inserted?.[0] || insertPayload
    return {
      success: true,
      media: {
        ...record,
        publicUrl: buildPublicMediaUrl(config.public?.r2SiteMediaPublicBaseUrl, record.storage_key)
      }
    }
  } catch (err: any) {
    console.error('Erro ao inserir registro em public.service_media:', err?.message || err)
    throw createError({
      statusCode: 500,
      message: 'Falha ao registrar mídia no banco de dados: ' + (err?.data?.message || err?.message || 'Erro interno')
    })
  }
})
