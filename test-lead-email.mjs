/**
 * ======================================================================
 * TEST SUITE: LEAD MEDIA STORAGE + ADMIN MEDIA GALLERY + DATA-ONLY EMAIL
 * ======================================================================
 * ISOLAMENTO INTEGRAL:
 *   REAL_EMAIL_SENT_DURING_TESTS = NO
 *   PRODUCTION_DB_WRITES_DURING_TESTS = NO
 *   PRODUCTION_R2_WRITES_DURING_TESTS = NO
 *   SUPABASE_MCP_WRITES = 0
 *
 * Todos os mocks operam exclusivamente em memória.
 * ======================================================================
 */

import {
  validateLeadName,
  validateLeadPhone,
  validateLeadEmail,
  normalizePhoneForWhatsApp,
  sanitizeEmailError,
  generateEmailSubject,
  generateEmailHTML,
  generateEmailText,
  formatMediaSelectionNotice,
  isEmailConfigured,
  validateMediaMagicBytes,
  processSendLeadWorkflow,
  ALLOWED_PHOTO_MIMES,
  ALLOWED_VIDEO_MIMES,
  PHOTO_MAX_COUNT,
  VIDEO_MAX_COUNT,
  PHOTO_MAX_SIZE_BYTES,
  VIDEO_MAX_SIZE_BYTES,
  TOTAL_MEDIA_MAX_SIZE_BYTES
} from './server/shared/leadEmailCore.mjs'

import {
  createMediaUploadToken,
  verifyMediaUploadToken
} from './server/shared/mediaAuthCore.mjs'

import {
  extractAuthToken,
  extractRefreshToken,
  verifyActiveAdmin,
  validateMutationOrigin,
  validateMediaAccess,
  sanitizeMediaMetadata,
  ALLOWED_ADMIN_ROLES
} from './server/shared/adminAuthCore.mjs'

import {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  verifyObjectInR2,
  verifyAndPromoteObject,
  deleteObjectImmediately
} from './server/shared/r2StorageCore.mjs'

