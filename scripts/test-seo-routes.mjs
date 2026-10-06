import assert from 'node:assert/strict'
import { PUBLIC_ROUTES } from '../shared/publicRoutes.ts'
import { ALL_REDIRECTS, CANONICALIZATION_REDIRECT_MAP, REDIRECT_MAP } from '../server/redirectsMap.ts'

const origin = process.argv[2] || process.env.SEO_TEST_ORIGIN || 'http://localhost:3001'
const canonicalOrigin = 'https://www.adtelasmosquiteiras.com.br'
const invalidRoutes = [
  '/servicos/telas/especiais/inexistente-seo',
  '/servicos/redes/residencial/inexistente-seo',
  '/servicos/inexistente-seo',
  '/servicos/telas/inexistente-seo',
  '/servicos/redes/inexistente-seo'
]
const serviceRoutes = PUBLIC_ROUTES.filter(route =>
  route.path.startsWith('/servicos/telas/') || route.path.startsWith('/servicos/redes/')
)

function getTag(html, attribute, value) {
  return [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)]
    .map(match => match[0])
    .find(tag => new RegExp(`${attribute}=["']${value}["']`, 'i').test(tag))
}

function getAttribute(tag, name) {
  return tag?.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))?.[1]
}

function jsonLdTypes(html) {
  const types = []
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const parsed = JSON.parse(match[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'))
    const nodes = parsed['@graph'] ?? [parsed]
    for (const node of nodes) if (node?.['@type']) types.push(node['@type'])
  }
  return types.flat()
}

async function request(path, redirect = 'follow') {
  return fetch(`${origin}${path}`, { redirect, signal: AbortSignal.timeout(15000) })
}

assert.equal(PUBLIC_ROUTES.length, 20, 'O catálogo deve manter 20 rotas públicas')
assert.equal(Object.keys(REDIRECT_MAP).length, 46, 'Os 45 redirects SEO e /home devem ser preservados')
assert.equal(Object.keys(CANONICALIZATION_REDIRECT_MAP).length, 1)
assert.equal(Object.keys(ALL_REDIRECTS).length, 47)

for (const route of PUBLIC_ROUTES) {
  const response = await request(route.path)
  assert.equal(response.status, 200, `${route.path} deveria responder 200`)
  const html = await response.text()
  const expected = `${canonicalOrigin}${route.path === '/' ? '/' : route.path}`
  const canonical = getAttribute(getTag(html, 'rel', 'canonical'), 'href')
  const ogUrl = getAttribute(getTag(html, 'property', 'og:url'), 'content')
  assert.equal(canonical, expected, `canonical incorreta em ${route.path}`)
  assert.equal(ogUrl, expected, `og:url incorreta em ${route.path}`)
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${route.path} deve ter um H1`)
  const types = jsonLdTypes(html)
  assert(types.includes('WebSite'), `${route.path} sem WebSite JSON-LD`)
  assert(types.includes('LocalBusiness'), `${route.path} sem LocalBusiness JSON-LD`)
  assert(!types.includes('AggregateRating'), `${route.path} não deve publicar AggregateRating`)
}

for (const route of serviceRoutes) {
  const html = await (await request(route.path)).text()
  const types = jsonLdTypes(html)
  assert(types.includes('Service'), `${route.path} sem Service JSON-LD`)
  assert(types.includes('BreadcrumbList'), `${route.path} sem BreadcrumbList JSON-LD`)
}

for (const [source, target] of Object.entries(ALL_REDIRECTS)) {
  const response = await request(`${source}?origem=seo`, 'manual')
  assert.equal(response.status, 301, `${source} deveria responder 301`)
  const location = new URL(response.headers.get('location'), origin)
  assert.equal(`${location.pathname}${location.search}`, `${target}?origem=seo`, `${source} deve preservar query string`)
}

for (const path of invalidRoutes) {
  const response = await request(path, 'manual')
  assert.equal(response.status, 404, `${path} deveria responder 404`)
}

const sitemapResponse = await request('/sitemap.xml')
assert.equal(sitemapResponse.status, 200)
const sitemap = await sitemapResponse.text()
assert.equal((sitemap.match(/<url>/g) ?? []).length, 20)
assert(!sitemap.includes('<lastmod>'), 'Sitemap não deve ter lastmod artificial')
for (const route of PUBLIC_ROUTES) {
  assert(sitemap.includes(`<loc>${canonicalOrigin}${route.path}</loc>`), `Sitemap sem ${route.path}`)
}

console.log(`SEO OK: ${PUBLIC_ROUTES.length} rotas, ${Object.keys(ALL_REDIRECTS).length} redirects e ${invalidRoutes.length} rotas 404 validadas.`)
