# SEO FASE 03C — MIGRAÇÃO CONTROLADA DE URLS E ATIVAÇÃO DA ARQUITETURA DEFINITIVA

**Projeto:** AD Telas e Redes — `adtelasmosquiteiras.com.br`  
**Fase:** 03C — Migração Controlada de URLs  
**Data:** 2026-08-23  
**Status:** `READY FOR REVIEW`

---

## 1. Executive Summary

A Fase 03C ativou localmente, de forma atômica e centralizada, a **nova arquitetura de URLs e o plano de redirecionamento 301 definitivo** do projeto AD Telas e Redes.

Principais realizações:
- **45 Origens de Redirect 301 Ativas:** Todas as 44 rotas legadas renderizáveis + 1 rota `/bairros` redirecionadas diretamente com HTTP 301 para seus destinos canônicos finais (`REDIRECTS_301_PASS = 45/45`).
- **Zero Cadeias ou Loops:** Nenhuma URL antiga passa por múltiplos saltos (`REDIRECT_CHAIN_COUNT = 0`, `REDIRECT_LOOP_COUNT = 0`).
- **Troca Atômica do Sitemap:** Sitemap XML atualizado para conter exatamente as **20 URLs canônicas indexáveis** da nova taxonomia (`SITEMAP_URL_COUNT = 20`).
- **Auditoria de Links Internos:** Links navegáveis do projeto auditados para garantir que nenhum aponte para URLs redirecionadas (`INTERNAL_LINKS_TO_REDIRECTED_URLS = 0`, `BROKEN_INTERNAL_LINKS = 0`).
- **Classificação Factual Atualizada:**
  - `OWNER_CONFIRMED`: Claims comerciais/operacionais confirmados pelo proprietário (Garantia 2 anos, atendimento sob medida, +5 mil clientes, 10+ anos de experiência).
  - `OWNER_CONFIRMED_EXTERNAL_DYNAMIC_DATA`: Métrica pública de avaliação do Google Business (5.0 ★).
  - `TECHNICALLY_DOCUMENTED`: Claims de física de materiais e resistência mecânica (exigem laudo de laboratório/fabricante).
  - `UNSUPPORTED`: Promessas absolutas (*"100% seguro"*), neutralizadas para linguagem responsável.
- **Preservação de Fontes Legadas:** Arquivos de origem legados mantidos intactos no repositório para viabilizar rollback instantâneo (`REDIRECT FIRST, LEGACY SOURCE CLEANUP LATER`).
- **Validação no Output de Produção Nitro:** Testes automatizados executados contra o build compilado de produção (`248/248 PASS`).
- **Segurança de Produção e Deploy:** Nenhuma alteração foi promovida para a produção, DNS, Vercel ou Search Console (`PRODUÇÃO ALTERADA = NÃO`, `DEPLOY REALIZADO = NÃO`).

---

## 2. Redirect Implementation Mechanism

