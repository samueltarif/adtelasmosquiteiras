# 12 — ÍNDICES, CONSTRAINTS E POLÍTICA DE EXCLUSÃO (ON DELETE & SOFT DELETE)

**Status:** APROVADO PARA MODELAGEM (FASE 1.1)  
**Data:** 26 de Agosto de 2026  
**Escopo:** Matriz exaustiva de índices de performance, constraints de integridade relacional, comportamento `ON DELETE` e regras de retenção/arquivamento de dados.

---

## 1. Matriz de Constraints e Índices de Performance

| Tabela | Constraint / Índice | Tipo | Motivo e Benefício | Problema Grave que Evita |
|---|---|---|---|---|
| `public.clients` | `unq_clients_lead_id` | Partial UNIQUE | Garante 1:1 entre Lead e Cliente quando oriundo de conversão | Duplicar cliente ao clicar 2x em "Converter em Cliente" |
| `public.clients` | `idx_clients_telefone_normalized` | Expressão Btree | Busca instantânea por dígitos puros do telefone | Lentidão e falha em encontrar duplicatas com máscaras distintas |
| `public.clients` | `idx_clients_email_lower` | Expressão Btree | Busca insensível a maiúsculas/minúsculas | Duplicar clientes por diferença de caixa no e-mail |
| `public.clients` | `idx_clients_nome_trgm` | GIN Trigram | Busca textual rápida de clientes por partes do nome | Table scan sequencial pesado na digitação do operador |
| `public.client_addresses` | `unq_client_addresses_principal` | Partial UNIQUE | Garante no máximo 1 endereço principal por cliente | Conflito de endereço padrão de faturamento |
| `public.work_orders` | `unq_work_orders_numero_os` | UNIQUE | Numeração amigável única (ex: `OS-2026-000123`) | Duas OSs com o mesmo número impresso em ordens de serviço |
| `public.work_orders` | `idx_work_orders_client_id` | Btree | Consulta todas as OSs de um cliente específico | Lentidão ao carregar a ficha 360° do cliente |
| `public.work_orders` | `idx_work_orders_status_os` | Btree | Filtros de OS por status operacional (em andamento, etc.) | Lentidão no painel Kanban / listagem de serviços |
| `public.work_order_items` | `idx_work_order_items_wo_id` | Btree | Consulta de todos os itens pertencentes a uma OS | Lentidão na montagem da tela de detalhes da OS |
| `public.work_order_measurements`| `idx_wom_item_id` | Btree | Carrega todos os vãos de um item contratado | Lentidão na geração da lista de corte e produção |
| `public.work_order_payments` | `idx_payments_wo_id` | Btree | Soma de pagamentos e cálculo de saldo devedor da OS | Lentidão na totalização financeira do pedido |
| `public.appointments` | `idx_appointments_periodo` | Btree Composto (`data_hora_inicio`, `data_hora_fim`) | Busca rápida de atendimentos no mês/semana/dia | Lentidão no carregamento do calendário visual da agenda |
| `public.appointments` | `idx_appointments_staff_id` | Btree | Filtro de compromissos por técnico responsável | Lentidão na geração da agenda individual do instalador |
| `public.warranties` | `unq_warranties_item` | Partial UNIQUE | 1 termo de garantia ativo por item de serviço | Emissão de garantias duplicadas para a mesma janela/rede |
| `public.warranties` | `idx_warranties_termino` | Btree | Varredura diária das garantias vencendo em 30d/15d/7d/0d | Table scan diário no cron das 09:00 |
| `public.notification_deliveries`| `unq_notification_deliveries_key`| **UNIQUE** | Chave determinística de idempotência por regra/entidade/dia | **Envio duplicado de e-mails de notificação (Spam)** |
| `public.crm_activity_log` | `idx_activity_client_id` | Btree Composto (`client_id`, `occurred_at DESC`) | Timeline cronológica reversa instantânea | Lentidão na aba de histórico do cliente |

---

