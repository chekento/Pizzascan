const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../web/review-builder.js'),A=require('../web/analysis.js');
test('Photo scores and model fields never become restaurant experience',()=>{
 const r={own:7.8,notes:'Meine eigene Erfahrung.',scores:A.results(Array.from({length:100},(_,i)=>i%4===3?9:0)),overall:10,model:'clip32',photo:'data:image/jpeg;base64,x'};
 assert.equal(A.draft(r),'Meine persönliche Bewertung: 7,8 von 10 Punkten. Meine eigene Erfahrung.');
 assert.equal(R.generate(r),R.generate({own:7.8,notes:r.notes}));
 assert.doesNotMatch(R.generate(r),/Foto|KI|Rand|Belag|Service|sauber/i);
});
test('Only chosen observations are used, with balanced positive and negative options',()=>{
 const text=R.generate({selected:{food:'great',value:'expensive'}});
 assert.match(text,/sehr gut geschmeckt/);assert.match(text,/zu teuer/);assert.doesNotMatch(text,/Service|Ambiente|sauber/);
 assert.doesNotMatch(R.generate({selected:{food:'forged'}}),/geschmeckt/);
});
test('Visit mode excludes incompatible facts without deleting original selections',()=>{
 const selected={ambience:'cozy',delivery:'late',packaging:'damaged',service:'friendly'};
 const delivered=R.generate({mode:'delivery',selected});assert.match(delivered,/später als angekündigt/);assert.doesNotMatch(delivered,/Ambiente|bedient/);
 const dinein=R.generate({mode:'dinein',selected});assert.match(dinein,/gemütlich/);assert.doesNotMatch(dinein,/Lieferung|Verpackung/);assert.equal(selected.ambience,'cozy');
});
test('Adaptive detail replaces broad observation only when its parent is selected',()=>{
 const base={mode:'dinein',selected:{wait:'long'},details:{wait:'40'}};assert.match(R.generate(base),/ungefähr 40 Minuten/);assert.doesNotMatch(R.generate(base),/zu lang/);
 assert.doesNotMatch(R.generate({...base,selected:{wait:'quick'}}),/40 Minuten/);
});
test('Ratings remain user supplied; no implicit positive rating or invalid score',()=>{
 for(const own of [undefined,null,NaN,0,11,'8',Infinity])assert.equal(R.normalize({own}).own,null);
 assert.equal(R.normalize({own:.1}).own,.1);assert.equal(R.normalize({own:7.89}).own,7.9);
 assert.doesNotMatch(R.generate({}),/Punkten/);
});

const D=require('../web/draft-store.js');
const draftEntry=()=>({place:{placeId:'way-41',name:'Testrestaurant',lat:53.6,lng:10.2,address:'Teststraße 4'},state:R.normalize({mode:'dinein',own:7.8,notes:'Meine Erfahrung.',selected:{service:'friendly'}}),text:'Mein frei bearbeiteter Text.',manual:true,updatedAt:'2026-09-12T08:00:00Z'});
test('Draft export and restore preserve personal text and selections without photo fields',()=>{
 const input={...draftEntry(),photo:'private-photo',scores:[10],model:'clip32'};
 const exported=D.backup(input),restored=D.restore(JSON.parse(JSON.stringify(exported)));
 assert.equal(restored.text,input.text);assert.equal(restored.state.selected.service,'friendly');assert.equal(restored.state.own,7.8);assert.equal(restored.place.placeId,'way-41');assert.equal(JSON.stringify(exported).includes('private-photo'),false);assert.equal(Object.hasOwn(restored,'scores'),false);
});
test('Invalid draft files and unsafe restaurant keys are rejected before writeback',()=>{
 const valid=D.backup(draftEntry());assert.throws(()=>D.restore({...valid,version:2}));assert.throws(()=>D.restore({format:'photo-report'}));
 assert.throws(()=>D.restore({...valid,draft:{...valid.draft,state:{own:11}}}));
 assert.throws(()=>D.restore({...valid,draft:{...valid.draft,place:{...valid.draft.place,placeId:'__proto__'}}}));
 assert.throws(()=>D.restore({...valid,draft:{...valid.draft,place:{...valid.draft.place,lat:NaN}}}));
 assert.throws(()=>D.restore({...valid,draft:{...valid.draft,text:'x'.repeat(4001)}}));
});
test('Opening an empty editor is not a saved opinion; personal entries remain saved',()=>{
 assert.equal(D.hasContent({state:R.normalize(),text:R.generate({}),manual:false}),false);
 assert.equal(D.hasContent({state:R.normalize({mode:'delivery'}),text:R.generate({mode:'delivery'}),manual:false}),false);
 assert.equal(D.hasContent(draftEntry()),true);
 assert.equal(D.hasContent({...draftEntry(),state:R.normalize({selected:{ambience:'cozy'},mode:'delivery'}),manual:false}),true);
});
test('All 1500 characters of existing personal notes survive transfer to the builder',()=>{
 const notes='a'.repeat(1500);assert.equal(R.normalize({notes}).notes.length,1500);assert.equal(D.entry({...draftEntry(),state:R.normalize({notes})}).state.notes,notes);
});

test('Visit context is never assumed from a photo report or an unselected default',()=>{
 assert.equal(R.normalize({}).mode,'');assert.doesNotMatch(R.generate({own:7.8}),/vor Ort|abgeholt|geliefert|besucht/i);
 assert.equal(R.available('').some(a=>a.id==='ambience'),false);
 assert.match(R.generate({mode:'takeaway',own:7.8}),/abgeholt/);
});
