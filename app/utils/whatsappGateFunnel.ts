/**
 * Funil do pop-up de WhatsApp gravado no dashboard próprio (tabela lead_clicks).
 *
 * - 'form_start' (cta_location 'modal'): o visitante TOCOU no botão de WhatsApp e o pop-up abriu.
 *   Aparece no dashboard como "Inícios de Formulário".
 * - 'whatsapp_gate_typing': o visitante COMEÇOU A DIGITAR nome ou telefone no pop-up.
 *   Fica gravado em lead_clicks (consultável por SQL e na jornada da sessão).
 *
 * Cada etapa é gravada no máximo uma vez por sessão. Nunca bloqueia a experiência do usuário.
 */
import { buildClickPayload } from '~/utils/clickTrackerDispatcher'
import type { WhatsappGateContext } from '~/utils/whatsappGateHelpers'

export type GateFunnelStep = 'form_start' | 'whatsapp_gate_typing'

const CLARITY_EVENT: Record<string, string> = {
  form_start: 'popup_aberto',
  whatsapp_gate_typing: 'popup_digitou',
  submit: 'popup_enviou'
}

/** Marca a etapa do pop-up na gravação do Microsoft Clarity (filtro "Eventos inteligentes"/"Tags"). */
export function markClarityGateStep(step: GateFunnelStep | 'submit'): void {
  try {
    const clarity = (window as any).clarity
    if (typeof clarity !== 'function') return
    clarity('event', CLARITY_EVENT[step])
    clarity('set', 'popup', CLARITY_EVENT[step])
  } catch {}
}

function alreadyTracked(step: GateFunnelStep, sessionId: string): boolean {
  const key = `adt_gate_${step}_${sessionId}`
  try {
    if (sessionStorage.getItem(key)) return true
    sessionStorage.setItem(key, '1')
  } catch {}
  return false
}

export function trackGateFunnelStep(step: GateFunnelStep, context: WhatsappGateContext | null): void {
  if (typeof window === 'undefined' || !context) return
  markClarityGateStep(step)
  if (alreadyTracked(step, context.sessionId)) return

  const eventId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${step}`
  const payload = buildClickPayload(
    {
      target: document.body,
      anchorEl: null,
      tipo: step,
      path: context.path,
      visitorId: context.visitorId,
      sessionId: context.sessionId,
      landingPath: context.landingPath,
      attr: context.attrSnapshot || {},
      text: context.text || ''
    },
    eventId,
    context.serviceKey,
    context.serviceName,
    'modal'
  )

  $fetch('/api/track-click', { method: 'POST', body: payload }).catch(() => {})
}
