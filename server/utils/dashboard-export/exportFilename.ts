/**
 * Gerador Canônico de Nomes de Arquivo para Exportação
 * Padrão: AD_Telas_<dataset>_<YYYY-MM-DD>_<HH-mm>.<ext>
 * Arquivo: server/utils/dashboard-export/exportFilename.ts
 * Limite: <= 200 linhas
 */

export function generateExportFilename(datasetOrType: string, extension: string): string {
  const now = new Date()
  
  // Formatador no fuso de São Paulo
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now)

  const map: Record<string, string> = {}
  for (const p of parts) {
    map[p.type] = p.value
  }

  const dateStr = `${map.year}-${map.month}-${map.day}`
  const timeStr = `${map.hour}-${map.minute}`

  // Sanitiza nome do dataset para caracteres seguros em Windows
  const safeName = datasetOrType
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  const cleanExt = extension.replace(/^\./, '')
  return `AD_Telas_${safeName}_${dateStr}_${timeStr}.${cleanExt}`
}
