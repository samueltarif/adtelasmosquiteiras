import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const base=process.env.TELAS_TEST_URL || 'http://127.0.0.1:3113';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir('scratch/telas-redesign',{recursive:true});
try {
 const context=await browser.newContext();
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.fulfill({body:'',contentType:'application/javascript'});if(u.pathname.startsWith('/api/'))return r.fulfill({json:{success:true,leadSaved:true,leadId:"local-test-only",media:[],count:0}});return r.continue()});
 const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [360,390,412,430,1440]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/servicos/telas?utm_source=google&utm_medium=cpc&gclid=local-test');await page.waitForTimeout(1000);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);
  assert.equal(await page.locator('.service-card').count(),4);
  assert.equal(await page.locator('.mobile-sticky').isVisible(),false);
  await page.screenshot({path:`scratch/telas-redesign/${width}-top.png`});
  await page.evaluate(()=>window.scrollTo({top:document.querySelector('#solucoes').offsetTop+30,behavior:'instant'}));await page.waitForTimeout(250);
  if(width<768)assert.equal(await page.locator('.mobile-sticky').isVisible(),true);
  await page.locator('.more-services summary').click();assert.equal(await page.locator('.extra-row').count(),18);
  await page.locator('.faq summary').first().click();assert.equal(await page.locator('.faq[open]').count(),1);
  await page.locator('#orcamento-telas').scrollIntoViewIfNeeded();await page.waitForTimeout(250);assert.equal(await page.locator('.mobile-sticky').isVisible(),false);
  assert.equal(await page.locator('#quote-name').getAttribute('autocomplete'),'name');
  assert.equal(await page.locator('a[href^="tel:"]').count(),2);
  assert.ok(await page.locator('a[href^="https://wa.me/"]').count()>2);
  await page.locator('.more-services summary').click();await page.screenshot({path:`scratch/telas-redesign/${width}-full.png`,fullPage:true});
  console.log(`PASS ${width}px: layout, links, disclosures, form and sticky`);
 }
 await page.locator('#quote-name').fill('Teste local');
 await page.locator('#quote-phone').fill('11999999999');
 await page.locator('#quote-cep').fill('01001-000');
 await page.locator('#quote-installation').selectOption('Janelas');
 await page.getByRole('button',{name:'Solicitar orçamento gratuito'}).click();
 await page.getByRole('heading',{name:'Pedido recebido!'}).waitFor();
 assert.equal(await page.evaluate(()=>(window.dataLayer||[]).filter(e=>e.event==='lead_form_success').length),1);
 await page.locator('.service-card').first().click();await page.waitForURL('**/servicos/telas/janelas');
 console.log('PASS: form success emits once; whole card navigates');
 assert.deepEqual(errors,[]);console.log('PASS: no browser exceptions');
}finally{await browser.close()}


