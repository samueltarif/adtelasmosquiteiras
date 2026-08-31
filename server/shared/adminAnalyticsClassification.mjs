/**
 * Classificação e Normalização de Leads e Canais para Analytics
 * Arquivo: server/shared/adminAnalyticsClassification.mjs
 */

export const PHASE_B_START_ISO = '2026-08-24T11:27:35.488Z'

export const KNOWN_MANUAL_VALIDATION_RECORD_IDS = new Set([
  'a6216770-cfc7-46d9-a548-ccf00eea7ea6',
  '71f635d2-5238-45b9-ac8d-2af04b9d9489'
])

export const KNOWN_MANUAL_VALIDATION_SUBMISSION_IDS = new Set([
  'd995d499-85c1-43e5-b77c-4b576b4c70be'
])

export function classifyLeadRecord(lead) {
  if (!lead) {
    return { category: 'REAL', reason: 'empty-record' }
  }

  const id = lead.id ? String(lead.id).trim() : ''
  const submissionId = lead.submission_id ? String(lead.submission_id).trim() : ''
  const nome = (lead.nome || '').trim()
  const email = (lead.email || '').toLowerCase().trim()
  const telefone = (lead.telefone || '').replace(/\D/g, '')
  const mensagem = (lead.mensagem || '').toLowerCase()
  const observacoes = (lead.observacoes || '').toLowerCase()

  if (id && KNOWN_MANUAL_VALIDATION_RECORD_IDS.has(id)) {
    return { category: 'MANUAL_VALIDATION_TEST', reason: 'known-manual-validation-record-id' }
  }

  if (submissionId && KNOWN_MANUAL_VALIDATION_SUBMISSION_IDS.has(submissionId)) {
    return { category: 'MANUAL_VALIDATION_TEST', reason: 'known-manual-validation-submission-id' }
  }

  if (nome.startsWith('Lead WhatsApp')) {
    return { category: 'LEGACY_SYNTHETIC', reason: 'legacy-whatsapp-synthetic' }
  }

  if (
    nome.includes('Teste Automatizado') ||
    email.includes('teste_auto') ||
    email.includes('@test.com') ||
    mensagem.includes('teste automatizado') ||
    mensagem.includes('teste de carga')
  ) {
    return { category: 'AUTOMATED_TEST', reason: 'automated-test-pattern' }
  }

  const nomeLower = nome.toLowerCase()
  if (
    nomeLower.includes('teste validação') ||
    nomeLower.includes('teste validacao') ||
    nomeLower.includes('teste fase b') ||
    nomeLower.includes('teste c.0') ||
    nomeLower.includes('teste manuak') ||
    nomeLower.includes('teste manual') ||
    nomeLower.includes('teste final') ||
    nomeLower === 'teste' ||
    telefone === '11999999999' ||
    telefone === '11999998888' ||
    telefone === '11988887777' ||
    email.includes('teste_fase_') ||
    email.includes('validador@') ||
    observacoes.includes('validação manual')
  ) {
    return { category: 'MANUAL_VALIDATION_TEST', reason: 'manual-test-pattern' }
  }

  return { category: 'REAL', reason: 'commercial-lead' }
}

export function normalizeChannel(rawChannel) {
  if (!rawChannel || String(rawChannel).trim() === '' || rawChannel === 'null' || rawChannel === 'undefined') {
    return 'unknown_legacy'
  }
  return String(rawChannel).trim()
}

export function getChannelLabel(channel) {
  const norm = normalizeChannel(channel)
  const labels = {
    google_organic: 'Google (Orgânico)',
    google_ads: 'Google Ads (Pago)',
    instagram: 'Instagram',
    facebook: 'Facebook',
    direct: 'Tráfego Direto',
    referral: 'Outros Sites (Referral)',
    whatsapp: 'WhatsApp Direto',
    unknown_legacy: 'Não atribuído / Histórico'
  }
  return labels[norm] || norm
}

export function getIdentityStartUtc(startUtc) {
  const startMs = new Date(startUtc).getTime()
  const phaseBMs = new Date(PHASE_B_START_ISO).getTime()
  return startMs < phaseBMs ? PHASE_B_START_ISO : startUtc
}
