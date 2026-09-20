-- Migration: Criação da tabela marketing_change_log para auditoria de alterações de campanha
-- Arquivo: supabase/migrations/20260920202000_create_marketing_change_log.sql

CREATE TABLE IF NOT EXISTS public.marketing_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL,
  change_type text NOT NULL CHECK (change_type IN (
    'landing_page', 'ad_copy', 'keyword', 'negative_keyword',
    'budget', 'bid', 'tracking', 'url_suffix', 'conversion',
    'asset', 'sitelink', 'campaign_setting', 'other'
  )),
  scope text NOT NULL CHECK (scope IN ('campaign', 'landing', 'tracking', 'account')),
  entry_source text NOT NULL DEFAULT 'manual' CHECK (entry_source IN ('manual', 'system', 'migration')),
  title text NOT NULL,
  description text,
  campaign_name text,
  google_campaign_id text,
  landing_path text,
  previous_value jsonb,
  new_value jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_by_email_snapshot text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  archived_at timestamptz,
  archived_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices essenciais justificados
CREATE INDEX IF NOT EXISTS idx_marketing_change_log_occurred_at ON public.marketing_change_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_change_log_campaign ON public.marketing_change_log (google_campaign_id) WHERE google_campaign_id IS NOT NULL;

-- RLS
ALTER TABLE public.marketing_change_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.marketing_change_log FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.marketing_change_log TO service_role;

-- Seed inicial comprovado (apenas o primeiro tráfego Google Ads confirmado na nova landing)
INSERT INTO public.marketing_change_log (
  occurred_at,
  change_type,
  scope,
  entry_source,
  title,
  description,
  campaign_name,
  google_campaign_id,
  landing_path,
  previous_value,
  new_value,
  metadata
)
SELECT
  '2026-09-20T18:51:51Z'::timestamptz,
  'landing_page',
  'landing',
  'migration',
  'Nova landing de Telas Mosquiteiras ativada no Google Ads',
  'Ativação da nova experiência dedicada com formulário sob medida e tracking de 4 CTAs.',
  'AD Telas | Pesquisa | Leads | SP',
  '24258184938',
  '/lp/telas-mosquiteiras',
  '{"landing_path": "/servicos/telas"}'::jsonb,
  '{"landing_path": "/lp/telas-mosquiteiras"}'::jsonb,
  '{"evidence": "first_confirmed_google_ads_visit"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.marketing_change_log WHERE occurred_at = '2026-09-20T18:51:51Z'::timestamptz AND change_type = 'landing_page'
);
