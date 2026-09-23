/**
 * Contratos e Interfaces TypeScript do Domínio Fiscal — AD Telas e Redes
 */

import type { H3Event } from 'h3'

export type FiscalDocumentType = 'nfe' | 'nfse'
export type FiscalEnvironment = 'homologacao' | 'producao'
export type FiscalStatus = 'rascunho' | 'processando' | 'autorizado' | 'rejeitado' | 'cancelado' | 'falha_processamento'
export type FiscalTransmissionPhase = 'draft' | 'locked_pre_send' | 'dispatched_awaiting_response' | 'completed'

export interface FiscalDocumentItem {
  id?: string
  fiscal_document_id?: string
  work_order_item_id: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  valor_desconto?: number
  valor_liquido: number
  tipo_item: 'servico' | 'mercadoria'
  ncm?: string | null
  cest?: string | null
  cfop?: string | null
  cst_icms?: string | null
  csosn?: string | null
  codigo_servico_lc116?: string | null
  codigo_tributacao_municipio?: string | null
  aliquota_iss?: number | null
  iss_retido?: boolean
  cClassTrib?: string | null
  aliquota_ibs?: number | null
  aliquota_cbs?: number | null
}

export interface FiscalDocumentRecord {
  id: string
  work_order_id: string
  client_id: string
  address_id?: string | null
  numero_documento?: string | null
  serie?: string | null
  tipo_documento: FiscalDocumentType
  ambiente: FiscalEnvironment
  is_simulated: boolean
  status: FiscalStatus
  transmission_phase: FiscalTransmissionPhase
  storage_pending: boolean
  locked_by_executor?: string | null
  locked_until?: string | null
  lease_token?: string | null
  last_attempt_at?: string | null
  next_retry_at?: string | null
  provider: string
  provider_reference?: string | null
  idempotency_key: string
  chave_acesso?: string | null
  numero_protocolo?: string | null
  data_autorizacao?: string | null
  codigo_status?: string | null
  motivo_status?: string | null
  valor_total: number
  valor_servicos: number
  valor_produtos: number
  valor_desconto: number
  valor_liquido: number
  valor_iss: number
  valor_icms: number
  valor_pis: number
  valor_cofins: number
  valor_ibs: number
  valor_cbs: number
  valor_retencoes: number
  snapshot_emitente: Record<string, any>
  snapshot_destinatario: Record<string, any>
  snapshot_endereco: Record<string, any>
  snapshot_itens: FiscalDocumentItem[]
  created_at: string
  updated_at: string
}

export interface FiscalTransmissionResult {
  success: boolean
  status: FiscalStatus
  codigoStatus?: string
  motivoStatus?: string
  numeroDocumento?: string
  serie?: string
  chaveAcesso?: string
  protocolo?: string
  dataAutorizacao?: string
  xmlContent?: string
  pdfBuffer?: Buffer
  rawResponse?: any
  requiresPolling?: boolean
}

export interface FiscalCancellationResult {
  success: boolean
  codigoStatus?: string
  motivoStatus?: string
  protocolo?: string
  dataCancelamento?: string
  xmlEventoContent?: string
}

export interface FiscalProviderAdapter {
  readonly name: string
  readonly supportsIdempotentRetransmit: boolean
  isConfigured(environment: FiscalEnvironment): boolean
  validatePreconditions(
    doc: Partial<FiscalDocumentRecord>,
    items: FiscalDocumentItem[],
    emitter: Record<string, any>,
    recipient: Record<string, any>,
    address: Record<string, any>
  ): { isValid: boolean; errors: Array<{ field: string; message: string; blocking: boolean }> }
  transmit(
    doc: FiscalDocumentRecord,
    items: FiscalDocumentItem[],
    emitter: Record<string, any>,
    recipient: Record<string, any>,
    address: Record<string, any>,
    attemptRef: string
  ): Promise<FiscalTransmissionResult>
  consult(doc: FiscalDocumentRecord, attemptRef: string): Promise<FiscalTransmissionResult>
  cancel(doc: FiscalDocumentRecord, reason: string): Promise<FiscalCancellationResult>
  fetchFiles(doc: FiscalDocumentRecord, attemptRef: string): Promise<{ xmlBuffer?: Buffer; pdfBuffer?: Buffer }>
  verifyWebhookAuthentication(event: H3Event, rawBody: string, headers: Record<string, string>): boolean
  processWebhook(payload: any): Promise<FiscalTransmissionResult>
}
