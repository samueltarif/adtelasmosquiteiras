# Relatório Técnico: Central de Exportação Analítica Completa do Dashboard

**Projeto:** AD Telas e Redes de Proteção  
**Status:** Implementado, Auditado e Aprovado  
**Data:** 29 de Setembro de 2026  
**Ambiente:** Desenvolvimento Local e Produção (Nitro / Nuxt 4)  

---

## 1. Visão Geral da Funcionalidade

A **Central de Exportação de Dados** adiciona ao Painel Administrativo uma interface unificada, segura e de alta performance para extração e download da telemetria comercial e analítica do sistema. A ferramenta opera estritamente em modo **READ-ONLY**, sem alterar, inserir ou remover registros das tabelas de rastreamento.

---

## 2. Fontes de Dados e Schema Real

| Seção do Dashboard | Endpoint Original | Tabela Supabase | Colunas Reais do Banco de Dados |
| :--- | :--- | :--- | :--- |
| **Resumo Geral** | `/api/admin/analytics/overview` | `page_views`, `lead_clicks`, `leads` | Visitantes únicos, novos vs recorrentes, sessões humanas, pageviews, cliques WhatsApp, inícios de formulário, leads comerciais |
| **Aquisição por Canal** | `/api/admin/analytics/acquisition` | `page_views`, `lead_clicks`, `leads` | 13 canais canônicos, rótulos canônicos, sessões, visitantes, pageviews, conversões |
| **Google Ads** | `/api/admin/analytics/google-ads/*` | `page_views`, `lead_clicks`, `leads` | `google_campaign_id`, `google_adgroup_id`, `google_creative_id`, `google_match_type`, `google_network`, `google_device`, `google_target_id`, `gclid`, `gbraid`, `wbraid`, `utm_term`, `utm_campaign` |
| **WhatsApp & Atribuição**| `/api/admin/marketing/whatsapp-attributions` | `whatsapp_attributions` | `short_code`, `channel`, `utm_campaign`, `attribution_status`, `match_method`, `landing_path`, `created_at` |
| **Leads Comerciais** | `/api/admin/leads` | `leads` | `id`, `created_at`, `session_channel`, `first_touch_channel`, `utm_campaign`, `servico`, `status` (PII mascarado sob LGPD) |
| **KPIs de Campanhas** | `/api/admin/marketing/campaign-kpis` | `campaign_kpi_entries` | `platform`, `campaign_name`, `utm_campaign`, `period_start`, `period_end`, `planned_budget`, `spend`, `impressions`, `clicks`, `whatsapp_contacts`, `leads`, `sales`, `revenue`, `notes`, `target_ctr`, `target_cpc`, `target_cpl`, `target_cpa`, `target_roas`, `target_leads`, `target_sales`, `target_lead_to_sale_rate`, `target_budget` |
| **Telemetria de Páginas**| `/api/admin/analytics/pages` | `page_views` | `id`, `created_at`, `path`, `landing_path`, `channel`, `device_type`, `session_id`, `visitor_id` |

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
   - Biblioteca: `pdfkit` (^0.20.1, nativa do projeto).
   - Layout gerencial diagramado com branding oficial da AD Telas, capa executiva, tabelas consolidadas dos principais indicadores e notas de rodapé.

5. **ZIP Completo:**
   - Biblioteca: `jszip` (^3.10.2, licença MIT).
   - Pacote consolidado contendo: `/consolidado.xlsx`, `/resumo.pdf`, `/raw/dados.json`, `/csv/*.csv` e `/README.txt`.

---

## 4. Segurança, Privacidade e LGPD

- **Controle de Acesso:** Todos os endpoints sob `/api/admin/analytics/export` exigem estritamente autenticação de administrador ativo (`requireActiveAdmin`).
- **Defesa de Dados Sensíveis:** Nenhuma credencial (`SUPABASE_SERVICE_ROLE_KEY`, `sb_secret_...`, anon keys, senhas, tokens de API) é incluída nos arquivos ou payloads.
- **Privacidade por Padrão (LGPD):** Dados pessoais de leads (Nome, Telefone, E-mail) são mascarados como `*** PROTEGIDO ***` por padrão. A inclusão desses dados exige marcação explícita do checkbox "Incluir dados pessoais de contato dos leads" pelo administrador.

