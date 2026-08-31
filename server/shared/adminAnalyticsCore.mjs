/**
 * ======================================================================
 * ADMIN ANALYTICS CORE MODULE — COMPOSITION ROOT (FASE C.1.2.2)
 * ======================================================================
 * Localização: server/shared/adminAnalyticsCore.mjs
 * Módulo modularizado (arquivos <= 200 linhas).
 * ======================================================================
 */

export {
  PHASE_B_START_ISO,
  KNOWN_MANUAL_VALIDATION_RECORD_IDS,
  KNOWN_MANUAL_VALIDATION_SUBMISSION_IDS,
  classifyLeadRecord,
  normalizeChannel,
  getChannelLabel,
  getIdentityStartUtc
} from './adminAnalyticsClassification.mjs'

export {
  getSaoPauloDateRange
} from './adminAnalyticsDateRange.mjs'

export {
  fetchAllPaginated,
  safeRate,
  safeRateNum,
  computeOverviewData
} from './adminAnalyticsMetrics.mjs'

export {
  formatRecentActivityEvents
} from './adminAnalyticsActivity.mjs'
