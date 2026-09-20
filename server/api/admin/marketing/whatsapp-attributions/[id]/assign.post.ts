import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders, logCrmActivity } from '../../../../../utils/crm'
import type { AssignWhatsappAttributionPayload } from '~/types/adminWhatsappAttribution'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const attributionId = event.context.params?.id || ''
  const body = await readBody<AssignWhatsappAttributionPayload>(event).catch(() => ({} as AssignWhatsappAttributionPayload))

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  if (!attributionId || attributionId.length < 10) {
    throw createError({ statusCode: 400, message: 'ID da atribuição inválido.' })
  }

  const clientId = body.client_id?.trim() || null
  const leadId = body.lead_id?.trim() || null

  if (!clientId && !leadId) {
    throw createError({ statusCode: 400, message: 'Informe um Cliente ou um Lead para vincular à atribuição.' })
  }

  const matchMethod = body.match_method === 'exact_code' ? 'exact_code' : 'manual_selection'
  // Regra 14: Somente exact_code pode gerar confirmed. manual_selection SEMPRE gera probable.
  const confidenceLevel = matchMethod === 'exact_code' ? 'confirmed' : 'probable'

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Obter atribuição atual para evitar reassociação silenciosa (Regra 11)
  const currentRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/whatsapp_attributions?id=eq.${attributionId}`, {
    headers
  })

  if (!Array.isArray(currentRes) || currentRes.length === 0) {
    throw createError({ statusCode: 404, message: 'Atribuição WhatsApp não encontrada.' })
  }

  const currentAttr = currentRes[0]

  // Impede reassociação silenciosa se já estiver vinculado a outro cliente ou lead
  if (currentAttr.attribution_status === 'assigned') {
    const isDifferentClient = clientId && currentAttr.client_id && currentAttr.client_id !== clientId
    const isDifferentLead = leadId && currentAttr.lead_id && currentAttr.lead_id !== leadId

    if (isDifferentClient || isDifferentLead) {
      throw createError({
        statusCode: 409,
        message: 'Esta atribuição já está associada a outro cliente/lead. Reassociação silenciosa não é permitida.'
      })
    }
  }

  const assignedAt = new Date().toISOString()
  const updatePayload = {
    attribution_status: 'assigned',
    confidence_level: confidenceLevel,
    match_method: matchMethod,
    client_id: clientId,
    lead_id: leadId,
    assigned_by: admin.userId,
    assigned_at: assignedAt,
    notes: body.notes?.trim() || currentAttr.notes || null,
    updated_at: assignedAt
  }

  try {
    const updated = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/whatsapp_attributions?id=eq.${attributionId}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: updatePayload
    })

    if (!Array.isArray(updated) || updated.length === 0) {
      throw new Error('Falha ao atualizar atribuição.')
    }

    // 2. Registrar no log de CRM se houver cliente vinculado
    if (clientId) {
      try {
        await logCrmActivity(
          { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
          {
            clientId,
            entityType: 'client',
            entityId: clientId,
            acao: 'whatsapp_attribution_assigned',
            descricaoHumana: `Atribuição WhatsApp vinculada ao cliente (${matchMethod === 'exact_code' ? 'Código exato confirmado' : 'Seleção manual provável'}, Ref: ${currentAttr.short_code}).`,
            dadosNovos: {
              attribution_id: attributionId,
              short_code: currentAttr.short_code,
              match_method: matchMethod,
              confidence_level: confidenceLevel,
              has_click_id: !!(currentAttr.gclid || currentAttr.gbraid || currentAttr.wbraid),
              campaign_name: currentAttr.campaign_name
            },
            actorId: admin.userId
          }
        )
      } catch (logErr) {
        console.error('[whatsapp-attributions/assign] Falha ao registrar log de CRM:', logErr)
      }
    }

    return {
      success: true,
      attribution: updated[0]
    }
  } catch (err: any) {
    console.error('[whatsapp-attributions/assign] Erro ao associar atribuição:', err)
    throw createError({ statusCode: 500, message: err?.message || 'Erro ao associar atribuição WhatsApp.' })
  }
})
