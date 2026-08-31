/**
 * Utilitário para rastreamento de conversão de formulários e idempotência na sessão.
 * LOC <= 200
 */

const CONVERSION_STORAGE_PREFIX = 'google_ads_form_conversion:'

/**
 * Verifica se esta submissão já teve conversão reportada nesta sessão
 * @param {string} submissionId
 * @returns {boolean}
 */
export function hasConversionBeenReported(submissionId) {
  if (!submissionId || typeof window === 'undefined') return false
  try {
    return !!window.sessionStorage.getItem(`${CONVERSION_STORAGE_PREFIX}${submissionId}`)
  } catch {
    return false
  }
}

/**
 * Marca uma submissão como reportada na sessionStorage (sem PII)
 * @param {string} submissionId
 */
export function markConversionAsReported(submissionId) {
  if (!submissionId || typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(`${CONVERSION_STORAGE_PREFIX}${submissionId}`, String(Date.now()))
  } catch {}
}

/**
 * Dispara conversão do Google Ads e evento canônico no dataLayer
 * garantindo idempotência estrita por submission_id (Single Source of Truth).
 *
 * @param {string} submissionId UUID da submissão
 * @returns {boolean} true se disparou, false se já havia sido reportada
 */
export function reportFormConversion(submissionId) {
  if (!submissionId) return false
  if (hasConversionBeenReported(submissionId)) {
    if (import.meta.dev) {
      console.log(`[formConversion] Conversão ignorada (já reportada para ${submissionId})`)
    }
    return false
  }

  // 1. Google Ads Conversion
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      'send_to': 'AW-17981093809/4GwPCPCPWSjoccELHvhv5C'
    })
  }

  // 2. dataLayer Canonical Event
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'lead_form_success',
      submission_id: submissionId
    })
  }

  // 3. Registrar na sessionStorage (sem PII)
  markConversionAsReported(submissionId)
  return true
}
