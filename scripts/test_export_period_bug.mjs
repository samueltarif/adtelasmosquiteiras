/**
 * Suíte de Testes Dedicada: Resolução e Propagação de Períodos da Central de Exportação
 * Testa EXPORT-PERIOD-01 a EXPORT-PERIOD-12
 * Arquivo: scripts/test_export_period_bug.mjs (<= 200 linhas)
 */

import assert from 'node:assert/strict'
import { getSaoPauloDateRange } from '../server/shared/adminAnalyticsDateRange.mjs'
import { collectExportRawData } from '../server/utils/dashboard-export/exportDataCollector.ts'
import { buildExportTables } from '../server/utils/dashboard-export/exportDataBuilder.ts'
import { generatePdfExport } from '../server/utils/dashboard-export/exportPdf.ts'
import { generateXlsxExport } from '../server/utils/dashboard-export/exportXlsx.ts'
import { generateJsonExport } from '../server/utils/dashboard-export/exportJson.ts'
import ExcelJS from 'exceljs'

let passed = 0
let failed = 0
function test(id, desc, fn) {
  try { fn(); console.log(`  [PASS] ${id} - ${desc}`); passed++ }
  catch (err) { console.error(`  [FAIL] ${id} - ${desc}: ${err.message}`); failed++ }
}
async function testAsync(id, desc, fn) {
  try { await fn(); console.log(`  [PASS] ${id} - ${desc}`); passed++ }
  catch (err) { console.error(`  [FAIL] ${id} - ${desc}: ${err.message}`); failed++ }
}

