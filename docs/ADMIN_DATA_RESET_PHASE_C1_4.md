# RELATÓRIO TÉCNICO — FASE C.1.4
**Reset Controlado dos Dados do Painel Admin (Analytics & Leads)**

**Projeto:** AD Telas e Redes (`https://www.adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** C.1.4 — Controlled Analytics Data Reset  
**Status:** `ADMIN DATA RESET C.1.4: READY FOR MANUAL REVIEW`  
**Deploy em Produção:** `PRODUCTION_CHANGED = NO`  
**Execução no Banco:** `SQL_005_EXECUTED = NO` | `DATABASE_CHANGED = NO` | `SUPABASE_MCP_WRITES = 0`  
**Ação Manual Necessária:** `YES` (Executar `supabase/manual/005_reset_admin_analytics_data.sql` no SQL Editor oficial do Supabase)

---

## 1. Auditoria Completa das Tabelas no Banco de Dados

Foi realizada uma auditoria forense nas tabelas do Supabase (`public.*` e esquemas internos) para classificar o escopo da limpeza:

| Tabela | Finalidade | Classificação | Registros Atuais | Justificativa / Ação |
|---|---|---|---|---|
| `public.page_views` | Telemetria de visualizações, sessões e UTMs | **RESETAR** | ~1.075 | Dados de tráfego de teste e validação das Fases A, B e C. |
| `public.lead_clicks` | Cliques em WhatsApp, telefone e CTAs | **RESETAR** | ~56 | Cliques sintéticos e de validação manual. |
| `public.leads` | Formulários comerciais e histórico técnico | **RESETAR** | 29 | 23 sintéticos Fase A + 4 testes automatizados + 2 validações manuais. |
| `public.cron_ticks` | Heartbeat / Keep-alive do Supabase | **PRESERVAR** | 27 | Tabela técnica de infraestrutura que previne inatividade do banco. |
| `public.callback_requests` | Proposta de callbacks | **INEXISTENTE** | N/A (404) | Não implementada no banco real. |
| `public.lead_notes` | Histórico/Anotações de leads | **INEXISTENTE** | N/A (404) | Não implementada no banco real. |
| `public.lead_status_history` | Histórico de status | **INEXISTENTE** | N/A (404) | Não implementada no banco real. |
| `auth.users` | Usuários do Supabase Auth | **PRESERVAR** | N/A | Infraestrutura de autenticação do Supabase. |
| `storage.*` | Armazenamento de arquivos/mídia | **PRESERVAR** | N/A | Buckets e objetos de storage intactos. |
| Conteúdo do Site | Páginas, serviços, SEO, layouts | **PRESERVAR** | N/A | O conteúdo do site é estático via Nuxt e código Vue. |

---

## 2. Análise de Foreign Keys & Ordem Transacional de Exclusão

1. **Relações de Chave Estrangeira (FK):**
   - As tabelas `page_views`, `lead_clicks` e `leads` possuem chaves primárias independentes (`id UUID DEFAULT gen_random_uuid() PRIMARY KEY`).
   - Não há foreign keys que restrinjam a exclusão mútua entre elas.
2. **Ordem Transacional de Exclusão:**
   A exclusão segue o fluxo lógico de eventos do funil:
   1. `DELETE FROM public.lead_clicks;` (eventos de clique/intenção)
   2. `DELETE FROM public.page_views;` (visitas e sessões)
   3. `DELETE FROM public.leads;` (formulários e histórico)

---

## 3. Garantias de Preservação Estrutural (Zero DDL)

- **`DDL_COMMANDS = 0`**
- **`DROP_COMMANDS = 0`**
- **`CASCADE_USED = NO`**
- **Preservação 100% Garantida:**
  - Todas as 17 colunas de `page_views` (incluindo `visitor_id`, `session_id`, `event_id`, `channel`, `device_type`, `is_bot`, UTMs).
  - Todas as 22 colunas de `lead_clicks` (incluindo `service_key`, `service_name`, `cta_location`, `visitor_id`, `session_id`, `event_id`).
  - Todas as 32 colunas de `leads` (incluindo `submission_id`, `visitor_id`, `session_id`, `landing_path`, `conversion_path`, `session_channel`, `first_touch_*`).
  - Todos os índices únicos e de busca (`unq_page_views_event_id`, `unq_lead_clicks_event_id`, `unq_leads_submission_id`, `idx_lead_clicks_service_key`, etc.).
  - Políticas de segurança Row Level Security (RLS) em todas as tabelas.

---

## 4. Análise do Comportamento de `phaseBStartAt` Após o Reset

No código atual ([`server/shared/adminAnalyticsCore.mjs`](file:///d:/sicons/ADT/server/shared/adminAnalyticsCore.mjs)):
```javascript
export const PHASE_B_START_ISO = '2026-08-24T11:27:35.488Z'
```

### O que ocorre no sistema imediatamente após o Reset:
1. **Contadores Globais:**
   - Como todas as tabelas estarão com `COUNT(*) = 0`, todas as chamadas à API (`overview`, `acquisition`, `services`, `funnel`, `pages`, `leads`) retornarão arrays vazios `[]`.
   - **Visitantes Únicos:** `0`
   - **Sessões:** `0`
   - **Pageviews:** `0`
   - **Leads Comerciais Reais:** `0`
   - **Histórico Técnico & Testes:** `0`
   - **WhatsApp:** `0`
   - **Telefone:** `0`
   - **Taxas:** `0.0%`
   - **Funil:** Todas as etapas zeradas (`0`).
2. **Novos Tráfegos Reais Pós-Reset:**
   - Todo visitante novo que acessar o site após o reset gerará eventos com `created_at` posterior a `2026-08-24T14:00:00Z` (já superior ao piso `PHASE_B_START_ISO`).
   - Portanto, qualquer consulta com preset `'today'` ou `'allTime'` capturará 100% dos novos eventos de identidade, sem resíduos do passado.
3. **Banner "Período Misto":**
   - Para o dia civil de hoje (24/08/2026), `requested_start_utc` (03:00 UTC) é anterior a `PHASE_B_START_ISO` (11:27 UTC), exibindo o aviso de período misto de forma semanticamente transparente.
   - A partir de amanhã (25/08/2026), `requested_start_utc` será `2026-08-25T03:00:00.000Z` (`> PHASE_B_START_ISO`), e o banner desaparecerá automaticamente no filtro "Hoje" sem necessidade de deploy adicional.

---

## 5. Script SQL Manual (`005_reset_admin_analytics_data.sql`)

O arquivo foi gerado em [`supabase/manual/005_reset_admin_analytics_data.sql`](file:///d:/sicons/ADT/supabase/manual/005_reset_admin_analytics_data.sql).
Contém:
1. **PRE-CHECK:** Consultas de leitura das contagens antes da exclusão.
2. **TRANSAÇÃO ATÔMICA:** `BEGIN; DELETE ...; COMMIT;`
3. **POST-CHECK:** Verificação de contagem zero em todas as tabelas.
4. **ESTRUTURA & ÍNDICES:** Verificação da integridade de colunas, índices e RLS.
