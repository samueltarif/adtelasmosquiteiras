type BreadcrumbItem = { label: string; path: string }

const SITE_URL = 'https://www.adtelasmosquiteiras.com.br'

export function buildServiceSchema(name: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType: name,
    url: `${SITE_URL}${path}`,
    provider: { '@id': `${SITE_URL}/#empresa` },
    areaServed: { '@type': 'AdministrativeArea', name: 'Estado de São Paulo' }
  }
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${SITE_URL}${item.path}`
    }))
  }
}
