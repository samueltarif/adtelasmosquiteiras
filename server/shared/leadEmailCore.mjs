// ======================================================================
// LEAD EMAIL CORE — AD Telas e Redes
// Módulo puro e compartilhável contendo regras de negócio, validações,
// formatação de dados, templates de e-mail corporativos DATA-ONLY (sem emojis)
// e orquestração de fluxo de persistência e notificação de leads.
//
// REGRAS:
// 1. Não depende de runtime global (testável em Node puro e Nuxt/Nitro).
// 2. Semântica: SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE.
// 3. PostgreSQL é a autoridade de estado e idempotência.
// 4. Sanitização estrita de erros para zero vazamento de secrets.
// 5. EMAIL_HAS_ATTACHMENTS = NO (Nenhum anexo de cliente; apenas logo CID oficial).
// 6. EMAIL_MEDIA_CLAIM = NONE (Zero alegação de mídia disponível no e-mail).
// 7. NAME_REQUIRED = YES (min 2 chars) e PHONE_REQUIRED = YES (10-11 dígitos).
// ======================================================================

export const ALLOWED_PHOTO_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
])

export const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime'
])

export const PHOTO_MAX_COUNT = 4
export const VIDEO_MAX_COUNT = 2
export const MAX_TOTAL_FILES = 6

export const PHOTO_MAX_SIZE_BYTES = 5.0 * 1024 * 1024 // 5 MB
export const VIDEO_MAX_SIZE_BYTES = 25.0 * 1024 * 1024 // 25 MB
export const TOTAL_MEDIA_MAX_SIZE_BYTES = 50.0 * 1024 * 1024 // 50 MB

/**
 * Valida e normaliza o nome do lead (obrigatório).
 */
export function validateLeadName(name) {
  if (!name || typeof name !== 'string') {
    const err = new Error('Nome é obrigatório')
    err.statusCode = 400
    throw err
  }
  const clean = name.trim()
  if (clean.length < 2) {
    const err = new Error('Nome deve conter no mínimo 2 caracteres válidos')
    err.statusCode = 400
    throw err
  }
  return clean
}

/**
 * Normaliza telefone brasileiro para formato numérico wa.me (5511983586611).
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
 * Valida o telefone do lead (obrigatório, 10 ou 11 dígitos plausíveis).
 */
export function validateLeadPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    const err = new Error('Telefone/WhatsApp é obrigatório')
    err.statusCode = 400
    throw err
  }
  const digits = phone.replace(/\D/g, '')
  const cleanDigits = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : (digits.startsWith('0') ? digits.slice(1) : digits)

  if (cleanDigits.length < 10 || cleanDigits.length > 11) {
    const err = new Error('Telefone deve conter DDD e número válido (10 ou 11 dígitos)')
    err.statusCode = 400
    throw err
  }
  return phone.trim()
}

/**
 * Valida formato opcional de e-mail.
 */
export function validateLeadEmail(email) {
  if (!email || typeof email !== 'string') return null
  const clean = email.trim().toLowerCase()
  if (clean === '') return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    const err = new Error('Endereço de e-mail inválido')
    err.statusCode = 400
    throw err
  }
  return clean
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
 */
export function sanitizeEmailError(err) {
  if (!err) return 'Erro desconhecido'
  let msg = typeof err === 'string' ? err : (err.message || String(err))
  msg = msg.replace(/[a-z]{16}/gi, '***')
  msg = msg.replace(/(password|pass|secret|key|token|auth)[\s]*[=:]\s*[^\s,;}\]]+/gi, '$1=***')
  msg = msg.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '***@***')
  return msg.slice(0, 500)
}

/**
 * Gera o assunto corporativo do e-mail de notificação.
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
 * Valida Magic Bytes de imagens e vídeos em buffer binário.
 */
