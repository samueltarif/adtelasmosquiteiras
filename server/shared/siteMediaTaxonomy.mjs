export const SERVICE_FAMILIES = [
  {
    id: 'telas',
    name: 'Telas Mosquiteiras',
    icon: 'lucide:grid',
    services: [
      { key: 'telas_janelas', name: 'Telas para Janelas' },
      { key: 'telas_portas', name: 'Telas para Portas' },
      { key: 'telas_sacadas', name: 'Telas para Sacadas' },
      { key: 'telas_removiveis', name: 'Telas Removíveis' },
      { key: 'pet_screen', name: 'Telas Pet Screen' },
      { key: 'telas_restaurantes', name: 'Telas para Restaurantes' }
    ]
  },
  {
    id: 'redes',
    name: 'Redes de Proteção',
    icon: 'lucide:shield-check',
    services: [
      { key: 'redes_janelas', name: 'Redes para Janelas' },
      { key: 'redes_sacadas', name: 'Redes para Sacadas e Varandas' },
      { key: 'redes_pets', name: 'Redes para Pets e Gatos' },
      { key: 'redes_criancas', name: 'Redes para Crianças' },
      { key: 'redes_escadas', name: 'Redes para Escadas e Mezaninos' }
    ]
  },
  {
    id: 'vidracaria',
    name: 'Vidraçaria',
    icon: 'lucide:sparkles',
    services: [
      { key: 'vidracaria', name: 'Serviços de Vidraçaria' }
    ]
  }
]

export const ALL_SERVICES_MAP = {
  telas_janelas: { key: 'telas_janelas', name: 'Telas para Janelas', family: 'telas' },
  telas_portas: { key: 'telas_portas', name: 'Telas para Portas', family: 'telas' },
  telas_sacadas: { key: 'telas_sacadas', name: 'Telas para Sacadas', family: 'telas' },
  telas_removiveis: { key: 'telas_removiveis', name: 'Telas Removíveis', family: 'telas' },
  pet_screen: { key: 'pet_screen', name: 'Telas Pet Screen', family: 'telas' },
  telas_restaurantes: { key: 'telas_restaurantes', name: 'Telas para Restaurantes', family: 'telas' },
  redes_janelas: { key: 'redes_janelas', name: 'Redes para Janelas', family: 'redes' },
  redes_sacadas: { key: 'redes_sacadas', name: 'Redes para Sacadas e Varandas', family: 'redes' },
  redes_pets: { key: 'redes_pets', name: 'Redes para Pets e Gatos', family: 'redes' },
  redes_criancas: { key: 'redes_criancas', name: 'Redes para Crianças', family: 'redes' },
  redes_escadas: { key: 'redes_escadas', name: 'Redes para Escadas e Mezaninos', family: 'redes' },
  vidracaria: { key: 'vidracaria', name: 'Serviços de Vidraçaria', family: 'vidracaria' }
}
