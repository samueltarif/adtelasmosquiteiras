# 11 — ARQUITETURA CONCEITUAL DO CRM (PROPOSTA PARA DISCUSSÃO)

> [!IMPORTANT]
> **MODELAGEM SUPERADA/REFINADA PELA FASE 1.1:**
> O modelo conceitual deste documento foi estendido e formalizado na documentação definitiva da Fase 1.1. Para a modelagem completa e aprovada com múltiplos itens por OS, pagamentos reais e garantias flexíveis, consulte: [docs/CRM_DATA_MODEL/00_INDEX.md](../CRM_DATA_MODEL/00_INDEX.md).

**Status:** HISTÓRICO / REFINADO NA FASE 1.1  
**Data da Auditoria:** 26 de Agosto de 2026  
**Escopo:** Modelo de dados conceitual preliminar da Fase 1.  

---

## 1. Diagrama de Entidades e Relacionamentos (ER Conceitual)

```mermaid
erDiagram
    LEADS ||--o| CLIENTS : "converte em (lead_id)"
    CLIENTS ||--|{ CLIENT_ADDRESSES : "possui (1:N)"
    CLIENTS ||--|{ WORK_ORDERS : "contrata (1:N)"
    CLIENT_ADDRESSES ||--o{ WORK_ORDERS : "local da instalacao"
    WORK_ORDERS ||--|{ WORK_ORDER_MEASUREMENTS : "possui vaos/medidas (1:N)"
    WORK_ORDERS ||--o{ WORK_ORDER_MEDIA : "fotos tecnicas antes/depois (1:N)"
    WORK_ORDERS ||--o{ APPOINTMENTS : "visitas/instalacoes (1:N)"
    WORK_ORDERS ||--o| WARRANTIES : "garantia do servico (1:1)"
    WARRANTIES ||--o{ NOTIFICATION_DELIVERIES : "disparos de aviso (1:N)"
    APPOINTMENTS ||--o{ NOTIFICATION_DELIVERIES : "lembretes de agenda (1:N)"

    LEADS {
        uuid id PK
        string nome
        string telefone
        string email
        string status
        string submission_id
    }

    CLIENTS {
        uuid id PK
        uuid lead_id FK "nullable (origem)"
        string nome
        string tipo_pessoa "PF | PJ"
        string cpf_cnpj "opcional"
        string telefone_principal
        string telefone_secundario
        string email
        string status "Ativo | Inativo | Bloqueado"
        text observacoes_gerais
        timestamptz created_at
    }

    CLIENT_ADDRESSES {
        uuid id PK
        uuid client_id FK
        string rotulo "Residencia | Apto | Comercial | Sitio"
        string cep
        string logradouro
        string numero
        string complemento
        string bairro
        string cidade
        string uf
        boolean is_principal
    }

    WORK_ORDERS {
        uuid id PK
        uuid client_id FK
        uuid address_id FK
        string numero_os "Sequencial legivel"
        string service_key "Allowlist das 12 chaves"
        string titulo_servico
        string status_os "Orcamento | Aprovada | Em_Execucao | Concluida | Cancelada"
        decimal valor_total
        decimal valor_pago
        string status_pagamento "Pendente | Parcial | Pago"
        string responsavel_tecnico
        date data_prevista
        date data_conclusao
        text observacoes_tecnicas
    }

    WORK_ORDER_MEASUREMENTS {
        uuid id PK
        uuid work_order_id FK
        string ambiente "Quarto Casal | Sacada | Cozinha"
        string tipo_vao "Janela 2 Folhas | Porta Balcao | Mezanino"
        int largura_mm
        int altura_mm
        int quantidade
        string unidade_medida "mm | cm | m"
        string cor_aluminio "Branco | Preto | Bronze | Natural"
        string tipo_tecido_rede "Malha 5x5 | Pet Screen | Fibra Vidro"
        text observacoes
    }

    WORK_ORDER_MEDIA {
        uuid id PK
        uuid work_order_id FK
        string storage_key "R2 bucket adtelas-leads-private"
        string tipo_etapa "antes | durante | depois | laudo"
        string media_type "photo | video"
        string mime_type
        bigint file_size_bytes
        timestamptz created_at
    }

    APPOINTMENTS {
        uuid id PK
        uuid work_order_id FK
        uuid client_id FK
        uuid address_id FK
        string tipo_evento "Visita_Tecnica | Instalacao | Manutencao | Retorno"
        timestamptz data_hora_inicio
        timestamptz data_hora_fim
        string responsavel_nome
        string status_agenda "Agendado | Confirmado | Em_Deslocamento | Realizado | Reagendado | Cancelado"
        text motivo_reagendamento
    }

    WARRANTIES {
        uuid id PK
        uuid work_order_id FK "UNIQUE"
        uuid client_id FK
        date data_inicio
        date data_termino
        int prazo_meses "ex: 60 meses (5 anos) redes, 12 meses telas"
        string status_garantia "Vigente | Vencendo | Vencida | Acionada"
        text termos_especificos
    }

    NOTIFICATION_DELIVERIES {
        uuid id PK
        string idempotency_key "UNIQUE hash"
        string tipo_regra "agenda_diaria | lembrete_1d | garantia_30d | garantia_7d"
        uuid target_id
        string recipient_email
        timestamptz sent_at
        string status "sent | failed"
    }
```

