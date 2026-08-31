// Re-exporta a implementação canônica única de server/shared/adminAnalyticsCore.mjs com tipagem TypeScript
export {
  PHASE_B_START_ISO,
  KNOWN_MANUAL_VALIDATION_RECORD_IDS,
  KNOWN_MANUAL_VALIDATION_SUBMISSION_IDS,
  classifyLeadRecord,
  normalizeChannel,
  getChannelLabel,
  getIdentityStartUtc,
  getSaoPauloDateRange,
  fetchAllPaginated,
  safeRate,
  safeRateNum,
  computeOverviewData,
  formatRecentActivityEvents
} from '../shared/adminAnalyticsCore.mjs'

export type LeadClassification = 'REAL' | 'LEGACY_SYNTHETIC' | 'AUTOMATED_TEST' | 'MANUAL_VALIDATION_TEST'

export interface DateRangeResult {
  startUtc: string
  endUtc: string
  identityStartUtc: string
  label: string
  isHalfOpen: boolean
  isLegacyOverlap: boolean
}