## 2. Matriz de Comportamento `ON DELETE` nas Chaves Estrangeiras

O comportamento de exclusão em cascata foi estritamente dosado para impedir a perda acidental de registros históricos ou financeiros:

| Relação (Pai → Filho) | Chave Estrangeira | Comportamento `ON DELETE` | Justificativa Arquitetural |
|---|---|---|---|
| `leads` → `clients` | `clients.lead_id` | `SET NULL` | Se um lead for expurgado por LGPD, o cliente já cadastrado permanece ativo. |
| `clients` → `client_addresses` | `client_addresses.client_id` | `CASCADE` | Os endereços residenciais pertencem estritamente àquele cliente. |
| `clients` → `work_orders` | `work_orders.client_id` | **`RESTRICT`** | **Proíbe excluir cliente que possua Ordens de Serviço históricas**. |
| `clients` → `appointments` | `appointments.client_id` | **`RESTRICT`** | Proíbe excluir cliente com histórico de visitas presenciais. |
| `clients` → `warranties` | `warranties.client_id` | **`RESTRICT`** | Proíbe excluir cliente com termos de garantia ativos ou históricos. |
| `work_orders` → `work_order_items` | `work_order_items.work_order_id` | `CASCADE` | Itens pertencem integralmente à OS; ao apagar um rascunho de OS, os itens somem. |
| `work_order_items` → `work_order_measurements` | `work_order_measurements.work_order_item_id` | `CASCADE` | Vãos e medidas pertencem ao item de serviço correspondente. |
| `work_orders` → `work_order_payments` | `work_order_payments.work_order_id` | **`RESTRICT`** | **Proíbe excluir OS que possua lançamentos financeiros registrados**. |
| `work_orders` → `work_order_media` | `work_order_media.work_order_id` | `CASCADE` | Mídias desvinculam-se da OS (com exclusão segura lógica no R2). |
| `work_orders` → `warranties` | `warranties.work_order_id` | **`RESTRICT`** | Proíbe excluir OS com certificado de garantia emitido. |
| `client_addresses` → `work_orders` | `work_orders.address_id` | `SET NULL` | Se um endereço for removido, a OS preserva os demais dados e anotações. |
| `crm_staff` → `work_orders` | `work_orders.responsible_staff_id` | `SET NULL` | Se um técnico for removido/desativado, a OS não é afetada. |
| `crm_staff` → `appointments` | `appointments.staff_id` | `SET NULL` | Se um técnico for desativado, o compromisso fica "Sem técnico atribuído". |

---

## 3. Política de Retenção e Arquivamento (Soft Delete vs Hard Delete)

| Entidade | Política Adotada | Mecanismo | Justificativa |
|---|---|---|---|
| `public.clients` | **Soft Delete (Arquivamento)** | `is_archived = true`, `archived_at = now()` | Clientes com histórico de atendimento e garantias nunca devem ser apagados. |
| `public.work_orders` | **Cancelamento / Arquivamento** | `status_os = 'cancelada'`, `is_archived = true` | Rascunho vazio sem pagamento pode ser deletado; OS emitida é arquivada. |
| `public.work_order_payments`| **Cancelamento Lógico** | `status_pagamento = 'cancelado'`, `cancelled_at` | Auditoria contábil obrigatória; nenhum lançamento é deletado fisicamente. |
| `public.appointments` | **Cancelamento com Motivo** | `status_agendamento = 'cancelado'`, motivo | Preserva o histórico de visitas e tentativas de contato no imóvel. |
| `public.warranties` | **Cancelamento Operacional** | `status_operacional = 'cancelada'` | Termos de garantia emitidos são documentos contratuais permanentes. |
| `public.notification_deliveries`| **Imutável (Append-only)** | Registro permanente | Auditoria de disparo e controle perpétuo de idempotência de e-mail. |
| `public.crm_activity_log` | **Imutável (Append-only)** | Registro permanente | Trilha de auditoria legal e rastreamento de ações administrativas. |
