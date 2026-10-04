-- Migration: 20261004193000_lead_crm_status_and_activity_log.sql
-- Description: Allow crm_activity_log for leads, support not_required email status, add lead_id index on whatsapp_attributions

-- 1. Permitir client_id NULL em crm_activity_log para suportar logs de entidades sem client vinculado (como leads)
ALTER TABLE public.crm_activity_log ALTER COLUMN client_id DROP NOT NULL;

-- 2. Atualizar chk_activity_log_entity para aceitar 'lead'
ALTER TABLE public.crm_activity_log DROP CONSTRAINT IF EXISTS chk_activity_log_entity;
ALTER TABLE public.crm_activity_log ADD CONSTRAINT chk_activity_log_entity 
  CHECK (entity_type = ANY (ARRAY['lead'::varchar, 'client'::varchar, 'address'::varchar, 'work_order'::varchar, 'work_order_item'::varchar, 'appointment'::varchar, 'payment'::varchar, 'warranty'::varchar, 'media'::varchar, 'note'::varchar, 'proposal'::varchar]));

-- 3. Atualizar chk_activity_log_acao para aceitar 'lead_status_changed'
ALTER TABLE public.crm_activity_log DROP CONSTRAINT IF EXISTS chk_activity_log_acao;
ALTER TABLE public.crm_activity_log ADD CONSTRAINT chk_activity_log_acao 
  CHECK (acao = ANY (ARRAY['lead_status_changed'::varchar, 'client_created'::varchar, 'converted_from_lead'::varchar, 'client_updated'::varchar, 'client_archived'::varchar, 'address_created'::varchar, 'address_updated'::varchar, 'address_deleted'::varchar, 'work_order_created'::varchar, 'work_order_status_changed'::varchar, 'work_order_completed'::varchar, 'work_order_cancelled'::varchar, 'payment_received'::varchar, 'payment_cancelled'::varchar, 'appointment_created'::varchar, 'appointment_rescheduled'::varchar, 'appointment_cancelled'::varchar, 'warranty_issued'::varchar, 'warranty_triggered'::varchar, 'warranty_resolved'::varchar, 'media_uploaded'::varchar, 'media_removed'::varchar, 'note_added'::varchar, 'proposal_issued'::varchar, 'proposal_accepted'::varchar, 'proposal_superseded'::varchar, 'appointment_status_changed'::varchar, 'appointment_updated'::varchar]));

-- 4. Atualizar chk_leads_notification_email_status para incluir 'not_required'
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS chk_leads_notification_email_status;
ALTER TABLE public.leads ADD CONSTRAINT chk_leads_notification_email_status 
  CHECK (notification_email_status = ANY (ARRAY['pending'::varchar, 'sending'::varchar, 'sent'::varchar, 'failed'::varchar, 'not_required'::varchar]));

-- 5. Indice de performance para consultas de historico WhatsApp por lead
CREATE INDEX IF NOT EXISTS idx_whatsapp_attributions_lead_id ON public.whatsapp_attributions(lead_id) WHERE lead_id IS NOT NULL;

-- 6. Indice composto para paginacao e ordenacao de leads por origem
CREATE INDEX IF NOT EXISTS idx_leads_origem_created_at ON public.leads(origem, created_at DESC);
