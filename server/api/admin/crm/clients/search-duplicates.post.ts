import { requireActiveAdmin } from '../../../../utils/adminAuth'
import { findDuplicateClients } from '../../../../utils/crm'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const body = await readBody(event).catch(() => ({}))

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const duplicates = await findDuplicateClients(
    {
      url: config.supabaseUrl,
      serviceRoleKey: config.supabaseServiceRoleKey
    },
    {
      telefone: body.telefone,
      email: body.email,
      cpfCnpj: body.cpf_cnpj || body.cpfCnpj,
      excludeClientId: body.excludeClientId
    }
  )

  return {
    success: true,
    hasDuplicates: duplicates.length > 0,
    duplicates
  }
})
