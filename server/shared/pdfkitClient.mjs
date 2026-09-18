/**
 * Client PDFKit com fontes padrão registradas estaticamente.
 *
 * Utiliza o runtime browser.mjs do pdfkit que suporta 'registerStdFonts',
 * evitando require() dinâmicos de subpaths (#standard-fonts/*) que falham
 * em ambientes serverless como o Vercel.
 */
import PDFDocument, { registerStdFonts } from 'pdfkit/browser'
import Helvetica from 'pdfkit/standard-fonts/Helvetica'
import HelveticaBold from 'pdfkit/standard-fonts/HelveticaBold'
import HelveticaOblique from 'pdfkit/standard-fonts/HelveticaOblique'
import HelveticaBoldOblique from 'pdfkit/standard-fonts/HelveticaBoldOblique'

// Registra fontes Helvetica em memória para uso no documento
registerStdFonts(
  Helvetica,
  HelveticaBold,
  HelveticaOblique,
  HelveticaBoldOblique
)

export default PDFDocument
export { PDFDocument, registerStdFonts }
