/**
 * ======================================================================
 * ADMIN AUTH & AUTHORIZATION CORE — AD Telas e Redes
 * ======================================================================
 * Módulo puro, determinístico e isomórfico para autenticação e
 * autorização de administradores no painel analítico.
 *
 * REGRAS DE SEGURANÇA:
 * 1. ADMIN_IDENTITY_AUTHORITY = AUTH_USER_ID (autorização vinculada a auth.users.id).
 * 2. ADMIN_EMAIL_AUTHORIZATION_DEPENDENCY = NONE (e-mail é apenas snapshot de exibição).
 * 3. ADMIN_ROLE_CHECK = ENFORCED (somente 'admin' e 'superadmin' possuem acesso pleno; 'operator' bloqueado).
 * 4. ADMIN_CSRF_PROTECTION = YES (mutations exigem same-origin).
 * ======================================================================
 */

/**
 * Cookie names padronizados para a sessão administrativa.
 */
export const ADMIN_AUTH_COOKIE_NAME = 'sb_admin_token'
export const ADMIN_REFRESH_COOKIE_NAME = 'sb_admin_refresh_token'

/**
 * Roles autorizados para acesso administrativo completo em V1.
 */
export const ALLOWED_ADMIN_ROLES = ['admin', 'superadmin']

/**
 * Extrai o token de autenticação JWT a partir do header Authorization (Bearer)
 * ou do cookie HTTP-only da sessão administrativa.
 *
 * @param {string|null|undefined} authHeader Header 'Authorization'
 * @param {string|null|undefined} cookieHeader Header 'Cookie' ou valor direto do cookie
 * @returns {string|null} Token JWT ou null se ausente
 */
export function extractAuthToken(authHeader, cookieHeader) {
  // 1. Tenta extrair do Header Authorization (Bearer <token>)
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(' ')
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer' && parts[1].length > 10) {
      return parts[1].trim()
    }
  }

  // 2. Tenta extrair dos Cookies (sb_admin_token=<token>)
  if (cookieHeader && typeof cookieHeader === 'string') {
    if (!cookieHeader.includes('=') && cookieHeader.length > 20) {
      return cookieHeader.trim()
    }

    const cookies = cookieHeader.split(';')
    for (const cookie of cookies) {
      const [rawName, ...rest] = cookie.trim().split('=')
      if (rawName === ADMIN_AUTH_COOKIE_NAME) {
        const val = rest.join('=').trim()
        if (val) return decodeURIComponent(val)
      }
    }
  }

  return null
}

/**
 * Extrai o refresh token a partir do cookie HTTP-only da sessão administrativa.
 *
 * @param {string|null|undefined} cookieHeader Header 'Cookie' ou valor direto
 * @returns {string|null} Refresh token ou null se ausente
 */
export function extractRefreshToken(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null

  if (!cookieHeader.includes('=') && cookieHeader.length > 20) {
    return cookieHeader.trim()
  }

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=')
    if (rawName === ADMIN_REFRESH_COOKIE_NAME) {
      const val = rest.join('=').trim()
      if (val) return decodeURIComponent(val)
    }
  }
  return null
}

/**
 * Verifica e autoriza se o usuário autenticado é um administrador ativo com papel permitido.
 * AUTORIDADE DE IDENTIDADE: auth.users.id ↔ admin_users.user_id.
 *
 * @param {object} supabaseUser Objeto do usuário retornado por auth.getUser()
 * @param {Array<object>} adminRecords Registros da tabela public.admin_users
 * @param {Array<string>} [allowedRoles] Roles permitidos (padrão: ['admin', 'superadmin'])
 * @returns {{ authorized: boolean, reason?: string, admin?: object }}
 */
export function verifyActiveAdmin(supabaseUser, adminRecords, allowedRoles = ALLOWED_ADMIN_ROLES) {
  if (!supabaseUser || !supabaseUser.id) {
    return { authorized: false, reason: 'UNAUTHENTICATED' }
  }

  if (!Array.isArray(adminRecords) || adminRecords.length === 0) {
    return { authorized: false, reason: 'NON_ADMIN' }
  }

  // Identidade autoritativa estritamente por user_id (nunca por e-mail)
  const matchingAdmin = adminRecords.find((a) => a.user_id === supabaseUser.id)

  if (!matchingAdmin) {
    return { authorized: false, reason: 'NON_ADMIN' }
  }

  if (matchingAdmin.is_active !== true) {
    return { authorized: false, reason: 'INACTIVE_ADMIN' }
  }

  // Verificação de Role (RBAC): OPERATOR_FULL_ADMIN_ACCESS = NO
  const role = (matchingAdmin.role || 'admin').toLowerCase()
  if (!allowedRoles.includes(role)) {
    return { authorized: false, reason: 'UNAUTHORIZED_ROLE' }
  }

  return {
    authorized: true,
    admin: {
      adminId: matchingAdmin.id,
      userId: supabaseUser.id,
      email: matchingAdmin.email || supabaseUser.email || '',
      role,
      isActive: true
    }
  }
}

