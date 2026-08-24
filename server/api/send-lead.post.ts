import { sendLeadNotificationEmail, isEmailConfigured, sanitizeEmailError } from '../utils/emailService'

export default defineEventHandler(async (event) => {
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
    origem
  } = body

  if (!nome || !cidade) {
    throw createError({ statusCode: 400, message: 'Nome e cidade são obrigatórios' })
  }

  // ======================================================================
  // 1. GRAVAR LEAD NO SUPABASE (Banco é a fonte autoritativa de verdade)
  // ======================================================================
  // O lead é salvo ANTES de qualquer tentativa de envio de e-mail.
  // Se o SMTP falhar, o lead permanece 100% salvo e seguro no banco.

  let leadId: string | null = null
  let isNewLead = false

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.error('[send-lead] CRITICAL: Supabase não configurado — lead NÃO será salvo')
    throw createError({ statusCode: 500, message: 'Configuração de banco indisponível' })
  }

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
        submission_id: submission_id || null,
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

        nome,
        cidade,
        bairro: bairro || null,
        servico: servico || 'Não especificado',
        telefone: telefone || null,
        email: email || null,
        mensagem: mensagem || null,
        origem: origem || 'formulario_geral',
        status: 'Novo',
        valor_orcamento: 0,

        // Estado inicial de notificação por e-mail
        notification_email_status: 'pending',
        notification_email_attempts: 0
      }
    }) as any

    // Extrair o ID do lead inserido
    if (Array.isArray(insertResponse) && insertResponse.length > 0) {
      leadId = insertResponse[0].id
    } else if (insertResponse?.id) {
      leadId = insertResponse.id
    }

    isNewLead = true
    console.log('[send-lead] Lead gravado no Supabase com sucesso:', leadId ? `id=${leadId}` : 'sem id retornado')

  } catch (dbErr: any) {
    // Se for violação de UNIQUE constraint (submission_id duplicado), retorna idempotente
    if (dbErr?.message?.includes('duplicate key') || dbErr?.message?.includes('23505') || dbErr?.status === 409 || dbErr?.statusCode === 409) {
      console.log('[send-lead] [IDEMPOTENCY_DB] Conflito UNIQUE de submission_id — resposta idempotente')
      return { success: true, idempotent: true, leadSaved: true }
    }
    console.error('[send-lead] Erro ao gravar lead no Supabase:', dbErr?.message || dbErr)
    throw createError({ statusCode: 500, message: 'Erro ao salvar lead' })
  }

  // ======================================================================
  // 2. ENVIAR NOTIFICAÇÃO POR E-MAIL (após salvamento confirmado)
  // ======================================================================
  // Semântica: SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE
  // O e-mail é enviado apenas para leads NOVOS (isNewLead = true).
  // Duplicados via submission_id já foram tratados acima.

  let emailSent = false

  if (isNewLead && isEmailConfigured(config)) {
    const leadData = {
      nome, telefone, email, cidade, bairro, servico, mensagem, origem,
      submission_id, visitor_id, session_id,
      session_channel: session_channel || channel,
      first_touch_channel,
      landing_path, conversion_path,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid
    }

    // 2a. Marcar status como 'sending' e incrementar tentativas
    if (leadId) {
      try {
        await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
          method: 'PATCH',
          headers: {
            'apikey': config.supabaseServiceRoleKey,
            'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: {
            notification_email_status: 'sending',
            notification_email_attempts: 1,
            notification_email_last_attempt_at: new Date().toISOString()
          }
        })
      } catch (updateErr: any) {
        console.error('[send-lead] Erro ao atualizar status para sending:', updateErr?.message || updateErr)
        // Prosseguir com tentativa de envio mesmo se este update falhar
      }
    }

    // 2b. Tentar envio SMTP
    const emailResult = await sendLeadNotificationEmail(leadData, {
      gmailEmail: config.gmailEmail,
      gmailAppPassword: config.gmailAppPassword,
      leadNotificationEmail: config.leadNotificationEmail
    })

    emailSent = emailResult.success

    // 2c. Persistir resultado do envio no banco (estado durável)
    if (leadId) {
      try {
        if (emailResult.success) {
          await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
            method: 'PATCH',
            headers: {
              'apikey': config.supabaseServiceRoleKey,
              'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: {
              notification_email_status: 'sent',
              notification_email_sent_at: new Date().toISOString(),
              notification_email_last_error: null
            }
          })
          console.log('[send-lead] E-mail de notificação enviado com sucesso:', emailResult.messageId)
        } else {
          await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, {
            method: 'PATCH',
            headers: {
              'apikey': config.supabaseServiceRoleKey,
              'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: {
              notification_email_status: 'failed',
              notification_email_last_error: emailResult.error || 'Erro desconhecido'
            }
          })
          console.error('[send-lead] Falha no envio de e-mail — lead preservado — status durável: failed')
        }
      } catch (statusErr: any) {
        // Se não conseguir persistir o status, logar mas não falhar a API
        console.error('[send-lead] Erro ao persistir status de e-mail:', statusErr?.message || statusErr)
      }
    }
  } else if (isNewLead && !isEmailConfigured(config)) {
    console.warn('[send-lead] SMTP não configurado — lead salvo sem notificação por e-mail')
  }

  return { success: true, leadSaved: true, emailSent }
})
