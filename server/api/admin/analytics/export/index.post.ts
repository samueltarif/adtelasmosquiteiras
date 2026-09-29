/**
 * Endpoint de Exportação Analítica Completa do Dashboard (Admin Only)
 * POST /api/admin/analytics/export
 * Arquivo: server/api/admin/analytics/export/index.post.ts
 * Limite: <= 200 linhas
 */

import { requireActiveAdmin } from '../../../../utils/adminAuth'
import type { ExportRequestPayload } from '../../../../../app/types/dashboardExport'
import { collectExportRawData } from '../../../../utils/dashboard-export/exportDataCollector'
import { buildExportTables } from '../../../../utils/dashboard-export/exportDataBuilder'
import { generateExportFilename } from '../../../../utils/dashboard-export/exportFilename'
import { generateCsvFromTable } from '../../../../utils/dashboard-export/exportCsv'
import { generateJsonExport } from '../../../../utils/dashboard-export/exportJson'
import { generateXlsxExport } from '../../../../utils/dashboard-export/exportXlsx'
import { generatePdfExport } from '../../../../utils/dashboard-export/exportPdf'
import { generateCsvZipPackage, generateCompleteZipPackage } from '../../../../utils/dashboard-export/exportZip'

const VALID_FORMATS = ['csv', 'xlsx', 'json', 'pdf', 'zip']

export default defineEventHandler(async (event) => {
  // 1. Autenticação Administrativa Rigorosa
  await requireActiveAdmin(event)

  const config = useRuntimeConfig()
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Serviço de dados indisponível' })
  }

  // 2. Leitura e Validação do Payload
  const body = await readBody<ExportRequestPayload>(event)
  if (!body || !VALID_FORMATS.includes(body.format)) {
    throw createError({ statusCode: 400, message: 'Formato de exportação inválido ou ausente' })
  }

  const requestedDatasets = Array.isArray(body.datasets) && body.datasets.length > 0 
    ? body.datasets 
    : ['overview', 'acquisition', 'google_ads', 'whatsapp', 'leads', 'campaign_kpis']

  // 3. Coleta de Dados Paginados
  const rawData = await collectExportRawData(config.supabaseUrl, config.supabaseServiceRoleKey, body)

  // 4. Montagem das Tabelas
  const allTables = buildExportTables(rawData, body)
  
  // Filtrar apenas os datasets solicitados
  const filteredTables: Record<string, any> = {}
  for (const key of requestedDatasets) {
    if (allTables[key]) {
      filteredTables[key] = allTables[key]
    }
  }

  // Se nenhum dataset filtrado for encontrado, inclui overview por segurança
  if (Object.keys(filteredTables).length === 0) {
    filteredTables.overview = allTables.overview
  }

  // 5. Geração do Arquivo de acordo com o Formato
  let fileBuffer: Buffer
  let mimeType: string
  let filename: string

  switch (body.format) {
    case 'csv': {
      const keys = Object.keys(filteredTables)
      if (keys.length === 1) {
        // Apenas um dataset -> baixa direto .csv
        fileBuffer = generateCsvFromTable(filteredTables[keys[0]])
        mimeType = 'text/csv; charset=utf-8'
        filename = generateExportFilename(keys[0], 'csv')
      } else {
        // Múltiplos datasets -> compacta em .zip contendo um CSV por dataset
        fileBuffer = await generateCsvZipPackage(filteredTables)
        mimeType = 'application/zip'
        filename = generateExportFilename('CSVs_Multiplos', 'zip')
      }
      break
    }

    case 'xlsx': {
      fileBuffer = await generateXlsxExport(rawData.meta, filteredTables)
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = generateExportFilename('Dashboard', 'xlsx')
      break
    }

    case 'json': {
      fileBuffer = generateJsonExport(rawData.meta, filteredTables)
      mimeType = 'application/json; charset=utf-8'
      filename = generateExportFilename('Analytics', 'json')
      break
    }

    case 'pdf': {
      fileBuffer = await generatePdfExport(rawData.meta, filteredTables)
      mimeType = 'application/pdf'
      filename = generateExportFilename('Relatorio_Gerencial', 'pdf')
      break
    }

    case 'zip':
    default: {
      fileBuffer = await generateCompleteZipPackage(rawData.meta, filteredTables)
      mimeType = 'application/zip'
      filename = generateExportFilename('Analytics_Completo', 'zip')
      break
    }
  }

  // 6. Cabeçalhos de Download
  setHeaders(event, {
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': String(fileBuffer.length),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Export-Rows-Count': String(Object.values(filteredTables).reduce((acc: number, t: any) => acc + t.rows.length, 0))
  })

  return fileBuffer
})
