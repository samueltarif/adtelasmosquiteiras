import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import type { DismissWhatsappAttributionPayload } from '~/types/adminWhatsappAttribution'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const attributionId = event.context.params?.id || ''
  const body = await readBody<DismissWhatsappAttributionPayload>(event).catch(() => ({} as DismissWhatsappAttributionPayload))

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  if (!attributionId || attributionId.length < 10) {
    throw createError({ statusCode: 400, message: 'ID da atribuição inválido.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Obter atribuição atual
  const currentRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/whatsapp_attributions?id=eq.${attributionId}`, {
    headers
  })

  if (!Array.isArray(currentRes) || currentRes.length === 0) {
    throw createError({ statusCode: 404, message: 'Atribuição WhatsApp não encontrada.' })
  }

  const currentAttr = currentRes[0]

  // Regra 11: dismissed deve exigir dismissed_by e dismissed_at
  const dismissedAt = new Date().toISOString()
  const updatePayload = {
    attribution_status: 'dismissed',
    dismissed_by: admin.userId,
    dismissed_at: dismissedAt,
    notes: body.notes?.trim() || currentAttr.notes || null,
    updated_at: dismissedAt
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
      throw new Error('Falha ao dispensar atribuição.')
    }

    return {
      success: true,
      attribution: updated[0]
    }
  } catch (err: any) {
    console.error('[whatsapp-attributions/dismiss] Erro ao dispensar atribuição:', err)
    throw createError({ statusCode: 500, message: err?.message || 'Erro ao dispensar atribuição WhatsApp.' })
  }
})
