/**
 * Utilitários de Validação de Acesso a Mídias Administrativas
 * Arquivo: server/shared/adminMediaAuthCore.mjs
 *
 * PATCH 5.0C.2: Modularização arquitetural para limite LOC <= 200.
 */

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
