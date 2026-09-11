(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PizzaReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 // Only explicit personal observations enter this model. Photo scores are never read.
 const modes={dinein:'Vor Ort',takeaway:'Abholung',delivery:'Lieferung'};
 const options=(values)=>values.map(([id,label,text])=>({id,label,text}));
 const aspects=[
  {id:'food',label:'Geschmack',icon:'🍕',choices:options([['great','Sehr lecker','Das Essen hat mir sehr gut geschmeckt.'],['okay','In Ordnung','Geschmacklich fand ich das Essen in Ordnung.'],['weak','Nicht mein Geschmack','Das Essen hat meinen Geschmack nicht getroffen.']])},
  {id:'crust',label:'Pizzateig',icon:'🥖',choices:options([['airy','Luftig','Der Pizzateig war schön luftig.'],['crisp','Knusprig','Der Pizzateig war angenehm knusprig.'],['soft','Zu weich','Der Pizzateig war mir zu weich.'],['dry','Zu trocken','Der Pizzateig war mir zu trocken.']])},
  {id:'toppings',label:'Belag',icon:'🍅',choices:options([['balanced','Gut abgestimmt','Der Belag war für mich gut abgestimmt.'],['plenty','Großzügig','Die Pizza war großzügig belegt.'],['sparse','Zu wenig','Der Belag war mir zu sparsam.']])},
  {id:'temperature',label:'Temperatur',icon:'♨️',choices:options([['hot','Angenehm heiß','Das Essen war angenehm heiß.'],['warm','Lauwarm','Das Essen war nur lauwarm.'],['cold','Zu kalt','Das Essen war mir zu kalt.']])},
  {id:'service',label:'Service',icon:'🤝',modes:['dinein','takeaway'],choices:options([['friendly','Sehr freundlich','Ich wurde sehr freundlich bedient.'],['attentive','Aufmerksam','Der Service war aufmerksam.'],['okay','Ordentlich','Der Service war in Ordnung.'],['inattentive','Unaufmerksam','Ich hätte mir einen aufmerksameren Service gewünscht.']])},
  {id:'wait',label:'Wartezeit',icon:'⏱️',modes:['dinein','takeaway'],choices:options([['quick','Kurz','Die Wartezeit war kurz.'],['fair','Angemessen','Die Wartezeit fand ich angemessen.'],['long','Zu lang','Die Wartezeit war mir zu lang.']]),followup:{when:'long',label:'Wie lange ungefähr?',choices:options([['20','Etwa 20 Minuten','Ich habe ungefähr 20 Minuten gewartet.'],['40','Etwa 40 Minuten','Ich habe ungefähr 40 Minuten gewartet.'],['60','Über eine Stunde','Ich habe über eine Stunde gewartet.']])}},
  {id:'value',label:'Preis-Leistung',icon:'💶',choices:options([['great','Sehr gut','Das Preis-Leistungs-Verhältnis fand ich sehr gut.'],['fair','Fair','Für die gebotene Leistung fand ich den Preis fair.'],['expensive','Zu teuer','Für die gebotene Leistung war es mir zu teuer.']])},
  {id:'ambience',label:'Ambiente',icon:'🪴',modes:['dinein'],choices:options([['cozy','Gemütlich','Ich fand das Ambiente gemütlich.'],['stylish','Schön gestaltet','Die Einrichtung hat mir gut gefallen.'],['plain','Schlicht','Das Ambiente war schlicht.'],['uncomfortable','Ungemütlich','Ich habe das Ambiente als ungemütlich empfunden.']])},
  {id:'noise',label:'Lautstärke',icon:'💬',modes:['dinein'],choices:options([['calm','Ruhig','Es war angenehm ruhig.'],['lively','Lebhaft','Im Restaurant ging es lebhaft zu.'],['loud','Zu laut','Die Lautstärke war mir zu hoch.']])},
  {id:'cleanliness',label:'Sauberkeit vor Ort',icon:'✨',modes:['dinein','takeaway'],choices:options([['clean','Sauberer Eindruck','Der für mich sichtbare Bereich machte einen sauberen Eindruck.'],['table','Tisch nicht sauber','Mein Tisch war bei der Ankunft nicht sauber.']])},
  {id:'selection',label:'Speisenauswahl',icon:'📋',choices:options([['varied','Vielseitig','Die Speisenauswahl fand ich vielseitig.'],['vegetarian','Vegetarische Auswahl','Ich habe passende vegetarische Gerichte auf der Karte gefunden.'],['vegan','Vegane Auswahl','Ich habe passende vegane Gerichte auf der Karte gefunden.'],['limited','Wenig Auswahl','Die Auswahl war für mich zu klein.']])},
  {id:'access',label:'Zugang',icon:'🚪',modes:['dinein','takeaway'],choices:options([['stepfree','Stufenloser Eingang','Ich konnte den Eingang ohne Stufen erreichen.'],['steps','Stufen am Eingang','Am Eingang musste ich Stufen überwinden.']])},
  {id:'delivery',label:'Lieferung',icon:'🚲',modes:['delivery'],choices:options([['ontime','Pünktlich','Die Lieferung kam zur angekündigten Zeit.'],['early','Früher als angekündigt','Die Lieferung kam früher als angekündigt.'],['late','Verspätet','Die Lieferung kam später als angekündigt.']]),followup:{when:'late',label:'Wie groß war die Verspätung?',choices:options([['15','Etwa 15 Minuten','Die Lieferung verspätete sich um ungefähr 15 Minuten.'],['30','Etwa 30 Minuten','Die Lieferung verspätete sich um ungefähr 30 Minuten.'],['60','Über eine Stunde','Die Lieferung verspätete sich um über eine Stunde.']])}},
  {id:'packaging',label:'Verpackung',icon:'📦',modes:['takeaway','delivery'],choices:options([['good','Gut verpackt','Das Essen war gut verpackt.'],['excess','Viel Verpackung','Die Menge an Verpackung fand ich zu groß.'],['damaged','Beschädigt','Die Verpackung war beschädigt.']])}
 ];
 const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
 function normalize(input={}){
  const mode=Object.hasOwn(modes,input.mode)?input.mode:'dinein',selected={},details={};
  for(const a of aspects){if(a.choices.some(c=>c.id===input.selected?.[a.id]))selected[a.id]=input.selected[a.id];if(a.followup?.choices.some(c=>c.id===input.details?.[a.id]))details[a.id]=input.details[a.id];}
  return {version:1,mode,selected,details,own:Number.isFinite(input.own)&&input.own>=.1&&input.own<=10?Math.round(input.own*10)/10:null,visited:input.visited===true,notes:text(input.notes,1200),dish:text(input.dish,100),returnVisit:['yes','maybe','no'].includes(input.returnVisit)?input.returnVisit:'',length:['short','standard','detailed'].includes(input.length)?input.length:'standard',tone:input.tone==='factual'?'factual':'personal',variant:Number.isInteger(input.variant)?Math.abs(input.variant)%3:0};
 }
 function available(mode){return aspects.filter(a=>!a.modes||a.modes.includes(mode));}
 function generate(input){
  const r=normalize(input),personal=r.tone==='personal',parts=[];
  const starts={dinein:['Ich war vor Ort essen.','Ich habe das Restaurant besucht.','Ich habe vor Ort gegessen.'],takeaway:['Ich habe mein Essen abgeholt.','Ich habe zum Mitnehmen bestellt.','Ich habe meine Bestellung selbst abgeholt.'],delivery:['Ich habe mir das Essen liefern lassen.','Ich habe eine Lieferung bestellt.','Meine Bestellung wurde geliefert.']};
  if(r.length!=='short')parts.push(personal?starts[r.mode][r.variant]:`Bestellung: ${modes[r.mode]}.`);
  if(r.dish.trim())parts.push(`Bestellt habe ich: ${r.dish.trim()}.`.replace(/([.!?])\.$/,'$1'));
  for(const a of available(r.mode)){
   const choice=a.choices.find(c=>c.id===r.selected[a.id]);if(!choice)continue;
   const detail=a.followup?.when===choice.id?a.followup.choices.find(c=>c.id===r.details[a.id]):null;
   parts.push(detail?detail.text:choice.text);
  }
  if(r.notes.trim())parts.push(r.notes.trim());
  if(r.own!==null)parts.push(`${personal?'Meine persönliche Bewertung':'Gesamtbewertung'}: ${r.own.toFixed(1).replace('.',',')} von 10 Punkten.`);
  if(r.returnVisit)parts.push((r.mode==='dinein'?{yes:'Ich würde wiederkommen.',maybe:'Ob ich wiederkomme, weiß ich noch nicht.',no:'Ich würde eher nicht wiederkommen.'}:{yes:'Ich würde wieder hier bestellen.',maybe:'Ob ich noch einmal hier bestelle, weiß ich noch nicht.',no:'Ich würde eher nicht noch einmal hier bestellen.'})[r.returnVisit]);
  return parts.join(r.length==='detailed'?'\n\n':' ');
 }
 return {modes,aspects,available,normalize,generate};
});