---

## 5. Paginação e Grandes Volumes

- As consultas ao banco Supabase utilizam paginação server-side em lotes de 1.000 registros até o esgotamento (`hasMore === false`), garantindo que exportações de "Todo o período" tragam a totalidade dos dados sem truncamento silencioso.

---

## 6. Auditoria de Linhas de Código (LOC)

| Arquivo | Tipo | LOC Real | Limite Estrito | Status |
| :--- | :--- | :---: | :---: | :---: |
| `app/types/dashboardExport.ts` | Tipos TypeScript | 78 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportSanitizer.ts` | Lógica de Sanitização | 56 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportFilename.ts` | Nomes de Arquivo | 39 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportDataCollector.ts`| Coletor Paginado | 156 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportDataBuilder.ts` | Construtor de Datasets | 185 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportCampaignKpisBuilder.ts` | Construtor KPIs Fase 7 | 67 | 200 | **APROVADO** |
| `server/utils/dashboard-export/exportTrackingDatasetsBuilder.ts` | Construtor Datasets Ads | 165 | 200 | **APROVADO** |
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
| `scripts/test_dashboard_export.mjs` | Suíte EXPORT-01..20 | 187 | 200 | **APROVADO** |
| `scripts/test_campaign_kpis_real_export.mjs` | Teste Real Fixture KPI | 191 | 200 | **APROVADO** |
| `scripts/test_google_export_parity.mjs` | Teste Paridade Google Ads | 112 | 200 | **APROVADO** |

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

### 7.2 Teste Real Não-Vazio de campaign_kpis (`scripts/test_campaign_kpis_real_export.mjs`)
- Inserção de fixture `EXPORT_KPI_SCHEMA_TEST` com 24 campos conhecidos: **PASS**
- Exportação e parsing de CSV com spend e receita: **PASS**
- Exportação e parsing de XLSX com todos os 24 campos e 10 KPIs calculados: **PASS**
- Exportação e parsing de JSON: **PASS**
- Cleanup estrito e verificação de contagem residual = 0: **PASS**

### 7.3 Teste de Paridade Google Ads Dashboard vs Exportação (`scripts/test_google_export_parity.mjs`)
- Sessões Google Ads: Dashboard = 47 | Export = 47 (**PARIDADE 100%**)
- Visitantes Únicos: Dashboard = 46 | Export = 46 (**PARIDADE 100%**)
- Pageviews: Dashboard = 69 | Export = 69 (**PARIDADE 100%**)
- Cliques no WhatsApp: Dashboard = 1 | Export = 1 (**PARIDADE 100%**)
- Inícios de Formulário: Dashboard = 0 | Export = 0 (**PARIDADE 100%**)
- Leads Convertidos: Dashboard = 0 | Export = 0 (**PARIDADE 100%**)

### 7.4 Suítes de Regressão Legadas
- `test_phase1_classification.mjs`: 27 PASS | 0 FAIL
- `test-google-ads-tracking.mjs`: 7/7 Grupos PASS
- `test-service-forms-canonical.mjs`: 26 PASS | 0 FAIL
- `scripts/test_tracking_link_generator.mjs`: 16 PASS | 0 FAIL
- `scripts/test_campaign_kpi_calculator.mjs`: 16 PASS | 0 FAIL
- `scripts/test_campaign_kpi_persistence.mjs`: 8 PASS | 0 FAIL
- **Total Geral de Regressões:** 100/100 PASS (0 falhas).

---

## 8. Testes Visuais e Responsividade (Playwright MCP)

Testado nativamente com **Playwright MCP** nas 4 resoluções obrigatórias:
1. **1440x900 (Desktop Large):** `scrollWidth === innerWidth === 1440` (0px overflow) — **PASS**
2. **1280x800 (Desktop Standard):** `scrollWidth === innerWidth === 1280` (0px overflow) — **PASS**
3. **390x844 (Mobile Modern):** `scrollWidth === innerWidth === 390` (0px overflow) — **PASS**
4. **375x667 (Mobile Compact):** `scrollWidth === innerWidth === 375` (0px overflow) — **PASS**

---

## 9. Compilação de Produção

- Comando: `npm run build`
- Resultado: **Exit Code 0** (`✨ Build complete!`), bundle Nitro gerado com sucesso.
