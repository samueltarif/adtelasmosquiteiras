# SEO FASE 03D — SEARCH CONSOLE RELEASE & PROCEDIMENTO DE MIGRAÇÃO NO GOOGLE

**Projeto:** AD Telas e Redes — `adtelasmosquiteiras.com.br`  
**Fase:** 03D — Search Console Release & Procedimento de Transição  
**Data:** 2026-08-23  
**Status:** `READY FOR REVIEW`

---

## 1. Current Production State (Estado Real Confirmado em Produção)

A nova arquitetura SEO já está ativada e operando ao vivo no domínio principal (`https://www.adtelasmosquiteiras.com.br`):

- **Status dos Redirecionamentos 301:** `LIVE_REDIRECTS = 45/45 PASS` (100% das 45 origens mapeadas respondem HTTP 301 direto na borda da Vercel).
- **Status das URLs Canônicas Finais:** `LIVE_FINAL_URLS = 20/20 PASS` (Todas as 20 URLs canônicas respondem HTTP 200, com 1 tag canonical autorreferencial e 1 tag `<h1>`).
- **Status do Sitemap XML:** `LIVE_SITEMAP_URLS = 20` (`https://www.adtelasmosquiteiras.com.br/sitemap.xml` ativo com HTTP 200, contendo 0 redirects, 0 noindex e 0 404).
- **Cadeias e Loops:** `REDIRECT_CHAINS = 0` e `REDIRECT_LOOPS = 0`.
- **Autenticação Admin:** `ADMIN_AUTH_IMPLEMENTATION = DEFERRED_BY_USER` (Pendente para fase posterior).
- **Ações no Search Console:** `SEARCH_CONSOLE_CHANGED = NO` (Nenhuma ação automática ou manual foi realizada no painel sem autorização humana expressa).

---

## 2. Sitemap Submission Procedure (Procedimento Oficial de Submissão)

### A) URL do Sitemap Oficial
O único sitemap oficial da aplicação para submissão no Google Search Console é:
```
https://www.adtelasmosquiteiras.com.br/sitemap.xml
```

