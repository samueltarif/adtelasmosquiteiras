import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  parseSaoPauloToUtcIso,
  VALID_CHANGE_TYPES,
  VALID_SCOPES,
  VALID_ENTRY_SOURCES
} from '../../../../shared/adminMarketingChangeCore.mjs'

export default defineEventHandler(async (event) => {
  // 1. Exige Administrador Ativo (captura autoria comprovada)
  const adminIdentity = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const body = await readBody(event) || {}

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  // 2. Validação estrita de campos obrigatórios
  const title = (body.title || '').trim()
  if (!title) {
    throw createError({ statusCode: 400, message: 'O título da alteração é obrigatório.' })
  }

  const changeType = (body.change_type || '').trim().toLowerCase()
  if (!VALID_CHANGE_TYPES.has(changeType)) {
    throw createError({ statusCode: 400, message: `Tipo de alteração inválido: ${changeType}` })
  }

  const scope = (body.scope || '').trim().toLowerCase()
  if (!VALID_SCOPES.has(scope)) {
    throw createError({ statusCode: 400, message: `Escopo inválido: ${scope}` })
  }

  const rawOccurredAt = body.occurred_at || new Date().toISOString()
  const occurredAtUtc = parseSaoPauloToUtcIso(rawOccurredAt)
  if (!occurredAtUtc) {
    throw createError({ statusCode: 400, message: 'Data/hora inválida.' })
  }

  const entrySource = (body.entry_source || 'manual').trim().toLowerCase()
  if (!VALID_ENTRY_SOURCES.has(entrySource)) {
    throw createError({ statusCode: 400, message: `Origem do registro inválida: ${entrySource}` })
  }

  // Sanitização de previous_value e new_value (garante JSON serializável)
  const formatJsonValue = (val: any) => {
    if (val === undefined || val === null || val === '') return null
    if (typeof val === 'object') return val
    try {
      return JSON.parse(val)
    } catch {
      return { text: String(val) }
    }
  }

  const previousValue = formatJsonValue(body.previous_value)
  const newValue = formatJsonValue(body.new_value)
  const metadata = typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {}

  // 3. Montar payload garantindo autoria do backend (sem confiar em input de autor do frontend)
  const payload = {
    title,
    change_type: changeType,
    scope,
    entry_source: entrySource,
    occurred_at: occurredAtUtc,
    description: body.description ? String(body.description).trim() : null,
    campaign_name: body.campaign_name ? String(body.campaign_name).trim() : null,
    google_campaign_id: body.google_campaign_id ? String(body.google_campaign_id).trim() : null,
    landing_path: body.landing_path ? String(body.landing_path).trim() : null,
    previous_value: previousValue,
    new_value: newValue,
    metadata,
    created_by: adminIdentity.adminId || null,
    created_by_email_snapshot: adminIdentity.email || null,
    status: 'active'
  }

  const headers = {
    'apikey': config.supabaseServiceRoleKey,
    'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  try {
    const url = `${config.supabaseUrl}/rest/v1/marketing_change_log`
    const inserted = await $fetch<any[]>(url, {
      method: 'POST',
      headers,
      body: payload
    })

    return {
      success: true,
      item: inserted?.[0] || null
    }
  } catch (error: any) {
    console.error('[admin/marketing/change-log] Erro ao criar alteração:', error?.message)
    throw createError({
      statusCode: 500,
      message: error?.message || 'Erro ao registrar alteração de marketing'
    })
  }
})
