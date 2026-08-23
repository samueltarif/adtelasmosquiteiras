# SEO FASE 04 — ESTRUTURA DE MONITORAMENTO PÓS-MIGRAÇÃO & ACOMPANHAMENTO DE PERFORMANCE

**Projeto:** AD Telas e Redes — `adtelasmosquiteiras.com.br`  
**Fase:** 04 — SEO Post-Migration Monitoring Framework  
**Data do Lançamento (D0):** 2026-08-23  
**Status:** `FRAMEWORK READY (OBSERVACIONAL)`

---

## 1. Executive Summary & Política Observacional Estrita

A Fase 04 estabelece a **estrutura de acompanhamento e controle pós-migração** para a nova arquitetura SEO do projeto AD Telas e Redes.

> [!IMPORTANT]
> **REGRA ABSOLUTA DE NÃO-INTERVENÇÃO AUTOMÁTICA:**
> Esta fase é estritamente **OBSERVACIONAL E ANALÍTICA**.
> Nenhuma oscilação temporária de posição, variação pontual de impressões ou atraso na indexação de uma URL individual deve disparar alteração automática no código, nos redirecionamentos ou na estrutura do site.
> 
> **Fluxo Obrigatório de Decisão:**
> 1. Registrar os dados empíricos nos checkpoints.
> 2. Diagnosticar a causa raiz com base em histórico longo.
> 3. Propor otimizações apenas se confirmado problema sustentado.

---

## 2. Cronograma de Checkpoints & Datas Oficiais

```
[D0: 2026-08-23] ➔ [D+7: 2026-08-30] ➔ [D+14: 2026-09-06] ➔ [D+30: 2026-09-22] ➔ [D+60: 2026-10-22] ➔ [D+90: 2026-11-21]
```

- **D0 (Lançamento):** 2026-08-23
- **D+7 (Saúde de Rastreamento):** 2026-08-30
- **D+14 (Migração de Canonical):** 2026-09-06
- **D+30 (Desempenho de Clusters):** 2026-09-22
- **D+60 (Oportunidades de Otimização):** 2026-10-22
- **D+90 (Avaliação Final de 90 Dias):** 2026-11-21

---

## 3. D0 Baseline & Estado Real do Search Console (2026-08-23)

### A) Estado Real do Search Console (Ações Manuais Autorizadas)
- `SEARCH_CONSOLE_CHANGED = YES` (Execução de ações manuais autorizadas pelo operador humano no painel GSC).
- `SEARCH_CONSOLE_AUTOMATED_CHANGES = NO` (Nenhuma ferramenta ou script teve acesso automatizado ao GSC).
- `SITEMAP_SUBMITTED = YES` (`https://www.adtelasmosquiteiras.com.br/sitemap.xml` submetido manualmente).
- `SITEMAP_STATUS = PROCESSED` (Processado com sucesso pelo Google).
- `SITEMAP_DISCOVERED_URLS = 20` (Todas as 20 URLs canônicas descobertas).
- `P0_INDEXATION_REQUESTS = 9/9` (Solicitações de indexação prioritária enviadas manualmente).

### B) Estado Técnico da Produção & Contabilidade de Redirects
- `LIVE_FINAL_URLS = 20/20 PASS` (20 URLs canônicas ativas com HTTP 200).
- `SEO_MIGRATION_REDIRECTS = 45` (45 redirecionamentos 301 de URLs comerciais legadas).
- `TECHNICAL_LEGACY_REDIRECTS = 1` (`/home` ➔ `/`).
- `TOTAL_SERVER_REDIRECTS = 46` (Todas centralizadas no `server/redirectsMap.ts`).
- `HOME_TECHNICAL_REDIRECT = PASS` (`/home` ➔ HTTP 301 ➔ `/` ➔ HTTP 200 | `CHAIN_LENGTH = 1`, `LOOP = 0`).
- `GSC_REDIRECT_VALIDATION = STARTED_MANUALLY` (Validação de correção no GSC iniciada manualmente).
- `BREADCRUMB_HOTFIX_LIVE = PASS` (11/11 landings validadas com JSON-LD em produção | Commit `2bb31b2`).
- `INTERNAL_LINKS_TO_CDN_CGI = 0` (Bypass `<!--email_off-->` ativo | Commit `8d34da9`).
- `ADMIN_AUTH_IMPLEMENTATION = DEFERRED_BY_USER`.

### C) Baseline de Desempenho no GSC (Dia D0)

