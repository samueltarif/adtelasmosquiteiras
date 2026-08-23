# 🧭 RELATÓRIO DE ESTRATÉGIA SEO E ARQUITETURA DE INFORMAÇÃO — FASE 02 (REVISÃO FINAL DE CONSISTÊNCIA)

> **Projeto:** AD Telas e Redes  
> **Domínio Novo (Produção):** `https://www.adtelasmosquiteiras.com.br/`  
> **Domínio Legado (Inteligência Histórica):** `https://adtelaseredes.com.br/`  
> **Data da Revisão Final:** 23 de Agosto de 2026  
> **Status:** `FASE 02 FINAL REVIEW: READY`  
> **Escopo:** Fase EXCLUSIVAMENTE ANALÍTICA e ESTRATÉGICA. Nenhuma alteração de código, remoção de página ou redirect executado.

---

## 1. Executive Summary

Este documento estabelece o planejamento estratégico e a reestruturação da arquitetura de informação para o projeto **AD Telas e Redes**. Ele baseia-se no cruzamento analítico rigoroso entre os dados brutos do Google Search Console do **Domínio Novo**, o histórico de demanda do **Domínio Legado (112.344 impressões / 3.812 cliques)** e a arquitetura técnica do projeto Nuxt 4.

### Diretrizes Centrais da Revisão:
1. **Rigor nos Dados (Proibição de Estimativas):** Todas as métricas apresentadas derivam exclusivamente dos exports oficiais do GSC. Consultas sem registro nos relatórios de páginas são formalmente marcadas como `NO_ROW_IN_GSC_PAGE_EXPORT` ou `NO_GSC_DATA`.
2. **Filtro Operacional Estrito:** A diretriz comercial confirmada é que **O LITORAL DE SÃO PAULO NÃO É ATENDIDO** (`OUT_OF_CURRENT_SERVICE_AREA`). Cidades litorâneas foram 100% excluídas do planejamento de páginas.
3. **Validação de Cobertura Geográfica:** Nenhuma cidade da Grande SP é classificada automaticamente como atendida sem validação humana. Criou-se a separação formal entre `GSC_DEMAND_CONFIRMED`, `BUSINESS_SERVICE_AREA_CONFIRMED` e `BOTH_CONFIRMED`.
4. **Páginas Locais Condicionais (Base vs Wave 1):** A arquitetura base indexável é de **20 URLs**. As 3 páginas locais da Wave 1 (*São Bernardo, Suzano, Mauá*) permanecem **condicionais** (`CONDITIONAL_WAVE_1 = 3`) e só entrarão no sitemap após validação humana explícita (`BUSINESS_SERVICE_AREA_CONFIRMED = TRUE`).
5. **Rejeição de Fusões Artificiais de Serviços:** Eliminados agrupamentos forçados (como juntar piscinas com telhados ou restaurantes com indústrias). Serviços com intenções distintas recebem landing dedicada ou são incorporados de forma limpa ao Hub correspondente.
6. **Copy Factual e Neutra nos Portões de Validação (`CLAIM_GATES`):** Nenhuma afirmação técnica não comprovada (INMETRO, 500kg, 2 anos de garantia, ANVISA, "Alta Resistência", "Garantia de Fábrica") será inserida em títulos ou H1s. Utiliza-se copy estritamente factual e neutra ("Instalação profissional", "Sob medida", "Para janelas e portas").
7. **Racional de Simplificação de Slugs:** A redução da profundidade de URLs (ex: `/servicos/telas/residencial/janelas` ➔ `/servicos/telas/janelas`) é uma decisão de **clareza de taxonomia e manutenibilidade**, e **não uma promessa algorítmica de ganho de ranking**.
8. **Tratamento Factual de URLs Legadas (`LEGACY_URL_HANDLING`):** Não há blanket 410 para as 891+ páginas antigas de bairros. URLs sem substituto direto mantêm o status padrão **HTTP 404 (Not Found)**. O redirecionamento 301 ocorre apenas para equivalentes legítimos (ex: `/bairros` ➔ `/areas-atendidas`).
9. **Comprometimento do Domínio Legado:** Evidências de injeção de links de apostas/cassino no domínio antigo colocam qualquer decisão de migração ou redirect 301 de domínio em espera: `DEFERRED_UNTIL_LEGACY_SECURITY_AND_BACKLINK_AUDIT`.

