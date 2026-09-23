import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'

const ALLOWED_REGIMES = ['simples_nacional', 'simples_nacional_excesso', 'regime_normal', 'mei']
const ALLOWED_AMBIENTES = ['homologacao', 'producao']

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const body = await readBody(event).catch(() => ({}))

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const patchPayload: Record<string, any> = {
    updated_by: admin.userId,
    updated_at: new Date().toISOString()
  }

  if (body.regime_tributario !== undefined) {
    if (body.regime_tributario && !ALLOWED_REGIMES.includes(body.regime_tributario)) {
      throw createError({ statusCode: 400, message: 'Regime tributário inválido.' })
    }
    patchPayload.regime_tributario = body.regime_tributario || null
  }

  if (body.ambiente_padrao !== undefined) {
    if (!ALLOWED_AMBIENTES.includes(body.ambiente_padrao)) {
      throw createError({ statusCode: 400, message: 'Ambiente fiscal inválido.' })
    }
    patchPayload.ambiente_padrao = body.ambiente_padrao
  }

  if (body.provedor_ativo !== undefined) {
    patchPayload.provedor_ativo = String(body.provedor_ativo || 'mock_sandbox').trim()
  }

  if (body.inscricao_municipal !== undefined) {
    patchPayload.inscricao_municipal = body.inscricao_municipal ? String(body.inscricao_municipal).trim() : null
  }

  if (body.inscricao_estadual !== undefined) {
    patchPayload.inscricao_estadual = body.inscricao_estadual ? String(body.inscricao_estadual).trim() : null
  }

  if (body.cnae_principal !== undefined) {
    patchPayload.cnae_principal = body.cnae_principal ? String(body.cnae_principal).trim() : null
  }

  if (body.cnaes_secundarios !== undefined) {
    patchPayload.cnaes_secundarios = Array.isArray(body.cnaes_secundarios) ? body.cnaes_secundarios : null
  }

  if (body.codigo_municipio_ibge !== undefined) {
    patchPayload.codigo_municipio_ibge = body.codigo_municipio_ibge ? String(body.codigo_municipio_ibge).trim() : null
  }

  if (body.nfe_serie !== undefined) {
    patchPayload.nfe_serie = body.nfe_serie ? String(body.nfe_serie).trim() : null
  }

  if (body.nfe_proximo_numero !== undefined) {
    patchPayload.nfe_proximo_numero = body.nfe_proximo_numero ? parseInt(body.nfe_proximo_numero, 10) || null : null
  }

  if (body.nfse_serie !== undefined) {
    patchPayload.nfse_serie = body.nfse_serie ? String(body.nfse_serie).trim() : null
  }

  if (body.nfse_proximo_numero !== undefined) {
    patchPayload.nfse_proximo_numero = body.nfse_proximo_numero ? parseInt(body.nfse_proximo_numero, 10) || null : null
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const res = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/company_fiscal_settings?id=eq.1`,
      {
        method: 'PATCH',
        headers,
        body: patchPayload
      }
    )

    return {
      success: true,
      message: 'Configurações fiscais da empresa atualizadas com sucesso.',
      settings: res?.[0] || patchPayload
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[fiscal-settings/patch] Erro:', err)
    throw createError({ statusCode: 500, message: 'Erro ao salvar configurações fiscais.' })
  }
})
