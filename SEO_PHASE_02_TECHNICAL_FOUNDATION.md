# 🛡️ RELATÓRIO DE EXECUÇÃO — FASE 02: FUNDAÇÃO TÉCNICA DE SEO

> **Projeto:** AD Telas e Redes SP (`https://www.adtelasmosquiteiras.com.br/`)  
> **Data de Execução:** 23 de Agosto de 2026  
> **Status:** `FASE 02: READY FOR REVIEW`  
> **Regras de Segurança Estritas:** NENHUMA página de serviço excluída; NENHUM redirect 301 de serviço criado; NENHUMA alteração em banco/produção; NENHUM deploy ou push realizado.

---

## 1. Executive Summary

A Fase 02 executou com sucesso a implementação das correções técnicas essenciais e conservadoras de SEO e infraestrutura no repositório, preparando o terreno para a posterior reestruturação semântica sem colocar em risco o tráfego orgânico ou o histórico de indexação do domínio.

### Principais Entregas da Fase 02:
1. **Unificação Semântica do `<h1>` na Home (`index.vue` / `HeroSection.vue`)**: Eliminada a duplicação de `<h1>` no DOM do SSR (o cabeçalho mobile passou para elemento de texto estilizado, preservando 100% da identidade visual e responsividade, restando exatamente 1 tag `<h1>` no documento).
2. **Sitemap XML Nativo e Conservador (`server/routes/sitemap.xml.ts`)**: Criado endpoint nativo em Nitro entregando XML estruturado e atualizado com as 8 URLs canônicas núcleo da marca.
3. **Robots.txt Estruturado (`public/robots.txt`)**: Atualizado com diretivas conservadoras (`Allow: /`, `Disallow: /api/`, `Disallow: /admin/` e link oficial para o sitemap).
4. **Tags Canônicas SSR Dinâmicas (`app/app.vue`)**: Implementada tag `<link rel="canonical">` self-referencing calculada dinamicamente pelo pathname limpo no servidor, imune a parâmetros de rastreamento (`?utm_...`, `?gclid=...`, `?fbclid=...`).
5. **Eliminação Global de Meta Keywords**: 100% das tags `<meta name="keywords">` foram removidas do `<head>` em todas as páginas e composables.
6. **Proteção SEO de Rotas Privadas**: Adicionado `noindex, nofollow` em `/admin/dashboard`, `/admin/leads` e no layout `app/layouts/admin.vue`.
7. **Correção de Tags Google Ads nas Páginas Legais**: Atualizado o ID legado `AW-473885322` para o ID canônico `AW-17981093809` em `public/politica-de-privacidade.html` e `public/termos-de-uso.html`, além da injeção de `<meta name="robots" content="noindex, follow">`.
8. **Auditoria Forense de Claims, Reviews, GTM e YMYL**: Mapeamento completo de depoimentos hardcoded, afirmações publicitárias e alegações de saúde para validação humana.

---

## 2. Correção da Contagem de URLs

A auditoria anterior continha uma ambiguidade na categorização entre rotas renderizáveis e rotas tecnicamente indexáveis. Abaixo está a discriminação exata e programática do estado do servidor:

```
┌─────────────────────────────────────────────────────────────┬──────────┐
│ Categoria de Mapeamento de URLs                             │ Contagem │
├─────────────────────────────────────────────────────────────┼──────────┤
│ TOTAL_RENDERIZAVEL (Total de rotas públicas/privadas no app)│    57    │
│ TOTAL_HTTP_200 (Rotas que respondem HTTP 200 OK)            │    57    │
│ TOTAL_INDEXABLE_TECHNICALLY (Antes da Fase 02)              │    56    │
│ TOTAL_INDEXABLE_TECHNICALLY (Após Fase 02)                  │    52    │
│ TOTAL_NOINDEX (Antes da Fase 02: apenas /obrigado)          │     1    │
│ TOTAL_NOINDEX (Após Fase 02: /obrigado, /admin/*, legais)   │     5    │
│ TOTAL_AUTH_PROTECTED (Rotas com login/guarda de sessão)     │     0    │
│ TOTAL_REDIRECT (Redirecionamentos 301/302 ativos)           │     0    │
│ TOTAL_404 (Rotas não mapeadas/bairros legados)              │  Infinito│
│ TOTAL_DESIRED_IN_INDEX (URLs no Sitemap Canônico da Fase 02)│     8    │
└─────────────────────────────────────────────────────────────┴──────────┘
```

