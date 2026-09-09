(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PizzaCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const coords = (lat, lng) => typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const clip = (v, max = 500) => String(v ?? '').slice(0, max);
  function distance(a, b) {
    const rad = v => v * Math.PI / 180;
    const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, x)), Math.sqrt(Math.max(0, 1 - x)));
  }
  function website(value) {
    if (!value || /[\s<>"']/.test(value)) return '';
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return '';
    try { const u = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function place(value) {
    if (!value || typeof value !== 'object' || !coords(value.lat, value.lng) || typeof value.name !== 'string' || !value.name.trim()) throw new Error('Each place needs a name and valid numeric coordinates.');
    return {
      placeId: clip(value.placeId || `local-${value.lat}-${value.lng}`, 120), name: clip(value.name.trim(), 200),
      lat: value.lat, lng: value.lng, type: clip(value.type || 'other', 60),
      openingHours: clip(value.openingHours), website: website(value.website || ''), phone: clip(value.phone, 80),
      address: clip(value.address), cuisine: clip(value.cuisine),
      tags: Object.fromEntries(Object.entries(value.tags || {}).filter(([k,v]) => /^[a-zA-Z0-9_:.-]{1,60}$/.test(k) && typeof v === 'string').slice(0,90).map(([k,v])=>[k,clip(v,1000)])),
      country: /^[a-z]{2}$/i.test(value.country||'') ? value.country.toLowerCase() : '', state: clip(value.state,100),
      description: clip(value.description,1000), menu: website(value.menu||''),
      pizzaEvidence: ['confirmed','possible','search'].includes(value.pizzaEvidence) ? value.pizzaEvidence : 'confirmed',
      updatedAt: typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt)) ? value.updatedAt : '',
      detailsAt: typeof value.detailsAt === 'string' && Number.isFinite(Date.parse(value.detailsAt)) ? value.detailsAt : '',
      dataSource: clip(value.dataSource||'OpenStreetMap',100),
      addedAt: validDate(value.addedAt), visitedAt: validDate(value.visitedAt)
    };
  }
  function validDate(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : new Date().toISOString(); }
  function importPlaces(data) {
    if (!Array.isArray(data) || data.length > 5000) throw new Error('Choose a place-list JSON file with at most 5,000 entries.');
    const parsed = data.map(place); // Validate every entry before mutating storage.
    return [...new Map(parsed.map(p => [p.placeId, p])).values()];
  }
  function fromOverpass(elements) {
    if (!Array.isArray(elements)) throw new Error('The map service returned invalid data.');
    const found = [];
    for (const e of elements) {
      const t = e.tags || {}, lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
      if (!coords(lat, lng) || !e.tags || t.disused === 'yes' || t.abandoned === 'yes') continue;
      const cuisine = String(t.cuisine || '');
      if (!/pizza|pizzeria/i.test(cuisine + ' ' + (t.name || '') + ' ' + (t.vending || '') + ' ' + (t.speciality || '')) && t['vending:pizza'] !== 'yes') continue;
      const type = t.vending?.includes('pizza') || t['vending:pizza'] === 'yes' ? 'vending_pizza' : ['cafe','fast_food','food_truck'].includes(t.amenity) ? t.amenity : 'pizzeria';
      found.push(place({placeId: `${e.type}-${e.id}`, name: t.name || 'Unnamed pizza place', lat, lng, type, cuisine,
        openingHours: t.opening_hours || '', website: t.website || t['contact:website'], phone: t.phone || t['contact:phone'],
        address: [t['addr:street'],t['addr:housenumber'],t['addr:postcode'],t['addr:city']].filter(Boolean).join(' ')}));
    }
    return [...new Map(found.map(p => [p.placeId, p])).values()];
  }
  function ratingScore(r) {
    const restaurant = (r.ambiance * .3 + r.service * .3 + r.cleanliness * .2 + r.value * .2);
    const pizza = (r.crust * .3 + r.sauce * .2 + r.cheese * .2 + r.toppings * .2 + r.bake * .1);
    const weight = r.restaurantWeight / 100;
    return Math.round((restaurant * weight + pizza * (1 - weight)) * 20) / 10; // 0–10, not 0–25.
  }
  function crawl(start, places, stops) {
    const remaining = [...places], selected = [];
    let current = start;
    while (remaining.length && selected.length < stops) {
      remaining.sort((a,b) => distance(current,a) - distance(current,b));
      current = remaining.shift(); selected.push(current);
    }
    return selected;
  }
  function directions(stops, mode = 'walking', origin) {
    if (!stops.length || !stops.every(p => coords(p.lat,p.lng))) throw new Error('Choose a valid destination.');
    const modes = ['walking','bicycling','driving','transit'];
    if (!modes.includes(mode)) mode = 'walking';
    const u = new URL('https://www.google.com/maps/dir/');
    u.searchParams.set('api','1');
    const last = stops[stops.length - 1];
    u.searchParams.set('destination', `${last.lat},${last.lng}`);
    u.searchParams.set('travelmode', mode);
    if (origin && coords(origin.lat,origin.lng)) u.searchParams.set('origin', `${origin.lat},${origin.lng}`);
    if (stops.length > 1 && mode !== 'transit') u.searchParams.set('waypoints', stops.slice(0,-1).map(p=>`${p.lat},${p.lng}`).join('|'));
    return u.href;
  }
  return {esc,coords,distance,website,place,importPlaces,fromOverpass,ratingScore,crawl,directions};
});
