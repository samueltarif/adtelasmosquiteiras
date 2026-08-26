import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  sanitizeAltText,
  sanitizeCaption,
  sanitizeTitle,
  buildPublicMediaUrl
} from '../../../../utils/r2SiteStorage'

/**
 * ======================================================================
 * ADMIN SITE MEDIA — UPDATE METADATA
 * ======================================================================
 * POST /api/admin/media/site/update
 *
 * Atualiza campos permitidos de metadados de uma mídia de serviço.
 *
 * REGRAS DE SEGURANÇA:
 * 1. Exige autenticação e autorização ativa de administrador.
 * 2. Allowlist estrita de campos editáveis: alt_text, caption, title, is_active, sort_order.
 * 3. NÃO permite alteração direta de is_featured por este endpoint (deve usar set-featured).
 * 4. Sanitização estrita de textos e validação de tamanho.
 * ======================================================================
 */

export default defineEventHandler(async (event) => {
  // 1. Guard de Autenticação e RBAC Administrativo
  await requireActiveAdmin(event)

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

  const { id } = body
  if (!id || typeof id !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'id da mídia é obrigatório'
    })
  }

  const patchPayload: Record<string, any> = {}

  if (body.alt_text !== undefined) {
    try {
      patchPayload.alt_text = sanitizeAltText(body.alt_text)
    } catch (err: any) {
      throw createError({
        statusCode: 400,
        message: err?.message || 'alt_text inválido'
      })
    }
  }

  if (body.caption !== undefined) {
    patchPayload.caption = sanitizeCaption(body.caption)
  }

  if (body.title !== undefined) {
    patchPayload.title = sanitizeTitle(body.title)
  }

  if (body.is_active !== undefined) {
    patchPayload.is_active = Boolean(body.is_active)
  }

  if (body.sort_order !== undefined) {
    const numOrder = parseInt(body.sort_order, 10)
    if (isNaN(numOrder) || numOrder < 0) {
      throw createError({
        statusCode: 400,
        message: 'sort_order deve ser um número inteiro maior ou igual a zero'
      })
    }
    patchPayload.sort_order = numOrder
  }

  if (Object.keys(patchPayload).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Nenhum campo válido para atualização fornecido no payload'
    })
  }

  const dbHeaders = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  try {
    const updated: any[] = await $fetch(
      `${config.supabaseUrl}/rest/v1/service_media?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: dbHeaders,
        body: patchPayload
      }
    )

    if (!updated || updated.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Mídia não encontrada para atualização'
      })
    }

    const record = updated[0]
    return {
      success: true,
      media: {
        ...record,
        publicUrl: buildPublicMediaUrl(config.public?.r2SiteMediaPublicBaseUrl, record.storage_key)
      }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('Erro ao atualizar service_media:', err?.message || err)
    throw createError({
      statusCode: 500,
      message: 'Falha ao atualizar metadados da mídia no banco de dados'
    })
  }
})
