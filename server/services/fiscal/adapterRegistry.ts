/**
 * Registro e Fábrica de Adaptadores Fiscais — AD Telas e Redes
 */

import type { FiscalProviderAdapter } from './types'
import { MockFiscalAdapter } from './adapters/mockAdapter'
import { StandardHttpFiscalAdapter } from './adapters/standardHttpAdapter'

const mockAdapterInstance = new MockFiscalAdapter()

export function getFiscalAdapter(providerName?: string | null): FiscalProviderAdapter {
  const provider = (providerName || process.env.FISCAL_PROVIDER || 'mock_sandbox').trim().toLowerCase()

  if (provider === 'mock_sandbox') {
    return mockAdapterInstance
  }

  if (['focusnfe', 'plugnotas', 'nuvemfiscal', 'enotas', 'webmania'].includes(provider)) {
    return new StandardHttpFiscalAdapter(provider, true)
  }

  return new StandardHttpFiscalAdapter(provider, false)
}

export function getAvailableFiscalProviders(): Array<{ id: string; label: string; isSimulated: boolean }> {
  return [
    { id: 'mock_sandbox', label: 'Ambiente de Testes / Sandbox (Simulado)', isSimulated: true },
    { id: 'focusnfe', label: 'Focus NFe', isSimulated: false },
    { id: 'plugnotas', label: 'PlugNotas (TecnoSpeed)', isSimulated: false },
    { id: 'nuvemfiscal', label: 'Nuvem Fiscal', isSimulated: false },
    { id: 'enotas', label: 'eNotas', isSimulated: false },
    { id: 'webmania', label: 'WebmaniaBR', isSimulated: false }
  ]
}
