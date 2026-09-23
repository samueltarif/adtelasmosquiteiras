import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
const base=process.env.TELAS_TEST_URL || 'http://127.0.0.1:3118'
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname))
const slugs=(process.env.TELAS_ROUTES || 'portas').split(',')
const keys={portas:'telas_portas',janelas:'telas_janelas','sacadas-e-varandas':'telas_sacadas',removivel:'telas_removiveis','pet-screen':'pet_screen',restaurantes:'telas_restaurantes'}
const params={utm_source:'google',utm_medium:'cpc',utm_campaign:'test-campaign',utm_content:'test-content',utm_term:'test-term',gclid:'local-gclid',gbraid:'local-gbraid',wbraid:'local-wbraid',campaign_id:'123',adgroup_id:'456',creative:'789',matchtype:'e',device:'m',network:'g',target_id:'test-target'}
const browser=await chromium.launch({channel:'msedge',headless:true})
await mkdir('scratch/telas-detail-validation',{recursive:true})
try{
 for(const slug of slugs){
  const context=await browser.newContext();const requests=[],errors=[],warnings=[];let submissions=0
  await context.route('**/*',async r=>{
   const u=new URL(r.request().url())
   if(u.origin!==base)return r.fulfill({body:'',contentType:'application/javascript'})
   if(u.pathname.startsWith('/api/')){
    if(r.request().method()==='POST')requests.push({path:u.pathname,body:r.request().postDataJSON()})
    if(u.pathname==='/api/send-lead'){
     submissions++;return r.fulfill(submissions===1?{status:503,json:{success:false}}:{json:{success:true,leadSaved:true,leadId:'local-test'}})
    }
    return r.fulfill({json:{success:true,count:0,media:[]}})
   }
   return r.continue()
  })
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/hydration|\[Vue warn\]/i.test(m.text()))warnings.push(m.text())})
  for(const width of [360,390,768,1280,1440]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/servicos/telas/'+slug+'?'+new URLSearchParams(params));await page.locator('.td-model-card').first().waitFor();await page.waitForLoadState('networkidle')
   assert.equal(await page.locator('h1').count(),1)
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://www.adtelasmosquiteiras.com.br/servicos/telas/'+slug)
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+slug+' '+width)
   const heroCTA=await page.locator('.td-hero .td-gold').boundingBox();if(width<640)assert.ok(heroCTA.y+heroCTA.height<900,'Hero CTA visible')
   assert.equal(await page.locator(`.td-related-grid a[href="/servicos/telas/${slug}"]`).count(),0)
   const images=await page.locator('img').evaluateAll(els=>els.filter(e=>!e.closest('[role=dialog]')).map(e=>({src:e.getAttribute('src'),width:e.getAttribute('width'),height:e.getAttribute('height'),alt:e.getAttribute('alt')})))
   assert.ok(images.every(e=>e.width&&e.height&&e.alt),'image dimensions/alt')
   await page.locator('#orcamento-servico').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.locator('.td-floating').waitFor({state:'hidden'});assert.equal(await page.locator('.td-floating').isVisible(),false)
   await page.locator('#duvidas summary').first().click();assert.equal(await page.locator('#duvidas details[open]').count(),1)
   await page.locator('.td-project').first().click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'})
   assert.ok(await page.locator('.td-project').first().evaluate(el=>el===document.activeElement),'Lightbox focus restored')
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}))
   if([390,1440].includes(width))await page.screenshot({path:`scratch/telas-detail-validation/${slug}-${width}.png`,fullPage:true})
   console.log('PASS layout '+slug+' '+width)
  }
  await page.evaluate(()=>document.addEventListener('click',e=>{const a=e.target.closest('a');if(a?.href.match(/wa.me|whatsapp.com|tel:/)){window.__testHref=a.href;e.preventDefault()}}))
  const before=requests.filter(r=>r.body.tipo==='whatsapp').length
  await page.locator('.td-hero .td-gold').click();await page.waitForTimeout(200)
  const clicks=requests.filter(r=>r.body.tipo==='whatsapp');assert.equal(clicks.length,before+1)
  const click=clicks.at(-1).body;assert.equal(click.service_key,keys[slug]);assert.equal(click.cta_location,'hero');assert.ok(click.event_id);assert.match(click.short_code,/^[A-Z0-9]{8}$/)
  assert.ok((await page.evaluate(()=>window.__testHref)).includes('Ref'))
  for(const field of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid'])assert.equal(click[field],params[field])
  for(const [from,to]of [['campaign_id','google_campaign_id'],['adgroup_id','google_adgroup_id'],['creative','google_creative_id'],['matchtype','google_match_type'],['network','google_network'],['device','google_device'],['target_id','google_target_id']])assert.equal(click[to],params[from])
  await page.locator('.td-hero .td-outline').click();await page.getByLabel('Nome',{exact:false}).fill('Teste local');await page.getByLabel('WhatsApp / Telefone',{exact:false}).fill('11999999999')
  await page.getByRole('button',{name:'Solicitar Orçamento Grátis',exact:true}).click();await page.getByText('Ocorreu um erro ao enviar seu formulário.',{exact:false}).waitFor()
  assert.equal(await page.evaluate(()=>(window.dataLayer||[]).filter(e=>e.event==='lead_form_success').length),0)
  await page.getByRole('button',{name:'Solicitar Orçamento Grátis',exact:true}).click();await page.waitForURL('**/obrigado')
  assert.equal(await page.evaluate(()=>(window.dataLayer||[]).filter(e=>e.event==='lead_form_success').length),1)
  const leads=requests.filter(r=>r.path==='/api/send-lead');assert.equal(leads.length,2);assert.equal(leads[0].body.submission_id,leads[1].body.submission_id);assert.equal(leads[1].body.conversion_path,'/servicos/telas/'+slug);assert.equal(leads[1].body.gclid,params.gclid);assert.equal(leads[1].body.session_channel,'google_ads')
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  await writeFile(`scratch/telas-detail-validation/${slug}-tracking.json`,JSON.stringify({click,lead:leads[1].body},null,2))
  console.log('PASS WhatsApp Ref/attribution + form retry/idempotency + SEO + console '+slug)
  await context.close()
 }
}finally{await browser.close()}