export function validateMediaMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false
  const mime = (mimeType || '').toLowerCase()

  // JPEG: FF D8 FF
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
  }

  // PNG: 89 50 4E 47
  if (mime === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
  }

  // WebP: RIFF .... WEBP
  if (mime === 'image/webp') {
    if (buffer.length < 12) return false
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    return isRiff && isWebp
  }

  // MP4 / QuickTime (MOV): ftyp box (bytes 4-7: 66 74 79 70) ou moov/mdat/wide/free/skip
  if (mime === 'video/mp4' || mime === 'video/quicktime') {
    if (buffer.length >= 8) {
      const isFtyp = buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
      const isMoov = buffer[4] === 0x6D && buffer[5] === 0x6F && buffer[6] === 0x6F && buffer[7] === 0x76
      const isMdat = buffer[4] === 0x6D && buffer[5] === 0x64 && buffer[6] === 0x61 && buffer[7] === 0x74
      const isWide = buffer[4] === 0x77 && buffer[5] === 0x69 && buffer[6] === 0x64 && buffer[7] === 0x65
      const isFree = buffer[4] === 0x66 && buffer[5] === 0x72 && buffer[6] === 0x65 && buffer[7] === 0x65
      const isSkip = buffer[4] === 0x73 && buffer[5] === 0x6B && buffer[6] === 0x69 && buffer[7] === 0x70
      if (isFtyp || isMoov || isMdat || isWide || isFree || isSkip) return true
    }
    return false
  }

  // WebM: EBML Header (1A 45 DF A3)
  if (mime === 'video/webm') {
    return buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3
  }

  return false
}

/**
 * Formata o resumo e o texto condicional da seleção de mídias para o e-mail.
 *
 * @param {object|null|undefined} mediaSummary Objeto { photoCount, videoCount }
 * @returns {object|null} Informações formatadas ou null se nenhuma mídia selecionada
 */
export function formatMediaSelectionNotice(mediaSummary) {
  if (!mediaSummary || typeof mediaSummary !== 'object') return null
  const photos = Math.max(0, parseInt(mediaSummary.photoCount, 10) || 0)
  const videos = Math.max(0, parseInt(mediaSummary.videoCount, 10) || 0)

  if (photos <= 0 && videos <= 0) return null

  let parts = []
  if (photos === 1) parts.push('1 foto')
  else if (photos > 1) parts.push(`${photos} fotos`)

  if (videos === 1) parts.push('1 vídeo')
  else if (videos > 1) parts.push(`${videos} vídeos`)

  const summaryPhrase = parts.join(' e ')
  const mainText = `Este cliente selecionou ${summaryPhrase} para envio junto à solicitação.`
  const guideText = `Acesse o Painel Administrativo da AD Telas para consultar os arquivos que foram enviados com sucesso.`

  return {
    photos,
    videos,
    summaryPhrase,
    mainText,
    guideText
  }
}

/**
 * Gera o template HTML corporativo do e-mail de notificação DATA-ONLY.
 * Regras: Zero anexos de clientes, zero Base64, zero URLs privadas e zero alegações de mídia falsa.
 */
