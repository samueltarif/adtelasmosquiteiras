import { useRoute } from 'vue-router'
import { useAttribution } from './useAttribution'
import { useAnalyticsIdentity } from './useAnalyticsIdentity'
import { useGATracking } from './useGATracking'

export interface FunnelTrackingPayload {
  step?: number
  step_name?: string
  need_type?: string | null
  quantity_range?: string | null
  property_type?: string | null
  installation_timeline?: string | null
  has_photos?: boolean
  landing_path?: string
  cta_location?: string
  error_message?: string
  [key: string]: any
}

/**
 * Composable isolado para tracking de eventos do novo funil de leads.
 * Garante envio seguro de métricas sem qualquer PII (nome, telefone, email são estritamente excluídos).
 */
export function useFunnelTracking() {
  const route = useRoute()
  const attribution = useAttribution()
  const identity = useAnalyticsIdentity()
  const { trackClientEvent } = useGATracking()

  let hasStarted = false

  function trackFunnelEvent(eventName: string, data: FunnelTrackingPayload = {}) {
    const attr = attribution.getOrInitAttribution()
    const pagePath = route.path

    // Sanitização de segurança estrita: NUNCA permitir PII nos eventos
    const safeData: Record<string, any> = {
      source: 'lead_funnel',
      landing_path: pagePath,
      channel: attr.channel || 'direct',
      utm_source: attr.utm_source || undefined,
      utm_medium: attr.utm_medium || undefined,
      utm_campaign: attr.utm_campaign || undefined,
      gclid: attr.gclid || undefined,
      fbclid: attr.fbclid || undefined
    }

    // Copiar apenas campos seguros conhecidos
    const safeKeys = [
      'step', 'step_name', 'need_type', 'quantity_range', 'property_type',
      'installation_timeline', 'has_photos', 'cta_location', 'error_message'
    ]

    for (const key of safeKeys) {
      if (data[key] !== undefined && data[key] !== null) {
        safeData[key] = data[key]
      }
    }

    // 1. Google Analytics 4 (Measurement via useGATracking)
    try {
      trackClientEvent(eventName, safeData)
    } catch {
      // Ignora erro silenciosamente em ambientes restritos
    }

    // 2. Google Tag Manager / Meta Pixel DataLayer
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: eventName,
        ...safeData
      })
    }

    // 3. Registro no endpoint interno de clicks / eventos para o admin
    if (eventName === 'funnel_start' && !hasStarted) {
      hasStarted = true
      try {
        const { sessionId } = identity.getOrCreateSessionId(pagePath)
        $fetch('/api/track-click', {
          method: 'POST',
          body: {
            ...attr,
            event_id: identity.generateUUID(),
            visitor_id: identity.getOrCreateVisitorId(),
            session_id: sessionId,
            landing_path: identity.getSessionLandingPath(pagePath),
            tipo: 'form_start',
            origem: pagePath,
            cta_location: 'lp_funnel'
          }
        }).catch(() => {})
      } catch {
        // Fallback seguro
      }
    }
  }

  return {
    trackFunnelEvent
  }
}
