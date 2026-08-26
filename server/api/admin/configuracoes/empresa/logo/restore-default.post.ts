import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import { getSupabaseHeaders } from '../../../../../utils/crm'
import { deleteSiteObjectFromR2 } from '../../../../../utils/r2SiteStorage'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Busca logo atual para limpar do R2 se for customizada
  let currentStorageKey: string | null = null
  try {
    const currentProfile = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/company_profile?id=eq.1&limit=1`, { headers })
    if (Array.isArray(currentProfile) && currentProfile.length > 0 && currentProfile[0].logo_source === 'r2') {
      currentStorageKey = currentProfile[0].logo_storage_key
    }
  } catch (profErr) {
    console.warn('[logo/restore] Falha ao consultar perfil atual:', profErr)
  }

  // 2. Atualiza banco para logo padrão estática
  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/company_profile?id=eq.1`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: {
        logo_source: 'static',
        logo_path: '/images/logo_adt_telas_nova.png',
        logo_storage_key: null,
        updated_by: admin.userId
      }
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw createError({ statusCode: 404, message: 'Perfil da empresa não encontrado.' })
    }

    // 3. Limpa objeto R2 se existia (sem desfazer o DB se a limpeza falhar)
    if (currentStorageKey && currentStorageKey.startsWith('branding/company/')) {
      await deleteSiteObjectFromR2(currentStorageKey).catch((cleanErr) => {
        console.warn('[logo/restore] Falha ao remover logo do R2 após restauração:', cleanErr)
      })
    }

    const updated = res[0]
    return {
      success: true,
      profile: {
        ...updated,
        logo_url: '/images/logo_adt_telas_nova.png'
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[logo/restore] Erro ao restaurar logo padrão:', err)
    throw createError({ statusCode: 500, message: 'Erro ao restaurar logo padrão.' })
  }
})
