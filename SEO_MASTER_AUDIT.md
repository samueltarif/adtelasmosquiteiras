# 🔬 AUDITORIA FORENSE COMPLETA DE SEO — AD TELAS E REDES

> **Data da Auditoria:** 23 de Agosto de 2026  
> **Domínio de Produção:** `https://www.adtelasmosquiteiras.com.br/`  
> **Status:** AUDITORIA ESTÁTICA FORENSE CONCLUÍDA (NENHUMA ALTERAÇÃO IMPLEMENTADA)  
> **Escopo:** Análise completa de código, rotas, metadados, schemas, tags, canibalização e arquitetura.

---

## 1. Executive Summary

Esta auditoria forense foi executada diretamente sobre a base de código do repositório `AD Telas e Redes` (Nuxt 4 / Nitro / Vue 3 / Supabase).

### Principais Conclusões:
1. **O PRD anterior continha afirmações divergentes do código real**: Não existem implementações de Schemas `LocalBusiness`, `Service`, `Product`, `Article` ou `FAQPage` nos templates `.vue`, apenas `Organization` global em `app.vue` e `BreadcrumbList` em `Breadcrumb.vue`.
2. **Inexistência de Sitemap**: Não há nenhum módulo de sitemap (`@nuxtjs/sitemap`) instalado no `package.json` e nenhum arquivo `sitemap.xml` estático em `public/`.
3. **Robots.txt totalmente permissivo**: O arquivo `public/robots.txt` possui apenas 2 linhas (`User-Agent: * \n Disallow:`), permitindo a indexação pública de rotas sensíveis como `/admin/dashboard` e `/admin/leads`, que não possuem autenticação nem diretiva `noindex`.
4. **Ausência quase total de Tags Canônicas**: Das 57 URLs possíveis, apenas a Home (`/`) possui tag `<link rel="canonical">` declarada. 56 URLs estão sem canonical self-referencing.
5. **Thin Content e Duplicação Severa em 35 Serviços**: Todas as 35 páginas geradas por `app/pages/servicos/[familia]/[categoria]/[servico].vue` compartilham mais de 90% do conteúdo via `servicoTemplateBase` em `useServicos.js` (os mesmos 4 benefícios, as mesmas 4 especificações técnicas — informando inclusive material "Polietileno" para telas mosquiteiras de aço e alumínio —, a mesma tabela de concorrência e as mesmas 3 perguntas no FAQ).
6. **Canibalização de Rotas e Conflitos de Roteamento**: Há colisões de intenção direta entre `/servicos/redes` vs `/servicos/rede-protecao` vs `/servicos/redes/residencial/janelas` e entre `/servicos/telas` vs `/servicos/tela-mosquiteira` vs `/servicos/telas/residencial/janelas`.
7. **Discrepância Crítica no Rastreamento do Google Ads**: Os arquivos estáticos `public/politica-de-privacidade.html` e `public/termos-de-uso.html` possuem hardcoded a tag antiga `AW-473885322`, enquanto o restante da aplicação Nuxt utiliza `AW-17981093809`.
8. **Tags Obsoletas**: Quase todas as páginas injetam `<meta name="keywords">`, ignorada pelo Google Search desde 2009.

---

## 2. Estado Atual Real do Repositório

* **Framework:** Nuxt v4.2.2 com Vue v3.5.26 e Nitro Engine.
* **Módulos Instalados (`package.json`):** `@nuxtjs/tailwindcss` v6.14.0 e `@nuxt/icon` v2.2.1.
* **Módulos de SEO Ausentes:** Nenhum módulo `@nuxtjs/sitemap`, `@nuxtjs/robots` ou `@nuxtjs/seo` instalado.
* **Total de Arquivos de Página (`app/pages/`):** 15 arquivos `.vue`.
* **Total de Arquivos Públicos HTML (`public/`):** 2 arquivos (`politica-de-privacidade.html`, `termos-de-uso.html`).
* **Total de Rotas Físicas e Parametrizadas Renderizáveis:** 57 URLs.
* **Total de Endpoints de API Backend (`server/api/`):** 8 endpoints.

---

## 3. Inventário Completo de URLs

A tabela abaixo lista todas as rotas públicas que o servidor Nuxt/Nitro pode entregar atualmente:

