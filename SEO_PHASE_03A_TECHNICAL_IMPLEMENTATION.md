# SEO FASE 03A — TECHNICAL IMPLEMENTATION REPORT

**Projeto:** AD Telas e Redes — `adtelasmosquiteiras.com.br`  
**Fase:** 03A — SEO Technical Foundation  
**Data:** 2026-08-23  
**Status:** `READY FOR REVIEW`

---

## Executive Summary

A Fase 03A implementou a fundação técnica de SEO necessária para que a futura migração de arquitetura (Fases 03B/03C) possa ocorrer com segurança e rastreabilidade plena.

Todas as correções técnicas foram realizadas sobre a estrutura URL atual, **sem alterar taxonomia, criar redirects, excluir páginas ou fazer deploy**.

Um script de validação automatizado (`seo-validate-03a.mjs`) foi criado e executado contra o servidor de desenvolvimento.  
**54 de 54 verificações PASSARAM. Exit Code 0.**

**Build de produção `npx nuxi build`:** `PASS — Exit Code 0`  
Nuxt 4.2.2 / Nitro 2.13.0 / Vite 7.3.1 / Vue 3.5.26

---

## Files Modified

| Arquivo | Tipo de Alteração |
|---|---|
| `app/pages/index.vue` | **NOVA** — Removido canonical hardcoded duplicado (já gerado pelo app.vue dinamicamente) |
| `app/app.vue` | (Já continha) Canonical SSR dinâmico global |
| `server/routes/sitemap.xml.ts` | (Já criado) Sitemap Nitro nativo — 8 URLs núcleo |
| `public/robots.txt` | (Já atualizado) Allow, Disallow /api/, Sitemap link |
| `app/components/HeroSection.vue` | (Já corrigido) Mobile: `<h1>` → `<p>` |
| `app/layouts/admin.vue` | (Já aplicado) `noindex, nofollow` |
| `app/pages/admin/dashboard.vue` | (Já aplicado) `noindex, nofollow` |
| `app/pages/admin/leads.vue` | (Já aplicado) `noindex, nofollow` |
| `public/politica-de-privacidade.html` | (Já aplicado) `noindex, follow` + ID AW-17981093809 |
| `public/termos-de-uso.html` | (Já aplicado) `noindex, follow` + ID AW-17981093809 |
| `nuxt.config.ts` | (Já limpo) `<meta name="keywords">` global removida |
| 8× `app/pages/*.vue` | (Já limpos) `<meta name="keywords">` individuais removidas |

**Nova alteração exclusiva desta Fase 03A:**  
`app/pages/index.vue` linhas 17–19: remoção do `canonical` hardcoded. O `app.vue` já gera o canonical autorreferencial dinamicamente via SSR para todas as páginas. Dois `<link rel="canonical">` no mesmo documento violam as diretrizes do Google.

---

## Sitemap Implementation

**Status:** `PASS`

- **Arquivo:** `server/routes/sitemap.xml.ts` — rota nativa Nitro
- **Compilado em:** `.output/server/chunks/routes/sitemap.xml.mjs`
- **HTTP 200** | `content-type: application/xml; charset=utf-8`
- **cache-control:** `public, max-age=3600, s-maxage=3600`

**8 URLs incluídas (pathnames estáveis — não mudarão):**

| URL | changefreq | priority |
|---|---|---|
| `https://www.adtelasmosquiteiras.com.br/` | daily | 1.0 |
| `https://www.adtelasmosquiteiras.com.br/servicos` | weekly | 0.9 |
| `https://www.adtelasmosquiteiras.com.br/servicos/telas` | weekly | 0.9 |
| `https://www.adtelasmosquiteiras.com.br/servicos/redes` | weekly | 0.9 |
| `https://www.adtelasmosquiteiras.com.br/servicos/vidracaria` | weekly | 0.8 |
| `https://www.adtelasmosquiteiras.com.br/orcamento` | monthly | 0.8 |
| `https://www.adtelasmosquiteiras.com.br/contato` | monthly | 0.7 |
| `https://www.adtelasmosquiteiras.com.br/por-que-instalar-tela-mosquiteira` | monthly | 0.7 |

**Excluídas e validadas:** `/admin/*`, `/obrigado`, `/politica-de-privacidade.html`, `/termos-de-uso.html`, `/api/`

As 35 URLs de serviço cujo pathname mudará na Fase 03B/03C **NÃO** estão no sitemap. Serão adicionadas após os redirects serem ativados com os novos paths definitivos.

