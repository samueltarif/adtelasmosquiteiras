-- Migration: 20261006133000_funnel_and_pipeline_leads_fields.sql
-- Description: Campos adicionais para o funil multi-etapas e pipeline CRM na tabela public.leads
-- Natureza: 100% Aditiva, compatível com leads existentes e sem downtime

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS need_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS quantity_range VARCHAR(50),
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS installation_timeline VARCHAR(50),
  ADD COLUMN IF NOT EXISTS has_photos BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50) DEFAULT 'NOVO',
  ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON public.leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_landing_path ON public.leads(landing_path);
