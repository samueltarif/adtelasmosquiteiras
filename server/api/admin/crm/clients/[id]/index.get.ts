import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do cliente é obrigatório.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    // 1. Busca dados cadastrais do cliente + endereços vinculados
    const query = `select=id,lead_id,tipo_cliente,nome,nome_fantasia,razao_social,cpf_cnpj,telefone_principal,telefone_secundario,email,status,observacoes,is_archived,archived_at,created_at,updated_at,client_addresses(*),leads(id,nome,telefone,email,servico,valor_orcamento,cidade,status,created_at)&id=eq.${id}&client_addresses.order=is_principal.desc,created_at.asc`

    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/clients?${query}`, {
      headers
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw createError({ statusCode: 404, message: 'Cliente não encontrado.' })
    }

    const client = res[0]
    const addresses = client.client_addresses || []
    const originLead = client.leads || null

    // Remove referências aninhadas para manter o objeto do cliente limpo
    delete client.client_addresses
    delete client.leads

    return {
      success: true,
      client,
      addresses,
      originLead
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[clients/get] Erro ao carregar cliente:', err)
    throw createError({ statusCode: 500, message: 'Erro ao buscar dados do cliente.' })
  }
})
