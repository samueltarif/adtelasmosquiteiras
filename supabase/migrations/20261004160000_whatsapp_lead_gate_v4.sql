-- Migration: 20261004160000_whatsapp_lead_gate_v4.sql
-- WhatsApp Lead Gate Global: cidade nullable, status lead_captured, RPC v4 atômica.
-- Aditiva e totalmente retrocompatível com RPC v1, v2 e v3.

-- 1. Permitir cidade NULL em public.leads (não inventar cidade para WhatsApp gate)
ALTER TABLE public.leads ALTER COLUMN cidade DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN cidade SET DEFAULT NULL;

-- 2. Atualizar constraints em whatsapp_attributions para suportar 'lead_captured'
ALTER TABLE public.whatsapp_attributions DROP CONSTRAINT IF EXISTS chk_whatsapp_attributions_status;
ALTER TABLE public.whatsapp_attributions ADD CONSTRAINT chk_whatsapp_attributions_status
    CHECK (attribution_status = ANY (ARRAY['unassigned'::text, 'lead_captured'::text, 'assigned'::text, 'dismissed'::text, 'expired'::text]));

ALTER TABLE public.whatsapp_attributions DROP CONSTRAINT IF EXISTS chk_whatsapp_attributions_assigned_consistency;
ALTER TABLE public.whatsapp_attributions ADD CONSTRAINT chk_whatsapp_attributions_assigned_consistency
    CHECK (
        ((attribution_status = 'assigned'::text) AND ((client_id IS NOT NULL) OR (lead_id IS NOT NULL)) AND (assigned_by IS NOT NULL) AND (assigned_at IS NOT NULL) AND (match_method IS NOT NULL) AND (confidence_level = ANY (ARRAY['confirmed'::text, 'probable'::text])))
        OR ((attribution_status = 'dismissed'::text) AND (dismissed_by IS NOT NULL) AND (dismissed_at IS NOT NULL))
        OR ((attribution_status = 'unassigned'::text) AND (assigned_by IS NULL) AND (assigned_at IS NULL) AND (client_id IS NULL) AND (lead_id IS NULL))
        OR ((attribution_status = 'lead_captured'::text) AND (lead_id IS NOT NULL) AND (client_id IS NULL) AND (assigned_by IS NULL) AND (assigned_at IS NULL))
        OR (attribution_status = 'expired'::text)
    );