A estratégia de redirecionamento foi configurada de maneira dupla e redundante no servidor Nitro:
1. **Server Edge Level (`nitro.routeRules` em [`nuxt.config.ts`](file:///d:/sicons/ADT/nuxt.config.ts)):** Mapeamento nativo declarativo executado pela engine do Nitro antes do pipeline de renderização Nuxt.
2. **Nitro Server Middleware (`server/middleware/redirects.ts`):** Manipulador de requisição SSR com suporte à preservação dinâmica de query strings e sanitização de barras finais.

Ambos os mecanismos respondem com **HTTP 301 Permanent Redirect**, sem utilizar JavaScript client-side, `navigateTo` pós-renderização ou `meta refresh`.

---

## 3. Complete 45 Redirect Matrix (`COMPLETE_URL_MIGRATION_MAP`)

| # | SOURCE_URL | STATUS_ORIGEM | DESTINATION_URL | STATUS_DESTINO | CHAIN_LENGTH | RESULT |
| :-: | :--- | :---: | :--- | :---: | :---: | :---: |
| 1 | `/bairros` | 301 | `/areas-atendidas` | 200 | 1 | PASS |
| 2 | `/servicos/rede-protecao` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 3 | `/servicos/tela-mosquiteira` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 4 | `/servicos/redes/residencial` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 5 | `/servicos/redes/pets` | 301 | `/servicos/redes/gatos-e-pets` | 200 | 1 | PASS |
| 6 | `/servicos/redes/comercial` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 7 | `/servicos/telas/residencial` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 8 | `/servicos/telas/especiais` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 9 | `/servicos/telas/pet` | 301 | `/servicos/telas/pet-screen` | 200 | 1 | PASS |
| 10 | `/servicos/telas/comercial` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 11 | `/servicos/redes/residencial/janelas` | 301 | `/servicos/redes/janelas` | 200 | 1 | PASS |
| 12 | `/servicos/redes/residencial/sacadas` | 301 | `/servicos/redes/sacadas-e-varandas` | 200 | 1 | PASS |
| 13 | `/servicos/redes/residencial/varandas` | 301 | `/servicos/redes/sacadas-e-varandas` | 200 | 1 | PASS |
| 14 | `/servicos/redes/residencial/apartamentos` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 15 | `/servicos/redes/residencial/portas` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 16 | `/servicos/redes/residencial/escadas` | 301 | `/servicos/redes/escadas-e-mezaninos` | 200 | 1 | PASS |
| 17 | `/servicos/redes/residencial/basculantes` | 301 | `/servicos/redes/janelas` | 200 | 1 | PASS |
| 18 | `/servicos/redes/pets/criancas` | 301 | `/servicos/redes/criancas` | 200 | 1 | PASS |
| 19 | `/servicos/redes/pets/gatos` | 301 | `/servicos/redes/gatos-e-pets` | 200 | 1 | PASS |
| 20 | `/servicos/redes/pets/cachorros` | 301 | `/servicos/redes/gatos-e-pets` | 200 | 1 | PASS |
| 21 | `/servicos/redes/pets/animais` | 301 | `/servicos/redes/gatos-e-pets` | 200 | 1 | PASS |
| 22 | `/servicos/redes/pets/idosos` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 23 | `/servicos/redes/comercial/piscinas` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 24 | `/servicos/redes/comercial/telhados` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 25 | `/servicos/redes/comercial/portoes` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 26 | `/servicos/redes/comercial/muros` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 27 | `/servicos/redes/comercial/coberturas` | 301 | `/servicos/redes` | 200 | 1 | PASS |
| 28 | `/servicos/telas/residencial/janelas` | 301 | `/servicos/telas/janelas` | 200 | 1 | PASS |
| 29 | `/servicos/telas/residencial/portas` | 301 | `/servicos/telas/portas` | 200 | 1 | PASS |
| 30 | `/servicos/telas/residencial/varandas` | 301 | `/servicos/telas/sacadas-e-varandas` | 200 | 1 | PASS |
| 31 | `/servicos/telas/residencial/sacadas` | 301 | `/servicos/telas/sacadas-e-varandas` | 200 | 1 | PASS |
| 32 | `/servicos/telas/residencial/apartamentos` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 33 | `/servicos/telas/residencial/banheiro` | 301 | `/servicos/telas/janelas` | 200 | 1 | PASS |
| 34 | `/servicos/telas/especiais/correr` | 301 | `/servicos/telas/janelas` | 200 | 1 | PASS |
| 35 | `/servicos/telas/especiais/pivotante` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 36 | `/servicos/telas/especiais/removivel` | 301 | `/servicos/telas/removivel` | 200 | 1 | PASS |
| 37 | `/servicos/telas/especiais/basculante` | 301 | `/servicos/telas/janelas` | 200 | 1 | PASS |
| 38 | `/servicos/telas/especiais/aluminio` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 39 | `/servicos/telas/especiais/acoinox` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 40 | `/servicos/telas/pet/pets` | 301 | `/servicos/telas/pet-screen` | 200 | 1 | PASS |
| 41 | `/servicos/telas/pet/pernilongos` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 42 | `/servicos/telas/comercial/fachadas` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 43 | `/servicos/telas/comercial/coberturas` | 301 | `/servicos/telas` | 200 | 1 | PASS |
| 44 | `/servicos/telas/comercial/restaurantes` | 301 | `/servicos/telas/restaurantes` | 200 | 1 | PASS |
| 45 | `/servicos/telas/comercial/industrias` | 301 | `/servicos/telas` | 200 | 1 | PASS |

`TOTAL_REDIRECT_SOURCES = 45`  
`REDIRECTS_301_PASS = 45/45`

---

## 4. Destination Validation Matrix (`BASE_INDEXABLE = 20`)

| # | CANONICAL_URL | HTTP | CANONICAL TAG | H1 COUNT | INDEXABLE |
| :-: | :--- | :---: | :--- | :---: | :---: |
| 1 | `/` | 200 | `https://www.adtelasmosquiteiras.com.br/` | 1 | TRUE |
| 2 | `/orcamento` | 200 | `https://www.adtelasmosquiteiras.com.br/orcamento` | 1 | TRUE |
| 3 | `/contato` | 200 | `https://www.adtelasmosquiteiras.com.br/contato` | 1 | TRUE |
| 4 | `/por-que-instalar-tela-mosquiteira` | 200 | `https://www.adtelasmosquiteiras.com.br/por-que-instalar-tela-mosquiteira` | 1 | TRUE |
| 5 | `/servicos` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos` | 1 | TRUE |
| 6 | `/servicos/vidracaria` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/vidracaria` | 1 | TRUE |
| 7 | `/servicos/telas` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/telas` | 1 | TRUE |
| 8 | `/servicos/telas/janelas` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/janelas` | 1 | TRUE |
| 9 | `/servicos/telas/portas` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/portas` | 1 | TRUE |
| 10 | `/servicos/telas/sacadas-e-varandas` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/sacadas-e-varandas` | 1 | TRUE |
| 11 | `/servicos/telas/removivel` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/removivel` | 1 | TRUE |
| 12 | `/servicos/telas/pet-screen` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/pet-screen` | 1 | TRUE |
| 13 | `/servicos/telas/restaurantes` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/restaurantes` | 1 | TRUE |
| 14 | `/servicos/redes` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/redes` | 1 | TRUE |
| 15 | `/servicos/redes/janelas` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/redes/janelas` | 1 | TRUE |
| 16 | `/servicos/redes/sacadas-e-varandas` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/redes/sacadas-e-varandas` | 1 | TRUE |
| 17 | `/servicos/redes/gatos-e-pets` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/redes/gatos-e-pets` | 1 | TRUE |
| 18 | `/servicos/redes/criancas` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/redes/criancas` | 1 | TRUE |
| 19 | `/servicos/redes/escadas-e-mezaninos` | 200 | `https://www.adtelasmosquiteiras.com.br/servicos/redes/escadas-e-mezaninos` | 1 | TRUE |
| 20 | `/areas-atendidas` | 200 | `https://www.adtelasmosquiteiras.com.br/areas-atendidas` | 1 | TRUE |

`FINAL_URLS_HTTP_200 = 20/20`  
`FINAL_URLS_CANONICAL_PASS = 20/20`  
`FINAL_URLS_H1_PASS = 20/20`

---

## 5. Sitemap Migration

- **Arquivo Atualizado:** [`server/routes/sitemap.xml.ts`](file:///d:/sicons/ADT/server/routes/sitemap.xml.ts)
- **Quantidade de URLs:** `20` (anteriormente 8)
- **Sitemap Checks:**
  - `SITEMAP_URL_COUNT = 20`
  - `SITEMAP_REDIRECT_URLS = 0`
  - `SITEMAP_NOINDEX_URLS = 0`
  - `SITEMAP_404_URLS = 0`

---

## 6. Internal Link Migration & Breadcrumb Validation

- **Auditoria de Links Internos:** Varredura completa sobre menus, headers, footers, cards e breadcrumbs.
- `INTERNAL_LINKS_TO_REDIRECTED_URLS = 0`
- `BROKEN_INTERNAL_LINKS = 0`
- **Breadcrumb Structure:** Todas as 11 landings comerciais apontam para a hierarquia limpa (`Home` -> `Serviços` -> `Hub (Telas/Redes)` -> `Página`). Categorias descontinuadas (`/residencial`, `/especiais`, `/pets`, `/comercial`) foram removidas da rota navegável dos breadcrumbs.
- **Domain Fix:** [`Breadcrumb.vue`](file:///d:/sicons/ADT/app/components/Breadcrumb.vue) atualizado no schema.org para `https://www.adtelasmosquiteiras.com.br`.

---

## 7. Canonical & Legacy 404 Validation

- **Canonical SSR:** Cada destino entrega meta canonical autorreferencial dinâmica e limpa.
- **URLs Legadas de Bairro sem Equivalente (Soft 404 Prevention):**
  - Requisições para rotas antigas de bairro sem correspondência direta (`/tela-mosquiteira-em/moema`, `/rede-de-protecao-em/tatuape`) retornam **HTTP 404 real**, prevenindo Soft 404 e diluição de autoridade.
  - `LEGACY_NO_EQUIVALENT_404 = PASS`
  - `SOFT_404_STYLE_REDIRECTS = 0`

---

## 8. Query Parameter Redirect Tests

- **Teste com UTM:** `/servicos/telas/residencial/janelas?utm_source=google`
  - Resposta do Servidor: `301 Moved Permanently`
  - Header `Location`: `http://localhost:3007/servicos/telas/janelas?utm_source=google`
  - Renderização Final: HTTP 200
  - Tag Canonical na Página Final: `https://www.adtelasmosquiteiras.com.br/servicos/telas/janelas` (limpa, sem query string)

---

## 9. Redirect Chain & Loop Audit

- `REDIRECT_CHAIN_COUNT = 0` (100% dos 45 redirects atingem o destino 200 em 1 único salto)
- `REDIRECT_LOOP_COUNT = 0`

---

## 10. Noindex & Robots Regression Audit

- **Páginas Protegidas (Noindex Mantidos):**
  - `/obrigado` -> `noindex, follow`
  - `/admin/dashboard` -> `noindex, nofollow`
  - `/admin/leads` -> `noindex, nofollow`
  - `/politica-de-privacidade.html` -> `noindex, follow`
  - `/termos-de-uso.html` -> `noindex, follow`
- **Robots.txt:** Aponta para `https://www.adtelasmosquiteiras.com.br/sitemap.xml`.

---

## 11. Legacy Source Files Safe To Remove Later (`LEGACY_SOURCE_FILES_SAFE_TO_REMOVE_LATER`)

Para preservação da capacidade de rollback instantâneo nesta fase, os seguintes arquivos fonte legados foram mantidos no repositório, porém desativados das rotas públicas via redirects 301 do servidor:
- `app/pages/servicos/[familia]/[categoria]/[servico].vue`
- `app/pages/servicos/[familia]/[categoria]/index.vue`
- `app/pages/servicos/[familia]/index.vue`
- `app/pages/servicos/[slug].vue`

---

## 12. Production Build Result & Automated Test Result

- **Comando de Compilação:** `npx nuxi build` -> **Exit Code 0 (PASS)**
- **Servidor Nitro de Produção:** `node .output/server/index.mjs`
- **Suíte de Testes Automatizada (`seo-validate-03c.mjs`):** `248/248 PASS (100%)`

---

## 13. Remaining Risks, Deploy Readiness & Rollback Strategy

### Remaining Risks
- Nenhum risco técnico local identificado. Os 45 redirects e 20 URLs canônicas foram validados no servidor de produção Nitro.

### Deploy Readiness
- **Pronto para Revisão:** Todas as exigências da Fase 03C foram cumpridas localmente.
- **Deploy em Produção:** `NOT_PERFORMED` (Aguardando aprovação humana expressa).

### Rollback Strategy (Documentação)
Caso seja necessário reverter a Fase 03C localmente:
1. Remover a seção de redirects em `nitro.routeRules` de [`nuxt.config.ts`](file:///d:/sicons/ADT/nuxt.config.ts).
2. Remover o arquivo [`server/middleware/redirects.ts`](file:///d:/sicons/ADT/server/middleware/redirects.ts).
3. Reverter [`server/routes/sitemap.xml.ts`](file:///d:/sicons/ADT/server/routes/sitemap.xml.ts) para a lista de 8 URLs estáveis.
4. Executar `npx nuxi build`.

---

## 14. Gate Summary

| Gate | Resultado |
|---|---|
| `TOTAL_REDIRECT_SOURCES` | ✅ `45` |
| `REDIRECTS_301_PASS` | ✅ `45/45` |
| `REDIRECT_CHAIN_COUNT` | ✅ `0` |
| `REDIRECT_LOOP_COUNT` | ✅ `0` |
| `BASE_INDEXABLE` | ✅ `20` |
| `FINAL_URLS_HTTP_200` | ✅ `20/20` |
| `FINAL_URLS_CANONICAL_PASS` | ✅ `20/20` |
| `FINAL_URLS_H1_PASS` | ✅ `20/20` |
| `FINAL_URLS_NOINDEX_ERRORS` | ✅ `0` |
| `SITEMAP_URL_COUNT` | ✅ `20` |
| `SITEMAP_REDIRECT_URLS` | ✅ `0` |
| `SITEMAP_NOINDEX_URLS` | ✅ `0` |
| `SITEMAP_404_URLS` | ✅ `0` |
| `INTERNAL_LINKS_TO_REDIRECTED_URLS` | ✅ `0` |
| `BROKEN_INTERNAL_LINKS` | ✅ `0` |
| `LEGACY_NO_EQUIVALENT_404` | ✅ `PASS` |
| `NEW_LOCAL_CITY_URLS` | ✅ `0` |
| `BUILD` | ✅ `PASS (Exit Code 0)` |
| `PRODUCTION_SMOKE` | ✅ `PASS (248/248)` |
| `DEPLOY` | ✅ `NOT_PERFORMED` |
| `PRODUCTION_CHANGED` | ✅ `NO` |
| `ADMIN_AUTH_IMPLEMENTATION` | ✅ `DEFERRED_BY_USER` |

---

## Declaração Final

```
FASE 03C: READY FOR REVIEW
REDIRECTS 301: 45/45 PASS
REDIRECT CHAINS: 0
REDIRECT LOOPS: 0
FINAL INDEXABLE URLS: 20
SITEMAP URLS: 20
BROKEN INTERNAL LINKS: 0
NEW LOCAL CITY URLS: 0
PRODUÇÃO ALTERADA: NÃO
DEPLOY REALIZADO: NÃO
ADMIN AUTH ALTERADO: NÃO
SEO_PHASE_03C_URL_MIGRATION.md: CRIADO
```
