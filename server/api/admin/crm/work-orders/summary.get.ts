import { defineEventHandler, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  try {
    // Busca todas as ordens de serviço ativas para agregação precisa e segura
    const res = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_orders?select=id,status_os,valor_final,data_conclusao,is_archived&is_archived=eq.false`,
      {
        headers: getSupabaseHeaders(config.supabaseServiceRoleKey)
      }
    )

    const list = Array.isArray(res) ? res : []

    let totalOpen = 0
    let inExecution = 0
    let completedThisMonth = 0
    let openValue = 0

    for (const wo of list) {
      const status = wo.status_os
      const val = Number(wo.valor_final) || 0

      if (['orcamento', 'aprovada', 'aguardando_agendamento', 'agendada'].includes(status)) {
        totalOpen++
        openValue += val
      } else if (status === 'em_execucao') {
        inExecution++
        openValue += val
      } else if (status === 'concluida') {
        if (wo.data_conclusao && wo.data_conclusao >= firstDayOfMonth) {
          completedThisMonth++
        }
      }
    }

    return {
      summary: {
        totalOpen,
        inExecution,
        completedThisMonth,
        openValue: Math.round(openValue * 100) / 100,
        totalActive: list.length
      }
    }
  } catch (err: any) {
    console.error('[WorkOrdersSummary] Erro ao calcular sumário de OS:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao obter sumário das ordens de serviço'
    })
  }
})
