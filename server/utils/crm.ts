import {
  ALLOWED_CLIENT_TIPOS,
  ALLOWED_CLIENT_STATUS,
  ALLOWED_NOTE_CATEGORIAS,
  ALLOWED_CLIENT_SORT_FIELDS,
  ALLOWED_SORT_DIRECTIONS,
  ALLOWED_OS_CATEGORIAS,
  normalizePhone,
  normalizeCpfCnpj,
  normalizeEmail,
  isValidBrazilianPhone,
  isValidCpfCnpj,
  minimizePiiPayload
} from '../shared/crmValidation.mjs'

export {
  ALLOWED_CLIENT_TIPOS,
  ALLOWED_CLIENT_STATUS,
  ALLOWED_NOTE_CATEGORIAS,
  ALLOWED_CLIENT_SORT_FIELDS,
  ALLOWED_SORT_DIRECTIONS,
  ALLOWED_OS_CATEGORIAS,
  normalizePhone,
  normalizeCpfCnpj,
  normalizeEmail,
  isValidBrazilianPhone,
  isValidCpfCnpj,
  minimizePiiPayload
}

export interface SupabaseConfig {
  url: string
  serviceRoleKey: string
}

export function getSupabaseHeaders(serviceRoleKey: string) {
  return {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  }
}

/**
 * Registra um evento de auditoria no crm_activity_log com minimização estrita de PII.
 */
export async function logCrmActivity(
  config: SupabaseConfig,
  params: {
    clientId: string
    workOrderId?: string | null
    entityType: 'client' | 'address' | 'work_order' | 'work_order_item' | 'appointment' | 'payment' | 'warranty' | 'media' | 'note'
    entityId: string
    acao: string
    descricaoHumana: string
    dadosAnteriores?: Record<string, any> | null
    dadosNovos?: Record<string, any> | null
    actorId?: string | null
  }
) {
  if (!config.url || !config.serviceRoleKey) return

  const payload = {
    client_id: params.clientId,
    work_order_id: params.workOrderId || null,
    entity_type: params.entityType,
    entity_id: params.entityId,
    acao: params.acao,
    descricao_humana: params.descricaoHumana,
    dados_anteriores: params.dadosAnteriores ? minimizePiiPayload(params.dadosAnteriores) : null,
    dados_novos: params.dadosNovos ? minimizePiiPayload(params.dadosNovos) : null,
    actor_id: params.actorId || null
  }

  try {
    await $fetch(`${config.url}/rest/v1/crm_activity_log`, {
      method: 'POST',
      headers: getSupabaseHeaders(config.serviceRoleKey),
      body: payload
    })
  } catch (err: any) {
    console.error('[logCrmActivity] Erro ao gravar activity log:', err?.message || err)
    // Não propaga para não quebrar a mutação principal, mas loga
  }
}

/**
 * Busca possíveis duplicatas de clientes no banco por telefone, email ou CPF/CNPJ.
 */
export async function findDuplicateClients(
  config: SupabaseConfig,
  criteria: {
    telefone?: string | null
    email?: string | null
    cpfCnpj?: string | null
    excludeClientId?: string | null
  }
): Promise<Array<{
  id: string
  nome: string
  telefone_principal: string
  email: string | null
  cpf_cnpj: string | null
  tipo_cliente: string
  created_at: string
}>> {
  if (!config.url || !config.serviceRoleKey) return []

  const conditions: string[] = []
  const digitsPhone = normalizePhone(criteria.telefone || '')
  if (digitsPhone && digitsPhone.length >= 8) {
    // Busca por telefone com ilike ou eq
    conditions.push(`telefone_principal.ilike.*${digitsPhone.slice(-8)}*`)
  }

  const cleanEmail = normalizeEmail(criteria.email || '')
  if (cleanEmail) {
    conditions.push(`email.eq.${cleanEmail}`)
  }

  const cleanDoc = normalizeCpfCnpj(criteria.cpfCnpj || '')
  if (cleanDoc && cleanDoc.length >= 9) {
    conditions.push(`cpf_cnpj.eq.${cleanDoc}`)
  }

  if (conditions.length === 0) return []

  const orQuery = `or=(${conditions.join(',')})`
  const selectQuery = `select=id,nome,telefone_principal,email,cpf_cnpj,tipo_cliente,created_at&${orQuery}&limit=5`

  try {
    const res = await $fetch<any[]>(`${config.url}/rest/v1/clients?${selectQuery}`, {
      headers: getSupabaseHeaders(config.serviceRoleKey)
    })

    if (!Array.isArray(res)) return []
    if (criteria.excludeClientId) {
      return res.filter(c => c.id !== criteria.excludeClientId)
    }
    return res
  } catch (err: any) {
    console.error('[findDuplicateClients] Erro na busca de duplicatas:', err?.message || err)
    return []
  }
}
