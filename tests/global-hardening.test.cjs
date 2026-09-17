const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../web/core.js');
const Places=require('../web/places.js');
const Poi=require('../web/poi-search.js');
const Global=require('../web/global-hardening.js');

const root={document:{documentElement:{lang:'es'}},PizzaScanGlobalFresh:true};
Global.hardenPlaces(Places,Core,root);
Global.hardenPoi(Poi,Core);

const memoryStorage=()=>{const data=new Map();return {get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
const responseFor=(name,lat,lng)=>({ok:true,json:async()=>({features:[{properties:{name,countrycode:'xx'},geometry:{coordinates:[lng,lat]}}]}),text:async()=>''});

test('Unicode normalization preserves worldwide scripts while folding Latin accents',()=>{
  assert.equal(Global.unicodeText('Café São Paulo'),'cafe sao paulo');
  assert.equal(Global.unicodeText('ピザ 東京'),'ピザ 東京');
  assert.equal(Global.unicodeText('Пицца Москва'),'пицца москва');
  assert.equal(Global.unicodeText('بيتزا القاهرة'),'بيتزا القاهرة');
  assert.equal(Global.unicodeText('披萨 北京'),'披萨 北京');
});

test('world coordinate matrix builds bounded OSM queries on every inhabited continent and near the dateline',()=>{
  const points=[
    ['Paris',48.8566,2.3522],['New York',40.7128,-74.006],['São Paulo',-23.5505,-46.6333],
    ['Nairobi',-1.2864,36.8172],['Tokyo',35.6762,139.6503],['Sydney',-33.8688,151.2093],['Suva',-18.1416,178.4419]
  ];
  for(const [name,lat,lng] of points){
    const q=Poi.buildQuery('Restaurant',{lat,lng},5);
    assert.ok(q,name+' must build a query');
    assert.ok(q.includes(`around:5000,${lat},${lng}`),name+' keeps its real hemisphere/longitude');
    assert.match(q,/out body center/);
  }
  assert.equal(Poi.buildQuery('Restaurant',{lat:95,lng:0},5),'');
  assert.equal(Poi.buildQuery('Restaurant',{lat:0,lng:181},5),'');
});

test('category and local-state intent works across the five UI languages',()=>{
  const categories=[['Restaurant','other'],['Restaurante','other'],['Ristorante','other'],['Café','cafe'],['Caffè','cafe'],['Comida rápida','fast_food'],['Restauration rapide','fast_food'],['Pizzeria','pizza']];
  for(const [query,expected] of categories)assert.ok(Poi.categoryIntent(query).includes(expected),query);
  assert.ok(Poi.stateIntent('Saved').includes('saved'));
  assert.ok(Poi.stateIntent('Salvati').includes('saved'));
  assert.ok(Poi.stateIntent('Guardados').includes('saved'));
  assert.ok(Poi.stateIntent('Favoris').includes('saved'));
  assert.ok(Poi.stateIntent('Mi ubicación').includes('location'));
  assert.ok(Poi.stateIntent('Mon emplacement').includes('location'));
});

test('native-script venue names remain searchable and rankable',()=>{
  const center={lat:35.6762,lng:139.6503},distance=Core.distance;
  const items=[
    {name:'ピッツェリア 東京',address:'東京都',kind:'venue',osmId:'node-1',lat:35.68,lng:139.65,place:{placeId:'node-1',name:'ピッツェリア 東京',address:'東京都',lat:35.68,lng:139.65,type:'pizzeria',pizzaEvidence:'confirmed'}},
    {name:'Пицца Москва',address:'Москва',kind:'venue',osmId:'node-2',lat:55.75,lng:37.61,place:{placeId:'node-2',name:'Пицца Москва',address:'Москва',lat:55.75,lng:37.61,type:'pizzeria',pizzaEvidence:'confirmed'}},
    {name:'بيتزا القاهرة',address:'القاهرة',kind:'venue',osmId:'node-3',lat:30.04,lng:31.23,place:{placeId:'node-3',name:'بيتزا القاهرة',address:'القاهرة',lat:30.04,lng:31.23,type:'pizzeria',pizzaEvidence:'confirmed'}},
    {name:'披萨 北京',address:'北京',kind:'venue',osmId:'node-4',lat:39.90,lng:116.40,place:{placeId:'node-4',name:'披萨 北京',address:'北京',lat:39.90,lng:116.40,type:'pizzeria',pizzaEvidence:'confirmed'}}
  ];
  for(const item of items){const ranked=Poi.mergeRanked([items],item.name,center,distance);assert.equal(ranked[0].osmId,item.osmId,item.name);}
});

test('global Photon lookup is unbiased before a location exists and localized after one is chosen',async()=>{
  let seen='';const storage=memoryStorage();
  const service=new Places.Service(async url=>{seen=String(url);return responseFor('東京',35.6762,139.6503);},storage);
  root.document.documentElement.lang='es';root.PizzaScanGlobalFresh=true;
  const globalItems=await service.photon('東京',null,{force:true});
  let url=new URL(seen);
  assert.equal(url.searchParams.get('q'),'東京');
  assert.equal(url.searchParams.has('lat'),false);
  assert.equal(url.searchParams.has('lon'),false);
  assert.equal(url.searchParams.has('lang'),false,'unsupported Photon UI language must not fall back to German');
  assert.equal(globalItems[0].name,'東京');

  seen='';root.document.documentElement.lang='en';root.PizzaScanGlobalFresh=false;
  const localService=new Places.Service(async request=>{seen=String(request);return responseFor('Tokyo',35.6762,139.6503);},memoryStorage());
  await localService.photon('Tokyo',{lat:35.6762,lng:139.6503},{force:true});
  url=new URL(seen);
  assert.equal(url.searchParams.get('lat'),'35.6762');
  assert.equal(url.searchParams.get('lon'),'139.6503');
  assert.equal(url.searchParams.get('lang'),'en');
});
