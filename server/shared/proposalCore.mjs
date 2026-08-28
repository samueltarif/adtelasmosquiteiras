/**
 * Módulo Core de Propostas Comerciais, Geração de PDF e Orquestração
 * Arquivo: server/shared/proposalCore.mjs
 */

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Config, isR2Configured, getS3Client } from './r2StorageCore.mjs'

export function formatCurrencyBrl(val) {
  const num = typeof val === 'number' ? val : 0
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

export function formatDateBr(val) {
  if (!val) return '-'
  const d = typeof val === 'string' ? new Date(val) : val
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(d)
}

/**
 * Produz a representação canônica e determinística dos termos comerciais e calcula seu hash SHA-256.
 */
export function computeCommercialTermsInputHash(validUntil, terms) {
  const cleanValidUntil = validUntil ? String(validUntil).trim().slice(0, 10) : null
  
  const sanitizedTerms = {
    condicoes_pagamento: terms?.condicoes_pagamento ? String(terms.condicoes_pagamento).trim() : null,
    prazo_instalacao_dias: typeof terms?.prazo_instalacao_dias === 'number' && Number.isInteger(terms.prazo_instalacao_dias)
      ? Math.max(1, Math.min(365, terms.prazo_instalacao_dias))
      : (terms?.prazo_instalacao_dias ? parseInt(String(terms.prazo_instalacao_dias), 10) || null : null),
    incluir_medicoes: typeof terms?.incluir_medicoes === 'boolean' ? terms.incluir_medicoes : false,
    observacoes_proposta: terms?.observacoes_proposta ? String(terms.observacoes_proposta).trim() : null
  }

  // Objeto canônico com chaves ordenadas
  const canonicalObj = {
    condicoes_pagamento: sanitizedTerms.condicoes_pagamento,
    incluir_medicoes: sanitizedTerms.incluir_medicoes,
    observacoes_proposta: sanitizedTerms.observacoes_proposta,
    prazo_instalacao_dias: sanitizedTerms.prazo_instalacao_dias,
    valid_until: cleanValidUntil
  }

  const canonicalJson = JSON.stringify(canonicalObj)
  const hashHex = crypto.createHash('sha256').update(canonicalJson).digest('hex').toLowerCase()

  return { canonicalJson, hashHex, sanitizedTerms }
}

export function buildProposalStorageKey(workOrderId, proposalId) {
  const cleanWoId = String(workOrderId).trim().toLowerCase()
  const cleanPropId = String(proposalId).trim().toLowerCase()
  return `proposals/${cleanWoId}/${cleanPropId}.pdf`
}

export function isValidProposalStorageKey(key, expectedWorkOrderId, expectedProposalId) {
  if (!key || typeof key !== 'string') return false
  if (key.includes('..') || key.includes('\\') || !key.startsWith('proposals/') || !key.endsWith('.pdf')) {
    return false
  }

  const parts = key.split('/')
  if (parts.length !== 3 || parts[0] !== 'proposals') return false

  const woId = parts[1]
  const filePart = parts[2]
  const propId = filePart.replace(/\.pdf$/i, '')

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(woId) || !uuidRegex.test(propId)) return false

  if (expectedWorkOrderId && woId.toLowerCase() !== expectedWorkOrderId.toLowerCase()) return false
  if (expectedProposalId && propId.toLowerCase() !== expectedProposalId.toLowerCase()) return false

  return true
}

export async function uploadProposalPdfToR2(storageKey, pdfBuffer, s3ClientOverride) {
  const cfg = getR2Config()
  const client = s3ClientOverride || getS3Client(cfg)

  if (!isR2Configured(cfg) && !s3ClientOverride) {
    return { success: true, bytes: pdfBuffer.length }
  }

  const command = new PutObjectCommand({
    Bucket: cfg.bucketName,
    Key: storageKey,
    ContentType: 'application/pdf',
    ContentLength: pdfBuffer.length,
    Body: pdfBuffer
  })

  await client.send(command)
  return { success: true, bytes: pdfBuffer.length }
}

