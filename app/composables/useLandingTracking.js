// Reuse the existing GA dispatcher, session identity and attribution cookie.
// WhatsApp/phone clicks and visits belong to the global tracking plugins.
export function useLandingTracking() {
  const { trackClientEvent } = useGATracking()
  const attribution = useAttribution()
  const identity = useAnalyticsIdentity()
  const route = useRoute()
  let formStarted = false

  function track(event, properties = {}) {
    const attr = attribution.getOrInitAttribution()
    trackClientEvent(event, {
      source: 'landing_page',
      page_path: route.path,
      campaign_id: attr.campaign_id || undefined,
      adgroup_id: attr.adgroup_id || undefined,
      ...properties
    })
  }

  function startForm(event) {
    if (formStarted || !event.target?.matches('input, select, textarea')) return
    formStarted = true
    const path = route.path
    const { sessionId } = identity.getOrCreateSessionId(path)
    const attr = attribution.getOrInitAttribution()
    // Admin equivalent of form_start. Do not duplicate GA enhanced form tracking.
    $fetch('/api/track-click', {
      method: 'POST',
      body: {
        ...attr,
        event_id: identity.generateUUID(),
        visitor_id: identity.getOrCreateVisitorId(),
        session_id: sessionId,
        landing_path: identity.getSessionLandingPath(path),
        tipo: 'form_start',
        origem: path,
        cta_location: 'lp_form'
      }
    }).catch(() => {})
  }

  return { track, startForm }
}
