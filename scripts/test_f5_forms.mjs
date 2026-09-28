/**
 * scripts/test_f5_forms.mjs
 * Fase 5 - Testes de Formulario e First Touch via Leads DB / API
 * Cobre: F5-G02, F5-I02, F5-TK02, FT-F5-01, FT-F5-02, FT-F5-03
 */
import { supabase, ok, section, sendLeadApi, cleanupF5, getLeadBySubmissionId, stats } from "./test_f5_helpers.mjs"

const ALL_SUBS = []

async function runFormMatrix() {
  section("MATRIZ FORMULARIOS (F5-G02, F5-I02, F5-TK02)")

  // F5-G02: Google Ads -> Formulario
  const subG02 = "F5-SUB-G02"
  ALL_SUBS.push(subG02)
  await cleanupF5([], [], [subG02])
  const rG02 = await sendLeadApi({
    submission_id: subG02, visitor_id: "F5-VIS-G02", session_id: "F5-SES-G02",
    landing_path: "/orcamento", conversion_path: "/orcamento",
    channel: "google_ads", session_channel: "google_ads", first_touch_channel: "google_ads",
    utm_source: "google", utm_medium: "cpc", utm_campaign: "f5_google_ads",
    gclid: "F5_GCLID_02", nome: "Lead F5 Google", telefone: "11988880001",
    email: "lead.f5.google@exemplo.com.br", servico: "Telas Mosquiteiras", cidade: "São Paulo"
  })
  ok("F5-G02 | API success", rG02.ok && rG02.data?.leadSaved === true)
  const ldG02 = await getLeadBySubmissionId(subG02)
  ok("F5-G02 | leads.session_channel=google_ads", ldG02?.session_channel === "google_ads", `got=${ldG02?.session_channel}`)
  ok("F5-G02 | leads.gclid correto", ldG02?.gclid === "F5_GCLID_02", `got=${ldG02?.gclid}`)
  ok("F5-G02 | leads.first_touch_channel=google_ads", ldG02?.first_touch_channel === "google_ads")
  ok("F5-G02 | zero contaminacao Meta (fbclid NULL)", ldG02?.fbclid == null)
  ok("F5-G02 | zero contaminacao TikTok (ttclid NULL)", ldG02?.ttclid == null)

  // F5-I02: Instagram Ads -> Formulario
  const subI02 = "F5-SUB-I02"
  ALL_SUBS.push(subI02)
  await cleanupF5([], [], [subI02])
  const rI02 = await sendLeadApi({
    submission_id: subI02, visitor_id: "F5-VIS-I02", session_id: "F5-SES-I02",
    landing_path: "/orcamento", conversion_path: "/orcamento",
    channel: "instagram_ads", session_channel: "instagram_ads", first_touch_channel: "instagram_ads",
    utm_source: "instagram", utm_medium: "paid_social", utm_campaign: "f5_instagram_ads",
    fbclid: "F5_FB_IG_02", meta_campaign_id: "F5_META_CAMP_02", meta_adset_id: "F5_META_SET_02",
    meta_ad_id: "F5_META_AD_02", meta_placement: "Instagram_Stories",
    nome: "Lead F5 Instagram", telefone: "11988880002",
    email: "lead.f5.instagram@exemplo.com.br", servico: "Telas Mosquiteiras", cidade: "São Paulo"
  })
  ok("F5-I02 | API success", rI02.ok && rI02.data?.leadSaved === true)
  const ldI02 = await getLeadBySubmissionId(subI02)
  ok("F5-I02 | leads.session_channel=instagram_ads", ldI02?.session_channel === "instagram_ads", `got=${ldI02?.session_channel}`)
  ok("F5-I02 | leads.fbclid correto", ldI02?.fbclid === "F5_FB_IG_02")
  ok("F5-I02 | leads.meta_campaign_id", ldI02?.meta_campaign_id === "F5_META_CAMP_02")
  ok("F5-I02 | leads.first_touch_channel=instagram_ads", ldI02?.first_touch_channel === "instagram_ads")
  ok("F5-I02 | zero contaminacao Google (gclid NULL)", ldI02?.gclid == null)
  ok("F5-I02 | zero contaminacao TikTok (ttclid NULL)", ldI02?.ttclid == null)

  // F5-TK02: TikTok Ads -> Formulario
  const subTK02 = "F5-SUB-TK02"
  ALL_SUBS.push(subTK02)
  await cleanupF5([], [], [subTK02])
  const rTK02 = await sendLeadApi({
    submission_id: subTK02, visitor_id: "F5-VIS-TK02", session_id: "F5-SES-TK02",
    landing_path: "/orcamento", conversion_path: "/orcamento",
    channel: "tiktok_ads", session_channel: "tiktok_ads", first_touch_channel: "tiktok_ads",
    utm_source: "tiktok", utm_medium: "paid_social", utm_campaign: "f5_tiktok_ads",
    ttclid: "F5_TTCLID_02", tiktok_campaign_id: "F5_TK_CAMP_02", tiktok_adgroup_id: "F5_TK_GROUP_02",
    tiktok_ad_id: "F5_TK_AD_02", tiktok_creative_id: "F5_TK_CREATIVE_02", tiktok_placement: "TikTok",
    nome: "Lead F5 TikTok", telefone: "11988880003",
    email: "lead.f5.tiktok@exemplo.com.br", servico: "Telas Mosquiteiras", cidade: "São Paulo"
  })
  ok("F5-TK02 | API success", rTK02.ok && rTK02.data?.leadSaved === true)
  const ldTK02 = await getLeadBySubmissionId(subTK02)
  ok("F5-TK02 | leads.session_channel=tiktok_ads", ldTK02?.session_channel === "tiktok_ads", `got=${ldTK02?.session_channel}`)
  ok("F5-TK02 | leads.ttclid correto", ldTK02?.ttclid === "F5_TTCLID_02")
  ok("F5-TK02 | leads.tiktok_campaign_id", ldTK02?.tiktok_campaign_id === "F5_TK_CAMP_02")
  ok("F5-TK02 | leads.first_touch_channel=tiktok_ads", ldTK02?.first_touch_channel === "tiktok_ads")
  ok("F5-TK02 | zero contaminacao Google/Meta", ldTK02?.gclid == null && ldTK02?.fbclid == null)
}

