const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');
const expected={
 en:{review:['The service was very friendly.','I waited about 40 minutes.','It was too expensive for me'],model:'private persistent app storage',privacy:'PizzaScan Privacy Policy',fallback:'Nominatim is not used for autocomplete'},
 it:{review:['Il servizio è stato molto cordiale.','Ho aspettato circa 40 minuti.','troppo caro'],model:'memoria privata persistente',privacy:'Informativa sulla privacy di PizzaScan',fallback:'Nominatim non viene usato per il completamento automatico'},
 es:{review:['El trato fue muy amable.','Esperé unos 40 minutos.','demasiado caro'],model:'almacenamiento privado persistente',privacy:'Política de privacidad de PizzaScan',fallback:'Nominatim no se usa para autocompletar'},
 fr:{review:['Le service était très aimable.','J’ai attendu environ 40 minutes.','trop cher'],model:'stockage privé persistant',privacy:'Politique de confidentialité de PizzaScan',fallback:'Nominatim n’est pas utilisé pour l’autocomplétion'}
};
(async()=>{const {server:s,url}=await server(),browser=await chromium.launch();try{
 for(const language of Object.keys(expected)){
  const ctx=await browser.newContext({viewport:{width:393,height:851}});await ctx.addInitScript(code=>localStorage.setItem('pizzascan-language-v1',code),language);const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await mapFixtures(page);
  await page.goto(url);await until(page,()=>PizzaScan.ready&&PizzaI18n&&PizzaReview?.__fullI18n&&PizzaModelInfo?.__fullI18n&&showPrivacy?.__googleReviews&&globalThis.GoogleReviewsUI);
  const generated=await page.evaluate(()=>PizzaReview.generate({mode:'dinein',tone:'personal',length:'detailed',variant:0,dish:'',selected:{service:'friendly',wait:'long',value:'expensive'},details:{wait:'40'},notes:'',own:7.8,returnVisit:'yes'}));
  for(const phrase of expected[language].review)assert.match(generated,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),language+' review phrase');
  assert.doesNotMatch(generated,/freundlich|Minuten gewartet|zu teuer|persönliche Bewertung|würde wiederkommen/i,language+' review has no German residue');
  const modelHtml=await page.evaluate(()=>PizzaModelInfo.html(PizzaAnalysis.models.find(model=>model.id==='clip32')));assert.ok(modelHtml.includes(expected[language].model),language+' persistent model disclosure');assert.doesNotMatch(modelHtml,/Warum wird ein Modell|zusätzlicher Erstdownload|App-Cache/i,language+' model copy not German/old cache');
  await page.locator('#welcome-start').click();await page.evaluate(()=>showPrivacy());await until(page,()=>document.getElementById('privacy-close'));
  const privacyText=await page.locator('#sheet-body').innerText();
  assert.ok(privacyText.includes(expected[language].privacy),language+' privacy heading');
  assert.match(privacyText,/2\.3\.4/,language+' privacy version');
  assert.match(privacyText,/Nominatim/i,language+' privacy names fallback provider');
  assert.ok(privacyText.includes(expected[language].fallback),language+' privacy limits Nominatim to submitted search');
  assert.match(privacyText,/Google Maps|Google Places/i,language+' privacy explains optional Google reviews');
  assert.match(privacyText,language==='en'?/private persistent (?:Android )?app storage/i:new RegExp(expected[language].model,'i'),language+' privacy persistent storage');
  await page.locator('#privacy-close').click();assert.deepEqual(errors,[],language+' runtime errors');await ctx.close();
 }
 const deCtx=await browser.newContext({viewport:{width:393,height:851}}),dePage=await deCtx.newPage(),deErrors=[];dePage.on('pageerror',e=>deErrors.push(e.message));await mapFixtures(dePage);await dePage.goto(url);await until(dePage,()=>PizzaScan.ready&&showPrivacy?.__googleReviews&&globalThis.GoogleReviewsUI);await dePage.locator('#welcome-start').click();await dePage.evaluate(()=>showPrivacy());await until(dePage,()=>document.getElementById('privacy-close'));const dePrivacy=await dePage.locator('#sheet-body').innerText();assert.match(dePrivacy,/Version 2\.3\.4/,'de privacy version');assert.match(dePrivacy,/Nominatim-Fallback/,'de privacy fallback section');assert.match(dePrivacy,/nicht für Autocomplete/i,'de privacy excludes autocomplete');assert.match(dePrivacy,/keine Standortkoordinaten/i,'de privacy states fallback adds no coordinates');assert.match(dePrivacy,/Google Maps|Google Places/i,'de privacy explains optional Google reviews');assert.deepEqual(deErrors,[],'de privacy runtime errors');await deCtx.close();
 console.log('PASS localized review output, offline-model disclosure and 2.3.4 Photon/Nominatim + optional Google Reviews privacy in de/en/it/es/fr');
 }finally{await browser.close();s.close();}})().catch(e=>{console.error(e);process.exit(1)});