export function generateEmailHTML(lead, options = {}) {
  const whatsappNumber = normalizePhoneForWhatsApp(lead.telefone)
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null
  const dateStr = formatDateTimeSP(options.now)
  const mediaNotice = formatMediaSelectionNotice(options.mediaSummary || lead.media_selection_summary)
  const adminLeadLink = lead.id || lead.submission_id 
    ? `https://www.adtelasmosquiteiras.com.br/admin/leads?lead=${encodeURIComponent(lead.id || lead.submission_id)}`
    : 'https://www.adtelasmosquiteiras.com.br/admin/leads'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Novo Lead — AD Telas e Redes</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">

<!-- Header com Identidade Visual Corporativa (Logo Inline CID Oficial) -->
<tr>
<td style="background:linear-gradient(135deg,#1D7BA6,#0F4F7D);padding:24px 32px;text-align:left;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:44px;vertical-align:middle;">
<img src="cid:adtelas-icon" width="36" height="36" alt="AD Telas e Redes" style="display:block;border-radius:6px;border:2px solid rgba(255,255,255,0.2);" />
</td>
<td style="padding-left:14px;vertical-align:middle;">
<h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;letter-spacing:-0.3px;">NOVO LEAD PELO SITE</h1>
<p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">AD Telas e Redes — ${dateStr}</p>
</td>
</tr>
</table>
</td>
</tr>

<!-- Dados do Cliente -->
<tr>
<td style="padding:24px 32px 16px;">
<h2 style="color:#0F4F7D;font-size:15px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;font-weight:700;">Dados do Cliente</h2>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;vertical-align:top;"><strong>Nome:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${escapeHtml(lead.nome)}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Telefone:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.telefone))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>E-mail:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.email))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Cidade:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.cidade))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Bairro:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.bairro))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Serviço:</strong></td><td style="padding:6px 0;font-size:14px;color:#0F4F7D;font-weight:700;">${escapeHtml(val(lead.servico))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Mensagem:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;line-height:1.5;">${escapeHtml(val(lead.mensagem))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;"><strong>Origem:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${escapeHtml(val(lead.origem))}</td></tr>
</table>
</td>
</tr>

${whatsappLink ? `
<!-- Botão WhatsApp Corporativo -->
<tr>
<td style="padding:8px 32px 20px;" align="center">
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#25D366;border-radius:6px;text-align:center;">
<a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.3px;">
RESPONDER VIA WHATSAPP
</a>
</td>
</tr>
</table>
</td>
</tr>
` : ''}

${mediaNotice ? `
<!-- Seção Condicional: Arquivos do Cliente -->
<tr>
<td style="padding:0 32px 16px;">
<div style="background-color:#f0f7fa;border:1px solid #cce3ed;border-radius:8px;padding:16px;">
<h2 style="color:#0F4F7D;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;font-weight:700;">Arquivos do Cliente</h2>
<p style="margin:0 0 6px;color:#1e3a8a;font-size:13px;line-height:1.4;font-weight:600;">${mediaNotice.mainText}</p>
<p style="margin:0 0 14px;color:#4b5563;font-size:12px;line-height:1.4;">${mediaNotice.guideText}</p>
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#0F4F7D;border-radius:6px;text-align:center;">
<a href="${adminLeadLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 22px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.3px;">
VER LEAD NO PAINEL
</a>
</td>
</tr>
</table>
</div>
</td>
</tr>
` : ''}

<!-- Atribuição Comercial -->
<tr>
<td style="padding:0 32px 16px;">
<h2 style="color:#0F4F7D;font-size:15px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;font-weight:700;">Atribuição Comercial</h2>
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
<td style="padding:0 32px 20px;">
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
 * Gera a versão texto plano corporativo do e-mail de notificação DATA-ONLY.
 */
export function generateEmailText(lead, options = {}) {
  const whatsappNumber = normalizePhoneForWhatsApp(lead.telefone)
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null
  const dateStr = formatDateTimeSP(options.now)
  const mediaNotice = formatMediaSelectionNotice(options.mediaSummary || lead.media_selection_summary)
  const adminLeadLink = lead.id || lead.submission_id
    ? `https://www.adtelasmosquiteiras.com.br/admin/leads?lead=${encodeURIComponent(lead.id || lead.submission_id)}`
    : 'https://www.adtelasmosquiteiras.com.br/admin/leads'

  let text = `NOVO LEAD PELO SITE — AD Telas e Redes
Data: ${dateStr}

DADOS DO CLIENTE
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
    text += `\nRESPONDER VIA WHATSAPP:\n${whatsappLink}\n`
  }

  if (mediaNotice) {
    text += `\nARQUIVOS DO CLIENTE\n${mediaNotice.mainText}\n${mediaNotice.guideText}\nPainel Admin: ${adminLeadLink}\n`
  }

  text += `
ATRIBUIÇÃO COMERCIAL
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
 * Executa o fluxo completo de persistência de lead e envio imediato de e-mail DATA-ONLY.
 * Suporta retry idempotente permitindo continuação da mídia sem duplicar lead ou reenviar e-mail.
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

  // 1. Validação estrita de campos obrigatórios
  const cleanNome = validateLeadName(nome)
  const cleanPhone = validateLeadPhone(telefone)
  const cleanEmail = validateLeadEmail(email)

  let leadId = null
  let isNewLead = false

  // 2. Gravação do lead no banco (LEAD_CREATION_ORDER = FIRST)
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

      notification_email_status: 'pending',
      notification_email_attempts: 0
    })

    leadId = inserted?.id || null
    isNewLead = true
  } catch (dbErr) {
    // Tratamento de conflito de submission_id (Retry / Duplicata Idempotente)
    if (dbErr?.isUniqueConflict || dbErr?.message?.includes('duplicate key') || dbErr?.message?.includes('23505') || dbErr?.status === 409 || dbErr?.statusCode === 409) {
      let existingLead = null
      if (deps.db.getLeadBySubmissionId) {
        existingLead = await deps.db.getLeadBySubmissionId(submission_id)
      }
      const existingId = existingLead?.id || 'existing-lead-id'

      // Gera um novo uploadToken válido para permitir continuar uploads
      let freshUploadToken = null
      if (deps.tokenSigner) {
        freshUploadToken = deps.tokenSigner({ leadId: existingId, submissionId: submission_id })
      }

      return {
        success: true,
        idempotent: true,
        leadSaved: true,
        leadId: existingId,
        submissionId: submission_id,
        uploadToken: freshUploadToken
      }
    }
    const err = new Error('Erro ao salvar lead: ' + (dbErr?.message || dbErr))
    err.statusCode = 500
    throw err
  }

  // 3. Geração de uploadToken assinado (independe do resultado do SMTP)
  let uploadToken = null
  if (deps.tokenSigner && leadId && submission_id) {
    uploadToken = deps.tokenSigner({ leadId, submissionId: submission_id })
  }

  // 4. Disparo IMEDIATO da Notificação por E-mail DATA-ONLY (EMAIL_DELIVERY_DEPENDS_ON_MEDIA = NO)
  let emailSent = false

  if (isNewLead && deps.mailer && isEmailConfigured(config)) {
    const leadData = {
      nome: cleanNome,
      telefone: cleanPhone,
      email: cleanEmail,
      cidade,
      bairro,
      servico,
      mensagem: mensagem ? String(mensagem).slice(0, 2000) : null,
      origem,
      submission_id,
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
      gclid
    }

    if (leadId) {
      try {
        await deps.db.updateLeadStatus(leadId, {
          notification_email_status: 'sending',
          notification_email_attempts: 1,
          notification_email_last_attempt_at: new Date().toISOString()
        })
      } catch (err) {}
    }

    const emailAttachments = []
    if (deps.brandIconBuffer) {
      emailAttachments.push({
        filename: 'adtelas-icon.png',
        content: deps.brandIconBuffer,
        cid: 'adtelas-icon',
        contentDisposition: 'inline'
      })
    }

    try {
      const recipient = config.leadNotificationEmail || config.gmailEmail
      const subject = generateEmailSubject(leadData.servico)
      const html = generateEmailHTML(leadData)
      const text = generateEmailText(leadData)

      await deps.mailer.sendMail({
        from: `"AD Telas e Redes" <${config.gmailEmail}>`,
        to: recipient,
        subject,
        html,
        text,
        attachments: emailAttachments
      })

      emailSent = true

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

      if (leadId) {
        try {
          await deps.db.updateLeadStatus(leadId, {
            notification_email_status: 'failed',
            notification_email_last_error: sanitizedError
          })
        } catch (statusErr) {}
      }
    }
  }

  return {
    success: true,
    leadSaved: true,
    leadId,
    submissionId: submission_id,
    uploadToken,
    emailSent
  }
}
