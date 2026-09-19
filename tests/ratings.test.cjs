const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../web/ratings.js');
const place={placeId:'node-1',name:'Pizza Uno',lat:53.55,lng:9.99};
const second={...place,placeId:'node-2',name:'Pizza Due',lat:53.5501};
const time=Date.parse('2026-09-13T12:00:00Z');
const review=(n,rating=90,metadata={},extra={})=>({signature:String(n).padStart(30,'a'),kid:'public-key-'+n,payload:{iat:Math.floor(time/1000)-100+n,sub:'geo:53.55,9.99?q=Pizza%20Uno&u=10',rating,metadata:{osm_id:'node/1/7',...metadata}},...extra});
const rows=list=>list.map(r=>R.normalize(r,time)).filter(Boolean);
const response=(reviews,status=200,headers={})=>({ok:status===200,status,headers:{get:key=>headers[key]},json:async()=>({reviews})});
const storage=()=>{const entries=new Map();return {getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)};};

test('Open source scores convert consistently to 0.1–10.0; zero is a valid 0.1/10 rating',()=>{
  assert.equal(R.aggregate(rows([review(1,0)]),place).rating,0.1);
  assert.equal(R.aggregate(rows([review(1,50)]),place).rating,5);
  const r=R.aggregate(rows([review(1,90),review(2,90)]),place);
  assert.equal(r.rating,9);assert.equal(r.count,2);
  assert.equal(R.aggregate(rows([review(1,100)]),place).rating,10);
  assert.equal(R.aggregate(rows([review(1,null)]),place).rating,null);
});
test('Only documented open licenses and original human ratings enter the aggregate',()=>{
  const invalid=[null,undefined,NaN,Infinity,-1,101,'90'];
  for(const value of invalid){const r=review(1);r.payload.rating=value;assert.equal(R.normalize(r,time),null);}
  for(const metadata of [{license:'all-rights-reserved'},{license:'CC-BY-NC-4.0'},{data_source:'https://www.google.com/maps'},{is_generated:true},{is_affiliated:true}])assert.equal(R.normalize(review(1,90,metadata),time),null);
  for(const action of ['delete','report_abuse','equivalence','identity'])assert.equal(R.normalize({...review(1),payload:{...review(1).payload,action}},time),null);
  assert.equal(R.aggregate(rows([review(1,90,{license:'CC-BY-SA-4.0'})]),place).license,'CC-BY-SA-4.0');
});
test('OSM ID and proximity prevent borrowing another branch’s rating',()=>{
  const data=rows([review(1,100)]);
  assert.equal(R.aggregate(data,second,[place,second]).count,0);
  assert.equal(R.aggregate(data,{...place,lat:54},[place]).count,0);
  assert.equal(R.osmId('https://www.openstreetmap.org/way/123'),'way-123');
  assert.equal(R.osmId('node/123/9'),'node-123');
  assert.equal(R.osmId('https://evil.test/node/123'),'');
});
test('Without an OSM ID, exact name and 25m proximity are required; ambiguous matches are excluded',()=>{
  const data=rows([review(1,90,{osm_id:undefined})]);
  assert.equal(R.aggregate(data,place,[place,second]).count,1);
  assert.equal(R.aggregate(data,{...place,name:'Pizza Uno Express'},[place]).count,0);
  assert.equal(R.aggregate(data,{...place,lat:53.551},[place]).count,0);
  const ambiguous={...second,name:place.name};
  assert.equal(R.aggregate(data,place,[place,ambiguous]).count,0);
});
test('Edits, repeated reviews and multiple keys for a DID count only the newest matched opinion',()=>{
  const a=review(1,20),b=review(2,90),c=review(3,100);
  b.kid=a.kid;c.did='did:plc:one';b.did='did:plc:one';a.did='did:plc:one';
  c.original_sub=c.payload.sub;c.payload.sub='urn:maresi:'+a.signature;c.payload.action='edit';
  const r=R.aggregate(rows([a,b,c,c]),place);
  assert.equal(r.count,1);assert.equal(r.rating,10);
});
test('4.6 boundary, fractional settings, disabled filter and unknown ratings are consistent',()=>{
  assert.equal(R.passes({rating:4.5,count:10},4.6),false);
  assert.equal(R.passes({rating:4.6,count:10},4.6),true);
  assert.equal(R.passes({rating:4.7,count:10},4.6),true);
  assert.equal(R.passes({rating:null,count:0},4.6),false);
  assert.equal(R.passes({rating:null,count:0},4.6,true),true);
  assert.equal(R.passes({rating:null,count:0},0),true);
  assert.equal(R.minimum('4.6'),4.6);assert.equal(R.minimum(Infinity),0);assert.equal(R.minimum(-1),0);assert.equal(R.minimum(8),8);assert.equal(R.minimum(12),10);
});
test('Area requests batch places, need no credentials, cache across restarts and strip review text',async()=>{
  let calls=0;const disk=storage();
  const service=new R.Service(async(url,options)=>{
    calls++;const u=new URL(url);assert.equal(u.origin,'https://api.mangrove.reviews');assert.equal(u.searchParams.get('limit'),'500');
    assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.ok(!('Authorization' in options.headers));
    const data=review(1);data.payload.opinion='This review text must not be cached';data.payload.metadata.nickname='Do not retain personal fields';
    return response([data]);
  },disk,()=>time);
  await service.load([place,second]);await service.load([place]);assert.equal(calls,1);assert.equal(service.get(place).rating,9);
  const raw=disk.getItem(R.CACHE_KEY);assert.ok(!raw.includes('This review text'));assert.ok(!raw.includes('Do not retain'));
  const restored=new R.Service(()=>assert.fail('fresh cache should prevent fetch'),disk,()=>time+1000);
  await restored.load([place]);assert.equal(restored.get(place).count,1);
});
test('Pagination reaches older reviews before publishing a complete average',async()=>{
  const first=Array.from({length:500},(_,n)=>review(n+1,100));let calls=0;
  const service=new R.Service(async url=>{calls++;const page=Number(new URL(url).searchParams.get('offset'));return response(page?Array.from({length:100},(_,n)=>review(n+600,0)):first);},storage(),()=>time+1000000);
  await service.load([place]);assert.equal(calls,2);assert.equal(service.get(place).count,600);assert.equal(service.get(place).rating,8.3);
});
test('Truncated, malformed and failing responses do not become fake zero-review successes',async()=>{
  const full=Array.from({length:500},(_,n)=>review(n+1));let calls=0;
  const service=new R.Service(async()=>{calls++;return response(full);},storage(),()=>time+1000000);
  const result=await service.load([place]);assert.equal(calls,6);assert.ok(result.errors.includes('ratings-incomplete'));assert.equal(service.get(place).status,'error');assert.equal(service.areas.length,0);
  const malformed=new R.Service(async()=>({ok:true,json:async()=>({reviews:null})}),storage(),()=>time);
  assert.equal((await malformed.load([place])).complete,false);assert.equal(malformed.get(place).status,'error');
});
test('Refresh replaces removed reviews, but an outage retains dated cached scores',async()=>{
  let now=time,state=0;
  const service=new R.Service(async()=>state===0?response([review(1)]):state===1?response([],503):response([]),storage(),()=>now);
  await service.load([place]);now+=R.TTL+1;state=1;
  await service.load([place]);assert.equal(service.get(place).rating,9);assert.equal(service.get(place).stale,true);assert.equal(service.get(place).error,true);
  state=2;await service.load([place],{force:true});assert.equal(service.get(place).rating,null);assert.equal(service.get(place).status,'unrated');
});
test('Cancellation cannot commit a late response, and HTTP 429 is respected even by manual refresh',async()=>{
  const ctl=new AbortController();const service=new R.Service(async()=>{ctl.abort();return response([review(1)]);},storage(),()=>time);
  await assert.rejects(service.load([place],{signal:ctl.signal}),{name:'AbortError'});assert.equal(service.areas.length,0);
  let calls=0;const limited=new R.Service(async()=>{calls++;return response([],429,{'Retry-After':'120'});},storage(),()=>time);
  await limited.load([place]);await limited.load([place],{force:true});assert.equal(calls,1);assert.equal(limited.get(place).status,'error');
});
test('Cache expiry and storage failures never block the map or resurrect ancient scores',async()=>{
  let now=time;
  const service=new R.Service(async()=>response([review(1)]),{getItem(){throw Error('blocked');},setItem(){throw Error('full');}},()=>now);
  await service.load([place]);assert.equal(service.get(place).rating,9);now+=8*86400000;assert.equal(service.get(place).rating,null);
});