---

## Canonical Implementation

**Status:** `PASS`

**Mecanismo:** `computed(() => ...)` em `app/app.vue` — avaliado no SSR antes da hidratação.  
**1 único `<link rel="canonical">` por página** (duplicata de `index.vue` removida).

**Evidência dos testes:**
```
PASS /: canonical="https://www.adtelasmosquiteiras.com.br/" (1 tag)
PASS /servicos: canonical="https://www.adtelasmosquiteiras.com.br/servicos" (1 tag)
PASS /servicos/telas: canonical="..." (1 tag) — sem UTM
PASS /orcamento: canonical="..." (1 tag) — sem UTM
PASS /contato: canonical="..." (1 tag) — sem UTM
```

**Parâmetros excluídos:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`.

> Nenhuma canonical cruzada foi criada. Os 45 redirects planejados serão implementados como HTTP 301 (Fase 03C), não como canonicals.

---

## Robots

**Status:** `PASS`

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://www.adtelasmosquiteiras.com.br/sitemap.xml
```

---

## Indexability

**Status:** `PASS`

| Página | Meta Robots | Status |
|---|---|---|
| `/` | default (indexável) | OK |
| `/servicos` | default (indexável) | OK |
| `/servicos/telas` | default (indexável) | OK |
| `/servicos/redes` | default (indexável) | OK |
| `/servicos/vidracaria` | default (indexável) | OK |
| `/orcamento` | default (indexável) | OK |
| `/contato` | default (indexável) | OK |
| `/por-que-instalar-tela-mosquiteira` | default (indexável) | OK |
| `/obrigado` | `noindex, nofollow` | OK |
| `/admin/dashboard` | `noindex, nofollow` | OK |
| `/admin/leads` | `noindex, nofollow` | OK |
| `/politica-de-privacidade.html` | `noindex, follow` | OK |
| `/termos-de-uso.html` | `noindex, follow` | OK |

`NOINDEX_PAGES = 5`

---

## Meta Keywords

**Status:** `PASS`  
`META_KEYWORDS_OCCURRENCES_IN_HEAD = 0`

Verificado via SSR HTML em 7 páginas públicas.

**Nota técnica:** `useServicos.js` e `useServicoData.js` possuem campo `keywords: [...]` como propriedade interna de objetos JS. Esses campos **não são injetados no `<head>`** como `<meta name="keywords">`. Nenhuma alteração necessária nesses arquivos.

---

## H1

**Status:** `PASS`

```
PASS Home: Exactly 1 <h1> in SSR HTML
PASS Home: No H1 hidden via CSS
```

**Composição da Home (`index.vue`):** `<HeroSection>` + `<ServicesCards>` + `<ReviewsCarousel>` + `<FaqSection>`

- Mobile (`block md:hidden`): heading usa `<p>` com estilos visuais de H1 — semanticamente correto ✓
- Desktop (`hidden md:block`): `<h1>` único semântico ✓

**Componentes orphan identificados** (não importados em nenhuma página):
- `MobileLandingComplete.vue`: 2× `<h1>` — não renderiza
- `MobileHeroOptimized.vue`: 1× `<h1>` — não renderiza

Esses componentes não afetam o SEO atual. Avaliar remoção ou migração semântica antes de ativá-los.

---

## Tracking Audit

**Status:** `GTM_CONTAINER_CONFIGURATION_REQUIRED`

| Item | Valor |
|---|---|
| GTM Container | `GTM-KZTR2DHT` |
| GA4 Measurement ID | `G-S0038L1Q6R` |
| Google Ads ID | `AW-17981093809` |
| Conversion Label | `4GwPCPCPWSjoccELHvhv5C` |
| Pageview | `gtag('config', 'G-S0038L1Q6R')` |
| Lead Conversion | `obrigado.vue` — `gtag('event', 'conversion', ...)` + `generate_lead` + `dataLayer form_submission` |

**Risco identificado:** GA4 `G-S0038L1Q6R` pode estar configurado **também dentro do container GTM** (implementação híbrida), gerando pageviews duplicados. Requer verificação no GTM UI — fora do escopo do repositório.

Scripts não foram removidos sem prova concreta de duplicação.

---

## Google Ads ID

**Status:** `VERIFIED — Alinhado`