async function main() {
  console.log('======================================================================')
  console.log('SUÍTE DE TESTES: RESOLUÇÃO E PROPAGAÇÃO DE PERÍODOS (EXPORT-PERIOD-01..12)')
  console.log('======================================================================')

  // EXPORT-PERIOD-01: Hoje usa somente hoje
  test('EXPORT-PERIOD-01', 'Hoje resolve período de 1 dia com label "Hoje"', () => {
    const r = getSaoPauloDateRange('today')
    assert.strictEqual(r.label, 'Hoje')
    const diffHours = (new Date(r.endUtc) - new Date(r.startUtc)) / (3600 * 1000)
    assert.strictEqual(diffHours, 24, 'Hoje deve ter exatamente 24 horas')
  })

  // EXPORT-PERIOD-02: Últimos 7 dias
  test('EXPORT-PERIOD-02', 'Últimos 7 dias aceita "last7days" e "last7d" com 7 dias de intervalo', () => {
    const r1 = getSaoPauloDateRange('last7days')
    const r2 = getSaoPauloDateRange('last7d')
    assert.strictEqual(r1.label, 'Últimos 7 dias')
    assert.strictEqual(r2.label, 'Últimos 7 dias')
    const diffDays = Math.round((new Date(r1.endUtc) - new Date(r1.startUtc)) / (86400 * 1000))
    assert.strictEqual(diffDays, 7, 'Deve cobrir exatamente 7 dias civis')
  })

  // EXPORT-PERIOD-03: Últimos 30 dias
  test('EXPORT-PERIOD-03', 'Últimos 30 dias aceita "last30days" e "last30d" com 30 dias de intervalo', () => {
    const r1 = getSaoPauloDateRange('last30days')
    const r2 = getSaoPauloDateRange('last30d')
    assert.strictEqual(r1.label, 'Últimos 30 dias')
    assert.strictEqual(r2.label, 'Últimos 30 dias')
    const diffDays = Math.round((new Date(r1.endUtc) - new Date(r1.startUtc)) / (86400 * 1000))
    assert.strictEqual(diffDays, 30, 'Deve cobrir exatamente 30 dias civis')
  })

  // EXPORT-PERIOD-04: Últimos 90 dias
  test('EXPORT-PERIOD-04', 'Últimos 90 dias aceita "last90days" e "last90d" com 90 dias de intervalo', () => {
    const r1 = getSaoPauloDateRange('last90days')
    const r2 = getSaoPauloDateRange('last90d')
    assert.strictEqual(r1.label, 'Últimos 90 dias')
    assert.strictEqual(r2.label, 'Últimos 90 dias')
    const diffDays = Math.round((new Date(r1.endUtc) - new Date(r1.startUtc)) / (86400 * 1000))
    assert.strictEqual(diffDays, 90, 'Deve cobrir exatamente 90 dias civis')
  })

  // EXPORT-PERIOD-05: Personalizado respeita start/end
  test('EXPORT-PERIOD-05', 'Personalizado respeita estritamente start e end informados', () => {
    const r = getSaoPauloDateRange('custom', '2026-09-01', '2026-09-28')
    assert.strictEqual(r.label, '2026-09-01 até 2026-09-28')
    assert.ok(r.startUtc.startsWith('2026-09-01'), `startUtc deve iniciar no dia 01/09: ${r.startUtc}`)
    assert.ok(r.endUtc.startsWith('2026-09-29'), `endUtc deve cobrir o dia 28/09 até início do dia 29: ${r.endUtc}`)
  })

  // Mock collector e builder para testes de pipeline
  const mockFetcher = async () => []
  const dummyPayload = (period, dateFrom, dateTo) => ({
    format: 'pdf',
    period,
    dateFrom,
    dateTo,
    datasets: ['overview']
  })

  // EXPORT-PERIOD-06: Payload frontend mantém período selecionado
  await testAsync('EXPORT-PERIOD-06', 'Collector propaga período selecionado para os metadados', async () => {
    const raw7 = await collectExportRawData('http://mock', 'key', dummyPayload('last7days'), mockFetcher)
    assert.strictEqual(raw7.meta.period_label, 'Últimos 7 dias')
    const raw30 = await collectExportRawData('http://mock', 'key', dummyPayload('last30days'), mockFetcher)
    assert.strictEqual(raw30.meta.period_label, 'Últimos 30 dias')
    const rawCustom = await collectExportRawData('http://mock', 'key', dummyPayload('custom', '2026-09-01', '2026-09-28'), mockFetcher)
    assert.strictEqual(rawCustom.meta.period_label, '2026-09-01 até 2026-09-28')
  })

  // EXPORT-PERIOD-07: Metadata usa período real
  await testAsync('EXPORT-PERIOD-07', 'Metadados não hardcoded preservam requested_start_utc e requested_end_utc', async () => {
    const raw = await collectExportRawData('http://mock', 'key', dummyPayload('custom', '2026-08-30', '2026-09-29'), mockFetcher)
    assert.ok(raw.meta.requested_start_utc.includes('2026-08-30'))
    assert.ok(raw.meta.requested_end_utc.includes('2026-09-30'))
  })

  // EXPORT-PERIOD-08: PDF usa metadata real
  await testAsync('EXPORT-PERIOD-08', 'PDF executivo renderiza metadata com período real e não Hoje', async () => {
    const raw = await collectExportRawData('http://mock', 'key', dummyPayload('last30days'), mockFetcher)
    const tables = buildExportTables(raw, dummyPayload('last30days'))
    const pdfBuf = await generatePdfExport(raw.meta, tables)
    const pdfStr = pdfBuf.toString('binary')
    assert.ok(pdfStr.includes('period:last30days') || pdfStr.includes('30 dias'), 'PDF deve conter "last30days" ou "30 dias" nos metadados')
  })

  // EXPORT-PERIOD-09: XLSX usa mesmo período
  await testAsync('EXPORT-PERIOD-09', 'XLSX inclui período correto na aba Metadados', async () => {
    const raw = await collectExportRawData('http://mock', 'key', dummyPayload('last90days'), mockFetcher)
    const tables = buildExportTables(raw, dummyPayload('last90days'))
    const xlsxBuf = await generateXlsxExport(raw.meta, tables)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(xlsxBuf)
    const metaSheet = wb.getWorksheet('Metadados')
    const periodRow = metaSheet.getRow(5)
    assert.strictEqual(periodRow.getCell(2).value, 'Últimos 90 dias')
  })

  // EXPORT-PERIOD-10: JSON usa mesmo período
  await testAsync('EXPORT-PERIOD-10', 'JSON exportado contém período correto no nó metadata', async () => {
    const raw = await collectExportRawData('http://mock', 'key', dummyPayload('custom', '2026-09-01', '2026-09-28'), mockFetcher)
    const tables = buildExportTables(raw, dummyPayload('custom', '2026-09-01', '2026-09-28'))
    const jsonBuf = generateJsonExport(raw.meta, tables)
    const parsed = JSON.parse(jsonBuf.toString('utf-8'))
    assert.strictEqual(parsed.metadata.period_label, '2026-09-01 até 2026-09-28')
    assert.strictEqual(parsed.metadata.filters.period, 'custom')
  })

  // EXPORT-PERIOD-11: Trocar Hoje -> 30 dias não mantém estado stale
  test('EXPORT-PERIOD-11', 'Alternar preset Hoje -> last30days atualiza label e intervalo', () => {
    const rToday = getSaoPauloDateRange('today')
    const r30 = getSaoPauloDateRange('last30days')
    assert.notStrictEqual(rToday.label, r30.label)
    assert.notStrictEqual(rToday.startUtc, r30.startUtc)
  })

  // EXPORT-PERIOD-12: Trocar 30 dias -> Personalizado atualiza corretamente
  test('EXPORT-PERIOD-12', 'Alternar last30days -> custom com datas específicas altera início e fim', () => {
    const r30 = getSaoPauloDateRange('last30days')
    const rCustom = getSaoPauloDateRange('custom', '2026-09-10', '2026-09-15')
    assert.notStrictEqual(r30.label, rCustom.label)
    assert.strictEqual(rCustom.label, '2026-09-10 até 2026-09-15')
  })

  console.log('======================================================================')
  console.log(`TOTAL: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`)
  console.log('======================================================================')
  if (failed > 0) process.exit(1)
}

main().catch(err => { console.error('Erro:', err); process.exit(1) })
