// Render the existing vector icon and real UI. No model results or restaurant reviews are fabricated.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {server,until}=require('../tests/helpers.cjs');
(async()=>{const {server:s,url}=await server(),browser=await chromium.launch(),out='test-results/store';fs.mkdirSync(out,{recursive:true});
 try{
  const vector=fs.readFileSync('app/src/main/res/drawable/ic_pizza.xml','utf8');
  const shapes=[...vector.matchAll(/<path ([^>]+)\/>/g)].map(m=>'<path '+m[1].replaceAll('android:fillColor','fill').replaceAll('android:pathData','d').replaceAll('android:strokeColor','stroke').replaceAll('android:strokeWidth','stroke-width').replaceAll('android:strokeLineCap','stroke-linecap')+'/>').join('');
  const icon=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 108 108"><rect width="108" height="108" fill="#ff4b2b"/>${shapes}</svg>`;
  const feature=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500"><rect width="1024" height="500" fill="#f7f5f0"/><circle cx="827" cy="251" r="156" fill="#ff4b2b"/><g transform="translate(658 78) scale(3.15)">${shapes}</g><g fill="#27271f" font-family="sans-serif"><text x="72" y="169" font-size="61" font-weight="700">PizzaScan</text><text x="72" y="244" font-size="36" font-weight="600">Gute Pizza. Deine Meinung.</text><text x="72" y="311" font-size="23">Pizzakarte · lokale Fotoanalyse</text><text x="72" y="349" font-size="23">Rezensionen aus deinem Erlebnis</text></g><rect x="72" y="391" width="96" height="7" rx="3" fill="#e94e27"/></svg>`;
  const design=await browser.newPage();
  for(const [name,svg,width,height,alpha] of [['icon-512',icon,512,512,true],['feature-1024x500',feature,1024,500,false]]){fs.writeFileSync(path.join(out,name+'.svg'),svg);await design.setViewportSize({width,height});await design.setContent(`<style>html,body{margin:0}</style>${svg}`);await design.screenshot({path:path.join(out,name+'.png'),omitBackground:alpha});}
  await design.close();
  const ctx=await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:3});const page=await ctx.newPage();
  await page.addInitScript(()=>localStorage.setItem('pizzascan-settings-v2',JSON.stringify({welcomed:true,model:'clip32',gpsOnStart:false,mapAuto:false})));
  await page.goto(url);await until(page,()=>PizzaScan.ready);await page.locator('#nav-photo').click();await page.screenshot({path:path.join(out,'01-fotobewertung.png')});
  // An explicitly named example venue demonstrates the editor, with no claims about a real business.
  await page.evaluate(()=>showDraft({placeId:'store-example',name:'Beispielrestaurant',lat:53.55,lng:10,address:''}));
  await page.screenshot({path:path.join(out,'02-rezensionsbaukasten.png')});
  await page.locator('[data-visit-mode=delivery]').click();await page.locator('[data-aspect=delivery][data-choice=late]').click();await page.locator('[data-aspect=delivery][data-detail="30"]').click();
  await page.locator('[data-aspect=delivery]').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'03-adaptive-bausteine.png')});
  await page.locator('#sheet-close').click();await page.locator('#settings-open').click();await page.locator('#jump-ai').click();await page.screenshot({path:path.join(out,'04-lokale-modelle.png')});
  for(const name of fs.readdirSync(out).filter(f=>f.endsWith('.png'))){const b=fs.readFileSync(path.join(out,name)),w=b.readUInt32BE(16),h=b.readUInt32BE(20);if(name.startsWith('icon')){assert.equal(w,512);assert.equal(h,512);assert.ok(b.length<1024*1024);assert.equal(b[25],6);}else if(name.startsWith('feature')){assert.equal(w,1024);assert.equal(h,500);assert.equal(b[25],2);}else{assert.equal(w,1080);assert.equal(h,1920);}}
  fs.writeFileSync(path.join(out,'BILDNACHWEIS.txt'),'Icon und Funktionsgrafik basieren auf dem bestehenden PizzaScan-Android-Vektor. Screenshots zeigen die unveränderte App-Oberfläche bei 1080 × 1920 Pixeln. Der Rezensionseditor verwendet ausdrücklich ein Beispielrestaurant und beispielhafte Eingaben, keine veröffentlichten Rezensionen oder KI-Fotowerte.\nAlt-Texte:\nIcon: Pizzastück auf orangefarbenem Grund.\nFunktionsgrafik: PizzaScan – Pizzakarte, lokale Fotoanalyse und persönliche Rezensionen.\n01: Fotoauswahl und Informationen zur lokalen Fotoanalyse.\n02: Rezensionsbaukasten mit Besuchsart und freiwilligen Bewertungsbausteinen.\n03: Lieferbewertung mit passender Nachfrage zur Verspätung.\n04: Auswahl der drei lokal ausgeführten Bildmodelle.\n');
  console.log('PASS Play assets: 512 RGBA icon, 1024 × 500 RGB feature and four 1080 × 1920 screenshots');
 }finally{await browser.close();s.close();}
})().catch(e=>{console.error(e);process.exit(1)});
