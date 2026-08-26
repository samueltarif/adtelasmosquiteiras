export const CTA_LOCATIONS = [
  'header',
  'hero',
  'footer',
  'floating_whatsapp',
  'sticky_mobile',
  'service_card',
  'service_page',
  'quote_form',
  'contact_form',
  'cep_result',
  'modal',
  'faq',
  'other'
] as const

export type CtaLocation = typeof CTA_LOCATIONS[number]

export const ACTION_TYPES = [
  'whatsapp',
  'telefone',
  'internal_cta',
  'form_start',
  'form_submit'
] as const

export type ActionType = typeof ACTION_TYPES[number]

export const SERVICE_TAXONOMY: Record<string, { key: string; name: string }> = {
  // Telas Mosquiteiras
  telas_janelas: { key: 'telas_janelas', name: 'Telas Mosquiteiras para Janelas' },
  telas_portas: { key: 'telas_portas', name: 'Telas Mosquiteiras para Portas' },
  telas_varandas: { key: 'telas_varandas', name: 'Telas Mosquiteiras para Varandas' },
  telas_sacadas: { key: 'telas_sacadas', name: 'Telas Mosquiteiras para Sacadas' },
  telas_apartamentos: { key: 'telas_apartamentos', name: 'Telas Mosquiteiras para Apartamentos' },
  telas_banheiro: { key: 'telas_banheiro', name: 'Telas Mosquiteiras para Banheiro' },
  telas_correr: { key: 'telas_correr', name: 'Telas Mosquiteiras de Correr' },
  telas_removiveis: { key: 'telas_removiveis', name: 'Telas Mosquiteiras Removíveis' },
  telas_perfis: { key: 'telas_perfis', name: 'Telas Mosquiteiras com Perfis' },
  telas_basculantes: { key: 'telas_basculantes', name: 'Telas Mosquiteiras para Basculantes' },
  telas_pivotantes: { key: 'telas_pivotantes', name: 'Telas Mosquiteiras Pivotantes' },
  telas_especiais: { key: 'telas_especiais', name: 'Telas Mosquiteiras Especiais' },
  telas_anti_pernilongos: { key: 'telas_anti_pernilongos', name: 'Telas Mosquiteiras Anti-Pernilongos' },
  telas_fachadas: { key: 'telas_fachadas', name: 'Telas Mosquiteiras para Fachadas' },
  telas_coberturas: { key: 'telas_coberturas', name: 'Telas Mosquiteiras para Coberturas' },
  telas_restaurantes: { key: 'telas_restaurantes', name: 'Telas Mosquiteiras para Restaurantes' },
  telas_industrias: { key: 'telas_industrias', name: 'Telas Mosquiteiras para Indústrias' },
  pet_screen: { key: 'pet_screen', name: 'Telas Mosquiteiras Pet Screen' },

  // Redes de Proteção
  redes_janelas: { key: 'redes_janelas', name: 'Redes de Proteção para Janelas' },
  redes_sacadas: { key: 'redes_sacadas', name: 'Redes de Proteção para Sacadas e Varandas' },
  redes_pets: { key: 'redes_pets', name: 'Redes de Proteção para Gatos e Pets' },
  redes_criancas: { key: 'redes_criancas', name: 'Redes de Proteção para Crianças' },
  redes_escadas: { key: 'redes_escadas', name: 'Redes de Proteção para Escadas e Mezaninos' },

  // Vidraçaria
  vidracaria: { key: 'vidracaria', name: 'Serviços de Vidraçaria' }
}

export function getServiceMetadata(key: string | null | undefined): { key: string; name: string } | null {
  if (!key) return null
  return SERVICE_TAXONOMY[key] || null
}

export function getServiceFromPath(path: string | null | undefined): { key: string; name: string } | null {
  if (!path) return null
  const clean = path.replace(/\/$/, '').toLowerCase()

  // Telas Mosquiteiras específicas
  if (clean.includes('/telas/pet-screen')) return SERVICE_TAXONOMY.pet_screen
  if (clean.includes('/telas/janelas')) return SERVICE_TAXONOMY.telas_janelas
  if (clean.includes('/telas/portas')) return SERVICE_TAXONOMY.telas_portas
  if (clean.includes('/telas/varandas')) return SERVICE_TAXONOMY.telas_varandas
  if (clean.includes('/telas/sacadas')) return SERVICE_TAXONOMY.telas_sacadas
  if (clean.includes('/telas/apartamentos')) return SERVICE_TAXONOMY.telas_apartamentos
  if (clean.includes('/telas/banheiro')) return SERVICE_TAXONOMY.telas_banheiro
  if (clean.includes('/telas/correr')) return SERVICE_TAXONOMY.telas_correr
  if (clean.includes('/telas/removivel') || clean.includes('/telas/removiveis')) return SERVICE_TAXONOMY.telas_removiveis
  if (clean.includes('/telas/perfis')) return SERVICE_TAXONOMY.telas_perfis
  if (clean.includes('/telas/basculantes')) return SERVICE_TAXONOMY.telas_basculantes
  if (clean.includes('/telas/pivotantes')) return SERVICE_TAXONOMY.telas_pivotantes
  if (clean.includes('/telas/especiais')) return SERVICE_TAXONOMY.telas_especiais
  if (clean.includes('/telas/anti-pernilongos')) return SERVICE_TAXONOMY.telas_anti_pernilongos
  if (clean.includes('/telas/fachadas')) return SERVICE_TAXONOMY.telas_fachadas
  if (clean.includes('/telas/coberturas')) return SERVICE_TAXONOMY.telas_coberturas
  if (clean.includes('/telas/restaurantes')) return SERVICE_TAXONOMY.telas_restaurantes
  if (clean.includes('/telas/industrias')) return SERVICE_TAXONOMY.telas_industrias
  if (clean.includes('/servicos/telas')) return { key: 'telas_mosquiteiras', name: 'Telas Mosquiteiras' }

  // Redes de Proteção específicas
  if (clean.includes('/redes/gatos') || clean.includes('/redes/pets')) return SERVICE_TAXONOMY.redes_pets
  if (clean.includes('/redes/janelas')) return SERVICE_TAXONOMY.redes_janelas
  if (clean.includes('/redes/sacadas')) return SERVICE_TAXONOMY.redes_sacadas
  if (clean.includes('/redes/criancas')) return SERVICE_TAXONOMY.redes_criancas
  if (clean.includes('/redes/escadas') || clean.includes('/redes/mezaninos')) return SERVICE_TAXONOMY.redes_escadas
  if (clean.includes('/servicos/redes')) return { key: 'redes_protecao', name: 'Redes de Proteção' }

  // Vidraçaria
  if (clean.includes('/vidracaria')) return SERVICE_TAXONOMY.vidracaria

  return null
}
