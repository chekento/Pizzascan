const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {server,until,mapFixtures}=require('./helpers.cjs');
(async()=>{
 const {server:s,url}=await server(),browser=await chromium.launch();
 const ctx=await browser.newContext({viewport:{width:393,height:820}}),page=await ctx.newPage(),errors=[];
 fs.mkdirSync('test-results',{recursive:true});
 await mapFixtures(page);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await ctx.addInitScript(()=>{
  window.modelCalls=[];window.workerStarts=0;
  window.Worker=class{
   constructor(){workerStarts++;}
   postMessage(m){modelCalls.push(m);setTimeout(()=>{this.onmessage({data:{type:'loaded',id:m.id}});if(m.type==='load')this.onmessage({data:{type:'ready',id:m.id}});else{const scores=PizzaAnalysis.results(Array.from({length:100},(_,i)=>i%4===2?3:0));this.onmessage({data:{type:'result',scores,overall:PizzaAnalysis.overall(scores),method:PizzaAnalysis.method,createdAt:new Date().toISOString()}});}},20);}
   terminate(){}
  };
 });
 const openAI=async()=>{await page.locator('#settings-open').click();await page.locator('#jump-ai').click();};
 try{
  await page.goto(url);await until(page,()=>PizzaScan.ready);
  await page.locator('#welcome-model-info').click();assert.match(await page.locator('#sheet-body').innerText(),/CLIP ViT-B\/32/);
  await page.locator('#model-info-close').click();await page.locator('#welcome-start').click();
  assert.equal(await page.evaluate(()=>workerStarts),0,'Reading the welcome information must not start a model');
  await openAI();await page.locator('#download-model').click();
  assert.equal(await page.evaluate(()=>modelCalls.length),0);assert.equal(await page.evaluate(()=>PizzaScan.diagnostics().busy),false);
  assert.match(await page.locator('#sheet-body').innerText(),/nicht in der APK enthalten/);
  await page.screenshot({path:'test-results/offline-model-notice.png'});
  await page.locator('#model-download-later').click();assert.equal(await page.evaluate(()=>workerStarts),0,'Later must not start a worker');
  await openAI();await page.locator('input[value=siglip]').check();
  assert.match(await page.locator('#settings-model-explanation').innerText(),/SigLIP Base Patch16-224/);
  assert.match(await page.locator('#settings-model-explanation').innerText(),/210 MB/);
  assert.equal(await page.evaluate(()=>modelCalls.length),0,'Changing the selected model must not download it');
  await page.locator('#download-model').click();await page.evaluate(()=>PizzaScan.back());
  assert.equal(await page.evaluate(()=>modelCalls.length),0,'Android Back cancels the pending download');
  await openAI();await page.locator('#download-model').click();await page.locator('#confirm-model-download').click();
  await until(page,()=>!PizzaScan.diagnostics().busy);assert.deepEqual(await page.evaluate(()=>modelCalls.map(m=>({id:m.id,type:m.type}))),[{id:'siglip',type:'load'}]);
  await page.reload();await until(page,()=>PizzaScan.ready);await page.locator('#nav-photo').click();
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=100;c.height=100;return c.toDataURL().split(',')[1];});
  await page.locator('#photo-input').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await until(page,()=>!document.getElementById('analyze').disabled);
  await page.locator('#analyze').click();await until(page,()=>PizzaScan.diagnostics().reports===1);
  assert.equal(await page.locator('#confirm-model-download').count(),0,'Saved per-model approval survives reload');
  await page.locator('#sheet-close').click();await openAI();await page.locator('input[value=clip16]').check();await page.locator('#settings-save').click();await page.locator('#analyze').click();
  assert.equal(await page.locator('#confirm-model-download').count(),1,'A different model needs its own confirmation');
  assert.match(await page.locator('#sheet-body').innerText(),/CLIP ViT-B\/16/);
  await page.setViewportSize({width:740,height:393});await page.locator('#confirm-model-download').scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/offline-model-landscape.png'});
  await page.locator('#confirm-model-download').click();await until(page,()=>PizzaScan.diagnostics().reports===2);await page.locator('#sheet-close').click();
  await page.setViewportSize({width:393,height:820});await openAI();await page.locator('#clear-models').click();await until(page,()=>document.getElementById('toast').textContent==='Modellcache entfernt');
  await page.locator('#settings-save').click();await page.locator('#analyze').click();
  assert.equal(await page.locator('#confirm-model-download').count(),1,'Removing the model cache resets download approval');
  assert.equal(await page.evaluate(()=>PizzaScan.diagnostics().reports),2,'Removing models preserves saved photo reports');
  assert.deepEqual(errors,[]);console.log('PASS model information, no worker before consent, cancel/back, model-specific approval, reload, cache reset, saved photos and landscape');
 }catch(e){await page.screenshot({path:'test-results/model-consent-failure.png'}).catch(()=>{});throw e;}finally{await browser.close();s.close();}
})().catch(e=>{console.error(e);process.exit(1)});