export async function headProposalObjectInR2(storageKey, s3ClientOverride) {
  const cfg = getR2Config()
  const client = s3ClientOverride || getS3Client(cfg)

  if (!isR2Configured(cfg) && !s3ClientOverride) {
    return { exists: true, contentLength: 1024, contentType: 'application/pdf' }
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: cfg.bucketName,
      Key: storageKey
    })
    const res = await client.send(command)
    return {
      exists: true,
      contentLength: res.ContentLength,
      contentType: res.ContentType
    }
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return { exists: false }
    }
    throw err
  }
}

export async function generateProposalSignedDownloadUrl(storageKey, expiresInSeconds = 300, s3ClientOverride) {
  const cfg = getR2Config()
  const client = s3ClientOverride || getS3Client(cfg)

  if (!isR2Configured(cfg) && !s3ClientOverride) {
    return `https://${cfg.accountId || 'mock-account'}.r2.cloudflarestorage.com/${cfg.bucketName}/${storageKey}?X-Amz-Signature=mock_presigned_download_url`
  }

  const command = new GetObjectCommand({
    Bucket: cfg.bucketName,
    Key: storageKey,
    ResponseContentType: 'application/pdf'
  })

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds
  })
}

// ============================================================================
// CONSTANTES DE GEOMETRIA E LAYOUT DO DOCUMENTO (A4)
// ============================================================================
export const PDF_LAYOUT = {
  PAGE_WIDTH: 595.28,
  PAGE_HEIGHT: 841.89,
  MARGIN_LEFT: 36,
  MARGIN_RIGHT: 36,
  MARGIN_TOP: 32,
  MARGIN_BOTTOM: 36,
  CONTENT_WIDTH: 595.28 - 36 - 36, // 523.28 pt
  FOOTER_RESERVED_HEIGHT: 44,
  get CONTENT_BOTTOM() {
    return this.PAGE_HEIGHT - this.MARGIN_BOTTOM - this.FOOTER_RESERVED_HEIGHT // 761.89 pt
  },
  LOGO_BOX_WIDTH: 105,
  LOGO_BOX_HEIGHT: 52,
  SECTION_GAP: 11,
  COLORS: {
    PRIMARY: '#1e3a8a',
    DARK: '#0f172a',
    GRAY_TEXT: '#475569',
    LIGHT_BG: '#f8fafc',
    BORDER: '#cbd5e1',
    HEADER_BG: '#e2e8f0',
    ROW_ALT_BG: '#f8fafc',
    MEASUREMENT_BG: '#f1f5f9',
    SUCCESS: '#16a34a',
    PREVIEW_RED: '#b91c1c'
  }
}

/**
 * Gera o documento PDF em memória e retorna um Buffer binário completo.
 */
