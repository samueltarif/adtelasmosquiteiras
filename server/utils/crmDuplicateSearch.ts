import { createError } from 'h3'
import {
  normalizePhone,
  normalizeEmail,
  normalizeCpfCnpj
} from '../shared/crmValidation.mjs'
import { getSupabaseHeaders, type SupabaseConfig } from './crm.ts'

export interface DuplicateClientResult {
  id: string
  nome: string
  telefone_principal: string
  email: string | null
  cpf_cnpj: string | null
  tipo_cliente: string
  created_at: string
}

export interface DuplicateSearchCriteria {
  telefone?: string | null
  email?: string | null
  cpfCnpj?: string | null
  excludeClientId?: string | null
}

const DUPLICATE_SELECT = 'id,nome,telefone_principal,email,cpf_cnpj,tipo_cliente,created_at'

/**
 * Busca possíveis duplicatas de clientes no Supabase de forma segura e determinística.
 * Executa consultas independentes para telefone, email e CPF/CNPJ sem uso de raw postgrest OR.
 * FAIL-CLOSED: Em caso de falha de upstream em qualquer consulta necessária, lança 503.
 * ZERO PII LOGGING: Nunca loga dados pessoais ou strings de query em logs de erro.
 */
export async function findDuplicateClients(
  config: SupabaseConfig,
  criteria: DuplicateSearchCriteria
): Promise<DuplicateClientResult[]> {
  if (!config.url || !config.serviceRoleKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'DUPLICATE_SEARCH_UNAVAILABLE',
      message: 'Serviço de busca de duplicidades indisponível.'
    })
  }

  const queries: Promise<DuplicateClientResult[]>[] = []
  const headers = getSupabaseHeaders(config.serviceRoleKey)

  // 1. Busca por Telefone (últimos 8 dígitos)
  const digitsPhone = normalizePhone(criteria.telefone || '')
  if (digitsPhone && digitsPhone.length >= 8) {
    const last8 = digitsPhone.slice(-8)
    const phoneParam = `telefone_principal=ilike.*${encodeURIComponent(last8)}*`
    const url = `${config.url}/rest/v1/clients?select=${DUPLICATE_SELECT}&${phoneParam}&limit=5`
    queries.push(
      $fetch<DuplicateClientResult[]>(url, { headers }).then(res => Array.isArray(res) ? res : [])
    )
  }

  // 2. Busca por E-mail
  const cleanEmail = normalizeEmail(criteria.email || '')
  if (cleanEmail) {
    const emailParam = `email=eq.${encodeURIComponent(cleanEmail)}`
    const url = `${config.url}/rest/v1/clients?select=${DUPLICATE_SELECT}&${emailParam}&limit=5`
    queries.push(
      $fetch<DuplicateClientResult[]>(url, { headers }).then(res => Array.isArray(res) ? res : [])
    )
  }

  // 3. Busca por CPF / CNPJ
  const cleanDoc = normalizeCpfCnpj(criteria.cpfCnpj || '')
  if (cleanDoc && cleanDoc.length >= 9) {
    const docParam = `cpf_cnpj=eq.${encodeURIComponent(cleanDoc)}`
    const url = `${config.url}/rest/v1/clients?select=${DUPLICATE_SELECT}&${docParam}&limit=5`
    queries.push(
      $fetch<DuplicateClientResult[]>(url, { headers }).then(res => Array.isArray(res) ? res : [])
    )
  }

  // Se nenhum critério foi fornecido, retorna lista vazia
  if (queries.length === 0) {
    return []
  }

  let results: DuplicateClientResult[][]
  try {
    results = await Promise.all(queries)
  } catch (err: any) {
    // Zero PII logging: loga apenas o status técnico
    const status = err?.statusCode || err?.status || 500
    console.error('[findDuplicateClients] DUPLICATE_SEARCH_UNAVAILABLE', { status })
    throw createError({
      statusCode: 503,
      statusMessage: 'DUPLICATE_SEARCH_UNAVAILABLE',
      message: 'Serviço de busca de duplicidades temporariamente indisponível.'
    })
  }

  // Unir e deduplicar por ID
  const map = new Map<string, DuplicateClientResult>()
  for (const list of results) {
    for (const item of list) {
      if (item && item.id) {
        if (criteria.excludeClientId && item.id === criteria.excludeClientId) {
          continue
        }
        map.set(item.id, item)
      }
    }
  }

  return Array.from(map.values()).slice(0, 10)
}
