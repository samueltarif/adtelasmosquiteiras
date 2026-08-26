# 13 — CONTRATOS CONCEITUAIS DAS APIS DO CRM (`/api/admin/crm/*`)

**Status:** APROVADO PARA MODELAGEM (FASE 1.1)  
**Data:** 26 de Agosto de 2026  
**Escopo:** Especificação técnica dos endpoints do BFF Nitro, payloads de requisição/resposta, autenticação, controle de idempotência e tratamento de erros.

---

## 1. Mapeamento Geral dos Endpoints do CRM

| Método | Rota do Endpoint | Finalidade Operacional | Auth Requerida |
|---|---|---|---|
| `GET` | `/api/admin/crm/clients` | Listagem paginada de clientes com busca por nome, telefone e status | `requireActiveAdmin` |
| `POST` | `/api/admin/crm/clients` | Cadastro manual de cliente (com endereço opcional) | `requireActiveAdmin` |
| `GET` | `/api/admin/crm/clients/:id` | Ficha 360° do cliente com múltiplos endereços e histórico de OSs | `requireActiveAdmin` |
| `PATCH` | `/api/admin/crm/clients/:id` | Atualização cadastral do cliente | `requireActiveAdmin` |
| `GET` | `/api/admin/crm/clients/check-duplicates` | Verificação prévia de clientes duplicados por telefone/email/CPF | `requireActiveAdmin` |
| `POST` | `/api/admin/crm/leads/:leadId/convert` | **Conversão atômica e idempotente de Lead em Cliente + OS** | `requireActiveAdmin` |
| `GET` | `/api/admin/crm/work-orders` | Listagem e Kanban de Ordens de Serviço | `requireActiveAdmin` |
| `POST` | `/api/admin/crm/work-orders` | Abertura de nova OS com itens e medições de vãos | `requireActiveAdmin` |
| `GET` | `/api/admin/crm/work-orders/:id` | Detalhes completos da OS, lista de vãos, fotos e pagamentos | `requireActiveAdmin` |
| `PATCH` | `/api/admin/crm/work-orders/:id` | Atualização de status da OS, responsável ou dados de entrega | `requireActiveAdmin` |
| `POST` | `/api/admin/crm/work-orders/:id/payments` | Lançamento de pagamento recebido (Sinal, Parcela, Quitação) | `requireActiveAdmin` |
| `POST` | `/api/admin/crm/agenda/appointments` | Agendamento de visita técnica ou instalação | `requireActiveAdmin` |
| `GET` | `/api/admin/crm/agenda` | Consulta da agenda por período (`America/Sao_Paulo`) e por técnico | `requireActiveAdmin` |
| `GET` | `/api/admin/crm/warranties` | Consulta operacional de garantias (vigentes, vencendo, vencidas) | `requireActiveAdmin` |
| `GET` | `/api/admin/crm/clients/:id/timeline` | Linha do tempo unificada de interações e eventos do cliente | `requireActiveAdmin` |
| `POST` | `/api/cron/process-scheduled-tasks` | Execução do agendador diário/horário de notificações | Header `CRON_SECRET` |

---

## 2. Especificação Detalhada dos Principais Endpoints

### 2.1. `POST /api/admin/crm/leads/:leadId/convert`
Executa a conversão atômica do Lead em Cliente, gerando opcionalmente o primeiro endereço, a primeira OS com itens e vinculando mídias.

- **Payload de Entrada (JSON):**
  ```json
  {
    "tipo_cliente": "pessoa_fisica",
    "nome": "Carlos Silva",
    "telefone_principal": "(11) 98765-4321",
    "email": "carlos@gmail.com",
    "cpf_cnpj": null,
    "endereco_inicial": {
      "rotulo": "Residência Principal",
      "cep": "02011-000",
      "logradouro": "Rua Voluntários da Pátria",
      "numero": "1500",
      "complemento": "Apto 42",
      "bairro": "Santana",
      "cidade": "São Paulo",
      "uf": "SP"
    },
    "criar_ordem_servico": true,
    "ordem_servico_inicial": {
      "categoria_operacional": "tela_mosquiteira",
      "descricao": "Telas Mosquiteiras Janelas e Portas",
      "valor_orcamento": 1250.00,
      "data_prevista": "2026-09-05"
    }
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "client": {
      "id": "c1f72b9a-4c28-4e89-b8ef-6a58390b1e10",
      "lead_id": "a9e32f11-9988-4321-b000-112233445566",
      "nome": "Carlos Silva",
      "status": "ativo"
    },
    "address_id": "d2e83c10-5d39-4f90-a9fe-7b69401c2f21",
    "work_order": {
      "id": "e3f94d21-6e40-4a01-ba0f-8c70512d3a32",
      "numero_os": "OS-2026-000142",
      "status_os": "orcamento",
      "valor_total": 1250.00
    }
  }
  ```
- **Erros Tratados:**
  - `400 Bad Request`: Dados obrigatórios ausentes ou telefone inválido.
  - `409 Conflict`: `LEAD_ALREADY_CONVERTED` (O lead já possui cliente cadastrado; retorna o ID do cliente existente).

---

### 2.2. `POST /api/admin/crm/work-orders/:id/payments`
Registra recebimento de pagamento sem possibilidade de exclusão física posterior.

- **Payload de Entrada (JSON):**
  ```json
  {
    "valor": 500.00,
    "metodo_pagamento": "pix",
    "data_pagamento": "2026-08-26T10:30:00-03:00",
    "nota_comprovante": "Pix Santander E2E-9988776655"
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "payment_id": "f4a05e32-7f51-4b12-cb10-9d81623e4b43",
    "work_order_summary": {
      "valor_final": 1250.00,
      "total_pago": 500.00,
      "saldo_devedor": 750.00,
      "status_pagamento": "parcial"
    }
  }
  ```

---

### 2.3. `POST /api/cron/process-scheduled-tasks`
Disparado pelo agendador externo (Vercel Cron) para processamento resiliente de notificações com reserva atômica de concorrência.

- **Headers:** `Authorization: Bearer <CRON_SECRET>`
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "processed_window": "2026-08-26 09:00 SP",
    "rules_evaluated": 6,
    "deliveries_reserved": 3,
    "emails_sent": 3,
    "emails_failed": 0,
    "skipped_duplicates": 12
  }
  ```
