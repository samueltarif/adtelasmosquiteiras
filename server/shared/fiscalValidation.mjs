/**
 * ======================================================================
 * FISCAL VALIDATION & CALCULATION HELPERS — AD Telas e Redes
 * ======================================================================
 * Funções puras para aritmética decimal, conferência de totais e validação
 * de pré-requisitos de emissão fiscal sem valores presumidos.
 */

import { isValidCpfCnpj } from './cpfCnpjValidation.mjs'

export function roundMoney(val) {
  const num = typeof val === 'number' ? val : parseFloat(String(val || 0))
  if (isNaN(num)) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

export function calculateItemTotals(itemOrQtd, unitVal, discountVal) {
  let quantidade = 1
  let valorUnitario = 0
  let valorDesconto = 0

  if (typeof itemOrQtd === 'object' && itemOrQtd !== null) {
    quantidade = typeof itemOrQtd.quantidade === 'number' ? itemOrQtd.quantidade : parseFloat(String(itemOrQtd.quantidade || 1))
    valorUnitario = roundMoney(itemOrQtd.valor_unitario)
    valorDesconto = roundMoney(itemOrQtd.valor_desconto || 0)
  } else {
    quantidade = typeof itemOrQtd === 'number' ? itemOrQtd : parseFloat(String(itemOrQtd || 1))
    valorUnitario = roundMoney(unitVal || 0)
    valorDesconto = roundMoney(discountVal || 0)
  }

  const valorTotal = roundMoney(quantidade * valorUnitario)
  const valorLiquido = roundMoney(Math.max(0, valorTotal - valorDesconto))
  return { quantidade, valor_unitario: valorUnitario, valor_total: valorTotal, valor_desconto: valorDesconto, valor_liquido: valorLiquido }
}


export function calculateDocumentTotals(items) {
  let total = 0, servicos = 0, produtos = 0, desconto = 0, liquido = 0
  let iss = 0, icms = 0, pis = 0, cofins = 0, ibs = 0, cbs = 0, retencoes = 0

  for (const it of items) {
    const calc = calculateItemTotals(it)
    total = roundMoney(total + calc.valor_total)
    desconto = roundMoney(desconto + calc.valor_desconto)
    liquido = roundMoney(liquido + calc.valor_liquido)

    if (it.tipo_item === 'servico') {
      servicos = roundMoney(servicos + calc.valor_liquido)
      if (it.aliquota_iss) iss = roundMoney(iss + (calc.valor_liquido * (Number(it.aliquota_iss) / 100)))
    } else {
      produtos = roundMoney(produtos + calc.valor_liquido)
      if (it.aliquota_icms) icms = roundMoney(icms + (calc.valor_liquido * (Number(it.aliquota_icms) / 100)))
    }
    if (it.aliquota_pis) pis = roundMoney(pis + (calc.valor_liquido * (Number(it.aliquota_pis) / 100)))
    if (it.aliquota_cofins) cofins = roundMoney(cofins + (calc.valor_liquido * (Number(it.aliquota_cofins) / 100)))
    if (it.aliquota_ibs) ibs = roundMoney(ibs + (calc.valor_liquido * (Number(it.aliquota_ibs) / 100)))
    if (it.aliquota_cbs) cbs = roundMoney(cbs + (calc.valor_liquido * (Number(it.aliquota_cbs) / 100)))
    if (it.valor_retencao) retencoes = roundMoney(retencoes + Number(it.valor_retencao))
  }

  return {
    valor_total: total,
    valor_servicos: servicos,
    valor_produtos: produtos,
    valor_desconto: desconto,
    valor_liquido: liquido,
    valor_iss: iss,
    valor_icms: icms,
    valor_pis: pis,
    valor_cofins: cofins,
    valor_ibs: ibs,
    valor_cbs: cbs,
    valor_retencoes: retencoes
  }
}

export function validateEmissionPreconditions(docOrOptions, maybeItems, maybeEmitter, maybeRecipient, maybeAddress) {
  let doc, items, emitter, recipient, address

  if (docOrOptions && typeof docOrOptions === 'object' && ('documentType' in docOrOptions || 'company' in docOrOptions || 'emitter' in docOrOptions)) {
    doc = { tipo_documento: docOrOptions.documentType || docOrOptions.doc?.tipo_documento }
    items = docOrOptions.items || []
    emitter = docOrOptions.company || docOrOptions.emitter || {}
    recipient = docOrOptions.recipient || {}
    address = docOrOptions.address || {}
  } else {
    doc = docOrOptions
    items = maybeItems || []
    emitter = maybeEmitter || {}
    recipient = maybeRecipient || {}
    address = maybeAddress || {}
  }

  const errors = []

  if (!doc?.tipo_documento || !['nfe', 'nfse'].includes(doc.tipo_documento)) {
    errors.push({ field: 'tipo_documento', message: 'Tipo de documento inválido ou não informado (NFe ou NFSe).', blocking: true })
  }

  if (!emitter?.regime_tributario) {
    errors.push({ field: 'emitter.regime_tributario', code: 'MISSING_REGIME_TRIBUTARIO', message: 'Regime tributário da empresa não informado nas configurações.', blocking: true })
  }
  if (emitter?.cnpj && !isValidCpfCnpj(emitter.cnpj)) {
    errors.push({ field: 'emitter.cnpj', code: 'INVALID_CNPJ_EMITTER', message: 'CNPJ do emitente inválido.', blocking: true })
  }
  if (doc?.tipo_documento === 'nfse' && !emitter?.inscricao_municipal) {
    errors.push({ field: 'emitter.inscricao_municipal', code: 'MISSING_IM_EMITENTE', message: 'Inscrição Municipal do emitente necessária para emissão de NFS-e.', blocking: true })
  }
  if (doc?.tipo_documento === 'nfe' && !emitter?.inscricao_estadual) {
    errors.push({ field: 'emitter.inscricao_estadual', code: 'MISSING_IE_EMITENTE', message: 'Inscrição Estadual do emitente necessária para emissão de NF-e.', blocking: true })
  }

  if (recipient?.documento && !isValidCpfCnpj(recipient.documento)) {
    errors.push({ field: 'recipient.documento', code: 'INVALID_DOC_RECIPIENT', message: 'CPF ou CNPJ do destinatário inválido.', blocking: true })
  }
  if (doc?.tipo_documento === 'nfe' && !recipient?.indicador_ie) {
    errors.push({ field: 'recipient.indicador_ie', code: 'MISSING_INDICADOR_IE_DEST', message: 'Indicador de Inscrição Estadual do destinatário deve ser informado (Contribuinte, Isento ou Não Contribuinte).', blocking: true })
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', code: 'EMPTY_ITEMS', message: 'O documento fiscal deve conter pelo menos um item selecionado.', blocking: true })
  } else {
    items.forEach((it, idx) => {
      const prefix = `items[${idx}]`
      if (!it.descricao || it.descricao.trim().length < 2) {
        errors.push({ field: `${prefix}.descricao`, code: 'INVALID_DESCRIPTION', message: `Item ${idx + 1}: Descrição deve ter pelo menos 2 caracteres.`, blocking: true })
      }
      if (!it.quantidade || Number(it.quantidade) <= 0) {
        errors.push({ field: `${prefix}.quantidade`, code: 'INVALID_QUANTITY', message: `Item ${idx + 1}: Quantidade deve ser maior que zero.`, blocking: true })
      }
      if (it.valor_unitario === undefined || Number(it.valor_unitario) < 0) {
        errors.push({ field: `${prefix}.valor_unitario`, code: 'INVALID_UNIT_PRICE', message: `Item ${idx + 1}: Valor unitário inválido.`, blocking: true })
      }
      if (!it.tipo_item || !['servico', 'mercadoria'].includes(it.tipo_item)) {
        errors.push({ field: `${prefix}.tipo_item`, code: 'INVALID_ITEM_TYPE', message: `Item ${idx + 1}: Tipo de item não classificado (serviço ou mercadoria).`, blocking: true })
      } else if (it.tipo_item === 'servico') {
        if (!it.codigo_servico_lc116 && !it.codigo_tributacao_municipio) {
          errors.push({ field: `${prefix}.codigo_servico`, code: 'MISSING_SERVICE_CODE', message: `Item ${idx + 1}: Código de Serviço LC 116 ou Código de Tributação Municipal obrigatório para serviços.`, blocking: true })
        }
      } else if (it.tipo_item === 'mercadoria') {
        if (!it.ncm || String(it.ncm).replace(/\D/g, '').length !== 8) {
          errors.push({ field: `${prefix}.ncm`, code: 'MISSING_NCM', message: `Item ${idx + 1}: NCM obrigatório com 8 dígitos para mercadorias.`, blocking: true })
        }
        if (!it.cfop || String(it.cfop).replace(/\D/g, '').length !== 4) {
          errors.push({ field: `${prefix}.cfop`, code: 'MISSING_CFOP', message: `Item ${idx + 1}: CFOP obrigatório com 4 dígitos para mercadorias.`, blocking: true })
        }
      }
    })
  }

  return {
    isValid: errors.filter(e => e.blocking).length === 0,
    errors
  }
}

export const validateFiscalPreconditions = validateEmissionPreconditions

