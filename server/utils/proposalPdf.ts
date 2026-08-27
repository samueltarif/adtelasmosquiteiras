/**
 * Utilitário de Geração de PDF Profissional para Orçamentos Comerciais
 * Arquivo: server/utils/proposalPdf.ts
 */

import { generateProposalPdfBuffer as generatePdfCore } from '../shared/proposalCore.mjs'
import type { GenerateProposalPdfOptions } from '../shared/proposalPdfTypes'

export * from '../shared/proposalPdfTypes'

export async function generateProposalPdfBuffer(options: GenerateProposalPdfOptions): Promise<Buffer> {
  return generatePdfCore(options)
}
