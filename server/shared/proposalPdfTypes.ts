/**
 * Tipos e Interfaces para Geração de Propostas em PDF
 * Arquivo: server/shared/proposalPdfTypes.ts
 */

export interface ProposalPdfCompanySnapshot {
  trade_name?: string | null
  legal_name?: string | null
  cnpj?: string | null
  phone_display?: string | null
  whatsapp_number?: string | null
  email_contact?: string | null
  website?: string | null
  cep?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  document_footer_text?: string | null
  logo_source?: string | null
  logo_path?: string | null
}

export interface ProposalPdfClientSnapshot {
  nome?: string | null
  nome_fantasia?: string | null
  razao_social?: string | null
  cpf_cnpj?: string | null
  telefone_principal?: string | null
  email?: string | null
  tipo_cliente?: string | null
}

export interface ProposalPdfAddressSnapshot {
  rotulo?: string | null
  tipo_imovel?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
}

export interface ProposalPdfMeasurement {
  ambiente?: string | null
  tipo_vao?: string | null
  largura_mm?: number | null
  altura_mm?: number | null
  quantidade?: number | null
  cor_estrutura?: string | null
  tipo_material?: string | null
}

export interface ProposalPdfItem {
  categoria_operacional?: string | null
  descricao?: string | null
  quantidade?: number | null
  preco_unitario?: number | null
  preco_total?: number | null
  measurements?: ProposalPdfMeasurement[] | null
}

export interface ProposalPdfTotalsSnapshot {
  valor_total?: number | null
  valor_desconto?: number | null
  valor_final?: number | null
}

export interface ProposalPdfCommercialTerms {
  condicoes_pagamento?: string | null
  prazo_instalacao_dias?: number | null
  incluir_medicoes?: boolean | null
  observacoes_proposta?: string | null
}

export interface GenerateProposalPdfOptions {
  isPreview?: boolean
  versionNumber?: number | null
  numeroOs: string
  issuedAt?: string | Date | null
  validUntil?: string | Date | null
  companySnapshot: ProposalPdfCompanySnapshot
  clientSnapshot: ProposalPdfClientSnapshot
  addressSnapshot?: ProposalPdfAddressSnapshot | null
  itemsSnapshot: ProposalPdfItem[]
  totalsSnapshot: ProposalPdfTotalsSnapshot
  commercialTerms?: ProposalPdfCommercialTerms | null
}

export function formatCurrencyBrl(val?: number | null): string {
  const num = typeof val === 'number' ? val : 0
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

export function formatDateBr(val?: string | Date | null): string {
  if (!val) return '-'
  const d = typeof val === 'string' ? new Date(val) : val
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(d)
}
