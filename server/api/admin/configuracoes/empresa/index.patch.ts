import { requireActiveAdmin } from '../../../../utils/adminAuth'
import {
  normalizePhone,
  normalizeEmail,
  normalizeCpfCnpj,
  isValidBrazilianPhone,
  isValidCpfCnpj,
  getSupabaseHeaders
} from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const body = await readBody(event).catch(() => ({}))

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const patchPayload: Record<string, any> = {
    updated_by: admin.userId
  }

  if (body.trade_name !== undefined) {
    const tradeName = typeof body.trade_name === 'string' ? body.trade_name.trim() : ''
    if (!tradeName || tradeName.length < 2) {
      throw createError({ statusCode: 400, message: 'O nome fantasia da empresa deve ter pelo menos 2 caracteres.' })
    }
    patchPayload.trade_name = tradeName
  }

  if (body.legal_name !== undefined) {
    patchPayload.legal_name = body.legal_name && typeof body.legal_name === 'string' ? body.legal_name.trim() || null : null
  }

  if (body.cnpj !== undefined) {
    if (body.cnpj && typeof body.cnpj === 'string' && body.cnpj.trim()) {
      const doc = normalizeCpfCnpj(body.cnpj)
      if (!isValidCpfCnpj(doc)) throw createError({ statusCode: 400, message: 'CNPJ inválido.' })
      patchPayload.cnpj = body.cnpj.trim()
    } else {
      patchPayload.cnpj = null
    }
  }

  if (body.phone_display !== undefined) {
    if (body.phone_display && typeof body.phone_display === 'string' && body.phone_display.trim()) {
      patchPayload.phone_display = body.phone_display.trim()
    } else {
      patchPayload.phone_display = null
    }
  }

  if (body.whatsapp_number !== undefined) {
    if (body.whatsapp_number && typeof body.whatsapp_number === 'string' && body.whatsapp_number.trim()) {
      const raw = normalizePhone(body.whatsapp_number)
      patchPayload.whatsapp_number = raw.startsWith('55') ? raw : '55' + raw
    } else {
      patchPayload.whatsapp_number = null
    }
  }

  if (body.email_contact !== undefined) {
    if (body.email_contact && typeof body.email_contact === 'string' && body.email_contact.trim()) {
      const em = normalizeEmail(body.email_contact)
      if (!em) throw createError({ statusCode: 400, message: 'E-mail de contato inválido.' })
      patchPayload.email_contact = em
    } else {
      patchPayload.email_contact = null
    }
  }

  if (body.website !== undefined) {
    if (body.website && typeof body.website === 'string' && body.website.trim()) {
      const web = body.website.trim()
      if (!web.startsWith('http://') && !web.startsWith('https://')) {
        throw createError({ statusCode: 400, message: 'Website deve começar com http:// ou https://' })
      }
      patchPayload.website = web
    } else {
      patchPayload.website = null
    }
  }

  if (body.cep !== undefined) {
    patchPayload.cep = body.cep && typeof body.cep === 'string' ? body.cep.trim() || null : null
  }
  if (body.street !== undefined) {
    patchPayload.street = body.street && typeof body.street === 'string' ? body.street.trim() || null : null
  }
  if (body.number !== undefined) {
    patchPayload.number = body.number && typeof body.number === 'string' ? body.number.trim() || null : null
  }
  if (body.complement !== undefined) {
    patchPayload.complement = body.complement && typeof body.complement === 'string' ? body.complement.trim() || null : null
  }
  if (body.neighborhood !== undefined) {
    patchPayload.neighborhood = body.neighborhood && typeof body.neighborhood === 'string' ? body.neighborhood.trim() || null : null
  }
  if (body.city !== undefined) {
    patchPayload.city = body.city && typeof body.city === 'string' ? body.city.trim() || 'São Paulo' : 'São Paulo'
  }
  if (body.state !== undefined) {
    const st = body.state && typeof body.state === 'string' ? body.state.trim().toUpperCase() : 'SP'
    if (st.length !== 2) throw createError({ statusCode: 400, message: 'Estado deve ter 2 caracteres.' })
    patchPayload.state = st
  }

  if (body.business_hours !== undefined) {
    patchPayload.business_hours = body.business_hours && typeof body.business_hours === 'string' ? body.business_hours.trim() || null : null
  }
  if (body.warranty_support_hours !== undefined) {
    patchPayload.warranty_support_hours = body.warranty_support_hours && typeof body.warranty_support_hours === 'string' ? body.warranty_support_hours.trim() || null : null
  }
  if (body.document_footer_text !== undefined) {
    patchPayload.document_footer_text = body.document_footer_text && typeof body.document_footer_text === 'string' ? body.document_footer_text.trim() || null : null
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/company_profile?id=eq.1`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: patchPayload
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw createError({ statusCode: 404, message: 'Perfil da empresa não encontrado para atualização.' })
    }

    return {
      success: true,
      profile: res[0]
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[company-profile/patch] Erro ao atualizar perfil da empresa:', err)
    throw createError({ statusCode: 500, message: 'Erro ao atualizar dados da empresa.' })
  }
})
