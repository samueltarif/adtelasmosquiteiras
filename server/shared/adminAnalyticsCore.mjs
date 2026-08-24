// ======================================================================
// ADMIN ANALYTICS CORE MODULE — SINGLE SOURCE OF TRUTH (FASE C.1.2.2)
// Localização: server/shared/adminAnalyticsCore.mjs
// Compartilhado diretamente entre endpoints de servidor e testes unitários Node.js
// ======================================================================

// Timestamp REAL do PRIMEIRO evento com visitor_id confiável no Supabase
// Origem: public.page_views (id: '6c268a33-f96d-4eeb-bb5e-b0eb949b14dd')
// Visitor ID: 'fccbe5c3-803d-40fc-9937-5cb9bae93dc0'
export const PHASE_B_START_ISO = '2026-08-24T11:27:35.488Z'

// Registros específicos confirmados manualmente no Supabase como testes de validação das Fases A e B
export const KNOWN_MANUAL_VALIDATION_RECORD_IDS = new Set([
  'a6216770-cfc7-46d9-a548-ccf00eea7ea6', // Registro 1: Teste manual de validação (sem identity)
  '71f635d2-5238-45b9-ac8d-2af04b9d9489'  // Registro 2: Teste E2E de validação da Fase B (Samuel Barretos Tarif)
])

export const KNOWN_MANUAL_VALIDATION_SUBMISSION_IDS = new Set([
  'd995d499-85c1-43e5-b77c-4b576b4c70be'  // Submission ID do teste E2E da Fase B
])

/**
 * Classificador centralizado e rigoroso de leads.
 * Retorna { category, reason }
 * Categorias: REAL | LEGACY_SYNTHETIC | AUTOMATED_TEST | MANUAL_VALIDATION_TEST
 */
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

  // 1. Identificadores técnicos específicos conhecidos de validação manual
  if (id && KNOWN_MANUAL_VALIDATION_RECORD_IDS.has(id)) {
    return {
      category: 'MANUAL_VALIDATION_TEST',
      reason: 'known-manual-validation-record-id'
    }
  }

  if (submissionId && KNOWN_MANUAL_VALIDATION_SUBMISSION_IDS.has(submissionId)) {
    return {
      category: 'MANUAL_VALIDATION_TEST',
      reason: 'known-manual-validation-submission-id'
    }
  }

  // 2. Leads Sintéticos Legados da Fase A (23 registros criados para registrar cliques de WhatsApp)
  if (nome.startsWith('Lead WhatsApp')) {
    return {
      category: 'LEGACY_SYNTHETIC',
      reason: 'legacy-whatsapp-synthetic'
    }
  }

  // 3. Testes Automatizados de CI históricos
  if (
    nome.includes('Teste Automatizado') ||
    email.includes('teste_auto') ||
    email.includes('@test.com') ||
    mensagem.includes('teste automatizado') ||
    mensagem.includes('teste de carga')
  ) {
    return {
      category: 'AUTOMATED_TEST',
      reason: 'automated-test-pattern'
    }
  }

  // 4. Padrões genéricos de testes manuais de validação
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
    return {
      category: 'MANUAL_VALIDATION_TEST',
      reason: 'manual-test-pattern'
    }
  }

  // 5. Lead Comercial Real
  return {
    category: 'REAL',
    reason: 'commercial-lead'
  }
}

/**
 * Normaliza o canal de tráfego. NUNCA converte NULL/vazio em 'direct'.
 * Retorna 'unknown_legacy' se não houver canal comprovado.
 */
export function normalizeChannel(rawChannel) {
  if (!rawChannel || String(rawChannel).trim() === '' || rawChannel === 'null' || rawChannel === 'undefined') {
    return 'unknown_legacy'
  }
  return String(rawChannel).trim()
}

/**
 * Rótulo legível para o canal de tráfego
 */
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

/**
 * Retorna o piso de identidade (identityStartUtc).
 * Garante que métricas de identidade (visitors, sessions, funil) nunca cruzem para antes da Fase B.
 */
export function getIdentityStartUtc(startUtc) {
  const startMs = new Date(startUtc).getTime()
  const phaseBMs = new Date(PHASE_B_START_ISO).getTime()
  return startMs < phaseBMs ? PHASE_B_START_ISO : startUtc
}

/**
 * Calcula intervalo half-open [startUtc, endUtc) no fuso horário de São Paulo (America/Sao_Paulo, UTC-3)
 */