| Cluster de Páginas | URLs Incluídas | Cliques (D0) | Impressões (D0) | CTR Médio (D0) | Posição Média (D0) |
|---|---|:---:|:---:|:---:|:---:|
| **HOME** | `/` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| **TELAS** | `/servicos/telas/*` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| **REDES** | `/servicos/redes/*` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| **LOCAL** | `/areas-atendidas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| **OUTROS** | `/orcamento`, `/contato`, etc. | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |

---

## 4. D+7 Checkpoint — Crawl Health (2026-08-30)

### Objetivo: Validar saúde de rastreamento do Googlebot e transição dos 301.

#### Métricas a Coletar no GSC (D+7):
- `SITEMAP_STATUS:` (`PROCESSED` / `ERRORS`)
- `SITEMAP_DISCOVERED_URLS:` (Meta = 20)
- `INDEXED_FINAL_URLS:` `NEEDS_GSC_DATA`
- `DISCOVERED_NOT_INDEXED:` `NEEDS_GSC_DATA`
- `CRAWLED_NOT_INDEXED:` `NEEDS_GSC_DATA`
- `LEGACY_URLS_RECORDED_AS_REDIRECT:` `NEEDS_GSC_DATA`
- `404_COUNT:` `NEEDS_GSC_DATA` (Estabilização esperada para bairros antigos sem equivalente)
- `5XX_COUNT:` (Meta = 0)

#### Bateria Automatizada de Teste HTTP (Execução Local/Nitro):
- `REDIRECTS_ACTIVE = 46/46` (45 SEO + 1 Técnico)
- `REDIRECT_CHAINS = 0`
- `REDIRECT_LOOPS = 0`
- `FINAL_URLS_HTTP_200 = 20/20`

---

## 5. D+14 Checkpoint — Canonical Migration (2026-09-06)

### Objetivo: Verificar se o Google adotou as novas URLs como canônicas declaradas.

#### Amostragem de Auditoria por Landing Page:

| Landing Page | Status no GSC | Último Rastreio | Canonical Declarada | Canonical Selecionada pelo Google | Match? |
|---|:---:|:---:|---|---|:---:|
| `/servicos/telas/janelas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `https://www.adtelasmosquiteiras.com.br/servicos/telas/janelas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| `/servicos/telas/portas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `https://www.adtelasmosquiteiras.com.br/servicos/telas/portas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| `/servicos/telas/pet-screen` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `https://www.adtelasmosquiteiras.com.br/servicos/telas/pet-screen` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| `/servicos/redes/janelas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `https://www.adtelasmosquiteiras.com.br/servicos/redes/janelas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| `/servicos/redes/gatos-e-pets` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `https://www.adtelasmosquiteiras.com.br/servicos/redes/gatos-e-pets` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| `/areas-atendidas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `https://www.adtelasmosquiteiras.com.br/areas-atendidas` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |

- **Meta Desejável:** `GOOGLE_SELECTED_CANONICAL_MATCH = PASS`
- **Diretriz:** Não exigir 20/20 indexadas em D+14 como condição de sucesso (a transição completa pode levar até 30-45 dias).

---

## 6. D+30 Checkpoint — Performance por Clusters (2026-09-22)

### Objetivo: Comparar desempenho de busca D0 vs D+30 agrupado por intenção comercial.