### Detalhamento das 57 Rotas Renderizáveis:
* **Home Page (1):** `/`
* **Páginas Estáticas Institucionais (4):** `/orcamento`, `/contato`, `/obrigado`, `/por-que-instalar-tela-mosquiteira`
* **Hubs de Serviço (4):** `/servicos`, `/servicos/redes`, `/servicos/telas`, `/servicos/vidracaria`
* **Slugs Legados de Serviço (2):** `/servicos/rede-protecao`, `/servicos/tela-mosquiteira`
* **Categorias Intermediárias (7):**
  * `/servicos/redes/residencial`
  * `/servicos/redes/pets`
  * `/servicos/redes/comercial`
  * `/servicos/telas/residencial`
  * `/servicos/telas/especiais`
  * `/servicos/telas/pet`
  * `/servicos/telas/comercial`
* **Páginas Individuais de Serviço (35):**
  * 17 serviços em `/servicos/redes/...`
  * 18 serviços em `/servicos/telas/...`
* **Páginas Administrativas (2):** `/admin/dashboard`, `/admin/leads` (Agora com `noindex, nofollow`)
* **Páginas Legais Estáticas (2):** `/politica-de-privacidade.html`, `/termos-de-uso.html` (Agora com `noindex, follow`)

---

## 3. Production Parity (Paridade Repositório vs Produção)

* **Status:** `PRODUCTION_PARITY: NÃO COMPROVADA`
* **Evidências Locais:**
  * **Branch Local:** `master`
  * **Commit Local:** `014d6dd` (sincronizado com `origin/master`)
  * **Status do Git:** Working tree limpa antes do início da Fase 02.
* **Justificativa da Não-Comprovação:** Como o assistente atua exclusivamente sobre o repositório local e não possui credenciais SSH/API para inspecionar o servidor de build e CDN de produção, não é possível atestar com 100% de certeza se o ambiente de produção está rodando o commit `014d6dd` ou se possui variáveis de ambiente divergentes. Todas as alterações foram mantidas estritamente locais.

---

## 4. Admin Security & SEO

* **Status:** `AUTH_IMPLEMENTATION_BLOCKED`
* **Auditoria de Infraestrutura de Autenticação:**
  * O pacote `@nuxtjs/supabase` ou `@supabase/supabase-js` **não está instalado** no `package.json`.
  * As rotas de API em `server/api/admin/` consultam o banco via REST utilizando diretamente `SUPABASE_SERVICE_ROLE_KEY`.
  * Não há tabela de usuários administrativos, cookies de sessão criptografados ou tela de `/admin/login`.
