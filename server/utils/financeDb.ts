import { createError } from 'h3'
import { getSupabaseHeaders } from './crm'

export async function financeDb(path: string, options: Record<string, any> = {}): Promise<any> {
  const config = useRuntimeConfig()
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) throw createError({ statusCode: 503, message: 'Banco de dados não configurado.' })
  try {
    return await $fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
      ...options,
      headers: { ...getSupabaseHeaders(config.supabaseServiceRoleKey), ...options.headers }
    })
  } catch (error: any) {
    const code = error?.data?.code
    if (['42P01', 'PGRST205', 'PGRST202'].includes(code)) throw createError({ statusCode: 503, message: 'O módulo financeiro precisa ser ativado no banco de dados.' })
    if (code === '23505') throw createError({ statusCode: 409, message: 'Este registro já existe. Atualize a lista.' })
    throw createError({ statusCode: 503, message: 'Não foi possível acessar o financeiro. Tente novamente.' })
  }
}
