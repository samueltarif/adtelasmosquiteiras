# 02 — MODELO ENTIDADE-RELACIONAMENTO DEFINITIVO (ER)

**Status:** APROVADO PARA MODELAGEM (FASE 1.1)  
**Data:** 26 de Agosto de 2026  
**Escopo:** Diagrama relacional completo de entidades, chaves estrangeiras, cardinalidades e ciclo de vida.

---

## 1. Diagrama Entidade-Relacionamento Completo

```mermaid
erDiagram
    %% Aquisição de Leads (Existente)
    LEADS ||--o| CLIENTS : "converte_em (0:1 lead_id)"
    LEADS ||--o{ LEAD_MEDIA : "possui_midias (1:N)"

    %% Núcleo de Clientes e Locais
    CLIENTS ||--o{ CLIENT_ADDRESSES : "possui_locais (0:N)"
    CLIENTS ||--o{ WORK_ORDERS : "contrata (0:N)"
    CLIENTS ||--o{ CRM_NOTES : "anotacoes (0:N)"
    CLIENTS ||--o{ CRM_ACTIVITY_LOG : "auditoria (0:N)"

    %% Equipe Operacional
    CRM_STAFF ||--o{ WORK_ORDERS : "responsavel_tecnico (0:N)"
    CRM_STAFF ||--o{ APPOINTMENTS : "executa_atendimento (0:N)"

    %% Ordens de Serviço e Itens
    CLIENT_ADDRESSES ||--o{ WORK_ORDERS : "local_execucao (0:N)"
    WORK_ORDERS ||--|{ WORK_ORDER_ITEMS : "composta_por (1:N)"
    WORK_ORDERS ||--o{ WORK_ORDER_PAYMENTS : "recebimentos (0:N)"
    WORK_ORDERS ||--o{ WORK_ORDER_MEDIA : "fotos_tecnicas (0:N)"
    WORK_ORDERS ||--o{ APPOINTMENTS : "agendamentos (0:N)"
    WORK_ORDERS ||--o{ CRM_NOTES : "anotacoes (0:N)"

    %% Medições e Garantias por Item
    WORK_ORDER_ITEMS ||--o{ WORK_ORDER_MEASUREMENTS : "detalha_vaos (0:N)"
    WORK_ORDER_ITEMS ||--o| WARRANTIES : "cobertura_garantia (0:1)"

    %% Notificações e Agendador
    NOTIFICATION_RULES ||--o{ NOTIFICATION_DELIVERIES : "gera_disparos (1:N)"
    APPOINTMENTS ||--o{ NOTIFICATION_DELIVERIES : "notifica_visita (0:N)"
    WARRANTIES ||--o{ NOTIFICATION_DELIVERIES : "notifica_garantia (0:N)"

    %% Especificações das Entidades
    CLIENTS {
        uuid id PK
        uuid lead_id FK "nullable (UNIQUE parcial)"
        string tipo_cliente "PF | PJ | CONDOMINIO"
        string nome
        string nome_fantasia
        string razao_social
        string cpf_cnpj
        string telefone_principal
        string telefone_secundario
        string email
        string status "ativo | inativo | bloqueado"
        text observacoes
        boolean is_archived
        timestamptz archived_at
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    CLIENT_ADDRESSES {
        uuid id PK
        uuid client_id FK "NOT NULL (CASCADE)"
        string rotulo
        string tipo_imovel "casa | apartamento | comercial | condominio | outro"
        string cep
        string logradouro
        string numero
        string complemento
        string bairro
        string cidade
        string uf
        string referencia
        text observacoes_acesso
        boolean is_principal
        timestamptz created_at
        timestamptz updated_at
    }

    CRM_STAFF {
        uuid id PK
        string nome
        string telefone
        string email
        string funcao "instalador | vistoriador | atendente | gestor"
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    WORK_ORDERS {
        uuid id PK
        string numero_os "UNIQUE humano (ex: OS-2026-0001)"
        uuid client_id FK "NOT NULL (RESTRICT)"
        uuid address_id FK "nullable (SET NULL)"
        uuid responsible_staff_id FK "nullable (SET NULL)"
        string status_os "orcamento | aprovada | aguardando_agendamento | agendada | em_execucao | concluida | cancelada"
        decimal valor_total
        decimal valor_desconto
        decimal valor_final
        date data_prevista
        date data_conclusao
        text observacoes_gerais
        boolean is_archived
        timestamptz archived_at
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    WORK_ORDER_ITEMS {
        uuid id PK
        uuid work_order_id FK "NOT NULL (CASCADE)"
        string service_key "nullable (ref catalogo)"
        string categoria_operacional "tela_mosquiteira | rede_protecao | vidracaria | manutencao | outro"
        string descricao
        int quantidade
        decimal preco_unitario
        decimal preco_total
        text observacoes
        int sort_order
        timestamptz created_at
        timestamptz updated_at
    }

    WORK_ORDER_MEASUREMENTS {
        uuid id PK
        uuid work_order_item_id FK "NOT NULL (CASCADE)"
        string ambiente
        string tipo_vao
        int largura_mm "unidade canonica mm"
        int altura_mm "unidade canonica mm"
        int quantidade
        string cor_estrutura
        string tipo_material
        text observacoes
        int sort_order
        timestamptz created_at
        timestamptz updated_at
    }

    WORK_ORDER_PAYMENTS {
        uuid id PK
        uuid work_order_id FK "NOT NULL (RESTRICT)"
        decimal valor
        string metodo_pagamento "pix | cartao_credito | cartao_debito | dinheiro | boleto | transferencia"
        timestamptz data_pagamento
        string status_pagamento "confirmado | cancelado"
        text nota_comprovante
        timestamptz cancelled_at
        uuid cancelled_by FK
        text motivo_cancelamento
        uuid created_by FK
        timestamptz created_at
    }

    WORK_ORDER_MEDIA {
        uuid id PK
        uuid work_order_id FK "NOT NULL (CASCADE)"
        uuid work_order_item_id FK "nullable"
        string storage_key "R2 bucket privado"
        string safe_filename
        string media_type "photo | video"
        string mime_type
        bigint file_size_bytes
        string etapa "antes | durante | depois | laudo"
        text descricao
        uuid created_by FK
        timestamptz created_at
    }

    APPOINTMENTS {
        uuid id PK
        uuid work_order_id FK "NOT NULL (CASCADE)"
        uuid client_id FK "NOT NULL (RESTRICT)"
        uuid address_id FK "nullable (SET NULL)"
        uuid staff_id FK "nullable (SET NULL)"
        string tipo_agendamento "visita_tecnica | medicao | instalacao | manutencao | garantia"
        timestamptz data_hora_inicio
        timestamptz data_hora_fim
        string status_agendamento "agendado | confirmado | em_deslocamento | realizado | reagendado | cancelado"
        text observacoes
        uuid rescheduled_from_id FK "nullable (historico de reagendamento)"
        text motivo_reagendamento_cancelamento
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    WARRANTIES {
        uuid id PK
        uuid work_order_id FK "NOT NULL (RESTRICT)"
        uuid work_order_item_id FK "nullable (UNIQUE parcial)"
        uuid client_id FK "NOT NULL (RESTRICT)"
        date data_inicio
        date data_termino
        int prazo_meses
        string status_operacional "normal | acionada | em_atendimento | resolvida | cancelada"
        text termos_condicoes
        text observacoes
        timestamptz created_at
        timestamptz updated_at
    }

    NOTIFICATION_RULES {
        uuid id PK
        string nome_regra
        string tipo_regra "agenda_diaria | agenda_semanal | lembrete_visita | garantia_a_vencer | garantia_vencimento | pos_venda"
        boolean is_active
        time horario_disparo "ex: 09:00:00"
        string dias_semana "ex: 1,2,3,4,5,6 (Seg-Sab)"
        int offset_dias "ex: -1 (1 dia antes), 30 (30 dias antes), 7 (7 dias depois)"
        string destinatario_tipo "interno | cliente | ambos"
        string timezone "America/Sao_Paulo"
        jsonb configuracoes_extras
        timestamptz created_at
        timestamptz updated_at
    }

    NOTIFICATION_DELIVERIES {
        uuid id PK
        string idempotency_key "UNIQUE deterministica"
        uuid rule_id FK "NOT NULL"
        string entity_type "appointment | warranty | work_order | digest"
        uuid entity_id "nullable"
        string recipient_email "NOT NULL"
        string status "processing | sent | failed | skipped"
        timestamptz locked_until "reserva concorrente"
        int attempts "DEFAULT 1"
        timestamptz last_attempt_at
        timestamptz sent_at
        text last_error
        timestamptz created_at
    }

    CRM_ACTIVITY_LOG {
        uuid id PK
        uuid client_id FK "nullable (CASCADE)"
        uuid work_order_id FK "nullable (SET NULL)"
        string entity_type "client | work_order | appointment | payment | warranty"
        uuid entity_id "NOT NULL"
        string acao "created | status_changed | rescheduled | payment_received | note_added"
        jsonb dados_anteriores
        jsonb dados_novos
        text descricao_humana
        uuid actor_id FK "Admin que realizou a acao"
        timestamptz occurred_at "now()"
    }

    CRM_NOTES {
        uuid id PK
        uuid client_id FK "NOT NULL (CASCADE)"
        uuid work_order_id FK "nullable (SET NULL)"
        text conteudo "Texto da nota humana"
        string categoria "geral | atendimento | financeiro | tecnico"
        uuid author_id FK "Admin autor"
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 2. Tabela Mestre de Entidades, Cardinalidades e Ciclo de Vida

| Entidade | Finalidade Primária | Entidade Pai | Cardinalidade | Política de Exclusão / Lifecycle |
|---|---|---|---|---|
| `public.clients` | Cadastro do cliente (PF/PJ/Condomínio) | Nenhuma (ou `leads`) | 1:1 com Lead (opcional) | **Arquivamento (`is_archived = true`)**. Não deletável se possuir OS. |
| `public.client_addresses`| Locais e endereços de atendimento | `clients` | `0:N` por cliente | **DELETE físico permitido** se não vinculado a OS ativa. |
| `public.crm_staff` | Técnicos e equipe operacional | Nenhuma | 1:N com OS/Agenda | **Desativação (`is_active = false`)**. Imutável após vínculos. |
| `public.work_orders` | Ordem de Serviço operacional | `clients` | `1:N` por cliente | **Arquivamento / Cancelamento**. Draft vazio pode ser excluído. |
| `public.work_order_items`| Linhas de serviço contratadas | `work_orders` | `1:N` por OS | **CASCADE com OS**. Imutável após OS concluída. |
| `public.work_order_measurements` | Medições técnicas de vãos | `work_order_items` | `0:N` por item | **CASCADE com item**. |
| `public.work_order_media` | Fotos/vídeos privados do serviço | `work_orders` | `0:N` por OS | **CASCADE lógico** com proteção de arquivo no R2. |
| `public.work_order_payments`| Lançamentos de recebimentos | `work_orders` | `0:N` por OS | **Cancelamento com auditoria (`status: 'cancelado'`)**. |
| `public.appointments` | Visitas técnicas e instalações | `work_orders` / `clients` | `0:N` por OS | **Cancelamento / Reagendamento** com justificativa. |
| `public.warranties` | Prazos e controle de garantia | `work_orders` / `items` | `0:1` por item ou OS | **Cancelamento operacional**. Registros históricos permanentes. |
| `public.notification_rules` | Regras configuráveis de avisos | Nenhuma | 1:N com entregas | **Desativação (`is_active = false`)**. |
| `public.notification_deliveries`| Auditoria e idempotência de envios | `notification_rules` | 1:N por regra | **Tabela Imutável (Append-only / Update de status)**. |
| `public.crm_activity_log` | Trilha de auditoria cronológica | `clients` / `work_orders` | 1:N | **Tabela Imutável (Append-only)**. |
| `public.crm_notes` | Anotações humanas de atendimento | `clients` | `0:N` por cliente | **DELETE permitido** apenas pelo autor ou superadmin. |
