import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import { logCrmActivity, getSupabaseHeaders } from '../../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const addressId = getRouterParam(event, 'addressId')
  const body = await readBody(event).catch(() => ({}))

  if (!id || !addressId) {
    throw createError({ statusCode: 400, message: 'ID do cliente e do endereço são obrigatórios.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const patchPayload: Record<string, any> = {}
  const changedFields: string[] = []

  if (body.rotulo !== undefined) {
    patchPayload.rotulo = body.rotulo ? String(body.rotulo).trim() : 'Principal'
    changedFields.push('rotulo')
  }
  if (body.tipo_imovel !== undefined) {
    patchPayload.tipo_imovel = body.tipo_imovel
    changedFields.push('tipo_imovel')
  }
  if (body.cep !== undefined) {
    patchPayload.cep = body.cep ? String(body.cep).trim() : null
    changedFields.push('cep')
  }
  if (body.logradouro !== undefined) {
    patchPayload.logradouro = body.logradouro ? String(body.logradouro).trim() : null
    changedFields.push('logradouro')
  }
  if (body.numero !== undefined) {
    patchPayload.numero = body.numero ? String(body.numero).trim() : null
    changedFields.push('numero')
  }
  if (body.complemento !== undefined) {
    patchPayload.complemento = body.complemento ? String(body.complemento).trim() : null
    changedFields.push('complemento')
  }
  if (body.bairro !== undefined) {
    patchPayload.bairro = body.bairro ? String(body.bairro).trim() : null
    changedFields.push('bairro')
  }
  if (body.cidade !== undefined) {
    patchPayload.cidade = body.cidade ? String(body.cidade).trim() : 'São Paulo'
    changedFields.push('cidade')
  }
  if (body.uf !== undefined) {
    patchPayload.uf = body.uf ? String(body.uf).trim().toUpperCase() : 'SP'
    changedFields.push('uf')
  }
  if (body.referencia !== undefined) {
    patchPayload.referencia = body.referencia ? String(body.referencia).trim() : null
    changedFields.push('referencia')
  }
  if (body.observacoes_acesso !== undefined) {
    patchPayload.observacoes_acesso = body.observacoes_acesso ? String(body.observacoes_acesso).trim() : null
    changedFields.push('observacoes_acesso')
  }
  if (body.is_archived !== undefined) {
    const isArchived = Boolean(body.is_archived)
    patchPayload.is_archived = isArchived
    patchPayload.archived_at = isArchived ? new Date().toISOString() : null
    changedFields.push('is_archived')
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // Tratamento de troca de endereço principal com compensação
  let previousPrincipalId: string | null = null
  if (body.is_principal === true) {
    try {
      const currentPrincipals = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/client_addresses?select=id&client_id=eq.${id}&is_principal=eq.true&id=neq.${addressId}`,
        { headers }
      )
      if (Array.isArray(currentPrincipals) && currentPrincipals.length > 0) {
        previousPrincipalId = currentPrincipals[0].id
        await $fetch(`${config.supabaseUrl}/rest/v1/client_addresses?id=eq.${previousPrincipalId}`, {
          method: 'PATCH',
          headers,
          body: { is_principal: false }
        })
      }
    } catch (swapErr) {
      console.warn('[addresses/patch] Falha ao desmarcar principal anterior:', swapErr)
    }
    patchPayload.is_principal = true
    changedFields.push('is_principal')
  } else if (body.is_principal === false) {
    patchPayload.is_principal = false
    changedFields.push('is_principal')
  }

  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/client_addresses?id=eq.${addressId}&client_id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: patchPayload
    })

    if (!Array.isArray(res) || res.length === 0) {
      if (previousPrincipalId) {
        await $fetch(`${config.supabaseUrl}/rest/v1/client_addresses?id=eq.${previousPrincipalId}`, {
          method: 'PATCH',
          headers,
          body: { is_principal: true }
        }).catch(() => {})
      }
      throw createError({ statusCode: 404, message: 'Endereço não encontrado.' })
    }

    const updated = res[0]

    await logCrmActivity(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      {
        clientId: id,
        entityType: 'address',
        entityId: addressId,
        acao: 'address_updated',
        descricaoHumana: `Endereço '${updated.rotulo}' atualizado.`,
        dadosNovos: { address_id: addressId, changed_fields: changedFields, is_principal: updated.is_principal },
        actorId: admin.userId
      }
    )

    return {
      success: true,
      address: updated
    }
  } catch (err: any) {
    if (previousPrincipalId) {
      await $fetch(`${config.supabaseUrl}/rest/v1/client_addresses?id=eq.${previousPrincipalId}`, {
        method: 'PATCH',
        headers,
        body: { is_principal: true }
      }).catch(() => {})
    }
    if (err.statusCode) throw err
    console.error('[addresses/patch] Erro ao atualizar endereço:', err)
    throw createError({ statusCode: 500, message: 'Erro ao atualizar endereço.' })
  }
})
