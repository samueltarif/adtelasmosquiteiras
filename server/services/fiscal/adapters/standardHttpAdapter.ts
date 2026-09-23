/**
 * Adaptador Conector HTTP Genérico para Provedores Especializados (FocusNFe, PlugNotas, etc.)
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

export class StandardHttpFiscalAdapter implements FiscalProviderAdapter {
  readonly name: string
  readonly supportsIdempotentRetransmit: boolean

  constructor(providerName = 'http_provider', supportsIdempotency = true) {
    this.name = providerName
    this.supportsIdempotentRetransmit = supportsIdempotency
  }

  isConfigured(environment: FiscalEnvironment): boolean {
    const config = useRuntimeConfig()
    const token = (config as any).fiscalApiToken || process.env.FISCAL_API_TOKEN
    const provider = (config as any).fiscalProvider || process.env.FISCAL_PROVIDER
    return Boolean(token && provider && provider !== 'mock_sandbox')
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
    if (!this.isConfigured(doc.ambiente)) {
      throw new Error(
        `ERR_PROVIDER_NOT_CONFIGURED: As credenciais do provedor fiscal (${this.name}) não estão configuradas nas variáveis de ambiente do servidor.`
      )
    }

    const validation = this.validatePreconditions(doc, items, emitter, recipient, address)
    if (!validation.isValid) {
      const msg = validation.errors.map(e => e.message).join('; ')
      return {
        success: false,
        status: 'rejeitado',
        codigoStatus: 'REJ_PRECONDITIONS',
        motivoStatus: `Validação fiscal prévia rejeitada: ${msg}`
      }
    }

    throw new Error(
      `ERR_PROVIDER_INTEGRATION_PENDING: O conector HTTP para ${this.name} aguarda a definição final do provedor e formato de contrato pelo usuário.`
    )
  }

  async consult(doc: FiscalDocumentRecord, attemptRef: string): Promise<FiscalTransmissionResult> {
    if (!this.isConfigured(doc.ambiente)) {
      throw new Error(`ERR_PROVIDER_NOT_CONFIGURED: Credenciais de ${this.name} ausentes no servidor.`)
    }
    throw new Error('ERR_PROVIDER_INTEGRATION_PENDING: Consulta de status aguarda homologação com o provedor.')
  }

  async cancel(doc: FiscalDocumentRecord, reason: string): Promise<FiscalCancellationResult> {
    if (!this.isConfigured(doc.ambiente)) {
      throw new Error(`ERR_PROVIDER_NOT_CONFIGURED: Credenciais de ${this.name} ausentes no servidor.`)
    }
    throw new Error('ERR_PROVIDER_INTEGRATION_PENDING: Cancelamento fiscal aguarda homologação com o provedor.')
  }

  async fetchFiles(doc: FiscalDocumentRecord, attemptRef: string) {
    throw new Error('ERR_PROVIDER_INTEGRATION_PENDING: Recuperação de arquivos aguarda homologação.')
  }

  verifyWebhookAuthentication(event: any, rawBody: string, headers: Record<string, string>): boolean {
    const authType = process.env.FISCAL_WEBHOOK_AUTH_TYPE || 'header_token'
    const secret = process.env.FISCAL_WEBHOOK_AUTH_SECRET || ''
    if (!secret) return false

    if (authType === 'header_token') {
      const token = headers['x-webhook-token'] || headers['x-api-key']
      return token === secret
    }

    if (authType === 'bearer') {
      const auth = headers['authorization'] || ''
      return auth === `Bearer ${secret}`
    }

    if (authType === 'signature') {
      const sig = headers['x-signature'] || headers['x-hub-signature'] || ''
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      return sig === expected || sig === `sha256=${expected}`
    }

    return false
  }

  async processWebhook(payload: any): Promise<FiscalTransmissionResult> {
    throw new Error('ERR_WEBHOOK_PROCESSING_PENDING: Processamento de webhook aguarda leiaute do provedor.')
  }
}