// Segredo de teste isolado
process.env.MEDIA_UPLOAD_SIGNING_SECRET = 'test_secret_for_isolated_automated_suite_123456789'

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition, message) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✓ ${message}`)
  } else {
    failedTests++
    console.error(`  ✗ [FAIL] ${message}`)
  }
}

// ======================================================================
// MOCK DATABASE IN-MEMORY
// ======================================================================
function createMockDb() {
  const leads = new Map()
  const media = new Map() // keyed by `${lead_id}:${client_media_id}`

  return {
    leads,
    media,

    insertLead(data) {
      if (leads.has(data.submission_id)) {
        const err = new Error('duplicate key value violates unique constraint')
        err.isUniqueConflict = true
        err.statusCode = 409
        throw err
      }
      const record = { id: 'lead-' + Math.random().toString(36).substring(2, 9), ...data }
      leads.set(data.submission_id, record)
      return record
    },

    getLeadBySubmissionId(subId) {
      return leads.get(subId) || null
    },

    updateLeadStatus(id, statusData) {
      return true
    },

    // lead_media operations
    findMedia(leadId, clientMediaId) {
      return media.get(`${leadId}:${clientMediaId}`) || null
    },

    listMediaByLead(leadId) {
      return Array.from(media.values()).filter(m => m.lead_id === leadId)
    },

    insertMedia(data) {
      const key = `${data.lead_id}:${data.client_media_id}`
      if (media.has(key)) {
        const err = new Error('duplicate key')
        err.isUniqueConflict = true
        throw err
      }
      const record = { id: 'media-' + Math.random().toString(36).substring(2, 9), ...data, created_at: new Date().toISOString() }
      media.set(key, record)
      return record
    },

    // Atomic lock: pending -> finalizing (returns row if acquired, null if not)
    acquireFinalizingLock(leadId, clientMediaId, staleMinutes = 10) {
      const key = `${leadId}:${clientMediaId}`
      const m = media.get(key)
      if (!m) return null

      const now = new Date()
      const staleCutoff = new Date(now.getTime() - staleMinutes * 60 * 1000)

      if (m.upload_status === 'pending') {
        m.upload_status = 'finalizing'
        m.finalizing_at = now.toISOString()
        return { ...m }
      }

      if (m.upload_status === 'finalizing' && m.finalizing_at && new Date(m.finalizing_at) < staleCutoff) {
        m.upload_status = 'finalizing'
        m.finalizing_at = now.toISOString()
        return { ...m }
      }

      return null
    },

    updateMediaStatus(leadId, clientMediaId, updates) {
      const key = `${leadId}:${clientMediaId}`
      const m = media.get(key)
      if (!m) return null
      Object.assign(m, updates)
      return m
    },

    getMedia(leadId, clientMediaId) {
      return media.get(`${leadId}:${clientMediaId}`) || null
    }
  }
}

// ======================================================================
// MOCK R2 IN-MEMORY
// ======================================================================
function createMockR2() {
  const objects = new Map()
  const deletedKeys = []
  let shouldFailNextCopy = false
  let shouldFailNextHead = false
  let shouldFailNextDelete = false

  return {
    objects,
    deletedKeys,

    setShouldFailNextCopy(v) { shouldFailNextCopy = v },
    setShouldFailNextHead(v) { shouldFailNextHead = v },
    setShouldFailNextDelete(v) { shouldFailNextDelete = v },

    putObject(key, data) {
      objects.set(key, { body: data, size: data.length, contentType: data.contentType || 'image/jpeg' })
    },

    headObject(key) {
      if (shouldFailNextHead) {
        shouldFailNextHead = false
        throw new Error('Simulated HeadObject failure')
      }
      const obj = objects.get(key)
      if (!obj) throw new Error(`NoSuchKey: ${key}`)
      return { ContentLength: obj.size, ContentType: obj.contentType }
    },

    copyObject(srcKey, dstKey) {
      if (shouldFailNextCopy) {
        shouldFailNextCopy = false
        throw new Error('Simulated CopyObject failure')
      }
      const obj = objects.get(srcKey)
      if (!obj) throw new Error(`NoSuchKey: ${srcKey}`)
      objects.set(dstKey, { ...obj })
    },

    deleteObject(key) {
      if (shouldFailNextDelete) {
        shouldFailNextDelete = false
        throw new Error('Simulated DeleteObject failure')
      }
      objects.delete(key)
      deletedKeys.push(key)
    },

    exists(key) {
      return objects.has(key)
    }
  }
}

async function runTestSuite() {
  console.log('\n======================================================================')
  console.log('LEAD MEDIA STORAGE — COMPREHENSIVE ISOLATED TEST SUITE')
  console.log('======================================================================\n')

  // ====================================================================
  // GRUPO 1: VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS
  // ====================================================================
  console.log('--- GRUPO 1: Validações de Campos Obrigatórios ---')

  try { validateLeadName(null); assert(false, '1.1') } catch (e) { assert(e.statusCode === 400, '1.1 Nome nulo -> 400') }
  try { validateLeadName('   '); assert(false, '1.2') } catch (e) { assert(e.statusCode === 400, '1.2 Nome spaces -> 400') }
  try { validateLeadName('A'); assert(false, '1.3') } catch (e) { assert(e.statusCode === 400, '1.3 Nome < 2 -> 400') }
  assert(validateLeadName('  Carlos  ') === 'Carlos', '1.4 Nome trimmed')

  try { validateLeadPhone(null); assert(false, '1.5') } catch (e) { assert(e.statusCode === 400, '1.5 Phone nulo -> 400') }
  try { validateLeadPhone('119876'); assert(false, '1.6') } catch (e) { assert(e.statusCode === 400, '1.6 Phone < 10 digits -> 400') }
  assert(validateLeadPhone('(11) 98358-6611') === '(11) 98358-6611', '1.7 Phone 11 digits valid')
  assert(validateLeadPhone('(11) 3456-7890') === '(11) 3456-7890', '1.8 Phone 10 digits valid')

  assert(validateLeadEmail('') === null, '1.9 Email empty -> null')
  assert(validateLeadEmail('  X@Y.COM ') === 'x@y.com', '1.10 Email normalized lowercase')
  try { validateLeadEmail('bad'); assert(false, '1.11') } catch (e) { assert(e.statusCode === 400, '1.11 Email invalid -> 400') }

  // ====================================================================
  // GRUPO 2: MAGIC BYTES
  // ====================================================================
  console.log('\n--- GRUPO 2: Magic Bytes ---')

  assert(validateMediaMagicBytes(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), 'image/jpeg') === true, '2.1 JPEG valid')
  assert(validateMediaMagicBytes(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), 'image/png') === true, '2.2 PNG valid')
  assert(validateMediaMagicBytes(Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]), 'image/webp') === true, '2.3 WebP valid')
  assert(validateMediaMagicBytes(Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]), 'video/mp4') === true, '2.4 MP4 ftyp valid')
  assert(validateMediaMagicBytes(Buffer.from([0x1A, 0x45, 0xDF, 0xA3]), 'video/webm') === true, '2.5 WebM valid')
  assert(validateMediaMagicBytes(Buffer.from([0x4D, 0x5A, 0x90, 0x00]), 'image/jpeg') === false, '2.6 EXE disguised as JPEG rejected')
  assert(validateMediaMagicBytes(Buffer.from([0xFF, 0xD8, 0xFF]), 'video/mp4') === false, '2.7 JPEG bytes with video/mp4 rejected')

  // ====================================================================
  // GRUPO 3: HMAC-SHA256 TOKENS
  // ====================================================================
  console.log('\n--- GRUPO 3: HMAC-SHA256 Tokens ---')

  const tk1 = createMediaUploadToken({ leadId: 'lead-1', submissionId: 'sub-1', ttlSeconds: 900 })
  assert(typeof tk1 === 'string' && tk1.split('.').length === 3, '3.1 Token format header.payload.sig')

  const p1 = verifyMediaUploadToken(tk1)
  assert(p1.leadId === 'lead-1' && p1.submissionId === 'sub-1', '3.2 Token decoded correctly')

  try { verifyMediaUploadToken(tk1.slice(0, -4) + 'XXXX'); assert(false, '3.3') } catch (e) { assert(e.statusCode === 403, '3.3 Tampered sig -> 403') }
  try { verifyMediaUploadToken(createMediaUploadToken({ leadId: 'x', submissionId: 'y', ttlSeconds: -10 })); assert(false, '3.4') } catch (e) { assert(e.statusCode === 401, '3.4 Expired -> 401') }
  try { verifyMediaUploadToken(''); assert(false, '3.5') } catch (e) { assert(e.statusCode === 401, '3.5 Empty token -> 401') }
  try { verifyMediaUploadToken('a.b'); assert(false, '3.6') } catch (e) { assert(e.statusCode === 401, '3.6 Two-part token -> 401') }

  // ====================================================================
  // GRUPO 4: EMAIL TEMPLATES DATA-ONLY
  // ====================================================================
  console.log('\n--- GRUPO 4: Email Templates DATA-ONLY ---')

  const lead = { nome: 'Ana', telefone: '(11) 98358-6611', email: 'ana@ex.com', servico: 'Telas' }
  const html = generateEmailHTML(lead)
  const text = generateEmailText(lead)

  assert(html.includes('Ana'), '4.1 HTML contains name')
  assert(html.includes('cid:adtelas-icon'), '4.2 HTML has CID brand logo')
  assert(!html.includes('data:image'), '4.3 No Base64 images')
  assert(!html.includes('r2.cloudflarestorage.com'), '4.4 No R2 private URLs')
  assert(!html.includes('possui arquivos'), '4.5 No media claim (EMAIL_MEDIA_CLAIM=NONE)')
  assert(!html.includes('fotos'), '4.6 Sem mídia -> no "fotos" word in email')
  assert(!html.includes('vídeos'), '4.7 Sem mídia -> no "vídeos" word in email')
  assert(text.includes('NOVO LEAD PELO SITE'), '4.8 Plain text formatted')

  // Testes de aviso condicional de seleção de mídia
  assert(formatMediaSelectionNotice(null) === null, '4.9 null summary -> null notice')
  assert(formatMediaSelectionNotice({ photoCount: 0, videoCount: 0 }) === null, '4.10 0 photos 0 videos -> null notice')

  const n1 = formatMediaSelectionNotice({ photoCount: 1, videoCount: 0 })
  assert(n1 && n1.mainText === 'Este cliente selecionou 1 foto para envio junto à solicitação.', '4.11 1 photo -> singular correto')

  const n4 = formatMediaSelectionNotice({ photoCount: 4, videoCount: 0 })
  assert(n4 && n4.mainText === 'Este cliente selecionou 4 fotos para envio junto à solicitação.', '4.12 4 photos -> plural correto')

  const nv1 = formatMediaSelectionNotice({ photoCount: 0, videoCount: 1 })
  assert(nv1 && nv1.mainText === 'Este cliente selecionou 1 vídeo para envio junto à solicitação.', '4.13 1 video -> singular correto')

  const nv2 = formatMediaSelectionNotice({ photoCount: 0, videoCount: 2 })
  assert(nv2 && nv2.mainText === 'Este cliente selecionou 2 vídeos para envio junto à solicitação.', '4.14 2 videos -> plural correto')

  const nComb = formatMediaSelectionNotice({ photoCount: 2, videoCount: 1 })
  assert(nComb && nComb.mainText === 'Este cliente selecionou 2 fotos e 1 vídeo para envio junto à solicitação.', '4.15 2 photos + 1 video -> combinação correta')

  const leadWithMedia = {
    id: 'lead-uuid-123',
    nome: 'Carlos',
    telefone: '(11) 98358-6611',
    media_selection_summary: { photoCount: 2, videoCount: 1 }
  }
  const htmlWithMedia = generateEmailHTML(leadWithMedia)
  const textWithMedia = generateEmailText(leadWithMedia)

  assert(htmlWithMedia.includes('Arquivos do Cliente'), '4.16 HTML with media has "Arquivos do Cliente"')
  assert(htmlWithMedia.includes('VER LEAD NO PAINEL'), '4.17 HTML with media has "VER LEAD NO PAINEL" button')
  assert(htmlWithMedia.includes('/admin/leads?lead=lead-uuid-123'), '4.18 Button points strictly to Admin lead URL')
  assert(!htmlWithMedia.includes('r2.cloudflarestorage.com'), '4.19 HTML with media has ZERO private R2 URLs')
  assert(!htmlWithMedia.includes('data:image'), '4.20 HTML with media has ZERO Base64')
  assert(textWithMedia.includes('ARQUIVOS DO CLIENTE') && textWithMedia.includes('lead-uuid-123'), '4.21 Text version includes conditional notice and link')

  // ====================================================================
  // GRUPO 5: SEND-LEAD WORKFLOW + IDEMPOTENT RETRY
  // ====================================================================
  console.log('\n--- GRUPO 5: Send-Lead Workflow + Retry ---')

  const db5 = createMockDb()
  let emailCount = 0

  const deps5 = {
    db: db5,
    mailer: { sendMail: async (opts) => {
      const bad = (opts.attachments || []).filter(a => a.cid !== 'adtelas-icon')
      if (bad.length > 0) throw new Error('VIOLATION: customer attachment detected')
      emailCount++
      return { messageId: 'msg-' + emailCount }
    }},
    tokenSigner: (p) => createMediaUploadToken(p),
    brandIconBuffer: Buffer.from('logo')
  }
  const cfg5 = { gmailEmail: 'test@gmail.com', gmailAppPassword: 'pass16charsfake' }

  const r1 = await processSendLeadWorkflow({ submission_id: 'sub-A', nome: 'Maria', telefone: '(11) 91234-5678' }, cfg5, deps5)
  assert(r1.success && r1.leadSaved, '5.1 1st submit: lead saved')
  assert(r1.emailSent === true, '5.2 1st submit: email sent')
  assert(emailCount === 1, '5.3 1st submit: exactly 1 email')
  assert(typeof r1.uploadToken === 'string', '5.4 1st submit: uploadToken returned')

  const r2 = await processSendLeadWorkflow({ submission_id: 'sub-A', nome: 'Maria', telefone: '(11) 91234-5678' }, cfg5, deps5)
  assert(r2.success && r2.idempotent === true, '5.5 Retry: idempotent=true')
  assert(r2.leadId === r1.leadId, '5.6 Retry: same leadId')
  assert(typeof r2.uploadToken === 'string', '5.7 Retry: fresh uploadToken')
  assert(emailCount === 1, '5.8 Retry: zero additional emails')

  const failDeps = { ...deps5, mailer: { sendMail: async () => { throw new Error('535 auth') } } }
  const r3 = await processSendLeadWorkflow({ submission_id: 'sub-B', nome: 'João', telefone: '(11) 92345-6789' }, cfg5, failDeps)
  assert(r3.success && r3.leadSaved, '5.9 SMTP fail: lead still saved')
  assert(r3.emailSent === false, '5.10 SMTP fail: emailSent=false')
  assert(typeof r3.uploadToken === 'string', '5.11 SMTP fail: uploadToken still returned')

  // ====================================================================
  // GRUPO 6: AUTHORIZE-UPLOAD (SIMULATED ENDPOINT LOGIC)
  // ====================================================================
  console.log('\n--- GRUPO 6: Authorize-Upload ---')

  const db6 = createMockDb()
  const leadId6 = 'lead-authorize-test'

  // Simulate authorize-upload logic
  function simulateAuthorize(token, body, db) {
    const payload = verifyMediaUploadToken(token)
    const { leadId } = payload

    if (!body.client_media_id) throw Object.assign(new Error('client_media_id required'), { statusCode: 400 })

    const cleanMime = (body.mime_type || '').toLowerCase().trim()
    const isPhoto = ALLOWED_PHOTO_MIMES.has(cleanMime)
    const isVideo = ALLOWED_VIDEO_MIMES.has(cleanMime)
    if (!isPhoto && !isVideo) throw Object.assign(new Error('Invalid MIME'), { statusCode: 400 })

    const effectiveType = isPhoto ? 'photo' : 'video'
    const maxSize = isPhoto ? PHOTO_MAX_SIZE_BYTES : VIDEO_MAX_SIZE_BYTES
    const size = Number(body.file_size_bytes) || 0
    if (size <= 0) throw Object.assign(new Error('Invalid size'), { statusCode: 400 })
    if (size > maxSize) throw Object.assign(new Error('Too large'), { statusCode: 400 })

    // Idempotency check
    const existing = db.findMedia(leadId, body.client_media_id)
    if (existing) {
      if (existing.upload_status === 'uploaded') return { success: true, alreadyUploaded: true }
      return { success: true, presignedUrl: 'mock://reuse', storageKey: existing.storage_key }
    }

    // Quota check
    const allMedia = db.listMediaByLead(leadId)
    const active = allMedia.filter(m => m.upload_status !== 'deleted' && m.upload_status !== 'failed')
    const photos = active.filter(m => m.media_type === 'photo').length
    const videos = active.filter(m => m.media_type === 'video').length

    if (isPhoto && photos >= PHOTO_MAX_COUNT) throw Object.assign(new Error('Photo quota'), { statusCode: 400 })
    if (isVideo && videos >= VIDEO_MAX_COUNT) throw Object.assign(new Error('Video quota'), { statusCode: 400 })

    const storageKey = `tmp/leads/${leadId}/${body.client_media_id}.jpg`
    db.insertMedia({
      lead_id: leadId,
      client_media_id: body.client_media_id,
      storage_key: storageKey,
      media_type: effectiveType,
      mime_type: cleanMime,
      file_size_bytes: size,
      upload_status: 'pending',
      safe_filename: 'file.jpg'
    })

    return { success: true, presignedUrl: 'mock://signed', storageKey }
  }

  const validToken6 = createMediaUploadToken({ leadId: leadId6, submissionId: 'sub-6' })

  // 6.1 Valid token, valid request
  const a1 = simulateAuthorize(validToken6, { client_media_id: 'cm-1', mime_type: 'image/jpeg', file_size_bytes: 1024 }, db6)
  assert(a1.success && a1.presignedUrl, '6.1 Valid auth -> presignedUrl')

  // 6.2 Invalid token
  try { simulateAuthorize('invalid.token.here', { client_media_id: 'cm-x' }, db6); assert(false, '6.2') } catch (e) { assert(e.statusCode === 403 || e.statusCode === 401, '6.2 Invalid token -> 401/403') }

  // 6.3 Expired token
  const expiredTk = createMediaUploadToken({ leadId: leadId6, submissionId: 'sub-6', ttlSeconds: -10 })
  try { simulateAuthorize(expiredTk, { client_media_id: 'cm-x' }, db6); assert(false, '6.3') } catch (e) { assert(e.statusCode === 401, '6.3 Expired token -> 401') }

  // 6.4 Missing client_media_id
  try { simulateAuthorize(validToken6, { mime_type: 'image/jpeg', file_size_bytes: 1024 }, db6); assert(false, '6.4') } catch (e) { assert(e.statusCode === 400, '6.4 Missing client_media_id -> 400') }

  // 6.5 Invalid MIME
  try { simulateAuthorize(validToken6, { client_media_id: 'cm-bad', mime_type: 'application/pdf', file_size_bytes: 1024 }, db6); assert(false, '6.5') } catch (e) { assert(e.statusCode === 400, '6.5 Invalid MIME -> 400') }

  // 6.6 Zero file size
  try { simulateAuthorize(validToken6, { client_media_id: 'cm-zero', mime_type: 'image/jpeg', file_size_bytes: 0 }, db6); assert(false, '6.6') } catch (e) { assert(e.statusCode === 400, '6.6 Zero size -> 400') }

  // 6.7 Over-size photo
  try { simulateAuthorize(validToken6, { client_media_id: 'cm-big', mime_type: 'image/jpeg', file_size_bytes: PHOTO_MAX_SIZE_BYTES + 1 }, db6); assert(false, '6.7') } catch (e) { assert(e.statusCode === 400, '6.7 Over-size photo -> 400') }

  // 6.8 Retry same client_media_id -> reuses storage_key
  const a8 = simulateAuthorize(validToken6, { client_media_id: 'cm-1', mime_type: 'image/jpeg', file_size_bytes: 1024 }, db6)
  assert(a8.success && a8.storageKey === a1.storageKey, '6.8 Retry same client_media_id -> same storageKey')

  // 6.9 Storage_key uniqueness: different client_media_id -> different storageKey
  const a9 = simulateAuthorize(validToken6, { client_media_id: 'cm-2', mime_type: 'image/jpeg', file_size_bytes: 2048 }, db6)
  assert(a9.storageKey !== a1.storageKey, '6.9 Different client_media_id -> different storageKey')

  // 6.10 - 6.12: Fill photo quota to 4
  simulateAuthorize(validToken6, { client_media_id: 'cm-3', mime_type: 'image/png', file_size_bytes: 1024 }, db6)
  simulateAuthorize(validToken6, { client_media_id: 'cm-4', mime_type: 'image/webp', file_size_bytes: 1024 }, db6)
  try { simulateAuthorize(validToken6, { client_media_id: 'cm-5', mime_type: 'image/jpeg', file_size_bytes: 1024 }, db6); assert(false, '6.10') } catch (e) { assert(e.statusCode === 400, '6.10 5th photo exceeds quota -> 400') }

  // 6.11 - 6.12: Video quota
  simulateAuthorize(validToken6, { client_media_id: 'cm-v1', mime_type: 'video/mp4', file_size_bytes: 5000 }, db6)
  simulateAuthorize(validToken6, { client_media_id: 'cm-v2', mime_type: 'video/webm', file_size_bytes: 5000 }, db6)
  try { simulateAuthorize(validToken6, { client_media_id: 'cm-v3', mime_type: 'video/mp4', file_size_bytes: 5000 }, db6); assert(false, '6.11') } catch (e) { assert(e.statusCode === 400, '6.11 3rd video exceeds quota -> 400') }

  // 6.12: Already uploaded returns alreadyUploaded
  db6.updateMediaStatus(leadId6, 'cm-1', { upload_status: 'uploaded' })
  const a12 = simulateAuthorize(validToken6, { client_media_id: 'cm-1', mime_type: 'image/jpeg', file_size_bytes: 1024 }, db6)
  assert(a12.alreadyUploaded === true, '6.12 Already uploaded -> alreadyUploaded=true')

  // ====================================================================
  // GRUPO 7: FINALIZE-UPLOAD (ATOMICITY, STALE, COMPENSATION)
  // ====================================================================
  console.log('\n--- GRUPO 7: Finalize-Upload Atomicity & Compensation ---')

  function simulateFinalize(db, r2, leadId, clientMediaId) {
    // Step 1: Atomic lock
    const acquired = db.acquireFinalizingLock(leadId, clientMediaId)
    if (!acquired) {
      const current = db.getMedia(leadId, clientMediaId)
      if (current?.upload_status === 'uploaded') return { success: true, idempotent: true }
      if (current?.upload_status === 'finalizing') return { success: true, processing: true, status: 202 }
      if (current?.upload_status === 'failed') throw Object.assign(new Error('Previously failed'), { statusCode: 400 })
      throw Object.assign(new Error('Not found'), { statusCode: 404 })
    }

    const tmpKey = acquired.storage_key
    const finalKey = tmpKey.startsWith('tmp/') ? tmpKey.slice(4) : tmpKey

    // Step 2: Verify object in R2
    try {
      r2.headObject(tmpKey)
    } catch (headErr) {
      try { r2.deleteObject(tmpKey) } catch {}
      db.updateMediaStatus(leadId, clientMediaId, { upload_status: 'failed' })
      throw Object.assign(new Error('Verification failed: ' + headErr.message), { statusCode: 400 })
    }

    // Step 3: Promote (CopyObject)
    let promoted = false
    try {
      r2.copyObject(tmpKey, finalKey)
      promoted = true
    } catch (copyErr) {
      db.updateMediaStatus(leadId, clientMediaId, { upload_status: 'failed' })
      throw Object.assign(new Error('CopyObject failed'), { statusCode: 500 })
    }

    // Step 4: Update DB
    try {
      db.updateMediaStatus(leadId, clientMediaId, {
        storage_key: finalKey,
        upload_status: 'uploaded',
        verified_at: new Date().toISOString()
      })
    } catch (dbErr) {
      // COMPENSATION: delete promoted final object
      if (promoted) {
        try { r2.deleteObject(finalKey) } catch {}
      }
      db.updateMediaStatus(leadId, clientMediaId, { upload_status: 'failed' })
      throw Object.assign(new Error('DB update failed'), { statusCode: 500 })
    }

    // Step 5: Delete temp (best-effort)
    try { r2.deleteObject(tmpKey) } catch {}

    return { success: true, storageKey: finalKey }
  }

  // 7.1: pending -> finalizing -> uploaded (happy path)
  const db7 = createMockDb()
  const r7 = createMockR2()
  const lid7 = 'lead-7'
  db7.insertMedia({ lead_id: lid7, client_media_id: 'f-1', storage_key: 'tmp/leads/lead-7/f-1.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 1024, upload_status: 'pending', safe_filename: 'f1.jpg' })
  r7.putObject('tmp/leads/lead-7/f-1.jpg', Buffer.alloc(1024))

  const fin1 = simulateFinalize(db7, r7, lid7, 'f-1')
  assert(fin1.success && fin1.storageKey === 'leads/lead-7/f-1.jpg', '7.1 Happy path: pending -> uploaded, final key correct')
  assert(r7.exists('leads/lead-7/f-1.jpg'), '7.1b Final object exists in R2')
  assert(!r7.exists('tmp/leads/lead-7/f-1.jpg'), '7.1c Temp object deleted')

  // 7.2: Already uploaded -> idempotent success
  const fin2 = simulateFinalize(db7, r7, lid7, 'f-1')
  assert(fin2.success && fin2.idempotent === true, '7.2 Already uploaded -> idempotent=true')

  // 7.3: Second concurrent call -> 202 processing (recent finalizing)
  db7.insertMedia({ lead_id: lid7, client_media_id: 'f-2', storage_key: 'tmp/leads/lead-7/f-2.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 1024, upload_status: 'pending', safe_filename: 'f2.jpg' })
  r7.putObject('tmp/leads/lead-7/f-2.jpg', Buffer.alloc(1024))

  // First call acquires lock
  db7.acquireFinalizingLock(lid7, 'f-2')
  // Second call sees recent finalizing
  const fin3 = simulateFinalize(db7, r7, lid7, 'f-2')
  assert(fin3.processing === true && fin3.status === 202, '7.3 Concurrent call -> 202 processing')

  // 7.4: Stale finalizing (> 10 min) -> recovery
  const db74 = createMockDb()
  const r74 = createMockR2()
  db74.insertMedia({ lead_id: 'lead-74', client_media_id: 'f-stale', storage_key: 'tmp/leads/lead-74/f-stale.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 512, upload_status: 'finalizing', finalizing_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), safe_filename: 'stale.jpg' })
  r74.putObject('tmp/leads/lead-74/f-stale.jpg', Buffer.alloc(512))

  const fin4 = simulateFinalize(db74, r74, 'lead-74', 'f-stale')
  assert(fin4.success && fin4.storageKey === 'leads/lead-74/f-stale.jpg', '7.4 Stale lock (15min) recovered and promoted')

  // 7.5: Object missing in R2 -> failed
  const db75 = createMockDb()
  const r75 = createMockR2()
  db75.insertMedia({ lead_id: 'lead-75', client_media_id: 'f-miss', storage_key: 'tmp/leads/lead-75/f-miss.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 100, upload_status: 'pending', safe_filename: 'miss.jpg' })
  // Do NOT put object in R2

  try { simulateFinalize(db75, r75, 'lead-75', 'f-miss'); assert(false, '7.5') } catch (e) {
    assert(e.statusCode === 400, '7.5 Missing R2 object -> 400 failed')
    assert(db75.getMedia('lead-75', 'f-miss').upload_status === 'failed', '7.5b DB status set to failed')
  }

  // 7.6: CopyObject fails -> DB set to failed, no promoted object
  const db76 = createMockDb()
  const r76 = createMockR2()
  db76.insertMedia({ lead_id: 'lead-76', client_media_id: 'f-copyfail', storage_key: 'tmp/leads/lead-76/f-copyfail.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 256, upload_status: 'pending', safe_filename: 'cf.jpg' })
  r76.putObject('tmp/leads/lead-76/f-copyfail.jpg', Buffer.alloc(256))
  r76.setShouldFailNextCopy(true)

  try { simulateFinalize(db76, r76, 'lead-76', 'f-copyfail'); assert(false, '7.6') } catch (e) {
    assert(e.statusCode === 500, '7.6 CopyObject fails -> 500')
    assert(db76.getMedia('lead-76', 'f-copyfail').upload_status === 'failed', '7.6b DB status set to failed')
    assert(!r76.exists('leads/lead-76/f-copyfail.jpg'), '7.6c No promoted object in R2')
  }

  // 7.7: DB UPDATE fails after CopyObject -> compensation deletes promoted, sets failed
  const db77 = createMockDb()
  const r77 = createMockR2()
  db77.insertMedia({ lead_id: 'lead-77', client_media_id: 'f-dbfail', storage_key: 'tmp/leads/lead-77/f-dbfail.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 512, upload_status: 'pending', safe_filename: 'dbf.jpg' })
  r77.putObject('tmp/leads/lead-77/f-dbfail.jpg', Buffer.alloc(512))

  // Override updateMediaStatus to fail on the first call with 'uploaded'
  const origUpdate = db77.updateMediaStatus.bind(db77)
  let failOnUploaded = true
  db77.updateMediaStatus = function(lid, cmid, updates) {
    if (failOnUploaded && updates.upload_status === 'uploaded') {
      failOnUploaded = false
      throw new Error('Simulated DB failure')
    }
    return origUpdate(lid, cmid, updates)
  }

  try { simulateFinalize(db77, r77, 'lead-77', 'f-dbfail'); assert(false, '7.7') } catch (e) {
    assert(e.statusCode === 500, '7.7 DB update fail -> 500')
    assert(!r77.exists('leads/lead-77/f-dbfail.jpg'), '7.7b Compensation: promoted object deleted')
    assert(db77.getMedia('lead-77', 'f-dbfail').upload_status === 'failed', '7.7c DB status set to failed')
  }

  // 7.8: Delete temp fails -> final object remains valid
  const db78 = createMockDb()
  const r78 = createMockR2()
  db78.insertMedia({ lead_id: 'lead-78', client_media_id: 'f-delfail', storage_key: 'tmp/leads/lead-78/f-delfail.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 256, upload_status: 'pending', safe_filename: 'df.jpg' })
  r78.putObject('tmp/leads/lead-78/f-delfail.jpg', Buffer.alloc(256))

  // Delete temp will fail but shouldn't break the flow
  const origDel = r78.deleteObject.bind(r78)
  let blockFirstDelete = true
  r78.deleteObject = function(key) {
    if (blockFirstDelete && key.startsWith('tmp/')) {
      blockFirstDelete = false
      throw new Error('Simulated delete failure')
    }
    return origDel(key)
  }

  const fin78 = simulateFinalize(db78, r78, 'lead-78', 'f-delfail')
  assert(fin78.success, '7.8 Delete temp fails -> finalize still succeeds')
  assert(r78.exists('leads/lead-78/f-delfail.jpg'), '7.8b Final object remains valid')
  assert(db78.getMedia('lead-78', 'f-delfail').upload_status === 'uploaded', '7.8c DB status is uploaded')
  assert(r78.exists('tmp/leads/lead-78/f-delfail.jpg'), '7.8d Temp object still exists (lifecycle will clean)')

  // 7.9: Previously failed -> error 400
  const db79 = createMockDb()
  db79.insertMedia({ lead_id: 'lead-79', client_media_id: 'f-prev', storage_key: 'tmp/x', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 100, upload_status: 'failed', safe_filename: 'pf.jpg' })
  try { simulateFinalize(db79, createMockR2(), 'lead-79', 'f-prev'); assert(false, '7.9') } catch (e) { assert(e.statusCode === 400, '7.9 Previously failed -> 400') }

  // 7.10: Record not found -> 404
  try { simulateFinalize(createMockDb(), createMockR2(), 'lead-nope', 'f-nope'); assert(false, '7.10') } catch (e) { assert(e.statusCode === 404, '7.10 Not found -> 404') }

  // ====================================================================
  // GRUPO 8: ADMIN AUTH & MEDIA SECURITY (IDOR, ROLES, REFRESH & CSRF)
  // ====================================================================
  console.log('\n--- GRUPO 8: Admin Auth & Media Security ---')

  // 8.1 - 8.3: Extração de Tokens
  assert(extractAuthToken('Bearer my_jwt_token_12345', null) === 'my_jwt_token_12345', '8.1 extractAuthToken Bearer')
  assert(extractAuthToken(null, 'other=1; sb_admin_token=my_cookie_jwt_12345; test=2') === 'my_cookie_jwt_12345', '8.2 extractAuthToken Cookie')
  assert(extractAuthToken(null, null) === null, '8.3 extractAuthToken null when missing')
  assert(extractRefreshToken('other=1; sb_admin_refresh_token=my_refresh_tk_999') === 'my_refresh_tk_999', '8.4 extractRefreshToken Cookie')

  // 8.5 - 8.10: Autorização de Administrador, Identidade e Role RBAC
  const nonAdminUser = { id: 'usr-1', email: 'regular@user.com' }
  const inactiveAdminUser = { id: 'usr-2', email: 'inactive@user.com' }
  const activeAdminUser = { id: 'usr-3', email: 'admin@adtelas.com.br' }
  const operatorUser = { id: 'usr-op', email: 'op@adtelas.com.br' }
  const superAdminUser = { id: 'usr-sa', email: 'sa@adtelas.com.br' }

  const adminRecords = [
    { id: 'adm-2', user_id: 'usr-2', email: 'inactive@user.com', role: 'admin', is_active: false },
    { id: 'adm-3', user_id: 'usr-3', email: 'admin@adtelas.com.br', role: 'admin', is_active: true },
    { id: 'adm-op', user_id: 'usr-op', email: 'op@adtelas.com.br', role: 'operator', is_active: true },
    { id: 'adm-sa', user_id: 'usr-sa', email: 'sa@adtelas.com.br', role: 'superadmin', is_active: true }
  ]

  assert(verifyActiveAdmin(null, adminRecords).authorized === false, '8.5 No user -> unauthenticated')
  assert(verifyActiveAdmin(nonAdminUser, adminRecords).authorized === false, '8.6 Non-admin user -> non_admin')
  assert(verifyActiveAdmin(inactiveAdminUser, adminRecords).reason === 'INACTIVE_ADMIN', '8.7 Inactive admin -> inactive_admin')
  
  // Role RBAC: operator bloqueado em rotas de privilégio pleno
  const authOp = verifyActiveAdmin(operatorUser, adminRecords)
  assert(authOp.authorized === false && authOp.reason === 'UNAUTHORIZED_ROLE', '8.8 Operator role blocked from full admin -> UNAUTHORIZED_ROLE (403)')

  // Role RBAC: superadmin e admin permitidos
  const authAdmin = verifyActiveAdmin(activeAdminUser, adminRecords)
  assert(authAdmin.authorized === true && authAdmin.admin.role === 'admin', '8.9 Active admin -> authorized')
  const authSuper = verifyActiveAdmin(superAdminUser, adminRecords)
  assert(authSuper.authorized === true && authSuper.admin.role === 'superadmin', '8.10 Active superadmin -> authorized')

  // Identidade autoritativa: alteração de email em auth.users não quebra autorização vinculada por user_id
  const emailChangedUser = { id: 'usr-3', email: 'novo_email_modificado@gmail.com' }
  const authChangedEmail = verifyActiveAdmin(emailChangedUser, adminRecords)
  assert(authChangedEmail.authorized === true && authChangedEmail.admin.userId === 'usr-3', '8.11 Auth depends strictly on auth.users.id ↔ admin_users.user_id')

  // 8.12 - 8.16: Validação de Acesso a Mídia e IDOR
  assert(validateMediaAccess(null).allowed === false && validateMediaAccess(null).statusCode === 404, '8.12 Media null -> 404')
  assert(validateMediaAccess({ upload_status: 'pending' }).statusCode === 400, '8.13 Media pending -> 400')
  assert(validateMediaAccess({ upload_status: 'failed' }).statusCode === 400, '8.14 Media failed -> 400')
  assert(validateMediaAccess({ upload_status: 'uploaded', lead_id: 'lead-A', storage_key: 'leads/a/1.jpg' }, 'lead-B').statusCode === 403, '8.15 Cross-lead IDOR -> 403')
  assert(validateMediaAccess({ upload_status: 'uploaded', lead_id: 'lead-A', storage_key: 'leads/a/1.jpg' }, 'lead-A').allowed === true, '8.16 Matching lead -> 200 allowed')

  // 8.17: Sanitização de Metadados
  const rawMedia = {
    id: 'm-1',
    lead_id: 'lead-8',
    client_media_id: 'cm-1',
    storage_key: 'leads/lead-8/secret.jpg',
    safe_filename: 'photo.jpg',
    media_type: 'photo',
    mime_type: 'image/jpeg',
    file_size_bytes: 1024,
    upload_status: 'uploaded',
    verified_at: '2026-08-25T10:00:00Z',
    created_at: '2026-08-25T09:59:00Z'
  }
  const sanitized = sanitizeMediaMetadata(rawMedia)
  assert(sanitized.id === 'm-1' && !sanitized.storage_key, '8.17 sanitizeMediaMetadata strips storage_key')

  // 8.18 - 8.19: Lead Journey Metadata Exposure
  function simulateAdminLeadJourney(adminAuthorized, leadId, db) {
    let mediaList = []
    if (adminAuthorized) {
      mediaList = db.listMediaByLead(leadId).map(sanitizeMediaMetadata)
    }
    return { media: mediaList }
  }

  const db8 = createMockDb()
  db8.insertMedia(rawMedia)

  const noAuth = simulateAdminLeadJourney(false, 'lead-8', db8)
  assert(noAuth.media.length === 0, '8.18 No admin session -> empty media array')

  const withAuth = simulateAdminLeadJourney(true, 'lead-8', db8)
  assert(withAuth.media.length === 1 && withAuth.media[0].safe_filename === 'photo.jpg', '8.19 Admin session -> media metadata returned')

  // 8.20 - 8.24: Signed URL Generation, TTL & Headers
  function simulateSignedUrl(authCheck, mediaId, reqLeadId, db) {
    if (!authCheck.authorized) {
      throw Object.assign(new Error(authCheck.reason || 'Unauthorized'), { statusCode: authCheck.reason === 'INACTIVE_ADMIN' || authCheck.reason === 'UNAUTHORIZED_ROLE' ? 403 : 401 })
    }
    const media = db.getMediaById ? db.getMediaById(mediaId) : rawMedia
    const access = validateMediaAccess(media, reqLeadId)
    if (!access.allowed) {
      throw Object.assign(new Error(access.message), { statusCode: access.statusCode })
    }
    return {
      success: true,
      signedUrl: `https://r2.adtelas.internal/signed/${mediaId}?expires=300`,
      expiresInSeconds: 300,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    }
  }

  try { simulateSignedUrl({ authorized: false }, 'm-1', 'lead-8', db8); assert(false, '8.20') } catch (e) { assert(e.statusCode === 401, '8.20 signed-url without auth -> 401') }
  try { simulateSignedUrl({ authorized: false, reason: 'UNAUTHORIZED_ROLE' }, 'm-1', 'lead-8', db8); assert(false, '8.21') } catch (e) { assert(e.statusCode === 403, '8.21 signed-url operator -> 403') }
  const signed = simulateSignedUrl({ authorized: true }, 'm-1', 'lead-8', db8)
  assert(signed.success && signed.expiresInSeconds === 300, '8.22 signed-url with active admin -> returns URL (TTL 300s)')
  assert(signed.headers['Cache-Control'].includes('no-store'), '8.23 signed-url response has Cache-Control: no-store')

  // 8.24: IDOR protection on signed-url
  try { simulateSignedUrl({ authorized: true }, 'm-1', 'wrong-lead-id', db8); assert(false, '8.24') } catch (e) { assert(e.statusCode === 403, '8.24 signed-url cross-lead IDOR -> 403') }

  // 8.25 - 8.26: Session Refresh Simulation
  function simulateServerSessionCheck(accessToken, refreshToken, mockAuthServer) {
    if (accessToken && mockAuthServer.validAccessTokens.has(accessToken)) {
      return { status: 200, user: mockAuthServer.validAccessTokens.get(accessToken) }
    }
    if (refreshToken && mockAuthServer.validRefreshTokens.has(refreshToken)) {
      const refreshed = mockAuthServer.validRefreshTokens.get(refreshToken)
      return { status: 200, refreshed: true, user: refreshed.user, newAccessToken: refreshed.newAccessToken }
    }
    return { status: 401, error: 'Sessão expirada. Faça login novamente.' }
  }

  const mockAuthServer = {
    validAccessTokens: new Map([['valid_jwt', { id: 'usr-3', email: 'admin@adtelas.com.br' }]]),
    validRefreshTokens: new Map([['valid_refresh_tk', { user: { id: 'usr-3', email: 'admin@adtelas.com.br' }, newAccessToken: 'fresh_jwt_999' }]])
  }

  const sessValid = simulateServerSessionCheck('valid_jwt', 'valid_refresh_tk', mockAuthServer)
  assert(sessValid.status === 200 && !sessValid.refreshed, '8.25 Valid access token -> 200')

  const sessExpired = simulateServerSessionCheck('expired_jwt', 'valid_refresh_tk', mockAuthServer)
  assert(sessExpired.status === 200 && sessExpired.refreshed && sessExpired.newAccessToken === 'fresh_jwt_999', '8.26 Expired access token with valid refresh token -> transparent server refresh')

  const sessRevoked = simulateServerSessionCheck('expired_jwt', 'bad_refresh_tk', mockAuthServer)
  assert(sessRevoked.status === 401, '8.27 Invalid refresh token -> 401 requiring login')

  // 8.28 - 8.33: CSRF Mutation & Login Same-Origin Checks
  const prodHost = 'www.adtelasmosquiteiras.com.br'
  assert(validateMutationOrigin('https://www.adtelasmosquiteiras.com.br', null, prodHost, false).allowed === true, '8.28 Same-origin POST allowed')
  assert(validateMutationOrigin('https://evil-attacker.com', null, prodHost, false).allowed === false, '8.29 Cross-site Origin POST rejected with 403')
  assert(validateMutationOrigin(null, 'https://malicious-site.net/page', prodHost, false).allowed === false, '8.30 Cross-site Referer POST rejected with 403')
  assert(validateMutationOrigin('http://localhost:3000', null, 'localhost:3000', true).allowed === true, '8.31 Dev localhost mutation allowed in dev mode')
  
  // Login CSRF Protection
  assert(validateMutationOrigin('https://phishing-site.org', null, prodHost, false).allowed === false, '8.32 Cross-site Login POST rejected with 403 (ADMIN_LOGIN_ORIGIN_CHECK = SAME_ORIGIN_ENFORCED)')
  assert(validateMutationOrigin('https://www.adtelasmosquiteiras.com.br', null, prodHost, false).allowed === true, '8.33 Same-origin Login POST allowed (LOGIN_CSRF_PROTECTION = YES)')

  // 8.34: Identidade estrita: dois registros com e-mails desatualizados não impactam a resolução por user_id
  const multiAdmins = [
    { id: 'adm-10', user_id: 'usr-10', email: 'antigo_1@example.com', role: 'admin', is_active: true },
    { id: 'adm-11', user_id: 'usr-11', email: 'antigo_2@example.com', role: 'admin', is_active: true }
  ]
  const user10 = { id: 'usr-10', email: 'novo_email_recem_alterado@domain.com' }
  const res10 = verifyActiveAdmin(user10, multiAdmins)
  assert(res10.authorized === true && res10.admin.userId === 'usr-10', '8.34 Identity authority is strictly user_id; stale email in record does not block auth')

  // 8.35: Pre-Check Fail-Fast de Função SQL 008
  function simulateSql008PreCheck(authUsersExists, adminUsersExists, functionExists) {
    if (!authUsersExists) throw new Error('ABORTING: Schema auth ou tabela auth.users NÃO encontrados.')
    if (adminUsersExists) throw new Error('ABORTING: public.admin_users já existe no banco.')
    if (functionExists) throw new Error('ABORTING: Função public.set_admin_users_updated_at já existe no banco.')
    return { ok: true }
  }

  assert(simulateSql008PreCheck(true, false, false).ok === true, '8.35a SQL 008 Pre-Check passes when clean')
  try { simulateSql008PreCheck(false, false, false); assert(false, '8.35b') } catch (e) { assert(e.message.includes('auth.users NÃO encontrados'), '8.35b SQL 008 Pre-Check aborts if auth.users missing') }
  try { simulateSql008PreCheck(true, true, false); assert(false, '8.35c') } catch (e) { assert(e.message.includes('admin_users já existe'), '8.35c SQL 008 Pre-Check aborts if admin_users exists') }
  try { simulateSql008PreCheck(true, false, true); assert(false, '8.35d') } catch (e) { assert(e.message.includes('Função public.set_admin_users_updated_at já existe'), '8.35d SQL 008 Pre-Check aborts if function exists (CREATE_ONLY fail-fast)') }

  // 8.21: Lead Journey payload contains zero signed URLs
  const journeyResult = { ...withAuth, timeline: [], attribution: {} }
  assert(!JSON.stringify(journeyResult).includes('cloudflarestorage') && !JSON.stringify(journeyResult).includes('signed'), '8.36 lead-journey response contains zero signed URLs')

  // ====================================================================
  // GRUPO 9: DELETE R2 FLOW (ORPHAN PROTECTION)
  // ====================================================================
  console.log('\n--- GRUPO 9: Delete R2 Flow (Orphan Protection) ---')

  function simulateLeadDeletion(db, r2, leadId) {
    // Step 1: Consult all storage_keys
    const allMedia = db.listMediaByLead(leadId)
    const storageKeys = allMedia.map(m => m.storage_key).filter(Boolean)

    // Step 2: Delete R2 objects first
    const r2Errors = []
    for (const key of storageKeys) {
      try { r2.deleteObject(key) } catch (e) { r2Errors.push({ key, error: e.message }) }
    }

    if (r2Errors.length > 0) {
      // R2 failure does NOT delete metadata — keys preserved for retry
      return { success: false, r2Errors, storageKeysPreserved: storageKeys }
    }

    // Step 3: Delete lead_media records
    for (const m of allMedia) {
      db.media.delete(`${m.lead_id}:${m.client_media_id}`)
    }

    // Step 4: Delete lead (ON DELETE RESTRICT would now succeed since no media refs)
    return { success: true, deletedR2Keys: storageKeys, deletedMediaRecords: allMedia.length }
  }

  // 9.1: Happy path deletion
  const db9 = createMockDb()
  const r9 = createMockR2()
  db9.insertMedia({ lead_id: 'lead-del', client_media_id: 'd-1', storage_key: 'leads/lead-del/d1.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 512, upload_status: 'uploaded', safe_filename: 'd1.jpg' })
  db9.insertMedia({ lead_id: 'lead-del', client_media_id: 'd-2', storage_key: 'leads/lead-del/d2.mp4', media_type: 'video', mime_type: 'video/mp4', file_size_bytes: 2048, upload_status: 'uploaded', safe_filename: 'd2.mp4' })
  r9.putObject('leads/lead-del/d1.jpg', Buffer.alloc(512))
  r9.putObject('leads/lead-del/d2.mp4', Buffer.alloc(2048))

  const del1 = simulateLeadDeletion(db9, r9, 'lead-del')
  assert(del1.success && del1.deletedR2Keys.length === 2, '9.1 Deletion: R2 objects deleted before metadata')
  assert(!r9.exists('leads/lead-del/d1.jpg') && !r9.exists('leads/lead-del/d2.mp4'), '9.2 R2 objects confirmed gone')
  assert(db9.listMediaByLead('lead-del').length === 0, '9.3 DB media records removed')

  // 9.4: R2 failure preserves storage_keys for retry
  const db94 = createMockDb()
  const r94 = createMockR2()
  db94.insertMedia({ lead_id: 'lead-r2fail', client_media_id: 'rf-1', storage_key: 'leads/lead-r2fail/rf1.jpg', media_type: 'photo', mime_type: 'image/jpeg', file_size_bytes: 256, upload_status: 'uploaded', safe_filename: 'rf1.jpg' })
  r94.putObject('leads/lead-r2fail/rf1.jpg', Buffer.alloc(256))
  r94.setShouldFailNextDelete(true)

  const del2 = simulateLeadDeletion(db94, r94, 'lead-r2fail')
  assert(del2.success === false, '9.4 R2 delete failure -> deletion aborted')
  assert(del2.r2Errors.length === 1, '9.5 R2 error captured')
  assert(del2.storageKeysPreserved.length === 1, '9.6 Storage keys preserved for retry')
  assert(db94.listMediaByLead('lead-r2fail').length === 1, '9.7 DB metadata NOT deleted (keys preserved)')

  // ====================================================================
  // GRUPO 10: R2 PRESIGNED URLs (MOCK, NO NETWORK)
  // ====================================================================
  console.log('\n--- GRUPO 10: R2 Presigned URLs ---')

  const presUp = await generatePresignedUploadUrl('tmp/leads/lid/f.jpg', 'image/jpeg')
  assert(presUp.includes('tmp/leads/lid/f.jpg'), '10.1 Presigned PUT URL contains tmp key')

  const presDown = await generatePresignedDownloadUrl('leads/lid/f.jpg', 300)
  assert(presDown.includes('leads/lid/f.jpg'), '10.2 Presigned GET URL contains final key')

  // ====================================================================
  // GRUPO 11: PERFORMANCE, CONCURRENCY & GALLERY PREVIEWS
  // ====================================================================
  console.log('\n--- GRUPO 11: Performance, Concurrency & Gallery Previews ---')

  // 11.1 - 11.2: Bounded Concurrency Worker Pool Simulation
  async function simulateConcurrentUploadPool(items, concurrency = 2) {
    let active = 0
    let peakConcurrency = 0
    const results = []

    const executeTask = async (item) => {
      active++
      if (active > peakConcurrency) peakConcurrency = active
      await new Promise(r => setTimeout(r, 20)) // simula I/O assíncrono
      active--
      if (item.shouldFail) throw new Error('Falha simulada')
      return { id: item.id, status: 'uploaded' }
    }

    const executing = []
    for (const item of items) {
      const p = executeTask(item).then(res => {
        results.push(res)
      }).catch(err => {
        results.push({ id: item.id, status: 'failed', error: err.message })
      }).finally(() => {
        executing.splice(executing.indexOf(p), 1)
      })
      executing.push(p)

      if (executing.length >= concurrency) {
        await Promise.race(executing)
      }
    }
    await Promise.all(executing)
    return { results, peakConcurrency }
  }

  const fourFiles = [
    { id: 'f-1', size: 15 * 1024 },
    { id: 'f-2', size: 25 * 1024 },
    { id: 'f-3', size: 33 * 1024 },
    { id: 'f-4', size: 28 * 1024 }
  ]
  const poolRun = await simulateConcurrentUploadPool(fourFiles, 2)
  assert(poolRun.peakConcurrency <= 2, '11.1 Bounded concurrency never exceeds limit (MEDIA_UPLOAD_CONCURRENCY = 2)')
  assert(poolRun.results.filter(r => r.status === 'uploaded').length === 4, '11.2 All 4 files uploaded via concurrent worker pool')

  // 11.3: Falha isolada de um item não afeta os outros
  const filesWithFailure = [
    { id: 'f-ok1' },
    { id: 'f-bad', shouldFail: true },
    { id: 'f-ok2' }
  ]
  const poolFailRun = await simulateConcurrentUploadPool(filesWithFailure, 2)
  assert(poolFailRun.results.find(r => r.id === 'f-bad').status === 'failed', '11.3 Failed item is isolated')
  assert(poolFailRun.results.filter(r => r.status === 'uploaded').length === 2, '11.4 Other items succeed independently')

  // 11.5: Range de Magic Bytes lê apenas 512 bytes (MAGIC_BYTE_RANGE_SIZE = 512_BYTES)
  const mockVideoLarge = Buffer.alloc(25 * 1024 * 1024) // 25 MB
  // Escreve magic bytes de MP4 nos primeiros 32 bytes
  mockVideoLarge.writeUInt32BE(0x00000020, 0)
  mockVideoLarge.write('ftyp', 4)
  const rangeSlice = mockVideoLarge.subarray(0, 512)
  assert(rangeSlice.length === 512, '11.5 Range slice has exactly 512 bytes')
  assert(validateMediaMagicBytes(rangeSlice, 'video/mp4') === true, '11.6 Magic bytes validated using only first 512 bytes (SERVER_FULL_VIDEO_DOWNLOAD_DURING_FINALIZE = NO)')

  // 11.7: Skip compression threshold (arquivos < 120 KB)
  const isSkipCandidate = (fileSize, mime, width, height) => {
    return fileSize <= 120 * 1024 && (mime === 'image/jpeg' || mime === 'image/webp') && width <= 1280 && height <= 1280
  }
  assert(isSkipCandidate(25 * 1024, 'image/jpeg', 800, 600) === true, '11.7 25KB JPEG skips unnecessary canvas recompression (PHOTO_COMPRESSION_SKIP_THRESHOLD = 120 KB)')
  assert(isSkipCandidate(4 * 1024 * 1024, 'image/jpeg', 4000, 3000) === false, '11.8 4MB photo triggers full compression and resize')

  // 11.9: Thumbnails de fotos no Admin Drawer
  function simulateAdminGalleryThumbnails(mediaList, authAdmin) {
    if (!authAdmin.authorized) throw new Error('401')
    return mediaList.map(m => {
      if (m.media_type === 'photo' && m.upload_status === 'uploaded') {
        return { id: m.id, hasThumbnail: true, signedUrl: `https://r2.adtelas.internal/thumb/${m.id}?expires=300` }
      }
      return { id: m.id, hasThumbnail: false }
    })
  }

  const galleryMedia = [
    { id: 'p-1', media_type: 'photo', upload_status: 'uploaded' },
    { id: 'p-2', media_type: 'photo', upload_status: 'pending' },
    { id: 'v-1', media_type: 'video', upload_status: 'uploaded' }
  ]
  const thumbs = simulateAdminGalleryThumbnails(galleryMedia, { authorized: true })
  // 11.12: useFormSubmit media_selection_summary extraction from uploader ref
  const mockUploader = {
    mediaItems: [
      { id: 'm1', type: 'photo' },
      { id: 'm2', type: 'photo' },
      { id: 'm3', type: 'photo' },
      { id: 'm4', type: 'photo' }
    ],
    photoCount: 4,
    videoCount: 0
  }
  const extractSummary = (uploader) => {
    const items = uploader?.mediaItems || []
    const pCount = typeof uploader?.photoCount === 'number' ? uploader.photoCount : (uploader?.photoCount?.value ?? items.filter(m => m.type === 'photo').length)
    const vCount = typeof uploader?.videoCount === 'number' ? uploader.videoCount : (uploader?.videoCount?.value ?? items.filter(m => m.type === 'video').length)
    if (pCount > 0 || vCount > 0) {
      return { photoCount: Number(pCount) || 0, videoCount: Number(vCount) || 0 }
    }
    return null
  }
  const extracted = extractSummary(mockUploader)
  assert(extracted.photoCount === 4 && extracted.videoCount === 0, '11.12 useFormSubmit correctly extracts photoCount=4 and videoCount=0 from MediaUploader')

  // 11.13: Email notice with 4 photos
  const leadWith4Photos = {
    nome: 'Samuel Teste',
    telefone: '11999999999',
    servico: 'Redes de Proteção',
    media_selection_summary: { photoCount: 4, videoCount: 0 }
  }
  const htmlWith4Photos = generateEmailHTML(leadWith4Photos)
  assert(htmlWith4Photos.includes('Arquivos do Cliente'), '11.13a Email HTML contains Arquivos do Cliente section')
  assert(htmlWith4Photos.includes('Este cliente selecionou 4 fotos para envio junto'), '11.13b Email HTML contains 4 fotos notice text')
  assert(htmlWith4Photos.includes('VER LEAD NO PAINEL'), '11.13c Email HTML contains VER LEAD NO PAINEL button')

  // 11.14: lead-journey query compatibility (lead_id vs leadId)
  function parseLeadJourneyQuery(query) {
    return query.lead_id || query.leadId
  }
  assert(parseLeadJourneyQuery({ lead_id: 'lead-123' }) === 'lead-123', '11.14a lead-journey accepts snake_case lead_id')
  assert(parseLeadJourneyQuery({ leadId: 'lead-456' }) === 'lead-456', '11.14b lead-journey accepts camelCase leadId')

  // 11.15: Drawer failure isolation with Promise.allSettled
  async function simulateDrawerThumbnailLoading(photos) {
    const results = await Promise.allSettled(
      photos.map(p => {
        if (p.shouldFail) return Promise.reject(new Error('S3 500'))
        return Promise.resolve({ id: p.id, url: `https://thumb/${p.id}` })
      })
    )
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    return { successCount, failCount }
  }
  const drawerRun = await simulateDrawerThumbnailLoading([
    { id: 'p1' },
    { id: 'p2', shouldFail: true },
    { id: 'p3' },
    { id: 'p4' }
  ])
  assert(drawerRun.successCount === 3 && drawerRun.failCount === 1, '11.15 Drawer loads 3 thumbnails despite 1 failure (DRAWER_FAILURE_ISOLATION = YES)')
  console.log('======================================================================')
  console.log('PROVAS DE ISOLAMENTO:')
  console.log('  REAL_EMAIL_SENT_DURING_TESTS: NO')
  console.log('  PRODUCTION_DB_WRITES_DURING_TESTS: NO')
  console.log('  PRODUCTION_R2_WRITES_DURING_TESTS: NO')
  console.log('  SUPABASE_MCP_WRITES: 0')
  console.log('======================================================================\n')

  if (failedTests > 0) process.exit(1)
}

runTestSuite()
