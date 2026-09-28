-- Migration: 20260928000000_harden_whatsapp_rpc_v3_concurrency.sql
-- Hardening RPC v3 (CREATE OR REPLACE — assinatura idêntica à v3 original)
-- Remove EXISTS pré-check não atômico; mantém CATCH unique_violation como barreira real.
-- event_id = idempotência | short_code = chave pública única | colisão => ERR_SHORT_CODE_COLLISION

CREATE OR REPLACE FUNCTION public.create_whatsapp_click_attribution_atomic_v3(
    p_event_id character varying,
    p_short_code character varying,
    p_visitor_id character varying,
    p_session_id character varying,
    p_origem character varying,
    p_cta_location character varying,
    p_service_key character varying,
    p_service_name text,
    p_landing_path text,
    p_device_type character varying,
    p_google_device text,
    p_is_bot boolean,
    p_bot_name character varying,
    p_user_agent text,
    p_ip_hash character varying,
    p_channel text,
    p_utm_source text,
    p_utm_medium text,
    p_utm_campaign text,
    p_utm_content text,
    p_utm_term text,
    p_google_campaign_id text,
    p_google_adgroup_id text,
    p_google_creative_id text,
    p_google_match_type text,
    p_google_network text,
    p_google_target_id text,
    p_gclid text,
    p_gbraid text,
    p_wbraid text,
    p_referrer text,
    p_clicked_at timestamp with time zone DEFAULT now(),
    p_fbclid text DEFAULT NULL::text,
    p_msclkid text DEFAULT NULL::text,
    p_meta_campaign_id text DEFAULT NULL::text,
    p_meta_adset_id text DEFAULT NULL::text,
    p_meta_ad_id text DEFAULT NULL::text,
    p_meta_placement text DEFAULT NULL::text,
    p_ttclid text DEFAULT NULL::text,
    p_tiktok_campaign_id text DEFAULT NULL::text,
    p_tiktok_adgroup_id text DEFAULT NULL::text,
    p_tiktok_ad_id text DEFAULT NULL::text,
    p_tiktok_creative_id text DEFAULT NULL::text,
    p_tiktok_placement text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_short_code        VARCHAR(10);
    v_lead_click_id     UUID;
    v_attribution_id    UUID;
    v_existing_lc_id    UUID;
    v_existing_attr     RECORD;
    v_campaign_name     TEXT;
    v_clean_channel     TEXT;
    v_constraint_name   TEXT;
BEGIN
    -- 1. Validar formato do short_code
    v_short_code := upper(trim(COALESCE(p_short_code, '')));
    IF v_short_code !~ '^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$' THEN
        RAISE EXCEPTION 'ERR_INVALID_SHORT_CODE: Short code deve conter exatamente 8 caracteres do alfabeto permitido.';
    END IF;

    -- 2. Fast-path: idempotência sequencial por event_id (evita custo do INSERT se já existe)
    IF p_event_id IS NOT NULL AND length(trim(p_event_id)) > 0 THEN
        SELECT id INTO v_existing_lc_id
        FROM public.lead_clicks
        WHERE event_id = p_event_id
        LIMIT 1;

        IF v_existing_lc_id IS NOT NULL THEN
            SELECT id, short_code, attribution_status INTO v_existing_attr
            FROM public.whatsapp_attributions
            WHERE lead_click_id = v_existing_lc_id
            LIMIT 1;

            IF v_existing_attr.id IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'success',         true,
                    'idempotent',      true,
                    'lead_click_id',   v_existing_lc_id,
                    'attribution_id',  v_existing_attr.id,
                    'short_code',      v_existing_attr.short_code,
                    'status',          v_existing_attr.attribution_status
                );
            ELSE
                RAISE EXCEPTION 'ERR_IDEMPOTENCY_INCONSISTENT_STATE: Lead click encontrado mas whatsapp_attribution ausente.';
            END IF;
        END IF;
    END IF;

    -- 3. Definir canal canônico e nome de campanha contextual
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
    ELSIF v_clean_channel = 'tiktok_ads' OR p_ttclid IS NOT NULL THEN
        v_campaign_name := 'TikTok Ads';
    ELSIF v_clean_channel = 'tiktok_organic' THEN
        v_campaign_name := 'TikTok (Orgânico)';
    ELSIF v_clean_channel = 'microsoft_ads' OR p_msclkid IS NOT NULL THEN
        v_campaign_name := 'Microsoft Ads';
    ELSIF v_clean_channel = 'instagram_organic' THEN
        v_campaign_name := 'Instagram (Orgânico)';
    ELSIF v_clean_channel = 'facebook_organic' THEN
        v_campaign_name := 'Facebook (Orgânico)';
    ELSIF v_clean_channel = 'google_organic' THEN
        v_campaign_name := 'Google (Orgânico)';
    ELSIF v_clean_channel = 'other_paid' THEN
        v_campaign_name := 'Outro Pago';
    ELSIF v_clean_channel = 'referral' THEN
        v_campaign_name := 'Referral';
    ELSE
        v_campaign_name := 'Direto';
    END IF;

    -- 4. Inserção atômica de lead_click
    --    ON CONFLICT (event_id) WHERE event_id IS NOT NULL é a barreira de concorrência.
    --    Se event_id B é diferente de A, não há conflito aqui — o lead_click B é inserido.
    INSERT INTO public.lead_clicks (
        event_id, visitor_id, session_id, tipo, origem, url_origem,
        cta_location, service_key, service_name, landing_path,
        device_type, google_device, is_bot, bot_name, user_agent, ip_hash,
        channel, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        google_campaign_id, google_adgroup_id, google_creative_id,
        google_match_type, google_network, google_target_id,
        gclid, gbraid, wbraid, fbclid, msclkid,
        meta_campaign_id, meta_adset_id, meta_ad_id, meta_placement,
        ttclid, tiktok_campaign_id, tiktok_adgroup_id, tiktok_ad_id,
        tiktok_creative_id, tiktok_placement,
        referrer, created_at
    ) VALUES (
        p_event_id, p_visitor_id, p_session_id, 'whatsapp',
        COALESCE(p_origem, 'Home (/)'), COALESCE(p_origem, 'Home (/)'),
        p_cta_location, p_service_key, p_service_name,
        COALESCE(p_landing_path, p_origem, 'Home (/)'),
        p_device_type, p_google_device, COALESCE(p_is_bot, false), p_bot_name,
        p_user_agent, p_ip_hash,
        v_clean_channel, p_utm_source, p_utm_medium, p_utm_campaign,
        p_utm_content, p_utm_term,
        p_google_campaign_id, p_google_adgroup_id, p_google_creative_id,
        p_google_match_type, p_google_network, p_google_target_id,
        p_gclid, p_gbraid, p_wbraid, p_fbclid, p_msclkid,
        p_meta_campaign_id, p_meta_adset_id, p_meta_ad_id, p_meta_placement,
        p_ttclid, p_tiktok_campaign_id, p_tiktok_adgroup_id, p_tiktok_ad_id,
        p_tiktok_creative_id, p_tiktok_placement,
        p_referrer, COALESCE(p_clicked_at, now())
    )
    ON CONFLICT (event_id) WHERE (event_id IS NOT NULL) DO NOTHING
    RETURNING id INTO v_lead_click_id;

    -- 5. Resolução de concorrência simultânea por event_id (mesmo event_id, outra thread venceu)
    IF v_lead_click_id IS NULL THEN
        SELECT id INTO v_existing_lc_id
        FROM public.lead_clicks
        WHERE event_id = p_event_id
        LIMIT 1;

        IF v_existing_lc_id IS NOT NULL THEN
            SELECT id, short_code, attribution_status INTO v_existing_attr
            FROM public.whatsapp_attributions
            WHERE lead_click_id = v_existing_lc_id
            LIMIT 1;

            IF v_existing_attr.id IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'success',         true,
                    'idempotent',      true,
                    'lead_click_id',   v_existing_lc_id,
                    'attribution_id',  v_existing_attr.id,
                    'short_code',      v_existing_attr.short_code,
                    'status',          v_existing_attr.attribution_status
                );
            ELSE
                RAISE EXCEPTION 'ERR_IDEMPOTENCY_INCONSISTENT_STATE: Lead click encontrado mas whatsapp_attribution ausente.';
            END IF;
        ELSE
            RAISE EXCEPTION 'ERR_IDEMPOTENCY_INCONSISTENT_STATE: Conflito detectado mas lead_click vencedor não localizado.';
        END IF;
    END IF;

    -- 6. Inserção de atribuição WhatsApp.
    --    unique_violation em short_code => event_ids DIFERENTES => COLISÃO (não idempotência).
    --    RAISE propaga => rollback de toda a transação => lead_click inserido no passo 4 é revertido.
    --    Garantia: zero lead_click órfão do perdedor.
    BEGIN
        INSERT INTO public.whatsapp_attributions (
            short_code, lead_click_id, visitor_id, session_id, clicked_at,
            channel, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
            gclid, gbraid, wbraid, fbclid,
            meta_campaign_id, meta_adset_id, meta_ad_id, meta_placement,
            google_campaign_id, google_adgroup_id, google_creative_id,
            ttclid, tiktok_campaign_id, tiktok_adgroup_id, tiktok_ad_id,
            tiktok_creative_id, tiktok_placement,
            campaign_name, landing_path, cta_location,
            attribution_status, confidence_level
        ) VALUES (
            v_short_code, v_lead_click_id, p_visitor_id, p_session_id,
            COALESCE(p_clicked_at, now()),
            v_clean_channel, p_utm_source, p_utm_medium, p_utm_campaign,
            p_utm_content, p_utm_term,
            p_gclid, p_gbraid, p_wbraid, p_fbclid,
            p_meta_campaign_id, p_meta_adset_id, p_meta_ad_id, p_meta_placement,
            p_google_campaign_id, p_google_adgroup_id, p_google_creative_id,
            p_ttclid, p_tiktok_campaign_id, p_tiktok_adgroup_id, p_tiktok_ad_id,
            p_tiktok_creative_id, p_tiktok_placement,
            v_campaign_name, COALESCE(p_landing_path, p_origem, '/'), p_cta_location,
            'unassigned', 'unassigned'
        )
        RETURNING id INTO v_attribution_id;
    EXCEPTION
        WHEN unique_violation THEN
            GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
            -- Qualquer unique_violation aqui é colisão de short_code com event_id diferente
            -- (idempotência de event_id já foi tratada no fast-path e no passo 5)
            RAISE EXCEPTION 'ERR_SHORT_CODE_COLLISION: Short code % já existe com event_id diferente. Colisão detectada, não idempotência.',
                v_short_code;
    END;

    RETURN jsonb_build_object(
        'success',        true,
        'idempotent',     false,
        'lead_click_id',  v_lead_click_id,
        'attribution_id', v_attribution_id,
        'short_code',     v_short_code,
        'status',         'unassigned'
    );
END;
$$;

-- Segurança: revogar público e garantir apenas service_role + postgres
DO $$
DECLARE
    v_oid OID;
BEGIN
    SELECT oid INTO v_oid
    FROM pg_proc
    WHERE proname = 'create_whatsapp_click_attribution_atomic_v3'
      AND pronamespace = 'public'::regnamespace
    LIMIT 1;

    IF v_oid IS NOT NULL THEN
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', v_oid::regprocedure);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', v_oid::regprocedure);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', v_oid::regprocedure);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_oid::regprocedure);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO postgres', v_oid::regprocedure);
    END IF;
END $$;

COMMENT ON FUNCTION public.create_whatsapp_click_attribution_atomic_v3 IS
'RPC v3 hardenizada (hotfix 20260928): event_id=chave de idempotência,
short_code=chave pública única. Colisão de short_code com event_id diferente
retorna ERR_SHORT_CODE_COLLISION e rollback total (zero lead_click órfão).
Remove EXISTS pré-check não atômico da v3 original. Assinatura idêntica à v3
original (20260927231000). search_path TO (vazio) = hardening máximo.';
