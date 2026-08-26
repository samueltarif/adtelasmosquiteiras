# 00 — ÍNDICE MESTRE E GUIA DE REVISÃO DA MODELAGEM DO CRM (FASE 1.1)

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Fase:** Fase 1.1 — Modelagem Definitiva de Dados e Arquitetura antes da Migration 010  
**Status da Modelagem:** `DATA_MODEL_READY=YES`  
**Data:** 26 de Agosto de 2026  
**Ambiente:** Nuxt 4.2.2 SSR \| Supabase PostgreSQL \| Cloudflare R2 \| Nodemailer (Gmail SMTP)  
**Relação com a Fase 1:** Refinamento direto e especificação exaustiva das bases levantadas em [`docs/CRM_AUDIT/`](file:///d:/sicons/ADT/docs/CRM_AUDIT/00_INDEX.md).

---

## 1. Objetivo da Fase 1.1

Transformar a arquitetura conceitual auditada na Fase 1 em um **modelo de dados definitivo, consistente, auditável e livre de ambiguidades**, pronto para revisão humana e posterior geração automatizada da `Migration 010_crm_core_tables.sql` no Supabase.

---

## 2. Mapa Completo dos Documentos da Modelagem (Fase 1.1)

| # | Documento | Conteúdo Principal | Status |
|---|---|---|---|
| 01 | [01_ARCHITECTURAL_DECISIONS.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/01_ARCHITECTURAL_DECISIONS.md) | ADRs das 10 decisões fundamentais de engenharia de software e dados | **APROVADO** |
| 02 | [02_ENTITY_RELATIONSHIP_MODEL.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/02_ENTITY_RELATIONSHIP_MODEL.md) | Diagrama relacional completo (Mermaid), cardinalidades e tabela mestra | **APROVADO** |
| 03 | [03_CLIENTS_AND_ADDRESSES.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/03_CLIENTS_AND_ADDRESSES.md) | Tabelas `clients` e `client_addresses` (0:N), PF/PJ e deduplicação | **APROVADO** |
| 04 | [04_WORK_ORDERS_AND_ITEMS.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/04_WORK_ORDERS_AND_ITEMS.md) | Tabelas `work_orders` e `work_order_items` (1:N), lifecycle e numeração | **APROVADO** |
| 05 | [05_MEASUREMENTS_AND_MEDIA.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/05_MEASUREMENTS_AND_MEDIA.md) | Medições em mm canônicos e fotos privadas no R2 com contagem lógica | **APROVADO** |
| 06 | [06_PAYMENTS.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/06_PAYMENTS.md) | Tabela `work_order_payments` (1:N), saldo devedor e cancelamento auditável | **APROVADO** |
| 07 | [07_APPOINTMENTS_AND_STAFF.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/07_APPOINTMENTS_AND_STAFF.md) | Agenda, visitas técnicas, timezone e gestão de técnicos (`crm_staff`) | **APROVADO** |
| 08 | [08_WARRANTIES.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/08_WARRANTIES.md) | Termos de garantia por item, prazos (60m redes / 12m telas) e estados | **APROVADO** |
| 09 | [09_NOTIFICATIONS_AND_CRON.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/09_NOTIFICATIONS_AND_CRON.md) | Regras configuráveis e protocolo anti-spam (Reservation-Before-Send) | **APROVADO** |
| 10 | [10_ACTIVITY_TIMELINE_AND_AUDIT.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/10_ACTIVITY_TIMELINE_AND_AUDIT.md) | Trilha imutável `crm_activity_log`, notas humanas e Timeline 360° | **APROVADO** |
| 11 | [11_SECURITY_RLS_AND_LGPD.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/11_SECURITY_RLS_AND_LGPD.md) | RLS ativada em 100% das tabelas, isolamento BFF e proteção LGPD | **APROVADO** |
| 12 | [12_INDEXES_CONSTRAINTS_AND_DELETION.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/12_INDEXES_CONSTRAINTS_AND_DELETION.md) | Matriz completa de índices, constraints, ON DELETE e retenção | **APROVADO** |
| 13 | [13_API_CONTRACTS.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/13_API_CONTRACTS.md) | Desenho dos contratos JSON, autenticação e erros das APIs `/admin/crm/*` | **APROVADO** |
| 14 | [14_LEAD_TO_CLIENT_TRANSACTION.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/14_LEAD_TO_CLIENT_TRANSACTION.md) | Transação atômica ACID de conversão Lead → Cliente → Endereço → OS | **APROVADO** |
| 15 | [15_MIGRATION_010_BLUEPRINT.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/15_MIGRATION_010_BLUEPRINT.md) | Grafo de dependências e roteiro em 10 blocos da Migration 010 | **APROVADO** |
| 16 | [16_TEST_STRATEGY.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/16_TEST_STRATEGY.md) | Suíte completa de testes automatizados e validação em 10 viewports | **APROVADO** |
| 17 | [17_OPEN_DECISIONS.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/17_OPEN_DECISIONS.md) | Mapeamento de decisões de negócio operacionais para a gestão | **REVISÃO** |

---

## 3. Síntese das Principais Mudanças em Relação à Fase 1

1. **Conversão Atômica e Idempotente:** Garantida por transação única e constraint `unq_clients_lead_id` (`WHERE lead_id IS NOT NULL`). Um lead origina no máximo um cliente; cadastros manuais possuem `lead_id = NULL`.
2. **Endereço Opcional (0:N):** O cliente não é obrigado a ter endereço completo no primeiro contato ou pré-orçamento.
3. **Desacoplamento do Catálogo Público:** A Ordem de Serviço não está engessada nas 12 `service_key` do site, suportando manutenções, trocas de tela, retornos e serviços combinados.
4. **Ordem de Serviço com Múltiplos Itens (1:N):** Cada OS pode conter múltiplos itens de produtos/serviços, e as medições de vãos vinculam-se ao item específico em milímetros canônicos (`largura_mm`, `altura_mm`).
5. **Garantias Desacopladas do Relógio:** Separação entre estado temporal calculado (`Vigente`, `Vencendo em 30d/7d`, `Vencida`) e estado operacional persistido (`normal`, `acionada`, `em_atendimento`, `resolvida`, `cancelada`).
6. **Módulo Financeiro Real sem Complexidade de ERP:** Tabela `work_order_payments` (1:N) suportando sinais, parcelas e quitações com cancelamento auditável (sem exclusão física).
7. **Idempotência Anti-Spam de E-mails:** Protocolo de **Reserva Prévia no Banco (Reservation-Before-Send)** em `notification_deliveries` eliminando race conditions entre múltiplos workers de cron.
8. **Segurança e LGPD Estritas:** RLS habilitada em todas as 13 tabelas novas, `REVOKE ALL FROM anon, authenticated`, acesso restrito via BFF com `requireActiveAdmin` e `service_role`.

---

## 4. Como Outra IA Deve Revisar Esta Modelagem Antes da Migration 010

Para uma revisão técnica completa e sem lacunas, siga a seguinte **ordem estrita de leitura**:

```
Passo 01: Entender as 10 decisões fundamentais ──────► [01_ARCHITECTURAL_DECISIONS.md]
Passo 02: Analisar o modelo relacional completo ─────► [02_ENTITY_RELATIONSHIP_MODEL.md]
Passo 03: Verificar modelagem de Clientes e Locais ──► [03_CLIENTS_AND_ADDRESSES.md]
Passo 04: Avaliar Ordens de Serviço e Itens (1:N) ───► [04_WORK_ORDERS_AND_ITEMS.md]
Passo 05: Checar Medições em mm e Mídias no R2 ──────► [05_MEASUREMENTS_AND_MEDIA.md]
Passo 06: Revisar Financeiro e Pagamentos (1:N) ─────► [06_PAYMENTS.md]
Passo 07: Analisar Agenda e Equipe Técnica ──────────► [07_APPOINTMENTS_AND_STAFF.md]
Passo 08: Verificar Termos de Garantia Flexíveis ────► [08_WARRANTIES.md]
Passo 09: Estudar Automação de Notificações e Cron ──► [09_NOTIFICATIONS_AND_CRON.md]
Passo 10: Avaliar Trilha de Auditoria e Timeline ────► [10_ACTIVITY_TIMELINE_AND_AUDIT.md]
Passo 11: Validar RLS, Políticas e Segurança LGPD ───► [11_SECURITY_RLS_AND_LGPD.md]
Passo 12: Inspecionar Matriz de Índices e ON DELETE ─► [12_INDEXES_CONSTRAINTS_AND_DELETION.md]
Passo 13: Conferir Contratos das APIs BFF ───────────► [13_API_CONTRACTS.md]
Passo 14: Validar Transação Atômica de Conversão ────► [14_LEAD_TO_CLIENT_TRANSACTION.md]
Passo 15: Revisar Blueprint da Migration 010 ────────► [15_MIGRATION_010_BLUEPRINT.md]
Passo 16: Verificar Matriz de Testes Automatizados ──► [16_TEST_STRATEGY.md]
Passo 17: Checar Decisões de Negócio Restantes ──────► [17_OPEN_DECISIONS.md]
```
