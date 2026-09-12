// Validate the approved app graphics and render real UI. No model results or restaurant reviews are fabricated.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright'),sharp=require('sharp');
const {server,until}=require('../tests/helpers.cjs');
(async()=>{const {server:s,url}=await server(),browser=await chromium.launch(),out='test-results/store';fs.mkdirSync(out,{recursive:true});
 try{
  // The same approved PNG is embedded in Android and supplied to Google Play.
  const graphics='store/graphics';
  for(const name of ['PizzaScan-App-Icon-512.png','PizzaScan-Vorstellung-DE-1024x500.png','PizzaScan-Feature-EN-1024x500.png'])fs.copyFileSync(path.join(graphics,name),path.join(out,name));
  assert.deepEqual(fs.readFileSync(path.join(graphics,'PizzaScan-App-Icon-512.png')),fs.readFileSync('app/src/main/res/drawable/pizzascan_icon.png'),'Store and APK use the exact same icon');
  const ctx=await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:3});const page=await ctx.newPage();
  await page.addInitScript(()=>{localStorage.setItem('pizzascan-language-v1','de');localStorage.setItem('pizzascan-settings-v2',JSON.stringify({welcomed:true,model:'clip32',gpsOnStart:false,mapAuto:false}));});
  await page.goto(url);await until(page,()=>PizzaScan.ready);await page.locator('#nav-photo').click();await page.screenshot({path:path.join(out,'01-fotobewertung.png')});
  // An explicitly named example venue demonstrates the editor, with no claims about a real business.
  await page.evaluate(()=>showDraft({placeId:'store-example',name:'Beispielrestaurant',lat:53.55,lng:10,address:''}));
  await page.screenshot({path:path.join(out,'02-rezensionsbaukasten.png')});
  await page.locator('[data-visit-mode=delivery]').click();await page.locator('[data-aspect=delivery][data-choice=late]').click();await page.locator('[data-aspect=delivery][data-detail="30"]').click();
  await page.locator('[data-aspect=delivery]').first().evaluate(el=>{const sheet=document.getElementById('sheet'),box=el.closest('fieldset'),header=document.querySelector('.sheet-top');sheet.scrollTop+=box.getBoundingClientRect().top-sheet.getBoundingClientRect().top-header.getBoundingClientRect().height-18;});await page.screenshot({path:path.join(out,'03-adaptive-bausteine.png')});
  await page.locator('#sheet-close').click();await page.locator('#settings-open').click();await page.locator('#jump-ai').click();await page.screenshot({path:path.join(out,'04-lokale-modelle.png')});
  await page.locator('#sheet-close').click();await page.locator('#nav-map').click();
  try{await until(page,()=>!PizzaScan.diagnostics().mapLoading&&PizzaScan.diagnostics().places>0,45000);await page.locator('#map-fullscreen').click();await until(page,()=>document.querySelectorAll('#map .leaflet-tile-loaded').length>=4,15000);await page.screenshot({path:path.join(out,'05-pizzakarte-vollbild.png')});}catch(e){console.log('Optional live-map Store screenshot omitted: '+e.message);}
  for(const name of fs.readdirSync(out).filter(f=>f.endsWith('.png'))){const b=fs.readFileSync(path.join(out,name)),w=b.readUInt32BE(16),h=b.readUInt32BE(20);if(name.includes('App-Icon')){assert.equal(w,512);assert.equal(h,512);assert.ok(b.length<1024*1024);assert.equal(b[25],6);}else if(name.includes('1024x500')){assert.equal(w,1024);assert.equal(h,500);assert.equal(b[25],2);assert.ok(b.length<=15*1024*1024);}else{assert.equal(w,1080);assert.equal(h,1920);}}
  fs.writeFileSync(path.join(out,'BILDNACHWEIS.txt'),'Das App-Symbol und die deutschen und englischen Vorstellungsgrafiken wurden mit OpenAI-Bildgenerierung erstellt. Die APK verwendet exakt dieselbe Icon-PNG wie das Store-Paket. Die Vorstellungsgrafiken wurden auf 1024 × 500 Pixel exportiert. Screenshots zeigen die unveränderte App-Oberfläche bei 1080 × 1920 Pixeln. Der Rezensionseditor verwendet ausdrücklich ein Beispielrestaurant und beispielhafte Eingaben, keine veröffentlichten Rezensionen oder KI-Fotowerte.\nAlt-Texte:\nIcon: Pizzastück in weißem Standort-Pin, weiße Scan-Ecken auf orangefarbenem Grund.\nFunktionsgrafik: PizzaScan – Pizzakarte, lokale Fotoanalyse und persönliche Rezensionen.\n01: Fotoauswahl und Informationen zur lokalen Fotoanalyse.\n02: Rezensionsbaukasten mit Besuchsart und freiwilligen Bewertungsbausteinen.\n03: Lieferbewertung mit passender Nachfrage zur Verspätung.\n04: Auswahl der drei lokal ausgeführten Bildmodelle.\n05 (falls vorhanden): Vollbildkarte mit echten OpenStreetMap-Daten und Pizzeria-Markern.\n');
  console.log('PASS Play assets: identical APK/512 RGBA icon, two 1024 × 500 RGB feature graphics and four 1080 × 1920 screenshots');
 }finally{await browser.close();s.close();}
})().catch(e=>{console.error(e);process.exit(1)});
