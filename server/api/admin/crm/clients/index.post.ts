import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  ALLOWED_CLIENT_TIPOS,
  normalizePhone,
  normalizeEmail,
  normalizeCpfCnpj,
  isValidBrazilianPhone,
  isValidCpfCnpj,
  findDuplicateClients,
  logCrmActivity,
  getSupabaseHeaders
} from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const body = await readBody(event).catch(() => ({}))

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  // 1. Validações básicas
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  if (!nome || nome.length < 2) {
    throw createError({ statusCode: 400, message: 'O nome do cliente deve ter pelo menos 2 caracteres.' })
  }

  const telefoneRaw = typeof body.telefone_principal === 'string' ? body.telefone_principal : ''
  if (!isValidBrazilianPhone(telefoneRaw)) {
    throw createError({ statusCode: 400, message: 'Informe um telefone válido com DDD (10 ou 11 dígitos).' })
  }
  const telefonePrincipal = normalizePhone(telefoneRaw)

  const tipoCliente = ALLOWED_CLIENT_TIPOS.includes(body.tipo_cliente) ? body.tipo_cliente : 'pessoa_fisica'

  let email: string | null = null
  if (body.email && typeof body.email === 'string' && body.email.trim()) {
    email = normalizeEmail(body.email)
    if (!email) {
      throw createError({ statusCode: 400, message: 'O e-mail informado é inválido.' })
    }
  }

  let cpfCnpj: string | null = null
  if (body.cpf_cnpj && typeof body.cpf_cnpj === 'string' && body.cpf_cnpj.trim()) {
    cpfCnpj = normalizeCpfCnpj(body.cpf_cnpj)
    if (!isValidCpfCnpj(cpfCnpj)) {
      throw createError({ statusCode: 400, message: 'O CPF ou CNPJ informado é inválido.' })
    }
  }

  const telefoneSecundario = body.telefone_secundario && typeof body.telefone_secundario === 'string'
    ? normalizePhone(body.telefone_secundario) || null
    : null

  const nomeFantasia = body.nome_fantasia && typeof body.nome_fantasia === 'string' ? body.nome_fantasia.trim() || null : null
  const razaoSocial = body.razao_social && typeof body.razao_social === 'string' ? body.razao_social.trim() || null : null
  const observacoes = body.observacoes && typeof body.observacoes === 'string' ? body.observacoes.trim() || null : null

  // 2. Server-side duplicate warning gate
  const confirmPossibleDuplicate = body.confirmPossibleDuplicate === true || body.confirmPossibleDuplicate === 'true'
  if (!confirmPossibleDuplicate) {
    const duplicates = await findDuplicateClients(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      { telefone: telefonePrincipal, email, cpfCnpj }
    )

    if (duplicates.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'POSSIBLE_DUPLICATE',
        data: {
          code: 'POSSIBLE_DUPLICATE',
          message: 'Encontramos clientes já cadastrados com dados parecidos.',
          duplicates
        }
      })
    }
  }

  // 3. Inserção do cliente
  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)
  const clientPayload = {
    nome,
    tipo_cliente: tipoCliente,
    telefone_principal: telefonePrincipal,
    telefone_secundario: telefoneSecundario,
    email,
    cpf_cnpj: cpfCnpj,
    nome_fantasia: nomeFantasia,
    razao_social: razaoSocial,
    observacoes,
    status: 'ativo',
    is_archived: false,
    created_by: admin.userId
  }

  let createdClient: any = null
  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/clients`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: clientPayload
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw new Error('Falha ao inserir cliente no banco.')
    }
    createdClient = res[0]
  } catch (err: any) {
    console.error('[clients/create] Erro ao criar cliente:', err)
    throw createError({ statusCode: 500, message: err?.message || 'Erro ao criar cliente.' })
  }

  // 4. Vínculo com Atribuição WhatsApp se houver ref_whatsapp (Fase 1.1 Parte 3A)
  const rawRef = typeof body.ref_whatsapp === 'string' ? body.ref_whatsapp.trim().toUpperCase() : ''
  if (rawRef && /^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(rawRef)) {
    try {
      const attrRes = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/whatsapp_attributions?short_code=eq.${rawRef}`, {
        headers
      })

      if (Array.isArray(attrRes) && attrRes.length > 0) {
        const attr = attrRes[0]
        if (attr.attribution_status === 'unassigned') {
          const nowIso = new Date().toISOString()
          await $fetch(`${config.supabaseUrl}/rest/v1/whatsapp_attributions?id=eq.${attr.id}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: {
              client_id: createdClient.id,
              attribution_status: 'assigned',
              confidence_level: 'confirmed',
              match_method: 'exact_code',
              assigned_by: admin.userId,
              assigned_at: nowIso,
              notes: 'Vinculado automaticamente no cadastro do cliente por código de referência exato.',
              updated_at: nowIso
            }
          })
        }
      }
    } catch (attrErr) {
      console.error('[clients/create] Falha ao vincular atribuição WhatsApp:', attrErr)
    }
  }

  // 5. Log de auditoria (com compensação defensiva se falhar)
  try {
    await logCrmActivity(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      {
        clientId: createdClient.id,
        entityType: 'client',
        entityId: createdClient.id,
        acao: 'client_created',
        descricaoHumana: `Cliente ${nome} cadastrado manualmente${rawRef ? ` (Ref. WhatsApp: ${rawRef})` : ''}.`,
        dadosNovos: { 
          client_id: createdClient.id, 
          tipo_cliente: tipoCliente,
          ref_whatsapp: rawRef || null
        },
        actorId: admin.userId
      }
    )
  } catch (logErr) {
    console.error('[clients/create] Falha no log de auditoria:', logErr)
  }

  return {
    success: true,
    client: createdClient
  }
})