async function runFirstTouchForms() {
  section("FIRST TOUCH SNAPSHOT NO LEAD (FT-F5-01 a FT-F5-03)")

  // FT-F5-01: Primeiro TikTok Ads, depois Google Ads
  const subFT01 = "F5-SUB-FT01"
  ALL_SUBS.push(subFT01)
  await cleanupF5([], [], [subFT01])
  await sendLeadApi({
    submission_id: subFT01, visitor_id: "F5-VIS-FT01", session_id: "F5-SES-FT01",
    channel: "google_ads", session_channel: "google_ads", gclid: "F5_GCLID_FT01",
    first_touch_channel: "tiktok_ads", first_touch_ttclid: "F5_TT_FT01",
    first_touch_tiktok_campaign_id: "F5_TK_CAMP_FT01",
    nome: "Lead FT01", telefone: "11988880011", email: "ft01@exemplo.com.br", servico: "Telas", cidade: "SP"
  })
  const ldFT01 = await getLeadBySubmissionId(subFT01)
  ok("FT-F5-01 | first_touch_channel=tiktok_ads", ldFT01?.first_touch_channel === "tiktok_ads")
  ok("FT-F5-01 | first_touch_ttclid preservado", ldFT01?.first_touch_ttclid === "F5_TT_FT01")
  ok("FT-F5-01 | session_channel=google_ads", ldFT01?.session_channel === "google_ads")
  ok("FT-F5-01 | gclid atual presente", ldFT01?.gclid === "F5_GCLID_FT01")

  // FT-F5-02: Primeiro Direct, depois TikTok Ads
  const subFT02 = "F5-SUB-FT02"
  ALL_SUBS.push(subFT02)
  await cleanupF5([], [], [subFT02])
  await sendLeadApi({
    submission_id: subFT02, visitor_id: "F5-VIS-FT02", session_id: "F5-SES-FT02",
    channel: "tiktok_ads", session_channel: "tiktok_ads", ttclid: "F5_TT_FT02",
    first_touch_channel: "direct",
    nome: "Lead FT02", telefone: "11988880012", email: "ft02@exemplo.com.br", servico: "Telas", cidade: "SP"
  })
  const ldFT02 = await getLeadBySubmissionId(subFT02)
  ok("FT-F5-02 | first_touch_channel=direct", ldFT02?.first_touch_channel === "direct")
  ok("FT-F5-02 | first_touch_ttclid is NULL", ldFT02?.first_touch_ttclid == null)
  ok("FT-F5-02 | session_channel=tiktok_ads", ldFT02?.session_channel === "tiktok_ads")
  ok("FT-F5-02 | ttclid atual presente", ldFT02?.ttclid === "F5_TT_FT02")

  // FT-F5-03: Primeiro Instagram Ads, depois TikTok Ads
  const subFT03 = "F5-SUB-FT03"
  ALL_SUBS.push(subFT03)
  await cleanupF5([], [], [subFT03])
  await sendLeadApi({
    submission_id: subFT03, visitor_id: "F5-VIS-FT03", session_id: "F5-SES-FT03",
    channel: "tiktok_ads", session_channel: "tiktok_ads", ttclid: "F5_TT_FT03",
    first_touch_channel: "instagram_ads", first_touch_fbclid: "F5_FB_FT03",
    nome: "Lead FT03", telefone: "11988880013", email: "ft03@exemplo.com.br", servico: "Telas", cidade: "SP"
  })
  const ldFT03 = await getLeadBySubmissionId(subFT03)
  ok("FT-F5-03 | first_touch_channel=instagram_ads", ldFT03?.first_touch_channel === "instagram_ads")
  ok("FT-F5-03 | first_touch_fbclid preservado", ldFT03?.first_touch_fbclid === "F5_FB_FT03")
  ok("FT-F5-03 | session_channel=tiktok_ads", ldFT03?.session_channel === "tiktok_ads")
  ok("FT-F5-03 | ttclid atual presente", ldFT03?.ttclid === "F5_TT_FT03")
}

async function cleanup() {
  section("LIMPEZA FIXTURES FORMS F5")
  await cleanupF5([], [], [...new Set(ALL_SUBS)])
  const { count: residLeads } = await supabase.from("leads").select("*", { count: "exact", head: true }).like("submission_id", "F5-%")
  ok("Zero leads F5 residuais", !residLeads, `found=${residLeads}`)
}

export async function runFormTests() {
  await runFormMatrix()
  await runFirstTouchForms()
  await cleanup()
}
