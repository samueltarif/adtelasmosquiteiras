import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../utils/crm'
import { buildPublicMediaUrl } from '../../../../utils/r2SiteStorage'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/company_profile?id=eq.1&limit=1`, {
      headers
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw createError({ statusCode: 404, message: 'Perfil da empresa não encontrado.' })
    }

    const profile = res[0]

    // Resolução segura da logo_url para o frontend
    let logoUrl = profile.logo_path || '/images/logo_adt_telas_nova.png'
    if (profile.logo_source === 'r2' && profile.logo_storage_key) {
      logoUrl = buildPublicMediaUrl(profile.logo_storage_key)
    }

    return {
      success: true,
      profile: {
        ...profile,
        logo_url: logoUrl
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[company-profile/get] Erro ao carregar perfil da empresa:', err)
    throw createError({ statusCode: 500, message: 'Erro ao carregar perfil da empresa.' })
  }
})
