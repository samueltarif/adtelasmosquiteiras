/**
 * whatsappLeadEmailNotifier.ts
 * =====================================================================
 * Lógica PURA de claim, envio e recovery de notificação de e-mail
 * para leads WhatsApp Gate.
 *
 * REGRAS DE NEGÓCIO:
 *   - 1 lead = máximo 1 notificação de novo lead enviada com sucesso
 *   - Cliques adicionais do mesmo lead NÃO reenviam e-mail se status=sent
 *   - sending stale (>EMAIL_SENDING_STALE_MINUTES) é elegível para recovery
 *   - failed é elegível para retry
 *   - sent é terminal — não reenvia
 *
 * STALE THRESHOLD: 5 minutos
 * =====================================================================
 */

export const EMAIL_SENDING_STALE_MINUTES = 5

export type EmailNotificationStatus = 'pending' | 'sending' | 'sent' | 'failed'

export interface LeadEmailState {
  id: string
  notification_email_status: EmailNotificationStatus | null
  notification_email_attempts: number | null
  notification_email_last_attempt_at: string | null
}

export interface EmailClaimResult {
  claimed: boolean
  reason: 'ok' | 'already_sent' | 'recently_sending' | 'no_rows' | 'error'
  row?: LeadEmailState
}

/**
 * Determina se um lead em status "sending" é stale (elegível para recovery).
 */
export function isSendingStale(lastAttemptAt: string | null | undefined, staleMinutes = EMAIL_SENDING_STALE_MINUTES): boolean {
  if (!lastAttemptAt) return true // sem timestamp → stale por segurança
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000)
  return new Date(lastAttemptAt) < cutoff
}

/**
 * Determina se o lead é elegível para claim de notificação.
 *
 * Elegíveis:
 *   - pending
 *   - failed
 *   - sending + stale (lastAttempt > 5 min atrás)
 *
 * Não elegíveis:
 *   - sent (terminal)
 *   - sending + recente (outro processo pode estar enviando)
 */
export function isEligibleForEmailClaim(lead: LeadEmailState, staleMinutes = EMAIL_SENDING_STALE_MINUTES): { eligible: boolean; reason: EmailClaimResult['reason'] } {
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

  // pending, failed, null
  return { eligible: true, reason: 'ok' }
}

/**
 * Interface para o adaptador de banco de dados.
 * Permite mock completo nos testes sem dependência de $fetch.
 */
export interface LeadEmailDbAdapter {
  /**
   * Claim atômico: atualiza o lead para "sending" somente se elegível.
   * Retorna o registro atualizado se o claim foi adquirido, [] caso contrário.
   * Deve ser implementado como UPDATE atômico (não SELECT + UPDATE separados).
   */
  atomicClaim(leadId: string, now: Date, staleMinutes: number): Promise<LeadEmailState[]>

  /**
   * Marca o lead como sent após sendMail bem-sucedido.
   */
  markSent(leadId: string, now: Date): Promise<void>

  /**
   * Marca o lead como failed com mensagem de erro sanitizada.
   */
  markFailed(leadId: string, errorMessage: string, now: Date): Promise<void>
}

/**
 * Executa o fluxo completo de notificação de forma isolada e testável.
 *
 * @param leadId - ID do lead a notificar
 * @param db - Adaptador de banco de dados (real ou mock)
 * @param sendEmailFn - Função que realiza o envio SMTP (real ou mock)
 * @param staleMinutes - Threshold para considerar "sending" como stale
 */
export async function runEmailNotificationTask(
  leadId: string,
  db: LeadEmailDbAdapter,
  sendEmailFn: () => Promise<void>,
  staleMinutes = EMAIL_SENDING_STALE_MINUTES
): Promise<{ success: boolean; skipped: boolean; reason: string }> {
  const now = new Date()

  let claimedRows: LeadEmailState[]
  try {
    claimedRows = await db.atomicClaim(leadId, now, staleMinutes)
  } catch (err: any) {
    return { success: false, skipped: false, reason: `claim_error: ${err?.message}` }
  }

  if (!Array.isArray(claimedRows) || claimedRows.length === 0) {
    // Claim não adquirido: lead já está sent, ou outro processo está enviando (sending recente)
    return { success: false, skipped: true, reason: 'claim_not_acquired' }
  }

  try {
    await sendEmailFn()
    await db.markSent(leadId, now)
    return { success: true, skipped: false, reason: 'sent' }
  } catch (err: any) {
    const safeError = String(err?.message || err).replace(/password|token|secret|key/gi, '***')
    try {
      await db.markFailed(leadId, safeError, now)
    } catch {}
    return { success: false, skipped: false, reason: `smtp_error: ${safeError}` }
  }
}
