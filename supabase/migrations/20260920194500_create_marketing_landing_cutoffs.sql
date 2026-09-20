-- Migration: Criação da tabela de cutoffs de landing page para análise Antes x Depois
-- Arquivo: supabase/migrations/20260920194500_create_marketing_landing_cutoffs.sql

CREATE TABLE IF NOT EXISTS public.marketing_landing_cutoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_key text NOT NULL UNIQUE,
  label text NOT NULL,
  landing_path text NOT NULL,
  previous_path_prefixes text[] NOT NULL DEFAULT ARRAY['/servicos/telas'],
  comparison_cutoff_at timestamptz NOT NULL,
  landing_first_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS ativado
ALTER TABLE public.marketing_landing_cutoffs ENABLE ROW LEVEL SECURITY;

-- Permissões estritas: revoga de anon e authenticated, concede a service_role
REVOKE ALL ON TABLE public.marketing_landing_cutoffs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.marketing_landing_cutoffs TO service_role;

-- Registro seed para Telas Mosquiteiras
INSERT INTO public.marketing_landing_cutoffs (
  landing_key,
  label,
  landing_path,
  previous_path_prefixes,
  comparison_cutoff_at,
  landing_first_seen_at
) VALUES (
  'telas_mosquiteiras',
  'Nova Landing Telas Mosquiteiras',
  '/lp/telas-mosquiteiras',
  ARRAY['/servicos/telas'],
  '2026-09-20T18:51:51Z',
  '2026-09-20T14:42:57.762Z'
) ON CONFLICT (landing_key) DO UPDATE SET
  label = EXCLUDED.label,
  landing_path = EXCLUDED.landing_path,
  previous_path_prefixes = EXCLUDED.previous_path_prefixes,
  comparison_cutoff_at = EXCLUDED.comparison_cutoff_at,
  landing_first_seen_at = EXCLUDED.landing_first_seen_at,
  updated_at = now();