* **Ações Tomadas (Conforme Regras de Segurança):**
  1. **NÃO** foi criado Basic Auth inseguro nem credenciais hardcoded no frontend.
  2. Aplicada a diretiva `<meta name="robots" content="noindex, nofollow">` em:
     * [`app/pages/admin/dashboard.vue`](file:///d:/sicons/ADT/app/pages/admin/dashboard.vue)
     * [`app/pages/admin/leads.vue`](file:///d:/sicons/ADT/app/pages/admin/leads.vue)
     * [`app/layouts/admin.vue`](file:///d:/sicons/ADT/app/layouts/admin.vue)
  3. Adicionada a regra `Disallow: /admin/` no [`public/robots.txt`](file:///d:/sicons/ADT/public/robots.txt).
* **Requisitos para Implementação Futura de Autenticação:**
  * Instalar `@nuxtjs/supabase` ou configurar Supabase Auth com Magic Link / Email & Senha.
  * Criar rota `/admin/login` e middleware Nuxt `middleware/auth.ts` para validação de JWT server-side.

---

## 5. Robots.txt

O arquivo [`public/robots.txt`](file:///d:/sicons/ADT/public/robots.txt) foi atualizado para uma configuração padrão conservadora da indústria:

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://www.adtelasmosquiteiras.com.br/sitemap.xml
```

* **Função:** Permite o rastreamento público de todas as páginas comerciais, impede os crawlers de gastar orçamento de rastreamento (*crawl budget*) em endpoints técnicos `/api/`, sinaliza a privacidade de `/admin/` e aponta o caminho canônico do Sitemap.

---

## 6. Sitemap.xml

Criado o endpoint nativo Nitro em [`server/routes/sitemap.xml.ts`](file:///d:/sicons/ADT/server/routes/sitemap.xml.ts).

* **Header de Resposta:** `content-type: application/xml; charset=utf-8` e `cache-control: public, max-age=3600, s-maxage=3600`.
* **Estratégia Conservadora da Fase 02:** Inclui estritamente as **8 URLs núcleo** cuja intenção, valor comercial e estabilidade não estão em disputa:
  1. `https://www.adtelasmosquiteiras.com.br/` (Priority: 1.0)
  2. `https://www.adtelasmosquiteiras.com.br/servicos` (Priority: 0.9)
  3. `https://www.adtelasmosquiteiras.com.br/servicos/redes` (Priority: 0.9)
  4. `https://www.adtelasmosquiteiras.com.br/servicos/telas` (Priority: 0.9)
  5. `https://www.adtelasmosquiteiras.com.br/servicos/vidracaria` (Priority: 0.8)
  6. `https://www.adtelasmosquiteiras.com.br/orcamento` (Priority: 0.8)
  7. `https://www.adtelasmosquiteiras.com.br/contato` (Priority: 0.7)
  8. `https://www.adtelasmosquiteiras.com.br/por-que-instalar-tela-mosquiteira` (Priority: 0.7)
* **URLs Excluídas do Sitemap:**
  * `/admin/*` e `/api/*`
  * `/obrigado`
  * Páginas com potencial de thin content (35 serviços e 7 categorias) até análise de Search Console na Fase 03.

---

## 7. Canonicals (Tags Canônicas SSR)

Implementado no [`app/app.vue`](file:///d:/sicons/ADT/app/app.vue) o cálculo dinâmico da tag canônica self-referencing executado durante o SSR:

```typescript
const route = useRoute()
const canonicalUrl = computed(() => {
  const cleanPath = route.path === '/' ? '' : route.path.replace(/\/$/, '')
  return `https://www.adtelasmosquiteiras.com.br${cleanPath || '/'}`
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: () => canonicalUrl.value
    }
  ]
})
```

* **Comportamento Validado:** Qualquer URL acessada com parâmetros de tracking (ex: `/servicos/telas?utm_source=google&gclid=abc`) entrega no HTML puro do servidor a canonical limpa `https://www.adtelasmosquiteiras.com.br/servicos/telas`.

---

## 8. Meta Keywords Removal (Remoção Global)

Foram removidas 100% das ocorrências de `<meta name="keywords">` dos seguintes arquivos:
1. `nuxt.config.ts` (Meta global)
2. `app/pages/contato.vue`
3. `app/pages/orcamento.vue`
4. `app/pages/por-que-instalar-tela-mosquiteira.vue`
5. `app/pages/servicos/index.vue`
6. `app/pages/servicos/[slug].vue`
7. `app/pages/servicos/[familia]/index.vue`
8. `app/pages/servicos/[familia]/[categoria]/index.vue`
9. `app/pages/servicos/[familia]/[categoria]/[servico].vue`

* **Resultado da Busca:** 0 ocorrências de `name: 'keywords'` destinadas ao `<head>` no projeto.

---

## 9. Google Ads ID nas Páginas Legais

* **Correção em `public/politica-de-privacidade.html`:**
  * Substituído `AW-473885322` por `AW-17981093809`.
  * Adicionado `<meta name="robots" content="noindex, follow">`.
* **Correção em `public/termos-de-uso.html`:**
  * Substituído `AW-473885322` por `AW-17981093809`.
  * Adicionado `<meta name="robots" content="noindex, follow">`.

---

## 10. Auditoria de Rastreamento (GTM + gtag.js)

* **Status:** `GTM_CONTAINER_CONFIGURATION_REQUIRED`
* **Mapeamento de Scripts no Código:**
  * `app/plugins/gtm.client.js` injeta `https://www.googletagmanager.com/gtm.js?id=GTM-KZTR2DHT`.
  * `app/plugins/gtag.client.js` injeta `https://www.googletagmanager.com/gtag/js?id=G-S0038L1Q6R` e inicializa `G-S0038L1Q6R` (GA4) e `AW-17981093809` (Google Ads).
  * `app/plugins/track-clicks.client.ts` escuta cliques e grava no Supabase via `/api/track-click`.
  * `app/plugins/track-visits.client.ts` grava pageviews no Supabase via `/api/track-visit`.
* **Ações Necessárias de Verificação no Painel do Google Tag Manager:**
  1. Acessar o container `GTM-KZTR2DHT` no [Google Tag Manager](https://tagmanager.google.com/).
  2. Verificar se existe alguma tag do tipo **Google Analytics: Configuração do GA4** com acionador *All Pages* ou *Initialization*. Se existir, desativá-la no GTM para evitar pageview duplicado, pois o plugin `gtag.client.js` já executa `gtag('config', 'G-S0038L1Q6R')`.
  3. Verificar se tags de conversão do Google Ads no GTM usam a mesma conta `AW-17981093809`.

---

## 11. Auditoria de H1 na Home (`index.vue`)

* **Problema Identificado:** Em [`app/components/HeroSection.vue`](file:///d:/sicons/ADT/app/components/HeroSection.vue), o bloco mobile continha `<h1 class="text-[28px]...">Telas Mosquiteiras em São Paulo</h1>` e o bloco desktop continha `<h1 class="text-4xl...">Telas Mosquiteiras em São Paulo</h1>`. Ambas eram renderizadas no HTML SSR.
* **Correção Executada:**
  * A tag do bloco mobile foi alterada para `<p class="text-[28px] leading-[1.15] font-bold text-white tracking-tight drop-shadow">`.
  * O bloco desktop permanece como o único `<h1>` semântico do documento.
* **Resultado:** **Exatamente 1 tag `<h1>`** presente no HTML renderizado pelo servidor na Home.

---

## 12. Páginas Legais

* **Arquivos:** [`public/politica-de-privacidade.html`](file:///d:/sicons/ADT/public/politica-de-privacidade.html) e [`public/termos-de-uso.html`](file:///d:/sicons/ADT/public/termos-de-uso.html).
* **Configuração:**
  * Ambas receberam `<meta name="robots" content="noindex, follow">`.
  * Ambas continuam 100% acessíveis via link no rodapé (`Footer.vue`) para conformidade jurídica e com o Google Ads.
  * Foram excluídas do `sitemap.xml`.

---

## 13. Auditoria de Afirmações Comerciais e Técnicas (Claims Audit)

Tabela completa para validação com o proprietário da empresa antes de qualquer alteração de copy:

| Claim / Afirmação | Arquivo(s) | Onde é Exibido | Fonte no Código | Status | Ação Necessária |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **"5.0 ★ (487 avaliações)"** | `HeroSection.vue`, `ReviewsCarousel.vue` | Hero Home e Seção Reviews | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Confirmar nota e volume no Google Business |
| **"+5 Mil Clientes"** | `HeroSection.vue` | Trust badges | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Confirmar número real de clientes atendidos |
| **"10+ Anos de experiência"** | `HeroSection.vue` | Trust badges | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Confirmar ano de fundação da empresa |
| **"Certificado INMETRO"** | `useServicos.js`, `redes.vue`, `useServicoData.js` | Cards de redes infantis e tabelas | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Obter laudo técnico do fabricante das redes |
| **"Resiste até 500kg / 500kg/m²"** | `useServicos.js`, `FaqSection.vue`, `ServicesCards.vue` | Destaques e FAQ | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Confirmar laudo de resistência de tração |
| **"Instalação em 24h / 48h"** | Metas, títulos, botões e badges | Em todas as páginas | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Validar capacidade operacional da equipe |
| **"Garantia de 2 Anos"** | Especificações técnicas e badges | Em todas as páginas | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Confirmar emissão de certificado de garantia |
| **"Normas da ANVISA"** | `useServicos.js` (telas restaurantes) | Especificação técnica | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Confirmar conformidade com RDC 216 |
| **"85% de Transparência / Visão 100% Clara"** | `useServicos.js`, `useServicoData.js` | Telas mosquiteiras | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Especificação técnica do tecido de fibra de vidro |
| **"Anti-Mofo / Antichamas"** | `useServicos.js` | Telas banheiros e especiais | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Especificação técnica do revestimento PVC |
| **"Medição 100% Gratuita"** | `orcamento.vue`, `vidracaria.vue` | FAQ e CTAs | Hardcoded | `HUMAN_VALIDATION_REQUIRED` | Confirmar se há custo para regiões periféricas |

---

## 14. Auditoria de Depoimentos (Reviews Audit)

* **Arquivo:** [`app/components/ReviewsCarousel.vue`](file:///d:/sicons/ADT/app/components/ReviewsCarousel.vue)
* **Estrutura:** 5 depoimentos estáticos armazenados no array `reviews` (nomes: *Ricardo Martins*, *Fernanda Oliveira*, *Carlos Eduardo*, *Juliana Costa*, *Marcelo Souza*).
* **Imagens de Perfil:** Arquivos locais `/images/avaliação1.png` a `5.png`.
* **Diagnóstico:** São depoimentos **hardcoded** inseridos manualmente no template. Não possuem integração via API ao vivo com o Google Places.
* **Classificação:** `HUMAN_VALIDATION_REQUIRED` (O proprietário deve confirmar se são avaliações reais de clientes extraídas do perfil do Google Meu Negócio da empresa).

---

## 15. Auditoria de Conteúdo de Saúde (YMYL Health Content Review)

* **Página Auditada:** [`app/pages/por-que-instalar-tela-mosquiteira.vue`](file:///d:/sicons/ADT/app/pages/por-que-instalar-tela-mosquiteira.vue)
* **Tema:** Arboviroses (Dengue, Zika, Chikungunya), mortalidade e riscos para gestantes e crianças.

| Afirmação no Código | Fonte Externa Citada | Link Real Existente? | Data da Fonte | Fonte Suporta a Frase? | Status |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **"Brasil registra mais de 5.000 mortes por dengue em 2024"** | Ministério da Saúde — Painel de Arboviroses | Sim (`gov.br/saude...`) | 2024 | **Sim**. Dado oficial epidemiológico. | Válido |
| **"Mais de 2.000 bebês nasceram com microcefalia por Zika"** | Ministério da Saúde — Zika Vírus | Sim (`gov.br/saude...`) | 2015–2024 | **Sim**. Dado consolidado do Ministério. | Válido |
| **"A tela mosquiteira é a barreira física mais eficaz dentro de casa"** | Destaque editorial da página | N/A | N/A | **Parcialmente**. O MS recomenda telas, mas o termo "mais eficaz" é editorial. | `YMYL_REVIEW_REQUIRED` |
| **"Uma tela pode ser a diferença entre gravidez saudável e tragédia"** | Destaque editorial da página | N/A | N/A | **Editorial/Comercial**. Frase de impacto de conversão. | `YMYL_REVIEW_REQUIRED` |
| **"A proteção com telas mosquiteiras é recomendada pelo Ministério da Saúde"** | Biblioteca Virtual em Saúde (BVSMS) | Sim (`bvsms.saude.gov.br...`) | 2024 | **Sim**. A BVSMS preconiza barreiras mecânicas em portas e janelas. | Válido |

---

## 16. Arquivos Modificados na Fase 02

1. [`app/components/HeroSection.vue`](file:///d:/sicons/ADT/app/components/HeroSection.vue) — Unificação semântica do `<h1>` na Home.
2. [`server/routes/sitemap.xml.ts`](file:///d:/sicons/ADT/server/routes/sitemap.xml.ts) — **NOVO ARQUIVO**: Endpoint nativo do sitemap XML das 8 páginas canônicas núcleo.
3. [`public/robots.txt`](file:///d:/sicons/ADT/public/robots.txt) — Diretivas conservadoras e sitemap.
4. [`app/app.vue`](file:///d:/sicons/ADT/app/app.vue) — Tag canônica SSR self-referencing.
5. [`nuxt.config.ts`](file:///d:/sicons/ADT/nuxt.config.ts) — Remoção global da meta tag keywords.
6. [`app/pages/contato.vue`](file:///d:/sicons/ADT/app/pages/contato.vue) — Remoção da meta tag keywords.
7. [`app/pages/orcamento.vue`](file:///d:/sicons/ADT/app/pages/orcamento.vue) — Remoção da meta tag keywords.
8. [`app/pages/por-que-instalar-tela-mosquiteira.vue`](file:///d:/sicons/ADT/app/pages/por-que-instalar-tela-mosquiteira.vue) — Remoção da meta tag keywords.
9. [`app/pages/servicos/index.vue`](file:///d:/sicons/ADT/app/pages/servicos/index.vue) — Remoção da meta tag keywords.
10. [`app/pages/servicos/[slug].vue`](file:///d:/sicons/ADT/app/pages/servicos/[slug].vue) — Remoção da meta tag keywords.
11. [`app/pages/servicos/[familia]/index.vue`](file:///d:/sicons/ADT/app/pages/servicos/[familia]/index.vue) — Remoção da meta tag keywords.
12. [`app/pages/servicos/[familia]/[categoria]/index.vue`](file:///d:/sicons/ADT/app/pages/servicos/[familia]/[categoria]/index.vue) — Remoção da meta tag keywords.
13. [`app/pages/servicos/[familia]/[categoria]/[servico].vue`](file:///d:/sicons/ADT/app/pages/servicos/[familia]/[categoria]/[servico].vue) — Remoção da meta tag keywords.
14. [`app/layouts/admin.vue`](file:///d:/sicons/ADT/app/layouts/admin.vue) — Injeção de `noindex, nofollow`.
15. [`app/pages/admin/dashboard.vue`](file:///d:/sicons/ADT/app/pages/admin/dashboard.vue) — Injeção de `noindex, nofollow`.
16. [`app/pages/admin/leads.vue`](file:///d:/sicons/ADT/app/pages/admin/leads.vue) — Injeção de `noindex, nofollow`.
17. [`public/politica-de-privacidade.html`](file:///d:/sicons/ADT/public/politica-de-privacidade.html) — Correção Google Ads ID e adição de `noindex, follow`.
18. [`public/termos-de-uso.html`](file:///d:/sicons/ADT/public/termos-de-uso.html) — Correção Google Ads ID e adição de `noindex, follow`.

---

## 17. Testes Executados e Resultados

* **Build de Produção (`npx nuxi build`):** Executado com **Exit Code 0 (Sucesso Total)**.
* **Validação do Módulo de Sitemap:** Compilado e verificado via Node sem falhas.
* **Validação de Zero Keywords no `<head>`:** 0 tags `<meta name="keywords">` restantes.
* **Validação de Canonical SSR:** Computed dinâmico via `useHead` funcional.
* **Validação de H1 Único na Home:** 1 único elemento `<h1>` semântico.
* **Validação de Integridade de Rotas de Serviço:** Todas as 35 páginas de serviço permanecem acessíveis e funcionais.

---

## 18. Remaining Blockers & Próximos Passos (Fase 03)

### Blockers Ativos:
1. **Dados do Google Search Console:** Aguardando exportação dos últimos 16 meses para definir se as 35 páginas de serviço têm buscas/cliques ou se devem ser consolidadas nos 2 Hubs principais.
2. **Autenticação Real do Admin:** Necessita instalação de módulo de autenticação antes de expor o CRM a múltiplos operadores.
3. **Validação Humana dos Claims e Reviews:** Confirmação dos laudos do INMETRO, 500kg e avaliações do Google Meu Negócio.
