import { defineEventHandler, sendRedirect, getRequestURL } from 'h3'
import { ALL_REDIRECTS } from '../redirectsMap'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = (url.pathname.endsWith('/') && url.pathname.length > 1) 
    ? url.pathname.slice(0, -1) 
    : url.pathname

  // Redirecionamento permanente de mídias para a CDN Cloudflare R2
  if (url.pathname.startsWith('/images/')) {
    return sendRedirect(event, `https://media.adtelasmosquiteiras.com.br${url.pathname}${url.search || ''}`, 308)
  }
  if (url.pathname.startsWith('/videos/')) {
    return sendRedirect(event, `https://media.adtelasmosquiteiras.com.br${url.pathname}${url.search || ''}`, 308)
  }

  if (ALL_REDIRECTS[pathname]) {
    const target = ALL_REDIRECTS[pathname]
    const search = url.search || ''
    return sendRedirect(event, target + search, 301)
  }
})
