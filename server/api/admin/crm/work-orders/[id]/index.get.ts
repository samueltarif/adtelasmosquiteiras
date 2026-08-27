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
      statusMessage: 'ID da ordem de serviço é obrigatório'
    })
  }

  const selectFields = 'id,numero_os,client_id,address_id,responsible_staff_id,status_os,valor_total,valor_desconto,valor_final,proposal_issued_at,proposal_valid_until,data_prevista,data_conclusao,observacoes_gerais,is_archived,archived_at,created_at,updated_at,client:clients(id,nome,telefone_principal,email,cpf_cnpj,tipo_cliente,status),address:client_addresses(id,rotulo,tipo_imovel,cep,logradouro,numero,complemento,bairro,cidade,uf),responsible:crm_staff(id,nome,telefone,email,funcao)'

  try {
    const res = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=${selectFields}`,
      {
        headers: getSupabaseHeaders(config.supabaseServiceRoleKey)
      }
    )

    if (!Array.isArray(res) || res.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Ordem de serviço não encontrada'
      })
    }

    const workOrder = res[0]

    return {
      workOrder
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[WorkOrderDetail] Erro ao buscar OS:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao buscar dados da ordem de serviço'
    })
  }
})
