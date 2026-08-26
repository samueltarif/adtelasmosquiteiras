import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import {
  ALLOWED_CLIENT_TIPOS,
  ALLOWED_CLIENT_STATUS,
  normalizePhone,
  normalizeEmail,
  normalizeCpfCnpj,
  isValidBrazilianPhone,
  isValidCpfCnpj,
  logCrmActivity,
  getSupabaseHeaders
} from '../../../../../utils/crm'

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

  const patchPayload: Record<string, any> = {}
  const changedFields: string[] = []

  if (body.nome !== undefined) {
    const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
    if (nome.length < 2) {
      throw createError({ statusCode: 400, message: 'O nome deve ter pelo menos 2 caracteres.' })
    }
    patchPayload.nome = nome
    changedFields.push('nome')
  }

  if (body.telefone_principal !== undefined) {
    if (!isValidBrazilianPhone(body.telefone_principal)) {
      throw createError({ statusCode: 400, message: 'Telefone principal inválido.' })
    }
    patchPayload.telefone_principal = normalizePhone(body.telefone_principal)
    changedFields.push('telefone_principal')
  }

  if (body.telefone_secundario !== undefined) {
    patchPayload.telefone_secundario = body.telefone_secundario ? normalizePhone(body.telefone_secundario) : null
    changedFields.push('telefone_secundario')
  }

  if (body.email !== undefined) {
    if (body.email && typeof body.email === 'string' && body.email.trim()) {
      const em = normalizeEmail(body.email)
      if (!em) throw createError({ statusCode: 400, message: 'E-mail inválido.' })
      patchPayload.email = em
    } else {
      patchPayload.email = null
    }
    changedFields.push('email')
  }

  if (body.cpf_cnpj !== undefined) {
    if (body.cpf_cnpj && typeof body.cpf_cnpj === 'string' && body.cpf_cnpj.trim()) {
      const doc = normalizeCpfCnpj(body.cpf_cnpj)
      if (!isValidCpfCnpj(doc)) throw createError({ statusCode: 400, message: 'CPF ou CNPJ inválido.' })
      patchPayload.cpf_cnpj = doc
    } else {
      patchPayload.cpf_cnpj = null
    }
    changedFields.push('cpf_cnpj')
  }

  if (body.tipo_cliente !== undefined && ALLOWED_CLIENT_TIPOS.includes(body.tipo_cliente)) {
    patchPayload.tipo_cliente = body.tipo_cliente
    changedFields.push('tipo_cliente')
  }

  if (body.status !== undefined && ALLOWED_CLIENT_STATUS.includes(body.status)) {
    patchPayload.status = body.status
    changedFields.push('status')
  }

  if (body.nome_fantasia !== undefined) {
    patchPayload.nome_fantasia = body.nome_fantasia ? String(body.nome_fantasia).trim() : null
    changedFields.push('nome_fantasia')
  }

  if (body.razao_social !== undefined) {
    patchPayload.razao_social = body.razao_social ? String(body.razao_social).trim() : null
    changedFields.push('razao_social')
  }

  if (body.observacoes !== undefined) {
    patchPayload.observacoes = body.observacoes ? String(body.observacoes).trim() : null
    changedFields.push('observacoes')
  }

  // Controle de arquivamento com autoridade de timestamp no servidor
  if (body.is_archived !== undefined) {
    const isArchived = Boolean(body.is_archived)
    patchPayload.is_archived = isArchived
    patchPayload.archived_at = isArchived ? new Date().toISOString() : null
    changedFields.push('is_archived')
  }

  if (changedFields.length === 0) {
    return { success: true, message: 'Nenhuma alteração informada.' }
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/clients?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: patchPayload
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw createError({ statusCode: 404, message: 'Cliente não encontrado para atualização.' })
    }

    const updated = res[0]
    const acao = patchPayload.is_archived ? 'client_archived' : 'client_updated'
    const desc = patchPayload.is_archived
      ? `Cliente ${updated.nome} arquivado.`
      : `Dados do cliente ${updated.nome} atualizados.`

    await logCrmActivity(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      {
        clientId: id,
        entityType: 'client',
        entityId: id,
        acao,
        descricaoHumana: desc,
        dadosNovos: { changed_fields: changedFields, is_archived: updated.is_archived },
        actorId: admin.userId
      }
    )

    return {
      success: true,
      client: updated
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[clients/patch] Erro ao atualizar cliente:', err)
    throw createError({ statusCode: 500, message: 'Erro ao atualizar dados do cliente.' })
  }
})
