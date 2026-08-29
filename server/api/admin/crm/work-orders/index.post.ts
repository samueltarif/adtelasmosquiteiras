import { defineEventHandler, readBody, createError } from 'h3'
import { requireActiveAdmin } from '../../../../utils/adminAuth.ts'
import { getSupabaseHeaders, logCrmActivity, ALLOWED_OS_CATEGORIAS } from '../../../../utils/crm.ts'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase não configurado no servidor' })
  }

  const body = await readBody(event).catch(() => ({}))

  if (body.dataPrevista !== undefined || body.data_prevista !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERR_DATA_PREVISTA_MANAGED_BY_AGENDA: A data prevista de instalação é gerenciada automaticamente pela Agenda através de agendamentos.',
      data: {
        error: {
          code: 'ERR_DATA_PREVISTA_MANAGED_BY_AGENDA',
          message: 'A data prevista de instalação é gerenciada automaticamente pela Agenda através de agendamentos.'
        }
      }
    })
  }

  if (!body.clientId || typeof body.clientId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Cliente é obrigatório' })
  }

  const clientId = body.clientId.trim()
  const headers = getSupabaseHeaders(config.supabaseServiceRoleKey)

  const clientCheck = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/clients?id=eq.${clientId}&select=id,nome`, { headers }).catch(() => [])
  if (!clientCheck || clientCheck.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cliente selecionado não foi encontrado' })
  }

  let addressId: string | null = null
  if (body.addressId && typeof body.addressId === 'string' && body.addressId.trim() !== '') {
    addressId = body.addressId.trim()
    const addrCheck = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/client_addresses?id=eq.${addressId}&client_id=eq.${clientId}&select=id`,
      { headers }
    ).catch(() => [])
    if (!addrCheck || addrCheck.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'O endereço informado não pertence ao cliente selecionado' })
    }
  }

  let responsibleStaffId: string | null = null
  if (body.responsibleStaffId && typeof body.responsibleStaffId === 'string' && body.responsibleStaffId.trim() !== '') {
    responsibleStaffId = body.responsibleStaffId.trim()
    const staffCheck = await $fetch<any[]>(
      `${config.supabaseUrl}/rest/v1/crm_staff?id=eq.${responsibleStaffId}&is_active=eq.true&select=id`,
      { headers }
    ).catch(() => [])
    if (!staffCheck || staffCheck.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'O responsável técnico informado não está ativo ou não foi encontrado' })
    }
  }

  const initialItem = body.initialItem
  if (!initialItem || typeof initialItem !== 'object' || !initialItem.descricao || String(initialItem.descricao).trim().length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'WORK_ORDER_INITIAL_ITEM_REQUIRED: O item inicial com descrição válida é obrigatório.'
    })
  }

  const cat = initialItem.categoria_operacional || 'outro'
  if (!ALLOWED_OS_CATEGORIAS.includes(cat)) {
    throw createError({ statusCode: 400, statusMessage: `Categoria operacional inválida. Permitidas: ${ALLOWED_OS_CATEGORIAS.join(', ')}` })
  }

  const qtd = parseInt(String(initialItem.quantidade || '1'), 10)
  const preco = Number(initialItem.preco_unitario || 0)
  if (isNaN(qtd) || qtd <= 0 || isNaN(preco) || preco < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Quantidade e preço unitário do item inicial devem ser válidos.' })
  }

  const valorDesconto = Number(body.valorDesconto || 0)
  if (isNaN(valorDesconto) || valorDesconto < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Valor de desconto inválido' })
  }

  let createdWorkOrder: any = null
  try {
    const createdList = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/work_orders`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: {
        client_id: clientId,
        address_id: addressId,
        responsible_staff_id: responsibleStaffId,
        status_os: 'orcamento',
        valor_total: 0.00,
        valor_desconto: valorDesconto,
        data_prevista: null,
        proposal_issued_at: new Date().toISOString(),
        proposal_valid_until: body.proposalValidUntil ? String(body.proposalValidUntil).trim() : null,
        observacoes_gerais: body.observacoesGerais ? String(body.observacoesGerais).trim() : null,
        created_by: admin.userId || null
      }
    })
    createdWorkOrder = createdList && createdList[0] ? createdList[0] : null
    if (!createdWorkOrder?.id) throw new Error('Falha ao criar work_orders')
  } catch (err: any) {
    console.error('[CreateWorkOrder] Falha ao criar OS:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Falha ao criar ordem de serviço no banco de dados' })
  }

  try {
    await $fetch(`${config.supabaseUrl}/rest/v1/work_order_items`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: {
        work_order_id: createdWorkOrder.id,
        service_key: initialItem.service_key || null,
        categoria_operacional: cat,
        descricao: initialItem.descricao.trim(),
        quantidade: qtd,
        preco_unitario: preco,
        observacoes: initialItem.observacoes ? String(initialItem.observacoes).trim() : null,
        sort_order: 0
      }
    })
  } catch (itemErr: any) {
    console.error('[CreateWorkOrder] Falha no item inicial. Compensando OS...', itemErr?.message || itemErr)
    await $fetch(`${config.supabaseUrl}/rest/v1/work_orders?id=eq.${createdWorkOrder.id}`, { method: 'DELETE', headers }).catch(() => {})
    throw createError({ statusCode: 500, statusMessage: 'Falha ao adicionar item inicial da ordem de serviço' })
  }

  const selectFields = 'id,numero_os,client_id,address_id,responsible_staff_id,status_os,valor_total,valor_desconto,valor_final,proposal_issued_at,proposal_valid_until,data_prevista,data_conclusao,observacoes_gerais,is_archived,created_at,updated_at,client:clients(id,nome,telefone_principal,email,tipo_cliente),address:client_addresses(id,rotulo,logradouro,numero,bairro,cidade,uf),responsible:crm_staff(id,nome,funcao)'
  const fetched = await $fetch<any[]>(`${config.supabaseUrl}/rest/v1/work_orders?id=eq.${createdWorkOrder.id}&select=${selectFields}`, { headers }).catch(() => [createdWorkOrder])
  const fullWorkOrder = fetched && fetched[0] ? fetched[0] : createdWorkOrder

  await logCrmActivity(
    { url: config.supabaseUrl, serviceRoleKey: config.supabaseServiceRoleKey },
    {
      clientId,
      workOrderId: createdWorkOrder.id,
      entityType: 'work_order',
      entityId: createdWorkOrder.id,
      acao: 'work_order_created',
      descricaoHumana: `Ordem de Serviço ${createdWorkOrder.numero_os} criada manualmente`,
      dadosNovos: { source: 'manual', work_order_id: createdWorkOrder.id },
      actorId: admin.userId
    }
  )

  return { success: true, workOrder: fullWorkOrder }
})
