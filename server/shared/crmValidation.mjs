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

// Constantes da Fase 4.0 — Ordens de Serviço
export const ALLOWED_WORK_ORDER_STATUSES = [
  'orcamento',
  'aprovada',
  'aguardando_agendamento',
  'agendada',
  'em_execucao',
  'concluida',
  'cancelada'
]

export const TERMINAL_WORK_ORDER_STATUSES = ['concluida', 'cancelada']

export const ALLOWED_STATUS_TRANSITIONS = {
  orcamento: ['aprovada', 'cancelada'],
  aprovada: ['aguardando_agendamento', 'orcamento', 'cancelada'],
  aguardando_agendamento: ['agendada', 'em_execucao', 'aprovada', 'cancelada'],
  agendada: ['em_execucao', 'aguardando_agendamento', 'cancelada'],
  em_execucao: ['concluida', 'aguardando_agendamento', 'cancelada'],
  concluida: [],
  cancelada: []
}

export const ALLOWED_OS_CATEGORIAS = ['tela_mosquiteira', 'rede_protecao', 'vidracaria', 'manutencao', 'outro']
export const ALLOWED_VAO_TIPOS = ['janela', 'porta', 'sacada', 'maxim_ar', 'basculante', 'mezanino', 'outro']
export const ALLOWED_MEDIA_ETAPAS = ['antes', 'durante', 'depois', 'laudo']
export const ALLOWED_MEDIA_TYPES = ['photo', 'video']

export const WORK_ORDER_PHOTO_MAX_BYTES = 5242880 // 5 MB
export const WORK_ORDER_VIDEO_MAX_BYTES = 26214400 // 25 MB

export const WORK_ORDER_ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp']
export const WORK_ORDER_ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime']

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
 * Valida se uma transição de status da OS é permitida pela máquina de estados.
 */
export function isValidStatusTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false
  if (currentStatus === nextStatus) return true
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus]
  return Array.isArray(allowed) && allowed.includes(nextStatus)
}

/**
 * Valida dimensão em milímetros inteiros positivos.
 */
export function isValidDimensionMm(val) {
  const num = Number(val)
  return Number.isInteger(num) && num > 0 && num <= 100000
}

/**
 * Valida valor de desconto monetário.
 */
export function isValidDiscount(discount, total) {
  const d = Number(discount)
  const t = Number(total)
  if (isNaN(d) || d < 0) return false
  if (!isNaN(t) && d > t) return false
  return true
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
  if (data.reason_note_id) safe.reason_note_id = data.reason_note_id
  if (data.reason_recorded !== undefined) safe.reason_recorded = Boolean(data.reason_recorded)
  if (data.source) safe.source = String(data.source)
  if (data.status_anterior) safe.status_anterior = String(data.status_anterior)
  if (data.status_novo) safe.status_novo = String(data.status_novo)
  if (data.media_id) safe.media_id = data.media_id
  if (data.etapa) safe.etapa = data.etapa
  if (data.media_type) safe.media_type = data.media_type
  if (data.is_principal !== undefined) safe.is_principal = Boolean(data.is_principal)
  if (data.categoria) safe.categoria = data.categoria
  if (data.is_archived !== undefined) safe.is_archived = Boolean(data.is_archived)

  return safe
}
