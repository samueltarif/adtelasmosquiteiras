/**
 * scripts/test_f5_matrix.mjs
 * Fase 5 - Matriz Principal: F5-G01..F5-R01 + Precedencia + Spoofing
 * Linha 1/~190
 */
import { supabase, ok, section, BASE_PAYLOAD, callRpcV3, trackVisit, cleanupF5, cleanupLeads, cleanupPageViews, getLeadClick, getAttribution, getPageView, getLead, stats } from "./test_f5_helpers.mjs"
import { classifyClientChannel } from "../app/utils/trafficChannelClassifier.ts"

const ALL_EVENTS = []; const ALL_SC = []; const ALL_SESSIONS = []; const ALL_EMAILS = []

// Short codes validos Crockford Base32 (sem 0,1,I,L,O)
const SC = {
  G01:"F5GA23BC", G02:"F5GA24BD", MS01:"F5MS25BE", I01:"F5SG26BF", I02:"F5SG27BG",
  F01:"F5FB28BH", META01:"F5ME29BJ", TK01:"F5TK2ABK", TK02:"F5TK2BBM", OP01:"F5PA2CBN",
  D01:"F5DR2DBP", R01:"F5RF2EBQ",
  X01A:"F5XA2FBR", X02A:"F5XB2GBS", X03A:"F5XC2HBT",
  RETRY_G:"F5RT2JBV", RETRY_I:"F5RT2KBW", RETRY_TK:"F5RT2MCX"
}
Object.values(SC).forEach(s => ALL_SC.push(s))

async function testClassify(label, params, expected) {
  const got = classifyClientChannel(params)
  ok(label, got === expected, `expected=${expected} got=${got}`)
}

async function testRpcChannel(label, sc, eventId, channel, extra = {}) {
  ALL_EVENTS.push(eventId); ALL_SC.push(sc)
  await cleanupF5([eventId], [sc])
  const { data, error } = await callRpcV3({ p_event_id: eventId, p_short_code: sc, p_channel: channel, ...extra })
  if (!ok(`${label} | RPC success`, data?.success === true && !error, error?.message?.substring(0,80))) return null
  const lc = await getLeadClick(eventId)
  ok(`${label} | channel=${channel}`, lc?.channel === channel, `got=${lc?.channel}`)
  return { data, lc }
}

async function testVisitChannel(label, sessionId, params, expected) {
  ALL_SESSIONS.push(sessionId)
  await cleanupPageViews([sessionId])
  const r = await trackVisit({ ...params, sessionId, visitorId: "F5-VIS-" + sessionId })
  ok(`${label} | track-visit ok`, r.ok, `status=${r.status}`)
  await new Promise(res => setTimeout(res, 600))
  const pv = await getPageView(sessionId)
  ok(`${label} | page_view.channel=${expected}`, pv?.channel === expected, `got=${pv?.channel}`)
  return pv
}

