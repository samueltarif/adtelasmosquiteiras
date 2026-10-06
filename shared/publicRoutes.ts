export type PublicRoute = {
  path: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: string
  kind: 'home' | 'institutional' | 'service' | 'coverage'
}

export const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { path: '/', changefreq: 'daily', priority: '1.0', kind: 'home' },
  { path: '/orcamento', changefreq: 'monthly', priority: '0.8', kind: 'institutional' },
  { path: '/contato', changefreq: 'monthly', priority: '0.7', kind: 'institutional' },
  { path: '/por-que-instalar-tela-mosquiteira', changefreq: 'monthly', priority: '0.7', kind: 'institutional' },
  { path: '/servicos', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/vidracaria', changefreq: 'weekly', priority: '0.8', kind: 'service' },
  { path: '/servicos/telas', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/telas/janelas', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/telas/portas', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/telas/sacadas-e-varandas', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/telas/removivel', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/telas/pet-screen', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/telas/restaurantes', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/redes', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/redes/janelas', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/redes/sacadas-e-varandas', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/redes/gatos-e-pets', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/redes/criancas', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/servicos/redes/escadas-e-mezaninos', changefreq: 'weekly', priority: '0.9', kind: 'service' },
  { path: '/areas-atendidas', changefreq: 'weekly', priority: '0.8', kind: 'coverage' }
] as const

export const PUBLIC_ROUTE_PATHS = new Set(PUBLIC_ROUTES.map(route => route.path))
