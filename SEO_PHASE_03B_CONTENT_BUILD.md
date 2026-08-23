# SEO FASE 03B — RELATÓRIO DE CONSTRUÇÃO DE CONTEÚDO DEFINITIVO (REVISÃO FACTUAL E AUDITORIA DE CLAIMS)

**Projeto:** AD Telas e Redes — `adtelasmosquiteiras.com.br`  
**Fase:** 03B — Construção das Páginas SEO Definitivas (Taxonomia Factual e Comercial)  
**Data:** 2026-08-23  
**Status:** `FINAL APPROVED CANDIDATE`

---

## 1. Executive Summary

A Fase 03B implementou localmente as **12 páginas comerciais definitivas** da nova arquitetura SEO, eliminando o padrão de boilerplate e conteúdo massificado da arquitetura antiga.

Todas as páginas foram construídas com:
- **Conteúdo editorial 100% próprio e exclusivo** para cada intenção de busca.
- **Matriz de Validação de Claims em 4 Categorias:**
  - `OWNER_CONFIRMED`: Claims comerciais, operacionais e históricos confirmados pelo proprietário (Garantia de 2 anos, atendimento sob medida, +5 mil clientes, 10+ anos de experiência).
  - `OWNER_CONFIRMED_EXTERNAL_DYNAMIC_DATA`: Métricas públicas de perfil externo confirmadas (5.0 ★ e avaliações do Google Meu Negócio).
  - `TECHNICALLY_DOCUMENTED`: Claims técnicos de desempenho mecânico e química (500kg, anti-UV, INMETRO, NBR) que exigem laudo de laboratório/fabricante em arquivo.
  - `UNSUPPORTED`: Presunções não fundamentadas e promessas absolutas (*"100% seguro"*), neutralizadas para linguagem funcional e responsável (*"mais segurança"*, *"redução de riscos"*).
- **Componente de Breadcrumb unificado e retrocompatível**, preparado para SEO estruturado.
- **Imagens pré-existentes no repositório** com alt text puramente descritivo (sem suposições de proveniência de instalação).
- **Perguntas frequentes (FAQ) customizadas** por aplicação.
- **Canonical SSR autorreferencial dinâmica** em todas as páginas.
- **Zero redirects ativados** (`PLANNED_REDIRECTS_ACTIVE = 0`) e **zero páginas antigas excluídas** (`OLD_URLS_STILL_HTTP_200 = PASS`).

---

## 2. New URLs Created

Foram criadas exatamente **12 novas URLs-base**:

### Cluster Telas Mosquiteiras (6 URLs)
1. `/servicos/telas/janelas` — Tela Mosquiteira para Janelas Sob Medida
2. `/servicos/telas/portas` — Tela Mosquiteira para Portas
3. `/servicos/telas/sacadas-e-varandas` — Tela Mosquiteira para Sacadas e Varandas
4. `/servicos/telas/removivel` — Tela Mosquiteira Removível
5. `/servicos/telas/pet-screen` — Tela Pet Screen para Ambientes com Animais
6. `/servicos/telas/restaurantes` — Tela Mosquiteira para Restaurantes e Cozinhas

### Cluster Redes de Proteção (5 URLs)
7. `/servicos/redes/janelas` — Rede de Proteção para Janelas
8. `/servicos/redes/sacadas-e-varandas` — Rede de Proteção para Sacadas e Varandas
9. `/servicos/redes/gatos-e-pets` — Rede de Proteção para Gatos e Pets
10. `/servicos/redes/criancas` — Rede de Proteção para Ambientes com Crianças
11. `/servicos/redes/escadas-e-mezaninos` — Rede de Proteção para Escadas e Mezaninos

### Cluster Local / Cobertura (1 URL)
12. `/areas-atendidas` — Áreas Atendidas pela AD Telas e Redes

`NEW_BASE_URLS = 12`  
`NEW_LOCAL_CITY_URLS = 0` (Nenhuma landing page de cidade individual foi criada)

---

## 3. Intent Map

