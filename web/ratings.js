/* Open location ratings. Read-only, keyless Mangrove API; no commercial review APIs. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.PizzaCore);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.PizzaRatings=api;
})(globalThis,function(C){
  'use strict';
  const ENDPOINT='https://api.mangrove.reviews/reviews';
  const CACHE_KEY='pizzascan-open-ratings-v1',TTL=15*60*1000,MAX_AGE=7*86400000;
  const PAGE_SIZE=500,MAX_PAGES=6,MAX_AREAS=8,RADIUS=6;
  const licenses={'CC-BY-4.0':'https://creativecommons.org/licenses/by/4.0/','CC-BY-SA-4.0':'https://creativecommons.org/licenses/by-sa/4.0/'};
  const nameKey=v=>String(v||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const osmId=v=>{const m=/^(?:https?:\/\/(?:www\.)?openstreetmap\.org\/)?(node|way|relation)[/-](\d+)(?:\/\d+)?$/.exec(String(v||''));return m?m[1]+'-'+m[2]:'';};
  function geo(subject){
    try{
      const u=new URL(subject);if(u.protocol!=='geo:')return null;
      const parts=u.pathname.split(';')[0].split(',');if(parts.length!==2||parts.some(x=>!x.trim()))return null;
      const lat=Number(parts[0]),lng=Number(parts[1]);if(!C.coords(lat,lng))return null;
      return {lat,lng,name:u.searchParams.get('q')||''};
    }catch{return null;}
  }
  function normalize(review,now=Date.now()){
    const p=review?.payload,m=p?.metadata||{};
    if(!p||!Number.isInteger(p.rating)||p.rating<0||p.rating>100)return null;
    if(p.action&&p.action!=='edit')return null;
    const sub=geo(p.sub)?p.sub:review.original_sub,position=geo(sub);
    const license=m.license||'CC-BY-4.0';
    // Do not import mirrored platform data or explicitly generated/affiliated ratings.
    if(!position||!licenses[license]||m.data_source||m.is_generated===true||m.is_affiliated===true)return null;
    if(!Number.isFinite(p.iat)||p.iat<1577836800||p.iat*1000>now+86400000)return null;
    if(!/^[A-Za-z0-9_-]{20,200}$/.test(review.signature||''))return null;
    const actor=typeof review.did==='string'&&review.did.startsWith('did:')?review.did:typeof review.kid==='string'?review.kid.replace(/\s/g,''):'';
    if(!actor||actor.length>1600)return null;
    const id=osmId(m.osm_id);
    if(!id&&!nameKey(position.name))return null;
    return {sub,signature:review.signature,actor,osmId:id,lat:position.lat,lng:position.lng,name:position.name.slice(0,200),rating:p.rating,iat:p.iat,license};
  }
  function validateCached(row,now){
    if(!row||typeof row.sub!=='string'||row.sub.length>1500)return null;
    return normalize({signature:row.signature,kid:row.actor,did:String(row.actor||'').startsWith('did:')?row.actor:undefined,payload:{sub:row.sub,rating:row.rating,iat:row.iat,metadata:{osm_id:row.osmId,license:row.license}}},now);
  }
  function matches(row,place,known){
    const distance=C.distance(row,place);
    if(row.osmId)return row.osmId===place.placeId&&distance<=.2;
    if(distance>.025||nameKey(row.name)!==nameKey(place.name))return false;
    // A coordinate/name guess must not attach one review to two nearby branches.
    return !known.some(other=>other.placeId!==place.placeId&&nameKey(other.name)===nameKey(row.name)&&C.distance(row,other)<=.025);
  }
  function aggregate(rows,place,known=[place]){
    const authors=new Map();
    for(const row of rows){
      if(!matches(row,place,known))continue;
      const old=authors.get(row.actor);
      if(!old||row.iat>old.iat||row.iat===old.iat&&row.signature>old.signature)authors.set(row.actor,row);
    }
    const selected=[...authors.values()];if(!selected.length)return {rating:null,count:0};
    // PizzaScan normalizes the public 0–100 score to the shared 0.1–10.0 app scale.
    // The published one-decimal value is also the value used by the slider.
    const raw=selected.reduce((sum,r)=>sum+r.rating,0)/selected.length/10;
    return {rating:Math.max(.1,Math.round((raw+Number.EPSILON)*10)/10),count:selected.length,
      license:selected.some(r=>r.license==='CC-BY-SA-4.0')?'CC-BY-SA-4.0':'CC-BY-4.0',
      latest:Math.max(...selected.map(r=>r.iat))*1000,subjects:[...new Set(selected.map(r=>r.sub))]};
  }
  function minimum(value){const n=Number(value);return Number.isFinite(n)?Math.round(Math.max(0,Math.min(10,n))*10)/10:0;}
  function passes(summary,threshold,includeUnknown=false){const min=minimum(threshold);return min===0||summary?.rating!=null&&summary.count>0&&summary.rating>=min||summary?.rating==null&&includeUnknown;}
  function sourceUrl(subject){return 'https://mangrove.reviews/search?'+new URLSearchParams({sub:subject});}
  function aborted(signal){if(signal?.aborted)throw new DOMException('Aborted','AbortError');}
  class Service{
    constructor(fetcher=globalThis.fetch?.bind(globalThis),storage=globalThis.localStorage,now=()=>Date.now()){
      this.fetcher=fetcher;this.storage=storage;this.now=now;this.areas=[];this.failures=[];this.blockedUntil=0;this.indexes=new WeakMap();
      try{
        const cache=JSON.parse(storage?.getItem(CACHE_KEY)||'null');
        if(cache?.version===1&&Array.isArray(cache.areas))for(const a of cache.areas.slice(0,MAX_AREAS)){
          if(!C.coords(a.lat,a.lng)||a.radius!==RADIUS||!Number.isFinite(a.time)||a.time>now()||now()-a.time>MAX_AGE||!Array.isArray(a.rows)||a.rows.length>PAGE_SIZE*MAX_PAGES)continue;
          this.areas.push({...a,rows:a.rows.map(r=>validateCached(r,now())).filter(Boolean)});
        }
      }catch{/* Storage is optional; a full cache must not break discovery. */}
    }
    areaFor(place,fresh=false){return this.areas.filter(a=>this.now()-a.time<=(fresh?TTL:MAX_AGE)&&C.distance(a,place)<=a.radius).sort((a,b)=>b.time-a.time)[0];}
    failureFor(place){return this.failures.find(a=>a.until>this.now()&&C.distance(a,place)<=a.radius);}
    get(place,known=[place]){
      const area=this.areaFor(place),failed=this.failureFor(place);
      if(!area)return {rating:null,count:0,status:failed?'error':'unloaded'};
      let index=this.indexes.get(area);
      if(!index){index=new Map();for(const row of area.rows){const key=row.osmId||'name:'+nameKey(row.name);if(!index.has(key))index.set(key,[]);index.get(key).push(row);}this.indexes.set(area,index);}
      const candidates=[...index.get(place.placeId)||[],...index.get('name:'+nameKey(place.name))||[]];
      const result=aggregate(candidates,place,known);
      return {...result,status:result.rating==null?'unrated':'rated',checkedAt:area.time,stale:this.now()-area.time>TTL,error:!!failed};
    }
    persist(){
      try{
        const stored=[];let length=0;
        for(const a of this.areas){const size=JSON.stringify(a).length;if(length+size>900000)continue;stored.push(a);length+=size;}
        this.storage?.setItem(CACHE_KEY,JSON.stringify({version:1,areas:stored}));
      }catch{/* Network results remain usable when local storage is full. */}
    }
    async request(url,signal){
      aborted(signal);const ctl=new AbortController(),cancel=()=>ctl.abort();signal?.addEventListener('abort',cancel,{once:true});
      const timeout=setTimeout(cancel,12000);
      try{
        const response=await this.fetcher(url,{signal:ctl.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',headers:{Accept:'application/json'}});
        if(!response.ok){
          if(response.status===429){const h=response.headers?.get('Retry-After');const seconds=/^\d+$/.test(h||'')?Number(h):(Date.parse(h)-this.now())/1000;this.blockedUntil=this.now()+Math.max(60000,Number.isFinite(seconds)?seconds*1000:300000);}
          throw Error('ratings-http-'+response.status);
        }
        const data=await response.json();aborted(signal);
        if(!Array.isArray(data?.reviews)||data.reviews.length>PAGE_SIZE)throw Error('ratings-invalid');
        return data.reviews;
      }finally{clearTimeout(timeout);signal?.removeEventListener('abort',cancel);}
    }
    async loadArea(center,signal){
      let rows=[];
      for(let page=0;page<MAX_PAGES;page++){
        const params=new URLSearchParams({sub:`geo:${center.lat},${center.lng}?u=${RADIUS*1000+250}`,limit:String(PAGE_SIZE),offset:String(page*PAGE_SIZE),latest_edits_only:'true',issuers:'false',maresi_subjects:'false',examples:'false'});
        const reviews=await this.request(ENDPOINT+'?'+params,signal);
        rows.push(...reviews.map(r=>normalize(r,this.now())).filter(Boolean));
        if(reviews.length<PAGE_SIZE){
          aborted(signal);
          const area={...center,radius:RADIUS,time:this.now(),rows};
          this.areas=[area,...this.areas.filter(a=>C.distance(a,center)>.01)].slice(0,MAX_AREAS);
          this.failures=this.failures.filter(a=>C.distance(a,center)>.01);this.persist();return;
        }
      }
      // An incomplete newest-first sample must never masquerade as a venue's average.
      throw Error('ratings-incomplete');
    }
    async load(list,{signal,force=false,onUpdate}={}){
      aborted(signal);
      let remaining=[...new Map(list.filter(p=>C.coords(p.lat,p.lng)).map(p=>[p.placeId,p])).values()].filter(p=>force||!this.areaFor(p,true));
      const errors=[];
      for(let i=0;remaining.length&&i<MAX_AREAS;i++){
        aborted(signal);
        const first=remaining[0],center={lat:Math.round(first.lat*1000)/1000,lng:Math.round(first.lng*1000)/1000};
        const blocked=this.now()<this.blockedUntil||!force&&this.failureFor(first);
        if(blocked){errors.push('ratings-unavailable');remaining=remaining.filter(p=>C.distance(center,p)>RADIUS);continue;}
        try{await this.loadArea(center,signal);}
        catch(e){
          aborted(signal);errors.push(e.message);
          this.failures=this.failures.filter(a=>a.until>this.now()).slice(-63);
          this.failures.push({...center,radius:RADIUS,until:Math.max(this.now()+60000,this.blockedUntil)});
        }
        remaining=remaining.filter(p=>C.distance(center,p)>RADIUS);onUpdate?.();
        if(this.now()<this.blockedUntil)break;
      }
      if(remaining.length)errors.push('ratings-area-limit');
      return {errors,complete:!errors.length};
    }
  }
  const scaleToTen=value=>Math.max(.1,Math.round(Math.max(0,Math.min(100,Number(value)||0))/10*10)/10);return {Service,aggregate,normalize,geo,osmId,matches,minimum,passes,scaleToTen,sourceUrl,licenses,ENDPOINT,CACHE_KEY,TTL};
});
