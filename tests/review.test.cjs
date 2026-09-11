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
 const base={selected:{wait:'long'},details:{wait:'40'}};assert.match(R.generate(base),/ungefähr 40 Minuten/);assert.doesNotMatch(R.generate(base),/zu lang/);
 assert.doesNotMatch(R.generate({...base,selected:{wait:'quick'}}),/40 Minuten/);
});
test('Ratings remain user supplied; no implicit positive rating or invalid score',()=>{
 for(const own of [undefined,null,NaN,0,11,'8',Infinity])assert.equal(R.normalize({own}).own,null);
 assert.equal(R.normalize({own:.1}).own,.1);assert.equal(R.normalize({own:7.89}).own,7.9);
 assert.doesNotMatch(R.generate({}),/Punkten/);
});
