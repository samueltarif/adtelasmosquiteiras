/**
 * leadStatusCore.mjs
 * =====================================================================
 * Módulo de validação e normalização de status canônicos de leads.
 * Status suportados:
 *   - 'Novo'
 *   - 'Em contato'
 *   - 'Sem resposta'
 *   - 'Fechado'
 *   - 'Perdido'
 * =====================================================================
 */

export const CANONICAL_LEAD_STATUSES = [
  'Novo',
  'Em contato',
  'Sem resposta',
  'Fechado',
  'Perdido'
]

const STATUS_ALIASES = {
  'novo': 'Novo',
  'em_contato': 'Em contato',
  'em contato': 'Em contato',
  'em_atendimento': 'Em contato',
  'em atendimento': 'Em contato',
  'sem_resposta': 'Sem resposta',
  'sem resposta': 'Sem resposta',
  'fechado': 'Fechado',
  'perdido': 'Perdido'
}

/**
 * Normaliza e valida um status de lead.
 * @param {string} rawStatus
 * @returns {string | null} Status canônico ou null se inválido
 */
export function normalizeLeadStatus(rawStatus) {
  if (!rawStatus || typeof rawStatus !== 'string') return null
  const cleaned = rawStatus.trim().toLowerCase()
  return STATUS_ALIASES[cleaned] || null
}

/**
 * Valida se um status é permitido.
 * @param {string} status
 * @returns {boolean}
 */
export function isValidLeadStatus(status) {
  return normalizeLeadStatus(status) !== null
}
