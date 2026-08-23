export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')

  const baseUrl = 'https://www.adtelasmosquiteiras.com.br'

  // Fase 03C: 20 URLs canônicas indexáveis oficiais da arquitetura definitiva
  const coreRoutes = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/orcamento', changefreq: 'monthly', priority: '0.8' },
    { path: '/contato', changefreq: 'monthly', priority: '0.7' },
    { path: '/por-que-instalar-tela-mosquiteira', changefreq: 'monthly', priority: '0.7' },
    { path: '/servicos', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/vidracaria', changefreq: 'weekly', priority: '0.8' },
    { path: '/servicos/telas', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/telas/janelas', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/telas/portas', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/telas/sacadas-e-varandas', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/telas/removivel', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/telas/pet-screen', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/telas/restaurantes', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/redes', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/redes/janelas', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/redes/sacadas-e-varandas', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/redes/gatos-e-pets', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/redes/criancas', changefreq: 'weekly', priority: '0.9' },
    { path: '/servicos/redes/escadas-e-mezaninos', changefreq: 'weekly', priority: '0.9' },
    { path: '/areas-atendidas', changefreq: 'weekly', priority: '0.8' }
  ]

  const lastmod = new Date().toISOString().split('T')[0]

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${coreRoutes
  .map(
    (r) => `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return sitemapXml
})
