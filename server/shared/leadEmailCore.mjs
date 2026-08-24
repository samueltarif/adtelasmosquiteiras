// ======================================================================
// LEAD EMAIL CORE — AD Telas e Redes
// Módulo puro e compartilhável contendo regras de negócio, formatação,
// templates de e-mail e orquestração de fluxo de entrega de leads.
//
// REGRAS:
// 1. Não depende de runtime global (testável em Node puro e Nuxt/Nitro).
// 2. Semântica: SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE.
// 3. PostgreSQL é a autoridade de estado e idempotência.
// 4. Sanitização estrita de erros para zero vazamento de secrets.
// ======================================================================

/**
 * Normaliza telefone brasileiro para link wa.me.
 * Entrada: "(11) 98358-6611", "11983586611", "+5511983586611", "5511983586611"
 * Saída: "5511983586611"
 */
export function normalizePhoneForWhatsApp(phone) {
  if (!phone || typeof phone !== 'string') return null
  const digits = phone.replace(/\D/g, '')
  if (!digits || digits.length < 10) return null
  if (digits.startsWith('55') && digits.length >= 12) return digits
  const cleaned = digits.startsWith('0') ? digits.slice(1) : digits
  return `55${cleaned}`
}

/**
 * Formata data/hora para fuso de São Paulo (pt-BR).
 */
export function formatDateTimeSP(date) {
  const d = date ? (date instanceof Date ? date : new Date(date)) : new Date()
  try {
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return d.toISOString()
  }
}

/**
 * Sanitiza mensagem de erro SMTP para armazenamento seguro no banco.
 * Remove senhas de app, tokens, secrets e credenciais.
 */
export function sanitizeEmailError(err) {
  if (!err) return 'Erro desconhecido'
  let msg = typeof err === 'string' ? err : (err.message || String(err))
  // Remove senhas de aplicativo (ex: 16 caracteres alfabéticos)
  msg = msg.replace(/[a-z]{16}/gi, '***')
  // Remove pares de credenciais chave=valor
  msg = msg.replace(/(password|pass|secret|key|token|auth)[\s]*[=:]\s*[^\s,;}\]]+/gi, '$1=***')
  // Remove emails que possam conter credenciais
  msg = msg.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '***@***')
  // Trunca a 500 caracteres
  return msg.slice(0, 500)
}

/**
 * Gera o assunto do e-mail de notificação.
 */
export function generateEmailSubject(servico) {
  if (servico && typeof servico === 'string' && servico.trim() !== '' && servico !== 'Não especificado') {
    return `Novo orçamento pelo site — ${servico}`
  }
  return 'Novo lead pelo site — AD Telas e Redes'
}

