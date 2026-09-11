(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PizzaAnalysis=api;})(globalThis,function(){
'use strict';
const models=[
 {id:'clip32',name:'CLIP B/32',fullName:'CLIP ViT-B/32',developer:'OpenAI',downloadMB:160,repo:'Xenova/clip-vit-base-patch32',note:'Standard · schneller Einstieg · ca. 160 MB',family:'clip'},
 {id:'clip16',name:'CLIP B/16',fullName:'CLIP ViT-B/16',developer:'OpenAI',downloadMB:160,repo:'Xenova/clip-vit-base-patch16',note:'Feinere Bildaufteilung · ca. 160 MB',family:'clip'},
 {id:'siglip',name:'SigLIP B/16',fullName:'SigLIP Base Patch16-224',developer:'Google',downloadMB:210,repo:'Xenova/siglip-base-patch16-224',note:'Anderes Bild-Sprach-Modell · ca. 210 MB',family:'siglip'}
];
// These are visible attributes, never sensory or food-safety judgments.
const rows=[
 ['Randbräunung','Rand','an unbrowned pale pizza crust','a lightly browned pizza crust','a golden brown pizza crust','an evenly golden brown pizza crust'],
 ['Randform','Rand','a collapsed irregular pizza rim','an uneven pizza rim','a well formed pizza rim','a beautifully defined pizza rim'],
 ['Randvolumen','Rand','a flat compressed pizza rim','a slightly raised pizza rim','a nicely raised pizza rim','an airy well risen pizza rim'],
 ['Randblasen','Rand','a dense smooth pizza rim without bubbles','a pizza rim with few bubbles','a pizza rim with well developed bubbles','a pizza rim with a balanced pattern of airy bubbles'],
 ['Randintegrität','Rand','a torn broken pizza crust','a partly damaged pizza crust','an intact pizza crust','a neatly intact pizza crust all around'],
 ['Oberflächenbräunung','Backbild','a pale underbrowned pizza surface','a lightly browned pizza surface','a golden baked pizza surface','an evenly golden baked pizza surface'],
 ['Verkohlungsverteilung','Backbild','a pizza covered in black burned patches','a pizza with large dark charred patches','a pizza with small scattered charred spots','a pizza with subtle balanced charred spots'],
 ['Backgleichmäßigkeit','Backbild','a pizza with extremely uneven browning','a pizza with uneven browning','a pizza with mostly even browning','a pizza with beautifully even browning'],
 ['Oberflächenstruktur','Backbild','a visually flat featureless pizza surface','a pizza surface with little texture','a pizza surface with distinct baked texture','a pizza surface with rich well defined baked texture'],
 ['Rand-Mitte-Kontrast','Backbild','a pizza with no visible distinction between rim and middle','a pizza with a poorly defined rim and middle','a pizza with a distinct rim and middle','a pizza with a clean appealing contrast between rim and middle'],
 ['Käseschmelze','Belag','a pizza with unmelted clumps of cheese','a pizza with partly melted cheese','a pizza with well melted cheese','a pizza with smoothly melted cheese'],
 ['Käseverteilung','Belag','a pizza with cheese piled on one side','a pizza with patchy cheese coverage','a pizza with balanced cheese coverage','a pizza with evenly distributed cheese'],
 ['Saucenverteilung','Belag','a pizza with sauce pooled on one side','a pizza with patchy sauce coverage','a pizza with balanced sauce coverage','a pizza with evenly distributed visible sauce'],
 ['Belagverteilung','Belag','a pizza with toppings piled on one side','a pizza with unevenly scattered toppings','a pizza with balanced toppings','a pizza with evenly arranged toppings'],
 ['Belagabgrenzung','Belag','a pizza with unrecognizable muddled toppings','a pizza with poorly defined toppings','a pizza with recognizable distinct toppings','a pizza with clearly defined individual toppings'],
 ['Farbvielfalt','Komposition','a pizza with dull monochromatic colors','a pizza with limited color contrast','a pizza with appealing color contrast','a pizza with rich harmonious contrasting colors'],
 ['Formbalance','Komposition','a badly misshapen pizza','a pizza with an unbalanced overall shape','a pizza with a balanced overall shape','a pizza with a harmonious overall shape'],
 ['Proportion Rand/Mitte','Komposition','a pizza with a very disproportionate rim','a pizza with an unbalanced rim to center ratio','a pizza with a balanced rim to center ratio','a pizza with harmonious rim and center proportions'],
 ['Visuelle Ordnung','Komposition','a pizza with messy chaotic presentation','a pizza with rather untidy presentation','a pizza with tidy presentation','a pizza with carefully arranged presentation'],
 ['Gesamteindruck','Komposition','a visually unappealing pizza','a visually ordinary pizza','a visually appealing pizza','a visually outstanding pizza'],
 ['Bildschärfe','Foto','a completely blurry photograph of pizza','a slightly blurry photograph of pizza','a sharp photograph of pizza','a crisp detailed photograph of pizza'],
 ['Belichtung','Foto','an extremely dark or overexposed photograph of pizza','a poorly exposed photograph of pizza','a well exposed photograph of pizza','a perfectly balanced exposure in a pizza photograph'],
 ['Bildausschnitt','Foto','a photograph with most of the pizza cut off','a photograph with part of the pizza cut off','a photograph showing the complete pizza','a well framed photograph of the complete pizza'],
 ['Sicht auf Belag','Foto','a photograph of pizza with the toppings completely obscured','a photograph with much of the pizza obscured','a photograph with visible pizza toppings','a clear unobstructed overhead view of pizza toppings'],
 ['Farbwiedergabe','Foto','a pizza photograph with an extreme unnatural color cast','a pizza photograph with an unnatural color cast','a pizza photograph with natural looking colors','a pizza photograph with clear balanced natural colors']
];
const categories=rows.map((r,i)=>({id:'c'+String(i+1).padStart(2,'0'),name:r[0],group:r[1],prompts:r.slice(2).map(p=>'a photo of '+p.replace(/^a /,''))}));
const gate=['a photo of a pizza','a photo of pasta','a photo of a sandwich','a photo of a salad','a photo of a person','a photo of an empty plate','a photo of a landscape','an abstract drawing or graphic'];
const anchors=[.1,3.4,6.7,10];
const groups=['Rand','Backbild','Belag','Komposition','Foto'];
const disciplines=['Randstudie','Backbildstudie','Belagstudie','Kompositionsstudie','Fotostudie','Pizzaiolo-Perspektive','Foodstyling-Perspektive','Handwerk-Perspektive','Präsentations-Perspektive','Bildkritik-Perspektive'];
const lenses=['ausgewogen','streng','großzügig','Randfokus','Backfokus','Belagfokus','Kompositionsfokus','Fotofokus','detailorientiert','Gesamtbild'];
const round=v=>Math.round(Math.min(10,Math.max(.1,v))*10)/10;
function softmax(xs){if(!xs.length||xs.some(v=>!Number.isFinite(v)))throw Error('Ungültige Modellausgabe');const m=Math.max(...xs),e=xs.map(x=>Math.exp(x-m)),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s);}
function results(logits){if(logits.length!==100)throw Error('25 Kriterien erforderlich');return categories.map((c,i)=>{const p=softmax(logits.slice(i*4,i*4+4));return {id:c.id,score:round(p.reduce((sum,x,j)=>sum+x*anchors[j],0)),match:Math.max(...p),anchor:p.indexOf(Math.max(...p))};});}
function validateScores(xs){if(!Array.isArray(xs)||xs.length!==25)throw Error('25 Kriterien erforderlich');return xs.map((x,i)=>{if(x.id!==categories[i].id||!Number.isFinite(x.score)||x.score<.1||x.score>10||!Number.isFinite(x.match)||x.match<.25||x.match>1||!Number.isInteger(x.anchor)||x.anchor<0||x.anchor>3)throw Error('Ungültige Bewertung');return {id:x.id,score:round(x.score),match:x.match,anchor:x.anchor};});}
function profiles(scores){const values=validateScores(scores);return Array.from({length:100},(_,i)=>{const d=Math.floor(i/10),l=i%10;const focus=d%5,second=(d+2)%5;const strict=l===1?-.6:l===2?.4:0;const cells=values.map((v,j)=>{const group=Math.floor(j/5);let weight=1+(group===focus?1.5:0)+(d>=5&&group===second?.75:0);if(l>=3&&l<=7&&group===l-3)weight+=2;if(l===8)weight+=j%5===0?1:0;if(l===9&&j===19)weight+=5;return {id:v.id,score:round(v.score+strict),weight};});const total=cells.reduce((s,v)=>s+v.score*v.weight,0)/cells.reduce((s,v)=>s+v.weight,0);return {id:i+1,name:disciplines[d]+' · '+lenses[l],focus:groups[focus],adjustment:strict,score:round(total),cells};});}
function overall(scores){const p=profiles(scores);return round(p.reduce((s,x)=>s+x.score,0)/p.length);}
function stars(own){if(!Number.isFinite(own)||own<.1||own>10)throw Error('Eigene Bewertung zwischen 0,1 und 10,0 wählen');return Math.max(1,Math.min(5,Math.round(own/2)));}
function draft(r){stars(r.own);const top=r.scores?validateScores(r.scores).filter((x,i)=>i<20&&x.match>=.42&&x.score>=6.5).sort((a,b)=>b.score-a.score).slice(0,2):[];const visible=top.length?' Auf dem Foto fallen mir '+top.map(x=>categories.find(c=>c.id===x.id).name.toLowerCase()).join(' und ')+' positiv auf.':'';return 'Meine persönliche Bewertung: '+r.own.toFixed(1).replace('.',',')+' von 10 Punkten.'+visible+(r.notes?.trim()?' '+r.notes.trim():'');}
function maps(place){if(!place||!place.name||!Number.isFinite(place.lat)||!Number.isFinite(place.lng))throw Error('Bitte zuerst eine Pizzeria zuordnen');const u=new URL('https://www.google.com/maps/search/');u.searchParams.set('api','1');u.searchParams.set('query',place.name+' '+(place.address||'')+' '+place.lat+','+place.lng);return u.href;}
return {models,categories,gate,anchors,softmax,results,validateScores,profiles,overall,stars,draft,maps,round,method:'semantic-photo-v2.0'};
});
