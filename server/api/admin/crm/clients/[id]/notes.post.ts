import { requireActiveAdmin } from '../../../../../utils/adminAuth'
import {
  ALLOWED_NOTE_CATEGORIAS,
  logCrmActivity,
  getSupabaseHeaders
} from '../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event).catch(() => ({}))

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID do cliente é obrigatório.' })
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de banco de dados indisponível.' })
  }

  const conteudo = typeof body.conteudo === 'string' ? body.conteudo.trim() : ''
  if (!conteudo || conteudo.length < 2) {
    throw createError({ statusCode: 400, message: 'O conteúdo da nota deve ter pelo menos 2 caracteres.' })
  }

  const categoria = ALLOWED_NOTE_CATEGORIAS.includes(body.categoria) ? body.categoria : 'geral'
  const workOrderId = body.work_order_id && typeof body.work_order_id === 'string' ? body.work_order_id : null

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  try {
    const res = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/crm_notes`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: {
        client_id: id,
        work_order_id: workOrderId,
        conteudo,
        categoria,
        author_id: admin.userId
      }
    })

    if (!Array.isArray(res) || res.length === 0) {
      throw new Error('Falha ao inserir nota no banco.')
    }

    const createdNote = res[0]

    // Registra atividade sem duplicar o texto completo no log (data minimization)
    await logCrmActivity(
      { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
      {
        clientId: id,
        workOrderId,
        entityType: 'note',
        entityId: createdNote.id,
        acao: 'note_added',
        descricaoHumana: `Nova anotação de categoria '${categoria}' registrada.`,
        dadosNovos: { note_id: createdNote.id, categoria },
        actorId: admin.userId
      }
    )

    return {
      success: true,
      note: createdNote
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[clients/notes/create] Erro ao criar nota:', err)
    throw createError({ statusCode: 500, message: 'Erro ao salvar anotação.' })
  }
})