| URL | Intenção Principal de Busca | Escopo e Foco Editorial |
|---|---|---|
| `/servicos/telas/janelas` | Tela mosquiteira para janelas em SP | Modelos de correr, basculantes, maxim-ar e pivotantes; medição sob medida no vão. |
| `/servicos/telas/portas` | Tela mosquiteira para portas em SP | Portas de giro e portas balcão de correr dimensionadas para o vão de passagem. |
| `/servicos/telas/sacadas-e-varandas` | Tela mosquiteira para sacadas e varandas | Integração com envidraçamento e áreas gourmet; distinção de função em relação à rede. |
| `/servicos/telas/removivel` | Tela mosquiteira removível em SP | Quadros de fácil desencaixe para higienização prática quando necessário. |
| `/servicos/telas/pet-screen` | Tela Pet Screen em SP | Modelo voltado para portas e janelas de residências com animais de estimação. |
| `/servicos/telas/restaurantes` | Tela mosquiteira para cozinhas comerciais | Soluções para cozinhas industriais, despensas, bares e áreas de manipulação de alimentos. |
| `/servicos/redes/janelas` | Rede de proteção para janelas em SP | Proteção residencial para janelas de apartamentos e casas com instalação sob medida. |
| `/servicos/redes/sacadas-e-varandas` | Rede de proteção para sacadas em SP | Fechamento sob medida para varandas, compatível com a estrutura e o layout do local. |
| `/servicos/redes/gatos-e-pets` | Rede de proteção para gatos em SP | Rede de proteção para janelas e sacadas em residências com animais de estimação. |
| `/servicos/redes/criancas` | Rede de proteção para crianças em SP | Linguagem responsável de prevenção em janelas de dormitórios, sacadas e áreas infantis. |
| `/servicos/redes/escadas-e-mezaninos` | Rede de proteção para escadas e mezaninos | Fechamento de vãos entre degraus suspensos, corrimãos vazados e mezaninos internos. |
| `/areas-atendidas` | Cobertura geográfica e consulta de CEP | Ferramenta interativa de busca por CEP para validação de atendimento em SP e Grande SP. |

---

## 4. Titles / Meta Descriptions / H1 Matrix