export function getSaoPauloDateRange(preset = 'today', customFrom, customTo) {
  const SP_OFFSET_HOURS = 3 // UTC-3
  const now = new Date()

  const nowUtc = now.getTime()
  const nowSpMs = nowUtc - SP_OFFSET_HOURS * 3600 * 1000
  const spDate = new Date(nowSpMs)

  const curYear = spDate.getUTCFullYear()
  const curMonth = spDate.getUTCMonth()
  const curDay = spDate.getUTCDate()

  const makeUtcFromSpDay = (year, month, day) => {
    return new Date(Date.UTC(year, month, day, SP_OFFSET_HOURS, 0, 0, 0))
  }

  let start
  let end
  let label = 'Hoje'

  switch (preset) {
    case 'today':
      start = makeUtcFromSpDay(curYear, curMonth, curDay)
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Hoje'
      break

    case 'yesterday':
      start = makeUtcFromSpDay(curYear, curMonth, curDay - 1)
      end = makeUtcFromSpDay(curYear, curMonth, curDay)
      label = 'Ontem'
      break

    case 'last7d':
      start = makeUtcFromSpDay(curYear, curMonth, curDay - 6)
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Últimos 7 dias'
      break

    case 'last30d':
      start = makeUtcFromSpDay(curYear, curMonth, curDay - 29)
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Últimos 30 dias'
      break

    case 'thisMonth':
      start = makeUtcFromSpDay(curYear, curMonth, 1)
      end = makeUtcFromSpDay(curYear, curMonth + 1, 1)
      label = 'Este mês'
      break

    case 'lastMonth':
      start = makeUtcFromSpDay(curYear, curMonth - 1, 1)
      end = makeUtcFromSpDay(curYear, curMonth, 1)
      label = 'Mês passado'
      break

    case 'allTime':
      start = new Date('2020-01-01T00:00:00.000Z')
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Todo o período'
      break

    case 'custom':
      if (customFrom && customTo) {
        const [fY, fM, fD] = customFrom.split('-').map(Number)
        const [tY, tM, tD] = customTo.split('-').map(Number)
        start = makeUtcFromSpDay(fY, fM - 1, fD)
        end = makeUtcFromSpDay(tY, tM - 1, tD + 1)
        label = `${customFrom} até ${customTo}`
      } else {
        start = makeUtcFromSpDay(curYear, curMonth, curDay)
        end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
        label = 'Hoje'
      }
      break

    default:
      start = makeUtcFromSpDay(curYear, curMonth, curDay)
      end = makeUtcFromSpDay(curYear, curMonth, curDay + 1)
      label = 'Hoje'
  }

  const startUtc = start.toISOString()
  const endUtc = end.toISOString()
  const identityStartUtc = getIdentityStartUtc(startUtc)
  const isLegacyOverlap = new Date(startUtc).getTime() < new Date(PHASE_B_START_ISO).getTime()

  return {
    startUtc,
    endUtc,
    identityStartUtc,
    label,
    isHalfOpen: true,
    isLegacyOverlap
  }
}

/**
 * Busca dados paginados do Supabase REST API em lotes de 1000 registros para PREVENIR truncamento.
 */
export async function fetchAllPaginated(
  baseUrl,
  table,
  queryParams,
  headers,
  batchSize = 1000,
  customFetch
) {
  const fetcher = customFetch || globalThis.$fetch
  if (!fetcher) {
    throw new Error('[fetchAllPaginated] Nenhum fetcher disponível')
  }

  const allRows = []
  let offset = 0
  let hasMore = true

  const cleanQuery = queryParams.startsWith('&') ? queryParams : `&${queryParams}`

  while (hasMore) {
    const url = `${baseUrl}/rest/v1/${table}?limit=${batchSize}&offset=${offset}${cleanQuery}`
    let chunk
    try {
      chunk = await fetcher(url, { headers })
    } catch (err) {
      console.error(`[fetchAllPaginated] Erro irrecuperável ao buscar ${table} (offset: ${offset}):`, err?.message)
      throw new Error(`Falha na paginação da tabela ${table} no offset ${offset}: ${err?.message || err}`)
    }

    if (!Array.isArray(chunk) || chunk.length === 0) {
      hasMore = false
      break
    }

    allRows.push(...chunk)
    offset += chunk.length

    if (chunk.length < batchSize) {
      hasMore = false
    }
  }

  return allRows
}

export function safeRate(numerator, denominator) {
  if (!denominator || denominator <= 0 || !numerator || numerator <= 0) {
    return '0.0%'
  }
  return ((numerator / denominator) * 100).toFixed(1) + '%'
}

export function safeRateNum(numerator, denominator) {
  if (!denominator || denominator <= 0 || !numerator || numerator <= 0) {
    return 0
  }
  return Number(((numerator / denominator) * 100).toFixed(1))
}
