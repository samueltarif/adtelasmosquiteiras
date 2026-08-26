/**
 * ======================================================================
 * CRM VALIDATION & NORMALIZATION HELPERS — AD Telas e Redes
 * ======================================================================
 * Funções puras e isomórficas para validação e sanitização de dados do CRM.
 */

export const ALLOWED_CLIENT_TIPOS = ['pessoa_fisica', 'empresa', 'condominio']
export const ALLOWED_CLIENT_STATUS = ['ativo', 'inativo', 'bloqueado']
export const ALLOWED_NOTE_CATEGORIAS = ['geral', 'atendimento', 'financeiro', 'tecnico', 'cobranca']
export const ALLOWED_CLIENT_SORT_FIELDS = ['nome', 'created_at', 'updated_at', 'tipo_cliente', 'status']
export const ALLOWED_SORT_DIRECTIONS = ['asc', 'desc']
export const ALLOWED_OS_CATEGORIAS = ['tela_mosquiteira', 'rede_protecao', 'vidracaria', 'manutencao', 'outro']

/**
 * Normaliza número de telefone removendo caracteres não numéricos.
 * Retorna string limpa (ex: "11983586611") ou vazio.
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return ''
  return phone.replace(/\D/g, '')
}

/**
 * Normaliza CPF ou CNPJ removendo pontuações.
 */
export function normalizeCpfCnpj(doc) {
  if (!doc || typeof doc !== 'string') return ''
  return doc.replace(/\D/g, '')
}

/**
 * Normaliza e valida e-mail básico.
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return ''
  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(trimmed) ? trimmed : ''
}

/**
 * Valida se um número de telefone brasileiro é válido (10 ou 11 dígitos com DDD).
 */
export function isValidBrazilianPhone(phone) {
  const digits = normalizePhone(phone)
  return digits.length === 10 || digits.length === 11
}

/**
 * Valida formato de CNPJ (14 dígitos) ou CPF (11 dígitos).
 */
export function isValidCpfCnpj(doc) {
  const digits = normalizeCpfCnpj(doc)
  return digits.length === 11 || digits.length === 14
}

/**
 * Minimiza PII para payloads de auditoria em crm_activity_log.
 */
export function minimizePiiPayload(data) {
  if (!data || typeof data !== 'object') return {}
  const safe = {}
  
  if (data.changed_fields && Array.isArray(data.changed_fields)) {
    safe.changed_fields = data.changed_fields
  }
  if (data.client_id) safe.client_id = data.client_id
  if (data.lead_id) safe.lead_id = data.lead_id
  if (data.work_order_id) safe.work_order_id = data.work_order_id
  if (data.address_id) safe.address_id = data.address_id
  if (data.note_id) safe.note_id = data.note_id
  if (data.is_principal !== undefined) safe.is_principal = Boolean(data.is_principal)
  if (data.categoria) safe.categoria = data.categoria
  if (data.is_archived !== undefined) safe.is_archived = Boolean(data.is_archived)

  return safe
}
