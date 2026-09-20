/**
 * Gerenciador de Fila de Retry Local para Cliques de WhatsApp
 * Arquivo: app/utils/whatsappTrackingQueue.ts
 *
 * ESPECIFICAÇÃO FASE 1.1 PARTE 3A:
 * - Persiste localmente payloads pendentes antes da navegação do WhatsApp
 * - Tenta envio não-bloqueante com keepalive: true / sendBeacon
 * - Reprocessa payloads pendentes na próxima carga de página
 * - Limite de retenção de 10 itens e TTL de 24 horas
 */

export const QUEUE_STORAGE_KEY = 'adt_pending_whatsapp_clicks'
export const MAX_QUEUE_ITEMS = 10
export const QUEUE_TTL_MS = 24 * 3600 * 1000 // 24 horas

export interface PendingWhatsappClick {
  event_id: string
  short_code: string
  payload: Record<string, any>
  created_at_ms: number
  attempts: number
}

function getStoredQueue(): PendingWhatsappClick[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const now = Date.now()
    // Filtra expirados
    return parsed.filter(item => (now - item.created_at_ms) < QUEUE_TTL_MS)
  } catch {
    return []
  }
}

function saveQueue(queue: PendingWhatsappClick[]) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const trimmed = queue.slice(-MAX_QUEUE_ITEMS)
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(trimmed))
  } catch {}
}

export function enqueuePendingClick(eventId: string, shortCode: string, payload: Record<string, any>) {
  if (typeof window === 'undefined') return
  const queue = getStoredQueue()
  // Se já existir na fila pelo mesmo event_id, não duplica
  if (queue.some(item => item.event_id === eventId)) return

  queue.push({
    event_id: eventId,
    short_code: shortCode,
    payload,
    created_at_ms: Date.now(),
    attempts: 0
  })

  saveQueue(queue)
}

export function dequeueConfirmedClick(eventId: string) {
  if (typeof window === 'undefined') return
  const queue = getStoredQueue()
  const updated = queue.filter(item => item.event_id !== eventId)
  saveQueue(updated)
}

/**
 * Tenta enviar o clique via fetch com keepalive ou sendBeacon de forma não-bloqueante
 */
export function dispatchWhatsappTracking(eventId: string, shortCode: string, payload: Record<string, any>) {
  if (typeof window === 'undefined') return

  // 1. Salva na fila local de retry imediatamente
  enqueuePendingClick(eventId, shortCode, payload)

  // 2. Dispara com keepalive: true para sobreviver à abertura de outra aba/app
  try {
    const bodyStr = JSON.stringify({ ...payload, event_id: eventId, short_code: shortCode })

    if (typeof fetch !== 'undefined') {
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true
      })
      .then(res => {
        if (res.ok) {
          dequeueConfirmedClick(eventId)
        }
      })
      .catch(() => {
        // Falha ou unload rápido — permanecerá na fila para flush subsequente
      })
    } else if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      // Fallback para sendBeacon: enviado como dispatched/unconfirmed
      // Regra 2: sendBeacon retornar true NÃO confirma entrega; item permanece na fila
      // para validação/idempotência real no próximo carregamento
      const blob = new Blob([bodyStr], { type: 'application/json' })
      navigator.sendBeacon('/api/track-click', blob)
    }
  } catch (err) {
    // Mantém na fila de retry
  }
}

/**
 * Reprocessa itens pendentes da fila no carregamento do site
 */
export function flushPendingWhatsappClicks() {
  if (typeof window === 'undefined') return
  const queue = getStoredQueue()
  if (queue.length === 0) return

  for (const item of queue) {
    item.attempts += 1
    const bodyStr = JSON.stringify({ ...item.payload, event_id: item.event_id, short_code: item.short_code })

    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
      keepalive: true
    })
    .then(res => {
      if (res.ok) {
        dequeueConfirmedClick(item.event_id)
      }
    })
    .catch(() => {})
  }
}
