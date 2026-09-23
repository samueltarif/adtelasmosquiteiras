/**
 * Adaptador de Simulação (Sandbox/Mock) para Testes Controlados em Homologação
 */

import crypto from 'crypto'
import type {
  FiscalProviderAdapter,
  FiscalDocumentRecord,
  FiscalDocumentItem,
  FiscalTransmissionResult,
  FiscalCancellationResult,
  FiscalEnvironment
} from '../types'
import { validateEmissionPreconditions } from '../../../shared/fiscalValidation.mjs'

export class MockFiscalAdapter implements FiscalProviderAdapter {
  readonly name = 'mock_sandbox'
  readonly supportsIdempotentRetransmit = true

  isConfigured(environment: FiscalEnvironment): boolean {
    return environment === 'homologacao'
  }

  validatePreconditions(
    doc: Partial<FiscalDocumentRecord>,
    items: FiscalDocumentItem[],
    emitter: Record<string, any>,
    recipient: Record<string, any>,
    address: Record<string, any>
  ) {
    return validateEmissionPreconditions(doc, items, emitter, recipient, address)
  }

  async transmit(
    doc: FiscalDocumentRecord,
    items: FiscalDocumentItem[],
    emitter: Record<string, any>,
    recipient: Record<string, any>,
    address: Record<string, any>,
    attemptRef: string
  ): Promise<FiscalTransmissionResult> {
    if (doc.ambiente !== 'homologacao') {
      throw new Error('ERR_MOCK_PROD_FORBIDDEN: MockAdapter é estritamente proibido no ambiente de produção.')
    }

    const validation = this.validatePreconditions(doc, items, emitter, recipient, address)
    if (!validation.isValid) {
      const msg = validation.errors.map(e => e.message).join('; ')
      return {
        success: false,
        status: 'rejeitado',
        codigoStatus: 'REJ_PRECONDITIONS',
        motivoStatus: `Rejeição prévia: ${msg}`,
        requiresPolling: false
      }
    }

    // Se o cliente possuir 'FORCE_REJECT' no nome, simula rejeição fazendária
    if (recipient?.nome?.includes('FORCE_REJECT')) {
      return {
        success: false,
        status: 'rejeitado',
        codigoStatus: '204',
        motivoStatus: 'Rejeição: Duplicidade de NF-e [chNFe: 35260900000000000000550010000000011000000010]',
        requiresPolling: false
      }
    }

    // Se o cliente possuir 'SIMULATE_TIMEOUT' no nome, simula timeout mantendo em processando
    if (recipient?.nome?.includes('SIMULATE_TIMEOUT')) {
      return {
        success: true,
        status: 'processando',
        codigoStatus: '105',
        motivoStatus: 'Lote em processamento no ambiente de homologação',
        requiresPolling: true
      }
    }

    const docNumber = doc.numero_documento || String(Math.floor(Math.random() * 900000) + 100000)
    const serie = doc.serie || '1'
    const chave = `3526${Math.floor(Date.now() / 1000)}${Math.random().toString().slice(2, 16)}55001${docNumber.padStart(9, '0')}1${Math.floor(Math.random() * 90000000) + 10000000}`.slice(0, 44)
    const protocolo = `1352600${Math.floor(Math.random() * 900000000) + 100000000}`
    const xml = `<?xml version="1.0" encoding="UTF-8"?><nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe"><NFe><infNFe Id="NFe${chave}"><ide><nNF>${docNumber}</nNF><serie>${serie}</serie></ide><total><ICMSTot><vNF>${doc.valor_total.toFixed(2)}</vNF></ICMSTot></total></infNFe></NFe><protNFe><infProt><nProt>${protocolo}</nProt></infProt></protNFe></nfeProc>`

    return {
      success: true,
      status: 'autorizado',
      codigoStatus: '100',
      motivoStatus: 'Autorizado o uso da NF-e (Ambiente de Homologação / Simulado)',
      numeroDocumento: docNumber,
      serie,
      chaveAcesso: chave,
      protocolo,
      dataAutorizacao: new Date().toISOString(),
      xmlContent: xml,
      pdfBuffer: Buffer.from(`%PDF-1.4 Simulated DANFE/DANFSE Document ${chave}`),
      requiresPolling: false
    }
  }

