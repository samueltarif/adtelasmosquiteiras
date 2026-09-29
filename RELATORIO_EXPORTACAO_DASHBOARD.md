# Relatório Técnico: Central de Exportação Analítica Completa do Dashboard

**Projeto:** AD Telas e Redes de Proteção  
**Status:** Implementado, Validado e Aprovado  
**Data:** 29 de Setembro de 2026  
**Ambiente:** Desenvolvimento Local e Produção (Nitro / Nuxt 4)  

---

## 1. Visão Geral da Funcionalidade

A **Central de Exportação de Dados** adiciona ao Painel Administrativo uma interface unificada, segura e de alta performance para extração e download da telemetria comercial e analítica do sistema. A ferramenta opera estritamente em modo **READ-ONLY**, sem alterar, inserir ou remover registros das tabelas de rastreamento.

---

## 2. Fontes de Dados e Mapeamento Arquitetural

| Seção do Dashboard | Endpoint Original | Tabela Supabase | Principais Campos Extraídos |
| :--- | :--- | :--- | :--- |
| **Resumo Geral** | `/api/admin/analytics/overview` | `page_views`, `lead_clicks`, `leads` | Visitantes únicos, novos vs recorrentes, sessões humanas, pageviews, cliques WhatsApp, inícios de formulário, leads comerciais, taxas de conversão |
| **Aquisição por Canal** | `/api/admin/analytics/acquisition` | `page_views`, `lead_clicks`, `leads` | 13 canais canônicos, rótulos canônicos, sessões, visitantes, pageviews, conversões |
| **Google Ads** | `/api/admin/analytics/google-ads/*` | `page_views`, `lead_clicks`, `leads` | Sessões Google Ads, gclid/wbraid/gbraid, campanhas UTM, termos/palavras-chave, criativos, ad groups, dispositivos, redes |
| **WhatsApp & Atribuição**| `/api/admin/marketing/whatsapp-attributions` | `whatsapp_attributions` | Códigos curtos, status de atribuição, canais, confiança, correspondência, timestamps |
| **Leads Comerciais** | `/api/admin/leads` | `leads` | IDs, canais de sessão/primeiro toque, campanhas, serviços, status comercial |
| **KPIs de Campanhas** | `/api/admin/marketing/campaign-kpis` | `campaign_kpi_entries` | Plataforma, campanha, orçamento planejado, gasto real, cliques, contatos WhatsApp, vendas, receita, ROAS, CPL |
| **Telemetria de Páginas**| `/api/admin/analytics/pages` | `page_views` | Paths de página, landing pages, dispositivos, timestamps cronológicos |

---

## 3. Formatos Suportados

1. **XLSX (Excel Workbook):**
   - Biblioteca: `exceljs` (^4.4.0, licença MIT).
   - Múltiplas abas especializadas (nomes com até 31 caracteres).
   - Cabeçalhos estilizados e congelados (`freeze panes`).
   - Autofilter ativado.
   - Formatação nativa de Moeda (R$), Percentuais e Números.
   - Preservação estrita de IDs (session_id, visitor_id, campaign_id) como TEXTO (`@`), prevenindo notação científica.

2. **CSV (Valores Separados por Ponto e Vírgula):**
   - Exportação individual direta para dataset único (`.csv`).
   - Empacotamento automático em arquivo compactado (`.zip`) caso múltiplos datasets sejam selecionados.
   - Codificação **UTF-8 com BOM** (`\uFEFF`) para compatibilidade perfeita com Excel brasileiro e LibreOffice.
   - **Defesa Contra CSV Injection:** Sanitização automática adicionando aspa simples (`'`) a campos que iniciam com `=`, `+`, `-`, `@`, `\t` ou `\r`.

3. **JSON Estruturado:**
   - Objeto técnico hierárquico contendo `metadata` completo (projeto, data de exportação, timezone, filtros, versão do schema) e registros tipados.
   - Zero exposição de segredos ou tokens.

4. **PDF (Relatório Gerencial Executivo):**
   - Biblioteca: `pdfkit` (^0.20.1, reutilizada do `package.json`).
   - Layout gerencial diagramado com branding oficial da AD Telas, capa executiva, tabelas consolidadas dos principais indicadores e notas de rodapé.

5. **ZIP Completo:**
   - Biblioteca: `jszip` (^3.10.1, licença MIT).
   - Pacote consolidado contendo:
     - `/consolidado.xlsx`
     - `/resumo.pdf`
     - `/raw/dados.json`
     - `/csv/*.csv`
     - `/README.txt` com metadados e documentação do lote.

---

## 4. Segurança, Privacidade e LGPD

- **Controle de Acesso:** Todos os endpoints sob `/api/admin/analytics/export` exigem estritamente autenticação de administrador ativo (`requireActiveAdmin`).
- **Defesa de Dados Sensíveis:** Nenhuma credencial (`SUPABASE_SERVICE_ROLE_KEY`, `sb_secret_...`, anon keys, senhas, tokens de API) é incluída nos arquivos ou payloads.
- **Privacidade por Padrão (LGPD):** Dados pessoais de leads (Nome, Telefone, E-mail) são mascarados como `*** PROTEGIDO ***` por padrão. A inclusão desses dados exige marcação explícita do checkbox "Incluir dados pessoais de contato dos leads" pelo administrador.

---

## 5. Paginação e Grandes Volumes

- As consultas ao banco Supabase utilizam o helper `fetchAllPaginated` em lotes de 1.000 registros até o esgotamento (`hasMore === false`), garantindo que exportações de "Todo o período" tragam a totalidade dos dados sem truncamento silencioso.

---

## 6. Auditoria de Linhas de Código (LOC)

