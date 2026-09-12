const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');
const expected={
 en:{review:['The service was very friendly.','I waited about 40 minutes.','It was too expensive for me'],model:'private persistent app storage',privacy:'PizzaScan Privacy Policy'},
 it:{review:['Il servizio è stato molto cordiale.','Ho aspettato circa 40 minuti.','troppo caro'],model:'memoria privata persistente',privacy:'Informativa sulla privacy di PizzaScan'},
 es:{review:['El trato fue muy amable.','Esperé unos 40 minutos.','demasiado caro'],model:'almacenamiento privado persistente',privacy:'Política de privacidad de PizzaScan'},
 fr:{review:['Le service était très aimable.','J’ai attendu environ 40 minutes.','trop cher'],model:'stockage privé persistant',privacy:'Politique de confidentialité de PizzaScan'}
};
(async()=>{const {server:s,url}=await server(),browser=await chromium.launch();try{
 for(const language of Object.keys(expected)){
  const ctx=await browser.newContext({viewport:{width:393,height:851}});await ctx.addInitScript(code=>localStorage.setItem('pizzascan-language-v1',code),language);const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await mapFixtures(page);
  await page.goto(url);await until(page,()=>PizzaScan.ready&&PizzaI18n&&PizzaReview?.__fullI18n&&PizzaModelInfo?.__fullI18n);
  const generated=await page.evaluate(()=>PizzaReview.generate({mode:'dinein',tone:'personal',length:'detailed',variant:0,dish:'',selected:{service:'friendly',wait:'long',value:'expensive'},details:{wait:'40'},notes:'',own:7.8,returnVisit:'yes'}));
  for(const phrase of expected[language].review)assert.match(generated,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),language+' review phrase');
  assert.doesNotMatch(generated,/freundlich|Minuten gewartet|zu teuer|persönliche Bewertung|würde wiederkommen/i,language+' review has no German residue');
  const modelHtml=await page.evaluate(()=>PizzaModelInfo.html(PizzaModelInfo.get('clip32')));assert.ok(modelHtml.includes(expected[language].model),language+' persistent model disclosure');assert.doesNotMatch(modelHtml,/Warum wird ein Modell|zusätzlicher Erstdownload|App-Cache/i,language+' model copy not German/old cache');
  await page.locator('#welcome-start').click();await page.evaluate(()=>showPrivacy());await until(page,()=>document.getElementById('privacy-close'));assert.ok((await page.locator('#sheet-body').innerText()).includes(expected[language].privacy),language+' privacy heading');assert.match(await page.locator('#sheet-body').innerText(),new RegExp(expected[language].model.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),language+' privacy persistent storage');await page.locator('#privacy-close').click();
  assert.deepEqual(errors,[],language+' runtime errors');await ctx.close();
 }
 console.log('PASS localized review output, offline-model disclosure and privacy in en/it/es/fr');
 }finally{await browser.close();s.close();}})().catch(e=>{console.error(e);process.exit(1)});