| Cluster | Cliques (D0) | Cliques (D+30) | Impressões (D0) | Impressões (D+30) | CTR (D+30) | Pos. Média (D+30) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **HOME (`/`)** | `GSC` | `NEEDS_GSC_DATA` | `GSC` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| **TELAS MOSQUITEIRAS** | `GSC` | `NEEDS_GSC_DATA` | `GSC` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| **REDES DE PROTEÇÃO** | `GSC` | `NEEDS_GSC_DATA` | `GSC` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| **LOCAL / CEP** | `GSC` | `NEEDS_GSC_DATA` | `GSC` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |
| **OUTROS** | `GSC` | `NEEDS_GSC_DATA` | `GSC` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` | `NEEDS_GSC_DATA` |

---

## 7. Distribuição de Tráfego Orgânico & Conversões

### A) Participação no Tráfego Orgânico (Share por Cluster)
Objetivo analítico: Observar se o tráfego orgânico começa a se distribuir entre Home, hubs e landings específicas sem estabelecer percentuais-alvo arbitrários antes do acúmulo de dados históricos.

- `HOME_ORGANIC_SHARE:` `MEASURE`
- `TELAS_ORGANIC_SHARE:` `MEASURE`
- `REDES_ORGANIC_SHARE:` `MEASURE`
- `LOCAL_ORGANIC_SHARE:` `MEASURE`

### B) Métricas de Conversão Orgânica (Leads e Oportunidades)
- `ORGANIC_WHATSAPP_CLICKS:` `NEEDS_ANALYTICS_DATA`
- `ORGANIC_FORM_SUBMISSIONS:` `NEEDS_ANALYTICS_DATA`
- `ORGANIC_LEADS:` `NEEDS_SUPABASE_DATA`

---

## 8. D+60 Checkpoint — Oportunidades de Otimização (2026-10-22)

### Objetivo: Identificar páginas com alto potencial de ganho sem alterações automáticas.

Na data D+60, será gerado o relatório `SEO_OPTIMIZATION_OPPORTUNITIES` cobrindo:
1. **Páginas com Altas Impressões e Baixo CTR:** Otimização pontual de `<title>` e `meta description`.
2. **URLs em Posições 4 a 15:** Otimização de links internos e reforço de copy.
3. **Novas Queries Descobertas:** Avaliação de intenções emergentes para enriquecimento editorial.

---

## 9. D+90 Checkpoint — Avaliação Final & Balanço da Migração (2026-11-21)

### Comparativo Consolidado: Pré-Migração vs 30d vs 60d vs 90d

- `CLICKS_CHANGE:` `NEEDS_GSC_DATA`
- `IMPRESSIONS_CHANGE:` `NEEDS_GSC_DATA`
- `CTR_CHANGE:` `NEEDS_GSC_DATA`
- `POSITION_CHANGE:` `NEEDS_GSC_DATA`
- `ORGANIC_LEADS_CHANGE:` `NEEDS_ANALYTICS_DATA`

### Classificação Final da Migração:
- [ ] `MIGRATION_SUCCESS` (Crescimento de tráfego qualificado e manutenção de autoridade)
- [ ] `MIGRATION_NEUTRAL` (Estabilidade de métricas com distribuição por landings)
- [ ] `MIGRATION_REQUIRES_REVIEW` (Perda sustentada de visibilidade após 90 dias com justificativa em dados)

---

## 10. Política de SEO Local, URLs de Bairros & CDN-CGI

### A) Páginas Municipais
> [!WARNING]
> **REGRA PARA PÁGINAS MUNICIPAIS:**
> **NÃO** criar landing pages locais/municipais adicionais durante o período inicial de 90 dias com a finalidade exclusiva de aumentar volume de URLs.
> Qualificação futura dependerá de demanda comprovada no GSC, confirmação comercial de atendimento, intenção local distinta e conteúdo 100% exclusivo.

### B) URL de Legado Técnico CDN-CGI
- **URL Identificada:** `https://www.adtelasmosquiteiras.com.br/cdn-cgi/l/email-protection`
- **Contagem de Links Internos:** `INTERNAL_LINKS_TO_CDN_CGI = 0` (Endereços de e-mail envelopados em `<!--email_off-->` no código).
- **Ação:** `ACTION = NONE` (Não criar redirect nem página. O status HTTP 404 natural do servidor pode permanecer).

---

## 11. Incident Alert Protocol (Alertas P0 Imediatos)

Apenas os seguintes eventos críticos serão considerados incidentes P0 e exigirão relatório emergencial imediato:

1. `HOME_NOINDEX` — Tag noindex inserida acidentalmente na Home.
2. `HOME_404` / `HOME_5XX` — Indisponibilidade da página principal.
3. `SITEMAP_FETCH_FAILURE_PERSISTENT` — Googlebot incapaz de ler o `sitemap.xml` por mais de 3 dias.
4. `REDIRECT_LOOP = TRUE` — Detectado por repetição de URL na cadeia, excesso de redirecionamentos, `ERR_TOO_MANY_REDIRECTS` ou equivalente em produção.
5. `MASS_CANONICAL_MISMATCH` — Google rejeitando canonicals de mais de 50% das páginas.
6. `FINAL_URLS_RETURNING_404` — URLs canônicas retornando HTTP 404 em produção.
7. `ROBOTS_BLOCKING_INDEXABLE_URLS` — `robots.txt` bloqueando URLs canônicas.

*Nota: Oscilações normais de posição nas SERPs NÃO são consideradas incidentes P0.*

---

## 12. Final Status & Framework Declaration

```
FASE 04 DOCUMENTATION UPDATE: PASS
SEARCH_CONSOLE_CHANGED: YES
SEARCH_CONSOLE_AUTOMATED_CHANGES: NO
SITEMAP PROCESSED: YES
DISCOVERED URLS: 20
P0 REQUESTS: 9/9
SEO REDIRECTS: 45
TECHNICAL REDIRECTS: 1
TOTAL SERVER REDIRECTS: 46
ARBITRARY TRAFFIC THRESHOLDS: 0
ADMIN AUTH ALTERADO: NÃO
```