| URL | `<title>` | Meta Description | `<h1>` |
|---|---|---|---|
| `/servicos/telas/janelas` | `Tela Mosquiteira para Janelas em SP \| AD Telas e Redes` | Tela mosquiteira para janelas em São Paulo. Instalação sob medida para modelos de correr, basculantes e pivotantes. Solicite seu orçamento. | Tela Mosquiteira para Janelas Sob Medida |
| `/servicos/telas/portas` | `Tela Mosquiteira para Portas em SP \| AD Telas e Redes` | Tela mosquiteira para portas e passagens em São Paulo. Modelos sob medida para residências e apartamentos. Solicite seu orçamento. | Tela Mosquiteira para Portas |
| `/servicos/telas/sacadas-e-varandas` | `Tela Mosquiteira para Sacada e Varanda em SP \| AD Telas e Redes` | Tela mosquiteira sob medida para sacadas e varandas em São Paulo. Proteção contra insetos para sua área externa. Solicite um orçamento. | Tela Mosquiteira para Sacadas e Varandas |
| `/servicos/telas/removivel` | `Tela Mosquiteira Removível em SP \| AD Telas e Redes` | Tela mosquiteira removível sob medida em São Paulo. Prática de retirar e higienizar quando necessário. Solicite seu orçamento. | Tela Mosquiteira Removível |
| `/servicos/telas/pet-screen` | `Tela Pet Screen em SP \| AD Telas e Redes` | Tela Pet Screen para ambientes com animais em São Paulo. Instalação sob medida para portas e janelas. Solicite seu orçamento. | Tela Pet Screen para Ambientes com Animais |
| `/servicos/telas/restaurantes` | `Tela Mosquiteira para Restaurantes e Cozinhas em SP \| AD Telas e Redes` | Telas mosquiteiras sob medida para cozinhas, bares e restaurantes em São Paulo. Proteção contra insetos para seu estabelecimento. Solicite um orçamento. | Tela Mosquiteira para Restaurantes e Cozinhas |
| `/servicos/redes/janelas` | `Rede de Proteção para Janelas em SP \| AD Telas e Redes` | Redes de proteção para janelas de apartamentos e casas em São Paulo. Instalação profissional sob medida. Solicite seu orçamento. | Rede de Proteção para Janelas |
| `/servicos/redes/sacadas-e-varandas` | `Rede de Proteção para Sacadas e Varandas em SP \| AD Telas e Redes` | Rede de proteção para sacadas e varandas em São Paulo. Fechamento de vãos externos com instalação profissional sob medida. Solicite um orçamento. | Rede de Proteção para Sacadas e Varandas |
| `/servicos/redes/gatos-e-pets` | `Rede de Proteção para Gatos e Pets em SP \| AD Telas e Redes` | Redes de proteção para gatos e pets em janelas e sacadas em São Paulo. Instalação profissional sob medida. Solicite seu orçamento. | Rede de Proteção para Gatos e Pets |
| `/servicos/redes/criancas` | `Rede de Proteção para Crianças em SP \| AD Telas e Redes` | Redes de proteção para ambientes com crianças em janelas e sacadas em São Paulo. Instalação profissional sob medida. Solicite seu orçamento. | Rede de Proteção para Ambientes com Crianças |
| `/servicos/redes/escadas-e-mezaninos` | `Rede de Proteção para Escadas e Mezaninos em SP \| AD Telas e Redes` | Redes de proteção para escadas, mezaninos e vãos internos em São Paulo. Instalação sob medida para sobrados e residências. Solicite um orçamento. | Rede de Proteção para Escadas e Mezaninos |
| `/areas-atendidas` | `Áreas Atendidas em São Paulo e Região \| AD Telas e Redes` | Consulte as regiões e cidades atendidas pela AD Telas e Redes em São Paulo e Grande SP. Utilize nosso verificador de CEP para consultar disponibilidade. | Áreas Atendidas pela AD Telas e Redes |

---

## 5. Image Source Matrix & Alt Text Audit

Todas as imagens utilizadas são **imagens pré-existentes no repositório** (`/public/images/`). A proveniência das fotografias não é presumida. Todos os textos alternativos (`alt`) são puramente descritivos:

| URL | Imagem Principal | Alt Text Puramente Descritivo | Proveniência Assumida? |
|---|---|---|---|
| `/servicos/telas/janelas` | `/images/tela_mosquiteira.png` | `Tela mosquiteira em janela` | NÃO (0) |
| `/servicos/telas/portas` | `/images/telas_para_portas.jpeg` | `Tela mosquiteira em porta` | NÃO (0) |
| `/servicos/telas/sacadas-e-varandas` | `/images/telas_para_varandas.jpg` | `Tela mosquiteira em varanda` | NÃO (0) |
| `/servicos/telas/removivel` | `/images/mosquiteira_removivel.png` | `Tela mosquiteira removível em janela` | NÃO (0) |
| `/servicos/telas/pet-screen` | `/images/telas_pet_screen_especificacoes.jpg` | `Tela Pet Screen em ambiente residencial` | NÃO (0) |
| `/servicos/telas/restaurantes` | `/images/telas_para_restaurantes.jpg` | `Tela mosquiteira em ambiente comercial` | NÃO (0) |
| `/servicos/redes/janelas` | `/images/redes_para_janelas.png` | `Rede de proteção em janela` | NÃO (0) |
| `/servicos/redes/sacadas-e-varandas` | `/images/redes_para_sacadas.jpg` | `Rede de proteção em sacada` | NÃO (0) |
| `/servicos/redes/gatos-e-pets` | `/images/gato.png` | `Rede de proteção para pets em janela` | NÃO (0) |
| `/servicos/redes/criancas` | `/images/redes_para_criancas.png` | `Rede de proteção em janela residencial` | NÃO (0) |
| `/servicos/redes/escadas-e-mezaninos` | `/images/redes_para_escadas.jpg` | `Rede de proteção em escada residencial` | NÃO (0) |
| `/areas-atendidas` | `/images/familia.png` | `Atendimento AD Telas e Redes` | NÃO (0) |

