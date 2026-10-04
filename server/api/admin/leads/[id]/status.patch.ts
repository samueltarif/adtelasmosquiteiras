import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { normalizeLeadStatus, CANONICAL_LEAD_STATUSES } from '../../../../shared/leadStatusCore.mjs'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = (await readBody(event)) || {}

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do lead é obrigatório' })
  }

  const rawStatus = body.status
  const canonicalStatus = normalizeLeadStatus(rawStatus)

  if (!canonicalStatus) {
    throw createError({
      statusCode: 400,
      message: `Status inválido. Permitidos: ${CANONICAL_LEAD_STATUSES.join(', ')}`
    })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Banco indisponível' })
  }

  const headers = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  }

  try {
    // 1. Buscar lead atual
    const leadRes = await fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(id)}&select=id,nome,status`, {
      headers
    })
    const leads = await leadRes.json()
    if (!Array.isArray(leads) || leads.length === 0) {
      throw createError({ statusCode: 404, message: 'Lead não encontrado' })
    }

    const currentLead = leads[0]
    const previousStatus = currentLead.status || 'Novo'

    // 2. Atualizar status do lead
    const updateRes = await fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: canonicalStatus })
    })

    const updatedLeads = await updateRes.json()
    if (!Array.isArray(updatedLeads) || updatedLeads.length === 0) {
      throw createError({ statusCode: 500, message: 'Falha ao atualizar status do lead' })
    }

    // 3. Registrar no crm_activity_log
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/crm_activity_log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entity_type: 'lead',
          entity_id: id,
          client_id: null,
          acao: 'lead_status_changed',
          dados_anteriores: { status: previousStatus },
          dados_novos: { status: canonicalStatus },
          descricao_humana: `Status do lead alterado de "${previousStatus}" para "${canonicalStatus}"`,
          actor_id: admin.userId || null
        })
      })
    } catch (logErr) {
      console.warn('[PATCH /api/admin/leads/:id/status] Falha ao gravar crm_activity_log:', logErr)
    }

    return {
      success: true,
      lead: {
        id,
        nome: currentLead.nome,
        status: canonicalStatus,
        previous_status: previousStatus
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[PATCH /api/admin/leads/:id/status] Erro inesperado:', err)
    throw createError({ statusCode: 500, message: 'Erro ao atualizar status' })
  }
})
