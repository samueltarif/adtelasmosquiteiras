/**
 * Teste Real Não-Vazio do Dataset campaign_kpis (Itens 5, 6 e 7)
 * Insere fixture, exporta e valida CSV, XLSX e JSON, e realiza cleanup estrito por ID.
 * Arquivo: scripts/test_campaign_kpis_real_export.mjs (<= 200 linhas)
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import ExcelJS from 'exceljs'
import { collectExportRawData } from '../server/utils/dashboard-export/exportDataCollector.ts'
import { buildExportTables } from '../server/utils/dashboard-export/exportDataBuilder.ts'
import { generateCsvFromTable } from '../server/utils/dashboard-export/exportCsv.ts'
import { generateXlsxExport } from '../server/utils/dashboard-export/exportXlsx.ts'
import { generateJsonExport } from '../server/utils/dashboard-export/exportJson.ts'

// Carregar variáveis de ambiente locais
const envContent = fs.readFileSync('.env', 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let v = match[2] || ''
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[match[1]] = v.trim()
  }
}

const supabaseUrl = env.SUPABASE_URL || 'https://axjqhxpejwkuabeaoyaz.supabase.co'
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
assert.ok(supabaseUrl && serviceKey, 'Credenciais do Supabase obrigatórias')

const headers = {
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}

async function main() {
  console.log('======================================================================')
  console.log('TESTE REAL NÃO-VAZIO DO DATASET campaign_kpis')
  console.log('======================================================================')

  let fixtureId = null

  try {
    // 1. Inserir UMA fixture identificável com valores conhecidos
    const fixtureData = {
      platform: 'google_ads',
      campaign_name: 'EXPORT_KPI_SCHEMA_TEST',
      utm_campaign: 'rede_pesquisa_telas',
      period_start: '2026-09-01',
      period_end: '2026-09-30',
      planned_budget: 2500.00,
      spend: 1200.00,
      impressions: 24000,
      clicks: 600,
      whatsapp_contacts: 60,
      leads: 24,
      sales: 6,
      revenue: 6000.00,
      notes: 'Fixture para teste de exportação completa',
      target_ctr: 2.50,
      target_cpc: 2.00,
      target_cpl: 50.00,
      target_cpa: 200.00,
      target_roas: 5.00,
      target_leads: 30,
      target_sales: 8,
      target_lead_to_sale_rate: 25.00,
      target_budget: 2500.00
    }

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/campaign_kpi_entries`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fixtureData)
    })
    assert.strictEqual(insertRes.status, 201, `Falha no insert: ${insertRes.statusText}`)
    const [inserted] = await insertRes.json()
    fixtureId = inserted.id
    assert.ok(fixtureId, 'ID da fixture deve existir')
    console.log(`  [PASS] Fixture inserida com ID: ${fixtureId}`)

    // 2. Coletar dados reais via exportDataCollector
    const rawData = await collectExportRawData(supabaseUrl, serviceKey, {
      format: 'xlsx',
      period: 'all',
      datasets: ['campaign_kpis']
    })

    const foundInRaw = rawData.rawKpis.find(k => k.id === fixtureId)
    assert.ok(foundInRaw, 'Fixture deve ser retornada pelo coletor de dados')
    console.log('  [PASS] Fixture encontrada na coleta rawKpis')

    // 3. Montar tabelas tabulares
    const tables = buildExportTables(rawData, {
      format: 'xlsx',
      period: 'all',
      datasets: ['campaign_kpis']
    })
    const kpiTable = tables.campaign_kpis
    assert.ok(kpiTable, 'Tabela campaign_kpis deve existir')
    assert.ok(kpiTable.rows.length > 0, 'Tabela campaign_kpis não deve estar vazia')

    const fixtureRow = kpiTable.rows.find(r => r[1] === 'EXPORT_KPI_SCHEMA_TEST')
    assert.ok(fixtureRow, 'Linha da fixture deve estar presente na tabela')

    // 4. Testar CSV
    const csvBuf = generateCsvFromTable(kpiTable)
    const csvStr = csvBuf.toString('utf-8')
    assert.ok(csvStr.includes('EXPORT_KPI_SCHEMA_TEST'), 'CSV deve conter o nome da campanha')
    assert.ok(csvStr.includes('1200'), 'CSV deve conter o spend')
    assert.ok(csvStr.includes('6000'), 'CSV deve conter a receita')
    assert.ok(csvStr.includes('2500'), 'CSV deve conter planned_budget')
    console.log('  [PASS] CSV exportado e parseado com sucesso')

    // 5. Testar XLSX
    const xlsxBuf = await generateXlsxExport(rawData.meta, { campaign_kpis: kpiTable })
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(xlsxBuf)
    const sheet = wb.getWorksheet('KPIs de Campanhas')
    assert.ok(sheet, 'Aba KPIs de Campanhas deve existir')
    let foundXlsxRow = false
    sheet.eachRow((row) => {
      if (row.getCell(2).value === 'EXPORT_KPI_SCHEMA_TEST') {
        foundXlsxRow = true
        assert.strictEqual(Number(row.getCell(6).value), 2500, 'planned_budget no XLSX')
        assert.strictEqual(Number(row.getCell(7).value), 1200, 'spend no XLSX')
        assert.strictEqual(Number(row.getCell(8).value), 24000, 'impressions no XLSX')
        assert.strictEqual(Number(row.getCell(9).value), 600, 'clicks no XLSX')
        assert.strictEqual(Number(row.getCell(10).value), 60, 'whatsapp_contacts no XLSX')
        assert.strictEqual(Number(row.getCell(11).value), 24, 'leads no XLSX')
        assert.strictEqual(Number(row.getCell(12).value), 6, 'sales no XLSX')
        assert.strictEqual(Number(row.getCell(13).value), 6000, 'revenue no XLSX')
        // KPIs derivados: CTR=2.5, CPC=2, CPM=50, CustoWA=20, CPL=50, CPA=200, ROAS=5
        assert.strictEqual(Number(row.getCell(24).value), 2.5, 'CTR derivado')
        assert.strictEqual(Number(row.getCell(25).value), 2, 'CPC derivado')
        assert.strictEqual(Number(row.getCell(26).value), 50, 'CPM derivado')
        assert.strictEqual(Number(row.getCell(27).value), 20, 'Custo por WhatsApp derivado')
        assert.strictEqual(Number(row.getCell(28).value), 50, 'CPL derivado')
        assert.strictEqual(Number(row.getCell(29).value), 200, 'CPA derivado')
        assert.strictEqual(Number(row.getCell(30).value), 5, 'ROAS derivado')
        assert.strictEqual(Number(row.getCell(31).value), 1000, 'Ticket Médio derivado')
        assert.strictEqual(Number(row.getCell(32).value), 25, 'Lead -> Venda derivado')
        assert.strictEqual(Number(row.getCell(33).value), 48, 'Consumo Orçamento derivado')
      }
    })
    assert.ok(foundXlsxRow, 'Linha da fixture validada integralmente no XLSX')
    console.log('  [PASS] XLSX exportado e parseado com todos os 24 campos e 10 KPIs derivados validados')

    // 6. Testar JSON
    const jsonBuf = generateJsonExport(rawData.meta, { campaign_kpis: kpiTable })
    const parsedJson = JSON.parse(jsonBuf.toString('utf-8'))
    const jsonRecords = parsedJson.data.campaign_kpis.records
    const jsonFixture = jsonRecords.find(r => r['Campanha'] === 'EXPORT_KPI_SCHEMA_TEST')
    assert.ok(jsonFixture, 'Registro da fixture deve constar no JSON')
    assert.strictEqual(Number(jsonFixture['Gasto R$']), 1200)
    assert.strictEqual(Number(jsonFixture['Receita R$']), 6000)
    assert.strictEqual(Number(jsonFixture['ROAS']), 5)
    console.log('  [PASS] JSON exportado e parseado com sucesso')

  } finally {
    // 7. Cleanup rigoroso por ID da fixture
    if (fixtureId) {
      const delRes = await fetch(`${supabaseUrl}/rest/v1/campaign_kpi_entries?id=eq.${fixtureId}`, {
        method: 'DELETE',
        headers
      })
      console.log(`  [CLEANUP] DELETE status: ${delRes.status}`)
      
      const checkRes = await fetch(`${supabaseUrl}/rest/v1/campaign_kpi_entries?campaign_name=eq.EXPORT_KPI_SCHEMA_TEST&select=count`, {
        headers: { ...headers, 'Prefer': 'count=exact' }
      })
      const countHeader = checkRes.headers.get('content-range')
      const totalCount = countHeader ? parseInt(countHeader.split('/')[1] || '0', 10) : 0
      assert.strictEqual(totalCount, 0, 'Contagem final da fixture deve ser estritamente 0')
      console.log(`  [PASS] Cleanup confirmado: count = ${totalCount}`)
    }
  }

  console.log('======================================================================')
  console.log('TODAS AS ASSERÇÕES DO TESTE REAL CAMPAIGN_KPIS FORAM APROVADAS!')
  console.log('======================================================================')
}

main().catch(err => {
  console.error('Falha no teste real de campaign_kpis:', err)
  process.exit(1)
})
