import { requireActiveAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const { id, status, valor_orcamento, observacoes } = body

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do lead é obrigatório para atualização' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.warn('[api/admin/update-lead] Supabase não configurado no .env')
    return { success: false, message: 'Supabase não configurado' }
  }

  try {
    // Faz a atualização (PATCH) direto no Supabase filtrando pelo ID do lead
    const response = await $fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': config.supabaseServiceRoleKey,
        'Authorization': `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: {
        status,
        valor_orcamento: parseFloat(valor_orcamento) || 0,
        observacoes
      }
    })

    return {
      success: true,
      lead: response
    }
  } catch (error: any) {
    console.error('[api/admin/update-lead] Erro ao atualizar lead no Supabase:', error?.message || error)
    return {
      success: false,
      error: error?.message || 'Erro ao salvar alterações no banco de dados'
    }
  }
})
