/**
 * whatsappLeadEmailNotifier.mjs
 * =====================================================================
 * Lógica PURA de claim, lease e recovery de notificação de e-mail
 * para leads WhatsApp Gate. Versão JavaScript pura (sem TypeScript)
 * para uso em testes unitários isolados (.mjs).
 *
 * STALE THRESHOLD: 5 minutos
 * =====================================================================
 */

export const EMAIL_SENDING_STALE_MINUTES = 5

/**
 * Determina se um lead em status "sending" é stale (elegível para recovery).
 * @param {string|null} lastAttemptAt
 * @param {number} staleMinutes
 * @returns {boolean}
 */
export function isSendingStale(lastAttemptAt, staleMinutes = EMAIL_SENDING_STALE_MINUTES) {
  if (!lastAttemptAt) return true // sem timestamp → stale por segurança
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000)
  return new Date(lastAttemptAt) < cutoff
}

/**
 * Determina se o lead é elegível para claim de notificação.
 * @param {{ notification_email_status: string|null, notification_email_last_attempt_at: string|null }} lead
 * @param {number} staleMinutes
 * @returns {{ eligible: boolean, reason: string }}
 */
export function isEligibleForEmailClaim(lead, staleMinutes = EMAIL_SENDING_STALE_MINUTES) {
  const status = lead.notification_email_status

  if (status === 'sent') {
    return { eligible: false, reason: 'already_sent' }
  }

  if (status === 'sending') {
    if (isSendingStale(lead.notification_email_last_attempt_at, staleMinutes)) {
      return { eligible: true, reason: 'ok' }
    }
    return { eligible: false, reason: 'recently_sending' }
  }

  // pending, failed, null → elegível
  return { eligible: true, reason: 'ok' }
}

/**
 * Executa o fluxo completo de notificação de e-mail.
 *
 * @param {string} leadId
 * @param {object} db - LeadEmailDbAdapter
 * @param {function(): Promise<void>} sendEmailFn
 * @param {number} staleMinutes
 * @returns {Promise<{ success: boolean, skipped: boolean, reason: string }>}
 */
export async function runEmailNotificationTask(leadId, db, sendEmailFn, staleMinutes = EMAIL_SENDING_STALE_MINUTES) {
  const now = new Date()

  let claimedRows
  try {
    claimedRows = await db.atomicClaim(leadId, now, staleMinutes)
  } catch (err) {
    return { success: false, skipped: false, reason: `claim_error: ${err?.message}` }
  }

  if (!Array.isArray(claimedRows) || claimedRows.length === 0) {
    return { success: false, skipped: true, reason: 'claim_not_acquired' }
  }

  try {
    await sendEmailFn()
    await db.markSent(leadId, now)
    return { success: true, skipped: false, reason: 'sent' }
  } catch (err) {
    const safeError = String(err?.message || err).replace(/password|token|secret|key/gi, '***')
    try {
      await db.markFailed(leadId, safeError, now)
    } catch {}
    return { success: false, skipped: false, reason: `smtp_error: ${safeError}` }
  }
}
