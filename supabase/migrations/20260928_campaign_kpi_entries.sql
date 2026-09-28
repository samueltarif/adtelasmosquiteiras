-- Migration: Fase 7 — campaign_kpi_entries
-- Tabela ADITIVA. Não altera tabelas históricas de tracking.
-- RLS: apenas service_role (acesso exclusivo por endpoints admin server-side).

-- ============================================================
-- 1. TABELA PRINCIPAL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaign_kpi_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform         text NOT NULL,
  campaign_name    text NOT NULL,
  utm_campaign     text NULL,
  period_start     date NOT NULL,
  period_end       date NOT NULL,

  -- Dados informados pela plataforma
  planned_budget   numeric NULL,
  spend            numeric NULL,
  impressions      bigint NULL,
  clicks           bigint NULL,
  whatsapp_contacts bigint NULL,
  leads            bigint NULL,
  sales            bigint NULL,
  revenue          numeric NULL,
  notes            text NULL,

  -- Metas opcionais definidas pelo usuário
  target_ctr             numeric NULL,
  target_cpc             numeric NULL,
  target_cpl             numeric NULL,
  target_cpa             numeric NULL,
  target_roas            numeric NULL,
  target_leads           bigint NULL,
  target_sales           bigint NULL,
  target_lead_to_sale_rate numeric NULL,
  target_budget          numeric NULL,

  -- Auditoria
  created_by    uuid NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_campaign_kpi_entries_platform
  ON public.campaign_kpi_entries (platform);

CREATE INDEX IF NOT EXISTS idx_campaign_kpi_entries_utm_campaign
  ON public.campaign_kpi_entries (utm_campaign)
  WHERE utm_campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_kpi_entries_period
  ON public.campaign_kpi_entries (period_start DESC, period_end DESC);

-- ============================================================
-- 3. TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_campaign_kpi_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaign_kpi_entries_updated_at
  BEFORE UPDATE ON public.campaign_kpi_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_campaign_kpi_updated_at();

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE public.campaign_kpi_entries ENABLE ROW LEVEL SECURITY;

-- Acesso exclusivo pelo service_role (endpoints admin server-side)
CREATE POLICY "service_role_all_campaign_kpi_entries"
  ON public.campaign_kpi_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Bloquear acesso anon e authenticated explicitamente (sem policy = sem acesso)
REVOKE ALL ON public.campaign_kpi_entries FROM anon;
REVOKE ALL ON public.campaign_kpi_entries FROM authenticated;
GRANT ALL ON public.campaign_kpi_entries TO service_role;