export async function generateProposalPdfBuffer(options) {
  return new Promise((resolve, reject) => {
    try {
      const L = PDF_LAYOUT
      const C = L.COLORS

      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: L.MARGIN_TOP,
          bottom: L.MARGIN_BOTTOM + L.FOOTER_RESERVED_HEIGHT,
          left: L.MARGIN_LEFT,
          right: L.MARGIN_RIGHT
        },
        bufferPages: true,
        info: {
          Title: `Orçamento ${options.numeroOs}${options.versionNumber ? ` - Rev. ${String(options.versionNumber).padStart(2, '0')}` : ' - Prévia'}`,
          Author: options.companySnapshot?.trade_name || 'AD Telas e Redes',
          Subject: 'Orçamento Comercial',
          Creator: 'AD Telas e Redes CRM System'
        }
      })

      const chunks = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err) => reject(err))

      const isPreview = !!options.isPreview
      const company = options.companySnapshot || {}
      const client = options.clientSnapshot || {}
      const address = options.addressSnapshot || null
      const items = Array.isArray(options.itemsSnapshot) ? options.itemsSnapshot : []
      const totals = options.totalsSnapshot || {}
      const terms = options.commercialTerms || {}

      const revText = isPreview ? 'PRÉVIA' : `Rev. ${String(options.versionNumber || 1).padStart(2, '0')}`
      const companyName = company.trade_name || 'AD TELAS E REDES DE PROTEÇÃO'

      // Helper para desenhar cabeçalho compacto nas páginas 2..N
      function drawRunningHeader() {
        const hY = L.MARGIN_TOP
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.PRIMARY)
          .text(companyName, L.MARGIN_LEFT, hY, { width: L.CONTENT_WIDTH / 2, lineBreak: false })
        
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.DARK)
          .text(`Orçamento ${options.numeroOs} | ${revText}`, L.MARGIN_LEFT + L.CONTENT_WIDTH / 2, hY, {
            width: L.CONTENT_WIDTH / 2,
            align: 'right',
            lineBreak: false
          })

        doc.strokeColor(C.BORDER).lineWidth(0.6)
          .moveTo(L.MARGIN_LEFT, hY + 14)
          .lineTo(L.MARGIN_LEFT + L.CONTENT_WIDTH, hY + 14)
          .stroke()

        doc.y = hY + 22
      }

      // Helper para garantir espaço antes de desenhar blocos indivisíveis
      function ensureSpace(requiredHeight, onNewPageCallback) {
        if (doc.y + requiredHeight > L.CONTENT_BOTTOM) {
          doc.addPage()
          drawRunningHeader()
          if (typeof onNewPageCallback === 'function') {
            onNewPageCallback()
          }
        }
      }

      // ----------------------------------------------------------------------
      // 1. CABEÇALHO INSTITUCIONAL COMPLETO (Página 1)
      // ----------------------------------------------------------------------
      const headerStartY = L.MARGIN_TOP
      let logoLoaded = false

      if (company.logo_path && typeof company.logo_path === 'string') {
        const cleanPath = company.logo_path.startsWith('/') ? company.logo_path.slice(1) : company.logo_path
        const fullLocalPath = path.resolve('public', cleanPath)
        if (fs.existsSync(fullLocalPath)) {
          try {
            doc.image(fullLocalPath, L.MARGIN_LEFT, headerStartY, {
              fit: [L.LOGO_BOX_WIDTH, L.LOGO_BOX_HEIGHT],
              align: 'left',
              valign: 'center'
            })
            logoLoaded = true
          } catch (e) {
            // Ignora falha de decodificação de imagem
          }
        }
      }

      const textStartX = logoLoaded ? L.MARGIN_LEFT + L.LOGO_BOX_WIDTH + 14 : L.MARGIN_LEFT
      const textWidth = L.CONTENT_WIDTH - (textStartX - L.MARGIN_LEFT)

      doc.font('Helvetica-Bold').fontSize(13).fillColor(C.PRIMARY)
        .text(companyName, textStartX, headerStartY, { width: textWidth })

      doc.font('Helvetica').fontSize(8).fillColor(C.GRAY_TEXT)

      const companyLines = []
      if (company.legal_name && company.legal_name !== company.trade_name) companyLines.push(company.legal_name)
      if (company.cnpj) companyLines.push(`CNPJ: ${company.cnpj}`)
      
      const contactParts = []
      if (company.phone_display) contactParts.push(`Tel: ${company.phone_display}`)
      if (company.whatsapp_number) contactParts.push(`WhatsApp: ${company.whatsapp_number}`)
      if (company.email_contact) contactParts.push(`E-mail: ${company.email_contact}`)
      if (contactParts.length > 0) companyLines.push(contactParts.join(' | '))

      const addrParts = []
      if (company.street) {
        let addrStr = company.street
        if (company.number) addrStr += `, ${company.number}`
        if (company.complement) addrStr += ` (${company.complement})`
        if (company.neighborhood) addrStr += ` - ${company.neighborhood}`
        if (company.city && company.state) addrStr += ` - ${company.city}/${company.state}`
        if (company.cep) addrStr += ` - CEP: ${company.cep}`
        addrParts.push(addrStr)
      }
      if (company.website) addrParts.push(company.website)
      if (addrParts.length > 0) companyLines.push(addrParts.join(' | '))

      let companyCurY = doc.y + 2
      for (const line of companyLines) {
        doc.text(line, textStartX, companyCurY, { width: textWidth })
        companyCurY = doc.y + 1
      }

      const headerEndY = Math.max(headerStartY + (logoLoaded ? L.LOGO_BOX_HEIGHT : 40), companyCurY) + 6
      doc.strokeColor(C.BORDER).lineWidth(0.8).moveTo(L.MARGIN_LEFT, headerEndY).lineTo(L.MARGIN_LEFT + L.CONTENT_WIDTH, headerEndY).stroke()

      // ----------------------------------------------------------------------
      // 2. BANNER DE IDENTIFICAÇÃO DA PROPOSTA
      // ----------------------------------------------------------------------
      const bannerY = headerEndY + 7
      const bannerHeight = 34
      doc.rect(L.MARGIN_LEFT, bannerY, L.CONTENT_WIDTH, bannerHeight).fillAndStroke(C.LIGHT_BG, C.BORDER)

      const docTitle = isPreview ? 'PRÉVIA — DOCUMENTO NÃO OFICIAL' : 'ORÇAMENTO COMERCIAL'
      doc.font('Helvetica-Bold').fontSize(11).fillColor(isPreview ? C.PREVIEW_RED : C.PRIMARY)
        .text(docTitle, L.MARGIN_LEFT + 10, bannerY + 11, { width: 250, lineBreak: false })

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.DARK)
        .text(`${options.numeroOs} | ${revText}`, L.MARGIN_LEFT + L.CONTENT_WIDTH - 210, bannerY + 6, { width: 200, align: 'right', lineBreak: false })

      const issueStr = formatDateBr(options.issuedAt || new Date())
      const validStr = formatDateBr(options.validUntil)
      doc.font('Helvetica').fontSize(7.5).fillColor(C.GRAY_TEXT)
        .text(`Emissão: ${issueStr} | Validade: ${validStr}`, L.MARGIN_LEFT + L.CONTENT_WIDTH - 210, bannerY + 20, { width: 200, align: 'right', lineBreak: false })

      doc.y = bannerY + bannerHeight + L.SECTION_GAP

      // ----------------------------------------------------------------------
      // 3. DADOS DO CLIENTE E ENDEREÇO DO SERVIÇO (ALTURA DINÂMICA)
      // ----------------------------------------------------------------------
      const hasAddress = !!(address && (address.logradouro || address.cidade || address.bairro))
      const colBoxWidth = hasAddress ? (L.CONTENT_WIDTH - 10) / 2 : L.CONTENT_WIDTH

      // Pré-cálculo da altura necessária para cliente
      const clientName = client.nome || client.razao_social || 'Cliente não informado'
      doc.font('Helvetica-Bold').fontSize(8.5)
      const clientNameH = doc.heightOfString(clientName, { width: colBoxWidth - 16 })
      
      let clientTextH = 14 + clientNameH + 4 // título + nome
      if (client.cpf_cnpj || client.telefone_principal) clientTextH += 12
      if (client.email) clientTextH += 12
      clientTextH += 10 // padding

      // Pré-cálculo da altura necessária para endereço
      let addressTextH = 0
      if (hasAddress) {
        let addrL1 = address?.logradouro || ''
        if (address?.numero) addrL1 += `, ${address.numero}`
        if (address?.complemento) addrL1 += ` (${address.complemento})`
        
        doc.font('Helvetica').fontSize(8)
        const l1H = doc.heightOfString(addrL1 || 'Endereço cadastrado', { width: colBoxWidth - 16 })
        
        let addrL2 = ''
        if (address?.bairro) addrL2 += address.bairro
        if (address?.cidade && address?.uf) addrL2 += ` - ${address.cidade}/${address.uf}`
        const l2H = addrL2 ? doc.heightOfString(addrL2, { width: colBoxWidth - 16 }) : 0

        addressTextH = 14 + l1H + l2H + (address?.cep ? 12 : 0) + 12
      }

      const clientCardHeight = Math.max(62, clientTextH, addressTextH)
      ensureSpace(clientCardHeight)

      const clientBoxY = doc.y
      doc.rect(L.MARGIN_LEFT, clientBoxY, colBoxWidth, clientCardHeight).fillAndStroke(C.LIGHT_BG, C.BORDER)
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.PRIMARY)
        .text('DADOS DO CLIENTE', L.MARGIN_LEFT + 8, clientBoxY + 7, { width: colBoxWidth - 16 })

      let cY = clientBoxY + 20
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.DARK)
        .text(clientName, L.MARGIN_LEFT + 8, cY, { width: colBoxWidth - 16 })
      cY = doc.y + 2

      doc.font('Helvetica').fontSize(7.5).fillColor(C.GRAY_TEXT)
      let docText = ''
      if (client.cpf_cnpj) docText += `CPF/CNPJ: ${client.cpf_cnpj}  `
      if (client.telefone_principal) docText += `Tel: ${client.telefone_principal}`
      if (docText) {
        doc.text(docText, L.MARGIN_LEFT + 8, cY, { width: colBoxWidth - 16 })
        cY = doc.y + 2
      }
      if (client.email) {
        doc.text(`E-mail: ${client.email}`, L.MARGIN_LEFT + 8, cY, { width: colBoxWidth - 16 })
      }

      if (hasAddress) {
        const addrX = L.MARGIN_LEFT + colBoxWidth + 10
        doc.rect(addrX, clientBoxY, colBoxWidth, clientCardHeight).fillAndStroke(C.LIGHT_BG, C.BORDER)
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.PRIMARY)
          .text('ENDEREÇO DO SERVIÇO', addrX + 8, clientBoxY + 7, { width: colBoxWidth - 16 })

        let aY = clientBoxY + 20
        let addrL1 = address?.logradouro || ''
        if (address?.numero) addrL1 += `, ${address.numero}`
        if (address?.complemento) addrL1 += ` (${address.complemento})`

        doc.font('Helvetica').fontSize(8).fillColor(C.DARK)
          .text(addrL1 || 'Endereço cadastrado', addrX + 8, aY, { width: colBoxWidth - 16 })
        aY = doc.y + 2

        let addrL2 = ''
        if (address?.bairro) addrL2 += address.bairro
        if (address?.cidade && address?.uf) addrL2 += ` - ${address.cidade}/${address.uf}`
        if (addrL2) {
          doc.text(addrL2, addrX + 8, aY, { width: colBoxWidth - 16 })
          aY = doc.y + 2
        }
        if (address?.cep) {
          doc.font('Helvetica').fontSize(7.5).fillColor(C.GRAY_TEXT)
            .text(`CEP: ${address.cep}`, addrX + 8, aY, { width: colBoxWidth - 16 })
        }
      }

      doc.y = clientBoxY + clientCardHeight + L.SECTION_GAP

      // ----------------------------------------------------------------------
      // 4. TABELA DE ITENS (DISCRIMINAÇÃO DOS SERVIÇOS & MEDIÇÕES)
      // ----------------------------------------------------------------------
      const tableX = L.MARGIN_LEFT
      const tableWidth = L.CONTENT_WIDTH
      const colWidths = {
        idx: 22,
        cat: 80,
        qtd: 34,
        unit: 68,
        total: 72,
        get desc() {
          return tableWidth - this.idx - this.cat - this.qtd - this.unit - this.total // 247.28 pt
        }
      }

      function drawTableHeader() {
        const thY = doc.y
        doc.rect(tableX, thY, tableWidth, 18).fillAndStroke(C.HEADER_BG, C.BORDER)
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.DARK)
        doc.text('#', tableX + 2, thY + 5, { width: colWidths.idx, align: 'center', lineBreak: false })
        doc.text('Categoria', tableX + colWidths.idx + 4, thY + 5, { width: colWidths.cat - 6, lineBreak: false })
        doc.text('Descrição', tableX + colWidths.idx + colWidths.cat + 4, thY + 5, { width: colWidths.desc - 6, lineBreak: false })
        doc.text('Qtd', tableX + colWidths.idx + colWidths.cat + colWidths.desc + 2, thY + 5, { width: colWidths.qtd, align: 'center', lineBreak: false })
        doc.text('Unitário', tableX + colWidths.idx + colWidths.cat + colWidths.desc + colWidths.qtd + 2, thY + 5, { width: colWidths.unit - 4, align: 'right', lineBreak: false })
        doc.text('Total', tableX + tableWidth - colWidths.total - 4, thY + 5, { width: colWidths.total, align: 'right', lineBreak: false })
        doc.y = thY + 18
      }

      ensureSpace(40, () => {})
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.PRIMARY)
        .text('DISCRIMINAÇÃO DOS SERVIÇOS E PRODUTOS', tableX, doc.y)
      doc.y += 4

      drawTableHeader()

      items.forEach((item, index) => {
        const catFormatted = (item.categoria_operacional || 'Geral').replace(/_/g, ' ')
        const itemDesc = item.descricao || 'Item de serviço'

        // Cálculo dinâmico da altura da linha para suporte a descrições longas (~300+ caracteres)
        doc.font('Helvetica').fontSize(8)
        const descH = doc.heightOfString(itemDesc, { width: colWidths.desc - 8 })
        const catH = doc.heightOfString(catFormatted, { width: colWidths.cat - 8 })
        const rowContentH = Math.max(12, descH, catH)
        const rowHeight = rowContentH + 10 // 5pt top e bottom padding

        ensureSpace(rowHeight, () => drawTableHeader())

        const rowY = doc.y
        const rowBg = index % 2 === 0 ? '#ffffff' : C.ROW_ALT_BG

        doc.rect(tableX, rowY, tableWidth, rowHeight).fillAndStroke(rowBg, C.BORDER)
        doc.font('Helvetica').fontSize(8).fillColor(C.DARK)
        
        doc.text(String(index + 1), tableX + 2, rowY + 5, { width: colWidths.idx, align: 'center' })
        doc.text(catFormatted, tableX + colWidths.idx + 4, rowY + 5, { width: colWidths.cat - 8 })
        doc.text(itemDesc, tableX + colWidths.idx + colWidths.cat + 4, rowY + 5, { width: colWidths.desc - 8 })
        doc.text(String(item.quantidade || 1), tableX + colWidths.idx + colWidths.cat + colWidths.desc + 2, rowY + 5, { width: colWidths.qtd, align: 'center' })
        doc.text(formatCurrencyBrl(item.preco_unitario), tableX + colWidths.idx + colWidths.cat + colWidths.desc + colWidths.qtd + 2, rowY + 5, { width: colWidths.unit - 4, align: 'right' })
        
        doc.font('Helvetica-Bold').text(formatCurrencyBrl(item.preco_total), tableX + tableWidth - colWidths.total - 4, rowY + 5, { width: colWidths.total, align: 'right' })

        doc.y = rowY + rowHeight

        // Renderização das Medições Técnicas Vinculadas (se toggle ativo)
        if (terms.incluir_medicoes && Array.isArray(item.measurements) && item.measurements.length > 0) {
          item.measurements.forEach((m) => {
            const mDim = `${m.largura_mm || 0}mm x ${m.altura_mm || 0}mm`
            const mDetail = `  ↳ Medição: ${m.ambiente || 'Vão'} (${m.tipo_vao || 'padrão'}) | Dimensões: ${mDim} | Qtd: ${m.quantidade || 1}${m.cor_estrutura ? ` | Cor: ${m.cor_estrutura}` : ''}${m.tipo_material ? ` | Mat: ${m.tipo_material}` : ''}`

            doc.font('Helvetica-Oblique').fontSize(7.5)
            const mTextH = doc.heightOfString(mDetail, { width: tableWidth - 28 })
            const mHeight = mTextH + 8

            ensureSpace(mHeight, () => drawTableHeader())

            const mY = doc.y
            doc.rect(tableX, mY, tableWidth, mHeight).fillAndStroke(C.MEASUREMENT_BG, C.BORDER)
            doc.fillColor(C.GRAY_TEXT).text(mDetail, tableX + 14, mY + 4, { width: tableWidth - 28 })

            doc.y = mY + mHeight
          })
        }
      })

      doc.y += L.SECTION_GAP

      // ----------------------------------------------------------------------
      // 5. CONDIÇÕES COMERCIAIS & RESUMO FINANCEIRO (GEOMETRIA ESTREITA E ZERO OVERFLOW)
      // ----------------------------------------------------------------------
      const rightColWidth = 170
      const totalsGap = 12
      const leftColWidth = tableWidth - rightColWidth - totalsGap // 341.28 pt
      const leftInnerPadding = 8
      const leftInnerWidth = leftColWidth - leftInnerPadding * 2 // 325.28 pt

      // Helper para calcular e desenhar Label (Bold) + Valor (Regular) com contenção estrita
      function measureLabelValueHeight(label, value, maxWidth) {
        doc.font('Helvetica-Bold').fontSize(8)
        const labelW = doc.widthOfString(label)
        doc.font('Helvetica').fontSize(8)
        const valW = doc.widthOfString(value)

        // Se label + valor couberem em 1 única linha
        if (labelW + valW <= maxWidth) {
          return 13
        }

        // Se for multi-linha, label ocupa linha 1 e valor ocupa linhas seguintes
        const valH = doc.heightOfString(value, { width: maxWidth })
        return 12 + valH + 3
      }

      function drawLabelValueBlock(label, value, startX, startY, maxWidth) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(C.DARK)
        const labelW = doc.widthOfString(label)
        doc.font('Helvetica').fontSize(8).fillColor(C.DARK)
        const valW = doc.widthOfString(value)

        // Linha única
        if (labelW + valW <= maxWidth) {
          doc.font('Helvetica-Bold').text(label, startX, startY, { lineBreak: false })
          doc.font('Helvetica').text(value, startX + labelW, startY, { lineBreak: false })
          return startY + 13
        }

        // Multi-linha: Label no topo + valor com quebra de linha estritamente dentro de maxWidth
        doc.font('Helvetica-Bold').text(label, startX, startY, { width: maxWidth, lineBreak: false })
        const valY = startY + 11
        doc.font('Helvetica').text(value, startX, valY, { width: maxWidth })
        return doc.y + 3
      }

      // Pré-cálculo da altura necessária para as condições comerciais
      let termsNeededH = 22 // título e margem superior
      
      const paymentText = terms.condicoes_pagamento || null
      if (paymentText) {
        termsNeededH += measureLabelValueHeight('Forma de Pagamento: ', paymentText, leftInnerWidth)
      }

      const prazoNum = terms.prazo_instalacao_dias
      const prazoText = prazoNum ? `${prazoNum} dias úteis após aprovação formal` : null
      if (prazoText) {
        termsNeededH += measureLabelValueHeight('Prazo Estimado: ', prazoText, leftInnerWidth)
      }

      const obsText = terms.observacoes_proposta || null
      if (obsText) {
        termsNeededH += measureLabelValueHeight('Observações: ', obsText, leftInnerWidth)
      }

      if (!paymentText && !prazoText && !obsText) {
        termsNeededH += 18
      }
      termsNeededH += 8 // bottom padding

      // Pré-cálculo da altura necessária para o quadro de totais
      const hasDiscount = totals.valor_desconto && totals.valor_desconto > 0
      const totalsNeededH = hasDiscount ? 84 : 68

      const summaryCardHeight = Math.max(termsNeededH, totalsNeededH, 76)
      ensureSpace(summaryCardHeight)

      const summaryY = doc.y

      // Card Esquerdo: Condições Comerciais & Prazos
      doc.rect(tableX, summaryY, leftColWidth, summaryCardHeight).fillAndStroke(C.LIGHT_BG, C.BORDER)
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.PRIMARY)
        .text('CONDIÇÕES COMERCIAIS & PRAZOS', tableX + leftInnerPadding, summaryY + 8, { width: leftInnerWidth, lineBreak: false })

      let termY = summaryY + 22
      const innerStartX = tableX + leftInnerPadding

      if (paymentText) {
        termY = drawLabelValueBlock('Forma de Pagamento: ', paymentText, innerStartX, termY, leftInnerWidth)
      }

      if (prazoText) {
        termY = drawLabelValueBlock('Prazo Estimado: ', prazoText, innerStartX, termY, leftInnerWidth)
      }

      if (obsText) {
        termY = drawLabelValueBlock('Observações: ', obsText, innerStartX, termY, leftInnerWidth)
      } else if (!paymentText && !prazoText) {
        doc.font('Helvetica').fontSize(8).fillColor(C.GRAY_TEXT)
          .text('Condições padrão de fornecimento e instalação conforme regulamento da empresa.', innerStartX, termY, { width: leftInnerWidth })
      }

      // Card Direito: Resumo Financeiro
      const totalsX = tableX + leftColWidth + totalsGap
      doc.rect(totalsX, summaryY, rightColWidth, summaryCardHeight).fillAndStroke(C.LIGHT_BG, C.BORDER)

      let tY = summaryY + 9
      doc.font('Helvetica').fontSize(8).fillColor(C.GRAY_TEXT)
        .text('Subtotal:', totalsX + 8, tY, { lineBreak: false })
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.DARK)
        .text(formatCurrencyBrl(totals.valor_total), totalsX + 65, tY, { width: rightColWidth - 73, align: 'right', lineBreak: false })

      if (hasDiscount) {
        tY += 15
        doc.font('Helvetica').fontSize(8).fillColor(C.SUCCESS)
          .text('Desconto:', totalsX + 8, tY, { lineBreak: false })
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.SUCCESS)
          .text(`- ${formatCurrencyBrl(totals.valor_desconto)}`, totalsX + 65, tY, { width: rightColWidth - 73, align: 'right', lineBreak: false })
      }

      tY += 18
      doc.strokeColor(C.BORDER).lineWidth(0.8).moveTo(totalsX + 8, tY).lineTo(totalsX + rightColWidth - 8, tY).stroke()

      tY += 8
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.PRIMARY)
        .text('VALOR TOTAL:', totalsX + 8, tY, { lineBreak: false })
      doc.font('Helvetica-Bold').fontSize(11).fillColor(C.PRIMARY)
        .text(formatCurrencyBrl(totals.valor_final), totalsX + 65, tY - 1, { width: rightColWidth - 73, align: 'right', lineBreak: false })

      doc.y = summaryY + summaryCardHeight + L.SECTION_GAP

      // ----------------------------------------------------------------------
      // 6. TWO-PASS FOOTER & WATERMARK (SEM DISPARAR ADD_PAGE NO PDFKIT)
      // ----------------------------------------------------------------------
      const range = doc.bufferedPageRange()
      const totalPages = range.count

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i)

        // Desativa temporariamente o bottom margin para garantir que doc.text no rodapé nunca crie página extra
        const oldBottomMargin = doc.page.margins.bottom
        doc.page.margins.bottom = 0

        // Marca d'água de prévia efêmera
        if (isPreview) {
          doc.save()
          doc.rotate(-45, { origin: [L.PAGE_WIDTH / 2, L.PAGE_HEIGHT / 2] })
          doc.font('Helvetica-Bold').fontSize(44).fillColor('#ef4444', 0.07)
            .text('PRÉVIA NÃO OFICIAL', L.PAGE_WIDTH / 2 - 250, L.PAGE_HEIGHT / 2 - 22, { align: 'center', width: 500, lineBreak: false })
          doc.restore()
        }

        // Rodapé em coordenada absoluta segura (y = 798..810 pt)
        const footerLineY = L.PAGE_HEIGHT - 42
        doc.save()
        doc.strokeColor(C.BORDER).lineWidth(0.5)
          .moveTo(L.MARGIN_LEFT, footerLineY)
          .lineTo(L.MARGIN_LEFT + L.CONTENT_WIDTH, footerLineY)
          .stroke()

        const footerTextY = footerLineY + 6
        const footerLegal = company.document_footer_text || 'Este documento é uma proposta comercial sujeita a disponibilidade e confirmação de medidas técnicas.'
        
        doc.font('Helvetica').fontSize(7).fillColor(C.GRAY_TEXT)
          .text(footerLegal, L.MARGIN_LEFT, footerTextY, {
            width: L.CONTENT_WIDTH - 110,
            lineBreak: false,
            ellipsis: true
          })

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.GRAY_TEXT)
          .text(`Página ${i + 1} de ${totalPages}`, L.MARGIN_LEFT + L.CONTENT_WIDTH - 100, footerTextY, {
            width: 100,
            align: 'right',
            lineBreak: false
          })
        doc.restore()

        doc.page.margins.bottom = oldBottomMargin
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
