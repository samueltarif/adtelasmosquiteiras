/**
 * Serviço de Montagem e Conferência de Rascunhos Fiscais — AD Telas e Redes
 */

import crypto from 'crypto'
import { getSupabaseHeaders, type SupabaseConfig } from '../../utils/crm'
import { calculateDocumentTotals } from '../../shared/fiscalValidation.mjs'

export async function createFiscalDraftFromWorkOrder(
  config: SupabaseConfig,
  params: {
    workOrderId: string
    tipoDocumento: 'nfe' | 'nfse'
    ambiente?: 'homologacao' | 'producao'
    items: Array<{
      workOrderItemId: string
      quantidade: number
      valorUnitario: number
      valorDesconto?: number
      tipoItem: 'servico' | 'mercadoria'
      ncm?: string
      cfop?: string
      codigoServico?: string
      aliquotaIss?: number
      aliquotaIcms?: number
      aliquotaPis?: number
      aliquotaCofins?: number
      descricao?: string
    }>
    actorId?: string | null
  }
) {
  const headers = getSupabaseHeaders(config.serviceRoleKey)
  const { workOrderId, tipoDocumento, actorId } = params

  // 1. Busca dados da OS, cliente, endereço e perfil da empresa
  const [woRes, compRes, fiscalCfgRes] = await Promise.all([
    $fetch<any[]>(
      `${config.url}/rest/v1/work_orders?id=eq.${workOrderId}&select=*,client:clients(*,fiscal_profile:client_fiscal_profiles(*)),address:client_addresses(*),items:work_order_items(*)`,
      { headers }
    ),
    $fetch<any[]>(`${config.url}/rest/v1/company_profile?id=eq.1`, { headers }),
    $fetch<any[]>(`${config.url}/rest/v1/company_fiscal_settings?id=eq.1`, { headers })
  ])

  const wo = woRes?.[0]
  if (!wo) throw new Error('Ordem de serviço não encontrada.')

  const company = compRes?.[0] || {}
  const fiscalCfg = fiscalCfgRes?.[0] || {}
  const client = wo.client || {}
  const clientFiscal = client.fiscal_profile || {}
  const address = wo.address || {}

  const targetAmbiente = params.ambiente || fiscalCfg.ambiente_padrao || 'homologacao'
  const isSimulated = targetAmbiente === 'homologacao' && (fiscalCfg.provedor_ativo || 'mock_sandbox') === 'mock_sandbox'

  // 2. Confere saldo disponível sem travar (Rascunho apenas confere)
  for (const requestedItem of params.items) {
    const osItem = (wo.items || []).find((i: any) => i.id === requestedItem.workOrderItemId)
    if (!osItem) throw new Error(`Item ${requestedItem.workOrderItemId} não pertence a esta OS.`)

    const committedRes = await $fetch<any[]>(
      `${config.url}/rest/v1/fiscal_document_items?work_order_item_id=eq.${osItem.id}&select=quantidade,doc:fiscal_documents(status,ambiente,is_simulated)`,
      { headers }
    )

    const committedQtd = committedRes
      .filter(r => r.doc && r.doc.ambiente === targetAmbiente && r.doc.is_simulated === isSimulated && ['processando', 'autorizado', 'falha_processamento'].includes(r.doc.status))
      .reduce((sum, r) => sum + Number(r.quantidade || 0), 0)

    const available = Number(osItem.quantidade) - committedQtd
    if (requestedItem.quantidade > available) {
      throw new Error(`Saldo insuficiente para faturar o item "${osItem.descricao}". Disponível: ${available}, Solicitado: ${requestedItem.quantidade}`)
    }
  }

  // 3. Monta itens fiscais e calcula totais
  const formattedItems = params.items.map(it => {
    const osItem = (wo.items || []).find((i: any) => i.id === it.workOrderItemId)
    return {
      work_order_item_id: it.workOrderItemId,
      descricao: it.descricao || osItem?.descricao || 'Item de Serviço/Produto',
      quantidade: it.quantidade,
      valor_unitario: it.valorUnitario,
      valor_desconto: it.valorDesconto || 0,
      valor_total: it.quantidade * it.valorUnitario,
      valor_liquido: Math.max(0, it.quantidade * it.valorUnitario - (it.valorDesconto || 0)),
      tipo_item: it.tipoItem,
      ncm: it.ncm || null,
      cfop: it.cfop || null,
      codigo_servico_lc116: it.codigoServico || null,
      aliquota_iss: it.aliquotaIss || null,
      aliquota_icms: it.aliquotaIcms || null,
      aliquota_pis: it.aliquotaPis || null,
      aliquota_cofins: it.aliquotaCofins || null
    }
  })

  const totals = calculateDocumentTotals(formattedItems)
  const idempotencyKey = `fiscal_${workOrderId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

  // 4. Cria cabeçalho da nota
  const docPayload = {
    work_order_id: workOrderId,
    client_id: wo.client_id,
    address_id: wo.address_id,
    tipo_documento: tipoDocumento,
    ambiente: targetAmbiente,
    is_simulated: isSimulated,
    status: 'rascunho',
    transmission_phase: 'draft',
    storage_pending: false,
    provider: fiscalCfg.provedor_ativo || 'mock_sandbox',
    idempotency_key: idempotencyKey,
    ...totals,
    snapshot_emitente: {
      trade_name: company.trade_name,
      legal_name: company.legal_name,
      cnpj: company.cnpj,
      inscricao_municipal: fiscalCfg.inscricao_municipal,
      inscricao_estadual: fiscalCfg.inscricao_estadual,
      regime_tributario: fiscalCfg.regime_tributario,
      cnae_principal: fiscalCfg.cnae_principal,
      codigo_municipio_ibge: fiscalCfg.codigo_municipio_ibge
    },
    snapshot_destinatario: {
      nome: client.nome,
      razao_social: client.razao_social,
      cpf_cnpj: client.cpf_cnpj,
      tipo_cliente: client.tipo_cliente,
      indicador_ie: clientFiscal.indicador_ie,
      inscricao_estadual: clientFiscal.inscricao_estadual,
      inscricao_municipal: clientFiscal.inscricao_municipal,
      email: clientFiscal.email_fiscal || client.email,
      telefone: client.telefone_principal
    },
    snapshot_endereco: {
      logradouro: address.logradouro,
      numero: address.numero,
      complemento: address.complemento,
      bairro: address.bairro,
      cidade: address.cidade,
      uf: address.uf,
      cep: address.cep,
      codigo_municipio_ibge: address.codigo_municipio_ibge || clientFiscal.codigo_municipio_ibge
    },
    snapshot_itens: formattedItems,
    created_by: actorId || null
  }

  const createdDocs = await $fetch<any[]>(`${config.url}/rest/v1/fiscal_documents`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: docPayload
  })

  const doc = createdDocs?.[0]
  if (!doc) throw new Error('Falha ao criar rascunho de nota fiscal.')

  // 5. Salva itens associados
  const itemsPayload = formattedItems.map(it => ({
    ...it,
    fiscal_document_id: doc.id
  }))

  await $fetch(`${config.url}/rest/v1/fiscal_document_items`, {
    method: 'POST',
    headers,
    body: itemsPayload
  })

  return { success: true, document: doc }
}
