import {
  validateLeadName,
  validateLeadPhone,
  validateLeadEmail,
  sendLeadNotificationEmail,
  isEmailConfigured
} from '../utils/emailService'
import { createMediaUploadToken } from '../utils/mediaAuth'

export default defineEventHandler(async (event) => {
  const t0_requestReceived = performance.now()
  const config = useRuntimeConfig()
  const body = await readBody(event) || {}

  const {
    submission_id,
    visitor_id,
    session_id,
    landing_path,
    conversion_path,
    channel,
    session_channel,
    first_touch_channel,
    first_touch_landing_path,
    first_touch_referrer,
    first_touch_utm_source,
    first_touch_utm_medium,
    first_touch_utm_campaign,
    first_touch_utm_content,
    first_touch_utm_term,
    first_touch_gclid,
    first_touch_gbraid,
    first_touch_wbraid,
    first_touch_fbclid,
    first_touch_msclkid,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    gbraid,
    wbraid,
    fbclid,
    msclkid,
    referrer,
    nome,
    cidade,
    bairro,
    servico,
    telefone,
    email,
    mensagem,
    origem,
    media_selection_summary
  } = body

  // 1. Validação estrita de campos obrigatórios (client e server-side)
  const cleanNome = validateLeadName(nome)
  const cleanPhone = validateLeadPhone(telefone)
  const cleanEmail = validateLeadEmail(email)

  // Validação segura de contagem de mídias selecionadas para template de email
  let sanitizedMediaSummary: { photoCount: number; videoCount: number } | null = null
  if (media_selection_summary && typeof media_selection_summary === 'object') {
    const pCount = Math.max(0, Math.min(4, parseInt(media_selection_summary.photoCount, 10) || 0))
    const vCount = Math.max(0, Math.min(2, parseInt(media_selection_summary.videoCount, 10) || 0))
    if (pCount > 0 || vCount > 0) {
      sanitizedMediaSummary = { photoCount: pCount, videoCount: vCount }
    }
  }

  const t1_validationComplete = performance.now()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.error('[send-lead] CRITICAL: Supabase não configurado — lead NÃO será salvo')
    throw createError({ statusCode: 500, message: 'Configuração de banco indisponível' })
  }

  const effectiveSubmissionId = submission_id || crypto.randomUUID()
  let leadId: string | null = null
  let isNewLead = false

  // ======================================================================
  // 2. GRAVAR LEAD NO SUPABASE (LEAD_CREATION_ORDER = FIRST)
  // ======================================================================
  const t2_dbInsertStart = performance.now()
  try {
    const insertResponse = await $fetch(`${config.supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: {
        submission_id: effectiveSubmissionId,
        visitor_id: visitor_id || null,
        session_id: session_id || null,
        landing_path: landing_path || null,
        conversion_path: conversion_path || null,
        session_channel: session_channel || channel || null,

        // Atribuição de Sessão Atual
        referrer: referrer || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null,
        gclid: gclid || null,
        gbraid: gbraid || null,
        wbraid: wbraid || null,
        fbclid: fbclid || null,
        msclkid: msclkid || null,

        // Atribuição First Touch Completa
        first_touch_channel: first_touch_channel || null,
        first_touch_landing_path: first_touch_landing_path || null,
        first_touch_referrer: first_touch_referrer || null,
        first_touch_utm_source: first_touch_utm_source || null,
        first_touch_utm_medium: first_touch_utm_medium || null,
        first_touch_utm_campaign: first_touch_utm_campaign || null,
        first_touch_utm_content: first_touch_utm_content || null,
        first_touch_utm_term: first_touch_utm_term || null,
        first_touch_gclid: first_touch_gclid || null,
        first_touch_gbraid: first_touch_gbraid || null,
        first_touch_wbraid: first_touch_wbraid || null,
        first_touch_fbclid: first_touch_fbclid || null,
        first_touch_msclkid: first_touch_msclkid || null,

        nome: cleanNome,
        cidade: cidade || 'São Paulo',
        bairro: bairro || null,
        servico: servico || 'Não especificado',
        telefone: cleanPhone,
        email: cleanEmail,
        mensagem: mensagem ? String(mensagem).slice(0, 2000) : null,
        origem: origem || 'formulario_geral',
        status: 'Novo',
        valor_orcamento: 0,

        // Estado durável de notificação por e-mail
        notification_email_status: 'pending',
        notification_email_attempts: 0
      }
    }) as any

    if (Array.isArray(insertResponse) && insertResponse.length > 0) {
      leadId = insertResponse[0].id
    } else if (insertResponse?.id) {
      leadId = insertResponse.id
    }

    isNewLead = true
    if (import.meta.dev) {
      console.log('[send-lead] Lead gravado no Supabase com sucesso:', leadId ? `id=${leadId}` : 'sem id retornado')
    }

  } catch (dbErr: any) {
    // Tratamento de conflito de submission_id (Retry / Duplicata Idempotente)
    if (dbErr?.message?.includes('duplicate key') || dbErr?.message?.includes('23505') || dbErr?.status === 409 || dbErr?.statusCode === 409) {
      if (import.meta.dev) {
        console.log('[send-lead] [IDEMPOTENCY_DB] Conflito UNIQUE de submission_id — localizando lead existente para retry')
      }
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

        // Gera novo uploadToken de 15 minutos para permitir que o client continue os uploads
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
      } catch (findErr) {
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
  // 4. NOTIFICAÇÃO POR E-MAIL DATA-ONLY COM ESTADO DURÁVEL (EMAIL_DELIVERY_DEPENDS_ON_MEDIA = NO)
  // ======================================================================
  // O e-mail é disparado em background seguro (via event.waitUntil ou task assíncrona)
  // para que o navegador receba o uploadToken instantaneamente (< 200ms) e inicie os uploads.
  if (isNewLead && isEmailConfigured(config) && leadId) {
    const leadData = {
      nome: cleanNome,
      telefone: cleanPhone,
      email: cleanEmail,
      cidade,
      bairro,
      servico,
      mensagem: mensagem ? String(mensagem).slice(0, 2000) : null,
      origem,
      submission_id: effectiveSubmissionId,
      visitor_id,
      session_id,
      session_channel: session_channel || channel,
      first_touch_channel,
      landing_path,
      conversion_path,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      gclid,
      id: leadId,
      media_selection_summary: sanitizedMediaSummary
    }

    const emailHeaders = {
      'apikey': config.supabaseServiceRoleKey,
      'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }

    const runBackgroundNotification = async () => {
      const t4_smtpStart = performance.now()
      try {
        await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
          method: 'PATCH',
          headers: emailHeaders,
          body: {
            notification_email_status: 'sending',
            notification_email_attempts: 1,
            notification_email_last_attempt_at: new Date().toISOString()
          }
        })

        const emailResult = await sendLeadNotificationEmail(leadData, {
          gmailEmail: config.gmailEmail,
          gmailAppPassword: config.gmailAppPassword,
          leadNotificationEmail: config.leadNotificationEmail
        })

        const t5_smtpEnd = performance.now()
        if (import.meta.dev) {
          console.log(`[send-lead] SMTP concluído em ${(t5_smtpEnd - t4_smtpStart).toFixed(1)}ms (Sucesso: ${emailResult.success})`)
        }

        if (emailResult.success) {
          await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
            method: 'PATCH',
            headers: emailHeaders,
            body: {
              notification_email_status: 'sent',
              notification_email_sent_at: new Date().toISOString(),
              notification_email_last_error: null
            }
          })
        } else {
          await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
            method: 'PATCH',
            headers: emailHeaders,
            body: {
              notification_email_status: 'failed',
              notification_email_last_error: emailResult.error || 'Erro desconhecido'
            }
          })
        }
      } catch (err: any) {
        console.error('[send-lead] Erro no background email notification:', err?.message || err)
        try {
          await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
            method: 'PATCH',
            headers: emailHeaders,
            body: {
              notification_email_status: 'failed',
              notification_email_last_error: err?.message || 'Falha no processo'
            }
          })
        } catch {}
      }
    }

    // Usa event.waitUntil nativo do Nitro/H3 quando disponível, ou executa promise assíncrona
    if (typeof (event as any).waitUntil === 'function') {
      (event as any).waitUntil(runBackgroundNotification())
    } else {
      runBackgroundNotification()
    }
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
