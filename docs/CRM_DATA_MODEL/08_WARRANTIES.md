# 08 — ESPECIFICAÇÃO DE GARANTIAS E PÓS-VENDA (`warranties`)

**Status:** APROVADO PARA MODELAGEM (FASE 1.1)  
**Data:** 26 de Agosto de 2026  
**Escopo:** Modelagem do controle de garantias de serviços, separação entre estado temporal e operacional, suporte a prazos diferenciados por item e acionamentos de pós-venda.

---

## 1. Tabela `public.warranties`

Registra a cobertura de garantia concedida para cada serviço ou item instalado, controlando prazos, acionamentos e chamados técnicos de pós-venda.

### 1.1. Dicionário de Dados de `public.warranties`

| Campo | Tipo PostgreSQL | NULL? | Default | Constraint / Validação | Índice? | Descrição e Regra de Negócio |
|---|---|---|---|---|---|---|
| `id` | `UUID` | **NÃO** | `gen_random_uuid()` | PRIMARY KEY | PK | Identificador universal da garantia |
| `work_order_id` | `UUID` | **NÃO** | - | FK `public.work_orders(id)` ON DELETE RESTRICT | SIM | Ordem de Serviço concluída que originou a garantia |
| `work_order_item_id` | `UUID` | SIM | `NULL` | FK `public.work_order_items(id)` ON DELETE SET NULL | **SIM (Partial UNIQUE)** | Item específico coberto (NULL se a garantia for global da OS) |
| `client_id` | `UUID` | **NÃO** | - | FK `public.clients(id)` ON DELETE RESTRICT | SIM | Cliente titular do termo de garantia |
| `data_inicio` | `DATE` | **NÃO** | - | `data_inicio <= data_termino` | SIM | Data de início da vigência (data de conclusão da OS) |
| `data_termino` | `DATE` | **NÃO** | - | - | SIM (Btree) | Data final de vigência do termo |
| `prazo_meses` | `INT` | **NÃO** | `12` | `prazo_meses > 0` | - | Duração em meses (ex: 60 meses = 5 anos redes, 12 meses telas) |
| `status_operacional` | `VARCHAR(30)` | **NÃO** | `'normal'` | CHECK IN (`'normal'`, `'acionada'`, `'em_atendimento'`, `'resolvida'`, `'cancelada'`) | SIM | Estado de atendimento operacional |
| `termos_condicoes` | `TEXT` | SIM | `NULL` | - | - | Texto padrão das condições de cobertura (defeitos de fábrica, rompimento) |
| `observacoes` | `TEXT` | SIM | `NULL` | - | - | Histórico de chamados ou observações de pós-venda |
| `created_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | - | - | Data de emissão do termo |
| `updated_at` | `TIMESTAMPTZ` | **NÃO** | `now()` | Atualizado via trigger | - | Data da última alteração |

### 1.2. Constraints Especiais
- **Unicidade de Garantia por Item:**
  `CREATE UNIQUE INDEX unq_warranties_item ON public.warranties(work_order_item_id) WHERE work_order_item_id IS NOT NULL;`
  Garante que o mesmo item de uma OS não possua mais de um termo de garantia ativo simultaneamente.

---

## 2. Separação Estrita: Estado Temporal Calculado vs Estado Operacional Persistido

Para evitar que o banco de dados exiba "Vigente" em um termo cujo prazo já expirou há semanas, o sistema **desacopla o relógio temporal do fluxo de trabalho**:

```
+--------------------------------------------------------------------------------------------------+
| 1. ESTADO TEMPORAL (Calculado dinamicamente com base na data corrente e data_termino)           |
|    - 'Vigente':       current_date <= data_termino E (data_termino - current_date > 30)          |
|    - 'Vencendo (30d)': current_date <= data_termino E (data_termino - current_date <= 30)         |
|    - 'Vencendo (7d)':  current_date <= data_termino E (data_termino - current_date <= 7)          |
|    - 'Vencida':        current_date > data_termino                                               |
+--------------------------------------------------------------------------------------------------+
| 2. ESTADO OPERACIONAL (Persistido no banco em status_operacional e alterado pelo atendente)      |
|    - 'normal':         Nenhum chamado de garantia em andamento                                   |
|    - 'acionada':       Cliente entrou em contato relatando problema dentro do prazo              |
|    - 'em_atendimento': Visita técnica de garantia agendada/em execução                           |
|    - 'resolvida':      Reparo ou substituição em garantia concluído                              |
|    - 'cancelada':      Termo anulado por perda de garantia (ex: mau uso constatado)               |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Prazos Canônicos de Garantia na AD Telas e Redes

| Linha de Serviço | Categoria Operacional | Prazo Típico Padrão | Cobertura Principal |
|---|---|---|---|
| **Redes de Proteção** | `rede_protecao` | **60 meses (5 anos)** | Rompimento de fios, desgaste prematuro UV, nós desfeitos |
| **Telas Mosquiteiras** | `tela_mosquiteira` | **12 a 24 meses (1 a 2 anos)** | Estrutura de alumínio, fixação, descolamento do tecido |
| **Pet Screen Reforçada** | `tela_mosquiteira` | **24 meses (2 anos)** | Resistência a unhas de pets, perfil de alta densidade |
| **Vidraçaria** | `vidracaria` | **12 meses (1 ano)** | Fixação, vedação e componentes mecânicos |
| **Manutenções / Reparos** | `manutencao` | **3 a 6 meses** | Serviços pontuais de regulagem e substituição parcial |