/**
 * Validação de CSRF / Same-Origin para operações mutáveis (POST, PATCH, PUT, DELETE).
 *
 * @param {string|null|undefined} originHeader Header 'Origin'
 * @param {string|null|undefined} refererHeader Header 'Referer'
 * @param {string|null|undefined} hostHeader Header 'Host'
 * @param {boolean} [isDev=false] Flag indicando ambiente de desenvolvimento
 * @returns {{ allowed: boolean, statusCode: number, message: string }}
 */
export function validateMutationOrigin(originHeader, refererHeader, hostHeader, isDev = false) {
  if (!hostHeader) {
    return { allowed: true, statusCode: 200, message: 'OK' }
  }

  const cleanHost = hostHeader.split(':')[0].toLowerCase()

  // 1. Se houver header Origin, valida same-origin
  if (originHeader) {
    try {
      const url = new URL(originHeader)
      const originHost = url.hostname.toLowerCase()
      if (originHost === cleanHost) {
        return { allowed: true, statusCode: 200, message: 'OK' }
      }
      if (isDev && (originHost === 'localhost' || originHost === '127.0.0.1')) {
        return { allowed: true, statusCode: 200, message: 'OK' }
      }
      return {
        allowed: false,
        statusCode: 403,
        message: 'Acesso negado: solicitação cross-site não autorizada (Origin mismatch).'
      }
    } catch {
      return {
        allowed: false,
        statusCode: 403,
        message: 'Acesso negado: Origin inválido.'
      }
    }
  }

  // 2. Se não houver Origin mas houver Referer, valida referer
  if (refererHeader) {
    try {
      const url = new URL(refererHeader)
      const refererHost = url.hostname.toLowerCase()
      if (refererHost === cleanHost) {
        return { allowed: true, statusCode: 200, message: 'OK' }
      }
      if (isDev && (refererHost === 'localhost' || refererHost === '127.0.0.1')) {
        return { allowed: true, statusCode: 200, message: 'OK' }
      }
      return {
        allowed: false,
        statusCode: 403,
        message: 'Acesso negado: solicitação cross-site não autorizada (Referer mismatch).'
      }
    } catch {
      return {
        allowed: false,
        statusCode: 403,
        message: 'Acesso negado: Referer inválido.'
      }
    }
  }

  // Sem Origin/Referer (ex: requests locais diretos/ferramentas de teste)
  return { allowed: true, statusCode: 200, message: 'OK' }
}

/**
 * Validação de integridade e IDOR para acesso a arquivos de mídia.
 * Garante que a mídia existe, está com upload concluído e vinculada ao lead correto.
 *
 * @param {object|null} mediaRecord Registro de public.lead_media
 * @param {string|null} [expectedLeadId] ID do lead opcionalmente verificado
 * @returns {{ allowed: boolean, statusCode: number, message: string }}
 */
export function validateMediaAccess(mediaRecord, expectedLeadId = null) {
  if (!mediaRecord) {
    return { allowed: false, statusCode: 404, message: 'Mídia não encontrada' }
  }

  if (mediaRecord.upload_status !== 'uploaded') {
    return {
      allowed: false,
      statusCode: 400,
      message: `Mídia indisponível para visualização (status: ${mediaRecord.upload_status})`
    }
  }

  if (expectedLeadId && mediaRecord.lead_id !== expectedLeadId) {
    return {
      allowed: false,
      statusCode: 403,
      message: 'Acesso negado: a mídia não pertence ao lead especificado'
    }
  }

  if (!mediaRecord.storage_key || typeof mediaRecord.storage_key !== 'string') {
    return {
      allowed: false,
      statusCode: 500,
      message: 'Chave de armazenamento inválida'
    }
  }

  return { allowed: true, statusCode: 200, message: 'OK' }
}

/**
 * Sanitiza metadados de mídia para retorno seguro ao frontend administrativo.
 * Remove credenciais, tokens e storage_keys brutas se desnecessárias.
 *
 * @param {object} media Registro bruto de lead_media
 * @returns {object} Metadados públicos administrativos seguros
 */
export function sanitizeMediaMetadata(media) {
  if (!media) return null
  return {
    id: media.id,
    lead_id: media.lead_id,
    client_media_id: media.client_media_id,
    safe_filename: media.safe_filename,
    media_type: media.media_type,
    mime_type: media.mime_type,
    file_size_bytes: media.file_size_bytes,
    upload_status: media.upload_status,
    verified_at: media.verified_at,
    created_at: media.created_at
  }
}
