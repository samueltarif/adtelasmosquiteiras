export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.warn('[api/admin/leads] Supabase URL ou Service Role Key não configurados no .env')
    return { success: false, leads: [] }
  }

  try {
    // Consulta direta à API Rest do Supabase para buscar todos os leads
    const response = await $fetch(`${config.supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json'
      }
    })

    return {
      success: true,
      leads: response || []
    }
  } catch (error: any) {
    console.error('[api/admin/leads] Erro ao consultar leads no Supabase:', error?.message || error)
    return {
      success: false,
      leads: [],
      error: error?.message || 'Erro de conexão'
    }
  }
})
