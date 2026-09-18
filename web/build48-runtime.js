/* PizzaScan Build 48: nearby-search recovery + compact map controls.
 * Keeps Build 47's targeted Pizza/Italian discovery contract, restores a practical
 * 5 km default for nearby searches, adds synchronous Photon recovery when every
 * Overpass provider is empty, and moves live search status above the map.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBuild48=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='2.3.13';
const BUILD=48;
const MIGRATION='pizzascan-build48-search-ui-v1';
const FINALIZED='pizzascan-build48-nearby-finalized-v1';
const DEFAULT_NEARBY_RADIUS=5;

function normalizedRadius(value){
  const n=Number(value);
  if(n===0)return DEFAULT_NEARBY_RADIUS;
  return [1,3,5,10].includes(n)?n:DEFAULT_NEARBY_RADIUS;
}

function migrate(root){
  if(root.PizzaBuild49||root.PizzaScanDiscovery49?.build>=49)return false;
  try{
    if(!root.localStorage||root.localStorage.getItem(MIGRATION))return false;
    if(typeof settings==='undefined'||!settings)return false;
    const before=Number(settings.filters?.radius);
    const next=normalizedRadius(before);
    const changed=before!==next;
    settings.filters={...(settings.filters||{}),radius:next,autoSearch:true};
    try{saveSettings();}catch{}
    for(const key of ['pizzascan-map-cache-v3','pizzascan-map-cache-v2'])root.localStorage.removeItem(key);
    try{if(typeof mapAreas!=='undefined')mapAreas=[];}catch{}
    root.localStorage.setItem(MIGRATION,'1');
    return changed;
  }catch(error){
    console.warn('Build48 migration skipped',error);
    return false;
  }
}

function finalizeNearbyDefault(root){
  if(root.PizzaBuild49||root.PizzaScanDiscovery49?.build>=49)return false;
  try{
    if(!root.localStorage||root.localStorage.getItem(FINALIZED)||typeof settings==='undefined'||!settings)return false;
    const current=Number(settings.filters?.radius);
    const next=normalizedRadius(current);
    const changed=current!==next;
    if(changed){
      settings.filters={...(settings.filters||{}),radius:next,autoSearch:true};
      try{saveSettings();}catch{}
    }
    root.localStorage.setItem(FINALIZED,'1');
    return changed;
  }catch(error){
    console.warn('Build48 nearby finalization skipped',error);
    return false;
  }
}

function syncVersion(root){
  if(root.PizzaBuild49||root.PizzaScanDiscovery49?.build>=49)return;
  try{
    const app=root.PizzaScan;
    if(app){
      const current=Object.getOwnPropertyDescriptor(app,'version');
      if(current?.configurable!==false){
        const get=()=>VERSION;
        get.__build48=true;
        Object.defineProperty(app,'version',{configurable:true,enumerable:true,get,set(){}});
      }
    }
  }catch{}
  try{
    const badge=root.document?.querySelector?.('.brand small');
    if(badge){
      if(badge.textContent!==VERSION)badge.textContent=VERSION;
      if(!badge.__build48Observer){
        badge.__build48Observer=true;
        new MutationObserver(()=>{if(root.PizzaBuild49||root.PizzaScanDiscovery49?.build>=49)return;if(badge.textContent!==VERSION)badge.textContent=VERSION;})
          .observe(badge,{childList:true,characterData:true,subtree:true});
      }
    }
  }catch{}
  try{
    const release=root.PizzaReleaseInfo;
    if(release?.RELEASE)Object.assign(release.RELEASE,{
      version:VERSION,
      build:BUILD,
      apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.13.apk'
    });
    release?.syncVersion?.();
    release?.decorate?.();
  }catch{}
}

function installStyles(root){
  const d=root.document;
  if(!d||d.getElementById('build48-ui'))return;
  const style=d.createElement('style');
  style.id='build48-ui';
  style.textContent=`
    #map-view .map-control-panel{
      margin:10px 0 8px!important;
      padding:10px!important;
      border:1px solid var(--line)!important;
      border-radius:20px!important;
      background:var(--surface)!important;
      box-shadow:0 10px 30px #27271f0a!important;
    }
    #map-view .map-control-panel .map-filters{
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:8px!important;
      margin:0!important;
      align-items:stretch!important;
    }
    #map-view .map-control-panel .map-filters .filter-chip{
      min-width:0!important;
      width:100%!important;
      min-height:42px!important;
      height:auto!important;
      padding:7px 9px!important;
      border-radius:13px!important;
      border:1px solid var(--line)!important;
      background:var(--bg)!important;
      color:var(--ink)!important;
      font-size:11px!important;
      font-weight:750!important;
      line-height:1.2!important;
      white-space:normal!important;
      text-align:center!important;
      box-shadow:none!important;
    }
    #map-view .map-control-panel .map-filters .filter-chip.active{
      border-color:var(--green)!important;
      background:#e1f1e4!important;
      color:#246939!important;
    }
    #map-view .map-control-panel #radar-open{
      background:var(--tint)!important;
      color:var(--accent)!important;
      border-color:#efc9ba!important;
    }
    #map-view .map-control-meta{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      min-height:32px!important;
      margin-top:8px!important;
      padding:7px 10px!important;
      border-radius:11px!important;
      background:var(--bg)!important;
      border:1px solid var(--line)!important;
    }
    #map-view .map-control-meta #result-count{
      margin:0!important;
      color:var(--muted)!important;
      font-size:11px!important;
      font-weight:700!important;
      letter-spacing:.01em!important;
    }
    #map-view .map-control-panel .build44-cache-note{
      margin:7px 3px 0!important;
      padding:0!important;
      font-size:10px!important;
      line-height:1.35!important;
      opacity:.72!important;
    }
    #map-view .map-caption{
      display:flex!important;
      align-items:center!important;
      justify-content:space-between!important;
      gap:10px!important;
      min-height:48px!important;
      margin:8px 0 10px!important;
      padding:8px 9px 8px 12px!important;
      border:1px solid var(--line)!important;
      border-radius:15px!important;
      background:var(--surface)!important;
      box-shadow:0 6px 20px #27271f08!important;
    }
    #map-view .map-caption::before{
      content:''!important;
      display:block!important;
      width:8px!important;
      height:8px!important;
      flex:0 0 8px!important;
      border-radius:999px!important;
      background:var(--green)!important;
      box-shadow:0 0 0 4px #39715522!important;
    }
    #map-view .map-caption #map-status{
      flex:1 1 auto!important;
      min-width:0!important;
      padding:0!important;
      color:var(--muted)!important;
      font-size:11px!important;
      line-height:1.3!important;
      white-space:normal!important;
      overflow:visible!important;
      text-overflow:clip!important;
      overflow-wrap:anywhere!important;
    }
    #map-view .map-caption #map-refresh{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      flex:0 0 auto!important;
      min-width:92px!important;
      min-height:38px!important;
      height:38px!important;
      margin:0!important;
      padding:0 13px!important;
      border:0!important;
      border-radius:11px!important;
      background:var(--ink)!important;
      color:var(--bg)!important;
      font-size:11px!important;
      font-weight:800!important;
      white-space:nowrap!important;
      box-shadow:none!important;
    }
    #map-view #map-frame{margin-top:0!important}
    .dark #map-view .map-control-panel .map-filters .filter-chip.active{
      background:#274a31!important;
      color:#d3f7d9!important;
    }
    @media(max-width:520px){
      #map-view .map-control-panel .map-filters{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
      }
      #map-view .map-control-panel .map-filters .filter-chip{
        min-height:44px!important;
        font-size:11px!important;
      }
    }
    @media(max-width:360px){
      #map-view .map-caption{gap:8px!important;padding-left:10px!important}
      #map-view .map-caption #map-refresh{min-width:84px!important;padding:0 10px!important}
    }
  `;
  d.head.appendChild(style);
}

function upgradeUi(root){
  if(root.PizzaBuild49||root.PizzaScanDiscovery49?.build>=49)return;
  const d=root.document;
  if(!d)return;
  installStyles(root);

  const filters=d.querySelector('.map-filters');
  const frame=d.getElementById('map-frame');
  const caption=d.querySelector('.map-caption');
  const refresh=d.getElementById('map-refresh');
  const count=d.getElementById('result-count');

  if(filters){
    let panel=d.querySelector('.map-control-panel');
    if(!panel){
      panel=d.createElement('div');
      panel.className='map-control-panel';
      filters.parentNode?.insertBefore(panel,filters);
    }
    if(filters.parentElement!==panel)panel.appendChild(filters);

    let meta=panel.querySelector('.map-control-meta');
    if(!meta){
      meta=d.createElement('div');
      meta.className='map-control-meta';
      panel.appendChild(meta);
    }
    if(count&&count.parentElement!==meta)meta.appendChild(count);

    const note=d.querySelector('.build44-cache-note');
    if(note&&note.parentElement!==panel)panel.appendChild(note);
  }

  if(caption&&frame&&caption.parentElement===frame.parentElement&&caption.nextElementSibling!==frame){
    frame.parentElement.insertBefore(caption,frame);
  }
  if(refresh&&caption&&refresh.parentElement!==caption){
    caption.appendChild(refresh);
  }
  if(refresh){
    refresh.classList.remove('filter-chip','build44-action');
    refresh.classList.add('map-status-action');
    refresh.textContent='Hier suchen';
    refresh.title='Pizza-Orte rund um die Kartenmitte neu suchen';
    delete refresh.dataset.build44Moved;
  }

  const legend=d.querySelector('.map-legend p strong');
  if(legend&&/^Build\s+\d+/i.test(legend.textContent||'')){
    legend.parentElement.innerHTML='<strong>Build 48:</strong> Die gezielte Pizza-/Italien-Suche nutzt standardmäßig wieder einen praktischen 5-km-Nahbereich. Mehrere OSM-Spiegel bleiben aktiv; wenn alle gezielten Overpass-Antworten leer sind, versucht PizzaScan zusätzlich eine sichere Photon-Namenssuche nach Pizza/Pizzeria/Ristorante/Trattoria/Osteria.';
  }
}

async function photonFallback(root,service,query,options={}){
  const B=root.PizzaBuild47;
  const PD=root.PizzaPlaces;
  const Core=root.PizzaCore;
  if(!B||!PD||typeof service?.photon!=='function'||typeof PD.photonElement!=='function')return [];
  const info=B.queryAreaInfo?.(query);
  if(!info?.center)return [];
  const terms=B.SUPPLEMENT_TERMS||['pizza','pizzeria','ristorante','trattoria','osteria','italian restaurant'];
  options.onStatus?.('Keine OSM-Treffer · sichere Namenssuche wird geprüft …');

  const batches=await Promise.allSettled(terms.map(async term=>{
    const items=await service.photon(term,info.center,{signal:options.signal});
    const out=[];
    for(const item of items||[]){
      if(options.signal?.aborted)break;
      const name=item?.name||item?.place?.name||'';
      if(!B.nameMatches?.(term,name))continue;
      const element=PD.photonElement(item,term);
      if(!element)continue;
      const lat=element.lat??element.center?.lat;
      const lng=element.lon??element.center?.lon;
      if(!B.inside?.(info,{lat:Number(lat),lng:Number(lng)},Core))continue;
      out.push({...element,tags:{...(element.tags||{}),[B.HIT]:'yes','pizzascan:source':'photon-name'}});
    }
    return out;
  }));

  const unique=new Map();
  for(const result of batches){
    if(result.status!=='fulfilled')continue;
    for(const element of result.value||[]){
      const key=`${element.type||'node'}-${element.id||''}-${element.lat??element.center?.lat}-${element.lon??element.center?.lon}`;
      if(!unique.has(key))unique.set(key,element);
    }
  }
  return [...unique.values()];
}

function installRecovery(root){
  if(root.PizzaBuild49||root.PizzaScanDiscovery49?.build>=49)return false;
  let service=null;
  try{service=typeof placeService!=='undefined'?placeService:root.placeService;}catch{}
  if(!service||typeof service.overpass!=='function'||service.overpass.__build48)return false;
  const previous=service.overpass.bind(service);
  service.overpass=async function(query,options={}){
    const result=await previous(query,options);
    if(!String(query||'').includes('pizzascan-build47-websim-complete'))return result;
    if(Array.isArray(result?.data?.elements)&&result.data.elements.length)return result;
    if(options.signal?.aborted)return result;
    try{
      const elements=await photonFallback(root,this,query,options);
      if(elements.length){
        options.onStatus?.(`${elements.length} passende Orte über OSM-Namenssuche gefunden …`);
        return {
          data:{elements},
          source:'OpenStreetMap · Photon',
          sources:['photon.komoot.io'],
          progressive:false,
          complete:true,
          recovery:'build48-photon'
        };
      }
    }catch(error){
      if(!options.signal?.aborted)console.warn('Build48 Photon recovery skipped',error);
    }
    return result;
  };
  service.overpass.__build48=true;
  service.overpass.__inner=previous;
  return true;
}

function install(root){
  if(!root.document)return false;

  let tries=0,needsRefresh=false;
  const ready=()=>{
    tries++;
    if(migrate(root))needsRefresh=true;
    syncVersion(root);
    upgradeUi(root);
    installRecovery(root);

    let mapReady=false;
    try{mapReady=typeof map!=='undefined'&&!!map&&typeof loadPlaces==='function';}catch{}
    if(mapReady&&finalizeNearbyDefault(root))needsRefresh=true;
    if(needsRefresh&&mapReady){
      needsRefresh=false;
      try{
        if(typeof mapAreas!=='undefined')mapAreas=[];
        if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=[];
      }catch{}
      root.setTimeout(()=>{
        try{loadPlaces({force:true});}catch{}
      },120);
    }

    if((typeof settings==='undefined'||!mapReady)&&tries<120){
      root.setTimeout(ready,50);
    }
  };
  ready();

  [0,120,350,900,1800,3500].forEach(ms=>root.setTimeout(()=>{
    syncVersion(root);
    upgradeUi(root);
    installRecovery(root);
  },ms));

  root.PizzaScanDiscovery48={
    version:VERSION,
    build:BUILD,
    mode:'nearby-recovery-and-control-redesign',
    defaultNearbyRadiusKm:DEFAULT_NEARBY_RADIUS,
    emptyOverpassPhotonRecovery:true,
    statusAboveMap:true,
    compactControlPanel:true
  };
  return true;
}

return {
  VERSION,BUILD,MIGRATION,FINALIZED,DEFAULT_NEARBY_RADIUS,
  normalizedRadius,migrate,finalizeNearbyDefault,syncVersion,upgradeUi,photonFallback,installRecovery,install
};
});