---

## 2. Modelagem das Necessidades Operacionais Críticas

### 2.1. Modelo Cliente × Múltiplos Endereços (1:N)
- Um cliente pode possuir múltiplos imóveis (ex: Residência em Santana, Apartamento em Moema, Comércio no Centro, Casa de Campo).
- Cada Ordem de Serviço (OS) aponta para um `address_id` específico do cliente, garantindo que o técnico saiba exatamente onde realizar a instalação.

### 2.2. Modelo Cliente × Múltiplas Ordens de Serviço (1:N)
- O cliente nunca deve ter seus dados de serviço atrelados a um campo estático na tabela de clientes.
- Um mesmo cliente pode contratar `Telas Mosquiteiras` em 2026 e `Redes de Proteção` em 2027, gerando duas OSs distintas com garantias independentes.

### 2.3. Medidas e Vãos Estruturados (1:N na OS)
- Cada vão de janela/porta é modelado com precisão milimétrica (`largura_mm`, `altura_mm`, `quantidade`, `ambiente`, `cor_aluminio`, `tipo_tecido_rede`).
- Permite cálculo automatizado de metragem quadrada total ($m^2$) e conferência de corte/produção.

### 2.4. Garantias Independentes por Serviço
- A garantia é atrelada diretamente à Ordem de Serviço (`work_orders.id`), possuindo prazo específico (ex: 5 anos para Redes de Proteção e 1 a 2 anos para Telas Mosquiteiras).
- Permite identificar no painel de pós-venda o status exato: `Vigente`, `Vencendo em 30d/15d/7d`, `Vencida` ou `Em Atendimento de Garantia`.

---

## 3. Arquitetura da Timeline 360° do Cliente

A timeline do cliente deve adotar uma **estratégia híbrida** para máxima fidelidade e performance:

```
[Lead Recebido] ──► [Cliente Cadastrado] ──► [Visita Técnica] ──► [Orçamento Aprovado] ──► [Instalação Concluída] ──► [Garantia Ativa] ──► [Pós-Venda]
```

1. **Eventos Transacionais Nativos (Gerados em Tempo Real):**
   - Criação do Lead original;
   - Agendamentos de visita e instalação (`appointments`);
   - Mutações de status da OS (`work_orders`);
   - Prazos e acionamentos de garantia (`warranties`).
2. **Notas e Registros Manuais do Atendente:**
   - Observações de contato telefônico, mensagens de WhatsApp e acordos comerciais gravadas em tabela auditável de interações.
