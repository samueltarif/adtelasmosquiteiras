import {
  classifyDevice,
  classifyBot,
  generateIpHash,
  validateCtaLocation,
  resolveCanonicalService
} from '../utils/analytics'
import { validateCanonicalChannel } from '../utils/channelValidation'
import { validateLeadName, validateLeadPhone } from '../shared/leadEmailCore.mjs'
import { triggerWhatsappLeadBackgroundNotification } from '../utils/whatsappLeadEmailNotification'
import { buildRpcV4Payload } from '../utils/whatsappLeadParams'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = (await readBody(event)) || {}
  const headers = getHeaders(event)

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Configuração de banco indisponível' })
  }

  const cleanNome = validateLeadName(body.nome)
  const cleanPhone = validateLeadPhone(body.telefone)
  const cleanShortCode = String(body.short_code || '').trim().toUpperCase()

  if (!/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(cleanShortCode)) {
    throw createError({ statusCode: 400, message: 'Código de referência inválido' })
  }

  const effectiveSubmissionId = body.submission_id || crypto.randomUUID()
  const userAgent = headers['user-agent'] || ''
  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '0.0.0.0'
  const rawIp = (Array.isArray(forwarded) ? (forwarded[0] || '0.0.0.0') : (forwarded.split(',')[0] || '0.0.0.0')).trim()
  const ipHash = generateIpHash(rawIp)

  const deviceType = classifyDevice(userAgent)
  const botInfo = classifyBot(userAgent)
  const validatedChannel = validateCanonicalChannel(body.channel)
  const validatedFirstTouchChannel = validateCanonicalChannel(body.first_touch_channel)
  const validatedCtaLocation = validateCtaLocation(body.cta_location)
  const { service_key: canonicalServiceKey, service_name: canonicalServiceName } = resolveCanonicalService(body.service_key || body.service_name)

  const path = (body.conversion_path || body.origem || '/').trim()
  const resolvedLanding = body.landing_path || path

  const rpcPayload = buildRpcV4Payload({
    submissionId: effectiveSubmissionId,
    leadId: body.lead_id || null,
    nome: cleanNome,
    telefone: cleanPhone,
    origem: body.origem || 'whatsapp_gate',
    eventId: body.event_id || null,
    shortCode: cleanShortCode,
    visitorId: body.visitor_id || null,
    sessionId: body.session_id || null,
    ctaLocation: validatedCtaLocation,
    serviceKey: canonicalServiceKey,
    serviceName: canonicalServiceName,
    landingPath: resolvedLanding,
    conversionPath: path,
    deviceType,
    googleDevice: body.google_device || null,
    isBot: botInfo.isBot,
    botName: botInfo.botName,
    userAgent,
    ipHash,
    channel: validatedChannel,
    firstTouchChannel: validatedFirstTouchChannel,
    body
  })

  try {
    const rpcResult = await $fetch<any>(`${config.supabaseUrl}/rest/v1/rpc/create_whatsapp_lead_attribution_atomic_v4`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: rpcPayload
    })

    const finalLeadId = rpcResult?.lead_id || null

    if (finalLeadId) {
      triggerWhatsappLeadBackgroundNotification(event, {
        leadId: finalLeadId,
        leadData: {
          ...body,
          id: finalLeadId,
          nome: cleanNome,
          telefone: cleanPhone,
          short_code: cleanShortCode,
          service_name: canonicalServiceName,
          channel: validatedChannel,
          cta_location: validatedCtaLocation,
          conversion_path: path
        },
        config: {
          supabaseUrl: config.supabaseUrl,
          supabaseServiceRoleKey: config.supabaseServiceRoleKey,
          gmailEmail: config.gmailEmail,
          gmailAppPassword: config.gmailAppPassword,
          leadNotificationEmail: config.leadNotificationEmail
        }
      })
    }

    return {
      success: true,
      lead_id: finalLeadId,
      attribution_id: rpcResult?.attribution_id || null,
      short_code: cleanShortCode,
      idempotent: rpcResult?.idempotent || false
    }
  } catch (err: any) {
    if (err?.message?.includes('ERR_SHORT_CODE_COLLISION') || err?.data?.message?.includes('ERR_SHORT_CODE_COLLISION')) {
      throw createError({
        statusCode: 409,
        statusMessage: 'SHORT_CODE_COLLISION',
        data: { code: 'SHORT_CODE_COLLISION' }
      })
    }
    console.error('[whatsapp-lead] Erro ao processar:', err?.message || err)
    throw createError({ statusCode: 500, message: 'Erro ao registrar lead do WhatsApp' })
  }
})
