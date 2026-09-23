import { defineEventHandler, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    let settingsRes = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/company_fiscal_settings?id=eq.1&limit=1`,
      { headers }
    )

    // Se ainda não existir a linha padrão singleton, cria com regime_tributario nulo
    if (!Array.isArray(settingsRes) || settingsRes.length === 0) {
      await $fetch(`${config.supabaseUrl}/rest/v1/company_fiscal_settings`, {
        method: 'POST',
        headers,
        body: {
          id: 1,
          ambiente_padrao: 'homologacao',
          provedor_ativo: 'mock_sandbox'
        }
      }).catch(() => {})

      settingsRes = await $fetch<any[]>(
        `${config.supabaseUrl}/rest/v1/company_fiscal_settings?id=eq.1&limit=1`,
        { headers }
      )
    }

    const settings = settingsRes?.[0] || {}

    // Status de prontidão do servidor (sem vazar credenciais!)
    const serverProvider = config.fiscalProvider || 'mock_sandbox'
    const hasApiToken = Boolean(config.fiscalApiToken && String(config.fiscalApiToken).trim().length > 0)
    const serverEnv = config.fiscalEnvironment || 'homologacao'
    const hasR2Fiscal = Boolean(config.r2FiscalBucketName || config.r2SiteMediaBucketName)

    return {
      success: true,
      settings: {
        ...settings,
        serverReadiness: {
          provider: serverProvider,
          environment: serverEnv,
          tokenConfigured: hasApiToken || serverProvider === 'mock_sandbox',
          r2StorageConfigured: hasR2Fiscal,
          isSandbox: serverProvider === 'mock_sandbox'
        }
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[fiscal-settings/get] Erro:', err)
    throw createError({ statusCode: 500, message: 'Erro ao carregar configurações fiscais da empresa.' })
  }
})