| Arquivo | Tipo | LOC Real | Limite Estrito | Status |
| :--- | :--- | :---: | :---: | :---: |
| `app/types/dashboardExport.ts` | Tipos TypeScript | 78 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportSanitizer.ts` | Lógica de Sanitização | 56 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportFilename.ts` | Nomes de Arquivo | 39 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportDataCollector.ts`| Coletor Paginado | 136 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportDataBuilder.ts` | Construtor de Datasets | 191 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportCsv.ts` | Gerador CSV | 15 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportJson.ts` | Gerador JSON | 34 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportXlsx.ts` | Gerador XLSX | 96 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportPdf.ts` | Gerador PDF | 98 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportZip.ts` | Gerador ZIP | 83 | 200 | **APROVADO** |
| `server/api/admin/analytics/export/index.post.ts` | Endpoint API | 122 | 200 | **APROVADO** |
| `app/components/admin/export/DashboardExportDatasetSelector.vue` | Componente Vue | 129 | 500 | **APROVADO** |
| `app/components/admin/export/DashboardExportDialog.vue` | Componente Vue | 287 | 500 | **APROVADO** |
| `app/components/admin/export/DashboardExportButton.vue` | Componente Vue | 37 | 500 | **APROVADO** |
| `app/pages/admin/dashboard.vue` | Página Dashboard | 353 | 500 | **APROVADO** |
| `scripts/test_dashboard_export.mjs` | Suíte de Testes | 187 | 200 | **APROVADO** |

---

## 7. Resultados dos Testes Automatizados

### 7.1 Suíte da Central de Exportação (`scripts/test_dashboard_export.mjs`)
- **EXPORT-01:** Período e nome de arquivo válidos gerados — **PASS**
- **EXPORT-02:** Nome de arquivo sanitiza caracteres perigosos — **PASS**
- **EXPORT-03:** CSV gerado com UTF-8 BOM e formato tabular — **PASS**
- **EXPORT-04:** CSV escapa corretamente ponto e vírgula e aspas — **PASS**
- **EXPORT-05:** CSV injection neutralizada com aspa simples inicial — **PASS**
- **EXPORT-06:** JSON válido gerado — **PASS**
- **EXPORT-07:** JSON contém todos os metadados requeridos — **PASS**
- **EXPORT-08:** XLSX contém planilhas de metadados e datasets — **PASS**
- **EXPORT-09:** XLSX preserva IDs como texto para evitar notação científica — **PASS**
- **EXPORT-10:** PDF executivo válido gerado — **PASS**
- **EXPORT-11:** ZIP válido gerado com assinatura PK — **PASS**
- **EXPORT-12:** ZIP completo contém consolidado.xlsx, resumo.pdf, JSON e README — **PASS**
- **EXPORT-13:** Filtro Google Ads isola métricas com click ids e utm — **PASS**
- **EXPORT-14:** Filtro orgânico identifica canais canônicos legítimos — **PASS**
- **EXPORT-15:** Preserva taxonomia canônica de 13 canais — **PASS**
- **EXPORT-16:** Suporte a todo o período sem limitar a página atual — **PASS**
- **EXPORT-17:** Endpoint exige autenticação administrativa ativa — **PASS**
- **EXPORT-18:** Zero segredos expostos nos metadados e arquivos — **PASS**
- **EXPORT-19:** Mesma regra e fórmula do Dashboard reutilizada no Overview — **PASS**
- **EXPORT-20:** Sem truncamento silencioso (suporte a chunks e stream) — **PASS**
- **Total:** 20/20 PASS (0 falhas).

### 7.2 Suítes de Regressão Legadas
- `test_phase1_classification.mjs`: 27 PASS | 0 FAIL
- `test-google-ads-tracking.mjs`: 7/7 Grupos PASS
- `test-service-forms-canonical.mjs`: 26 PASS | 0 FAIL
- `scripts/test_tracking_link_generator.mjs`: 16 PASS | 0 FAIL
- `scripts/test_campaign_kpi_calculator.mjs`: 16 PASS | 0 FAIL
- `scripts/test_campaign_kpi_persistence.mjs`: 8 PASS | 0 FAIL
- **Total Geral de Regressões:** 100/100 PASS (0 falhas).

---

## 8. Testes Visuais e Responsividade (Playwright MCP)

Testado com o servidor local Nuxt nas 4 resoluções obrigatórias:
1. **1440x900 (Desktop Large):** `scrollWidth === innerWidth === 1440` (0px overflow) — **PASS**
2. **1280x800 (Desktop Standard):** `scrollWidth === innerWidth === 1280` (0px overflow) — **PASS**
3. **390x844 (Mobile Modern):** `scrollWidth === innerWidth === 390` (0px overflow) — **PASS**
4. **375x667 (Mobile Compact):** `scrollWidth === innerWidth === 375` (0px overflow) — **PASS**

### Testes de Download Real no Navegador:
- `XLSX`: HTTP 200, Content-Type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, 12.419 bytes — **PASS**
- `CSV (múltiplos)`: HTTP 200, Content-Type `application/zip`, 1.641 bytes — **PASS**
- `CSV (individual)`: HTTP 200, Content-Type `text/csv; charset=utf-8`, 449 bytes — **PASS**
- `JSON`: HTTP 200, Content-Type `application/json; charset=utf-8`, 6.541 bytes — **PASS**
- `PDF`: HTTP 200, Content-Type `application/pdf`, 4.167 bytes — **PASS**
- `ZIP Completo`: HTTP 200, Content-Type `application/zip`, 18.620 bytes — **PASS**

---

## 9. Compilação de Produção

- Comando: `npm run build`
- Resultado: **Exit Code 0** (`✨ Build complete!`), bundle Nitro gerado com sucesso.
