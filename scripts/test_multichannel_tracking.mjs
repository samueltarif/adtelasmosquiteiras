/**
 * scripts/test_multichannel_tracking.mjs
 * Fase 5 - Orquestrador Principal de Homologacao Multicanal
 * Executa: Matriz, Cross-Touch, Concorrencia, Regressao, Relatorio
 */
import { supabase, ok, section, stats } from "./test_f5_helpers.mjs"
import { runMatrixTests } from "./test_f5_matrix.mjs"
import { runCrosstoucheTests } from "./test_f5_crosstouche.mjs"
import { runFormTests } from "./test_f5_forms.mjs"

const BASELINE = { pv: 509, lc: 44, wa: 3, leads: 0 }
const t0 = Date.now()

async function verifyBaseState() {
  section("ESTADO BASE - RPC v1/v2/v3 + TAXONOMIA")

  // Validar RPC v3 chamando com short_code invalido -> ERR_INVALID_SHORT_CODE esperado
  const { data: v3ping, error: v3err } = await supabase.rpc("create_whatsapp_click_attribution_atomic_v3", {
    p_event_id:"F5-PING", p_short_code:"INVALID!!",
    p_visitor_id:"x", p_session_id:"x", p_origem:"/", p_cta_location:"x",
    p_service_key:"x", p_service_name:"x", p_landing_path:"/",
    p_device_type:"desktop", p_google_device:null, p_is_bot:false, p_bot_name:null,
    p_user_agent:"x", p_ip_hash:null, p_channel:"direct",
    p_utm_source:null, p_utm_medium:null, p_utm_campaign:null, p_utm_content:null, p_utm_term:null,
    p_google_campaign_id:null, p_google_adgroup_id:null, p_google_creative_id:null,
    p_google_match_type:null, p_google_network:null, p_google_target_id:null,
    p_gclid:null, p_gbraid:null, p_wbraid:null, p_referrer:null,
    p_fbclid:null, p_msclkid:null, p_meta_campaign_id:null, p_meta_adset_id:null,
    p_meta_ad_id:null, p_meta_placement:null, p_ttclid:null, p_tiktok_campaign_id:null,
    p_tiktok_adgroup_id:null, p_tiktok_ad_id:null, p_tiktok_creative_id:null, p_tiktok_placement:null
  })
  ok("RPC v3 responde (ERR_INVALID_SHORT_CODE esperado)", v3err?.message?.includes("ERR_INVALID_SHORT_CODE"), `got=${v3err?.message?.substring(0,60)}`)

  // Checar conexao com banco
  const { data: waTest, error: waErr } = await supabase.from("whatsapp_attributions").select("id").limit(1)
  ok("Conexao com banco ativa", !waErr, waErr?.message)

  // Taxonomia
  const { classifyClientChannel } = await import("../app/utils/trafficChannelClassifier.ts")
  const canonical = ["google_ads","microsoft_ads","instagram_ads","instagram_organic","facebook_ads","facebook_organic","meta_ads","tiktok_ads","tiktok_organic","google_organic","other_paid","direct","referral"]
  const samples = [
    { params:{ gclid:"G" }, expected:"google_ads" },
    { params:{ msclkid:"M" }, expected:"microsoft_ads" },
    { params:{ fbclid:"F", utm_source:"instagram" }, expected:"instagram_ads" },
    { params:{ utm_source:"instagram", utm_medium:"organic" }, expected:"instagram_organic" },
    { params:{ fbclid:"F", utm_source:"facebook" }, expected:"facebook_ads" },
    { params:{ utm_source:"facebook", utm_medium:"organic" }, expected:"facebook_organic" },
    { params:{ fbclid:"F" }, expected:"meta_ads" },
    { params:{ ttclid:"T" }, expected:"tiktok_ads" },
    { params:{ utm_source:"tiktok", utm_medium:"organic" }, expected:"tiktok_organic" },
    { params:{ referrer:"https://google.com/search" }, expected:"google_organic" },
    { params:{ utm_source:"linkedin", utm_medium:"paid_social" }, expected:"other_paid" },
    { params:{}, expected:"direct" },
    { params:{ referrer:"https://partner.com" }, expected:"referral" },
  ]
  let taxOk = 0
  for (const s of samples) {
    const got = classifyClientChannel(s.params)
    if (got === s.expected) taxOk++
    else console.log(`  TAXONOMIA FAIL: expected=${s.expected} got=${got}`)
  }
  ok(`Taxonomia 13 canais canonicos (${taxOk}/13)`, taxOk === 13, `${taxOk}/13`)
}

async function verifyFinalCounts() {
  section("CONTAGENS FINAIS E FIXTURES")
  const { count: residF5 } = await supabase.from("lead_clicks").select("*", { count:"exact", head:true }).like("event_id", "F5-%")
  ok("Zero lead_clicks F5 residuais", !residF5, `found=${residF5}`)
  const { count: residWa } = await supabase.from("whatsapp_attributions").select("*", { count:"exact", head:true }).like("short_code", "F5%")
  ok("Zero whatsapp_attributions F5 residuais", !residWa, `found=${residWa}`)
  const { count: residPv } = await supabase.from("page_views").select("*", { count:"exact", head:true }).like("session_id", "F5-%")
  ok("Zero page_views F5 residuais", !residPv, `found=${residPv}`)
  const { count: residLeads } = await supabase.from("leads").select("*", { count:"exact", head:true }).like("submission_id", "F5-%")
  ok("Zero leads F5 residuais", !residLeads, `found=${residLeads}`)

  const { count: pvNow } = await supabase.from("page_views").select("*", { count:"exact", head:true })
  const { count: lcNow } = await supabase.from("lead_clicks").select("*", { count:"exact", head:true })
  const { count: waNow } = await supabase.from("whatsapp_attributions").select("*", { count:"exact", head:true })
  const { count: leadNow } = await supabase.from("leads").select("*", { count:"exact", head:true })

  console.log(`\n  BASELINE: pv=${BASELINE.pv} lc=${BASELINE.lc} wa=${BASELINE.wa} leads=${BASELINE.leads}`)
  console.log(`  FINAL:    pv=${pvNow} lc=${lcNow} wa=${waNow} leads=${leadNow}`)
  console.log(`  DELTA:    pv=+${pvNow-BASELINE.pv} lc=+${lcNow-BASELINE.lc} wa=+${waNow-BASELINE.wa} leads=+${leadNow-BASELINE.leads}`)
  console.log(`  (delta pode ser positivo por trafego real durante os testes)`)
}

async function main() {
  console.log("=".repeat(60))
  console.log("  FASE 5 - HOMOLOGACAO MULTICANAL")
  console.log(`  Inicio: ${new Date().toISOString()}`)
  console.log(`  Baseline: pv=${BASELINE.pv} lc=${BASELINE.lc} wa=${BASELINE.wa} leads=${BASELINE.leads}`)
  console.log("=".repeat(60))

  await verifyBaseState()
  await runMatrixTests()
  await runFormTests()
  await runCrosstoucheTests()
  await verifyFinalCounts()

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  console.log("\n" + "=".repeat(60))
  console.log(`  RESULTADO FINAL: ${stats.pass} PASS | ${stats.fail} FAIL`)
  console.log(`  Duracao: ${elapsed}s`)
  console.log("=".repeat(60))
  process.exit(stats.fail > 0 ? 1 : 0)
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1) })