function val(v) {
  return (v !== null && v !== undefined && String(v).trim() !== '') ? String(v) : 'Não informado'
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Gera o template HTML responsivo do e-mail de notificação.
 */
export function generateEmailHTML(lead, options = {}) {
  const whatsappNumber = normalizePhoneForWhatsApp(lead.telefone)
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null
  const dateStr = formatDateTimeSP(options.now)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Novo Lead — AD Telas e Redes</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#1D7BA6,#0F4F7D);padding:24px 32px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">🔔 Novo Lead pelo Site</h1>
<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">AD Telas e Redes — ${dateStr}</p>
</td>
</tr>

<!-- Dados do Cliente -->
<tr>
<td style="padding:24px 32px;">
<h2 style="color:#1D7BA6;font-size:16px;margin:0 0 16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">📋 Dados do Cliente</h2>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;vertical-align:top;"><strong>Nome:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(lead.nome)}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Telefone:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.telefone))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>E-mail:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.email))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Cidade:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.cidade))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Bairro:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.bairro))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Serviço:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${escapeHtml(val(lead.servico))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Mensagem:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.mensagem))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Origem:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.origem))}</td></tr>
</table>
</td>
</tr>

${whatsappLink ? `
<!-- Botão WhatsApp -->
<tr>
<td style="padding:0 32px 24px;" align="center">
<a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#25D366;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">
💬 Responder via WhatsApp
</a>
</td>
</tr>
` : ''}

<!-- Atribuição Comercial -->
<tr>
<td style="padding:0 32px 24px;">
<h2 style="color:#1D7BA6;font-size:16px;margin:0 0 16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">📊 Atribuição Comercial</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563;">
<tr><td style="padding:4px 0;width:160px;"><strong>Canal da Sessão:</strong></td><td style="padding:4px 0;">${escapeHtml(val(lead.session_channel))}</td></tr>
<tr><td style="padding:4px 0;"><strong>Primeiro Canal:</strong></td><td style="padding:4px 0;">${escapeHtml(val(lead.first_touch_channel))}</td></tr>
<tr><td style="padding:4px 0;"><strong>Landing Page:</strong></td><td style="padding:4px 0;">${escapeHtml(val(lead.landing_path))}</td></tr>
<tr><td style="padding:4px 0;"><strong>Página de Conversão:</strong></td><td style="padding:4px 0;">${escapeHtml(val(lead.conversion_path))}</td></tr>
${lead.utm_source ? `<tr><td style="padding:4px 0;"><strong>utm_source:</strong></td><td style="padding:4px 0;">${escapeHtml(lead.utm_source)}</td></tr>` : ''}
${lead.utm_medium ? `<tr><td style="padding:4px 0;"><strong>utm_medium:</strong></td><td style="padding:4px 0;">${escapeHtml(lead.utm_medium)}</td></tr>` : ''}
${lead.utm_campaign ? `<tr><td style="padding:4px 0;"><strong>utm_campaign:</strong></td><td style="padding:4px 0;">${escapeHtml(lead.utm_campaign)}</td></tr>` : ''}
${lead.utm_content ? `<tr><td style="padding:4px 0;"><strong>utm_content:</strong></td><td style="padding:4px 0;">${escapeHtml(lead.utm_content)}</td></tr>` : ''}
${lead.utm_term ? `<tr><td style="padding:4px 0;"><strong>utm_term:</strong></td><td style="padding:4px 0;">${escapeHtml(lead.utm_term)}</td></tr>` : ''}
${lead.gclid ? `<tr><td style="padding:4px 0;"><strong>gclid:</strong></td><td style="padding:4px 0;">${escapeHtml(lead.gclid)}</td></tr>` : ''}
</table>
</td>
</tr>

<!-- IDs Técnicos -->
<tr>
<td style="padding:0 32px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px;">
<tr><td style="padding:2px 0;">submission_id: ${escapeHtml(val(lead.submission_id))}</td></tr>
<tr><td style="padding:2px 0;">visitor_id: ${escapeHtml(val(lead.visitor_id))}</td></tr>
<tr><td style="padding:2px 0;">session_id: ${escapeHtml(val(lead.session_id))}</td></tr>
</table>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;color:#9ca3af;">Este e-mail foi enviado automaticamente pelo site adtelasmosquiteiras.com.br</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

/**
 * Gera a versão texto plano do e-mail de notificação.
 */
export function generateEmailText(lead, options = {}) {
  const whatsappNumber = normalizePhoneForWhatsApp(lead.telefone)
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null
  const dateStr = formatDateTimeSP(options.now)

  let text = `🔔 NOVO LEAD PELO SITE — AD Telas e Redes
${dateStr}

📋 DADOS DO CLIENTE
Nome: ${val(lead.nome)}
Telefone: ${val(lead.telefone)}
E-mail: ${val(lead.email)}
Cidade: ${val(lead.cidade)}
Bairro: ${val(lead.bairro)}
Serviço: ${val(lead.servico)}
Mensagem: ${val(lead.mensagem)}
Origem: ${val(lead.origem)}
`

  if (whatsappLink) {
    text += `\n💬 RESPONDER VIA WHATSAPP:\n${whatsappLink}\n`
  }

  text += `
📊 ATRIBUIÇÃO COMERCIAL
Canal da Sessão: ${val(lead.session_channel)}
Primeiro Canal: ${val(lead.first_touch_channel)}
Landing Page: ${val(lead.landing_path)}
Página de Conversão: ${val(lead.conversion_path)}`

  if (lead.utm_source) text += `\nutm_source: ${lead.utm_source}`
  if (lead.utm_medium) text += `\nutm_medium: ${lead.utm_medium}`
  if (lead.utm_campaign) text += `\nutm_campaign: ${lead.utm_campaign}`
  if (lead.utm_content) text += `\nutm_content: ${lead.utm_content}`
  if (lead.utm_term) text += `\nutm_term: ${lead.utm_term}`
  if (lead.gclid) text += `\ngclid: ${lead.gclid}`

  text += `

---
submission_id: ${val(lead.submission_id)}
visitor_id: ${val(lead.visitor_id)}
session_id: ${val(lead.session_id)}

Este e-mail foi enviado automaticamente pelo site adtelasmosquiteiras.com.br`

  return text
}

/**
 * Verifica se as credenciais SMTP estão configuradas.
 */
export function isEmailConfigured(config) {
  return !!(config && config.gmailEmail && config.gmailAppPassword)
}

/**
 * Executa o fluxo completo e testável de submissão de lead e notificação.
 * Permite injeção de dependências para testes isolados com mocks.
 *
 * @param {Object} body Payload do formulário
 * @param {Object} config Configuração (Supabase + SMTP)
 * @param {Object} deps Dependências injetáveis { db, mailer }
 */
export async function processSendLeadWorkflow(body, config, deps) {
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
  } = body || {}

  // 1. Validação de campos obrigatórios
  if (!nome || !cidade) {
    const err = new Error('Nome e cidade são obrigatórios')
    err.statusCode = 400
    throw err
  }

  // 2. Gravação do lead no banco (PostgreSQL é a autoridade de estado e unicidade)
  let leadId = null
  try {
    const inserted = await deps.db.insertLead({
      submission_id: submission_id || null,
      visitor_id: visitor_id || null,
      session_id: session_id || null,
      landing_path: landing_path || null,
      conversion_path: conversion_path || null,
      session_channel: session_channel || channel || null,

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

      notification_email_status: 'pending',
      notification_email_attempts: 0
    })

    leadId = inserted?.id || null
  } catch (dbErr) {
    // Violação de constraint UNIQUE de submission_id (código 23505 / 409)
    if (dbErr?.isUniqueConflict || dbErr?.message?.includes('duplicate key') || dbErr?.message?.includes('23505') || dbErr?.status === 409 || dbErr?.statusCode === 409) {
      return { success: true, idempotent: true, leadSaved: true }
    }
    const err = new Error('Erro ao salvar lead: ' + (dbErr?.message || dbErr))
    err.statusCode = 500
    throw err
  }

  // 3. Envio SMTP de Notificação (apenas para lead novo gravado com sucesso)
  let emailSent = false

  if (deps.mailer && isEmailConfigured(config)) {
    const leadData = {
      nome, telefone, email, cidade, bairro, servico, mensagem, origem,
      submission_id, visitor_id, session_id,
      session_channel: session_channel || channel,
      first_touch_channel,
      landing_path, conversion_path,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid
    }

    // 3a. Atualizar status para sending e incrementar tentativas
    if (leadId) {
      try {
        await deps.db.updateLeadStatus(leadId, {
          notification_email_status: 'sending',
          notification_email_attempts: 1,
          notification_email_last_attempt_at: new Date().toISOString()
        })
      } catch (err) {
        // Prossegue com o envio mesmo em caso de erro na atualização intermediária
      }
    }

    // 3b. Tentar envio via SMTP
    try {
      const recipient = config.leadNotificationEmail || config.gmailEmail
      const subject = generateEmailSubject(leadData.servico)
      const html = generateEmailHTML(leadData)
      const text = generateEmailText(leadData)

      const info = await deps.mailer.sendMail({
        from: `"AD Telas e Redes" <${config.gmailEmail}>`,
        to: recipient,
        subject,
        html,
        text
      })

      emailSent = true

      // 3c. Persistir sucesso
      if (leadId) {
        await deps.db.updateLeadStatus(leadId, {
          notification_email_status: 'sent',
          notification_email_sent_at: new Date().toISOString(),
          notification_email_last_error: null
        })
      }
    } catch (smtpErr) {
      emailSent = false
      const sanitizedError = sanitizeEmailError(smtpErr)

      // 3d. Persistir falha sanitizada (o lead NUNCA é apagado)
      if (leadId) {
        try {
          await deps.db.updateLeadStatus(leadId, {
            notification_email_status: 'failed',
            notification_email_last_error: sanitizedError
          })
        } catch (statusErr) {
          // Erro de persistência do erro
        }
      }
    }
  }

  return { success: true, leadSaved: true, emailSent }
}
