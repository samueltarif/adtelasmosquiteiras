# IMPLEMENTATION PLAN — LEAD EMAIL DELIVERY HARDENING & DURABILITY

**Projeto:** AD Telas e Redes (`https://www.adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** Lead Email Delivery Hardening & Durability  
**Status:** `READY_FOR_HUMAN_SQL_REVIEW`  
**Ação Manual no Supabase:** `MANUAL_SUPABASE_ACTION_REQUIRED = YES`  
**Execução de SQL:** `SQL_006_EXECUTED = NO` | `SUPABASE_MCP_WRITES = 0`  

---

## 1. Revisão Forense de Durabilidade (`EMAIL_DELIVERY_DURABILITY_REVIEW`)

### 1.1. Contexto de Execução Serverless (Vercel)
Em ambientes serverless como a Vercel, o ciclo de vida das instâncias do runtime Nitro/Node é efêmero. Mecanismos em memória local (`Map`, `Set`, LRU cache ou variáveis globais de processo) **não são autoritativos** entre invocações concorrentes ou após cold starts.

A **única fonte durável e autoritativa da verdade** para o estado do lead e da entrega de e-mail é a base de dados **PostgreSQL (Supabase)**.

---

### 1.2. Semântica Formal de Entrega: `SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE`
- **Definição da Fase Atual:** Como **não** será implementado nenhum worker, fila ou cron de retry automático nesta fase, a semântica formal do envio de e-mail é estritamente:
  `EMAIL_DELIVERY_SEMANTICS = SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE`
- **Ciclo de Vida da Notificação:**
  1. Cada novo lead submetido dispara exatamente **uma tentativa síncrona de envio SMTP**.
  2. **Sucesso SMTP** ➔ `notification_email_status` é atualizado para `'sent'` com `notification_email_sent_at = now()`.
  3. **Falha SMTP** ➔ `notification_email_status` é atualizado para `'failed'` com `notification_email_attempts = 1`, `notification_email_last_attempt_at = now()` e mensagem sanitizada em `notification_email_last_error`.
  4. **Queda do processo antes do SMTP** ➔ O registro permanece no banco com `notification_email_status = 'pending'`.
  5. **Queda durante o envio** ➔ O status permanece `'pending'` ou `'sending'`.
  6. **Evolução Futura:** Quando futuramente for implementado um reprocessador controlado para registros `pending`/`failed`, a semântica poderá evoluir para `AT_LEAST_ONCE_WITH_DUPLICATE_MITIGATION`.

---

### 1.3. Modelo de Estado Durável no Banco de Dados (`public.leads`)

Para persistir o ciclo de vida da entrega com integridade estrita, são adicionadas as seguintes colunas e CHECK constraints em `public.leads` via [`supabase/manual/006_lead_email_delivery_state.sql`](file:///d:/sicons/ADT/supabase/manual/006_lead_email_delivery_state.sql):

| Coluna | Tipo | Constraint / Default | Descrição |
|---|---|---|---|
| `notification_email_status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` + `CHECK (status IN ('pending', 'sending', 'sent', 'failed'))` | Estado estrito do ciclo de vida |
| `notification_email_sent_at` | `TIMESTAMPTZ` | `NULL` | Data/hora exata em que o Gmail SMTP aceitou a mensagem |
| `notification_email_attempts` | `INT` | `NOT NULL DEFAULT 0` + `CHECK (attempts >= 0)` | Contador de tentativas de entrega realizadas |
| `notification_email_last_attempt_at` | `TIMESTAMPTZ` | `NULL` | Data/hora da última tentativa executada |
| `notification_email_last_error` | `TEXT` | `NULL` | Mensagem de erro sanitizada (sem credenciais ou secrets) |

---

### 1.4. Análise Rigorosa de Concorrência e Falhas

| Cenário de Concorrência / Falha | Comportamento do Sistema | Garantia de Integridade |
|---|---|---|
| **A. Dois POST simultâneos com mesmo `submission_id`** | O primeiro request executa `INSERT` com sucesso no Supabase. O segundo request recebe violação da restrição `unq_leads_submission_id` (código Postgres 23505 / HTTP 409). | **Apenas 1 lead é criado no banco.** |
| **B. Execução do envio de e-mail** | Apenas a requisição que obteve sucesso na criação do registro no banco prossegue para o bloco de envio SMTP. O request concorrente recebe resposta idempotente `{ success: true, idempotent: true }` e **NÃO dispara e-mail**. | **Double-click não gera e-mails duplicados.** |
| **C. Falha de rede / erro do SMTP Gmail** | O `INSERT` do lead já foi confirmado no banco. O bloco `catch` do envio captura o erro, sanitiza a mensagem e atualiza o lead para `notification_email_status = 'failed'`, incrementando `attempts = 1`. A API responde `{ success: true, leadSaved: true, emailSent: false }`. | **O lead NUNCA é perdido.** O visitante navega com sucesso para `/obrigado`. |
| **D. Queda do processo antes do SMTP** | O lead foi gravado com `notification_email_status = 'pending'`. O registro permanece identificável no banco para auditoria. | **Lead preservado.** |
| **E. Queda do processo durante / após aceitação pelo Gmail antes do `UPDATE sent`** | O Gmail entrega a mensagem ao destinatário, mas a instância serverless é terminada antes de persistir `'sent'`. O status permanece `'pending'` ou `'sending'`. | **Lead preservado no banco e notificação entregue.** |

---

## 2. Script SQL de Migração (`supabase/manual/006_lead_email_delivery_state.sql`)

```sql
-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE VIA MCP)
-- ======================================================================
-- Projeto: AD Telas e Redes — https://www.adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/006_lead_email_delivery_state.sql
-- Fase: Lead Email Delivery Hardening — Estado Durável de Notificação
-- Finalidade: Adicionar colunas duráveis e CHECK constraints para rastreamento de envio de e-mail na tabela public.leads.
--
-- REGRAS E SEGURANÇA:
-- 1. Cria colunas com tipos rígidos e CHECK constraints (status válidos e tentativas >= 0).
-- 2. Preserva 100% dos dados existentes, constraints, RLS policies, triggers e índices.
-- 3. Não afeta auth.users, storage, páginas públicas ou analytics.
-- 4. Status de execução: FINAL_REVIEW_NOT_EXECUTED (Aguardando execução manual do operador).
-- ======================================================================

