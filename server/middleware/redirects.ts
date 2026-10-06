import { defineEventHandler, sendRedirect, getRequestURL } from 'h3'
import { ALL_REDIRECTS } from '../redirectsMap'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = (url.pathname.endsWith('/') && url.pathname.length > 1) 
    ? url.pathname.slice(0, -1) 
    : url.pathname

  if (ALL_REDIRECTS[pathname]) {
    const target = ALL_REDIRECTS[pathname]
    const search = url.search || ''
    return sendRedirect(event, target + search, 301)
  }
})
