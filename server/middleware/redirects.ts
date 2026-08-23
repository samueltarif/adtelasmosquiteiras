import { defineEventHandler, sendRedirect, getRequestURL } from 'h3'
import { REDIRECT_MAP } from '../redirectsMap'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = (url.pathname.endsWith('/') && url.pathname.length > 1) 
    ? url.pathname.slice(0, -1) 
    : url.pathname

  if (REDIRECT_MAP[pathname]) {
    const target = REDIRECT_MAP[pathname]
    const search = url.search || ''
    return sendRedirect(event, target + search, 301)
  }
})
