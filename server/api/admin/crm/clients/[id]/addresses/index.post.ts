import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import { logCrmActivity, getSupabaseHeaders } from '../../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event).catch(() => ({}))

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do cliente é obrigatório.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const rotulo = typeof body.rotulo === 'string' && body.rotulo.trim() ? body.rotulo.trim() : 'Principal'
  const tipoImovel = typeof body.tipo_imovel === 'string' ? body.tipo_imovel : 'outro'
  const cep = body.cep ? String(body.cep).trim() : null
  const logradouro = body.logradouro ? String(body.logradouro).trim() : null
  const numero = body.numero ? String(body.numero).trim() : null
  const complemento = body.complemento ? String(body.complemento).trim() : null
  const bairro = body.bairro ? String(body.bairro).trim() : null
  const cidade = body.cidade ? String(body.cidade).trim() : 'São Paulo'
  const uf = body.uf ? String(body.uf).trim().toUpperCase() : 'SP'
  const referencia = body.referencia ? String(body.referencia).trim() : null
  const observacoesAcesso = body.observacoes_acesso ? String(body.observacoes_acesso).trim() : null
  const isPrincipal = Boolean(body.is_principal)

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // Estratégia de compensação: se o novo endereço for principal, desmarca o anterior primeiro
  let previousPrincipalId: string | null = null
  if (isPrincipal) {
    try {
      const currentPrincipals = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/client_addresses?select=id&client_id=eq.${id}&is_principal=eq.true`,
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
      console.warn('[addresses/create] Falha ao desmarcar principal anterior:', swapErr)
    }
  }

  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/client_addresses`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: {
        client_id: id,
        rotulo,
        tipo_imovel: tipoImovel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        referencia,
        observacoes_acesso: observacoesAcesso,
        is_principal: isPrincipal,
        is_archived: false
      }
    })

    if (!Array.isArray(res) || res.length === 0) {
      // Falhou inserção -> se desmarcou o anterior, tenta compensar restaurando
      if (previousPrincipalId) {
        await $fetch(`${config.supabaseUrl}/rest/v1/client_addresses?id=eq.${previousPrincipalId}`, {
          method: 'PATCH',
          headers,
          body: { is_principal: true }
        }).catch(() => {})
      }
      throw new Error('Falha ao cadastrar endereço.')
    }

    const createdAddress = res[0]

    await logCrmActivity(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      {
        clientId: id,
        entityType: 'address',
        entityId: createdAddress.id,
        acao: 'address_created',
        descricaoHumana: `Endereço '${rotulo}' cadastrado.`,
        dadosNovos: { address_id: createdAddress.id, is_principal: isPrincipal },
        actorId: admin.userId
      }
    )

    return {
      success: true,
      address: createdAddress
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
    console.error('[addresses/create] Erro ao cadastrar endereço:', err)
    throw createError({ statusCode: 500, message: err?.message || 'Erro ao cadastrar endereço.' })
  }
})
