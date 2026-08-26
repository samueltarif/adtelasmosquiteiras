# 14 — FLUXO TRANSACIONAL ATÔMICO: LEAD → CLIENTE → ORDEM DE SERVIÇO

**Status:** APROVADO PARA MODELAGEM (FASE 1.1)  
**Data:** 26 de Agosto de 2026  
**Escopo:** Especificação passo a passo do fluxo atômico e transacional de conversão de Leads em Clientes e Ordens de Serviço, com garantias de idempotência e tolerância a falhas.

---

## 1. Diagrama Sequencial da Transação Atômica

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrador
    participant UI as LeadJourneyDrawer.vue / Modal Conversão
    participant API as POST /api/admin/crm/leads/:leadId/convert
    participant DB as PostgreSQL Transaction (BEGIN...COMMIT)
    participant R2 as Cloudflare R2 Privado (Zero Cópia Física)

    A->>UI: Clica em "[ Converter em Cliente ]"
    UI->>UI: Pré-preenche formulário com dados do Lead (Nome, Tel, Email, Cidade, Bairro, Serviço)
    UI->>API: POST /api/admin/crm/clients/check-duplicates (Verifica duplicatas)
    API-->>UI: Retorna lista de possíveis clientes já existentes
    
    alt Encontrou cliente duplicado
        UI-->>A: Exibe alerta: "Cliente com este telefone já existe. Vincular ou Criar Novo?"
        A->>UI: Seleciona "Criar Novo Cliente" ou "Usar Existente"
    end

    A->>UI: Confirma formulário de conversão
    UI->>API: POST /api/admin/crm/leads/:leadId/convert (Payload com dados editados)
    
    rect rgb(240, 248, 255)
        note over API,DB: Transação Atômica ACID (Garantida no Servidor)
        API->>DB: BEGIN TRANSACTION;
        API->>DB: SELECT id FROM public.clients WHERE lead_id = :leadId FOR UPDATE;
        alt Lead já foi convertido anteriormente (Race condition / Duplo clique)
            DB-->>API: Encontra registro existente
            API->>DB: ROLLBACK;
            API-->>UI: Retorna 409 Conflict (Abre cliente existente)
        end

        API->>DB: INSERT INTO public.clients (lead_id, nome, telefone_principal, email, ...) RETURNING id;
        
        opt Se informado endereço inicial
            API->>DB: INSERT INTO public.client_addresses (client_id, cidade, bairro, logradouro, ...) RETURNING id;
        end

        opt Se solicitada criação da primeira OS
            API->>DB: Gera próximo numero_os (ex: OS-2026-000145)
            API->>DB: INSERT INTO public.work_orders (client_id, address_id, numero_os, status_os='orcamento', ...) RETURNING id;
            API->>DB: INSERT INTO public.work_order_items (work_order_id, descricao, preco_total, ...) RETURNING id;
            
            opt Se o Lead possui mídias em public.lead_media
                API->>DB: INSERT INTO public.work_order_media (work_order_id, storage_key, ...) SELECT :woId, storage_key FROM public.lead_media WHERE lead_id = :leadId;
                note over API,R2: Vinculação lógica instantânea (Zero bytes copiados no R2)
            end
        end

        API->>DB: UPDATE public.leads SET status = 'Fechado' WHERE id = :leadId;
        API->>DB: INSERT INTO public.crm_activity_log (client_id, acao='converted_from_lead', ...);
        API->>DB: COMMIT;
    end

    API-->>UI: Retorna { success: true, client_id, work_order_id }
    UI->>UI: Redireciona para a ficha completa em /admin/clientes/:id
```

---

## 2. Garantias e Regras de Negócio na Conversão

### 2.1. Idempotência e Bloqueio de Concorrência
- A constraint `unq_clients_lead_id` (`WHERE lead_id IS NOT NULL`) impede em nível de banco que dois cliques rápidos gerem dois clientes a partir do mesmo lead.
- Caso ocorra colisão, a transação aborta via `ROLLBACK` e o backend retorna o cliente já existente.

### 2.2. Preservação Total dos Dados de Marketing
- Os campos de atribuição de marketing (`utm_source`, `utm_campaign`, `gclid`, `first_touch_channel`) **permanecem intactos na tabela `public.leads`**, servindo para relatórios analíticos de ROI comercial.
- A tabela `public.clients` não duplica desnecessariamente os 20+ campos de marketing, mantendo o esquema limpo e normalizado.

### 2.3. Vinculação Lógica de Mídias Privadas
- Fotos e vídeos enviados pelo visitante no formulário de lead são vinculados à primeira Ordem de Serviço inserindo linhas em `public.work_order_media` que apontam para o mesmo `storage_key` no Cloudflare R2.
- Isso economiza tráfego de rede, tempo de processamento (< 50ms) e custo de armazenamento no R2.