-- 3. RPC V4 atômica para WhatsApp Lead Gate
CREATE OR REPLACE FUNCTION public.create_whatsapp_lead_attribution_atomic_v4(
    p_submission_id varchar, p_lead_id uuid DEFAULT NULL, p_nome varchar DEFAULT NULL, p_telefone varchar DEFAULT NULL,
    p_origem varchar DEFAULT NULL, p_event_id varchar DEFAULT NULL, p_short_code varchar DEFAULT NULL,
    p_visitor_id varchar DEFAULT NULL, p_session_id varchar DEFAULT NULL, p_cta_location varchar DEFAULT NULL,
    p_service_key varchar DEFAULT NULL, p_service_name text DEFAULT NULL, p_landing_path text DEFAULT NULL,
    p_conversion_path text DEFAULT NULL, p_device_type varchar DEFAULT NULL, p_google_device text DEFAULT NULL,
    p_is_bot boolean DEFAULT false, p_bot_name varchar DEFAULT NULL, p_user_agent text DEFAULT NULL, p_ip_hash varchar DEFAULT NULL,
    p_channel text DEFAULT NULL, p_utm_source text DEFAULT NULL, p_utm_medium text DEFAULT NULL, p_utm_campaign text DEFAULT NULL,
    p_utm_content text DEFAULT NULL, p_utm_term text DEFAULT NULL, p_google_campaign_id text DEFAULT NULL,
    p_google_adgroup_id text DEFAULT NULL, p_google_creative_id text DEFAULT NULL, p_google_match_type text DEFAULT NULL,
    p_google_network text DEFAULT NULL, p_google_target_id text DEFAULT NULL, p_gclid text DEFAULT NULL,
    p_gbraid text DEFAULT NULL, p_wbraid text DEFAULT NULL, p_referrer text DEFAULT NULL, p_clicked_at timestamptz DEFAULT now(),
    p_fbclid text DEFAULT NULL, p_msclkid text DEFAULT NULL, p_meta_campaign_id text DEFAULT NULL, p_meta_adset_id text DEFAULT NULL,
    p_meta_ad_id text DEFAULT NULL, p_meta_placement text DEFAULT NULL, p_ttclid text DEFAULT NULL, p_tiktok_campaign_id text DEFAULT NULL,
    p_tiktok_adgroup_id text DEFAULT NULL, p_tiktok_ad_id text DEFAULT NULL, p_tiktok_creative_id text DEFAULT NULL, p_tiktok_placement text DEFAULT NULL,
    p_first_touch_channel text DEFAULT NULL, p_first_touch_landing_path text DEFAULT NULL, p_first_touch_referrer text DEFAULT NULL, p_first_touch_utm_source text DEFAULT NULL, p_first_touch_utm_medium text DEFAULT NULL,
    p_first_touch_utm_campaign text DEFAULT NULL, p_first_touch_utm_content text DEFAULT NULL, p_first_touch_utm_term text DEFAULT NULL, p_first_touch_google_campaign_id text DEFAULT NULL, p_first_touch_google_adgroup_id text DEFAULT NULL,
    p_first_touch_google_creative_id text DEFAULT NULL, p_first_touch_google_match_type text DEFAULT NULL, p_first_touch_google_network text DEFAULT NULL, p_first_touch_google_device text DEFAULT NULL, p_first_touch_google_target_id text DEFAULT NULL,
    p_first_touch_gclid text DEFAULT NULL, p_first_touch_gbraid text DEFAULT NULL, p_first_touch_wbraid text DEFAULT NULL, p_first_touch_fbclid text DEFAULT NULL, p_first_touch_msclkid text DEFAULT NULL, p_first_touch_ttclid text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
    v_short_code VARCHAR(10); v_clean_channel TEXT; v_campaign_name TEXT;
    v_lead_id UUID; v_lead_click_id UUID; v_attribution_id UUID;
    v_existing_lead_id UUID; v_existing_lc_id UUID; v_existing_attr RECORD;
    v_is_idempotent BOOLEAN := false;
BEGIN
    v_short_code := upper(trim(COALESCE(p_short_code, '')));
    IF v_short_code !~ '^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$' THEN
        RAISE EXCEPTION 'ERR_INVALID_SHORT_CODE: Short code deve conter exatamente 8 caracteres do alfabeto permitido.';
    END IF;

    v_clean_channel := COALESCE(NULLIF(trim(p_channel), ''), 'direct');
    IF p_utm_campaign IS NOT NULL AND length(trim(p_utm_campaign)) > 0 THEN v_campaign_name := trim(p_utm_campaign);
    ELSIF v_clean_channel = 'google_ads' OR p_gclid IS NOT NULL OR p_gbraid IS NOT NULL OR p_wbraid IS NOT NULL THEN v_campaign_name := 'Google Ads';
    ELSIF v_clean_channel = 'instagram_ads' THEN v_campaign_name := 'Instagram Ads';
    ELSIF v_clean_channel = 'facebook_ads' THEN v_campaign_name := 'Facebook Ads';
    ELSIF v_clean_channel = 'meta_ads' THEN v_campaign_name := 'Meta Ads';
    ELSIF v_clean_channel = 'tiktok_ads' OR p_ttclid IS NOT NULL THEN v_campaign_name := 'TikTok Ads';
    ELSIF v_clean_channel = 'tiktok_organic' THEN v_campaign_name := 'TikTok (Orgânico)';
    ELSIF v_clean_channel = 'microsoft_ads' OR p_msclkid IS NOT NULL THEN v_campaign_name := 'Microsoft Ads';
    ELSIF v_clean_channel = 'instagram_organic' THEN v_campaign_name := 'Instagram (Orgânico)';
    ELSIF v_clean_channel = 'facebook_organic' THEN v_campaign_name := 'Facebook (Orgânico)';
    ELSIF v_clean_channel = 'google_organic' THEN v_campaign_name := 'Google (Orgânico)';
    ELSIF v_clean_channel = 'other_paid' THEN v_campaign_name := 'Outro Pago';
    ELSIF v_clean_channel = 'referral' THEN v_campaign_name := 'Referral';
    ELSE v_campaign_name := 'Direto';
    END IF;

    -- 1. Resolução ou criação do Lead (idempotência por submission_id ou reuso por p_lead_id)
    IF p_lead_id IS NOT NULL THEN
        SELECT id INTO v_lead_id FROM public.leads WHERE id = p_lead_id LIMIT 1;
    END IF;

    IF v_lead_id IS NULL AND p_submission_id IS NOT NULL AND length(trim(p_submission_id)) > 0 THEN
        SELECT id INTO v_existing_lead_id FROM public.leads WHERE submission_id = p_submission_id LIMIT 1;
        IF v_existing_lead_id IS NOT NULL THEN v_lead_id := v_existing_lead_id; v_is_idempotent := true; END IF;
    END IF;

    IF v_lead_id IS NULL THEN
        INSERT INTO public.leads (
            nome, telefone, cidade, bairro, servico, origem, status, submission_id, visitor_id, session_id,
            landing_path, conversion_path, session_channel, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
            gclid, gbraid, wbraid, fbclid, msclkid, ttclid, referrer, device_type, google_device,
            google_campaign_id, google_adgroup_id, google_creative_id, google_match_type, google_network, google_target_id,
            meta_campaign_id, meta_adset_id, meta_ad_id, meta_placement, tiktok_campaign_id, tiktok_adgroup_id, tiktok_ad_id,
            tiktok_creative_id, tiktok_placement, notification_email_status,
            first_touch_channel, first_touch_landing_path, first_touch_referrer, first_touch_utm_source, first_touch_utm_medium,
            first_touch_utm_campaign, first_touch_utm_content, first_touch_utm_term, first_touch_google_campaign_id,
            first_touch_google_adgroup_id, first_touch_google_creative_id, first_touch_google_match_type, first_touch_google_network,
            first_touch_google_device, first_touch_google_target_id, first_touch_gclid, first_touch_gbraid, first_touch_wbraid,
            first_touch_fbclid, first_touch_msclkid, first_touch_ttclid
        ) VALUES (
            p_nome, p_telefone, NULL, NULL, COALESCE(p_service_name, 'Atendimento WhatsApp'), COALESCE(p_origem, 'whatsapp_gate'), 'Novo',
            p_submission_id, p_visitor_id, p_session_id, p_landing_path, p_conversion_path, v_clean_channel,
            p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_gclid, p_gbraid, p_wbraid, p_fbclid, p_msclkid, p_ttclid,
            p_referrer, p_device_type, p_google_device, p_google_campaign_id, p_google_adgroup_id, p_google_creative_id,
            p_google_match_type, p_google_network, p_google_target_id, p_meta_campaign_id, p_meta_adset_id, p_meta_ad_id, p_meta_placement,
            p_tiktok_campaign_id, p_tiktok_adgroup_id, p_tiktok_ad_id, p_tiktok_creative_id, p_tiktok_placement, 'pending',
            COALESCE(NULLIF(trim(p_first_touch_channel), ''), v_clean_channel),
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_landing_path ELSE p_landing_path END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_referrer ELSE p_referrer END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_utm_source ELSE p_utm_source END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_utm_medium ELSE p_utm_medium END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_utm_campaign ELSE p_utm_campaign END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_utm_content ELSE p_utm_content END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_utm_term ELSE p_utm_term END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_google_campaign_id ELSE p_google_campaign_id END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_google_adgroup_id ELSE p_google_adgroup_id END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_google_creative_id ELSE p_google_creative_id END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_google_match_type ELSE p_google_match_type END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_google_network ELSE p_google_network END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_google_device ELSE COALESCE(p_google_device, p_device_type) END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_google_target_id ELSE p_google_target_id END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_gclid ELSE p_gclid END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_gbraid ELSE p_gbraid END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_wbraid ELSE p_wbraid END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_fbclid ELSE p_fbclid END,
            CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_msclkid ELSE p_msclkid END, CASE WHEN p_first_touch_channel IS NOT NULL THEN p_first_touch_ttclid ELSE p_ttclid END
        ) ON CONFLICT (submission_id) WHERE (submission_id IS NOT NULL) DO NOTHING RETURNING id INTO v_lead_id;

        IF v_lead_id IS NULL THEN
            SELECT id INTO v_lead_id FROM public.leads WHERE submission_id = p_submission_id LIMIT 1;
            v_is_idempotent := true;
        END IF;
    END IF;

    -- 2. Fast-path idempotência por event_id
    IF p_event_id IS NOT NULL AND length(trim(p_event_id)) > 0 THEN
        SELECT id INTO v_existing_lc_id FROM public.lead_clicks WHERE event_id = p_event_id LIMIT 1;
        IF v_existing_lc_id IS NOT NULL THEN
            SELECT id, short_code, attribution_status, lead_id INTO v_existing_attr
            FROM public.whatsapp_attributions WHERE lead_click_id = v_existing_lc_id LIMIT 1;
            IF v_existing_attr.id IS NOT NULL THEN
                RETURN jsonb_build_object('success', true, 'idempotent', true, 'lead_id', COALESCE(v_existing_attr.lead_id, v_lead_id),
                    'lead_click_id', v_existing_lc_id, 'attribution_id', v_existing_attr.id, 'short_code', v_existing_attr.short_code, 'status', v_existing_attr.attribution_status);
            END IF;
        END IF;
    END IF;

    -- 3. Inserção de lead_click
    INSERT INTO public.lead_clicks (
        event_id, visitor_id, session_id, tipo, origem, url_origem, cta_location, service_key, service_name, landing_path,
        device_type, google_device, is_bot, bot_name, user_agent, ip_hash, channel, utm_source, utm_medium, utm_campaign,
        utm_content, utm_term, google_campaign_id, google_adgroup_id, google_creative_id, google_match_type, google_network,
        google_target_id, gclid, gbraid, wbraid, fbclid, msclkid, meta_campaign_id, meta_adset_id, meta_ad_id, meta_placement,
        ttclid, tiktok_campaign_id, tiktok_adgroup_id, tiktok_ad_id, tiktok_creative_id, tiktok_placement, referrer, created_at
    ) VALUES (
        p_event_id, p_visitor_id, p_session_id, 'whatsapp', COALESCE(p_origem, 'Home (/)'), COALESCE(p_conversion_path, p_origem, 'Home (/)'),
        p_cta_location, p_service_key, p_service_name, COALESCE(p_landing_path, p_origem, 'Home (/)'), p_device_type, p_google_device,
        COALESCE(p_is_bot, false), p_bot_name, p_user_agent, p_ip_hash, v_clean_channel, p_utm_source, p_utm_medium, p_utm_campaign,
        p_utm_content, p_utm_term, p_google_campaign_id, p_google_adgroup_id, p_google_creative_id, p_google_match_type,
        p_google_network, p_google_target_id, p_gclid, p_gbraid, p_wbraid, p_fbclid, p_msclkid, p_meta_campaign_id, p_meta_adset_id,
        p_meta_ad_id, p_meta_placement, p_ttclid, p_tiktok_campaign_id, p_tiktok_adgroup_id, p_tiktok_ad_id, p_tiktok_creative_id,
        p_tiktok_placement, p_referrer, COALESCE(p_clicked_at, now())
    ) ON CONFLICT (event_id) WHERE (event_id IS NOT NULL) DO NOTHING RETURNING id INTO v_lead_click_id;

    IF v_lead_click_id IS NULL THEN
        SELECT id INTO v_lead_click_id FROM public.lead_clicks WHERE event_id = p_event_id LIMIT 1;
    END IF;

    -- 4. Inserção de whatsapp_attribution com status lead_captured e lead_id vinculado
    BEGIN
        INSERT INTO public.whatsapp_attributions (
            short_code, lead_click_id, lead_id, visitor_id, session_id, clicked_at, channel, utm_source, utm_medium,
            utm_campaign, utm_content, utm_term, gclid, gbraid, wbraid, fbclid, meta_campaign_id, meta_adset_id,
            meta_ad_id, meta_placement, google_campaign_id, google_adgroup_id, google_creative_id, ttclid, tiktok_campaign_id,
            tiktok_adgroup_id, tiktok_ad_id, tiktok_creative_id, tiktok_placement, campaign_name, landing_path, cta_location,
            attribution_status, confidence_level
        ) VALUES (
            v_short_code, v_lead_click_id, v_lead_id, p_visitor_id, p_session_id, COALESCE(p_clicked_at, now()),
            v_clean_channel, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_gclid, p_gbraid,
            p_wbraid, p_fbclid, p_meta_campaign_id, p_meta_adset_id, p_meta_ad_id, p_meta_placement,
            p_google_campaign_id, p_google_adgroup_id, p_google_creative_id, p_ttclid, p_tiktok_campaign_id,
            p_tiktok_adgroup_id, p_tiktok_ad_id, p_tiktok_creative_id, p_tiktok_placement, v_campaign_name,
            COALESCE(p_landing_path, p_origem, '/'), p_cta_location, 'lead_captured', 'unassigned'
        ) RETURNING id INTO v_attribution_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'ERR_SHORT_CODE_COLLISION: Short code % já existe. Colisão detectada.', v_short_code;
    END;

    RETURN jsonb_build_object(
        'success', true, 'idempotent', v_is_idempotent, 'lead_id', v_lead_id,
        'lead_click_id', v_lead_click_id, 'attribution_id', v_attribution_id,
        'short_code', v_short_code, 'status', 'lead_captured'
    );
END;
$$;

-- Permissões estritas: revogar público e conceder service_role + postgres
DO $$
DECLARE v_oid OID;
BEGIN
    SELECT oid INTO v_oid FROM pg_proc WHERE proname = 'create_whatsapp_lead_attribution_atomic_v4' AND pronamespace = 'public'::regnamespace LIMIT 1;
    IF v_oid IS NOT NULL THEN
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', v_oid::regprocedure);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', v_oid::regprocedure);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', v_oid::regprocedure);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_oid::regprocedure);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO postgres', v_oid::regprocedure);
    END IF;
END $$;
