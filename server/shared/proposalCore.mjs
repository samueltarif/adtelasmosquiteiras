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

/**
 * Gera o documento PDF em memória e retorna um Buffer binário completo.
 */
export async function generateProposalPdfBuffer(options) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
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

      const primaryColor = '#1e3a8a'
      const darkColor = '#0f172a'
      const grayText = '#475569'
      const lightBg = '#f8fafc'
      const borderColor = '#cbd5e1'

      // 1. Cabeçalho da Empresa e Logo
      const headerY = doc.y
      let logoLoaded = false
      if (company.logo_path && typeof company.logo_path === 'string') {
        const cleanPath = company.logo_path.startsWith('/') ? company.logo_path.slice(1) : company.logo_path
        const fullLocalPath = path.resolve('public', cleanPath)
        if (fs.existsSync(fullLocalPath)) {
          try {
            doc.image(fullLocalPath, 40, headerY, { width: 110 })
            logoLoaded = true
          } catch (e) {
            // Ignora falha de imagem e prossegue
          }
        }
      }

      const textStartX = logoLoaded ? 165 : 40
      const textWidth = doc.page.width - textStartX - 40

      doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor)
        .text(company.trade_name || 'AD TELAS E REDES DE PROTEÇÃO', textStartX, headerY, { width: textWidth })

      doc.font('Helvetica').fontSize(8.5).fillColor(grayText)

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

      for (const line of companyLines) {
        doc.moveDown(0.2)
        doc.text(line, textStartX, doc.y, { width: textWidth })
      }

      doc.y = Math.max(doc.y, headerY + (logoLoaded ? 65 : 45)) + 10
      doc.strokeColor(borderColor).lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke()
      doc.moveDown(0.8)

      // 2. Banner de Identificação
      const docBoxY = doc.y
      const docBoxHeight = 38
      doc.rect(40, docBoxY, doc.page.width - 80, docBoxHeight).fillAndStroke(lightBg, borderColor)

      const docTitle = isPreview ? 'PRÉVIA — DOCUMENTO NÃO OFICIAL' : 'ORÇAMENTO COMERCIAL'
      const revText = isPreview ? 'PRÉVIA' : `Rev. ${String(options.versionNumber || 1).padStart(2, '0')}`

      doc.font('Helvetica-Bold').fontSize(12).fillColor(isPreview ? '#b91c1c' : primaryColor)
        .text(docTitle, 52, docBoxY + 12, { width: 260 })

      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor)
        .text(`${options.numeroOs} | ${revText}`, doc.page.width - 240, docBoxY + 8, { width: 190, align: 'right' })

      const issueStr = formatDateBr(options.issuedAt || new Date())
      const validStr = formatDateBr(options.validUntil)
      doc.font('Helvetica').fontSize(8).fillColor(grayText)
        .text(`Emissão: ${issueStr} | Validade: ${validStr}`, doc.page.width - 240, docBoxY + 22, { width: 190, align: 'right' })

      doc.y = docBoxY + docBoxHeight + 14

      // 3. Cliente & Endereço
      const clientBoxY = doc.y
      const hasAddress = !!(address && (address.logradouro || address.cidade || address.bairro))
      const boxColWidth = hasAddress ? (doc.page.width - 92) / 2 : doc.page.width - 80

      doc.rect(40, clientBoxY, boxColWidth, 68).fillAndStroke(lightBg, borderColor)
      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('DADOS DO CLIENTE', 50, clientBoxY + 8)

      doc.font('Helvetica').fontSize(8.5).fillColor(darkColor)
      const clientName = client.nome || client.razao_social || 'Cliente não informado'
      doc.font('Helvetica-Bold').text(clientName, 50, clientBoxY + 22, { width: boxColWidth - 20, ellipsis: true })

      doc.font('Helvetica').fontSize(8).fillColor(grayText)
      let docText = ''
      if (client.cpf_cnpj) docText += `CPF/CNPJ: ${client.cpf_cnpj}  `
      if (client.telefone_principal) docText += `Tel: ${client.telefone_principal}  `
      if (docText) doc.text(docText, 50, clientBoxY + 36, { width: boxColWidth - 20 })
      if (client.email) doc.text(`E-mail: ${client.email}`, 50, clientBoxY + 48, { width: boxColWidth - 20 })

      if (hasAddress) {
        const addrX = 40 + boxColWidth + 12
        doc.rect(addrX, clientBoxY, boxColWidth, 68).fillAndStroke(lightBg, borderColor)
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('ENDEREÇO DO SERVIÇO', addrX + 10, clientBoxY + 8)

        doc.font('Helvetica').fontSize(8).fillColor(darkColor)
        let addrL1 = address?.logradouro || ''
        if (address?.numero) addrL1 += `, ${address.numero}`
        if (address?.complemento) addrL1 += ` (${address.complemento})`
        doc.text(addrL1 || 'Endereço cadastrado', addrX + 10, clientBoxY + 22, { width: boxColWidth - 20 })

        let addrL2 = ''
        if (address?.bairro) addrL2 += address.bairro
        if (address?.cidade && address?.uf) addrL2 += ` - ${address.cidade}/${address.uf}`
        if (addrL2) doc.text(addrL2, addrX + 10, clientBoxY + 36, { width: boxColWidth - 20 })
        if (address?.cep) doc.fillColor(grayText).text(`CEP: ${address.cep}`, addrX + 10, clientBoxY + 48, { width: boxColWidth - 20 })
      }

      doc.y = clientBoxY + 78

      // 4. Tabela de Itens
      doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text('DISCRIMINAÇÃO DOS SERVIÇOS E PRODUTOS', 40, doc.y)
      doc.moveDown(0.4)

      const tableX = 40
      const tableWidth = doc.page.width - 80
      const colWidths = { idx: 24, cat: 86, desc: tableWidth - 24 - 86 - 36 - 72 - 76, qtd: 36, unit: 72, total: 76 }

      const thY = doc.y
      doc.rect(tableX, thY, tableWidth, 20).fillAndStroke('#e2e8f0', borderColor)
      doc.font('Helvetica-Bold').fontSize(8).fillColor(darkColor)
      doc.text('#', tableX + 4, thY + 6, { width: colWidths.idx, align: 'center' })
      doc.text('Categoria', tableX + colWidths.idx + 4, thY + 6, { width: colWidths.cat })
      doc.text('Descrição', tableX + colWidths.idx + colWidths.cat + 4, thY + 6, { width: colWidths.desc })
      doc.text('Qtd', tableX + colWidths.idx + colWidths.cat + colWidths.desc + 2, thY + 6, { width: colWidths.qtd, align: 'center' })
      doc.text('Unitário', tableX + colWidths.idx + colWidths.cat + colWidths.desc + colWidths.qtd + 2, thY + 6, { width: colWidths.unit, align: 'right' })
      doc.text('Total', tableX + tableWidth - colWidths.total - 4, thY + 6, { width: colWidths.total, align: 'right' })

      doc.y = thY + 20

      items.forEach((item, index) => {
        if (doc.y > doc.page.height - 130) doc.addPage()

        const rowY = doc.y
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc'
        const rowHeight = 22

        doc.rect(tableX, rowY, tableWidth, rowHeight).fillAndStroke(rowBg, borderColor)
        doc.font('Helvetica').fontSize(8).fillColor(darkColor)
        doc.text(String(index + 1), tableX + 4, rowY + 6, { width: colWidths.idx, align: 'center' })

        const catFormatted = (item.categoria_operacional || 'Geral').replace('_', ' ')
        doc.text(catFormatted, tableX + colWidths.idx + 4, rowY + 6, { width: colWidths.cat, ellipsis: true })
        doc.text(item.descricao || 'Item de serviço', tableX + colWidths.idx + colWidths.cat + 4, rowY + 6, { width: colWidths.desc, ellipsis: true })
        doc.text(String(item.quantidade || 1), tableX + colWidths.idx + colWidths.cat + colWidths.desc + 2, rowY + 6, { width: colWidths.qtd, align: 'center' })
        doc.text(formatCurrencyBrl(item.preco_unitario), tableX + colWidths.idx + colWidths.cat + colWidths.desc + colWidths.qtd + 2, rowY + 6, { width: colWidths.unit, align: 'right' })
        doc.font('Helvetica-Bold').text(formatCurrencyBrl(item.preco_total), tableX + tableWidth - colWidths.total - 4, rowY + 6, { width: colWidths.total, align: 'right' })

        doc.y = rowY + rowHeight

        // Medições (se habilitadas)
        if (terms.incluir_medicoes && Array.isArray(item.measurements) && item.measurements.length > 0) {
          item.measurements.forEach((m) => {
            if (doc.y > doc.page.height - 110) doc.addPage()
            const mY = doc.y
            const mHeight = 16
            doc.rect(tableX, mY, tableWidth, mHeight).fillAndStroke('#f1f5f9', borderColor)

            const mDim = `${m.largura_mm || 0}mm x ${m.altura_mm || 0}mm`
            const mDetail = `  ↳ Medição: ${m.ambiente || 'Vão'} (${m.tipo_vao || 'padrão'}) | Dimensões: ${mDim} | Qtd: ${m.quantidade || 1}${m.cor_estrutura ? ` | Cor: ${m.cor_estrutura}` : ''}${m.tipo_material ? ` | Mat: ${m.tipo_material}` : ''}`

            doc.font('Helvetica-Oblique').fontSize(7).fillColor(grayText)
              .text(mDetail, tableX + 16, mY + 4, { width: tableWidth - 24, ellipsis: true })

            doc.y = mY + mHeight
          })
        }
      })

      doc.moveDown(0.8)

      // 5. Totais e Condições Comerciais
      if (doc.y > doc.page.height - 160) doc.addPage()

      const summaryY = doc.y
      const leftColWidth = tableWidth - 190
      const rightColWidth = 180

      doc.rect(tableX, summaryY, leftColWidth, 80).fillAndStroke(lightBg, borderColor)
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primaryColor).text('CONDIÇÕES COMERCIAIS & PRAZOS', tableX + 8, summaryY + 8)

      doc.font('Helvetica').fontSize(8).fillColor(darkColor)
      let curY = summaryY + 22

      if (terms.condicoes_pagamento) {
        doc.font('Helvetica-Bold').text('Pagamento: ', tableX + 8, curY, { continued: true })
        doc.font('Helvetica').text(terms.condicoes_pagamento)
        curY += 13
      }
      if (terms.prazo_instalacao_dias) {
        doc.font('Helvetica-Bold').text('Prazo Estimado: ', tableX + 8, curY, { continued: true })
        doc.font('Helvetica').text(`${terms.prazo_instalacao_dias} dias úteis após aprovação`)
        curY += 13
      }
      if (terms.observacoes_proposta) {
        doc.font('Helvetica-Bold').text('Obs: ', tableX + 8, curY, { continued: true })
        doc.font('Helvetica').text(terms.observacoes_proposta, { width: leftColWidth - 16, ellipsis: true })
      } else if (!terms.condicoes_pagamento && !terms.prazo_instalacao_dias) {
        doc.fillColor(grayText).text('Condições padrão de fornecimento e instalação conforme regras da empresa.', tableX + 8, curY, { width: leftColWidth - 16 })
      }

      // Card Resumo Financeiro
      const totalsX = tableX + leftColWidth + 10
      doc.rect(totalsX, summaryY, rightColWidth, 80).fillAndStroke(lightBg, borderColor)

      let tY = summaryY + 10
      doc.font('Helvetica').fontSize(8.5).fillColor(grayText).text('Subtotal:', totalsX + 8, tY)
      doc.font('Helvetica-Bold').fillColor(darkColor).text(formatCurrencyBrl(totals.valor_total), totalsX + 70, tY, { width: rightColWidth - 78, align: 'right' })

      if (totals.valor_desconto && totals.valor_desconto > 0) {
        tY += 16
        doc.font('Helvetica').fontSize(8.5).fillColor('#16a34a').text('Desconto:', totalsX + 8, tY)
        doc.font('Helvetica-Bold').fillColor('#16a34a').text(`- ${formatCurrencyBrl(totals.valor_desconto)}`, totalsX + 70, tY, { width: rightColWidth - 78, align: 'right' })
      }

      tY += 20
      doc.strokeColor(borderColor).lineWidth(0.8).moveTo(totalsX + 8, tY).lineTo(totalsX + rightColWidth - 8, tY).stroke()

      tY += 8
      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('VALOR TOTAL:', totalsX + 8, tY)
      doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor).text(formatCurrencyBrl(totals.valor_final), totalsX + 70, tY - 1, { width: rightColWidth - 78, align: 'right' })

      doc.y = summaryY + 92

      // 6. Rodapé & Paginação (Two-Pass)
      const totalPages = doc.bufferedPageRange().count

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i)

        if (isPreview) {
          doc.save()
          doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
          doc.font('Helvetica-Bold').fontSize(46).fillColor('#ef4444', 0.08)
            .text('PRÉVIA NÃO OFICIAL', doc.page.width / 2 - 250, doc.page.height / 2 - 20, { align: 'center', width: 500 })
          doc.restore()
        }

        const footerY = doc.page.height - 36
        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, footerY - 6).lineTo(doc.page.width - 40, footerY - 6).stroke()

        const footerText = company.document_footer_text || 'Este documento é uma proposta comercial sujeita a disponibilidade e confirmação de medidas técnicas.'
        doc.font('Helvetica').fontSize(7).fillColor(grayText).text(footerText, 40, footerY, { width: doc.page.width - 150, ellipsis: true })
        doc.text(`Página ${i + 1} de ${totalPages}`, doc.page.width - 140, footerY, { width: 100, align: 'right' })
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
