-- Migration: 20260920220000_create_whatsapp_attributions.sql
-- Descrição: Criação da tabela public.whatsapp_attributions e RPC atômica create_whatsapp_click_attribution_atomic
-- Fase: 1.1 Parte 3A — Atribuição WhatsApp -> Cliente

-- 1. Criar Tabela public.whatsapp_attributions
CREATE TABLE IF NOT EXISTS public.whatsapp_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(10) NOT NULL UNIQUE,
    lead_click_id UUID NULL UNIQUE REFERENCES public.lead_clicks(id) ON DELETE SET NULL,
    visitor_id TEXT NULL,
    session_id TEXT NULL,

    -- Snapshot de Marketing para Resiliência (preserva origem mesmo após expurgo de lead_clicks)
    clicked_at TIMESTAMPTZ NOT NULL,
    gclid TEXT NULL,
    gbraid TEXT NULL,
    wbraid TEXT NULL,
    google_campaign_id TEXT NULL,
    google_adgroup_id TEXT NULL,
    google_creative_id TEXT NULL,
    campaign_name TEXT NULL,
    utm_term TEXT NULL,
    landing_path TEXT NULL,
    cta_location VARCHAR(100) NULL,

    -- Vínculos com CRM
    client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id UUID NULL REFERENCES public.leads(id) ON DELETE SET NULL,

    -- Status e Confiabilidade da Atribuição
    attribution_status TEXT NOT NULL DEFAULT 'unassigned',
    confidence_level TEXT NOT NULL DEFAULT 'unassigned',
    match_method TEXT NULL,

    -- Auditoria
    assigned_by UUID NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NULL,
    dismissed_by UUID NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
    dismissed_at TIMESTAMPTZ NULL,
    notes TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_whatsapp_attributions_short_code 
        CHECK (short_code ~ '^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$'),
    CONSTRAINT chk_whatsapp_attributions_status 
        CHECK (attribution_status IN ('unassigned', 'assigned', 'dismissed', 'expired')),
    CONSTRAINT chk_whatsapp_attributions_confidence 
        CHECK (confidence_level IN ('confirmed', 'probable', 'unassigned')),
    CONSTRAINT chk_whatsapp_attributions_match_method 
        CHECK (match_method IS NULL OR match_method IN ('exact_code', 'manual_selection')),
    
    -- Consistência de Status: assigned exige cliente/lead, auditoria e método
    CONSTRAINT chk_whatsapp_attributions_assigned_consistency
        CHECK (
            (attribution_status = 'assigned' AND (client_id IS NOT NULL OR lead_id IS NOT NULL) AND assigned_by IS NOT NULL AND assigned_at IS NOT NULL AND match_method IS NOT NULL AND confidence_level IN ('confirmed', 'probable')) OR
            (attribution_status = 'dismissed' AND dismissed_by IS NOT NULL AND dismissed_at IS NOT NULL) OR
            (attribution_status = 'unassigned' AND assigned_by IS NULL AND assigned_at IS NULL AND client_id IS NULL AND lead_id IS NULL) OR
            (attribution_status = 'expired')
        )
);

-- 2. Índices Justificados (o índice único em short_code já é gerado pela UNIQUE constraint)

CREATE INDEX IF NOT EXISTS idx_whatsapp_attributions_unassigned 
    ON public.whatsapp_attributions (clicked_at DESC) 
    WHERE attribution_status = 'unassigned';

CREATE INDEX IF NOT EXISTS idx_whatsapp_attributions_client 
    ON public.whatsapp_attributions (client_id) 
    WHERE client_id IS NOT NULL;

-- 3. Configuração de RLS
ALTER TABLE public.whatsapp_attributions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.whatsapp_attributions FROM anon, authenticated;
GRANT ALL ON TABLE public.whatsapp_attributions TO service_role;

