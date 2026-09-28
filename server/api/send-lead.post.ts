import {
  validateLeadName,
  validateLeadPhone,
  validateLeadEmail,
  isEmailConfigured
} from '../utils/emailService'
import { createMediaUploadToken } from '../utils/mediaAuth'
import { buildLeadInsertPayload } from '../utils/leadDb'
import { triggerLeadBackgroundNotification } from '../utils/leadEmailNotification'

export default defineEventHandler(async (event) => {
  const t0_requestReceived = performance.now()
  const config = useRuntimeConfig()
  const body = await readBody(event) || {}
  const headers = getHeaders(event)

  // 1. Validação estrita de campos obrigatórios (client e server-side)
  const cleanNome = validateLeadName(body.nome)
  const cleanPhone = validateLeadPhone(body.telefone)
  const cleanEmail = validateLeadEmail(body.email)

  // Validação segura de contagem de mídias selecionadas para template de email
  let sanitizedMediaSummary: { photoCount: number; videoCount: number } | null = null
  if (body.media_selection_summary && typeof body.media_selection_summary === 'object') {
    const pCount = Math.max(0, Math.min(4, parseInt(body.media_selection_summary.photoCount, 10) || 0))
    const vCount = Math.max(0, Math.min(2, parseInt(body.media_selection_summary.videoCount, 10) || 0))
    if (pCount > 0 || vCount > 0) {
      sanitizedMediaSummary = { photoCount: pCount, videoCount: vCount }
    }
  }

  const t1_validationComplete = performance.now()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.error('[send-lead] CRITICAL: Supabase não configurado — lead NÃO será salvo')
    throw createError({ statusCode: 500, message: 'Configuração de banco indisponível' })
  }

  const effectiveSubmissionId = body.submission_id || crypto.randomUUID()
  let leadId: string | null = null
  let isNewLead = false

  // ======================================================================
  // 2. GRAVAR LEAD NO SUPABASE (LEAD_CREATION_ORDER = FIRST)
  // ======================================================================
  const t2_dbInsertStart = performance.now()
  const insertPayload = buildLeadInsertPayload({
    body,
    effectiveSubmissionId,
    cleanNome,
    cleanPhone,
    cleanEmail,
    userAgent: headers['user-agent'] || ''
  })

  try {
    const insertResponse = await $fetch(`${config.supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: insertPayload
    }) as any

    if (Array.isArray(insertResponse) && insertResponse.length > 0) {
      leadId = insertResponse[0].id
    } else if (insertResponse?.id) {
      leadId = insertResponse.id
    }

    isNewLead = true
  } catch (dbErr: any) {
    // Tratamento de conflito de submission_id (Retry / Duplicata Idempotente)
    if (dbErr?.message?.includes('duplicate key') || dbErr?.message?.includes('23505') || dbErr?.status === 409 || dbErr?.statusCode === 409) {
      try {
        const existing: any[] = await $fetch(
          `${config.supabaseUrl}/rest/v1/leads?submission_id=eq.${encodeURIComponent(effectiveSubmissionId)}&select=id,submission_id,status`,
          {
            headers: {
              'apikey': config.supabaseServiceRoleKey,
              'Authorization': `Bearer ${config.supabaseServiceRoleKey}`
            }
          }
        )

        const existingLead = existing?.[0]
        const existingId = existingLead?.id || 'existing-lead-id'

        const freshUploadToken = createMediaUploadToken({
          leadId: existingId,
          submissionId: effectiveSubmissionId
        })

        return {
          success: true,
          idempotent: true,
          leadSaved: true,
          leadId: existingId,
          submissionId: effectiveSubmissionId,
          uploadToken: freshUploadToken
        }
      } catch {
        return {
          success: true,
          idempotent: true,
          leadSaved: true,
          submissionId: effectiveSubmissionId
        }
      }
    }
    console.error('[send-lead] Erro ao gravar lead no Supabase:', dbErr?.message || dbErr)
    throw createError({ statusCode: 500, message: 'Erro ao salvar lead' })
  }

  const t3_dbInsertEnd = performance.now()

  // ======================================================================
  // 3. GERAÇÃO DE UPLOAD TOKEN ASSINADO (Independe do resultado do SMTP)
  // ======================================================================
  let uploadToken: string | null = null
  if (leadId) {
    try {
      uploadToken = createMediaUploadToken({
        leadId,
        submissionId: effectiveSubmissionId
      })
    } catch (tokenErr) {
      console.warn('[send-lead] Falha ao gerar uploadToken:', tokenErr)
    }
  }

  // ======================================================================
  // 4. NOTIFICAÇÃO POR E-MAIL DATA-ONLY COM ESTADO DURÁVEL
  // ======================================================================
  if (isNewLead && isEmailConfigured(config) && leadId) {
    const leadEmailData = {
      ...insertPayload,
      id: leadId,
      media_selection_summary: sanitizedMediaSummary
    }

    triggerLeadBackgroundNotification(event, {
      leadId,
      leadData: leadEmailData,
      config: {
        supabaseUrl: config.supabaseUrl,
        supabaseServiceRoleKey: config.supabaseServiceRoleKey,
        gmailEmail: config.gmailEmail,
        gmailAppPassword: config.gmailAppPassword,
        leadNotificationEmail: config.leadNotificationEmail
      }
    })
  }

  const t6_responseSent = performance.now()

  if (import.meta.dev) {
    const valMs = (t1_validationComplete - t0_requestReceived).toFixed(1)
    const dbMs = (t3_dbInsertEnd - t2_dbInsertStart).toFixed(1)
    const totalMs = (t6_responseSent - t0_requestReceived).toFixed(1)
    console.log(`[send-lead Timing] Validação: ${valMs}ms | DB Insert: ${dbMs}ms | Total Retorno: ${totalMs}ms`)
  }

  return {
    success: true,
    leadSaved: true,
    leadId,
    submissionId: effectiveSubmissionId,
    uploadToken,
    emailSent: true
  }
})
