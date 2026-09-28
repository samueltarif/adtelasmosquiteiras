-- ==============================================================================
-- MIGRATION: 20260927220000_harden_whatsapp_rpc_v2_concurrency.sql
-- OBJETIVO: Hardening de concorrência atômica da RPC v2 com ON CONFLICT (event_id)
-- e proteção estrita contra colisão simultânea de short_code.
-- Assinatura e tipos rigorosamente idênticos à versão criada na Fase 2.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_whatsapp_click_attribution_atomic_v2(
    p_event_id character varying, p_short_code character varying, p_visitor_id character varying,
    p_session_id character varying, p_origem character varying, p_cta_location character varying,
    p_service_key character varying, p_service_name text, p_landing_path text,
    p_device_type character varying, p_google_device text, p_is_bot boolean, p_bot_name character varying,
    p_user_agent text, p_ip_hash character varying, p_channel text,
    p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_content text, p_utm_term text,
    p_google_campaign_id text, p_google_adgroup_id text, p_google_creative_id text,
    p_google_match_type text, p_google_network text, p_google_target_id text,
    p_gclid text, p_gbraid text, p_wbraid text, p_referrer text,
    p_clicked_at timestamp with time zone DEFAULT now(),
    p_fbclid text DEFAULT NULL, p_msclkid text DEFAULT NULL,
    p_meta_campaign_id text DEFAULT NULL, p_meta_adset_id text DEFAULT NULL,
    p_meta_ad_id text DEFAULT NULL, p_meta_placement text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_short_code VARCHAR(10);
    v_lead_click_id UUID;
    v_attribution_id UUID;
    v_existing_lead_click_id UUID;
    v_existing_attr RECORD;
    v_campaign_name TEXT;
    v_clean_channel TEXT;
    v_constraint_name TEXT;
BEGIN
    -- 1. Sanitizar e validar short_code de 8 caracteres
    v_short_code := upper(trim(COALESCE(p_short_code, '')));
    IF v_short_code !~ '^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$' THEN
        RAISE EXCEPTION 'ERR_INVALID_SHORT_CODE: Short code deve conter exatamente 8 caracteres do alfabeto permitido.';
    END IF;

    -- 2. Fast-path: idempotência sequencial por event_id
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

            IF v_existing_attr.id IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'success', true,
                    'idempotent', true,
                    'lead_click_id', v_existing_lead_click_id,
                    'attribution_id', v_existing_attr.id,
                    'short_code', v_existing_attr.short_code,
                    'status', v_existing_attr.attribution_status
                );
            ELSE
                RAISE EXCEPTION 'ERR_IDEMPOTENCY_INCONSISTENT_STATE: Lead click encontrado mas whatsapp_attribution correspondente ausente.';
            END IF;
        END IF;
    END IF;

    -- 3. Proteção prévia contra colisão de short_code
    IF EXISTS (SELECT 1 FROM public.whatsapp_attributions WHERE short_code = v_short_code) THEN
        RAISE EXCEPTION 'ERR_SHORT_CODE_COLLISION: Short code já existente no banco de dados.';
    END IF;

    -- 4. Definir canal e nome de campanha contextual
    v_clean_channel := COALESCE(NULLIF(trim(p_channel), ''), 'direct');
    IF p_utm_campaign IS NOT NULL AND length(trim(p_utm_campaign)) > 0 THEN
        v_campaign_name := trim(p_utm_campaign);
    ELSIF v_clean_channel = 'google_ads' OR p_gclid IS NOT NULL OR p_gbraid IS NOT NULL OR p_wbraid IS NOT NULL THEN
        v_campaign_name := 'Google Ads';
    ELSIF v_clean_channel = 'instagram_ads' THEN
        v_campaign_name := 'Instagram Ads';
    ELSIF v_clean_channel = 'facebook_ads' THEN
        v_campaign_name := 'Facebook Ads';
    ELSIF v_clean_channel = 'meta_ads' THEN
        v_campaign_name := 'Meta Ads';
    ELSIF v_clean_channel = 'microsoft_ads' OR p_msclkid IS NOT NULL THEN
        v_campaign_name := 'Microsoft Ads';
    ELSIF v_clean_channel = 'instagram_organic' THEN
        v_campaign_name := 'Instagram (Orgânico)';
    ELSIF v_clean_channel = 'facebook_organic' THEN
        v_campaign_name := 'Facebook (Orgânico)';
    ELSIF v_clean_channel = 'google_organic' THEN
        v_campaign_name := 'Google (Orgânico)';
    ELSIF v_clean_channel = 'direct' THEN
        v_campaign_name := 'Direto';
    ELSIF v_clean_channel = 'referral' THEN
        v_campaign_name := 'Referral';
    ELSIF v_clean_channel = 'other_paid' THEN
        v_campaign_name := 'Outro Pago';
    ELSE
        v_campaign_name := NULL;
    END IF;

    -- 5. Inserção atômica de lead_click com ON CONFLICT (barreira definitiva de concorrência)
    INSERT INTO public.lead_clicks (
        event_id, visitor_id, session_id, tipo, origem, url_origem,
        cta_location, service_key, service_name, landing_path,
        device_type, google_device, is_bot, bot_name, user_agent, ip_hash,
        channel, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        google_campaign_id, google_adgroup_id, google_creative_id,
        google_match_type, google_network, google_target_id,
        gclid, gbraid, wbraid, fbclid, msclkid,
        meta_campaign_id, meta_adset_id, meta_ad_id, meta_placement,
        referrer, created_at
    ) VALUES (
        p_event_id, p_visitor_id, p_session_id, 'whatsapp',
        COALESCE(p_origem, 'Home (/)'), COALESCE(p_origem, 'Home (/)'),
        p_cta_location, p_service_key, p_service_name,
        COALESCE(p_landing_path, p_origem, 'Home (/)'),
        p_device_type, p_google_device, COALESCE(p_is_bot, false), p_bot_name,
        p_user_agent, p_ip_hash,
        v_clean_channel, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term,
        p_google_campaign_id, p_google_adgroup_id, p_google_creative_id,
        p_google_match_type, p_google_network, p_google_target_id,
        p_gclid, p_gbraid, p_wbraid, p_fbclid, p_msclkid,
        p_meta_campaign_id, p_meta_adset_id, p_meta_ad_id, p_meta_placement,
        p_referrer, COALESCE(p_clicked_at, now())
    )
    ON CONFLICT (event_id) WHERE (event_id IS NOT NULL) DO NOTHING
    RETURNING id INTO v_lead_click_id;

    -- 6. Resolução de concorrência simultânea por event_id
    IF v_lead_click_id IS NULL THEN
        SELECT id INTO v_existing_lead_click_id 
        FROM public.lead_clicks 
        WHERE event_id = p_event_id 
        LIMIT 1;

        IF v_existing_lead_click_id IS NOT NULL THEN
            SELECT id, short_code, attribution_status INTO v_existing_attr
            FROM public.whatsapp_attributions 
            WHERE lead_click_id = v_existing_lead_click_id 
            LIMIT 1;

            IF v_existing_attr.id IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'success', true,
                    'idempotent', true,
                    'lead_click_id', v_existing_lead_click_id,
                    'attribution_id', v_existing_attr.id,
                    'short_code', v_existing_attr.short_code,
                    'status', v_existing_attr.attribution_status
                );
            ELSE
                RAISE EXCEPTION 'ERR_IDEMPOTENCY_INCONSISTENT_STATE: Lead click encontrado mas whatsapp_attribution correspondente ausente.';
            END IF;
        ELSE
            RAISE EXCEPTION 'ERR_IDEMPOTENCY_INCONSISTENT_STATE: Conflito detectado mas lead_click vencedor não localizado.';
        END IF;
    END IF;

    -- 7. Inserção da atribuição com tratamento estrito de colisão concorrente de short_code
    BEGIN
        INSERT INTO public.whatsapp_attributions (
            short_code, lead_click_id, visitor_id, session_id, clicked_at,
            channel, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
            gclid, gbraid, wbraid, fbclid,
            meta_campaign_id, meta_adset_id, meta_ad_id, meta_placement,
            google_campaign_id, google_adgroup_id, google_creative_id,
            campaign_name, landing_path, cta_location,
            attribution_status, confidence_level
        ) VALUES (
            v_short_code, v_lead_click_id, p_visitor_id, p_session_id, COALESCE(p_clicked_at, now()),
            v_clean_channel, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term,
            p_gclid, p_gbraid, p_wbraid, p_fbclid,
            p_meta_campaign_id, p_meta_adset_id, p_meta_ad_id, p_meta_placement,
            p_google_campaign_id, p_google_adgroup_id, p_google_creative_id,
            v_campaign_name, COALESCE(p_landing_path, p_origem, '/'), p_cta_location,
            'unassigned', 'unassigned'
        ) RETURNING id INTO v_attribution_id;
    EXCEPTION
        WHEN unique_violation THEN
            GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
            IF v_constraint_name = 'whatsapp_attributions_short_code_key' THEN
                RAISE EXCEPTION 'ERR_SHORT_CODE_COLLISION: Short code já existente no banco de dados.';
            ELSE
                RAISE;
            END IF;
    END;

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

-- Permissões de Segurança
REVOKE ALL ON FUNCTION public.create_whatsapp_click_attribution_atomic_v2(character varying, character varying, character varying, character varying, character varying, character varying, character varying, text, text, character varying, text, boolean, character varying, text, character varying, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, timestamp with time zone, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_whatsapp_click_attribution_atomic_v2(character varying, character varying, character varying, character varying, character varying, character varying, character varying, text, text, character varying, text, boolean, character varying, text, character varying, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, timestamp with time zone, text, text, text, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_whatsapp_click_attribution_atomic_v2(character varying, character varying, character varying, character varying, character varying, character varying, character varying, text, text, character varying, text, boolean, character varying, text, character varying, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, timestamp with time zone, text, text, text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_whatsapp_click_attribution_atomic_v2(character varying, character varying, character varying, character varying, character varying, character varying, character varying, text, text, character varying, text, boolean, character varying, text, character varying, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, timestamp with time zone, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_whatsapp_click_attribution_atomic_v2(character varying, character varying, character varying, character varying, character varying, character varying, character varying, text, text, character varying, text, boolean, character varying, text, character varying, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, timestamp with time zone, text, text, text, text, text, text) TO postgres;
