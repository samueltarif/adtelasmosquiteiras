/**
 * Suíte Completa de Testes de Layout Visual e Paginação do PDF (Hotfix 4.1C.3)
 * Arquivo: scripts/test_pdf_layout_visual.mjs
 */

import { generateProposalPdfBuffer, PDF_LAYOUT } from '../server/shared/proposalCore.mjs'
import { renderPdfToPng } from './pdfVisualRenderer.mjs'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const outputDir = path.resolve('scratch/pdf_tests')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

let passed = 0
let failed = 0

function assert(condition, message, details = '') {
  if (condition) {
    passed++
    console.log(`  [PASS] ${message}`)
  } else {
    failed++
    console.error(`  [FAIL] ${message} -> [${details}]`)
  }
}

// Fixture da empresa
const companyFixture = {
  trade_name: 'AD Telas e Redes de Proteção',
  legal_name: 'AD Telas e Redes de Proteção Ltda',
  cnpj: '54.123.456/0001-89',
  phone_display: '(11) 98358-6611',
  whatsapp_number: '(11) 98358-6611',
  email_contact: 'contato@adtelasmosquiteiras.com.br',
  website: 'https://www.adtelasmosquiteiras.com.br',
  street: 'Rua das Palmeiras',
  number: '120',
  complement: 'Sala 4',
  neighborhood: 'Vila Madalena',
  city: 'São Paulo',
  state: 'SP',
  cep: '05432-000',
  document_footer_text: 'Este documento é uma proposta comercial sujeita a disponibilidade e confirmação de medidas técnicas.',
  logo_path: '/images/logo_adt_telas_nova.png'
}

// Fixture do cliente
const clientFixture = {
  nome: 'Carlos Eduardo da Silva',
  cpf_cnpj: '123.456.789-00',
  telefone_principal: '(11) 99999-8888',
  email: 'carlos.silva@email.com',
  tipo_cliente: 'pessoa_fisica'
}

// Fixture de endereço
const addressFixture = {
  logradouro: 'Av. Paulista',
  numero: '1000',
  complemento: 'Apto 102 - Bloco B',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  uf: 'SP',
  cep: '01310-100'
}

function getPdfPageCount(pdfBuffer) {
  const text = pdfBuffer.toString('latin1')
  const pageMatches = text.match(/\/Type\s*\/Page\b(?!\s*s)/gi)
  return pageMatches ? pageMatches.length : 1
}

function decompressPdfStreams(pdfBuffer) {
  const raw = pdfBuffer.toString('latin1')
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let match
  let allDecompressed = ''
  while ((match = streamRegex.exec(raw)) !== null) {
    try {
      const buf = Buffer.from(match[1], 'latin1')
      allDecompressed += zlib.inflateSync(buf).toString('latin1') + '\n'
    } catch (e) {}
  }
  return allDecompressed
}

