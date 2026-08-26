# 07 — ESPECIFICAÇÃO DE AGENDAMENTOS E EQUIPE TÉCNICA (`appointments` / `crm_staff`)

**Status:** APROVADO PARA MODELAGEM (FASE 1.1)  
**Data:** 26 de Agosto de 2026  
**Escopo:** Modelagem da agenda operacional (visitas técnicas, medições, instalações, garantias), reagendamentos com rastreabilidade e gestão da equipe técnica de campo.

---

## 1. Tabela `public.crm_staff`

Gerencia o catálogo de técnicos, instaladores e atendentes da empresa sem exigir contas de autenticação em `auth.users` na V1.

### 1.1. Dicionário de Dados de `public.crm_staff`

| Campo | Tipo PostgreSQL | NULL? | Default | Constraint / Validação | Índice? | Descrição e Regra de Negócio |
|---|---|---|---|---|---|---|
| `id` | `UUID` | **NÃO** | `gen_random_uuid()` | PRIMARY KEY | PK | Identificador único do colaborador |
| `nome` | `VARCHAR(150)` | **NÃO** | - | `length(trim(nome)) >= 2` | SIM | Nome completo do profissional |
| `telefone` | `VARCHAR(30)` | SIM | `NULL` | - | - | Telefone / WhatsApp direto para contato operacional |
| `email` | `VARCHAR(255)` | SIM | `NULL` | Formato de e-mail válido | - | E-mail do profissional (para envio de agenda diária) |
| `funcao` | `VARCHAR(50)` | **NÃO** | `'instalador'` | CHECK IN (`'instalador'`, `'vistoriador'`, `'atendente'`, `'gestor'`) | SIM | Função operacional principal |
| `is_active` | `BOOLEAN` | **NÃO** | `true` | - | SIM | Flag de status (Permite desativar sem apagar histórico) |
| `created_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | - | - | Data de inclusão |
| `updated_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | Atualizado via trigger | - | Data da última alteração |

---

## 2. Tabela `public.appointments`

Centraliza todos os compromissos presenciais e atendimentos de campo vinculados a uma Ordem de Serviço.

### 2.1. Dicionário de Dados de `public.appointments`

| Campo | Tipo PostgreSQL | NULL? | Default | Constraint / Validação | Índice? | Descrição e Regra de Negócio |
|---|---|---|---|---|---|---|
| `id` | `UUID` | **NÃO** | `gen_random_uuid()` | PRIMARY KEY | PK | Identificador único do agendamento |
| `work_order_id` | `UUID` | **NÃO** | - | FK `public.work_orders(id)` ON DELETE CASCADE | SIM | Ordem de Serviço à qual o agendamento pertence |
| `client_id` | `UUID` | **NÃO** | - | FK `public.clients(id)` ON DELETE RESTRICT | SIM | Cliente atendido (desnormalizado para performance de busca) |
| `address_id` | `UUID` | SIM | `NULL` | FK `public.client_addresses(id)` ON DELETE SET NULL | SIM | Endereço físico onde a equipe deve comparecer |
| `staff_id` | `UUID` | SIM | `NULL` | FK `public.crm_staff(id)` ON DELETE SET NULL | SIM | Técnico/Instalador escalado para o serviço |
| `tipo_agendamento` | `VARCHAR(30)` | **NÃO** | `'instalacao'` | CHECK IN (`'visita_tecnica'`, `'medicao'`, `'instalacao'`, `'manutencao'`, `'garantia'`) | SIM | Modalidade do atendimento |
| `data_hora_inicio` | `TIMESTAMPTZ` | **NÃO** | - | `data_hora_inicio < data_hora_fim` | SIM (Btree) | Horário de início previsto (`America/Sao_Paulo`) |
| `data_hora_fim` | `TIMESTAMPTZ` | **NÃO** | - | - | SIM (Btree) | Horário de término estimado |
| `status_agendamento`| `VARCHAR(30)` | **NÃO** | `'agendado'` | CHECK IN (`'agendado'`, `'confirmado'`, `'em_deslocamento'`, `'realizado'`, `'reagendado'`, `'cancelado'`) | SIM | Estado da execução da agenda |
| `observacoes` | `TEXT` | SIM | `NULL` | - | - | Recomendações de portaria, ferramentas ou restrições de horário |
| `rescheduled_from_id`| `UUID` | SIM | `NULL` | FK `public.appointments(id)` ON DELETE SET NULL | SIM | Aponta para o agendamento anterior que foi reagendado |
| `motivo_reagendamento_cancelamento`| `TEXT` | SIM | `NULL` | Obrigatório se `status_agendamento IN ('reagendado', 'cancelado')` | - | Justificativa do reagendamento ou cancelamento |
| `created_by` | `UUID` | SIM | `NULL` | FK `auth.users(id)` ON DELETE SET NULL | - | Administrador criador do agendamento |
| `created_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | - | SIM | Data de inclusão |
| `updated_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | Atualizado via trigger | - | Data da última modificação |

---

## 3. Política de Conflito de Agenda e Reagendamento

```mermaid
graph TD
    A[Operador seleciona Técnico + Data/Hora] --> B[API /api/admin/crm/agenda/check-conflicts]
    B --> C{"Existe agendamento sobreposto para o mesmo técnico?"}
    C -->|SIM| D[Retorna Aviso: 'Técnico já possui compromisso neste horário']
    D --> E[Exibe Modal de Confirmação: 'Deseja agendar mesmo assim (concomitante)?']
    E -->|Confirmado pelo Admin| F[Salva o agendamento]
    C -->|NÃO| F
```

1. **Conflito Consultivo (Advisory Conflict):** O sistema emite alerta visual no formulário caso o técnico já possua atendimento no mesmo intervalo, mas **não bloqueia rigidamente**, permitindo atendimento em duplas ou serviços rápidos no mesmo condomínio.
2. **Cadeia Auditável de Reagendamentos:** Ao reagendar, o agendamento anterior passa para `status_agendamento = 'reagendado'` com justificativa gravada, e o novo compromisso é criado com `rescheduled_from_id` apontando para o original.
