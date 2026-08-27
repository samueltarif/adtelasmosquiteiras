import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../../../utils/adminAuth'
import {
  getSupabaseHeaders,
  logCrmActivity,
  ALLOWED_NOTE_CATEGORIAS
} from '../../../../../../utils/crm'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase não configurado no servidor'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da OS é obrigatório'
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const conteudo = typeof body.conteudo === 'string' ? body.conteudo.trim() : ''
  const categoria = body.categoria && ALLOWED_NOTE_CATEGORIAS.includes(body.categoria) ? body.categoria : 'geral'

  if (!conteudo || conteudo.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conteúdo da nota deve ter no mínimo 2 caracteres'
    })
  }

  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  // 1. Validação da OS
  const woList = await $fetch<any[]>(
    `${config.supabaseUrl}/rest/v1/work_orders?id=eq.${id}&select=id,client_id,numero_os`,
    { headers }
  ).catch(() => [])

  if (!Array.isArray(woList) || woList.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ordem de serviço não encontrada'
    })
  }

  const wo = woList[0]

  try {
    const notePayload = {
      client_id: wo.client_id,
      work_order_id: id,
      categoria,
      conteudo,
      author_id: admin.userId || null
    }

    const insertedList = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/crm_notes`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: notePayload
      }
    )

    const note = insertedList && insertedList[0] ? insertedList[0] : null

    // 2. Registro de Auditoria
    if (note) {
      await logCrmActivity(config, {
        clientId: wo.client_id,
        workOrderId: id,
        entityType: 'note',
        entityId: note.id,
        acao: 'note_added',
        descricaoHumana: `Nova anotação interna adicionada na OS ${wo.numero_os} (Categoria: ${categoria})`,
        dadosNovos: {
          note_id: note.id,
          categoria
        },
        actorId: admin.userId
      })
    }

    return {
      success: true,
      note
    }
  } catch (err: any) {
    console.error('[WorkOrderNoteCreate] Erro ao criar nota:', err?.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao criar anotação na ordem de serviço'
    })
  }
})
