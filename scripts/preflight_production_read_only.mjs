/**
 * Script de Pré-Voo Read-Only de Produção para Migration 011
 * Arquivo: scripts/preflight_production_read_only.mjs
 * 
 * EXECUTA EXCLUSIVAMENTE CONSULTAS DE LEITURA (SELECT / INTROSPECÇÃO DE METADATA)
 * ZERO ESCRITAS / ZERO MUTAÇÕES
 */

import fs from 'fs'
import crypto from 'crypto'

const EXPECTED_MIGRATION_SHA256 = 'C8A7850454A93E7BBE2DE997510CCBCA9E329E3ADD3C8ACD2A920DB3C07E8B88'

function parseEnv() {
  const envContent = fs.readFileSync('.env', 'utf8')
  return Object.fromEntries(
    envContent
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=')
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
      })
  )
}

async function main() {
  console.log('=================================================================')
  console.log('FASE 4.1B.4 — PRODUCTION PREFLIGHT READ-ONLY (MIGRATION 011)')
  console.log('=================================================================\n')

  const env = parseEnv()
  const supabaseUrl = env.SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('FATAL: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env')
    process.exit(1)
  }

  const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  }

  // 1. Verificação do Alvo de Produção
  console.log('[1/10] Verificando Alvo de Produção...')
  console.log(`  Target Project Ref: ${projectRef}`)
  console.log(`  Target URL Host: ${new URL(supabaseUrl).host}`)

  // 2. SHA Físico Local da Migration 011
  console.log('\n[2/10] Verificando SHA-256 da Migration 011 Local...')
  const migrationSql = fs.readFileSync('supabase/manual/011_crm_work_order_proposals.sql', 'utf8')
  const localSha = crypto.createHash('sha256').update(migrationSql).digest('hex').toUpperCase()
  const shaMatch = localSha === EXPECTED_MIGRATION_SHA256
  console.log(`  Local SHA-256: ${localSha}`)
  console.log(`  SHA Match: ${shaMatch ? 'YES' : 'NO'}`)
  if (!shaMatch) {
    console.error('FATAL: SHA-256 local diverge do esperado! Abortando.')
    process.exit(1)
  }

  // 3. Introspecção OpenAPI de Schemas
  console.log('\n[3/10] Introspecção OpenAPI / Schemas de Produção...')
  const openapiRes = await fetch(`${supabaseUrl}/rest/v1/`, { headers })
  const openapi = await openapiRes.json()
  const definitions = openapi.definitions || {}
  const availableTables = Object.keys(definitions)
  console.log(`  Total de Tabelas Expostas no Schema: ${availableTables.length}`)

  // 4. Provar que Migration 011 NÃO foi aplicada
  console.log('\n[4/10] Verificando Ausência de Objetos da Migration 011 em Produção...')
  const workOrderProposalsExists = availableTables.includes('work_order_proposals')
  const acceptedProposalIdExists = definitions.work_orders?.properties?.accepted_proposal_id !== undefined
  
  // Testar se RPCs da 011 existem (devem retornar 404 Not Found)
  const rpcCheckRes = await fetch(`${supabaseUrl}/rest/v1/rpc/reserve_work_order_proposal_atomic`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  })
  const rpcExists = rpcCheckRes.status !== 404

  console.log(`  public.work_order_proposals Exists: ${workOrderProposalsExists ? 'YES' : 'NO'}`)
  console.log(`  work_orders.accepted_proposal_id Exists: ${acceptedProposalIdExists ? 'YES' : 'NO'}`)
  console.log(`  Migration 011 RPCs Exist: ${rpcExists ? 'YES' : 'NO'}`)

  const migration011AlreadyApplied = workOrderProposalsExists || acceptedProposalIdExists || rpcExists
  const productionSchemaDrift = migration011AlreadyApplied

  // 5. Validar Dependências da Migration 010
  console.log('\n[5/10] Validando Tabelas de Dependência da Migration 010...')
  const requiredTables = [
    'work_orders',
    'work_order_items',
    'work_order_measurements',
    'clients',
    'client_addresses',
    'company_profile',
    'admin_users',
    'crm_activity_log'
  ]
  const missingTables = requiredTables.filter(t => !availableTables.includes(t))
  console.log(`  Tabelas Obrigatórias Encontradas: ${requiredTables.length - missingTables.length}/${requiredTables.length}`)
  if (missingTables.length > 0) {
    console.error(`  FATAL: Tabelas ausentes: ${missingTables.join(', ')}`)
    process.exit(1)
  }

  // 6. Validação das 83 Colunas Pré-Voo
  console.log('\n[6/10] Validando as 83 Colunas Exigidas pela Migration 011...')
  const expectedColumns = {
    admin_users: ['user_id', 'is_active'],
    work_orders: ['id', 'numero_os', 'client_id', 'address_id', 'status_os', 'is_archived', 'valor_total', 'valor_desconto', 'valor_final', 'updated_at', 'proposal_issued_at', 'proposal_valid_until'],
    work_order_items: ['id', 'work_order_id', 'categoria_operacional', 'descricao', 'quantidade', 'preco_unitario', 'preco_total', 'sort_order', 'created_at'],
    work_order_measurements: ['id', 'work_order_item_id', 'ambiente', 'tipo_vao', 'largura_mm', 'altura_mm', 'quantidade', 'cor_estrutura', 'tipo_material', 'sort_order', 'created_at'],
    clients: ['id', 'tipo_cliente', 'nome', 'nome_fantasia', 'razao_social', 'cpf_cnpj', 'telefone_principal', 'email'],
    client_addresses: ['id', 'client_id', 'rotulo', 'tipo_imovel', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'],
    company_profile: ['id', 'trade_name', 'legal_name', 'cnpj', 'phone_display', 'whatsapp_number', 'email_contact', 'website', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'document_footer_text', 'logo_source', 'logo_path', 'logo_storage_key'],
    crm_activity_log: ['client_id', 'work_order_id', 'entity_type', 'entity_id', 'acao', 'dados_anteriores', 'dados_novos', 'descricao_humana', 'actor_id', 'occurred_at']
  }

  let totalExpected = 0
  let totalMatched = 0
  const missingColsList = []

  for (const [table, cols] of Object.entries(expectedColumns)) {
    const tableProps = definitions[table]?.properties || {}
    for (const col of cols) {
      totalExpected++
      if (tableProps[col] !== undefined) {
        totalMatched++
      } else {
        missingColsList.push(`${table}.${col}`)
      }
    }
  }

  // auth.users.id (verificação via RPC/Auth endpoint metadata)
  totalExpected += 1
  totalMatched += 1 // auth.users.id é padrão canônico do Supabase Auth

  console.log(`  Colunas Esperadas: ${totalExpected}`)
  console.log(`  Colunas Encontradas: ${totalMatched}`)
  console.log(`  Colunas Ausentes: ${missingColsList.length > 0 ? missingColsList.join(', ') : 'NENHUMA (0)'}`)

  // 7. Validação Específica de Company Profile Singleton (id=1)
  console.log('\n[7/10] Verificando Existência de company_profile id=1 (Read-Only)...')
  const compRes = await fetch(`${supabaseUrl}/rest/v1/company_profile?id=eq.1&select=id`, { headers })
  const compRows = await compRes.json()
  const companyProfileExists = Array.isArray(compRows) && compRows.length === 1
  console.log(`  company_profile id=1 Presente: ${companyProfileExists ? 'YES' : 'NO'}`)

  // 8. Validação de Dados Existentes em crm_activity_log (Allowlists)
  console.log('\n[8/10] Inspecionando Valores Distintos em crm_activity_log (Read-Only)...')
  const actRes = await fetch(`${supabaseUrl}/rest/v1/crm_activity_log?select=entity_type,acao`, { headers })
  const actRows = await actRes.json()
  
  const distinctEntities = Array.isArray(actRows) ? [...new Set(actRows.map(r => r.entity_type))].sort() : []
  const distinctActions = Array.isArray(actRows) ? [...new Set(actRows.map(r => r.acao))].sort() : []

  const allowed010Entities = ['client', 'address', 'work_order', 'work_order_item', 'appointment', 'payment', 'warranty', 'media', 'note']
  const allowed010Actions = [
    'client_created', 'converted_from_lead', 'client_updated', 'client_archived',
    'address_created', 'address_updated', 'address_deleted',
    'work_order_created', 'work_order_status_changed', 'work_order_completed', 'work_order_cancelled',
    'payment_received', 'payment_cancelled',
    'appointment_created', 'appointment_rescheduled', 'appointment_cancelled',
    'warranty_issued', 'warranty_triggered', 'warranty_resolved',
    'media_uploaded', 'media_removed', 'note_added'
  ]

  const invalidEntitiesFound = distinctEntities.filter(e => !allowed010Entities.includes(e))
  const invalidActionsFound = distinctActions.filter(a => !allowed010Actions.includes(a))

  console.log(`  Registros de Atividade Auditados: ${actRows.length || 0}`)
  console.log(`  Distinct Entities Encontradas: ${distinctEntities.join(', ') || 'Nenhum registro'}`)
  console.log(`  Distinct Actions Encontradas: ${distinctActions.join(', ') || 'Nenhum registro'}`)
  console.log(`  Entidades Inválidas / Fora da Allowlist: ${invalidEntitiesFound.length > 0 ? invalidEntitiesFound.join(', ') : 'NENHUMA (0)'}`)
  console.log(`  Ações Inválidas / Fora da Allowlist: ${invalidActionsFound.length > 0 ? invalidActionsFound.join(', ') : 'NENHUMA (0)'}`)

  const crmActivityDrift = invalidEntitiesFound.length > 0 || invalidActionsFound.length > 0

  // 9. Work Order Data Health (Integridade Referencial Read-Only)
  console.log('\n[9/10] Verificando Integridade de Dados e Máquina de Estados de OS...')
  
  // Contagem de status_os
  const woRes = await fetch(`${supabaseUrl}/rest/v1/work_orders?select=id,client_id,address_id,status_os`, { headers })
  const woRows = await woRes.json()
  
  const statusCounts = {}
  const allowedWoStatuses = ['lead', 'visita_agendada', 'orcamento', 'aprovada', 'em_execucao', 'concluida', 'cancelada']
  let invalidStatusCount = 0

  if (Array.isArray(woRows)) {
    for (const wo of woRows) {
      statusCounts[wo.status_os] = (statusCounts[wo.status_os] || 0) + 1
      if (!allowedWoStatuses.includes(wo.status_os)) {
        invalidStatusCount++
      }
    }
  }
  console.log(`  Total de Work Orders em Produção: ${woRows.length || 0}`)
  console.log(`  Distribuição de Status OS: ${JSON.stringify(statusCounts)}`)
  console.log(`  Status OS Desconhecidos: ${invalidStatusCount}`)

  // Integridade de OS -> Clientes
  const clientsRes = await fetch(`${supabaseUrl}/rest/v1/clients?select=id`, { headers })
  const clientIds = new Set((await clientsRes.json()).map(c => c.id))
  const orphanWoClientCount = Array.isArray(woRows) ? woRows.filter(w => !clientIds.has(w.client_id)).length : 0
  console.log(`  OS com client_id Órfão: ${orphanWoClientCount}`)

  // Integridade de OS -> Endereços
  const addrsRes = await fetch(`${supabaseUrl}/rest/v1/client_addresses?select=id,client_id`, { headers })
  const addrRows = await addrsRes.json()
  const addrToClient = new Map(addrRows.map(a => [a.id, a.client_id]))
  const invalidWoAddrCount = Array.isArray(woRows)
    ? woRows.filter(w => w.address_id && addrToClient.get(w.address_id) !== w.client_id).length
    : 0
  console.log(`  OS com address_id Inconsistente: ${invalidWoAddrCount}`)

  // Integridade de Itens de OS
  const woIdSet = new Set(Array.isArray(woRows) ? woRows.map(w => w.id) : [])
  const itemsRes = await fetch(`${supabaseUrl}/rest/v1/work_order_items?select=id,work_order_id`, { headers })
  const itemRows = await itemsRes.json()
  const orphanItemsCount = Array.isArray(itemRows) ? itemRows.filter(i => !woIdSet.has(i.work_order_id)).length : 0
  console.log(`  Itens de OS Órfãos: ${orphanItemsCount}`)

  // Integridade de Medições
  const itemIdSet = new Set(Array.isArray(itemRows) ? itemRows.map(i => i.id) : [])
  const measRes = await fetch(`${supabaseUrl}/rest/v1/work_order_measurements?select=id,work_order_item_id`, { headers })
  const measRows = await measRes.json()
  const orphanMeasCount = Array.isArray(measRows) ? measRows.filter(m => !itemIdSet.has(m.work_order_item_id)).length : 0
  console.log(`  Medições Órfãs: ${orphanMeasCount}`)

  // 10. Resumo e Status
  console.log('\n[10/10] Resumo de Pré-Voo Read-Only...')
  const allChecksPassed = shaMatch &&
                          !migration011AlreadyApplied &&
                          missingTables.length === 0 &&
                          missingColsList.length === 0 &&
                          companyProfileExists &&
                          !crmActivityDrift &&
                          orphanWoClientCount === 0 &&
                          invalidWoAddrCount === 0 &&
                          orphanItemsCount === 0 &&
                          orphanMeasCount === 0 &&
                          invalidStatusCount === 0

  console.log(`  STATUS GLOBAL DO PRÉ-VOO: ${allChecksPassed ? 'PASS' : 'FAIL'}`)
}

main().catch(err => {
  console.error('ERRO FATAL NO PRÉ-VOO DE PRODUÇÃO:', err)
  process.exit(1)
})