async function runMatrix() {
  section("MATRIZ PRINCIPAL")

  // F5-G01: Google Ads -> WhatsApp (RPC direto)
  await testRpcChannel("F5-G01 Google Ads->WA", SC.G01, "F5-EV-G01", "google_ads",
    { p_utm_source:"google", p_utm_medium:"cpc", p_utm_campaign:"f5_google_ads", p_gclid:"F5_GCLID_01", p_utm_content:null })
  const lcG01 = await getLeadClick("F5-EV-G01")
  ok("F5-G01 | gclid correto", lcG01?.gclid === "F5_GCLID_01", `got=${lcG01?.gclid}`)
  ok("F5-G01 | fbclid NULL", lcG01?.fbclid == null)
  ok("F5-G01 | ttclid NULL", lcG01?.ttclid == null)
  const atG01 = await getAttribution(SC.G01)
  ok("F5-G01 | attribution.channel=google_ads", atG01?.channel === "google_ads")
  ok("F5-G01 | short_code="+SC.G01, atG01?.short_code === SC.G01)

  // F5-G03: Google Organico (classificador)
  await testClassify("F5-G03 Google Organic", { referrer:"https://www.google.com.br/search?q=telas" }, "google_organic")

  // F5-MS01: Microsoft Ads (RPC + track-visit)
  await testRpcChannel("F5-MS01 Microsoft Ads->WA", SC.MS01, "F5-EV-MS01", "microsoft_ads",
    { p_utm_source:"bing", p_utm_medium:"cpc", p_utm_campaign:"f5_ms_ads", p_msclkid:"F5_MSCLKID_01" })
  const lcMS = await getLeadClick("F5-EV-MS01")
  ok("F5-MS01 | msclkid correto", lcMS?.msclkid === "F5_MSCLKID_01", `got=${lcMS?.msclkid}`)
  ok("F5-MS01 | gclid NULL", lcMS?.gclid == null); ok("F5-MS01 | ttclid NULL", lcMS?.ttclid == null)

  // F5-I01: Instagram Ads -> WhatsApp
  await testRpcChannel("F5-I01 Instagram Ads->WA", SC.I01, "F5-EV-I01", "instagram_ads",
    { p_utm_source:"instagram", p_utm_medium:"paid_social", p_fbclid:"F5_FB_IG_01",
      p_meta_campaign_id:"F5_META_CAMP_IG", p_meta_adset_id:"F5_META_SET_IG",
      p_meta_ad_id:"F5_META_AD_IG", p_meta_placement:"Instagram_Stories" })
  const lcI01 = await getLeadClick("F5-EV-I01")
  ok("F5-I01 | fbclid correto", lcI01?.fbclid === "F5_FB_IG_01")
  ok("F5-I01 | meta_campaign_id", lcI01?.meta_campaign_id === "F5_META_CAMP_IG")
  ok("F5-I01 | meta_placement", lcI01?.meta_placement === "Instagram_Stories")
  ok("F5-I01 | gclid NULL", lcI01?.gclid == null); ok("F5-I01 | ttclid NULL", lcI01?.ttclid == null)

  // F5-I03: Instagram Organico
  await testClassify("F5-I03 Instagram Organic", { utm_source:"instagram", utm_medium:"organic" }, "instagram_organic")

  // F5-F01: Facebook Ads - NUNCA meta_ads
  await testClassify("F5-F01 Facebook Ads != meta_ads", { utm_source:"facebook", utm_medium:"paid_social", fbclid:"F5_FB_FACEBOOK_01" }, "facebook_ads")
  await testRpcChannel("F5-F01 Facebook Ads->WA", SC.F01, "F5-EV-F01", "facebook_ads",
    { p_utm_source:"facebook", p_utm_medium:"paid_social", p_fbclid:"F5_FB_FACEBOOK_01" })

  // F5-F02: Facebook Organico
  await testClassify("F5-F02 Facebook Organic", { utm_source:"facebook", utm_medium:"organic" }, "facebook_organic")

  // F5-META01: Meta Ads genericos (fbclid sem source)
  await testClassify("F5-META01 Meta Ads generic", { fbclid:"F5_FB_GENERIC_01" }, "meta_ads")
  await testRpcChannel("F5-META01 Meta->WA", SC.META01, "F5-EV-META01", "meta_ads",
    { p_fbclid:"F5_FB_GENERIC_01" })

  // F5-TK01: TikTok Ads -> WhatsApp
  await testRpcChannel("F5-TK01 TikTok Ads->WA", SC.TK01, "F5-EV-TK01", "tiktok_ads",
    { p_utm_source:"tiktok", p_utm_medium:"paid_social", p_utm_campaign:"f5_tiktok_ads",
      p_ttclid:"F5_TTCLID_01", p_tiktok_campaign_id:"F5_TK_CAMP",
      p_tiktok_adgroup_id:"F5_TK_GROUP", p_tiktok_ad_id:"F5_TK_AD",
      p_tiktok_creative_id:"F5_TK_CREATIVE", p_tiktok_placement:"TikTok" })
  const lcTK01 = await getLeadClick("F5-EV-TK01")
  ok("F5-TK01 | ttclid correto", lcTK01?.ttclid === "F5_TTCLID_01")
  ok("F5-TK01 | tiktok_campaign_id", lcTK01?.tiktok_campaign_id === "F5_TK_CAMP")
  ok("F5-TK01 | tiktok_adgroup_id", lcTK01?.tiktok_adgroup_id === "F5_TK_GROUP")
  ok("F5-TK01 | tiktok_ad_id", lcTK01?.tiktok_ad_id === "F5_TK_AD")
  ok("F5-TK01 | tiktok_creative_id", lcTK01?.tiktok_creative_id === "F5_TK_CREATIVE")
  ok("F5-TK01 | tiktok_placement", lcTK01?.tiktok_placement === "TikTok")
  ok("F5-TK01 | gclid NULL", lcTK01?.gclid == null)
  ok("F5-TK01 | fbclid NULL", lcTK01?.fbclid == null)
  const atTK01 = await getAttribution(SC.TK01)
  ok("F5-TK01 | attribution.ttclid", atTK01?.ttclid === "F5_TTCLID_01")

  // F5-TK03: TikTok Organico
  await testClassify("F5-TK03 TikTok Organic", { utm_source:"tiktok", utm_medium:"organic" }, "tiktok_organic")

  // F5-OP01: Other Paid
  await testClassify("F5-OP01 Other Paid", { utm_source:"linkedin", utm_medium:"paid_social" }, "other_paid")

  // F5-D01: Direct
  await testClassify("F5-D01 Direct", {}, "direct")

  // F5-R01: Referral
  await testClassify("F5-R01 Referral", { referrer:"https://parceiro.com.br/link" }, "referral")
}