---

## 2. DATA_CORRECTIONS (Correções em Relação às Versões Anteriores)

| Item Corrigido | Versão Anterior | Versão Atual Revisada (Final) | Justificativa / Fonte Bruta |
| :--- | :--- | :--- | :--- |
| **Contagem de Redirects** | Informava 34 origens | **44 Renderizáveis + 1 Legada 404 = 45 Origens de Redirect** | 8 Mantidas + 5 Noindex + 44 Redirecionadas = 57 Renderizáveis. `/bairros` soma +1 (45 total). |
| **Páginas Locais no Sitemap** | 23 URLs no sitemap final | **BASE_INDEXABLE = 20 / CONDITIONAL_WAVE_1 = 3** | Cidades locais não entram no sitemap até confirmação humana formal. |
| **Claims e Propostas de Copy** | "Alta Resistência / Garantia de Fábrica" | **Copy Factual e Neutra ("Sob medida", "Profissional")** | Não trocar claims não comprovados por novos claims também sem laudo. |
| **Tratamento de 891+ URLs de Bairros** | Blanket 410 para tudo | **404 Padrão / 301 para Equivalente / 410 apenas se justificado** | Manter o padrão do protocolo HTTP sem criar regras massivas desnecessárias. |
| **Racional de Slugs Curtos** | Implicação de ganho de ranking | **Decisão de Arquitetura e Manutenibilidade** | URLs mais curtas organizam o site, mas não garantem posições por si sós. |
| **Páginas de Serviço no GSC Novo** | Afirmava "< 10 impressões cada" | `NO_ROW_IN_GSC_PAGE_EXPORT` | O export de páginas do novo domínio possui apenas 5 linhas registradas. |
| **Tráfego do Legado por País** | Estimava "~85% Brasil" | **3.761 cliques de 3.812 (98,66%) no Brasil** | Dado exato do CSV de Países do GSC Legado. |
| **Tráfego do Legado por Dispositivo**| Estimava "~72% Mobile" | **2.939 cliques de 3.812 (77,10%) em Mobile** | Dado exato do CSV de Dispositivos do GSC Legado. |
| **Dados de Santo André** | Estimava "~60 cliques / ~1.200 imp" | **6 cliques / 119 impressões / CTR 5,04% / Pos 11,52** | URL principal no export do GSC Legado. |
| **Dados de Barueri** | Estimava "~50 cliques / ~1.100 imp" | **0 cliques / 103 impressões / CTR 0,00% / Pos 11,17** | URL principal no export do GSC Legado. |
| **Dados de Osasco** | Estimava número agregado | **Discriminado por URL (Total: 17 cliques / 783 imp)** | 3 URLs somadas explicitamente no relatório. |

---

## 3. RAW_GSC_VALIDATION (Dados Brutos Comprovados)

### 3.1 Domínio Novo (`adtelasmosquiteiras.com.br`) — Export Oficial de Páginas

| URL Registrada no GSC Novo | Cliques Brutos | Impressões Brutas | CTR Bruto | Posição Média Bruta |
| :--- | :---: | :---: | :---: | :---: |
| `https://www.adtelasmosquiteiras.com.br/` | 51 | 2.495 | 2,04% | 8,85 |
| `https://www.adtelasmosquiteiras.com.br/servicos/redes` | 1 | 109 | 0,92% | 37,19 |
| `https://www.adtelasmosquiteiras.com.br/por-que-instalar-tela-mosquiteira` | 0 | 59 | 0,00% | 8,78 |
| `https://www.adtelasmosquiteiras.com.br/bairros` | 0 | 29 | 0,00% | 7,21 |
| `https://www.adtelasmosquiteiras.com.br/politica-de-privacidade.html` | 0 | 1 | 0,00% | 34,00 |
| *Todas as outras 52 URLs do projeto* | `NO_ROW_IN_GSC_PAGE_EXPORT` | `NO_ROW_IN_GSC_PAGE_EXPORT` | `NO_ROW_IN_GSC_PAGE_EXPORT` | `NO_ROW_IN_GSC_PAGE_EXPORT` |

---

### 3.2 Domínio Legado (`adtelaseredes.com.br`) — Dados Brutos das Principais Páginas Locais

