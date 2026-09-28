/**
 * scripts/test_f5_helpers.mjs
 * Utilitarios compartilhados para Fase 5 - Homologacao Multicanal
 */
let createClient
try {
  const mod = await import("@supabase/supabase-js")
  createClient = mod.createClient
} catch {
  const mod = await import("file:///C:/Users/samue/node_modules/@supabase/supabase-js/dist/main/index.js")
  createClient = mod.createClient
}

export const SUPABASE_URL = process.env.SUPABASE_URL || "https://axjqhxpejwkuabeaoyaz.supabase.co"
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY not set"); process.exit(1) }

export const supabase = createClient(SUPABASE_URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export const APP_URL = "http://localhost:3001"
export const stats = { pass: 0, fail: 0 }

export function ok(label, cond, detail = "") {
  if (cond) { console.log(`  OK  ${label}${detail ? " | " + detail : ""}`); stats.pass++ }
  else       { console.log(`  ERR ${label}${detail ? " | " + detail : ""}`); stats.fail++ }
  return cond
}

export function section(title) {
  console.log("\n" + "=".repeat(60))
  console.log("  " + title)
  console.log("=".repeat(60))
}

export const BASE_PAYLOAD = {
  p_visitor_id: "F5-VISITOR", p_session_id: "F5-SESSION",
  p_origem: "/", p_cta_location: "hero", p_service_key: "telas-mosquiteiras",
  p_service_name: "Telas Mosquiteiras", p_landing_path: "/",
  p_device_type: "desktop", p_google_device: null, p_is_bot: false,
  p_bot_name: null, p_user_agent: "F5-TestAgent/1.0", p_ip_hash: null,
  p_channel: "direct", p_utm_source: null, p_utm_medium: null,
  p_utm_campaign: null, p_utm_content: null, p_utm_term: null,
  p_google_campaign_id: null, p_google_adgroup_id: null, p_google_creative_id: null,
  p_google_match_type: null, p_google_network: null, p_google_target_id: null,
  p_gclid: null, p_gbraid: null, p_wbraid: null, p_referrer: null,
  p_fbclid: null, p_msclkid: null,
  p_meta_campaign_id: null, p_meta_adset_id: null, p_meta_ad_id: null, p_meta_placement: null,
  p_ttclid: null, p_tiktok_campaign_id: null, p_tiktok_adgroup_id: null,
  p_tiktok_ad_id: null, p_tiktok_creative_id: null, p_tiktok_placement: null,
}

export async function callRpcV3(overrides = {}) {
  const { data, error } = await supabase.rpc("create_whatsapp_click_attribution_atomic_v3", { ...BASE_PAYLOAD, ...overrides })
  return { data, error }
}

export async function trackVisit(params) {
  try {
    const res = await fetch(`${APP_URL}/api/track-visit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) })
    return { ok: res.ok, status: res.status, data: await res.json() }
  } catch (e) { return { ok: false, status: 0, data: null, error: e.message } }
}

export async function sendLeadApi(params) {
  try {
    const res = await fetch(`${APP_URL}/api/send-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    })
    return { ok: res.ok, status: res.status, data: await res.json() }
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e.message }
  }
}

export async function cleanupF5(eventIds = [], shortCodes = [], submissionIds = []) {
  if (shortCodes.length) {
    const { data: attrs } = await supabase.from("whatsapp_attributions").select("id,lead_click_id").in("short_code", shortCodes)
    if (attrs?.length) {
      const lcIds = attrs.map(a => a.lead_click_id).filter(Boolean)
      await supabase.from("whatsapp_attributions").delete().in("id", attrs.map(a => a.id))
      if (lcIds.length) await supabase.from("lead_clicks").delete().in("id", lcIds)
    }
  }
  if (eventIds.length) {
    const { data: lcs } = await supabase.from("lead_clicks").select("id").in("event_id", eventIds)
    if (lcs?.length) {
      const lcIds = lcs.map(l => l.id)
      await supabase.from("whatsapp_attributions").delete().in("lead_click_id", lcIds)
      await supabase.from("lead_clicks").delete().in("id", lcIds)
    }
  }
  if (submissionIds.length) {
    await supabase.from("leads").delete().in("submission_id", submissionIds)
  }
}

export async function cleanupLeads(emails = []) {
  if (emails.length) await supabase.from("leads").delete().in("email", emails)
}

export async function cleanupPageViews(sessionIds = []) {
  if (sessionIds.length) await supabase.from("page_views").delete().in("session_id", sessionIds)
}

export async function getLeadClick(eventId) {
  const { data } = await supabase.from("lead_clicks").select("*").eq("event_id", eventId).single()
  return data
}

export async function getAttribution(shortCode) {
  const { data } = await supabase.from("whatsapp_attributions").select("*").eq("short_code", shortCode).single()
  return data
}

export async function getPageView(sessionId) {
  const { data } = await supabase.from("page_views").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1)
  return data?.[0] || null
}

export async function getLead(email) {
  const { data } = await supabase.from("leads").select("*").eq("email", email).single()
  return data
}

export async function getLeadBySubmissionId(submissionId) {
  const { data } = await supabase.from("leads").select("*").eq("submission_id", submissionId).single()
  return data
}