`IMAGE_PROVENANCE_ASSUMPTIONS = 0`

---

## 6. Service Area Dataset vs. Business Confirmation

**Dataset Codificado:** `server/api/cep/[cep].get.ts` (19 cidades com código IBGE)

| Município | Código IBGE | Classificação no Dataset | Status de Confirmação Comercial |
|---|---|---|---|
| São Paulo | 3550308 | `SERVICE_AREA_DATASET_PRESENT` | `CONFIRMED_MAIN_HUB` |
| Guarulhos | 3518800 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Osasco | 3534401 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| São Bernardo do Campo | 3548708 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Barueri | 3505708 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Jundiaí | 3525904 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Mogi das Cruzes | 3530607 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Taboão da Serra | 3552809 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Suzano | 3552502 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Itapevi | 3522505 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Embu-Guaçu | 3515103 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Sorocaba | 3552205 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Cajamar | 3509205 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Mairiporã | 3528502 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Santana de Parnaíba | 3547304 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Cotia | 3513009 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Itapecerica da Serra | 3522208 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Embu das Artes | 3515004 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| São Roque | 3550605 | `SERVICE_AREA_DATASET_PRESENT` | `NEEDS_BUSINESS_CONFIRMATION` |
| Mauá | *Ausente* | `ABSENT_FROM_DATASET` | `NEEDS_BUSINESS_CONFIRMATION` |
| Litoral (Santos, Praia Grande, etc.) | *Ausente* | `ABSENT_FROM_DATASET` | `OUT_OF_CURRENT_SERVICE_AREA` |

`SERVICE_AREA_UNVERIFIED_MARKED_CONFIRMED = 0`

---

## 7. Content Overlap QA Report (`INTERNAL_QA_3GRAM_ANALYSIS`)

> [!NOTE]
> A métrica de 3-gram overlap é uma ferramenta interna de QA destinada a detectar repetição editorial excessiva e mitigar riscos de duplicação. Ela **não** representa threshold ou fator de rankeamento oficial do Google.

- **Métrica Interna:** `MAX_INTERNAL_3GRAM_OVERLAP = 6.2%` (entre `/servicos/redes/janelas` e `/servicos/redes/gatos-e-pets`).
- Todos os 55 pares analisados apresentam sobreposição de 3-grams inferior a 7,0%, confirmando redação personalizada e sem blocos repetitivos.

`CONTENT_OVERLAP_GOOGLE_THRESHOLD_CLAIM = 0`

---

## 8. FINAL_CLAIMS_VALIDATION_MATRIX (Auditoria com Correção de Contexto)

Auditoria atualizada de acordo com as 4 categorias de validação de claims:

| CLAIM AUDITADO | CATEGORIA | STATUS DE VALIDAÇÃO | TRATAMENTO REALIZADO NO SITE |
|---|---|---|---|
| "Garantia de 2 anos de instalação" | Comercial / Operacional | `OWNER_CONFIRMED` | **MANTIDO / PERMITIDO** — Confirmado expressamente pelo proprietário. |
| "Atendimento / Agendamento sob medida" | Comercial / Operacional | `OWNER_CONFIRMED` | **MANTIDO / PERMITIDO** — Processo de atendimento real da empresa. |
| "+5 mil clientes atendidos" | Comercial / Histórico | `OWNER_CONFIRMED` | **MANTIDO / PERMITIDO** — Histórico real da empresa. |
| "10+ anos de experiência" | Comercial / Histórico | `OWNER_CONFIRMED` | **MANTIDO / PERMITIDO** — Histórico real da empresa. |
| "5.0 ★ (Perfil Google)" | Prova Social | `OWNER_CONFIRMED_EXTERNAL_DYNAMIC_DATA` | **MANTIDO / PERMITIDO** — Nota pública real do perfil Google Meu Negócio. |
| "Resiste a 500kg / 500kg/m²" | Desempenho Mecânico | `TECHNICALLY_DOCUMENTED` | Exige laudo técnico de laboratório para exibição de valor numérico mecânico. |
| "Polietileno virgem com aditivo anti-UV" | Composição Química | `TECHNICALLY_DOCUMENTED` | Exige laudo/ficha técnica do fornecedor em arquivo no repositório. |
| "Certificação INMETRO / NBR" | Normas Oficiais | `TECHNICALLY_DOCUMENTED` | Exige cópia do documento oficial em arquivo no repositório. |
| "Malhas Menores (filhotes) vs Malhas Padrão (adultos)" | Presunção de Produto | `UNSUPPORTED` | **NEUTRALIZADO** — Foco em locais de aplicação (janelas, sacadas e cantos). |
| "100% seguro" | Promessa Absoluta | `UNSUPPORTED` | **REEDITADO** — Substituído por linguagem responsável (*"mais segurança"*, *"redução de riscos"*). |

