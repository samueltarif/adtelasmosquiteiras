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
