/**
 * Gerenciador de Fila de Retry Local para Leads do WhatsApp Gate
 * Arquivo: app/utils/whatsappLeadQueue.ts
 *
 * ESPECIFICAÇÃO:
 * - Persiste localmente payloads pendentes antes da navegação do WhatsApp
 * - Tenta envio não-bloqueante com keepalive: true / sendBeacon
 * - Reprocessa payloads pendentes na próxima carga de página
 * - Limite de retenção de 10 itens e TTL de 24 horas
 * - LOC <= 200
 */

export const LEAD_QUEUE_STORAGE_KEY = 'adt_pending_whatsapp_leads_v1'
export const MAX_LEAD_QUEUE_ITEMS = 10
export const LEAD_QUEUE_TTL_MS = 24 * 3600 * 1000 // 24 horas

export interface PendingWhatsappLead {
  submission_id: string
  event_id: string
  short_code: string
  payload: Record<string, any>
  created_at_ms: number
  attempts: number
}

function getStoredLeadQueue(): PendingWhatsappLead[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = localStorage.getItem(LEAD_QUEUE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const now = Date.now()
    return parsed.filter(item => (now - item.created_at_ms) < LEAD_QUEUE_TTL_MS)
  } catch {
    return []
  }
}

function saveLeadQueue(queue: PendingWhatsappLead[]) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const trimmed = queue.slice(-MAX_LEAD_QUEUE_ITEMS)
    localStorage.setItem(LEAD_QUEUE_STORAGE_KEY, JSON.stringify(trimmed))
  } catch {}
}

export function enqueuePendingLead(submissionId: string, eventId: string, shortCode: string, payload: Record<string, any>) {
  if (typeof window === 'undefined') return
  const queue = getStoredLeadQueue()
  if (queue.some(item => item.submission_id === submissionId)) return

  queue.push({
    submission_id: submissionId,
    event_id: eventId,
    short_code: shortCode,
    payload,
    created_at_ms: Date.now(),
    attempts: 0
  })

  saveLeadQueue(queue)
}

export function dequeueConfirmedLead(submissionId: string) {
  if (typeof window === 'undefined') return
  const queue = getStoredLeadQueue()
  const updated = queue.filter(item => item.submission_id !== submissionId)
  saveLeadQueue(updated)
}

export function dispatchWhatsappLeadTracking(
  submissionId: string,
  eventId: string,
  shortCode: string,
  payload: Record<string, any>,
  onSuccess?: (data: any) => void,
  onCollision?: () => void
) {
  if (typeof window === 'undefined') return

  enqueuePendingLead(submissionId, eventId, shortCode, payload)

  try {
    const bodyStr = JSON.stringify({ ...payload, submission_id: submissionId, event_id: eventId, short_code: shortCode })

    if (typeof fetch !== 'undefined') {
      fetch('/api/whatsapp-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true
      })
      .then(async (res) => {
        if (res.ok) {
          dequeueConfirmedLead(submissionId)
          const data = await res.json().catch(() => ({}))
          if (onSuccess) onSuccess(data)
        } else if (res.status === 409) {
          const errData = await res.json().catch(() => ({}))
          if (errData?.code === 'SHORT_CODE_COLLISION' && onCollision) {
            onCollision()
          }
        }
      })
      .catch(() => {})
    } else if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: 'application/json' })
      navigator.sendBeacon('/api/whatsapp-lead', blob)
    }
  } catch {}
}

export function flushPendingWhatsappLeads() {
  if (typeof window === 'undefined') return
  const queue = getStoredLeadQueue()
  if (queue.length === 0) return

  for (const item of queue) {
    item.attempts += 1
    const bodyStr = JSON.stringify({ ...item.payload, submission_id: item.submission_id, event_id: item.event_id, short_code: item.short_code })

    fetch('/api/whatsapp-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
      keepalive: true
    })
    .then(res => {
      if (res.ok || res.status === 409) {
        dequeueConfirmedLead(item.submission_id)
      }
    })
    .catch(() => {})
  }
}