-- 4. RPC Atômica para Criação Consistente de Clique e Atribuição
CREATE OR REPLACE FUNCTION public.create_whatsapp_click_attribution_atomic(
    p_event_id VARCHAR,
    p_short_code VARCHAR,
    p_visitor_id VARCHAR,
    p_session_id VARCHAR,
    p_origem VARCHAR,
    p_cta_location VARCHAR,
    p_service_key VARCHAR,
    p_service_name TEXT,
    p_landing_path TEXT,
    p_device_type VARCHAR,
    p_google_device TEXT,
    p_is_bot BOOLEAN,
    p_bot_name VARCHAR,
    p_user_agent TEXT,
    p_ip_hash VARCHAR,
    p_channel TEXT,
    p_utm_source TEXT,
    p_utm_medium TEXT,
    p_utm_campaign TEXT,
    p_utm_content TEXT,
    p_utm_term TEXT,
    p_google_campaign_id TEXT,
    p_google_adgroup_id TEXT,
    p_google_creative_id TEXT,
    p_google_match_type TEXT,
    p_google_network TEXT,
    p_google_target_id TEXT,
    p_gclid TEXT,
    p_gbraid TEXT,
    p_wbraid TEXT,
    p_referrer TEXT,
    p_clicked_at TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_short_code VARCHAR(10);
    v_lead_click_id UUID;
    v_attribution_id UUID;
    v_existing_lead_click_id UUID;
    v_existing_attr RECORD;
BEGIN
    -- 1. Sanitizar e validar short_code de 8 caracteres
    v_short_code := upper(trim(COALESCE(p_short_code, '')));
    IF v_short_code !~ '^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$' THEN
        RAISE EXCEPTION 'ERR_INVALID_SHORT_CODE: Short code deve conter exatamente 8 caracteres do alfabeto permitido.';
    END IF;

    -- 2. Idempotência estrita por event_id
    IF p_event_id IS NOT NULL AND length(trim(p_event_id)) > 0 THEN
        SELECT id INTO v_existing_lead_click_id
        FROM public.lead_clicks
        WHERE event_id = p_event_id
        LIMIT 1;

        IF v_existing_lead_click_id IS NOT NULL THEN
            SELECT id, short_code, attribution_status INTO v_existing_attr
            FROM public.whatsapp_attributions
            WHERE lead_click_id = v_existing_lead_click_id
            LIMIT 1;

            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'lead_click_id', v_existing_lead_click_id,
                'attribution_id', v_existing_attr.id,
                'short_code', v_existing_attr.short_code,
                'status', v_existing_attr.attribution_status
            );
        END IF;
    END IF;

    -- 3. Proteção contra colisão real de short_code
    IF EXISTS (SELECT 1 FROM public.whatsapp_attributions WHERE short_code = v_short_code) THEN
        RAISE EXCEPTION 'ERR_SHORT_CODE_COLLISION: Short code já existente no banco de dados.';
    END IF;

    -- 4. Inserção do lead_click na mesma transação
    INSERT INTO public.lead_clicks (
        event_id, visitor_id, session_id, tipo, origem, url_origem,
        cta_location, service_key, service_name, landing_path,
        device_type, google_device, is_bot, bot_name, user_agent, ip_hash,
        channel, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        google_campaign_id, google_adgroup_id, google_creative_id,
        google_match_type, google_network, google_target_id,
        gclid, gbraid, wbraid, referrer, created_at
    ) VALUES (
        p_event_id, p_visitor_id, p_session_id, 'whatsapp', 
        COALESCE(p_origem, 'Home (/)'), COALESCE(p_origem, 'Home (/)'),
        p_cta_location, p_service_key, p_service_name, 
        COALESCE(p_landing_path, p_origem, 'Home (/)'),
        p_device_type, p_google_device, COALESCE(p_is_bot, false), p_bot_name, 
        p_user_agent, p_ip_hash,
        p_channel, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term,
        p_google_campaign_id, p_google_adgroup_id, p_google_creative_id,
        p_google_match_type, p_google_network, p_google_target_id,
        p_gclid, p_gbraid, p_wbraid, p_referrer, 
        COALESCE(p_clicked_at, now())
    ) RETURNING id INTO v_lead_click_id;

    -- 5. Inserção da atribuição atômica
    INSERT INTO public.whatsapp_attributions (
        short_code,
        lead_click_id,
        visitor_id,
        session_id,
        clicked_at,
        gclid,
        gbraid,
        wbraid,
        google_campaign_id,
        google_adgroup_id,
        google_creative_id,
        campaign_name,
        utm_term,
        landing_path,
        cta_location,
        attribution_status,
        confidence_level
    ) VALUES (
        v_short_code,
        v_lead_click_id,
        p_visitor_id,
        p_session_id,
        COALESCE(p_clicked_at, now()),
        p_gclid,
        p_gbraid,
        p_wbraid,
        p_google_campaign_id,
        p_google_adgroup_id,
        p_google_creative_id,
        COALESCE(p_utm_campaign, 'Google Ads'),
        p_utm_term,
        COALESCE(p_landing_path, p_origem, '/'),
        p_cta_location,
        'unassigned',
        'unassigned'
    ) RETURNING id INTO v_attribution_id;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'lead_click_id', v_lead_click_id,
        'attribution_id', v_attribution_id,
        'short_code', v_short_code,
        'status', 'unassigned'
    );
END;
$$;

-- Revogar execução pública da RPC e conceder a service_role
REVOKE ALL ON FUNCTION public.create_whatsapp_click_attribution_atomic FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_whatsapp_click_attribution_atomic TO service_role;