async function runSpoofing() {
  section("SPOOFING / HOSTNAME PROTECTION")
  await testClassify("SPOOF-TK | nottiktok.com != tiktok_organic", { referrer:"https://nottiktok.com/page" }, "referral")
  await testClassify("SPOOF-TK | fake-tiktok.com != tiktok_organic", { referrer:"https://fake-tiktok.com" }, "referral")
  await testClassify("SPOOF-GG | notgoogle.com != google_organic", { referrer:"https://notgoogle.com" }, "referral")
  await testClassify("SPOOF-GG | attacker-google.com != google_organic", { referrer:"https://attacker-google.com" }, "referral")
  await testClassify("SPOOF-IG | fakeinstagram.com != instagram_organic", { referrer:"https://fakeinstagram.com" }, "referral")
  await testClassify("SPOOF-FB | fakefacebook.com != facebook_organic", { referrer:"https://fakefacebook.com" }, "referral")
  // Validos continuam funcionando
  await testClassify("REAL-TK | www.tiktok.com = tiktok_organic", { referrer:"https://www.tiktok.com" }, "tiktok_organic")
  await testClassify("REAL-GG | www.google.com.br = google_organic", { referrer:"https://www.google.com.br/search?q=x" }, "google_organic")
}

async function runPrecedence() {
  section("PRECEDENCIA DE CLICK IDs")
  await testClassify("PREC-01 | gclid+ttclid => google_ads", { gclid:"G1", ttclid:"T1" }, "google_ads")
  await testClassify("PREC-02 | gclid+fbclid => google_ads", { gclid:"G1", fbclid:"F1" }, "google_ads")
  await testClassify("PREC-03 | msclkid+ttclid => microsoft_ads", { msclkid:"MS1", ttclid:"T1" }, "microsoft_ads")
  await testClassify("PREC-04 | ttclid+fbclid => tiktok_ads", { ttclid:"T1", fbclid:"F1" }, "tiktok_ads")
  await testClassify("PREC-05 | fbclid sem source => meta_ads", { fbclid:"F1" }, "meta_ads")
}

async function runRetry() {
  section("RETRY WHATSAPP")
  const cases = [
    { label:"Retry Google Ads", sc:SC.RETRY_G, eid:"F5-RETRY-G01", ch:"google_ads", extra:{ p_gclid:"F5_GCLID_RETRY" }},
    { label:"Retry Instagram Ads", sc:SC.RETRY_I, eid:"F5-RETRY-I01", ch:"instagram_ads", extra:{ p_fbclid:"F5_FB_RETRY", p_utm_source:"instagram", p_utm_medium:"paid_social" }},
    { label:"Retry TikTok Ads", sc:SC.RETRY_TK, eid:"F5-RETRY-TK01", ch:"tiktok_ads", extra:{ p_ttclid:"F5_TT_RETRY", p_tiktok_campaign_id:"F5_CAMP_RETRY" }},
  ]
  for (const c of cases) {
    ALL_EVENTS.push(c.eid); ALL_SC.push(c.sc)
    await cleanupF5([c.eid], [c.sc])
    const r1 = await callRpcV3({ p_event_id:c.eid, p_short_code:c.sc, p_channel:c.ch, ...c.extra })
    const r2 = await callRpcV3({ p_event_id:c.eid, p_short_code:c.sc, p_channel:c.ch, ...c.extra })
    ok(`${c.label} | 1a chamada success`, r1.data?.success && !r1.error)
    ok(`${c.label} | 2a chamada idempotente`, r2.data?.idempotent === true && !r2.error, r2.error?.message?.substring(0,80))
    const { data: lcArr } = await supabase.from("lead_clicks").select("id").eq("event_id", c.eid)
    ok(`${c.label} | 1 lead_click`, lcArr?.length === 1, `got=${lcArr?.length}`)
    const { data: waArr } = await supabase.from("whatsapp_attributions").select("id").eq("short_code", c.sc)
    ok(`${c.label} | 1 whatsapp_attribution`, waArr?.length === 1, `got=${waArr?.length}`)
  }
}

async function cleanup() {
  section("LIMPEZA FIXTURES F5")
  await cleanupF5([...new Set(ALL_EVENTS)], [...new Set(ALL_SC)])
  await cleanupLeads([...new Set(ALL_EMAILS)])
  await cleanupPageViews([...new Set(ALL_SESSIONS)])
  // Verificar por prefixo F5 residual
  const { data: residLc } = await supabase.from("lead_clicks").select("id,event_id").like("event_id", "F5-%")
  ok("Zero lead_clicks F5 residuais", !residLc?.length, `found=${residLc?.length}`)
}

export async function runMatrixTests() {
  await runMatrix()
  await runSpoofing()
  await runPrecedence()
  await runRetry()
  await cleanup()
}