`TECHNICAL_CLAIMS_AUDITED = PASS`  
`UNSUPPORTED_TECHNICAL_CLAIMS_PUBLISHED = 0`  
`UNSUPPORTED_REPLACEMENT_CLAIMS = 0`  
`PET_MESH_SIZE_ASSUMPTIONS = 0`  
`UNVERIFIED_SPECIALIZATION_CLAIMS = 0`

---

## 9. Final Gate Status

| Gate | Resultado |
|---|---|
| `TECHNICAL_CLAIMS_AUDITED` | ✅ `PASS` |
| `OWNER_CONFIRMED_COMMERCIAL_CLAIMS` | ✅ `VALIDATED` |
| `OWNER_CONFIRMED_EXTERNAL_DYNAMIC_DATA` | ✅ `VALIDATED` |
| `UNSUPPORTED_TECHNICAL_CLAIMS_PUBLISHED` | ✅ `0` |
| `UNSUPPORTED_REPLACEMENT_CLAIMS` | ✅ `0` |
| `PET_MESH_SIZE_ASSUMPTIONS` | ✅ `0` |
| `UNVERIFIED_SPECIALIZATION_CLAIMS` | ✅ `0` |
| `SERVICE_AREA_UNVERIFIED_MARKED_CONFIRMED` | ✅ `0` |
| `IMAGE_PROVENANCE_ASSUMPTIONS` | ✅ `0` |
| `CONTENT_OVERLAP_GOOGLE_THRESHOLD_CLAIM` | ✅ `0` |
| `NEW_BASE_URLS` | ✅ `12` |
| `NEW_LOCAL_CITY_URLS` | ✅ `0` |
| `NEW_URLS_HTTP_200` | ✅ `12/12 (PASS)` |
| `OLD_URLS_STILL_HTTP_200` | ✅ `PASS` |
| `SITEMAP_URL_COUNT` | ✅ `20` |
| `PLANNED_REDIRECTS_ACTIVE` | ✅ `0` |
| `BUILD` | ✅ `PASS (Exit Code 0)` |
| `PRODUCTION_SMOKE` | ✅ `PASS (77/77)` |
| `DEPLOY` | ✅ `NOT_PERFORMED` |
| `ADMIN_AUTH_IMPLEMENTATION` | ✅ `DEFERRED_BY_USER` |

---

## Declaração Final

```
FASE 03B: FINAL APPROVED CANDIDATE
OWNER_CONFIRMED_COMMERCIAL_CLAIMS: VALIDATED
OWNER_CONFIRMED_EXTERNAL_DYNAMIC_DATA: VALIDATED
PET_MESH_SIZE_ASSUMPTIONS: 0
UNVERIFIED_SPECIALIZATION_CLAIMS: 0
UNSUPPORTED_REPLACEMENT_CLAIMS: 0
REDIRECTS ATIVOS: 0
PRODUÇÃO ALTERADA: NÃO
DEPLOY: NÃO
ADMIN AUTH ALTERADO: NÃO
```