  async consult(doc: FiscalDocumentRecord, attemptRef: string): Promise<FiscalTransmissionResult> {
    if (doc.status === 'autorizado') {
      return {
        success: true,
        status: 'autorizado',
        codigoStatus: '100',
        motivoStatus: 'Consulta: Documento já autorizado',
        numeroDocumento: doc.numero_documento || '1',
        serie: doc.serie || '1',
        chaveAcesso: doc.chave_acesso || '',
        protocolo: doc.numero_protocolo || '',
        dataAutorizacao: doc.data_autorizacao || new Date().toISOString(),
        xmlContent: `<nfeProc><infProt><nProt>${doc.numero_protocolo}</nProt></infProt></nfeProc>`,
        pdfBuffer: Buffer.from('%PDF-1.4 Mock Consulted')
      }
    }

    if (doc.provider_reference?.includes('not_found')) {
      return {
        success: false,
        status: 'falha_processamento',
        codigoStatus: '404',
        motivoStatus: 'Documento não encontrado no provedor para esta referência.'
      }
    }

    return {
      success: true,
      status: 'autorizado',
      codigoStatus: '100',
      motivoStatus: 'Consulta: Autorizado com sucesso após consulta',
      numeroDocumento: doc.numero_documento || '101',
      serie: doc.serie || '1',
      chaveAcesso: doc.chave_acesso || '35260000000000000000550010000001011000000101',
      protocolo: '135260099999999',
      dataAutorizacao: new Date().toISOString(),
      xmlContent: `<nfeProc><infProt><nProt>135260099999999</nProt></infProt></nfeProc>`,
      pdfBuffer: Buffer.from('%PDF-1.4 Mock Consulted')
    }
  }

  async cancel(doc: FiscalDocumentRecord, reason: string): Promise<FiscalCancellationResult> {
    if (doc.status !== 'autorizado') {
      throw new Error('Apenas documentos autorizados podem ser cancelados.')
    }
    const protCancel = `1352611${Math.floor(Math.random() * 900000000) + 100000000}`
    return {
      success: true,
      codigoStatus: '135',
      motivoStatus: 'Evento registrado e vinculado a NF-e (Cancelamento homologado)',
      protocolo: protCancel,
      dataCancelamento: new Date().toISOString(),
      xmlEventoContent: `<?xml version="1.0"?><procEventoNFe><retEvento><infEvento><nProt>${protCancel}</nProt><xMotivo>Cancelamento homologado</xMotivo></infEvento></retEvento></procEventoNFe>`
    }
  }

  async fetchFiles(doc: FiscalDocumentRecord, attemptRef: string) {
    return {
      xmlBuffer: Buffer.from(`<?xml version="1.0"?><nfeProc><infNFe Id="NFe${doc.chave_acesso || '000'}"><total><vNF>${doc.valor_total}</vNF></total></infNFe></nfeProc>`),
      pdfBuffer: Buffer.from(`%PDF-1.4 Mock Auxiliary Doc ${doc.numero_documento}`)
    }
  }

  verifyWebhookAuthentication(event: any, rawBody: string, headers: Record<string, string>): boolean {
    const authHeader = headers['authorization'] || headers['x-webhook-token'] || ''
    return authHeader.includes('valid_mock_token') || headers['x-signature'] === 'valid_sig'
  }

  async processWebhook(payload: any): Promise<FiscalTransmissionResult> {
    const status = payload?.status === 'autorizado' ? 'autorizado' : 'rejeitado'
    return {
      success: status === 'autorizado',
      status: status as any,
      codigoStatus: payload?.codigo || (status === 'autorizado' ? '100' : '999'),
      motivoStatus: payload?.motivo || 'Retorno de webhook processado'
    }
  }
}