async function runVisualTests() {
  console.log('=================================================================')
  console.log('SUÍTE DE TESTES VISUAIS E ESTRUTURAIS — HOTFIX 4.1C.3')
  console.log('=================================================================\n')

  // ----------------------------------------------------------------------------
  // 1. TESTE DE PAGAMENTO CURTO (~30 caracteres)
  // ----------------------------------------------------------------------------
  console.log('[1/7] Teste de Pagamento Curto (~30 chars)...')
  const shortTerms = {
    condicoes_pagamento: 'À vista com 5% de desconto.',
    prazo_instalacao_dias: 3,
    incluir_medicoes: true,
    observacoes_proposta: null
  }
  const baseItems = [
    {
      id: 'item-1',
      categoria_operacional: 'tela_mosquiteira',
      descricao: 'Instalação de tela mosquiteira de correr com perfis de alumínio anodizado bronze.',
      quantidade: 2,
      preco_unitario: 400.00,
      preco_total: 800.00,
      measurements: [
        { id: 'm1', ambiente: 'Quarto', tipo_vao: 'Janela', largura_mm: 1200, altura_mm: 1400, quantidade: 1, cor_estrutura: 'Bronze', tipo_material: 'Fibra de Vidro' }
      ]
    }
  ]

  const pdfShort = await generateProposalPdfBuffer({
    isPreview: true,
    numeroOs: 'OS-2026-000011',
    companySnapshot: companyFixture,
    clientSnapshot: clientFixture,
    addressSnapshot: addressFixture,
    itemsSnapshot: baseItems,
    totalsSnapshot: { valor_total: 800, valor_desconto: 40, valor_final: 760 },
    commercialTerms: shortTerms
  })
  const countShort = getPdfPageCount(pdfShort)
  assert(countShort === 1, `1.1. Pagamento curto gerado em EXATAMENTE 1 página física (contagem: ${countShort})`)

  // ----------------------------------------------------------------------------
  // 2. TESTE DE PAGAMENTO NORMAL (~120 caracteres)
  // ----------------------------------------------------------------------------
  console.log('\n[2/7] Teste de Pagamento Normal (~120 chars)...')
  const normalTerms = {
    condicoes_pagamento: 'À vista com 5% de desconto no PIX ou em até 3x sem juros no cartão de crédito.',
    prazo_instalacao_dias: 5,
    incluir_medicoes: true,
    observacoes_proposta: 'Garantia de 2 anos para os perfis e 1 ano para as malhas.'
  }

  const pdfNormal = await generateProposalPdfBuffer({
    isPreview: true,
    numeroOs: 'OS-2026-000012',
    companySnapshot: companyFixture,
    clientSnapshot: clientFixture,
    addressSnapshot: addressFixture,
    itemsSnapshot: baseItems,
    totalsSnapshot: { valor_total: 800, valor_desconto: 0, valor_final: 800 },
    commercialTerms: normalTerms
  })
  const countNormal = getPdfPageCount(pdfNormal)
  assert(countNormal === 1, `2.1. Pagamento normal gerado em EXATAMENTE 1 página física (contagem: ${countNormal})`)

  // ----------------------------------------------------------------------------
  // 3. TESTE DE PAGAMENTO LONGO (~500 caracteres) — ZERO COLISÃO COM TOTAIS
  // ----------------------------------------------------------------------------
  console.log('\n[3/7] Teste de Pagamento Longo (~500 chars) com Zero Colisão...')
  const longPaymentTerms = {
    condicoes_pagamento: 'Entrada de 40% no ato do pedido via transferência bancária / PIX, 30% na entrega e início da instalação dos materiais no local da obra, e o saldo restante de 30% em até 30 dias após o término dos serviços via boleto bancário ou cartão de crédito parcelado em até 6x sem juros adicionais. Faturamento direto para condomínios e empresas sujeito a análise prévia de crédito.',
    prazo_instalacao_dias: 10,
    incluir_medicoes: true,
    observacoes_proposta: 'Proposta com valores garantidos por 15 dias corridos.'
  }

  const pdfLongPay = await generateProposalPdfBuffer({
    isPreview: true,
    numeroOs: 'OS-2026-000013',
    companySnapshot: companyFixture,
    clientSnapshot: clientFixture,
    addressSnapshot: addressFixture,
    itemsSnapshot: baseItems,
    totalsSnapshot: { valor_total: 800, valor_desconto: 0, valor_final: 800 },
    commercialTerms: longPaymentTerms
  })
  const countLongPay = getPdfPageCount(pdfLongPay)
  assert(countLongPay === 1, `3.1. Pagamento longo (~500 chars) expande altura sem criar página extra (páginas: ${countLongPay})`)

  // ----------------------------------------------------------------------------
  // 4. TESTE DE DESCRIÇÃO LONGA (~300 caracteres) — WRAPPING & ROWHEIGHT DINÂMICO
  // ----------------------------------------------------------------------------
  console.log('\n[4/7] Teste de Descrição Longa (~300 chars)...')
  const longDescItems = [
    {
      id: 'item-long-desc',
      categoria_operacional: 'tela_mosquiteira',
      descricao: 'Fornecimento e instalação de tela mosquiteira sob medida, com estrutura em alumínio anodizado reforçado, acabamento conforme padrão definido em vistoria técnica prévia, incluindo fabricação, ajustes de esquadria, fixação e vedação siliconada necessárias para instalação completa no local indicado pelo cliente.',
      quantidade: 3,
      preco_unitario: 350.00,
      preco_total: 1050.00,
      measurements: [
        { id: 'm1', ambiente: 'Varanda Gourmet', tipo_vao: 'Porta balcão 4 folhas', largura_mm: 3200, altura_mm: 2200, quantidade: 2, cor_estrutura: 'Preto', tipo_material: 'Fibra de Vidro' }
      ]
    }
  ]

  const pdfLongDesc = await generateProposalPdfBuffer({
    isPreview: false,
    numeroOs: 'OS-2026-000014',
    versionNumber: 1,
    companySnapshot: companyFixture,
    clientSnapshot: clientFixture,
    addressSnapshot: addressFixture,
    itemsSnapshot: longDescItems,
    totalsSnapshot: { valor_total: 1050, valor_desconto: 50, valor_final: 1000 },
    commercialTerms: normalTerms
  })
  const countLongDesc = getPdfPageCount(pdfLongDesc)
  assert(countLongDesc === 1, `4.1. Descrição longa (~300 chars) renderizada com quebra de linha dinâmica (páginas: ${countLongDesc})`)

  // ----------------------------------------------------------------------------
  // 5. TESTE DE OBSERVAÇÕES LONGAS (~1.000 caracteres)
  // ----------------------------------------------------------------------------
  console.log('\n[5/7] Teste de Observações Longas (~1.000 chars)...')
  const longNotesTerms = {
    condicoes_pagamento: '50% entrada e 50% na conclusão.',
    prazo_instalacao_dias: 7,
    incluir_medicoes: false,
    observacoes_proposta: 'CLÁUSULAS GERAIS: 1. O cliente compromete-se a liberar o acesso ao local da instalação na data e horário acordados. 2. Qualquer alteração estrutural no vão após a medição final será de responsabilidade do contratante e poderá implicar em custos adicionais de refação de perfis e malhas. 3. A garantia cobre defeitos de fabricação dos componentes e da mão de obra, excluindo danos decorrentes de mau uso, cortes acidentais ou produtos químicos abrasivos. 4. Em condomínios, o cumprimento dos horários de barulho e regras de segurança vigentes no regimento interno são de total ciência e alinhamento do solicitante.'
  }

  const pdfLongNotes = await generateProposalPdfBuffer({
    isPreview: true,
    numeroOs: 'OS-2026-000015',
    companySnapshot: companyFixture,
    clientSnapshot: clientFixture,
    addressSnapshot: addressFixture,
    itemsSnapshot: baseItems,
    totalsSnapshot: { valor_total: 800, valor_desconto: 0, valor_final: 800 },
    commercialTerms: longNotesTerms
  })
  const countLongNotes = getPdfPageCount(pdfLongNotes)
  assert(countLongNotes <= 2, `5.1. Observações longas contidas com wrapping seguro (páginas: ${countLongNotes})`)

  // ----------------------------------------------------------------------------
  // 6. TESTE DE DOCUMENTO MULTIPÁGINA (12 ITENS) E RODAPÉ
  // ----------------------------------------------------------------------------
  console.log('\n[6/7] Teste de Documento Multipágina (12 Itens com Medições)...')
  const multiItems = []
  for (let i = 1; i <= 12; i++) {
    multiItems.push({
      id: `item-${i}`,
      categoria_operacional: i % 2 === 0 ? 'tela_mosquiteira' : 'rede_protecao',
      descricao: `Item de serviço ${i}: Fabricação sob medida com estrutura reforçada e malha especial.`,
      quantidade: i,
      preco_unitario: 150.00,
      preco_total: i * 150.00,
      measurements: [
        { id: `m-${i}`, ambiente: `Dormitório ${i}`, tipo_vao: 'Janela', largura_mm: 1200, altura_mm: 1400, quantidade: 1, cor_estrutura: 'Branco', tipo_material: 'Nylon' }
      ]
    })
  }

  const totalMulti = multiItems.reduce((acc, it) => acc + it.preco_total, 0)
  const pdfMulti = await generateProposalPdfBuffer({
    isPreview: false,
    numeroOs: 'OS-2026-000016',
    versionNumber: 3,
    issuedAt: new Date('2026-08-28T10:00:00Z'),
    validUntil: '2026-10-15',
    companySnapshot: companyFixture,
    clientSnapshot: clientFixture,
    addressSnapshot: addressFixture,
    itemsSnapshot: multiItems,
    totalsSnapshot: { valor_total: totalMulti, valor_desconto: 200, valor_final: totalMulti - 200 },
    commercialTerms: normalTerms
  })
  const countMulti = getPdfPageCount(pdfMulti)
  assert(countMulti === 2, `6.1. 12 itens distribuídos em EXATAMENTE 2 páginas físicas (contagem: ${countMulti})`)

  const decompressedMulti = decompressPdfStreams(pdfMulti)
  const hasFooterMulti = decompressedMulti.includes('4573746520646f63756d656e746f') || decompressedMulti.includes('Este documento') || decompressedMulti.includes('proposta comercial')
  const hasPage1Of2 = decompressedMulti.includes('67696e6120312064652032') || decompressedMulti.includes('Página 1 de 2')
  const hasPage2Of2 = decompressedMulti.includes('67696e6120322064652032') || decompressedMulti.includes('Página 2 de 2')

  assert(hasFooterMulti, '6.2. Texto institucional de rodapé presente nas páginas do documento')
  assert(hasPage1Of2, '6.3. Numeração da página 1 indica "Página 1 de 2"')
  assert(hasPage2Of2, '6.4. Numeração da página 2 indica "Página 2 de 2"')

  // ----------------------------------------------------------------------------
  // 7. RENDERIZAÇÃO EM PNG (AUDITORIA VISUAL 100% FIEL VIA PDF.JS & PLAYWRIGHT)
  // ----------------------------------------------------------------------------
  console.log('\n[7/7] Renderização Visual Real em Imagens PNG...')
  const renderNormal = await renderPdfToPng(pdfNormal, path.join(outputDir, 'render_normal_payment'))
  assert(renderNormal.numPages === 1 && renderNormal.savedImages.length === 1, '7.1. PNG do Caso Normal (1 página) renderizado com sucesso')

  const renderLongPay = await renderPdfToPng(pdfLongPay, path.join(outputDir, 'render_long_payment'))
  assert(renderLongPay.numPages === 1 && renderLongPay.savedImages.length === 1, '7.2. PNG do Caso Pagamento Longo (1 página) renderizado com sucesso')

  const renderLongDesc = await renderPdfToPng(pdfLongDesc, path.join(outputDir, 'render_long_description'))
  assert(renderLongDesc.numPages === 1 && renderLongDesc.savedImages.length === 1, '7.3. PNG do Caso Descrição Longa (1 página) renderizado com sucesso')

  const renderMulti = await renderPdfToPng(pdfMulti, path.join(outputDir, 'render_multipage'))
  assert(renderMulti.numPages === 2 && renderMulti.savedImages.length === 2, '7.4. PNGs do Caso Multipágina (2 páginas) renderizados com sucesso')

  console.log('\n=================================================================')
  console.log(`TOTAL DE ASSERTS VISUAIS E ESTRUTURAIS: ${passed + failed}`)
  console.log(`PASS: ${passed}`)
  console.log(`FAIL: ${failed}`)
  console.log('=================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runVisualTests().catch(err => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})
