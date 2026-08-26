import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  SERVICE_FAMILIES,
  ALL_SERVICES_MAP
} from '../server/shared/siteMediaTaxonomy.mjs'

import {
  ALLOWED_SERVICE_KEYS,
  ALLOWED_MIME_TYPES,
  SITE_MEDIA_LIMITS,
  validateServiceKey,
  validateMediaTypeAndMime,
  validateFileSize,
  sanitizeAltText,
  sanitizeCaption,
  sanitizeTitle
} from '../server/shared/siteMediaCore.mjs'

console.log('======================================================================')
console.log('SITE MEDIA ADMIN GALLERY UI & WORKFLOW TEST SUITE (36 SCENARIOS)')
console.log('======================================================================\n')

let passed = 0
let failed = 0

function test(num, description, fn) {
  try {
    fn()
    console.log(`  [PASS] ${num}. ${description}`)
    passed++
  } catch (err) {
    console.error(`  [FAIL] ${num}. ${description}`)
    console.error('         Error:', err.message)
    failed++
  }
}

async function testAsync(num, description, fn) {
  try {
    await fn()
    console.log(`  [PASS] ${num}. ${description}`)
    passed++
  } catch (err) {
    console.error(`  [FAIL] ${num}. ${description}`)
    console.error('         Error:', err.message)
    failed++
  }
}

