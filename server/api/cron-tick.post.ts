export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { success: false, error: 'Database credentials not configured' }
  }

  try {
    await $fetch(`${config.supabaseUrl}/rest/v1/cron_ticks`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: {
        valor: 1
      }
    })

    return { success: true, message: 'Cron signal received and saved' }
  } catch (error: any) {
    console.error('[cron-tick] Error saving tick:', error?.message)
    return { success: false, error: error?.message }
  }
})