-- ======================================================================
-- 1. PRE-CHECK — VERIFICAÇÃO DE SEGURANÇA DAS COLUNAS ATUAIS
-- ======================================================================
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'leads'
ORDER BY ordinal_position;


-- ======================================================================
-- 2. MIGRATION TRANSACTIONAL (BEGIN ... COMMIT)
-- ======================================================================
BEGIN;

-- A. Status do envio da notificação por e-mail (NOT NULL, padrão 'pending')
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS notification_email_status VARCHAR(20) NOT NULL DEFAULT 'pending';

-- B. Timestamp de entrega confirmada pelo servidor SMTP
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS notification_email_sent_at TIMESTAMP WITH TIME ZONE;

-- C. Contador de tentativas de envio executadas (NOT NULL, padrão 0)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS notification_email_attempts INT NOT NULL DEFAULT 0;

-- D. Timestamp da última tentativa realizada
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS notification_email_last_attempt_at TIMESTAMP WITH TIME ZONE;

-- E. Mensagem sanitizada do último erro de entrega (sem credenciais ou secrets)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS notification_email_last_error TEXT;

-- F. CHECK constraint garantindo exclusivamente os 4 estados permitidos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'chk_leads_notification_email_status'
          AND conrelid = 'public.leads'::regclass
    ) THEN
        ALTER TABLE public.leads 
        ADD CONSTRAINT chk_leads_notification_email_status 
        CHECK (notification_email_status IN ('pending', 'sending', 'sent', 'failed'));
    END IF;
END $$;

-- G. CHECK constraint impedindo valores negativos no contador de tentativas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'chk_leads_notification_email_attempts'
          AND conrelid = 'public.leads'::regclass
    ) THEN
        ALTER TABLE public.leads 
        ADD CONSTRAINT chk_leads_notification_email_attempts 
        CHECK (notification_email_attempts >= 0);
    END IF;
END $$;

