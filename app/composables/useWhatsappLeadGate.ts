import { ref } from 'vue'
import { generateShortCode, appendShortCodeToWhatsappUrl } from '~/utils/whatsappShortCode'
import { dispatchWhatsappLeadTracking } from '~/utils/whatsappLeadQueue'
import {
  formatPhoneMask,
  openWhatsappWindow,
  pushGateSubmitEvents,
  buildGatePayload,
  GATE_SESSION_KEY,
  type WhatsappGateContext
} from '~/utils/whatsappGateHelpers'

export type { WhatsappGateContext }
export { formatPhoneMask }

const isOpen = ref(false)
const isSubmitting = ref(false)
const name = ref('')
const phone = ref('')
const errorMessage = ref<string | null>(null)
const ctaContext = ref<WhatsappGateContext | null>(null)
const submissionId = ref('')
const existingLeadId = ref<string | null>(null)

export function useWhatsappLeadGate() {
  function openGate(context: WhatsappGateContext) {
    ctaContext.value = context
    submissionId.value = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(GATE_SESSION_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.nome) name.value = parsed.nome
          if (parsed.telefone) phone.value = formatPhoneMask(parsed.telefone)
          if (parsed.lead_id) existingLeadId.value = parsed.lead_id
        }
      } catch {}
    }

    errorMessage.value = null
    isSubmitting.value = false
    isOpen.value = true

    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'whatsapp_modal_open',
        page_path: context.path,
        cta_location: context.ctaLocation,
        service_key: context.serviceKey
      })
    }
  }

  function closeGate() {
    if (isSubmitting.value) return
    isOpen.value = false
    errorMessage.value = null
  }

  async function submitGate(retryCount = 0): Promise<boolean> {
    if (isSubmitting.value && retryCount === 0) return false
    const cleanNome = (name.value || '').trim()
    let digits = (phone.value || '').replace(/\D/g, '')
    if (digits.startsWith('55') && digits.length >= 12) digits = digits.slice(2)

    if (cleanNome.length < 2) {
      errorMessage.value = 'Por favor, informe seu nome (mínimo 2 caracteres).'
      return false
    }
    if (digits.length < 10 || digits.length > 11) {
      errorMessage.value = 'Por favor, informe um WhatsApp válido com DDD (10 ou 11 dígitos).'
      return false
    }

    isSubmitting.value = true
    errorMessage.value = null

    const shortCode = generateShortCode()
    const rawHref = ctaContext.value?.originalHref || 'https://wa.me/5511983586611'
    const targetHref = appendShortCodeToWhatsappUrl(rawHref, shortCode, { replaceExisting: true })

    if (retryCount === 0) {
      openWhatsappWindow(targetHref)
      pushGateSubmitEvents(ctaContext.value, shortCode)
      try {
        sessionStorage.setItem(GATE_SESSION_KEY, JSON.stringify({
          lead_id: existingLeadId.value || null,
          submission_id: submissionId.value,
          nome: cleanNome,
          telefone: digits
        }))
      } catch {}
      isOpen.value = false
    }

    const eventId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`
    const payload = buildGatePayload(
      submissionId.value,
      eventId,
      shortCode,
      cleanNome,
      digits,
      existingLeadId.value,
      ctaContext.value
    )

    dispatchWhatsappLeadTracking(
      submissionId.value,
      eventId,
      shortCode,
      payload,
      (resData) => {
        isSubmitting.value = false
        if (resData?.lead_id) {
          existingLeadId.value = resData.lead_id
          try {
            sessionStorage.setItem(GATE_SESSION_KEY, JSON.stringify({
              lead_id: resData.lead_id,
              submission_id: submissionId.value,
              nome: cleanNome,
              telefone: digits
            }))
          } catch {}
        }
      },
      () => {
        if (retryCount < 3) {
          submitGate(retryCount + 1)
        } else {
          isSubmitting.value = false
        }
      }
    )

    return true
  }

  return {
    isOpen,
    isSubmitting,
    name,
    phone,
    errorMessage,
    openGate,
    closeGate,
    submitGate
  }
}
