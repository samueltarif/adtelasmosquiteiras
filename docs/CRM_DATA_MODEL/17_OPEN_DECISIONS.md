# 17 — DECISÕES HUMANAS E DE NEGÓCIO RESTANTES (FASE 1.1)

**Status:** PENDENTE DE REVISÃO DA GESTÃO  
**Data:** 26 de Agosto de 2026  
**Escopo:** Mapeamento de decisões de negócio operacionais que não impactam a estrutura relacional do banco, mas determinam fluxos de interface no frontend.

---

## 1. Resolução das Decisões Anteriores da Auditoria (Fase 1)

As decisões levantadas originalmente em `docs/CRM_AUDIT/13_OPEN_DECISIONS.md` foram **tecnicamente modeladas e resolvidas** nesta Fase 1.1:

| Decisão Original da Fase 1 | Solução Adotada na Fase 1.1 | Documento de Referência |
|---|---|---|
| **01: Obrigatoriedade de CPF/CNPJ** | `cpf_cnpj` opcional no primeiro contato, suportando `pessoa_fisica`, `empresa` e `condominio`. | [03_CLIENTS_AND_ADDRESSES.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/03_CLIENTS_AND_ADDRESSES.md) |
| **02: Deduplicação de Clientes** | Detecção proativa por telefone normalizado e e-mail sem bloqueio por UNIQUE rígida. | [03_CLIENTS_AND_ADDRESSES.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/03_CLIENTS_AND_ADDRESSES.md) |
| **03: Equipe Técnica / Instaladores** | Tabela `crm_staff` gerenciada pelo Admin sem necessidade de `auth.users` na V1. | [07_APPOINTMENTS_AND_STAFF.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/07_APPOINTMENTS_AND_STAFF.md) |
| **04: Destinatários dos Alertas** | Campo `destinatario_tipo: 'interno' \| 'cliente' \| 'ambos'` configurável por regra. | [09_NOTIFICATIONS_AND_CRON.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/09_NOTIFICATIONS_AND_CRON.md) |
| **05: Agendador de Cron** | Vercel Cron acionando `/api/cron/process-scheduled-tasks` com token `CRON_SECRET`. | [09_NOTIFICATIONS_AND_CRON.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/09_NOTIFICATIONS_AND_CRON.md) |
| **06: Profundidade Financeira** | Tabela `work_order_payments` (1:N) simples, com cancelamento auditável e sem ERP pesado. | [06_PAYMENTS.md](file:///d:/sicons/ADT/docs/CRM_DATA_MODEL/06_PAYMENTS.md) |

---

## 2. Decisões de Negócio Restantes para a Interface / Operação

As seguintes 3 decisões são estritamente de política comercial e de usabilidade:

### Decisão 01: Padrão de Numeração e Prefixos de Ordens de Serviço
- **Questão:** A numeração de OS deve ser sequencial anual global (`OS-2026-000001`) ou deve permitir prefixos diferenciados por serviço (ex: `TM-2026-0001` para Telas e `RP-2026-0001` para Redes)?
- **Opções:**
  - *Opção A (Recomendada):* Sequencial único global `OS-YYYY-XXXXXX`. Evita confusão operacional, simplifica buscas e unifica o controle de faturamento.
  - *Opção B:* Prefixos dinâmicos por categoria.
- **Recomendação:** **Opção A.** Como uma mesma OS pode conter Telas e Redes simultaneamente (múltiplos itens), um prefixo único `OS` é o mais correto.
- **Impacto:** Geração unificada de sequência no PostgreSQL.

---

### Decisão 02: Validade Padrão de Propostas Comerciais / Orçamentos
- **Questão:** As propostas emitidas em status `'orcamento'` devem ter prazo padrão de validade exposto ao cliente?
- **Opções:**
  - *Opção A (Recomendada):* Prazo padrão de **15 dias corridos** impresso na proposta, com campo editável no formulário.
  - *Opção B:* Sem prazo de validade formal.
- **Recomendação:** **Opção A.** Protege a empresa contra variações no custo do alumínio e malhas de polietileno.
- **Impacto:** Texto explicativo nos relatórios em PDF / propostas.

---

### Decisão 03: Política de Alçada e Limite de Descontos
- **Questão:** Deve haver trava de desconto percentual máximo para operadores comuns no preenchimento de propostas?
- **Opções:**
  - *Opção A (Recomendada para V1):* Desconto livre no preenchimento comercial, auditado via `crm_activity_log`.
  - *Opção B:* Desconto acima de 10% exige autorização ou senha de usuário com papel `superadmin`.
- **Recomendação:** **Opção A para a V1.** Mantém o fluxo ágil e sem atrito para a equipe de vendas. Caso haja necessidade futura, a política de alçada pode ser ativada no BFF.
- **Impacto:** Validação de formulário no frontend.
