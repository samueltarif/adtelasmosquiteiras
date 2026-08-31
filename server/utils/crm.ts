import {
  ALLOWED_CLIENT_TIPOS,
  ALLOWED_CLIENT_STATUS,
  ALLOWED_NOTE_CATEGORIAS,
  ALLOWED_CLIENT_SORT_FIELDS,
  ALLOWED_SORT_DIRECTIONS,
  ALLOWED_WORK_ORDER_STATUSES,
  TERMINAL_WORK_ORDER_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  ALLOWED_OS_CATEGORIAS,
  ALLOWED_VAO_TIPOS,
  ALLOWED_MEDIA_ETAPAS,
  ALLOWED_MEDIA_TYPES,
  WORK_ORDER_PHOTO_MAX_BYTES,
  WORK_ORDER_VIDEO_MAX_BYTES,
  WORK_ORDER_ALLOWED_PHOTO_MIMES,
  WORK_ORDER_ALLOWED_VIDEO_MIMES,
  normalizePhone,
  normalizeCpfCnpj,
  normalizeEmail,
  isValidBrazilianPhone,
  isValidCpfCnpj,
  isValidStatusTransition,
  isValidDimensionMm,
  isValidDiscount,
  minimizePiiPayload
} from '../shared/crmValidation.mjs'

export {
  ALLOWED_CLIENT_TIPOS,
  ALLOWED_CLIENT_STATUS,
  ALLOWED_NOTE_CATEGORIAS,
  ALLOWED_CLIENT_SORT_FIELDS,
  ALLOWED_SORT_DIRECTIONS,
  ALLOWED_WORK_ORDER_STATUSES,
  TERMINAL_WORK_ORDER_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  ALLOWED_OS_CATEGORIAS,
  ALLOWED_VAO_TIPOS,
  ALLOWED_MEDIA_ETAPAS,
  ALLOWED_MEDIA_TYPES,
  WORK_ORDER_PHOTO_MAX_BYTES,
  WORK_ORDER_VIDEO_MAX_BYTES,
  WORK_ORDER_ALLOWED_PHOTO_MIMES,
  WORK_ORDER_ALLOWED_VIDEO_MIMES,
  normalizePhone,
  normalizeCpfCnpj,
  normalizeEmail,
  isValidBrazilianPhone,
  isValidCpfCnpj,
  isValidStatusTransition,
  isValidDimensionMm,
  isValidDiscount,
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

import { findDuplicateClients } from './crmDuplicateSearch.ts'

export { findDuplicateClients }

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
    const status = err?.statusCode || err?.status || 'UNKNOWN'
    console.error('[logCrmActivity] CRM_ACTIVITY_LOG_FAILED', { status })
    // Não propaga para não quebrar a mutação principal, mas loga sem PII
  }
}