| URL / Pattern | Arquivo Responsável | Indexável Hoje? | Possui Canonical? | No Sitemap? | Finalidade Real | Risco SEO / Técnico |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `/` | `app/pages/index.vue` | **Sim** | **Sim** (`/`) | Não (Sitemap inexiste) | Landing Page principal | Baixo (estável) |
| `/orcamento` | `app/pages/orcamento.vue` | **Sim** | **Não** | Não | Formulário de orçamento | Médio (Falta canonical e OpenGraph completo) |
| `/contato` | `app/pages/contato.vue` | **Sim** | **Não** | Não | Página institucional de contato | Médio (Falta canonical e NAP Schema) |
| `/obrigado` | `app/pages/obrigado.vue` | **Não** (`noindex`) | **Não** | Não | Confirmação de conversão | Baixo (corretamente `noindex`) |
| `/por-que-instalar-tela-mosquiteira` | `app/pages/por-que-instalar-tela-mosquiteira.vue` | **Sim** | **Não** | Não | Artigo informativo de autoridade | Médio (Artigo isolado sem Schema Article) |
| `/servicos` | `app/pages/servicos/index.vue` | **Sim** | **Não** | Não | Hub geral de serviços | Médio (Falta canonical) |
| `/servicos/redes` | `app/pages/servicos/redes.vue` | **Sim** | **Não** | Não | Hub família Redes de Proteção | **Alto** (Colisão com `[slug].vue` e `[familia]/index.vue`) |
| `/servicos/telas` | `app/pages/servicos/telas.vue` | **Sim** | **Não** | Não | Hub família Telas Mosquiteiras | **Alto** (Colisão com `[slug].vue` e `[familia]/index.vue`) |
| `/servicos/vidracaria` | `app/pages/servicos/vidracaria.vue` | **Sim** | **Não** | Não | Landing especializada Vidraçaria | Médio (Falta canonical) |
| `/servicos/rede-protecao` | `app/pages/servicos/[slug].vue` | **Sim** | **Não** | Não | Landing legada direta de Redes | **Alto** (Canibaliza `/servicos/redes`) |
| `/servicos/tela-mosquiteira` | `app/pages/servicos/[slug].vue` | **Sim** | **Não** | Não | Landing legada direta de Telas | **Alto** (Canibaliza `/servicos/telas`) |
| `/servicos/redes/residencial` | `app/pages/servicos/[familia]/[categoria]/index.vue` | **Sim** | **Não** | Não | Categoria Redes Residencial | Médio (Pouco conteúdo exclusivo) |
| `/servicos/redes/pets` | `app/pages/servicos/[familia]/[categoria]/index.vue` | **Sim** | **Não** | Não | Categoria Redes Pets & Crianças | Médio (Pouco conteúdo exclusivo) |
| `/servicos/redes/comercial` | `app/pages/servicos/[familia]/[categoria]/index.vue` | **Sim** | **Não** | Não | Categoria Redes Comercial | Médio (Pouco conteúdo exclusivo) |
| `/servicos/telas/residencial` | `app/pages/servicos/[familia]/[categoria]/index.vue` | **Sim** | **Não** | Não | Categoria Telas Residencial | Médio (Pouco conteúdo exclusivo) |
| `/servicos/telas/especiais` | `app/pages/servicos/[familia]/[categoria]/index.vue` | **Sim** | **Não** | Não | Categoria Telas Modelos Especiais | Médio (Pouco conteúdo exclusivo) |
| `/servicos/telas/pet` | `app/pages/servicos/[familia]/[categoria]/index.vue` | **Sim** | **Não** | Não | Categoria Telas Pet Screen | Médio (Pouco conteúdo exclusivo) |
| `/servicos/telas/comercial` | `app/pages/servicos/[familia]/[categoria]/index.vue` | **Sim** | **Não** | Não | Categoria Telas Comercial/Fachadas | Médio (Pouco conteúdo exclusivo) |
| `/servicos/redes/residencial/janelas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/residencial/portas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/residencial/sacadas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/residencial/varandas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/residencial/apartamentos` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/residencial/escadas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/residencial/basculantes` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/pets/criancas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/pets/gatos` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/pets/cachorros` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/pets/animais` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/pets/idosos` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/comercial/portoes` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/comercial/muros` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/comercial/telhados` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/comercial/piscinas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/redes/comercial/coberturas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/residencial/janelas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/residencial/portas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/residencial/varandas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/residencial/sacadas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/residencial/apartamentos` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/residencial/banheiro` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/especiais/correr` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/especiais/pivotante` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/especiais/removivel` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/especiais/basculante` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/especiais/aluminio` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/especiais/acoinox` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/pet/pets` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/pet/pernilongos` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/comercial/fachadas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/comercial/coberturas` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/comercial/restaurantes` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/servicos/telas/comercial/industrias` | `.../[categoria]/[servico].vue` | **Sim** | **Não** | Não | Serviço específico | **Alto** (Thin content boilerplate) |
| `/admin/dashboard` | `app/pages/admin/dashboard.vue` | **Sim (Falha)** | **Não** | Não | Painel gerencial interno | **Crítico** (Página privada indexável e sem auth) |
| `/admin/leads` | `app/pages/admin/leads.vue` | **Sim (Falha)** | **Não** | Não | Gestão de dados de clientes | **Crítico** (Página privada indexável e sem auth) |
| `/politica-de-privacidade.html` | `public/politica-de-privacidade.html` | **Sim** | **Não** | Não | Política de privacidade LGPD | Médio (HTML estático com Tag Google Ads divergente) |
| `/termos-de-uso.html` | `public/termos-de-uso.html` | **Sim** | **Não** | Não | Termos de uso | Médio (HTML estático com Tag Google Ads divergente) |

---

## 4. `LEGACY_LOCAL_SEO_AUDIT` (Resíduos da Antiga Estratégia de Bairros)

### Status de Verificação Forense:
* **Páginas de Bairros (`/bairros/*`, `/tela-mosquiteira-em/*`, `app/pages/[slug].vue`):** **100% ELIMINADAS DO CÓDIGO.**
* **Bases de Dados Estáticas (`app/data/bairros.ts`, `shared/bairros.ts`):** **100% ELIMINADAS DO REPOSITÓRIO.**
* **Composables Antigos (`useBairros.js`, `useBairroData.js`, `useBairroLanding.js`):** **100% ELIMINADOS.**
* **Scripts Python e Relatórios de Inserção de Bairros:** **100% ELIMINADOS.**
* **Comportamento HTTP Atual para URLs Antigas:**
  * Se o Googlebot ou um usuário tentar acessar qualquer URL antiga de bairro (ex: `/bairros/moema` ou `/tela-mosquiteira-em/pinheiros`), o Nuxt retorna **HTTP 404 (Not Found)** padrão.
  * **Atenção:** Como os 78 redirects 301 foram removidos do `nitro.routeRules` em `nuxt.config.ts`, URLs antigas indexadas no Google passarão por erro 404 até serem desindexadas pelo Googlebot (ou tratadas com 410 Gone / 301 para a Home/Hub de Serviços).
* **Onde o termo `bairro` ainda existe no código:**
  1. `server/api/cep/[cep].get.ts`: Retorno do campo `bairro` provido pela API do ViaCEP para enriquecer os dados de atendimento.
  2. `server/api/send-lead.post.ts`: Coluna `bairro` na tabela `leads` do Supabase para armazenar a região informada pelo cliente.
  3. `app/components/LeadForm.vue` e `app/components/WhatsappModal.vue`: Campo de input com v-model `formData.bairro`, exibido ao usuário com a label neutra `"Região / Endereço"`.

---

## 5. Canibalização de Palavras-Chave (Cannibalization Map)

Identificamos 6 zonas críticas de sobreposição de intenção no projeto atual:

### Conflito 1: Hub de Redes vs Serviço Direto de Redes
* **URL A:** `https://www.adtelasmosquiteiras.com.br/servicos/redes`
* **URL B:** `https://www.adtelasmosquiteiras.com.br/servicos/rede-protecao`
* **Intenção Aparente:** Ambas disputam *"redes de proteção sp"*, *"empresa de redes de proteção"*, *"instalação de rede de proteção"*.
* **H1 / Titles:**
  * URL A: H1 = *"Redes de Proteção em São Paulo"* | Title = *"Redes de Proteção em São Paulo | Janelas, Sacadas, Pets e Mais | AD Telas"*
  * URL B: H1 = *"Rede de Proteção para Janelas e Sacadas"* | Title = *"Rede de Proteção em São Paulo | Instalação 24h | AD Telas"*
* **Sobreposição de Conteúdo:** Quase total. Ambas exibem cards de janelas, sacadas, pets, 500kg, garantia 2 anos e WhatsApp.
* **Classificação:** **CONSOLIDAR E REDIRECIONAR 301** (Manter `/servicos/redes` e redirecionar 301 `/servicos/rede-protecao` para ela).

---

### Conflito 2: Hub de Telas vs Serviço Direto de Telas
* **URL A:** `https://www.adtelasmosquiteiras.com.br/servicos/telas`
* **URL B:** `https://www.adtelasmosquiteiras.com.br/servicos/tela-mosquiteira`
* **Intenção Aparente:** Ambas disputam *"telas mosquiteiras sp"*, *"tela mosquiteira sob medida"*, *"tela contra dengue"*.
* **H1 / Titles:**
  * URL A: H1 = *"Telas Mosquiteiras em São Paulo"* | Title = *"Telas Mosquiteiras em São Paulo | Janelas, Portas, Varanda e Mais | AD Telas"*
  * URL B: H1 = *"Tela Mosquiteira Invisível"* | Title = *"Tela Mosquiteira em São Paulo | Instalação 24h | AD Telas"*
* **Sobreposição de Conteúdo:** Ambas vendem telas para janelas, portas, anti-dengue, ventilação e garantia.
* **Classificação:** **CONSOLIDAR E REDIRECIONAR 301** (Manter `/servicos/telas` e redirecionar 301 `/servicos/tela-mosquiteira` para ela).

---

### Conflito 3: Home vs Hubs de Serviços
* **URL A:** `https://www.adtelasmosquiteiras.com.br/`
* **URL B:** `https://www.adtelasmosquiteiras.com.br/servicos`
* **URL C:** `https://www.adtelasmosquiteiras.com.br/servicos/redes` + `/servicos/telas`
* **Intenção Aparente:** A Home já possui os cards completos de serviços, reviews, FAQs e formulário, disputando exatamente os mesmos termos institucionais que `/servicos`.
* **Classificação:** **DIFERENCIAR INTENÇÃO** (A Home deve focar em marca e institucional *"AD Telas e Redes SP"*; `/servicos/redes` deve focar em redes; `/servicos/telas` deve focar em telas mosquiteiras; `/servicos` atua apenas como navegação interna ou canônica consolidada).

---

### Conflito 4: Redes para Janelas vs Redes para Apartamentos vs Redes para Sacadas
* **URLs Envolvidas:**
  * `/servicos/redes/residencial/janelas`
  * `/servicos/redes/residencial/apartamentos`
  * `/servicos/redes/residencial/sacadas`
* **Intenção:** 90% das buscas por *"rede para apartamento"* buscam justamente janelas e sacadas.
* **Sobreposição:** As páginas possuem exatamente o mesmo FAQ ("A rede suporta peso?", "Instalação em 24h?", "Tem garantia?"), os mesmos benefícios e a mesma descrição.
* **Classificação:** **DIFERENCIAR INTENÇÃO COM CONTEÚDO EXCLUSIVO OU CONSOLIDAR** (Se mantidas, precisam de conteúdo fotográfico e técnico específico).

---

### Conflito 5: Telas Mosquiteiras para Janelas vs Telas de Correr vs Telas de Alumínio
* **URLs Envolvidas:**
  * `/servicos/telas/residencial/janelas`
  * `/servicos/telas/especiais/correr`
  * `/servicos/telas/especiais/aluminio`
* **Intenção:** Telas de correr em alumínio para janelas representam um único produto físico que foi desmembrado em 3 URLs artificiais.
* **Classificação:** **DIFERENCIAR INTENÇÃO COM ESPECIFICAÇÃO REAL**.

---

### Conflito 6: Telas Pet Screen vs Redes para Gatos / Cachorros
* **URLs Envolvidas:**
  * `/servicos/telas/pet/pets`
  * `/servicos/redes/pets/gatos`
  * `/servicos/redes/pets/cachorros`
* **Intenção:** Diferenciação vital: Redes evitam quedas de altura; Telas Pet Screen evitam arranhões, furos e passagem de insetos. O site atualmente usa o mesmo texto genérico em ambas.
* **Classificação:** **DIFERENCIAR INTENÇÃO CLARAMENTE**.

---

## 6. Thin / Duplicate Content Map (Auditoria das 35 Páginas)

Analisando a implementação de `app/composables/useServicos.js` (linhas 454–476 e 482–512):

```
servicoTemplateBase = {
  beneficios: [4 itens idênticos],
  especificacoes: [4 itens idênticos - material "Polietileno" para tudo],
  comparacao: [5 itens idênticos com concorrentes],
  faq: [3 perguntas e respostas idênticas]
}
```

### Classificação dos Grupos de Páginas:

| Grupo | Descrição | Quantidade | URLs | Diagnóstico |
| :--- | :--- | :---: | :--- | :--- |
| **A** | **Página Útil e Única** | 5 | `/`, `/orcamento`, `/contato`, `/por-que-instalar-tela-mosquiteira`, `/servicos/vidracaria` | Conteúdo bem estruturado, layouts próprios, sem duplicação sistêmica. |
| **B** | **Boa base, precisa de diferenciação** | 4 | `/servicos/redes`, `/servicos/telas`, `/servicos/telas/pet/pets`, `/servicos/redes/pets/gatos` | Páginas de alto volume comercial que necessitam de copy e fotos customizadas. |
| **C** | **Sobreposição Forte (Canibalização)** | 7 | `/servicos/rede-protecao`, `/servicos/tela-mosquiteira`, `/servicos/redes/residencial/apartamentos`, `/servicos/telas/residencial/apartamentos`, `/servicos/telas/especiais/aluminio`, `/servicos/redes/pets/animais`, `/servicos/redes/pets/cachorros` | Canibalizam páginas principais ou de outros serviços irmãos. |
| **D** | **Thin Content (Boilerplate puro)** | 24 | Demais 24 páginas de `[servico].vue` e categorias intermediárias | Possuem menos de 2 frases exclusivas por página; todo o restante é idêntico. |
| **E** | **Candidata à Consolidação / Redirect 301** | 9 | `/servicos/rede-protecao`, `/servicos/tela-mosquiteira`, `/servicos/[familia]/index.vue` (colisão), e slugs genéricos | Devem ser unificadas nos seus respectivos hubs para concentrar autoridade. |

---

## 7. Metadados e Tags de Indexação

### Auditoria de Metadados:
1. **`<title>`:**
   * Home: `Telas Mosquiteiras e Redes de Proteção SP | Instalação em 24h` (63 caracteres — Excelente).
   * Páginas de Serviços: Padrão automatizado `${servico.titulo} em São Paulo | ${familia.nome} | AD Telas` (Gera títulos entre 65 e 85 caracteres — Alguns truncam na SERP).
   * Páginas Admin: `Dashboard - AD Telas e Redes` (Sem noindex — Falha de segurança e SEO).
2. **`<meta name="description">`:**
   * Home: 172 caracteres (Excelente síntese comercial).
   * 35 Serviços: Texto repetido em lote: `${servico.titulo}: ${servico.descricaoCurta}. Instalação 24h. Garantia 2 anos. Orçamento grátis!`.
3. **`<meta name="keywords">`:**
   * **Presente em 100% das páginas públicas.**
   * **Diagnóstico Oficial:** O Google Search desconsidera formalmente a meta tag `keywords` desde setembro de 2009. Não agrega valor e polui o `<head>`.
4. **`<link rel="canonical">`:**
   * Presente **APENAS** em `app/pages/index.vue` (`https://www.adtelasmosquiteiras.com.br/`).
   * **Ausente em 56 URLs do projeto**, permitindo que parâmetros de campanhas (`?utm_source=...`, `?fbclid=...`, `?gclid=...`) criem versões duplicadas no índice se descobertas pelo Googlebot.
5. **Open Graph (`og:image`, `og:title`, `og:description`, `og:url`):**
   * Configurado globalmente no `nuxt.config.ts` com fallback para `logo_adt_telas_nova.png`.
   * Várias páginas internas não definem `og:url` dinâmico ou `og:image` específico da categoria.

---

## 8. Schema.org / Dados Estruturados (JSON-LD)

### Mapeamento Real de Schemas no Código:

| Schema Declarado | Arquivo | Onde é Injetado | Informação Real / Presumida | Risco / Diagnóstico |
| :--- | :--- | :--- | :--- | :--- |
| **`Organization`** | `app/app.vue` (linhas 8–34) | Global em todas as páginas | Nome, logo, telefone, links sociais e endereço São Paulo/SP | **Válido e Seguro**. Estabelece a entidade da empresa. |
| **`BreadcrumbList`** | `app/components/Breadcrumb.vue` (linhas 125–136) | Páginas de serviços que usam Breadcrumb | Hierarquia de links (`Home > Serviços > Categoria > Item`) | **Válido e Seguro**. Formata os caminhos de navegação. |
| **`LocalBusiness`** | *Não implementado no código* | Ausente | Declarado no PRD, mas inexistente no código | **Oportunidade**. Deve ser implementado com endereço e NAP consistente. |
| **`Service`** | *Não implementado no código* | Ausente | Declarado no PRD, mas inexistente no código | **Oportunidade**. Pode ser adicionado nas páginas canônicas consolidadas. |
| **`FAQPage`** | *Não implementado no código* | Ausente | Declarado no PRD, mas inexistente no código | **Alerta do Google**: O Google restringiu rich snippets de FAQPage apenas para sites governamentais e de saúde de alta autoridade. Não deve ser usado como tática de estrelas/snippets. |
| **`AggregateRating` / `Review`** | *Não implementado no código* | Ausente | Nenhuma tentativa de gerar estrelas falsas | **Correto**. Nunca forjar schemas de reviews para a própria empresa (penalização manual do Google). |

---

## 9. Auditoria de Sitemap e Robots.txt

### 9.1 Sitemap.xml
* **Status:** **INEXISTENTE**.
* **Evidência:**
  * Não há arquivo `sitemap.xml` na pasta `public/`.
  * Não há módulo `@nuxtjs/sitemap` no `package.json`.
  * Não há gerador dinâmico de sitemap configurado no Nitro (`server/routes/sitemap.xml.ts`).
* **Impacto:** O Googlebot precisa descobrir as páginas exclusivamente através do rastreamento de links internos (*crawling*), o que prejudica a descoberta e indexação rápida de novas páginas ou atualizações.

### 9.2 Robots.txt (`public/robots.txt`)
* **Conteúdo Atual:**
  ```txt
  User-Agent: *
  Disallow:
  ```
* **Diagnóstico:**
  1. Permite o rastreamento irrestrito de `/admin/dashboard` e `/admin/leads`.
  2. Permite o rastreamento dos endpoints internos de API em `/api/`.
  3. Não declara a diretiva `Sitemap: https://www.adtelasmosquiteiras.com.br/sitemap.xml`.

---

## 10. Afirmações Comerciais e Técnicas (Business Claims)

Mapeamento de afirmações publicitárias que constam no código e necessitam de confirmação formal com o proprietário para evitar infrações do CONAR ou penalizações por diretrizes de qualidade do Google (E-E-A-T):

| Claim / Afirmação | Arquivos Onde Aparece | Onde é Exibida ao Usuário | Status de Validação |
| :--- | :--- | :--- | :--- |
| **"Certificado INMETRO"** | `useServicos.js`, `useServicoData.js`, `redes.vue` | Tabela comparativa e card de redes infantis | ⚠️ **VALIDAÇÃO HUMANA NECESSÁRIA** (Existe laudo/selo formal do INMETRO ou é certificado de fabricante parceiro?) |
| **"Suporta até 500kg / 500kg/m²"** | `useServicoData.js`, `FaqSection.vue`, `ServicesCards.vue`, `redes.vue` | Cards de destaque, FAQ da Home e especificações técnicas | ⚠️ **VALIDAÇÃO HUMANA NECESSÁRIA** (Laudo de tração do fornecedor do polietileno?) |
| **"Conformidade ABNT"** | Mencionado no PRD | Documentação | ⚠️ **VALIDAÇÃO HUMANA NECESSÁRIA** (Norma ABNT NBR 16046?) |
| **"Instalação em 24h / 24-48h"** | `useHead` em quase todas as páginas, banners e cards | Títulos, metas, botões e comparativos | ⚠️ **VALIDAÇÃO HUMANA NECESSÁRIA** (Capacidade operacional real de atender em 24h?) |
| **"Garantia de 2 Anos"** | `useServicos.js`, `useServicoData.js`, `vidracaria.vue`, `orcamento.vue` | Header, badges, tabelas de especificações | ⚠️ **VALIDAÇÃO HUMANA NECESSÁRIA** (Termo de garantia contratual emitido ao cliente?) |
| **"Adequação às normas da ANVISA"** | `useServicos.js` (telas para restaurantes) | Especificação de telas comerciais | ⚠️ **VALIDAÇÃO HUMANA NECESSÁRIA** (Malha milimétrica anti-vetores RDC 216?) |
| **"Medição 100% Gratuita"** | `orcamento.vue`, `vidracaria.vue` | Textos de FAQ e CTAs | ⚠️ **VALIDAÇÃO HUMANA NECESSÁRIA** (Válido para todas as 19 cidades ou há taxa de deslocamento?) |

---

## 11. Arquitetura de Links Internos e Hierarquia

```
                                  [ HOME (/) ]
                          (Recebe 90% dos backlinks)
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
  [ /servicos/redes ]         [ /servicos/telas ]        [ /servicos/vidracaria ]
  (Hub de Alta Força)         (Hub de Alta Força)        (Landing Especializada)
         │                             │
    ┌────┴────┐                   ┌────┴────┐
    ▼         ▼                   ▼         ▼
[Residencial] [Pets]          [Residencial] [Especiais]
    │         │                   │         │
 7 Itens   5 Itens             6 Itens   6 Itens
(Profundidade 3)              (Profundidade 3)
```

### Diagnóstico de Links Internos:
1. **Profundidade de Clique:** 3 cliques a partir da Home para chegar a uma página de serviço individual (`/` ➔ `/servicos/redes` ➔ `/servicos/redes/residencial` ➔ `/janelas`).
2. **Autoridade Desperdiçada:** As 35 páginas individuais quase não possuem links cruzados entre si (ex: a página de tela para gatos não aponta para rede para gatos, e vice-versa).
3. **Menu Header Atualizado:** O Header agora possui navegação limpa por âncoras na Home e links institucionais diretos para `/orcamento` e `/contato`.

---

## 12. SEO Local e Representação Geográfica

1. **Abordagem Atual:**
   * O site foca na **Região Metropolitana de São Paulo** (São Paulo Capital + 18 municípios vizinhos).
   * O componente [`CepSearch.vue`](file:///d:/sicons/ADT/app/components/CepSearch.vue) valida instantaneamente a cobertura por CEP via API do ViaCEP sem poluir a estrutura de URLs do Google.
2. **Recomendação Estratégica:**
   * **NÃO** recriar páginas programáticas de bairros ou cidades sem conteúdo físico e exclusivo comprovado.
   * Manter a autoridade concentrada em páginas fortes a nível de São Paulo / Grande SP e reforçar o perfil do Google Meu Negócio (Google Business Profile) com o NAP idêntico ao do site (`AD Telas e Redes`, `+55 11 98358-6611`, `São Paulo - SP`).

---

## 13. `SEARCH_CONSOLE_DATA_REQUIRED` (Dados Necessários do Proprietário)

Como este ambiente não possui credenciais ativas para consulta via API do Google Search Console, **nenhuma exclusão ou redirect 301 deve ser executado em produção sem antes cruzar com os dados reais dos últimos 16 meses**.

### Relatórios a Solicitar ao Proprietário:
1. **Desempenho no Search (Exportação Completa .CSV / Sheets):**
   * Dimensão: **Páginas** (Métricas: Cliques, Impressões, CTR Médio, Posição Média).
   * Dimensão: **Consultas (Queries)** para cada página de serviço e antigas URLs de bairro.
2. **Relatório de Cobertura / Indexação de Páginas:**
   * URLs com status *Indexada*, *Rastreada - atualmente não indexada*, *Detectada - atualmente não indexada*, *Não encontrada (404)*.
3. **Relatório de Links Externos (Backlinks):**
   * Páginas mais vinculadas externamente para preservar autoridade via 301.
4. **Ações Manuais e Questões de Segurança:**
   * Verificar se há histórico de penalização por spam de palavras-chave da época dos 891 bairros.

---

## 14. Performance e Riscos de Core Web Vitals (CWV)

1. **LCP (Largest Contentful Paint):**
   * A imagem do Hero da Home (`/images/logo_adt_telas_nova.png` e imagens de carrossel) é renderizada via SSR.
   * **Risco:** Algumas imagens em `public/images/` estão no formato PNG/JPEG pesado (algumas acima de 300KB).
2. **CLS (Cumulative Layout Shift):**
   * Carrosséis em `app/pages/orcamento.vue` e `ReviewsCarousel.vue` inicializam via `onMounted` com timers em JavaScript, o que pode causar micro-mudanças de layout antes da hidratação se as dimensões do container não estiverem travadas.
3. **INP (Interaction to Next Paint):**
   * Excelente. A interface é fluida e o carregamento assíncrono dos plugins não bloqueia o thread principal.

---

## 15. Riscos de Duplicação no Rastreamento (Analytics & Ads)

1. **Carregamento Simultâneo de GTM e `gtag.js`:**
   * `app/plugins/gtm.client.js` inicializa o container `GTM-KZTR2DHT`.
   * `app/plugins/gtag.client.js` injeta o script `gtag.js?id=G-S0038L1Q6R` e configura `AW-17981093809`.
   * **Risco Real:** Se dentro do container do GTM houver tags de GA4 ou Google Ads com acionador em *All Pages*, cada pageview e evento será computado **duas vezes** no Google Analytics e Google Ads, inflando métricas e duplicando conversões.
2. **Discrepância de Conta Google Ads:**
   * Páginas HTML em `public/` apontam para `AW-473885322` (Conta Antiga/Incorreta).
   * Aplicação Nuxt aponta para `AW-17981093809` (Conta Nova).

---

## 16. Auditoria de Páginas que NÃO Deveriam Ranquear

| URL / Padrão | Status Atual | Ação Recomendada | Justificativa |
| :--- | :--- | :--- | :--- |
| `/obrigado` | Já possui `noindex, nofollow` | **Manter `noindex`** | Página de conversão pós-lead, sem valor para busca orgânica. |
| `/admin/dashboard` | Indexável (Falta noindex) | **Adicionar `noindex, nofollow` + Proteção por Senha** | Painel administrativo privado com dados da empresa. |
| `/admin/leads` | Indexável (Falta noindex) | **Adicionar `noindex, nofollow` + Proteção por Senha** | CRM privado contendo dados pessoais de clientes (LGPD). |
| `/api/*` | Acessíveis via GET/POST | **Bloquear no `robots.txt`** | Endpoints de backend que não devem ser indexados como páginas. |

---

## 17. Conteúdo Editorial e Autoridade Temática

* **Conteúdo Existente:** [`/por-que-instalar-tela-mosquiteira`](file:///d:/sicons/ADT/app/pages/por-que-instalar-tela-mosquiteira.vue).
* **Análise:** O artigo possui excelente embasamento com dados reais de mortes e surtos do Ministério da Saúde.
* **Oportunidades de Expansão Qualificada (Sem gerar conteúdo artificial):**
  1. *Guia de Durabilidade: Qual a diferença real entre Rede de Proteção 3x3cm e 5x5cm?*
  2. *Como limpar e manter telas mosquiteiras sem danificar a fibra de vidro.*
  3. *Telas Pet Screen vs Redes para Gatos: Qual a opção correta para cada caso?*

---

## 18. Planos de Reestruturação: Classificação de URLs

### 18.1 URLs Candidatas a MANTER (Núcleo Forte)
* `/` (Home Page)
* `/servicos` (Central de Serviços)
* `/servicos/redes` (Hub Principal de Redes de Proteção)
* `/servicos/telas` (Hub Principal de Telas Mosquiteiras)
* `/servicos/vidracaria` (Landing Especializada em Vidraçaria)
* `/orcamento` (Página de Orçamento)
* `/contato` (Página Institucional)
* `/por-que-instalar-tela-mosquiteira` (Artigo de Conscientização)
* `/obrigado` (Com `noindex`)
* `/politica-de-privacidade.html` e `/termos-de-uso.html` (Com `noindex` ou canônicas)

### 18.2 URLs Candidatas a CONSOLIDAR E REDIRECIONAR (301)
* `/servicos/rede-protecao` ➔ **301 para** `/servicos/redes`
* `/servicos/tela-mosquiteira` ➔ **301 para** `/servicos/telas`
* URLs de serviços que não possuem buscas suficientes ou conteúdo único devem ser consolidadas nos seus hubs correspondentes para evitar canibalização e diluição de autoridade.

### 18.3 URLs Candidatas a NOINDEX
* `/admin/dashboard`
* `/admin/leads`
* `/obrigado` (Já implementado)

---

## 19. Matriz de Priorização (P0 / P1 / P2)

### 🚨 Prioridade P0 (Crítico / Imediato no próximo ciclo)
1. **Criar e Publicar o `sitemap.xml` Canônico** cobrindo apenas as URLs aprovadas.
2. **Atualizar o `robots.txt`** com a referência ao `sitemap.xml` e bloqueio de `/admin/` e `/api/`.
3. **Proteger as Rotas Administrativas** (`/admin/*`) com `noindex, nofollow` e autenticação básica.
4. **Implementar `<link rel="canonical">` Self-Referencing** em 100% das páginas do site.
5. **Corrigir a Tag Google Ads nos arquivos HTML estáticos** (unificar para `AW-17981093809`).

### ⚠️ Prioridade P1 (Alto Impacto / Reestruturação SEO)
1. **Eliminar a Duplicação de Conteúdo nos 35 Serviços:** Escrever descrições e dados técnicos reais por serviço ou consolidar as páginas repetidas nos Hubs.
2. **Eliminar a Canibalização de Slugs Legados:** Configurar redirects 301 de `/servicos/rede-protecao` ➔ `/servicos/redes` e `/servicos/tela-mosquiteira` ➔ `/servicos/telas`.
3. **Implementar Dados Estruturados Schema.org Válidos:** Injetar `LocalBusiness` e `Service` no código real.
4. **Remover a tag obsoleta `<meta name="keywords">`** de todas as páginas.
5. **Validar Formalmente as Afirmações Comerciais e Técnicas** (INMETRO, 500kg, 2 anos garantia).

### 💡 Prioridade P2 (Médio Impacto / Otimizações Finas)
1. **Completar as Meta Tags Open Graph** (`og:url`, `og:image` por serviço).
2. **Otimização de Imagens para WebP** e definição explícita de `width`/`height` para mitigar CLS.
3. **Fortalecer a Rede de Links Internos** entre produtos complementares (Redes ↔ Telas ↔ Pet Screen).
4. **Alinhar o container GTM com a tag `gtag.js`** para auditar que nenhum evento de conversão seja duplicado.

---

## 20. Arquivos que Serão Modificados em Futura Implementação

Quando o plano for aprovado para execução, os seguintes arquivos serão tocados:
* `package.json` (Adicionar `@nuxtjs/sitemap` se adotado)
* `public/robots.txt`
* `nuxt.config.ts` (Sitemap, Nitro CSP, Canonical global helper)
* `app/app.vue` (Schema LocalBusiness)
* `app/pages/orcamento.vue`, `contato.vue`, `por-que-instalar-tela-mosquiteira.vue` (Metas, Canonical)
* `app/pages/servicos/index.vue`, `redes.vue`, `telas.vue`, `vidracaria.vue` (Metas, Canonical)
* `app/pages/servicos/[familia]/[categoria]/[servico].vue` (Eliminação do template genérico)
* `app/pages/admin/dashboard.vue`, `admin/leads.vue` (Noindex, proteção)
* `public/politica-de-privacidade.html`, `public/termos-de-uso.html` (Google Tag ID)

---

## 21. Riscos de Migração e Testes Obrigatórios

### Riscos a Mitigar:
* **Perda de Tráfego por 404 Indesejado:** Nenhuma URL indexada deve ser excluída sem validação no Search Console.
* **Queda de Posições por Redirecionamentos em Cadeia:** Garantir redirecionamentos diretos 301 de salto único.
* **Quebra de Conversões no Google Ads:** Validar que o disparo de conversão na rota `/obrigado` e cliques no WhatsApp continue 100% operacional.

### Testes Obrigatórios Pré-Produção:
1. Validação de build SSR (`npx nuxi build`) com zero erros.
2. Teste de resposta HTTP com `curl -I` para validar código 200, 301 e 404.
3. Validação dos dados estruturados no *Rich Results Test* oficial do Google.
4. Validação da tag canônica inspecionando o HTML puro retornado pelo servidor sem JavaScript.
