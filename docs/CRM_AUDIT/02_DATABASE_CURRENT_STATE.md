# 02 — ESTADO REAL DO BANCO DE DADOS ATUAL (SUPABASE POSTGRESQL)

**Status:** CONFIRMADO  
**Data da Auditoria:** 26 de Agosto de 2026  
**Escopo:** Schema real e completo das tabelas existentes no Supabase PostgreSQL.  
**Arquivos Analisados:**
- [`supabase/export/schema_full.sql`](file:///d:/sicons/ADT/supabase/export/schema_full.sql)
- [`supabase/manual/001_v2_analytics_and_callbacks.sql`](file:///d:/sicons/ADT/supabase/manual/001_v2_analytics_and_callbacks.sql)
- [`supabase/manual/002_fix_admin_rls.sql`](file:///d:/sicons/ADT/supabase/manual/002_fix_admin_rls.sql)
- [`supabase/manual/003_phase_b_identity_attribution_idempotency.sql`](file:///d:/sicons/ADT/supabase/manual/003_phase_b_identity_attribution_idempotency.sql)
- [`supabase/manual/004_cta_service_tracking.sql`](file:///d:/sicons/ADT/supabase/manual/004_cta_service_tracking.sql)
- [`supabase/manual/006_lead_email_delivery_state.sql`](file:///d:/sicons/ADT/supabase/manual/006_lead_email_delivery_state.sql)
- [`supabase/manual/007_lead_media_storage.sql`](file:///d:/sicons/ADT/supabase/manual/007_lead_media_storage.sql)
- [`supabase/manual/008_admin_auth.sql`](file:///d:/sicons/ADT/supabase/manual/008_admin_auth.sql)
- [`supabase/manual/009_service_media_storage.sql`](file:///d:/sicons/ADT/supabase/manual/009_service_media_storage.sql)

---

## 1. Inventário Geral das Tabelas Existentes

| Tabela | Finalidade Principal | RLS Ativa? | Mutações Diretas do Cliente |
|---|---|---|---|
| `public.leads` | Formulários de contato e pedidos de orçamento | **SIM** | **Bloqueadas** (apenas backend Nitro via `service_role`) |
| `public.lead_media` | Metadados de fotos e vídeos privados enviados por leads | **SIM** | **Bloqueadas** (apenas backend Nitro via `service_role`) |
| `public.admin_users` | Usuários com permissão de acesso ao painel admin | **SIM** | **Bloqueadas** (apenas backend Nitro via `service_role`) |
| `public.service_media` | Mídias públicas de instalações para galeria do site | **SIM** | **Leitura pública** (`is_active = true`), Escrita restrita a Admin |
| `public.lead_clicks` | Cliques em WhatsApp, Telefone e botões de contato | **SIM** | **Bloqueadas** (apenas backend Nitro via `service_role`) |
| `public.page_views` | Visualizações de páginas para analytics e funil | **SIM** | **Bloqueadas** (apenas backend Nitro via `service_role`) |
| `public.callback_requests` | Solicitações "Prefiro que me liguem" | **SIM** | **Bloqueadas** (apenas backend Nitro via `service_role`) |
| `public.cron_ticks` | Registro de batimentos de teste de cron | **SIM** | Inserções públicas permitidas via policy anon |

---

## 2. Estrutura Detalhada da Tabela `public.leads`

A tabela `public.leads` é a entidade central comercial atual. Todas as suas 49 colunas reais estão mapeadas abaixo:

| Nome da Coluna | Tipo de Dados | Nullable? | Default | Descrição / Restrições |
|---|---|---|---|---|
| `id` | `UUID` | **NÃO** (PK) | `gen_random_uuid()` | Chave primária universal |
| `created_at` | `TIMESTAMPTZ` | **NÃO** | `timezone('utc', now())` | Data e hora de recebimento |
| `nome` | `VARCHAR(255)` | **NÃO** | - | Nome completo do lead/solicitante |
| `telefone` | `VARCHAR(30)` | SIM | - | Telefone / WhatsApp com DDD |
| `email` | `VARCHAR(255)` | SIM | - | Endereço de e-mail |
| `cidade` | `VARCHAR(100)` | **NÃO** | - | Cidade informada (Padrão: São Paulo) |
| `bairro` | `VARCHAR(100)` | SIM | - | Bairro informado no formulário |
| `servico` | `VARCHAR(100)` | SIM | - | Nome do serviço de interesse |
| `mensagem` | `TEXT` | SIM | - | Mensagem descritiva enviada pelo lead |
| `origem` | `VARCHAR(100)` | SIM | `'formulario_geral'` | Identificador do formulário de origem |
| `status` | `VARCHAR(50)` | SIM | `'Novo'` | `Novo`, `Em Atendimento`, `Orçado`, `Fechado`, `Perdido` |
| `valor_orcamento` | `NUMERIC(10,2)` | SIM | `0.00` | Valor comercial estimado/fechado |
| `observacoes` | `TEXT` | SIM | - | Notas e histórico textual inseridos pelo admin |
| `submission_id` | `VARCHAR(100)` | SIM | - | UUID de idempotência do envio (UNIQUE parcial) |
| `visitor_id` | `VARCHAR(100)` | SIM | - | ID persistente do visitante (Cookie de 1 ano) |
| `session_id` | `VARCHAR(100)` | SIM | - | ID da sessão do navegador |
| `landing_path` | `TEXT` | SIM | - | Página onde o visitante iniciou a sessão |
| `conversion_path` | `TEXT` | SIM | - | Página onde o formulário foi enviado |
| `session_channel` | `TEXT` | SIM | - | Canal atribuído na sessão (`google_ads`, `direct`, etc.) |
| `utm_source` | `VARCHAR(100)` / `TEXT` | SIM | - | Parâmetro UTM Source da sessão atual |
| `utm_medium` | `VARCHAR(100)` / `TEXT` | SIM | - | Parâmetro UTM Medium da sessão atual |
| `utm_campaign` | `VARCHAR(100)` / `TEXT` | SIM | - | Parâmetro UTM Campaign da sessão atual |
| `utm_content` | `VARCHAR(100)` / `TEXT` | SIM | - | Parâmetro UTM Content da sessão atual |
| `utm_term` | `VARCHAR(100)` / `TEXT` | SIM | - | Parâmetro UTM Term da sessão atual |
| `gclid` | `TEXT` | SIM | - | Google Click ID da sessão de conversão |
| `gbraid` | `TEXT` | SIM | - | Google Click ID para apps / iOS |
| `wbraid` | `TEXT` | SIM | - | Google Click ID Web para iOS |
| `fbclid` | `TEXT` | SIM | - | Facebook Click ID |
| `msclkid` | `TEXT` | SIM | - | Microsoft Ads Click ID |
| `referrer` | `TEXT` | SIM | - | Referrer HTTP da sessão |
| `first_touch_channel` | `TEXT` | SIM | - | Canal da primeira visita histórica |
| `first_touch_landing_path` | `TEXT` | SIM | - | Página da primeira visita histórica |
| `first_touch_referrer` | `TEXT` | SIM | - | Referrer da primeira visita histórica |
| `first_touch_utm_source` | `TEXT` | SIM | - | UTM Source do primeiro contato |
| `first_touch_utm_medium` | `TEXT` | SIM | - | UTM Medium do primeiro contato |
| `first_touch_utm_campaign`| `TEXT` | SIM | - | UTM Campaign do primeiro contato |
| `first_touch_utm_content` | `TEXT` | SIM | - | UTM Content do primeiro contato |
| `first_touch_utm_term` | `TEXT` | SIM | - | UTM Term do primeiro contato |
| `first_touch_gclid` | `TEXT` | SIM | - | GCLID do primeiro contato |
| `first_touch_gbraid` | `TEXT` | SIM | - | GBRAID do primeiro contato |
| `first_touch_wbraid` | `TEXT` | SIM | - | WBRAID do primeiro contato |
| `first_touch_fbclid` | `TEXT` | SIM | - | FBCLID do primeiro contato |
| `first_touch_msclkid` | `TEXT` | SIM | - | MSCLKID do primeiro contato |
| `is_synthetic` | `BOOLEAN` | SIM | `FALSE` | Marca leads gerados sinteticamente na Fase A |
| `notification_email_status` | `VARCHAR(20)` | **NÃO** | `'pending'` | CHECK: `'pending'`, `'sending'`, `'sent'`, `'failed'` |
| `notification_email_sent_at` | `TIMESTAMPTZ` | SIM | - | Timestamp de entrega confirmada via SMTP |
| `notification_email_attempts` | `INT` | **NÃO** | `0` | CHECK: `attempts >= 0` |
| `notification_email_last_attempt_at` | `TIMESTAMPTZ` | SIM | - | Timestamp da última tentativa de envio |
| `notification_email_last_error` | `TEXT` | SIM | - | Mensagem sanitizada do último erro de SMTP |

### 2.1. Índices e Constraints em `public.leads`
- `idx_leads_created_at`: `CREATE INDEX ON public.leads(created_at DESC);`
- `idx_leads_status`: `CREATE INDEX ON public.leads(status);`
- `idx_leads_visitor_id`: `CREATE INDEX ON public.leads(visitor_id);`
- `idx_leads_session_id`: `CREATE INDEX ON public.leads(session_id);`
- `idx_leads_notification_email_status`: `CREATE INDEX ON public.leads(notification_email_status);`
- `unq_leads_submission_id`: `CREATE UNIQUE INDEX ON public.leads(submission_id) WHERE submission_id IS NOT NULL;`
- `chk_leads_notification_email_status`: `CHECK (notification_email_status IN ('pending', 'sending', 'sent', 'failed'))`
- `chk_leads_notification_email_attempts`: `CHECK (notification_email_attempts >= 0)`

---

## 3. Estrutura Detalhada da Tabela `public.lead_media`

Armazena as mídias privadas enviadas pelos visitantes junto com os leads:

| Nome da Coluna | Tipo de Dados | Nullable? | Default | Descrição / Restrições |
|---|---|---|---|---|
| `id` | `UUID` | **NÃO** (PK) | `gen_random_uuid()` | Chave primária |
| `lead_id` | `UUID` | **NÃO** (FK) | - | FK para `public.leads(id)` ON DELETE RESTRICT |
| `client_media_id` | `UUID` | **NÃO** | - | ID gerado no frontend pelo cliente |
| `submission_id` | `VARCHAR(100)` | SIM | - | ID do formulário associado |
| `storage_key` | `TEXT` | **NÃO** (UQ) | - | Caminho físico no bucket R2 privado (`leads/{id}/{uuid}.ext`) |
| `original_filename` | `TEXT` | SIM | - | Nome original do arquivo enviado pelo cliente |
| `safe_filename` | `TEXT` | **NÃO** | - | Nome sanitizado para download seguro |
| `media_type` | `VARCHAR(20)` | **NÃO** | - | CHECK: `'photo'` ou `'video'` |
| `mime_type` | `VARCHAR(100)` | **NÃO** | - | CHECK: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`, `video/quicktime` |
| `file_size_bytes` | `BIGINT` | **NÃO** | - | CHECK: `file_size_bytes > 0` |
| `width` | `INT` | SIM | - | Largura em pixels (obrigatória para fotos) |
| `height` | `INT` | SIM | - | Altura em pixels (obrigatória para fotos) |
| `duration_seconds` | `INT` | SIM | - | Duração em segundos (vídeos) |
| `upload_status` | `VARCHAR(20)` | **NÃO** | `'pending'` | CHECK: `'pending'`, `'finalizing'`, `'uploaded'`, `'failed'`, `'deleted'` |
| `finalizing_at` | `TIMESTAMPTZ` | SIM | - | Timestamp de início da finalização |
| `verified_at` | `TIMESTAMPTZ` | SIM | - | Timestamp de verificação via HeadObject |
| `created_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | Timestamp de criação do registro |

---

## 4. Estrutura Detalhada da Tabela `public.admin_users`

Armazena as permissões e papéis de operadores administrativos:

| Nome da Coluna | Tipo de Dados | Nullable? | Default | Descrição / Restrições |
|---|---|---|---|---|
| `id` | `UUID` | **NÃO** (PK) | `gen_random_uuid()` | Chave primária |
| `user_id` | `UUID` | **NÃO** (FK/UQ) | - | FK para `auth.users(id)` ON DELETE CASCADE |
| `email` | `VARCHAR(255)` | **NÃO** | - | E-mail do administrador (snapshot de exibição) |
| `role` | `VARCHAR(50)` | **NÃO** | `'admin'` | CHECK: `'admin'`, `'superadmin'`, `'operator'` |
| `is_active` | `BOOLEAN` | **NÃO** | `true` | Flag de ativação da conta administrativa |
| `created_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | Data de concessão de permissão |
| `updated_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | Atualizado via trigger `trg_admin_users_updated_at` |

---

## 5. Estrutura Detalhada da Tabela `public.service_media`

Armazena fotos e vídeos públicos das galerias de serviços:

| Nome da Coluna | Tipo de Dados | Nullable? | Default | Descrição / Restrições |
|---|---|---|---|---|
| `id` | `UUID` | **NÃO** (PK) | `gen_random_uuid()` | Chave primária |
| `service_key` | `VARCHAR(64)` | **NÃO** | - | Allowlist das 12 chaves canônicas de serviços |
| `storage_key` | `VARCHAR(512)` | **NÃO** (UQ) | - | Caminho no R2 público (`services/{service_key}/{uuid}.ext`) |
| `media_type` | `VARCHAR(16)` | **NÃO** | `'photo'` | CHECK: `'photo'` ou `'video'` |
| `mime_type` | `VARCHAR(64)` | **NÃO** | - | MIME validado por Magic Bytes |
| `title` | `VARCHAR(255)` | SIM | - | Título opcional da mídia |
| `alt_text` | `VARCHAR(255)` | **NÃO** | - | Texto alternativo SEO (mínimo 3 caracteres) |
| `caption` | `TEXT` | SIM | - | Legenda descritiva |
| `sort_order` | `INTEGER` | **NÃO** | `0` | Posição de ordenação (`sort_order >= 0`) |
| `is_featured` | `BOOLEAN` | **NÃO** | `false` | Foto destaque (UNIQUE parcial por serviço) |
| `is_active` | `BOOLEAN` | **NÃO** | `true` | Visibilidade pública no site |
| `width` | `INTEGER` | SIM | - | Largura em pixels (obrigatória > 0 para fotos) |
| `height` | `INTEGER` | SIM | - | Altura em pixels (obrigatória > 0 para fotos) |
| `file_size_bytes` | `BIGINT` | **NÃO** | - | Tamanho em bytes (`> 0`) |
| `created_by` | `UUID` | SIM | - | FK para `auth.users(id)` ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | Data de upload |
| `updated_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | Atualizado via trigger `trg_service_media_updated_at` |

---

## 6. Tabelas e Recursos Confirmados como NÃO EXISTENTES

Após varredura rigorosa em todas as migrations, schemas e código do projeto, confirma-se que **NÃO EXISTEM** no banco atual:

1. ❌ `public.customers` / `public.clients` / `public.clientes` — **NÃO ENCONTRADO**
2. ❌ `public.client_addresses` / `public.addresses` / `public.enderecos` — **NÃO ENCONTRADO**
3. ❌ `public.services` / `public.orders` / `public.work_orders` / `public.ordens_servico` — **NÃO ENCONTRADO**
4. ❌ `public.measurements` / `public.vaos` / `public.medicoes` — **NÃO ENCONTRADO**
5. ❌ `public.appointments` / `public.schedules` / `public.agenda` — **NÃO ENCONTRADO**
6. ❌ `public.warranties` / `public.garantias` — **NÃO ENCONTRADO**
7. ❌ `public.lead_notes` / `public.lead_status_history` — **NÃO ENCONTRADO** (as notas e status do lead residem nas colunas `observacoes` e `status` dentro de `public.leads`)
8. ❌ `public.notification_rules` / `public.notification_jobs` — **NÃO ENCONTRADO**