| URL Local no Domínio Legado | Cliques Brutos | Impressões Brutas | CTR Bruto | Posição Média Bruta |
| :--- | :---: | :---: | :---: | :---: |
| `.../tela-mosquiteira-em-sao-bernardo-do-campo/` | 194 | 3.031 | 6,40% | 9,15 |
| `.../tela-mosquiteira-em-suzano/` | 147 | 3.088 | 4,76% | 6,82 |
| `.../tela-mosquiteira-em-itaquaquecetuba/` | 108 | 1.855 | 5,82% | 7,43 |
| `.../tela-mosquiteira-em-maua/` | 108 | 1.615 | 6,69% | 10,38 |
| `.../tela-mosquiteira-em-sao-caetano-do-sul/` | 91 | 1.457 | 6,25% | 13,56 |
| `.../tela-mosquiteira-em-guarulhos/` | 83 | 2.869 | 2,89% | 11,20 |
| `.../tela-mosquiteira-em-cotia/` | 74 | 1.986 | 3,73% | 9,10 |
| `.../tela-mosquiteira-em-santo-andre/` | 6 | 119 | 5,04% | 11,52 |
| `.../tela-mosquiteira-em-barueri/` | 0 | 103 | 0,00% | 11,17 |
| **URLs de Osasco (Discriminação Exata):** | | | | |
| • `.../tela-para-janela-em-osasco/` | 9 | 608 | 1,48% | 9,45 |
| • `.../fibra-de-vidro-em-osasco/` | 6 | 59 | 10,17% | 6,80 |
| • `.../tela-mosquiteira-em-osasco/` | 2 | 116 | 1,72% | 9,85 |
| **Total Osasco (Soma das 3 URLs):** | **17** | **783** | **2,17%** | — |

---

## 4. SERVICE_AREA_VALIDATION_MATRIX (Matriz de Cobertura Operacional)

```
Critério de Aprovação para Landing Page Local:
[ GSC_DEMAND_CONFIRMED ] + [ BUSINESS_SERVICE_AREA_CONFIRMED ] = [ BOTH_CONFIRMED ]
```

