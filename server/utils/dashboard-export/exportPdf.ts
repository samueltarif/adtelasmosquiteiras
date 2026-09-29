/**
 * Gerador de Relatório Gerencial em PDF (PDFKit)
 * Arquivo: server/utils/dashboard-export/exportPdf.ts
 * Limite: <= 200 linhas
 */

import PDFDocument from 'pdfkit'
import type { ExportMetadata } from '../../../app/types/dashboardExport'
import type { ExportTable } from './exportDataBuilder'

export function generatePdfExport(meta: ExportMetadata, tables: Record<string, ExportTable>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `AD Telas e Redes — ${meta.period_label}`,
          Author: 'AD Telas e Redes',
          Subject: `Relatório Gerencial - ${meta.period_label}`,
          Keywords: `period:${meta.filters.period}`
        }
      })
      const chunks: Buffer[] = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', err => reject(err))

      // Cabeçalho Principal / Branding
      doc.rect(40, 40, 515, 65).fill('#0f172a')
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
      doc.text('AD TELAS E REDES DE PROTEÇÃO', 55, 52)
      doc.fontSize(10).font('Helvetica').fillColor('#94a3b8')
      doc.text('Relatório Gerencial de Performance & Telemetria Comercial', 55, 75)

      // Metadados do Relatório
      doc.fillColor('#334155').fontSize(9).font('Helvetica')
      doc.text(`Período Analisado: ${meta.period_label}`, 40, 120)
      doc.text(`Gerado em: ${new Date(meta.exported_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (São Paulo)`, 40, 134)
      doc.text(`Fonte: ${meta.data_sources.tracking}`, 40, 148)

      let currentY = 175

      // Renderizar Resumo dos Datasets
      for (const [key, table] of Object.entries(tables)) {
        // Evita estourar página
        if (currentY > 700) {
          doc.addPage()
          currentY = 40
        }

        // Título da Seção
        doc.rect(40, currentY, 515, 22).fill('#f1f5f9')
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
        doc.text(table.title.toUpperCase(), 48, currentY + 6)
        currentY += 28

        // Tabela resumida (máximo 8 linhas para relatório gerencial)
        const summaryRows = table.rows.slice(0, 8)
        const colWidth = Math.floor(515 / Math.min(table.headers.length, 4))

        // Cabeçalhos (até 4 colunas principais)
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold')
        table.headers.slice(0, 4).forEach((h, i) => {
          doc.text(h, 45 + (i * colWidth), currentY, { width: colWidth - 5 })
        })
        currentY += 14

        // Linha divisória
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke()
        currentY += 6

        // Linhas de dados
        doc.fillColor('#1e293b').fontSize(8).font('Helvetica')
        for (const row of summaryRows) {
          if (currentY > 740) {
            doc.addPage()
            currentY = 40
          }
          row.slice(0, 4).forEach((cell, i) => {
            const valStr = String(cell ?? '-')
            doc.text(valStr, 45 + (i * colWidth), currentY, { width: colWidth - 5 })
          })
          currentY += 15
        }

        if (table.rows.length > 8) {
          doc.fontSize(7).fillColor('#64748b').font('Helvetica-Oblique')
          doc.text(`* Exibindo 8 de ${table.rows.length} registros. Dados detalhados disponíveis nos formatos CSV, XLSX e JSON.`, 45, currentY)
          currentY += 12
        }

        currentY += 16
      }

      // Rodapé
      doc.fontSize(7).fillColor('#94a3b8').font('Helvetica')
      doc.text('AD Telas e Redes — Central de Exportação Segura — Relatório Administrativo Privado', 40, 790, { align: 'center', width: 515 })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