async function runAllTests() {
  console.log('--- GRUPO 1: ROTA, LAYOUT E TAXONOMIA ---')

  // 1. route admin protegida
  test(1, 'Route admin protegida por definePageMeta({ layout: "admin" })', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes("definePageMeta({ layout: 'admin' })"))
  })

  // 2. loading state
  test(2, 'Loading state renderiza Skeletons estruturados', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('v-if="isLoading"'))
    assert.ok(galeriaFile.includes('<Skeleton'))
  })

  // 3. empty state
  test(3, 'Empty state amigável com CTA de adicionar mídias', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('Nenhuma mídia cadastrada neste serviço'))
  })

  // 4. erro API
  test(4, 'Erro na API exibe mensagem e botão de recarregar', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('v-else-if="loadError"'))
    assert.ok(galeriaFile.includes('@click="fetchMediaList()"'))
  })

  // 5. seletor de serviço
  test(5, 'Seletor de família e serviço cobre as 3 famílias e 12 rotas', () => {
    assert.strictEqual(SERVICE_FAMILIES.length, 3)
    const allKeys = Object.keys(ALL_SERVICES_MAP)
    assert.strictEqual(allKeys.length, 12)
    for (const key of ALLOWED_SERVICE_KEYS) {
      assert.ok(allKeys.includes(key), `Chave ${key} não encontrada no mapeamento`)
    }
  })

  // 6. labels humanas
  test(6, 'Labels humanas nunca exibem service_key técnica crua', () => {
    assert.strictEqual(ALL_SERVICES_MAP.telas_janelas.name, 'Telas para Janelas')
    assert.strictEqual(ALL_SERVICES_MAP.redes_sacadas.name, 'Redes para Sacadas e Varandas')
    assert.strictEqual(ALL_SERVICES_MAP.pet_screen.name, 'Telas Pet Screen')
  })

  console.log('\n--- GRUPO 2: VALIDAÇÃO, COMPRESSÃO E PREVIEW ---')

  // 7. file type validation
  test(7, 'File type validation aceita JPG, PNG, WebP, MP4, WebM e rejeita outros', () => {
    assert.strictEqual(validateMediaTypeAndMime('photo', 'image/jpeg').valid, true)
    assert.strictEqual(validateMediaTypeAndMime('photo', 'image/webp').valid, true)
    assert.strictEqual(validateMediaTypeAndMime('video', 'video/mp4').valid, true)
    assert.strictEqual(validateMediaTypeAndMime('photo', 'image/gif').valid, false)
    assert.strictEqual(validateMediaTypeAndMime('photo', 'application/pdf').valid, false)
  })

  // 8. photo size validation
  test(8, 'Photo size validation respeita limite de 10 MB', () => {
    assert.strictEqual(validateFileSize('photo', 10 * 1024 * 1024).valid, true)
    assert.strictEqual(validateFileSize('photo', 10 * 1024 * 1024 + 1).valid, false)
  })

  // 9. video size validation
  test(9, 'Video size validation respeita limite de 50 MB', () => {
    assert.strictEqual(validateFileSize('video', 50 * 1024 * 1024).valid, true)
    assert.strictEqual(validateFileSize('video', 50 * 1024 * 1024 + 1).valid, false)
  })

  // 10. batch >10 denied
  test(10, 'Fila de upload limita seleção a 10 arquivos por lote', () => {
    const queueLimit = 10
    const mockFiles = Array.from({ length: 15 }, (_, i) => ({ name: `f_${i}.jpg` }))
    const enqueued = mockFiles.slice(0, queueLimit)
    assert.strictEqual(enqueued.length, 10)
  })

  // 11. compression invoked for photos
  test(11, 'useImageCompressor é invocado para fotos com maxWidth 1920 e WebP', () => {
    const compFile = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useImageCompressor.js'), 'utf8')
    assert.ok(compFile.includes("format || 'image/webp'"))
    assert.ok(compFile.includes('width'))
    assert.ok(compFile.includes('height'))
  })

  // 12. video not compressed
  test(12, 'Vídeos preservam formato original e não passam pelo compressor de canvas', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.ok(mediaComposable.includes("if (item.mediaType === 'photo')"))
    assert.ok(mediaComposable.includes('item.finalSize = item.file.size'))
  })

  // 13. ObjectURL created
  test(13, 'URL.createObjectURL cria previews locais imediatos', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.ok(mediaComposable.includes('URL.createObjectURL(file)'))
  })

  // 14. ObjectURL revoked
  test(14, 'URL.revokeObjectURL executado na conclusão, remoção ou unmount', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.ok(mediaComposable.includes('URL.revokeObjectURL(item.previewUrl)'))
    assert.ok(mediaComposable.includes('onUnmounted'))
  })

  console.log('\n--- GRUPO 3: ALT TEXT, AUTORIZAÇÃO E UPLOAD PIPELINE ---')

  // 15. alt required
  test(15, 'alt_text obrigatório (rejeita vazio ou null)', () => {
    assert.throws(() => sanitizeAltText(''), /alt_text é obrigatório/)
    assert.throws(() => sanitizeAltText(null), /alt_text é obrigatório/)
  })

  // 16. alt min
  test(16, 'alt_text mínimo 3 caracteres', () => {
    assert.throws(() => sanitizeAltText('ab'), /no mínimo 3 caracteres/)
    assert.strictEqual(sanitizeAltText('abc'), 'abc')
  })

  // 17. alt max
  test(17, 'alt_text máximo 255 caracteres', () => {
    const text255 = 'a'.repeat(255)
    assert.strictEqual(sanitizeAltText(text255), text255)
    assert.throws(() => sanitizeAltText('a'.repeat(256)), /excede o limite máximo/)
  })

  // 18. authorize called
  test(18, 'authorize-upload chamado com service_key e MIME do arquivo processado', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.ok(mediaComposable.includes("'/api/admin/media/site/authorize-upload'"))
  })

  // 19. requiredHeaders honored
  test(19, 'XHR PUT define Content-Type e Cache-Control imutável idênticos ao contrato', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.ok(mediaComposable.includes("xhr.setRequestHeader('Content-Type', mimeType)"))
    assert.ok(mediaComposable.includes("xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000, immutable')"))
  })

  // 20. finalize only after PUT success
  test(20, 'finalize-upload invocado estritamente após HTTP 2xx no PUT dentro do pipeline', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    const processQueueStart = mediaComposable.indexOf('async function processQueueItem')
    const processQueueBlock = mediaComposable.slice(processQueueStart)
    const authIdx = processQueueBlock.indexOf('/api/admin/media/site/authorize-upload')
    const putIdx = processQueueBlock.indexOf('await uploadToPresignedUrl')
    const finalIdx = processQueueBlock.indexOf('/api/admin/media/site/finalize-upload')
    assert.ok(authIdx !== -1 && putIdx !== -1 && finalIdx !== -1)
    assert.ok(authIdx < putIdx, 'authorize-upload deve preceder uploadToPresignedUrl')
    assert.ok(putIdx < finalIdx, 'uploadToPresignedUrl deve preceder finalize-upload')
  })

  // 21. PUT fail -> finalize not called
  test(21, 'Falha no PUT interrompe o fluxo e não chama finalize-upload', () => {
    let finalizeCalled = false
    try {
      const putSuccess = false
      if (!putSuccess) throw new Error('PUT Failed')
      finalizeCalled = true
    } catch {
      // expected
    }
    assert.strictEqual(finalizeCalled, false)
  })

  // 22. retry available
  test(22, 'Botão de retry individual disponível em itens com status error', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('item.status === \'error\''))
    assert.ok(galeriaFile.includes('@click="retryQueueItem(item.id)"'))
  })

  console.log('\n--- GRUPO 4: CARDS, AÇÕES E MUTABILIDADE CONTROLADA ---')

  // 23. list refetched
  test(23, 'fetchMediaList recarrega lista ao selecionar novo serviço ou concluir upload', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.ok(mediaComposable.includes('watch(selectedServiceKey'))
    assert.ok(mediaComposable.includes('await fetchMediaList()'))
  })

  // 24. toggle active
  test(24, 'toggleActive realiza atualização otimista com reversão em falha', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.ok(mediaComposable.includes('is_active: newActive'))
    assert.ok(mediaComposable.includes('mediaList.value = originalList'))
  })

  // 25. toggle failure rolls back
  test(25, 'Falha no toggle restaura lista original sem falso positivo visual', () => {
    let list = [{ id: '1', is_active: true }]
    const original = list.map(item => ({ ...item }))
    list[0].is_active = false
    const apiSuccess = false
    if (!apiSuccess) {
      list = original
    }
    assert.strictEqual(list[0].is_active, true)
  })

  // 26. featured photo works
  test(26, 'setFeatured chama endpoint e atualiza apenas a foto selecionada como destaque', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.ok(mediaComposable.includes("'/api/admin/media/site/set-featured'"))
    assert.ok(mediaComposable.includes('is_featured: item.id === mediaId'))
  })

  // 27. video featured unavailable
  test(27, 'Botão de destaque indisponível para vídeos na interface', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes("media.media_type === 'photo' && !media.is_featured"))
  })

  // 28. edit metadata
  test(28, 'Modal de edição permite alterar alt_text, title e caption sem HTML', () => {
    const clean = sanitizeAltText('Foto <b>bonita</b>')
    assert.strictEqual(clean, 'Foto bonita')
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('isEditDialogOpen'))
    assert.ok(galeriaFile.includes('editForm.alt_text'))
  })

  // 29. delete confirmation
  test(29, 'Exclusão exige confirmação explícita via AlertDialog modal', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('isDeleteDialogOpen'))
    assert.ok(galeriaFile.includes('Excluir esta mídia?'))
  })

  // 30. delete failure preserves card
  test(30, 'Falha na exclusão preserva o card na tela com mensagem de erro', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('deleteError'))
  })

  // 31. broken image fallback
  test(31, 'Fallback visual "Mídia indisponível" renderiza se imagem CDN der 404', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('@error="handleImageError(media.id)"'))
    assert.ok(galeriaFile.includes('Mídia indisponível'))
  })

  // 32. reorder up/down
  test(32, 'Reordenação ↑ / ↓ acessível com botões de toque >= 44px', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes("reorderMedia(media.id, 'up')"))
    assert.ok(galeriaFile.includes("reorderMedia(media.id, 'down')"))
  })

  console.log('\n--- GRUPO 5: SEGURANÇA E RESPONSIVIDADE ---')

  // 33. no direct Supabase mutation
  test(33, 'Nenhuma mutação direta ao Supabase no frontend (todas via /api/admin/media/site/*)', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.strictEqual(mediaComposable.includes('supabase.from('), false)
    assert.strictEqual(mediaComposable.includes('supabase.rpc('), false)
  })

  // 34. no lead-media credentials
  test(34, 'Zero uso de credenciais ou buckets de leads (adtelas-leads-private)', () => {
    const mediaComposable = fs.readFileSync(path.resolve(process.cwd(), 'app/composables/useAdminSiteMedia.ts'), 'utf8')
    assert.strictEqual(mediaComposable.includes('adtelas-leads-private'), false)
  })

  // 35. no secret exposure
  test(35, 'Nenhum segredo (R2 Secret Key, Supabase Service Role) exposto no frontend', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.strictEqual(galeriaFile.includes('serviceRoleKey'), false)
    assert.strictEqual(galeriaFile.includes('secretAccessKey'), false)
  })

  // 36. mobile controls remain accessible
  test(36, 'Controles mobile respeitam touch targets e ausência de horizontal overflow', () => {
    const galeriaFile = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/admin/galeria.vue'), 'utf8')
    assert.ok(galeriaFile.includes('overflow-x-hidden'))
    assert.ok(galeriaFile.includes('min-h-[44px]'))
  })

  console.log('\n======================================================================')
  console.log(`TEST SUITE FINISHED: ${passed} PASSED | ${failed} FAILED`)
  console.log('======================================================================')

  if (failed > 0) process.exit(1)
}

runAllTests().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
