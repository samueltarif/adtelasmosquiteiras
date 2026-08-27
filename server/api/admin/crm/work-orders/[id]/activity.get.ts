import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'

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
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da OS é obrigatório'
    })
  }

  const selectFields = 'id,client_id,work_order_id,entity_type,entity_id,acao,dados_anteriores,dados_novos,descricao_humana,actor_id,occurred_at'

  try {
    const activities = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/crm_activity_log?work_order_id=eq.${id}&select=${selectFields}&order=occurred_at.desc&limit=50`,
      {
        headers: getSupabaseHeaders(config.supabaseServiceRoleKey)
      }
    )

    return {
      activities: Array.isArray(activities) ? activities : []
    }
  } catch (err: any) {
    console.error('[WorkOrderActivityList] Erro ao listar timeline da OS:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao listar histórico da ordem de serviço'
    })
  }
})