### B) Passos para Submissão Manual no Painel (Instrução para o Operador Humano)
1. Acesse a propriedade verificada `https://www.adtelasmosquiteiras.com.br/` no [Google Search Console](https://search.google.com/search-console).
2. No menu lateral esquerdo, sob a seção **Indexação**, clique em **Sitemaps**.
3. Em *Adicionar um novo sitemap*, insira apenas o sufixo: `sitemap.xml`.
4. Clique em **Enviar**.
5. Verifique se o status do envio é reportado como **Sucesso** com **20 URLs descobertas**.

> [!CAUTION]
> **REGRAS DE SEGURANÇA:**
> - **NÃO** criar sitemaps secundários ou divididos por categoria.
> - **NÃO** enviar sitemaps contendo as 45 URLs antigas redirecionadas.
> - **NÃO** submeter sitemaps de domínios legados.

---

## 3. Priority URL Inspection List (Lista Priorizada para Inspeção de URL)

Recomenda-se a utilização da ferramenta **Inspeção de URL** (*URL Inspection*) do Search Console para solicitar a reindexação prioritária da nova estrutura em duas fases, respeitando o limite diário da API/Painel do Google.

### Prioridade P0 — Páginas Núcleo e Topo de Funil (9 URLs):

| # | URL Canônica Final | Intenção / Categoria | Ação Recomendada no GSC |
| :-: | :--- | :--- | :--- |
| 1 | `https://www.adtelasmosquiteiras.com.br/` | Home Principal | Inspecionar URL ➔ *Solicitar Indexação* |
| 2 | `https://www.adtelasmosquiteiras.com.br/servicos/telas` | Hub Comercial de Telas | Inspecionar URL ➔ *Solicitar Indexação* |
| 3 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/janelas` | Landing Telas para Janelas | Inspecionar URL ➔ *Solicitar Indexação* |
| 4 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/portas` | Landing Telas para Portas | Inspecionar URL ➔ *Solicitar Indexação* |
| 5 | `https://www.adtelasmosquiteiras.com.br/servicos/telas/removivel` | Landing Telas Removíveis | Inspecionar URL ➔ *Solicitar Indexação* |
| 6 | `https://www.adtelasmosquiteiras.com.br/servicos/redes` | Hub Comercial de Redes | Inspecionar URL ➔ *Solicitar Indexação* |
| 7 | `https://www.adtelasmosquiteiras.com.br/servicos/redes/janelas` | Landing Redes para Janelas | Inspecionar URL ➔ *Solicitar Indexação* |
| 8 | `https://www.adtelasmosquiteiras.com.br/servicos/redes/gatos-e-pets` | Landing Redes para Gatos e Pets | Inspecionar URL ➔ *Solicitar Indexação* |
| 9 | `https://www.adtelasmosquiteiras.com.br/areas-atendidas` | Hub Geográfico / Busca CEP | Inspecionar URL ➔ *Solicitar Indexação* |

### Prioridade P1 — Demais URLs do Sitemap (11 URLs):

10. `https://www.adtelasmosquiteiras.com.br/servicos`
11. `https://www.adtelasmosquiteiras.com.br/servicos/telas/sacadas-e-varandas`
12. `https://www.adtelasmosquiteiras.com.br/servicos/telas/pet-screen`
13. `https://www.adtelasmosquiteiras.com.br/servicos/telas/restaurantes`
14. `https://www.adtelasmosquiteiras.com.br/servicos/redes/sacadas-e-varandas`
15. `https://www.adtelasmosquiteiras.com.br/servicos/redes/criancas`
16. `https://www.adtelasmosquiteiras.com.br/servicos/redes/escadas-e-mezaninos`
17. `https://www.adtelasmosquiteiras.com.br/servicos/vidracaria`
18. `https://www.adtelasmosquiteiras.com.br/orcamento`
19. `https://www.adtelasmosquiteiras.com.br/contato`
20. `https://www.adtelasmosquiteiras.com.br/por-que-instalar-tela-mosquiteira`

**Total de URLs Canônicas Mapeadas:** P0 (9) + P1 (11) = **20 URLs**.

> [!IMPORTANT]
> Se o Search Console exibir a mensagem de limite diário atingido (*"Cota de solicitações excedida"*), **não insista**. O Googlebot descobrirá as URLs restantes naturalmente através do `sitemap.xml` e da navegação interna.

---

## 4. Legacy URL Handling (Tratamento das 45 URLs Antigas)

- **Ferramenta de Remoção Temporária (*Removals*):** **NÃO UTILIZAR NESTA MIGRAÇÃO**. A ferramenta Removals produz ocultação temporária nos resultados de pesquisa e não é necessária para esta migração baseada em 301.
- **Bloqueio no `robots.txt`:** **NÃO BLOQUEAR**. As origens antigas devem permanecer 100% rastreáveis para que o Googlebot acesse o HTTP 301 e consolide o novo índice.
- **Processamento Natural:** O Googlebot atualizará gradualmente o status das URLs antigas no relatório de *Páginas* do Search Console para *"Página com redirecionamento"*.

---

## 5. Unmapped Legacy Neighborhood URLs (Tratamento das URLs de Bairros Antigos)

- URLs de bairros antigos sem correspondente direto (ex: `/tela-mosquiteira-em/moema`, `/rede-de-protecao-em/tatuape`) retornam **HTTP 404 (Not Found)** real no servidor.
- **Tratamento:** **NÃO** redirecionar artificialmente para a Home ou para `/areas-atendidas` (evita *Soft 404*).
- **Removals:** **NÃO** solicitar remoção em massa. O Google desindexará naturalmente as páginas 404 conforme re-rastrear o site.

---

## 6. Monitoring Baseline (Matriz de Acompanhamento no GSC)

Deverá ser registrada uma linha de base (*baseline*) das métricas do Search Console no dia do lançamento, separada pelos clusters principais:

| Cluster de Páginas | URLs Incluídas | Cliques (D-0) | Impressões (D-0) | CTR Médio | Posição Média |
|---|---|:---:|:---:|:---:|:---:|
| **HOME** | `/` | *Registrar no GSC* | *Registrar no GSC* | *GSC* | *GSC* |
| **TELAS** | `/servicos/telas/*` | *Registrar no GSC* | *Registrar no GSC* | *GSC* | *GSC* |
| **REDES** | `/servicos/redes/*` | *Registrar no GSC* | *Registrar no GSC* | *GSC* | *GSC* |
| **LOCAL** | `/areas-atendidas` | *Registrar no GSC* | *Registrar no GSC* | *GSC* | *GSC* |
| **OUTROS** | `/orcamento`, `/contato`, etc. | *Registrar no GSC* | *Registrar no GSC* | *GSC* | *GSC* |

### Métricas de Indexação a Acompanhar no GSC:
- `INDEXABLE_CANONICAL_URLS = 20`
- `TARGET_INDEXED_URLS = até 20` (A ausência temporária de uma URL no índice não gera rollback automaticamente).
- **Páginas com Redirecionamento:** Transição gradativa das 45 URLs legadas para esta categoria.
- **Não Encontradas (404):** Estabilização de URLs de bairros antigos sem equivalente.
- **Canonical Selecionada pelo Google:** Deve coincidir 100% com a *Canonical Declarada pelo Usuário*.

---

## 7. 7 / 14 / 30 / 60 / 90 Day Monitoring Plan (Janelas de Monitoramento)

Oscilações de posição e tráfego são normais nos primeiros 7 a 14 dias pós-migração de taxonomia.

```
[Dia D] ──> [D+7: Checagem Rastreio] ──> [D+14: Transferência 301] ──> [D+30: Estabilização] ──> [D+60: Crescimento] ──> [D+90: Maturidade]
```

### Protocolo de Cada Checkpoint:

- **Checkpoint D+7 (Saúde de Rastreamento):**
  - Verificação do relatório de *Sitemaps* (status, leituras e URLs descobertas).
  - Verificação se o Googlebot começou a registrar o status *Página com redirecionamento* nas 45 URLs antigas.
  - Verificação de erros 5xx (meta = 0).

- **Checkpoint D+14 (Transferência de Canonical):**
  - Inspeção por amostragem das 12 novas landing pages no GSC: validar se *Canonical Selecionada pelo Google* = *Canonical do Usuário*.
  - Acompanhamento da curva de transição de impressões das URLs antigas para as URLs novas.

- **Checkpoint D+30 (Estabilização de Desempenho):**
  - Comparação de cliques e impressões agregados (Home + Hubs + Landings) contra o baseline D-0.
  - Verificação do expurgo de URLs de categorias intermediárias descontinuadas dos resultados de pesquisa.

- **Checkpoint D+60 (Consolidação de Autoridade):**
  - Avaliação de ganhos de posicionamento orgânico nos clusters de *Telas para Janelas*, *Pet Screen* e *Redes para Gatos*.

- **Checkpoint D+90 (Maturidade da Nova Arquitetura):**
  - Relatório final de migração SEO com balanço comparativo de 90 dias de tráfego orgânico e conversões.

---

## 8. Rollback Triggers (Gatilhos Estritos de Reversão)

A migração NÃO deve ser revertida por pequenas oscilações de posição nas duas primeiras semanas ou por ausência temporária de indexação de uma URL individual. A reversão só será considerada caso ocorra um dos seguintes eventos críticos:
1. **Desindexação massiva não intencional da Home (`/`)** por mais de 5 dias seguidos.
2. **Surgimento de Loops de Redirecionamento (HTTP 310 / ERR_TOO_MANY_REDIRECTS)** detectados em produção pelo Googlebot.
3. **Surto de Erros de Servidor HTTP 500** afetando os hubs principais por mais de 24 horas.

---

## 9. Do Not Do List (O Que NÃO Fazer no Search Console)

- ❌ **NÃO UTILIZAR NESTA MIGRAÇÃO** a ferramenta Removals para as 45 URLs redirecionadas (a ferramenta produz apenas ocultação temporária nos resultados de pesquisa e não é necessária).
- ❌ **NÃO BLOQUEAR** as URLs antigas ou o parâmetro de query no `robots.txt`.
- ❌ **MANTER OS REDIRECTS** por pelo menos 1 ano e preferencialmente por mais tempo/indefinidamente enquanto URLs antigas ainda puderem receber tráfego ou backlinks.
- ❌ **NÃO APAGAR** os arquivos legados no repositório antes do período de estabilidade da migração.
- ❌ **NÃO ALTERAR** configurações de parâmetros de URL sem auditoria prévia.

---

## 10. Gate Summary

| Gate | Resultado |
|---|---|
| `LIVE_REDIRECTS` | ✅ `45/45 (PASS)` |
| `LIVE_FINAL_URLS` | ✅ `20/20 (PASS)` |
| `LIVE_SITEMAP_URLS` | ✅ `20 (PASS)` |
| `REDIRECT_CHAINS` | ✅ `0` |
| `REDIRECT_LOOPS` | ✅ `0` |
| `P0_INSPECTION_URLS` | ✅ `9` |
| `P1_INSPECTION_URLS` | ✅ `11` |
| `TOTAL_CANONICAL_URLS` | ✅ `20` |
| `INDEXABLE_CANONICAL_URLS` | ✅ `20` |
| `TARGET_INDEXED_URLS` | ✅ `até 20` |
| `REMOVALS_TOOL_RATIONALE` | ✅ `UPDATED (Ocultação Temporária)` |
| `REDIRECT_LONGEVITY_POLICY` | ✅ `UPDATED (≥1 ano / Indefinido)` |
| `SEARCH_CONSOLE_CHANGED` | ✅ `NO` |
| `ADMIN_AUTH_IMPLEMENTATION` | ✅ `DEFERRED_BY_USER` |

---

## Declaração Final

```
FASE 03D DOCUMENTATION CORRECTION: PASS
P0 URLS: 9
P1 URLS: 11
TOTAL CANONICAL URLS: 20
SEARCH CONSOLE ALTERADO: NÃO
ADMIN AUTH ALTERADO: NÃO
```
