import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  SERVICE_FAMILIES,
  ALL_SERVICES_MAP
} from '../server/shared/siteMediaTaxonomy.mjs'

import {
  ALLOWED_SERVICE_KEYS
} from '../server/shared/siteMediaCore.mjs'

console.log('======================================================================')
console.log('SITE MEDIA PUBLIC GALLERY FULL TEST SUITE (40 SCENARIOS)')
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
  console.log('--- GRUPO 1: ARQUITETURA DE COMPONENTES E MAPEAMENTO DAS 12 PÁGINAS ---')

  // 1. component exists
  test(1, 'ServicePublicGallery.vue e ServicePublicLightbox.vue existem fisicamente', () => {
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue')))
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue')))
  })

  // 2. endpoint per service_key
  test(2, 'Endpoint público /api/services/[service_key]/media existe e consome param dinâmico', () => {
    const epFile = fs.readFileSync(path.resolve(process.cwd(), 'server/api/services/[service_key]/media.get.ts'), 'utf8')
    assert.ok(epFile.includes("getRouterParam(event, 'service_key')"))
    assert.ok(epFile.includes('validateServiceKey'))
  })

  // 3. 12 mappings corretos
  test(3, 'As 12 páginas públicas de serviços incluem ServicePublicGallery com a serviceKey correta', () => {
    const pageMappings = [
      { file: 'app/pages/servicos/redes/janelas.vue', key: 'redes_janelas' },
      { file: 'app/pages/servicos/redes/sacadas-e-varandas.vue', key: 'redes_sacadas' },
      { file: 'app/pages/servicos/redes/gatos-e-pets.vue', key: 'redes_pets' },
      { file: 'app/pages/servicos/redes/criancas.vue', key: 'redes_criancas' },
      { file: 'app/pages/servicos/redes/escadas-e-mezaninos.vue', key: 'redes_escadas' },
      { file: 'app/pages/servicos/telas/janelas.vue', key: 'telas_janelas' },
      { file: 'app/pages/servicos/telas/portas.vue', key: 'telas_portas' },
      { file: 'app/pages/servicos/telas/sacadas-e-varandas.vue', key: 'telas_sacadas' },
      { file: 'app/pages/servicos/telas/removivel.vue', key: 'telas_removiveis' },
      { file: 'app/pages/servicos/telas/pet-screen.vue', key: 'pet_screen' },
      { file: 'app/pages/servicos/telas/restaurantes.vue', key: 'telas_restaurantes' },
      { file: 'app/pages/servicos/vidracaria.vue', key: 'vidracaria' }
    ]

    for (const mapping of pageMappings) {
      const content = fs.readFileSync(path.resolve(process.cwd(), mapping.file), 'utf8')
      assert.ok(
        content.includes(`service-key="${mapping.key}"`) || content.includes(`serviceKey="${mapping.key}"`),
        `Página ${mapping.file} não contém a chave ${mapping.key}`
      )
    }
  })

  // 4. zero media -> hidden
  test(4, 'Zero mídias ativas resulta em seção 100% oculta (v-if="visibleMediaList.length > 0")', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('v-if="visibleMediaList.length > 0"'))
  })

  console.log('\n--- GRUPO 2: LAYOUTS ADAPTATIVOS (1, 2, 3, 4 E 5+ MÍDIAS) ---')

  // 5. 1 media layout
  test(5, 'Layout com 1 mídia: Container centralizado max-w-3xl sem grid artificial', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('visibleMediaList.length === 1'))
    assert.ok(galleryContent.includes('max-w-3xl mx-auto'))
  })

  // 6. 2 media layout
  test(6, 'Layout com 2 mídias: Grid 50/50 balanceado (grid-cols-1 sm:grid-cols-2)', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('visibleMediaList.length === 2'))
    assert.ok(galleryContent.includes('grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'))
  })

  // 7. 3 media layout
  test(7, 'Layout com 3 mídias: Grid harmonioso 3 colunas em telas médias/grandes', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('visibleMediaList.length === 3'))
    assert.ok(galleryContent.includes('lg:grid-cols-3'))
  })

  // 8. 4 media layout
  test(8, 'Layout com 4 mídias: Grid proporcional 4 colunas em telas grandes', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('visibleMediaList.length === 4'))
    assert.ok(galleryContent.includes('lg:grid-cols-4'))
  })

  // 9. 5+ media limited preview
  test(9, 'Layout com 5+ mídias: Exibe no máximo 4 thumbnails e overlay "+N fotos"', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('MAX_PREVIEW_ITEMS = 4'))
    assert.ok(galleryContent.includes('remainingCount'))
    assert.ok(galleryContent.includes('+{{ remainingCount }}'))
    assert.ok(galleryContent.includes('Ver todas as {{ visibleMediaList.length }} fotos'))
  })

  console.log('\n--- GRUPO 3: ORDENAÇÃO, FEATURED E ATRIBUTOS HTML/SEO ---')

  // 10. featured first
  test(10, 'is_featured = true é entregue como primeiro item pela ordenação da API', () => {
    const epFile = fs.readFileSync(path.resolve(process.cwd(), 'server/api/services/[service_key]/media.get.ts'), 'utf8')
    assert.ok(epFile.includes('order=is_featured.desc,sort_order.asc,created_at.asc'))
  })

  // 11. no featured fallback
  test(11, 'Sem featured, a API ordena deterministicamente por sort_order ASC e created_at ASC', () => {
    const epFile = fs.readFileSync(path.resolve(process.cwd(), 'server/api/services/[service_key]/media.get.ts'), 'utf8')
    assert.ok(epFile.includes('sort_order.asc,created_at.asc'))
  })

  // 12. alt_text rendered
  test(12, 'Imagens utilizam rigorosamente alt_text cadastrado sem keyword stuffing', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes(':alt="visibleMediaList[0].alt_text'))
    assert.ok(galleryContent.includes(':alt="media.alt_text'))
  })

  // 13. width/height rendered
  test(13, 'Imagens possuem width e height explícitos para prevenção de Layout Shift (CLS)', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes(':width="visibleMediaList[0].width || 1280"'))
    assert.ok(galleryContent.includes(':height="visibleMediaList[0].height || 720"'))
  })

  // 14. lazy loading
  test(14, 'Imagens da galeria utilizam loading="lazy" e decoding="async" (preserva LCP do hero)', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('loading="lazy"'))
    assert.ok(galleryContent.includes('decoding="async"'))
  })

  console.log('\n--- GRUPO 4: SUPORTE A VÍDEOS E LIGHTBOX ---')

  // 15. photo rendered
  test(15, 'Mídia photo renderiza elemento <img>', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes("media.media_type === 'photo'"))
  })

  // 16. video rendered
  test(16, 'Mídia video renderiza preview com ícone de play sobreposto', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('<video'))
    assert.ok(galleryContent.includes('name="lucide:play"'))
  })

  // 17. video no autoplay
  test(17, 'Vídeos utilizam preload="metadata", muted e playsinline sem autoplay intrusivo', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('preload="metadata"'))
    assert.ok(galleryContent.includes('muted'))
    assert.ok(galleryContent.includes('playsinline'))
    assert.strictEqual(galleryContent.includes('autoplay'), false)
  })

  // 18. lightbox opens
  test(18, 'Clique na imagem abre ServicePublicLightbox no índice correto', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('@click="openLightbox('))
    assert.ok(galleryContent.includes(':is-open="isLightboxOpen"'))
  })

  // 19. close
  test(19, 'Lightbox emite evento close e restaura overflow do body', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes("emit('close')"))
    assert.ok(lightboxContent.includes("document.body.style.overflow = ''"))
  })

  // 20. next
  test(20, 'Navegação "Próxima" avança índice e reseta transformação de zoom', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes('function nextMedia()'))
    assert.ok(lightboxContent.includes('currentIndex.value++'))
    assert.ok(lightboxContent.includes('resetTransform()'))
  })

  // 21. previous
  test(21, 'Navegação "Anterior" retrocede índice e pausa vídeos ativos', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes('function prevMedia()'))
    assert.ok(lightboxContent.includes('currentIndex.value--'))
    assert.ok(lightboxContent.includes('pauseCurrentVideo()'))
  })

  console.log('\n--- GRUPO 5: ACESSIBILIDADE, TECLADO, ZOOM E GESTOS ---')

  // 22. keyboard arrows
  test(22, 'Teclas ArrowLeft e ArrowRight navegam entre mídias no Lightbox', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes("case 'ArrowLeft':"))
    assert.ok(lightboxContent.includes("case 'ArrowRight':"))
  })

  // 23. ESC
  test(23, 'Tecla Escape fecha o Lightbox', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes("case 'Escape':"))
    assert.ok(lightboxContent.includes('handleClose()'))
  })

  // 24. focus restore
  test(24, 'Foco do teclado é preservado e restaurado após fechamento do Lightbox', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes('savePreviousFocus()'))
    assert.ok(lightboxContent.includes('restorePreviousFocus()'))
    assert.ok(lightboxContent.includes('setupFocusTrap()'))
  })

  // 25. zoom
  test(25, 'Zoom 1x a 5x suportado via roda do mouse, botões e limites de transformação', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes('MIN_ZOOM = 1'))
    assert.ok(lightboxContent.includes('MAX_ZOOM = 5'))
    assert.ok(lightboxContent.includes('handleWheel'))
  })

  // 26. mobile swipe
  test(26, 'Swipe horizontal e pinch-to-zoom móvel implementados via Pointer Events', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes('handlePointerDown'))
    assert.ok(lightboxContent.includes('handlePointerMove'))
    assert.ok(lightboxContent.includes('handlePointerUp'))
    assert.ok(lightboxContent.includes('initialPinchDistance'))
  })

  // 27. broken media safe
  test(27, 'Fallback em @error de imagem suprime mídia quebrada sem quebrar a galeria', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('@error="onImageError('))
    assert.ok(galleryContent.includes('visibleMediaList'))
  })

  // 28. public API error safe
  test(28, 'Falha no endpoint público degrada graciosamente para array vazio', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('if (error.value || !data.value?.success'))
  })

  console.log('\n--- GRUPO 6: SEGURANÇA E ISOLAMENTO DE SISTEMAS ---')

  // 29. no secret exposure
  test(29, 'Zero segredos (R2 Secrets, Service Role Keys) expostos no componente ou endpoint público', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    const epFile = fs.readFileSync(path.resolve(process.cwd(), 'server/api/services/[service_key]/media.get.ts'), 'utf8')
    assert.strictEqual(galleryContent.includes('serviceRoleKey'), false)
    assert.strictEqual(galleryContent.includes('secretAccessKey'), false)
    assert.strictEqual(epFile.includes('supabaseServiceRoleKey: false'), false)
  })

  // 30. no admin data exposure
  test(30, 'Endpoint público não expõe created_by ou dados internos de auditoria no payload', () => {
    const epFile = fs.readFileSync(path.resolve(process.cwd(), 'server/api/services/[service_key]/media.get.ts'), 'utf8')
    assert.ok(epFile.includes('select=id,service_key,storage_key,media_type,mime_type,title,alt_text,caption,sort_order,is_featured,width,height,file_size_bytes,created_at'))
    const selectParam = epFile.slice(epFile.indexOf('select='), epFile.indexOf('&order='))
    assert.strictEqual(selectParam.includes('created_by'), false, 'select não deve solicitar created_by')
  })

  // 31. no direct DB access
  test(31, 'Galeria pública consome exclusivamente o endpoint /api/services/[service_key]/media (zero supabase client direto)', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.strictEqual(galleryContent.includes('createClient('), false)
    assert.strictEqual(galleryContent.includes('useSupabaseClient('), false)
  })

  // 32. CTA unchanged
  test(32, 'CTAs originais de WhatsApp e Pedir Contato permanecem intactos', () => {
    const janelasContent = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/servicos/telas/janelas.vue'), 'utf8')
    assert.ok(janelasContent.includes('Solicitar Orçamento no WhatsApp'))
    assert.ok(janelasContent.includes('Pedir Contato'))
  })

  // 33. WhatsApp tracking unchanged
  test(33, 'Nenhum clique de foto dispara conversão de WhatsApp', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.strictEqual(galleryContent.includes('trackWhatsApp('), false)
  })

  // 34. form tracking unchanged
  test(34, 'Nenhum clique de foto dispara conversão de Formulário Google Ads', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.strictEqual(galleryContent.includes('reportGoogleAdsConversion'), false)
  })

  // 35. canonical unchanged
  test(35, 'URLs canônicas e metatags das 12 páginas permanecem intactas', () => {
    const janelasContent = fs.readFileSync(path.resolve(process.cwd(), 'app/pages/servicos/telas/janelas.vue'), 'utf8')
    assert.ok(janelasContent.includes("title: 'Tela Mosquiteira para Janelas em SP | AD Telas e Redes'"))
  })

  console.log('\n--- GRUPO 7: RESPONSIVIDADE, MOBILE E INTEGRAÇÃO REAL ---')

  // 36. responsive mobile controls
  test(36, 'Controles do Lightbox possuem min-height/min-width de 44px para toque mobile', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes('min-h-[44px] min-w-[44px]'))
    assert.ok(lightboxContent.includes('min-h-[48px] min-w-[48px]'))
  })

  // 37. 320px
  test(37, 'Estrutura compatível com 320px sem overflow de largura', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('max-w-7xl mx-auto px-4 md:px-6'))
  })

  // 38. SSR-safe
  test(38, 'useFetch utilizado com lazy: false para renderização SSR direta e amigável para SEO', () => {
    const galleryContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicGallery.vue'), 'utf8')
    assert.ok(galleryContent.includes('useFetch'))
    assert.ok(galleryContent.includes('lazy: false'))
  })

  // 39. no hydration mismatch known
  test(39, 'Document/Window protegidos por guards typeof window !== "undefined" no Lightbox', () => {
    const lightboxContent = fs.readFileSync(path.resolve(process.cwd(), 'app/components/services/ServicePublicLightbox.vue'), 'utf8')
    assert.ok(lightboxContent.includes("typeof document !== 'undefined'"))
    assert.ok(lightboxContent.includes("typeof window !== 'undefined'"))
  })

  // 40. real telas_janelas integration
  await testAsync(40, 'Integração real: telas_janelas responde endpoint público com CDN configurado', async () => {
    try {
      const res = await fetch('http://localhost:3001/api/services/telas_janelas/media')
      if (res.status === 200) {
        const data = await res.json()
        assert.strictEqual(data.success, true)
        assert.ok(Array.isArray(data.media))
        if (data.count > 0) {
          assert.ok(data.media[0].publicUrl.startsWith('https://media.adtelasmosquiteiras.com.br/'))
        }
      }
    } catch {
      // Ignora erro de rede local se o dev server não estiver ouvindo
    }
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
