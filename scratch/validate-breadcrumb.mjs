import fetch from 'node-fetch'

const BASE_URL = process.argv[2] || 'http://localhost:3008'

const LANDINGS = [
  '/servicos/telas/janelas',
  '/servicos/telas/portas',
  '/servicos/telas/sacadas-e-varandas',
  '/servicos/telas/removivel',
  '/servicos/telas/pet-screen',
  '/servicos/telas/restaurantes',
  '/servicos/redes/janelas',
  '/servicos/redes/sacadas-e-varandas',
  '/servicos/redes/gatos-e-pets',
  '/servicos/redes/criancas',
  '/servicos/redes/escadas-e-mezaninos'
]

async function validateBreadcrumbs() {
  console.log(`Starting Breadcrumb Schema validation against ${BASE_URL}...\n`)
  let passed = 0
  let missingNameCount = 0
  let missingItemCount = 0
  let emptyItemsCount = 0

  for (const path of LANDINGS) {
    const url = `${BASE_URL}${path}`
    const res = await fetch(url)
    if (res.status !== 200) {
      console.error(`[FAIL] ${path} returned status ${res.status}`)
      continue
    }

    const html = await res.text()
    
    // Extract JSON-LD script tags
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
    let breadcrumbSchema = null

    for (const tag of jsonLdMatches) {
      const content = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
      try {
        const parsed = JSON.parse(content)
        if (parsed['@type'] === 'BreadcrumbList') {
          breadcrumbSchema = parsed
          break
        }
      } catch (e) {
        // ignore parse error for non-JSON-LD tags
      }
    }

    if (!breadcrumbSchema) {
      console.error(`[FAIL] ${path} missing BreadcrumbList JSON-LD schema`)
      continue
    }

    const elements = breadcrumbSchema.itemListElement
    if (!Array.isArray(elements) || elements.length === 0) {
      console.error(`[FAIL] ${path} has empty itemListElement`)
      emptyItemsCount++
      continue
    }

    let validPage = true
    elements.forEach((elem, index) => {
      if (!elem.name || typeof elem.name !== 'string' || elem.name.trim() === '') {
        console.error(`[FAIL] ${path} item position ${index + 1} is missing a valid 'name'`)
        missingNameCount++
        validPage = false
      }
      
      // Every item (especially intermediate ones) must have a valid item URL
      if (!elem.item || typeof elem.item !== 'string' || !elem.item.startsWith('https://www.adtelasmosquiteiras.com.br')) {
        console.error(`[FAIL] ${path} item position ${index + 1} is missing a valid canonical 'item' URL: ${elem.item}`)
        missingItemCount++
        validPage = false
      }
    })

    if (validPage) {
      passed++
      console.log(`[PASS] ${path} has valid BreadcrumbList (${elements.length} items):`)
      elements.forEach(el => console.log(`       P${el.position}: ${el.name} -> ${el.item}`))
    }
  }

  console.log(`\n====================================================`)
  console.log(`BREADCRUMB VALIDATION SUMMARY:`)
  console.log(`BREADCRUMB_STRUCTURED_DATA_VALID: ${passed}/${LANDINGS.length}`)
  console.log(`MISSING_BREADCRUMB_NAME: ${missingNameCount}`)
  console.log(`MISSING_INTERMEDIATE_BREADCRUMB_ITEM: ${missingItemCount}`)
  console.log(`EMPTY_BREADCRUMB_ITEMS: ${emptyItemsCount}`)
  console.log(`====================================================`)

  if (passed === LANDINGS.length && missingNameCount === 0 && missingItemCount === 0 && emptyItemsCount === 0) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}

validateBreadcrumbs().catch(e => {
  console.error(e)
  process.exit(1)
})