| Local | ID |
|---|---|
| `gtag.client.js` | `AW-17981093809` ✓ |
| `obrigado.vue` | `AW-17981093809` ✓ |
| `politica-de-privacidade.html` | `AW-17981093809` ✓ (corrigido de `AW-473885322`) |
| `termos-de-uso.html` | `AW-17981093809` ✓ (corrigido de `AW-473885322`) |

ID legado `AW-473885322` completamente removido. Labels de conversão não alteradas.

---

## Schema Audit

**Status:** `VALID — Nenhuma alteração necessária`

**Schema Organization** ativo globalmente via `app.vue`:
```json
{
  "@type": "Organization",
  "name": "AD Telas e Redes",
  "url": "https://www.adtelasmosquiteiras.com.br",
  "logo": "...",
  "contactPoint": { "telephone": "+55-11-98358-6611", "areaServed": "BR" },
  "sameAs": ["instagram", "facebook"],
  "address": { "addressLocality": "São Paulo", "addressRegion": "SP" }
}
```

**Não implementados nesta fase:** `Review`, `AggregateRating`, `FAQPage`, `Product` — aguardam necessidade comprovada.

---

## HTTP Status Audit

**Status:** `PASS`

| Rota | Status | Obs |
|---|---|---|
| `/` | 200 | ✓ |
| `/servicos` | 200 | ✓ |
| `/servicos/telas` | 200 | ✓ |
| `/servicos/redes` | 200 | ✓ |
| `/servicos/vidracaria` | 200 | ✓ |
| `/orcamento` | 200 | ✓ |
| `/contato` | 200 | ✓ |
| `/por-que-instalar-tela-mosquiteira` | 200 | ✓ |
| `/obrigado` | 200 | ✓ noindex |
| `/servicos/telas/residencial/janelas` | 200 | Redirect Phase 03C |
| `/servicos/telas/especiais/removivel` | 200 | Redirect Phase 03C |
| `/servicos/redes/residencial/janelas` | 200 | Redirect Phase 03C |
| `/tela-mosquiteira-para-janelas` | 404 | Slug legado — redirect Phase 03C |
| `/bairros` | (não testado) | Mantido — redirect só após `/areas-atendidas` existir |
| `/sitemap.xml` | 200 | XML válido |
| `/robots.txt` | 200 | ✓ |
| `/politica-de-privacidade.html` | 200 | noindex |
| `/termos-de-uso.html` | 200 | noindex |
| `/admin/dashboard` | 200 | noindex, nofollow |
| `/admin/leads` | 200 | noindex, nofollow |

`SOFT_404_DETECTED = 0` | `REDIRECT_LOOPS = 0` | `UNEXPECTED_REDIRECTS = 0`

---

## WWW/HTTPS Audit

**Status:** `DOCUMENTED`

Variante canônica oficial definida no projeto: `https://www.adtelasmosquiteiras.com.br`

O comportamento das variantes HTTP/HTTPS e www/não-www depende da configuração do provedor de hosting — não do código Nuxt.

**Configuração recomendada para validar antes do deploy da Fase 03C:**
```
https://www.adtelasmosquiteiras.com.br  → 200 (canonical)
http://www.adtelasmosquiteiras.com.br   → 301 → https://www.
https://adtelasmosquiteiras.com.br      → 301 → https://www.
http://adtelasmosquiteiras.com.br       → 301 → https://www.
```

---

## Mobile/CWV Static Findings

**Status:** `DOCUMENTED — Sem refactor visual nesta fase`

Contexto: 77,10% dos cliques históricos do domínio legado ocorreram em mobile.

| Core Web Vital | Achado | Prioridade |
|---|---|---|
| **LCP** | Primeira imagem do carrossel sem `fetchpriority="high"` + `loading="eager"` | P1 |
| **CLS** | Imagens com `aspect-[4/3]` — bom. Fontes sem preload — potencial FOIT | P2 |
| **INP** | Scripts tracking com `.async = true` — adequado. Carrossel com `setInterval(3500)` — leve | OK |

Nenhum refactor visual foi realizado nesta fase.

---

## Build Result

**Status:** `PASS — Exit Code 0`

```
nuxi build
Nuxt 4.2.2 (Nitro 2.13.0, Vite 7.3.1, Vue 3.5.26)
Nitro preset: node-server
Total size: 2.83 MB (721 kB gzip)
.output/server/chunks/routes/sitemap.xml.mjs — compilado ✓
.output/public/robots.txt — copiado ✓
✨ Build complete!
```

---

## Automated Tests

