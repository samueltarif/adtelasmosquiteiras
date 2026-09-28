-- Migration: 20260927230000_tiktok_schema_additive.sql
-- Descrição: Suporte aditivo TikTok (ttclid e metadados) em public.whatsapp_attributions, lead_clicks, page_views e leads.
-- ZERO DROP/RENAME/TYPE CHANGE. Sem backfill, sem NOT NULL e sem defaults que alterem dados históricos.

-- 1. Colunas aditivas em public.whatsapp_attributions
ALTER TABLE public.whatsapp_attributions ADD COLUMN IF NOT EXISTS ttclid TEXT NULL;
ALTER TABLE public.whatsapp_attributions ADD COLUMN IF NOT EXISTS tiktok_campaign_id TEXT NULL;
ALTER TABLE public.whatsapp_attributions ADD COLUMN IF NOT EXISTS tiktok_adgroup_id TEXT NULL;
ALTER TABLE public.whatsapp_attributions ADD COLUMN IF NOT EXISTS tiktok_ad_id TEXT NULL;
ALTER TABLE public.whatsapp_attributions ADD COLUMN IF NOT EXISTS tiktok_creative_id TEXT NULL;
ALTER TABLE public.whatsapp_attributions ADD COLUMN IF NOT EXISTS tiktok_placement TEXT NULL;

-- 2. Colunas aditivas em public.lead_clicks
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS ttclid TEXT NULL;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS tiktok_campaign_id TEXT NULL;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS tiktok_adgroup_id TEXT NULL;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS tiktok_ad_id TEXT NULL;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS tiktok_creative_id TEXT NULL;
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS tiktok_placement TEXT NULL;

-- 3. Colunas aditivas em public.page_views
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS ttclid TEXT NULL;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS tiktok_campaign_id TEXT NULL;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS tiktok_adgroup_id TEXT NULL;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS tiktok_ad_id TEXT NULL;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS tiktok_creative_id TEXT NULL;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS tiktok_placement TEXT NULL;

-- 4. Colunas aditivas em public.leads (inclusive first_touch_ttclid para snapshot atômico First Touch)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ttclid TEXT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touch_ttclid TEXT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tiktok_campaign_id TEXT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tiktok_adgroup_id TEXT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tiktok_ad_id TEXT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tiktok_creative_id TEXT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tiktok_placement TEXT NULL;