-- H. Índice para consultas eficientes de status de notificação e auditoria
CREATE INDEX IF NOT EXISTS idx_leads_notification_email_status 
ON public.leads(notification_email_status);

COMMIT;


-- ======================================================================
-- 3. POST-CHECK — VERIFICAÇÃO DE INTEGRIDADE PÓS-MIGRATION
-- ======================================================================
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'leads'
  AND column_name LIKE 'notification_email_%'
ORDER BY ordinal_position;

SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
  AND c.conrelid = 'public.leads'::regclass
  AND c.conname IN ('chk_leads_notification_email_status', 'chk_leads_notification_email_attempts')
ORDER BY c.conname;

SELECT 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'leads'
  AND indexname = 'idx_leads_notification_email_status';


-- ======================================================================
-- 4. ROLLBACK SIMÉTRICO COMPLETO (EXECUTAR APENAS SE NECESSÁRIO)
-- ======================================================================
/*
BEGIN;

DROP INDEX IF EXISTS public.idx_leads_notification_email_status;

ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS chk_leads_notification_email_status;

ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS chk_leads_notification_email_attempts;

ALTER TABLE public.leads 
  DROP COLUMN IF EXISTS notification_email_status,
  DROP COLUMN IF EXISTS notification_email_sent_at,
  DROP COLUMN IF EXISTS notification_email_attempts,
  DROP COLUMN IF EXISTS notification_email_last_attempt_at,
  DROP COLUMN IF EXISTS notification_email_last_error;

COMMIT;
*/
```

---

## 3. Formato do E-mail e Sanitização de Erros

### 3.1. Assunto e Corpo
- **Assunto:** `Novo orçamento pelo site — {servico}` (ou `Novo lead pelo site — AD Telas e Redes`)
- **Corpo HTML & Texto:**
  - Dados completos do lead (Nome, Telefone, E-mail, Cidade, Bairro, Serviço, Mensagem, Origem, Data/Hora em SP).
  - Link/Botão de atendimento rápido via WhatsApp: `https://wa.me/55{telefone_limpo}`.
  - Atribuição comercial (Canal de sessão, First Touch, Landing Page, Conversion Page, UTMs).
  - Identificadores técnicos discretos (`submission_id`, `visitor_id`, `session_id`).

### 3.2. Função de Sanitização de Erros (`sanitizeEmailError`)
Garante que qualquer erro capturado pelo Nodemailer remova credenciais, senhas ou tokens antes de ser registrado no banco:
```typescript
export function sanitizeEmailError(err: any): string {
  if (!err) return 'Erro desconhecido'
  let msg = typeof err === 'string' ? err : (err.message || String(err))
  // Remove potenciais senhas de app, tokens e secrets
  msg = msg.replace(/[a-z]{16}/gi, '***')
  msg = msg.replace(/(password|pass|secret|key)=([^&\s]+)/gi, '$1=***')
  return msg.slice(0, 500)
}
```

---

## 4. Plano de Testes & Validação Automatizada (`test-lead-email.mjs`)

Serão executados testes unitários isolados com mocks locais:
1. **Formulário Válido:** 1 lead salvo (`notification_email_status = 'sent'`), 1 envio SMTP.
2. **Double Click / Concorrência:** 2 POSTs com mesmo `submission_id` ➔ 1 lead salvo, 1 e-mail disparado, 1 resposta idempotente sem envio duplicado.
3. **Falha de SMTP:** Supabase grava lead com sucesso ➔ SMTP lança erro ➔ status atualizado para `'failed'` com mensagem sanitizada ➔ resposta da API retorna `{ success: true, leadSaved: true, emailSent: false }` sem perda de dados.
4. **Campos Nulos / Opcionais:** E-mail e mensagem opcionais tratados sem erros.
5. **Formatação de Telefone:** Link `wa.me/55...` gerado perfeitamente.
6. **Caracteres UTF-8:** Acentuação (`São Paulo`, `Orçamento`, `Telas Mosquiteiras Removíveis`) preservada.
7. **Regressão de Build & Testes:** `npx nuxi build`, `test-admin-v2.mjs`, `test-phase-a.mjs`, `seo-validate-03c.mjs`.