| Cidade / Município | Demanda GSC Legado | Confirmação Comercial Operacional | Status de Validação | Ação Estratégica na Arquitetura |
| :--- | :---: | :---: | :---: | :--- |
| **São Bernardo do Campo** | `GSC_DEMAND_CONFIRMED` (194 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | `CONDITIONAL_WAVE_1` (Publicar somente pós-validação) |
| **Suzano** | `GSC_DEMAND_CONFIRMED` (147 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | `CONDITIONAL_WAVE_1` (Publicar somente pós-validação) |
| **Mauá** | `GSC_DEMAND_CONFIRMED` (108 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | `CONDITIONAL_WAVE_1` (Publicar somente pós-validação) |
| **Itaquaquecetuba** | `GSC_DEMAND_CONFIRMED` (108 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | Candidata para Wave 2 |
| **São Caetano do Sul** | `GSC_DEMAND_CONFIRMED` (91 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | Candidata para Wave 2 |
| **Guarulhos** | `GSC_DEMAND_CONFIRMED` (83 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | Candidata para Wave 2 |
| **Cotia / Granja Viana** | `GSC_DEMAND_CONFIRMED` (74 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | Candidata para Wave 2 |
| **Osasco** | `GSC_DEMAND_CONFIRMED` (17 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | Avaliar somente pós-Wave 2 |
| **Santo André** | Baixa Demanda (6 cliques) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | Incorporar no Hub Geral de Áreas |
| **Barueri / Alphaville** | Baixa Demanda (0 cliques / 103 imp) | `NEEDS_BUSINESS_CONFIRMATION` | Pendente Validação | Incorporar no Hub Geral de Áreas |
| **Santos / Baixada Santista**| `GSC_DEMAND_CONFIRMED` (120+ cliques)| **NÃO ATENDIDO (Confirmado)** | `OUT_OF_CURRENT_SERVICE_AREA`| ❌ **PROIBIDO CRIAR PÁGINA** |
| **Itanhaém / Peruíbe** | `GSC_DEMAND_CONFIRMED` (200+ cliques)| **NÃO ATENDIDO (Confirmado)** | `OUT_OF_CURRENT_SERVICE_AREA`| ❌ **PROIBIDO CRIAR PÁGINA** |
| **Ubatuba / Caraguá** | `GSC_DEMAND_CONFIRMED` (65+ cliques) | **NÃO ATENDIDO (Confirmado)** | `OUT_OF_CURRENT_SERVICE_AREA`| ❌ **PROIBIDO CRIAR PÁGINA** |

---

## 5. LOCAL_PAGE_ROLLOUT_PLAN (Plano Condicional de Publicação Local)

```
                            CRONOGRAMA DE ROLLOUT LOCAL
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ 🔒 BASE DE LANÇAMENTO INICIAL (0 Páginas Locais no Sitemap Inicial)      │
  │ • /areas-atendidas (Hub Central explicativo de atendimento por CEP)     │
  ├─────────────────────────────────────────────────────────────────────────┤
  │ 🚀 WAVE 1: LIBERAÇÃO CONDICIONAL (Máximo 3 Cidades)                     │
  │ • /areas-atendidas/sao-bernardo-do-campo                                │
  │ • /areas-atendidas/suzano                                               │
  │ • /areas-atendidas/maua                                                 │
  │ Condição Mandatória: BUSINESS_SERVICE_AREA_CONFIRMED = TRUE             │
  │ Regra de Conteúdo: Fotos locais legítimas, tempo de deslocamento real   │
  │ e bairros atendidos. Se faltar informação ➔ DO_NOT_PUBLISH_YET.         │
  ├─────────────────────────────────────────────────────────────────────────┤
  │ 🔍 PERÍODO DE MONITORAMENTO (60 a 90 Dias)                              │
  │ • Acompanhar indexação, CTR e conversões de lead nos 3 municípios piloto│
  ├─────────────────────────────────────────────────────────────────────────┤
  │ 📈 WAVE 2: EXPANSÃO CONDICIONADA (4 Cidades Secundárias)                │
  │ • /areas-atendidas/itaquaquecetuba                                      │
  │ • /areas-atendidas/sao-caetano-do-sul                                   │
  │ • /areas-atendidas/guarulhos                                            │
  │ • /areas-atendidas/cotia-e-granja-viana                                 │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. CLAIM_GATES (Portões de Validação e Copy Factual Neutra)

Nenhum claim não documentado será utilizado. Adota-se copy estritamente factual e neutra:

| Claim no Código Antigo | Situação Atual | Proposta de Substituição Factual Neutra | Ação de Desbloqueio Técnico |
| :--- | :--- | :--- | :--- |
| **"Certificado INMETRO"** | `CLAIM_PENDING_VALIDATION` | *"Redes de proteção para janelas e sacadas"* | Apresentar laudo/certificado de fabricante |
| **"Resiste até 500kg / 500kg/m²"** | `CLAIM_PENDING_VALIDATION`| *"Rede de proteção instalada sob medida"* | Apresentar laudo de ensaio mecânico |
| **"Garantia de 2 Anos"** | `CLAIM_PENDING_VALIDATION` | *"Instalação com garantia de serviço"* | Confirmar termo de garantia emitido |
| **"Normas da ANVISA"** | `CLAIM_PENDING_VALIDATION` | *"Telas mosquiteiras para cozinhas e restaurantes"* | Validar conformidade técnica com RDC 216 |
| **"Antichamas / Anti-Mofo"** | `CLAIM_PENDING_VALIDATION` | *"Estrutura em alumínio e malha em fibra de vidro"*| Ficha técnica do fornecedor da matéria-prima |
| **"Instalação em 24h"** | `CLAIM_PENDING_VALIDATION` | *"Instalação profissional com agendamento ágil"* | Confirmar SLA operacional da equipe |

---

## 7. LEGACY_URL_HANDLING (Tratamento de URLs Históricas)

Para evitar regras desnecessárias no servidor e seguir as boas práticas do protocolo HTTP:

1. **URLs com Equivalente Legítimo (`KNOWN_EQUIVALENT_URL`):**
   * Redirecionamento **HTTP 301** para o destino semanticamente correto (ex: `/bairros` ➔ `/areas-atendidas`; `/servicos/tela-mosquiteira` ➔ `/servicos/telas`).
2. **URLs Removidas Sem Equivalente Direto (`REMOVED_URL_WITHOUT_EQUIVALENT`):**
   * Retornam **HTTP 404 (Not Found)** padrão do Nuxt. Não haverá redirecionamento forçado de centenas de URLs de bairros antigos para a Home, pois o Google interpreta isso como *Soft 404*.
3. **Uso de HTTP 410 (Gone):**
   * Reservado estritamente para casos em que o Google Search Console aponte tentativas anômalas e contínuas de rastreamento de um endpoint específico que precise de expurgo imediato do índice.

---

## 8. Racional de Arquitetura para Simplificação de Slugs

A proposta de simplificação de URLs (ex: `/servicos/telas/residencial/janelas` ➔ `/servicos/telas/janelas`):
* **Motivação:** Limpeza de taxonomia, eliminação de níveis intermediários artificiais (*residencial/especiais*) que geravam *thin content*, facilidade de manutenção e melhor experiência de navegação para o usuário.
* **Alinhamento Técnico:** **Não se trata de uma promessa algorítmica de que URLs mais curtas ranqueiam melhor por si sós**. O ganho de posicionamento virá da consolidação de links internos e da substituição de templates duplicados por conteúdo único e relevante.

---

## 9. EXACT_FINAL_URL_COUNT (Contagem Exata e Rigorosa da Arquitetura)

Discriminação matemática exata de todas as URLs do projeto:

```
┌────────────────────────────────────────────────────────────────────────────┬──────────┐
│ Métrica Arquitetural                                                       │ Contagem │
├────────────────────────────────────────────────────────────────────────────┼──────────┤
│ CURRENT_RENDERABLE (Total de rotas renderizáveis no código atual)          │    57    │
│  ├─ Permanecem com o mesmo pathname limpo                                  │     8    │
│  ├─ Rotas privadas / técnicas NOINDEX                                      │     5    │
│  └─ Rotas renderizáveis que serão redirecionadas (301)                     │    44    │
├────────────────────────────────────────────────────────────────────────────┼──────────┤
│ TOTAL_REDIRECT_SOURCES (Origens de redirecionamento 301 mapeadas)          │    45    │
│  ├─ CURRENT_RENDERABLE_REDIRECTED (2 slugs legados + 7 categ. + 35 serv.)  │    44    │
│  └─ LEGACY_404_TO_REDIRECT (/bairros ➔ /areas-atendidas)                   │     1    │
├────────────────────────────────────────────────────────────────────────────┼──────────┤
│ BASE_INDEXABLE (Total de páginas no Sitemap Canônico Inicial)              │    20    │
│  ├─ INSTITUTIONAL (Home, Orçamento, Contato)                               │     3    │
│  ├─ EDITORIAL (Artigo de Saúde Arboviroses)                                │     1    │
│  ├─ SPECIALIZED_SERVICE (Vidraçaria)                                       │     1    │
│  ├─ SERVICE_HUBS (Central de Serviços, Hub Telas, Hub Redes)                │     3    │
│  ├─ SERVICE_LANDINGS (6 Landings de Telas + 5 Landings de Redes)           │    11    │
│  └─ LOCAL_HUB (/areas-atendidas)                                           │     1    │
├────────────────────────────────────────────────────────────────────────────┼──────────┤
│ CONDITIONAL_WAVE_1 (Páginas locais dependentes de confirmação comercial)   │     3    │
│ MAX_INDEXABLE_AFTER_WAVE_1_APPROVAL (Sitemap com Wave 1 aprovada)         │    23    │
├────────────────────────────────────────────────────────────────────────────┼──────────┤
│ NOINDEX (Acessíveis aos usuários, mas fora do Google e do Sitemap)         │     5    │
│  ├─ /obrigado (Conversão de Leads)                                         │     1    │
│  ├─ /admin/dashboard e /admin/leads (Painel Administrativo)                │     2    │
│  └─ /politica-de-privacidade.html e /termos-de-uso.html (Páginas Legais)   │     2    │
└────────────────────────────────────────────────────────────────────────────┴──────────┘
```

---

## 10. COMPLETE_URL_MIGRATION_MAP (Mapa de Todas as 45 Origens de Redirect)

Mapeamento exato de **todas as 45 URLs de origem afetadas**:

| # | CURRENT_URL | CURRENT_STATUS | FINAL_URL | FINAL_ACTION | HTTP_STATUS | REASON |
| :-: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | `/bairros` | 404 Atual | `/areas-atendidas` | Merge Geográfico | `301` | Intenção compartilhada de consulta de cobertura |
| 2 | `/servicos/rede-protecao` | 200 Indexável | `/servicos/redes` | Merge de Canibalização | `301` | Eliminar sobreposição direta com o Hub de Redes |
| 3 | `/servicos/tela-mosquiteira` | 200 Indexável | `/servicos/telas` | Merge de Canibalização | `301` | Eliminar sobreposição direta com o Hub de Telas |
| 4 | `/servicos/redes/residencial` | 200 Indexável | `/servicos/redes` | Consolidação de Categoria | `301` | Categoria intermediária frágil sem busca própria |
| 5 | `/servicos/redes/pets` | 200 Indexável | `/servicos/redes/gatos-e-pets`| Consolidação de Categoria | `301` | Apontar diretamente para a landing rica de Pets |
| 6 | `/servicos/redes/comercial` | 200 Indexável | `/servicos/redes` | Consolidação de Categoria | `301` | Categoria intermediária incorporada ao Hub |
| 7 | `/servicos/telas/residencial` | 200 Indexável | `/servicos/telas` | Consolidação de Categoria | `301` | Categoria intermediária frágil sem busca própria |
| 8 | `/servicos/telas/especiais` | 200 Indexável | `/servicos/telas` | Consolidação de Categoria | `301` | Categoria intermediária incorporada ao Hub |
| 9 | `/servicos/telas/pet` | 200 Indexável | `/servicos/telas/pet-screen` | Consolidação de Categoria | `301` | Apontar diretamente para a landing de Pet Screen |
| 10 | `/servicos/telas/comercial` | 200 Indexável | `/servicos/telas` | Consolidação de Categoria | `301` | Categoria intermediária incorporada ao Hub |
| 11 | `/servicos/redes/residencial/janelas` | 200 Indexável | `/servicos/redes/janelas` | Reconstrução Canônica | `301` | Simplificação de taxonomia + Conteúdo exclusivo |
| 12 | `/servicos/redes/residencial/sacadas` | 200 Indexável | `/servicos/redes/sacadas-e-varandas` | Reconstrução Canônica | `301` | Consolidação unificada de Sacadas e Varandas |
| 13 | `/servicos/redes/residencial/varandas` | 200 Indexável | `/servicos/redes/sacadas-e-varandas` | Merge de Sinônimo | `301` | Varanda e sacada representam o mesmo produto |
| 14 | `/servicos/redes/residencial/apartamentos` | 200 Indexável | `/servicos/redes` | Merge de Intenção | `301` | Apartamento é atendido por janelas + sacadas |
| 15 | `/servicos/redes/residencial/portas` | 200 Indexável | `/servicos/redes` | Merge no Hub | `301` | Demanda insignificante para página isolada |
| 16 | `/servicos/redes/residencial/escadas` | 200 Indexável | `/servicos/redes/escadas-e-mezaninos` | Reconstrução Canônica | `301` | Landing especializada para sobrados |
| 17 | `/servicos/redes/residencial/basculantes` | 200 Indexável | `/servicos/redes/janelas` | Merge de Sinônimo | `301` | Basculante é subtipo de janela |
| 18 | `/servicos/redes/pets/criancas` | 200 Indexável | `/servicos/redes/criancas` | Reconstrução Canônica | `301` | Landing de alta demanda (proteção infantil) |
| 19 | `/servicos/redes/pets/gatos` | 200 Indexável | `/servicos/redes/gatos-e-pets` | Reconstrução Canônica | `301` | Landing de alta demanda (proteção felina) |
| 20 | `/servicos/redes/pets/cachorros` | 200 Indexável | `/servicos/redes/gatos-e-pets` | Merge no Grupo | `301` | Unificação no cluster de Pets |
| 21 | `/servicos/redes/pets/animais` | 200 Indexável | `/servicos/redes/gatos-e-pets` | Merge no Grupo | `301` | Unificação no cluster de Pets |
| 22 | `/servicos/redes/pets/idosos` | 200 Indexável | `/servicos/redes` | Merge no Hub | `301` | Aplicação incorporada ao Hub de Redes |
| 23 | `/servicos/redes/comercial/piscinas` | 200 Indexável | `/servicos/redes` | Merge no Hub | `301` | Aplicação incorporada ao Hub de Redes |
| 24 | `/servicos/redes/comercial/telhados` | 200 Indexável | `/servicos/redes` | Merge no Hub | `301` | Aplicação incorporada ao Hub de Redes |
| 25 | `/servicos/redes/comercial/portoes` | 200 Indexável | `/servicos/redes` | Merge no Hub | `301` | Aplicação incorporada ao Hub de Redes |
| 26 | `/servicos/redes/comercial/muros` | 200 Indexável | `/servicos/redes` | Merge no Hub | `301` | Aplicação incorporada ao Hub de Redes |
| 27 | `/servicos/redes/comercial/coberturas` | 200 Indexável | `/servicos/redes` | Merge no Hub | `301` | Aplicação incorporada ao Hub de Redes |
| 28 | `/servicos/telas/residencial/janelas` | 200 Indexável | `/servicos/telas/janelas` | Reconstrução Canônica | `301` | Top 1 cluster de demanda (Reescrita completa) |
| 29 | `/servicos/telas/residencial/portas` | 200 Indexável | `/servicos/telas/portas` | Reconstrução Canônica | `301` | Landing dedicada de portas balcão/passagem |
| 30 | `/servicos/telas/residencial/varandas` | 200 Indexável | `/servicos/telas/sacadas-e-varandas` | Reconstrução Canônica | `301` | Consolidação unificada de Sacadas e Varandas |
| 31 | `/servicos/telas/residencial/sacadas` | 200 Indexável | `/servicos/telas/sacadas-e-varandas` | Merge de Sinônimo | `301` | Varanda e sacada representam o mesmo produto |
| 32 | `/servicos/telas/residencial/apartamentos` | 200 Indexável | `/servicos/telas` | Merge de Intenção | `301` | Apartamento é atendido por janelas + portas |
| 33 | `/servicos/telas/residencial/banheiro` | 200 Indexável | `/servicos/telas/janelas` | Merge de Sinônimo | `301` | Janela pequena basculante de banheiro |
| 34 | `/servicos/telas/especiais/correr` | 200 Indexável | `/servicos/telas/janelas` | Merge de Sistema | `301` | Sistema de correr incorporado na landing de janelas |
| 35 | `/servicos/telas/especiais/pivotante` | 200 Indexável | `/servicos/telas` | Merge no Hub | `301` | Modelo incorporado como opção no Hub de Telas |
| 36 | `/servicos/telas/especiais/removivel` | 200 Indexável | `/servicos/telas/removivel` | Reconstrução Canônica | `301` | Cluster comprovado no GSC (telas magnéticas) |
| 37 | `/servicos/telas/especiais/basculante` | 200 Indexável | `/servicos/telas/janelas` | Merge de Sinônimo | `301` | Modelo basculante incorporado em janelas |
| 38 | `/servicos/telas/especiais/aluminio` | 200 Indexável | `/servicos/telas` | Merge de Material | `301` | Alumínio é o perfil padrão (evitar query DIY) |
| 39 | `/servicos/telas/especiais/acoinox` | 200 Indexável | `/servicos/telas` | Merge de Material | `301` | Inox incorporado como opção de especificação |
| 40 | `/servicos/telas/pet/pets` | 200 Indexável | `/servicos/telas/pet-screen` | Reconstrução Canônica | `301` | Landing especializada Pet Screen anti-arranhão |
| 41 | `/servicos/telas/pet/pernilongos` | 200 Indexável | `/servicos/telas` | Merge no Hub | `301` | Função básica de qualquer tela mosquiteira |
| 42 | `/servicos/telas/comercial/fachadas` | 200 Indexável | `/servicos/telas` | Merge no Hub | `301` | Aplicação comercial no Hub |
| 43 | `/servicos/telas/comercial/coberturas` | 200 Indexável | `/servicos/telas` | Merge no Hub | `301` | Aplicação comercial no Hub |
| 44 | `/servicos/telas/comercial/restaurantes` | 200 Indexável | `/servicos/telas/restaurantes` | Reconstrução Canônica | `301` | Landing B2B sanitária para cozinhas |
| 45 | `/servicos/telas/comercial/industrias` | 200 Indexável | `/servicos/telas` | Merge no Hub | `301` | Aplicação comercial no Hub |

---

## 11. Proposed Final Sitemap (Estrutura do Sitemap.xml)

### `BASE_INDEXABLE` (20 URLs Oficiais do Lançamento):
1. `https://www.adtelasmosquiteiras.com.br/`
2. `https://www.adtelasmosquiteiras.com.br/orcamento`
3. `https://www.adtelasmosquiteiras.com.br/contato`
4. `https://www.adtelasmosquiteiras.com.br/por-que-instalar-tela-mosquiteira`
5. `https://www.adtelasmosquiteiras.com.br/servicos`
6. `https://www.adtelasmosquiteiras.com.br/servicos/vidracaria`
7. `https://www.adtelasmosquiteiras.com.br/servicos/telas`
8. `https://www.adtelasmosquiteiras.com.br/servicos/telas/janelas`
9. `https://www.adtelasmosquiteiras.com.br/servicos/telas/portas`
10. `https://www.adtelasmosquiteiras.com.br/servicos/telas/sacadas-e-varandas`
11. `https://www.adtelasmosquiteiras.com.br/servicos/telas/removivel`
12. `https://www.adtelasmosquiteiras.com.br/servicos/telas/pet-screen`
13. `https://www.adtelasmosquiteiras.com.br/servicos/telas/restaurantes`
14. `https://www.adtelasmosquiteiras.com.br/servicos/redes`
15. `https://www.adtelasmosquiteiras.com.br/servicos/redes/janelas`
16. `https://www.adtelasmosquiteiras.com.br/servicos/redes/sacadas-e-varandas`
17. `https://www.adtelasmosquiteiras.com.br/servicos/redes/gatos-e-pets`
18. `https://www.adtelasmosquiteiras.com.br/servicos/redes/criancas`
19. `https://www.adtelasmosquiteiras.com.br/servicos/redes/escadas-e-mezaninos`
20. `https://www.adtelasmosquiteiras.com.br/areas-atendidas`

### `CONDITIONAL_WAVE_1` (3 URLs Locais Dependentes de Confirmação Comercial):
* `https://www.adtelasmosquiteiras.com.br/areas-atendidas/sao-bernardo-do-campo` *(Pendente)*
* `https://www.adtelasmosquiteiras.com.br/areas-atendidas/suzano` *(Pendente)*
* `https://www.adtelasmosquiteiras.com.br/areas-atendidas/maua` *(Pendente)*

### `NOINDEX` (5 URLs):
* `https://www.adtelasmosquiteiras.com.br/obrigado`
* `https://www.adtelasmosquiteiras.com.br/admin/dashboard`
* `https://www.adtelasmosquiteiras.com.br/admin/leads`
* `https://www.adtelasmosquiteiras.com.br/politica-de-privacidade.html`
* `https://www.adtelasmosquiteiras.com.br/termos-de-uso.html`

---

## 12. Two-Domain Strategy & Legacy Security Risk

* **Diagnóstico de Segurança:** O código HTML público do domínio legado `adtelaseredes.com.br` contém injeções de links de apostas esportivas (1xBet), termos de cassino e textos em língua turca/inglesa (`LEGACY_SITE_COMPROMISE_SUSPECTED`).
* **Decisão:** `DEFERRED_UNTIL_LEGACY_SECURITY_AND_BACKLINK_AUDIT`. O domínio contém conteúdo injetado e deve ser sanitizado e auditado antes de qualquer decisão de migração ou redirecionamento 301 de domínio.

---

## 13. Human Inputs Required (Validações do Proprietário)

Para autorizar a execução da Fase 03, solicitamos a confirmação dos seguintes pontos:
1. **Validação Comercial de Atendimento para Wave 1:** A empresa atende ativamente *São Bernardo do Campo*, *Suzano* e *Mauá*? Se sim, as 3 páginas locais da Wave 1 serão ativadas no plano de criação.
2. **Confirmação do Mapa de 45 Redirects:** O proprietário aprova a consolidação das 44 rotas de serviço/categoria e da rota `/bairros` para a nova taxonomia limpa?
