/**
 * Construtor e Validador Puro de Links de Rastreamento
 * Arquivo: app/utils/trackingLinkBuilder.ts
 */

import type { BuiltTrackingLink, LinkValidationResult, TrackingLinkState } from '../types/trackingLinks'
import {
  CANONICAL_BASE_DOMAIN,
  META_ADS_PARAMS,
  TIKTOK_SMART_PLUS_PARAMS,
  TIKTOK_STANDARD_PARAMS
} from './trackingLinkPresets.ts'
import { classifyClientChannel } from './trafficChannelClassifier.ts'

export function isMacro(val: string): boolean {
  if (!val) return false
  const trimmed = val.trim()
  return (trimmed.startsWith('{{') && trimmed.endsWith('}}')) || (trimmed.startsWith('__') && trimmed.endsWith('__'))
}

export function sanitizeParamValue(val: string): string {
  if (!val) return ''
  if (isMacro(val)) return val.trim()
  return val
    .replace(/<[^>]*>?/gm, '')
    .trim()
    .toLowerCase()
    .replace(/[<>"';\\^`{}|!@#$%&*()+=[\]]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function resolveExpectedChannel(state: TrackingLinkState): string {
  if (state.trafficType === 'organic') {
    if (state.platform === 'instagram') return 'instagram_organic'
    if (state.platform === 'facebook') return 'facebook_organic'
    if (state.platform === 'tiktok') return 'tiktok_organic'
    return 'referral'
  }
  if (state.platform === 'instagram') return 'instagram_ads'
  if (state.platform === 'facebook') return 'facebook_ads'
  if (state.platform === 'tiktok') return 'tiktok_ads'
  return 'other_paid'
}

export function buildTrackingUrl(state: TrackingLinkState): BuiltTrackingLink {
  let targetPath = state.destination === 'custom' ? (state.customDestination || '/').trim() : state.destination
  if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
    try {
      const parsed = new URL(targetPath)
      const allowedHosts = ['www.adtelasmosquiteiras.com.br', 'adtelasmosquiteiras.com.br']
      targetPath = allowedHosts.includes(parsed.hostname) ? parsed.pathname + parsed.search + parsed.hash : '/'
    } catch {
      targetPath = '/'
    }
  }
  if (!targetPath.startsWith('/')) targetPath = '/' + targetPath

  const [pathAndQuery, hash] = targetPath.split('#')
  const [cleanPath, existingQuery] = pathAndQuery.split('?')
  const params: Record<string, string> = {}

  if (state.trafficType === 'organic') {
    params.utm_source = state.platform
    params.utm_medium = 'organic'
    if (state.campaign) params.utm_campaign = sanitizeParamValue(state.campaign)
    if (state.content) params.utm_content = sanitizeParamValue(state.content)
    if (state.term) params.utm_term = sanitizeParamValue(state.term)
  } else if (state.platform === 'instagram' || state.platform === 'facebook') {
    Object.assign(params, META_ADS_PARAMS)
  } else if (state.platform === 'tiktok') {
    const template = state.tiktokAdsMode === 'smart_plus' ? TIKTOK_SMART_PLUS_PARAMS : TIKTOK_STANDARD_PARAMS
    Object.assign(params, template)
  }

  const queryParts: string[] = []
  if (existingQuery) {
    existingQuery.split('&').forEach((part) => { if (part) queryParts.push(part) })
  }

  const macrosFound: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue
    if (isMacro(v)) {
      macrosFound.push(v)
      queryParts.push(`${encodeURIComponent(k)}=${v}`)
    } else {
      queryParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    }
  }

  const queryString = queryParts.length ? `?${queryParts.join('&')}` : ''
  const hashString = hash ? `#${hash}` : ''
  const fullUrl = `${CANONICAL_BASE_DOMAIN}${cleanPath}${queryString}${hashString}`

  return {
    fullUrl,
    baseDomain: CANONICAL_BASE_DOMAIN,
    path: cleanPath,
    expectedChannel: resolveExpectedChannel(state),
    utm_source: params.utm_source || '',
    utm_medium: params.utm_medium || '',
    utm_campaign: params.utm_campaign || '',
    utm_content: params.utm_content,
    utm_term: params.utm_term,
    macros: macrosFound,
    platformParams: params
  }
}

export function validateTrackingUrl(urlStr: string, expectedChannel?: string): LinkValidationResult {
  const errors: string[] = []
  const params: Record<string, string> = {}
  const macrosFound: string[] = []
  let domain = ''
  let path = ''

  try {
    const parsed = new URL(urlStr)
    domain = `${parsed.protocol}//${parsed.hostname}`
    path = parsed.pathname
    if (domain !== CANONICAL_BASE_DOMAIN) {
      errors.push(`Domínio inválido: ${domain}. O gerador aceita exclusivamente ${CANONICAL_BASE_DOMAIN}`)
    }
    parsed.searchParams.forEach((v, k) => {
      params[k] = v
      if (isMacro(v)) macrosFound.push(v)
    })
  } catch (err: any) {
    errors.push(`Erro ao parsear URL: ${err?.message || 'URL malformada'}`)
  }

  const detectedChannel = classifyClientChannel({
    utm_source: params.utm_source,
    utm_medium: params.utm_medium,
    utm_campaign: params.utm_campaign,
    utm_content: params.utm_content,
    utm_term: params.utm_term
  })

  let simulatedChannel: string | undefined
  let resolvedSource: string | undefined
  if (params.utm_source === '{{site_source_name}}') {
    resolvedSource = expectedChannel?.includes('instagram') ? 'ig' : 'fb'
    simulatedChannel = classifyClientChannel({
      utm_source: resolvedSource,
      utm_medium: params.utm_medium,
      utm_campaign: params.utm_campaign,
      utm_content: params.utm_content,
      utm_term: params.utm_term
    })
  }

  const isMatched = expectedChannel
    ? detectedChannel === expectedChannel || (simulatedChannel !== undefined && simulatedChannel === expectedChannel)
    : true

  return {
    isValid: errors.length === 0,
    errors,
    url: urlStr,
    domain,
    path,
    detectedChannel,
    expectedChannel: expectedChannel || detectedChannel,
    isChannelMatched: isMatched,
    params,
    macrosFound,
    runtimeSimulations: simulatedChannel ? { resolvedSource, simulatedChannel } : undefined
  }
}