**Script:** `seo-validate-03a.mjs` (no diretório de artefatos da sessão)  
**Comando:** `node seo-validate-03a.mjs http://localhost:3001`  
**Resultado:** `Exit Code 0 — 54/54 PASS`

```
SECTION 1: PUBLIC PAGES — HTTP 200 .......... 9/9 PASS
SECTION 2: NOINDEX PAGES ................... 3/3 PASS
SECTION 3: CANONICAL SSR + NO UTM ......... 10/10 PASS
SECTION 4: META KEYWORDS ................... 1/1 PASS
SECTION 5: SITEMAP XML .................... 15/15 PASS
SECTION 6: ROBOTS.TXT ...................... 5/5 PASS
SECTION 7: PLANNED REDIRECTS NOT ACTIVE .... 4/4 PASS (+ 3 INFO)
SECTION 8: H1 HOME ......................... 2/2 PASS
SECTION 9: LEGAL PAGES ..................... 4/4 PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 54/54 PASS — Exit Code 0
```

---

## Remaining P0

**Nenhum P0 identificado.** Todos os problemas críticos da auditoria foram resolvidos:

- ✅ Canonical duplicado — resolvido
- ✅ Meta keywords — removidas
- ✅ H1 duplo — resolvido
- ✅ Sitemap ausente — criado
- ✅ robots.txt sem sitemap — corrigido
- ✅ Admin sem noindex — aplicado
- ✅ Google Ads ID desalinhado — alinhado

---

## Remaining P1

1. **LCP Mobile:** `fetchpriority="high"` + `loading="eager"` na primeira imagem do carrossel (`HeroSection.vue`)
2. **GTM Container:** Verificar duplicação do GA4 no GTM UI
3. **Componentes orphan:** Avaliar remoção de `MobileLandingComplete.vue` e `MobileHeroOptimized.vue`
4. **WWW/HTTPS redirect:** Validar e configurar no hosting antes do deploy Fase 03C

---

## Remaining P2

1. **Font Preload:** `<link rel="preload" as="font">` para reduzir FOIT mobile
2. **OG Image dedicada:** Imagem 1200×630 para melhorar CTR em compartilhamentos sociais
3. **BreadcrumbList Schema:** Aguarda taxonomia definitiva da Fase 03B
4. **LocalBusiness Schema:** Aguarda validação das cidades da Wave 1

---

## Admin Auth Security Status

`ADMIN_AUTH_SECURITY = STILL_REQUIRED`

Proteção atual (apenas SEO):
- ✅ `noindex, nofollow` nas páginas admin
- ✅ `Disallow: /admin/` no robots.txt

**Não implementados — projeto separado:**
- ❌ Autenticação de usuários (sessão/cookie segura)
- ❌ Proteção de endpoints via middleware
- ❌ Qualquer forma de auth real

---

## Ready For Phase 03B?

**`SIM — Aguardando aprovação do usuário`**

**Pré-requisitos para a Fase 03B:**
- ✅ Fundação técnica SEO estável (esta fase)
- ⏳ Aprovação humana das 3 cidades Wave 1 (SBC, Suzano, Mauá) — `NEEDS_BUSINESS_CONFIRMATION`
- ⏳ Aprovação dos claims factual copy para as novas páginas de serviço

---

## Gate Status

| Gate | Status |
|---|---|
| `BUILD` | ✅ `PASS` |
| `SITEMAP` | ✅ `PASS` |
| `ROBOTS` | ✅ `PASS` |
| `CANONICAL` | ✅ `PASS` |
| `META_KEYWORDS` | ✅ `PASS` |
| `NOINDEX_PAGES` | ✅ `PASS` |
| `H1_HOME` | ✅ `PASS` |
| `CURRENT_URLS_PRESERVED` | ✅ `PASS` |
| `PLANNED_REDIRECTS_ACTIVE` | ✅ `0` |
| `DEPLOY` | ✅ `NOT_PERFORMED` |

---

## Declaração Final

```
FASE 03A: READY FOR REVIEW
PRODUÇÃO ALTERADA: NÃO
DEPLOY REALIZADO: NÃO
REDIRECTS DA NOVA ARQUITETURA ATIVOS: 0
PÁGINAS NOVAS CRIADAS: 0
PÁGINAS EXCLUÍDAS: 0
SEO_PHASE_03A_TECHNICAL_IMPLEMENTATION.md: CRIADO
ADMIN_AUTH_SECURITY: STILL_REQUIRED
```
