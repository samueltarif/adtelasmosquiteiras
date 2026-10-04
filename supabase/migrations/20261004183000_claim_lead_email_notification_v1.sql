-- =========================================================================
-- Migration: claim_lead_email_notification_v1
-- Claim atômico de notificação de e-mail com lease para recovery de stale
--
-- REGRAS DE ELEGIBILIDADE:
--   - status = 'pending'                               → elegível
--   - status = 'failed'                                → elegível (retry)
--   - status = 'sending' AND last_attempt < stale_cutoff → elegível (stale recovery)
--   - status = 'sent'                                  → NÃO elegível (terminal)
--   - status = 'sending' AND last_attempt >= stale_cutoff → NÃO elegível (em progresso)
--
-- ATOMICIDADE: UPDATE com WHERE condicional — sem SELECT separado.
-- Somente 1 chamada concorrente adquire o lock (por design do Postgres MVCC).
-- =========================================================================

CREATE OR REPLACE FUNCTION claim_lead_email_notification_v1(
  p_lead_id     UUID,
  p_stale_cutoff TIMESTAMPTZ,  -- now() - 5 min
  p_now         TIMESTAMPTZ
)
RETURNS TABLE (
  id                                UUID,
  notification_email_status         TEXT,
  notification_email_attempts       INT,
  notification_email_last_attempt_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE leads
  SET
    notification_email_status          = 'sending',
    notification_email_attempts        = COALESCE(notification_email_attempts, 0) + 1,
    notification_email_last_attempt_at = p_now,
    notification_email_last_error      = NULL
  WHERE
    leads.id = p_lead_id
    AND (
      notification_email_status = 'pending'
      OR notification_email_status = 'failed'
      OR (
        notification_email_status = 'sending'
        AND (
          notification_email_last_attempt_at IS NULL
          OR notification_email_last_attempt_at < p_stale_cutoff
        )
      )
    )
  RETURNING
    leads.id,
    leads.notification_email_status,
    leads.notification_email_attempts,
    leads.notification_email_last_attempt_at;
END;
$$;

-- Garante que service role pode executar
GRANT EXECUTE ON FUNCTION claim_lead_email_notification_v1(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
