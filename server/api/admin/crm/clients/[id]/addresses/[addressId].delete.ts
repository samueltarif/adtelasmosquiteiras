import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import { logCrmActivity, getSupabaseHeaders } from '../../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const addressId = getRouterParam(event, 'addressId')

  if (!id || !addressId) {
    throw createError({ statusCode: 400, message: 'ID do cliente e do endereço são obrigatórios.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Verifica vínculos em work_orders ou appointments (FK RESTRICT)
  try {
    const [woLinks, apptLinks] = await Promise.all([
      $fetch<any[]>(`${config.supabaseUrl}/rest/v1/work_orders?select=id&address_id=eq.${addressId}&limit=1`, { headers }),
      $fetch<any[]>(`${config.supabaseUrl}/rest/v1/appointments?select=id&address_id=eq.${addressId}&limit=1`, { headers })
    ])

    const hasHistory = (Array.isArray(woLinks) && woLinks.length > 0) || (Array.isArray(apptLinks) && apptLinks.length > 0)

    if (hasHistory) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ADDRESS_HAS_HISTORY',
        data: {
          code: 'ADDRESS_HAS_HISTORY',
          message: 'Este endereço possui histórico de atendimento e não pode ser excluído fisicamente. Utilize a opção de arquivar endereço.'
        }
      })
    }
  } catch (checkErr: any) {
    if (checkErr.statusCode === 409) throw checkErr
    console.warn('[addresses/delete] Erro na checagem de histórico:', checkErr)
  }

  // 2. Deleção física do endereço
  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/client_addresses?id=eq.${addressId}&client_id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      }
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw createError({ statusCode: 404, message: 'Endereço não encontrado para exclusão.' })
    }

    const deleted = res[0]

    await logCrmActivity(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      {
        clientId: id,
        entityType: 'address',
        entityId: addressId,
        acao: 'address_deleted',
        descricaoHumana: `Endereço '${deleted.rotulo}' removido.`,
        dadosNovos: { address_id: addressId },
        actorId: admin.userId
      }
    )

    return {
      success: true,
      message: 'Endereço excluído com sucesso.'
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[addresses/delete] Erro ao deletar endereço:', err)
    throw createError({ statusCode: 500, message: 'Erro ao excluir endereço.' })
  }
})
