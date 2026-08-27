/**
 * Suíte de Testes Automatizados — Fase 4.1 Backend (Orçamentos, PDF, R2 e Orquestrador)
 * Arquivo: scripts/test_crm_phase4_1_backend.mjs
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import {
  generateProposalPdfBuffer,
  computeCommercialTermsInputHash,
  buildProposalStorageKey,
  isValidProposalStorageKey,
  generateProposalSignedDownloadUrl
} from '../server/shared/proposalCore.mjs'
import { runSql, assert, state, setupCleanBaseline, getMigrationSql } from './migration011/helpers.mjs'

console.log('=================================================================')
console.log('FASE 4.1 — SUÍTE DE TESTES AUTOMATIZADOS BACKEND')
console.log('=================================================================')

async function runPhase41BackendTests() {
  // 1. Testes do Motor PDFKit e Renderização UTF-8 / Português
  console.log('\n[1/5] Testes de Geração de PDF e Suporte UTF-8 / A4...')

  const sampleCompany = {
    trade_name: 'AD Telas e Redes de Proteção',
    legal_name: 'AD Telas e Redes Ltda',
    cnpj: '12.345.678/0001-90',
    phone_display: '(11) 99999-0000',
    whatsapp_number: '(11) 98888-7777',
    email_contact: 'contato@adtelas.com.br',
    website: 'https://adtelas.com.br',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-100',
    document_footer_text: 'Garantia de 5 anos em todas as redes de proteção.',
    logo_path: '/images/logo_adt_telas_nova.png'
  }

  const sampleClientPF = {
    nome: 'João da Conceição e Silva',
    cpf_cnpj: '123.456.789-00',
    telefone_principal: '(11) 97777-6666',
    email: 'joao.silva@exemplo.com.br',
    tipo_cliente: 'residencial'
  }

  const sampleClientPJ = {
    nome: 'Condomínio Edifício Mirante do Parque',
    razao_social: 'Condomínio Edifício Mirante do Parque Ltda',
    nome_fantasia: 'Edifício Mirante',
    cpf_cnpj: '98.765.432/0001-11',
    telefone_principal: '(11) 3333-2222',
    email: 'administracao@mirante.com.br',
    tipo_cliente: 'predial'
  }

  const sampleAddress = {
    logradouro: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 45 Bloco B',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01400-000'
  }

  const sampleItems = [
    {
      categoria_operacional: 'rede_janela',
      descricao: 'Rede de proteção para janela dos quartos (Malha 50mm cristal)',
      quantidade: 2,
      preco_unitario: 180.00,
      preco_total: 360.00,
      measurements: [
        { ambiente: 'Quarto Casal', tipo_vao: 'janela', largura_mm: 1500, altura_mm: 1200, quantidade: 1, cor_estrutura: 'branca', tipo_material: 'polietileno' },
        { ambiente: 'Quarto Filhos', tipo_vao: 'janela', largura_mm: 1500, altura_mm: 1200, quantidade: 1, cor_estrutura: 'branca', tipo_material: 'polietileno' }
      ]
    },
    {
      categoria_operacional: 'rede_sacada',
      descricao: 'Fechamento de sacada com estrutura de alumínio e rede de proteção',
      quantidade: 1,
      preco_unitario: 890.00,
      preco_total: 890.00,
      measurements: [
        { ambiente: 'Varanda Principal', tipo_vao: 'sacada', largura_mm: 4200, altura_mm: 2400, quantidade: 1, cor_estrutura: 'preta', tipo_material: 'polietileno_reforcado' }
      ]
    }
  ]

  // Teste 1.1: Geração de Prévia
  const previewPdf = await generateProposalPdfBuffer({
    isPreview: true,
    numeroOs: 'OS-2026-000001',
    companySnapshot: sampleCompany,
    clientSnapshot: sampleClientPF,
    addressSnapshot: sampleAddress,
    itemsSnapshot: sampleItems,
    totalsSnapshot: { valor_total: 1250.00, valor_desconto: 50.00, valor_final: 1200.00 },
    commercialTerms: { condicoes_pagamento: 'À vista com 5% de desconto', prazo_instalacao_dias: 3, incluir_medicoes: true }
  })

  assert(Buffer.isBuffer(previewPdf) && previewPdf.length > 500, '1.1. Prévia em PDF gerada em memória com sucesso')
  assert(previewPdf.toString('latin1').includes('PDF'), '1.2. Cabeçalho binário do arquivo é PDF válido')

  // Teste 1.2: Geração Oficial com Cliente PJ e sem medições
  const officialPdfPJ = await generateProposalPdfBuffer({
    isPreview: false,
    versionNumber: 1,
    numeroOs: 'OS-2026-000002',
    companySnapshot: sampleCompany,
    clientSnapshot: sampleClientPJ,
    addressSnapshot: null, // Sem endereço
    itemsSnapshot: sampleItems,
    totalsSnapshot: { valor_total: 1250.00, valor_desconto: 0, valor_final: 1250.00 },
    commercialTerms: { condicoes_pagamento: 'Faturamento 30 dias boleto', prazo_instalacao_dias: 7, incluir_medicoes: false }
  })

  assert(Buffer.isBuffer(officialPdfPJ) && officialPdfPJ.length > 500, '1.3. Orçamento oficial PJ sem endereço gerado com sucesso')

  // Teste 1.3: Documento Multi-Páginas (12 itens)
  const manyItems = []
  for (let i = 1; i <= 12; i++) {
    manyItems.push({
      categoria_operacional: 'rede_janela',
      descricao: `Item de proteção técnica número ${i} com descrição detalhada para conferência visual de quebra de página`,
      quantidade: 1,
      preco_unitario: 100.00,
      preco_total: 100.00
    })
  }

  const multiPagePdf = await generateProposalPdfBuffer({
    isPreview: false,
    versionNumber: 2,
    numeroOs: 'OS-2026-000003',
    companySnapshot: sampleCompany,
    clientSnapshot: sampleClientPF,
    addressSnapshot: sampleAddress,
    itemsSnapshot: manyItems,
    totalsSnapshot: { valor_total: 1200.00, valor_desconto: 100.00, valor_final: 1100.00 },
    commercialTerms: { condicoes_pagamento: '3x sem juros', prazo_instalacao_dias: 10, incluir_medicoes: false }
  })

  assert(Buffer.isBuffer(multiPagePdf) && multiPagePdf.length > 1000, '1.4. Orçamento multi-páginas (12 itens) gerado com sucesso')

  // 2. Canonical Hashing e Storage Keys
  console.log('\n[2/5] Testes de Hash Canônico e Chaves de Storage...')

  const hash1 = computeCommercialTermsInputHash('2026-09-15', { condicoes_pagamento: 'PIX', prazo_instalacao_dias: 5, incluir_medicoes: true, observacoes_proposta: 'Obs A' })
  const hash2 = computeCommercialTermsInputHash('2026-09-15', { incluir_medicoes: true, condicoes_pagamento: 'PIX', observacoes_proposta: 'Obs A', prazo_instalacao_dias: 5 })
  const hashDiff = computeCommercialTermsInputHash('2026-09-15', { condicoes_pagamento: 'Boleto', prazo_instalacao_dias: 5, incluir_medicoes: true })

  assert(hash1.hashHex === hash2.hashHex, '2.1. Hash canônico é determinístico independente da ordem das chaves JSON')
  assert(hash1.hashHex !== hashDiff.hashHex, '2.2. Hash canônico difere quando condições comerciais são modificadas')
  assert(hash1.hashHex.length === 64 && /^[0-9a-f]{64}$/.test(hash1.hashHex), '2.3. Hash canônico é string hex minúscula de 64 caracteres')

  const validKey = buildProposalStorageKey('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  assert(validKey === 'proposals/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.pdf', '2.4. Storage key segue padrão canônico proposals/{woId}/{propId}.pdf')
  assert(isValidProposalStorageKey(validKey), '2.5. Storage key válida é aprovada pelo validador')
  assert(!isValidProposalStorageKey('proposals/../hack.pdf'), '2.6. Path traversal é rejeitado pelo validador')
  assert(!isValidProposalStorageKey('site-media/wo/prop.pdf'), '2.7. Bucket/prefixo divergente é rejeitado pelo validador')

  const signedUrl = await generateProposalSignedDownloadUrl(validKey, 300)
  assert(typeof signedUrl === 'string' && signedUrl.length > 20, '2.8. URL assinada temporária gerada com sucesso')

  // 3. Orquestrador no Banco Isolado Local
  console.log('\n[3/5] Testes do Orquestrador de Emissão (2-Phase Transacional no Banco Local)...')

  const migrationSql = getMigrationSql()
  setupCleanBaseline(migrationSql)

  // Aplica a Migration 011 no banco de testes local
  const applyRes = runSql(migrationSql)
  assert(applyRes.success, '3.0. Migration 011 aplicada no banco de testes isolado')

  // Cria admin, cliente e OS de teste
  const adminId = '11111111-1111-1111-1111-111111111111'
  const seedSql = `
    INSERT INTO auth.users (id, email) VALUES ('${adminId}', 'admin_local_test@adt.local') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.admin_users (user_id, email, is_active) VALUES ('${adminId}', 'admin_local_test@adt.local', true)
    ON CONFLICT (email) DO UPDATE SET is_active = true, user_id = EXCLUDED.user_id;

    INSERT INTO public.clients (id, tipo_cliente, nome, cpf_cnpj, telefone_principal, email)
    VALUES ('a0000000-0000-0000-0000-000000000001', 'pessoa_fisica', 'Cliente Teste Fase 4.1', '12345678909', '11999990001', 'cliente41@exemplo.com')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.work_orders (id, numero_os, client_id, status_os, valor_total, valor_desconto)
    VALUES ('b0000000-0000-0000-0000-000000000001', 'OS-2026-000041', 'a0000000-0000-0000-0000-000000000001', 'orcamento', 1500.00, 100.00)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.work_order_items (id, work_order_id, categoria_operacional, descricao, quantidade, preco_unitario, sort_order)
    VALUES ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'rede_protecao', 'Rede de Janela 50mm', 2, 750.00, 1)
    ON CONFLICT (id) DO NOTHING;
  `
  const seedRes = runSql(seedSql)
  assert(seedRes.success, '3.1. Dados base de teste criados no banco isolado')

  // 4. Teste de Fluxo Completo: Emissão Rev. 1
  console.log('\n[4/5] Emissão Rev. 01, Idempotência e Aceite...')

  const idempKey1 = '11111111-aaaa-bbbb-cccc-000000000001'
  const woTs1 = runSql("SELECT updated_at FROM public.work_orders WHERE id = 'b0000000-0000-0000-0000-000000000001';").stdout
  const reserveSql = `
    SELECT public.reserve_work_order_proposal_atomic(
      'b0000000-0000-0000-0000-000000000001'::UUID,
      '${woTs1}'::TIMESTAMPTZ,
      '${idempKey1}'::VARCHAR,
      '${hash1.hashHex}'::VARCHAR,
      '${JSON.stringify(hash1.sanitizedTerms)}'::JSONB,
      '2026-09-15'::DATE,
      '${adminId}'::UUID
    );
  `
  const rRes = runSql(reserveSql)
  assert(rRes.success, '4.1. Reserva da Rev. 01 executada com sucesso', rRes.stderr || rRes.stdout)
  if (!rRes.success) {
    console.error('Falha na reserva:', rRes.stderr || rRes.stdout)
    process.exit(1)
  }
  const rJson = JSON.parse(rRes.stdout)
  const propId1 = rJson.proposal_id
  assert(rJson.version_number === 1, '4.2. Número de versão alocado é 1 (Rev. 01)')
  assert(rJson.generation_status === 'reserved', '4.3. Status de geração inicial é reserved')

  // Geração do PDF a partir dos snapshots retornados pela reserva
  const pdfRev1 = await generateProposalPdfBuffer({
    isPreview: false,
    versionNumber: 1,
    numeroOs: rJson.numero_os,
    issuedAt: new Date(),
    validUntil: rJson.valid_until,
    companySnapshot: rJson.company_snapshot,
    clientSnapshot: rJson.client_snapshot,
    addressSnapshot: rJson.address_snapshot,
    itemsSnapshot: rJson.items_snapshot,
    totalsSnapshot: rJson.totals_snapshot,
    commercialTerms: rJson.commercial_terms
  })
  const pdfSha1 = crypto.createHash('sha256').update(pdfRev1).digest('hex').toLowerCase()
  const storageKey1 = buildProposalStorageKey('b0000000-0000-0000-0000-000000000001', propId1)

  // Finalização da Rev. 01
  const finalizeSql = `
    SELECT public.finalize_work_order_proposal_atomic(
      '${propId1}'::UUID,
      'b0000000-0000-0000-0000-000000000001'::UUID,
      '${storageKey1}'::VARCHAR,
      '${pdfSha1}'::VARCHAR,
      ${pdfRev1.length}::BIGINT,
      '${adminId}'::UUID
    );
  `
  const fRes = runSql(finalizeSql)
  assert(fRes.success, '4.4. Finalização da Rev. 01 executada com sucesso', fRes.stderr)
  const fJson = JSON.parse(fRes.stdout)
  assert(fJson.status === 'issued' && fJson.version_number === 1, '4.5. Proposta Rev. 01 finalizada com status=issued e version_number=1')

  // Idempotência: Replay com mesma chave
  const replayRes = runSql(reserveSql)
  assert(replayRes.success, '4.6. Replay de reserva com mesma chave retorna sucesso idempotente', replayRes.stderr)
  const replayJson = JSON.parse(replayRes.stdout)
  assert(replayJson.proposal_id === propId1 && replayJson.is_idempotent_replay === true, '4.7. Replay retorna exatamente a mesma proposta com is_idempotent_replay=true')

  // Aceite da Rev. 01
  const woTsRes = runSql("SELECT updated_at FROM public.work_orders WHERE id = 'b0000000-0000-0000-0000-000000000001';")
  const woUpdatedAt = woTsRes.stdout

  const acceptSql = `
    SELECT public.accept_work_order_proposal_atomic(
      'b0000000-0000-0000-0000-000000000001'::UUID,
      '${propId1}'::UUID,
      '${woUpdatedAt}'::TIMESTAMPTZ,
      '${adminId}'::UUID
    );
  `
  const aRes = runSql(acceptSql)
  assert(aRes.success, '4.8. Aceite da Rev. 01 executado com sucesso', aRes.stderr)
  const aJson = JSON.parse(aRes.stdout)
  assert(aJson.status_os === 'aprovada' && aJson.version_number === 1, '4.9. Proposta aceita e OS transicionada para aprovada')

  // Reabertura da OS (aprovada -> orcamento) com limpeza de accepted_proposal_id
  const reopenSql = `
    UPDATE public.work_orders
    SET status_os = 'orcamento', accepted_proposal_id = NULL, updated_at = now()
    WHERE id = 'b0000000-0000-0000-0000-000000000001';
  `
  const reopRes = runSql(reopenSql)
  assert(reopRes.success, '4.10. Reabertura da OS para orcamento com limpeza controlada de accepted_proposal_id')

  // Emissão da Rev. 02
  console.log('\n[5/5] Emissão Rev. 02 e Substituição Histórica...')

  const idempKey2 = '22222222-aaaa-bbbb-cccc-000000000002'
  const woTs2 = runSql("SELECT updated_at FROM public.work_orders WHERE id = 'b0000000-0000-0000-0000-000000000001';").stdout
  const reserveSql2 = `
    SELECT public.reserve_work_order_proposal_atomic(
      'b0000000-0000-0000-0000-000000000001'::UUID,
      '${woTs2}'::TIMESTAMPTZ,
      '${idempKey2}'::VARCHAR,
      '${hash1.hashHex}'::VARCHAR,
      '${JSON.stringify(hash1.sanitizedTerms)}'::JSONB,
      '2026-09-20'::DATE,
      '${adminId}'::UUID
    );
  `
  const r2Res = runSql(reserveSql2)
  assert(r2Res.success, '5.1. Reserva da Rev. 02 executada com sucesso', r2Res.stderr)
  const r2Json = JSON.parse(r2Res.stdout)
  const propId2 = r2Json.proposal_id
  assert(r2Json.version_number === 2, '5.2. Versão da nova proposta é 2 (Rev. 02)')

  const storageKey2 = buildProposalStorageKey('b0000000-0000-0000-0000-000000000001', propId2)
  const finalizeSql2 = `
    SELECT public.finalize_work_order_proposal_atomic(
      '${propId2}'::UUID,
      'b0000000-0000-0000-0000-000000000001'::UUID,
      '${storageKey2}'::VARCHAR,
      '${pdfSha1}'::VARCHAR,
      1024::BIGINT,
      '${adminId}'::UUID
    );
  `
  const f2Res = runSql(finalizeSql2)
  assert(f2Res.success, '5.3. Finalização da Rev. 02 executada com sucesso', f2Res.stderr)

  // Verifica que Rev. 01 transicionou para superseded preservando accepted_at
  const rev1CheckSql = `SELECT status, accepted_at IS NOT NULL AS has_accepted_at FROM public.work_order_proposals WHERE id = '${propId1}';`
  const rev1Check = runSql(rev1CheckSql)
  assert(rev1Check.stdout === 'superseded|t', '5.4. Rev. 01 anterior transicionou para superseded preservando metadados de aceite histórico')

  // 6. Teste de Idempotência com Mismatch de Input
  console.log('\n[6/8] Teste de Rejeição de Mismatch de Idempotência...')
  const mismatchSql = `
    SELECT public.reserve_work_order_proposal_atomic(
      'b0000000-0000-0000-0000-000000000001'::UUID,
      '${woTs2}'::TIMESTAMPTZ,
      '${idempKey2}'::VARCHAR,
      '0000000000000000000000000000000000000000000000000000000000000000'::VARCHAR,
      pg_catalog.jsonb_build_object('condicoes_pagamento', 'Outro'),
      '2026-09-25'::DATE,
      '${adminId}'::UUID
    );
  `
  const misRes = runSql(mismatchSql)
  assert(!misRes.success && misRes.stderr.includes('ERR_IDEMPOTENCY_MISMATCH'), '6.1. Replay com mesma chave e hash divergente é rejeitado com ERR_IDEMPOTENCY_MISMATCH')

  // 7. Teste de Compensação de Falha (mark_work_order_proposal_failed_atomic)
  console.log('\n[7/8] Teste de Compensação Atômica de Falha...')
  const idempKey3 = '33333333-aaaa-bbbb-cccc-000000000003'
  const woTs3 = runSql("SELECT updated_at FROM public.work_orders WHERE id = 'b0000000-0000-0000-0000-000000000001';").stdout
  const reserveSql3 = `
    SELECT public.reserve_work_order_proposal_atomic(
      'b0000000-0000-0000-0000-000000000001'::UUID,
      '${woTs3}'::TIMESTAMPTZ,
      '${idempKey3}'::VARCHAR,
      '${hash1.hashHex}'::VARCHAR,
      '${JSON.stringify(hash1.sanitizedTerms)}'::JSONB,
      '2026-09-30'::DATE,
      '${adminId}'::UUID
    );
  `
  const r3Res = runSql(reserveSql3)
  const r3Json = JSON.parse(r3Res.stdout)
  const propId3 = r3Json.proposal_id

  const markFailSql = `
    SELECT public.mark_work_order_proposal_failed_atomic(
      '${propId3}'::UUID,
      'b0000000-0000-0000-0000-000000000001'::UUID,
      '${adminId}'::UUID
    );
  `
  const failRes = runSql(markFailSql)
  assert(failRes.success, '7.1. Compensação de falha atômica executada com sucesso', failRes.stderr)
  const failJson = JSON.parse(failRes.stdout)
  assert(failJson.generation_status === 'failed' && failJson.success === true, '7.2. Proposta falha registrada com generation_status=failed')

  // 8. Teste de Imutabilidade e Bloqueio de DELETE
  console.log('\n[8/8] Teste de Imutabilidade e Hard Delete Prevention...')
  const deleteTestSql = `DELETE FROM public.work_order_proposals WHERE id = '${propId1}';`
  const delRes = runSql(deleteTestSql)
  assert(!delRes.success && delRes.stderr.includes('DELETE_FORBIDDEN'), '8.1. Tentativa de DELETE físico em work_order_proposals é bloqueada por trigger')

  const updateTestSql = `UPDATE public.work_order_proposals SET version_number = 99 WHERE id = '${propId1}';`
  const updRes = runSql(updateTestSql)
  assert(!updRes.success && updRes.stderr.includes('MUTATION_BLOCKED'), '8.2. Tentativa de alteração de conteúdo ou número de versão é bloqueada por trigger de imutabilidade')

  console.log('\n=================================================================')
  console.log(`TOTAL DE ASSERTS BACKEND: ${state.passed + state.failed}`)
  console.log(`PASS: ${state.passed}`)
  console.log(`FAIL: ${state.failed}`)
  console.log('=================================================================')

  if (state.failed > 0) {
    process.exit(1)
  }
}

runPhase41BackendTests().catch(err => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})
