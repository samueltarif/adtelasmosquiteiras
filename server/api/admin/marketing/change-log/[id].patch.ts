import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  parseSaoPauloToUtcIso,
  VALID_CHANGE_TYPES,
  VALID_SCOPES,
  VALID_STATUSES
} from '../../../../shared/adminMarketingChangeCore.mjs'

export default defineEventHandler(async (event) => {
  // 1. Exige Administrador Ativo
  const adminIdentity = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event) || {}

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID da alteração não fornecido.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString()
  }

  if (body.title !== undefined) {
    const title = String(body.title).trim()
    if (!title) throw createError({ statusCode: 400, message: 'O título não pode ser vazio.' })
    updates.title = title
  }

  if (body.description !== undefined) {
    updates.description = body.description ? String(body.description).trim() : null
  }

  if (body.change_type !== undefined) {
    const changeType = String(body.change_type).trim().toLowerCase()
    if (!VALID_CHANGE_TYPES.has(changeType)) {
      throw createError({ statusCode: 400, message: `Tipo de alteração inválido: ${changeType}` })
    }
    updates.change_type = changeType
  }

  if (body.scope !== undefined) {
    const scope = String(body.scope).trim().toLowerCase()
    if (!VALID_SCOPES.has(scope)) {
      throw createError({ statusCode: 400, message: `Escopo inválido: ${scope}` })
    }
    updates.scope = scope
  }

  if (body.occurred_at !== undefined) {
    const occurredAtUtc = parseSaoPauloToUtcIso(body.occurred_at)
    if (!occurredAtUtc) {
      throw createError({ statusCode: 400, message: 'Data/hora inválida.' })
    }
    updates.occurred_at = occurredAtUtc
  }

  if (body.campaign_name !== undefined) {
    updates.campaign_name = body.campaign_name ? String(body.campaign_name).trim() : null
  }

  if (body.google_campaign_id !== undefined) {
    updates.google_campaign_id = body.google_campaign_id ? String(body.google_campaign_id).trim() : null
  }

  if (body.landing_path !== undefined) {
    updates.landing_path = body.landing_path ? String(body.landing_path).trim() : null
  }

  const formatJsonValue = (val: any) => {
    if (val === undefined || val === null || val === '') return null
    if (typeof val === 'object') return val
    try {
      return JSON.parse(val)
    } catch {
      return { text: String(val) }
    }
  }

  if (body.previous_value !== undefined) {
    updates.previous_value = formatJsonValue(body.previous_value)
  }

  if (body.new_value !== undefined) {
    updates.new_value = formatJsonValue(body.new_value)
  }

  if (body.metadata !== undefined && typeof body.metadata === 'object') {
    updates.metadata = body.metadata
  }

  // Tratamento específico e seguro para arquivamento
  if (body.status !== undefined) {
    const status = String(body.status).trim().toLowerCase()
    if (!VALID_STATUSES.has(status)) {
      throw createError({ statusCode: 400, message: `Status inválido: ${status}` })
    }
    updates.status = status
    if (status === 'archived') {
      updates.archived_at = new Date().toISOString()
      updates.archived_by = adminIdentity.adminId || null
    } else if (status === 'active') {
      updates.archived_at = null
      updates.archived_by = null
    }
  }

  // PROTEÇÃO ESTRITA: Campos imutáveis de criação e auditoria nunca aceitos do body
  delete updates.created_by
  delete updates.created_by_email_snapshot
  delete updates.created_at

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  try {
    const url = `${config.supabaseUrl}/rest/v1/marketing_change_log?id=eq.${encodeURIComponent(id)}`
    const updated = await $fetch<any[]>(url, {
      method: 'PATCH',
      headers,
      body: updates
    })

    if (!updated || updated.length === 0) {
      throw createError({ statusCode: 404, message: 'Registro de alteração não encontrado.' })
    }

    return {
      success: true,
      item: updated[0]
    }
  } catch (error: any) {
    console.error(`[admin/marketing/change-log] Erro ao atualizar alteração ${id}:`, error?.message)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Erro ao atualizar alteração de marketing'
    })
  }
})
